"use client"

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/context/DataContext';
import { LedgerLine, LedgerHeader, BillSundry, TaxSummaryRow } from '@/modules/ledger/types';
import { calculateLedgerTotals, calculateLineAmount } from '@/modules/ledger/ledger-engine';
import { handleGridKeyDown, focusCell } from '@/modules/ledger/grid-navigation';
import { useGlobalKeyboardShortcuts } from '@/modules/ledger/keyboard-handler';
import { toast } from 'sonner';
import { EntityLookup } from '@/components/shared/EntityLookup';
import { cn } from '@/lib/utils';
import { X, QrCode, Calculator, Save, LogOut, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PurchaseLedgerEntry() {
  const router = useRouter();
  const { inventory, contacts, processInward, addItem, gstConfigs } = useData();
  const [isTaxApplied, setIsTaxApplied] = useState(true);
  const [pendingTempItems, setPendingTempItems] = useState<any[]>([]);

  const [header, setHeader] = useState<LedgerHeader>({
    series: 'Main',
    date: new Date().toISOString().split('T')[0],
    voucherNumber: `PUR/26-27/${Math.floor(1000 + Math.random() * 9000)}`,
    type: 'Purchase',
    gstType: 'LGST 18% (Registered)',
    partyAccount: '',
    materialCentre: 'Main Godown (Warehouse A)',
    narration: '',
    itcEligibility: 'Input Goods/Services',
    supplierReference: ''
  });

  const [lines, setLines] = useState<LedgerLine[]>([
    { id: '1', sno: 1, description: '', qty: 0, unit: '', price: 0, amount: 0, gstRate: 18, isLocked: false, serials: [], ticketId: '' }
  ]);

  const [sundries, setSundries] = useState<BillSundry[]>([
    { id: 'S1', name: 'Freight & Forwarding', percentage: 0, amount: 0 },
    { id: 'S2', name: 'Rounding Off (+/-)', percentage: 0, amount: 0 }
  ]);

  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [showSerialModal, setShowSerialModal] = useState(false);

  const {
    totalQty,
    taxableAmount,
    taxSummaries,
    sundryTotal,
    grandTotal
  } = useMemo(() => calculateLedgerTotals(lines, sundries, isTaxApplied, header.gstType), [lines, sundries, isTaxApplied, header.gstType]);

  const ensureMinimumRows = useCallback((currentLines: LedgerLine[]) => {
    const minRows = 12;
    if (currentLines.length < minRows) {
      const pad = Array.from({ length: minRows - currentLines.length }).map((_, i) => ({
        id: `empty-${Date.now()}-${i}`,
        sno: currentLines.length + i + 1,
        description: '',
        qty: 0,
        unit: '',
        price: 0,
        amount: 0,
        gstRate: 0,
        isLocked: false,
        ticketId: ''
      }));
      return [...currentLines, ...pad];
    }
    return currentLines;
  }, []);

  useEffect(() => {
    setLines(prev => ensureMinimumRows(prev));
  }, [ensureMinimumRows]);

  const updateLine = (index: number, field: keyof LedgerLine, value: any) => {
    setLines(prev => {
      const newLines = [...prev];
      const line = { ...newLines[index], [field]: value };

      if (field === 'qty' || field === 'price' || field === 'gstRate') {
        line.amount = calculateLineAmount(Number(line.qty) || 0, Number(line.price) || 0);
      } else if (field === 'description' && typeof value === 'object') {
        // SSOT Entity Selection
        const item = value;
        line.productId = item.id;
        line.description = item.name;
        line.price = item.purchase_price || 0;
        line.unit = (item.unit || 'NOS.').toUpperCase();
        line.gstRate = item.gst_rate || 0;
        line.isLocked = true; // Mark as master-derived
        line.amount = calculateLineAmount(Number(line.qty) || 0, Number(line.price) || 0);
        
        // Auto-open serial modal if item is serialized and qty > 0
        if (item.is_serialized && line.qty > 0) {
          setActiveRowIndex(index);
          setShowSerialModal(true);
        }
      } else if (field === 'description' && typeof value === 'string') {
        line.description = value;
        // If user manually types, clear the derived ID to allow free-entry
        if (line.productId) {
          line.productId = undefined;
          line.isLocked = false;
        }
      } else if (field === 'ticketId' && typeof value === 'object') {
        line.ticketId = value.id;
      }

      newLines[index] = line;
      return newLines;
    });
  };


  const addRow = useCallback(() => {
    setLines(prev => {
      const lastSno = prev.length > 0 ? prev[prev.length - 1].sno : 0;
      return [...prev, {
        id: `row-${Date.now()}`,
        sno: lastSno + 1,
        description: '',
        qty: 0,
        unit: '',
        price: 0,
        amount: 0,
        gstRate: 18,
        isLocked: false,
        serials: [],
        ticketId: ''
      }];
    });
  }, []);

  const executeCommit = useCallback(async (commitLines: any[]) => {
    try {
      const payload = {
        vendor: header.partyAccount,
        date: header.date,
        reference: header.supplierReference || header.voucherNumber,
        warehouse: header.materialCentre,
        invoiceNumber: header.supplierReference || header.voucherNumber
      };

      const mappedLines = commitLines.map(l => {
        const masterItem = inventory.find(i => i.id === l.productId);
        return {
          id: `entry_line_${Date.now()}_${l.sno}`,
          productId: l.productId,
          name: l.description,
          brand: masterItem?.brand || 'N/A',
          model: masterItem?.model || 'N/A',
          qty: Number(l.qty),
          price: Number(l.price),
          gstRate: l.gstRate || 0,
          isSerialized: masterItem?.is_serialized || (l.serials && l.serials.length > 0),
          serials: (l.serials || []).map((s: any) => typeof s === 'string' ? s : s.serial),
          isLocked: false,
          ticket_id: l.ticketId
        };
      });

      await toast.promise(processInward(payload, mappedLines), {
        loading: 'COMMITTING_VOUCHER_TO_LEDGER...',
        success: 'LEDGER_ENTRY_RECORDED_SUCCESSFULLY',
        error: (err) => `HARD_FAIL: ${err.message || 'SAVE_FAILED'}`
      });

      router.push('/purchase');
    } catch (e: any) {
      console.error(e);
    }
  }, [header, processInward, inventory, router]);

  const handleSave = useCallback(async () => {
    const validLines = lines.filter(l => l.description.trim() !== '' && l.qty > 0);
    if (validLines.length === 0) {
      toast.error('Add at least one valid item line to save.');
      return;
    }
    if (!header.partyAccount) {
      toast.error('Party account name is required.');
      return;
    }

    // Strict Validation
    const sessionSerials = new Set<string>();
    for (const l of validLines) {
      if (l.qty <= 0) return toast.error(`Invalid quantity for line ${l.sno}`);
      if (l.price < 0) return toast.error(`Invalid price for line ${l.sno}`);
      if (!l.ticketId) return toast.error(`Ticket ID missing for line ${l.sno} (Ledger Integrity Rule)`);
      
      const masterItem = inventory.find(i => i.id === l.productId);
      const isSerialized = masterItem?.is_serialized || (l.serials && l.serials.length > 0);

      if (isSerialized) {
        if (!l.serials || l.serials.length !== l.qty) {
          return toast.error(`Serial mismatch for ${l.description}. Need ${l.qty}, got ${l.serials?.length || 0}`);
        }
        for (const s of l.serials) {
          if (sessionSerials.has(s as string)) return toast.error(`Duplicate serial in session: ${s}`);
          sessionSerials.add(s as string);
        }
      }
    }

    await executeCommit(validLines);
  }, [lines, header, inventory, executeCommit]);




  const toggleTax = useCallback(() => {
    setIsTaxApplied((prev: boolean) => !prev);
    toast.info(isTaxApplied ? "Tax Applied Removed" : "Tax Applied Successfully");
  }, [isTaxApplied]);

  const handleQuit = useCallback(() => {
    router.push('/purchase');
  }, [router]);

  useGlobalKeyboardShortcuts({
    onSave: handleSave,
    onApplyTax: toggleTax,
    onQuit: handleQuit
  });

  return (
    <div className="min-h-screen bg-[var(--color-ledger-purchase)] text-black font-sans uppercase flex flex-col h-screen overflow-hidden">

      {/* TOP HEADER */}
      <div className="flex justify-between items-end border-b-2 border-[var(--color-ledger-border)] p-4 shrink-0 bg-white/50">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-black tracking-tighter italic">THE DIGITAL LEDGER</h1>
          <div className="flex items-center">
            <span className="text-xl font-black bg-white px-4 py-1 border border-gray-300 shadow-sm italic uppercase tracking-tighter">PURCHASE VOUCHER</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-black px-3 py-1.5 border border-blue-200 ml-2 tracking-widest italic">TRANSACTION: GST_INWARD</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black tracking-widest text-gray-500 uppercase italic">VOUCHER_ID</div>
          <div className="text-2xl font-black tracking-tight italic">{header.voucherNumber}</div>
        </div>
      </div>

      {/* HEADER FORM */}
      <div className="shrink-0 bg-white/30 border-b-2 border-[var(--color-ledger-border)]">
        <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[var(--color-ledger-border)]">
          <div className="col-span-12 md:col-span-2 border-r border-[var(--color-ledger-border)] p-2">
            <label className="block text-[9px] font-black text-gray-500 italic tracking-widest">SERIES</label>
            <input
              value={header.series}
              onChange={e => setHeader({ ...header, series: e.target.value })}
              className="w-full bg-transparent outline-none font-black text-sm border-b border-gray-300 focus:border-blue-500 py-1"
            />
          </div>
          <div className="col-span-12 md:col-span-2 border-r border-[var(--color-ledger-border)] p-2">
            <label className="block text-[9px] font-black text-gray-500 italic tracking-widest">DATE (DAY)</label>
            <div className="flex items-center gap-2 border-b border-gray-300 focus-within:border-blue-500 py-1">
              <input
                type="date"
                value={header.date}
                onChange={e => setHeader({ ...header, date: e.target.value })}
                className="bg-transparent outline-none font-black text-sm w-full"
              />
            </div>
          </div>
          <div className="col-span-12 md:col-span-3 border-r border-[var(--color-ledger-border)] p-2">
            <label className="block text-[9px] font-black text-gray-500 italic tracking-widest">SUPPLIER REF. / INV NO.</label>
            <input
              value={header.supplierReference}
              onChange={e => setHeader({ ...header, supplierReference: e.target.value })}
              placeholder="e.g. INV-2023-100"
              className="w-full bg-transparent outline-none font-black text-blue-700 text-sm border-b border-gray-300 focus:border-blue-500 py-1 italic"
            />
          </div>
          <div className="col-span-12 md:col-span-3 border-r border-[var(--color-ledger-border)] p-2">
            <label className="block text-[9px] font-black text-gray-500 italic tracking-widest">PURCHASE TYPE</label>
            <select
              value={header.gstType}
              onChange={e => setHeader({ ...header, gstType: e.target.value })}
              className="w-full bg-transparent outline-none font-black text-sm border-b border-gray-300 focus:border-blue-500 py-1 italic"
            >
              <option>LGST 18% (Registered)</option>
              <option>IGST 18% (Interstate)</option>
              <option>Exempt</option>
            </select>
          </div>
          <div className="col-span-12 md:col-span-2 p-2 flex items-end justify-end gap-2">
            <button className="text-[9px] font-black tracking-widest border border-gray-300 bg-white px-4 py-1.5 hover:bg-gray-50 shadow-sm italic uppercase">VCH_IMAGE</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[var(--color-ledger-border)]">
          <div className="col-span-12 md:col-span-8 border-r border-[var(--color-ledger-border)] p-2">
            <div className="flex justify-between items-end mb-1">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] italic">VENDOR_ACCOUNT (PARTY_LEDGER)</label>
              {header.partyAccount && (
                <div className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 italic">
                  BALANCE: ₹{contacts.find((v: any) => v.name === header.partyAccount) ? "24,500.00 CR" : "0.00"}
                </div>
              )}
            </div>
            <EntityLookup
              type="contact"
              contactFilter="VENDOR"
              value={header.partyAccount}
              onChange={val => setHeader({ ...header, partyAccount: val })}
              onSelect={vendor => {
                setHeader(prev => ({
                  ...header,
                  partyAccount: vendor.name,
                }));
              }}
              placeholder="Select Ledger (Press Space)"
              className="w-full bg-transparent outline-none font-black text-blue-700 text-base border-b border-gray-300 focus:border-blue-500 py-1 placeholder:text-gray-300 placeholder:italic"
            />
          </div>

          <div className="col-span-12 md:col-span-4 p-2">
            <label className="block text-[9px] font-black text-gray-500 italic tracking-widest">MATERIAL CENTRE / HUB</label>
            <input
              value={header.materialCentre}
              onChange={e => setHeader({ ...header, materialCentre: e.target.value })}
              className="w-full bg-transparent outline-none font-black text-sm border-b border-gray-300 focus:border-blue-500 py-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="col-span-12 md:col-span-4 border-r border-[var(--color-ledger-border)] p-2">
            <label className="block text-[9px] font-black text-gray-500 italic tracking-widest">ITC ELIGIBILITY</label>
            <select
              value={header.itcEligibility}
              onChange={e => setHeader({ ...header, itcEligibility: e.target.value })}
              className="w-full bg-transparent outline-none font-black text-sm border-b border-gray-300 focus:border-blue-500 py-1 italic"
            >
              <option>Input Goods/Services</option>
              <option>Capital Goods</option>
              <option>Ineligible</option>
            </select>
          </div>
          <div className="col-span-12 md:col-span-8 p-2">
            <label className="block text-[9px] font-black text-gray-500 italic tracking-widest">NARRATION / AUDIT_NOTES</label>
            <input
              value={header.narration}
              onChange={e => setHeader({ ...header, narration: e.target.value })}
              placeholder="Being goods purchased vide Bill No..."
              className="w-full bg-transparent outline-none font-black text-sm border-b border-gray-300 focus:border-blue-500 py-1 italic text-gray-600 placeholder:text-gray-300"
            />
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 overflow-auto bg-white border-b-2 border-[var(--color-ledger-border)] relative input-grid-container">
        <table className="w-full text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-[#1E293B] text-white sticky top-0 z-10 font-black text-[9px] tracking-widest shadow-sm uppercase italic">
            <tr>
              <th className="border-r border-[#334155] px-2 py-2 text-center w-12">S.N.</th>
              <th className="border-r border-[#334155] px-4 py-2 text-left">ITEM_DESCRIPTION</th>
              <th className="border-r border-[#334155] px-2 py-2 text-right w-20">QTY.</th>
              <th className="border-r border-[#334155] px-2 py-2 text-left w-48">SERIALS</th>
              <th className="border-r border-[#334155] px-2 py-2 text-center w-16">UNIT</th>
              <th className="border-r border-[#334155] px-2 py-2 text-right w-28">PRICE (₹)</th>
              <th className="border-r border-[#334155] px-2 py-2 text-right w-20">GST%</th>
              <th className="px-4 py-2 text-right w-36">AMOUNT (₹)</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, rowIndex) => (
              <tr key={line.id} className="border-b border-gray-100 hover:bg-blue-50/30 group transition-colors">
                <td className="border-r border-gray-100 px-2 py-1 text-center font-black text-gray-300 text-[10px] italic">
                  {line.description || line.qty > 0 ? (
                    <span className={line.qty > 0 ? "text-primary" : ""}>{line.sno}.</span>
                  ) : rowIndex + 1}
                </td>
                <td className="border-r border-gray-100 px-2 py-1 relative">
                  <div className="flex justify-between items-center">
                    <EntityLookup
                      type="item"
                      value={line.description}
                      onChange={(val) => updateLine(rowIndex, 'description', val)}
                      onSelect={(item) => updateLine(rowIndex, 'description', item)}
                      onKeyDown={(e) => handleGridKeyDown(e, rowIndex, 1, lines.length, 6, addRow)}
                      data-row={rowIndex}
                      data-col={1}
                      placeholder={rowIndex === 0 && !line.description ? "SEARCH PRODUCT..." : ""}
                      className="w-full bg-transparent outline-none font-black text-sm focus:bg-blue-50 px-1"
                    />
                    {line.productId && (
                      <span className="absolute -top-1 right-1 text-[7px] font-black bg-gray-800 text-white px-1.5 py-0.5 rounded italic tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        STOCK: {inventory.find(i => i.id === line.productId)?.total_qty || 0}
                      </span>
                    )}
                  </div>
                </td>

                <td className="border-r border-gray-100 px-2 py-1">
                  <input
                    type="number"
                    value={line.qty || ''}
                    onChange={(e) => updateLine(rowIndex, 'qty', e.target.value)}
                    onKeyDown={(e) => handleGridKeyDown(e, rowIndex, 2, lines.length, 6, addRow)}
                    data-row={rowIndex}
                    data-col={2}
                    className="w-full bg-transparent outline-none font-black text-sm text-right focus:bg-blue-50 px-1 italic"
                  />
                </td>
                <td className="border-r border-gray-100 px-2 py-1">
                  <input
                    type="text"
                    value={line.serials?.join(',') || ''}
                    onChange={(e) => updateLine(rowIndex, 'serials', e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''))}
                    onKeyDown={(e) => handleGridKeyDown(e, rowIndex, 3, lines.length, 6, addRow)}
                    data-row={rowIndex}
                    data-col={3}
                    placeholder="S1, S2..."
                    className="w-full bg-transparent outline-none font-black text-[10px] uppercase focus:bg-blue-50 px-1 placeholder:text-gray-200 italic"
                  />
                </td>
                <td className="border-r border-gray-100 px-2 py-1">
                  <input
                    type="text"
                    value={line.unit}
                    onChange={(e) => updateLine(rowIndex, 'unit', e.target.value)}
                    onKeyDown={(e) => handleGridKeyDown(e, rowIndex, 4, lines.length, 6, addRow)}
                    data-row={rowIndex}
                    data-col={4}
                    className="w-full bg-transparent outline-none font-black text-xs text-center focus:bg-blue-50 px-1 italic"
                  />
                </td>
                <td className="border-r border-gray-100 px-2 py-1">
                  <input
                    type="number"
                    value={line.price || ''}
                    onChange={(e) => updateLine(rowIndex, 'price', e.target.value)}
                    onKeyDown={(e) => handleGridKeyDown(e, rowIndex, 5, lines.length, 6, addRow)}
                    data-row={rowIndex}
                    data-col={5}
                    className="w-full bg-transparent outline-none font-black text-sm text-right px-1 focus:bg-blue-50 italic"
                  />
                </td>
                <td className="border-r border-gray-100 px-2 py-1">
                  <input
                    type="number"
                    value={line.gstRate || ''}
                    onChange={(e) => updateLine(rowIndex, 'gstRate', e.target.value)}
                    onKeyDown={(e) => handleGridKeyDown(e, rowIndex, 6, lines.length, 6, addRow)}
                    data-row={rowIndex}
                    data-col={6}
                    className="w-full bg-transparent outline-none font-black text-sm text-right px-1 focus:bg-blue-50 italic"
                  />
                </td>
                <td className="px-4 py-1 text-right font-black text-sm text-black italic">
                  {line.amount > 0 ? line.amount.toFixed(2) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BOTTOM PANELS */}
      <div className="h-44 shrink-0 flex bg-[var(--color-ledger-purchase)] border-b border-[var(--color-ledger-border)]">

        {/* Tax Summary */}
        <div className="w-1/4 border-r border-[var(--color-ledger-border)] p-4 flex flex-col bg-white/50">
          <div className="text-[9px] font-black bg-gray-100 px-2 py-1 border border-gray-200 mb-2">TAX SUMMARY</div>
          <div className="flex-1 overflow-y-auto">
            {taxSummaries.length > 0 ? taxSummaries.map((tax: TaxSummaryRow, i: number) => (
              <div key={i} className="mb-2 bg-white/30 p-2 rounded border border-gray-200">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 font-bold">GST @ {tax.taxRate.toFixed(1)}%</span>
                  <span className="font-mono font-black">{tax.taxableAmount.toFixed(2)}</span>
                </div>
                {tax.igst > 0 ? (
                  <div className="flex justify-between text-xs text-purple-700">
                    <span className="font-bold">IGST</span>
                    <span className="font-mono">{tax.igst.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-xs text-blue-600">
                      <span className="font-bold">CGST ({(tax.taxRate / 2).toFixed(1)}%)</span>
                      <span className="font-mono">{tax.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-blue-600">
                      <span className="font-bold">SGST ({(tax.taxRate / 2).toFixed(1)}%)</span>
                      <span className="font-mono">{tax.sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            )) : (
              <div className="text-xs text-gray-400 italic text-center py-4">No tax applied</div>
            )}
          </div>

        </div>

        {/* Center Totals */}
        <div className="w-2/4 border-r border-[var(--color-ledger-border)] p-6 flex flex-col justify-between items-center bg-[var(--color-ledger-purchase)]/30">
          <button
            onClick={toggleTax}
            className={`px-8 py-2 font-black text-sm shadow border transition-colors ${isTaxApplied ? 'bg-red-600 text-white border-red-700 hover:bg-red-700' : 'bg-[#1E3A8A] text-white border-blue-900 hover:bg-blue-800'}`}
          >
            {isTaxApplied ? "REMOVE TAX (F4)" : "APPLY TAX (F4)"}
          </button>

          <div className="w-full flex justify-between items-end mt-4">
            <div className="flex gap-8 px-4">
              <div className="text-center">
                <div className="text-[10px] font-bold text-gray-500 tracking-widest mb-1">TOTAL QTY</div>
                <div className="text-xl font-black font-mono">{totalQty.toFixed(2)}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-gray-500 tracking-widest mb-1">ALT QTY</div>
                <div className="text-xl font-black font-mono">0.00</div>
              </div>
            </div>
            <div className="bg-black text-white px-6 py-3 ml-auto shadow-xl">
              <div className="text-[10px] text-gray-400 font-bold tracking-widest mb-1">GRAND TOTAL (₹)</div>
              <div className="text-3xl font-black font-mono tracking-tighter">{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>

        {/* Bill Sundry */}
        <div className="w-1/4 p-4 flex flex-col bg-white/50">
          <div className="text-[9px] font-black bg-gray-100 px-2 py-1 border border-gray-200 mb-2">BILL SUNDRY / CHARGES</div>
          <div className="flex-1 space-y-2">
            {sundries.map((sundry, index) => (
              <div key={sundry.id} className="flex justify-between items-center text-xs">
                <span className="font-bold">{sundry.name}</span>
                <input
                  type="number"
                  value={sundry.amount || ''}
                  onChange={(e) => {
                    const newSundries = [...sundries];
                    newSundries[index].amount = Number(e.target.value);
                    setSundries(newSundries);
                  }}
                  className={`w-20 text-right bg-transparent outline-none font-mono font-black ${sundry.amount < 0 ? 'text-red-600' : ''}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-auto border-t border-dashed border-gray-300 pt-2 flex justify-between text-xs">
            <span className="font-bold text-gray-500">TOTAL CHARGES</span>
            <span className="font-mono font-black">{sundryTotal > 0 ? '+' : ''}{sundryTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* FIXED FOOTER */}
      <div className="shrink-0 h-10 bg-[#0F172A] text-white flex items-center shadow-inner overflow-x-auto text-[9px] font-black tracking-widest">
        <button className="px-6 h-full border-r border-[#334155] hover:bg-[#1E293B] flex items-center gap-2">
          <span><span className="text-blue-400 border-b border-blue-400">V</span>CH DETAIL</span>
        </button>
        <button className="px-6 h-full border-r border-[#334155] hover:bg-[#1E293B] flex items-center gap-2">
          <span>MASTER DETAIL</span>
        </button>
        <button className="px-6 h-full border-r border-[#334155] hover:bg-[#1E293B] flex items-center gap-2">
          <span>PARTY DASH</span>
        </button>
        <button className="px-6 h-full border-r border-[#334155] hover:bg-[#1E293B] flex items-center gap-2">
          <span>VCH IMAGE</span>
        </button>
        <button className="px-6 h-full border-r border-[#334155] hover:bg-[#1E293B] flex items-center gap-2">
          <span>HOLD VCH</span>
        </button>
        <button className="px-6 h-full border-r border-[#334155] hover:bg-[#1E293B] flex items-center gap-2">
          <span>UPDATE DISC</span>
        </button>
        <button className="px-6 h-full border-r border-[#334155] hover:bg-[#1E293B] flex items-center gap-2">
          <span>CHECK SCHEME</span>
        </button>
        <button onClick={handleSave} className="px-8 h-full bg-[#1E3A8A] border-r border-blue-900 hover:bg-blue-800 flex items-center gap-2 ml-auto shadow-md">
          SAVE (F2)
        </button>
        <button onClick={handleQuit} className="px-6 h-full bg-[#7F1D1D] hover:bg-red-800 flex items-center gap-2">
          QUIT (ESC)
        </button>
      </div>

      {/* SERIAL MODAL (Individual Filing Logic) */}
      {showSerialModal && activeRowIndex !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 uppercase">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl overflow-hidden border-2 border-[var(--color-ledger-border)] animate-in zoom-in-95 duration-200">
            <div className="bg-[#1E3A8A] text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5" />
                <h3 className="font-black text-sm tracking-widest">INDIVIDUAL SERIAL FILING</h3>
              </div>
              <button onClick={() => setShowSerialModal(false)} className="hover:rotate-90 transition-transform">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 border border-gray-200 rounded">
                <div className="text-[10px] font-bold text-gray-500 mb-1">PRODUCT</div>
                <div className="text-sm font-black text-blue-900">{lines[activeRowIndex]?.description}</div>
                <div className="mt-2 flex justify-between text-[10px] font-bold">
                  <span>UNITS REQUIRED: {lines[activeRowIndex]?.qty}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded",
                    (lines[activeRowIndex]?.serials?.length || 0) === lines[activeRowIndex]?.qty ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  )}>
                    SCANNED: {lines[activeRowIndex]?.serials?.length || 0}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-500">SCAN SERIAL NUMBER</label>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    placeholder="ENTER SERIAL & PRESS ENTER..."
                    className="flex-1 h-12 bg-gray-100 border-2 border-gray-200 rounded px-4 font-mono font-black text-lg outline-none focus:border-blue-500 transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (!val) return;
                        
                        const currentSerials = lines[activeRowIndex].serials || [];
                        if (currentSerials.includes(val)) {
                          toast.error("DUPLICATE SERIAL IN THIS VOUCHER");
                          return;
                        }
                        
                        if (currentSerials.length >= lines[activeRowIndex].qty) {
                          toast.error("ALL UNITS ALREADY SCANNED");
                          return;
                        }

                        const newSerials = [...currentSerials, val];
                        updateLine(activeRowIndex, 'serials', newSerials);
                        (e.target as HTMLInputElement).value = "";
                        
                        if (newSerials.length === lines[activeRowIndex].qty) {
                          toast.success("ALL SERIALS CAPTURED");
                          setTimeout(() => setShowSerialModal(false), 300);
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto border border-gray-100 rounded bg-gray-50/50 p-2">
                {lines[activeRowIndex]?.serials?.length === 0 ? (
                  <div className="text-center py-8 text-[10px] font-bold text-gray-300 italic tracking-widest">
                    AWAITING SCANNER INPUT...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {lines[activeRowIndex]?.serials?.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 text-[10px] font-black">
                        <span>{s}</span>
                        <button 
                          onClick={() => {
                            const newSerials = (lines[activeRowIndex].serials || []).filter((_, i) => i !== idx);
                            updateLine(activeRowIndex, 'serials', newSerials);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setShowSerialModal(false)}
                className="h-10 px-6 font-black text-[10px] tracking-widest"
              >
                CANCEL
              </Button>
              <Button 
                onClick={() => setShowSerialModal(false)}
                disabled={(lines[activeRowIndex]?.serials?.length || 0) < lines[activeRowIndex]?.qty}
                className="h-10 px-8 bg-[#1E3A8A] text-white font-black text-[10px] tracking-widest"
              >
                DONE (F10)
              </Button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}


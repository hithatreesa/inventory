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

export default function PurchaseLedgerEntry() {
  const router = useRouter();
  const { inventory, processPO } = useData();

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
    { id: '1', sno: 1, description: '', qty: 0, unit: '', price: 0, amount: 0, gstRate: 18 }
  ]);

  const [sundries, setSundries] = useState<BillSundry[]>([
    { id: 'S1', name: 'Freight & Forwarding', percentage: 0, amount: 0 },
    { id: 'S2', name: 'Rounding Off (+/-)', percentage: 0, amount: 0 }
  ]);

  const [isTaxApplied, setIsTaxApplied] = useState(false);

  const {
    totalQty,
    taxableAmount,
    taxSummaries,
    sundryTotal,
    grandTotal
  } = useMemo(() => calculateLedgerTotals(lines, sundries, isTaxApplied), [lines, sundries, isTaxApplied]);

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
        gstRate: 18
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

      if (field === 'qty' || field === 'price') {
        line.amount = calculateLineAmount(Number(line.qty) || 0, Number(line.price) || 0);
      } else if (field === 'description') {
        const item = inventory.find(i => i.name.toLowerCase() === String(value).toLowerCase() || i.id === value || i.sku === value);
        if (item) {
          line.productId = item.id;
          line.description = item.name;
          line.price = item.price || 0;
          line.unit = 'NOS.';
          line.gstRate = item.gst_rate || 18;
          line.amount = calculateLineAmount(Number(line.qty) || 0, Number(line.price) || 0);
        }
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
        gstRate: 18
      }];
    });
  }, []);

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

    try {
      await processPO({
        vendor: header.partyAccount,
        date: header.date,
        reference: header.supplierReference || header.voucherNumber
      }, validLines.map(l => ({
        id: `po_line_${Date.now()}_${l.sno}`,
        productId: l.productId || `NONINV-${Date.now()}`,
        name: l.description,
        brand: 'N/A',
        model: 'N/A',
        qty: Number(l.qty),
        price: Number(l.price),
        gstRate: l.gstRate || 0,
        isSerialized: false,
        serials: [],
        isLocked: false
      })));
      toast.success('Purchase Voucher Saved Successfully!');
      router.push('/purchase');
    } catch (e: any) {
      toast.error(`Save Failed: ${e.message}`);
    }
  }, [lines, header, processPO, router]);

  const toggleTax = useCallback(() => {
    setIsTaxApplied(prev => !prev);
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
          <h1 className="text-3xl font-black tracking-tighter">THE DIGITAL LEDGER</h1>
          <div className="flex items-center">
            <span className="text-xl font-black bg-white px-4 py-1 border border-gray-300 shadow-sm">PURCHASE VOUCHER</span>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-3 py-1.5 border border-blue-200 ml-2 tracking-widest">TRANSACTION TYPE: GST INVOICE</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black tracking-widest text-gray-500 uppercase">VOUCHER NUMBER</div>
          <div className="text-2xl font-black tracking-tight">{header.voucherNumber}</div>
        </div>
      </div>

      {/* HEADER FORM */}
      <div className="shrink-0 bg-white/30 border-b-2 border-[var(--color-ledger-border)]">
        <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[var(--color-ledger-border)]">
          <div className="col-span-12 md:col-span-2 border-r border-[var(--color-ledger-border)] p-2">
            <label className="block text-[9px] font-bold text-gray-500">SERIES</label>
            <input
              value={header.series}
              onChange={e => setHeader({ ...header, series: e.target.value })}
              className="w-full bg-transparent outline-none font-black text-sm border-b border-gray-300 focus:border-blue-500 py-1"
            />
          </div>
          <div className="col-span-12 md:col-span-2 border-r border-[var(--color-ledger-border)] p-2">
            <label className="block text-[9px] font-bold text-gray-500">DATE (DAY)</label>
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
            <label className="block text-[9px] font-bold text-gray-500">SUPPLIER REF. / INV NO.</label>
            <input
              value={header.supplierReference}
              onChange={e => setHeader({ ...header, supplierReference: e.target.value })}
              placeholder="e.g. INV-2023-100"
              className="w-full bg-transparent outline-none font-black text-blue-700 text-sm border-b border-gray-300 focus:border-blue-500 py-1"
            />
          </div>
          <div className="col-span-12 md:col-span-3 border-r border-[var(--color-ledger-border)] p-2">
            <label className="block text-[9px] font-bold text-gray-500">PURCHASE TYPE</label>
            <select
              value={header.gstType}
              onChange={e => setHeader({ ...header, gstType: e.target.value })}
              className="w-full bg-transparent outline-none font-black text-sm border-b border-gray-300 focus:border-blue-500 py-1"
            >
              <option>LGST 18% (Registered)</option>
              <option>IGST 18% (Interstate)</option>
              <option>Exempt</option>
            </select>
          </div>
          <div className="col-span-12 md:col-span-2 p-2 flex items-end justify-end gap-2">
            <button className="text-[9px] font-black tracking-widest border border-gray-300 bg-white px-4 py-1.5 hover:bg-gray-50 shadow-sm">VCH IMG</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[var(--color-ledger-border)]">
          <div className="col-span-12 md:col-span-8 border-r border-[var(--color-ledger-border)] p-2">
            <label className="block text-[9px] font-bold text-gray-500">PARTY ACCOUNT NAME (FULL WIDTH)</label>
            <EntityLookup
              type="vendor"
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
            <label className="block text-[9px] font-bold text-gray-500">MATERIAL CENTRE</label>
            <input
              value={header.materialCentre}
              onChange={e => setHeader({ ...header, materialCentre: e.target.value })}
              className="w-full bg-transparent outline-none font-black text-sm border-b border-gray-300 focus:border-blue-500 py-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="col-span-12 md:col-span-4 border-r border-[var(--color-ledger-border)] p-2">
            <label className="block text-[9px] font-bold text-gray-500">ITC ELIGIBILITY</label>
            <select
              value={header.itcEligibility}
              onChange={e => setHeader({ ...header, itcEligibility: e.target.value })}
              className="w-full bg-transparent outline-none font-black text-sm border-b border-gray-300 focus:border-blue-500 py-1"
            >
              <option>Input Goods/Services</option>
              <option>Capital Goods</option>
              <option>Ineligible</option>
            </select>
          </div>
          <div className="col-span-12 md:col-span-8 p-2">
            <label className="block text-[9px] font-bold text-gray-500">NARRATION / REMARK</label>
            <input
              value={header.narration}
              onChange={e => setHeader({ ...header, narration: e.target.value })}
              placeholder="Being goods purchased vide Bill No..."
              className="w-full bg-transparent outline-none font-bold text-sm border-b border-gray-300 focus:border-blue-500 py-1 italic text-gray-600 placeholder:text-gray-300"
            />
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 overflow-auto bg-white border-b-2 border-[var(--color-ledger-border)] relative input-grid-container">
        <table className="w-full text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-[#64748B] text-white sticky top-0 z-10 font-bold text-[10px] tracking-widest shadow-sm">
            <tr>
              <th className="border-r border-[#475569] px-2 py-2 text-center w-12">S.N.</th>
              <th className="border-r border-[#475569] px-4 py-2 text-left">ITEM DESCRIPTION & SPECIFICATION</th>
              <th className="border-r border-[#475569] px-2 py-2 text-right w-24">QTY.</th>
              <th className="border-r border-[#475569] px-2 py-2 text-center w-20">UNIT</th>
              <th className="border-r border-[#475569] px-2 py-2 text-right w-32">PRICE (₹)</th>
              <th className="px-4 py-2 text-right w-36">AMOUNT (₹)</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, rowIndex) => (
              <tr key={line.id} className="border-b border-gray-100 hover:bg-yellow-50/50 group">
                <td className="border-r border-gray-100 px-2 py-1 text-center font-bold text-gray-400 text-xs">
                  {line.description || line.qty > 0 ? (
                    <span className={line.qty > 0 ? "text-blue-600" : ""}>{line.sno}.</span>
                  ) : rowIndex + 1}
                </td>
                <td className="border-r border-gray-100 px-2 py-1 relative">
                  <EntityLookup
                    type="item"
                    value={line.description}
                    onChange={(val) => updateLine(rowIndex, 'description', val)}
                    onSelect={(item) => {
                      // Simulating the item assignment block
                      updateLine(rowIndex, 'description', item.name || item.id);
                    }}
                    placeholder={rowIndex === 0 && !line.description ? "Start typing item name..." : ""}
                    className="w-full bg-transparent outline-none font-black text-sm focus:bg-blue-50 px-1"
                  />
                  {/* Keep the grid keyboard handler passive listener mapping by rendering a hidden input to capture generic data-row, data-col if required or simply rely on EntityLookup */}
                </td>
                <td className="border-r border-gray-100 px-2 py-1">
                  <input
                    type="number"
                    value={line.qty || ''}
                    onChange={(e) => updateLine(rowIndex, 'qty', e.target.value)}
                    onKeyDown={(e) => handleGridKeyDown(e, rowIndex, 2, lines.length, 5, addRow)}
                    data-row={rowIndex}
                    data-col={2}
                    className="w-full bg-transparent outline-none font-mono text-sm text-right focus:bg-blue-50 px-1"
                  />
                </td>
                <td className="border-r border-gray-100 px-2 py-1">
                  <input
                    type="text"
                    value={line.unit}
                    onChange={(e) => updateLine(rowIndex, 'unit', e.target.value)}
                    onKeyDown={(e) => handleGridKeyDown(e, rowIndex, 3, lines.length, 5, addRow)}
                    data-row={rowIndex}
                    data-col={3}
                    className="w-full bg-transparent outline-none font-bold text-xs text-center focus:bg-blue-50 px-1"
                  />
                </td>
                <td className="border-r border-gray-100 px-2 py-1">
                  <input
                    type="number"
                    value={line.price || ''}
                    onChange={(e) => updateLine(rowIndex, 'price', e.target.value)}
                    onKeyDown={(e) => handleGridKeyDown(e, rowIndex, 4, lines.length, 5, addRow)}
                    data-row={rowIndex}
                    data-col={4}
                    className="w-full bg-transparent outline-none font-mono text-sm text-right focus:bg-blue-50 px-1"
                  />
                </td>
                <td className="px-4 py-1 text-right font-mono text-sm font-black text-black">
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
              <div key={i} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 font-bold">Tax Rate</span>
                  <span className="font-mono">{tax.taxRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 font-bold">Taxable Amt.</span>
                  <span className="font-mono font-black">{tax.taxableAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-blue-600">
                  <span className="font-bold">CGST ({(tax.taxRate / 2).toFixed(1)}%)</span>
                  <span className="font-mono">{tax.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-blue-600">
                  <span className="font-bold">SGST ({(tax.taxRate / 2).toFixed(1)}%)</span>
                  <span className="font-mono">{tax.sgst.toFixed(2)}</span>
                </div>
              </div>
            )) : (
              <div className="text-xs text-gray-400 italic">No tax applied</div>
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
    </div>
  );
}

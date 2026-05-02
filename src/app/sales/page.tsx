"use client"

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/context/DataContext';
import { LedgerLine, LedgerHeader, BillSundry, TaxSummaryRow } from '@/modules/ledger/types';
import { calculateLedgerTotals, calculateLineAmount } from '@/modules/ledger/ledger-engine';
import { handleGridKeyDown, focusCell } from '@/modules/ledger/grid-navigation';
import { useGlobalKeyboardShortcuts } from '@/modules/ledger/keyboard-handler';
import { toast } from 'sonner';
import { EntityLookup } from '@/components/shared/EntityLookup';
import { cn } from '@/lib/utils';
import { X, QrCode, Calculator, Save, LogOut, Check, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUnbilledTickets } from '@/modules/ledger/hooks/useUnbilledTickets';

const PRINT_STYLES = `
  @media print {
    .no-print { display: none !important; }
    .print-only { display: block !important; position: absolute !important; left: 0; top: 0; width: 100%; z-index: 9999; }
    body { background: white !important; margin: 0 !important; padding: 0 !important; }
    @page { margin: 1cm; }
  }
`;

export default function SalesLedgerEntry() {
  const router = useRouter();
  const { inventory, contacts, sellFromPOS, getAvailableStock, transactions, tickets, finalizeBill } = useData();
  const [isTaxApplied, setIsTaxApplied] = useState(true);

  const [header, setHeader] = useState<LedgerHeader>({
    series: 'GST',
    date: new Date().toISOString().split('T')[0],
    voucherNumber: 'TTPL-26-27-55',
    type: 'Direct',
    gstType: 'LGST 18% (Registered)',
    partyAccount: '',
    materialCentre: 'Main Store',
    narration: '',
    itcEligibility: 'None',
    supplierReference: '',
    ticketId: ''
  });

  useEffect(() => {
    setHeader(prev => ({
      ...prev,
      voucherNumber: 'TTPL-26-27-55'
    }));
  }, []);

  const [lines, setLines] = useState<LedgerLine[]>([
    { id: '1', sno: 1, description: '', qty: 0, unit: '', price: 0, amount: 0, gstRate: 18, isLocked: false, serials: [] }
  ]);

  const [sundries, setSundries] = useState<BillSundry[]>([
    { id: 'S1', name: 'Freight & Forwarding', percentage: 0, amount: 0 },
    { id: 'S2', name: 'Rounding Off (+/-)', percentage: 0, amount: 0 }
  ]);

  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [isBilled, setIsBilled] = useState(false);
  const [billedInvoice, setBilledInvoice] = useState<any>(null);

  useEffect(() => {
    if (isBilled && billedInvoice) {
      const timer = setTimeout(() => {
        // Stop any background loading/HMR that might break print preview
        window.stop();
        window.print();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isBilled, billedInvoice]);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const scanRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scanRef.current?.focus();
  }, []);

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
        id: `empty-${i}`,
        sno: currentLines.length + i + 1,
        description: '',
        qty: 0,
        unit: '',
        price: 0,
        amount: 0,
        gstRate: 0,
        isLocked: false
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
      const val = (field === 'qty' || field === 'price' || field === 'gstRate') ? Number(value) : value;
      const line = { ...newLines[index], [field]: val };

      if (field === 'qty' || field === 'price' || field === 'gstRate') {
        line.amount = calculateLineAmount(Number(line.qty) || 0, Number(line.price) || 0);
      } else if (field === 'description' && typeof value === 'object') {
        const item = value;
        line.productId = item.id;
        line.description = item.name;
        line.price = item.sale_price || item.mrp || 0;
        line.unit = (item.unit || 'NOS.').toUpperCase();
        line.gstRate = item.gst_rate || 0;
        line.isLocked = true;
        line.amount = calculateLineAmount(Number(line.qty) || 0, Number(line.price) || 0);
      } else if (field === 'ticketId' && typeof value === 'object') {
        line.ticketId = value.id;
        if (!line.description) {
          line.description = `Service for ${value.id}`;
          line.gstRate = 18;
        }
      } else if (field === 'description' && typeof value === 'string') {
        line.description = value;
        if (line.productId) {
          line.productId = undefined;
          line.isLocked = false;
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
        gstRate: 18,
        isLocked: false,
        serials: []
      }];
    });
  }, []);


  const importTicketItems = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || !ticket.requirements || ticket.requirements.length === 0) {
      toast.error("No billable requirements found in ticket");
      return;
    }

    setLines(prev => {
      // Find first empty row to start importing, or append
      const existingLines = prev.filter(l => l.description || l.productId);
      const requirements = ticket.requirements || [];
      
      const newLines = requirements.map((req: any, i: number) => {
        const item = inventory.find(it => it.id === req.item_id);
        return {
          id: `imp-${Date.now()}-${i}-${Math.random()}`,
          sno: 0,
          ticketId: ticket.id,
          productId: item?.id || (typeof req.item_id === 'string' ? req.item_id : undefined),
          description: item?.name || req.item_id,
          qty: req.qty,
          unit: (item?.unit || 'NOS.').toUpperCase(),
          gstRate: item?.gst_rate || 18,
          price: item?.sale_price || 0,
          amount: calculateLineAmount(req.qty, item?.sale_price || 0),
          isLocked: !!item?.is_serialized,
          serials: []
        };
      });

      const result = [...existingLines, ...newLines];
      return ensureMinimumRows(result.map((l, i) => ({ ...l, sno: i + 1 })));
    });
    
    toast.success(`Imported ${ticket.requirements.length} items from ${ticket.id}`);
  };

  const handleBill = async () => {
    // Step 1: Validate
    const validLines = lines.filter(l => (l.productId || l.description) && l.qty > 0 && l.amount > 0);
    if (validLines.length === 0) return toast.error('ADD VALID ITEMS WITH AMOUNT > 0');
    if (!header.partyAccount) return toast.error('SELECT CUSTOMER FIRST');

    // Step 2: Generate Invoice ID
    const invoiceId = `${header.series}-${header.voucherNumber}`;

    // Step 3: Create Invoice Record
    const invoiceRecord: any = {
      id: invoiceId,
      customer: header.partyAccount,
      date: header.date,
      lines: validLines.map(l => ({
        ...l,
        qty: Number(l.qty) || 0,
        price: Number(l.price) || 0,
        amount: Number(l.amount) || 0,
        gstRate: Number(l.gstRate) || 0
      })),
      subtotal: taxableAmount,
      gst_total: grandTotal - taxableAmount,
      grand_total: grandTotal,
      status: 'FINAL',
      timestamp: Date.now(),
      gstType: header.gstType
    };

    try {
      // Step 4: Ledger Revenue
      await finalizeBill(invoiceRecord);

      // Step 5: Lock & Show Print
      setIsBilled(true);
      setBilledInvoice(invoiceRecord);
      
      toast.success("INVOICE FINALIZED & LEDGERED");
      
      // Step 6: Trigger Billed State (Print handled by useEffect)
      toast.success("INVOICE FINALIZED & LEDGERED");
    } catch (error: any) {
      toast.error(`BILLING_FAILED: ${error.message}`);
    }
  };

  const handleSave = useCallback(async () => {
    const validLines = lines.filter(l => l.productId && l.qty > 0);
    if (validLines.length === 0) {
      toast.error('Add at least one valid item line to save.');
      return;
    }
    if (!header.partyAccount) {
      toast.error('Customer selection is required.');
      return;
    }

    const payload = {
      customer: header.partyAccount,
      date: header.date,
      invoiceNumber: header.voucherNumber,
      lines: validLines.map(l => ({
        id: l.productId || l.id,
        name: l.description,
        qty: Number(l.qty),
        price: Number(l.price),
        gstRate: l.gstRate,
        serials: l.serials || [],
        ticketId: l.ticketId
      })),
      total: grandTotal
    };

    try {
      await toast.promise(sellFromPOS(payload.lines, payload.customer), {
        loading: 'Recording Sales Transaction...',
        success: 'SALES VOUCHER COMMITTED',
        error: (err: any) => `HARD_FAIL: ${err.message}`
      });
      router.push('/dashboard');
    } catch (e) { }
  }, [lines, header, grandTotal, sellFromPOS, router]);

  const openSerialSelection = (index: number) => {
    const line = lines[index];
    if (!line.productId) return toast.error("SELECT ITEM FIRST");
    setActiveRowIndex(index);
    setSelectedSerials(line.serials || []);
    setShowSerialModal(true);
  };

  const confirmSerialSelection = () => {
    if (activeRowIndex === null) return;
    const required = lines[activeRowIndex].qty;
    if (selectedSerials.length !== required) {
      toast.error(`MISMATCH: Need ${required} serials, selected ${selectedSerials.length}`);
      return;
    }
    updateLine(activeRowIndex, 'serials', selectedSerials);
    setShowSerialModal(false);
    toast.success("SERIALS LINKED");
  };

  const addTicketToInvoice = (ticketId: string) => {
    if (lines.some(l => l.ticketId === ticketId)) {
      toast.error('Ticket already added to invoice');
      return;
    }

    const txns = transactions.filter(tx => tx.reference === ticketId);
    const engId = txns.find(tx => tx.engineer_id && tx.engineer_id !== 'N/A')?.engineer_id || 'N/A';

    // Calculate total billable for this ticket
    const revenueTxns = txns.filter(tx => tx.type === 'REVENUE' && tx.reference_id === ticketId);
    // For now we just add a service line
    setLines(prev => {
      const next = prev.filter(l => l.description || l.productId);
      const newLine: LedgerLine = {
        id: `line-${Date.now()}`,
        sno: next.length + 1,
        description: `Service for ${ticketId}`,
        ticketId: ticketId,
        qty: 1,
        unit: 'NOS.',
        price: 0, // User to fill
        amount: 0,
        gstRate: 18,
        isLocked: false
      };
      return [...next, newLine];
    });
    setIsTicketModalOpen(false);
    setTicketSearch('');
    toast.success(`Ticket ${ticketId} added`);
  };

  const handleQuit = () => router.push('/dashboard');

  useGlobalKeyboardShortcuts({
    onSave: handleSave,
    onQuit: handleQuit
  });

  return (
    <>
      <div className="min-h-screen bg-[var(--color-ledger-sales)] text-black font-sans uppercase flex flex-col h-screen overflow-hidden no-print">
      <style>{PRINT_STYLES}</style>
      {/* TOP HEADER */}
      <div className="flex justify-between items-end border-b-2 border-[var(--color-ledger-border)] p-4 shrink-0 bg-white/50">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-black tracking-tighter italic">THE DIGITAL LEDGER</h1>
          <div className="flex items-center">
            <div className="text-xl font-black bg-white px-4 py-1 border border-gray-300 italic uppercase tracking-tighter outline-none">
              Sales Invoice
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black tracking-widest text-gray-500 uppercase italic">VOUCHER_ID</div>
          <div className="text-2xl font-black tracking-tight italic">{header.voucherNumber}</div>
        </div>
      </div>

      {/* HEADER FORM - COBALT SLATE HUD */}
      <div className="shrink-0 bg-white border-b-2 border-[var(--color-ledger-border)]">
        {/* ROW 1: System Metadata */}
        <div className="grid grid-cols-10 border-b border-gray-100 bg-[#F1F5F9]/50">
          <div className="col-span-2 p-3 border-r border-gray-200">
            <div className="flex items-center gap-3">
              <label className="text-[9px] font-black text-gray-400 italic tracking-tighter w-12">SERIES</label>
              <span className="font-black text-xs italic uppercase tracking-tighter">{header.series}</span>
            </div>
          </div>
          <div className="col-span-2 p-3 border-r border-gray-200">
            <div className="flex items-center gap-3">
              <label className="text-[9px] font-black text-gray-400 italic tracking-tighter w-12">DATE</label>
              <input
                type="date"
                value={header.date}
                onChange={e => setHeader({ ...header, date: e.target.value })}
                className="bg-transparent outline-none font-black text-xs italic uppercase tracking-tighter w-full"
              />
            </div>
          </div>
          <div className="col-span-2 p-3 border-r border-gray-200">
            <div className="flex items-center gap-3">
              <label className="text-[9px] font-black text-gray-400 italic tracking-tighter w-12">VCH NO.</label>
              <span className="font-black text-xs italic uppercase tracking-tighter text-blue-700">{header.voucherNumber}</span>
            </div>
          </div>
          <div className="col-span-2 p-3 border-r border-gray-200">
            <div className="flex items-center gap-3">
              <label className="text-[9px] font-black text-gray-400 italic tracking-tighter w-12">TYPE</label>
              <span className="font-black text-xs italic uppercase tracking-tighter">{header.type}</span>
            </div>
          </div>
          <div className="col-span-2 p-3">
            <div className="flex items-center gap-3">
              <label className="text-[9px] font-black text-gray-400 italic tracking-tighter w-16">TAX TYPE</label>
              <div className="flex flex-col gap-1">
                <select
                  value={header.gstType}
                  onChange={e => setHeader({ ...header, gstType: e.target.value })}
                  className="bg-transparent outline-none font-black text-[11px] text-[#003366] italic uppercase tracking-tighter cursor-pointer"
                >
                  <option value="LGST 18% (Registered)">LGST (18%)</option>
                  <option value="IGST 18% (Registered)">IGST (18%)</option>
                  <option value="LGST 12% (Registered)">LGST (12%)</option>
                  <option value="IGST 12% (Registered)">IGST (12%)</option>
                </select>
                <div className={cn(
                  "text-[8px] font-black italic px-2 py-0.5 rounded border self-start",
                  header.gstType.includes('IGST') ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                )}>
                  {header.gstType.includes('IGST') ? 'INTERSTATE' : 'LOCAL'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Account & Ticket Selection */}
        <div className="grid grid-cols-10 border-b border-gray-100 bg-white">
          <div className="col-span-6 p-3 border-r border-gray-200">
            <div className="flex items-center gap-6">
              <label className="text-[9px] font-black text-gray-400 italic tracking-tighter w-16">PARTY</label>
              <EntityLookup
                type="contact"
                contactFilter="CLIENT"
                value={header.partyAccount}
                onChange={val => setHeader({ ...header, partyAccount: val })}
                onSelect={contact => setHeader(prev => ({ ...prev, partyAccount: contact.name }))}
                placeholder="Search Customer Account (F2 to Register)..."
                className="flex-1 font-black text-base italic text-blue-700 uppercase tracking-tight"
              />
            </div>
          </div>
          <div className="col-span-4 p-3 bg-blue-50/30">
            <div className="flex items-center gap-2">
              <label className="text-[9px] font-black text-gray-400 italic tracking-tighter w-24">REFERENCE NO.</label>
              <div className="flex-1 flex items-center gap-2">
                <EntityLookup
                  type="ticket"
                  value={header.ticketId || ''}
                  onChange={val => setHeader({ ...header, ticketId: val })}
                  onSelect={ticket => {
                    setHeader(prev => ({ ...prev, ticketId: ticket.id, partyAccount: ticket.customer_name || prev.partyAccount }));
                  }}
                  placeholder="Link to Primary Ticket..."
                  className="flex-1 font-black text-sm italic text-amber-700 uppercase tracking-tight"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: Inventory & Compliance */}
        <div className="grid grid-cols-2 border-b border-gray-100 bg-white">
          <div className="p-3 border-r border-gray-200">
            <div className="flex items-center gap-6">
              <label className="text-[9px] font-black text-gray-400 italic tracking-tighter w-16 whitespace-nowrap">MAT. CENTRE</label>
              <input
                value={header.materialCentre}
                onChange={e => setHeader({ ...header, materialCentre: e.target.value })}
                className="flex-1 bg-transparent outline-none font-black text-xs italic uppercase tracking-tighter"
              />
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-center gap-6">
              <label className="text-[9px] font-black text-gray-400 italic tracking-tighter w-24 whitespace-nowrap">SUPPLIER REF</label>
              <input
                value={header.supplierReference}
                onChange={e => setHeader({ ...header, supplierReference: e.target.value })}
                placeholder="PO-001"
                className="flex-1 bg-transparent outline-none font-black text-xs italic uppercase tracking-tighter"
              />
            </div>
          </div>
        </div>

        {/* ROW 4: Remarks */}
        <div className="p-3 bg-white">
          <div className="flex items-center gap-6">
            <label className="text-[9px] font-black text-gray-400 italic tracking-tighter w-16">NARRATION</label>
            <input
              value={header.narration}
              onChange={e => setHeader({ ...header, narration: e.target.value })}
              placeholder="Voucher specific remarks..."
              className="flex-1 bg-transparent outline-none font-bold text-[11px] italic uppercase tracking-tight text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 overflow-auto bg-white border-b-2 border-[var(--color-ledger-border)] relative">
        <table className="w-full text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-[#1E293B] text-white sticky top-0 z-10 font-black text-[9px] tracking-widest uppercase italic">
            <tr>
              <th className="border-r border-[#334155] px-2 py-2 text-center w-12">S.N.</th>
              <th className="border-r border-[#334155] px-4 py-2 text-left">PRODUCT_SPECIFICATION</th>
              <th className="border-r border-[#334155] px-2 py-2 text-right w-20">QUANTITY</th>
              <th className="border-r border-[#334155] px-2 py-2 text-center w-16">UOM</th>
              <th className="border-r border-[#334155] px-2 py-2 text-right w-24">RATE (₹)</th>
              <th className="border-r border-[#334155] px-2 py-2 text-right w-16">GST%</th>
              <th className="px-4 py-2 text-right w-32">TOTAL (₹)</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, rowIndex) => (
              <tr key={line.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                <td className="border-r border-gray-100 px-2 py-1 text-center font-black text-gray-300 text-[10px] italic">{line.sno}.</td>
                <td className="border-r border-gray-100 px-2 py-1 relative">
                  <EntityLookup
                    ref={rowIndex === lines.findIndex(l => !l.description) ? scanRef : null}
                    type="item"
                    value={line.description}
                    onChange={(val) => updateLine(rowIndex, 'description', val)}
                    onSelect={(item) => {
                      updateLine(rowIndex, 'description', item);
                      setTimeout(() => {
                        const qtyInput = document.querySelector(`input[data-row="${rowIndex}"][data-col="2"]`) as HTMLInputElement;
                        qtyInput?.focus();
                      }, 50);
                    }}
                    onKeyDown={(e) => handleGridKeyDown(e, rowIndex, 1, lines.length, 5, addRow)}
                    data-row={rowIndex}
                    data-col={1}
                    className="w-full bg-transparent outline-none font-black text-sm px-1"
                  />
                </td>
                <td className="border-r border-gray-100 px-2 py-1">
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      value={line.qty || ''}
                      onChange={e => updateLine(rowIndex, 'qty', e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const masterItem = inventory.find(i => i.id === line.productId);
                          if (masterItem?.is_serialized && Number(line.qty) > 0) {
                            e.preventDefault();
                            openSerialSelection(rowIndex);
                            return;
                          }
                        }
                        handleGridKeyDown(e, rowIndex, 2, lines.length, 4, addRow);
                      }}
                      data-row={rowIndex}
                      data-col={2}
                      className="w-full bg-transparent outline-none font-black text-sm text-right px-1 pr-5"
                    />
                    {inventory.find(i => i.id === line.productId)?.is_serialized && (
                      <button
                        onClick={() => openSerialSelection(rowIndex)}
                        className="absolute right-0.5 text-blue-500 hover:text-blue-700 p-0.5"
                      >
                        <QrCode className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="border-r border-gray-100 px-2 py-1 text-center font-black text-xs italic">{line.unit}</td>
                <td className="border-r border-gray-100 px-2 py-1">
                  <input type="number" value={line.price || ''} onChange={e => updateLine(rowIndex, 'price', e.target.value)} onKeyDown={e => handleGridKeyDown(e, rowIndex, 3, lines.length, 4, addRow)} data-row={rowIndex} data-col={3} className="w-full bg-transparent outline-none font-black text-sm text-right px-1" />
                </td>
                <td className="border-r border-gray-100 px-2 py-1">
                  <input type="number" value={line.gstRate || ''} onChange={e => updateLine(rowIndex, 'gstRate', e.target.value)} onKeyDown={e => handleGridKeyDown(e, rowIndex, 4, lines.length, 4, addRow)} data-row={rowIndex} data-col={4} className="w-full bg-transparent outline-none font-black text-sm text-right px-1" />
                </td>
                <td className="px-4 py-1 text-right font-black text-sm italic">{line.amount > 0 ? line.amount.toFixed(2) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER PANELS */}
      <div className="h-44 shrink-0 flex bg-white/50 border-t-2 border-[var(--color-ledger-border)]">
        <div className="w-1/4 border-r border-gray-200 p-4 overflow-y-auto custom-scrollbar">
          <div className="text-[9px] font-black text-gray-400 mb-2 italic tracking-widest uppercase">Tax Intelligence HUD</div>
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-black italic border-b border-gray-100 pb-1">
              <span className="text-gray-400">Taxable Value</span>
              <span>₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {taxSummaries.map((tax, i) => (
              <div key={i} className="space-y-1">
                {tax.igst > 0 ? (
                  <div className="flex justify-between text-[11px] font-black italic text-blue-700">
                    <span>IGST @ {tax.taxRate}%</span>
                    <span>₹{tax.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-[11px] font-black italic text-emerald-700">
                      <span>CGST @ {tax.taxRate/2}%</span>
                      <span>₹{tax.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-black italic text-emerald-700">
                      <span>SGST @ {tax.taxRate/2}%</span>
                      <span>₹{tax.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center gap-4">
          <div className="bg-black text-white px-8 py-4 shadow-2xl">
            <div className="text-[10px] font-bold text-gray-400 tracking-widest mb-1 italic">GRAND TOTAL</div>
            <div className="text-4xl font-black font-mono tracking-tighter">₹{grandTotal.toLocaleString()}</div>
          </div>
          <div className="flex gap-4">
            <button 
              disabled={isBilled}
              onClick={() => {
                if (!header.ticketId) return toast.error('LINK A TICKET IN THE HEADER FIRST');
                importTicketItems(header.ticketId);
              }} 
              className={cn("bg-emerald-700 text-white px-6 py-2 font-black text-xs italic uppercase tracking-widest hover:bg-emerald-800 transition-colors", isBilled && "opacity-50 cursor-not-allowed")}
            >
              IMPORT (F4)
            </button>
            <button 
              onClick={isBilled ? () => window.print() : handleBill} 
              className="bg-blue-700 text-white px-6 py-2 font-black text-xs italic uppercase tracking-widest hover:bg-blue-800 transition-colors"
            >
              {isBilled ? "RE-PRINT (P)" : "BILL (F2)"}
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-700 text-white px-6 py-2 font-black text-xs italic uppercase tracking-widest hover:bg-red-800 transition-colors"
            >
              {isBilled ? "DONE (ESC)" : "QUIT (ESC)"}
            </button>
          </div>
        </div>
      </div>

      {/* OUTWARD SERIAL SELECTION MODAL */}
      {showSerialModal && activeRowIndex !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden border-4 border-[#003366] animate-in zoom-in-95 duration-200">
            <div className="bg-[#003366] text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg uppercase italic tracking-tighter">Outward Serial Selection</h3>
                <p className="text-[10px] opacity-60 font-bold uppercase italic tracking-widest mt-1">Select {lines[activeRowIndex].qty} units</p>
              </div>
              <button onClick={() => setShowSerialModal(false)} className="hover:rotate-90 transition-transform"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
                {getAvailableStock(lines[activeRowIndex].productId!).map(s => {
                  const isSelected = selectedSerials.includes(s.serial);
                  return (
                    <button
                      key={s.serial}
                      onClick={() => setSelectedSerials(prev => isSelected ? prev.filter(x => x !== s.serial) : [...prev, s.serial])}
                      className={cn("flex items-center justify-between p-3 rounded-xl border-2 transition-all font-black text-[11px] italic", isSelected ? "bg-blue-50 border-blue-600 text-blue-900" : "bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-300")}
                    >
                      <span>{s.serial}</span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  )
                })}
              </div>
              <div className="mt-8 flex gap-4">
                <Button variant="secondary" onClick={() => setShowSerialModal(false)} className="flex-1">CANCEL</Button>
                <Button onClick={confirmSerialSelection} className="flex-[2] bg-[#003366]">CONFIRM {selectedSerials.length} UNITS</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      {/* PRINTABLE INVOICE TEMPLATE (Visible only on print or when billed) */}
      {isBilled && billedInvoice && (
        <div className="print-only fixed inset-0 bg-white z-[9999] p-8 text-[12px] leading-tight font-sans text-black overflow-y-auto no-print-screen:relative no-print-screen:inset-auto">
          <div className="max-w-[800px] mx-auto border-2 border-black p-4 bg-white">
            {/* Header */}
            <div className="flex justify-between border-b-2 border-black pb-4 mb-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-blue-900 flex items-center justify-center font-black italic border-2 border-black text-white text-[10px]">TERAIT</div>
                <div>
                  <h1 className="text-xl font-black uppercase">Terait Technologies Pvt Ltd</h1>
                  <p>#24, 100 Feet Road, Banaswadi, Bangalore - 560043</p>
                  <p>GSTIN/UIN: 29AAICT3217H1Z8</p>
                  <p>State Name: Karnataka, Code: 29</p>
                  <p>Email: accounts@teraittech.com</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-xs">Invoice No: <span className="text-lg">{billedInvoice.id}</span></p>
                <p>Dated: {billedInvoice.date}</p>
                <p>Mode/Terms of Payment: NEFT/RTGS</p>
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 border-b-2 border-black mb-4">
              <div className="border-r-2 border-black p-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase italic">Buyer (Bill to)</p>
                <h2 className="font-black text-md uppercase">{billedInvoice.customer}</h2>
                <p>State Name: Karnataka, Code: 29</p>
              </div>
              <div className="p-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase italic">Consignee (Ship to)</p>
                <h2 className="font-black text-md uppercase">{billedInvoice.customer}</h2>
                <p>State Name: Karnataka, Code: 29</p>
              </div>
            </div>

            {/* Grid */}
            <table className="w-full border-collapse mb-4">
              <thead className="bg-gray-100 border-y-2 border-black font-black uppercase text-[10px]">
                <tr>
                  <th className="border-r border-black p-1 text-center w-8">Sl</th>
                  <th className="border-r border-black p-1 text-left">Product Specification</th>
                  <th className="border-r border-black p-1 text-center w-20">HSN / SAC</th>
                  <th className="border-r border-black p-1 text-right w-16">Quantity</th>
                  <th className="border-r border-black p-1 text-right w-20">Rate</th>
                  <th className="border-r border-black p-1 text-center w-12">UOM</th>
                  <th className="p-1 text-right w-24">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {billedInvoice.lines.map((l: any, i: number) => {
                  const masterItem = inventory.find(item => item.id === l.productId);
                  const hsn = masterItem?.hsn_code || (l.productId ? '8471' : '9987'); // Fallback to 8471 for HW, 9987 for Services
                  return (
                    <tr key={i} className="border-b border-gray-300 min-h-[30px]">
                      <td className="border-r border-black p-1 text-center">{i + 1}</td>
                      <td className="border-r border-black p-1">
                        <p className="font-black uppercase">{l.description}</p>
                        {l.productId && <p className="text-[9px] italic text-gray-600">Part Ref: {l.productId}</p>}
                      </td>
                      <td className="border-r border-black p-1 text-center font-bold">{hsn}</td>
                      <td className="border-r border-black p-1 text-right font-bold">{l.qty} {l.unit || 'Nos'}</td>
                      <td className="border-r border-black p-1 text-right">{l.price.toFixed(2)}</td>
                      <td className="border-r border-black p-1 text-center">{l.unit || 'Nos'}</td>
                      <td className="p-1 text-right font-black">{l.amount.toFixed(2)}</td>
                    </tr>
                  )
                })}
                {/* Tax Rows */}
                <tr className="border-t-2 border-black font-black bg-gray-50">
                  <td colSpan={6} className="text-right p-1 uppercase italic">Taxable Value</td>
                  <td className="p-1 text-right">₹{billedInvoice.subtotal.toFixed(2)}</td>
                </tr>
                {billedInvoice.gstType.includes('LGST') ? (
                  <>
                    <tr className="font-bold">
                      <td colSpan={6} className="text-right p-1 italic uppercase">CGST Output @ {(billedInvoice.lines[0]?.gstRate || 18)/2}%</td>
                      <td className="p-1 text-right">₹{(billedInvoice.gst_total/2).toFixed(2)}</td>
                    </tr>
                    <tr className="border-b-2 border-black font-bold">
                      <td colSpan={6} className="text-right p-1 italic uppercase">SGST Output @ {(billedInvoice.lines[0]?.gstRate || 18)/2}%</td>
                      <td className="p-1 text-right">₹{(billedInvoice.gst_total/2).toFixed(2)}</td>
                    </tr>
                  </>
                ) : (
                  <tr className="border-b-2 border-black font-bold">
                    <td colSpan={6} className="text-right p-1 italic uppercase">IGST Output @ {(billedInvoice.lines[0]?.gstRate || 18)}%</td>
                    <td className="p-1 text-right">₹{billedInvoice.gst_total.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="font-black text-lg">
                  <td colSpan={6} className="text-right p-2 uppercase italic tracking-tighter">Grand Total</td>
                  <td className="p-2 text-right border-l-2 border-black bg-gray-100">₹{billedInvoice.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            {/* Footer Details */}
            <div className="grid grid-cols-2 gap-8 text-[10px] border-t-2 border-black pt-4">
              <div>
                <p className="font-black mb-1 uppercase">Bank Details:</p>
                <p>A/c Holder: Terait Technologies Pvt Ltd</p>
                <p>Bank: HDFC Bank</p>
                <p>A/c No: 50200054864362</p>
                <p>IFSC: HDFC0001268</p>
                <p className="mt-4 font-black">PAN: AAICT3217H</p>
              </div>
              <div className="text-right flex flex-col justify-between">
                <p className="italic">For Terait Technologies Pvt Ltd</p>
                <div className="mt-12">
                  <div className="w-32 border-b border-black ml-auto mb-1"></div>
                  <p className="font-black uppercase italic text-[9px]">Authorized Signatory</p>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center text-[8px] font-black italic uppercase tracking-widest text-gray-400">
              This is a Computer Generated Invoice
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-4 no-print">
            <Button onClick={() => window.print()} className="bg-blue-900 text-white px-12">RE-PRINT INVOICE</Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>START NEW BILL</Button>
          </div>
        </div>
      )}
    </>
  );
}

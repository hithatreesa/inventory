"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/context/DataContext';
import { calculateLedgerTotals } from '@/modules/ledger/ledger-engine';
import { useGlobalKeyboardShortcuts } from '@/modules/ledger/keyboard-handler';
import { handleGridKeyDown } from '@/modules/ledger/grid-navigation';
import { LedgerHeader, BillSundry } from '@/modules/ledger/types';
import { useUnbilledTickets } from '@/modules/ledger/hooks/useUnbilledTickets';
import { toast } from 'sonner';
import { EntityLookup } from '@/components/shared/EntityLookup';
import { Search, X, Plus } from 'lucide-react';

export interface TicketLedgerLine {
  id: string;
  sno: number;
  ticket_id: string;
  description: string;
  engineer_id: string;
  amount: number;
  qty: number; // For totals calculation compatibility
  price: number; // For totals calculation compatibility
  gstRate: number;
}

const createEmptyLine = (sno: number): TicketLedgerLine => ({
  id: `row-${Date.now()}-${sno}`, sno, ticket_id: '', description: '', engineer_id: '', amount: 0, qty: 1, price: 0, gstRate: 18
});

export default function SalesLedgerEntry() {
  const router = useRouter();
  const { inventory, tickets, transactions, getTicketBillableSummary, processSalesInvoice } = useData();

  const [header, setHeader] = useState<LedgerHeader>({
    series: 'GST',
    date: new Date().toISOString().split('T')[0],
    voucherNumber: '1',
    type: 'Against Challan',
    gstType: 'I/GST-18%',
    partyAccount: '',
    materialCentre: 'Main Store',
    narration: '',
    supplierReference: ''
  });

  const [lines, setLines] = useState<TicketLedgerLine[]>([createEmptyLine(1)]);

  const [sundries, setSundries] = useState<BillSundry[]>(
    Array.from({ length: 6 }).map((_, i) => ({
      id: `sun-${i + 1}`,
      name: '',
      percentage: 0,
      amount: 0
    }))
  );

  const [editingSundryIndex, setEditingSundryIndex] = useState<number | null>(null);
  const [isTaxApplied, setIsTaxApplied] = useState(false);
  const [isTicketPopupOpen, setIsTicketPopupOpen] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');

  // Map to LedgerLine for totals calculation
  const mappedLinesForTotals = useMemo(() => {
    return lines.map(l => ({
      ...l,
      unit: 'nos'
    }));
  }, [lines]);

  const totals = useMemo(() => calculateLedgerTotals(mappedLinesForTotals, sundries, isTaxApplied), [mappedLinesForTotals, sundries, isTaxApplied]);

  const unbilledTickets = useUnbilledTickets(tickets, transactions, header.partyAccount, ticketSearch);

  const addTicketToInvoice = (ticketId: string) => {
    if (lines.some(l => l.ticket_id === ticketId)) {
      toast.error('Ticket already added to invoice');
      return;
    }

    const summary = getTicketBillableSummary(ticketId);
    const suggestedAmount = summary.total > 0 ? summary.total : 0;

    const txns = transactions.filter(tx => tx.reference === ticketId);
    const engId = txns.find(tx => tx.engineer_id && tx.engineer_id !== 'N/A')?.engineer_id || 'N/A';

    setLines(prev => {
      let next = [...prev];
      const emptyIdx = next.findIndex(l => !l.ticket_id);
      
      const newLine = {
        id: `line-${Date.now()}`,
        sno: emptyIdx !== -1 ? next[emptyIdx].sno : next.length + 1,
        ticket_id: ticketId,
        description: `Service for ${ticketId}`,
        engineer_id: engId,
        amount: suggestedAmount,
        qty: 1,
        price: suggestedAmount,
        gstRate: 18
      };

      if (emptyIdx !== -1) {
        next[emptyIdx] = newLine;
      } else {
        next.push(newLine);
      }
      
      if (next[next.length - 1].ticket_id !== '') {
          next.push(createEmptyLine(next.length + 1));
      }
      return next;
    });
    setIsTicketPopupOpen(false);
    setTicketSearch('');
  };

  const addAllPendingTickets = () => {
    let added = 0;
    setLines(prev => {
      let next = [...prev];
      unbilledTickets.forEach(t => {
        if (!next.some(l => l.ticket_id === t.id)) {
          const summary = getTicketBillableSummary(t.id);
          const suggestedAmount = summary.total > 0 ? summary.total : 0;
          const txns = transactions.filter(tx => tx.reference === t.id);
          const engId = txns.find(tx => tx.engineer_id && tx.engineer_id !== 'N/A')?.engineer_id || 'N/A';

          const emptyIdx = next.findIndex(l => !l.ticket_id);
          const newLine = {
            id: `line-${Date.now()}-${t.id}`,
            sno: emptyIdx !== -1 ? next[emptyIdx].sno : next.length + 1,
            ticket_id: t.id,
            description: `Service for ${t.id}`,
            engineer_id: engId,
            amount: suggestedAmount,
            qty: 1,
            price: suggestedAmount,
            gstRate: 18
          };

          if (emptyIdx !== -1) {
            next[emptyIdx] = newLine;
          } else {
            next.push(newLine);
          }
          added++;
        }
      });
      if (next.length === 0 || next[next.length - 1].ticket_id !== '') {
          next.push(createEmptyLine(next.length + 1));
      }
      return next;
    });
    if (added > 0) toast.success(`Added ${added} tickets`);
    else toast.error('No pending tickets to add');
  };

  const handleSave = async () => {
    const validLines = lines.filter(l => l.ticket_id);
    if (validLines.length === 0) {
      toast.error('HARD_FAIL: At least 1 ticket required');
      return;
    }
    if (!header.partyAccount) {
      toast.error('HARD_FAIL: Customer must be selected');
      return;
    }
    if (validLines.some(l => l.amount <= 0)) {
      toast.error('HARD_FAIL: Amount > 0 required for all lines');
      return;
    }

    const allValid = validLines.every(l => {
      const t = tickets.find(tkt => tkt.id === l.ticket_id);
      return t?.customer_name?.toLowerCase() === header.partyAccount.toLowerCase();
    });

    if (!allValid) {
      toast.error('HARD_FAIL: All tickets must belong to same customer');
      return;
    }

    try {
      const invoiceId = header.series ? `${header.series}-${header.voucherNumber}` : header.voucherNumber;
      await toast.promise(processSalesInvoice({
        id: invoiceId,
        customer_id: header.partyAccount,
        date: new Date(header.date).getTime(),
        lines: validLines.map(l => {
          const isInterstate = header.gstType.includes('IGST');
          let igst = 0, cgst = 0, sgst = 0;
          if (isTaxApplied && l.gstRate > 0) {
            if (isInterstate) igst = Number(l.amount) * (l.gstRate / 100);
            else {
              cgst = Number(l.amount) * ((l.gstRate / 2) / 100);
              sgst = Number(l.amount) * ((l.gstRate / 2) / 100);
            }
          }
          return {
            ticket_id: l.ticket_id,
            description: l.description,
            amount: Number(l.amount),
            gst_rate: l.gstRate,
            igst,
            cgst,
            sgst
          };
        }),
        total_amount: validLines.reduce((sum, line) => sum + Number(line.amount), 0),
        total_igst: totals.taxSummaries.reduce((sum, tax) => sum + tax.igst, 0),
        total_cgst: totals.taxSummaries.reduce((sum, tax) => sum + tax.cgst, 0),
        total_sgst: totals.taxSummaries.reduce((sum, tax) => sum + tax.sgst, 0)
      }), {
        loading: 'Processing Sale Voucher...',
        success: 'Sale Saved Successfully',
        error: (err: any) => err.message || 'Failed to save sale'
      });

      // Clear
      setLines([createEmptyLine(1)]);
      setSundries(sundries.map(s => ({ ...s, name: '', percentage: 0, amount: 0 })));
      setHeader({ ...header, voucherNumber: String(Number(header.voucherNumber) + 1), narration: '' });
    } catch (err) {
      console.error(err);
    }
  };

  useGlobalKeyboardShortcuts({
    onSave: handleSave,
    onApplyTax: () => setIsTaxApplied(prev => !prev),
    onQuit: () => router.push('/dashboard')
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (editingSundryIndex !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest('.sundry-cell')) {
          setEditingSundryIndex(null);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingSundryIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isTicketPopupOpen && header.partyAccount && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setIsTicketPopupOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTicketPopupOpen, header.partyAccount]);

  const addRow = useCallback(() => {
    setLines(prev => {
        if (prev.length > 0 && !prev[prev.length - 1].ticket_id) return prev;
        return [...prev, createEmptyLine(prev.length + 1)];
    });
  }, []);

  const updateLine = (index: number, field: keyof TicketLedgerLine, value: string | number) => {
    setLines(prev => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };

      if (field === 'amount') {
        row.price = Number(value);
      }
      next[index] = row;
      
      if (field === 'ticket_id' && value && index === next.length - 1) {
          next.push(createEmptyLine(next.length + 1));
      }
      return next;
    });
  };

  const updateSundry = (index: number, field: keyof BillSundry, value: string | number) => {
    setSundries(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  return (
    <div className="flex flex-col min-h-screen text-[13px] font-medium selection:bg-blue-200" style={{ backgroundColor: 'var(--color-ledger-sales)', color: '#000' }}>

      {/* HEADER SECTION */}
      <div className="p-2 space-y-1">
        {/* ROW 1 */}
        <div className="flex items-center gap-4 py-1">
          <div className="flex items-center gap-2">
            <span className="w-12">Series</span>
            <input
              value={header.series}
              onChange={e => setHeader({ ...header, series: e.target.value })}
              className="bg-transparent border-b border-gray-400 font-bold px-1 w-24 outline-none focus:border-black"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-10">Date</span>
            <input
              type="date"
              value={header.date}
              onChange={e => setHeader({ ...header, date: e.target.value })}
              className="bg-transparent border-b border-gray-400 font-bold px-1 outline-none focus:border-black"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16">Vch No.</span>
            <input
              value={header.voucherNumber}
              onChange={e => setHeader({ ...header, voucherNumber: e.target.value })}
              className="bg-transparent border-b border-gray-400 font-bold px-1 w-24 outline-none focus:border-black"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="w-10">Type</span>
            <select
              value={header.type}
              onChange={e => setHeader({ ...header, type: e.target.value })}
              className="bg-transparent border-b border-gray-400 font-bold px-1 outline-none focus:border-black"
            >
              <option>Direct</option>
              <option>Against Challan</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-right">Sale Type</span>
            <select
              value={header.gstType}
              onChange={e => setHeader({ ...header, gstType: e.target.value })}
              className="bg-transparent border-b border-gray-400 font-bold px-1 outline-none focus:border-black w-32"
            >
              <option>I/GST-18%</option>
              <option>I/GST-12%</option>
              <option>I/GST-5%</option>
              <option>I/GST-Exempt</option>
              <option>I/GST-MultiRate</option>
            </select>
          </div>
        </div>

        {/* ROW 2 */}
        <div className="flex items-center gap-4 py-1">
          <div className="flex items-center gap-2 flex-1">
            <span className="w-12">Party</span>
            <EntityLookup
              type="contact"
              contactFilter="CLIENT"
              value={header.partyAccount}
              onChange={val => {
                setHeader({ ...header, partyAccount: val });
                // Reset lines if party changes to avoid mixed tickets
                setLines([createEmptyLine(1)]);
              }}
              onSelect={vendor => {
                setHeader(prev => ({ ...prev, partyAccount: vendor.name }));
              }}
              placeholder="Select Party Account..."
              className="bg-transparent border-b border-gray-400 font-bold px-1 w-full outline-none focus:border-black relative z-20"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20">Mat. Centre</span>
            <input
              value={header.materialCentre}
              onChange={e => setHeader({ ...header, materialCentre: e.target.value })}
              className="bg-transparent border-b border-gray-400 font-bold px-1 w-32 outline-none focus:border-black"
            />
          </div>
          {header.partyAccount && (
            <button
              onClick={() => setIsTicketPopupOpen(true)}
              className="ml-4 bg-blue-600 text-white px-3 py-1 text-xs font-bold shadow-sm hover:bg-blue-700 active:translate-y-px"
            >
              + Add Ticket
            </button>
          )}
        </div>

        {/* ROW 3 */}
        <div className="flex flex-col gap-1 py-1">
          <div className="flex gap-2">
            <span className="w-12 pt-1">Narration</span>
            <textarea
              value={header.narration}
              onChange={e => setHeader({ ...header, narration: e.target.value })}
              className="bg-transparent border-b border-gray-400 font-bold px-1 flex-1 resize-none h-10 outline-none focus:border-black"
            />
          </div>
        </div>
      </div>

      {/* MAIN LEDGER GRID */}
      <div className="border-t border-b border-gray-300 bg-white flex-1 overflow-auto relative">
        <table className="w-full text-left border-collapse" style={{ minWidth: '800px' }}>
          <thead className="sticky top-0 bg-[#E8EDF5] border-b border-gray-300 z-10 shadow-sm">
            <tr>
              <th className="font-bold py-1 px-2 border-r border-gray-300 w-12 text-center">S.N.</th>
              <th className="font-bold py-1 px-2 border-r border-gray-300 w-48">Item</th>
              <th className="font-bold py-1 px-2 border-r border-gray-300">Description</th>
              <th className="font-bold py-1 px-2 border-r border-gray-300 w-40">Engineer</th>
              <th className="font-bold py-1 px-2 border-r border-gray-300 w-32 text-right">Amount (Rs.)</th>
              <th className="font-bold py-1 px-2 w-16 text-center">Act</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={line.id} className="group border-b border-gray-100 hover:bg-[#F5F8FA]">
                <td className="py-0.5 px-2 border-r border-gray-200 text-center text-gray-500 font-medium bg-gray-50/50">{line.sno}</td>
                <td className="py-0 border-r border-gray-200 relative">
                  {line.ticket_id ? (
                    <div className="w-full bg-transparent outline-none px-2 font-bold text-gray-700">
                      {line.ticket_id}
                    </div>
                  ) : (
                    <EntityLookup
                      type="ticket"
                      value={line.ticket_id}
                      onChange={(val) => updateLine(i, 'ticket_id', val)}
                      onSelect={(item) => addTicketToInvoice(item.id)}
                      placeholder="Select Item..."
                      className="w-full bg-transparent outline-none px-2 font-bold focus:bg-blue-50 focus:ring-1 focus:ring-inset focus:ring-blue-400"
                    />
                  )}
                </td>
                <td className="py-0 border-r border-gray-200">
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => updateLine(i, 'description', e.target.value)}
                    onKeyDown={(e) => handleGridKeyDown(e, i, 2, lines.length, 5, addRow)}
                    data-row={i} data-col={2}
                    disabled={!line.ticket_id}
                    className="w-full bg-transparent outline-none px-2 font-bold focus:bg-blue-50 focus:ring-1 focus:ring-inset focus:ring-blue-400 disabled:opacity-50"
                  />
                </td>
                <td className="py-0 border-r border-gray-200">
                  <div className="w-full bg-transparent outline-none px-2 font-bold text-gray-500 text-xs">
                    {line.engineer_id}
                  </div>
                </td>
                <td className="py-0 border-r border-gray-200">
                  <input
                    type="number"
                    data-row={i} data-col={4}
                    value={line.amount || ''}
                    onChange={(e) => updateLine(i, 'amount', e.target.value)}
                    onKeyDown={(e) => handleGridKeyDown(e, i, 4, lines.length, 5, addRow)}
                    disabled={!line.ticket_id}
                    className="w-full bg-transparent outline-none px-2 text-right font-bold focus:bg-blue-50 focus:ring-1 focus:ring-inset focus:ring-blue-400 disabled:opacity-50 tabular-nums"
                  />
                </td>
                <td className="py-0 text-center">
                  {line.ticket_id && (
                    <button
                      onClick={() => {
                        const next = lines.filter((_, idx) => idx !== i);
                        const reindexed = next.map((l, index) => ({ ...l, sno: index + 1 }));
                        if (reindexed.length === 0) reindexed.push(createEmptyLine(1));
                        else if (reindexed[reindexed.length - 1].ticket_id !== '') reindexed.push(createEmptyLine(reindexed.length + 1));
                        setLines(reindexed);
                      }}
                      className="text-red-500 hover:bg-red-50 px-2 py-0.5 font-bold text-xs"
                    >
                      <X className="w-3 h-3 inline" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 15 - lines.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="border-b border-gray-100 bg-[#FAFAFA]">
                <td className="py-0.5 px-2 border-r border-gray-200 text-center text-gray-400 font-medium">{lines.length + i + 1}</td>
                <td className="py-0 border-r border-gray-200"></td>
                <td className="py-0 border-r border-gray-200"></td>
                <td className="py-0 border-r border-gray-200"></td>
                <td className="py-0 border-r border-gray-200"></td>
                <td className="py-0"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-[1fr,1.5fr,1fr] gap-0 border-b border-gray-300 min-h-[160px] bg-[#E6F2FF]">
        {/* LEFT: Tax Summary */}
        <div className="border-r border-gray-300 p-2">
          <div className="fieldset-border relative border border-gray-400 p-2 pt-3 mt-2 h-full bg-[#FAFAFA] border-opacity-60 bg-opacity-60">
            <span className="absolute -top-2.5 left-2 bg-[#FAFAFA] px-1 text-[11px] text-gray-600 font-bold">Tax Summary</span>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-300 text-gray-600">
                  <th className="font-normal text-left underline pb-1">Tax Rate</th>
                  <th className="font-normal text-right underline pb-1">Taxable Amt.</th>
                  <th className="font-normal text-right underline pb-1">IGST</th>
                  <th className="font-normal text-right underline pb-1">SGST</th>
                </tr>
              </thead>
              <tbody>
                {totals.taxSummaries.map((tax) => (
                  <tr key={tax.taxRate}>
                    <td className="font-bold py-1">{tax.taxRate}%</td>
                    <td className="text-right font-bold">{tax.taxableAmount.toFixed(2)}</td>
                    <td className="text-right font-bold">{tax.cgst.toFixed(2)}</td>
                    <td className="text-right font-bold">{tax.sgst.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex items-center gap-2">
              <input type="checkbox" id="stax" checked={isTaxApplied} onChange={() => setIsTaxApplied(!isTaxApplied)} />
              <label htmlFor="stax" className="text-purple-800 font-bold">Tax Summary</label>
            </div>
          </div>
        </div>

        {/* CENTER: Totals */}
        <div className="flex flex-col items-center justify-start pt-2 border-r border-gray-300 relative">
          <div className="w-full flex justify-between px-2 mb-2 items-center">
            <button
              onClick={() => setIsTaxApplied(!isTaxApplied)}
              className="bg-gray-200 border border-gray-400 px-3 py-1 shadow-sm font-bold hover:bg-gray-300 active:translate-y-[1px]"
            >
              Apply Tax (F4)
            </button>
            <div className="font-bold text-center pl-10 pr-2">
              {totals.totalQty > 0 ? totals.totalQty : '0.00'} <span className="font-normal text-gray-600">(Alt. Qty. = 0.00)</span>
            </div>
            <div className="font-bold text-lg tabular-nums">
              {totals.taxableAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* RIGHT: Bill Sundry */}
        <div className="bg-white">
          <table className="w-full text-left border-collapse h-full">
            <thead className="bg-[#E8EDF5] border-b border-gray-300">
              <tr>
                <th className="font-bold py-1 px-2 border-r border-gray-300 w-8 text-center">S.N.</th>
                <th className="font-bold py-1 px-2 border-r border-gray-300">Bill Sundry</th>
                <th className="font-bold py-1 px-2 border-r border-gray-300 w-12 text-center">@</th>
                <th className="font-bold py-1 px-2 text-right w-24">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {sundries.map((sun, lIdx) => (
                <tr key={sun.id} className="border-b border-gray-100 h-6">
                  <td className="px-2 border-r border-gray-200 text-center text-gray-500">{lIdx + 1}</td>
                  <td className="px-0 border-r border-gray-200 relative sundry-cell">
                    <div
                      onClick={() => setEditingSundryIndex(lIdx)}
                      className="w-full h-full px-2 font-bold cursor-pointer flex items-center min-h-[22px] select-none uppercase text-xs transition-colors hover:bg-gray-50"
                    >
                      {sun.name || <span className="opacity-0">EMPTY</span>}
                    </div>

                    {editingSundryIndex === lIdx && (
                      <div className="absolute top-0 left-0 w-full z-50 bg-white border border-gray-300 shadow-2xl rounded-sm py-1 animate-in fade-in zoom-in duration-100">
                        {["Installation charges", "Transportation", "Packing", "Service charges", "Labour", "Rounding Off (+/-)"].map(opt => (
                          <div
                            key={opt}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSundry(lIdx, 'name', opt);
                              setEditingSundryIndex(null);
                            }}
                            className="px-2 py-1.5 hover:bg-blue-600 hover:text-white cursor-pointer font-bold text-[10px] uppercase tracking-wider transition-colors"
                          >
                            {opt}
                          </div>
                        ))}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSundry(lIdx, 'name', '');
                            setEditingSundryIndex(null);
                          }}
                          className="px-2 py-1.5 hover:bg-red-50 text-red-500 cursor-pointer font-bold text-[10px] uppercase tracking-wider border-t border-gray-100 mt-1"
                        >
                          Clear Value
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-0 border-r border-gray-200">
                    <input
                      type="number"
                      value={sun.percentage || ''}
                      onChange={(e) => updateSundry(lIdx, 'percentage', e.target.value)}
                      className="w-full bg-transparent outline-none px-2 text-center font-bold focus:bg-blue-50 focus:ring-1 focus:ring-inset focus:ring-blue-400"
                    />
                  </td>
                  <td className="px-0">
                    <input
                      type="number"
                      value={sun.amount || ''}
                      onChange={(e) => updateSundry(lIdx, 'amount', e.target.value)}
                      className="w-full bg-transparent outline-none px-2 text-right font-bold focus:bg-blue-50 focus:ring-1 focus:ring-inset focus:ring-blue-400"
                    />
                  </td>
                </tr>
              ))}
              <tr><td colSpan={4} className="h-full bg-[#FAFAFA] bg-opacity-50"></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* GRAND TOTAL ROW */}
      <div className="flex justify-end pr-3 py-1 font-black text-2xl tabular-nums tracking-tight">
        {totals.grandTotal.toFixed(2)}
      </div>

      {/* FOOTER ACTION BAR */}
      <div className="sticky bottom-0 bg-[#E6F2FF] border-t border-gray-300 p-1 flex items-center justify-between gap-1 overflow-x-auto shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
        <div className="flex gap-1">
          {['Vch. Detail', 'Master Detail', 'Party Dash Board'].map(t => (
            <button key={t} className="bg-[#EAEAEA] border border-gray-400 px-3 py-1 font-bold text-black shadow-[1px_1px_0_#FFF] hover:bg-gray-300 active:translate-y-[1px]">
              {t}
            </button>
          ))}
          {['VCH IMAGE', 'ACC IMAGE', 'ITEM IMAGE'].map(t => (
            <button key={t} className="bg-[#D1D9E0] border border-gray-400 px-2 py-1 font-bold text-[10px] text-black shadow-[1px_1px_0_#FFF] hover:bg-gray-400 active:translate-y-[1px] leading-tight">
              {t.split(' ').map(w => <div key={w}>{w}</div>)}
            </button>
          ))}
          {['Hold Vch.', 'Update Disc./Markup', 'Check Scheme'].map(t => (
            <button key={t} className="bg-transparent border-none px-2 py-1 font-bold text-gray-700 underline hover:text-black hover:bg-black/5">
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1 pl-4 shrink-0">
          <button onClick={handleSave} className="bg-white border border-gray-400 px-4 py-1 font-bold shadow-[inset_1px_1px_0_#FFF] hover:bg-gray-100 active:translate-y-[1px]">
            Save
          </button>
          <button onClick={() => router.push('/dashboard')} className="bg-white border border-gray-400 px-4 py-1 font-bold shadow-[inset_1px_1px_0_#FFF] hover:bg-gray-100 active:translate-y-[1px]">
            Quit
          </button>
        </div>
      </div>

      {/* TICKET LOOKUP MODAL */}
      {isTicketPopupOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white border border-black shadow-[4px_4px_0_rgba(0,0,0,0.2)] w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="bg-[#1A365D] p-2 flex justify-between items-center text-white border-b border-black">
              <h2 className="font-bold uppercase text-[12px]">Select Pending Ticket for {header.partyAccount}</h2>
              <button onClick={() => setIsTicketPopupOpen(false)} className="hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 border-b border-gray-300 bg-[#E8EDF5] flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                autoFocus
                type="text"
                placeholder="Search by Ticket No or Engineer..."
                value={ticketSearch}
                onChange={e => setTicketSearch(e.target.value)}
                className="flex-1 bg-white border border-gray-400 px-2 py-1 text-xs font-bold outline-none focus:border-black"
              />
              {unbilledTickets.length > 0 && (
                <button onClick={addAllPendingTickets} className="bg-green-600 text-white px-2 py-1 text-xs font-bold border border-black hover:bg-green-700">
                  Add All Pending
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1 p-2 bg-white">
              {unbilledTickets.length === 0 ? (
                <div className="text-center p-4 text-gray-500 font-bold text-xs">
                  No unbilled tickets found for this customer.
                </div>
              ) : (
                <table className="w-full text-left border-collapse border border-gray-300 text-xs">
                  <thead className="bg-[#E8EDF5]">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1">Ticket No</th>
                      <th className="border border-gray-300 px-2 py-1">Title</th>
                      <th className="border border-gray-300 px-2 py-1">Engineer</th>
                      <th className="border border-gray-300 px-2 py-1 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unbilledTickets.map(t => {
                      const isAdded = lines.some(l => l.ticket_id === t.id);
                      const txns = transactions.filter(tx => tx.reference === t.id);
                      const engId = txns.find(tx => tx.engineer_id && tx.engineer_id !== 'N/A')?.engineer_id || 'N/A';

                      return (
                        <tr key={t.id} className="hover:bg-blue-50">
                          <td className="border border-gray-300 px-2 py-1 font-bold">{t.id}</td>
                          <td className="border border-gray-300 px-2 py-1">{t.title}</td>
                          <td className="border border-gray-300 px-2 py-1">{engId}</td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {isAdded ? (
                              <span className="text-gray-400 font-bold italic">Added</span>
                            ) : (
                              <button onClick={() => addTicketToInvoice(t.id)} className="bg-blue-600 text-white px-2 py-0.5 rounded-sm hover:bg-blue-700">
                                Select
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/context/DataContext';
import { calculateLineAmount, calculateLedgerTotals } from '@/modules/ledger/ledger-engine';
import { useGlobalKeyboardShortcuts } from '@/modules/ledger/keyboard-handler';
import { handleGridKeyDown } from '@/modules/ledger/grid-navigation';
import { LedgerLine, LedgerHeader, BillSundry } from '@/modules/ledger/types';
import { toast } from 'sonner';
import { EntityLookup } from '@/components/shared/EntityLookup';

export default function SalesLedgerEntry() {
  const router = useRouter();
  const { inventory, sellFromPOS } = useData();

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

  const [lines, setLines] = useState<LedgerLine[]>(
    Array.from({ length: 15 }).map((_, i) => ({
      id: `row-${i}`,
      sno: i + 1,
      description: '',
      qty: 0,
      unit: '',
      price: 0,
      amount: 0,
      gstRate: 0
    }))
  );

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
  const totals = useMemo(() => calculateLedgerTotals(lines, sundries, isTaxApplied), [lines, sundries, isTaxApplied]);

  const handleSave = async () => {
    const validLines = lines.filter(l => l.productId && l.qty > 0 && l.amount > 0);
    if (validLines.length === 0) {
      toast.error('Add at least one valid item');
      return;
    }
    if (!header.partyAccount) {
      toast.error('Party Account is required');
      return;
    }
    try {
      const formattedCart = validLines.map(l => ({
        id: l.productId!,
        qty: Number(l.qty),
        price: Number(l.price),
      }));

      await toast.promise(sellFromPOS(formattedCart, header.partyAccount), {
        loading: 'Processing Sale Voucher...',
        success: 'Sale Saved Successfully',
        error: (err: any) => err.message || 'Failed to save sale'
      });
      // Clear or navigate
      setLines(Array.from({ length: 15 }).map((_, i) => ({
        id: `new-row-${Date.now()}-${i}`, sno: i + 1, description: '', qty: 0, unit: '', price: 0, amount: 0, gstRate: 0
      })));
      setSundries(sundries.map(s => ({ ...s, name: '', percentage: 0, amount: 0 })));
      setHeader({ ...header, voucherNumber: String(Number(header.voucherNumber) + 1) });
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

  const addRow = useCallback(() => {
    setLines(prev => [
      ...prev,
      {
        id: `row-${prev.length}`,
        sno: prev.length + 1,
        description: '',
        qty: 0,
        unit: '',
        price: 0,
        amount: 0,
        gstRate: 0
      }
    ]);
  }, []);

  const updateLine = (index: number, field: keyof LedgerLine, value: string | number) => {
    setLines(prev => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };

      if (field === 'qty' || field === 'price') {
        const qty = field === 'qty' ? Number(value) : Number(row.qty);
        const price = field === 'price' ? Number(value) : Number(row.price);
        row.amount = calculateLineAmount(qty, price);
      }
      if (field === 'description' && typeof value === 'string') {
        const match = inventory.find(i => i.name.toLowerCase() === value.trim().toLowerCase());
        if (match) {
          row.productId = match.id;
          row.unit = match.unit || 'nos';
          row.price = match.price || 0;
          row.gstRate = match.gst_rate || 0;
          row.amount = calculateLineAmount(Number(row.qty), match.price || 0);
        }
      }
      next[index] = row;
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
              type="vendor"
              value={header.partyAccount}
              onChange={val => setHeader({ ...header, partyAccount: val })}
              onSelect={vendor => {
                setHeader(prev => ({
                  ...header,
                  partyAccount: vendor.name,
                }));
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
              <th className="font-bold py-1 px-2 border-r border-gray-300">Item</th>
              <th className="font-bold py-1 px-2 border-r border-gray-300 w-40">Customer</th>
              <th className="font-bold py-1 px-2 border-r border-gray-300 w-24 text-right">Qty.</th>
              <th className="font-bold py-1 px-2 border-r border-gray-300 w-20">Unit</th>
              <th className="font-bold py-1 px-2 border-r border-gray-300 w-32 text-right">Price (Rs.)</th>
              <th className="font-bold py-1 px-2 w-32 text-right">Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={line.id} className="group border-b border-gray-100 hover:bg-[#F5F8FA]">
                <td className="py-0.5 px-2 border-r border-gray-200 text-center text-gray-500 font-medium bg-gray-50/50">{line.sno}</td>
                <td className="py-0 border-r border-gray-200 relative">
                  <EntityLookup
                    type="item"
                    value={line.description}
                    onChange={(val) => updateLine(i, 'description', val)}
                    onSelect={(item) => {
                      updateLine(i, 'description', item.name || item.id);
                    }}
                    className="w-full bg-transparent outline-none px-2 font-bold focus:bg-blue-50 focus:ring-1 focus:ring-inset focus:ring-blue-400"
                  />
                </td>
                <td className="py-0 border-r border-gray-200">
                  <input
                    type="text"
                    value={line.customerName || ''}
                    onChange={(e) => updateLine(i, 'customerName', e.target.value)}
                    onKeyDown={(e) => handleGridKeyDown(e, i, 5, lines.length, 6, addRow)}
                    data-row={i} data-col={5}
                    placeholder="Reference..."
                    className="w-full bg-transparent outline-none px-2 font-bold text-xs focus:bg-blue-50 focus:ring-1 focus:ring-inset focus:ring-blue-400 placeholder:text-gray-300"
                  />
                </td>
                <td className="py-0 border-r border-gray-200">
                  <input
                    type="number"
                    data-row={i} data-col={2}
                    value={line.qty || ''}
                    onChange={(e) => updateLine(i, 'qty', e.target.value)}
                    onKeyDown={(e) => handleGridKeyDown(e, i, 2, lines.length, 6, addRow)}
                    className="w-full bg-transparent outline-none px-2 text-right font-bold focus:bg-blue-50 focus:ring-1 focus:ring-inset focus:ring-blue-400"
                  />
                </td>
                <td className="py-0 border-r border-gray-200">
                  <input
                    data-row={i} data-col={3}
                    value={line.unit}
                    onChange={(e) => updateLine(i, 'unit', e.target.value)}
                    onKeyDown={(e) => handleGridKeyDown(e, i, 3, lines.length, 5, addRow)}
                    className="w-full bg-transparent outline-none px-2 font-bold focus:bg-blue-50 focus:ring-1 focus:ring-inset focus:ring-blue-400"
                  />
                </td>
                <td className="py-0 border-r border-gray-200">
                  <input
                    type="number"
                    data-row={i} data-col={4}
                    value={line.price || ''}
                    onChange={(e) => updateLine(i, 'price', e.target.value)}
                    onKeyDown={(e) => handleGridKeyDown(e, i, 4, lines.length, 5, addRow)}
                    className="w-full bg-transparent outline-none px-2 text-right font-bold focus:bg-blue-50 focus:ring-1 focus:ring-inset focus:ring-blue-400"
                  />
                </td>
                <td className="py-0">
                  <div className="w-full px-2 text-right font-bold text-gray-800 tabular-nums">
                    {line.amount > 0 ? line.amount.toFixed(2) : ''}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <datalist id="inventory-sales-items">
          {inventory.map(item => (
            <option key={item.id} value={item.name} />
          ))}
        </datalist>
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
    </div>
  );
}

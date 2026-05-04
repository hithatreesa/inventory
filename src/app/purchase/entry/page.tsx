"use client"

import React, { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useData } from '@/lib/context/DataContext';
import { LedgerLine, LedgerHeader, BillSundry, TaxSummaryRow } from '@/modules/ledger/types';
import { calculateLedgerTotals, calculateLineAmount } from '@/modules/ledger/ledger-engine';
import { handleGridKeyDown, focusCell } from '@/modules/ledger/grid-navigation';
import { useGlobalKeyboardShortcuts } from '@/modules/ledger/keyboard-handler';
import { toast } from 'sonner';
import { EntityLookup } from '@/components/shared/EntityLookup';
import { cn } from '@/lib/utils';
import { X, QrCode, Calculator, Save, LogOut, AlertCircle, Trash2 } from 'lucide-react';
import { buildState } from '@/lib/inventoryEngine';
import { Button } from '@/components/ui/Button';

function PurchaseLedgerEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { inventory, contacts, processInward, processPO, addItem, gstConfigs, transactions } = useData();
  const [isTaxApplied, setIsTaxApplied] = useState(true);
  const [voucherType, setVoucherType] = useState<'PURCHASE_VOUCHER' | 'PURCHASE_ORDER'>('PURCHASE_VOUCHER');

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'po') {
      setVoucherType('PURCHASE_ORDER');
    }
  }, [searchParams]);

  const [header, setHeader] = useState<LedgerHeader>({
    series: 'Main',
    date: new Date().toISOString().split('T')[0],
    voucherNumber: 'PUR/26-27/0000',
    type: 'LOCAL',
    gstType: 'LGST 18% (Registered)',
    partyAccount: '',
    materialCentre: 'Main Godown (Warehouse A)',
    narration: '',
    itcEligibility: 'Input Goods/Services',
    supplierReference: ''
  });

  useEffect(() => {
    setHeader(prev => ({
      ...prev,
      voucherNumber: `PUR/26-27/${Math.floor(1000 + Math.random() * 9000)}`
    }));
  }, []);

  const [lines, setLines] = useState<LedgerLine[]>([
    { id: '1', sno: 1, description: '', qty: 0, unit: '', price: 0, amount: 0, gstRate: 18, isLocked: false, serials: [], ticketId: '' }
  ]);

  const [sundries, setSundries] = useState<BillSundry[]>([
    { id: 'S1', name: 'Freight & Forwarding', percentage: 0, amount: 0 },
    { id: 'S2', name: 'Rounding Off (+/-)', percentage: 0, amount: 0 }
  ]);

  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [scanMode, setScanMode] = useState<'barcode' | 'serial'>('barcode');
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0);

  const scanRef = useRef<HTMLInputElement>(null);
  const modalScanRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log("[SCANNER] Page Mount - Initial Focus");
    scanRef.current?.focus();
  }, []);

  useEffect(() => {
    if (showSerialModal) {
      console.log("[SCANNER] Modal Open - Redirecting Focus");
      setTimeout(() => modalScanRef.current?.focus(), 100);
    } else {
      console.log("[SCANNER] Modal Closed - Returning Focus");
      setTimeout(() => scanRef.current?.focus(), 100);
    }
  }, [showSerialModal]);

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
        
        // Auto-modal trigger moved to onKeyDown for better UX (prevents pop-up while typing)
      } else if (field === 'description' && typeof value === 'object') {
        const item = value;
        line.productId = item.id;
        line.description = item.name;
        line.price = item.purchase_price || 0;
        line.unit = (item.unit || 'NOS.').toUpperCase();
        line.gstRate = item.gst_rate || 0;
        line.isLocked = true;
        line.amount = calculateLineAmount(Number(line.qty) || 0, Number(line.price) || 0);
        
        if (item.is_serialized && Number(line.qty) > 0) {
          setActiveRowIndex(index);
          setShowSerialModal(true);
          setScanMode('barcode');
          setCurrentUnitIndex(0);
        }
      } else if (field === 'description' && typeof value === 'string') {
        line.description = value;
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
          isSerialized: masterItem?.is_serialized || (l.tracking && l.tracking.length > 0),
          tracking: l.tracking || [],
          serials: (l.tracking || []).map((t: any) => ({ serial: t.serial, barcode: t.barcode, timestamp: Date.now() })),
          isLocked: false,
          ticket_id: l.ticketId
        };
      });

      const action = voucherType === 'PURCHASE_ORDER' ? processPO : processInward;
      const label = voucherType === 'PURCHASE_ORDER' ? 'PO_RECORDED' : 'INWARD_COMMITTED';

      await toast.promise(action(payload, mappedLines), {
        loading: voucherType === 'PURCHASE_ORDER' ? 'DRAFTING_PURCHASE_ORDER...' : 'COMMITTING_VOUCHER_TO_LEDGER...',
        success: label,
        error: (err) => `HARD_FAIL: ${err.message || 'SAVE_FAILED'}`
      });

      router.push('/purchase');
    } catch (e: any) {
      console.error(e);
    }
  }, [header, processInward, inventory, router, voucherType, processPO]);

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

    const sessionSerials = new Set<string>();
    for (const l of validLines) {
      if (l.qty <= 0) return toast.error(`Invalid quantity for line ${l.sno}`);
      if (l.price < 0) return toast.error(`Invalid price for line ${l.sno}`);
      if (!l.ticketId) return toast.error(`Ticket ID missing for line ${l.sno}`);
      
      const masterItem = inventory.find(i => i.id === l.productId);
      const isSerialized = masterItem?.is_serialized || (l.tracking && l.tracking.length > 0);

      if (isSerialized && voucherType === 'PURCHASE_VOUCHER') {
        if (!l.tracking || l.tracking.length !== Number(l.qty)) {
          return toast.error(`Tracking mismatch for ${l.description}. Need ${l.qty} units.`);
        }
        for (const t of l.tracking) {
          if (!t.barcode || !t.serial) return toast.error(`Incomplete tracking for ${l.description}`);
          if (sessionSerials.has(t.serial)) return toast.error(`Duplicate serial: ${t.serial}`);
          sessionSerials.add(t.serial);
        }
      }
    }

    await executeCommit(validLines);
  }, [lines, header, inventory, executeCommit, voucherType]);

  const toggleTax = useCallback(() => {
    setIsTaxApplied(prev => !prev);
    toast.info(isTaxApplied ? "Tax Removed" : "Tax Applied");
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
            <select 
              value={voucherType}
              onChange={(e) => setVoucherType(e.target.value as any)}
              className="text-xl font-black bg-white px-4 py-1 border border-gray-300 italic uppercase tracking-tighter outline-none cursor-pointer"
            >
              <option value="PURCHASE_VOUCHER">Purchase Voucher</option>
              <option value="PURCHASE_ORDER">Purchase Order (PO)</option>
            </select>
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
              <span className="font-black text-xs italic uppercase tracking-tighter">MAIN</span>
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
              <input 
                value={header.voucherNumber} 
                onChange={e => setHeader({ ...header, voucherNumber: e.target.value })} 
                className="bg-transparent outline-none font-black text-xs italic uppercase tracking-tighter text-blue-700 w-full" 
              />
            </div>
          </div>
          <div className="col-span-2 p-3 border-r border-gray-200">
            <div className="flex items-center gap-3">
              <label className="text-[9px] font-black text-gray-400 italic tracking-tighter w-12">TYPE</label>
              <select 
                value={header.type} 
                onChange={e => setHeader({ ...header, type: e.target.value })} 
                className="bg-transparent outline-none font-black text-xs italic uppercase tracking-tighter cursor-pointer"
              >
                <option value="LOCAL">LOCAL</option>
                <option value="INTERSTATE">INTERSTATE</option>
                <option value="EXEMPTED">EXEMPTED</option>
              </select>
            </div>
          </div>
          <div className="col-span-2 p-3">
            <div className="flex items-center gap-3">
              <label className="text-[9px] font-black text-gray-400 italic tracking-tighter w-16">PURC TYPE</label>
              <select 
                value={header.gstType} 
                onChange={e => setHeader({ ...header, gstType: e.target.value })} 
                className="bg-transparent outline-none font-black text-xs italic uppercase tracking-tighter cursor-pointer"
              >
                <option value="LGST 18% (Registered)">L/GST-18%</option>
                <option value="IGST 18% (Registered)">I/GST-18%</option>
                <option value="LGST 12% (Registered)">L/GST-12%</option>
                <option value="LGST 5% (Registered)">L/GST-5%</option>
              </select>
            </div>
          </div>
        </div>

        {/* ROW 2: Account Selection */}
        <div className="p-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-6">
            <label className="text-[9px] font-black text-gray-400 italic tracking-tighter w-16">PARTY</label>
            <EntityLookup
              type="contact"
              contactFilter="VENDOR"
              value={header.partyAccount}
              onChange={val => setHeader({ ...header, partyAccount: val })}
              onSelect={vendor => setHeader(prev => ({ ...prev, partyAccount: vendor.name }))}
              placeholder="Search Vendor Account (F2 to Register)..."
              className="flex-1 font-black text-base italic text-blue-700 uppercase tracking-tight"
            />
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
              <label className="text-[9px] font-black text-gray-400 italic tracking-tighter w-24 whitespace-nowrap">ITC ELIGIBILITY</label>
              <select 
                value={header.itcEligibility} 
                onChange={e => setHeader({ ...header, itcEligibility: e.target.value })} 
                className="bg-transparent outline-none font-black text-xs italic uppercase tracking-tighter cursor-pointer"
              >
                <option value="Input Goods/Services">Input Goods/Services</option>
                <option value="None">None</option>
                <option value="Capital Goods">Capital Goods</option>
              </select>
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
              <th className="border-r border-[#334155] px-2 py-2 text-left w-24">CODE/SKU</th>
              <th className="border-r border-[#334155] px-4 py-2 text-left">PRODUCT_SPECIFICATION</th>
              <th className="border-r border-[#334155] px-2 py-2 text-right w-20">QUANTITY</th>
              <th className="border-r border-[#334155] px-2 py-2 text-center w-16">UOM</th>
              <th className="border-r border-[#334155] px-2 py-2 text-right w-28">RATE (₹)</th>
              <th className="border-r border-[#334155] px-2 py-2 text-right w-20">GST%</th>
              <th className="px-4 py-2 text-right w-36">TOTAL (₹)</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, rowIndex) => (
              <tr key={line.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                <td className="border-r border-gray-100 px-2 py-1 text-center font-black text-gray-300 text-[10px] italic">{line.sno}.</td>
                <td className="border-r border-gray-100 px-2 py-1 text-center font-black text-blue-600 text-[10px] italic truncate">{inventory.find(i => i.id === line.productId)?.sku || inventory.find(i => i.id === line.productId)?.barcode || '---'}</td>
                <td className="border-r border-gray-100 px-2 py-1 relative">
                  <EntityLookup
                    ref={rowIndex === lines.findIndex(l => !l.description) ? scanRef : null}
                    type="item"
                    value={line.description}
                    onChange={(val) => updateLine(rowIndex, 'description', val)}
                    onSelect={(item) => {
                      console.log("[SCANNER] Item Selected:", item.name);
                      updateLine(rowIndex, 'description', item);
                      setTimeout(() => {
                        const qtyInput = document.querySelector(`input[data-row="${rowIndex}"][data-col="2"]`) as HTMLInputElement;
                        qtyInput?.focus();
                      }, 50);
                    }}
                    onKeyDown={(e) => {
                      console.log("[SCANNER] Key in Grid:", e.key);
                      handleGridKeyDown(e, rowIndex, 1, lines.length, 6, addRow);
                    }}
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
                            setActiveRowIndex(rowIndex);
                            setShowSerialModal(true);
                            setScanMode('barcode');
                            setCurrentUnitIndex(0);
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
                        onClick={() => { setActiveRowIndex(rowIndex); setShowSerialModal(true); }}
                        className="absolute right-0.5 text-blue-500 hover:text-blue-700 p-0.5"
                        title="Click to Scan Serials"
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
        <div className="w-1/4 border-r border-gray-200 p-4">
           <div className="text-[9px] font-black text-gray-400 mb-2 italic">TAX SUMMARY</div>
           <div className="space-y-1">
             {taxSummaries.map((tax, i) => (
               <div key={i} className="flex justify-between text-[11px] font-black italic">
                 <span>GST @ {tax.taxRate}%</span>
                 <span>₹{tax.cgst + tax.sgst + tax.igst}</span>
               </div>
             ))}
           </div>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center gap-4">
           <div className="bg-black text-white px-8 py-4 shadow-2xl">
              <div className="text-[10px] font-bold text-gray-500 tracking-widest mb-1 italic">GRAND TOTAL</div>
              <div className="text-4xl font-black font-mono tracking-tighter">₹{grandTotal.toLocaleString()}</div>
           </div>
           <div className="flex gap-4">
             <button onClick={handleSave} className="bg-blue-700 text-white px-6 py-2 font-black text-xs italic uppercase tracking-widest hover:bg-blue-800 transition-colors">SAVE VOUCHER (F2)</button>
             <button onClick={handleQuit} className="bg-red-700 text-white px-6 py-2 font-black text-xs italic uppercase tracking-widest hover:bg-red-800 transition-colors">QUIT (ESC)</button>
           </div>
        </div>
      </div>

      {/* SERIAL MODAL - HARDWARE OPTIMIZED */}
      {showSerialModal && activeRowIndex !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden border-4 border-[#003366] animate-in zoom-in-95 duration-200">
            <div className="bg-[#003366] text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg uppercase italic tracking-tighter">Unit-Level Dual Capture</h3>
                <p className="text-[10px] opacity-60 font-bold uppercase italic tracking-widest mt-1">Item: {lines[activeRowIndex].description}</p>
              </div>
              <button onClick={() => setShowSerialModal(false)} className="hover:rotate-90 transition-transform"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex justify-center items-center gap-4">
                <div className={cn("px-4 py-2 rounded-full font-black text-xs italic tracking-widest transition-all", scanMode === 'barcode' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400")}>1. BARCODE</div>
                <div className="w-8 h-1 bg-gray-100" />
                <div className={cn("px-4 py-2 rounded-full font-black text-xs italic tracking-widest transition-all", scanMode === 'serial' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400")}>2. SERIAL</div>
              </div>

              <div className="relative">
                <input
                  ref={modalScanRef}
                  placeholder={scanMode === 'barcode' ? "SCAN BARCODE..." : "SCAN SERIAL..."}
                  className="w-full h-16 bg-blue-50 border-4 border-blue-100 rounded-2xl px-12 font-black text-2xl tracking-widest uppercase italic outline-none focus:border-blue-600 focus:bg-white transition-all text-center"
                  onChange={(e) => {
                    console.log(`[SCANNER] Modal ${scanMode} Typing:`, e.target.value);
                  }}
                  onKeyDown={(e) => {
                    console.log(`[SCANNER] Modal ${scanMode} Key:`, e.key);
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (!val) return;

                      const currentTracking = [...(lines[activeRowIndex].tracking || [])];
                      // Ensure slot exists
                      if (!currentTracking[currentUnitIndex]) currentTracking[currentUnitIndex] = { barcode: '', serial: '' };
                      const unit = { ...currentTracking[currentUnitIndex] };

                      if (scanMode === 'barcode') {
                        unit.barcode = val;
                        currentTracking[currentUnitIndex] = unit;
                        updateLine(activeRowIndex, 'tracking', currentTracking);
                        setScanMode('serial');
                        toast.success("BARCODE OK");
                      } else {
                        // Check master duplicate
                        const state = buildState(transactions);
                        if (state.serialMap[val]) {
                           toast.error("SERIAL ALREADY IN SYSTEM");
                           (e.target as HTMLInputElement).value = "";
                           return;
                        }
                        unit.serial = val;
                        currentTracking[currentUnitIndex] = unit;
                        updateLine(activeRowIndex, 'tracking', currentTracking);
                        
                        if (currentUnitIndex < lines[activeRowIndex].qty - 1) {
                          setCurrentUnitIndex(prev => prev + 1);
                          setScanMode('barcode');
                          toast.success("UNIT COMPLETE");
                        } else {
                          toast.success("ALL UNITS CAPTURED");
                          setTimeout(() => setShowSerialModal(false), 500);
                        }
                      }
                      (e.target as HTMLInputElement).value = "";
                      setTimeout(() => modalScanRef.current?.focus(), 50);
                    }
                  }}
                />
                <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 w-6 h-6" />
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-2">
                 <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 mb-2">
                    <span className="text-[10px] font-black text-gray-400 italic uppercase">Audit Trail (Unit {currentUnitIndex + 1}/{lines[activeRowIndex].qty})</span>
                 </div>
                 {Array.from({ length: lines[activeRowIndex].qty }).map((_, i) => {
                    const t = lines[activeRowIndex].tracking?.[i];
                    return (
                      <div key={i} className={cn("flex justify-between items-center px-4 py-2 text-[11px] font-black italic", i === currentUnitIndex ? "bg-blue-100 text-blue-900 rounded-lg" : "text-gray-400")}>
                        <span>UNIT {i+1}</span>
                        <div className="flex gap-4">
                          <span>B: {t?.barcode || "---"}</span>
                          <span>S: {t?.serial || "---"}</span>
                        </div>
                      </div>
                    );
                 })}
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 text-center">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic leading-none">Scanning is Mandatory for Serialized Inventory Integrity</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PurchaseLedgerEntry() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#003366] border-t-transparent rounded-full animate-spin" /></div>}>
      <PurchaseLedgerEntryContent />
    </Suspense>
  );
}

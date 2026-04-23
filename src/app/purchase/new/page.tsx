"use client"

import React, { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react'
import {
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Search,
  Scan,
  QrCode,
  RefreshCw,
  AlertCircle,
  Landmark,
  Truck,
  FileText,
  Barcode,
  ShoppingCart,
  Wallet
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useData, InventoryItem, PurchaseLine, ScanEntry } from '@/lib/context/DataContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { EntityLookup } from '@/components/shared/EntityLookup'

// Point 13: UI Enhancement Sounds (Synthesized via Web Audio)
const playBeep = (freq = 880, duration = 0.1) => {
  if (typeof window === 'undefined') return;
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

const playError = () => playBeep(220, 0.4);
const playSuccess = () => playBeep(880, 0.1);




export default function PurchaseEntryPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-[#F8F9FC] font-black text-[#003366] italic animate-pulse">SYSTEM_INITIALIZING...</div>}>
      <PurchaseEntryContent />
    </Suspense>
  )
}

function PurchaseEntryContent() {
  const { inventory, processPO } = useData()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Header State
  const [header, setHeader] = useState({
    supplier: 'Aether Logistics',
    date: new Date().toISOString().split('T')[0],
    invoiceNumber: 'PO-2026-0412',
    warehouse: 'Central Hub',
    notes: ''
  })

  // Invoice Lines
  const [lines, setLines] = useState<PurchaseLine[]>([])
  
  // Bill Sundry / Additional Charges
  const [sundry, setSundry] = useState<any[]>([])
  const [pendingSundry, setPendingSundry] = useState<{ name: string, amount: number, gstRate: number, expenseId: string } | null>(null)

  // Point: Handle Reorder Redirection
  useEffect(() => {
    const reorderParam = searchParams.get('reorder');
    if (reorderParam && inventory.length > 0) {
      try {
        const data = JSON.parse(decodeURIComponent(reorderParam));
        const item = inventory.find(i => i.id === data.id || i.name === data.name);

        if (item) {
          const newLine: PurchaseLine = {
            id: `po_reorder_${Date.now()}`,
            productId: item.id,
            name: item.name,
            brand: item.brand || 'N/A',
            model: item.model || 'N/A',
            qty: data.qty || 1,
            price: item.price || 0,
            gstRate: item.gst_rate || 18,
            isSerialized: item.is_serialized || false,
            serials: [],
            isLocked: false
          };
          setLines([newLine]);
          toast.success(`AUTO_REORDER_INIT: ${item.name} pre-filled.`);
        }
      } catch (err) {
        console.error("Failed to parse reorder metadata", err);
      }
    }
  }, [searchParams, inventory]);

  // Pending Entry Flow
  const [pendingRow, setPendingRow] = useState<{
    item: InventoryItem | null,
    name: string,
    price: number,
    qty: number,
    isSerialized: boolean,
    model: string,
    brand: string
  } | null>(null)

  // Scan Session HUD
  const [scanSession, setScanSession] = useState<{
    lineId: string,
    item: PurchaseLine,
    requiredQty: number,
    scanned: ScanEntry[]
  } | null>(null)

  const [manualSerial, setManualSerial] = useState('')
  const [modalTab, setModalTab] = useState<'scanner' | 'activity'>('scanner')
  const [duplicateError, setDuplicateError] = useState<string | null>(null)

  const removeLastSerial = useCallback(() => {
    if (!scanSession || scanSession.scanned.length === 0) return;
    setScanSession(prev => prev ? {
      ...prev,
      scanned: prev.scanned.slice(0, -1)
    } : null);
    playBeep(440, 0.05);
  }, [scanSession]);

  const finalizePurchase = useCallback(async () => {
    if (scanSession) {
      playError();
      toast.error("HARD_FAIL: ACTIVE_SCAN_SESSION_EXISTS");
      return;
    }

    // Final Parity Check
    for (const line of lines) {
      if (line.isSerialized && line.serials.length !== line.qty) {
        playError();
        toast.error(`HARD_FAIL: SERIAL_MISMATCH for ${line.name}. Scanned: ${line.serials.length}/${line.qty}`);
        return;
      }
      if (line.qty <= 0) {
        playError();
        toast.error(`HARD_FAIL: INVALID_QTY for ${line.name}`);
        return;
      }
    }

    if (!header.supplier) {
      playError();
      toast.error("HARD_FAIL: MISSING_SUPPLIER");
      return;
    }

    if (!header.warehouse) {
      playError();
      toast.error("HARD_FAIL: MISSING_WAREHOUSE");
      return;
    }

    try {
      await toast.promise(processPO({
        vendor: header.supplier,
        date: header.date,
        reference: header.invoiceNumber,
        warehouse: header.warehouse,
        invoiceNumber: header.invoiceNumber
      }, lines, sundry), {
        loading: 'Committing Procurement Ledger...',
        success: 'Purchase Successful | Stock Updated',
        error: (err: { message?: string }) => err.message || 'Procurement Failed'
      })
      router.push('/purchase');
    } catch (err: unknown) {
      console.error(err);
    }
  }, [scanSession, lines, header, processPO, router]);

  const { subtotal, totalGst, sundryTotal, grandTotal } = useMemo(() => {
    let sub = 0
    let gstSum = 0

    lines.forEach(line => {
      const lineSub = line.qty * line.price
      const lineGst = lineSub * (line.gstRate / 100)

      sub += lineSub
      gstSum += lineGst
    })

    let sunSum = 0
    sundry.forEach(s => {
      const amt = Number(s.amount) || 0
      const gst = amt * ((s.gstRate || 0) / 100)
      sunSum += amt + gst
    })

    return {
      subtotal: sub,
      totalGst: gstSum,
      sundryTotal: sunSum,
      grandTotal: sub + gstSum + sunSum
    }
  }, [lines, sundry])

  const removeLine = useCallback((id: string) => {
    if (scanSession?.lineId === id) {
      toast.error("Cannot delete line with an active scan session");
      return;
    }
    setLines(prev => prev.filter(l => l.id !== id))
  }, [scanSession]);

  // Point 14: Scanner Focus Guard (Ensures hardware scanner always has a target)
  useEffect(() => {
    if (scanSession) {
      const timer = setTimeout(() => {
        document.getElementById('scanner-capture-input')?.focus();
      }, 100);

      const handleGlobalClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // DO NOT steal focus if user is trying to type in the manual input or clicking buttons
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.closest('button') ||
          target.closest('.manual-input-zone')
        ) {
          return;
        }
        document.getElementById('scanner-capture-input')?.focus();
      };

      window.addEventListener('mousedown', handleGlobalClick);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('mousedown', handleGlobalClick);
      };
    }
  }, [scanSession])

  // Point 8: Keyboard-First Global Controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (scanSession) {
        if (e.key === 'Escape') {
          setScanSession(null);
          toast.warning("Scanner Paused.");
        }
        if (e.key === 'Delete') {
          removeLastSerial();
        }
        if (e.ctrlKey && e.key === 'Enter') {
          // Point: Force Commit shortcut inside scanner
          e.preventDefault();
          if (scanSession.scanned.length === scanSession.requiredQty) {
            setLines(prev => prev.map(l => l.id === scanSession.lineId ? { ...l, serials: scanSession.scanned, isLocked: true } : l));
            toast.success(`VERIFIED: Batch Committed.`);
            setScanSession(null);
            setModalTab('scanner');
          } else {
            toast.error("HARD_FAIL: INCOMPLETE_BATCH");
            playError();
          }
        }
      } else {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          finalizePurchase();
        }

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          const inputs = Array.from(document.querySelectorAll('.qty-input')) as HTMLInputElement[];
          const activeIndex = inputs.indexOf(document.activeElement as HTMLInputElement);
          if (activeIndex !== -1) {
            e.preventDefault();
            const nextIndex = e.key === 'ArrowDown' ? activeIndex + 1 : activeIndex - 1;
            if (nextIndex >= 0 && nextIndex < inputs.length) {
              inputs[nextIndex].focus();
              inputs[nextIndex].select();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [scanSession, lines, header, removeLastSerial, finalizePurchase]) // Re-bind on state change to ensure finalizePurchase has latest context

  // --- Actions ---

  const startAdding = useCallback(() => {
    setPendingRow({ item: null, name: '', price: 0, qty: 1, isSerialized: false, model: '', brand: '' })
  }, []);

  const triggerScan = useCallback((lineId: string, customLines?: PurchaseLine[]) => {
    const source = customLines || lines;
    const target = source.find(l => l.id === lineId);
    if (!target || !target.isSerialized) return;

    setLines(prev => prev.map(l => l.id === target.id ? { ...l, isLocked: true } : l));
    setScanSession({
      lineId: target.id,
      item: target,
      requiredQty: target.qty,
      scanned: []
    });
    toast.info(`HARD_LOCK: Capturing ${target.qty} serials for ${target.name}`);
  }, [lines]);

  const commitLine = useCallback((autoScan = false) => {
    if (!pendingRow || !pendingRow.name || pendingRow.qty <= 0) {
      playError();
      toast.error("HARD_FAIL: INVALID_ENTRY_DATA");
      return;
    }

    const item = pendingRow.item

    if (!item || !item.id) {
      playError();
      toast.error("HARD_FAIL: ITEM_MUST_BE_SELECTED_FROM_MASTER");
      return;
    }

    // Point 5: GST Master Derivation & Hard Fail
    if (typeof item.gst_rate === 'undefined' || item.gst_rate === null) {
      playError();
      toast.error("HARD_FAIL: GST_NOT_DEFINED_IN_ITEM_MASTER");
      throw new Error(`GST_NOT_DEFINED_FOR_PRODUCT: ${item.name}`);
    }

    const newLine: PurchaseLine = {
      id: `po_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      productId: item.id, // SSOT: MUST NOT BE NULL
      name: item.name,
      brand: item.brand || 'N/A',
      model: item.model || 'N/A',
      qty: pendingRow.qty,
      price: pendingRow.price,
      gstRate: item.gst_rate,
      isSerialized: item.is_serialized || false,
      serials: [],
      isLocked: false
    }

    const updatedLines = [...lines, newLine];
    setLines(updatedLines);
    setPendingRow(null);

    toast.success(`LINE_ADDED: ${newLine.name}`);

    if (autoScan && newLine.isSerialized) {
      // Delay slightly to ensure state is committed or use direct target
      setTimeout(() => triggerScan(newLine.id, updatedLines), 10);
    }
  }, [pendingRow, lines, triggerScan]);

  const rescanLine = useCallback((lineId: string) => {
    const line = lines.find(l => l.id === lineId);
    if (!line) return;

    setLines(prev => prev.map(l => l.id === lineId ? { ...l, serials: [], isLocked: true } : l));
    setScanSession({
      lineId: line.id,
      item: line,
      requiredQty: line.qty,
      scanned: []
    });
    playBeep(440, 0.1);
    toast.info(`RESCAN: Previous data cleared. Repositary open.`);
  }, [lines]);

  const handleSessionScan = useCallback((barcode: string) => {
    if (!scanSession || !barcode) return;

    // 1. Check duplicate in current session
    const isDuplicateSession = scanSession.scanned.some(s => s.serial === barcode);
    if (isDuplicateSession) {
      playError();
      setDuplicateError(`DUPLICATE_IN_SESSION: ${barcode}`);
      return;
    }

    // 2. Check duplicate in entire PO
    const isDuplicateGlobal = lines.some(l => l.serials.some(s => (typeof s === 'string' ? s : s.serial) === barcode));
    if (isDuplicateGlobal) {
      playError();
      setDuplicateError(`HARD_FAIL: GLOBAL_DUPLICATE_REJECTED: ${barcode}`);
      return;
    }

    // 3. Check duplicate in inventory
    const isDuplicateInventory = inventory.some(item => item.barcode === barcode || item.sku === barcode);
    if (isDuplicateInventory) {
      playError();
      setDuplicateError(`HARD_FAIL: SERIAL_ALREADY_EXISTS: ${barcode}`);
      return;
    }

    // 4. Check overscan
    if (scanSession.scanned.length >= scanSession.requiredQty) {
      playError();
      toast.error("HARD_FAIL: OVER_SCAN");
      return;
    }

    const newEntry: ScanEntry = {
      serial: barcode,
      timestamp: Date.now(),
      metadata: {
        serialNo: scanSession.scanned.length + 1,
        model: scanSession.item.model || "N/A"
      }
    };

    const updatedScanned = [...scanSession.scanned, newEntry];
    playSuccess();

    if (updatedScanned.length === scanSession.requiredQty) {
      // Point 7: Line Update After Scan (Distill to full record for ledger)
      setLines(prev => prev.map(l => l.id === scanSession.lineId ? {
        ...l,
        serials: updatedScanned,
        isLocked: true
      } : l));

      toast.success(`VERIFIED: Registry Complete.`);
      setScanSession(null);
    } else {
      setScanSession(prev => prev ? { ...prev, scanned: updatedScanned } : null);
    }
  }, [scanSession, lines, inventory]);



  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F8F9FC] p-8">
      {/* Navigation & Header Actions */}
      <div className="max-w-[1600px] mx-auto space-y-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 px-2 sm:px-0">
          <div className="w-full lg:w-auto">
            <h1 className="text-3xl sm:text-5xl font-black text-[#1A1C21] tracking-tight italic leading-tight">New Purchase Order</h1>
          </div>

          {/* Header Action Row */}
          <div className="w-full lg:w-auto flex items-center gap-3 overflow-x-auto pb-4 lg:pb-0 custom-scrollbar-hide snap-x -mr-6 sm:mr-0 px-2 sm:px-0">
            <Button
              variant="secondary"
              className="flex-shrink-0 bg-white border-2 border-gray-100 text-gray-400 font-black uppercase text-[8px] sm:text-[10px] tracking-widest px-4 sm:px-8 h-10 sm:h-14 rounded-xl sm:rounded-2xl hover:bg-gray-50 transition-all italic snap-start"
              onClick={() => toast.info('Draft functionality coming soon')}
            >
              Draft Save
            </Button>
            <Button
              onClick={finalizePurchase}
              disabled={lines.length === 0 || !!scanSession}
              className={cn(
                "flex-shrink-0 bg-[#0066FF] text-white font-black uppercase text-[8px] sm:text-[10px] tracking-widest sm:tracking-[0.2em] px-6 sm:px-10 h-10 sm:h-14 rounded-xl sm:rounded-2xl shadow-[0_10px_30px_rgba(0,102,255,0.3)] hover:scale-105 transition-all flex items-center gap-2 sm:gap-3 italic snap-end",
                (lines.length === 0 || !!scanSession) && "opacity-50 grayscale cursor-not-allowed"
              )}
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 fill-white/20" />
              Finalize Order
            </Button>
          </div>
        </div>

        {/* Operational Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100/50 flex items-center gap-6 group hover:shadow-xl transition-all duration-500">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 bg-blue-50 text-blue-600">
              <Landmark className="w-8 h-8" />
            </div>
            <div className="flex-1 space-y-1 relative">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Supplier</label>
              <EntityLookup
                type="vendor"
                value={header.supplier}
                onChange={(val) => setHeader({ ...header, supplier: val })}
                onSelect={(vendor) => {
                  setHeader(prev => ({
                    ...prev,
                    supplier: vendor.name,
                  }));
                }}
                placeholder="Enter Supplier..."
                className="w-full bg-transparent text-xl font-black text-[#1A1C21] outline-none placeholder:text-gray-100"
              />
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100/50 flex items-center gap-6 group hover:shadow-xl transition-all duration-500">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 bg-indigo-50 text-indigo-600">
              <FileText className="w-8 h-8" />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Invoice Number</label>
              <input
                value={header.invoiceNumber}
                onChange={(e) => setHeader({ ...header, invoiceNumber: e.target.value })}
                className="w-full bg-transparent text-xl font-black text-[#1A1C21] outline-none placeholder:text-gray-100"
                placeholder="Enter Invoice Number..."
              />
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100/50 flex items-center gap-6 group hover:shadow-xl transition-all duration-500">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 bg-slate-50 text-slate-600">
              <Truck className="w-8 h-8" />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Warehouse</label>
              <input
                value={header.warehouse}
                onChange={(e) => setHeader({ ...header, warehouse: e.target.value })}
                className="w-full bg-transparent text-xl font-black text-[#1A1C21] outline-none placeholder:text-gray-100"
                placeholder="Enter Warehouse..."
              />
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-gray-100/50">
          <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-[#F8F9FC]/50">
            <h2 className="text-sm font-black text-[#1A1C21] uppercase tracking-[0.2em] italic">Line Items</h2>
            <button
              onClick={startAdding}
              disabled={!!pendingRow || !!scanSession}
              className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:opacity-70 transition-all disabled:opacity-20 italic"
            >
              <Plus className="w-4 h-4 bg-primary text-white rounded-full p-0.5" />
              Add Item
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {/* Table Header Labels */}
            <div className="hidden lg:grid grid-cols-12 px-10 py-6 bg-gray-50/30">
              <div className="col-span-5 text-[9px] font-black text-gray-300 uppercase tracking-widest italic">Item Name</div>
              <div className="col-span-2 text-[9px] font-black text-gray-300 uppercase tracking-widest italic text-center">Quantity</div>
              <div className="col-span-3 text-[9px] font-black text-gray-300 uppercase tracking-widest italic">Status</div>
              <div className="col-span-2 text-[9px] font-black text-gray-300 uppercase tracking-widest italic text-right">Actions</div>
            </div>

            {lines.map((l) => (
              <div key={l.id} className="group relative">
                {/* Desktop View: Row-based */}
                <div className="hidden lg:grid grid-cols-12 px-10 py-8 items-center hover:bg-gray-50/50 transition-all border-b border-gray-50">
                  <div className="col-span-5 flex flex-col justify-center">
                    <div className="space-y-1">
                      <p className="text-lg font-black text-[#1A1C21] italic truncate">{l.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{l.brand} | {l.model}</p>
                    </div>
                    {l.serials.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {l.serials.map((s, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-gray-50/50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <Barcode className="w-3 h-3 text-gray-300 flex-shrink-0" />
                            <span className="text-[10px] font-black text-gray-500 tracking-wider truncate">
                              {s.serial}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 text-center">
                    {(l.isSerialized && l.isLocked) ? (
                      <p className="text-xl font-black text-gray-400 italic">{l.qty}</p>
                    ) : (
                      <input
                        type="number"
                        value={l.qty}
                        onChange={(e) => setLines(prev => prev.map(item => item.id === l.id ? { ...item, qty: parseInt(e.target.value) || 0 } : item))}
                        className="qty-input w-full bg-transparent text-center text-xl font-black text-[#1A1C21] outline-none italic"
                      />
                    )}
                  </div>
                  <div className="col-span-3 lg:pr-10">
                    <div className="flex items-center gap-3">
                      {l.isSerialized && l.serials.length === l.qty ? (
                        <span className="text-[#0066FF] text-[10px] font-black uppercase tracking-widest italic">Verified</span>
                      ) : l.isSerialized && l.serials.length > 0 ? (
                        <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest italic">Partial</span>
                      ) : l.isSerialized ? (
                        <span className="text-red-500 text-[10px] font-black uppercase tracking-widest italic">Error</span>
                      ) : (
                        <span className="text-gray-300 text-[10px] font-black uppercase tracking-widest italic">Verified</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-end gap-3">
                    {l.isSerialized && l.serials.length < l.qty && (
                      <button onClick={() => rescanLine(l.id)} className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all">
                        <Scan className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => removeLine(l.id)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile View: Premium Stacked Card */}
                <div className="lg:hidden p-6 space-y-6 border-b border-gray-50 bg-white active:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-[#1A1C21] italic leading-tight">{l.name}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{l.brand} | {l.model}</p>
                    </div>
                    <button onClick={() => removeLine(l.id)} className="p-3 text-red-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Quantity</span>
                      {(l.isSerialized && l.isLocked) ? (
                        <span className="text-2xl font-black text-gray-400 italic tabular-nums">{l.qty}</span>
                      ) : (
                        <input
                          type="number"
                          value={l.qty}
                          onChange={(e) => setLines(prev => prev.map(item => item.id === l.id ? { ...item, qty: parseInt(e.target.value) || 0 } : item))}
                          className="w-full bg-transparent text-center text-2xl font-black text-[#1A1C21] outline-none italic tabular-nums"
                        />
                      )}
                    </div>
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Status</span>
                      {l.isSerialized && l.serials.length === l.qty ? (
                        <CheckCircle2 className="w-6 h-6 text-[#0066FF]" />
                      ) : l.isSerialized && l.serials.length > 0 ? (
                        <RefreshCw className="w-6 h-6 text-amber-500 animate-spin-slow" />
                      ) : l.isSerialized ? (
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-gray-200" />
                      )}
                    </div>
                  </div>

                  {l.isSerialized && l.serials.length < l.qty && (
                    <Button
                      onClick={() => rescanLine(l.id)}
                      className="w-full h-14 bg-amber-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3 italic"
                    >
                      <Scan className="w-5 h-5" />
                      Launch Batch Scanner
                    </Button>
                  )}

                  {l.isSerialized && l.serials.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic">Registry Captures ({l.serials.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {l.serials.slice(0, 3).map((s, idx) => (
                          <div key={idx} className="bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100 text-[10px] font-black text-[#0066FF] tracking-wider italic">
                            {s.serial}
                          </div>
                        ))}
                        {l.serials.length > 3 && (
                          <div className="px-3 py-1.5 rounded-lg border border-dashed border-gray-200 text-[10px] font-black text-gray-300 italic">
                            +{l.serials.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {pendingRow && (
              <div className="p-4 sm:p-6 bg-primary/[0.02] border-t-2 border-primary/20 animate-in slide-in-from-bottom-4 duration-300">
                <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
                  <div className="col-span-2 lg:col-span-5 space-y-2">
                    <label className="text-[9px] font-black text-primary uppercase tracking-widest italic">Item Selection</label>
                    <EntityLookup
                      type="item"
                      value={pendingRow.name}
                      onChange={(val) => setPendingRow({ ...pendingRow, name: val })}
                      onSelect={(item) => {
                        setPendingRow({
                          ...pendingRow,
                          item,
                          name: item.name,
                          price: item.purchase_price || item.price || 0,
                          isSerialized: item.is_serialized || false,
                          brand: item.brand || 'N/A',
                          model: item.model || 'N/A'
                        });
                      }}
                      placeholder="Search or Scan Item/Barcode..."
                      className="w-full h-12 bg-white border-2 border-primary/20 rounded-xl px-4 text-base font-black italic outline-none focus:border-primary transition-all shadow-sm"
                    />
                  </div>

                  <div className="col-span-1 lg:col-span-2 space-y-2">
                    <label className="text-[9px] font-black text-primary uppercase tracking-widest italic text-center block">Serial Track</label>
                    <div
                      className={cn(
                        "w-full h-12 rounded-xl flex flex-col items-center justify-center transition-all border-2",
                        pendingRow.isSerialized ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-gray-50 text-gray-300 border-gray-100"
                      )}
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest leading-none">{pendingRow.isSerialized ? 'SERIAL' : 'BATCH'}</span>
                      <span className="text-[7px] font-bold opacity-50 uppercase leading-none">MASTER_DEFINED</span>
                    </div>
                  </div>

                  <div className="col-span-1 lg:col-span-1 space-y-2">
                    <label className="text-[9px] font-black text-primary uppercase tracking-widest italic text-center block">Qty</label>
                    <input
                      type="number"
                      value={pendingRow.qty || ''}
                      onChange={(e) => setPendingRow({ ...pendingRow, qty: parseInt(e.target.value) || 0 })}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitLine(true); }}
                      className="qty-input w-full h-12 bg-white border-2 border-primary/20 rounded-xl text-center font-black text-xl outline-none focus:border-primary shadow-sm"
                    />
                  </div>

                  <div className="col-span-1 lg:col-span-2 space-y-2">
                    <label className="text-[9px] font-black text-primary uppercase tracking-widest italic block text-right">Price</label>
                    <input
                      type="number"
                      value={pendingRow.price || ''}
                      onChange={(e) => setPendingRow({ ...pendingRow, price: parseFloat(e.target.value) || 0 })}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitLine(true); }}
                      className="w-full h-12 bg-white border-2 border-primary/20 rounded-xl text-right px-4 font-black text-lg outline-none focus:border-primary shadow-sm"
                    />
                  </div>

                  <div className="col-span-1 lg:col-span-2 flex gap-2 h-12">
                    <button onClick={() => setPendingRow(null)} className="flex-1 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center">
                      <X className="w-5 h-5" />
                    </button>
                    <button onClick={() => commitLine(true)} className="flex-1 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {lines.length === 0 && !pendingRow && (
              <div className="py-32 text-center text-gray-200 font-black uppercase text-[10px] tracking-[0.5em] italic">
                <div className="flex flex-col items-center gap-6">
                  <ShoppingCart className="w-16 h-16 opacity-10" />
                  <span>Registry empty. Click &apos;+ Add Item&apos; to start.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bill Sundry / Additional Charges Section */}
        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-gray-100/50">
          <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-amber-50/20">
            <h2 className="text-sm font-black text-[#1A1C21] uppercase tracking-[0.2em] italic">Bill Sundry / Additional Charges</h2>
            <button
              onClick={() => setPendingSundry({ name: '', amount: 0, gstRate: 0, expenseId: '' })}
              disabled={!!pendingSundry || !!scanSession}
              className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest hover:opacity-70 transition-all disabled:opacity-20 italic"
            >
              <Plus className="w-4 h-4 bg-amber-500 text-white rounded-full p-0.5" />
              Add Expense
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {sundry.map((s, idx) => (
              <div key={idx} className="grid grid-cols-12 px-10 py-6 items-center hover:bg-gray-50/50 transition-all">
                <div className="col-span-5 flex items-center gap-4">
                  <Wallet className="w-5 h-5 text-gray-300" />
                  <span className="text-base font-black text-[#1A1C21] italic">{s.name}</span>
                </div>
                <div className="col-span-3">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Amount: ₹{s.amount.toLocaleString()}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-black text-amber-500 uppercase italic">GST {s.gstRate}%</span>
                </div>
                <div className="col-span-2 flex justify-end">
                  <button 
                    onClick={() => setSundry(prev => prev.filter((_, i) => i !== idx))}
                    className="p-2 text-red-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {pendingSundry && (
              <div className="p-6 bg-amber-50/30 border-t-2 border-amber-200/50 animate-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-6 space-y-2">
                    <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest italic">Expense Type</label>
                    <EntityLookup 
                      type="expense"
                      value={pendingSundry.name}
                      onChange={(val) => setPendingSundry({...pendingSundry, name: val})}
                      onSelect={(exp) => setPendingSundry({
                        ...pendingSundry,
                        name: exp.name,
                        expenseId: exp.id,
                        gstRate: exp.gst_rate || 0,
                        amount: exp.default_amount || 0
                      })}
                      placeholder="Search Transport, Installation..."
                      className="w-full h-12 bg-white border-2 border-amber-100 rounded-xl px-4 text-base font-black italic outline-none"
                    />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest italic">Amount (₹)</label>
                    <input 
                      type="number"
                      value={pendingSundry.amount || ''}
                      onChange={(e) => setPendingSundry({...pendingSundry, amount: parseFloat(e.target.value) || 0})}
                      className="w-full h-12 bg-white border-2 border-amber-100 rounded-xl px-4 text-lg font-black text-right italic outline-none"
                    />
                  </div>
                  <div className="col-span-3 flex gap-2 h-12">
                    <button onClick={() => setPendingSundry(null)} className="flex-1 bg-white border border-gray-100 text-gray-400 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center">
                      <X className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        if (!pendingSundry.expenseId) return toast.error("Select from master");
                        if (pendingSundry.amount <= 0) return toast.error("Amount must be > 0");
                        setSundry([...sundry, pendingSundry]);
                        setPendingSundry(null);
                      }}
                      className="flex-1 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 transition-all flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Section Fix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 pt-10 pb-20">
          <div className="col-span-1 lg:col-span-12 xl:col-span-7 bg-[#EDF2F7]/50 rounded-[32px] p-6 sm:p-10 space-y-6">
            <h3 className="text-xs font-black text-[#1A1C21] uppercase tracking-[0.2em] italic">Internal Notes</h3>
            <textarea
              placeholder="Type instructions for the receiving team..."
              className="w-full h-40 bg-transparent border-2 border-dashed border-gray-200/50 rounded-2xl p-6 text-sm font-bold italic outline-none focus:border-primary/30 transition-all resize-none"
              value={header.notes}
              onChange={(e) => setHeader({ ...header, notes: e.target.value })}
            />
          </div>

          <div className="col-span-1 lg:col-span-12 xl:col-span-5 flex flex-col justify-end space-y-8">
            <div className="space-y-4">
              {[
                { label: "Order Total (Est.)", value: `₹${subtotal.toLocaleString('en-IN')}`, highlight: false },
                { label: "Additional Charges", value: `₹${sundryTotal.toLocaleString('en-IN')}`, highlight: false },
                { label: "Grand Total", value: `₹${grandTotal.toLocaleString('en-IN')}`, highlight: true },
                { label: "Carrier", value: "Standard Freight", highlight: false },
                { label: "Exp. Arrival", value: "April 14, 2026", highlight: false },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-baseline border-b border-gray-100 pb-4 last:border-none gap-2 flex-wrap">
                  <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest italic">{row.label}</span>
                  <span className={cn(
                    "font-black italic text-right tabular-nums break-words",
                    row.highlight ? "text-3xl sm:text-5xl text-[#1A1C21]" : "text-sm text-gray-500"
                  )}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HIGH-PRECISION SCANNER MODAL */}
      {scanSession && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-3xl animate-in fade-in duration-500 p-2 sm:p-10">
          <div className="w-full max-w-7xl h-full sm:h-[90vh] bg-white rounded-[32px] sm:rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.4)] border border-white/20 overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 relative">

            {/* Modal Header */}
            <div className="px-6 sm:px-12 py-6 sm:py-8 border-b border-gray-100 flex flex-col justify-between bg-white gap-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <h1 className="text-2xl sm:text-4xl font-black text-[#1A1C21] italic tracking-tight">Batch Scanner</h1>
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setScanSession(null);
                      toast.warning("Session Paused. Data retained.");
                      playBeep(440, 0.1);
                    }}
                    className="bg-gray-50 text-gray-400 font-black uppercase text-[10px] tracking-widest px-4 sm:px-8 h-12 rounded-xl italic"
                  >
                    Pause
                  </Button>
                  <Button
                    onClick={() => {
                      if (scanSession.scanned.length === scanSession.requiredQty) {
                        setLines(prev => prev.map(l => l.id === scanSession.lineId ? {
                          ...l,
                          serials: scanSession.scanned,
                          isLocked: true
                        } : l));
                        toast.success(`VERIFIED: Registry Complete.`);
                        setScanSession(null);
                        setModalTab('scanner');
                      } else {
                        toast.error("HARD_FAIL: INCOMPLETE_BATCH");
                        playError();
                      }
                    }}
                    disabled={scanSession.scanned.length !== scanSession.requiredQty}
                    className={cn(
                      "bg-[#0066FF] text-white font-black uppercase text-[10px] tracking-widest px-4 sm:px-8 h-12 rounded-xl shadow-lg shadow-[#0066FF]/20 italic",
                      scanSession.scanned.length !== scanSession.requiredQty && "opacity-50 grayscale cursor-not-allowed"
                    )}
                  >
                    Commit
                  </Button>
                </div>
              </div>

              {/* Mobile Tab Switcher */}
              <div className="flex lg:hidden bg-gray-50 p-1 rounded-2xl border border-gray-100">
                <button
                  onClick={() => setModalTab('scanner')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    modalTab === 'scanner' ? "bg-white text-primary shadow-sm border border-gray-100" : "text-gray-400"
                  )}
                >
                  Scanner {modalTab === 'scanner' && "✓"}
                </button>
                <button
                  onClick={() => setModalTab('activity')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    modalTab === 'activity' ? "bg-white text-primary shadow-sm border border-gray-100" : "text-gray-400"
                  )}
                >
                  Activity {modalTab === 'activity' && "•"}
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              {/* Main Scanning View (Left) */}
              <div className={cn(
                "flex-1 p-6 sm:p-12 space-y-10 overflow-y-auto custom-scrollbar bg-[#F8F9FC]/30 min-h-0",
                modalTab !== 'scanner' && "hidden lg:block"
              )}>
                {/* Simulated Camera View */}
                <div className="relative group rounded-[40px] overflow-hidden shadow-2xl bg-black border-[12px] border-white ring-1 ring-gray-100">
                  <div className="aspect-video w-full bg-slate-900 flex items-center justify-center relative">
                    {/* Viewfinder Deco */}
                    <div className="absolute top-10 left-10 w-16 h-16 border-t-4 border-l-4 border-white/40 rounded-tl-3xl" />
                    <div className="absolute top-10 right-10 w-16 h-16 border-t-4 border-r-4 border-white/40 rounded-tr-3xl" />
                    <div className="absolute bottom-10 left-10 w-16 h-16 border-b-4 border-l-4 border-white/40 rounded-bl-3xl" />
                    <div className="absolute bottom-10 right-10 w-16 h-16 border-b-4 border-r-4 border-white/40 rounded-br-3xl" />

                    {/* Camera Placeholder Logic */}
                    <div className="text-center space-y-6 z-20">
                      <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto border border-primary/30 animate-pulse">
                        <Scan className="w-10 h-10 text-primary" />
                      </div>
                      <p className="text-white/20 font-black uppercase tracking-[0.5em] text-[10px] italic">Hardware Camera Interface : {scanSession.item.name}</p>
                    </div>

                    {/* Animated Laser Line */}
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                      <div className="w-3/4 h-[2px] bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)] animate-scan-line" />
                    </div>


                    <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 flex items-center gap-3">
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">{scanSession.scanned.length} / {scanSession.requiredQty}</span>
                    </div>
                  </div>

                  {/* Invisible Input for Scanner Logic */}
                  <input
                    id="scanner-capture-input"
                    autoFocus
                    className="absolute inset-0 opacity-0 cursor-default"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          handleSessionScan(val);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                      if (e.key === 'Escape') setScanSession(null);
                      if (e.key === 'Delete') removeLastSerial();
                    }}
                  />
                </div>

                {/* Manual Entry Fallback */}
                <div className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm border border-gray-100 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="text-lg sm:text-xl font-black text-[#1A1C21] italic">Manual Override</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Use if barcode is unreadable</p>
                    </div>
                    <QrCode className="w-5 h-5 text-gray-200" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 manual-input-zone">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        id="manual-serial-input"
                        placeholder="serial number"
                        className="w-full h-16 bg-gray-50/50 border-2 border-gray-100 rounded-2xl px-6 pr-32 font-black italic text-lg outline-none focus:border-primary transition-all"
                        value={manualSerial}
                        onChange={(e) => setManualSerial(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = manualSerial.trim();
                            if (val) {
                              handleSessionScan(val);
                              setManualSerial('');
                              // Snap focus back to hidden input after manual log
                              setTimeout(() => document.getElementById('scanner-capture-input')?.focus(), 10);
                            }
                          }
                        }}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        const val = manualSerial.trim();
                        if (val) {
                          handleSessionScan(val);
                          setManualSerial('');
                          setTimeout(() => document.getElementById('scanner-capture-input')?.focus(), 10);
                        }
                      }}
                      className="h-16 px-10 bg-white border-2 border-gray-100 text-[#1A1C21] font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-gray-50 transition-all shadow-sm italic"
                    >
                      Log Serial
                    </Button>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-8 bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm border border-gray-100">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <h3 className="text-lg sm:text-xl font-black text-[#1A1C21] italic">Batch Status</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active session analysis</p>
                    </div>
                    <div className="text-right">
                      <span className="text-primary font-black italic text-2xl sm:text-4xl">{scanSession.scanned.length}</span>
                      <span className="text-gray-300 font-black italic text-base sm:text-lg ml-2">/ {scanSession.requiredQty}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-1 gap-6 sm:gap-10 pt-4">
                    {[
                      { label: "Items Scanned", val: scanSession.scanned.length },
                    ].map((stat, i) => (
                      <div key={i} className="border-l border-gray-100 pl-8 space-y-2">
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{stat.label}</p>
                        <p className="text-4xl font-black text-[#1A1C21] italic tracking-tighter">{stat.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Details & Activity (Right) */}
              <div className={cn(
                "w-full lg:w-[450px] border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col bg-white shrink-0 overflow-hidden",
                modalTab !== 'activity' && "hidden lg:flex"
              )}>
                {/* Batch Details Section */}
                <div className="p-6 sm:p-10 border-b border-gray-100 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-[#1A1C21] uppercase tracking-[0.2em] italic">Active Batch Details</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "Destination", value: header.warehouse },
                      { label: "Priority Level", value: "High Priority", badge: true },
                      { label: "Operator ID", value: "#EXP-4491" },
                      { label: "Current Value", value: `₹${(scanSession.scanned.length * scanSession.item.price).toLocaleString('en-IN')}`, highlight: true },
                    ].map((detail, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-[11px] font-black text-gray-400 italic">{detail.label}</span>
                        {detail.badge ? (
                          <span className="bg-orange-50 text-orange-600 px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic">{detail.value}</span>
                        ) : (
                          <span className={cn("text-sm font-black italic", detail.highlight ? "text-[#0066FF]" : "text-[#1A1C21]")}>{detail.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button className="w-full h-14 bg-blue-50 text-[#0066FF] border border-blue-100 rounded-xl font-black uppercase tracking-widest text-[10px] italic hover:bg-blue-100 transition-all flex items-center justify-center gap-3">
                    Export Manifest (CSV)
                  </Button>
                </div>

                {/* Scan Activity */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-[300px]">
                  <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-gray-100 bg-gray-50/30">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] italic">Scan Table</h3>
                  </div>
                  <div className="flex-1 overflow-auto custom-scrollbar bg-white">
                    <div className="min-w-[500px] lg:min-w-0">
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-gray-50 z-10">
                          <tr className="border-b border-gray-100">
                            <th className="px-4 sm:px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Item Name</th>
                            <th className="px-4 sm:px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest italic text-center">Serial No</th>
                            <th className="px-4 sm:px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Barcode</th>
                            <th className="px-4 sm:px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Model</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {scanSession.scanned.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-20 text-center">
                                <div className="flex flex-col items-center justify-center text-gray-200 gap-4 opacity-50 italic">
                                  <QrCode className="w-12 h-12" />
                                  <p className="text-[10px] font-black uppercase tracking-widest">Waiting for first capture...</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            [...scanSession.scanned].reverse().map((entry, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50 transition-all animate-in slide-in-from-right-4 duration-300">
                                <td className="px-4 sm:px-6 py-4 text-[10px] font-black text-gray-800 italic uppercase">{scanSession.item.name}</td>
                                <td className="px-4 sm:px-6 py-4 text-[10px] font-black text-gray-400 italic text-center">#{entry.metadata?.serialNo ?? '-'}</td>
                                <td className="px-4 sm:px-6 py-4 text-[11px] font-black text-[#0066FF] tracking-widest">{entry.serial}</td>
                                <td className="px-4 sm:px-6 py-4 text-[10px] font-bold text-gray-500 uppercase">{entry.metadata?.model ?? 'N/A'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="p-8 border-t border-gray-100 text-center bg-gray-50/50">
                    <div className="flex justify-between items-center px-4">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">
                        Status: <span className={scanSession.scanned.length === scanSession.requiredQty ? "text-[#0066FF]" : "text-amber-500"}>
                          {scanSession.scanned.length === scanSession.requiredQty ? "VERIFIED" : "IN_PROGRESS"}
                        </span>
                      </p>
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                        PROGRESS: {((scanSession.scanned.length / scanSession.requiredQty) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* DUPLICATE ERROR OVERLAY */}
      {duplicateError && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#1A1C21]/60 backdrop-blur-3xl animate-in fade-in duration-300 p-4">
          <div className="w-full max-w-[600px] bg-white rounded-[32px] sm:rounded-[40px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-4 border-red-500/20 overflow-hidden flex flex-col items-center p-8 sm:p-12 space-y-6 sm:space-y-8 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-50 rounded-full flex items-center justify-center border-4 border-red-100 animate-bounce">
              <X className="w-10 h-10 sm:w-12 sm:h-12 text-red-500" />
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1C21] italic uppercase tracking-tight">Duplicate Item Detected</h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] italic">Barcode: {duplicateError.split(': ')[1]}</p>
              <p className="text-red-500 font-black uppercase text-xs tracking-widest bg-red-50 px-6 py-2 rounded-xl inline-block">Cannot be added!</p>
            </div>
            <div className="w-full bg-slate-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center gap-2">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic text-center">Reason</p>
              <p className="text-sm font-black text-gray-600 italic">{duplicateError.split(': ')[0].replace(/_/g, ' ')}</p>
            </div>
            <Button
              onClick={() => setDuplicateError(null)}
              className="w-full h-16 bg-[#1A1C21] text-white font-black uppercase text-xs tracking-[0.3em] rounded-2xl hover:bg-black transition-all shadow-xl italic"
            >
              Acknowledge & Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Hash({ className }: { className?: string }) {
  return <span className={className}>#</span>
}

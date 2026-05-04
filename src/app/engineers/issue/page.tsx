"use client"

import React, { useState, useMemo, useEffect, useCallback, Suspense, useRef } from 'react'
import {
    Plus,
    Trash2,
    CheckCircle2,
    X,
    Scan,
    Barcode,
    User,
    Package,

} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useData, InventoryItem } from '@/lib/context/DataContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { EntityLookup } from '@/components/shared/EntityLookup'
import { useRouter, useSearchParams } from 'next/navigation'

// UI Enhancement Sounds
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

interface IssueLine {
    id: string
    productId: string
    name: string
    category: string
    qty: number
    model: string
    brand: string
    isSerialized: boolean
    serials: string[]
    isLocked: boolean
}

function EngineerIssueContent() {
    const { inventory, engineers, issueToEngineer, processBarcode, verifySerialForIssue } = useData()
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const [selectedEngineerId, setSelectedEngineerId] = useState(searchParams.get('id') || '')
    const [ticketId, setTicketId] = useState('')
    const [customerName, setCustomerName] = useState('')
    const [lines, setLines] = useState<IssueLine[]>([])
    
    const { tickets, getAvailableStock, transactions } = useData()

    // Step 2: Bidirectional Auto-fetch
    useEffect(() => {
        if (ticketId) {
            // 1. Get Customer from Master Ticket
            const t = tickets.find(x => x.id === ticketId);
            if (t) {
                setCustomerName(t.customer_name || '');
            }

            // 2. Try to find Engineer from existing transactions for this ticket
            const existingTxn = transactions.find(tx => (tx.ticket_id === ticketId || tx.reference === ticketId) && tx.engineer_id && tx.engineer_id !== 'N/A');
            if (existingTxn && !selectedEngineerId) {
                setSelectedEngineerId(existingTxn.engineer_id || '');
            }
        }
    }, [ticketId, tickets, transactions, selectedEngineerId]);

    // Reverse: Engineer -> Last Ticket
    useEffect(() => {
        if (selectedEngineerId && !ticketId) {
            const lastTicketTxn = [...transactions].reverse().find(tx => tx.engineer_id === selectedEngineerId && (tx.ticket_id || tx.reference));
            if (lastTicketTxn) {
                setTicketId(lastTicketTxn.ticket_id || lastTicketTxn.reference || '');
            }
        }
    }, [selectedEngineerId, transactions, ticketId]);

    const [pendingRow, setPendingRow] = useState<{
        item: InventoryItem | null,
        name: string,
        category: string,
        qty: number,
        isSerialized: boolean,
        model: string,
        brand: string
    } | null>(null)

    const [scanSession, setScanSession] = useState<{
        lineId: string,
        item: IssueLine,
        requiredQty: number,
        scanned: string[],
        manualValue?: string
    } | null>(null)

    const [duplicateError, setDuplicateError] = useState<string | null>(null)

    const selectedEngineer = useMemo(() => engineers.find(e => e.id === selectedEngineerId), [engineers, selectedEngineerId])

    const removeLastSerial = useCallback(() => {
        if (!scanSession || scanSession.scanned.length === 0) return;
        setScanSession({ ...scanSession, scanned: scanSession.scanned.slice(0, -1) });
    }, [scanSession]);

    const finalizeIssue = useCallback(async () => {
        if (!ticketId) return toast.error("Ticket No is required");
        if (!selectedEngineerId) return toast.error("Select an engineer first");
        if (lines.length === 0) return toast.error("No items to issue");
        
        for (const line of lines) {
            if (line.isSerialized && line.serials.length !== line.qty) {
                return toast.error(`MISMATCH: ${line.name} requires ${line.qty} scans`);
            }
        }

        try {
            await toast.promise(issueToEngineer(selectedEngineerId, lines, { 
                ticket_id: ticketId, 
                customer_name: customerName 
            }), {
                loading: 'Recording Outward Movement...',
                success: 'OUTWARD COMMITTED: Inventory Assigned',
                error: (err: Error) => err.message || 'Issuance Failed'
            });
            router.push('/engineers');
        } catch (e) {}
    }, [selectedEngineerId, ticketId, customerName, lines, issueToEngineer, router]);

    const scanRef = useRef<HTMLInputElement>(null);

    // Focus Guard
    useEffect(() => {
        if (scanSession) {
            console.log("[SCANNER] Issue Scan Session Active - Initial Focus");
            setTimeout(() => scanRef.current?.focus(), 100);
        }
    }, [scanSession])

    // Global Shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (scanSession) {
                if (e.key === 'Escape') setScanSession(null);
                if (e.key === 'Delete') removeLastSerial();
            } else {
                if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    finalizeIssue();
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
    }, [scanSession, lines, selectedEngineerId, removeLastSerial, finalizeIssue])

    const startAdding = () => {
        setPendingRow({ item: null, name: '', category: '', qty: 1, isSerialized: false, model: 'N/A', brand: 'N/A' })
    }

    const triggerScan = useCallback((lineId: string, customLines?: IssueLine[]) => {
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
    }, [lines]);

    const commitLine = useCallback((autoScan = false) => {
        if (!pendingRow || !pendingRow.name || pendingRow.qty <= 0) return;
        
        // Step 5: Stock Validation
        if (pendingRow.item) {
            const available = getAvailableStock(pendingRow.item.id).length;
            if (pendingRow.qty > available) {
                playError();
                toast.error(`NOT ENOUGH STOCK: ${pendingRow.name} (Available: ${available})`);
                return;
            }
        }

        const newLine: IssueLine = {
            id: Date.now().toString(),
            productId: pendingRow.item?.id || 'MANUAL_ENTRY',
            name: pendingRow.item?.name || pendingRow.name,
            category: pendingRow.item?.category || pendingRow.category,
            brand: pendingRow.item?.brand || pendingRow.brand || 'N/A',
            model: pendingRow.item?.model || pendingRow.model || 'N/A',
            qty: pendingRow.qty,
            isSerialized: pendingRow.isSerialized,
            serials: [],
            isLocked: false
        }

        const updatedLines = [...lines, newLine];
        setLines(updatedLines);
        setPendingRow(null);
        toast.success(`ADDED: ${newLine.name}`);

        if (autoScan && newLine.isSerialized) {
            setTimeout(() => triggerScan(newLine.id, updatedLines), 10);
        }
    }, [pendingRow, lines, triggerScan, getAvailableStock]);

    const handleSessionScan = (barcode: string) => {
        if (!scanSession || !barcode) return;

        // 1. Session Duplicate
        if (scanSession.scanned.includes(barcode)) {
            playError();
            setDuplicateError(`DUPLICATE_IN_SESSION: ${barcode}`);
            return;
        }

        // 2. Global Batch Duplicate
        if (lines.some(l => l.serials.includes(barcode))) {
            playError();
            setDuplicateError(`DUPLICATE_IN_BATCH: ${barcode}`);
            return;
        }

        // 3. Ledger Availability Check (CRITICAL)
        try {
            verifySerialForIssue(barcode, scanSession.item.productId);
        } catch (e: any) {
            playError();
            setDuplicateError(e.message || "INVALID_SERIAL");
            return;
        }

        if (scanSession.scanned.length >= scanSession.requiredQty) {
            playError();
            toast.error("HARD_FAIL: OVER_SCAN");
            return;
        }

        const updatedScanned = [...scanSession.scanned, barcode];
        playSuccess();

        if (updatedScanned.length === scanSession.requiredQty) {
            setLines(prev => prev.map(l => l.id === scanSession.lineId ? { ...l, serials: updatedScanned, isLocked: true } : l));
            toast.success("VERIFIED: Serials Captured");
            setScanSession(null);
        } else {
            setScanSession(prev => prev ? { ...prev, scanned: updatedScanned } : null);
        }
    }



    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F8F9FC] p-4 sm:p-8">
            <div className="max-w-[1600px] mx-auto space-y-8 sm:space-y-12">
                
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 px-2 sm:px-0">
                    <div className="w-full lg:w-auto">
                        <h1 className="text-3xl sm:text-5xl font-black text-[#1A1C21] tracking-tight italic leading-tight">Issue Inventory</h1>
                    </div>
                    
                    {/* Header Action Row */}
                    <div className="w-full lg:w-auto flex items-center gap-3 overflow-x-auto pb-4 lg:pb-0 custom-scrollbar-hide snap-x -mr-6 sm:mr-0 px-2 sm:px-0">
                        <Button
                            variant="secondary"
                            onClick={() => router.back()}
                            className="flex-shrink-0 bg-white border-2 border-gray-100 text-gray-400 font-black uppercase text-[8px] sm:text-[10px] tracking-widest px-4 sm:px-8 h-10 sm:h-14 rounded-xl sm:rounded-2xl hover:bg-gray-50 transition-all italic snap-start"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={finalizeIssue}
                            disabled={lines.length === 0}
                            className={cn(
                                "flex-shrink-0 bg-[#0066FF] text-white font-black uppercase text-[8px] sm:text-[10px] tracking-widest sm:tracking-[0.2em] px-6 sm:px-10 h-10 sm:h-14 rounded-xl sm:rounded-2xl shadow-[0_10px_30px_rgba(0,102,255,0.3)] hover:scale-105 transition-all flex items-center gap-2 sm:gap-3 italic snap-end",
                                lines.length === 0 && "opacity-50 grayscale cursor-not-allowed"
                            )}
                        >
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            Confirm Issue
                        </Button>
                    </div>
                </div>

                {/* Header Fields - Step 1 */}
                <div className="bg-white p-6 sm:p-10 rounded-[40px] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic ml-1">Ticket Reference <span className="text-red-500">*</span></label>
                        <EntityLookup
                            type="ticket"
                            value={ticketId}
                            onChange={setTicketId}
                            onSelect={(t) => setTicketId(t.id)}
                            placeholder="SEARCH TICKET..."
                            className="h-14 bg-gray-50 border-none rounded-2xl px-6 font-black italic text-blue-900"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic ml-1">Customer / Project</label>
                        <EntityLookup
                            type="contact"
                            contactFilter="CLIENT"
                            value={customerName}
                            onChange={setCustomerName}
                            onSelect={(c) => setCustomerName(c.name)}
                            placeholder="CUSTOMER NAME..."
                            className="h-14 bg-gray-50 border-none rounded-2xl px-6 font-black italic text-gray-600"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic ml-1">Assigning To Engineer <span className="text-red-500">*</span></label>
                        <select
                            value={selectedEngineerId}
                            onChange={(e) => setSelectedEngineerId(e.target.value)}
                            className="w-full h-14 bg-gray-50 border-none rounded-2xl px-6 font-black italic text-emerald-900 outline-none appearance-none"
                        >
                            <option value="">Select Personnel...</option>
                            {engineers.map(e => (
                                <option key={e.id} value={e.id}>{e.name} ({e.type || 'Field'})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Line Items */}
                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-[#F8F9FC]/50">
                        <h2 className="text-sm font-black text-[#1A1C21] uppercase tracking-[0.2em] italic">Issue Manifest</h2>
                        <button
                            onClick={startAdding}
                            disabled={!!pendingRow || !!scanSession}
                            className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:opacity-70 transition-all disabled:opacity-20 italic"
                        >
                            <Plus className="w-4 h-4 bg-primary text-white rounded-full p-0.5" />
                            Add Item
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-12 py-8 text-left text-xs font-black text-gray-400 uppercase tracking-widest italic w-[45%]">Item Identity</th>
                                    <th className="px-8 py-8 text-center text-xs font-black text-gray-400 uppercase tracking-widest italic w-[15%]">Qty</th>
                                    <th className="px-8 py-8 text-center text-xs font-black text-gray-400 uppercase tracking-widest italic w-[25%]">Status / Scans</th>
                                    <th className="px-12 py-8 text-right text-xs font-black text-gray-400 uppercase tracking-widest italic w-[15%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {lines.map((l) => (
                                    <tr key={l.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-12 py-10">
                                            <div className="space-y-2">
                                                <p className="text-2xl font-black text-[#1A1C21] italic tracking-tight truncate leading-none">{l.name}</p>
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{l.category} | {l.brand} | {l.model}</p>
                                            </div>
                                            {l.isSerialized && l.serials.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {l.serials.map((s, idx) => (
                                                        <div key={idx} className="bg-primary/5 px-2 py-1 rounded-md border border-primary/10 flex items-center gap-1.5">
                                                            <Barcode className="w-2.5 h-2.5 text-primary" />
                                                            <span className="text-[9px] font-black text-primary tracking-wider">{s}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-10 text-center">
                                            <input
                                                type="number"
                                                value={l.qty}
                                                onChange={(e) => setLines(prev => prev.map(item => item.id === l.id ? { ...item, qty: parseInt(e.target.value) || 0 } : item))}
                                                className="w-24 h-16 bg-gray-50/50 rounded-2xl text-center text-3xl font-black text-[#1A1C21] outline-none border border-transparent focus:border-primary/20 transition-all"
                                            />
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col items-center gap-2">
                                                {l.isSerialized ? (
                                                    <>
                                                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(l.serials.length / l.qty) * 100}%` }} />
                                                        </div>
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">{l.serials.length} / {l.qty} Scanned</span>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest italic flex items-center gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-12 py-10 text-right">
                                            <div className="flex justify-end gap-3">
                                                {l.isSerialized && l.serials.length < l.qty && (
                                                    <button onClick={() => triggerScan(l.id)} className="p-4 bg-primary text-white rounded-2xl hover:scale-110 transition-all shadow-lg shadow-primary/20">
                                                        <Scan className="w-6 h-6" />
                                                    </button>
                                                )}
                                                <button onClick={() => setLines(lines.filter(item => item.id !== l.id))} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                                                    <Trash2 className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {pendingRow && (
                                    <tr className="bg-primary/[0.03] border-y-4 border-primary/20 animate-in slide-in-from-bottom-4 duration-500">
                                        <td className="px-12 py-12">
                                            <EntityLookup
                                                type="item"
                                                value={pendingRow.name}
                                                onChange={(val) => setPendingRow({ ...pendingRow, name: val })}
                                                onSelect={(item) => setPendingRow({ 
                                                    ...pendingRow, 
                                                    item,
                                                    name: item.name, 
                                                    category: item.category,
                                                    isSerialized: !!item.is_serialized,
                                                    brand: item.brand,
                                                    model: item.model
                                                })}
                                                placeholder="SEARCH ITEM TO ISSUE..."
                                                className="w-full h-20 bg-white border-2 border-primary/10 rounded-[28px] px-8 font-black italic outline-none focus:border-primary text-xl shadow-xl"
                                            />
                                        </td>
                                        <td className="px-8 py-12 text-center">
                                            <input
                                                type="number"
                                                value={pendingRow.qty}
                                                onChange={(e) => setPendingRow({...pendingRow, qty: parseInt(e.target.value) || 0})}
                                                className="w-28 h-20 bg-white border-2 border-primary/10 rounded-[28px] text-center text-4xl font-black outline-none shadow-xl focus:border-primary"
                                            />
                                        </td>
                                        <td className="px-8 py-12 text-center text-xs font-black text-gray-400 uppercase tracking-widest italic">
                                            Awaiting Entry...
                                        </td>
                                        <td className="px-12 py-12 text-right">
                                            <div className="flex justify-end gap-4">
                                                <button onClick={() => setPendingRow(null)} className="h-20 w-20 bg-red-50 text-red-500 rounded-[28px] flex items-center justify-center hover:bg-red-100 transition-all border-2 border-red-100 shadow-lg"><X className="w-8 h-8" /></button>
                                                <button onClick={() => commitLine(true)} className="h-20 w-20 bg-primary text-white rounded-[28px] flex items-center justify-center shadow-[0_20px_50px_rgba(0,102,255,0.3)] hover:scale-105 transition-all"><CheckCircle2 className="w-8 h-8" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* SCANNER MODAL */}
            {scanSession && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-3xl p-2 sm:p-10 animate-in fade-in duration-300 overflow-y-auto">
                    <div className="w-full max-w-7xl h-fit min-h-[calc(100vh-1rem)] lg:min-h-0 lg:h-[85vh] bg-white rounded-[32px] sm:rounded-[48px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 relative">
                        <div className="px-6 sm:px-12 py-6 sm:py-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Scan className="w-6 h-6" /></div>
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-[#1A1C21] italic tracking-tight">Assigning Serials</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{scanSession.item.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setScanSession(null)} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all self-end sm:self-auto"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden italic min-h-0">
                            {/* Scanning View */}
                            <div className="flex-1 p-6 sm:p-12 bg-gray-50/50 flex flex-col gap-8 sm:gap-10 overflow-y-auto min-h-0 custom-scrollbar">
                                <div className="relative aspect-video bg-black rounded-[32px] sm:rounded-[40px] overflow-hidden border-[8px] sm:border-[10px] border-white shadow-xl flex items-center justify-center">
                                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                                        <div className="w-4/5 h-[2px] bg-red-500 shadow-[0_0_20px_red] animate-scan-line" />
                                    </div>
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-pulse"><Scan className="w-8 h-8 sm:w-10 sm:h-10 text-primary" /></div>
                                        <p className="text-white/30 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">Scanner Interface Active</p>
                                    </div>
                                    <input
                                        ref={scanRef}
                                        className="absolute inset-0 opacity-0 cursor-default"
                                        onBlur={() => {
                                            if (scanSession) {
                                                console.log("[SCANNER] Modal Blur - Refocusing...");
                                                setTimeout(() => scanRef.current?.focus(), 10);
                                            }
                                        }}
                                        onChange={(e) => {
                                            console.log("[SCANNER] Input Typing (Issue):", e.target.value);
                                        }}
                                        onKeyDown={(e) => {
                                            console.log("[SCANNER] Key Pressed (Issue):", e.key);
                                            if (e.key === 'Enter') {
                                                const val = (e.target as HTMLInputElement).value.trim();
                                                if (val) handleSessionScan(val);
                                                (e.target as HTMLInputElement).value = '';
                                                // Force refocus after scan
                                                setTimeout(() => scanRef.current?.focus(), 50);
                                            }
                                        }}
                                    />
                                </div>

                                <div className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-gray-100 shadow-sm space-y-6 sm:space-y-8">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <h3 className="text-lg sm:text-xl font-black text-[#1A1C21]">Batch Progress</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verify serial count matches qty</p>
                                        </div>
                                        <p className="text-3xl sm:text-4xl font-black text-primary italic">{scanSession.scanned.length} <span className="text-gray-200 text-xl sm:text-2xl">/ {scanSession.requiredQty}</span></p>
                                    </div>
                                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(scanSession.scanned.length / scanSession.requiredQty) * 100}%` }} />
                                    </div>
                                </div>
                            </div>


                            <div className="w-full lg:w-[450px] border-t lg:border-t-0 lg:border-l border-gray-100 bg-white flex flex-col shrink-0 min-h-[300px]">
                                <div className="p-8 border-b border-gray-100"><h3 className="text-xs font-black text-gray-300 uppercase tracking-widest">Captured Serials</h3></div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {scanSession.scanned.map((s, idx) => (
                                        <div key={idx} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                                                <span className="text-sm font-black text-[#1A1C21] tracking-widest">{s}</span>
                                            </div>
                                            <button onClick={() => removeLastSerial()} className="opacity-0 group-last:opacity-100 text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    {scanSession.scanned.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center opacity-20 py-20"><Barcode className="w-12 h-12 mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">Waiting for first scan...</p></div>
                                    )}
                                </div>
                                <div className="p-8 border-t border-gray-100">
                                    <Button
                                        onClick={() => setScanSession(null)}
                                        disabled={scanSession.scanned.length !== scanSession.requiredQty}
                                        className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest italic"
                                    >
                                        Seal Manifest
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DUPLICATE ERROR OVERLAY */}
            {duplicateError && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#1A1C21]/60 backdrop-blur-3xl p-4">
                    <div className="w-full max-w-[600px] bg-white rounded-[40px] p-12 text-center space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl">
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto border-4 border-red-100 shadow-xl animate-bounce">
                            <X className="w-12 h-12 text-red-500" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-[#1A1C21] italic uppercase">Validation Error</h2>
                            <p className="text-red-500 font-bold bg-red-50 px-6 py-2 rounded-xl inline-block text-xs tracking-widest uppercase">{duplicateError.split(':')[0]}</p>
                            <p className="text-gray-400 font-black text-sm tracking-wider block">{duplicateError.split(':')[1]}</p>
                        </div>
                        <Button 
                            onClick={() => setDuplicateError(null)}
                            className="w-full h-16 bg-[#1A1C21] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-all"
                        >
                            Acknowledge & Retry
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function EngineerIssuePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>}>
            <EngineerIssueContent />
        </Suspense>
    )
}

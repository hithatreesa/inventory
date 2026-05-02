"use client"

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
    CheckCircle2,
    X,
    Scan,
    Trash2,
    Package,
    Navigation,
    Barcode,
    Activity,
    AlertCircle,
    ArrowLeft,
    ClipboardCheck,
    Search,
    Filter
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useData } from '@/lib/context/DataContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const playBeep = (freq = 880, duration = 0.1) => {
    if (typeof window === 'undefined') return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + duration);
}

const playError = () => playBeep(220, 0.4);
const playSuccess = () => playBeep(880, 0.1);

export default function StockAuditPage() {
    const { getAuditReport, processBarcode } = useData()
    const router = useRouter()
    
    const [scannedSerials, setScannedSerials] = useState<string[]>([])
    const [duplicateError, setDuplicateError] = useState<string | null>(null)
    const [auditActive, setAuditActive] = useState(false)
    const [viewFilter, setViewFilter] = useState<'ALL' | 'MISSING' | 'EXTRA' | 'MATCHED'>('ALL')

    const report = useMemo(() => getAuditReport(scannedSerials), [scannedSerials, getAuditReport])
    const scanRef = useRef<HTMLInputElement>(null);

    // Focus Guard
    useEffect(() => {
        if (auditActive) {
            console.log("[SCANNER] Audit Active - Initial Focus");
            setTimeout(() => scanRef.current?.focus(), 100);
        }
    }, [auditActive])

    // Keyboard Shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                finalizeAudit();
            }
            if (e.key === 'Escape') setAuditActive(false);
            if (e.key === 'Delete' && scannedSerials.length > 0) {
                setScannedSerials(prev => prev.slice(0, -1));
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [scannedSerials])

    const handleScan = (barcode: string) => {
        console.log("[SCANNER] Audit Scan:", barcode);
        if (!barcode) return;

        // 1. Validation: Duplicate physical scan?
        if (scannedSerials.includes(barcode)) {
            console.log("[SCANNER] Duplicate Local Scan:", barcode);
            playError();
            setDuplicateError(`DUPLICATE_PHYSICAL_SCAN: ${barcode} already recorded in this session.`);
            return;
        }

        // 2. Validation: Unknown serial found? (Optional strict rule)
        const item = processBarcode(barcode);
        if (!item) {
             console.log("[SCANNER] Unknown Item Blocked:", barcode);
             playError();
             setDuplicateError(`UNKNOWN_SERIAL_FOUND: Barcode ${barcode} does not exist in the system ledger.`);
             return;
        }

        playSuccess();
        setScannedSerials(prev => [...prev, barcode]);
        console.log("[SCANNER] Scan Success. Refocusing...");
        setTimeout(() => scanRef.current?.focus(), 50);
    }

    const removeSerial = (serial: string) => {
        setScannedSerials(prev => prev.filter(s => s !== serial));
    }

    const finalizeAudit = () => {
        if (scannedSerials.length === 0) return toast.error("No items scanned for audit");
        toast.success("Audit Recorded Globally");
        router.push('/inventory');
    }

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F8F9FC] p-4 sm:p-8 italic">
            <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                    <div className="space-y-2">
                        <button 
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="w-3 h-3" /> Back to Inventory
                        </button>
                        <h1 className="text-3xl sm:text-5xl font-black text-[#1A1C21] tracking-tight italic uppercase underline decoration-primary/10 decoration-8">Physical Stock Audit</h1>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-2">
                            <Activity className="w-3 h-3 text-primary animate-pulse" /> Live Ledger Verification
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            onClick={finalizeAudit}
                            disabled={scannedSerials.length === 0}
                            className={cn(
                                "bg-[#1A1C21] text-white font-black uppercase text-[10px] tracking-[0.2em] px-10 h-14 rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-3 italic",
                                scannedSerials.length === 0 && "opacity-50 grayscale cursor-not-allowed"
                            )}
                        >
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                            Finalize Audit
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left: Stats & Controls */}
                    <div className="lg:col-span-12 xl:col-span-4 space-y-8">
                        
                        {/* Audit KPI Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">System Record</p>
                                <p className="text-3xl font-black text-[#1A1C21] tabular-nums mt-2">{report.totalSystem}</p>
                            </div>
                            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Physical Count</p>
                                <p className="text-3xl font-black text-primary tabular-nums mt-2">{report.totalScanned}</p>
                            </div>
                            <div className="bg-red-50 p-6 rounded-[32px] border border-red-100 flex flex-col justify-between">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none">Missing Assets</p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <p className="text-3xl font-black text-red-600 tabular-nums">{report.missingSerials.length}</p>
                                    <span className="text-[10px] font-black text-red-300 uppercase italic tracking-widest">Mismatch</span>
                                </div>
                            </div>
                            <div className="bg-orange-50 p-6 rounded-[32px] border border-orange-100 flex flex-col justify-between">
                                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-none">Extra Found</p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <p className="text-3xl font-black text-orange-600 tabular-nums">{report.extraSerials.length}</p>
                                    <span className="text-[10px] font-black text-orange-300 uppercase italic tracking-widest">Untracked</span>
                                </div>
                            </div>
                        </div>

                        {/* Scanner Activation Card */}
                        <div className={cn(
                            "group rounded-[48px] p-12 border-4 transition-all duration-500 cursor-pointer relative overflow-hidden",
                            auditActive 
                                ? "bg-primary border-primary shadow-[0_30px_60px_-12px_rgba(0,102,255,0.4)]" 
                                : "bg-white border-gray-100 hover:border-primary/20"
                        )} onClick={() => setAuditActive(true)}>
                            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                <div className={cn(
                                    "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500",
                                    auditActive ? "bg-white text-primary" : "bg-primary/10 text-primary group-hover:scale-110"
                                )}>
                                    <Scan className={cn("w-10 h-10", auditActive && "animate-pulse")} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className={cn("text-xl font-black italic uppercase", auditActive ? "text-white" : "text-[#1A1C21]")}>
                                        {auditActive ? 'Scanning Active' : 'Start Audit Scan'}
                                    </h3>
                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest", auditActive ? "text-white/60" : "text-gray-400")}>
                                        Hardware scanner focus enabled
                                    </p>
                                </div>
                            </div>
                            <input
                                ref={scanRef}
                                className="absolute inset-0 opacity-0 cursor-default"
                                tabIndex={-1}
                                onBlur={() => {
                                    if (auditActive) {
                                        console.log("[SCANNER] Blur detected, refocusing...");
                                        setTimeout(() => scanRef.current?.focus(), 10);
                                    }
                                }}
                                onChange={(e) => {
                                    console.log("[SCANNER] Input Typing (Audit):", e.target.value);
                                }}
                                onKeyDown={(e) => {
                                    console.log("[SCANNER] Key Pressed (Audit):", e.key);
                                    if (e.key === 'Enter') {
                                        handleScan((e.target as HTMLInputElement).value.trim());
                                        (e.target as HTMLInputElement).value = '';
                                    }
                                }}
                            />
                        </div>

                    </div>

                    {/* Right: Mismatch Manifest */}
                    <div className="lg:col-span-12 xl:col-span-8 bg-white rounded-[48px] shadow-sm border border-gray-100 flex flex-col min-h-[700px] overflow-hidden">
                        <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-[#F8F9FC]/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                                    <ClipboardCheck className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-[#1A1C21] uppercase tracking-[0.2em]">Discrepancy Manifest</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 italic">Physical vs System Overlay</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                                {['ALL', 'MATCHED', 'MISSING', 'EXTRA'].map(f => (
                                    <button 
                                        key={f}
                                        onClick={() => setViewFilter(f as any)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all italic",
                                            viewFilter === f ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:bg-gray-50"
                                        )}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white z-10">
                                    <tr className="border-b border-gray-50">
                                        <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Serial Number</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest italic text-center">Status</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest italic text-right">Audit Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {/* Handle empty scan state */}
                                    {scannedSerials.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-32 text-center opacity-10 italic">
                                                <Package className="w-20 h-20 mx-auto mb-4" />
                                                <p className="text-sm font-black uppercase tracking-[0.5em]">System Waiting for First Scan</p>
                                            </td>
                                        </tr>
                                    )}

                                    {/* Mismatch Items (Missing) */}
                                    {(viewFilter === 'ALL' || viewFilter === 'MISSING') && report.missingSerials.map((s: string) => (
                                        <tr key={s} className="hover:bg-red-50/30 transition-colors group">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-red-50 text-red-300 rounded-xl flex items-center justify-center font-black text-xs italic group-hover:bg-white transition-colors">!</div>
                                                    <span className="text-sm font-black text-[#1A1C21] tracking-widest tabular-nums italic">{s}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <span className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest italic">Not Scanned</span>
                                            </td>
                                            <td className="px-10 py-6 text-right font-black text-[10px] text-red-400 uppercase tracking-widest italic animate-pulse">Missing Item</td>
                                        </tr>
                                    ))}

                                    {/* Extra Items (Extra) */}
                                    {(viewFilter === 'ALL' || viewFilter === 'EXTRA') && report.extraSerials.map((s: string) => (
                                        <tr key={s} className="hover:bg-orange-50/30 transition-colors group">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-orange-50 text-orange-300 rounded-xl flex items-center justify-center font-black text-xs italic group-hover:bg-white transition-colors">+</div>
                                                    <span className="text-sm font-black text-[#1A1C21] tracking-widest tabular-nums italic">{s}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest italic">Physical Only</span>
                                            </td>
                                            <td className="px-10 py-6 text-right font-black text-[10px] text-orange-400 uppercase tracking-widest italic">Unknown Registry</td>
                                        </tr>
                                    ))}

                                    {/* Matched Items (Matched) */}
                                    {(viewFilter === 'ALL' || viewFilter === 'MATCHED') && scannedSerials.filter(s => !report.extraSerials.includes(s)).map(s => (
                                        <tr key={s} className="hover:bg-green-50/30 transition-colors group opacity-40 hover:opacity-100">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-green-50 text-green-300 rounded-xl flex items-center justify-center font-black text-xs italic group-hover:bg-white transition-colors">✓</div>
                                                    <span className="text-sm font-black text-[#1A1C21] tracking-widest tabular-nums italic">{s}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <span className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest italic">Verified</span>
                                            </td>
                                            <td className="px-10 py-6 text-right font-black text-[10px] text-green-400 uppercase tracking-widest italic">In Sync</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Overlay */}
            {duplicateError && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#1A1C21]/60 backdrop-blur-3xl p-4">
                    <div className="w-full max-w-[600px] bg-white rounded-[40px] p-12 text-center space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl">
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto border-4 border-red-100 shadow-xl animate-bounce">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-[#1A1C21] italic uppercase tracking-tighter">HARD_FAIL: Validation</h2>
                            <p className="text-red-500 font-bold bg-red-50 px-6 py-2 rounded-xl inline-block text-xs tracking-widest uppercase">{duplicateError.split(':')[0]}</p>
                            <p className="text-gray-400 font-black text-sm tracking-wider block mt-4">{duplicateError.split(':')[1]}</p>
                        </div>
                        <Button 
                            onClick={() => setDuplicateError(null)}
                            className="w-full h-16 bg-[#1A1C21] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-all"
                        >
                            Acknowledge & Continue
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

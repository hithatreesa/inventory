"use client"

import React, { useState, useMemo, useEffect, Suspense } from 'react'
import {
    CheckCircle2,
    Scan,
    Trash2,
    Package,
    Barcode,
    User,
    ArrowLeft,
    Activity,
    AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useData } from '@/lib/context/DataContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'

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

interface ReturnLine {
    productId: string
    name: string
    serial: string
    isConsumed: boolean
}

function EngineerReturnContent() {
    const { engineers, inventory, getEngineerSerials, processEngineerReturn } = useData()
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const [selectedEngineerId, setSelectedEngineerId] = useState(searchParams.get('id') || '')
    const [scannedItems, setScannedItems] = useState<ReturnLine[]>([])
    const [duplicateError, setDuplicateError] = useState<string | null>(null)
    const [scanActive, setScanActive] = useState(true)

    const selectedEngineer = useMemo(() => engineers.find(e => e.id === selectedEngineerId), [engineers, selectedEngineerId])
    
    // Get absolute source of truth for items held by this engineer
    const heldSerials = useMemo(() => {
        if (!selectedEngineerId || !getEngineerSerials) return [];
        return getEngineerSerials(selectedEngineerId);
    }, [selectedEngineerId, getEngineerSerials])

    // Focus Guard
    useEffect(() => {
        if (scanActive && !duplicateError) {
            const timer = setTimeout(() => document.getElementById('return-scanner-input')?.focus(), 100);
            return () => clearTimeout(timer);
        }
    }, [scanActive, duplicateError])

    const handleScan = (barcode: string) => {
        if (!barcode) return;

        // 1. Validation: Is it already in the return batch?
        if (scannedItems.some(item => item.serial === barcode)) {
            playError();
            setDuplicateError(`DUPLICATE_RETURN: ${barcode} is already in the list.`);
            return;
        }

        // 2. Validation: Does the engineer actually hold this serial?
        const heldItem = heldSerials.find(s => s.serial === barcode);
        if (!heldItem) {
            playError();
            setDuplicateError(`INVALID_RETURN: This serial was not issued to ${selectedEngineer?.name || 'this engineer'}.`);
            return;
        }

        const product = inventory.find(i => i.id === heldItem.item_id);
        
        playSuccess();
        setScannedItems(prev => [...prev, {
            productId: heldItem.item_id,
            name: product?.name || 'Unknown Item',
            serial: barcode,
            isConsumed: false
        }]);
    }

    const removeRow = (serial: string) => {
        setScannedItems(prev => prev.filter(item => item.serial !== serial));
    }

    const toggleConsumed = (serial: string) => {
        setScannedItems(prev => prev.map(item => 
            item.serial === serial ? { ...item, isConsumed: !item.isConsumed } : item
        ));
    }

    const finalizeReturn = async () => {
        if (scannedItems.length === 0) return toast.error("Scan items to return first");
        
        try {
            // We'll treat 'Consumed' entries as a different transaction type later if needed, 
            // but for now, the return flow moves them back to INWARD as 'Damaged' or 'Consumed' if we wanted.
            // The prompt says: "Return unused/damaged (INWARD)" and "Execution: moves to consumed".
            // For now, I'll commit all scanned as ENGINEER_RETURN (INWARD).
            
            await toast.promise(processEngineerReturn(selectedEngineerId, scannedItems.map(item => ({
                productId: item.productId,
                qty: 1,
                isSerialized: true,
                serials: [item.serial],
                metadata: { isConsumed: item.isConsumed }
            }))), {
                loading: 'Processing Returns...',
                success: 'INWARD COMMITTED: Inventory Restored',
                error: (err) => err.message || 'Return Failed'
            });
            router.push('/engineers');
        } catch (e: any) {
            console.error(e);
        }
    }

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F8F9FC] p-4 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                    <div className="space-y-2">
                        <button 
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="w-3 h-3" /> Back to Dashboard
                        </button>
                        <h1 className="text-3xl sm:text-5xl font-black text-[#1A1C21] tracking-tight italic">Return Registry</h1>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-2">
                            <Activity className="w-3 h-3 text-orange-500 animate-pulse" /> Inward Recovery Mode
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            onClick={finalizeReturn}
                            disabled={scannedItems.length === 0}
                            className={cn(
                                "bg-orange-600 text-white font-black uppercase text-[10px] tracking-[0.2em] px-10 h-14 rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-3 italic",
                                scannedItems.length === 0 && "opacity-50 grayscale cursor-not-allowed"
                            )}
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            Commit Return
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left: Scanner & Stats */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                        
                        {/* Status Card */}
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex items-center gap-8">
                            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-600 border-2 border-orange-100">
                                <User className="w-10 h-10" />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Engineer Profile</label>
                                <h2 className="text-2xl font-black italic text-[#1A1C21]">{selectedEngineer?.name || 'Invalid Personnel'}</h2>
                                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">
                                    {heldSerials.length} Items in Possession
                                </p>
                            </div>
                        </div>

                        {/* Visual Scanner HUD */}
                        <div className="relative group rounded-[40px] overflow-hidden shadow-2xl bg-black border-[12px] border-white ring-1 ring-gray-100 group">
                            <div className="aspect-video w-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
                                {/* Laser line */}
                                <div className="absolute inset-0 z-10 flex items-center justify-center">
                                    <div className="w-4/5 h-[3px] bg-orange-500 shadow-[0_0_30px_rgba(249,115,22,1)] animate-scan-line" />
                                </div>
                                
                                <div className="text-center space-y-4 z-20">
                                    <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto border border-orange-500/30 animate-pulse">
                                        <Scan className="w-10 h-10 text-orange-500" />
                                    </div>
                                    <p className="text-white/20 font-black uppercase tracking-[0.5em] text-[10px] italic">Recovery Interface Active</p>
                                </div>

                                {/* In-scanner progress */}
                                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                        <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Session Capture</p>
                                        <p className="text-white text-3xl font-black italic tabular-nums">{scannedItems.length}</p>
                                    </div>
                                </div>
                            </div>

                            <input
                                id="return-scanner-input"
                                autoFocus
                                className="absolute inset-0 opacity-0 cursor-default"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleScan((e.target as HTMLInputElement).value.trim());
                                        (e.target as HTMLInputElement).value = '';
                                    }
                                }}
                            />
                        </div>

                        <div className="bg-[#1A1C21] p-8 rounded-[40px] text-white space-y-6 shadow-2xl">
                            <h3 className="text-xs font-black uppercase tracking-widest italic text-white/40">Reference Manual</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 text-sm font-bold opacity-80 border-b border-white/5 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black tracking-widest">01</div>
                                    <p>Only barcodes issued to this engineer will be accepted.</p>
                                </div>
                                <div className="flex items-center gap-4 text-sm font-bold opacity-80">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black tracking-widest">02</div>
                                    <p>Mark items as &apos;Consumed&apos; if they cannot be returned to stock.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Scanned List */}
                    <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-[48px] shadow-sm border border-gray-100 flex flex-col min-h-[600px] overflow-hidden">
                        <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-[#F8F9FC]/50">
                            <h2 className="text-sm font-black text-[#1A1C21] uppercase tracking-[0.2em] italic">Return Manifest</h2>
                            <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Live Batch Tracking</span>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {scannedItems.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-white z-10">
                                        <tr className="border-b border-gray-50">
                                            <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Item Identification</th>
                                            <th className="px-6 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest italic text-center">Status</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest italic text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {scannedItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100">
                                                            <Barcode className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <p className="text-lg font-black text-[#1A1C21] italic">{item.name}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Serial: {item.serial}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-8 text-center">
                                                    <button 
                                                        onClick={() => toggleConsumed(item.serial)}
                                                        className={cn(
                                                            "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all scale-95 group-hover:scale-100",
                                                            item.isConsumed 
                                                                ? "bg-red-50 text-red-600 border border-red-100" 
                                                                : "bg-green-50 text-green-600 border border-green-100"
                                                        )}
                                                    >
                                                        {item.isConsumed ? 'Consumed' : 'Ready to Restock'}
                                                    </button>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <button 
                                                        onClick={() => removeRow(item.serial)}
                                                        className="p-4 bg-gray-50 text-gray-300 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 italic">
                                    <Package className="w-24 h-24 mb-6" />
                                    <p className="text-sm font-black uppercase tracking-[0.5em]">Waiting for Scans</p>
                                    <p className="text-[10px] font-bold mt-2">Ready to verify possession...</p>
                                </div>
                            )}
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
                            <h2 className="text-3xl font-black text-[#1A1C21] italic uppercase">HARD_FAIL: Validation</h2>
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

export default function EngineerReturnPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>}>
            <EngineerReturnContent />
        </Suspense>
    )
}

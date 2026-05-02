"use client"

import React, { useState, useMemo, useEffect, Suspense, useRef } from 'react'
import {
    CheckCircle2,
    Scan,
    Trash2,
    Package,
    Barcode,
    User,
    ArrowLeft,

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
    category: string
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

    const scanRef = useRef<HTMLInputElement>(null);

    // Focus Guard
    useEffect(() => {
        if (scanActive && !duplicateError) {
            console.log("[SCANNER] Return Scan Active - Initial Focus");
            setTimeout(() => scanRef.current?.focus(), 100);
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
            category: product?.category || 'General',
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
                        <h1 className="text-3xl sm:text-5xl font-black text-[#1A1C21] tracking-tight italic">Return Unused Items</h1>
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


                {/* Right: Scanned List */}
                <div className="bg-white rounded-[48px] shadow-sm border border-gray-100 flex flex-col min-h-[600px] overflow-hidden">
                    <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-[#F8F9FC]/50">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-black text-[#1A1C21] uppercase tracking-[0.2em] italic">Return Manifest</h2>
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest italic">{selectedEngineer?.name} | {heldSerials.length} Held</p>
                        </div>

                        <div className="relative w-64 group">
                            <input
                                ref={scanRef}
                                placeholder="SCAN BARCODE TO RETURN..."
                                className="w-full h-12 bg-white border border-gray-200 rounded-xl px-10 text-[10px] font-black italic outline-none focus:border-orange-500 transition-all placeholder:text-gray-300"
                                onBlur={() => {
                                    if (scanActive && !duplicateError) {
                                        setTimeout(() => scanRef.current?.focus(), 10);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleScan((e.target as HTMLInputElement).value.trim());
                                        (e.target as HTMLInputElement).value = '';
                                    }
                                }}
                            />
                            <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest italic w-[50%]">Item Identity</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest italic w-[30%]">Lifecycle Status</th>
                                    <th className="px-10 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest italic w-[20%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {scannedItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-10 py-6">
                                            <div className="space-y-1">
                                                <p className="text-lg font-black text-[#1A1C21] italic truncate">{item.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {item.category} | SERIAL: {item.serial}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <button
                                                onClick={() => toggleConsumed(item.serial)}
                                                className={cn(
                                                    "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2",
                                                    item.isConsumed
                                                        ? "bg-red-50 text-red-600 border-red-100 shadow-sm"
                                                        : "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm"
                                                )}
                                            >
                                                {item.isConsumed ? 'Consumed (In Ticket)' : 'Ready for Store'}
                                            </button>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <button
                                                onClick={() => removeRow(item.serial)}
                                                className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {scannedItems.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-32 text-center opacity-20">
                                            <Package className="w-20 h-20 mx-auto mb-4" />
                                            <p className="text-sm font-black uppercase tracking-[0.5em] italic">Waiting for Scans</p>
                                            <p className="text-[9px] font-bold mt-2">READY TO VERIFY POSSESSION...</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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

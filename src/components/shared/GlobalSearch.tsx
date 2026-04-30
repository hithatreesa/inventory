"use client"

import React, { useState, useEffect, useMemo } from 'react'
import {
    Search,
    Command,
    X,
    Barcode,
    Package,
    User,
    History,
    FileText,
    ArrowRight
} from 'lucide-react'
import { useData } from '@/lib/context/DataContext'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function GlobalSearch() {
    const { getSearchIndex } = useData()
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const router = useRouter()

    const index = useMemo(() => getSearchIndex ? getSearchIndex() : [], [getSearchIndex, isOpen])

    const results = useMemo(() => {
        if (!query) return [];
        return index.filter((item: any) =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.id.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8);
    }, [query, index])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !isOpen && (e.target as HTMLElement).tagName !== 'INPUT')) {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') setIsOpen(false);

            if (isOpen) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (results[selectedIndex]) handleSelect(results[selectedIndex]);
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex])

    const handleSelect = (item: any) => {
        setIsOpen(false);
        setQuery('');
        if (item.type === 'SERIAL') {
            router.push(`/inventory/registry?serial=${item.id}`);
        } else if (item.type === 'PRODUCT') {
            router.push(`/inventory?search=${item.id}`);
        } else if (item.type === 'PERSONNEL') {
            router.push(`/engineers?id=${item.id}`);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-[10vh] px-4">
            <div className="absolute inset-0 bg-[#1A1C21]/40 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsOpen(false)} />

            <div className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden relative animate-in zoom-in-95 slide-in-from-top-4 duration-500">
                {/* Search Input Area */}
                <div className="relative border-b border-gray-50 bg-[#F8F9FC]/50 p-6 flex items-center gap-4">
                    <Search className="w-6 h-6 text-primary animate-pulse" />
                    <input
                        autoFocus
                        placeholder="Search engine registries... (Serial, Product, Personnel)"
                        className="flex-1 bg-transparent border-none outline-none text-xl font-black italic text-[#1A1C21] placeholder:text-gray-300 placeholder:font-bold italic"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                    />
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <kbd className="text-[10px] font-black text-gray-400">ESC</kbd>
                    </div>
                </div>

                {/* Results Area */}
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar italic">
                    {results.length > 0 ? (
                        <div className="p-4 space-y-2">
                            {results.map((item: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(item)}
                                    className={cn(
                                        "w-full p-6 rounded-[28px] flex items-center justify-between transition-all group",
                                        idx === selectedIndex ? "bg-[#1A1C21] text-white shadow-xl scale-[1.02]" : "hover:bg-gray-50"
                                    )}
                                >
                                    <div className="flex items-center gap-6 text-left">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                            idx === selectedIndex ? "bg-white/10" : "bg-gray-100 text-gray-400"
                                        )}>
                                            {item.type === 'SERIAL' && <Barcode className="w-6 h-6" />}
                                            {item.type === 'PRODUCT' && <Package className="w-6 h-6" />}
                                            {item.type === 'PERSONNEL' && <User className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <p className={cn("text-lg font-black italic tracking-tight uppercase", idx === selectedIndex ? "text-white" : "text-[#1A1C21]")}>
                                                {item.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={cn("text-[9px] font-black uppercase tracking-widest", idx === selectedIndex ? "text-primary/80" : "text-gray-300")}>
                                                    {item.type}
                                                </span>
                                                <div className={cn("w-1 h-1 rounded-full", idx === selectedIndex ? "bg-white/20" : "bg-gray-200")} />
                                                <span className={cn("text-[8px] font-bold uppercase", idx === selectedIndex ? "text-white/40" : "text-gray-400")}>
                                                    {item.id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className={cn(
                                        "w-5 h-5 transition-transform group-hover:translate-x-1",
                                        idx === selectedIndex ? "text-primary" : "text-gray-200"
                                    )} />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-24 flex flex-col items-center justify-center text-center opacity-10">
                            {query ? (
                                <>
                                    <X className="w-16 h-16 mb-4" />
                                    <p className="text-sm font-black uppercase tracking-[0.4em]">No Records Matched</p>
                                </>
                            ) : (
                                <>
                                    <Command className="w-16 h-16 mb-4" />
                                    <p className="text-sm font-black uppercase tracking-[0.4em]">Search Live Ledger</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Advice */}
                <div className="p-6 bg-[#F8F9FC]/50 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic">Inventory Control Smart Search v2.0</p>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 opacity-30">
                            <ArrowRight className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Select</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

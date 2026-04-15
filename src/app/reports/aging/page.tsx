"use client"

import React, { useMemo } from 'react'
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    Clock,
    User,
    ChevronRight,
    Search,
    Filter,
    ArrowUpRight,
    Package,
    Navigation,
    Calendar,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useData } from '@/lib/context/DataContext'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function EngineerAgingReportPage() {
    const { getAgingReport, engineers, inventory } = useData()
    const router = useRouter()
    
    const report = useMemo(() => getAgingReport(), [getAgingReport])

    const stats = useMemo(() => {
        const critical = report.filter(r => r.status === 'CRITICAL').length;
        const warning = report.filter(r => r.status === 'WARNING').length;
        const ok = report.filter(r => r.status === 'OK').length;
        return { critical, warning, ok, total: report.length };
    }, [report])

    const groupedByEngineer = useMemo(() => {
        const groups: Record<string, any[]> = {};
        report.forEach(item => {
            if (!groups[item.engineerId]) groups[item.engineerId] = [];
            groups[item.engineerId].push(item);
        });
        return groups;
    }, [report])

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F8F9FC] p-4 sm:p-8 italic">
            <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                    <div className="space-y-2">
                        <button 
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors transition-transform active:scale-95"
                        >
                            <ArrowLeft className="w-3 h-3" /> Back to Dashboard
                        </button>
                        <h1 className="text-3xl sm:text-5xl font-black text-[#1A1C21] tracking-tight italic uppercase decoration-blue-500/10 decoration-8">Asset Aging Index</h1>
                    </div>
                </div>

                {/* KPI Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-[#1A1C21] p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-1000" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-3">Total Deployments</p>
                        <h3 className="text-5xl font-black italic tracking-tighter leading-none mb-2">{stats.total}</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                            Active Field Inventory
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-[40px] border border-red-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 border border-red-100"><AlertTriangle className="w-6 h-6" /></div>
                            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic">15+ Days</span>
                        </div>
                        <div className="mt-6">
                            <p className="text-4xl font-black text-red-600 italic leading-none">{stats.critical}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Critical Aging</p>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[40px] border border-orange-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-100"><AlertCircle className="w-6 h-6" /></div>
                            <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic">7-15 Days</span>
                        </div>
                        <div className="mt-6">
                            <p className="text-4xl font-black text-orange-600 italic leading-none">{stats.warning}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Warning Status</p>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[40px] border border-green-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 border border-green-100"><CheckCircle2 className="w-6 h-6" /></div>
                            <span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic">0-7 Days</span>
                        </div>
                        <div className="mt-6">
                            <p className="text-4xl font-black text-green-600 italic leading-none">{stats.ok}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Within Healthy Limits</p>
                        </div>
                    </div>
                </div>

                {/* Aged Items List */}
                <div className="space-y-12 pb-24">
                    {Object.entries(groupedByEngineer).map(([engId, items]) => {
                        const engineer = engineers.find(e => e.id === engId);
                        return (
                            <div key={engId} className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-[#1A1C1] italic uppercase tracking-tight">{engineer?.name || 'Unknown Engineer'}</h2>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Possession Count: {items.length} units</p>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={() => router.push(`/engineers/return?id=${engId}`)}
                                        className="h-10 bg-white border-2 border-primary/10 text-primary font-black uppercase text-[10px] tracking-widest px-6 rounded-xl hover:bg-primary hover:text-white transition-all italic"
                                    >
                                        Initiate Recovery flow
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {items.map((item, idx) => {
                                        const product = inventory.find(p => p.id === item.productId);
                                        return (
                                            <div key={idx} className={cn(
                                                "bg-white rounded-[32px] p-8 border-2 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all relative overflow-hidden",
                                                item.status === 'CRITICAL' ? 'border-red-100' : item.status === 'WARNING' ? 'border-orange-100' : 'border-gray-50'
                                            )}>
                                                {item.status === 'CRITICAL' && (
                                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-all duration-700">
                                                        <AlertTriangle className="w-16 h-16 text-red-500" />
                                                    </div>
                                                )}
                                                
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">{product?.category || 'Hardware'}</span>
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic flex items-center gap-1.5",
                                                            item.status === 'CRITICAL' ? 'bg-red-50 text-red-600' : item.status === 'WARNING' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                                                        )}>
                                                            <Clock className="w-3 h-3" />
                                                            {item.ageDays} Days
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black text-[#1A1C21] italic tracking-tight uppercase leading-tight mb-1">{product?.name || 'Unknown Item'}</h4>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Navigation className="w-3 h-3" />
                                                            Serial: {item.serial}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-8 pt-6 border-t border-gray-50 space-y-4">
                                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic opacity-40">
                                                        <span>Possession Status</span>
                                                        <span>Lifecycle %</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                                        <div className={cn(
                                                            "h-full transition-all duration-1000",
                                                            item.status === 'CRITICAL' ? 'bg-red-500' : item.status === 'WARNING' ? 'bg-orange-500' : 'bg-green-500'
                                                        )} style={{ width: `${Math.min((item.ageDays / 15) * 100, 100)}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}

                    {Object.keys(groupedByEngineer).length === 0 && (
                        <div className="py-40 text-center opacity-10">
                            <Navigation className="w-24 h-24 mx-auto mb-6" />
                            <p className="text-sm font-black uppercase tracking-[0.5em]">No Assets Currently in Field</p>
                            <p className="text-[10px] font-bold mt-2">All inventory is accounted for in warehouse</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

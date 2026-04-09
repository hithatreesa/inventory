"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Activity, Package, Check, X, Clock, Navigation, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData } from '@/lib/context/DataContext';

export default function EngineerPage() {
  const router = useRouter();
  const { engineers, inventory, transactions, getEngineerSerials, getEngineerTickets } = useData();
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>('');

  // Initial selection
  useEffect(() => {
    if (!selectedEngineerId && engineers.length > 0) {
      setSelectedEngineerId(engineers[0].id);
    }
  }, [engineers, selectedEngineerId]);

  const selectedEngineer = useMemo(() => {
    return engineers.find(e => e.id === selectedEngineerId);
  }, [engineers, selectedEngineerId]);

  // DERIVED STATS FOR ENGINEERS
  const engineersWithStats = useMemo(() => {
    return engineers.map(eng => {
      const serials = getEngineerSerials ? getEngineerSerials(eng.id) : [];
      const engTxns = (transactions || []).filter(t => t.engineer_id === eng.id);
      
      const taken = engTxns.filter(t => t.type === 'ASSIGN').length;
      const returned = engTxns.filter(t => t.type === 'RETURN').length;

      return {
        ...eng,
        stats: {
          taken,
          returned,
          pending: serials.length,
          onDuty: serials.length > 0
        }
      };
    });
  }, [engineers, getEngineerSerials, transactions]);

  const engineerSerials = useMemo(() => {
    if (!selectedEngineerId || !getEngineerSerials) return [];
    return getEngineerSerials(selectedEngineerId);
  }, [selectedEngineerId, getEngineerSerials]);

  const engineerTickets = useMemo(() => {
    if (!selectedEngineerId || !getEngineerTickets) return [];
    return getEngineerTickets(selectedEngineerId).sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [getEngineerTickets, selectedEngineerId]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8 min-h-screen bg-transparent animate-in fade-in duration-500 pb-20">

      {/* ⬅️ LEFT PANEL: ENGINEER LIST */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="bg-white rounded-[32px] border border-border-main p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-[#003366] italic uppercase tracking-tight">Active Engineers</h2>
            </div>
            <button
              onClick={() => router.push('/engineers/add')}
              className="px-3 py-1.5 bg-[#003366] text-white rounded-lg flex items-center gap-1 text-[10px] font-black tracking-widest uppercase hover:bg-blue-900 transition-colors shadow-sm"
            >
              <Plus className="w-3 h-3" /> Add Engineer
            </button>
          </div>

          <div className="space-y-3">
            {engineersWithStats.map(eng => (
              <div
                key={eng.id}
                onClick={() => setSelectedEngineerId(eng.id)}
                className={cn(
                  "p-4 rounded-2xl border cursor-pointer transition-all group flex flex-col gap-3",
                  selectedEngineerId === eng.id
                    ? "bg-[#003366] text-white border-transparent shadow-[0_10px_30px_rgba(0,51,102,0.2)]"
                    : "bg-gray-50/50 border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-text-main"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={cn("text-lg font-black italic tracking-tight leading-none", selectedEngineerId === eng.id ? "text-white" : "text-[#003366]")}>
                      {eng.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={cn("flex w-2 h-2 rounded-full", eng.stats.onDuty ? "bg-green-500 animate-pulse" : "bg-gray-300")}></span>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest leading-none", selectedEngineerId === eng.id ? "text-white/70" : "text-gray-400")}>
                        {eng.type || "IT"} • {eng.stats.onDuty ? 'On Duty' : 'Standby'}
                      </span>
                    </div>
                  </div>
                  <div className={cn("w-10 h-10 rounded-xl flex flex-col items-center justify-center", selectedEngineerId === eng.id ? "bg-white/10" : "bg-white border border-gray-100")}>
                    <Package className={cn("w-4 h-4 mb-0.5", selectedEngineerId === eng.id ? "text-white" : "text-primary")} />
                    <span className="text-[10px] font-black tabular-nums leading-none">{eng.stats.pending}</span>
                  </div>
                </div>

                <div className={cn("grid grid-cols-2 gap-2 pt-2 border-t", selectedEngineerId === eng.id ? "border-white/10" : "border-gray-100")}>
                  <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                    <span className={selectedEngineerId === eng.id ? "text-white/60" : "text-gray-400"}>Taken</span>
                    <span className="tabular-nums text-sm">{eng.stats.taken}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                    <span className={selectedEngineerId === eng.id ? "text-white/60" : "text-gray-400"}>Pending</span>
                    <span className={cn("tabular-nums text-sm", eng.stats.pending > 0 ? (selectedEngineerId === eng.id ? "text-yellow-400" : "text-orange-500") : "")}>{eng.stats.pending}</span>
                  </div>
                </div>
              </div>
            ))}
            {engineers.length === 0 && <p className="text-center py-10 text-gray-400 font-bold italic">No engineers found</p>}
          </div>
        </div>
      </div>

      {/* ➡️ RIGHT PANEL: ENGINEER DETAILS */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">

        {/* Detail Header & Active Services */}
        <div className="bg-white rounded-[32px] border border-border-main p-6 lg:p-8 shadow-sm flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-5 pointer-events-none translate-x-1/3 -translate-y-1/4">
            <User className="w-96 h-96" />
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl font-black text-[#003366] italic tracking-tighter uppercase mb-2">
              {selectedEngineer?.name || 'Select Engineer'}
            </h1>
            <p className="text-xs font-black text-primary uppercase tracking-[0.2em] italic flex items-center gap-2">
              <Activity className="w-3 h-3" /> Execution & Inventory Profile
            </p>
          </div>

          <div className="relative z-10 flex-1 w-full xl:max-w-md">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic flex items-center gap-2">
                <Navigation className="w-3 h-3" /> System Status
              </h4>
              <div className="bg-white/50 border border-gray-100 border-dashed rounded-xl p-4 flex flex-col items-center justify-center">
                <Check className="w-5 h-5 text-green-500 mb-1" />
                <span className="text-xs font-bold text-gray-400 italic">Historical data active</span>
              </div>
            </div>
          </div>
        </div>

        {/* B. Item Summary Table */}
        <div className="bg-white rounded-[32px] border border-border-main overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="text-lg font-black text-[#003366] italic uppercase tracking-tight">Inventory In Possession</h3>
          </div>
          <div className="overflow-x-auto min-h-[150px]">
            {engineerSerials.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Item Name</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Serial Number</th>
                    <th className="px-6 py-4 text-[10px] font-black text-[#003366] uppercase tracking-widest italic text-center bg-primary/5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {engineerSerials.map((s, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4 font-black text-sm text-[#003366] italic uppercase tracking-tight">{inventory.find(i => i.id === s.item_id)?.name || s.item_id}</td>
                      <td className="px-6 py-4 font-black text-sm text-gray-400 text-center"><span className="bg-gray-100 px-2 py-1 normal-case tracking-widest rounded text-xs">{s.serial}</span></td>
                      <td className="px-6 py-4 font-black text-lg text-orange-500 text-center tabular-nums bg-orange-50/30 border-l border-r border-orange-50"><span className="text-xs">{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-center opacity-50">
                <Package className="w-10 h-10 mb-3 text-gray-400" />
                <p className="text-sm font-black uppercase text-gray-400 tracking-widest italic">No Items Issued or Pending</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-border-main overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="text-lg font-black text-[#003366] italic uppercase tracking-tight">Assigned Tickets</h3>
            <span className="text-[10px] font-black tracking-widest uppercase text-gray-400 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Active Workflows</span>
          </div>
          <div className="overflow-x-auto min-h-[200px]">
            {engineerTickets.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Ticket ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Customer / Context</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {engineerTickets.map((t: any) => {
                    return (
                      <tr key={t.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-xs text-gray-400 font-mono tracking-tighter">{t.id}</td>
                        <td className="px-6 py-4 font-black text-xs text-text-main italic uppercase">{t.customer_name || t.title}<br /><span className="text-[10px] text-gray-400 normal-case">{t.issue_description || t.description}</span></td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border",
                            t.status === 'COMPLETED' ? "bg-green-50 text-green-600 border-green-100" :
                              "bg-blue-50 text-blue-600 border-blue-100"
                          )}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-center opacity-50">
                <Activity className="w-10 h-10 mb-3 text-gray-400" />
                <p className="text-sm font-black uppercase text-gray-400 tracking-widest italic">No Active Workflow</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

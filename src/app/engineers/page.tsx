"use client"

import React, { useState, useMemo } from 'react';
import { User, Activity, Package, Check, X, Clock, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData } from '@/lib/context/DataContext';

export default function EngineerPage() {
  const { engineers, inventory, transactions } = useData();
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>('');

  // Initial selection
  useMemo(() => {
    if (!selectedEngineerId && engineers.length > 0) {
      setSelectedEngineerId(engineers[0].id);
    }
  }, [engineers]);

  const selectedEngineer = useMemo(() => {
    return engineers.find(e => e.id === selectedEngineerId);
  }, [engineers, selectedEngineerId]);

  // DERIVED STATS FOR ENGINEERS
  const engineersWithStats = useMemo(() => {
    return engineers.map(eng => {
      const engTransactions = transactions.filter(t => t.engineer_id === eng.id);
      let issued = 0;
      let returned = 0;
      engTransactions.forEach(t => {
        if (t.type === 'OUTWARD' || t.type === 'ISSUE') issued += Number(t.quantity);
        if (t.type === 'RETURN') returned += Number(t.quantity);
      });

      return {
        ...eng,
        stats: {
          taken: issued,
          returned: returned,
          pending: issued - returned,
          onDuty: false // Concept not fully implemented in backend yet
        }
      };
    });
  }, [engineers, transactions]);

  // ITEM SUMMARY FOR SELECTED ENGINEER
  const itemSummary = useMemo(() => {
    if (!selectedEngineerId) return [];
    
    const engTransactions = transactions.filter(t => t.engineer_id === selectedEngineerId);
    const itemMap: Record<string, { taken: number, returned: number, name: string }> = {};

    engTransactions.forEach(t => {
      const item = inventory.find(i => i.id === t.item_id);
      const itemName = item ? item.name : `Item ${t.item_id}`;
      
      if (!itemMap[t.item_id]) {
        itemMap[t.item_id] = { taken: 0, returned: 0, name: itemName };
      }

      if (t.type === 'OUTWARD' || t.type === 'ISSUE') itemMap[t.item_id].taken += Number(t.quantity);
      if (t.type === 'RETURN') itemMap[t.item_id].returned += Number(t.quantity);
    });

    return Object.entries(itemMap).map(([id, data]) => ({
      itemId: id,
      itemName: data.name,
      taken: data.taken,
      returned: data.returned,
      consumed: 0,
      inHand: data.taken - data.returned
    }));
  }, [selectedEngineerId, transactions, inventory]);

  const engineerTransactions = useMemo(() => {
    return transactions
      .filter(t => t.engineer_id === selectedEngineerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedEngineerId]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8 min-h-screen bg-transparent animate-in fade-in duration-500 pb-20">
      
      {/* ⬅️ LEFT PANEL: ENGINEER LIST */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="bg-white rounded-[32px] border border-border-main p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-[#003366] italic uppercase tracking-tight">Active Engineers</h2>
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
                         {eng.stats.onDuty ? 'On Duty' : 'Standby'}
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
             {itemSummary.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Item Name</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Taken</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Returned</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[#003366] uppercase tracking-widest italic text-center bg-primary/5">In Hand (Pending)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {itemSummary.map((item, idx) => (
                       <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-6 py-4 font-black text-sm text-[#003366] italic uppercase tracking-tight">{item.itemName}</td>
                          <td className="px-6 py-4 font-black text-sm text-gray-400 text-center tabular-nums">{item.taken}</td>
                          <td className="px-6 py-4 font-black text-sm text-green-500 text-center tabular-nums">{item.returned}</td>
                          <td className="px-6 py-4 font-black text-lg text-orange-500 text-center tabular-nums bg-orange-50/30 border-l border-r border-orange-50">{item.inHand}</td>
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

        {/* C. Transaction History Table */}
        <div className="bg-white rounded-[32px] border border-border-main overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
             <h3 className="text-lg font-black text-[#003366] italic uppercase tracking-tight">Movement Log</h3>
             <span className="text-[10px] font-black tracking-widest uppercase text-gray-400 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Recent Transactions</span>
          </div>
          <div className="overflow-x-auto min-h-[200px]">
             {engineerTransactions.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Item</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Type</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {engineerTransactions.map((tx: any) => {
                        return (
                          <tr key={tx.id} className="hover:bg-gray-50/30 transition-colors">
                             <td className="px-6 py-4 font-bold text-xs text-gray-400 font-mono tracking-tighter">{tx.date}</td>
                             <td className="px-6 py-4 font-black text-xs text-text-main italic uppercase">{inventory.find(i => i.id === tx.item_id)?.name || tx.item_id}</td>
                             <td className="px-6 py-4">
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border",
                                  (tx.type === 'OUTWARD' || tx.type === 'ISSUE') ? "bg-orange-50 text-orange-600 border-orange-100" :
                                  tx.type === 'RETURN' ? "bg-green-50 text-green-600 border-green-100" :
                                  "bg-blue-50 text-blue-600 border-blue-100"
                                )}>
                                  {tx.type}
                                </span>
                             </td>
                             <td className="px-6 py-4 font-black text-sm text-[#003366] text-right tabular-nums">
                                { (tx.type === 'OUTWARD' || tx.type === 'ISSUE') ? '+' : '-'}{tx.quantity}
                             </td>
                          </tr>
                        )
                     })}
                  </tbody>
                </table>
             ) : (
                <div className="p-12 flex flex-col items-center justify-center text-center opacity-50">
                   <Activity className="w-10 h-10 mb-3 text-gray-400" />
                   <p className="text-sm font-black uppercase text-gray-400 tracking-widest italic">No Recent Movements</p>
                </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}

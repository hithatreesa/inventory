"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Package, Clock, Plus, Activity, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData, Engineer, Transaction } from '@/lib/context/DataContext';
import { EntityLookup } from '@/components/shared/EntityLookup';
import { toast } from 'sonner';

export default function EngineerPage() {
  const router = useRouter();
  const { engineers, inventory, transactions, getEngineerSerials, getEngineerTickets, tickets } = useData();
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>('');

  // Initial selection
  useEffect(() => {
    if (!selectedEngineerId && engineers.length > 0) {
      setSelectedEngineerId(engineers[0].id);
    }
  }, [engineers, selectedEngineerId]);

  const selectedEngineer = useMemo(() => {
    return engineers.find((e: Engineer) => e.id === selectedEngineerId);
  }, [engineers, selectedEngineerId]);

  // Form State for Issued Material
  const [issuedForm, setIssuedForm] = useState({
    ticketNo: '',
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    items: [{ id: Date.now().toString(), name: '', qty: 1 }]
  });

  // Auto-fill logic
  const [lastAutofilledTicket, setLastAutofilledTicket] = useState<string>('');
  useEffect(() => {
    if (issuedForm.ticketNo && issuedForm.ticketNo !== lastAutofilledTicket) {
      const ticket = tickets?.find(t => t.id === issuedForm.ticketNo);
      if (ticket) {
        setLastAutofilledTicket(ticket.id);
        
        const autoItems = ticket.requirements?.length > 0 
          ? ticket.requirements.map(req => {
              const invItem = inventory.find(i => i.id === req.item_id);
              return {
                 id: Math.random().toString(36).substr(2, 9),
                 name: invItem?.name || req.item_id,
                 qty: req.qty
              };
            })
          : [{ id: Math.random().toString(36).substr(2, 9), name: '', qty: 1 }];

        setIssuedForm(prev => ({
          ...prev,
          customerName: ticket.customer_name || ticket.title || prev.customerName,
          items: autoItems
        }));
        
        toast.success(`Auto-filled details for Ticket: ${ticket.id}`);
      }
    }
  }, [issuedForm.ticketNo, tickets, inventory, lastAutofilledTicket]);

  const handleAddFormItem = () => {
    setIssuedForm(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), name: '', qty: 1 }]
    }));
  };

  const handleUpdateFormItem = (id: string, field: string, value: any) => {
    setIssuedForm(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleRemoveFormItem = (id: string) => {
    if (issuedForm.items.length <= 1) return;
    setIssuedForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const submitIssuedForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (issuedForm.items.some(i => !i.name)) {
      toast.error("Please fill in all item names");
      return;
    }
    toast.success("Material Issue Recorded Successfully!");
    // Form submission mock logic - resets the form
    setIssuedForm({
      ticketNo: '',
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      items: [{ id: Date.now().toString(), name: '', qty: 1 }]
    });
  };

  // DERIVED STATS FOR ENGINEERS
  const engineersWithStats = useMemo(() => {
    return engineers.map((eng: Engineer) => {
      const serials = getEngineerSerials ? getEngineerSerials(eng.id) : [];
      const engTxns = (transactions || []).filter((t: Transaction) => t.engineer_id === eng.id);

      const taken = engTxns.filter((t: Transaction) => t.type === 'ASSIGN').length;
      const returned = engTxns.filter((t: Transaction) => t.type === 'RETURN').length;

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
    return getEngineerTickets(selectedEngineerId).sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
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

                <div className={cn("flex justify-between items-center pt-2 border-t", selectedEngineerId === eng.id ? "border-white/10" : "border-gray-100")}>
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn("text-[9px] font-black uppercase tracking-widest italic", selectedEngineerId === eng.id ? "text-white/50" : "text-gray-400")}>TAKEN :</span>
                    <span className={cn("text-base font-black tabular-nums", selectedEngineerId === eng.id ? "text-white" : "text-[#003366]")}>{eng.stats.taken}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn("text-[9px] font-black uppercase tracking-widest italic", selectedEngineerId === eng.id ? "text-white/50" : "text-gray-400")}>PENDING :</span>
                    <span className={cn("text-base font-black tabular-nums", eng.stats.pending > 0 ? (selectedEngineerId === eng.id ? "text-yellow-400" : "text-orange-500") : (selectedEngineerId === eng.id ? "text-white" : "text-[#003366]"))}>{eng.stats.pending}</span>
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

          <div className="relative z-10">
            <h1 className="text-4xl font-black text-[#003366] italic tracking-tighter uppercase mb-2">
              {selectedEngineer?.name || 'Select Engineer'}
            </h1>
          </div>

          <div className="relative z-10 flex justify-end">
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center gap-3 w-fit">
              <button
                onClick={() => router.push(`/engineers/issue?id=${selectedEngineerId}`)}
                className="h-12 px-6 bg-[#003366] text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-blue-900 transition-all shadow-[0_10px_30px_rgba(0,51,102,0.3)] flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Issue Items
              </button>
              <button
                onClick={() => router.push(`/engineers/return?id=${selectedEngineerId}`)}
                className="h-12 px-6 bg-white border-2 border-orange-100 text-orange-500 rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-orange-50 transition-all flex items-center gap-2"
              >
                <Activity className="w-4 h-4" /> Process Return
              </button>
            </div>
          </div>
        </div>



        {/* C. Issued Material Form Card */}
        <div className="bg-white rounded-[32px] border border-border-main overflow-hidden shadow-sm flex flex-col mb-10">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="text-lg font-black text-[#003366] italic uppercase tracking-tight">Issued Material</h3>
          </div>
          <form onSubmit={submitIssuedForm} className="p-6 lg:p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Ticket Number</label>
                <input
                  required
                  placeholder="e.g. TCK-12345"
                  value={issuedForm.ticketNo}
                  onChange={e => setIssuedForm({ ...issuedForm, ticketNo: e.target.value })}
                  className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-xl px-4 text-sm font-bold placeholder:text-gray-300 outline-none focus:border-[#003366] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Date</label>
                <input
                  required
                  type="date"
                  value={issuedForm.date}
                  onChange={e => setIssuedForm({ ...issuedForm, date: e.target.value })}
                  className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-xl px-4 text-sm font-bold outline-none focus:border-[#003366] transition-all"
                />
              </div>
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Engineer Name</label>
                <select
                  required
                  value={selectedEngineerId}
                  onChange={e => setSelectedEngineerId(e.target.value)}
                  className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-xl px-4 text-sm font-bold text-[#003366] outline-none focus:border-[#003366] transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select Engineer</option>
                  {engineers.map(e => (
                    <option key={e.id} value={e.id}>{e.name} {e.type ? `(${e.type})` : ''}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-[36px] pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 1.5L6 6L10.5 1.5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Customer Name</label>
                <input
                  required
                  placeholder="Company / Client Name"
                  value={issuedForm.customerName}
                  onChange={e => setIssuedForm({ ...issuedForm, customerName: e.target.value })}
                  className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-xl px-4 text-sm font-bold placeholder:text-gray-300 outline-none focus:border-[#003366] transition-all"
                />
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-gray-50 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-[#003366] uppercase tracking-widest pl-1 italic">Items Consumed</label>
              </div>

              <div className="space-y-3">
                {issuedForm.items.map((item, idx) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="w-full sm:flex-1">
                      <div className="relative">
                        <EntityLookup
                          type="item"
                          placeholder="Search item..."
                          value={item.name}
                          onChange={val => handleUpdateFormItem(item.id, 'name', val)}
                          onSelect={selected => handleUpdateFormItem(item.id, 'name', selected.name || selected.id)}
                          className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold outline-none focus:border-[#003366] transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="w-full sm:w-24 shrink-0 relative">
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.qty}
                        onChange={e => handleUpdateFormItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                        className="w-full h-12 bg-white border border-gray-200 rounded-xl text-center text-sm font-black outline-none focus:border-[#003366] transition-all shadow-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFormItem(item.id)}
                      disabled={issuedForm.items.length === 1}
                      className="h-12 px-4 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 flex items-center justify-center shrink-0 border border-transparent hover:border-red-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddFormItem}
                className="text-[10px] font-black uppercase tracking-widest italic text-[#003366] hover:text-blue-700 underline underline-offset-4 pt-2"
              >
                + Add Another Item
              </button>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="submit"
                className="px-8 h-12 bg-[#003366] text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-blue-900 transition-all shadow-md flex items-center gap-2"
              >
                Submit Record
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

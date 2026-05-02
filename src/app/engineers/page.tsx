"use client"

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Package, 
  Clock, 
  Plus, 
  Activity, 
  X, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  RotateCcw, 
  FileText,
  Filter,
  Keyboard,
  Barcode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData, Engineer, Transaction, Contact, InventoryItem, Ticket, TicketRequirement } from '@/lib/context/DataContext';
import { EntityLookup } from '@/components/shared/EntityLookup';
import { toast } from 'sonner';

export default function EngineerPage() {
  const router = useRouter();
  const { 
    engineers, 
    inventory, 
    transactions, 
    getEngineerSerials, 
    getEngineerTickets, 
    processJournal, 
    processEngineerReturn,
    tickets
  } = useData();

  const [selectedEngineerId, setSelectedEngineerId] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'UNUSED' | 'CONSUMED' | 'ALL'>('UNUSED');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [journalForm, setJournalForm] = useState({ serial: '', from_ticket: '', to_ticket: '' });
  
  // Refs for keyboard management
  const searchRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);


  const selectedEngineer = useMemo(() => {
    return engineers.find((e: Engineer) => e.id === selectedEngineerId);
  }, [engineers, selectedEngineerId]);

  // DERIVED DATA FOR TABLE
  const rawItems = useMemo(() => {
    if (!selectedEngineerId) return [];
    return getEngineerSerials(selectedEngineerId);
  }, [selectedEngineerId, getEngineerSerials]);

  const filteredItems = useMemo(() => {
    let items = rawItems;
    
    // Status Filter
    if (filterTab === 'UNUSED') {
      items = items.filter(i => i.status === 'ASSIGNED');
    } else if (filterTab === 'CONSUMED') {
      items = items.filter(i => i.status === 'CONSUMED');
    }

    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => 
        i.serial.toLowerCase().includes(q) || 
        (inventory.find(inv => inv.id === i.item_id)?.name || '').toLowerCase().includes(q)
      );
    }

    return items;
  }, [rawItems, filterTab, searchQuery, inventory]);


  // ACTIONS
  const handleUse = async (serial: string, ticket: string) => {
    try {
      await toast.promise(
        processEngineerReturn(selectedEngineerId, [{
          productId: rawItems.find(i => i.serial === serial)?.item_id,
          qty: 1,
          isSerialized: true,
          serials: [serial],
          metadata: { 
            isConsumed: true, 
            reference: ticket 
          }
        }]),
        {
          loading: 'Processing consumption...',
          success: 'Item marked as consumed',
          error: 'Failed to consume item'
        }
      );
    } catch (e) {}
  };

  const handleReturn = async (serial: string) => {
    try {
      await toast.promise(
        processEngineerReturn(selectedEngineerId, [{
          productId: rawItems.find(i => i.serial === serial)?.item_id,
          qty: 1,
          isSerialized: true,
          serials: [serial],
          metadata: { 
            isConsumed: false 
          }
        }]),
        {
          loading: 'Returning to stock...',
          success: 'Item returned to stock',
          error: 'Failed to return item'
        }
      );
    } catch (e) {}
  };

  const handleJournal = (serial: string, currentTicket: string) => {
    setJournalForm({ serial, from_ticket: currentTicket !== 'UNASSIGNED' ? currentTicket : '', to_ticket: '' });
    setJournalModalOpen(true);
  };

  // KEYBOARD & SCANNER SUPPORT
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input (except for specific shortcuts)
      if (document.activeElement?.tagName === 'INPUT' && e.key !== 'Enter' && e.key !== 'Escape') {
        return;
      }

      if (e.key === 'u' || e.key === 'U') {
        if (selectedIndex >= 0 && filteredItems[selectedIndex]?.status === 'ASSIGNED') {
          handleUse(filteredItems[selectedIndex].serial, filteredItems[selectedIndex].currentTicket);
        }
      } else if (e.key === 'j' || e.key === 'J') {
        if (selectedIndex >= 0 && filteredItems[selectedIndex]?.status === 'ASSIGNED') {
          handleJournal(filteredItems[selectedIndex].serial, filteredItems[selectedIndex].currentTicket);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (selectedIndex >= 0 && filteredItems[selectedIndex]?.status === 'ASSIGNED') {
          handleReturn(filteredItems[selectedIndex].serial);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        // Confirm action or search focus
        if (selectedIndex === -1) {
          searchRef.current?.focus();
        }
      } else if (e.key === 'Escape') {
        setSelectedIndex(-1);
        searchRef.current?.blur();
        setJournalModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredItems, selectedEngineerId]);

  // SCANNER HANDLER
  const handleScan = (value: string) => {
    const index = filteredItems.findIndex(i => i.serial === value);
    if (index >= 0) {
      setSelectedIndex(index);
      toast.success(`Selected Serial: ${value}`);
    } else {
      // Check if it's in raw items but hidden by filter
      const rawIndex = rawItems.findIndex(i => i.serial === value);
      if (rawIndex >= 0) {
        toast.info(`Item found in ${rawItems[rawIndex].status} list`);
      } else {
        toast.error("Serial not held by this engineer");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 min-h-screen bg-transparent animate-in fade-in duration-500 pb-20">
      
      {/* ⬅️ HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#003366] italic uppercase tracking-tighter leading-none mb-2">Engineer Portal</h1>
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] italic flex items-center gap-2">
            <Activity className="w-3 h-3" /> Real-time Inventory Lifecycle Control
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-[#003366] text-white p-6 rounded-[40px] shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border-b-4 border-blue-900">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center border border-white/10 backdrop-blur-sm">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Personnel In-Focus</p>
              <h3 className="text-4xl font-black italic tracking-tighter leading-none truncate">
                {selectedEngineer?.name || 'Select Engineer'}
                {selectedEngineer && (
                  <span className="ml-3 text-sm font-bold opacity-30 not-italic uppercase tracking-widest">[{selectedEngineer?.type || 'F'}]</span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-[24px] border border-white/10 backdrop-blur-md">
            <div className="relative">
              <select
                value={selectedEngineerId}
                onChange={(e) => {
                  setSelectedEngineerId(e.target.value);
                  setSelectedIndex(-1);
                }}
                className="h-12 bg-white text-[#003366] border-none px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none transition-all appearance-none cursor-pointer pr-12 shadow-inner min-w-[180px]"
              >
                <option value="" disabled>Select Engineer</option>
                {engineers.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#003366]">
                <Filter className="w-3 h-3" />
              </div>
            </div>
            <button 
              disabled={!selectedEngineerId}
              onClick={() => router.push('/engineers/return')}
              className={cn(
                "px-8 h-12 rounded-2xl flex items-center gap-3 text-[10px] font-black tracking-widest uppercase transition-all shadow-lg",
                selectedEngineerId 
                  ? "bg-white text-[#003366] hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] border border-blue-100" 
                  : "bg-gray-500/20 text-white/40 cursor-not-allowed border border-white/5"
              )}
            >
              <RotateCcw className="w-4 h-4" /> Return Item
            </button>
            <button 
              disabled={!selectedEngineerId}
              onClick={() => router.push('/engineers/issue')}
              className={cn(
                "px-8 h-12 rounded-2xl flex items-center gap-3 text-[10px] font-black tracking-widest uppercase transition-all shadow-lg",
                selectedEngineerId 
                  ? "bg-[#0066FF] text-white hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98]" 
                  : "bg-gray-500/20 text-white/40 cursor-not-allowed"
              )}
            >
              <Plus className="w-4 h-4" /> Issue More
            </button>
          </div>
        </div>
      </div>

      {/* 🔍 SEARCH & FILTERS */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex p-1 bg-gray-100/50 rounded-2xl w-full lg:w-auto">
          {(['UNUSED', 'CONSUMED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setFilterTab(tab);
                setSelectedIndex(-1);
              }}
              className={cn(
                "flex-1 lg:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic",
                filterTab === tab 
                  ? "bg-white text-[#003366] shadow-sm" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Scan Serial or Type Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleScan(searchQuery);
                  setSearchQuery('');
                }
              }}
              className="w-full h-12 bg-white border border-gray-100 rounded-2xl pl-12 pr-4 text-sm font-bold focus:border-[#003366] outline-none transition-all shadow-sm"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[8px] font-black text-gray-400 border border-gray-200">ESC</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-4 bg-white border border-gray-100 rounded-2xl text-[9px] font-black text-gray-400 uppercase tracking-widest shadow-sm">
            <Keyboard className="w-3 h-3" />
            <span className="text-[#003366]">U: USE</span>
            <span className="mx-1">•</span>
            <span className="text-purple-600">J: JOURNAL</span>
            <span className="mx-1">•</span>
            <span className="text-blue-600">R: RETURN</span>
          </div>
        </div>
      </div>

      {/* 📅 MAIN TABLE */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100/50 border-b-2 border-gray-300">
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Item Name</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Serial / Qty</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Current Ticket</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Status</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-700 uppercase tracking-widest italic">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <Package className="w-12 h-12 mb-4" />
                      <p className="text-sm font-black uppercase tracking-[0.4em] italic">No Items Found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const invItem = inventory.find(i => i.id === item.item_id);
                  const isSelected = selectedIndex === idx;
                  const isConsumed = item.status === 'CONSUMED';
                  
                  return (
                    <tr 
                      key={item.serial}
                      onClick={() => setSelectedIndex(idx)}
                      className={cn(
                        "group transition-all cursor-pointer",
                        isSelected ? "bg-[#003366]/5" : "hover:bg-gray-50",
                        isConsumed && "opacity-50 grayscale-[0.5]"
                      )}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            isSelected ? "bg-[#003366] text-white scale-110" : "bg-gray-100 text-gray-400 group-hover:bg-white border border-transparent group-hover:border-gray-200"
                          )}>
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className={cn("text-base font-black italic tracking-tight leading-tight", isSelected ? "text-[#003366]" : "text-gray-900")}>
                              {invItem?.name || 'Unknown Item'}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{invItem?.category || '---'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black tabular-nums tracking-wider text-gray-600">{item.serial}</span>
                          <span className="text-[9px] font-black uppercase text-gray-400 mt-0.5">QTY: 1.00</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={cn(
                          "px-3 py-1.5 rounded-lg border inline-flex items-center gap-2",
                          item.currentTicket !== 'UNASSIGNED' 
                            ? "bg-blue-50 border-blue-100 text-blue-600" 
                            : "bg-gray-50 border-gray-100 text-gray-400"
                        )}>
                          <FileText className="w-3 h-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{item.currentTicket}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            isConsumed ? "bg-red-400" : "bg-green-400 animate-pulse"
                          )}></span>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em] italic",
                            isConsumed ? "text-red-500" : "text-green-600"
                          )}>
                            {isConsumed ? 'CONSUMED' : 'UNUSED'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {!isConsumed ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleJournal(item.serial, item.currentTicket); }}
                              className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all shadow-sm border border-purple-100"
                              title="Journal (J)"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleReturn(item.serial); }}
                              className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                              title="Return (R)"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUse(item.serial, item.currentTicket); }}
                              className="px-6 h-10 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all shadow-sm border border-green-100 flex items-center gap-2"
                              title="Use (U)"
                            >
                              <CheckCircle2 className="w-4 h-4" /> USE
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic flex items-center justify-end gap-2">
                            <Clock className="w-3 h-3" /> LOCKED
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JOURNAL MODAL */}
      {journalModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-300 border border-gray-100">
            <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#1A1C21] italic uppercase tracking-tighter">Journal Reassign</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Update item ticket linkage</p>
                </div>
              </div>
              <button onClick={() => setJournalModalOpen(false)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Item Identity</label>
                <div className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center px-6 font-black text-[#003366] text-sm tracking-wider">
                  <Barcode className="w-4 h-4 mr-3 opacity-30" /> {journalForm.serial}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">From Ticket</label>
                  <div className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center px-6 font-black text-gray-400 text-xs uppercase tracking-wider">
                    {journalForm.from_ticket || 'NONE'}
                  </div>
                </div>

                <div className="flex flex-col gap-2 relative">
                  <label className="text-[10px] font-black text-[#0066FF] uppercase tracking-widest pl-1 italic flex items-center gap-2">Target Ticket</label>
                  <input
                    autoFocus
                    type="text"
                    list="ticket-list"
                    placeholder="e.g. TICKET-105"
                    value={journalForm.to_ticket}
                    onChange={(e) => setJournalForm({ ...journalForm, to_ticket: e.target.value.toUpperCase() })}
                    className="w-full h-14 bg-white border-2 border-[#0066FF]/20 focus:border-[#0066FF] rounded-2xl px-6 font-black outline-none transition-all uppercase text-[#1A1C21]"
                  />
                  <datalist id="ticket-list">
                    {tickets.map((t: Ticket) => (
                      <option key={t.id} value={t.id}>{t.customer_name || t.title}</option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setJournalModalOpen(false)}
                  className="flex-1 h-14 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!journalForm.to_ticket) return toast.error("Target ticket required");
                    try {
                      await toast.promise(processJournal(selectedEngineerId, [journalForm]), {
                        loading: 'Updating linkage...',
                        success: 'Item successfully reassigned',
                        error: (err: any) => err.message || 'Failed to journal'
                      });
                      setJournalModalOpen(false);
                      setSelectedIndex(-1);
                    } catch(e) {}
                  }}
                  className="flex-[2] h-14 bg-[#0066FF] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  Confirm Journal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

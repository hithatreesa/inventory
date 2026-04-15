"use client"

import React, { useState } from 'react'
import { Plus, UserPlus, Clock, CheckCircle2, AlertCircle, Play, CheckCircle } from 'lucide-react'
import { useData } from '@/lib/context/DataContext'

export default function TicketsPage() {
   const { tickets, engineers, createTicket, updateTicket, issueItems, completeTicket, inventory } = useData()
   const [isCreateOpen, setIsCreateOpen] = useState(false)
   const [newTicketDetail, setNewTicketDetail] = useState({ customer_name: '', issue_description: '', target_item: 'item1', req_qty: 1 })

   const handleCreate = async () => {
      if (!newTicketDetail.customer_name) return;
      await createTicket({
          customer_name: newTicketDetail.customer_name,
          issue_description: newTicketDetail.issue_description,
          requirements: [{ item_id: newTicketDetail.target_item, qty: Number(newTicketDetail.req_qty) }]
      });
      setIsCreateOpen(false);
      setNewTicketDetail({ customer_name: '', issue_description: '', target_item: 'item1', req_qty: 1 })
   }

   const handleAssign = async (ticketId: string, engineerId: string) => {
      await updateTicket(ticketId, { status: 'ASSIGNED', assigned_engineer_id: engineerId })
   }

   const columns = [
      { id: 'CREATED', title: 'New Requests', icon: <Clock className="w-4 h-4 text-orange-500" /> },
      { id: 'ASSIGNED', title: 'Assigned', icon: <UserPlus className="w-4 h-4 text-blue-500" /> },
      { id: 'IN_PROGRESS', title: 'In Progress', icon: <AlertCircle className="w-4 h-4 text-[#003366]" /> },
      { id: 'COMPLETED', title: 'Completed', icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> }
   ]

   return (
      <div className="space-y-6 pb-8 animate-in fade-in duration-500">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-border-main shadow-sm gap-4">
            <div>
               <h1 className="text-xl font-black text-[#003366] tracking-tighter italic uppercase">Service Desk</h1>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Manage Workflows & Assignments</p>
            </div>
            <button
               onClick={() => setIsCreateOpen(true)}
               className="h-10 px-6 rounded-xl bg-[#003366] text-white font-black text-[10px] tracking-widest uppercase italic shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-blue-900 transition-all"
            >
               <Plus className="w-4 h-4" /> New Request
            </button>
         </div>

         {/* KANBAN BOARD */}
         <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
            {columns.map(col => {
               const colTickets = (tickets || []).filter(t => t.status === col.id)
               return (
                  <div key={col.id} className="min-w-[320px] w-[320px] snap-center bg-gray-50/50 rounded-3xl border border-gray-100 p-4 flex flex-col max-h-[70vh]">
                     <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                           {col.icon}
                           <h2 className="text-[11px] font-black text-[#003366] uppercase tracking-widest italic">{col.title}</h2>
                        </div>
                        <span className="text-[9px] font-black bg-white border border-gray-100 px-2 py-0.5 rounded-md italic text-gray-400">{colTickets.length}</span>
                     </div>
                     <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                        {colTickets.length === 0 ? (
                           <div className="text-center py-12 text-[10px] font-black uppercase tracking-widest italic text-gray-300">Empty</div>
                        ) : colTickets.map(ticket => {
                           const isAssigned = !!(ticket.assigned_engineer_id || ticket.engineer_id)
                           const assignedEng = engineers.find(e => e.id === (ticket.assigned_engineer_id || ticket.engineer_id))
                           
                           return (
                              <div key={ticket.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col gap-2">
                                 {/* Accent Line */}
                                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#003366]/20 group-hover:bg-[#003366] transition-colors" />
                                 
                                 <div className="pl-2">
                                    <h3 className="text-sm font-black text-[#003366] uppercase tracking-tight leading-tight">{ticket.customer_name || ticket.title}</h3>
                                    <p className="text-[10px] font-medium text-gray-500 mt-1 line-clamp-2">{ticket.issue_description || ticket.description}</p>
                                    
                                    {ticket.requirements && ticket.requirements.length > 0 && (
                                       <div className="mt-2 text-[9px] font-bold text-gray-400">
                                          REQS: {ticket.requirements.map(r => `${r.qty}x ${r.item_id}`).join(', ')}
                                       </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                       <div className="flex flex-col">
                                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest italic mb-0.5">Assigned To</span>
                                          {isAssigned ? (
                                             <span className="text-[10px] font-black text-[#003366] uppercase">{assignedEng?.name || 'Unknown'}</span>
                                          ) : (
                                             <select 
                                                className="text-[10px] font-black text-blue-600 bg-blue-50 border-none rounded p-1 outline-none cursor-pointer uppercase italic"
                                                onChange={(e) => handleAssign(ticket.id, e.target.value)}
                                                defaultValue=""
                                             >
                                                <option value="" disabled>Assign Eng...</option>
                                                {engineers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                             </select>
                                          )}
                                       </div>
                                       
                                       {/* Workflow Action Buttons */}
                                       <div className="flex gap-2">
                                          {ticket.status === 'ASSIGNED' && (
                                             <button 
                                                onClick={() => issueItems(ticket.id).catch(err => alert(err.message))}
                                                className="h-7 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
                                             >
                                                <Play className="w-3 h-3" /> Issue
                                             </button>
                                          )}
                                          {ticket.status === 'IN_PROGRESS' && (
                                             <button 
                                                onClick={() => completeTicket(ticket.id).catch(err => alert(err.message))}
                                                className="h-7 px-3 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
                                             >
                                                <CheckCircle className="w-3 h-3" /> Complete
                                             </button>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           )
                        })}
                     </div>
                  </div>
               )
            })}
         </div>

         {/* CREATE TICKET MODAL */}
         {isCreateOpen && (
            <div className="fixed inset-0 bg-[#003366]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
               <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                     <div>
                        <h2 className="text-lg font-black text-[#003366] italic tracking-tight uppercase">New Request</h2>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Initiate Service Flow</p>
                     </div>
                  </div>
                  <div className="p-6 space-y-4 text-sm font-black text-[#003366] uppercase italic tracking-wide">
                     <div>
                        <label className="block text-[10px] text-gray-400 mb-2">Customer Name</label>
                        <input 
                           type="text" 
                           value={newTicketDetail.customer_name}
                           onChange={e => setNewTicketDetail(prev => ({...prev, customer_name: e.target.value}))}
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10 transition-all font-sans normal-case font-medium text-gray-800"
                           placeholder="e.g. Acme Corp"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] text-gray-400 mb-2">Issue Description</label>
                        <textarea 
                           rows={2}
                           value={newTicketDetail.issue_description}
                           onChange={e => setNewTicketDetail(prev => ({...prev, issue_description: e.target.value}))}
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10 transition-all font-sans normal-case font-medium text-gray-800 resize-none"
                           placeholder="Describe the issue..."
                        />
                     </div>
                     <div className="flex gap-4">
                        <div className="flex-1">
                           <label className="block text-[10px] text-gray-400 mb-2">Required Item</label>
                           <select 
                              value={newTicketDetail.target_item}
                              onChange={e => setNewTicketDetail(prev => ({...prev, target_item: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none font-sans font-medium text-gray-800"
                           >
                              <option value="item1">Laptop (ITM1)</option>
                              <option value="item2">Router (ITM2)</option>
                           </select>
                        </div>
                        <div className="w-24">
                           <label className="block text-[10px] text-gray-400 mb-2">Qty</label>
                           <input 
                              type="number" min="1"
                              value={newTicketDetail.req_qty}
                              onChange={e => setNewTicketDetail(prev => ({...prev, req_qty: Number(e.target.value)}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none font-sans font-medium text-gray-800 text-center"
                           />
                        </div>
                     </div>
                  </div>
                  <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                     <button 
                        onClick={() => setIsCreateOpen(false)}
                        className="px-6 py-2.5 rounded-xl border border-gray-200 text-[#003366] font-black text-[10px] tracking-widest uppercase italic hover:bg-gray-100 transition-colors"
                     >
                        Cancel
                     </button>
                     <button 
                        onClick={handleCreate}
                        disabled={!newTicketDetail.customer_name}
                        className="px-6 py-2.5 rounded-xl bg-[#003366] text-white font-black text-[10px] tracking-widest uppercase italic shadow-lg shadow-primary/20 hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        Create
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   )
}

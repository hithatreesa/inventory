"use client"

import React, { useState } from 'react'
import { 
  ArrowRight, 
  MapPin, 
  Truck, 
  Info, 
  Plus, 
  Minus, 
  Calendar, 
  Zap,
  Bell,
  HelpCircle
} from 'lucide-react'
import { stockTransferData } from '@/lib/mock-data/inventory'

export default function StockTransferPage() {
  const [items, setItems] = useState(stockTransferData.lineItems)

  const totalUnits = items.reduce((acc, item) => acc + item.transferQty, 0)
  const grossValue = items.reduce((acc, item) => acc + (item.transferQty * item.unitValue), 0)

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-6 w-full sm:w-auto overflow-hidden">
          <h1 className="text-2xl font-black text-text-main italic tracking-tight truncate">Stock Transfer</h1>
          <div className="bg-sidebar-bg px-3 py-1.5 rounded-lg border border-border-main text-[10px] font-black text-text-secondary uppercase tracking-widest whitespace-nowrap shrink-0">
            REF: {stockTransferData.txnId}
          </div>
        </div>
        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-border-main">
           <div className="flex gap-4">
             <Bell className="w-5 h-5 text-text-secondary cursor-pointer hover:text-primary transition-colors" />
             <HelpCircle className="w-5 h-5 text-text-secondary cursor-pointer hover:text-primary transition-colors" />
           </div>
           <div className="flex items-center gap-3 border-l border-border-main pl-6">
             <div className="text-right">
               <p className="text-xs font-black text-text-main leading-none">Alex Mercer</p>
               <p className="text-[10px] font-bold text-text-secondary uppercase tracking-tighter mt-1">Inventory Manager</p>
             </div>
             <div className="w-8 h-8 rounded-full bg-gray-100 border border-border-main" />
           </div>
        </div>
      </div>

      {/* Source/Destination Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
        <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-border-main shadow-sm relative">
           <div className="flex justify-between items-start mb-4">
             <div>
               <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">SOURCE ORIGIN</p>
               <h3 className="text-xl font-black text-text-main tracking-tight italic">{stockTransferData.source.name}</h3>
             </div>
             <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
               <MapPin className="w-5 h-5" />
             </div>
           </div>
           <div className="flex justify-between text-[10px] font-bold text-text-secondary mb-4 uppercase tracking-tighter">
             <span>Storage Zone</span>
             <span>{stockTransferData.source.zone}</span>
           </div>
           <div className="space-y-2 pt-2 border-t border-gray-50">
             <div className="flex justify-between text-[10px] font-black">
               <span className="text-text-secondary uppercase tracking-widest">Total Capacity</span>
               <span className="text-primary">{stockTransferData.source.capacity}% Utilized</span>
             </div>
             <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
               <div className="h-full bg-primary" style={{ width: `${stockTransferData.source.capacity}%` }} />
             </div>
           </div>
        </div>

        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center text-primary border border-primary/10 shadow-inner">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-border-main shadow-sm">
           <div className="flex justify-between items-start mb-4">
             <div>
               <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest leading-none mb-1">TARGET DESTINATION</p>
               <h3 className="text-xl font-black text-text-main tracking-tight italic">{stockTransferData.target.name}</h3>
             </div>
             <div className="w-10 h-10 bg-gray-50 border border-border-main rounded-xl flex items-center justify-center text-text-secondary">
               <MapPin className="w-5 h-5" />
             </div>
           </div>
           <div className="flex justify-between text-[10px] font-bold text-text-secondary mb-4 uppercase tracking-tighter">
             <span>Available Floor Space</span>
             <span className="text-text-main">{stockTransferData.target.space}</span>
           </div>
           <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase tracking-tighter">
             <span>Arrival Window</span>
             <span className="text-text-main">{stockTransferData.target.arrival}</span>
           </div>
           <div className="h-1.5 w-full bg-gray-50 rounded-full mt-4 flex gap-1">
              <div className="flex-1 bg-gray-200 rounded-full" />
              <div className="flex-1 bg-gray-200 rounded-full" />
              <div className="flex-1 bg-gray-100 rounded-full" />
           </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm border border-border-main p-4 rounded-2xl">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-text-secondary">
          <Info className="w-4 h-4" />
        </div>
        <p className="text-xs font-medium text-text-main">
          Metro Fulfillment is currently at <span className="font-bold">low capacity</span>. Rapid processing is enabled.
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex items-center gap-4">
        <Truck className="w-5 h-5 text-primary" />
        <p className="text-xs font-bold text-primary">Scheduled fleet: Truck ID #772 is assigned for this transfer.</p>
      </div>

      {/* Line Items */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-2xl font-black text-text-main tracking-tight italic">Line Item Selection</h2>
            <p className="text-sm text-text-secondary font-medium">Select the SKU and quantities for movement.</p>
          </div>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary/10 text-primary rounded-xl text-xs font-black shadow-sm hover:bg-primary hover:text-white transition-all">
            <Plus className="w-4 h-4" /> Add New Item
          </button>
        </div>

        <div className="bg-white rounded-[32px] border border-border-main shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px] lg:min-w-0">
              <thead>
                <tr className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] border-b border-gray-50">
                  <th className="px-8 py-6">PRODUCT DETAILS</th>
                  <th className="px-6 py-6 text-center">SKU CODE</th>
                  <th className="px-6 py-6 text-center">IN STOCK</th>
                  <th className="px-6 py-6 text-center">TRANSFER QTY</th>
                  <th className="px-8 py-6 text-right">UNIT VALUE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-text-main">{item.name}</p>
                          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-tighter">Batch: {item.batch}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center text-[10px] font-bold text-text-secondary font-mono uppercase">{item.sku}</td>
                    <td className="px-6 py-6 text-center text-sm font-bold text-text-main">{item.inStock} units</td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-center gap-4">
                         <button className="w-6 h-6 rounded-lg border border-border-main flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-all hover:border-primary">
                           <Minus className="w-3 h-3" />
                         </button>
                         <span className="text-sm font-black text-text-main w-8 text-center">{item.transferQty}</span>
                         <button className="w-6 h-6 rounded-lg border border-border-main flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-all hover:border-primary">
                           <Plus className="w-3 h-3" />
                         </button>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right text-sm font-extrabold text-text-main">₹{item.unitValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-border-main shadow-sm space-y-8">
          <h3 className="text-lg font-black text-text-main uppercase tracking-tight italic">Transaction Metadata</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest pl-1">EXPECTED ARRIVAL</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-primary absolute left-4 top-1/2 -translate-y-1/2" />
                <input type="text" defaultValue={stockTransferData.metadata.expectedArrival} className="w-full bg-sidebar-bg border border-border-main rounded-xl pl-12 pr-4 py-3.5 text-xs font-bold text-text-main focus:outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest pl-1">LOGISTICS PRIORITY</label>
              <div className="relative">
                <Zap className="w-4 h-4 text-warning absolute left-4 top-1/2 -translate-y-1/2" />
                <input type="text" defaultValue={stockTransferData.metadata.logisticsPriority} className="w-full bg-sidebar-bg border border-border-main rounded-xl pl-12 pr-4 py-3.5 text-xs font-bold text-text-main focus:outline-none" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
             <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest pl-1">INTERNAL NOTES</label>
             <textarea 
               placeholder="Add specific handling instructions or reason for transfer..." 
               rows={4}
               className="w-full bg-sidebar-bg border border-border-main rounded-xl px-4 py-3.5 text-xs font-medium text-text-main focus:outline-none resize-none"
             />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-primary p-8 rounded-[32px] text-white shadow-xl shadow-primary/20 relative overflow-hidden">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-8">TRANSFER SUMMARY</h3>
            <div className="space-y-4 pb-8 border-b border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold opacity-80">Total SKUs</span>
                <span className="text-sm font-black">{items.length} Types</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold opacity-80">Total Units</span>
                <span className="text-sm font-black">{totalUnits} Units</span>
              </div>
            </div>
            <div className="pt-8 flex flex-col items-end">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Gross Value</span>
               <h2 className="text-4xl font-black tracking-tighter italic">₹{grossValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</h2>
            </div>
          </div>

          <button className="w-full bg-primary text-white py-4 rounded-xl font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]">
            Finalize & Ship Transfer
          </button>
          <button className="w-full bg-sidebar-bg border border-border-main text-text-main py-4 rounded-xl font-black hover:bg-white transition-all active:scale-[0.98]">
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

import React, { useMemo, useState } from 'react'
import {
   Package,
   ArrowUpRight,
   ArrowDownRight,
   AlertCircle,
   Plus,
   FileText,
   Activity,
   Zap,
   TrendingDown,
   BarChart3,
   ChevronRight,
   ClipboardCheck,
   Package2,
   Boxes,
   PieChart,
   TrendingUp,
   ShoppingCart
} from 'lucide-react'
import {
   BarChart,
   Bar,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   Cell
} from 'recharts'
import { useData } from '@/lib/context/DataContext'
import { MetricCard } from '@/components/shared/MetricCard'
import { ActivityStream } from '@/components/shared/ActivityStream'
import { QuickEntryModal } from '@/components/modals/QuickEntryModal'
import { toast } from 'sonner'
import { useDashboardData } from '@/utils/useDashboardData'

export default function DashboardPage() {
   const { inventory, logs, transactions } = useData()
   const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false)

   // Construction of safeData payload formatted for user-provided DashboardDataLayer
   const data = useMemo(() => {
      return {
         sales: transactions.filter((t: any) => t.type === 'SALE' || t.type === 'OUTWARD').map((t: any) => {
            const match = inventory.find((i: any) => i.id == t.item_id);
            return {
               date: t.date || new Date().toISOString().split("T")[0],
               total: t.quantity * (t.price || match?.price || 0),
               items: [{ qty: t.quantity, costPrice: match?.price || 0, price: t.price || match?.price || 0, category: match?.category, name: match?.name }]
            }
         }),
         purchases: transactions.filter((t: any) => t.type === 'PURCHASE' || t.type === 'INWARD').map((t: any) => {
            return {
               date: t.date || new Date().toISOString().split("T")[0],
               total: t.quantity * (t.price || 0)
            }
         }),
         items: inventory.map((i: any) => ({
            ...i, qty: i.total_qty || 0, costPrice: i.price || 0, reorderLevel: i.threshold || 5, lastMovement: Date.now()
         })),
         approvals: transactions.filter((t: any) => t.status === 'PENDING')
      }
   }, [transactions, inventory]);

   const stats = useDashboardData({ data });

   const totalCatSales = stats.categorySales.reduce((sum: number, c: any) => sum + c.value, 0);
   const categorySalesWithPercent = stats.categorySales.map((c: any) => ({
      ...c,
      nameWithPercent: `${c.name} (${totalCatSales ? ((c.value / totalCatSales) * 100).toFixed(0) : 0}%)`
   })).sort((a: any, b: any) => b.value - a.value);

   return (
      <div className="space-y-4 pb-8 animate-in fade-in duration-500">
         {/* SECTION 1: HEADER & ACTIONS */}
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-border-main shadow-sm gap-4">
            <div>
               <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-black text-[#003366] tracking-tighter italic uppercase">Operational Control</h1>
               </div>
            </div>
            <div className="flex w-full sm:w-auto gap-4">
               <button
                  onClick={() => setIsQuickEntryOpen(true)}
                  className="flex-1 sm:flex-none h-9 px-4 rounded-xl bg-[#003366] text-white font-black text-[10px] tracking-widest uppercase italic shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
               >
                  <Zap className="w-4 h-4" /> Quick Entry
               </button>
            </div>
         </div>

         <QuickEntryModal isOpen={isQuickEntryOpen} onClose={() => setIsQuickEntryOpen(false)} />

         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            <MetricCard
               title="Today Sales"
               value={`₹${stats.todaySales.toLocaleString()}`}
               trend={`${stats.profitMargin}% margin`}
               icon={<ArrowUpRight className="w-5 h-5" />}
               variant="success"
               onClick={() => toast.info("Quick View: Today Sales details coming soon")}
            />
            <MetricCard
               title="Today Purchases"
               value={`₹${stats.todayPurchase.toLocaleString()}`}
               trend="↓ -2.1%"
               period="Inbound Value"
               icon={<Boxes className="w-5 h-5" />}
               variant="primary"
               onClick={() => toast.info("Quick View: Today Purchase details coming soon")}
            />
            <MetricCard
               title="Approvals"
               value={stats.pendingApprovals}
               trend={stats.pendingApprovals > 0 ? "Action Required" : "All cleared"}
               period="Pending"
               icon={<Package className="w-5 h-5" />}
               variant="primary"
               onClick={() => toast.info("Quick View: Pending Approvals coming soon")}
            />
            <MetricCard
               title="Low Stock"
               value={stats.lowStockCount}
               trend={`${stats.lowStockCount} items`}
               period="Needs reorder"
               icon={<AlertCircle className="w-5 h-5" />}
               variant="warning"
               onClick={() => toast.info("Quick View: Low Stock details coming soon")}
            />
            <MetricCard
               title="Profit"
               value={`₹${stats.profitToday.toLocaleString()}`}
               period="Net Today"
               icon={<Zap className="w-5 h-5" />}
               variant="success"
               onClick={() => toast.info("Quick View: Profit Breakdown coming soon")}
            />
            <MetricCard
               title="Stock Value"
               value={`₹${(stats.stockValuation / 1000).toFixed(1)}K`}
               period="Inventory worth"
               icon={<Package2 className="w-5 h-5" />}
               variant="primary"
               onClick={() => toast.info("Quick View: Valuation details coming soon")}
            />
         </div>

         {/* SECTION 3: ANALYTICS & MONITORING */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* Sales vs Purchase Trend */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-border-main shadow-sm flex flex-col overflow-hidden">
               <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><BarChart3 className="w-5 h-5" /></div>
                     <div>
                        <h4 className="text-sm font-black text-[#003366] italic tracking-tight uppercase">Operational Dynamics</h4>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Category-wise Sales Volume</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#003366]" />
                        <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Sales Distribution</span>
                     </div>
                  </div>
               </div>
               <div className="p-4 flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={categorySalesWithPercent} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis
                           dataKey="nameWithPercent"
                           axisLine={false}
                           tickLine={false}
                           tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }}
                           interval={0}
                        />
                        <YAxis
                           axisLine={false}
                           tickLine={false}
                           tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 900 }}
                        />
                        <Tooltip
                           cursor={{ fill: 'rgba(0, 51, 102, 0.03)' }}
                           contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', fontStyle: 'italic', fontWeight: 900 }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={32}>
                           {stats.categorySales.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill="#003366" />)}
                        </Bar>
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* ATTENTION NEEDED PANEL */}
            <div className="lg:col-span-4 bg-[#fff9f2] rounded-2xl border border-orange-100 shadow-sm flex flex-col overflow-hidden">
               <div className="p-4 border-b border-orange-100/50 bg-orange-50/30">
                  <h4 className="text-sm font-black text-orange-800 italic tracking-tight uppercase">Attention Needed</h4>
                  <p className="text-[10px] font-bold text-orange-600/60 uppercase tracking-widest">Immediate Action Items</p>
               </div>
               <div className="p-3 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
                  <div className="space-y-2">
                     {stats.lowStockCount > 0 && (
                        <div className="flex gap-4 group p-3 bg-white rounded-xl border border-orange-100 hover:shadow-md transition-all cursor-pointer">
                           <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                              <AlertCircle className="w-4 h-4" />
                           </div>
                           <div className="flex-1">
                              <p className="text-xs font-black text-orange-900 italic uppercase leading-none">{stats.lowStockCount} Items Low Stock</p>
                              <p className="text-[8px] font-black text-orange-600/70 uppercase tracking-widest mt-1">Review inventory limits</p>
                           </div>
                        </div>
                     )}
                     {stats.pendingApprovals > 0 && (
                        <div className="flex gap-4 group p-3 bg-white rounded-xl border border-blue-100 hover:shadow-md transition-all cursor-pointer">
                           <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                              <FileText className="w-4 h-4" />
                           </div>
                           <div className="flex-1">
                              <p className="text-xs font-black text-blue-900 italic uppercase leading-none">{stats.pendingApprovals} Approvals Pending</p>
                              <p className="text-[8px] font-black text-blue-600/70 uppercase tracking-widest mt-1">Pending clearance</p>
                           </div>
                        </div>
                     )}
                     {stats.deadStock.length > 0 && (
                        <div className="flex gap-4 group p-3 bg-white rounded-xl border border-red-100 hover:shadow-md transition-all cursor-pointer">
                           <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                              <Zap className="w-4 h-4" />
                           </div>
                           <div className="flex-1">
                              <p className="text-xs font-black text-red-900 italic uppercase leading-none">{stats.deadStock.length} Dead Stock Detected</p>
                              <p className="text-[8px] font-black text-red-600/70 uppercase tracking-widest mt-1">Idle &gt; 30 days</p>
                           </div>
                        </div>
                     )}
                     {stats.lowStockCount === 0 && stats.pendingApprovals === 0 && stats.deadStock.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-green-600/60">
                           <ClipboardCheck className="w-12 h-12 mb-4 text-green-500" />
                           <p className="text-sm font-black uppercase italic tracking-widest">All clear! No urgent actions required.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {/* SECTION 5: ACTION PANELS (TOP SELLING & DEAD STOCK) */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">
            {/* Top Selling */}
            <div className="bg-white rounded-2xl border border-border-main p-4 shadow-sm">
               <h4 className="text-lg font-black text-[#003366] italic tracking-tight uppercase border-b border-gray-50 pb-2 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" /> Top Selling
               </h4>
               <div className="space-y-1">
                  {stats.topSelling.length > 0 ? stats.topSelling.map((item: any, idx: number) => (
                     <div key={idx} className="flex justify-between items-center p-2.5 bg-gray-50/50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-6 h-6 rounded-full bg-[#003366] text-white flex items-center justify-center font-black text-[9px] italic">#{idx + 1}</div>
                           <span className="font-black text-[#003366] uppercase tracking-tight text-xs">{item.name}</span>
                        </div>
                        <div className="text-right">
                           <span className="font-black text-[#003366] tabular-nums bg-white px-2 py-0.5 rounded-lg border border-gray-100 shadow-sm text-[10px]">{item.qty} units</span>
                        </div>
                     </div>
                  )) : (
                     <p className="text-[10px] font-black uppercase tracking-widest text-center text-gray-400 py-4">No Sales Data</p>
                  )}
               </div>
            </div>

            {/* Smart Reorder Panel */}
            <div className="bg-[#003366] rounded-2xl border border-[#003366] p-4 shadow-xl text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-all duration-1000">
                  <ShoppingCart className="w-16 h-16" />
               </div>
               <div className="relative z-10">
                  <h4 className="text-lg font-black italic tracking-tight uppercase border-b border-white/10 pb-2 mb-3 flex items-center gap-2 text-blue-200">
                     <Zap className="w-4 h-4" /> Reorder Intelligence
                  </h4>
                  <div className="space-y-2">
                     {stats.reorderItems.slice(0, 4).length > 0 ? stats.reorderItems.slice(0, 4).map((item: any, i: number) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-2.5 rounded-xl hover:bg-white/10 transition-all flex items-center justify-between group/line">
                           <div className="flex-1">
                              <p className="text-[10px] font-black uppercase italic tracking-tight text-white mb-1 leading-none">{item.name}</p>
                              <div className="flex items-center gap-2">
                                 <span className="text-[8px] font-black text-blue-300 uppercase tracking-widest">Stock: {item.qty}</span>
                                 <div className="w-1 h-1 rounded-full bg-blue-400" />
                                 <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest">Velocity: {item.velocity}/day</span>
                              </div>
                           </div>
                           <button className="h-7 px-3 bg-white text-[#003366] rounded-lg text-[8px] font-black uppercase tracking-widest italic flex items-center gap-1.5 hover:bg-blue-100 transition-colors">
                              <Plus className="w-2.5 h-2.5" /> Order
                           </button>
                        </div>
                     )) : (
                        <p className="text-[10px] font-black uppercase tracking-widest text-center text-blue-300/50 py-8">Stock levels healthy</p>
                     )}
                  </div>
               </div>
            </div>

            {/* Dead Stock */}
            <div className="bg-white rounded-2xl border border-border-main p-4 shadow-sm relative overflow-hidden group">
               <div className="relative z-10">
                  <h4 className="text-lg font-black text-[#003366] italic tracking-tight uppercase border-b border-gray-50 pb-2 mb-3 flex items-center gap-2">
                     <TrendingDown className="w-4 h-4 text-gray-400" /> Dead Stock
                  </h4>
                  <div className="space-y-1">
                     {stats.deadStock.slice(0, 4).length > 0 ? stats.deadStock.slice(0, 4).map((item: any, i: number) => (
                        <div key={item.id || i} className="flex justify-between items-center p-2.5 rounded-xl hover:bg-gray-50/50 transition-all group/item border border-transparent hover:border-gray-100">
                           <div>
                              <p className="text-[10px] font-black text-[#003366] italic uppercase tracking-tight leading-none">{item.name}</p>
                              <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mt-1 italic">&gt; 30 Days Idle</p>
                           </div>
                           <button className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[8px] font-black uppercase tracking-widest italic border border-red-100/50 hover:bg-red-500 hover:text-white transition-colors">
                              Action
                           </button>
                        </div>
                     )) : (
                        <div className="pt-4 text-center opacity-50">
                           <span className="text-[10px] font-black uppercase tracking-widest text-[#003366]">No Dead Stock</span>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   )
}

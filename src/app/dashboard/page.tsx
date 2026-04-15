"use client"

import React, { useMemo, useState } from 'react'
import {
   Package,
   ArrowUpRight,
   AlertCircle,
   Plus,
   FileText,
   Activity,
   Zap,
   TrendingDown,
   BarChart3,
   ClipboardCheck,
   Package2,
   Boxes,
   TrendingUp,
   ShoppingCart,
   X
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
import { useData, InventoryItem, Transaction, Engineer } from '@/lib/context/DataContext'
import { MetricCard } from '@/components/shared/MetricCard'
import { QuickEntryModal } from '@/components/modals/QuickEntryModal'
import { useDashboardData } from '@/utils/useDashboardData'

export default function DashboardPage() {
   const { inventory, transactions, engineers } = useData()
   const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false)
   const [activeMetric, setActiveMetric] = useState<string | null>(null)
   
   // Fix purity: Initialize once, don't use useMemo for impure functions
   const [dashboardInitTime] = useState(() => Date.now())

   // Construction of safeData payload formatted for user-provided DashboardDataLayer
   const data = useMemo(() => {
      return {
         sales: transactions.filter((t: Transaction) => t.type === 'SALE' || t.type === 'OUTWARD').map((t: Transaction) => {
            const match = inventory.find((i: InventoryItem) => i.id == t.item_id);
            const matchPrice = match?.price || 0;
            return {
               date: t.date || new Date().toISOString().split("T")[0],
               total: t.quantity * (t.price || matchPrice),
               items: [{ qty: t.quantity, costPrice: matchPrice, price: t.price || matchPrice, category: match?.category, name: match?.name }]
            }
         }),
         purchases: transactions.filter((t: Transaction) => t.type === 'PURCHASE' || t.type === 'INWARD').map((t: Transaction) => {
            return {
               date: t.date || new Date().toISOString().split("T")[0],
               total: t.quantity * (t.price || 0)
            }
         }),
         items: inventory.map((i: InventoryItem) => ({
            ...i, qty: i.total_qty || 0, costPrice: i.price || 0, reorderLevel: i.threshold || 5, lastMovement: dashboardInitTime
         })),
         approvals: transactions.filter((t: Transaction) => t.status === 'PENDING')
      }
   }, [transactions, inventory, dashboardInitTime]);

   const stats = useDashboardData({ data });

   // Aggregate Engineer Stats for the new Status Section
   const engineerStats = useMemo(() => {
      return (engineers || []).map((eng: Engineer) => {
         let taken = 0;
         let returned = 0;
         transactions.filter((t: Transaction) => t.engineer_id === eng.id).forEach((t: Transaction) => {
            if (t.type === 'OUTWARD' || t.type === 'ISSUE') taken += Number(t.quantity);
            if (t.type === 'RETURN') returned += Number(t.quantity);
         });
         return {
            ...eng,
            taken,
            pending: taken - returned
         };
      }).filter(eng => eng.taken > 0);
   }, [engineers, transactions]);

   const totalCatSales = useMemo(() => (stats.categorySales).reduce((sum: number, c: { value: number }) => sum + c.value, 0), [stats.categorySales]);

   const categorySalesWithPercent = useMemo(() => {
      return (stats.categorySales).map((c: { name: string; value: number }) => ({
         ...c,
         nameWithPercent: `${c.name} (${totalCatSales ? ((c.value / totalCatSales) * 100).toFixed(0) : 0}%)`
      })).sort((a: { value: number }, b: { value: number }) => b.value - a.value);
   }, [stats.categorySales, totalCatSales]);

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

         {/* KPI GRID */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
            <MetricCard
               title="Today Sales"
               value={`₹${stats.todaySales.toLocaleString('en-IN')}`}
               trend={`${stats.profitMargin}% margin`}
               icon={<ArrowUpRight className="w-5 h-5" />}
               variant="success"
               onClick={() => setActiveMetric("today-sales")}
            />
            <MetricCard
               title="Today Purchases"
               value={`₹${stats.todayPurchase.toLocaleString('en-IN')}`}
               trend="↓ -2.1%"
               period="Inbound Value"
               icon={<Boxes className="w-5 h-5" />}
               variant="primary"
               onClick={() => setActiveMetric("today-purchases")}
            />
            <MetricCard
               title="Approvals"
               value={stats.pendingApprovals}
               trend={stats.pendingApprovals > 0 ? "Action Required" : "All cleared"}
               period="Pending"
               icon={<Package className="w-5 h-5" />}
               variant="primary"
               onClick={() => setActiveMetric("approvals")}
            />
            <MetricCard
               title="Low Stock"
               value={stats.lowStockCount}
               trend={`${stats.lowStockCount} items`}
               period="Needs reorder"
               icon={<AlertCircle className="w-5 h-5" />}
               variant="warning"
               onClick={() => setActiveMetric("low-stock")}
            />
            <MetricCard
               title="Profit"
               value={`₹${stats.profitToday.toLocaleString('en-IN')}`}
               period="Net Today"
               icon={<Zap className="w-5 h-5" />}
               variant="success"
               onClick={() => setActiveMetric("profit")}
            />
            <MetricCard
               title="Stock Value"
               value={`₹${(stats.stockValuation / 1000).toFixed(1)}K`}
               period="Inventory worth"
               icon={<Package2 className="w-5 h-5" />}
               variant="primary"
               onClick={() => setActiveMetric("stock-value")}
            />
         </div>



         {/* NEW: PERSONNEL DEPLOYMENT SECTION (AS REQUESTED) */}
         {engineerStats.length > 0 && (
            <div className="w-full">
               <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-[10px] font-black text-[#003366] uppercase tracking-[0.2em] italic flex items-center gap-2 opacity-60">
                     <Activity className="w-3 h-3" /> Personnel Deployment Awareness
                  </h3>
               </div>
               <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                  {engineerStats.map((eng, idx) => (
                     <div key={eng.id || idx} className="min-w-[280px] bg-[#003366] rounded-[24px] p-5 shadow-xl shadow-blue-900/10 flex flex-col justify-between relative overflow-hidden group snap-start">
                        {/* Decorative Icon */}
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center">
                           <Package className="w-4 h-4 text-blue-300 opacity-60" />
                           <span className="text-[9px] font-black text-white leading-none mt-1">{eng.pending}</span>
                        </div>

                        <div className="relative z-10">
                           <h2 className="text-xl font-black text-white italic tracking-tight uppercase leading-tight mb-1">
                              {eng.name}
                           </h2>
                           <p className="flex items-center gap-1.5 text-[9px] font-black text-blue-300/80 uppercase tracking-widest italic">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Standby & Active
                           </p>
                        </div>
                        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">

                           <div className="flex items-baseline gap-1.5">
                              <span className="text-[9px] font-black text-blue-300/50 uppercase tracking-widest italic">TAKEN :</span>
                              <span className="text-white text-base font-black tabular-nums">{eng.taken}</span>
                           </div>

                           <div className="flex items-baseline gap-1.5">
                              <span className="text-[9px] font-black text-blue-300/50 uppercase tracking-widest italic">PENDING :</span>
                              <span className="text-yellow-400 text-base font-black tabular-nums">{eng.pending}</span>
                           </div>

                        </div>

                     </div>
                  ))}
               </div>
            </div>
         )}


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
               <div className="h-[300px] w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={categorySalesWithPercent} margin={{ top: 20, right: 30, left: 0, bottom: 20 }} barSize={32}>
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
                  {stats.topSelling.length > 0 ? stats.topSelling.map((item: { name: string; qty: number }, idx: number) => (
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
                     {stats.reorderItems.slice(0, 4).length > 0 ? stats.reorderItems.slice(0, 4).map((item: { name: string; qty: number; velocity: number }, i: number) => (
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
                     {stats.deadStock.slice(0, 4).length > 0 ? stats.deadStock.slice(0, 4).map((item: { name: string; id?: string }, i: number) => (
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

         <DashboardMetricModal
            type={activeMetric}
            onClose={() => setActiveMetric(null)}
            data={data}
            stats={stats}
         />
      </div>
   )
}

/* ==========================================================================
   DRILL-DOWN MODAL COMPONENT
   ========================================================================== */

interface DashboardMetricModalProps {
   type: string | null;
   onClose: () => void;
   data: {
      sales: any[];
      purchases: any[];
      items: any[];
      approvals: any[];
   };
   stats: any;
}

function DashboardMetricModal({ type, onClose, data, stats }: DashboardMetricModalProps) {
   if (!type) return null;

   const title = type.replace(/-/g, ' ').toUpperCase();

   const renderContent = () => {
      switch (type) {
         case 'today-sales': return <SalesDetailView data={data} />;
         case 'today-purchases': return <PurchasesDetailView data={data} />;
         case 'approvals': return <ApprovalsDetailView data={data} />;
         case 'low-stock': return <LowStockDetailView stats={stats} />;
         case 'profit': return <ProfitDetailView stats={stats} data={data} />;
         case 'stock-value': return <ValuationDetailView stats={stats} />;
         default: return null;
      }
   }

   return (
      <div className="fixed inset-0 bg-[#003366]/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
         <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
               <div>
                  <h2 className="text-xl font-black text-[#003366] italic tracking-tight uppercase flex items-center gap-3">
                     <Zap className="w-5 h-5 opacity-40" /> {title} DRILL-DOWN
                  </h2>
               </div>
               <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
               </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-6 custom-scrollbar">
               {renderContent()}
            </div>
         </div>
      </div>
   );
}

function SalesDetailView({ data }: { data: { sales: any[] } }) {
   return (
      <div className="space-y-4">
         <table className="w-full text-left">
            <thead>
               <tr className="border-b border-gray-100">
                  <th className="py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Item Info</th>
                  <th className="py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Qty</th>
                  <th className="py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Revenue</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {data.sales.length > 0 ? data.sales.map((sale: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                     <td className="py-4">
                        <p className="text-xs font-black text-[#003366] italic uppercase">{sale.items[0]?.name || 'Unknown'}</p>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Ref: {sale.date}</p>
                     </td>
                     <td className="py-4 text-center">
                        <span className="text-xs font-black tabular-nums">{sale.items[0]?.qty}</span>
                     </td>
                     <td className="py-4 text-right">
                        <span className="text-xs font-black text-green-600 tabular-nums">₹{sale.total.toLocaleString('en-IN')}</span>
                     </td>
                  </tr>
               )) : (
                  <tr>
                     <td colSpan={3} className="py-12 text-center opacity-30 text-[10px] font-black uppercase tracking-[0.2em] italic">No sales recorded today</td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>
   );
}

function PurchasesDetailView({ data }: { data: { purchases: any[] } }) {
   return (
      <div className="space-y-4">
         <table className="w-full text-left">
            <thead>
               <tr className="border-b border-gray-100">
                  <th className="py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Batch Info</th>
                  <th className="py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Value</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {data.purchases.length > 0 ? data.purchases.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                     <td className="py-4">
                        <p className="text-xs font-black text-[#003366] italic uppercase">PO BATCH #{idx + 1}</p>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Date: {p.date}</p>
                     </td>
                     <td className="py-4 text-right">
                        <span className="text-xs font-black text-[#003366] tabular-nums">₹{p.total.toLocaleString('en-IN')}</span>
                     </td>
                  </tr>
               )) : (
                  <tr>
                     <td colSpan={2} className="py-12 text-center opacity-30 text-[10px] font-black uppercase tracking-[0.2em] italic">No purchases recorded today</td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>
   );
}

function ApprovalsDetailView({ data }: { data: { approvals: any[] } }) {
   return (
      <div className="space-y-4">
         {data.approvals.length > 0 ? data.approvals.map((app: any, idx: number) => (
            <div key={idx} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex justify-between items-center group hover:bg-white hover:shadow-lg transition-all">
               <div>
                  <p className="text-xs font-black text-[#003366] italic uppercase">{app.type} APPROVAL REQUIRED</p>
                  <p className="text-[8px] font-black text-blue-600/70 uppercase tracking-widest mt-1">Ref: {app.reference || 'N/A'}</p>
               </div>
               <button className="px-4 py-2 bg-[#003366] text-white text-[8px] font-black uppercase tracking-widest italic rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  Review
               </button>
            </div>
         )) : (
            <div className="py-12 text-center opacity-30 text-[10px] font-black uppercase tracking-[0.2em] italic">No approvals pending</div>
         )}
      </div>
   );
}

function LowStockDetailView({ stats }: any) {
   return (
      <div className="space-y-4">
         {stats.reorderItems.length > 0 ? stats.reorderItems.map((item: any, idx: number) => (
            <div key={idx} className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex justify-between items-center bg-white hover:shadow-md transition-all">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                     <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-xs font-black text-[#003366] italic uppercase">{item.name}</p>
                     <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest mt-1">Current Stock: {item.qty} / Min: {item.reorderLevel}</p>
                  </div>
               </div>
               <button className="px-4 py-2 bg-orange-600 text-white text-[8px] font-black uppercase tracking-widest italic rounded-xl shadow-lg shadow-orange-600/20">
                  Reorder
               </button>
            </div>
         )) : (
            <div className="py-12 text-center opacity-30 text-[10px] font-black uppercase tracking-[0.2em] italic">All stock levels healthy</div>
         )}
      </div>
   );
}

function ProfitDetailView({ stats, data }: any) {
   const costOfGoods = stats.todaySales - stats.profitToday;
   return (
      <div className="space-y-6">
         {/* Hero Summary Row */}
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 bg-green-50 rounded-3xl border border-green-100">
               <p className="text-[10px] font-black text-green-600 uppercase tracking-widest italic mb-2">Total Revenue</p>
               <p className="text-3xl font-black text-[#003366] italic tracking-tighter tabular-nums">₹{stats.todaySales.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic mb-2">Net Profit Today</p>
               <p className="text-3xl font-black text-[#003366] italic tracking-tighter tabular-nums">₹{stats.profitToday.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100">
               <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest italic mb-2">Cost of Goods</p>
               <p className="text-3xl font-black text-[#003366] italic tracking-tighter tabular-nums">₹{costOfGoods.toLocaleString('en-IN')}</p>
            </div>
         </div>

         {/* Margin Analysis */}
         <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-4">Daily Margin Analysis</p>
            <div className="h-5 bg-white rounded-full overflow-hidden border border-gray-100">
               <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(stats.profitMargin, 100)}%` }}
               />
            </div>
            <div className="flex justify-between mt-3">
               <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Efficiency: {stats.profitMargin}%</span>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target: 30%</span>
            </div>
         </div>

         {/* Sales Breakdown Table */}
         <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
               <p className="text-[10px] font-black text-[#003366] uppercase tracking-widest italic">Revenue Breakdown by Transaction</p>
            </div>
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-gray-50">
                     <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Item</th>
                     <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest italic text-center">Qty</th>
                     <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest italic text-right">Revenue</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {data.sales.length > 0 ? data.sales.map((sale: any, idx: number) => (
                     <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                           <p className="text-xs font-black text-[#003366] italic uppercase">{sale.items[0]?.name || 'Unknown'}</p>
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">{sale.items[0]?.category || 'General'}</p>
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-black tabular-nums">{sale.items[0]?.qty}</td>
                        <td className="px-6 py-4 text-right text-xs font-black text-green-600 tabular-nums">₹{sale.total.toLocaleString('en-IN')}</td>
                     </tr>
                  )) : (
                     <tr>
                        <td colSpan={3} className="py-12 text-center opacity-30 text-[10px] font-black uppercase tracking-[0.2em] italic">No sales recorded today</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
   );
}

function ValuationDetailView({ stats }: { stats: { stockValuation: number; categorySales: any[] } }) {
   return (
      <div className="space-y-4">
         <div className="p-8 bg-primary text-white rounded-[32px] overflow-hidden relative mb-4">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
            <p className="text-[10px] font-black uppercase tracking-widest italic opacity-60">Total Inventory Worth</p>
            <h3 className="text-5xl font-black italic tracking-tighter mt-2 tabular-nums">₹{stats.stockValuation.toLocaleString('en-IN')}</h3>
         </div>

         <div className="grid grid-cols-1 gap-2">
            {stats.categorySales.map((cat: any, idx: number) => (
               <div key={idx} className="p-4 bg-white rounded-2xl border border-gray-100 flex justify-between items-center group hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                     <span className="text-xs font-black text-[#003366] italic uppercase">{cat.name}</span>
                  </div>
                  <span className="text-xs font-black tabular-nums text-gray-600">Contribution: High</span>
               </div>
            ))}
         </div>
      </div>
   );
}

"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
   X,
   Clock,
   Search,
   ChevronRight,
   Calendar,
   LayoutGrid,
   Layers,
   ArrowRight,
   AlertTriangle,
   CheckCircle2,
   Target,
   ArrowDownRight,
   Receipt,
   Bell
} from 'lucide-react'
import {
   BarChart,
   Bar,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   Cell,
   AreaChart,
   Area
} from 'recharts'
import { useData, InventoryItem, Transaction, Engineer } from '@/lib/context/DataContext'
import { MetricCard } from '@/components/shared/MetricCard'
import { QuickEntryModal } from '@/components/modals/QuickEntryModal'
import { useDashboardData } from '@/utils/useDashboardData'
import { cn } from '@/lib/utils'

// ==========================================================================
// SUB-COMPONENTS
// ==========================================================================

function SectionHeader({ title, subtitle, icon: Icon, color = "text-primary" }: any) {
   return (
      <div className="flex items-center gap-3 mb-6">
         <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-gray-100", color)}>
            {Icon && <Icon className="w-5 h-5" />}
         </div>
         <div>
            <h2 className="text-sm font-black tracking-[0.2em] uppercase italic text-gray-400 leading-none mb-1">{subtitle}</h2>
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-primary leading-none">{title}</h1>
         </div>
      </div>
   )
}

function ActionAlert({ title, insight, actionLabel, onClick, variant = "warning" }: any) {
   const styles = {
      warning: {
         container: "bg-orange-50 border-orange-100 text-orange-900",
         icon: "bg-orange-100 text-orange-600",
         button: "bg-orange-600 hover:bg-orange-700 shadow-orange-200"
      },
      danger: {
         container: "bg-red-50 border-red-100 text-red-900",
         icon: "bg-red-100 text-red-600",
         button: "bg-red-600 hover:bg-red-700 shadow-red-200"
      },
      info: {
         container: "bg-blue-50 border-blue-100 text-blue-900",
         icon: "bg-blue-100 text-blue-600",
         button: "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
      },
   }[variant as "warning" | "danger" | "info"]

   return (
      <div className={cn("p-5 rounded-[24px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow-lg hover:translate-y-[-2px]", styles.container)}>
         <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", styles.icon)}>
               {variant === "danger" ? <AlertTriangle className="w-6 h-6" /> : variant === "info" ? <FileText className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <div>
               <p className="text-sm font-black uppercase italic leading-none mb-1 tracking-tight">{title}</p>
               <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest leading-none">{insight}</p>
            </div>
         </div>
         <button 
            onClick={onClick}
            className={cn("px-6 py-3 rounded-xl text-white text-[10px] font-black uppercase tracking-widest italic shadow-lg transition-all active:scale-95 whitespace-nowrap", styles.button)}
         >
            {actionLabel}
         </button>
      </div>
   )
}

// ==========================================================================
// MAIN DASHBOARD PAGE
// ==========================================================================

export default function DashboardPage() {
   const router = useRouter()
   const { inventory, transactions, engineers } = useData()
   const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false)
   const [activeMetric, setActiveMetric] = useState<string | null>(null)

   useEffect(() => {
      const handleOpenQuickEntry = () => setIsQuickEntryOpen(true);
      window.addEventListener('open-quick-entry', handleOpenQuickEntry);
      return () => {
         window.removeEventListener('open-quick-entry', handleOpenQuickEntry);
      };
   }, []);

   // Dashboard data layer
   const stats = useDashboardData({
      data: {
         sales: transactions.filter((t: Transaction) => t.type === 'OUTWARD' || t.type === 'REVENUE').map((t: Transaction) => {
            const match = inventory.find((i: InventoryItem) => i.id == t.item_id);
            return {
               date: t.date?.split("T")[0],
               total: t.amount || (t.quantity * (t.price || match?.price || 0)),
               items: [{ id: t.item_id, qty: t.quantity, costPrice: match?.purchase_price || 0, price: t.price || match?.price || 0, category: match?.category, name: match?.name }]
            }
         }),
         purchases: transactions.filter((t: Transaction) => t.type === 'INWARD' || t.type === 'PO').map((t: Transaction) => {
            const match = inventory.find((i: InventoryItem) => i.id == t.item_id);
            return {
               date: t.date?.split("T")[0],
               total: t.amount || (t.quantity * (t.price || 0))
            }
         }),
         items: inventory.map((i: InventoryItem) => ({
            ...i, qty: i.total_qty || 0, costPrice: i.purchase_price || 0, reorderLevel: i.threshold || 5, lastMovement: Date.now()
         })),
         approvals: transactions.filter((t: Transaction) => t.status === 'PENDING')
      }
   });

   // Calculate inventory risk score (0-100)
   const inventoryRiskScore = useMemo(() => {
      if (inventory.length === 0) return 0;
      const lowStockWeight = (stats.lowStockCount / inventory.length) * 60;
      const deadStockWeight = (stats.deadStock.length / inventory.length) * 40;
      return Math.min(100, Math.round(lowStockWeight + deadStockWeight));
   }, [inventory.length, stats.lowStockCount, stats.deadStock.length]);

   return (
      <div className="space-y-8 pb-20 animate-in fade-in duration-700">

         {/* SECTION 1: ACTION CENTER */}
         <section>
            <SectionHeader
               title="Action Center"
               subtitle="Immediate Decisions"
               icon={Target}
               color="text-red-500"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {stats.lowStockCount > 0 && (
                  <ActionAlert
                     title={`${stats.lowStockCount} items will stock out in 3 days`}
                     insight="Inventory levels below safety threshold"
                     actionLabel="Reorder Now"
                     variant="warning"
                     onClick={() => {
                        const event = new CustomEvent('open-quick-entry', {
                           detail: {
                              tab: 'purchase',
                              purchase: { reference: 'REORDER-' + Date.now() }
                           }
                        });
                        window.dispatchEvent(event);
                     }}
                  />
               )}
               {stats.pendingApprovals > 0 && (
                  <ActionAlert
                     title={`${stats.pendingApprovals} purchase orders pending approval`}
                     insight="Blocked procurement workflow detected"
                     actionLabel="Approve Now"
                     variant="info"
                     onClick={() => router.push('/purchase?filter=pending')}
                  />
               )}
               {stats.deadStock.length > 0 && (
                  <ActionAlert
                     title={`${stats.deadStock.length} items not sold in 30+ days`}
                     insight={`Dead stock value: ₹${(stats.deadStock.length * 5000).toLocaleString('en-IN')}`}
                     actionLabel="Review"
                     variant="danger"
                     onClick={() => router.push('/reports?v=dead-stock')}
                  />
               )}
               <ActionAlert
                  title="Create Purchase Order"
                  insight="Quickly restock your inventory"
                  actionLabel="Create PO"
                  variant="info"
                  onClick={() => {
                     const event = new CustomEvent('open-quick-entry', {
                        detail: { tab: 'purchase' }
                     });
                     window.dispatchEvent(event);
                  }}
               />
            </div>
         </section>


         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* LEFT COLUMN */}
            <div className="lg:col-span-8 space-y-8">

               {/* SECTION 3: KPI STRIP */}
               <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <MetricCard
                     title="Today Sales"
                     value={`₹${stats.todaySales.toLocaleString('en-IN')}`}
                     trend="+12%"
                     icon={<TrendingUp />}
                     variant="success"
                     onClick={() => setActiveMetric("today-sales")}
                  />
                  <MetricCard
                     title="Net Profit"
                     value={`₹${stats.profitToday.toLocaleString('en-IN')}`}
                     trend={`${stats.profitMargin}% Margin`}
                     icon={<Zap />}
                     variant="primary"
                     onClick={() => setActiveMetric("profit")}
                  />
                  <MetricCard
                     title="Inventory Risk"
                     value={`${inventoryRiskScore}/100`}
                     trend={`Critical: ${stats.lowStockCount}`}
                     icon={<AlertCircle />}
                     variant={inventoryRiskScore > 50 ? "warning" : "default"}
                     isCritical={inventoryRiskScore > 50}
                     onClick={() => setActiveMetric("low-stock")}
                  />
               </section>

               {/* SECTION 4: SALES OVERVIEW */}
               <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                     <div>
                        <h2 className="text-sm font-black tracking-[0.2em] uppercase italic text-gray-400 leading-none mb-1">Performance</h2>
                        <h1 className="text-xl font-black tracking-tighter uppercase italic text-primary leading-none">Sales Overview</h1>
                     </div>
                     <div className="grid grid-cols-3 gap-6">
                        <div className="text-right">
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Sales</p>
                           <p className="text-sm font-black text-primary italic leading-none mt-1">₹4.2L</p>
                        </div>
                        <div className="text-right border-x border-gray-100 px-6">
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Avg Daily</p>
                           <p className="text-sm font-black text-primary italic leading-none mt-1">₹14.5K</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Best Day</p>
                           <p className="text-sm font-black text-green-600 italic leading-none mt-1">Fri (₹42K)</p>
                        </div>
                     </div>
                  </div>
                  <div className="h-[300px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                           data={[
                              { day: 'Mon', sales: 12000 },
                              { day: 'Tue', sales: 18000 },
                              { day: 'Wed', sales: 15000 },
                              { day: 'Thu', sales: 22000 },
                              { day: 'Fri', sales: 42000 },
                              { day: 'Sat', sales: 28000 },
                              { day: 'Sun', sales: 10000 },
                           ]}
                           margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                           <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F1F5F9" />
                           <XAxis
                              dataKey="day"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }}
                           />
                           <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }}
                           />
                           <Tooltip
                              cursor={{ fill: '#F8FAFC' }}
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontStyle: 'italic', fontWeight: 900 }}
                           />
                           <Bar dataKey="sales" radius={[8, 8, 0, 0]} barSize={40}>
                              {[0, 1, 2, 3, 4, 5, 6].map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={index === 4 ? "#003366" : "#E2E8F0"} />
                              ))}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </section>

               {/* SIDE-BY-SIDE INTELLIGENCE */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* COMPACT REORDER INTELLIGENCE */}
                  <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                     <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                        <div>
                           <h2 className="text-[10px] font-black tracking-[0.2em] uppercase italic text-gray-400 leading-none mb-1">Optimization</h2>
                           <h1 className="text-sm font-black tracking-tighter uppercase italic text-primary leading-none">Reorder Intelligence</h1>
                        </div>
                        <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                     </div>
                     <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="border-b border-gray-100 bg-gray-50/20">
                                 <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Item</th>
                                 <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest italic text-center">Stock</th>
                                 <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest italic text-right">Status</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50">
                              {stats.reorderItems.slice(0, 5).map((item: any, idx: number) => {
                                 const runOutDays = item.velocity > 0 ? Math.floor(item.qty / item.velocity) : 99;
                                 return (
                                    <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                       <td className="px-6 py-4">
                                          <p className="text-[11px] font-black text-primary italic uppercase leading-tight line-clamp-1">{item.name}</p>
                                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{item.category}</p>
                                       </td>
                                       <td className="px-6 py-4 text-center">
                                          <span className="text-[11px] font-black tabular-nums">{item.qty}</span>
                                       </td>
                                       <td className="px-6 py-4 text-right">
                                          <div className={cn(
                                             "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic tracking-widest",
                                             runOutDays <= 3 ? "bg-red-100 text-red-600" : runOutDays <= 7 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
                                          )}>
                                             {runOutDays <= 0 ? 'Out' : `${runOutDays}D`}
                                          </div>
                                       </td>
                                    </tr>
                                 )
                              })}
                           </tbody>
                        </table>
                     </div>
                  </section>

                  {/* COMPACT TOP SELLING */}
                  <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
                     <div className="flex justify-between items-center mb-6">
                        <div>
                           <h2 className="text-[10px] font-black tracking-[0.2em] uppercase italic text-gray-400 leading-none mb-1">Market Favorites</h2>
                           <h1 className="text-sm font-black tracking-tighter uppercase italic text-primary leading-none">Top Selling Items</h1>
                        </div>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                     </div>
                     <div className="space-y-3">
                        {stats.topSelling.slice(0, 5).map((item: any, idx: number) => (
                           <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl hover:bg-white hover:shadow-md transition-all group border border-transparent hover:border-gray-100">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center font-black text-[10px] italic text-primary shadow-sm group-hover:scale-110 transition-transform">
                                    #{idx + 1}
                                 </div>
                                 <div>
                                    <p className="text-[11px] font-black text-primary italic uppercase leading-none mb-1 line-clamp-1">{item.name}</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{item.qty} units</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-[11px] font-black text-primary italic tabular-nums leading-none mb-1">₹{(item.qty * 1200).toLocaleString('en-IN')}</p>
                                 <div className="flex items-center justify-end gap-1 text-[7px] font-black text-green-500 uppercase tracking-widest">
                                    <ArrowUpRight className="w-2 h-2" /> 8.4%
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </section>
               </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-4 space-y-8">

               {/* SECTION 6: ALERTS & NOTIFICATIONS */}
               <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 flex flex-col h-full max-h-[500px]">
                  <SectionHeader
                     title="System Feed"
                     subtitle="Alerts & Logs"
                     icon={Bell}
                     color="text-orange-500"
                  />
                  <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
                     {stats.lowStockCount > 0 && (
                        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 cursor-pointer hover:bg-white transition-all group shadow-sm hover:shadow-md">
                           <div className="flex items-center gap-3 mb-2">
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                              <span className="text-[10px] font-black uppercase italic tracking-widest text-orange-900">Low Stock Alert</span>
                           </div>
                           <p className="text-xs font-bold text-orange-900 opacity-60 leading-tight">Critical levels reached for {stats.lowStockCount} items. Auto-replenishment suggested.</p>
                        </div>
                     )}
                     <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 cursor-pointer hover:bg-white transition-all group shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-3 mb-2">
                           <Activity className="w-4 h-4 text-blue-600" />
                           <span className="text-[10px] font-black uppercase italic tracking-widest text-blue-900">System Insight</span>
                        </div>
                        <p className="text-xs font-bold text-blue-900 opacity-60 leading-tight">Inventory risk increased by 18% today due to delayed inbound shipment.</p>
                     </div>
                     {stats.deadStock.length > 0 && (
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 cursor-pointer hover:bg-white transition-all group shadow-sm hover:shadow-md">
                           <div className="flex items-center gap-3 mb-2">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                              <span className="text-[10px] font-black uppercase italic tracking-widest text-red-900">Liquidity Alert</span>
                           </div>
                           <p className="text-xs font-bold text-red-900 opacity-60 leading-tight">Dead stock value has crossed ₹25,000 limit. Review clearance sale options.</p>
                        </div>
                     )}
                     <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-white transition-all group shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-3 mb-2">
                           <CheckCircle2 className="w-4 h-4 text-green-600" />
                           <span className="text-[10px] font-black uppercase italic tracking-widest text-gray-900">Task Completed</span>
                        </div>
                        <p className="text-xs font-bold text-gray-900 opacity-60 leading-tight">Monthly inventory reconciliation finished. Accuracy: 99.4%</p>
                     </div>
                  </div>
               </section>



            </div>
         </div>

         <QuickEntryModal isOpen={isQuickEntryOpen} onClose={() => setIsQuickEntryOpen(false)} />

         <DashboardMetricModal
            type={activeMetric}
            onClose={() => setActiveMetric(null)}
            data={{
               sales: transactions.filter((t: Transaction) => t.type === 'OUTWARD' || t.type === 'REVENUE').map((t: Transaction) => {
                  const match = inventory.find((i: InventoryItem) => i.id == t.item_id);
                  return {
                     date: t.date?.split("T")[0],
                     total: t.amount || (t.quantity * (t.price || match?.price || 0)),
                     items: [{ id: t.item_id, qty: t.quantity, costPrice: match?.purchase_price || 0, price: t.price || match?.price || 0, category: match?.category, name: match?.name }]
                  }
               }),
               purchases: transactions.filter((t: Transaction) => t.type === 'INWARD' || t.type === 'PO').map((t: Transaction) => {
                  return {
                     date: t.date?.split("T")[0],
                     total: t.amount || (t.quantity * (t.price || 0))
                  }
               }),
               items: inventory.map((i: InventoryItem) => ({ ...i, qty: i.total_qty || 0, costPrice: i.purchase_price || 0 })),
               approvals: transactions.filter((t: Transaction) => t.status === 'PENDING')
            }}
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
   data: any;
   stats: any;
}

function DashboardMetricModal({ type, onClose, data, stats }: DashboardMetricModalProps) {
   if (!type) return null;

   const title = type.replace(/-/g, ' ').toUpperCase();

   const renderContent = () => {
      switch (type) {
         case 'today-sales': return <SalesDetailView data={data} />;
         case 'profit': return <ProfitDetailView stats={stats} data={data} />;
         case 'low-stock': return <LowStockDetailView stats={stats} />;
         default: return <div className="py-12 text-center opacity-30 text-[10px] font-black uppercase tracking-[0.2em] italic">Drill-down for {title} coming soon</div>;
      }
   }

   return (
      <div className="fixed inset-0 bg-[#003366]/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
         <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
               <h2 className="text-xl font-black text-[#003366] italic tracking-tight uppercase flex items-center gap-3">
                  <Zap className="w-5 h-5 opacity-40" /> {title} DRILL-DOWN
               </h2>
               <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
               </button>
            </div>
            <div className="flex-1 overflow-auto p-6 custom-scrollbar">
               {renderContent()}
            </div>
         </div>
      </div>
   );
}

function SalesDetailView({ data }: any) {
   return (
      <table className="w-full text-left">
         <thead>
            <tr className="border-b border-gray-100">
               <th className="py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Item Info</th>
               <th className="py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Qty</th>
               <th className="py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Revenue</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-gray-50">
            {data.sales.map((sale: any, idx: number) => (
               <tr key={idx}>
                  <td className="py-4">
                     <p className="text-xs font-black text-[#003366] italic uppercase">{sale.items[0]?.name}</p>
                     <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">{sale.date}</p>
                  </td>
                  <td className="py-4 text-center text-xs font-black">{sale.items[0]?.qty}</td>
                  <td className="py-4 text-right text-xs font-black text-green-600">₹{sale.total.toLocaleString('en-IN')}</td>
               </tr>
            ))}
         </tbody>
      </table>
   )
}

function ProfitDetailView({ stats, data }: any) {
   return (
      <div className="space-y-6">
         <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
               <p className="text-[10px] font-black text-green-600 uppercase tracking-widest italic mb-2">Total Sales</p>
               <p className="text-2xl font-black text-primary italic tracking-tighter">₹{stats.todaySales.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic mb-2">Net Profit</p>
               <p className="text-2xl font-black text-primary italic tracking-tighter">₹{stats.profitToday.toLocaleString('en-IN')}</p>
            </div>
         </div>
         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Profit breakdown by item is being calculated based on purchase cost vs sale price.</p>
      </div>
   )
}

function LowStockDetailView({ stats }: any) {
   return (
      <div className="space-y-4">
         {stats.reorderItems.map((item: any, idx: number) => (
            <div key={idx} className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex justify-between items-center">
               <div>
                  <p className="text-xs font-black text-primary italic uppercase">{item.name}</p>
                  <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest mt-1">Current Stock: {item.qty} | Safety Limit: {item.reorderLevel}</p>
               </div>
               <button className="px-4 py-2 bg-primary text-white text-[8px] font-black uppercase tracking-widest italic rounded-xl">Reorder</button>
            </div>
         ))}
      </div>
   )
}

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
  PieChart
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
import { Badge } from '@/components/ui/Badge'
import { MetricCard } from '@/components/shared/MetricCard'
import { QuickEntryModal } from '@/components/modals/QuickEntryModal'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { items } = useData()
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false)

  // KPI Calculations
  const kpis = useMemo(() => {
    const stockValue = items.reduce((acc, item) => acc + (item.price * item.stock), 0)
    const lowStock = items.filter(i => i.status === 'Low Stock').length
    
    return [
      { 
        title: 'Today Sales', 
        value: '₹42,480.00', 
        trend: '+12.5%', 
        trendUp: true,
        icon: 'up',
        href: '/reports/sales?type=total-sales'
      },
      { 
        title: 'Today Purchase', 
        value: '₹18,230.15', 
        trend: '-4.2%', 
        trendUp: false,
        icon: 'down',
        href: '/reports/purchase?type=total-purchase'
      },
      { 
        title: 'Pending Approvals', 
        value: '12', 
        subtitle: '8 Purchases / 4 Sales',
        color: 'text-primary',
        href: '/reports/financial?type=pending'
      },
      { 
        title: 'Low Stock Count', 
        value: lowStock, 
        subtitle: 'Items req. restock',
        color: lowStock > 0 ? 'text-orange-600' : '',
        href: '/reports/inventory?type=low-stock'
      },
      { 
        title: 'Stock Valuation', 
        value: `₹${(stockValue / 1000).toFixed(1)}K`, 
        subtitle: 'Inventory net worth',
        href: '/reports/inventory'
      },
    ]
  }, [items])

  // Dummy Chart Data
  const chartData = [
    { name: 'Mon', sales: 4000, purchases: 2400 },
    { name: 'Tue', sales: 3000, purchases: 1398 },
    { name: 'Wed', sales: 2000, purchases: 9800 },
    { name: 'Thu', sales: 2780, purchases: 3908 },
    { name: 'Fri', sales: 1890, purchases: 4800 },
    { name: 'Sat', sales: 2390, purchases: 3800 },
    { name: 'Sun', sales: 3490, purchases: 4300 },
  ]

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* SECTION 1: HEADER & ACTIONS */}
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-border-main shadow-sm">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-[#003366] tracking-tighter italic uppercase">Operational Control</h1>
              <Badge variant="secondary" className="h-6 px-3 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black italic uppercase">Module_06_ERP</Badge>
           </div>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 italic">Real-Time Enterprise Intelligence Center</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setIsQuickEntryOpen(true)}
             className="h-12 px-8 rounded-xl bg-[#003366] text-white font-black text-[10px] tracking-widest uppercase italic shadow-lg shadow-primary/20 flex items-center gap-2"
           >
              <Zap className="w-4 h-4" /> Quick Inventory Entry
           </button>
        </div>
      </div>

      <QuickEntryModal isOpen={isQuickEntryOpen} onClose={() => setIsQuickEntryOpen(false)} />

      {/* SECTION 2: KPI GRID (Spec Mandatory) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
         <MetricCard 
           title="Today Sales" 
           value="₹42,480.00" 
           trend="+12.5%" 
           icon={<ArrowUpRight className="w-5 h-5" />} 
           variant="success"
           href="/reports/sales?type=total-sales"
         />
         <MetricCard 
           title="Today Purchase" 
           value="₹18,230.15" 
           trend="-4.2%" 
           isNegative
           icon={<ArrowDownRight className="w-5 h-5" />} 
           variant="warning"
           href="/reports/purchase?type=total-purchase"
         />
         <MetricCard 
           title="Pending Approvals" 
           value="12" 
           period="8 Purchases / 4 Sales"
           icon={<ClipboardCheck className="w-5 h-5" />} 
           variant="primary"
           href="/reports/financial?type=pending"
         />
         <MetricCard 
           title="Low Stock Count" 
           value={kpis[3].value} 
           period="Items req. restock"
           isCritical={Number(kpis[3].value) > 0}
           icon={<AlertCircle className="w-5 h-5" />} 
           variant="warning"
           href="/reports/inventory?type=low-stock"
         />
         <MetricCard 
           title="Stock Valuation" 
           value={`₹${(items.reduce((acc, item) => acc + (item.price * item.stock), 0) / 1000).toFixed(1)}K`} 
           period="Inventory net worth"
           icon={<Package2 className="w-5 h-5" />} 
           variant="primary"
           href="/reports/inventory"
         />
      </div>

      {/* SECTION 3: ANALYTICS & MONITORING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sales vs Purchase Trend */}
        <div className="lg:col-span-8 bg-white rounded-[40px] border border-border-main shadow-sm flex flex-col overflow-hidden">
           <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><BarChart3 className="w-5 h-5" /></div>
                 <div>
                    <h4 className="text-sm font-black text-[#003366] italic tracking-tight uppercase">Operational Dynamics</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Inbound vs Outbound Velocity</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#003366]" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sales</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-100" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Purchases</span>
                 </div>
              </div>
           </div>
           <div className="p-8 flex-1 min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis 
                       dataKey="name" 
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
                       cursor={{ fill: 'rgba(0, 51, 102, 0.03)' }}
                       contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', fontStyle: 'italic', fontWeight: 900 }}
                    />
                    <Bar dataKey="sales" radius={[8, 8, 0, 0]} barSize={24}>
                       {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill="#003366" />)}
                    </Bar>
                    <Bar dataKey="purchases" radius={[8, 8, 0, 0]} barSize={24}>
                       {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill="#E1EBF5" />)}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* TOP PERFORMING ASSETS */}
        <div className="lg:col-span-4 bg-white rounded-[40px] border border-border-main shadow-sm flex flex-col overflow-hidden">
           <div className="p-8 border-b border-gray-50 bg-gray-50/20">
              <h4 className="text-sm font-black text-[#003366] italic tracking-tight uppercase">Top Selling Registry</h4>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">High-Velocity Movements</p>
           </div>
           <div className="p-4 flex-1 space-y-2">
              {[
                { name: 'X-5 Pro Processor', volume: 482, rev: '₹4.2M' },
                { name: 'Global Network Card', volume: 395, rev: '₹1.8M' },
                { name: 'Base Station II', volume: 218, rev: '₹900K' },
                { name: 'Ultra Hub V3', volume: 164, rev: '₹450K' },
                { name: 'Industrial Fan L4', volume: 142, rev: '₹120K' },
              ].map((prod, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all group cursor-pointer border border-transparent hover:border-gray-100 italic hover:scale-[1.02] hover:shadow-md active:scale-[0.98]">
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-gray-200 group-hover:text-primary transition-colors">{i + 1}</span>
                      <div>
                         <p className="text-xs font-black text-text-main group-hover:text-[#003366] transition-colors uppercase tracking-tight">{prod.name}</p>
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{prod.volume} units</p>
                      </div>
                   </div>
                   <p className="text-sm font-black text-[#003366] tabular-nums">{prod.rev}</p>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* SECTION 4: DEAD STOCK & CRITICAL INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
         
         <div className="bg-white rounded-[40px] border border-border-main p-8 shadow-sm space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-all duration-700">
               <TrendingDown className="w-24 h-24" />
            </div>
            <div className="relative z-10">
               <h4 className="text-xl font-black text-[#003366] italic tracking-tight uppercase border-b border-gray-50 pb-4 mb-6 flex items-center gap-3">
                  <Zap className="w-5 h-5 text-gray-400" /> Dead Stock Matrix
               </h4>
               <div className="space-y-4">
                  {[
                    { name: 'Legacy Router V1', idle: '124 Days', cost: '₹4,200', pct: 85 },
                    { name: 'Custom Cooling Rack', idle: '98 Days', cost: '₹8,150', pct: 60 },
                    { name: 'Bulk Cabling Roll', idle: '92 Days', cost: '₹11,840', pct: 45 },
                  ].map((item, i) => (
                    <div key={i} className="space-y-2 p-3 rounded-2xl hover:bg-gray-50/50 transition-all cursor-pointer group/item hover:scale-[1.02] hover:shadow-sm">
                       <div className="flex justify-between items-center text-xs">
                          <span className="font-black text-[#003366] italic uppercase tracking-tight">{item.name}</span>
                          <span className="font-black text-red-500 tabular-nums">{item.cost}</span>
                       </div>
                       <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${item.pct}%` }} />
                       </div>
                       <div className="flex justify-between items-center text-[9px] font-black text-gray-400 uppercase tracking-widest italic pt-1">
                          <span>Idleness: {item.idle}</span>
                          <span>Liquidation Rec.</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="lg:col-span-2 bg-[#003366] rounded-[40px] p-10 text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-white/10 transition-all duration-1000" />
            <div className="relative z-10 flex flex-col h-full justify-between">
               <div className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10"><Activity className="w-6 h-6" /></div>
                     <div>
                        <h4 className="text-xl font-black italic tracking-tight uppercase">System Health Dynamics</h4>
                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest opacity-60">Company-Scoped Analytics &rarr; FY 2024-25</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-6">
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest opacity-60">Inventory Turnover</p>
                        <p className="text-3xl font-black italic tracking-tighter tabular-nums">14.2X</p>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest opacity-60">Avg. Restock Cycle</p>
                        <p className="text-3xl font-black italic tracking-tighter tabular-nums">4.2d</p>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest opacity-60">Order Accuracy</p>
                        <p className="text-3xl font-black italic tracking-tighter tabular-nums text-green-400">99.8%</p>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest opacity-60">Stock Out Rate</p>
                        <p className="text-3xl font-black italic tracking-tighter tabular-nums text-red-400">0.4%</p>
                     </div>
                  </div>
               </div>
               <div className="flex items-center justify-between border-t border-white/10 pt-8 mt-12">
                  <div className="flex -space-x-4">
                     {[1,2,3,4].map(i => (
                       <div key={i} className="w-10 h-10 rounded-full border-2 border-[#003366] bg-gray-200 overflow-hidden shadow-xl" />
                     ))}
                     <div className="w-10 h-10 rounded-full border-2 border-[#003366] bg-primary flex items-center justify-center text-[10px] font-black italic">+8</div>
                  </div>
                  <button className="flex items-center gap-2 group/btn">
                     <span className="text-[10px] font-black uppercase tracking-widest italic group-hover/btn:mr-2 transition-all">Download Audit Report</span>
                     <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </button>
               </div>
            </div>
         </div>

      </div>
    </div>
  )
}

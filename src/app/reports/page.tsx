"use client"

import React, { useState, useMemo } from 'react'
import {
   BarChart3,
   LineChart,
   PieChart as PieChartIcon,
   Download,
   RefreshCw,
   Calendar,
   ChevronDown,
   Filter,
   ArrowUpRight,
   ArrowDownRight,
   User,
   Package,
   ShoppingCart,
   TrendingUp,
   FileText,
   Printer,
   ChevronRight,
   Table as TableIcon,
   Search,
   CheckCircle2,
   AlertCircle,
   LayoutGrid,
   Zap,
   Tag
} from 'lucide-react'
import {
   BarChart,
   Bar,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   LineChart as ReLineChart,
   Line,
   PieChart as RePieChart,
   Pie,
   Cell,
   Legend
} from 'recharts'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MetricCard } from '@/components/shared/MetricCard'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type ReportTab = 'sales' | 'purchase' | 'inventory' | 'financial'

export default function ReportsPage() {
   const [activeTab, setActiveTab] = useState<ReportTab>('sales')
   const [isFilterOpen, setIsFilterOpen] = useState(false)
   const [dateRange, setDateRange] = useState({ start: '2024-03-01', end: '2024-03-31' })

   // Mock Trend Data
   const trendData = useMemo(() => ([
      { name: 'W1', value: 4200, alt: 2400 },
      { name: 'W2', value: 3800, alt: 1398 },
      { name: 'W3', value: 5200, alt: 9800 },
      { name: 'W4', value: 6800, alt: 3908 },
   ]), [])

   const categoryData = useMemo(() => ([
      { name: 'Hardware', value: 4500 },
      { name: 'Software', value: 3200 },
      { name: 'Storage', value: 2100 },
      { name: 'Net', value: 1800 },
   ]), [])

   const COLORS = ['#003366', '#3b82f6', '#93c5fd', '#bfdbfe']

   const [tableData] = useState(() => [1, 2, 3, 4, 5].map(row => ({
      id: row,
      stamp: Math.random().toString(36).substr(2, 6).toUpperCase(),
      amt: Math.random() * 12000 + 1000,
      qty: Math.floor(Math.random() * 20) + 1
   })))

   const handleExport = (type: 'pdf' | 'csv' | 'print') => {
      toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
         loading: `Generating ${type.toUpperCase()} report...`,
         success: `Report exported as ${type.toUpperCase()}`,
         error: 'Export failed'
      })
   }

   const renderKPIs = () => {
      switch (activeTab) {
         case 'sales': return [
            { title: 'Total Sales Revenue', value: '₹8,42,480', trend: '+12.5%', icon: <TrendingUp className="w-5 h-5" />, variant: 'primary', href: '/reports/sales?type=total-sales' },
            { title: 'Aggregated Orders', value: '1,240', trend: '+8.2%', icon: <ShoppingCart className="w-5 h-5" />, variant: 'default' },
            { title: 'Cumulative Revenue', value: '₹9,12,180', trend: '+5.4%', icon: <BarChart3 className="w-5 h-5" />, variant: 'success' },
            { title: 'Net Margin / Profit', value: '₹1,24,500', trend: '+11.2%', icon: <Zap className="w-5 h-5" />, variant: 'primary', href: '/reports/sales?type=profit' },
         ]
         case 'inventory': return [
            { title: 'Current Stock Value', value: '₹4.2M', trend: '-2.1%', icon: <Package className="w-5 h-5" />, variant: 'primary', href: '/reports/inventory?type=total-value' },
            { title: 'Low Stock SKU Count', value: '42', trend: '+12', icon: <AlertCircle className="w-5 h-5" />, variant: 'warning', isCritical: true, href: '/reports/inventory?type=low-stock' },
            { title: 'Fast-Moving Pulse', value: '0.8d', trend: '-0.2d', icon: <Zap className="w-5 h-5" />, variant: 'success' },
            { title: 'Stagnant (Dead) Stock', value: '₹1,24K', trend: '+5%', icon: <AlertCircle className="w-5 h-5" />, variant: 'warning' },
         ]
         case 'purchase': return [
            { title: 'Total Purchase Cost', value: '₹5,12,180', trend: '+5.4%', icon: <ShoppingCart className="w-5 h-5" />, variant: 'primary', href: '/reports/purchase?type=total-purchase' },
            { title: 'Vendor Fulfillment', value: '98.2%', trend: '+0.5%', icon: <CheckCircle2 className="w-5 h-5" />, variant: 'success' },
            { title: 'Avg. Inbound Cycle', value: '4.2d', trend: '-1.1d', icon: <RefreshCw className="w-5 h-5" />, variant: 'default' },
            { title: 'Pending Settlement', value: '₹48,200', trend: '+8k', icon: <AlertCircle className="w-5 h-5" />, variant: 'warning', href: '/reports/financial?type=pending' },
         ]
         case 'financial': return [
            { title: 'Net Cash Flow', value: '₹3,12,180', trend: '+15.4%', icon: <BarChart3 className="w-5 h-5" />, variant: 'primary' },
            { title: 'VAT / Tax Liability', value: '₹58,200', trend: '+2.1%', icon: <FileText className="w-5 h-5" />, variant: 'default' },
            { title: 'Inventory Asset Value', value: '₹4.8M', trend: '+1.2M', icon: <Package className="w-5 h-5" />, variant: 'success' },
            { title: 'Projected Revenue', value: '₹1.2M', trend: '+24%', icon: <TrendingUp className="w-5 h-5" />, variant: 'primary' },
         ]
      }
   }

   return (
      <div className="space-y-8 pb-24 animate-in fade-in duration-500 text-text-main">
         {/* TOP HEADER */}
         <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-white p-8 rounded-3xl border border-border-main shadow-sm gap-6">
            <div>
               <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-black text-[#003366] tracking-tighter italic uppercase underline decoration-primary/20 decoration-4">Operational Reports</h1>
               </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
               <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 px-3 py-1.5">
                     <Calendar className="w-4 h-4 text-primary opacity-40" />
                     <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="bg-transparent text-xs font-black italic uppercase focus:outline-none" />
                  </div>
                  <div className="w-[1px] h-4 bg-gray-200" />
                  <div className="flex items-center gap-2 px-3 py-1.5">
                     <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="bg-transparent text-xs font-black italic uppercase focus:outline-none" />
                  </div>
               </div>
               <Button variant="secondary" className="h-12 w-12 rounded-xl flex items-center justify-center p-0 bg-white border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <RefreshCw className="w-4 h-4 text-primary" />
               </Button>
               <div className="flex gap-2">
                  <Button onClick={() => handleExport('pdf')} variant="secondary" className="h-12 px-6 rounded-xl font-black text-[10px] tracking-widest uppercase italic bg-white border-gray-100 flex items-center gap-2">
                     <FileText className="w-4 h-4 text-red-500" /> Export PDF
                  </Button>
                  <Button onClick={() => handleExport('csv')} variant="secondary" className="h-12 px-6 rounded-xl font-black text-[10px] tracking-widest uppercase italic bg-white border-gray-100 flex items-center gap-2">
                     <Download className="w-4 h-4 text-green-500" /> Export CSV
                  </Button>
               </div>
            </div>
         </div>

         {/* CATEGORY TABS */}
         <div className="flex items-center gap-4 border-b border-border-main scrollbar-hide overflow-x-auto pb-px">
            {(['sales', 'purchase', 'inventory', 'financial'] as ReportTab[]).map((tab) => (
               <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                     "px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] italic transition-all relative",
                     activeTab === tab ? "text-[#003366]" : "text-gray-400 hover:text-primary"
                  )}
               >
                  {tab} Registry
                  {activeTab === tab && <div className="absolute bottom-0 left-4 right-4 h-1 bg-primary rounded-t-full shadow-[0_0_12px_rgba(59,130,246,0.6)]" />}
               </button>
            ))}
         </div>

         {/* SUMMARY KPI CARDS */}
         <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {renderKPIs().map((kpi, idx) => (
               <MetricCard
                  key={idx}
                  title={kpi.title}
                  value={kpi.value}
                  trend={kpi.trend}
                  icon={kpi.icon}
                  variant={kpi.variant as any}
                  isCritical={kpi.isCritical}
                  href={kpi.href}
               />
            ))}
         </div>

         {/* CHART SECTION */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-fit">
            {/* Trend Line Chart */}
            <div className="lg:col-span-8 bg-white rounded-[40px] border border-border-main p-8 shadow-sm space-y-8 flex flex-col justify-between overflow-hidden group">
               <div className="flex justify-between items-start border-b border-gray-50 pb-6">
                  <div>
                     <h3 className="text-xl font-black text-[#003366] italic tracking-tight uppercase leading-none">Operational Trends</h3>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Dynamic Velocity Map &rarr; Past 30 Days</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="italic font-black text-[9px] uppercase text-[#003366] h-6 px-3 flex items-center justify-center opacity-40">Live Processing</span>
                     <LayoutGrid className="w-5 h-5 text-gray-200" />
                  </div>
               </div>
               <div className="flex-1 min-h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <ReLineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }} />
                        <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', fontStyle: 'italic', fontWeight: 900 }} />
                        <Line type="monotone" dataKey="value" stroke="#003366" strokeWidth={4} dot={{ r: 6, fill: '#003366', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} />
                        <Line type="monotone" dataKey="alt" stroke="#E1EBF5" strokeWidth={4} strokeDasharray="8 8" dot={false} />
                     </ReLineChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Bar Chart Section */}
            <div className="lg:col-span-4 bg-[#003366] rounded-[40px] p-8 text-white shadow-2xl space-y-8 flex flex-col justify-between relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
               <div className="relative z-10">
                  <h3 className="text-xl font-black italic tracking-tight uppercase leading-none border-b border-white/10 pb-6 mb-8">Performance Spectrum</h3>
                  <div className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                           <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ borderRadius: '24px', backgroundColor: '#002244', border: 'none', color: '#fff', fontStyle: 'italic', fontWeight: 900 }} />
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" hide />
                           <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={32}>
                              {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="space-y-4 pt-4">
                     {categoryData.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-60">
                           <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /> {item.name} Identity</span>
                           <span>{(item.value / 100).toFixed(1)}% Velocity</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* TOP PRODUCTS */}
            <div className="bg-white rounded-[40px] border border-border-main p-8 shadow-sm space-y-8 flex flex-col group">
               <h4 className="text-sm font-black text-[#003366] italic tracking-tight uppercase border-b border-gray-50 pb-4">Top Selling Assets</h4>
               <div className="space-y-2 flex-1">
                  {[
                     { name: 'X-5 Pro Processor', stat: '482 Units', val: '₹4.2M' },
                     { name: 'Global Network Card', stat: '395 Units', val: '₹1.8M' },
                     { name: 'Base Station II', stat: '218 Units', val: '₹900K' },
                     { name: 'Ultra Hub V3', stat: '164 Units', val: '₹450K' },
                     { name: 'Industrial Fan L4', stat: '142 Units', val: '₹120K' },
                  ].map((prod, i) => (
                     <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 cursor-pointer">
                        <div className="flex items-center gap-4">
                           <span className="text-[10px] font-black text-gray-200">{i + 1}</span>
                           <div>
                              <p className="text-xs font-black text-[#003366] uppercase italic leading-none">{prod.name}</p>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{prod.stat}</p>
                           </div>
                        </div>
                        <p className="text-sm font-black text-text-main tabular-nums italic">{prod.val}</p>
                     </div>
                  ))}
               </div>
            </div>

            {/* PIE CHART SECTION */}
            <div className="bg-white rounded-[40px] border border-border-main p-8 shadow-sm space-y-8 flex flex-col items-center justify-center group overflow-hidden">
               <h4 className="w-full text-sm font-black text-[#003366] italic tracking-tight uppercase border-b border-gray-50 pb-4">Allocation Metrics</h4>
               <div className="h-[250px] w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                     <RePieChart>
                        <Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                           {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', fontStyle: 'italic', fontWeight: 900 }} />
                     </RePieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <p className="text-2xl font-black text-[#003366] italic leading-none">94.8%</p>
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Efficiency</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4 w-full">
                  {categoryData.map((item, i) => (
                     <div key={i} className="flex flex-col p-4 rounded-2xl bg-gray-50 text-center">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.name}</p>
                        <p className="text-sm font-black text-[#003366] italic">₹{(item.value / 10).toFixed(1)}K</p>
                     </div>
                  ))}
               </div>
            </div>

            {/* FILTERS & STATUS */}
            <div className="bg-[#003366] rounded-[40px] border border-[#003366] p-8 shadow-xl space-y-8 flex flex-col group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-all duration-700"><LayoutGrid className="w-24 h-24 text-white" /></div>
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="space-y-6">
                     <h4 className="text-sm font-black text-white italic tracking-tight uppercase border-b border-white/10 pb-4">Analytical scoping</h4>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-blue-200 uppercase tracking-widest opacity-60 italic">Warehouse Location</label>
                           <select className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-black italic text-white focus:outline-none appearance-none">
                              <option className="text-black">All Distribution Hubs</option>
                              <option className="text-black">North Fulfillment</option>
                              <option className="text-black">Central Repository</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-blue-200 uppercase tracking-widest opacity-60 italic">Report Category</label>
                           <select className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-black italic text-white focus:outline-none appearance-none">
                              <option className="text-black">Enterprise Hardware</option>
                              <option className="text-black">Consumer Electronics</option>
                              <option className="text-black">Managed Services</option>
                           </select>
                        </div>
                     </div>
                  </div>
                  <div className="pt-8">
                     <Button className="w-full h-14 rounded-2xl bg-white text-[#003366] hover:bg-white/90 font-black italic text-xs tracking-widest shadow-2xl flex items-center justify-center gap-2">
                        <Filter className="w-4 h-4" /> Apply Scoping Filters
                     </Button>
                  </div>
               </div>
            </div>
         </div>

         {/* DYNAMIC REPORT TABLE */}
         <div className="bg-white rounded-[40px] border border-border-main p-8 shadow-sm space-y-8 overflow-hidden">
            <div className="flex justify-between items-center border-b border-gray-50 pb-6">
               <div>
                  <h3 className="text-xl font-black text-[#003366] italic tracking-tight uppercase leading-none">{activeTab} Ledger Report</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Fiscal Audit &rarr; {dateRange.start} to {dateRange.end}</p>
               </div>
               <div className="flex gap-2">
                  <Button variant="secondary" className="h-10 px-4 rounded-xl font-black text-[9px] tracking-widest uppercase italic bg-gray-50 border-gray-100 flex items-center gap-2">
                     <TableIcon className="w-4 h-4" /> Column Config
                  </Button>
                  <Button variant="secondary" onClick={() => handleExport('print')} className="h-10 px-4 rounded-xl font-black text-[9px] tracking-widest uppercase italic bg-gray-50 border-gray-100 flex items-center gap-2 text-primary">
                     <Printer className="w-4 h-4" /> Print Ledger
                  </Button>
               </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{activeTab === 'inventory' ? 'Asset Identity' : 'Fiscal Date'}</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{activeTab === 'purchase' ? 'PO Number' : 'Reference ID'}</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{activeTab === 'purchase' ? 'Vendor' : 'Customer Entity'}</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Unit Count</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Settlement Amt</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Fiscal Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {tableData.map((row) => (
                        <tr key={row.id} className="group hover:bg-gray-50/20 transition-all cursor-pointer">
                           <td className="px-6 py-6 font-bold text-text-main italic">
                              <p className="text-sm font-black text-[#003366] uppercase leading-none">{activeTab === 'inventory' ? 'X-5 Pro Processor' : 'Mar ' + (row.id + 10) + ', 2024'}</p>
                              <p className="text-[9px] font-black text-gray-300 uppercase mt-1 tracking-widest">Digital Stamp: {row.stamp}</p>
                           </td>
                           <td className="px-6 py-6">
                              <code className="text-[10px] bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 font-mono font-black text-gray-400">{activeTab === 'purchase' ? 'PO-992' + row.id : 'INV-' + row.id + '092'}</code>
                           </td>
                           <td className="px-6 py-6">
                              <p className="text-[11px] font-black text-[#003366] uppercase italic tracking-tight">{activeTab === 'purchase' ? 'Global Logic Inc' : 'Cyberdyne Systems'}</p>
                           </td>
                           <td className="px-6 py-6 text-center text-sm font-black italic text-gray-400 tabular-nums">
                              {row.qty}
                           </td>
                           <td className="px-6 py-6 text-right font-black italic text-sm text-[#003366] tabular-nums tracking-tighter">
                              ₹{row.amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                           </td>
                           <td className="px-8 py-6 text-right">
                              <span className={cn(
                                 "h-6 px-3 rounded-lg font-black italic text-[9px] uppercase tracking-tighter flex items-center justify-center border border-transparent",
                                 row.id % 2 === 0 ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
                               )}>{row.id % 2 === 0 ? 'Verified' : 'Pending'}</span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <div className="p-8 bg-gray-50/20 border-t border-gray-100 flex items-center justify-between">
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Inventory Audit Cluster &rarr; Page 1 of 12</p>
               <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                     <button key={i} className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border",
                        i === 1 ? "bg-[#003366] text-white border-[#003366] shadow-lg shadow-primary/20" : "bg-white text-gray-300 border-gray-100 hover:border-gray-200"
                     )}>{i}</button>
                  ))}
                  <button className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 hover:text-primary transition-all ml-1">
                     <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </div>
         </div>
      </div>
   )
}

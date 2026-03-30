"use client"

import React, { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  FileText, 
  Filter, 
  Download, 
  Printer, 
  ChevronRight,
  Zap,
  CheckCircle2,
  AlertCircle
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
  LineChart,
  Line
} from 'recharts'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { MetricCard } from '@/components/shared/MetricCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function DetailedReportPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  
  const category = params.category as string
  const type = searchParams.get('type') || 'general'
  
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Dynamic Title Logic
  const reportInfo = useMemo(() => {
    const titles: Record<string, Record<string, string>> = {
      sales: {
        'total-sales': 'Invoiced Sales Revenue',
        'profit': 'Net Margin Analysis',
        'general': 'Sales Operations Ledger'
      },
      inventory: {
        'low-stock': 'Critical Low Stock Registry',
        'general': 'Inventory Asset Audit'
      },
      purchase: {
        'total-purchase': 'Procurement Expenditure',
        'general': 'Purchase Order History'
      },
      financial: {
        'pending': 'Outstanding Fiscal Settlements',
        'general': 'Financial Statement'
      }
    }
    return titles[category]?.[type] || titles[category]?.['general'] || 'Detailed Report'
  }, [category, type])

  const breadcrumbItems = [
    { label: 'Reports', href: '/reports' },
    { label: category.charAt(0).toUpperCase() + category.slice(1), href: `/reports` },
    { label: reportInfo }
  ]

  const handleExport = (format: string) => {
    toast.success(`Exporting ${reportInfo} as ${format.toUpperCase()}...`)
  }

  // Mock Table Data based on Type
  const tableData = useMemo(() => {
    const base = [1, 2, 3, 4, 5, 6, 7, 8]
    return base.map(i => ({
      id: `REF-${2000 + i}`,
      date: `2024-03-${10 + i}`,
      entity: category === 'purchase' ? 'Industrial Logic Ltd' : 'Apex Systems Inc',
      amount: (Math.random() * 5000 + 100).toFixed(2),
      status: type === 'low-stock' ? 'Critical' : i % 3 === 0 ? 'Verified' : 'Pending',
      units: Math.floor(Math.random() * 50) + 1
    }))
  }, [category, type])

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500 text-text-main">
      {/* BREADCRUMBS & HEADER */}
      <div className="space-y-4">
         <Breadcrumbs items={breadcrumbItems} />
         <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-white p-8 rounded-[32px] border border-border-main shadow-sm gap-6">
            <div>
               <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-black text-[#003366] tracking-tighter italic uppercase">{reportInfo}</h1>
                  <Badge variant="secondary" className="h-6 px-3 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black italic">FILTERED_VIEW</Badge>
               </div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 italic">Scoped Analytics &rarr; {type.replace('-', ' ')}</p>
            </div>
            <div className="flex gap-2">
               <Button variant="secondary" onClick={() => handleExport('pdf')} className="h-12 px-6 rounded-xl font-black text-[10px] tracking-widest uppercase italic bg-white border-gray-100 flex items-center gap-2 group">
                  <FileText className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" /> PDF
               </Button>
               <Button variant="secondary" onClick={() => handleExport('csv')} className="h-12 px-6 rounded-xl font-black text-[10px] tracking-widest uppercase italic bg-white border-gray-100 flex items-center gap-2 group">
                  <Download className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" /> CSV
               </Button>
               <Button variant="secondary" className="h-12 px-6 rounded-xl font-black text-[10px] tracking-widest uppercase italic bg-white border-gray-100 flex items-center gap-2 group">
                  <Printer className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" /> Print
               </Button>
            </div>
         </div>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white p-6 rounded-[32px] border border-border-main shadow-sm flex items-center justify-between">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <Filter className="w-4 h-4 text-primary" />
               <span className="text-[10px] font-black text-[#003366] uppercase tracking-widest italic">Report Scoping:</span>
            </div>
            <div className="flex gap-2">
               <select className="bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black px-4 py-2 italic focus:outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors">
                  <option>All Warehouses</option>
                  <option>North Distrib.</option>
               </select>
               <select className="bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black px-4 py-2 italic focus:outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors">
                  <option>FY 2024-25</option>
                  <option>FY 2023-24</option>
               </select>
            </div>
         </div>
         <Button variant="secondary" className="h-10 px-6 rounded-xl font-black text-[9px] uppercase italic tracking-widest border-gray-100">
            Apply Filters
         </Button>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard title="Scoped Revenue" value="₹24,840" trend="+12%" icon={<TrendingUp className="w-5 h-5" />} variant="primary" href="#" />
         <MetricCard title="Entity Count" value="124" trend="+5" icon={<ShoppingCart className="w-5 h-5" />} variant="default" href="/inventory" />
         <MetricCard title="Avg. Ticket" value="₹240.50" trend="-2%" icon={<Zap className="w-5 h-5" />} variant="success" href="/reports/sales" />
         <MetricCard title="System Confidence" value="99.8%" icon={<CheckCircle2 className="w-5 h-5" />} variant="primary" href="/inventory/registry" />
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[40px] border border-border-main p-8 shadow-sm space-y-8 overflow-hidden">
         <div className="flex justify-between items-center border-b border-gray-50 pb-6">
            <h3 className="text-xl font-black text-[#003366] italic tracking-tight uppercase leading-none">Diagnostic Ledger</h3>
            <Badge variant="secondary" className="italic font-black text-[9px] border-primary/10 bg-primary/5 text-primary h-6 px-3">Live Result Set</Badge>
         </div>

         <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left font-bold">
               <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Date Stamp</th>
                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Reference ID</th>
                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Primary Entity</th>
                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Qty</th>
                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Settlement Amt</th>
                     <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {tableData.map((row, idx) => (
                    <tr key={idx} className="group hover:bg-gray-50/20 transition-all cursor-pointer">
                       <td className="px-6 py-6 italic font-black text-[#003366]">
                          <p className="text-sm uppercase leading-none">{row.date}</p>
                          <p className="text-[9px] text-gray-300 mt-1 uppercase tracking-widest leading-none">Cluster: {idx + 1}</p>
                       </td>
                       <td className="px-6 py-6">
                          <code className="text-[10px] bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 font-mono font-black text-gray-400 group-hover:text-primary transition-colors">{row.id}</code>
                       </td>
                       <td className="px-6 py-6">
                          <p className="text-[11px] font-black text-[#003366] uppercase italic tracking-tight leading-none mb-1">{row.entity}</p>
                          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black leading-none italic">Verified Partner</p>
                       </td>
                       <td className="px-6 py-6 text-center text-sm font-black italic text-gray-400 tabular-nums">
                          {row.units}
                       </td>
                       <td className="px-6 py-6 text-right font-black italic text-sm text-[#003366] tabular-nums tracking-tighter">
                          ₹{row.amount}
                       </td>
                       <td className="px-8 py-6 text-right">
                          <Badge variant={row.status === 'Critical' ? 'error' : row.status === 'Verified' ? 'success' : 'secondary'} className="h-6 px-3 rounded-lg font-black italic text-[9px] uppercase tracking-tighter shadow-sm border-none">
                             {row.status}
                          </Badge>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* MINI ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[350px]">
         <div className="bg-white rounded-[40px] border border-border-main p-8 shadow-sm flex flex-col group overflow-hidden">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 italic">Trend Analysis (Scoped)</h4>
            <div className="flex-1">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tableData}>
                     <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F1F5F9" />
                     <XAxis dataKey="date" hide />
                     <YAxis hide />
                     <Tooltip />
                     <Line type="monotone" dataKey="amount" stroke="#003366" strokeWidth={4} dot={false} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>
         <div className="bg-[#003366] rounded-[40px] p-8 shadow-xl flex flex-col group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-all duration-700"><BarChart3 className="w-24 h-24 text-white" /></div>
            <h4 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-8 italic relative z-10">Entity Distribution</h4>
            <div className="flex-1 relative z-10">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tableData}>
                     <Bar dataKey="units" fill="rgba(255,255,255,0.2)" radius={[8, 8, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  )
}

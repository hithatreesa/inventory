"use client"

import React, { useState } from 'react'
import {
  BarChart3,
  Download,
  Calendar,
  ChevronRight,
  TrendingUp,
  FileText,
  Activity,
  Filter,
  Plus,
  Search,
  AlertTriangle
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
  PieChart,
  Pie
} from 'recharts'
import { Button } from '@/components/ui/Button'
import { DataTable, Column } from '@/components/tables/DataTable'
import { MetricCard } from '@/components/shared/MetricCard'
import { cn } from '@/lib/utils'

const trendData = [
  { name: 'Mon', electronics: 4000, raw: 2400 },
  { name: 'Tue', electronics: 3000, raw: 1398 },
  { name: 'Wed', electronics: 2000, raw: 9800 },
  { name: 'Thu', electronics: 2780, raw: 3908 },
  { name: 'Fri', electronics: 1890, raw: 4800 },
  { name: 'Sat', electronics: 2390, raw: 3800 },
  { name: 'Sun', electronics: 3490, raw: 4300 },
]

const categoryData = [
  { name: 'Finished Goods', value: 65, color: '#0062FF' },
  { name: 'Raw Materials', value: 22, color: '#94A3B8' },
  { name: 'Work in Progress', value: 13, color: '#CBD5E1' },
]

interface StockLedger {
  id: string
  sku: string
  name: string
  cat: string
  qty: string
  price: string
  status: string
}

const ledgerData: StockLedger[] = [
  { id: '1', sku: '#EXE-8901', name: 'Precision Steel Frames', cat: 'Raw Materials', qty: '1,240 Units', price: '₹124.50', status: 'IN STOCK' },
  { id: '2', sku: '#EXE-4422', name: 'Glass Facade Panels', cat: 'Finished Goods', qty: '12 Units', price: '₹890.00', status: 'LOW STOCK' },
  { id: '3', sku: '#EXE-1120', name: 'Aluminum Connectors', cat: 'Hardware', qty: '8,420 Units', price: '₹12.20', status: 'IN STOCK' },
  { id: '4', sku: '#EXE-7731', name: 'Titanium Rivets (Box 100)', cat: 'Fasteners', qty: '0 Units', price: '₹340.00', status: 'OUT OF STOCK' },
]

export default function StockReportPage() {
  const [activeTab, setActiveTab] = useState('Stock Report')

  const columns: Column<StockLedger>[] = [
    {
      header: 'SKU ID',
      accessorKey: 'sku',
      className: 'font-black text-primary italic lowercase'
    },
    {
      header: 'PRODUCT NAME',
      accessorKey: 'name',
      className: 'font-black text-text-main italic'
    },
    { header: 'CATEGORY', accessorKey: 'cat', className: 'font-bold text-text-secondary' },
    { header: 'IN STOCK', accessorKey: 'qty', align: 'center', className: 'font-black' },
    { header: 'UNIT PRICE', accessorKey: 'price', align: 'right', className: 'font-black' },
    {
      header: 'STATUS',
      align: 'center',
      cell: (item) => {
        return (
          <span className={cn(
            "inline-flex items-center gap-2 font-black italic text-[10px] uppercase tracking-widest",
            item.status === 'IN STOCK' ? 'text-green-600' : item.status === 'LOW STOCK' ? 'text-orange-600' : 'text-red-600'
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              item.status === 'IN STOCK' ? 'bg-green-600 animate-pulse' : item.status === 'LOW STOCK' ? 'bg-orange-600' : 'bg-red-600'
            )} />
            {item.status}
          </span>
        )
      }
    },
    {
      header: '',
      align: 'right',
      cell: () => (
        <Button variant="ghost" size="icon">
          <Activity className="w-4 h-4" />
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.2em] mb-2">
            <BarChart3 className="w-4 h-4" /> Reports Engine 🥈
          </div>
          <div className="flex items-center gap-10">
            <h1 className="text-4xl font-black text-text-main tracking-tight italic">Analytics Console</h1>
            <nav className="flex items-center gap-8 border-b border-gray-100 pb-1">
              {['Overview', 'Performance', 'Audit Logs'].map((item) => (
                <span key={item} className="text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary cursor-pointer transition-colors">{item}</span>
              ))}
            </nav>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="icon" className="rounded-2xl">
            <Search className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-border-main shadow-sm" />
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex justify-between items-center border-b border-gray-100">
        <div className="flex gap-12">
          {['Stock Report', 'Financial Ledger', 'Tax Compliance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-xl font-black italic tracking-tighter transition-all relative ${activeTab === tab ? 'text-primary' : 'text-text-secondary hover:text-text-main'
                }`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary rounded-full shadow-lg shadow-primary/20" />}
            </button>
          ))}
        </div>
        <div className="flex gap-4 pb-4">
          <Button variant="secondary" size="md" className="rounded-2xl">
            <Calendar className="w-4 h-4 mr-2" /> LAST 30 DAYS
          </Button>
          <Button size="md" className="rounded-2xl">
            <Download className="w-4 h-4 mr-2" /> EXPORT PDF
          </Button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <MetricCard
          title="AGGREGATE VALUATION"
          value="₹2,840,921.45"
          trend="+12.4%"
          icon={<TrendingUp className="w-5 h-5" />}
          variant="primary"
          href="/reports/financial"
        />
        <MetricCard
          title="CRITICAL ALERTS"
          value="24"
          period="Items req. action"
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          variant="warning"
          isCritical
          href="/reports/inventory?type=low-stock"
        />
        <MetricCard
          title="STORAGE EFFICIENCY"
          value="84.2%"
          period="12,402 / 15,000 UNITS"
          icon={<Activity className="w-5 h-5" />}
          variant="success"
          href="/inventory"
        />
        <MetricCard
          title="AUDITS PENDING"
          value="03"
          period="Next Cycle: 48h"
          icon={<FileText className="w-5 h-5" />}
          variant="default"
          href="/inventory/registry"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-10 rounded-[40px] border border-border-main shadow-sm">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h3 className="text-2xl font-black text-text-main italic tracking-tight">Stock Level Trends</h3>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mt-1 opacity-60">Weekly categorization analytics</p>
            </div>
            <div className="flex items-center gap-6">
              <LegendItem color="bg-primary" label="ELECTRONICS" />
              <LegendItem color="bg-gray-300" label="RAW MATERIALS" />
            </div>
          </div>
          <div className="h-[380px] -ml-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid vertical={false} strokeDasharray="6 6" stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }} dy={15} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', fontStyle: 'italic', fontWeight: 900 }}
                />
                <Bar dataKey="electronics" stackId="a" fill="#0062FF" radius={[0, 0, 0, 0]} barSize={40} />
                <Bar dataKey="raw" stackId="a" fill="#E2E8F0" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-10 rounded-[40px] border border-border-main shadow-sm flex flex-col">
          <h3 className="text-2xl font-black text-text-main italic tracking-tight mb-2">Category Split</h3>
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-12 opacity-60">Revenue sectoral share</p>
          <div className="flex-1 flex flex-col items-center justify-center relative scale-110">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-black text-text-main italic tracking-tighter leading-none">65%</p>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mt-2">FINISHED</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={105}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1500}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-6 mt-12 pb-4">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex justify-between items-center group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full group-hover:scale-125 transition-transform" style={{ backgroundColor: cat.color }} />
                  <span className="text-[11px] font-black text-text-secondary uppercase tracking-widest group-hover:text-text-main transition-colors">{cat.name}</span>
                </div>
                <span className="text-lg font-black text-text-main italic tracking-tighter">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ledger Table Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-8">
          <h3 className="text-2xl font-black text-text-main italic tracking-tight uppercase">Operational Ledger</h3>
          <div className="flex gap-4">
            <Button variant="secondary" size="icon" className="rounded-xl"><Filter className="w-5 h-5" /></Button>
            <Button variant="secondary" size="icon" className="rounded-xl"><Activity className="w-5 h-5" /></Button>
          </div>
        </div>
        <DataTable columns={columns} data={ledgerData} />
      </div>

      {/* FAB */}
      <Button size="xl" className="fixed bottom-12 right-12 w-20 h-20 rounded-[28px] shadow-2xl shadow-primary/60 hover:scale-110 active:scale-90">
        <Plus className="w-10 h-10" />
      </Button>
    </div>
  )
}

function LegendItem({ color, label }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-[10px] font-black text-text-main tracking-widest uppercase">{label}</span>
    </div>
  )
}


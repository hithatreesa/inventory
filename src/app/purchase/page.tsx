"use client"

import React from 'react'
import { 
  Plus, 
  Filter, 
  Download, 
  Search,
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { DataTable, Column } from '@/components/tables/DataTable'
import { MetricCard } from '@/components/shared/MetricCard'

interface PurchaseOrder {
  id: string
  vendor: string
  date: string
  amount: number
  status: 'Draft' | 'Pending' | 'Approved' | 'Completed'
  items: number
}

const mockOrders: PurchaseOrder[] = [
  { id: 'PO-2024-001', vendor: 'Aether Logistics', date: '2024-03-28', amount: 11182.50, status: 'Approved', items: 12 },
  { id: 'PO-2024-002', vendor: 'Titanium Corp', date: '2024-03-27', amount: 5400.00, status: 'Pending', items: 5 },
  { id: 'PO-2024-003', vendor: 'Global Rivets', date: '2024-03-26', amount: 1250.75, status: 'Completed', items: 45 },
  { id: 'PO-2024-004', vendor: 'Aether Logistics', date: '2024-03-25', amount: 8900.00, status: 'Draft', items: 8 },
]

export default function PurchaseDashboard() {
  const columns: Column<PurchaseOrder>[] = [
    {
      header: 'ORDER ID',
      cell: (order) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20">
             <ShoppingCart className="w-4 h-4" />
          </div>
          <span className="text-sm font-black text-text-main italic tracking-tight">{order.id}</span>
        </div>
      )
    },
    { 
      header: 'VENDOR', 
      accessorKey: 'vendor',
      className: 'font-bold text-text-secondary text-xs italic tracking-tight'
    },
    { 
      header: 'DATE', 
      accessorKey: 'date',
      className: 'font-bold text-text-secondary text-xs'
    },
    { 
      header: 'ITEMS', 
      accessorKey: 'items',
      align: 'center',
      className: 'font-black'
    },
    { 
      header: 'TOTAL AMOUNT', 
      align: 'right',
      className: 'font-black text-text-main italic',
      cell: (order) => `₹${order.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`
    },
    { 
      header: 'STATUS', 
      align: 'right',
      cell: (order) => (
        <Badge 
          variant={order.status === 'Completed' ? 'success' : order.status === 'Approved' ? 'secondary' : 'warning'}
          dot
          className="italic"
        >
          {order.status.toUpperCase()}
        </Badge>
      )
    }
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
           <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 leading-none">PROCUREMENT CENTER 🥈</p>
           <h1 className="text-4xl font-black text-text-main tracking-tight italic">Purchases</h1>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="secondary" className="rounded-2xl border-gray-100 font-black text-[10px] tracking-widest h-12 px-6">
              <Download className="w-4 h-4 mr-2" /> EXPORT PDF
           </Button>
           <Link href="/purchase/new">
             <Button className="rounded-2xl shadow-xl shadow-primary/20 font-black text-[10px] tracking-widest h-12 px-8 italic">
                <Plus className="w-5 h-5 mr-1" /> CREATE NEW PO
             </Button>
           </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard 
           title="PENDING APPROVAL" 
           value="12" 
           icon={<Clock className="w-5 h-5 text-warning" />} 
           variant="warning"
           href="/reports/purchase?type=pending"
         />
         <MetricCard 
           title="ACTIVE SHIPMENTS" 
           value="08" 
           icon={<ShoppingCart className="w-5 h-5 text-primary" />} 
           variant="primary"
           href="/reports/purchase?type=active"
         />
         <MetricCard 
           title="WEEKLY COMMITTED" 
           value="₹42.5K" 
           icon={<Plus className="w-5 h-5 text-success" />} 
           variant="success"
           href="/reports/financial"
         />
         <MetricCard 
           title="VENDOR EXCEPTIONS" 
           value="02" 
           icon={<AlertTriangle className="w-5 h-5 text-orange-500" />} 
           variant="warning"
           isCritical
           href="/reports/purchase?type=exceptions"
         />
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-5 rounded-[24px] border border-border-main flex items-center justify-between gap-6 shadow-sm">
         <div className="flex-1">
            <Input 
              placeholder="Search vendor, order id or sku..." 
              icon={<Search className="w-4 h-4" />}
              className="bg-gray-50/50 border-gray-100 rounded-2xl h-12 italic font-bold placeholder:text-[10px] placeholder:tracking-widest"
            />
         </div>
         <div className="flex items-center gap-3">
            <Button variant="secondary" size="icon" className="rounded-2xl h-12 w-12 border-gray-100">
               <Filter className="w-5 h-5 text-text-secondary" />
            </Button>
            <div className="h-8 w-[1px] bg-gray-100 mx-2" />
            <select className="bg-transparent text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer">
               <option>LATEST ENTRIES</option>
               <option>HIGHEST AMOUNT</option>
               <option>PENDING ONLY</option>
            </select>
         </div>
      </div>

      {/* Orders Table */}
      <div className="space-y-4">
         <div className="flex justify-between items-center px-6">
            <h3 className="text-xl font-black text-text-main italic tracking-tight uppercase leading-none">Recent Procurement History</h3>
            <Badge variant="secondary" className="italic px-3">BETA-2 SYSTEM</Badge>
         </div>
         <DataTable columns={columns} data={mockOrders} />
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[24px] border border-border-main shadow-sm group hover:border-primary/20 transition-all cursor-pointer">
       <div className="flex justify-between items-start mb-3">
          <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40">{title}</p>
          <div className={`${color} bg-gray-50 p-2 rounded-xl group-hover:scale-110 transition-transform`}>{icon}</div>
       </div>
       <h4 className="text-2xl font-black text-text-main italic tracking-tighter leading-none">{value}</h4>
    </div>
  )
}

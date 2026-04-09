"use client"

import React, { useMemo, useState } from 'react'
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
import { useData } from '@/lib/context/DataContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable, Column } from '@/components/tables/DataTable'
import { MetricCard } from '@/components/shared/MetricCard'
import { ItemModal } from '@/components/modals/ItemModal'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function PurchaseDashboard() {
  const { transactions, inventory, inwardItem } = useData()
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)

  const purchaseHistory = useMemo(() => {
    return transactions
      .filter(t => t.type === 'INWARD')
      .map(t => {
        const item = inventory.find(i => i.id === t.item_id)
        return {
          id: `PO-${t.id}`,
          vendor: t.reference || 'Auto-Procured',
          date: t.date,
          amount: t.quantity * (item?.price || 0),
          status: 'Completed',
          items: t.quantity,
          itemName: item?.name || 'Unknown'
        }
      })
  }, [transactions, inventory])

  const stats = useMemo(() => {
    const totalSpent = purchaseHistory.reduce((acc, p) => acc + p.amount, 0)
    const pending = transactions.filter(t => t.status === 'PENDING').length
    return {
      totalSpent,
      pending,
      count: purchaseHistory.length
    }
  }, [purchaseHistory, transactions])

  const columns: Column<any>[] = [
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
      header: 'ITEM / VENDOR',
      cell: (order) => (
        <div>
          <p className="font-black text-text-main text-sm italic uppercase leading-none">{order.itemName}</p>
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">{order.vendor}</p>
        </div>
      )
    },
    {
      header: 'DATE',
      accessorKey: 'date',
      className: 'font-bold text-text-secondary text-sm'
    },
    {
      header: 'QTY',
      accessorKey: 'items',
      align: 'center',
      className: 'font-black'
    },
    {
      header: 'EST. VALUE',
      align: 'right',
      className: 'font-black text-text-main italic',
      cell: (order) => `₹${order.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    {
      header: 'STATUS',
      align: 'right',
      cell: (order) => (
        <span className={cn(
          "inline-flex items-center gap-2 font-black italic text-sm tracking-tight uppercase text-green-600"
        )}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
          {order.status}
        </span>
      )
    }
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-text-main tracking-tight italic">Purchases</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="secondary" className="rounded-2xl border-gray-100 font-black text-sm tracking-widest h-12 px-6" onClick={() => toast.info('Export started')}>
            <Download className="w-4 h-4 mr-2" /> EXPORT PDF
          </Button>
          <Button
            onClick={() => setIsItemModalOpen(true)}
            className="rounded-2xl shadow-xl shadow-primary/20 font-black text-sm tracking-widest h-12 px-8 italic"
          >
            <Plus className="w-5 h-5 mr-1" /> ADD ITEM
          </Button>
          <Button
            onClick={() => toast.info('Please use Quick Entry to record a new purchase')}
            className="rounded-2xl shadow-xl shadow-primary/20 font-black text-sm tracking-widest h-12 px-8 italic bg-[#003366] text-white"
          >
            <Plus className="w-5 h-5 mr-1" /> CREATE NEW PO
          </Button>
        </div>
      </div>

      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        item={null}
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        <MetricCard
          title="PENDING APPROVAL"
          value={stats.pending}
          icon={<Clock className="w-5 h-5 text-warning" />}
          variant="warning"
          onClick={() => toast.info("Redirecting to Purchase Approval Workflow")}
        />
        <MetricCard
          title="COMPLETED POs"
          value={stats.count}
          icon={<ShoppingCart className="w-5 h-5 text-primary" />}
          variant="primary"
          onClick={() => toast.info("Filtering history by Completed status")}
        />
        <MetricCard
          title="TOTAL COMMITTED"
          value={`₹${(stats.totalSpent / 1000).toFixed(1)}K`}
          icon={<Plus className="w-5 h-5 text-success" />}
          variant="success"
          href="/reports/purchase"
        />
        <MetricCard
          title="VENDOR EXCEPTIONS"
          value="0"
          icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
          variant="warning"
          onClick={() => toast.info("Audit: Zero vendor exceptions found for current cycle")}
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-5 rounded-[24px] border border-border-main flex items-center justify-between gap-6 shadow-sm">
        <div className="flex-1">
          <Input
            placeholder="Search vendor, order id or sku..."
            icon={<Search className="w-4 h-4" />}
            className="bg-gray-50/50 border-gray-100 rounded-2xl h-12 italic font-bold placeholder:text-sm placeholder:tracking-widest"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" className="rounded-2xl h-12 w-12 border-gray-100">
            <Filter className="w-5 h-5 text-text-secondary" />
          </Button>
          <div className="h-8 w-[1px] bg-gray-100 mx-2" />
          <select className="bg-transparent text-sm font-black uppercase tracking-widest focus:outline-none cursor-pointer">
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
        </div>
        <DataTable columns={columns} data={purchaseHistory} />
        {purchaseHistory.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-gray-50 rounded-[32px]">
            <p className="text-sm font-black text-gray-300 uppercase tracking-widest italic">No procurement records found in system</p>
          </div>
        )}
      </div>
    </div>
  )
}

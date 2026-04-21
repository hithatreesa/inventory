"use client"

import React, { useMemo, useState } from 'react'
import {
  Plus,
  Filter,
  Download,
  Search,
  ShoppingCart,
  Clock,
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
import { useRouter } from 'next/navigation'

export default function PurchaseDashboard() {
  const router = useRouter()
  const { transactions, inventory, inwardItem } = useData()
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)

  const inventoryMap = useMemo(() => {
    return new Map(inventory.map(i => [i.id, i]))
  }, [inventory])

  const purchaseHistory = useMemo(() => {
    return transactions
      .reduce((acc: any[], t) => {
        if (t.type === 'INWARD') {
          const item = inventoryMap.get(t.item_id)
          acc.push({
            id: `PO-${t.id}`,
            vendor: t.reference || 'Auto-Procured',
            date: t.date,
            amount: t.quantity * (item?.price || 0),
            status: 'Completed',
            items: t.quantity,
            itemName: item?.name || 'Unknown'
          })
        }
        return acc
      }, [])
  }, [transactions, inventoryMap])

  const stats = useMemo(() => {
    const totalSpent = purchaseHistory.reduce((acc, p) => acc + p.amount, 0)
    let pending = 0

    // Single pass for pending status count
    for (let i = 0; i < transactions.length; i++) {
      if (transactions[i].status === 'PENDING') pending++
    }

    return {
      totalSpent,
      pending,
      count: purchaseHistory.length
    }
  }, [purchaseHistory, transactions])

  const columns: Column<any>[] = useMemo(() => [
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
      cell: (order) => `₹${order.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    },
    {
      header: 'STATUS',
      align: 'right',
      cell: (order) => (
        <span className={cn("inline-flex items-center gap-2 font-black italic text-sm tracking-tight uppercase text-green-600")}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
          {order.status}
        </span>
      )
    }
  ], [])

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 px-2 sm:px-0">
        <div className="w-full lg:w-auto">
          <h1 className="text-3xl sm:text-4xl font-black text-text-main tracking-tight italic uppercase underline decoration-primary/20 decoration-4 leading-tight">Purchases</h1>
        </div>

        {/* Header Action Row */}
        <div className="w-full lg:w-auto flex items-center gap-3 overflow-x-auto pb-4 lg:pb-0 custom-scrollbar-hide snap-x">
          <Button
            variant="secondary"
            className="flex-shrink-0 rounded-xl sm:rounded-2xl border-2 border-gray-100 font-black text-[8px] sm:text-[10px] tracking-widest h-10 sm:h-12 px-3 sm:px-6 italic snap-start"
            onClick={() => toast.info('Export started')}
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" /> EXPORT
          </Button>
          <Button
            onClick={() => router.push('/purchase/entry')}
            className="flex-shrink-0 rounded-xl sm:rounded-2xl shadow-[0_10px_30px_rgba(0,51,102,0.3)] font-black text-[8px] sm:text-[10px] tracking-widest h-10 sm:h-12 px-6 sm:px-8 italic bg-[#003366] text-white snap-end"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1" /> NEW ENTRY
          </Button>
          <Button
            onClick={() => router.push('/purchase/new')}
            className="flex-shrink-0 rounded-xl sm:rounded-2xl shadow-[0_10px_30px_rgba(0,51,102,0.3)] font-black text-[8px] sm:text-[10px] tracking-widest h-10 sm:h-12 px-6 sm:px-8 italic bg-[#003366] text-white snap-end"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1" /> NEW PO
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

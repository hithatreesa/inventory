"use client"

import React, { useState, useMemo } from 'react'
import {
  Save,
  CheckCircle2,
  UserPlus,
  Plus,
  Info,
  FileUp,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { useData } from '@/lib/context/DataContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable, Column } from '@/components/tables/DataTable'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { SummaryPanel, SummaryActionCard, SummaryRow } from '@/components/shared/SummaryPanel'

interface SalesItem {
  id: number
  desc: string
  qty: number
  unitPrice: number
  tax: number
}

export default function SalesPage() {
  const { items: globalItems } = useData()
  const [items, setItems] = useState<SalesItem[]>([
    { id: 1, desc: 'Cloud Architecture Consultation', qty: 40, unitPrice: 185, tax: 21 },
    { id: 2, desc: 'Pro License: Executive Suite', qty: 1, unitPrice: 2499, tax: 21 },
    { id: 3, desc: 'Deployment Implementation Fee', qty: 1, unitPrice: 1200, tax: 0 },
  ])

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0), [items])
  const taxTotal = useMemo(() => items.reduce((acc, item) => acc + (item.qty * item.unitPrice * (item.tax / 100)), 0), [items])
  const grandTotal = subtotal + taxTotal

  const columns: Column<SalesItem>[] = [
    {
      header: 'DESCRIPTION',
      cell: (item) => (
        <div>
          <p className="text-sm font-black text-text-main italic">{item.desc}</p>
          <p className="text-[10px] text-text-secondary font-bold mt-1 uppercase tracking-tighter opacity-60">Professional Service / Phase 1</p>
        </div>
      )
    },
    { header: 'QTY', accessorKey: 'qty', align: 'center', className: 'font-bold' },
    {
      header: 'UNIT PRICE',
      align: 'right',
      className: 'font-bold',
      cell: (item) => `₹${item.unitPrice.toLocaleString()}`
    },
    { header: 'TAX (%)', accessorKey: 'tax', align: 'center', className: 'text-text-secondary font-bold' },
    {
      header: 'TOTAL',
      align: 'right',
      className: 'font-black text-primary italic',
      cell: (item) => `₹${(item.qty * item.unitPrice).toLocaleString()}`
    }
  ]

  const headerActions = (
    <>
      <Button variant="secondary" className="px-6 h-10">
        <Save className="w-4 h-4 mr-2" /> Save Draft
      </Button>
      <Button className="px-10 h-10 italic">
        <CheckCircle2 className="w-4 h-4 mr-2" /> Finalize & Approve
      </Button>
    </>
  )

  return (
    <div className="space-y-8 pb-12">
      <SectionHeader
        title="Draft Invoice"
        prefix="SALES MANAGEMENT"
        subtitle={`Document Identifier: #INV-2024-00892`}
        actions={headerActions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Form Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass p-8 rounded-[32px] shadow-sm flex flex-col justify-between min-h-[240px]">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] pl-1">CUSTOMER DETAILS</span>
                <Button variant="ghost" className="p-0 h-auto text-[10px] font-black uppercase text-primary tracking-widest">+ NEW CUSTOMER</Button>
              </div>
              <div className="bg-primary/5 p-5 rounded-[24px] flex items-center gap-5 cursor-pointer hover:bg-primary/10 transition-all group border border-primary/10">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-black text-text-main italic tracking-tight">Global Dynamics Inc.</p>
                  <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest mt-1">VAT: EU882910293</p>
                </div>
                <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[10px] text-text-secondary font-bold mt-6 uppercase tracking-widest opacity-60">128 Business Plaza, Suite 400, NY 10001</p>
            </div>

            <div className="glass p-8 rounded-[32px] shadow-sm min-h-[240px] flex flex-col">
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] pl-1">ORDER LOGISTICS</span>
              <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-secondary pl-1 uppercase tracking-widest">Entry Date</label>
                  <Input type="date" defaultValue="2024-05-24" className="h-11" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-secondary pl-1 uppercase tracking-widest">Due Date</label>
                  <Input type="date" defaultValue="2024-06-24" className="h-11" />
                </div>
              </div>
              <div className="mt-auto pt-6 flex gap-4 items-end">
                <Select label="PAYMENT TERMS" options={['Net 30 Days', 'Net 15 Days', 'Immediate']} />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-xl font-black text-text-main uppercase tracking-tight italic">Line Items</h3>
              <Button variant="ghost" size="sm" className="text-primary font-black tracking-widest">
                <Plus className="w-4 h-4 mr-1" /> ADD PRODUCT
              </Button>
            </div>
            <DataTable columns={columns} data={items} />
          </div>
        </div>

        {/* Totals Sidebar */}
        <div className="space-y-6">
          <SummaryPanel
            title="Summary"
            subtotal={subtotal}
            taxTotal={taxTotal}
            taxRate={21}
            logistics="Free Delivery"
            grandTotal={grandTotal}
            footerNote="Authorized signature required for approval. Digital copies sent to secondary billing."
          />

          <SummaryActionCard
            icon={ExternalLink}
            title="Global Currency: Indian Rupee"
            subtitle="Base Currency: INR"
          />

          <SummaryActionCard
            variant="dashed"
            icon={FileUp}
            title="Attach External Files"
            subtitle="PDF / JPG / DRAFT-B"
          />
        </div>
      </div>
    </div>
  )
}


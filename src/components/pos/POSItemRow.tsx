"use client"

import React, { memo } from 'react'
import { Trash2, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BillItem {
  id: string
  name: string
  sku: string
  price: number
  qty: number
  total: number
  gstRate: number
  isNew?: boolean
}

interface POSItemRowProps {
  item: BillItem
  customer: string
  onUpdateQty: (id: string, delta: number) => void
  onRemove: (id: string) => void
}

export const POSItemRow = memo(({ item, customer, onUpdateQty, onRemove }: POSItemRowProps) => {
  return (
    <tr className={cn(
      "group transition-all duration-500",
      item.isNew && "bg-primary/5 animate-in fade-in slide-up"
    )}>
      <td className="px-8 py-6">
        <p className="text-sm font-black text-text-main italic tracking-tight uppercase leading-none">{item.name}</p>
        <p className="text-sm font-mono text-gray-400 mt-2 font-bold tracking-widest">{item.sku}</p>
      </td>
      <td className="px-6 py-6">
        <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] italic truncate max-w-[120px]">{customer}</p>
      </td>
      <td className="px-6 py-6">
        <div className="flex items-center justify-center gap-4 bg-gray-50/50 p-1 rounded-xl border border-gray-100 w-fit mx-auto shadow-inner">
          <button
            onClick={() => onUpdateQty(item.id, -1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-red-50 hover:text-red-500 transition-all shadow-sm active:scale-90"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-black w-8 text-center tabular-nums">{item.qty}</span>
          <button
            onClick={() => onUpdateQty(item.id, 1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-green-50 hover:text-green-500 transition-all shadow-sm active:scale-90"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
      <td className="px-6 py-6 text-right font-black text-gray-400 italic text-sm tabular-nums">
        ₹{item.price.toLocaleString('en-IN')}
      </td>
      <td className="px-8 py-6 text-right font-black text-text-main italic text-base tracking-tighter tabular-nums">
        ₹{item.total.toLocaleString('en-IN')}
      </td>
      <td className="px-8 py-6 text-right">
        <button
          onClick={() => onRemove(item.id)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all group-hover:opacity-100 opacity-0"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </td>
    </tr>
  )
})

POSItemRow.displayName = 'POSItemRow'

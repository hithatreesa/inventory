"use client"

import React, { memo } from 'react'
import { Trash2, CircleMinus, CirclePlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BillItem {
  id: string
  name: string
  sku: string
  price: number
  qty: number
  total: number
  gstRate: number
  isSerialized: boolean
  serials: string[]
  isNew?: boolean
}

interface POSItemRowProps {
  item: BillItem
  index: number
  onUpdateQty: (id: string, delta: number) => void
  onRemove: (id: string) => void
}

export const POSItemRow = memo(({ item, index, onUpdateQty, onRemove }: POSItemRowProps) => {
  return (
    <tr className={cn(
      "group transition-all duration-500",
      item.isNew && "bg-primary/5 animate-in fade-in slide-up"
    )}>
      <td className="px-4 py-3 text-center font-bold text-gray-500 border-r border-gray-100 tabular-nums">
        {index + 1}
      </td>
      <td className="px-8 py-3 border-r border-gray-100">
        <p className="text-sm font-mono text-gray-500 font-bold tracking-widest">{item.sku}</p>
      </td>
      <td className="px-6 py-3 border-r border-gray-100">
        <p className="text-sm font-black text-text-main italic tracking-tight uppercase leading-none">{item.name}</p>
        {item.isSerialized && item.serials.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.serials.map(s => (
              <span key={s} className="text-[8px] font-black bg-blue-50 text-primary px-1.5 py-0.5 rounded border border-blue-100 italic tracking-tighter">
                {s}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="px-6 py-3 border-r border-gray-100">
        <div className="flex items-center justify-center gap-4 bg-gray-50/50 p-1 rounded-lg border border-gray-100 w-fit mx-auto shadow-inner">
          <button
            onClick={() => onUpdateQty(item.id, -1)}
            className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
          >
            <CircleMinus className="w-3 h-3" />
          </button>
          <span className="text-sm font-black w-6 text-center tabular-nums">{item.qty}</span>
          <button
            onClick={() => onUpdateQty(item.id, 1)}
            className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-green-50 hover:text-green-500 transition-all active:scale-90"
          >
            <CirclePlus className="w-3 h-3" />
          </button>
        </div>
      </td>
      <td className="px-6 py-3 border-r border-gray-100 text-right font-black text-gray-400 italic text-sm tabular-nums">
        ₹{item.price.toLocaleString('en-IN')}
      </td>
      <td className="px-8 py-3 border-r border-gray-100 text-right font-black text-text-main italic text-sm tracking-tighter tabular-nums">
        ₹{item.total.toLocaleString('en-IN')}
      </td>
      <td className="px-2 py-3 text-center">
        <button
          onClick={() => onRemove(item.id)}
          className="text-gray-300 hover:text-red-500 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  )
})

POSItemRow.displayName = 'POSItemRow'

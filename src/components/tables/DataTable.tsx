"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface Column<T> {
  header: string
  accessorKey?: keyof T
  cell?: (item: T) => React.ReactNode
  className?: string
  headerClassName?: string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  className?: string
  onRowClick?: (item: T) => void
  pageSize?: number
  currentPage?: number
}

function DataTable<T extends { id: string | number }>({
  columns,
  data,
  className,
  onRowClick,
  pageSize = 10,
  currentPage = 1
}: DataTableProps<T>) {
  return (
    <div className={cn("bg-white rounded-[32px] border border-border-main shadow-sm overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black text-text-secondary bg-gray-50/20 uppercase tracking-[0.2em] border-b border-gray-50">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-6 py-3 first:px-10 last:px-10",
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((item, index) => (
              <MemoizedRow
                key={item.id ?? index}
                item={item}
                columns={columns}
                onClick={onRowClick}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Placeholder */}
      <div className="p-8 bg-gray-50/10 flex justify-between items-center border-t border-gray-50/50">
        <p className="text-[10px] font-black text-text-secondary uppercase">
          Showing {data.length} records
        </p>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-lg border border-border-main flex items-center justify-center text-text-secondary text-xs font-black transition-all hover:bg-gray-100 italic">{'<'}</button>
          <button className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-black shadow-lg shadow-primary/20">1</button>
          <button className="w-8 h-8 rounded-lg border border-border-main flex items-center justify-center text-text-secondary text-xs font-black transition-all hover:bg-gray-100 italic">{'>'}</button>
        </div>
      </div>
    </div>
  )
}

// Memoized Row to prevent unnecessary re-renders when parent state changes
function TableRow<T extends { id: string | number }>({
  item,
  columns,
  onClick
}: {
  item: T,
  columns: Column<T>[],
  onClick?: (item: T) => void
}) {
  return (
    <tr
      onClick={() => onClick?.(item)}
      className={cn(
        "group hover:bg-gray-50/50 transition-all cursor-pointer",
        onClick && "active:bg-gray-100"
      )}
    >
      {columns.map((col, i) => (
        <td
          key={i}
          className={cn(
            "px-6 py-4 first:px-10 last:px-10",
            col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
            col.className
          )}
        >
          {col.cell ? col.cell(item) : (col.accessorKey ? String(item[col.accessorKey]) : null)}
        </td>
      ))}
    </tr>
  )
}

// Wrap with memo but keep types intact
const MemoizedRow = React.memo(TableRow) as typeof TableRow

export { DataTable }

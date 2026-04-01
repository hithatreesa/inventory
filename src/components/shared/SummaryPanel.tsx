"use client"

import React from 'react'
import { Info, CreditCard, ChevronRight, Paperclip, Printer, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface SummaryRowProps {
  label: string
  value: string | number
  isWarning?: boolean
  className?: string
}

export function SummaryRow({ label, value, isWarning, className }: SummaryRowProps) {
  return (
    <div className={cn("flex justify-between items-center group cursor-pointer", className)}>
      <span className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em] group-hover:text-text-main transition-colors">
        {label}
      </span>
      <span className={cn(
        "text-base font-black italic tracking-tighter",
        isWarning ? 'text-warning' : 'text-text-main'
      )}>
        {typeof value === 'number' ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : value}
      </span>
    </div>
  )
}

interface SummaryPanelProps {
  title?: string
  subtotal: number
  taxTotal?: number
  taxRate?: number
  logistics?: string | number
  grandTotal: number
  currency?: string
  footerNote?: string
  className?: string
  children?: React.ReactNode
}

export function SummaryPanel({
  title = "Summary",
  subtotal,
  taxTotal,
  taxRate,
  logistics,
  grandTotal,
  currency = "USD",
  footerNote,
  className,
  children
}: SummaryPanelProps) {
  return (
    <div className={cn(
      "bg-white p-10 rounded-[40px] border border-border-main shadow-xl relative overflow-hidden animate-in fade-in slide-up duration-700",
      className
    )}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
      
      <h3 className="text-2xl font-black text-text-main mb-8 uppercase tracking-tight italic">
        {title}
      </h3>
      
      <div className="space-y-6 pb-8 border-b border-gray-100">
        <SummaryRow label="Gross Subtotal" value={subtotal} />
        {taxTotal !== undefined && (
          <SummaryRow 
            label={`Total Tax ${taxRate ? `(${taxRate}%)` : ''}`} 
            value={taxTotal} 
          />
        )}
        {logistics !== undefined && <SummaryRow label="Logistics" value={logistics} />}
      </div>
      
      <div className="pt-8">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em]">
            PAYABLE AMOUNT
          </span>
          <span className="text-[10px] font-black text-primary">
            {currency}
          </span>
        </div>
        <h2 className="text-5xl font-black text-text-main tracking-tighter text-right italic">
          ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </h2>
      </div>
      
      {footerNote && (
        <div className="mt-10 bg-primary/5 border border-primary/10 p-6 rounded-3xl flex gap-4">
          <Info className="w-6 h-6 text-primary shrink-0" />
          <p className="text-[11px] font-bold text-text-main leading-relaxed italic opacity-80">
            {footerNote}
          </p>
        </div>
      )}

      {children}
    </div>
  )
}

interface SummaryActionCardProps {
  icon: React.ElementType
  title: string
  subtitle?: string
  onClick?: () => void
  variant?: 'default' | 'dashed'
  className?: string
}

export function SummaryActionCard({ icon: Icon, title, subtitle, onClick, variant = 'default', className }: SummaryActionCardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white p-8 rounded-[32px] border border-border-main shadow-sm flex items-center justify-between group cursor-pointer hover:bg-gray-50 transition-all animate-in fade-in slide-up duration-500 card-hover",
        variant === 'dashed' && "border-2 border-dashed border-gray-200 h-[220px] flex-col justify-center gap-6 hover:border-primary/40 hover:bg-primary/[0.02]",
        className
      )}
    >
      <div className={cn("flex items-center gap-4", variant === 'dashed' && "flex-col")}>
        <div className={cn(
          "bg-primary/10 p-3 rounded-2xl text-primary transition-all shadow-sm",
          variant === 'dashed' ? "w-16 h-16 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white" : "group-hover:scale-110 group-hover:bg-primary group-hover:text-white"
        )}>
          <Icon className={variant === 'dashed' ? "w-8 h-8" : "w-6 h-6"} />
        </div>
        <div className={variant === 'dashed' ? "text-center" : ""}>
          <p className="text-sm font-black text-text-main italic">{title}</p>
          {subtitle && (
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1 opacity-60">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {variant !== 'dashed' && <ChevronRight className="w-5 h-5 text-text-secondary group-hover:text-primary transition-all" />}
    </div>
  )
}

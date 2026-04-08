"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface HistoryItemProps {
  active?: boolean
  title: string
  sub: string
  icon?: React.ReactNode
}

export function HistoryItem({ active, title, sub, icon }: HistoryItemProps) {
  return (
    <div className={cn(
      "flex gap-6 relative z-10 transition-all hover:translate-x-2 cursor-pointer group animate-in fade-in slide-up duration-500 card-hover",
      active ? "" : "opacity-80 hover:opacity-100"
    )}>
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center shadow-xl border-4 border-white shrink-0",
        active ? "bg-primary text-white shadow-primary/30" : "bg-gray-100 text-gray-400"
      )}>
        {icon ? icon : <div className={cn("w-2 h-2 rounded-full", active ? "bg-white animate-pulse" : "bg-gray-300")} />}
      </div>
      <div>
        <p className={cn(
          "text-base font-black italic leading-none transition-colors",
          active ? "text-text-main" : "text-text-secondary opacity-60 group-hover:opacity-100"
        )}>
          {title}
        </p>
        <p className="text-sm font-black text-primary uppercase tracking-[0.1em] mt-2 opacity-60">
          {sub}
        </p>
      </div>
    </div>
  )
}

interface ActivityStreamProps {
  children: React.ReactNode
  className?: string
}

export function ActivityStream({ children, className }: ActivityStreamProps) {
  return (
    <div className={cn("space-y-10 relative overflow-hidden animate-in fade-in duration-700", className)}>
      <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-gray-50 animate-in fade-in duration-1000" />
      {children}
    </div>
  )
}

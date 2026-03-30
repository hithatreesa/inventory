"use client"

import React from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  trend?: string | number
  icon: React.ReactNode
  period?: string
  isNegative?: boolean
  isCritical?: boolean
  className?: string
  variant?: 'default' | 'primary' | 'success' | 'warning'
  href?: string
}

export function MetricCard({
  title,
  value,
  trend,
  icon,
  period,
  isNegative,
  isCritical,
  className,
  variant = 'default',
  href
}: MetricCardProps) {
  const isWarning = isCritical || isNegative

  const content = (
    <div className={cn(
      "bg-white p-6 rounded-[24px] border border-border-main shadow-sm h-full flex flex-col justify-between relative overflow-hidden",
      "animate-in fade-in slide-up duration-500 transition-all duration-300",
      href ? "cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-primary/20 group" : "",
      isCritical && "border-b-4 border-b-warning",
      !isCritical && variant === 'primary' && "border-b-4 border-b-primary",
      !isCritical && variant === 'success' && "border-b-4 border-b-success",
      className
    )}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/10 transition-all duration-700" />
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.25em] mb-1 opacity-60 group-hover:text-primary transition-colors">
            {title}
          </p>
          <h3 className="text-3xl font-black text-text-main tracking-tighter italic group-hover:translate-x-1 transition-transform">
            {value}
          </h3>
        </div>
        <div className={cn(
          "p-4 rounded-[28px] transition-all duration-500 shadow-sm",
          variant === 'primary' ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white" :
          variant === 'success' ? "bg-success/10 text-success group-hover:bg-success group-hover:text-white" :
          variant === 'warning' || isWarning ? "bg-warning/10 text-warning group-hover:bg-warning group-hover:text-white" :
          "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
        )}>
          {icon}
        </div>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        {trend && (
          <Badge variant={isWarning ? "warning" : "success"} className="italic font-black border-none px-3 h-6 rounded-lg shadow-sm">
            {isNegative ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
            {trend}
          </Badge>
        )}
        {period && (
          <span className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em] opacity-60">
            {period}
          </span>
        )}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>
  }

  return content
}

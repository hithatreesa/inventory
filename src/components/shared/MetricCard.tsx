"use client"

import React, { Suspense } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
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

const Sparkline = ({ color }: { color: string }) => (
  <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-40">
    <path
      d="M2 18C2 18 6 4 10 8C14 12 18 20 22 16C26 12 30 2 34 6C38 10 42 18 46 14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

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

  const colors = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', stroke: '#3b82f6' },
    success: { bg: 'bg-green-50', text: 'text-green-500', stroke: '#22c55e' },
    warning: { bg: 'bg-orange-50', text: 'text-orange-500', stroke: '#f97316' },
    default: { bg: 'bg-blue-50/50', text: 'text-[#003366]', stroke: '#003366' }
  }

  const currentColors = colors[variant] || colors.default

  const content = (
    <div className={cn(
      "bg-white p-3 sm:p-6 rounded-[24px] border border-border-main shadow-sm h-full flex flex-col justify-between relative overflow-hidden transition-all duration-300 group",
      href ? "cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-primary/20" : "",
      className
    )}>
      {/* Top Section: Icon & Trend */}
      <div className="flex justify-between items-start w-full mb-6">
        <div className={cn(
          "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm shrink-0",
          currentColors.bg,
          currentColors.text
        )}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5 sm:w-6 sm:h-6' }) : icon}
        </div>

        {trend && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 p-1 px-1.5 sm:px-2 rounded-lg bg-transparent text-[9px] sm:text-[10px] font-black italic whitespace-nowrap">
              <Sparkline color={currentColors.stroke} />
              <span className={cn(
                "ml-1 flex items-center gap-0.5 transition-colors",
                isWarning ? "text-orange-500" : "text-green-500"
              )}>
                {!isNegative && <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                {isNegative && <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                {trend}
              </span>
            </div>
          </div>
        )}

        {!trend && (
          <div className="opacity-20 translate-y-2">
            <Activity className={cn("w-8 h-8 sm:w-12 sm:h-12", currentColors.text)} />
          </div>
        )}
      </div>

      {/* Bottom Section: Title & Value */}
      <div className="space-y-1 relative z-10">
        <p className="text-[8px] sm:text-[10px] font-black text-[#003366]/60 uppercase tracking-[0.15em] sm:tracking-[0.25em] leading-tight transition-colors group-hover:text-primary">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl sm:text-3xl font-black text-text-main tracking-tighter italic tabular-nums leading-none">
            {value}
          </h3>
        </div>
        {period && (
          <p className="text-[7px] sm:text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1 opacity-60">
            {period}
          </p>
        )}
      </div>

      {/* Decorative Gradient Overlay */}
      <div className="absolute -bottom-8 -right-8 w-16 h-16 sm:w-24 sm:h-24 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </div>
  )

  if (href) {
    return <Link href={href} className="block h-full no-underline">{content}</Link>
  }

  return content
}

"use client"

import React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Breadcrumb {
  label: string
  href?: string
}

interface SectionHeaderProps {
  title: string
  subtitle?: React.ReactNode
  breadcrumbs?: Breadcrumb[]
  actions?: React.ReactNode
  className?: string
  prefix?: React.ReactNode
}

export function SectionHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
  prefix
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 animate-in fade-in slide-up duration-700", className)}>
      <div className="space-y-1">
        {prefix && (
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 leading-none animate-in fade-in duration-1000">
            {prefix}
          </p>
        )}
        {breadcrumbs && (
          <nav className="flex items-center gap-2 text-[10px] font-extrabold text-text-secondary uppercase tracking-widest mb-2 animate-in fade-in duration-700">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                <span className={idx === breadcrumbs.length - 1 ? "text-primary" : ""}>
                  {crumb.label}
                </span>
                {idx < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3" />}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-4xl font-black text-text-main tracking-tight italic uppercase italic-shadow animate-in fade-in slide-up duration-500">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-text-secondary font-medium mt-2 animate-in fade-in duration-1000">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-up duration-1000 delay-200 w-full md:w-auto justify-start md:justify-end">
          {actions}
        </div>
      )}
    </div>
  )
}

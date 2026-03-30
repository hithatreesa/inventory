"use client"

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn("flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest", className)}>
      <Link 
        href="/dashboard" 
        className="flex items-center gap-1.5 hover:text-primary transition-colors hover:scale-105 transform duration-200"
      >
        <Home className="w-3 h-3" />
        ERP HUB
      </Link>
      
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3 h-3 text-gray-200" />
          {item.href ? (
            <Link 
              href={item.href} 
              className="hover:text-primary transition-colors hover:translate-x-0.5 transform duration-200"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-primary italic tracking-tight underline decoration-primary/20 decoration-2">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

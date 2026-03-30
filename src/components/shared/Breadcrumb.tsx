"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  reports: "Reports",
  sales: "Sales",
  inventory: "Inventory",
  purchase: "Purchase",
  pos: "POS Billing",
  settings: "Settings",
  registry: "Asset Registry",
  stock: "Stock Reports",
  transfer: "Stock Transfer"
}

const formatText = (text: string | null) => {
  if (!text) return ""
  return text
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function Breadcrumb() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const pathSegments = pathname.split("/").filter(Boolean)
  const type = searchParams.get("type")

  return (
    <nav className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-500">
      <Link 
        href="/dashboard" 
        className="text-[10px] font-black tracking-[0.2em] opacity-40 uppercase italic hover:opacity-100 hover:text-primary transition-all underline decoration-transparent hover:decoration-primary/30"
      >
        Portal
      </Link>
      
      {pathSegments.map((seg, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join('/')}`
        const isLast = index === pathSegments.length - 1 && !type
        const label = labelMap[seg] || formatText(seg)

        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 opacity-20 shrink-0" />
            <Link 
              href={href}
              className={`text-[10px] font-black tracking-[0.2em] uppercase italic transition-all underline decoration-transparent hover:decoration-primary/30 ${
                isLast ? 'text-primary' : 'opacity-40 hover:opacity-100 hover:text-primary'
              }`}
            >
              {label}
            </Link>
          </React.Fragment>
        )
      })}

      {type && (
        <>
          <ChevronRight className="w-3 h-3 opacity-20 shrink-0" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase italic text-primary underline decoration-primary/10">
            {formatText(type)}
          </span>
        </>
      )}
    </nav>
  )
}

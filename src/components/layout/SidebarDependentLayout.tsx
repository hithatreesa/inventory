"use client"

import React from 'react'
import { useLayout } from '@/lib/context/LayoutContext'
import { cn } from '@/lib/utils'

export function SidebarDependentLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useLayout()
  
  return (
    <main className={cn(
      "min-h-screen pt-16 transition-all duration-300 ease-in-out",
      isCollapsed ? "lg:pl-20" : "lg:pl-72",
      "pl-0" // default for mobile
    )}>
      <div className="p-8 h-full">
        {children}
      </div>
    </main>
  )
}

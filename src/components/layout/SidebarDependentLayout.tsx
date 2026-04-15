"use client"

import React from 'react'
import { useLayout } from '@/lib/context/LayoutContext'
import { cn } from '@/lib/utils'

export function SidebarDependentLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useLayout()

  return (
    <main className={cn(
      "flex-1 overflow-y-auto overflow-x-hidden pt-20 scroll-smooth",
      "transition-[padding] duration-300 ease-in-out",
      isCollapsed ? "lg:pl-20" : "lg:pl-72",
      "pl-0" // default for mobile
    )}>
      <div className="p-4 sm:p-8 min-h-full">
        {children}
      </div>
    </main>
  )
}

"use client"
import React, { useState, useEffect, Suspense } from 'react'
import {
  Search,
  Bell,
  Menu,
  ChevronRight,
  Zap,
  ShoppingCart,
  Boxes,
  Plus,
  FileText,
  Activity,
  BarChart3,
  CheckCircle2,
  Package
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

import { useLayout } from '@/lib/context/LayoutContext'
import { toast } from 'sonner'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

export function Navbar() {
  const router = useRouter()
  const { toggleSidebar, isCollapsed } = useLayout()
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    const updateTime = () => setTime(new Date())
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      toast.info('Searching...', {
        description: `Results for "${(e.target as HTMLInputElement).value}" would appear here.`
      })
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).toUpperCase()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: '2-digit'
    }).toUpperCase()
  }

  return (
    <header className={cn(
      "h-20 bg-white/80 backdrop-blur-xl border-b border-border-main flex items-center justify-between px-4 sm:px-10 fixed top-0 right-0 z-40 transition-all duration-300 ease-in-out shadow-sm",
      isCollapsed ? "lg:left-20" : "lg:left-72",
      "left-0" // default for mobile
    )}>
      {/* Left: Menu & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-6 text-text-main">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl border-gray-100 flex items-center justify-center shrink-0"
          onClick={toggleSidebar}
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-text-main" />
        </Button>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <Suspense fallback={<div className="h-4 w-20 bg-gray-50 animate-pulse rounded" />}>
            <Breadcrumb />
          </Suspense>

          <div className="hidden xs:block h-4 w-[1px] bg-gray-100 mx-0.5 sm:mx-1" />

          <div className="hidden xs:flex items-center gap-1.5 sm:gap-2 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-100 shadow-sm cursor-default group">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
            <span className="text-sm font-black text-text-secondary uppercase tracking-widest leading-none">FY 24-25</span>
          </div>
        </div>
      </div>


      {/* Center: Search (Hidden on Mobile) */}
      <div className="hidden md:flex flex-1 max-w-xl px-12">
        <div className="relative group w-full">
          <Input
            type="text"
            icon={<Search className="w-4 h-4" />}
            placeholder="Search..."
            className="rounded-2xl bg-gray-50/50 border-gray-100 h-11 placeholder:italic placeholder:font-bold placeholder:text-sm placeholder:uppercase placeholder:tracking-widest"
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      {/* Right: Clock & Notification (Clock Hidden on Mobile) */}
      <div className="flex items-center gap-3 sm:gap-8">
        <div className="hidden md:flex text-right flex-col items-end whitespace-nowrap">
          <p className="text-sm font-black text-primary italic tracking-tight leading-none mb-1.5 min-h-[1.25rem]">
            {time ? formatTime(time) : '--:--:-- --'}
          </p>
          <p className="text-sm font-black text-text-secondary uppercase tracking-[0.2em] opacity-40 leading-none min-h-[0.75rem]">
            {time ? formatDate(time) : '---, --- --'}
          </p>
        </div>

        <div className="hidden md:block h-8 w-[1px] bg-gray-100" />

        {/* Floating Quick Action Panel */}
        <div className="relative group">
          <Button
            className="h-11 w-11 sm:w-auto sm:px-6 rounded-2xl bg-primary text-white font-black text-[10px] tracking-[0.2em] uppercase italic shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-2"
          >
            <Zap className="w-4 h-4 fill-white" /> 
            <span className="hidden sm:inline">Control Panel</span>
          </Button>

          {/* High-Density Dropdown */}
          <div className="absolute right-0 top-full pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
            <div className="w-[320px] bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden p-6">
              <div className="flex items-center gap-2 mb-6 px-2">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Rapid Execution Panel</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'New Sale', icon: ShoppingCart, href: '/pos', color: 'bg-green-500' },
                  { label: 'New Purchase', icon: Boxes, href: '/purchase/entry', color: 'bg-blue-500' },
                  { label: 'Add Item', icon: Plus, href: '/master?v=items&action=new', color: 'bg-orange-500' },
                  { label: 'Create PO', icon: FileText, href: '/purchase/entry', color: 'bg-purple-500' },
                  { label: 'Adjustment', icon: Activity, href: '/inventory?action=adjust', color: 'bg-yellow-500' },
                  { label: 'Reports', icon: BarChart3, href: '/reports', color: 'bg-red-500' },
                  { label: 'Approvals', icon: CheckCircle2, href: '/purchase?filter=pending', color: 'bg-cyan-500' },
                  { label: 'Inventory', icon: Package, href: '/inventory', color: 'bg-indigo-500' },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => router.push(action.href)}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-lg transition-all group active:scale-95"
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2 text-white shadow-sm transition-transform group-hover:scale-110", action.color)}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary italic leading-none">{action.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-50 text-center">
                <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.3em] italic">Cobalt Slate ERP Intelligence</p>
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl border-gray-100 relative group"
          onClick={() => toast.info('No new notifications', {
            description: 'Your inbox is clear for today.'
          })}
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-text-secondary group-hover:text-primary transition-colors" />
          <span className="absolute top-2.5 sm:top-3.5 right-2.5 sm:right-3.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse" />
        </Button>
      </div>
    </header>
  )
}

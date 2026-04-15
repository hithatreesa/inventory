"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  FileText,
  LogOut,
  Zap,
  User
} from 'lucide-react'
import { useLayout } from '@/lib/context/LayoutContext'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const navItems = [
  { name: 'DASHBOARD', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'ENGINEERS', icon: User, href: '/engineers' },
  { name: 'INVENTORY', icon: Package, href: '/inventory' },
  { name: 'POS', icon: Zap, href: '/pos' },
  { name: 'PURCHASES', icon: ShoppingCart, href: '/purchase' },
  { name: 'SALES', icon: TrendingUp, href: '/sales' },
  { name: 'REPORTS', icon: FileText, href: '/reports' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, isMobileOpen, closeMobileSidebar } = useLayout()

  const handleLogout = () => {
    toast.info('Logging out...', {
      description: 'You will be redirected momentarily.',
      duration: 2000,
    })

    // Simulate short delay for "logout process"
    setTimeout(() => {
      toast.success('Successfully logged out')
    }, 2000)
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar-bg border-r border-border-main shadow-2xl overflow-hidden",
          isCollapsed ? "w-20" : "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ transition: "width 300ms ease-in-out, transform 300ms ease-in-out" }}
      >
        <div className={cn("p-10 transition-all duration-300", isCollapsed && "p-4")}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 overflow-hidden p-1.5 border border-gray-100 shrink-0">
              <img src="/logo.png" alt="Terait Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in duration-500">
                <h1 className="text-2xl font-black text-primary tracking-tighter italic leading-none uppercase">
                  TERAIT
                </h1>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                  isActive
                    ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]"
                    : "text-text-secondary hover:bg-white hover:text-primary hover:shadow-lg hover:shadow-black/5",
                  isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? item.name : ""}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-transform group-hover:scale-110 shrink-0",
                  isActive ? "text-white" : "text-text-secondary group-hover:text-primary"
                )} />
                {!isCollapsed && (
                  <span className="text-sm font-black tracking-[0.2em] whitespace-nowrap animate-in fade-in duration-300">{item.name}</span>
                )}
                {isActive && !isCollapsed && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className={cn("p-6 border-t border-border-main space-y-6 transition-all duration-300", isCollapsed && "p-4")}>
          {/* User Profile Card */}
          <div className={cn(
            "flex items-center gap-3 p-4 bg-white rounded-[20px] border border-gray-100 shadow-sm cursor-pointer hover:bg-white/80 transition-all overflow-hidden",
            isCollapsed && "p-2 justify-center"
          )}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm shadow-lg shadow-primary/20 shrink-0">
              AT
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0 animate-in fade-in duration-500">
                  <p className="text-sm font-black text-text-main truncate italic">Alexander Terait</p>
                  <p className="text-sm font-bold text-text-secondary uppercase tracking-tighter opacity-60">System Admin</p>
                </div>
              </>
            )}
          </div>

          <div className="space-y-1">
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-4 px-4 py-2.5 text-warning hover:text-warning/80 transition-all group w-full text-left",
                isCollapsed && "justify-center px-0"
              )}
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-black uppercase tracking-[0.2em] animate-in fade-in duration-300">LOGOUT</span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}


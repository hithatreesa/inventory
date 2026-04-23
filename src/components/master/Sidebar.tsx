"use client"

import React from 'react'
import { Package, Users, Percent, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MasterModule = 'items' | 'vendors' | 'gst'

interface SidebarProps {
  activeModule: MasterModule
  onModuleChange: (module: MasterModule) => void
}

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  const modules = [
    { id: 'items', label: 'Item Master', icon: Package, desc: 'Products & Inventory Config' },
    { id: 'vendors', label: 'Vendor Master', icon: Users, desc: 'Suppliers & Contact Database' },
    { id: 'gst', label: 'GST Master', icon: Percent, desc: 'Taxation & HSN Registry' },
  ] as const

  return (
    <div className="w-full lg:w-80 flex flex-col gap-6">
      <div className="bg-white rounded-[32px] border border-border-main p-6 shadow-sm">
        <div className="mb-6 px-2">
          <h2 className="text-xl font-black text-[#003366] italic uppercase tracking-tight">Master Modules</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Single Source of Truth</p>
        </div>

        <div className="space-y-2">
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => onModuleChange(m.id)}
              className={cn(
                "w-full p-4 rounded-2xl flex items-center gap-4 transition-all group relative overflow-hidden",
                activeModule === m.id
                  ? "bg-[#003366] text-white shadow-xl shadow-blue-900/20"
                  : "bg-gray-50/50 text-text-main border border-transparent hover:border-gray-200 hover:bg-gray-50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                activeModule === m.id ? "bg-white/10" : "bg-white border border-gray-100 text-primary shadow-sm"
              )}>
                <m.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black italic uppercase leading-none">{m.label}</p>
                <p className={cn(
                  "text-[9px] font-bold mt-1.5 uppercase tracking-widest leading-none",
                  activeModule === m.id ? "text-white/50" : "text-gray-400"
                )}>{m.desc}</p>
              </div>
              <ChevronRight className={cn(
                "w-4 h-4 transition-transform",
                activeModule === m.id ? "text-white translate-x-0" : "text-gray-300 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
              )} />
            </button>
          ))}
        </div>
      </div>

      <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 italic">System Integrity</h4>
        <p className="text-xs font-bold text-slate-600 leading-relaxed">
          Modifying master data affects all modules globally. Ensure accuracy before commitment.
        </p>
      </div>
    </div>
  )
}

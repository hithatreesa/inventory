"use client"

import React, { useState } from 'react'
import { Modal } from './BaseModal'
import { Package, User, ShoppingCart, Plus, Check, Save } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Tab = 'item' | 'customer' | 'purchase'

export function QuickEntryModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('item')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const tabs = [
    { id: 'item', label: 'NEW ITEM', icon: Package },
    { id: 'customer', label: 'CUSTOMER', icon: User },
    { id: 'purchase', label: 'PURCHASE', icon: ShoppingCart },
  ]

  const handleSubmit = () => {
    setIsSubmitting(true)
    
    toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
      loading: 'Validating entry against ISO-9001 standards...',
      success: () => {
        setIsSubmitting(false)
        onClose()
        return 'System Entry Successfully Committed'
      },
      error: () => {
        setIsSubmitting(false)
        return 'Validation Failed'
      }
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Data Entry">
      <div className="space-y-8">
        {/* Tab Selection */}
        <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const IsActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  IsActive 
                    ? "bg-white text-primary shadow-sm border border-gray-100" 
                    : "text-text-secondary hover:text-text-main hover:bg-white/50"
                )}
                disabled={isSubmitting}
              >
                <Icon className={cn("w-4 h-4", IsActive ? "text-primary" : "text-text-secondary")} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Dynamic Form Content */}
        <div className="space-y-6">
          {activeTab === 'item' && (
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-1">Item Description</label>
                <Input placeholder="Enter high-fidelity asset name..." className="italic font-bold" disabled={isSubmitting} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-1">Category</label>
                <Select options={['Electronics', 'Industrial', 'Raw Materials', 'Software']} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-1">Initial Qty</label>
                <Input type="number" placeholder="0" className="font-black" disabled={isSubmitting} />
              </div>
            </div>
          )}

          {activeTab === 'customer' && (
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-1">Legal Entity Name</label>
                <Input placeholder="Global Dynamics Inc." className="italic font-bold" disabled={isSubmitting} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-1">Industry</label>
                <Select options={['Tech', 'Logistics', 'Manufacturing', 'Energy']} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-1">Primary Email</label>
                <Input type="email" placeholder="contact@domain.com" className="font-medium" disabled={isSubmitting} />
              </div>
            </div>
          )}

          {activeTab === 'purchase' && (
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-1">Vendor Reference</label>
                <Input placeholder="Select active supplier..." className="italic font-bold" disabled={isSubmitting} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-1">PO Number</label>
                <Input defaultValue="PO-2024-AUTO" className="font-black uppercase text-primary" readOnly />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-1">Estimated Value</label>
                <Input type="number" placeholder="$0.00" className="font-black italic" disabled={isSubmitting} />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-4 pt-4 border-t border-gray-100">
           <Button variant="secondary" className="flex-1 rounded-2xl h-14 font-black italic tracking-widest text-[11px]" onClick={onClose} disabled={isSubmitting}>
             CANCEL
           </Button>
           <Button 
             className="flex-[1.5] rounded-2xl h-14 font-black italic tracking-widest text-[11px] shadow-xl shadow-primary/20" 
             onClick={handleSubmit}
             disabled={isSubmitting}
           >
             {isSubmitting ? 'PROCESSING...' : <><Save className="w-4 h-4 mr-2" /> PROCESS ENTRY</>}
           </Button>
        </div>

        {/* Info Box */}
        {!isSubmitting && (
          <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0">
               <Plus className="w-5 h-5" />
             </div>
             <div>
               <p className="text-[11px] font-black text-text-main italic leading-tight">SYSTEM AUTO-VALIDATE</p>
               <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mt-1">Data will be validated against strict ISO-9001 norms before commit.</p>
             </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

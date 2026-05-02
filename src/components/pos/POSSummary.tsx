"use client"

import React from 'react'
import { CheckCircle2, Banknote, QrCode, CreditCard, User } from 'lucide-react'
import { EntityLookup } from '@/components/shared/EntityLookup'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
interface POSSummaryProps {
  customer: string
  setCustomer: (val: string) => void
  phone: string
  setPhone: (val: string) => void
  priceLevel: string
  setPriceLevel: (val: 'Retail' | 'Wholesale' | 'Dealer') => void
  subtotal: number
  cgst: number
  sgst: number
  discount: number
  setDiscount: (val: number) => void
  total: number
  paymentMode: 'Cash' | 'UPI' | 'Card'
  setPaymentMode: (val: 'Cash' | 'UPI' | 'Card') => void
  received: string
  setReceived: (val: string) => void
  balance: number
  isPaymentMode: boolean
  paymentRef: React.RefObject<HTMLInputElement | null>
  onComplete: () => void
  onCancel: () => void
}

export const POSSummary = ({
  customer,
  setCustomer,
  phone,
  setPhone,
  priceLevel,
  setPriceLevel,
  subtotal,
  cgst,
  sgst,
  discount,
  setDiscount,
  total,
  paymentMode,
  setPaymentMode,
  received,
  setReceived,
  balance,
  isPaymentMode,
  paymentRef,
  onComplete,
  onCancel
}: POSSummaryProps) => {
  return (
    <div className="w-full lg:flex-[0.3] flex flex-col h-full lg:overflow-hidden">
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl flex flex-col h-full overflow-hidden">
        
        {/* COMPACT CUSTOMER HEADER */}
        <div className="p-5 border-b border-gray-50 space-y-3 bg-gray-50/30">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-gray-400 italic uppercase tracking-[0.2em]">Customer Intelligence</h3>
            <div className="w-6 h-6 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
              <User className="w-3 h-3" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
               <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic ml-1">Name</label>
               <EntityLookup
                 type="contact"
                 value={customer}
                 onChange={setCustomer}
                 onSelect={(contact) => {
                   setCustomer(contact.name);
                   if (contact.phone) setPhone(contact.phone);
                 }}
                 contactFilter="CLIENT"
                 placeholder="WALK-IN"
                 className="h-9 bg-white border border-gray-100 rounded-xl px-3 font-bold text-xs outline-none focus:ring-4 focus:ring-primary/5 transition-all w-full"
               />
             </div>
             <div className="space-y-1">
               <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic ml-1">Phone</label>
               <input
                 value={phone}
                 onChange={e => setPhone(e.target.value)}
                 placeholder="NO CONTACT"
                 className="w-full h-9 bg-white border border-gray-100 rounded-xl px-3 font-bold text-xs outline-none focus:ring-4 focus:ring-primary/5 transition-all tabular-nums"
               />
             </div>
          </div>
        </div>

        {/* DYNAMIC BILLING HIGHLIGHT (SLATE) */}
        <div className="mx-4 mt-4 bg-[#003366] rounded-2xl p-5 border border-white/10 shadow-lg text-white flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8" />
          
          <div className="space-y-2 relative z-10 border-b border-white/5 pb-3">
            <div className="flex justify-between items-center opacity-60 text-[10px] font-black uppercase tracking-widest">
              <span>Gross Amt</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="opacity-40 text-[9px] font-black uppercase tracking-widest italic">CGST</span>
              <span className="font-mono text-[11px] font-black text-blue-200">+ ₹{cgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="opacity-40 text-[9px] font-black uppercase tracking-widest italic">SGST</span>
              <span className="font-mono text-[11px] font-black text-blue-200">+ ₹{sgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center opacity-40 text-[9px] font-black uppercase tracking-widest px-1">
              <span>Discount</span>
              <span>- ₹{(discount || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="relative z-10 flex justify-between items-end">
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.1em] italic mb-1 opacity-60">Net Payable</p>
              <p className="text-4xl font-black tracking-tighter italic leading-none">
                <span className="text-sm mr-1 opacity-30">₹</span>
                {total.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center opacity-20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* PAYMENT ORCHESTRATION SECTION */}
        <div className={cn(
          "flex-1 p-5 flex flex-col gap-4 transition-all duration-500",
          !isPaymentMode && "opacity-40 grayscale pointer-events-none scale-95"
        )}>
          <div className="flex items-center gap-2">
             <div className="h-[1px] flex-1 bg-gray-100" />
             <h4 className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] italic">Payment Mode</h4>
             <div className="h-[1px] flex-1 bg-gray-100" />
          </div>

          <div className="flex gap-2">
            {[
              { id: 'Cash', icon: Banknote },
              { id: 'UPI', icon: QrCode },
              { id: 'Card', icon: CreditCard }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setPaymentMode(m.id as 'Cash' | 'UPI' | 'Card')}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                  paymentMode === m.id
                    ? "bg-primary border-primary text-white shadow-md shadow-primary/20 scale-105"
                    : "bg-gray-50/50 border-gray-100 text-gray-400 hover:bg-gray-100"
                )}
              >
                <m.icon className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wider">{m.id}</span>
              </button>
            ))}
          </div>

          {paymentMode === 'Cash' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic ml-1">Cash Tendered</label>
                <input
                  ref={paymentRef}
                  type="number"
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onComplete()
                    if (e.key === 'Escape') onCancel()
                  }}
                  placeholder="0.00"
                  className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 font-black text-xl italic text-primary outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                />
              </div>
              
              {balance > 0 && (
                <div className="bg-green-50/50 px-4 py-3 rounded-xl border border-green-100/50 flex justify-between items-center">
                  <span className="text-[10px] font-black text-green-600 uppercase tracking-widest opacity-60">Balance Due</span>
                  <span className="text-base font-black text-green-700 italic">₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          )}

          <Button
            size="xl"
            onClick={onComplete}
            className="h-16 mt-auto rounded-2xl shadow-xl shadow-primary/20 italic font-black text-sm tracking-widest relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <CheckCircle2 className="w-5 h-5 mr-3 relative z-10" />
            <span className="relative z-10 uppercase">Complete Sale</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

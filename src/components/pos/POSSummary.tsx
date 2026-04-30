"use client"

import React from 'react'
import { CheckCircle2, Banknote, QrCode, CreditCard, User } from 'lucide-react'
import { EntityLookup } from '@/components/shared/EntityLookup'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
interface POSSummaryProps {
  customer: string
  setCustomer: (val: string) => void
  priceLevel: string
  setPriceLevel: (val: 'Retail' | 'Wholesale' | 'Dealer') => void
  subtotal: number
  tax: number
  discount: number
  setDiscount: (val: number) => void
  total: number
  paymentMode: 'Cash' | 'UPI' | 'Card'
  setPaymentMode: (val: 'Cash' | 'UPI' | 'Card') => void
  received: string
  setReceived: (val: string) => void
  balance: number
  onComplete: () => void
}

export const POSSummary = ({
  customer,
  setCustomer,
  priceLevel,
  setPriceLevel,
  subtotal,
  tax,
  discount,
  setDiscount,
  total,
  paymentMode,
  setPaymentMode,
  received,
  setReceived,
  balance,
  onComplete
}: POSSummaryProps) => {
  return (
    <div className="w-full lg:flex-[0.3] flex flex-col gap-6 lg:overflow-y-auto custom-scrollbar lg:pr-2">
      {/* CUSTOMER SECTION */}
      <div className="bg-white rounded-3xl p-6 border border-border-main shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <User className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-black text-text-main italic uppercase tracking-tight">Customer Hub</h3>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Customer Name</label>
          <input
            value={customer}
            onChange={e => setCustomer(e.target.value)}
            placeholder="Customer name"
            className="w-full h-14 rounded-2xl bg-gray-50 border-gray-100 px-5 font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm uppercase"
          />
        </div>
      </div>

      {/* PRICE SUMMARY */}
      <div className="bg-[#003366] rounded-3xl p-8 border border-white/10 shadow-xl shadow-primary/20 text-white flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10" />

        <div className="space-y-4 relative z-10">
          <div className="flex justify-between items-center opacity-60 text-sm font-black uppercase tracking-widest">
            <span>Gross Amount</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center px-1 py-1">
            <span className="opacity-60 text-sm font-black uppercase tracking-widest italic">Inventory Tax (8.25%)</span>
            <span className="font-mono text-sm font-black">+ ₹{tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 relative group">
            <span className="text-sm font-black uppercase tracking-widest italic">Discounts Applied</span>
            <div className="flex items-center">
              <span className="font-black text-white/40 mr-1">-</span>
              <input
                type="number"
                value={Math.abs(discount) || ''}
                onChange={(e) => setDiscount(Math.abs(parseFloat(e.target.value)) || 0)}
                className="bg-transparent text-right font-black italic text-sm w-20 focus:outline-none placeholder:text-white/20"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 relative z-10">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <p className="text-sm font-black text-blue-200 uppercase tracking-[0.2em] italic mb-2">Net Payable Amount</p>
              <p className="text-5xl font-black tracking-tighter italic select-none leading-none">
                <span className="text-xl mr-1 opacity-40">₹</span>
                {total.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center opacity-40">
              <CheckCircle2 className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT CONTROLS */}
      <div className="bg-white rounded-3xl p-8 border border-border-main shadow-sm flex flex-col gap-6">
        <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] italic border-b border-gray-50 pb-4">Payment Orchestration</h4>

        <div className="flex gap-4">
          {[
            { id: 'Cash', icon: Banknote },
            { id: 'UPI', icon: QrCode },
            { id: 'Card', icon: CreditCard }
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setPaymentMode(m.id as 'Cash' | 'UPI' | 'Card')}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                paymentMode === m.id
                  ? "bg-primary/5 border-primary shadow-sm"
                  : "bg-white border-gray-100 hover:border-gray-200 text-gray-300"
              )}
            >
              <m.icon className={cn("w-6 h-6", paymentMode === m.id ? "text-primary" : "text-gray-300")} />
              <span className={cn("text-sm font-black uppercase leading-none", paymentMode === m.id ? "text-primary" : "text-gray-400")}>{m.id}</span>
            </button>
          ))}
        </div>

        {paymentMode === 'Cash' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="space-y-1">
              <label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1 italic">Cash Tendered</label>
              <input
                type="number"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                placeholder="Enter amount..."
                className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 font-black text-lg focus:ring-4 focus:ring-primary/5 italic transition-all"
              />
            </div>
            {balance > 0 && (
              <div className="bg-green-50 p-5 rounded-2xl border border-green-100 flex justify-between items-center group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-12 h-12 bg-green-500/5 rounded-full blur-xl -mr-6 -mt-6" />
                <div>
                  <p className="text-sm font-black text-green-600 uppercase tracking-widest opacity-60">Balance Change</p>
                  <p className="text-xl font-black text-green-700 italic tracking-tighter leading-none mt-1">₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="w-10 h-10 bg-green-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-green-700/20 group-hover:scale-110 transition-transform">
                  <Banknote className="w-5 h-5" />
                </div>
              </div>
            )}
          </div>
        )}

        <Button
          size="xl"
          onClick={onComplete}
          className="h-24 rounded-[24px] shadow-2xl shadow-primary/30 italic font-black text-lg tracking-[0.1em] mt-2 relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <CheckCircle2 className="w-7 h-7 mr-4 relative z-10" />
          <span className="relative z-10 uppercase">Complete Sale</span>
        </Button>
      </div>
    </div>
  )
}

"use client"

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { 
  Search, 
  Trash2, 
  CreditCard, 
  Banknote, 
  QrCode,
  CheckCircle2,
  Plus,
  Minus,
  User,
  Zap,
  ShoppingCart,
  Delete,
  X
} from 'lucide-react'
import { useData } from '@/lib/context/DataContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BillItem {
  id: string
  name: string
  sku: string
  price: number
  qty: number
  total: number
  isNew?: boolean
}

export default function POSPage() {
  const { items } = useData()
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [query, setQuery] = useState('')
  const [customer, setCustomer] = useState('Walk-in Customer')
  const [priceLevel, setPriceLevel] = useState<'Retail' | 'Wholesale' | 'Dealer'>('Retail')
  const [discount, setDiscount] = useState(0)
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('Cash')
  const [received, setReceived] = useState<string>('')
  
  const searchRef = useRef<HTMLInputElement>(null)

  // Auto-focus search on load
  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const handleCompleteSale = useCallback(() => {
    if (billItems.length === 0) {
      toast.error('Cannot complete empty sale')
      return
    }
    toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
      loading: 'Processing transaction...',
      success: () => {
        setBillItems([])
        setReceived('')
        return 'Sale completed successfully #POS-TRX-04B'
      },
      error: 'Transaction failed'
    })
  }, [billItems.length])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        handleCompleteSale()
      }
      if (e.key === 'Escape') {
        setQuery('')
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [billItems])

  const addItem = useCallback((itemId: string) => {
    const product = items.find(i => i.id === itemId || i.sku === itemId)
    if (!product) return

    setBillItems(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i => i.id === product.id 
          ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price, isNew: true } 
          : { ...i, isNew: false }
        )
      }
      return [
        { 
          id: product.id, 
          name: product.name, 
          sku: product.sku, 
          price: product.price, 
          qty: 1, 
          total: product.price,
          isNew: true 
        },
        ...prev.map(i => ({ ...i, isNew: false }))
      ]
    })
    setQuery('')
    toast.success(`Added ${product.name}`, { duration: 1000 })
  }, [items])

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query) return
    addItem(query)
  }

  const updateQty = (id: string, delta: number) => {
    setBillItems(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.qty + delta)
        return { ...i, qty: newQty, total: newQty * i.price, isNew: false }
      }
      return { ...i, isNew: false }
    }))
  }

  const removeItem = (id: string) => {
    setBillItems(prev => prev.filter(i => i.id !== id))
    toast.error('Item removed from bill')
  }

  const clearBill = () => {
    if (billItems.length === 0) return
    setBillItems([])
    toast.info('Bill cleared')
  }

  // Calculations
  const subtotal = useMemo(() => billItems.reduce((acc, i) => acc + i.total, 0), [billItems])
  const tax = subtotal * 0.0825 // 8.25% fixed tax
  const total = subtotal + tax - discount
  const balance = received ? Math.max(0, parseFloat(received) - total) : 0



  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-130px)] gap-6 lg:gap-8 font-sans pb-20 lg:pb-0">
      {/* LEFT: BILLING ENGINE (70%) */}
      <div className="w-full lg:flex-[0.7] flex flex-col gap-4 lg:gap-6 lg:h-full lg:overflow-hidden">
        {/* TOP BAR: SEARCH/SCAN */}
        <form onSubmit={handleQuerySubmit} className="relative group shrink-0">
          <Input 
            ref={searchRef}
            icon={<Search className="w-6 h-6 text-gray-400" />}
            placeholder="Scan barcode or search product..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-16 rounded-2xl bg-white border-gray-100 shadow-sm text-lg font-bold placeholder:italic transition-all focus:ring-4 focus:ring-primary/5 focus:border-primary"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 uppercase tracking-widest italic">Fast Scan Mode</span>
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
          </div>
        </form>

        {/* BILL TABLE */}
        <div className="flex-1 min-h-[400px] lg:min-h-0 bg-white rounded-3xl border border-border-main flex flex-col overflow-hidden shadow-sm">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest italic">Product Identity</th>
                  <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest italic text-center">Quantity</th>
                  <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest italic text-right">Unit Price</th>
                  <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest italic text-right">Line Total</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {billItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center opacity-20">
                       <ShoppingCart className="w-20 h-20 mx-auto mb-4" />
                       <p className="text-sm font-black uppercase tracking-[0.4em] italic">Scan or search products to start billing</p>
                    </td>
                  </tr>
                ) : (
                  billItems.map((item) => (
                    <tr key={item.id} className={cn(
                      "group transition-all duration-500",
                      item.isNew && "bg-primary/5 animate-in fade-in slide-up"
                    )}>
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-text-main italic tracking-tight uppercase leading-none">{item.name}</p>
                        <p className="text-[10px] font-mono text-gray-400 mt-2 font-bold tracking-widest">{item.sku}</p>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center justify-center gap-4 bg-gray-50/50 p-1 rounded-xl border border-gray-100 w-fit mx-auto shadow-inner">
                          <button 
                            onClick={() => updateQty(item.id, -1)}
                            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-red-50 hover:text-red-500 transition-all shadow-sm active:scale-90"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-black w-8 text-center tabular-nums">{item.qty}</span>
                          <button 
                             onClick={() => updateQty(item.id, 1)}
                             className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-green-50 hover:text-green-500 transition-all shadow-sm active:scale-90"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right font-black text-gray-400 italic text-sm tabular-nums">
                        ₹{item.price.toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-right font-black text-text-main italic text-base tracking-tighter tabular-nums">
                        ₹{item.total.toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all group-hover:opacity-100 opacity-0"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* BOTTOM BAR */}
          <div className="p-4 lg:p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col xs:flex-row items-center justify-between gap-4">
            <div className="flex items-center justify-center xs:justify-start gap-6 lg:gap-12 font-black text-[10px] lg:text-[11px] uppercase tracking-widest italic opacity-60 w-full xs:w-auto">
               <div className="flex items-center gap-3">
                 <span className="text-gray-400">Total Items:</span>
                 <span className="text-primary">{billItems.length}</span>
               </div>
               <div className="flex items-center gap-3">
                 <span className="text-gray-400">Total Quantity:</span>
                 <span className="text-primary">{billItems.reduce((acc, i) => acc + i.qty, 0)}</span>
               </div>
            </div>
            <div className="flex gap-2 lg:gap-4 w-full xs:w-auto mt-2 xs:mt-0">
              <Button variant="secondary" className="flex-1 xs:flex-none px-4 lg:px-8 rounded-xl font-black text-[10px] tracking-widest uppercase italic bg-white border-gray-200">
                 Hold Bill
              </Button>
              <Button 
                variant="ghost" 
                onClick={clearBill}
                className="flex-1 xs:flex-none px-4 lg:px-8 rounded-xl font-black text-[10px] tracking-widest uppercase italic text-red-500 hover:bg-red-50"
              >
                 Clear Bill
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: SUMMARY + PAYMENT (30%) */}
      <div className="w-full lg:flex-[0.3] flex flex-col gap-6 lg:overflow-y-auto custom-scrollbar lg:pr-2">
        {/* CUSTOMER SECTION */}
        <div className="bg-white rounded-3xl p-6 border border-border-main shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Customer Assignment</h4>
             <button className="text-[10px] font-black text-primary uppercase hover:underline">New Account</button>
          </div>
          <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 group cursor-pointer hover:bg-primary/5 transition-all">
             <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-transform shrink-0">
                <User className="w-6 h-6" />
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-60">Session Default</p>
                <p className="text-sm font-black text-text-main truncate italic tracking-tight">{customer}</p>
             </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-2">
             {['Retail', 'Wholesale', 'Dealer'].map((level) => (
                <button 
                  key={level}
                  onClick={() => setPriceLevel(level as any)}
                  className={cn(
                    "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic border",
                    priceLevel === level 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/10"
                      : "bg-white text-text-secondary border-gray-100 hover:border-gray-200"
                  )}
                >
                  {level}
                </button>
             ))}
          </div>
        </div>

        {/* PRICE SUMMARY */}
        <div className="bg-[#003366] rounded-3xl p-8 border border-white/10 shadow-xl shadow-primary/20 text-white flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center opacity-60 text-[11px] font-black uppercase tracking-widest">
               <span>Gross Amount</span>
               <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center px-1 py-1">
               <span className="opacity-60 text-[11px] font-black uppercase tracking-widest italic">Inventory Tax (8.25%)</span>
               <span className="font-mono text-xs font-black">+ ₹{tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="text-[11px] font-black uppercase tracking-widest italic">Discounts Applied</span>
                <input 
                  type="number" 
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="bg-transparent text-right font-black italic text-sm w-20 focus:outline-none placeholder:text-white/20"
                  placeholder="0.00"
                />
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 relative z-10">
             <div className="flex justify-between items-end">
                <div className="flex flex-col">
                   <p className="text-[11px] font-black text-blue-200 uppercase tracking-[0.2em] italic mb-2">Net Payable Amount</p>
                   <p className="text-5xl font-black tracking-tighter italic select-none leading-none">
                     <span className="text-xl mr-1 opacity-40">₹</span>
                     {total.toLocaleString()}
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
           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic border-b border-gray-50 pb-4">Payment Orchestration</h4>
           
           <div className="flex gap-4">
              {[
                { id: 'Cash', icon: Banknote },
                { id: 'UPI', icon: QrCode },
                { id: 'Card', icon: CreditCard }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMode(m.id as any)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                    paymentMode === m.id 
                      ? "bg-primary/5 border-primary shadow-sm"
                      : "bg-white border-gray-100 hover:border-gray-200 text-gray-300"
                  )}
                >
                  <m.icon className={cn("w-6 h-6", paymentMode === m.id ? "text-primary" : "text-gray-300")} />
                  <span className={cn("text-[9px] font-black uppercase leading-none", paymentMode === m.id ? "text-primary" : "text-gray-400")}>{m.id}</span>
                </button>
              ))}
           </div>

           {paymentMode === 'Cash' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Cash Tendered</label>
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
                        <p className="text-[9px] font-black text-green-600 uppercase tracking-widest opacity-60">Balance Change</p>
                        <p className="text-xl font-black text-green-700 italic tracking-tighter leading-none mt-1">₹{balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
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
             onClick={handleCompleteSale}
             className="h-24 rounded-[24px] shadow-2xl shadow-primary/30 italic font-black text-lg tracking-[0.1em] mt-2 relative group overflow-hidden"
           >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <CheckCircle2 className="w-7 h-7 mr-4 relative z-10" />
              <span className="relative z-10 uppercase">Complete Sale</span>
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] opacity-20 group-hover:opacity-100 transition-all group-hover:translate-x-1 font-black underline underline-offset-4">CTRL + ENTER</span>
           </Button>
        </div>
      </div>
    </div>
  )
}

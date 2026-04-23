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
  ShoppingCart
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useData, Vendor } from '@/lib/context/DataContext'
import { EntityLookup } from '@/components/shared/EntityLookup'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { POSItemRow } from '@/components/pos/POSItemRow'
import { POSSummary } from '@/components/pos/POSSummary'

interface BillItem {
  id: string
  name: string
  sku: string
  price: number
  qty: number
  total: number
  gstRate: number
  isNew?: boolean
}

export default function POSPage() {
  const router = useRouter()
  const { inventory, sellFromPOS } = useData()
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [query, setQuery] = useState('')
  const [customer, setCustomer] = useState('Walk-in Customer')
  const [priceLevel, setPriceLevel] = useState<'Retail' | 'Wholesale' | 'Dealer'>('Retail')
  const [discount, setDiscount] = useState(0)
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('Cash')
  const [received, setReceived] = useState<string>('')

  const searchRef = useRef<HTMLInputElement>(null)

  // -- Handlers --

  const addItem = useCallback((itemId: string) => {
    const product = inventory.find(i => i.id === itemId || i.sku === itemId)
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
          sku: product.sku || product.barcode || 'N/A',
          price: product.sale_price || product.price || 0,
          qty: 1,
          total: product.sale_price || product.price || 0,
          gstRate: product.gst_rate || 0,
          isNew: true
        },
        ...prev.map(i => ({ ...i, isNew: false }))
      ]
    })
    setQuery('')
    toast.success(`Added ${product.name}`, { duration: 1000 })
  }, [inventory])

  const handleCompleteSale = useCallback(async () => {
    if (billItems.length === 0) {
      toast.error('Cannot complete empty issue')
      return
    }

    try {
      await toast.promise(async () => {
        await sellFromPOS(
          billItems.map(i => ({ id: i.id, qty: i.qty, price: i.price })),
          customer
        )
      }, {
        loading: 'Processing Sale...',
        success: 'Sale Complete. Inventory Updated.',
        error: (err) => err.message || 'Sale Failed'
      })
      setBillItems([])
      setReceived('')
    } catch (err) {
      console.error(err)
    }
  }, [billItems, sellFromPOS, customer])

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query) return
    addItem(query)
  }

  const updateQty = useCallback((id: string, delta: number) => {
    setBillItems(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.qty + delta)
        return { ...i, qty: newQty, total: newQty * i.price, isNew: false }
      }
      return { ...i, isNew: false }
    }))
  }, []);

  const removeItem = useCallback((id: string) => {
    setBillItems(prev => prev.filter(i => i.id !== id))
    toast.error('Item removed from bill')
  }, []);

  const clearBill = useCallback(() => {
    setBillItems(prev => {
      if (prev.length === 0) return prev
      toast.info('Bill cleared')
      return []
    })
  }, []);

  // -- Effects --

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  useEffect(() => {
    const onScan = (e: Event) => {
      const customEvent = e as CustomEvent<{ item: { id: string } }>;
      const { item } = customEvent.detail;
      if (item) addItem(item.id);
    };
    window.addEventListener('barcode-scanned', onScan);

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
    return () => {
      window.removeEventListener('barcode-scanned', onScan);
      window.removeEventListener('keydown', handleKeyDown);
    }
  }, [billItems, addItem, handleCompleteSale])

  // Calculations
  const subtotal = useMemo(() => billItems.reduce((acc, i) => acc + i.total, 0), [billItems])
  const tax = useMemo(() => {
    return billItems.reduce((acc, i) => {
        const itemTax = i.total * ((i.gstRate || 0) / 100);
        return acc + itemTax;
    }, 0);
  }, [billItems])
  const total = Math.max(0, subtotal + tax - Math.abs(discount))
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
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
          </div>
        </form>

        {/* BILL TABLE */}
        <div className="flex-1 min-h-[400px] lg:min-h-0 bg-white rounded-3xl border border-border-main flex flex-col overflow-hidden shadow-sm">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic">Product Identity</th>
                  <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic">Customer</th>
                  <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic text-center">Quantity</th>
                  <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic text-right">Unit Price</th>
                  <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic text-right">Line Total</th>
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
                    <POSItemRow 
                      key={item.id} 
                      item={item} 
                      customer={customer} 
                      onUpdateQty={updateQty} 
                      onRemove={removeItem} 
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* BOTTOM BAR */}
          <div className="p-4 lg:p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col xs:flex-row items-center justify-between gap-4">
            <div className="flex items-center justify-center xs:justify-start gap-6 lg:gap-12 font-black text-sm lg:text-sm uppercase tracking-widest italic opacity-60 w-full xs:w-auto">
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
              <Button variant="secondary" className="flex-1 xs:flex-none px-4 lg:px-8 rounded-xl font-black text-sm tracking-widest uppercase italic bg-white border-gray-200">
                Hold Bill
              </Button>
              <Button
                variant="ghost"
                onClick={clearBill}
                className="flex-1 xs:flex-none px-4 lg:px-8 rounded-xl font-black text-sm tracking-widest uppercase italic text-red-500 hover:bg-red-50"
              >
                Clear Bill
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: SUMMARY + PAYMENT (30%) */}
      <POSSummary 
        customer={customer}
        setCustomer={setCustomer}
        priceLevel={priceLevel}
        setPriceLevel={setPriceLevel}
        subtotal={subtotal}
        tax={tax}
        discount={discount}
        setDiscount={setDiscount}
        total={total}
        paymentMode={paymentMode}
        setPaymentMode={setPaymentMode}
        received={received}
        setReceived={setReceived}
        balance={balance}
        onComplete={handleCompleteSale}
      />
    </div>
  )
}

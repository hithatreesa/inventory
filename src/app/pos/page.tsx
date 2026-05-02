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
  Scan,
  X,
  Check
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useData, InventoryItem, Contact } from '@/lib/context/DataContext'
import { EntityLookup } from '@/components/shared/EntityLookup'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { POSItemRow } from '@/components/pos/POSItemRow'
import { POSSummary } from '@/components/pos/POSSummary'

interface BillItem {
  id: string
  productId: string
  name: string
  sku: string
  price: number
  qty: number
  total: number
  gstRate: number
  isSerialized: boolean
  serials: string[]
  isNew?: boolean
}

export default function POSPage() {
  const router = useRouter()
  const { inventory, sellFromPOS, getAvailableStock } = useData()
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [query, setQuery] = useState('')
  const [customer, setCustomer] = useState('')
  const [phone, setPhone] = useState('')
  const [priceLevel, setPriceLevel] = useState<'Retail' | 'Wholesale' | 'Dealer'>('Retail')
  const [discount, setDiscount] = useState(0)
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('Cash')
  const [received, setReceived] = useState<string>('')
  const [isPaymentMode, setIsPaymentMode] = useState(false)
  
  const [showSerialModal, setShowSerialModal] = useState(false)
  const [activeItemForSerials, setActiveItemForSerials] = useState<InventoryItem | null>(null)
  const [selectedSerials, setSelectedSerials] = useState<string[]>([])

  const scanRef = useRef<HTMLInputElement>(null)
  const paymentRef = useRef<HTMLInputElement>(null)

  const addItem = useCallback((itemIdOrSku: string) => {
    console.log("[SCANNER] Processing Barcode:", itemIdOrSku);
    const product = inventory.find(i => i.id === itemIdOrSku || i.sku === itemIdOrSku || i.barcode === itemIdOrSku)
    if (!product) {
      console.log("[SCANNER] Item not found:", itemIdOrSku);
      toast.error('Item not found')
      setQuery('')
      return
    }

    const currentStock = (product.total_qty || 0) - (product.assigned_qty || 0)
    if (currentStock <= 0) {
      console.log("[SCANNER] Out of stock:", product.name);
      toast.error(`Out of stock: ${product.name}`)
      setQuery('')
      return
    }

    if (product.is_serialized) {
      console.log("[SCANNER] Serialized item detected, opening modal...");
      setActiveItemForSerials(product)
      setSelectedSerials([])
      setShowSerialModal(true)
      return
    }

    setBillItems(prev => [
      ...prev.map(i => ({ ...i, isNew: false })),
      {
        id: product.id + '-' + Date.now(),
        productId: product.id,
        name: product.name,
        sku: product.sku || product.barcode || 'N/A',
        price: product.sale_price || product.price || 0,
        qty: 1,
        total: product.sale_price || product.price || 0,
        gstRate: product.gst_rate || 0,
        isSerialized: false,
        serials: [],
        isNew: true
      }
    ])
    setQuery('')
    toast.success(`Added ${product.name}`)
    console.log("[SCANNER] Success. Refocusing...");
    setTimeout(() => scanRef.current?.focus(), 50)
  }, [inventory])

  const confirmSerialSelection = useCallback(() => {
    if (!activeItemForSerials) return

    setBillItems(prev => [
      ...prev.map(i => ({ ...i, isNew: false })),
      {
        id: activeItemForSerials.id + '-' + Date.now(),
        productId: activeItemForSerials.id,
        name: activeItemForSerials.name,
        sku: activeItemForSerials.sku || activeItemForSerials.barcode || 'N/A',
        price: activeItemForSerials.sale_price || activeItemForSerials.price || 0,
        qty: selectedSerials.length,
        total: (activeItemForSerials.sale_price || activeItemForSerials.price || 0) * selectedSerials.length,
        gstRate: activeItemForSerials.gst_rate || 0,
        isSerialized: true,
        serials: selectedSerials,
        isNew: true
      }
    ])
    
    setShowSerialModal(false)
    setActiveItemForSerials(null)
    setSelectedSerials([])
    setQuery('')
    toast.success(`Added ${selectedSerials.length} units`)
    setTimeout(() => scanRef.current?.focus(), 10)
  }, [activeItemForSerials, selectedSerials])

  const handleCompleteSale = useCallback(async () => {
    if (billItems.length === 0) return
    try {
      await sellFromPOS(
        billItems.map(i => ({ 
          id: i.productId, 
          qty: i.qty, 
          price: i.price,
          serials: i.serials 
        })),
        customer || 'Walk-in Customer'
      )
      toast.success('Sale Complete')
      setBillItems([])
      setReceived('')
      setIsPaymentMode(false)
      setQuery('')
      setTimeout(() => scanRef.current?.focus(), 100)
    } catch (err: any) {
      toast.error(err.message || 'Sale Failed')
    }
  }, [billItems, sellFromPOS, customer])

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
  }, []);

  const clearBill = useCallback(() => {
    setBillItems([])
    toast.info('Bill cleared')
  }, []);

  useEffect(() => {
    scanRef.current?.focus()
  }, [])

  const subtotal = useMemo(() => billItems.reduce((acc, item) => acc + item.total, 0), [billItems])
  const gstTotal = useMemo(() => billItems.reduce((acc, item) => acc + (item.total * (item.gstRate / 100)), 0), [billItems])
  const total = Math.max(0, subtotal + gstTotal - Math.abs(discount))
  const balance = received ? Math.max(0, parseFloat(received) - total) : 0

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-130px)] gap-6 lg:gap-8 font-sans pb-20 lg:pb-0">
      <div className="w-full lg:flex-[0.7] flex flex-col gap-4 lg:gap-6 lg:h-full lg:overflow-hidden">
        <div className="flex-1 min-h-[400px] lg:min-h-0 bg-white rounded-3xl border border-border-main flex flex-col overflow-hidden shadow-sm">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-[#003366] text-white">
                  <th className="px-4 py-4 text-xs font-black uppercase tracking-widest italic border-r border-white/20 w-12 text-center">S.N.</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest italic border-r border-white/20">Barcode No.</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest italic border-r border-white/20">Product Identity</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest italic border-r border-white/20 text-center">Quantity</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest italic border-r border-white/20 text-right">Unit Price</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest italic border-r border-white/20 text-right">Line Total</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {billItems.map((item, idx) => (
                  <POSItemRow key={item.id} item={item} index={idx} onUpdateQty={updateQty} onRemove={removeItem} />
                ))}
                <tr className="border-b border-gray-100 bg-blue-50/10 h-14">
                  <td className="border-r border-gray-100 text-center font-bold text-primary">{billItems.length + 1}</td>
                  <td className="border-r border-gray-100 px-0">
                     <input 
                       ref={scanRef}
                       value={query}
                       onChange={e => {
                         console.log("[SCANNER] Input Typing:", e.target.value);
                         setQuery(e.target.value);
                       }}
                       onKeyDown={(e) => {
                         console.log("[SCANNER] Key Pressed:", e.key);
                         if (e.key === 'Enter') {
                            if (query) {
                               addItem(query)
                            } else if (billItems.length > 0) {
                               console.log("[SCANNER] Empty Enter, moving to payment...");
                               setIsPaymentMode(true)
                               setTimeout(() => paymentRef.current?.focus(), 50)
                            }
                         }
                       }}
                       placeholder="SCAN HERE..."
                       className="w-full h-full bg-transparent px-8 font-black italic text-sm outline-none text-primary placeholder:text-gray-200 uppercase"
                     />
                  </td>
                  <td className="border-r border-gray-100 px-8 text-[10px] font-black text-gray-300 italic uppercase">Waiting...</td>
                  <td className="border-r border-gray-100"></td>
                  <td className="border-r border-gray-100"></td>
                  <td className="border-r border-gray-100"></td>
                  <td className="border-r border-gray-100"></td>
                </tr>
                {Array.from({ length: Math.max(0, 10 - billItems.length) }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 h-14">
                    <td className="border-r border-gray-100 text-center font-bold text-gray-200">{billItems.length + i + 2}</td>
                    <td colSpan={6} className="border-r border-gray-100"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 lg:p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
            <div className="flex gap-12 font-black text-sm uppercase tracking-widest italic opacity-60">
              <span>Items: {billItems.length}</span>
              <span>Qty: {billItems.reduce((acc, i) => acc + i.qty, 0)}</span>
            </div>
            <div className="flex gap-4">
              <Button variant="secondary" className="px-8 rounded-xl font-black text-sm uppercase italic bg-white border-gray-200">Hold</Button>
              <Button variant="ghost" onClick={clearBill} className="px-8 rounded-xl font-black text-sm uppercase italic text-red-500 hover:bg-red-50">Clear</Button>
            </div>
          </div>
        </div>
      </div>

      <POSSummary 
        customer={customer} setCustomer={setCustomer}
        phone={phone} setPhone={setPhone}
        priceLevel={priceLevel} setPriceLevel={setPriceLevel}
        subtotal={subtotal} cgst={gstTotal/2} sgst={gstTotal/2}
        discount={discount} setDiscount={setDiscount}
        total={total} paymentMode={paymentMode} setPaymentMode={setPaymentMode}
        received={received} setReceived={setReceived}
        balance={balance} isPaymentMode={isPaymentMode} paymentRef={paymentRef}
        onComplete={handleCompleteSale}
        onCancel={() => { setIsPaymentMode(false); setTimeout(() => scanRef.current?.focus(), 10); }}
      />

      {showSerialModal && activeItemForSerials && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-[#003366] text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Scan className="w-5 h-5" />
                <div>
                  <h3 className="font-black text-sm tracking-widest uppercase italic">Serial Intelligence</h3>
                  <p className="text-[9px] opacity-60 font-bold uppercase mt-1">Select for {activeItemForSerials.name}</p>
                </div>
              </div>
              <button onClick={() => setShowSerialModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex justify-between font-black text-[10px] text-gray-400 uppercase italic">
                <span>Stock: {inventory.find(i => i.id === activeItemForSerials.id)?.total_qty || 0}</span>
                <span className="text-primary">Selected: {selectedSerials.length}</span>
              </div>
              <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 gap-2">
                {getAvailableStock(activeItemForSerials.id).map((s: any) => {
                  const isSelected = selectedSerials.includes(s.serial);
                  return (
                    <button
                      key={s.serial}
                      onClick={() => isSelected ? setSelectedSerials(prev => prev.filter(x => x !== s.serial)) : setSelectedSerials(prev => [...prev, s.serial])}
                      className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all", isSelected ? "bg-primary/5 border-primary" : "bg-gray-50 border-gray-100")}
                    >
                      <span className={cn("font-mono text-sm font-black", isSelected ? "text-primary" : "text-gray-500")}>{s.serial}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
               <Button variant="secondary" onClick={() => setShowSerialModal(false)} className="flex-1">CANCEL</Button>
               <Button disabled={selectedSerials.length === 0} onClick={confirmSerialSelection} className="flex-[2]">CONFIRM {selectedSerials.length} UNITS</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

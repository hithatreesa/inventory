"use client"

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Save,
  CheckCircle2,
  Plus,
  FileUp,
  ExternalLink,
  Search,
  Trash2,
  Minus,
  ShoppingCart,
  Package
} from 'lucide-react'
import { useData } from '@/lib/context/DataContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { SummaryPanel, SummaryActionCard } from '@/components/shared/SummaryPanel'
import POSMode from '@/components/POSMode'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SalesItem {
  id: string
  name: string
  sku: string
  qty: number
  unitPrice: number
  gstRate: number
  category: string
}


export default function SalesPage() {
  const { inventory, sellFromPOS } = useData()
  const [invoiceId, setInvoiceId] = useState('')

  useEffect(() => {
    // Generate stable invoice number only on client to avoid hydration mismatch
    setInvoiceId(`INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`)
  }, [])
  const [mode, setMode] = useState<"ERP" | "POS">("ERP")
  const [items, setItems] = useState<SalesItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerVAT, setCustomerVAT] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days')
  const [isProcessing, setIsProcessing] = useState(false)

  // Product search
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Filter inventory for search dropdown
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return inventory.slice(0, 8)
    const q = searchQuery.toLowerCase()
    return inventory.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.sku && item.sku.toLowerCase().includes(q)) ||
      (item.barcode && item.barcode.toLowerCase().includes(q)) ||
      item.id.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    ).slice(0, 10)
  }, [searchQuery, inventory])

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Add product to invoice line items
  const addProductToInvoice = useCallback((productId: string) => {
    const product = inventory.find(i => i.id === productId)
    if (!product) {
      toast.error('Product not found in inventory')
      return
    }

    if (product.total_qty - product.assigned_qty <= 0) {
      toast.error(`${product.name} is out of stock`)
      return
    }

    setItems(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        // Check stock limit
        const availableStock = product.total_qty - product.assigned_qty
        if (existing.qty >= availableStock) {
          toast.error(`Maximum available stock: ${availableStock}`)
          return prev
        }
        return prev.map(i =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        sku: product.sku || 'N/A',
        qty: 1,
        unitPrice: product.price || 0,
        gstRate: product.gst_rate || 0,
        category: product.category || 'General'
      }]
    })

    setSearchQuery('')
    setShowSearch(false)
  }, [inventory])

  // Barcode scan listener — adds scanned item to invoice
  useEffect(() => {
    const onScan = (e: CustomEvent<{ item: { id: string, name: string } }>) => {
      const { item } = e.detail
      if (!item) return
      addProductToInvoice(item.id)
      toast.success(`Scanned: ${item.name}`)
    }
    window.addEventListener('barcode-scanned', onScan as EventListener)
    return () => window.removeEventListener('barcode-scanned', onScan as EventListener)
  }, [inventory, addProductToInvoice])

  // Update quantity for a line item
  const updateQty = useCallback((id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const product = inventory.find(p => p.id === id)
        const availableStock = product ? product.total_qty - product.assigned_qty : 999
        const newQty = Math.max(1, Math.min(item.qty + delta, availableStock))
        if (item.qty + delta > availableStock) {
          toast.error(`Maximum available: ${availableStock}`)
        }
        return { ...item, qty: newQty }
      }
      return item
    }))
  }, [inventory])

  // Update price for a line item
  const updatePrice = useCallback((id: string, price: number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, unitPrice: Math.max(0, price) } : item
    ))
  }, [])

  // Remove a line item
  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    toast.info('Item removed from invoice')
  }, [])

  // Calculations
  const subtotal = useMemo(() =>
    items.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0),
    [items]
  )
  const taxTotal = useMemo(() =>
    items.reduce((acc, item) => acc + (item.qty * item.unitPrice * (item.gstRate / 100)), 0),
    [items]
  )
  const grandTotal = subtotal + taxTotal

  // Weighted average tax rate for display
  const avgTaxRate = subtotal > 0
    ? Math.round((taxTotal / subtotal) * 100 * 100) / 100
    : 0

  // Finalize sale — uses sellFromPOS engine
  const handleFinalize = useCallback(async () => {
    if (items.length === 0) {
      toast.error('Add at least one product to the invoice')
      return
    }
    if (!customerName.trim()) {
      toast.error('Enter a customer name')
      return
    }

    setIsProcessing(true)
    try {
      await toast.promise(async () => {
        await sellFromPOS(
          items.map(i => ({ id: i.id, qty: i.qty, price: i.unitPrice })),
          customerName.trim()
        )
      }, {
        loading: 'Processing Sale...',
        success: `Invoice ${invoiceId} — Sale Complete!`,
        error: (err: Error) => err.message || 'Sale Failed'
      })
      setItems([])
    } catch {
      // Error is handled by toast.promise
    } finally {
      setIsProcessing(false)
    }
  }, [items, customerName, sellFromPOS, invoiceId])

  // Save draft (simple local state — just a toast for UX)
  const handleSaveDraft = useCallback(() => {
    if (items.length === 0) {
      toast.info('Nothing to save — add items first')
      return
    }
    toast.success('Draft saved locally')
  }, [items])

  const headerActions = (
    <>
      <Button
        variant="secondary"
        onClick={() => setMode(mode === "ERP" ? "POS" : "ERP")}
        className="px-6 h-10 font-black tracking-widest uppercase text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200 shadow-sm mr-auto block lg:inline-flex"
      >
        {mode === "ERP" ? "Launch POS" : "EXIT POS"}
      </Button>
      <Button variant="secondary" className="px-6 h-10" onClick={handleSaveDraft}>
        <Save className="w-4 h-4 mr-2" /> Save Draft
      </Button>
      <Button
        onClick={handleFinalize}
        disabled={isProcessing || items.length === 0}
        className="px-10 h-10 italic"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" /> Finalize &amp; Approve
      </Button>
    </>
  )

  if (mode === "POS") {
    return <POSMode onExit={() => setMode("ERP")} />
  }

  return (
    <div className="space-y-8 pb-12">
      <SectionHeader
        title="Sales Invoice"
        prefix="SALES MANAGEMENT"
        subtitle={invoiceId ? `Document Identifier: #${invoiceId}` : "Initializing Document..."}
        actions={headerActions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Form Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Customer Details */}
            <div className="glass p-8 rounded-[32px] shadow-sm flex flex-col justify-between min-h-[240px]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-black text-text-secondary uppercase tracking-[0.2em] pl-1">CUSTOMER DETAILS</span>
              </div>
              <div className="space-y-3 flex-1">
                <div className="space-y-1">
                  <label className="text-xs font-black text-text-secondary pl-1 uppercase tracking-widest">Customer Name *</label>
                  <Input
                    placeholder="Enter customer name..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-text-secondary pl-1 uppercase tracking-widest">GSTIN / VAT</label>
                    <Input
                      placeholder="GST Number"
                      value={customerVAT}
                      onChange={(e) => setCustomerVAT(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-text-secondary pl-1 uppercase tracking-widest">Address</label>
                    <Input
                      placeholder="Billing address"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Logistics */}
            <div className="glass p-8 rounded-[32px] shadow-sm min-h-[240px] flex flex-col">
              <span className="text-sm font-black text-text-secondary uppercase tracking-[0.2em] pl-1">ORDER LOGISTICS</span>
              <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="space-y-1">
                  <label className="text-sm font-black text-text-secondary pl-1 uppercase tracking-widest">Entry Date</label>
                  <Input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-black text-text-secondary pl-1 uppercase tracking-widest">Due Date</label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
              <div className="mt-auto pt-6 flex gap-4 items-end">
                <Select
                  label="PAYMENT TERMS"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  options={['Net 30 Days', 'Net 15 Days', 'Immediate', 'COD']}
                />
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-xl font-black text-text-main uppercase tracking-tight italic">
                Line Items
                {items.length > 0 && (
                  <span className="text-sm font-bold text-text-secondary ml-3 not-italic">
                    ({items.length} {items.length === 1 ? 'item' : 'items'})
                  </span>
                )}
              </h3>
            </div>

            {/* Product Search / Add */}
            <div ref={searchContainerRef} className="relative px-0">
              <div className="relative group">
                <Input
                  ref={searchRef}
                  icon={<Search className="w-5 h-5 text-gray-400" />}
                  placeholder="Search products by name, SKU, barcode, or category..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowSearch(true)
                  }}
                  onFocus={() => setShowSearch(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchResults.length > 0) {
                      addProductToInvoice(searchResults[0].id)
                      setShowSearch(false)
                      setSearchQuery('')
                    }
                  }}
                  className="h-14 rounded-2xl bg-white border-gray-100 shadow-sm text-base font-bold placeholder:italic transition-all focus:ring-4 focus:ring-primary/5 focus:border-primary pr-36"
                />
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (searchResults.length > 0) {
                      addProductToInvoice(searchResults[0].id);
                      setSearchQuery('');
                    } else {
                      toast.error('No product selected');
                    }
                  }}
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2 rounded-xl transition-all z-20 pointer-events-auto",
                    searchResults.length > 0 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95" 
                      : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                  )}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest italic hidden sm:inline-block">
                    Add Result
                  </span>
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Search Dropdown */}
              {showSearch && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl border border-border-main shadow-2xl shadow-primary/10 overflow-hidden animate-in fade-in scale-in duration-200 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {searchResults.length === 0 ? (
                    <div className="p-8 text-center">
                      <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic">No products found</p>
                      <p className="text-xs text-gray-300 mt-1 font-bold">Try a different search term</p>
                    </div>
                  ) : (
                    searchResults.map((product) => {
                      const available = product.total_qty - product.assigned_qty
                      const alreadyAdded = items.find(i => i.id === product.id)
                      return (
                        <button
                          key={product.id}
                          onClick={() => addProductToInvoice(product.id)}
                          className={cn(
                            "w-full px-6 py-4 flex items-center justify-between hover:bg-primary/5 transition-all text-left border-b border-gray-50 last:border-0 group",
                            available <= 0 && "opacity-40 pointer-events-none"
                          )}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                              <Package className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-black text-text-main italic tracking-tight uppercase truncate">
                                {product.name}
                              </p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{product.sku || product.id}</span>
                                <span className="text-xs font-bold text-gray-300">•</span>
                                <span className="text-xs font-bold text-gray-400">{product.category}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            {alreadyAdded && (
                              <span className="text-xs font-black text-primary bg-primary/5 px-2 py-1 rounded-lg uppercase">
                                In Cart ({alreadyAdded.qty})
                              </span>
                            )}
                            <div className="text-right">
                              <p className="text-sm font-black text-text-main italic tabular-nums">
                                ₹{(product.price || 0).toLocaleString('en-IN')}
                              </p>
                              <p className={cn(
                                "text-xs font-bold uppercase tracking-widest",
                                available <= 3 ? "text-warning" : "text-success"
                              )}>
                                {available} in stock
                              </p>
                            </div>
                            <Plus className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-[32px] border border-border-main shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-sm font-black text-text-secondary bg-gray-50/20 uppercase tracking-[0.2em] border-b border-gray-50">
                      <th className="px-8 py-4">Product</th>
                      <th className="px-6 py-4 text-center">Qty</th>
                      <th className="px-6 py-4 text-right">Unit Price</th>
                      <th className="px-6 py-4 text-center">GST %</th>
                      <th className="px-8 py-4 text-right">Line Total</th>
                      <th className="w-16 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-24 text-center opacity-20">
                          <ShoppingCart className="w-16 h-16 mx-auto mb-4" />
                          <p className="text-sm font-black uppercase tracking-[0.3em] italic">Search products above to add items</p>
                          <p className="text-xs font-bold uppercase tracking-widest mt-2 opacity-60">Or scan a barcode</p>
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => {
                        const lineTotal = item.qty * item.unitPrice
                        const lineTax = lineTotal * (item.gstRate / 100)
                        return (
                          <tr key={item.id} className="group hover:bg-gray-50/50 transition-all animate-in fade-in slide-up duration-300">
                            <td className="px-8 py-5">
                              <p className="text-sm font-black text-text-main italic tracking-tight uppercase leading-none">{item.name}</p>
                              <p className="text-xs font-mono text-gray-400 mt-1.5 font-bold tracking-widest">{item.sku}</p>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-center gap-3 bg-gray-50/50 p-1 rounded-xl border border-gray-100 w-fit mx-auto shadow-inner">
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
                            <td className="px-6 py-5 text-right">
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                                className="w-28 text-right text-sm font-black text-text-main italic tabular-nums bg-transparent border-b border-transparent hover:border-gray-200 focus:border-primary transition-colors outline-none py-1"
                                min={0}
                              />
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className="text-sm font-bold text-text-secondary tabular-nums">{item.gstRate}%</span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <p className="text-sm font-black text-text-main italic tabular-nums tracking-tighter">
                                ₹{lineTotal.toLocaleString('en-IN')}
                              </p>
                              {item.gstRate > 0 && (
                                <p className="text-xs font-bold text-gray-400 mt-0.5 tabular-nums">
                                  +₹{lineTax.toLocaleString('en-IN', { minimumFractionDigits: 0 })} tax
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-5 text-center">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Bar */}
              {items.length > 0 && (
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-8 font-black text-sm uppercase tracking-widest italic opacity-60">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">Items:</span>
                      <span className="text-primary">{items.length}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">Total Qty:</span>
                      <span className="text-primary">{items.reduce((a, b) => a + b.qty, 0)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => { setItems([]); toast.info('All items cleared') }}
                    className="text-red-500 hover:bg-red-50 font-black text-sm tracking-widest uppercase italic"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Clear All
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Totals Sidebar */}
        <div className="space-y-6">
          <SummaryPanel
            title="Invoice Summary"
            subtotal={subtotal}
            taxTotal={taxTotal}
            taxRate={avgTaxRate}
            logistics="Free Delivery"
            grandTotal={grandTotal}
            footerNote="This is a computer-generated invoice. Authorized signature required for approval."
          />

          <SummaryActionCard
            icon={ExternalLink}
            title="Global Currency: Indian Rupee"
            subtitle="Base Currency: INR"
          />

          <SummaryActionCard
            variant="dashed"
            icon={FileUp}
            title="Attach External Files"
            subtitle="PDF / JPG / DRAFT-B"
          />
        </div>
      </div>
    </div>
  )
}

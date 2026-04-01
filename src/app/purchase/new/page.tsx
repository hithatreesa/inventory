"use client"

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Save, 
  X,
  Search,
  AlertCircle,
  Hash
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useData } from '@/lib/context/DataContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PurchaseLine {
  id: string
  productId: string
  name: string
  sku: string
  qty: number
  pPrice: number
  sPrice: number
  gst: number
  total: number
  isSerialized: boolean
  serials: string[]
}

export default function PurchaseEntryPage() {
  const { items } = useData()
  const [header, setHeader] = useState({
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    warehouse: 'Main Warehouse',
    paymentType: 'Cash',
    notes: ''
  })

  const [lines, setLines] = useState<PurchaseLine[]>([])
  const [discount, setDiscount] = useState(0)
  const [activeSerialLine, setActiveSerialLine] = useState<string | null>(null)
  const [tempSerials, setTempSerials] = useState<string[]>([])

  // Derived Totals
  const { subtotal, totalGst, grandTotal } = useMemo(() => {
    let sub = 0
    let gstSum = 0
    lines.forEach(line => {
      const lineSub = line.qty * line.pPrice
      const lineGst = lineSub * (line.gst / 100)
      sub += lineSub
      gstSum += lineGst
    })
    return { 
      subtotal: sub, 
      totalGst: gstSum, 
      grandTotal: sub + gstSum - discount 
    }
  }, [lines])

  const addLine = (productId?: string) => {
    const item = items.find(i => i.id === productId)
    const newLine: PurchaseLine = {
      id: Math.random().toString(36).substr(2, 9),
      productId: item?.id || '',
      name: item?.name || '',
      sku: item?.sku || '',
      qty: 1,
      pPrice: item?.price || 0,
      sPrice: (item?.price || 0) * 1.2, // Default 20% margin
      gst: item?.category === 'Hardware' ? 18 : 12, // Auto GST logic based on category
      total: 0,
      isSerialized: item?.category === 'Hardware', // Mock: Hardware is serialized
      serials: []
    }
    // Calculate total
    newLine.total = newLine.qty * newLine.pPrice * (1 + newLine.gst / 100)
    setLines([...lines, newLine])
  }

  const updateLine = (id: string, updates: Partial<PurchaseLine>) => {
    setLines(prev => prev.map(l => {
      if (l.id === id) {
        const updatedLine = { ...l, ...updates }
        updatedLine.total = updatedLine.qty * updatedLine.pPrice * (1 + updatedLine.gst / 100)
        return updatedLine
      }
      return l
    }))
  }

  const removeLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id))
  }

  const openSerialModal = (line: PurchaseLine) => {
    setActiveSerialLine(line.id)
    setTempSerials(line.serials.length ? line.serials : Array(line.qty).fill(''))
  }

  const handleSaveSerials = () => {
    if (tempSerials.some(s => !s.trim())) {
      toast.error('All serial numbers are required')
      return
    }
    if (new Set(tempSerials).size !== tempSerials.length) {
      toast.error('Duplicate serial numbers detected')
      return
    }
    updateLine(activeSerialLine!, { serials: tempSerials })
    setActiveSerialLine(null)
    toast.success('Serial numbers assigned')
  }

  const handleSubmit = (status: 'Draft' | 'Approved') => {
    if (!header.supplier || !header.invoiceNumber) {
      toast.error('Supplier and Invoice Number are mandatory')
      return
    }
    if (lines.length === 0) {
      toast.error('Add at least one item to proceed')
      return
    }
    
    // Check serials
    const missingSerials = lines.find(l => l.isSerialized && l.serials.length !== l.qty)
    if (missingSerials && status === 'Approved') {
      toast.error(`Missing serial numbers for ${missingSerials.name}`)
      return
    }

    toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
      loading: 'Recording purchase entry...',
      success: `Purchase ${status === 'Approved' ? 'submitted' : 'saved as draft'} successfully`,
      error: 'Failed to record purchase'
    })
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="bg-white rounded-3xl border border-border-main p-8 shadow-sm">
        <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-6">
           <div>
              <h1 className="text-3xl font-black text-[#003366] tracking-tighter italic uppercase">Purchase Entry</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Inbound Stock Registration Engine</p>
           </div>
           <span className="h-10 px-6 rounded-2xl flex items-center justify-center border border-primary/20 bg-primary/5 text-primary font-black italic text-[11px]">PO-PR-240812</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Supplier</label>
            <select 
              value={header.supplier}
              onChange={(e) => setHeader({...header, supplier: e.target.value})}
              className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all appearance-none"
            >
              <option value="">Select Supplier...</option>
              <option value="Aether Logistics">Aether Logistics International</option>
              <option value="Cyberdyne Systems">Cyberdyne Systems</option>
              <option value="Weyland Corp">Weyland Corp</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Purchase Date</label>
            <Input type="date" value={header.date} onChange={(e) => setHeader({...header, date: e.target.value})} className="h-12 text-sm" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Invoice Number</label>
            <Input 
              placeholder="e.g. INV-9921" 
              value={header.invoiceNumber} 
              onChange={(e) => setHeader({...header, invoiceNumber: e.target.value})}
              className="h-12 text-sm font-black tracking-tight"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Warehouse</label>
            <select 
              value={header.warehouse}
              onChange={(e) => setHeader({...header, warehouse: e.target.value})}
              className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:ring-4 focus:ring-primary/5 appearance-none"
            >
              <option>Main Warehouse</option>
              <option>Express Hub A</option>
              <option>Global Distribution</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Payment Type</label>
            <select 
              value={header.paymentType}
              onChange={(e) => setHeader({...header, paymentType: e.target.value})}
              className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold appearance-none"
            >
              <option>Cash</option>
              <option>Credit (Net-30)</option>
              <option>Bank Transfer</option>
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Notes</label>
            <Input 
              placeholder="Additional procurement metadata..." 
              value={header.notes}
              onChange={(e) => setHeader({...header, notes: e.target.value})}
              className="h-12 text-sm" 
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ITEM ENTRY TABLE */}
        <div className="flex-1 bg-white rounded-3xl border border-border-main flex flex-col overflow-hidden shadow-sm">
          <div className="overflow-x-auto min-h-[400px]">
             <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Item Identification</th>
                    <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Qty</th>
                    <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Purchase Price</th>
                    <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Selling Price</th>
                    <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">GST %</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Line Total</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lines.map((line) => (
                    <tr key={line.id} className="group hover:bg-gray-50/30 transition-colors">
                      <td className="px-8 py-5">
                          <select 
                            value={line.productId}
                            onChange={(e) => {
                              const item = items.find(i => i.id === e.target.value)
                              updateLine(line.id, { 
                                productId: item?.id, 
                                name: item?.name, 
                                sku: item?.sku,
                                pPrice: item?.price || 0,
                                sPrice: (item?.price || 0) * 1.2,
                                gst: item?.category === 'Hardware' ? 18 : 12,
                                isSerialized: item?.category === 'Hardware'
                              })
                            }}
                            className="bg-transparent font-black italic text-sm text-[#003366] focus:outline-none w-full appearance-none"
                          >
                            <option value="">Select Item...</option>
                            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                          </select>
                          <p className="text-[10px] text-gray-400 font-mono mt-1 font-bold">{line.sku || 'SKU_UNKNOWN'}</p>
                          {line.isSerialized && (
                            <button 
                              onClick={() => openSerialModal(line)}
                              className={cn(
                                "mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all border",
                                line.serials.length === line.qty 
                                  ? "bg-green-50 text-green-600 border-green-100" 
                                  : "bg-primary/5 text-primary border-primary/20 animate-pulse"
                              )}
                            >
                              <Hash className="w-3 h-3" />
                              {line.serials.length === line.qty ? 'Serials Assigned' : 'Add Serials Required'}
                            </button>
                          )}
                      </td>
                      <td className="px-4 py-5 text-center">
                        <input 
                          type="number" 
                          value={line.qty} 
                          onChange={(e) => updateLine(line.id, { qty: parseInt(e.target.value) || 0 })}
                          className="w-16 bg-gray-50/50 rounded-lg border border-gray-100 px-2 py-1.5 text-center text-sm font-black focus:outline-none focus:ring-2 focus:ring-primary/10"
                        />
                      </td>
                      <td className="px-4 py-5 text-right font-black italic text-sm">
                        <input 
                          type="number" 
                          value={line.pPrice} 
                          onChange={(e) => updateLine(line.id, { pPrice: parseFloat(e.target.value) || 0 })}
                          className="w-24 bg-transparent text-right focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-5 text-right font-black italic text-sm text-primary">
                        <input 
                          type="number" 
                          value={line.sPrice} 
                          onChange={(e) => updateLine(line.id, { sPrice: parseFloat(e.target.value) || 0 })}
                          className="w-24 bg-transparent text-right focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-5 text-center font-black text-gray-400 text-xs">
                        {line.gst}%
                      </td>
                      <td className="px-10 py-6 text-right font-black italic text-sm text-[#003366] tabular-nums tracking-tighter">
                        ₹{line.total.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button onClick={() => removeLine(line.id)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50/20">
                     <td colSpan={7} className="p-4">
                        <Button 
                          variant="secondary" 
                          onClick={() => addLine()}
                          className="w-full h-12 border-dashed border-2 border-gray-200 bg-transparent text-[10px] font-black tracking-widest uppercase italic group hover:border-primary hover:text-primary transition-all"
                        >
                          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" /> Add Purchase Line
                        </Button>
                     </td>
                  </tr>
                </tbody>
             </table>
          </div>
        </div>

        {/* SUMMARY PANEL */}
        <div className="w-full lg:w-96 space-y-6">
           <div className="bg-[#003366] rounded-3xl p-8 text-white shadow-xl shadow-primary/20 space-y-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="space-y-4 relative z-10">
                 <div className="flex justify-between items-center opacity-60 text-[10px] font-black uppercase tracking-[0.2em] italic">
                    <span>Valuation Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center opacity-60 text-[10px] font-black uppercase tracking-[0.2em] italic">
                    <span>Aggregated GST</span>
                    <span>₹{totalGst.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest italic opacity-80">Discount Amt</span>
                    <input 
                      type="number" 
                      value={discount} 
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="bg-transparent text-right font-black w-24 focus:outline-none placeholder:text-white/20 italic" 
                      placeholder="0.00"
                    />
                 </div>
              </div>
              <div className="pt-6 border-t border-white/10 relative z-10">
                 <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] italic mb-2 opacity-60">Settlement Total</p>
                 <p className="text-5xl font-black italic tracking-tighter leading-none select-none">
                    <span className="text-xl mr-1 opacity-20">₹</span>
                    {grandTotal.toLocaleString()}
                 </p>
              </div>
           </div>

           <div className="bg-white rounded-3xl p-8 border border-border-main shadow-sm flex flex-col gap-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic border-b border-gray-50 pb-4 mb-2">Workflow Execution</h4>
              <Button size="xl" onClick={() => handleSubmit('Approved')} className="h-20 rounded-2xl italic font-black text-xs tracking-widest group shadow-2xl shadow-primary/10">
                <CheckCircle2 className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> SUBMIT PURCHASE
              </Button>
              <Button variant="secondary" onClick={() => handleSubmit('Draft')} className="h-16 rounded-2xl border-gray-100 bg-white font-black text-[10px] tracking-widest uppercase italic group hover:shadow-xl transition-all">
                <Save className="w-5 h-5 mr-3 text-primary opacity-40 group-hover:opacity-100 transition-opacity" /> Save Draft-A
              </Button>
              <Button variant="secondary" className="h-16 rounded-2xl border-gray-100 bg-white font-black text-[10px] tracking-widest uppercase italic text-red-500 hover:bg-red-50">
                 Discard Entry
              </Button>
           </div>
        </div>
      </div>

      {/* SERIAL MODAL (INLINE STYLE) */}
      {activeSerialLine && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in transition-all">
          <div className="bg-white rounded-[40px] border border-border-main p-10 w-full max-w-xl shadow-2xl space-y-8 animate-in zoom-in duration-300">
             <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm"><Hash className="w-6 h-6" /></div>
                   <div>
                      <h3 className="text-xl font-black text-[#003366] italic tracking-tight uppercase">Serial Registration</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Required: {tempSerials.length} Identity Strings</p>
                   </div>
                </div>
                <button onClick={() => setActiveSerialLine(null)} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-red-50 hover:text-red-50 transition-all"><X className="w-5 h-5 text-gray-400 hover:text-red-500" /></button>
             </div>

             <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                {tempSerials.map((s, idx) => (
                  <div key={idx} className="space-y-1.5">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Unit #{idx + 1} Serial String</label>
                     <Input 
                        placeholder="ENTER_SN_OR_SCAN..." 
                        value={s}
                        onChange={(e) => {
                          const newer = [...tempSerials]
                          newer[idx] = e.target.value.toUpperCase()
                          setTempSerials(newer)
                        }}
                        className="h-12 font-mono font-bold tracking-widest text-sm focus:ring-primary/10"
                     />
                  </div>
                ))}
             </div>

             <div className="flex gap-4 pt-4">
                <Button size="xl" onClick={handleSaveSerials} className="flex-1 rounded-2xl font-black text-xs italic tracking-widest">
                   VALIDATE & ATTACH
                </Button>
                <Button variant="secondary" size="xl" onClick={() => setActiveSerialLine(null)} className="rounded-2xl px-10 font-black text-[10px] tracking-widest uppercase italic">
                   CANCEL
                </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}


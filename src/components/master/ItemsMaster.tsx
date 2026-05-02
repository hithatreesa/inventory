"use client"

import React, { useState } from 'react'
import { Plus, Trash2, Edit2, Package, CheckCircle2, X, Search, Hash, Barcode as BarcodeIcon, ShieldCheck } from 'lucide-react'
import { useData, InventoryItem } from '@/lib/context/DataContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function ItemsMaster() {
  const { inventory, addItem, editItem, deleteItems, gstConfigs } = useData()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '', sku: '', barcode: '', brand: '', model: '', category: '', unit: 'Nos', hsn_code: '', gst_rate: 18, purchase_price: 0, sale_price: 0, is_serialized: false, min_stock: 0, status: 'ACTIVE'
  })
  const [search, setSearch] = useState('')

  const handleSave = async () => {
    if (!formData.name || !formData.barcode || !formData.hsn_code) {
      toast.error("HARD_FAIL: REQUIRED_FIELDS_MISSING [Name, Barcode, HSN]")
      return
    }

    try {
      if (editingId) {
        await editItem(editingId, formData)
        toast.success("Master Item Blueprint Updated")
      } else {
        await addItem(formData)
        toast.success("New Master Item Registered")
      }
      setIsAdding(false)
      setEditingId(null)
      setFormData({ name: '', sku: '', barcode: '', brand: '', model: '', category: '', unit: 'Nos', hsn_code: '', gst_rate: 18, purchase_price: 0, sale_price: 0, is_serialized: false, min_stock: 0, status: 'ACTIVE' })
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const filteredItems = inventory.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase()) ||
    i.barcode.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#003366] italic uppercase tracking-tight">Product Master</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Core Inventory Identity Registry</p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items, SKU, barcodes..."
              className="h-12 pl-12 bg-gray-50/50 border-gray-100 rounded-2xl italic font-bold"
            />
          </div>
          <Button
            onClick={() => { setIsAdding(true); setEditingId(null); }}
            className="rounded-2xl italic font-black uppercase text-[10px] tracking-widest px-8 h-12 bg-[#003366] text-white shadow-xl shadow-blue-900/20"
          >
            <Plus className="w-4 h-4 mr-2" /> Define New Item
          </Button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-10 rounded-[48px] border-4 border-primary/10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-10 border-b border-gray-50 pb-6">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-black text-[#003366] italic uppercase tracking-tight">
                {editingId ? 'Modify Item Blueprint' : 'Registry: New Item Blueprint'}
              </h3>
            </div>
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="w-10 h-10 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Product Global Name</label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Nvidia RTX 4090 TI"
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold text-base"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">HSN / SAC Code</label>
              <Input
                value={formData.hsn_code}
                onChange={e => setFormData({ ...formData, hsn_code: e.target.value })}
                placeholder="8471"
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-black tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">GST Slab (%)</label>
              <select
                value={formData.gst_rate}
                onChange={e => setFormData({ ...formData, gst_rate: parseInt(e.target.value) })}
                className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-4 font-black italic text-primary outline-none focus:ring-4 focus:ring-primary/5"
              >
                {gstConfigs.map(g => <option key={g.id} value={g.rate}>{g.name} ({g.rate}%)</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">SKU (Unique)</label>
              <Input
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                placeholder="GPU-NV-4090"
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold uppercase"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Barcode / EAN</label>
              <Input
                value={formData.barcode}
                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="789012345678"
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Brand Identity</label>
              <Input
                value={formData.brand}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Nvidia"
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold italic"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Model / Version</label>
              <Input
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                placeholder="Founders Edition"
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Category</label>
              <Input
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                placeholder="Hardware"
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Measurement Unit</label>
              <Input
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Nos / Box"
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold italic"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Purchase Price (Est)</label>
              <Input
                type="number"
                value={formData.purchase_price}
                onChange={e => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-black tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Sales Price (Retail)</label>
              <Input
                type="number"
                value={formData.sale_price}
                onChange={e => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-black text-primary tabular-nums"
              />
            </div>

            <div className="flex items-center gap-6 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 md:col-span-2">
              <div className="flex-1 space-y-1">
                <p className="text-[10px] font-black text-[#003366] uppercase tracking-widest italic">Serialized Assets</p>
                <p className="text-[9px] font-bold text-gray-400 leading-none">Mandates barcode scan for every unit movement.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_serialized}
                  onChange={e => setFormData({ ...formData, is_serialized: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Stock Threshold</label>
              <Input
                type="number"
                value={formData.min_stock}
                onChange={e => setFormData({ ...formData, min_stock: parseInt(e.target.value) || 0 })}
                placeholder="5"
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-black tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-4 font-black italic outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-gray-50">
            <Button variant="secondary" onClick={() => { setIsAdding(false); setEditingId(null); }} className="rounded-2xl px-10 h-14 italic font-black uppercase text-[10px] tracking-widest">Discard Entry</Button>
            <Button onClick={handleSave} className="rounded-2xl px-12 h-14 italic font-black uppercase text-[10px] tracking-widest bg-primary text-white shadow-2xl shadow-primary/30">
              <CheckCircle2 className="w-5 h-5 mr-3" /> Commit Blueprint
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Item Blueprint</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">HSN / GST</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Protocol</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Pricing</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredItems.map((item) => (
                <tr key={item.id} className="group hover:bg-gray-50/30 transition-all cursor-pointer">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center text-[#003366] group-hover:scale-110 transition-transform">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-base font-black text-[#003366] italic uppercase leading-none">{item.name}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                            <Hash className="w-3 h-3" /> {item.sku}
                          </div>
                          <div className="w-[1px] h-3 bg-gray-100" />
                          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                            <BarcodeIcon className="w-3 h-3" /> {item.barcode}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <p className="text-sm font-black text-text-main tracking-widest uppercase italic">{item.hsn_code}</p>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1.5 italic">GST {item.gst_rate}%</p>
                  </td>
                  <td className="px-8 py-8">
                    <div className="flex flex-col items-center gap-2">
                      {item.is_serialized ? (
                        <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase italic border border-blue-100">
                          <ShieldCheck className="w-3 h-3" /> Serialized
                        </span>
                      ) : (
                        <span className="bg-gray-50 text-gray-400 px-3 py-1 rounded-full text-[9px] font-black uppercase italic border border-gray-100">Batch Entry</span>
                      )}
                      <span className={cn(
                        "text-[9px] font-black uppercase italic px-2",
                        item.status === 'ACTIVE' ? "text-green-500" : "text-red-400"
                      )}>{item.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-right">
                    <p className="text-xs font-bold text-gray-300 line-through">₹{(item.purchase_price || 0).toLocaleString('en-IN')}</p>
                    <p className="text-base font-black text-[#003366] italic tabular-nums mt-0.5">₹{(item.sale_price || 0).toLocaleString('en-IN')}</p>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setEditingId(item.id); setFormData(item); setIsAdding(true); }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-primary hover:bg-primary/5 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Purge blueprint for "${item.name}"? This action is IRREVERSIBLE.`)) {
                            deleteItems([item.id])
                            toast.success("Blueprint Purged")
                          }
                        }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

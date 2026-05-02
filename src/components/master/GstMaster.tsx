"use client"

import React, { useState } from 'react'
import { Plus, Trash2, Edit2, Percent, CheckCircle2, X } from 'lucide-react'
import { useData, GstConfig } from '@/lib/context/DataContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function GstMaster() {
  const { gstConfigs, addGstConfig, updateGstConfig, deleteGstConfig } = useData()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', rate: 0, hsn: '' })

  const handleSave = async () => {
    if (!formData.name || formData.rate < 0) {
      toast.error("HARD_FAIL: INVALID_GST_DATA")
      return
    }

    try {
      if (editingId) {
        await updateGstConfig(editingId, formData)
        toast.success("GST Standard Updated")
      } else {
        await addGstConfig(formData)
        toast.success("New GST Slab Registered")
      }
      setFormData({ name: '', rate: 0, hsn: '' })
      setIsAdding(false)
      setEditingId(null)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-[#003366] italic uppercase tracking-tight">Taxation Registry</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Compliance & HSN Standards</p>
        </div>
        <Button
          onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ name: '', rate: 0, hsn: '' }); }}
          className="rounded-xl italic font-black uppercase text-[10px] tracking-widest px-8 h-12 bg-[#003366] hover:bg-[#002244]"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Tax Slab
        </Button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-8 rounded-[32px] border-2 border-[#003366]/10 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-4">
            <div>
              <h3 className="text-sm font-black text-[#003366] uppercase tracking-[0.2em] italic">
                {editingId ? 'Modify Regulation' : 'Register New Standard'}
              </h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Define rate and HSN mapping</p>
            </div>
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Item Name / Category</label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Computer Parts"
                className="h-14 rounded-2xl bg-gray-50 border-gray-100 font-bold focus:ring-2 focus:ring-[#003366]/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">GST %</label>
              <Input
                type="number"
                value={formData.rate}
                onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                placeholder="18"
                className="h-14 rounded-2xl bg-gray-50 border-gray-100 font-black italic focus:ring-2 focus:ring-[#003366]/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">HSN Code</label>
              <Input
                value={formData.hsn}
                onChange={e => setFormData({ ...formData, hsn: e.target.value })}
                placeholder="e.g. 8471"
                className="h-14 rounded-2xl bg-gray-50 border-gray-100 font-bold focus:ring-2 focus:ring-[#003366]/20 transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-10 pt-6 border-t border-gray-50">
            <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); }} className="rounded-xl px-8 italic font-black uppercase text-[10px] tracking-widest text-gray-400">Abort</Button>
            <Button onClick={handleSave} className="rounded-xl px-12 italic font-black uppercase text-[10px] tracking-widest bg-[#003366] hover:bg-[#002244] shadow-lg shadow-primary/20 h-12">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Commit Standard
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Compliance Identity</th>
              <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">HSN Mapping</th>
              <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Tax Rate</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {gstConfigs.map((gst) => (
              <tr key={gst.id} className="group hover:bg-gray-50/30 transition-all duration-300">
                <td className="px-10 py-6">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-[#003366]/5 rounded-2xl flex items-center justify-center text-[#003366] shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <Percent className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-black text-[#003366] italic uppercase block leading-none">{gst.name}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 block">Active Regulation</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <span className="inline-flex px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-widest italic">
                    {gst.hsn || '---'}
                  </span>
                </td>
                <td className="px-6 py-6 text-center">
                  <span className="text-xl font-black text-[#003366] italic tabular-nums leading-none block">{gst.rate}%</span>
                  <span className="text-[8px] font-black text-green-500 uppercase tracking-widest mt-1 block italic">Standard Slab</span>
                </td>
                <td className="px-10 py-6 text-right">
                  <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => { setEditingId(gst.id); setFormData({ name: gst.name, rate: gst.rate, hsn: gst.hsn || '' }); }}
                      className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:text-[#003366] hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 transition-all flex items-center justify-center"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Confirm deletion of this tax regulation?")) {
                          deleteGstConfig(gst.id)
                        }
                      }}
                      className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:shadow-md border border-transparent hover:border-red-100 transition-all flex items-center justify-center"
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
  )
}

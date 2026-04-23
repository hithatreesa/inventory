"use client"

import React, { useState } from 'react'
import { Plus, Trash2, Edit2, Users, CheckCircle2, X, Search, Filter } from 'lucide-react'
import { useData, Vendor } from '@/lib/context/DataContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function VendorMaster() {
  const { vendors, addVendor, editVendor, deleteVendors } = useData()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Vendor>>({
    name: '', gstin: '', phone: '', email: '', address: '', state: '', contact_person: '', payment_terms: ''
  })
  const [search, setSearch] = useState('')

  const handleSave = async () => {
    if (!formData.name || !formData.gstin) {
      toast.error("HARD_FAIL: VENDOR_NAME_AND_GSTIN_REQUIRED")
      return
    }

    try {
      if (editingId) {
        await editVendor(editingId, formData)
        toast.success("Vendor Record Updated")
      } else {
        await addVendor(formData)
        toast.success("New Vendor Registered")
      }
      setIsAdding(false)
      setEditingId(null)
      setFormData({ name: '', gstin: '', phone: '', email: '', address: '', state: '', contact_person: '', payment_terms: '' })
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    v.gstin.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#003366] italic uppercase tracking-tight">Vendor Database</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Global Supplier Registry</p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <Input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search registry..." 
              className="h-12 pl-12 bg-gray-50/50 border-gray-100 rounded-2xl italic font-bold"
            />
          </div>
          <Button 
            onClick={() => { setIsAdding(true); setEditingId(null); }}
            className="rounded-2xl italic font-black uppercase text-[10px] tracking-widest px-8 h-12 bg-[#003366] text-white shadow-xl shadow-blue-900/20"
          >
            <Plus className="w-4 h-4 mr-2" /> Register Vendor
          </Button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-10 rounded-[48px] border-4 border-primary/10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-10 border-b border-gray-50 pb-6">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-black text-[#003366] italic uppercase tracking-tight">
                {editingId ? 'Edit Vendor Record' : 'Onboard New Supplier'}
              </h3>
            </div>
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="w-10 h-10 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Supplier Legal Name</label>
              <Input 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Nexus Tech Corp" 
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold text-base"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">GSTIN Registry</label>
              <Input 
                value={formData.gstin}
                onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                placeholder="22AAAAA0000A1Z5" 
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-black tracking-widest uppercase"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Contact Person</label>
              <Input 
                value={formData.contact_person}
                onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Operations Head" 
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Phone Number</label>
              <Input 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 XXX XXX XXXX" 
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Email Terminal</label>
              <Input 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="ops@nexus.com" 
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">State Logic</label>
              <Input 
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Maharashtra" 
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold italic"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Physical Address</label>
              <Input 
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Headquarters location..." 
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Payment Terms</label>
              <Input 
                value={formData.payment_terms}
                onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
                placeholder="Net 30 Days" 
                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold italic"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-gray-50">
            <Button variant="secondary" onClick={() => { setIsAdding(false); setEditingId(null); }} className="rounded-2xl px-10 h-14 italic font-black uppercase text-[10px] tracking-widest">Discard Entry</Button>
            <Button onClick={handleSave} className="rounded-2xl px-12 h-14 italic font-black uppercase text-[10px] tracking-widest bg-primary text-white shadow-2xl shadow-primary/30">
              <CheckCircle2 className="w-5 h-5 mr-3" /> Commit to Master
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Supplier Identity</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">GSTIN / State</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Contact Details</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredVendors.map((v) => (
                <tr key={v.id} className="group hover:bg-gray-50/30 transition-all cursor-pointer">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center text-[#003366] group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-base font-black text-[#003366] italic uppercase leading-none">{v.name}</p>
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-2">{v.contact_person || 'No Contact Person'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <p className="text-sm font-black text-text-main tracking-widest uppercase">{v.gstin}</p>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1.5 italic">{v.state || 'N/A'}</p>
                  </td>
                  <td className="px-8 py-8">
                    <p className="text-sm font-bold text-text-secondary">{v.phone}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 lowercase">{v.email}</p>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setEditingId(v.id); setFormData(v); setIsAdding(true); }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-primary hover:bg-primary/5 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Purge vendor record for "${v.name}"? This will NOT delete past transactions.`)) {
                            deleteVendors([v.id])
                            toast.success("Vendor Record Purged")
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

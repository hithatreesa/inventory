"use client"

import React, { useState, useEffect } from 'react'
import { Modal } from './BaseModal'
import { Package, Hash, DollarSign, MapPin, Save, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useData } from '@/lib/context/DataContext'
import { toast } from 'sonner'

export function ItemModal({ 
  isOpen, 
  onClose, 
  item 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  item?: any 
}) {
  const { addItem, editItem } = useData()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [form, setForm] = useState({
    name: '',
    category: 'Hardware',
    sku: '',
    unit: 'pcs',
    price: '',
    brand: '',
    location: 'Main Store',
    threshold: '5'
  })

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        category: item.category || 'Hardware',
        sku: item.sku || '',
        unit: item.unit || 'pcs',
        price: item.price?.toString() || '',
        brand: item.brand || '',
        location: item.location || 'Main Store',
        threshold: item.threshold?.toString() || '5'
      })
    } else {
      setForm({
        name: '',
        category: 'Hardware',
        sku: '',
        unit: 'pcs',
        price: '',
        brand: '',
        location: 'Main Store',
        threshold: '5'
      })
    }
  }, [item, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        threshold: Number(form.threshold)
      }

      if (item) {
        await editItem(item.id, payload)
        toast.success('Item updated successfully')
      } else {
        await addItem(payload)
        toast.success('Item added successfully')
      }
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={item ? "Edit Inventory Item" : "Add New Item"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Item Name</label>
            <Input 
              required
              placeholder="e.g. Cisco Nexus Switch" 
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">SKU / Part Number</label>
            <Input 
              required
              placeholder="SKU-001" 
              value={form.sku}
              onChange={e => setForm({...form, sku: e.target.value})}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Category</label>
            <select 
              className="w-full h-10 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold appearance-none italic focus:outline-none focus:ring-2 focus:ring-primary/5"
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
              disabled={isSubmitting}
            >
              <option>Hardware</option>
              <option>Software</option>
              <option>Networking</option>
              <option>Storage</option>
              <option>Laptops</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Brand</label>
            <Input 
              placeholder="e.g. Dell, Cisco" 
              value={form.brand}
              onChange={e => setForm({...form, brand: e.target.value})}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Price (₹)</label>
            <Input 
              type="number"
              placeholder="0.00" 
              value={form.price}
              onChange={e => setForm({...form, price: e.target.value})}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Warehouse Location</label>
            <Input 
              placeholder="Main Store" 
              value={form.location}
              onChange={e => setForm({...form, location: e.target.value})}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Low Stock Threshold</label>
            <Input 
              type="number"
              placeholder="5" 
              value={form.threshold}
              onChange={e => setForm({...form, threshold: e.target.value})}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-100">
          <Button 
            type="button"
            variant="secondary" 
            className="flex-1 rounded-2xl h-12 font-black italic tracking-widest text-[10px] uppercase" 
            onClick={onClose} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-[2] rounded-2xl h-12 font-black italic tracking-widest text-[10px] uppercase shadow-xl shadow-primary/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : <><Save className="w-4 h-4 mr-2" /> {item ? 'Save Changes' : 'Create Item'}</>}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

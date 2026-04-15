"use client"

import React, { useState, useEffect } from 'react'
import { Modal } from './BaseModal'
import { Package, Hash, DollarSign, MapPin, Save, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useData } from '@/lib/context/DataContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
    unit: 'nos',
    price: '',
    brand: '',
    location: 'Main Store',
    threshold: '5',
    gst_rate: '18',
    model: '',
    is_serialized: 'NO',
    barcode: ''
  })

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        category: item.category || 'Hardware',
        sku: item.sku || '',
        unit: item.unit || 'nos',
        price: item.price?.toString() || '',
        brand: item.brand || '',
        location: item.location || 'Main Store',
        threshold: item.threshold?.toString() || '5',
        gst_rate: item.gst_rate?.toString() || '0',
        model: item.model || '',
        is_serialized: item.is_serialized ? 'YES' : 'NO',
        barcode: item.barcode || ''
      })
    } else {
      setForm({
        name: '',
        category: 'Hardware',
        sku: '',
        unit: 'nos',
        price: '',
        brand: '',
        location: 'Main Store',
        threshold: '5',
        gst_rate: '18',
        model: '',
        is_serialized: 'NO',
        barcode: ''
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
        threshold: Number(form.threshold),
        gst_rate: Number(form.gst_rate),
        is_serialized: form.is_serialized === 'YES'
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

  // Scanning mode for the individual field
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isScanning) return;
    
    const onScan = (e: any) => {
        const { barcode } = e.detail;
        if (barcode) {
            setForm(f => ({ ...f, barcode }));
            setIsScanning(false);
            toast.success("Barcode captured");
        }
    };
    
    window.addEventListener('barcode-scanned', onScan);
    return () => window.removeEventListener('barcode-scanned', onScan);
  }, [isScanning]);

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
              <option>Electronics</option>
              <option>Industrial</option>
              <option>Raw Materials</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Unit (SI)</label>
            <Select 
              options={['nos', 'm', 'kg', 'pcs', 'box']}
              value={form.unit}
              onChange={e => setForm({...form, unit: e.target.value})}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">GST (%)</label>
            <Input 
              type="number"
              placeholder="18" 
              value={form.gst_rate}
              onChange={e => setForm({...form, gst_rate: e.target.value})}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Model</label>
            <Input 
              placeholder="e.g. Nexus 9000" 
              value={form.model}
              onChange={e => setForm({...form, model: e.target.value})}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Serial Tracking</label>
            <Select 
              options={['YES', 'NO']}
              value={form.is_serialized}
              onChange={e => setForm({...form, is_serialized: e.target.value})}
              disabled={isSubmitting}
            />
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
          <div className="space-y-1.5 col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Barcode Identification</label>
            <div className="flex gap-2">
                <Input 
                    placeholder="Scan or type barcode..." 
                    value={form.barcode}
                    onChange={e => setForm({...form, barcode: e.target.value})}
                    disabled={isSubmitting}
                    className="flex-1 font-mono tracking-widest"
                />
                <Button 
                    type="button" 
                    onClick={() => setIsScanning(!isScanning)}
                    className={cn(
                        "px-6 h-10 rounded-xl transition-all",
                        isScanning ? "bg-primary text-white animate-pulse" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    )}
                >
                    {isScanning ? "SCANNING..." : "SCAN"}
                </Button>
            </div>
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

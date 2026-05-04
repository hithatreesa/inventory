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

  const [form, setForm] = useState<{
    name: string;
    category: string;
    sku: string;
    unit: string;
    purchase_price: string;
    sale_price: string;
    brand: string;
    location: string;
    threshold: string;
    gst_rate: string;
    hsn_code: string;
    model: string;
    is_serialized: 'YES' | 'NO';
    barcode: string;
    min_stock: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>({
    name: '',
    category: 'Hardware',
    sku: '',
    unit: 'nos',
    purchase_price: '',
    sale_price: '',
    brand: 'N/A',
    location: 'Main Store',
    threshold: '5',
    gst_rate: '18',
    hsn_code: '0000',
    model: 'General',
    is_serialized: 'NO',
    barcode: '',
    min_stock: '0',
    status: 'ACTIVE'
  })

  useEffect(() => {
    if (item && isOpen) {
      setForm({
        name: item.name || '',
        category: item.category || 'Hardware',
        sku: item.sku || '',
        unit: item.unit || 'nos',
        purchase_price: item.purchase_price?.toString() || '',
        sale_price: item.sale_price?.toString() || item.price?.toString() || '',
        brand: item.brand || '',
        location: item.location || 'Main Store',
        threshold: item.threshold?.toString() || '5',
        gst_rate: item.gst_rate?.toString() || '18',
        hsn_code: item.hsn_code || '',
        model: item.model || '',
        is_serialized: item.is_serialized ? 'YES' : 'NO',
        barcode: item.barcode || '',
        min_stock: item.min_stock?.toString() || '0',
        status: (item.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')
      })
    } else if (isOpen) {
      setForm({
        name: '',
        category: 'Hardware',
        sku: '',
        unit: 'nos',
        purchase_price: '',
        sale_price: '',
        brand: '',
        location: 'Main Store',
        threshold: '5',
        gst_rate: '18',
        hsn_code: '',
        model: '',
        is_serialized: 'NO',
        barcode: '',
        min_stock: '0',
        status: 'ACTIVE'
      })
    }
  }, [item, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        ...form,
        sku: form.sku || `SKU-${form.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`,
        barcode: form.barcode || `BC-${Date.now()}`,
        purchase_price: Number(form.purchase_price) || Number(form.sale_price),
        sale_price: Number(form.sale_price),
        price: Number(form.sale_price), // Legacy
        threshold: Number(form.threshold),
        gst_rate: Number(form.gst_rate),
        min_stock: Number(form.min_stock),
        is_serialized: form.is_serialized === 'YES',
        status: form.status as 'ACTIVE' | 'INACTIVE'
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
              onChange={e => setForm({ ...form, name: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Category</label>
            <select
              className="w-full h-10 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold appearance-none italic focus:outline-none focus:ring-2 focus:ring-primary/5"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
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
              onChange={e => setForm({ ...form, unit: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Price (₹)</label>
            <Input
              type="number"
              required
              placeholder="0.00"
              value={form.sale_price}
              onChange={e => setForm({ ...form, sale_price: e.target.value, purchase_price: e.target.value })}
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

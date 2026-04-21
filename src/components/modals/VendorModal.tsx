"use client"

import React, { useState, useEffect } from 'react'
import { Modal } from './BaseModal'
import { Save } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useData } from '@/lib/context/DataContext'
import { toast } from 'sonner'

export function VendorModal({ 
  isOpen, 
  onClose,
  initialName = ''
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  initialName?: string;
}) {
  const { addVendor } = useData()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [form, setForm] = useState({
    name: '',
    address: '',
    email: '',
    gst: '',
    phone: ''
  })

  useEffect(() => {
    if (isOpen) {
      setForm(prev => ({ 
        ...prev, 
        name: initialName,
        address: '',
        email: '',
        gst: '',
        phone: ''
      }))
    }
  }, [isOpen, initialName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        isNew: true, // Tag it so caller knows if needed, though addVendor creates id natively now
        name: form.name.trim(),
        address: form.address.trim(),
        email: form.email.trim(),
        gst: form.gst.trim(),
        phone: form.phone.trim()
      }

      const newVendor = addVendor(payload)
      toast.success('Vendor registered successfully')
      
      // Dispatch a custom event so the EntityLookup can catch it and auto-select
      const event = new CustomEvent('vendor-created', { detail: newVendor });
      window.dispatchEvent(event);

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
      title="Create New Vendor / Party"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Party / Vendor Name <span className="text-red-500">*</span></label>
            <Input 
              required
              autoFocus
              placeholder="e.g. Aether Logistics" 
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">GST Number</label>
            <Input 
              placeholder="e.g. 29ABCDE1234F1Z5" 
              value={form.gst}
              onChange={e => setForm({...form, gst: e.target.value.toUpperCase()})}
              disabled={isSubmitting}
              className="font-mono tracking-widest"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Email Address (Mail ID)</label>
            <Input 
              type="email"
              placeholder="e.g. billing@company.com" 
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Phone Number</label>
            <Input 
              type="tel"
              placeholder="e.g. 9876543210" 
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Billing Address</label>
            <textarea 
              rows={3}
              placeholder="Full business address..." 
              value={form.address}
              onChange={e => setForm({...form, address: e.target.value})}
              disabled={isSubmitting}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold resize-none italic outline-none focus:ring-2 focus:ring-primary/20"
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
            disabled={isSubmitting || !form.name.trim()}
          >
            {isSubmitting ? 'Registering...' : <><Save className="w-4 h-4 mr-2" /> Register Vendor</>}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

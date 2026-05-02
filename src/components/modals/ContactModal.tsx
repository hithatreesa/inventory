"use client"

import React, { useState, useEffect } from 'react'
import { Modal } from './BaseModal'
import { Save } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useData } from '@/lib/context/DataContext'
import { toast } from 'sonner'

export function ContactModal({
  isOpen,
  onClose,
  initialName = '',
  defaultType = 'VENDOR'
}: {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  defaultType?: 'VENDOR' | 'CLIENT';
}) {
  const { addContact } = useData()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    type: defaultType,
    address: '',
    email: '',
    gstin: '',
    phone: '',
    state: '',
    contact_person: '',
    payment_terms: ''
  })

  useEffect(() => {
    if (isOpen) {
      setForm(prev => ({
        ...prev,
        name: initialName,
        type: defaultType,
        address: '',
        email: '',
        gstin: '',
        phone: '',
        state: '',
        contact_person: '',
        payment_terms: ''
      }))
    }
  }, [isOpen, initialName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload: any = {
        name: form.name.trim(),
        type: form.type,
        address: form.address.trim(),
        email: form.email.trim(),
        gstin: form.gstin.trim(),
        phone: form.phone.trim(),
        state: form.state.trim(),
        contact_person: form.contact_person.trim(),
        payment_terms: form.payment_terms.trim()
      }

      const newContact = addContact(payload)
      toast.success('Contact registered successfully')

      // Dispatch a custom event so the EntityLookup can catch it and auto-select
      const event = new CustomEvent('contact-created', { detail: newContact });
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
      title="Create New Contact"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Contact Type <span className="text-red-500">*</span></label>
            <select
              required
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value as 'VENDOR' | 'CLIENT' })}
              disabled={isSubmitting}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="VENDOR">Supplier / Vendor</option>
              <option value="CLIENT">Customer / Client</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Contact Name <span className="text-red-500">*</span></label>
            <Input
              required
              autoFocus
              placeholder="e.g. Aether Logistics"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">GST Number</label>
            <Input
              placeholder="e.g. 29ABCDE1234F1Z5"
              value={form.gstin}
              onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
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
              onChange={e => setForm({ ...form, email: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">State / Province</label>
            <Input
              placeholder="e.g. Maharashtra"
              value={form.state}
              onChange={e => setForm({ ...form, state: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Contact Person</label>
            <Input
              placeholder="Name of POC"
              value={form.contact_person}
              onChange={e => setForm({ ...form, contact_person: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Payment Terms</label>
            <Input
              placeholder="e.g. Net 30 Days"
              value={form.payment_terms}
              onChange={e => setForm({ ...form, payment_terms: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Billing Address</label>
            <textarea
              rows={3}
              placeholder="Full business address..."
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
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
            {isSubmitting ? 'Registering...' : <><Save className="w-4 h-4 mr-2" /> Register Contact</>}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

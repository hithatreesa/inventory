"use client"

import React, { useState } from 'react'
import { Modal } from './BaseModal'
import { Save, Package, DollarSign, Tag, FileText, Camera, Upload, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useData } from '@/lib/context/DataContext'
import { toast } from 'sonner'
import { EntityLookup } from '../shared/EntityLookup'
import { cn } from '@/lib/utils'

export function AdditionalPurchaseModal({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { recordAdditionalPurchase } = useData()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    item_name: '',
    qty: '',
    cost: '',
    ticket_id: '',
    notes: '',
    billImageUrl: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.item_name || !form.ticket_id || !form.qty || !form.cost) {
      toast.error('All fields marked * are required')
      return
    }

    setIsSubmitting(true)
    try {
      await recordAdditionalPurchase({
        item_name: form.item_name,
        qty: Number(form.qty),
        cost: Number(form.cost),
        ticket_id: form.ticket_id,
        notes: form.notes,
        attachment: form.billImageUrl
      })
      toast.success('Additional Purchase recorded successfully')
      setForm({ item_name: '', qty: '', cost: '', ticket_id: '', notes: '', billImageUrl: '' })
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, billImageUrl: reader.result as string }));
      toast.success("Receipt captured");
    };
    reader.readAsDataURL(file);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="REGISTER: ADDITIONAL PURCHASE"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Product Specification <span className="text-red-500">*</span></label>
            <div className="relative">
              <EntityLookup
                type="item"
                value={form.item_name}
                onChange={(val) => setForm({ ...form, item_name: val })}
                onSelect={(item) => setForm({ ...form, item_name: item.name })}
                placeholder="e.g. 5m Patch Cord (Bought Locally)"
                className="font-black italic uppercase"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Quantity <span className="text-red-500">*</span></label>
            <Input
              required
              type="number"
              placeholder="1"
              value={form.qty}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, qty: e.target.value })}
              disabled={isSubmitting}
              className="font-black italic"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Rate (₹) <span className="text-red-500">*</span></label>
            <Input
              required
              type="number"
              placeholder="0.00"
              value={form.cost}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, cost: e.target.value })}
              disabled={isSubmitting}
              className="font-black italic"
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Job / Project Reference <span className="text-red-500">*</span></label>
            <EntityLookup
              type="ticket"
              value={form.ticket_id}
              onChange={(val) => setForm({ ...form, ticket_id: val })}
              onSelect={(ticket) => setForm({ ...form, ticket_id: ticket.id })}
              placeholder="Search Ticket..."
              className="font-black italic uppercase"
            />
          </div>

          <div className="col-span-2 p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Calculated Extension</div>
            <div className="text-xl font-black italic text-[#003366]">₹{(Number(form.qty) * Number(form.cost)).toFixed(2)}</div>
          </div>

          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Internal Remarks</label>
            <textarea
              rows={3}
              placeholder="Vendor details, reason for additional purchase, etc."
              value={form.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })}
              disabled={isSubmitting}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold resize-none italic outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Digital Receipt / Attachment</label>
            <div className={cn(
              "relative h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden",
              form.billImageUrl ? "border-primary/20 bg-primary/5" : "border-gray-100 bg-gray-50 hover:bg-gray-100/80"
            )}>
              {form.billImageUrl ? (
                <>
                  <img src={form.billImageUrl} alt="receipt" className="w-full h-full object-contain p-2" />
                  <button 
                    type="button"
                    onClick={() => setForm({ ...form, billImageUrl: '' })}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                  <Camera className="w-6 h-6 text-gray-300 mb-1" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Upload Receipt</span>
                </label>
              )}
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
            {isSubmitting ? 'Recording...' : <><Save className="w-4 h-4 mr-2" /> Record Purchase</>}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

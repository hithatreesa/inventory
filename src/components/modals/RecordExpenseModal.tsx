"use client"

import React, { useState, useEffect } from 'react'
import { X, Save, Wallet, Calendar, FileText } from 'lucide-react'
import { Modal } from './BaseModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useData } from '@/lib/context/DataContext'
import { toast } from 'sonner'
import { EntityLookup } from '@/components/shared/EntityLookup'

export function RecordExpenseModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { recordManualExpense } = useData()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [form, setForm] = useState({
    expense_id: '',
    name: '',
    amount: '',
    gst_rate: 0,
    reference: '',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (isOpen) {
      setForm({
        expense_id: '',
        name: '',
        amount: '',
        gst_rate: 0,
        reference: '',
        date: new Date().toISOString().split('T')[0]
      })
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.expense_id) return toast.error("Please select an expense type from master")
    if (!form.amount || Number(form.amount) <= 0) return toast.error("Amount must be greater than 0")
    
    setIsSubmitting(true)
    try {
      await recordManualExpense({
        expenseId: form.expense_id,
        amount: Number(form.amount),
        reference: form.reference,
        date: form.date
      })
      toast.success("Expense recorded successfully")
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Failed to record expense")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Out-of-Pocket Expense">
      <form onSubmit={handleSubmit} className="space-y-6 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Select Expense Blueprint</label>
            <EntityLookup 
              type="expense"
              value={form.name}
              onChange={(val) => setForm({...form, name: val})}
              onSelect={(exp) => setForm({
                ...form, 
                name: exp.name, 
                expense_id: exp.id,
                gst_rate: exp.gst_rate || 0,
                amount: exp.default_amount?.toString() || form.amount
              })}
              placeholder="Search Transport, Installation, Rent..."
              className="w-full h-12 bg-white border-2 border-gray-100 rounded-xl px-4 text-base font-black italic outline-none focus:border-primary transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Amount (₹)</label>
            <Input 
              type="number"
              placeholder="0.00" 
              value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})}
              className="h-12 text-lg font-black italic"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Transaction Date</label>
            <Input 
              type="date"
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
              className="h-12 font-bold"
            />
          </div>

          <div className="space-y-1.5 col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Reference / Job ID (Optional)</label>
            <Input 
              placeholder="e.g. TICKET-101, SHOP-RENT-APR" 
              value={form.reference}
              onChange={e => setForm({...form, reference: e.target.value})}
              className="h-12 font-bold"
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
            className="flex-[2] rounded-2xl h-12 font-black italic tracking-widest text-[10px] uppercase shadow-xl shadow-primary/20 bg-[#003366] text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Recording...' : <><Wallet className="w-4 h-4 mr-2" /> Commit to Ledger</>}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

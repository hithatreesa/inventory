"use client"

import React, { useState, useEffect } from 'react'
import { X, Save, ShieldAlert } from 'lucide-react'
import { Modal } from './BaseModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useData, ExpenseConfig } from '@/lib/context/DataContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function ExpenseModal({ isOpen, onClose, expense }: { isOpen: boolean, onClose: () => void, expense?: ExpenseConfig }) {
  const { addExpenseConfig, updateExpenseConfig } = useData()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [form, setForm] = useState({
    name: '',
    type: 'DIRECT' as 'DIRECT' | 'INDIRECT',
    default_amount: '',
    gst_applicable: false,
    gst_rate: '18',
    account_head: ''
  })

  useEffect(() => {
    if (expense && isOpen) {
      setForm({
        name: expense.name,
        type: expense.type,
        default_amount: expense.default_amount?.toString() || '',
        gst_applicable: !!expense.gst_applicable,
        gst_rate: expense.gst_rate?.toString() || '18',
        account_head: expense.account_head || ''
      })
    } else if (isOpen) {
      setForm({
        name: '',
        type: 'DIRECT',
        default_amount: '',
        gst_applicable: false,
        gst_rate: '18',
        account_head: ''
      })
    }
  }, [expense, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return toast.error("Expense name is required")
    
    setIsSubmitting(true)
    try {
      const payload = {
        ...form,
        default_amount: form.default_amount ? Number(form.default_amount) : undefined,
        gst_rate: form.gst_applicable ? Number(form.gst_rate) : undefined
      }

      if (expense) {
        await updateExpenseConfig(expense.id, payload)
        toast.success("Expense configuration updated")
      } else {
        await addExpenseConfig(payload)
        toast.success("New expense type registered")
        // Dispatch event for EntityLookup
        window.dispatchEvent(new CustomEvent('expense-created', { detail: { name: form.name } }))
      }
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Failed to save expense")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={expense ? "Modify Expense Blueprint" : "Register New Expense Type"}>
      <form onSubmit={handleSubmit} className="space-y-6 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Expense Name</label>
            <Input 
              placeholder="e.g. Transport Charges" 
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Category</label>
            <select 
              className="w-full h-10 bg-gray-50 border border-gray-100 rounded-xl px-4 text-xs font-bold outline-none"
              value={form.type}
              onChange={e => setForm({...form, type: e.target.value as any})}
            >
              <option value="DIRECT">DIRECT</option>
              <option value="INDIRECT">INDIRECT</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Default Amount (₹)</label>
            <Input 
              type="number"
              placeholder="0.00" 
              value={form.default_amount}
              onChange={e => setForm({...form, default_amount: e.target.value})}
            />
          </div>

          <div className="space-y-1.5 col-span-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-[#003366] uppercase tracking-widest italic">GST Applicable</p>
               <p className="text-[9px] font-bold text-gray-400 leading-none">Enable if tax is charged on this expense.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.gst_applicable}
                  onChange={e => setForm({...form, gst_applicable: e.target.checked})}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {form.gst_applicable && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">GST Rate (%)</label>
              <Input 
                type="number"
                value={form.gst_rate}
                onChange={e => setForm({...form, gst_rate: e.target.value})}
              />
            </div>
          )}

          <div className={cn("space-y-1.5", !form.gst_applicable && "col-span-2")}>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 italic">Account Head</label>
            <Input 
              placeholder="e.g. 5001 - Transport" 
              value={form.account_head}
              onChange={e => setForm({...form, account_head: e.target.value})}
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
            {isSubmitting ? 'Processing...' : <><Save className="w-4 h-4 mr-2" /> {expense ? 'Update Blueprint' : 'Commit Expense Type'}</>}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

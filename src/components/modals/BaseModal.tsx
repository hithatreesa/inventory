"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-[32px] shadow-2xl z-[101] overflow-hidden"
          >
            <div className="p-8 pb-4 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-2xl font-black text-text-main italic tracking-tight">{title}</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-text-secondary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              {children}
            </div>
            <div className="p-8 pt-4 flex justify-end gap-4 border-t border-gray-100 bg-gray-50/50">
              <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-text-secondary hover:bg-gray-100 transition-all">Cancel</button>
              <button className="px-8 py-2.5 bg-primary text-white rounded-xl font-extrabold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Save Changes</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

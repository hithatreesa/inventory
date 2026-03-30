"use client"

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { mockItems, serialNumberRegistry, auditLogs, Item } from '@/lib/mock-data/inventory'

interface DataContextType {
  items: Item[]
  serialRegistry: typeof serialNumberRegistry
  logs: typeof auditLogs
  addItem: (item: Item) => void
  updateItem: (id: string, updates: Partial<Item>) => void
  addSale: (sale: any) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>(mockItems)
  const [serialRegistry, setSerialRegistry] = useState(serialNumberRegistry)
  const [logs, setLogs] = useState(auditLogs)

  const addItem = useCallback((newItem: Item) => {
    setItems(prev => [newItem, ...prev])
  }, [])

  const updateItem = useCallback((id: string, updates: Partial<Item>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
  }, [])

  const addSale = useCallback((sale: any) => {
    // Shared state logic for sales would go here
  }, [])

  const value = useMemo(() => ({
    items,
    serialRegistry,
    logs,
    addItem,
    updateItem,
    addSale
  }), [items, serialRegistry, logs, addItem, updateItem, addSale])

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

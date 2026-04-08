"use client"

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'

export interface InventoryItem {
  id: string
  name: string
  category: string
  total_qty: number
  assigned_qty: number
  location: string
  threshold: number
  model?: string
  sku?: string
  price?: number
  brand?: string
}

export interface Engineer {
  id: string
  name: string
}

export interface Transaction {
  id: string
  item_id: string
  engineer_id: string
  type: string
  quantity: number
  status: string
  date: string
}

export interface Log {
  id: string
  title: string
  desc: string
  type: string
  time: string
}

interface DataContextType {
  inventory: InventoryItem[]
  transactions: any[]
  logs: Log[]
  engineers: Engineer[]
  fetchData: () => Promise<void>
  inwardItem: (itemId: any, qty: number, reference?: string) => Promise<void>
  outwardItem: (itemId: any, engineerId: any, qty: number, reference?: string) => Promise<void>
  returnItem: (itemId: any, engineerId: any, qty: number, reference?: string) => Promise<void>
  addLog: (msg: string) => void
  addItem: (item: any) => Promise<void>
  editItem: (id: string, updates: any) => Promise<void>
  deleteItems: (ids: string[]) => Promise<void>
  // Legacy aliases
  issueAsset: (itemId: string, engineerId: string, quantity: number) => Promise<void>
  returnAsset: (txnId: string) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [engineers, setEngineers] = useState<Engineer[]>([])
  const [logs, setLogs] = useState<any[]>([])

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [
      { id: Date.now().toString(), title: msg, desc: `Action recorded at ${new Date().toLocaleTimeString()}`, type: 'System', time: 'Just now', message: msg },
      ...prev
    ])
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [stockRes, transRes, engRes] = await Promise.all([
        fetch('/api/stock'),
        fetch('/api/transactions'),
        fetch('/api/engineers')
      ])
      
      const [stockData, transData, engData] = await Promise.all([
        stockRes.json(),
        transRes.json(),
        engRes.json()
      ])

      if (stockData.inventory) setInventory(stockData.inventory)
      if (transData.transactions) setTransactions(transData.transactions)
      if (engData.engineers) setEngineers(engData.engineers)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const inwardItem = async (itemId: any, qty: number, reference?: string) => {
    const res = await fetch('/api/purchase-receive', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, quantity: Number(qty), reference })
    })
    if (res.ok) {
      addLog(`INWARD: Item ${itemId} +${qty}`)
      await fetchData()
    } else {
      const data = await res.json()
      throw new Error(data.error || 'Failed to receive purchase')
    }
  }

  const outwardItem = async (itemId: any, engineerId: any, qty: number, reference?: string) => {
    const res = await fetch('/api/issue-item', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, engineer_id: engineerId, quantity: Number(qty), reference })
    })
    if (res.ok) {
      addLog(`OUTWARD: Item ${itemId} → Engineer ${engineerId} (-${qty})`)
      await fetchData()
    } else {
      const data = await res.json()
      throw new Error(data.error || 'Failed to issue item')
    }
  }

  const returnItem = async (itemId: any, engineerId: any, qty: number, reference?: string) => {
    const res = await fetch('/api/return-item', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, engineer_id: engineerId, quantity: Number(qty), reference })
    })
    if (res.ok) {
      addLog(`RETURN: Item ${itemId} from Engineer ${engineerId} (+${qty})`)
      await fetchData()
    } else {
      const data = await res.json()
      throw new Error(data.error || 'Failed to return item')
    }
  }

  const addItem = async (item: any) => {
    const res = await fetch('/api/items', {
      method: 'POST',
      body: JSON.stringify(item)
    })
    if (res.ok) {
      addLog(`NEW ITEM: ${item.name} created`)
      await fetchData()
    } else {
      const data = await res.json()
      throw new Error(data.error || 'Failed to add item')
    }
  }

  const editItem = async (id: string, updates: any) => {
    const res = await fetch('/api/items', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...updates })
    })
    if (res.ok) {
      addLog(`UPDATE: Item ${id} modified`)
      await fetchData()
    } else {
      const data = await res.json()
      throw new Error(data.error || 'Failed to update item')
    }
  }

  const deleteItems = async (ids: string[]) => {
    const res = await fetch('/api/items', {
      method: 'DELETE',
      body: JSON.stringify({ ids })
    })
    if (res.ok) {
      addLog(`DELETE: ${ids.length} items removed`)
      await fetchData()
    } else {
      const data = await res.json()
      throw new Error(data.error || 'Failed to delete items')
    }
  }

  const value = useMemo(() => ({
    inventory,
    transactions,
    logs,
    engineers,
    fetchData,
    inwardItem,
    outwardItem,
    returnItem,
    addLog,
    addItem,
    editItem,
    deleteItems,
    issueAsset: (itemId: string, engineerId: string, quantity: number) => outwardItem(itemId, engineerId, quantity),
    returnAsset: async (txnId: string) => {
      const t = transactions.find(tx => tx.id === txnId)
      if (t) {
        await returnItem(t.item_id, t.engineer_id, t.quantity)
      }
    }
  }), [inventory, transactions, logs, engineers, fetchData, addLog])

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

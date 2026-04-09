"use client"

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import * as engine from '../inventoryEngine'

// -------------------------------------------------------------
// UI-FACING DATA MODELS (PRESERVING LEGACY TYPES for UI to render)
// -------------------------------------------------------------
export interface InventoryItem {
  id: string
  name: string
  category: string
  total_qty: number
  assigned_qty: number
  location: string
  threshold: number
  price?: number
  sku?: string
  model?: string
  brand?: string
}

export interface Engineer {
  id: string
  name: string
  type?: "IT" | "TECHNICAL"
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

export interface TicketRequirement {
  item_id: string
  qty: number
}

export interface TicketTracking {
  item_id: string
  assigned_qty: number
  returned_qty: number
  consumed_qty: number
}

export interface Ticket {
  id: string
  customer_name: string
  issue_description: string
  status: "CREATED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED"
  engineer_id?: string
  requirements: TicketRequirement[]
  tracking: TicketTracking[]
  // Legacy UI compat
  title?: string
  description?: string
  assigned_engineer_id?: string
  created_at?: string
}

// -------------------------------------------------------------
// MOCK CATALOG (Replaces DB Items & Engineers for mapping)
// -------------------------------------------------------------
const MOCK_CATALOG = [
  { id: "item1", name: "Laptop", category: "Computing", price: 85000, threshold: 5, location: "Main HQ" },
  { id: "item2", name: "Router", category: "Networking", price: 145000, threshold: 2, location: "Main HQ" }
];

const MOCK_ENGINEERS = [
  { id: "eng1", name: "Ravi" },
  { id: "eng2", name: "Kiran" }
];

// -------------------------------------------------------------
// CONTEXT
// -------------------------------------------------------------
interface DataContextType {
  inventory: InventoryItem[]
  transactions: any[]
  logs: Log[]
  engineers: Engineer[]
  tickets: Ticket[]
  fetchData: () => Promise<void>
  inwardItem: (itemId: any, qty: number, reference?: string) => Promise<void>
  outwardItem: (itemId: any, engineerId: any, qty: number, reference?: string) => Promise<void>
  returnItem: (itemId: any, engineerId: any, qty: number, reference?: string) => Promise<void>
  consumeItem: (itemId: any, engineerId: any, qty: number, reference?: string) => Promise<void>
  addLog: (msg: string) => void
  addItem: (item: any) => Promise<void>
  editItem: (id: string, updates: any) => Promise<void>
  createTransaction: (txn: any) => Promise<void>
  addEngineer: (data: { name: string, type: "IT" | "TECHNICAL" }) => void
  deleteItems: (ids: string[]) => Promise<void>
  
  // TICKET WORKFLOW
  createTicket: (ticket: Partial<Ticket>) => Promise<void>
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>
  assignEngineer: (ticket_id: string, engineer_id: string) => Promise<void>
  addRequirement: (ticket_id: string, item_id: string, qty: number) => Promise<void>
  issueItems: (ticket_id: string) => Promise<void>
  returnItems: (ticket_id: string, item_id: string, qty: number) => Promise<void>
  consumeItems: (ticket_id: string, item_id: string, qty: number) => Promise<void>
  completeTicket: (ticket_id: string) => Promise<void>

  getTickets: () => Ticket[]
  getTicketById: (id: string) => Ticket | undefined
  getEngineerTickets: (engineer_id: string) => Ticket[]
  getEngineerSerials: (engineer_id: string) => Record<string, any>[]

  // LEGACY Compat
  issueAsset: (itemId: string, engineerId: string, quantity: number) => Promise<void>
  returnAsset: (txnId: string) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [engineers, setEngineers] = useState<Engineer[]>(MOCK_ENGINEERS)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [catalog, setCatalog] = useState(MOCK_CATALOG)

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [
      { id: Date.now().toString(), title: msg, desc: `Action`, type: 'System', time: 'Just now', message: msg },
      ...prev
    ])
  }, [])

  // Derived state from strict serial engine
  const fetchData = useCallback(async () => {
    try {
      const groupedItems = engine.getAllItemsGrouped();
      const engineTxns = engine.getTransactions();

      // 1. Group engine items by catalog product to build `InventoryItem[]`
      const parsedInventory: InventoryItem[] = catalog.map(cat => {
        const group = groupedItems.find(g => g.item_id === cat.id);

        return {
          ...cat,
          total_qty: group ? group.total_qty : 0,
          assigned_qty: group ? group.assigned_qty : 0,
        }
      });

      // 2. Map engine transactions to legacy UI transaction format loosely
      const parsedTxns = engineTxns.map(tx => ({
        id: tx.id,
        item_id: tx.item_id,
        type: tx.type,
        quantity: 1, // engine is strict serial tracking
        engineer_id: tx.engineer_id || 'N/A',
        status: 'COMPLETED',
        date: new Date(tx.timestamp).toISOString()
      }));
      
      parsedTxns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Update state only if changed (shallow length + id check for transactions)
      setInventory(prev => {
        if (JSON.stringify(prev) === JSON.stringify(parsedInventory)) return prev;
        return parsedInventory;
      });

      setTransactions(prev => {
         if (prev.length === parsedTxns.length && prev[0]?.id === parsedTxns[0]?.id) return prev;
         return parsedTxns;
      });

    } catch (err) {
      console.error('Data deriving error:', err)
    }
  }, [catalog])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // -------------------------------------------------------------
  // EVENT LAYER BRIDGE
  // -------------------------------------------------------------
  const inwardItem = async (itemId: string, qty: number, reference?: string) => {
    for (let i = 0; i < qty; i++) {
        engine.inwardItem(itemId);
    }
    addLog(`INWARD: ${qty}x ${itemId}`);
    await fetchData();
  }

  const outwardItem = async (itemId: string, engineerId: string, qty: number, reference?: string) => {
    const available = engine.getAvailableStock(itemId);
    if (available.length < qty) {
      throw new Error(`Insufficient serials. Requested: ${qty}, Available: ${available.length}`);
    }
    const targetSerials = available.slice(0, qty).map(s => s.serial);
    for (const serial of targetSerials) {
        engine.assignItem(serial, engineerId);
    }
    addLog(`ASSIGNED: ${qty}x ${itemId} passed to ${engineerId}`);
    await fetchData();
  }

  const legacyReturnItem = async (itemId: string, engineerId: string, qty: number, reference?: string) => {
    const assigned = engine.getEngineerItems(engineerId).filter(i => i.item_id === itemId);
    if (assigned.length < qty) {
        throw new Error(`Engineer does not have enough serials to return.`);
    }
    const targetSerials = assigned.slice(0, qty).map(s => s.serial);
    for (const serial of targetSerials) {
        engine.returnItem(serial);
    }
    addLog(`RETURN: ${qty}x ${itemId} restocked from ${engineerId}`);
    await fetchData();
  }

  const legacyConsumeItem = async (itemId: string, engineerId: string, qty: number, reference?: string) => {
    const assigned = engine.getEngineerItems(engineerId).filter(i => i.item_id === itemId);
    if (assigned.length < qty) {
        throw new Error(`Engineer does not have enough serials to consume.`);
    }
    const targetSerials = assigned.slice(0, qty).map(s => s.serial);
    for (const serial of targetSerials) {
        engine.consumeItem(serial);
    }
    addLog(`CONSUMED: ${qty}x ${itemId} consumed by ${engineerId}`);
    await fetchData();
  }

  // -------------------------------------------------------------
  // TICKET WORKFLOW ENGINE
  // -------------------------------------------------------------

  const createTicket = async (ticketData: Partial<Ticket>) => {
    const newTicket: Ticket = {
      id: `TCK-${Date.now()}`,
      customer_name: ticketData.customer_name || ticketData.title || 'Unknown Customer',
      issue_description: ticketData.issue_description || ticketData.description || 'No description',
      title: ticketData.title || ticketData.customer_name || 'Workflow Ticket', // legacy UI compat
      description: ticketData.description || ticketData.issue_description || 'No description', // legacy UI compat
      status: "CREATED",
      requirements: ticketData.requirements || [],
      tracking: [],
      created_at: new Date().toISOString()
    };
    
    // Auto-create tracking arrays for requirements if provided initially
    for (const req of newTicket.requirements) {
      newTicket.tracking.push({ item_id: req.item_id, assigned_qty: 0, returned_qty: 0, consumed_qty: 0 });
    }

    setTickets(prev => [...prev, newTicket]);
    addLog(`TICKET CREATED: ${newTicket.id}`);
  }

  const assignEngineer = async (ticket_id: string, engineer_id: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticket_id) {
        return { ...t, status: "ASSIGNED", engineer_id, assigned_engineer_id: engineer_id };
      }
      return t;
    }));
    addLog(`TICKET ASSIGNED: ${ticket_id} to ${engineer_id}`);
  }

  const addRequirement = async (ticket_id: string, item_id: string, qty: number) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticket_id) {
        const existing = t.requirements.find(r => r.item_id === item_id);
        let newReqs;
        if (existing) {
            newReqs = t.requirements.map(r => r.item_id === item_id ? { ...r, qty: r.qty + qty } : r);
        } else {
            newReqs = [...t.requirements, { item_id, qty }];
        }
        
        const existingTrack = t.tracking.find(tr => tr.item_id === item_id);
        let newTrack = t.tracking;
        if (!existingTrack) {
            newTrack = [...t.tracking, { item_id, assigned_qty: 0, returned_qty: 0, consumed_qty: 0 }];
        }
        return { ...t, requirements: newReqs, tracking: newTrack };
      }
      return t;
    }));
  }

  const issueItems = async (ticket_id: string) => {
    const ticket = tickets.find(t => t.id === ticket_id);
    if (!ticket) throw new Error("HARD FAIL: Ticket not found");
    const engId = ticket.engineer_id || ticket.assigned_engineer_id;
    if (!engId) throw new Error("HARD FAIL: Ticket has no engineer assigned. Cannot issue.");
    
    // VALIDATE AVAILABILITY BEFORE ANY MUTATION
    for (const req of ticket.requirements) {
       const available = engine.getAvailableStock(req.item_id);
       const currentlyAssigned = ticket.tracking.find(tr => tr.item_id === req.item_id)?.assigned_qty || 0;
       const deficit = req.qty - currentlyAssigned;
       
       if (deficit > 0 && available.length < deficit) {
           throw new Error(`HARD FAIL: Shortage for ${req.item_id}. Need ${deficit}, have ${available.length}`);
       }
    }

    // ATOMIC ENGINE CALLS
    let issuedMap: Record<string, number> = {};
    for (const req of ticket.requirements) {
       const currentlyAssigned = ticket.tracking.find(tr => tr.item_id === req.item_id)?.assigned_qty || 0;
       const deficit = req.qty - currentlyAssigned;
       if (deficit > 0) {
           const targetSerials = engine.getAvailableStock(req.item_id).slice(0, deficit).map(s => s.serial);
           for (const serial of targetSerials) {
               engine.assignItem(serial, engId);
           }
           issuedMap[req.item_id] = deficit;
       }
    }

    // UPDATE STATE
    setTickets(prev => prev.map(t => {
      if (t.id === ticket_id) {
          const newTrack = t.tracking.map(tr => {
              if (issuedMap[tr.item_id]) {
                  return { ...tr, assigned_qty: tr.assigned_qty + issuedMap[tr.item_id] };
              }
              return tr;
          });
          return { ...t, status: "IN_PROGRESS", tracking: newTrack };
      }
      return t;
    }));
    await fetchData();
  }

  const returnItems = async (ticket_id: string, item_id: string, qty: number) => {
    const ticket = tickets.find(t => t.id === ticket_id);
    if (!ticket) throw new Error("HARD FAIL: Ticket not found");
    const engId = ticket.engineer_id || ticket.assigned_engineer_id;
    if (!engId) throw new Error("HARD FAIL: Cannot return from unassigned ticket.");
    
    const track = ticket.tracking.find(tr => tr.item_id === item_id);
    if (!track) throw new Error("HARD FAIL: Item not tracked in ticket.");

    const maxReturnable = track.assigned_qty - track.returned_qty - track.consumed_qty;
    if (qty > maxReturnable) throw new Error(`HARD FAIL: Cannot return more than issued. Valid: ${maxReturnable}`);

    // ATOMIC ENGINE CALLS
    const assignedSerials = engine.getEngineerItems(engId).filter(i => i.item_id === item_id);
    const targetSerials = assignedSerials.slice(0, qty).map(s => s.serial);
    for (const serial of targetSerials) {
        engine.returnItem(serial);
    }

    setTickets(prev => prev.map(t => {
      if (t.id === ticket_id) {
          const newTrack = t.tracking.map(tr => tr.item_id === item_id ? { ...tr, returned_qty: tr.returned_qty + qty } : tr);
          return { ...t, tracking: newTrack };
      }
      return t;
    }));
    await fetchData();
  }

  const consumeItems = async (ticket_id: string, item_id: string, qty: number) => {
    const ticket = tickets.find(t => t.id === ticket_id);
    if (!ticket) throw new Error("HARD FAIL: Ticket not found");
    const engId = ticket.engineer_id || ticket.assigned_engineer_id;
    if (!engId) throw new Error("HARD FAIL: Cannot consume unassigned ticket.");

    const track = ticket.tracking.find(tr => tr.item_id === item_id);
    if (!track) throw new Error("HARD FAIL: Item not tracked in ticket.");

    const maxConsumable = track.assigned_qty - track.returned_qty - track.consumed_qty;
    if (qty > maxConsumable) throw new Error(`HARD FAIL: Cannot consume more than assigned. Max: ${maxConsumable}`);

    const assignedSerials = engine.getEngineerItems(engId).filter(i => i.item_id === item_id);
    const targetSerials = assignedSerials.slice(0, qty).map(s => s.serial);
    for (const serial of targetSerials) {
        engine.consumeItem(serial);
    }

    setTickets(prev => prev.map(t => {
      if (t.id === ticket_id) {
          const newTrack = t.tracking.map(tr => tr.item_id === item_id ? { ...tr, consumed_qty: tr.consumed_qty + qty } : tr);
          return { ...t, tracking: newTrack };
      }
      return t;
    }));
    await fetchData();
  }

  const completeTicket = async (ticket_id: string) => {
    const ticket = tickets.find(t => t.id === ticket_id);
    if (!ticket) throw new Error("HARD FAIL: Ticket not found");

    for (const track of ticket.tracking) {
        if (track.assigned_qty !== track.returned_qty + track.consumed_qty) {
            throw new Error(`HARD FAIL: Unbalanced inventory. Item ${track.item_id} has outstanding stock.`);
        }
    }

    setTickets(prev => prev.map(t => t.id === ticket_id ? { ...t, status: "COMPLETED" } : t));
    addLog(`TICKET COMPLETED: ${ticket_id}`);
  }

  const getTickets = () => tickets;
  const getTicketById = (id: string) => tickets.find(t => t.id === id);
  const getEngineerTickets = (engineer_id: string) => tickets.filter(t => t.engineer_id === engineer_id || t.assigned_engineer_id === engineer_id);
  const getEngineerSerials = (engineer_id: string) => engine.getEngineerItems(engineer_id);

  // LEGACY COMPAT: UI relies on updateTicket for assignment
  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    if (updates.status === 'ASSIGNED' && (updates.assigned_engineer_id || updates.engineer_id)) {
        await assignEngineer(id, (updates.assigned_engineer_id || updates.engineer_id) as string);
        return;
    }
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  // Legacy/Mock methods to keep UI uncrashing
  const addItem = async (item: any) => {
    const newItem = { ...item, id: `ITM${Date.now()}` };
    setCatalog(prev => [...prev, newItem]);
    await fetchData();
  }
  const editItem = async () => {} 
  const deleteItems = async (ids: string[]) => {
    setCatalog(prev => prev.filter(item => !ids.includes(item.id)));
    await fetchData();
  }
  const createTransaction = async () => {}

  const addEngineer = (data: { name: string, type: "IT" | "TECHNICAL" }) => {
    setEngineers(prev => [...prev, {
      id: "eng_" + Date.now(),
      name: data.name,
      type: data.type
    }]);
    addLog(`ENGINEER ADDED: ${data.name} (${data.type})`);
  }

  const value = useMemo(() => ({
    inventory,
    transactions,
    logs,
    engineers,
    tickets,
    fetchData,
    inwardItem,
    outwardItem,
    returnItem: legacyReturnItem,
    consumeItem: legacyConsumeItem,
    addLog,
    addItem,
    editItem,
    deleteItems,
    createTransaction,
    addEngineer,
    
    // Ticket Actions
    createTicket,
    updateTicket,
    assignEngineer,
    addRequirement,
    issueItems,
    returnItems,
    consumeItems,
    completeTicket,

    // Ticket Selectors
    getTickets,
    getTicketById,
    getEngineerTickets,
    getEngineerSerials,

    // Legacy Legacy
    issueAsset: (itemId: string, engineerId: string, quantity: number) => outwardItem(itemId, engineerId, quantity),
    returnAsset: async (txnId: string) => {
      const t = transactions.find(tx => tx.id === txnId)
      if (t && t.engineer_id) {
        await legacyReturnItem(t.item_id, t.engineer_id, 1)
      }
    }
  }), [inventory, transactions, logs, engineers, tickets, fetchData, addLog])

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

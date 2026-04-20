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
  barcode?: string
  model: string
  brand?: string
  gst_rate: number
  unit: string
  is_serialized: boolean
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
  reference?: string
  price?: number
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
const MOCK_CATALOG: InventoryItem[] = [
  {
    id: "ITM001",
    name: "Dell OptiPlex 7090",
    category: "Computers",
    total_qty: 0,
    assigned_qty: 0,
    location: "Main Store",
    threshold: 2,
    price: 45000,
    sku: "DELL-OPT-7090",
    model: "7090",
    brand: "Dell",
    gst_rate: 18,
    unit: "nos",
    is_serialized: true
  },
  {
    id: "ITM002",
    name: "Logitech MX Master 3",
    category: "Peripherals",
    total_qty: 0,
    assigned_qty: 0,
    location: "Main Store",
    threshold: 10,
    price: 8500,
    sku: "LOGI-MX3",
    model: "MX Master 3",
    brand: "Logitech",
    gst_rate: 18,
    unit: "nos",
    is_serialized: false
  },
  {
    id: "ITM003",
    name: "Cisco Catalyst 2960",
    category: "Networking",
    total_qty: 0,
    assigned_qty: 0,
    location: "Rack B",
    threshold: 5,
    price: 35000,
    sku: "CISCO-2960",
    model: "Catalyst 2960",
    brand: "Cisco",
    gst_rate: 18,
    unit: "nos",
    is_serialized: true
  },
  {
    id: "ITM004",
    name: "CAT6 Ethernet Cable Box (305m)",
    category: "Cables",
    total_qty: 0,
    assigned_qty: 0,
    location: "Store Room A",
    threshold: 20,
    price: 4500,
    sku: "DNET-CAT6-305",
    model: "CAT6 Unshielded",
    brand: "D-Link",
    gst_rate: 18,
    unit: "box",
    is_serialized: false
  }
];

const MOCK_ENGINEERS = [
  { id: "eng1", name: "Ravi" },
  { id: "eng2", name: "Kiran" }
];

export interface ScanEntry {
  serial: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface PurchaseLine {
  id: string
  productId: string
  name: string
  qty: number
  price: number
  gstRate: number
  isSerialized: boolean
  serials: ScanEntry[]
  isLocked: boolean
  total?: number
  brand?: string
  model?: string
}

export interface IssueLine {
    id: string
    productId: string
    name: string
    qty: number
    model: string
    brand: string
    isSerialized: boolean
    serials: string[]
    isLocked: boolean
}

export interface EngineerSerial {
  item_id: string;
  serial: string;
  status: string;
}

// -------------------------------------------------------------
// CONTEXT
// -------------------------------------------------------------
interface DataContextType {
  inventory: InventoryItem[]
  transactions: Transaction[]
  logs: Log[]
  engineers: Engineer[]
  tickets: Ticket[]
  fetchData: () => Promise<void>
  inwardItem: (itemId: string, qty: number, reference?: string) => Promise<void>
  outwardItem: (itemId: string, engineerId: string, qty: number, reference?: string) => Promise<void>
  returnItem: (itemId: string, engineerId: string, qty: number, reference?: string) => Promise<void>
  consumeItem: (itemId: string, engineerId: string, qty: number, reference?: string) => Promise<void>
  adjustItem: (itemId: string, qty: number, reference?: string) => Promise<void>
  addLog: (msg: string) => void
  addItem: (item: Partial<InventoryItem>) => Promise<void>
  editItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>
  createTransaction: (txn: Partial<Transaction>) => Promise<void>
  addEngineer: (data: { name: string, type: "IT" | "TECHNICAL" }) => void
  deleteItems: (ids: string[]) => Promise<void>
  processPO: (header: { vendor: string, date: string, reference: string }, lines: PurchaseLine[]) => Promise<void>
  issueToEngineer: (engineerId: string, lines: IssueLine[]) => Promise<void>
  processEngineerReturn: (engineerId: string, lines: any[]) => Promise<void> // Keeping any for now as return line is complex
  processBarcode: (barcode: string) => InventoryItem | undefined

  // POS SALE FLOW
  sellFromPOS: (
    cartItems: Array<{ id: string; qty: number; price?: number }>,
    customer_id: string
  ) => Promise<void>

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
  getEngineerSerials: (engineer_id: string) => EngineerSerial[]

  // Audit & Reporting
  getAuditReport: (scanned: string[]) => {
    totalSystem: number
    totalScanned: number
    missingSerials: string[]
    extraSerials: string[]
    matched: number
  }
  getAgingReport: () => any[]
  getSearchIndex: () => any[]

  // LEGACY Compat
  issueAsset: (itemId: string, engineerId: string, quantity: number) => Promise<void>
  returnAsset: (txnId: string) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [engineers, setEngineers] = useState<Engineer[]>(MOCK_ENGINEERS)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [catalog, setCatalog] = useState<InventoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('inventory_catalog');
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.length > 0 ? parsed : MOCK_CATALOG;
    }
    return MOCK_CATALOG;
  })

  // Persistence Effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('inventory_catalog', JSON.stringify(catalog));
    }
  }, [catalog]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [
      { id: Date.now().toString(), title: msg, desc: `Action`, type: 'System', time: 'Just now', message: msg, created_at: Date.now() },
      ...prev
    ])
  }, [])

  // Derived state from strict serial engine
  const fetchData = useCallback(async (currentCatalog?: InventoryItem[]) => {
    try {
      const activeCatalog = currentCatalog || catalog;
      const groupedItems = engine.getAllItemsGrouped();
      const engineTxns = engine.getTransactions();

      // 1. Group engine items by catalog product to build `InventoryItem[]`
      const parsedInventory: InventoryItem[] = activeCatalog.map(cat => {
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
        quantity: tx.quantity || 1, // support bulk inward
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
      console.error("fetchData failed:", err);
    }
  }, [catalog, engineers, addLog])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // -------------------------------------------------------------
  // EVENT LAYER BRIDGE
  // -------------------------------------------------------------
  const inwardItem = async (itemId: string, qty: number, reference?: string) => {
    // Phase 6: Inventory Engine Link
    const item = catalog.find(i => i.id === itemId);
    const isSerialized = item?.is_serialized ?? false;

    if (isSerialized) {
       // Phase 2: Serial handling (Force individual handling warning)
       console.warn("This item requires serial-level tracking");
       if (qty > 1) {
          // Rule: DO NOT allow bulk quantity logic for serialized items
          // In this mock, we'll still allow it but with the individual serialization logic below
       }
    }

    for (let i = 0; i < qty; i++) {
        engine.executeInward({
            productId: itemId,
            serial: `UNIT-${itemId}-${Date.now()}-${i}`,
            qty: 1,
            gst: item?.gst_rate || 0,
            price: item?.price || 0,
            source: reference || "MANUAL_INWARD"
        });
    }
    addLog(`INWARD: ${qty}x ${itemId}`);
    await fetchData();
  }

  const outwardItem = async (itemId: string, engineerId: string, qty: number, reference?: string) => {
    // Phase 11: Engineer Existence Check
    if (!engineers.find(e => e.id === engineerId)) {
        throw new Error(`HARD_FAIL: ENGINEER_NOT_FOUND ${engineerId}`);
    }

    const available = engine.getAvailableStock(itemId);
    if (available.length < qty) {
      throw new Error(`HARD_FAIL: OUT_OF_STOCK. Requested: ${qty}, Available: ${available.length}`);
    }
    const targetSerials = available.slice(0, qty).map(s => s.serial);
    for (const serial of targetSerials) {
        engine.assignItem(serial, engineerId, {
            from_location: "STORE",
            to_location: "ENGINEER",
            reference: reference || 'CHALLAN'
        });
    }
    addLog(`ASSIGNED: ${qty}x ${itemId} passed to ${engineerId}`);
    await fetchData();
  }

  const legacyReturnItem = async (itemId: string, engineerId: string, qty: number, reference?: string) => {
    const assigned = engine.getEngineerItems(engineerId).filter(i => i.item_id === itemId);
    if (assigned.length < qty) {
        throw new Error(`HARD_FAIL: INSUFFICIENT_ASSIGNED_STOCK. Engineer has ${assigned.length}, returning ${qty}`);
    }
    const targetSerials = assigned.slice(0, qty).map(s => s.serial);
    for (const serial of targetSerials) {
        engine.returnItem(serial, engineerId, {
            from_location: "ENGINEER",
            to_location: "STORE",
            reference: reference || 'RETURN'
        });
    }
    addLog(`RETURN: ${qty}x ${itemId} restocked from ${engineerId}`);
    await fetchData();
  }

  const legacyConsumeItem = async (itemId: string, engineerId: string, qty: number, reference?: string) => {
    const assigned = engine.getEngineerItems(engineerId).filter(i => i.item_id === itemId);
    if (assigned.length < qty) {
        throw new Error(`HARD_FAIL: INSUFFICIENT_ASSIGNED_STOCK. Engineer has ${assigned.length}, consuming ${qty}`);
    }
    const targetSerials = assigned.slice(0, qty).map(s => s.serial);
    for (const serial of targetSerials) {
        engine.consumeItem(serial, engineerId);
    }
    addLog(`CONSUMED: ${qty}x ${itemId} consumed by ${engineerId}`);
    await fetchData();
  }

  const adjustItem = async (itemId: string, qty: number, reference?: string) => {
    engine.adjustStock(itemId, qty, {
        reference: reference || 'MANUAL_ADJUSTMENT',
        reference_type: 'ADJUSTMENT',
        timestamp: Date.now()
    });
    addLog(`ADJUSTMENT: ${qty} units for ${itemId}`);
    await fetchData();
  }

  // -------------------------------------------------------------
  // POS SALE FLOW
  // -------------------------------------------------------------
  const sellFromPOS = async (
    cartItems: Array<{ id: string; qty: number; price?: number }>,
    customer_id: string
  ) => {
    if (!cartItems || cartItems.length === 0)
      throw new Error('HARD_FAIL: EMPTY_CART');

    // Phase 1: Pre-validate ALL stock before any mutation
    for (const item of cartItems) {
      const available = engine.getAvailableStock(item.id);
      if (available.length < item.qty) {
        const catalogItem = catalog.find(c => c.id === item.id);
        throw new Error(
          `HARD_FAIL: OUT_OF_STOCK for "${catalogItem?.name || item.id}". Needed: ${item.qty}, Available: ${available.length}`
        );
      }
    }

    // Phase 2: Atomic execution — sell each serial through engine
    const saleRef = `SALE-${Date.now()}`;
    let totalUnits = 0;

    for (const item of cartItems) {
      const available = engine.getAvailableStock(item.id);
      const catalogItem = catalog.find(c => c.id === item.id);
      const gstRate = catalogItem?.gst_rate ?? 0;
      const salePrice = item.price ?? catalogItem?.price ?? 0;
      const gstAmount = (salePrice * gstRate) / 100;
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;

      const targetSerials = available.slice(0, item.qty).map(s => s.serial);
      for (const serial of targetSerials) {
        engine.sellItem(serial, customer_id, {
          sale_price: salePrice,
          gst_rate: gstRate,
          cgst,
          sgst,
          igst: 0,
          reference_type: 'SALE',
          reference_id: saleRef,
        });
      }
      totalUnits += item.qty;
    }

    addLog(
      `POS_SALE: ${totalUnits} units | Customer: ${customer_id} | Ref: ${saleRef}`
    );
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
    // Point 11: Engineer Existence
    if (!engineers.find(e => e.id === engineer_id)) {
        throw new Error(`HARD_FAIL: ENGINEER_NOT_FOUND ${engineer_id}`);
    }
    
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
    if (!ticket) throw new Error("HARD_FAIL: TICKET_NOT_FOUND");
    const engId = ticket.engineer_id || ticket.assigned_engineer_id;
    if (!engId) throw new Error("HARD_FAIL: NO_ENGINEER_ASSIGNED");
    
    // VALIDATE AVAILABILITY BEFORE ANY MUTATION
    for (const req of ticket.requirements) {
       const available = engine.getAvailableStock(req.item_id);
       const currentlyAssigned = ticket.tracking.find(tr => tr.item_id === req.item_id)?.assigned_qty || 0;
       const deficit = req.qty - currentlyAssigned;
       
       if (deficit > 0 && available.length < deficit) {
           throw new Error(`HARD_FAIL: SHORTAGE_FOR_${req.item_id}. Need ${deficit}, have ${available.length}`);
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
    if (!ticket) throw new Error("HARD_FAIL: TICKET_NOT_FOUND");
    const engId = ticket.engineer_id || ticket.assigned_engineer_id;
    if (!engId) throw new Error("HARD_FAIL: NO_ENGINEER_ASSIGNED");
    
    const track = ticket.tracking.find(tr => tr.item_id === item_id);
    if (!track) throw new Error("HARD_FAIL: ITEM_NOT_TRACKED");

    const maxReturnable = track.assigned_qty - track.returned_qty - track.consumed_qty;
    if (qty > maxReturnable) throw new Error(`HARD_FAIL: OVER_RETURN. Valid: ${maxReturnable}`);

    // ATOMIC ENGINE CALLS
    const assignedSerials = engine.getEngineerItems(engId).filter(i => i.item_id === item_id);
    const targetSerials = assignedSerials.slice(0, qty).map(s => s.serial);
    for (const serial of targetSerials) {
        engine.returnItem(serial, engId);
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
    if (!ticket) throw new Error("HARD_FAIL: TICKET_NOT_FOUND");
    const engId = ticket.engineer_id || ticket.assigned_engineer_id;
    if (!engId) throw new Error("HARD_FAIL: NO_ENGINEER_ASSIGNED");

    const track = ticket.tracking.find(tr => tr.item_id === item_id);
    if (!track) throw new Error("HARD_FAIL: ITEM_NOT_TRACKED");

    const maxConsumable = track.assigned_qty - track.returned_qty - track.consumed_qty;
    if (qty > maxConsumable) throw new Error(`HARD_FAIL: OVER_CONSUME. Max: ${maxConsumable}`);

    const assignedSerials = engine.getEngineerItems(engId).filter(i => i.item_id === item_id);
    const targetSerials = assignedSerials.slice(0, qty).map(s => s.serial);
    for (const serial of targetSerials) {
        engine.consumeItem(serial, engId);
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
    if (!ticket) throw new Error("HARD_FAIL: TICKET_NOT_FOUND");

    for (const track of ticket.tracking) {
        if (track.assigned_qty !== track.returned_qty + track.consumed_qty) {
            throw new Error(`HARD_FAIL: UNBALANCED_INVENTORY_${track.item_id}. Outstanding: ${track.assigned_qty - track.returned_qty - track.consumed_qty}`);
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
    // Validation
    if (item.gst_rate < 0 || item.gst_rate > 100 || !item.unit || !item.model || typeof item.is_serialized === 'undefined') {
      throw new Error("HARD_FAIL: INVALID_ITEM_DATA");
    }

    const newItem: InventoryItem = { 
      // Rule 1: createItem() must NOT affect inventory. Stock remains 0.
      total_qty: 0,
      assigned_qty: 0,
      location: 'Main Store',
      threshold: 5,
      ...item, 
      id: `ITM${Date.now()}`,
      gst_rate: item.gst_rate ?? 0,
      unit: item.unit ?? "nos",
      model: item.model ?? "N/A",
      is_serialized: !!item.is_serialized
    };

    setCatalog(prev => {
      const next = [...prev, newItem];
      // Passing next catalog directly to fetchData to avoid stale closure/async state race
      fetchData(next);
      return next;
    });
  }
  const editItem = async (id: string, updates: Partial<InventoryItem>) => {
    setCatalog(prev => {
      const next = prev.map(item => item.id === id ? { ...item, ...updates } : item);
      fetchData(next);
      return next;
    });
  }
  const deleteItems = async (ids: string[]) => {
    setCatalog(prev => {
      const next = prev.filter(item => !ids.includes(item.id));
      fetchData(next);
      return next;
    });
  }

  const processPO = async (header: any, lines: any[]) => {
    // Phase 1: Pre-Validation (No Mutation)
    if (!lines || lines.length === 0) throw new Error("HARD_FAIL: NO_ITEMS_IN_PO");
    if (!header.supplier) throw new Error("HARD_FAIL: MISSING_SUPPLIER");
    if (!header.warehouse) throw new Error("HARD_FAIL: MISSING_WAREHOUSE");
    if (!header.invoiceNumber) throw new Error("HARD_FAIL: MISSING_INVOICE");

    // Phase 0: Resolve product IDs — give every manually-entered line a unique stable ID
    // (prevents all manual lines collapsing into one "MANUAL_ENTRY" slot)
    const resolvedLines = lines.map((line, idx) => {
      const productId =
        line.productId && line.productId !== 'MANUAL_ENTRY'
          ? line.productId
          : `ITM-${line.name.toLowerCase().replace(/[^a-z0-9]/g, '').substr(0, 8)}-${Date.now().toString(36)}-${idx}`;
      return { ...line, productId };
    });

    // Phase 1b: Auto-register new items in catalog so inventory derivation can find them
    const autoItems: InventoryItem[] = [];
    for (const line of resolvedLines) {
      const existsInCatalog = catalog.some(c => c.id === line.productId);
      if (!existsInCatalog) {
        autoItems.push({
          id: line.productId,
          name: line.name,
          category: 'General',
          total_qty: 0,         // will be derived from engine — do NOT set directly
          assigned_qty: 0,
          location: header.warehouse || 'Main Store',
          threshold: 5,
          price: line.price || 0,
          sku: `${line.name.toUpperCase().replace(/\s+/g, '-').substr(0, 10)}-${Date.now().toString(36).substr(-4)}`,
          model: line.model || 'N/A',
          brand: line.brand || 'N/A',
          gst_rate: line.gst || 18,
          unit: 'nos',
          is_serialized: !!line.isSerialized,
        });
      }
    }

    // Merged catalog: existing + newly auto-created (used synchronously below)
    const mergedCatalog = [...catalog, ...autoItems];

    // Phase 2: Build transaction batch
    const inventoryState = engine.buildState();
    const txnBatch: engine.Transaction[] = [];
    const localDuplicateDetector = new Set<string>();

    for (const line of resolvedLines) {
      if (line.isSerialized) {
        if (line.serials.length !== line.qty) {
          throw new Error(`HARD_FAIL: SERIAL_MISMATCH_${line.name}`);
        }
        line.serials.forEach((s: any) => {
          const barcode = typeof s === 'string' ? s : s.barcode;
          engine.executeInward({
            productId: line.productId,
            serial: barcode,
            qty: 1,
            gst: line.gst,
            price: line.price,
            source: "PO"
          });
        });
      } else {
        engine.executeInwardBulk({
          productId: line.productId,
          qty: line.qty,
          gst: line.gst,
          price: line.price,
          source: "PO"
        });
      }
    }

    // Phase 3: Commits are already made individually via direct integration in loop above
    // engine.executeInwardBatch(txnBatch); // Skipping to use direct calls as per Master Prompt

    // Phase 4: Register new catalog entries (if any)
    if (autoItems.length > 0) {
      setCatalog(mergedCatalog);
    }

    // Phase 5: Synchronously derive and push inventory state
    // (bypasses stale-closure issue: fetchData closes over old catalog)
    const groupedItems = engine.getAllItemsGrouped();
    const parsedInventory = mergedCatalog.map(cat => {
      const group = groupedItems.find(g => g.item_id === cat.id);
      return {
        ...cat,
        total_qty: group ? group.total_qty : 0,
        assigned_qty: group ? group.assigned_qty : 0,
      };
    });
    setInventory(parsedInventory);

    const engineTxns = engine.getTransactions();
    const parsedTxns = engineTxns.map(tx => ({
      id: tx.id,
      item_id: tx.item_id,
      type: tx.type,
      quantity: tx.quantity || 1,
      engineer_id: tx.engineer_id || 'N/A',
      status: 'COMPLETED',
      date: new Date(tx.timestamp).toISOString(),
    }));
    parsedTxns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(parsedTxns);

    addLog(
      `PO_COMMITTED: ${header.invoiceNumber} | Lines: ${resolvedLines.length} | New items: ${autoItems.length} | Batch: ${txnBatch.length} txns`
    );
  }

  const issueToEngineer = async (engineerId: string, lines: any[]) => {
    if (!lines || lines.length === 0) throw new Error("HARD_FAIL: NO_ITEMS_TO_ISSUE");
    
    for (const line of lines) {
      if (line.isSerialized) {
        line.serials.forEach((serial: string) => {
          engine.executeOutward({
            productId: line.productId,
            serial,
            qty: 1,
            destination: engineerId,
            source: "ENGINEER_ISSUE"
          });
        });
      } else {
        engine.executeOutwardBulk({
          productId: line.productId,
          qty: line.qty,
          destination: engineerId,
          source: "ENGINEER_ISSUE"
        });
      }
    }
    addLog(`ISSUE_TO_ENGINEER: ${engineerId} | Lines: ${lines.length}`);
    await fetchData();
  }

  const processEngineerReturn = async (engineerId: string, lines: any[]) => {
    if (!lines || lines.length === 0) throw new Error("HARD_FAIL: NO_ITEMS_TO_RETURN");

    for (const line of lines) {
      if (line.isSerialized) {
        line.serials.forEach((serial: string) => {
          if (line.metadata?.isConsumed) {
            engine.consumeItem(serial, {
              reference_type: "ENGINEER_CONSUMED" as any,
              engineer_id: engineerId,
              ...line.metadata
            });
          } else {
            engine.executeInward({
              productId: line.productId,
              serial,
              qty: 1,
              gst: 0,
              price: 0,
              source: "ENGINEER_RETURN",
              metadata: { engineer_id: engineerId, ...line.metadata }
            });
          }
        });
      } else {
        // Bulk return
        engine.executeInwardBulk({
          productId: line.productId,
          qty: line.qty,
          gst: 0,
          price: 0,
          source: (line.metadata?.isConsumed ? "ENGINEER_CONSUMED" : "ENGINEER_RETURN") as any
        });
      }
    }
    addLog(`ENGINEER_RETURN: ${engineerId} | Lines: ${lines.length}`);
    await fetchData();
  }
  const createTransaction = async () => {}

  const processBarcode = (barcode: string) => {
    return inventory.find(item => item.barcode === barcode || item.sku === barcode);
  }

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
    adjustItem,
    addLog,
    addItem,
    editItem,
    deleteItems,
    processPO,
    issueToEngineer,
    processEngineerReturn,
    processBarcode,
    createTransaction,
    addEngineer,

    // POS Sale Flow
    sellFromPOS,

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

    // Control Layer Selectors
    getAuditReport: (scanned: string[]) => engine.buildAuditReport(scanned),
    getAgingReport: () => engine.getAgingReport(),
    getSearchIndex: () => {
      const state = engine.buildState();
      const catalogItems = catalog.map(c => ({ id: c.id, name: c.name, type: 'PRODUCT' }));
      const serials = Object.entries(state.serialMap).map(([serial, data]) => ({
        id: serial,
        name: serial,
        type: 'SERIAL',
        status: data.status,
        item_id: data.item_id
      }));
      const engs = engineers.map(e => ({ id: e.id, name: e.name, type: 'PERSONNEL' }));
      return [...catalogItems, ...serials, ...engs];
    },

    // Legacy
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

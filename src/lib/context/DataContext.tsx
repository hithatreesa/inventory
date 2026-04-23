"use client"

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import * as engine from '../inventoryEngine'

// -------------------------------------------------------------
// UI-FACING DATA MODELS (PRESERVING LEGACY TYPES for UI to render)
// -------------------------------------------------------------
export interface GstConfig {
  id: string
  name: string
  rate: number
  hsn?: string
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  total_qty: number
  assigned_qty: number
  location: string
  threshold: number
  price: number // Sale Price (Legacy compat)
  purchase_price: number
  sale_price: number
  sku: string
  barcode: string
  model: string
  brand: string
  gst_id: string
  gst_rate: number
  hsn_code: string
  unit: string
  is_serialized: boolean
  min_stock?: number
  status: 'ACTIVE' | 'INACTIVE'
}

export interface Engineer {
  id: string
  name: string
  type?: "IT" | "TECHNICAL"
}

export interface Vendor {
  id: string
  name: string
  gstin: string
  phone: string
  email: string
  address: string
  state?: string
  contact_person?: string
  payment_terms?: string
}

const MOCK_VENDORS: Vendor[] = [
  { id: 'v1', name: 'Aether Logistics', gstin: '29ABCDE1234F1Z5', phone: '9876543210', email: 'contact@aether.com', address: 'Bangalore, KA' },
  { id: 'v2', name: 'Nexus Tech Supplies', gstin: '27XYZDE1234F2Z1', phone: '9988776655', email: 'sales@nexustech.com', address: 'Mumbai, MH' },
  { id: 'v3', name: 'Global Impex', gstin: '07ABXYZ1234F3Z2', phone: '9123456780', email: 'info@globalimpex.com', address: 'Delhi, DL' },
  { id: 'v4', name: 'Apex Hardware Solutions', gstin: '22DEFGH5678G4Y6', phone: '9876511223', email: 'support@apexhardware.com', address: 'Pune, MH' },
  { id: 'v5', name: 'Rapid Enterprises', gstin: '33HIJKL9012H5X7', phone: '9988711445', email: 'orders@rapident.com', address: 'Chennai, TN' },
  { id: 'v6', name: 'Pioneer IT Distributors', gstin: '09MNOPQ3456I6W8', phone: '9123499887', email: 'sales@pioneerit.com', address: 'Hyderabad, TS' },
  { id: 'v7', name: 'Stellar Networks', gstin: '19RSTUV7890J7V9', phone: '8877665544', email: 'noc@stellar.net', address: 'Kolkata, WB' },
  { id: 'v8', name: 'Quantum Core', gstin: '24WXYZA1234K8U0', phone: '8123456789', email: 'core@quantum.com', address: 'Ahmedabad, GJ' },
  { id: 'v9', name: 'Orion PC Parts', gstin: '11BCDEF5678L9T1', phone: '7766554433', email: 'info@orionpc.com', address: 'Jaipur, RJ' },
  { id: 'v10', name: 'Matrix Systems', gstin: '06GHIJK9012M0S2', phone: '9988771122', email: 'matrix@systems.com', address: 'Bhopal, MP' },
];

export interface ExpenseConfig {
  id: string
  name: string
  type: 'DIRECT' | 'INDIRECT'
  default_amount?: number
  gst_applicable?: boolean
  gst_rate?: number
  account_head?: string
}

const MOCK_EXPENSES: ExpenseConfig[] = [
  { id: 'exp1', name: 'Travel Allowance', type: 'DIRECT', account_head: '5001 - TRAVEL' },
  { id: 'exp2', name: 'Office Supplies', type: 'INDIRECT', account_head: '5002 - ADMIN' },
  { id: 'exp3', name: 'Internet & Telecom', type: 'DIRECT', account_head: '5003 - OPS' },
  { id: 'exp4', name: 'Refreshments', type: 'INDIRECT', account_head: '5004 - ADMIN' },
  { id: 'exp5', name: 'Hardware Repair', type: 'DIRECT', account_head: '5005 - MAINT' },
];

export interface Transaction {
  id: string
  item_id: string
  serial: string
  engineer_id?: string
  type: engine.TransactionType
  quantity: number
  status: string
  date: string
  reference?: string
  reference_id?: string
  price?: number
  amount?: number
  expense_id?: string
  sub_type?: string
  notes?: string
  timestamp: number
}

export interface Log {
  id: string
  title: string
  desc: string
  type: string
  time: string
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
    purchase_price: 38000,
    sale_price: 45000,
    sku: "DELL-OPT-7090",
    barcode: "DELL7090",
    model: "7090",
    brand: "Dell",
    gst_id: "gst18",
    gst_rate: 18,
    hsn_code: "8471",
    unit: "nos",
    is_serialized: true,
    status: 'ACTIVE'
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
    purchase_price: 6500,
    sale_price: 8500,
    sku: "LOGI-MX3",
    barcode: "LOGIMX3",
    model: "MX Master 3",
    brand: "Logitech",
    gst_id: "gst18",
    gst_rate: 18,
    hsn_code: "8471",
    unit: "nos",
    is_serialized: false,
    status: 'ACTIVE'
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
    purchase_price: 28000,
    sale_price: 35000,
    sku: "CISCO-2960",
    barcode: "CISCO2960",
    model: "Catalyst 2960",
    brand: "Cisco",
    gst_id: "gst18",
    gst_rate: 18,
    hsn_code: "8471",
    unit: "nos",
    is_serialized: true,
    status: 'ACTIVE'
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
    purchase_price: 3200,
    sale_price: 4500,
    sku: "DNET-CAT6-305",
    barcode: "DNETCAT6",
    model: "CAT6 Unshielded",
    brand: "D-Link",
    gst_id: "gst18",
    gst_rate: 18,
    hsn_code: "8471",
    unit: "box",
    is_serialized: false,
    status: 'ACTIVE'
  }
];

const MOCK_ENGINEERS: Engineer[] = [
  { id: "eng1", name: "Ravi", type: "TECHNICAL" },
  { id: "eng2", name: "Kiran", type: "IT" },
  { id: "eng3", name: "Sunil", type: "TECHNICAL" },
  { id: "eng4", name: "Arjun", type: "IT" }
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

export interface TicketRequirement {
  item_id: string;
  qty: number;
}

export interface Ticket {
  id: string;
  title: string;
  customer_name: string;
  requirements: TicketRequirement[];
  created_at?: string;
}

// -------------------------------------------------------------
// CONTEXT
// -------------------------------------------------------------
interface DataContextType {
  inventory: InventoryItem[]
  transactions: Transaction[]
  logs: Log[]
  vendors: Vendor[]
  gstConfigs: GstConfig[]
  expenseConfigs: ExpenseConfig[]
  tickets: Ticket[]
  fetchData: () => Promise<void>
  getEngineerSerials: (engineerId: string) => EngineerSerial[]
  getEngineerTickets: (engineerId: string) => Ticket[]
  addGstConfig: (config: Omit<GstConfig, 'id'>) => void
  updateGstConfig: (id: string, updates: Partial<GstConfig>) => void
  deleteGstConfig: (id: string) => void
  addExpenseConfig: (config: Omit<ExpenseConfig, 'id'>) => void
  updateExpenseConfig: (id: string, updates: Partial<ExpenseConfig>) => void
  inwardItem: (itemId: string, qty: number, reference?: string) => Promise<void>
  outwardItem: (itemId: string, engineerId: string, qty: number, reference?: string) => Promise<void>
  returnItem: (itemId: string, engineerId: string, qty: number, reference?: string) => Promise<void>
  consumeItem: (itemId: string, engineerId: string, qty: number, reference?: string) => Promise<void>
  adjustItem: (itemId: string, qty: number, reference?: string) => Promise<void>
  addLog: (msg: string) => void
  addItem: (item: Partial<InventoryItem>) => InventoryItem
  editItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>
  addVendor: (data: Partial<Vendor>) => Promise<void>
  editVendor: (id: string, updates: Partial<Vendor>) => Promise<void>
  deleteVendors: (ids: string[]) => Promise<void>
  recordExpense: (data: { expenseId: string, amount: number, date: string, reference?: string, notes?: string }) => Promise<void>
  saveTicketData: (ticketNo: string, data: { 
    customer?: string, 
    engineerId?: string, 
    items: any[], 
    expenses: any[], 
    outsideExpenses: any[], 
    revenue: number 
  }) => Promise<void>
  deleteItems: (ids: string[]) => Promise<void>
  engineers: Engineer[]
  addEngineer: (data: { name: string, type: "IT" | "TECHNICAL" }) => void
  recordManualExpense: (data: { expenseId: string, amount: number, date: string, reference?: string, notes?: string }) => Promise<void>
  processPO: (header: { vendor: string, date: string, reference: string, warehouse: string, invoiceNumber: string }, lines: PurchaseLine[], sundry?: any[]) => Promise<void>
  issueToEngineer: (engineerId: string, lines: IssueLine[]) => Promise<void>
  processEngineerReturn: (engineerId: string, lines: any[]) => Promise<void>
  processBarcode: (barcode: string) => InventoryItem | undefined

  // POS SALE FLOW
  sellFromPOS: (
    cartItems: Array<{ id: string; qty: number; price?: number }>,
    customer_id: string
  ) => Promise<void>



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
  getTicketProfit: (ticketNo: string) => engine.TicketSummary
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [engineers, setEngineers] = useState<Engineer[]>(MOCK_ENGINEERS)
  const [vendors, setVendors] = useState<Vendor[]>(MOCK_VENDORS)
  const [logs, setLogs] = useState<Log[]>([])
  const [expenseConfigs, setExpenseConfigs] = useState<ExpenseConfig[]>(MOCK_EXPENSES)
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: 'TICKET-101', title: 'Network Outage @ HQ', customer_name: 'Main Office', requirements: [{ item_id: 'ITM001', qty: 1 }] },
    { id: 'TICKET-102', title: 'Server Upgrade', customer_name: 'Data Center', requirements: [{ item_id: 'ITM002', qty: 2 }] },
  ])
  const [gstConfigs, setGstConfigs] = useState<GstConfig[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('inventory_gst_configs');
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.length > 0 ? parsed : [
        { id: 'gst-1', name: 'GST 18%', rate: 18, hsn: '8471' },
        { id: 'gst-2', name: 'GST 12%', rate: 12, hsn: '8517' },
        { id: 'gst-3', name: 'GST 5%', rate: 5, hsn: '8443' },
        { id: 'gst-4', name: 'GST 28%', rate: 28, hsn: '8703' },
        { id: 'gst-0', name: 'Exempted', rate: 0, hsn: '0000' }
      ];
    }
    return [];
  })


  // Persistence for GST
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('inventory_gst_configs', JSON.stringify(gstConfigs));
    }
  }, [gstConfigs]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [
      { id: Date.now().toString(), title: msg, desc: `Action`, type: 'System', time: 'Just now', message: msg, created_at: Date.now() },
      ...prev
    ])
  }, [])

  const addGstConfig = useCallback((config: Omit<GstConfig, 'id'>) => {
    const newConfig = { ...config, id: `gst-${Date.now()}` };
    setGstConfigs(prev => [...prev, newConfig]);
    addLog(`GST Created: ${config.name} (${config.rate}%)`);
  }, []);

  const updateGstConfig = useCallback((id: string, updates: Partial<GstConfig>) => {
    setGstConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    addLog(`GST Updated: ${id}`);
  }, []);

  const deleteGstConfig = useCallback((id: string) => {
    // Hard Rule: Check if items use this GST? For now just delete.
    setGstConfigs(prev => prev.filter(c => c.id !== id));
    addLog(`GST Deleted: ${id}`);
  }, []);






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
      const parsedTxns: Transaction[] = engineTxns.map(tx => ({
        id: tx.id,
        item_id: tx.item_id,
        serial: tx.serial,
        type: tx.type,
        quantity: tx.quantity || 1, 
        engineer_id: tx.engineer_id || 'N/A',
        status: 'COMPLETED',
        date: new Date(tx.timestamp).toISOString(),
        timestamp: tx.timestamp,
        reference: tx.reference,
        price: tx.price || tx.purchase_price || tx.sale_price,
        sub_type: tx.sub_type,
        notes: tx.notes,
        expense_id: tx.expense_id
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
    let saleTotal = 0;

    for (const item of cartItems) {
      const available = engine.getAvailableStock(item.id);
      const catalogItem = catalog.find(c => c.id === item.id);
      if (!catalogItem) throw new Error(`HARD_FAIL: ITEM_NOT_IN_MASTER: ${item.id}`);

      // SSOT: Pull price and GST strictly from Master catalog
      const masterPrice = catalogItem.sale_price || catalogItem.price || 0;
      const masterGst = catalogItem.gst_rate || 0;

      const gstAmount = (masterPrice * masterGst) / 100;
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;

      const targetSerials = available.slice(0, item.qty).map(s => s.serial);
      for (const serial of targetSerials) {
        engine.executeOutward({
          productId: item.id,
          serial,
          qty: 1,
          customer_id,
          metadata: {
            sale_price: masterPrice,
            gst_rate: masterGst,
            cgst,
            sgst,
            igst: 0,
            reference_type: 'SALE',
            reference_id: saleRef,
          }
        });
      }
      totalUnits += item.qty;
      saleTotal += (masterPrice + gstAmount) * item.qty;
    }

    addLog(
      `POS_SALE: ${totalUnits} units | Customer: ${customer_id} | Ref: ${saleRef}`
    );
    await fetchData();
  }


  // Legacy/Mock methods to keep UI uncrashing
  const addItem = useCallback((item: Partial<InventoryItem>) => {
    // 1. GST Master Validation (MANDATORY)
    const gstMatch = gstConfigs.find(g => g.rate === item.gst_rate || g.id === item.gst_id);
    if (!gstMatch) {
      throw new Error("HARD_FAIL: GST_RATE_MUST_BE_FROM_MASTER");
    }

    // 2. Uniqueness Validations
    if (!item.barcode) throw new Error("HARD_FAIL: BARCODE_REQUIRED");
    if (catalog.some(i => i.barcode === item.barcode)) {
      throw new Error(`HARD_FAIL: DUPLICATE_BARCODE: ${item.barcode}`);
    }
    if (item.sku && catalog.some(i => i.sku === item.sku)) {
      throw new Error(`HARD_FAIL: DUPLICATE_SKU: ${item.sku}`);
    }

    // 3. Required Fields
    if (!item.name) throw new Error("HARD_FAIL: NAME_REQUIRED");
    if (!item.hsn_code) throw new Error("HARD_FAIL: HSN_CODE_REQUIRED");
    if (!item.unit || !item.model || typeof item.is_serialized === 'undefined') {
      throw new Error("HARD_FAIL: INVALID_ITEM_DATA_MISSING_REQUIRED_FIELDS");
    }

    const newItem: InventoryItem = {
      id: `ITM${Date.now()}`,
      name: item.name,
      category: item.category || 'General',
      total_qty: 0,
      assigned_qty: 0,
      location: item.location || 'Main Store',
      threshold: item.threshold || 5,
      gst_id: gstMatch.id,
      gst_rate: gstMatch.rate,
      hsn_code: item.hsn_code,
      purchase_price: Number(item.purchase_price) || 0,
      sale_price: Number(item.sale_price) || 0,
      price: Number(item.sale_price) || 0, // Legacy compat
      sku: item.sku || '',
      barcode: item.barcode,
      model: item.model,
      brand: item.brand || 'N/A',
      unit: item.unit,
      is_serialized: !!item.is_serialized,
      min_stock: item.min_stock || 0,
      status: item.status || 'ACTIVE'
    };

    setCatalog(prev => {
      const next = [...prev, newItem];
      fetchData(next);
      return next;
    });
    addLog(`ITEM CREATED: ${newItem.name} | SKU: ${newItem.sku} | GST: ${newItem.gst_rate}%`);
    return newItem;
  }, [catalog, gstConfigs, fetchData, addLog]);

  const addVendor = async (data: Partial<Vendor>) => {
    setVendors(prev => [...prev, { ...data, id: `VEND-${Date.now()}` } as Vendor]);
    addLog(`VENDOR CREATED: ${data.name}`);
  }

  const editVendor = async (id: string, updates: Partial<Vendor>) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    addLog(`VENDOR UPDATED: ${id}`);
  }

  const deleteVendors = async (ids: string[]) => {
    setVendors(prev => prev.filter(v => !ids.includes(v.id)));
    addLog(`VENDORS PURGED: ${ids.length} records`);
  }

  const editItem = async (id: string, updates: Partial<InventoryItem>) => {
    setCatalog(prev => {
      const next = prev.map(item => item.id === id ? { ...item, ...updates } : item);
      fetchData(next);
      return next;
    });
  }
 
  const recordExpense = async (data: { expenseId: string, amount: number, date: string, reference?: string, notes?: string }) => {
    const expense = expenseConfigs.find(e => e.id === data.expenseId);
    if (!expense) throw new Error("HARD_FAIL: INVALID_EXPENSE_TYPE");
 
    const newTxn: Transaction = {
      id: `TXN-EXP-${Date.now()}`,
      item_id: 'N/A',
      serial: `EXP-${Date.now()}`,
      type: 'EXPENSE',
      quantity: 1,
      amount: data.amount,
      expense_id: expense.name,
      status: 'COMPLETED',
      date: data.date,
      timestamp: Date.now(),
      reference: data.reference
    };
 
    setTransactions(prev => [newTxn, ...prev]);
    addLog(`EXPENSE RECORDED: ${expense.name} | Amount: ₹${data.amount}`);
  }
 
  const saveTicketData = async (ticketNo: string, data: any) => {
    if (!ticketNo) throw new Error("HARD_FAIL: MISSING_TICKET");

    // Phase 1: Filter out existing transactions for this ticket (Atomically replace)
    const otherTxns = transactions.filter(t => t.reference !== ticketNo);
    const newTicketTxns: Transaction[] = [];

    // Phase 2: Map UI state to Ledger Transactions
    
    // Items (OUTWARD)
    data.items.forEach((item: any) => {
      // Rule: Serialized items must have a serial. Non-serialized use item_id as serial.
      const serial = item.serial || item.itemId; 
      
      newTicketTxns.push({
        id: `TXN-TKT-ITM-${Date.now()}-${Math.random()}`,
        item_id: item.itemId,
        serial: serial,
        type: 'OUTWARD',
        quantity: item.qty,
        amount: item.cost * item.qty,
        price: item.cost,
        engineer_id: data.engineerId || 'N/A',
        status: 'COMPLETED',
        date: new Date().toISOString().split('T')[0],
        reference: ticketNo,
        notes: `Ticket Usage: ${item.name}${data.customer ? ` | ${data.customer}` : ''}`,
        timestamp: Date.now()
      });
    });

    // Expenses
    data.expenses.concat(data.outsideExpenses || []).forEach((exp: any) => {
      newTicketTxns.push({
        id: `TXN-TKT-EXP-${Date.now()}-${Math.random()}`,
        item_id: 'EXPENSE',
        serial: `EXP-${Date.now()}-${Math.random()}`,
        type: 'EXPENSE',
        sub_type: exp.sub_type || 'INTERNAL',
        quantity: 1,
        amount: Number(exp.amount),
        price: Number(exp.amount),
        expense_id: exp.name,
        engineer_id: data.engineerId || 'N/A',
        status: 'COMPLETED',
        date: new Date().toISOString().split('T')[0],
        reference: ticketNo,
        timestamp: Date.now()
      });
    });

    // Revenue
    if (Number(data.revenue) !== 0) {
      newTicketTxns.push({
        id: `TXN-TKT-REV-${Date.now()}-${Math.random()}`,
        item_id: 'REVENUE',
        serial: `REV-${Date.now()}-${Math.random()}`,
        type: 'REVENUE',
        quantity: 1,
        amount: Number(data.revenue),
        price: Number(data.revenue),
        engineer_id: data.engineerId || 'N/A',
        status: 'COMPLETED',
        date: new Date().toISOString().split('T')[0],
        reference: ticketNo,
        timestamp: Date.now()
      });
    }

    // Phase 3: Validate ALL new transactions before committing
    newTicketTxns.forEach(txn => {
      engine.validateTransaction(txn, [...newTicketTxns, ...otherTxns]);
    });

    // Phase 4: Atomic Update
    setTransactions([...newTicketTxns, ...otherTxns]);
    addLog(`TICKET_COMMITTED: ${ticketNo} | Total Entries: ${newTicketTxns.length}`);
    await fetchData();
  }
 
  const deleteItems = async (ids: string[]) => {
    setCatalog(prev => {
      const next = prev.filter(item => !ids.includes(item.id));
      fetchData(next);
      return next;
    });
  }

  const processPO = async (header: { vendor: string, date: string, reference: string, warehouse: string, invoiceNumber: string }, lines: PurchaseLine[], sundry: any[] = []) => {
    // Phase 1: Pre-Validation
    if (!lines || lines.length === 0) throw new Error("HARD_FAIL: NO_ITEMS_IN_PO");
    if (!header.vendor) throw new Error("HARD_FAIL: MISSING_VENDOR");
    if (!header.warehouse) throw new Error("HARD_FAIL: MISSING_WAREHOUSE");
    if (!header.invoiceNumber) throw new Error("HARD_FAIL: MISSING_INVOICE_NUMBER");

    // Phase 2: Master Verification & Serialization Rule Check
    for (const line of lines) {
      const masterItem = catalog.find(i => i.id === line.productId);
      if (!masterItem) {
        throw new Error(`HARD_FAIL: ITEM_NOT_IN_MASTER: ${line.name}. All items must be selected from Master Data.`);
      }

      if (masterItem.is_serialized) {
        if (!line.serials || line.serials.length !== line.qty) {
          throw new Error(`HARD_FAIL: SERIAL_MISMATCH for ${line.name}. Scanned: ${line.serials?.length || 0}/${line.qty}`);
        }

        // Check for duplicates in current session or system
        for (const s of line.serials) {
          const serial = typeof s === 'string' ? s : s.serial;
          const history = engine.getSerialHistory(serial);
          if (history.length > 0) {
            throw new Error(`HARD_FAIL: DUPLICATE_SERIAL_DETECTED: ${serial}`);
          }
        }
      }
    }

    // Phase 3: Execute Inward via Engine
    for (const line of lines) {
      const masterItem = catalog.find(i => i.id === line.productId)!;
      if (masterItem.is_serialized) {
        line.serials.forEach((s: any) => {
          const serial = typeof s === 'string' ? s : s.serial;
          engine.executeInward({
            productId: line.productId,
            serial,
            qty: 1,
            gst: masterItem.gst_rate,
            price: line.price, // PO price snapshot
            source: "PO",
            metadata: { reference: header.reference, invoice: header.invoiceNumber, supplier: header.vendor }
          });
        });
      } else {
        engine.executeInwardBulk({
          productId: line.productId,
          qty: line.qty,
          gst: masterItem.gst_rate,
          price: line.price,
          source: "PO",
          metadata: { reference: header.reference, invoice: header.invoiceNumber, supplier: header.vendor }
        });
      }
    }

    // Phase 4: Handle Bill Sundry (Expenses)
    const sundryTxns: Transaction[] = sundry.map(s => {
      const amount = Number(s.amount) || 0;
      const expId = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      return {
        id: expId,
        item_id: 'N/A',
        serial: expId,
        engineer_id: 'N/A',
        type: 'EXPENSE',
        quantity: 1,
        amount: amount,
        gst_rate: s.gstRate || 0,
        status: 'COMPLETED',
        date: header.date,
        timestamp: Date.now(),
        reference: header.reference
      };
    });

    if (sundryTxns.length > 0) {
      setTransactions(prev => [...sundryTxns, ...prev]);
    }

    addLog(`PO_PROCESSED: ${header.invoiceNumber} | Items: ${lines.length} | Expenses: ${sundry.length}`);
    await fetchData();
  }

  const issueToEngineer = async (engineerId: string, lines: any[]) => {
    if (!lines || lines.length === 0) throw new Error("HARD_FAIL: NO_ITEMS_TO_ISSUE");

    for (const line of lines) {
      if (line.isSerialized) {
        line.serials.forEach((serial: string) => {
          engine.assignItem(serial, engineerId, {
            reference: "ENGINEER_ISSUE"
          });
        });
      } else {
        // Bulk issue logic (creates individual units for tracking)
        for (let i = 0; i < line.qty; i++) {
          const serial = `BULK-ISSUE-${line.productId}-${Date.now()}-${i}`;
          engine.commitTransaction({
            type: "ASSIGN",
            serial,
            item_id: line.productId,
            quantity: 1,
            engineer_id: engineerId,
            reference: "ENGINEER_ISSUE"
          });
        }
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
            engine.consumeItem(serial, engineerId, {
              ...line.metadata,
              notes: "Engineer Consumed"
            });
          } else {
            engine.returnItem(serial, engineerId, {
              ...line.metadata,
              notes: "Engineer Return"
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
  const createTransaction = async () => { }

  const processBarcode = (barcode: string) => {
    return inventory.find(item => item.barcode === barcode || item.sku === barcode);
  }

  const getEngineerSerials = useCallback((engineerId: string) => {
    return engine.getEngineerItems(engineerId).map(item => ({
      item_id: item.item_id,
      serial: item.serial,
      status: item.status
    }));
  }, [transactions]);

  const getEngineerTickets = useCallback((engineerId: string) => {
    return tickets.filter(t => 
      transactions.some(tx => (tx.reference === t.id || tx.reference_id === t.id) && tx.engineer_id === engineerId)
    );
  }, [transactions, tickets]);

  const value = useMemo(() => ({
    inventory,
    transactions,
    logs,
    engineers,
    vendors,
    tickets,
    getEngineerSerials,
    getEngineerTickets,
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
    addVendor,
    editVendor,
    deleteVendors,
    recordExpense,
    recordManualExpense: recordExpense,
    saveTicketData,
    getTicketProfit: (ticketNo: string) => engine.getTicketProfit(ticketNo, transactions),
    addEngineer: (data: { name: string, type: "IT" | "TECHNICAL" }) => {
      setEngineers(prev => [...prev, { id: "eng_" + Date.now(), name: data.name, type: data.type }]);
      addLog(`ENGINEER CREATED: ${data.name}`);
    },
 
    // POS Sale Flow
    sellFromPOS,
 
    gstConfigs,
    addGstConfig,
    updateGstConfig,
    deleteGstConfig,
    addExpenseConfig: (data: any) => {
      setExpenseConfigs(prev => [...prev, { ...data, id: "exp_" + Date.now() }]);
      addLog(`EXPENSE TYPE CREATED: ${data.name}`);
    },
    updateExpenseConfig: (id: string, data: any) => {
      setExpenseConfigs(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
      addLog(`EXPENSE TYPE UPDATED: ${id}`);
    },
 
    expenseConfigs,
 
    // Control Layer Selectors
    getAuditReport: (scanned: string[]) => engine.buildAuditReport(scanned),
    getAgingReport: () => engine.getAgingReport(transactions),
    getSearchIndex: () => {
      const state = engine.buildState(transactions);
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
  }), [inventory, transactions, logs, engineers, vendors, tickets, gstConfigs, expenseConfigs, fetchData, getEngineerSerials, getEngineerTickets, addLog, addVendor, editVendor, deleteVendors, addItem, editItem, deleteItems, addGstConfig, updateGstConfig, deleteGstConfig, sellFromPOS])

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

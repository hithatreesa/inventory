"use client"

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import * as engine from '../inventoryEngine'
import { LedgerTracking } from '../../modules/ledger/types'

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

export interface Contact {
  id: string
  name: string
  type: 'VENDOR' | 'CLIENT'
  gstin: string
  phone: string
  email: string
  address: string
  state?: string
  contact_person?: string
  payment_terms?: string
}

const MOCK_CONTACTS: Contact[] = [
  { id: 'v1', name: 'Aether Logistics', type: 'VENDOR', gstin: '29ABCDE1234F1Z5', phone: '9876543210', email: 'contact@aether.com', address: 'Bangalore, KA' },
  { id: 'v2', name: 'Nexus Tech Supplies', type: 'VENDOR', gstin: '27XYZDE1234F2Z1', phone: '9988776655', email: 'sales@nexustech.com', address: 'Mumbai, MH' },
  { id: 'v3', name: 'Global Impex', type: 'VENDOR', gstin: '07ABXYZ1234F3Z2', phone: '9123456780', email: 'info@globalimpex.com', address: 'Delhi, DL' },
  { id: 'v4', name: 'Apex Hardware Solutions', type: 'VENDOR', gstin: '22DEFGH5678G4Y6', phone: '9876511223', email: 'support@apexhardware.com', address: 'Pune, MH' },
  { id: 'v5', name: 'Rapid Enterprises', type: 'VENDOR', gstin: '33HIJKL9012H5X7', phone: '9988711445', email: 'orders@rapident.com', address: 'Chennai, TN' },
  { id: 'v6', name: 'Pioneer IT Distributors', type: 'VENDOR', gstin: '09MNOPQ3456I6W8', phone: '9123499887', email: 'sales@pioneerit.com', address: 'Hyderabad, TS' },
  { id: 'v7', name: 'Stellar Networks', type: 'VENDOR', gstin: '19RSTUV7890J7V9', phone: '8877665544', email: 'noc@stellar.net', address: 'Kolkata, WB' },
  { id: 'v8', name: 'Quantum Core', type: 'VENDOR', gstin: '24WXYZA1234K8U0', phone: '8123456789', email: 'core@quantum.com', address: 'Ahmedabad, GJ' },
  { id: 'c1', name: 'Acme Corp', type: 'CLIENT', gstin: '27AAAAA1234A1Z5', phone: '8001234567', email: 'billing@acmecorp.com', address: 'Mumbai, MH' },
  { id: 'c2', name: 'Globex Inc', type: 'CLIENT', gstin: '07BBBBB1234B2Z1', phone: '8009876543', email: 'accounts@globex.com', address: 'New Delhi, DL' },
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

export interface SystemRole {
  id: string
  name: string
  accessibleModules: string[] // e.g. ['dashboard', 'engineers', 'inventory', 'pos', 'purchase', 'sales', 'expense', 'reports', 'master']
}

export interface InvoiceRecord {
  id: string;
  customer: string;
  date: string;
  lines: any[];
  subtotal: number;
  gst_total: number;
  grand_total: number;
  status: 'FINAL';
  timestamp: number;
  gstType?: string;
}

export interface SystemUser {
  id: string
  name: string
  email: string
  roleId: string
  status: 'ACTIVE' | 'INACTIVE'
  lastLogin?: string
}

const ALL_MODULES = ['dashboard', 'engineers', 'users', 'inventory', 'pos', 'purchase', 'sales', 'expense', 'reports', 'master'];

const MOCK_ROLES: SystemRole[] = [
  { id: 'role-1', name: 'Super Admin', accessibleModules: [...ALL_MODULES] },
  { id: 'role-2', name: 'Inventory Manager', accessibleModules: ['dashboard', 'inventory', 'master', 'reports'] },
  { id: 'role-3', name: 'Sales Executive', accessibleModules: ['dashboard', 'pos', 'sales'] },
  { id: 'role-4', name: 'Procurement Officer', accessibleModules: ['dashboard', 'purchase', 'inventory'] },
];

const MOCK_USERS: SystemUser[] = [
  { id: 'user-1', name: 'Admin User', email: 'admin@terait.com', roleId: 'role-1', status: 'ACTIVE', lastLogin: '2024-04-26T10:30:00Z' },
  { id: 'user-2', name: 'Sarah Stock', email: 'sarah@terait.com', roleId: 'role-2', status: 'ACTIVE', lastLogin: '2024-04-27T08:15:00Z' },
  { id: 'user-3', name: 'John Sales', email: 'john@terait.com', roleId: 'role-3', status: 'ACTIVE', lastLogin: '2024-04-25T16:45:00Z' },
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
  ticket_id?: string
  source?: 'PURCHASE' | 'OUTSIDE_PURCHASE'
  affects_stock?: boolean
  cost?: number
  price?: number
  amount?: number
  expense_id?: string
  sub_type?: string
  notes?: string
  customer_name?: string
  supplier?: string
  gst_rate?: number
  purchase_price?: number
  warehouse_id?: string
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
  barcode?: string;
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
  tracking?: LedgerTracking[]
  isLocked: boolean
  total?: number
  brand?: string
  model?: string
  ticket_id?: string
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
  currentTicket: string;
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
  contacts: Contact[]
  gstConfigs: GstConfig[]
  expenseConfigs: ExpenseConfig[]
  tickets: Ticket[]
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>
  invoices: InvoiceRecord[]
  finalizeBill: (invoice: InvoiceRecord) => Promise<void>
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
  // Stock Lookups
  getAvailableStock: (productId: string) => any[]

  addItem: (item: Partial<InventoryItem>) => Promise<void>
  editItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>
  addContact: (data: Partial<Contact>) => Promise<void>
  editContact: (id: string, updates: Partial<Contact>) => Promise<void>
  deleteContacts: (ids: string[]) => Promise<void>
  recordExpense: (data: { expenseId: string, amount: number, date: string, reference?: string, notes?: string }) => Promise<void>
  saveTicketData: (ticketNo: string, data: {
    customer?: string,
    engineerId?: string,
    items: { itemId: string, name: string, qty: number, cost: number, serial?: string }[],
    expenses: { id: string, name: string, amount: number }[],
    outsideExpenses: { id: string, name: string, amount: number }[],
    revenue: number,
    date?: string
  }) => Promise<void>
  deleteItems: (ids: string[]) => Promise<void>
  engineers: Engineer[]
  addEngineer: (data: { name: string, type: "IT" | "TECHNICAL" }) => void
  recordManualExpense: (data: { expenseId: string, amount: number, date: string, reference?: string, notes?: string }) => Promise<void>
  recordOutsidePurchase: (data: { 
    item_name: string, 
    qty: number, 
    cost: number, 
    ticket_id: string,
    notes?: string
  }) => Promise<void>
  processPO: (header: { vendor: string, date: string, reference: string, warehouse: string, invoiceNumber: string }, lines: PurchaseLine[], sundry?: any[]) => Promise<void>
  processInward: (header: { vendor: string, date: string, reference: string, warehouse: string, invoiceNumber: string }, lines: PurchaseLine[], sundry?: any[]) => Promise<void>
  issueToEngineer: (engineerId: string, lines: IssueLine[]) => Promise<void>
  processEngineerReturn: (engineerId: string, lines: any[]) => Promise<void>
  processJournal: (engineerId: string, lines: { serial: string, from_ticket: string, to_ticket: string }[]) => Promise<void>
  processBarcode: (barcode: string) => InventoryItem | undefined
  verifySerialForIssue: (serial: string, productId: string) => boolean
  createTransaction: () => Promise<void>
  // POS SALE FLOW
  sellFromPOS: (
    cartItems: Array<{ id: string; qty: number; price?: number; serials?: string[] }>,
    customer_id: string
  ) => Promise<void>



  // Audit & Reporting
  getAuditReport: (scanned: string[]) => any
  getAgingReport: () => any
  getSearchIndex: () => any
  getTicketProfit: (ticketNo: string) => any

  // RBAC
  users: SystemUser[]
  roles: SystemRole[]
  allModules: string[]
  currentUser: SystemUser | null
  addUser: (user: Omit<SystemUser, 'id'>) => void
  editUser: (id: string, updates: Partial<SystemUser>) => void
  deleteUser: (id: string) => void
  addRole: (role: Omit<SystemRole, 'id'>) => void
  editRole: (id: string, updates: Partial<SystemRole>) => void

  // RBAC EXTENDED
  permissionConfig: typeof engine.PERMISSION_CONFIG
  userPermissions: engine.UserPermission[]
  updateUserPermission: (userId: string, moduleId: string, divisionId: string, allowed: boolean) => void
  bulkUpdateModulePermissions: (userId: string, moduleId: string, allowed: boolean) => void
  getUserPermissions: (userId: string) => engine.UserPermission[]
  checkUserPermission: (userId: string, moduleId: string, divisionId: string) => boolean

  // Sales & Invoicing
  processSalesInvoice: (invoice: {
    id: string,
    customer_id: string,
    date: string | number,
    lines: Array<{
      ticket_id: string,
      description: string,
      amount: number,
      gst_rate?: number,
      igst?: number,
      cgst?: number,
      sgst?: number
    }>,
    total_amount: number,
    total_igst?: number,
    total_cgst?: number,
    total_sgst?: number
  }) => Promise<void>
  getTicketBillableSummary: (ticketId: string) => { consumedAmount: number, expenseAmount: number, total: number }

  // LEGACY Compat
  issueAsset: (itemId: string, engineerId: string, quantity: number) => Promise<void>
  returnAsset: (txnId: string) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [engineers, setEngineers] = useState<Engineer[]>(MOCK_ENGINEERS)
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS)
  const [logs, setLogs] = useState<Log[]>([])
  const [expenseConfigs, setExpenseConfigs] = useState<ExpenseConfig[]>(MOCK_EXPENSES)
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: 'TICKET-101', title: 'Network Outage @ HQ', customer_name: 'Main Office', requirements: [{ item_id: 'ITM001', qty: 1 }] },
    { id: 'TICKET-102', title: 'Server Upgrade', customer_name: 'Data Center', requirements: [{ item_id: 'ITM002', qty: 2 }] },
    { id: 'TICKET-103', title: 'Network Expansion - Phase 1', customer_name: 'Main Office', requirements: [
      { item_id: 'Configuration Charges', qty: 1 },
      { item_id: 'Installation Charges', qty: 1 }
    ] },
    { id: 'TICKET-104', title: 'Camera Installation (12 units)', customer_name: 'Main Office', requirements: [
      { item_id: 'ITM003', qty: 12 },
      { item_id: 'Camera Termination', qty: 12 },
      { item_id: 'DVR Configuration', qty: 1 }
    ] },
    { id: 'TICKET-105', title: 'Annual Maintenance Contract', customer_name: 'Main Office', requirements: [
      { item_id: 'Service Charges', qty: 1 }
    ] },
  ])
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('erp_invoices');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('erp_invoices', JSON.stringify(invoices));
  }, [invoices]);

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

  const [users, setUsers] = useState<SystemUser[]>(MOCK_USERS)
  const [roles, setRoles] = useState<SystemRole[]>(MOCK_ROLES)
  const [userPermissions, setUserPermissions] = useState<engine.UserPermission[]>([])

  useEffect(() => {
    // Initial permissions load
    if (users.length > 0) {
      const allPerms: engine.UserPermission[] = []
      users.forEach(u => {
        allPerms.push(...engine.getUserPermissions(u.id))
      })
      setUserPermissions(allPerms)
    }
  }, [users])

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [
      { id: Date.now().toString(), title: msg, desc: `Action`, type: 'System', time: 'Just now', message: msg, created_at: Date.now() },
      ...prev
    ])
  }, [])

  const updateUserPermission = useCallback((userId: string, moduleId: string, divisionId: string, allowed: boolean) => {
    const updated = engine.updateUserPermission(userId, moduleId, divisionId, allowed)
    // Update local state by merging
    setUserPermissions(prev => {
      const filtered = prev.filter(p => !(p.userId === userId && p.moduleId === moduleId && p.divisionId === divisionId))
      return [...filtered, { userId, moduleId, divisionId, allowed }]
    })
    addLog(`PERMISSION_UPDATED: ${userId} | ${moduleId}:${divisionId} -> ${allowed}`)
  }, [addLog])

  const bulkUpdateModulePermissions = useCallback((userId: string, moduleId: string, allowed: boolean) => {
    const updated = engine.bulkUpdateModulePermissions(userId, moduleId, allowed)
    setUserPermissions(prev => {
      const filtered = prev.filter(p => !(p.userId === userId && p.moduleId === moduleId))
      return [...filtered, ...updated]
    })
    addLog(`BULK_PERMISSION_UPDATED: ${userId} | ${moduleId} -> ${allowed}`)
  }, [addLog])

  const checkUserPermission = useCallback((userId: string, moduleId: string, divisionId: string) => {
    return engine.checkPermission(userId, moduleId, divisionId)
  }, [])

  const getUserPermissions = useCallback((userId: string) => {
    return userPermissions.filter(p => p.userId === userId)
  }, [userPermissions])


  // Persistence for GST
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('inventory_gst_configs', JSON.stringify(gstConfigs));
    }
  }, [gstConfigs]);


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

  const addUser = useCallback((user: Omit<SystemUser, 'id'>) => {
    const newUser = { ...user, id: `user-${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
    addLog(`User Created: ${user.name}`);
  }, []);

  const editUser = useCallback((id: string, updates: Partial<SystemUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    addLog(`User Updated: ${id}`);
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    addLog(`User Deleted: ${id}`);
  }, []);

  const addRole = useCallback((role: Omit<SystemRole, 'id'>) => {
    const newRole = { ...role, id: `role-${Date.now()}` };
    setRoles(prev => [...prev, newRole]);
    addLog(`Role Created: ${role.name}`);
  }, []);

  const editRole = useCallback((id: string, updates: Partial<SystemRole>) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    addLog(`Role Permissions Updated: ${id}`);
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
        expense_id: tx.expense_id,
        supplier: tx.supplier,
        warehouse_id: tx.warehouse_id || (tx as any).metadata?.warehouse_id
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

  const finalizeBill = async (invoice: InvoiceRecord) => {
    // Phase 1: Atomically commit transactions for each line
    for (const line of invoice.lines) {
      const gstAmount = (line.price * line.gstRate) / 100;
      const totalLineAmount = line.amount + (gstAmount * line.qty);

      // Rule: Record Revenue for every line
      engine.commitTransaction({
        type: "REVENUE",
        item_id: line.productId || 'SERVICE',
        serial: `REV-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        quantity: line.qty,
        amount: totalLineAmount,
        price: line.price,
        gst_rate: line.gstRate,
        cgst: (gstAmount * line.qty) / 2,
        sgst: (gstAmount * line.qty) / 2,
        reference: line.ticketId || invoice.id,
        reference_type: 'SALE',
        reference_id: invoice.id,
        customer_id: invoice.customer,
        notes: line.description,
        timestamp: Date.now()
      });

      // Rule: If it's a physical product AND NOT linked to a ticket, reduce stock
      // (If linked to a ticket, stock was already reduced during ticket assignment/usage)
      if (line.productId && !line.ticketId) {
        const available = engine.getAvailableStock(line.productId);
        
        // Handle serialization
        let targetSerials: string[] = [];
        if (line.serials && line.serials.length > 0) {
          targetSerials = line.serials;
        } else {
          targetSerials = available.slice(0, line.qty).map(s => s.serial);
        }

        for (const serial of targetSerials) {
          engine.executeOutward({
            productId: line.productId,
            serial,
            qty: 1,
            customer_id: invoice.customer,
            metadata: {
              reference: invoice.id,
              reference_type: 'SALE',
              reference_id: invoice.id,
              notes: `Direct Sale: ${invoice.id}`
            }
          });
        }
      }
    }

    setInvoices(prev => [...prev, invoice]);
    addLog(`BILLED: ${invoice.id} for ${invoice.customer} | Total: ₹${invoice.grand_total.toFixed(2)}`);
    await fetchData();
  };

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
    cartItems: Array<{ 
      id: string; 
      qty: number; 
      price?: number; 
      gstRate?: number; 
      name?: string; 
      serials?: string[];
      ticketId?: string;
    }>,
    customer_id: string
  ) => {
    if (!cartItems || cartItems.length === 0)
      throw new Error('HARD_FAIL: EMPTY_CART');

    const saleRef = `POS-${Date.now()}`;
    
    // 1. Calculate totals using central ledger logic if possible, or build manually
    let subtotal = 0;
    let totalTax = 0;

    const invoiceLines = cartItems.map(item => {
      const catalogItem = inventory.find(c => c.id === item.id);
      const price = catalogItem ? (catalogItem.sale_price || catalogItem.price || 0) : (Number(item.price) || 0);
      const gstRate = catalogItem ? (catalogItem.gst_rate || 0) : (Number(item.gstRate) || 0);
      const amount = price * item.qty;
      const gstAmount = (amount * gstRate) / 100;

      subtotal += amount;
      totalTax += gstAmount;

      return {
        productId: item.id,
        description: item.name || catalogItem?.name || item.id,
        qty: item.qty,
        price: price,
        gstRate: gstRate,
        amount: amount,
        serials: item.serials || [],
        ticketId: item.ticketId
      };
    });

    const invoice: InvoiceRecord = {
      id: saleRef,
      customer: customer_id,
      date: new Date().toISOString().split('T')[0],
      lines: invoiceLines,
      subtotal: subtotal,
      gst_total: totalTax,
      grand_total: Math.round(subtotal + totalTax),
      status: 'FINAL',
      timestamp: Date.now(),
      gstType: 'LGST 18%' // Default for POS
    };

    // 2. Finalize using unified billing engine (Handles Stock + Revenue + Invoice State)
    await finalizeBill(invoice);
    
    addLog(`POS_SALE_COMMITTED: ${saleRef} | Total: ₹${invoice.grand_total}`);
  }


  // Legacy/Mock methods to keep UI uncrashing
  const addItem = useCallback(async (item: Partial<InventoryItem>) => {
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
  }, [catalog, gstConfigs, fetchData, addLog]);

  const addContact = async (data: Partial<Contact>) => {
    setContacts(prev => [...prev, { ...data, id: `CONT-${Date.now()}` } as Contact]);
    addLog(`CONTACT CREATED: ${data.name}`);
  }

  const editContact = async (id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    addLog(`CONTACT UPDATED: ${id}`);
  }

  const deleteContacts = async (ids: string[]) => {
    setContacts(prev => prev.filter(c => !ids.includes(c.id)));
    addLog(`CONTACTS PURGED: ${ids.length} records`);
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

  const recordOutsidePurchase = async (data: { 
    item_name: string, 
    qty: number, 
    cost: number, 
    ticket_id: string,
    notes?: string
  }) => {
    if (!data.ticket_id) throw new Error("HARD_FAIL: TICKET_ID_REQUIRED");
    if (data.qty <= 0) throw new Error("HARD_FAIL: INVALID_QTY");
    if (data.cost <= 0) throw new Error("HARD_FAIL: INVALID_COST");

    engine.commitTransaction({
      id: `TXN-OP-${Date.now()}`,
      item_id: data.item_name,
      serial: `OP-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'OUTSIDE_PURCHASE',
      quantity: data.qty,
      cost: data.cost,
      amount: data.cost * data.qty,
      source: 'OUTSIDE_PURCHASE',
      affects_stock: false,
      status: 'COMPLETED',
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      reference: data.ticket_id,
      ticket_id: data.ticket_id,
      notes: data.notes
    });

    addLog(`OUTSIDE PURCHASE RECORDED: ${data.item_name} for ${data.ticket_id}`);
    await fetchData();
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
        customer_name: data.customer,
        status: 'COMPLETED',
        date: data.date || new Date().toISOString().split('T')[0],
        reference: ticketNo,
        notes: `Ticket Usage: ${item.name}`,
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

    // Phase 2: Verification & Serialization Rule Check
    for (const line of lines) {
      const masterItem = catalog.find(i => i.id === line.productId);
      const isSerialized = masterItem?.is_serialized || line.isSerialized || false;

      if (isSerialized) {
        // If dual tracking is provided, use it. Otherwise fall back to serials.
        const trackingCount = line.tracking?.length || line.serials?.length || 0;
        if (trackingCount !== line.qty) {
          throw new Error(`HARD_FAIL: TRACKING_MISMATCH for ${line.name}. Scanned: ${trackingCount}/${line.qty}`);
        }

        // Check for duplicates
        if (line.tracking) {
          for (const t of line.tracking) {
            if (engine.getSerialHistory(t.serial).length > 0) throw new Error(`HARD_FAIL: DUPLICATE_SERIAL: ${t.serial}`);
            // Note: we could also check barcode history if we had a getBarcodeHistory
          }
        } else if (line.serials) {
          for (const s of line.serials) {
            const serial = typeof s === 'string' ? s : (s as any).serial;
            if (engine.getSerialHistory(serial).length > 0) throw new Error(`HARD_FAIL: DUPLICATE_SERIAL: ${serial}`);
          }
        }
      }
    }

    // Phase 3: PO DOES NOT AFFECT STOCK
    // As per Core Rule: PO -> Planning / Approval.
    // Stock is only changed during ENTRY (INWARD).
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

    // Phase 5: Commit PO Transactions (Soft record - No stock change)
    for (const line of lines) {
      const isTemp = !line.productId || line.productId.startsWith('TEMP_');
      const productId = isTemp ? `TEMP_${line.name.replace(/\s+/g, '_').toUpperCase()}` : line.productId;

      if (line.tracking && line.tracking.length > 0) {
        for (const t of line.tracking) {
          engine.commitTransaction({
            type: "PO",
            item_id: productId,
            serial: t.serial,
            barcode: t.barcode,
            quantity: 1,
            price: line.price,
            gst_rate: line.gstRate || 0,
            reference: header.invoiceNumber,
            status: 'APPROVED',
            date: header.date,
            supplier: header.vendor,
            warehouse_id: header.warehouse,
            notes: `PO Approval: ${header.invoiceNumber}`,
            timestamp: Date.now()
          });
        }
      } else {
        engine.commitTransaction({
          type: "PO",
          item_id: productId,
          serial: `PO-ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          quantity: line.qty,
          price: line.price,
          gst_rate: line.gstRate || 0,
          reference: header.invoiceNumber,
          status: 'APPROVED',
          date: header.date,
          supplier: header.vendor,
          warehouse_id: header.warehouse,
          notes: `PO Approval: ${header.invoiceNumber}`,
          timestamp: Date.now()
        });
      }
    }

    addLog(`PO_APPROVED: ${header.invoiceNumber} | Items: ${lines.length} | No Stock Movement.`);
    await fetchData();
  }

  const processInward = async (header: { vendor: string, date: string, reference: string, warehouse: string, invoiceNumber: string }, lines: PurchaseLine[], sundry: any[] = []) => {
    // Phase 1: Pre-Validation
    if (!lines || lines.length === 0) throw new Error("HARD_FAIL: NO_ITEMS_IN_ENTRY");

    for (const line of lines) {
      if (line.isSerialized) {
        const trackingCount = line.tracking?.length || line.serials?.length || 0;
        if (trackingCount !== line.qty) {
          throw new Error(`HARD_FAIL: TRACKING_MISMATCH for ${line.name}. Scanned: ${trackingCount}/${line.qty}`);
        }
      }
    }

    // Phase 3: Execute Inward via Engine
    for (const line of lines) {
      const isTemp = !line.productId || line.productId.startsWith('TEMP_');
      const effectiveProductId = isTemp ? `TEMP_${line.name.replace(/\s+/g, '_').toUpperCase()}` : line.productId;
      const gstRate = line.gstRate || 0;

      if (line.isSerialized) {
        if (line.tracking && line.tracking.length > 0) {
          line.tracking.forEach((t) => {
            engine.executeInward({
              productId: effectiveProductId,
              serial: t.serial,
              barcode: t.barcode,
              qty: 1,
              gst: gstRate,
              price: line.price,
              source: "INWARD",
              metadata: {
                reference: line.ticket_id,
                reference_id: header.reference,
                invoice: header.invoiceNumber,
                supplier: header.vendor,
                sub_type: isTemp ? 'TEMP_ITEM' : 'MASTER_ITEM'
              }
            });
          });
        } else if (line.serials) {
          line.serials.forEach((s: any) => {
            const serial = typeof s === 'string' ? s : s.serial;
            const barcode = typeof s === 'string' ? undefined : (s as any).barcode;
            engine.executeInward({
              productId: effectiveProductId,
              serial,
              barcode,
              qty: 1,
              gst: gstRate,
              price: line.price,
              source: "INWARD",
              metadata: {
                reference: line.ticket_id,
                reference_id: header.reference,
                invoice: header.invoiceNumber,
                supplier: header.vendor,
                warehouse_id: header.warehouse,
                sub_type: isTemp ? 'TEMP_ITEM' : 'MASTER_ITEM'
              }
            });
          });
        }
      } else {
        engine.executeInwardBulk({
          productId: effectiveProductId,
          qty: line.qty,
          gst: gstRate,
          price: line.price,
          source: "INWARD",
          metadata: {
            reference: line.ticket_id,
            reference_id: header.reference,
            invoice: header.invoiceNumber,
            supplier: header.vendor,
            warehouse_id: header.warehouse,
            sub_type: isTemp ? 'TEMP_ITEM' : 'MASTER_ITEM'
          }
        });
      }
    }

    addLog(`INWARD_ENTRY_PROCESSED: ${header.invoiceNumber} | Items: ${lines.length}`);
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

  const verifySerialForIssue = (serial: string, productId: string) => {
    const state = engine.buildState(transactions);
    const item = state.serialMap[serial];

    if (!item) throw new Error(`INVALID_SERIAL: Not found in system (${serial})`);
    if (item.status !== "IN_STOCK") throw new Error(`INVALID_STATUS: Serial is currently ${item.status}`);
    if (item.item_id !== productId) throw new Error(`PRODUCT_MISMATCH: Serial belongs to ${item.item_id}, not ${productId}`);

    return true;
  }

  const getEngineerSerials = useCallback((engineerId: string) => {
    const state = engine.buildState(transactions);
    return Object.entries(state.serialMap)
      .filter(([_, data]) => data.currentHolder === engineerId)
      .map(([serial, data]) => ({
        item_id: data.item_id,
        serial: serial,
        status: data.status,
        currentTicket: data.currentTicket || 'UNASSIGNED'
      }));
  }, [transactions]);

  const getEngineerTickets = useCallback((engineerId: string) => {
    return tickets.filter(t =>
      transactions.some(tx => (tx.reference === t.id || tx.reference_id === t.id) && tx.engineer_id === engineerId)
    );
  }, [transactions, tickets]);

  const processJournal = async (engineer_id: string, lines: { serial: string, from_ticket: string, to_ticket: string }[]) => {
    if (!lines || lines.length === 0) throw new Error("HARD_FAIL: NO_ITEMS_TO_JOURNAL");

    for (const line of lines) {
      engine.executeJournal(line.serial, engineer_id, line.from_ticket, line.to_ticket);
    }

    addLog(`ENGINEER_JOURNAL: ${engineer_id} | Reassigned ${lines.length} items`);
    await fetchData();
  }

  const processSalesInvoice = async (invoice: {
    id: string,
    customer_id: string,
    date: string | number,
    lines: Array<{
      ticket_id: string,
      description: string,
      amount: number,
      gst_rate?: number,
      gst_amount?: number,
      igst?: number,
      cgst?: number,
      sgst?: number
    }>,
    total_amount: number,
    total_igst?: number,
    total_cgst?: number,
    total_sgst?: number
  }) => {
    if (!invoice.lines || invoice.lines.length === 0) throw new Error("HARD_FAIL: NO_LINES_IN_INVOICE");

    for (const line of invoice.lines) {
      if (!line.ticket_id) throw new Error("HARD_FAIL: TICKET_REQUIRED");
      if (line.amount <= 0) throw new Error("HARD_FAIL: AMOUNT_MUST_BE_POSITIVE");

      engine.commitTransaction({
        type: "REVENUE",
        reference: line.ticket_id,
        amount: line.amount + (line.gst_amount || 0),
        reference_type: "SALE",
        reference_id: invoice.id,
        customer_id: invoice.customer_id,
        notes: line.description,
        timestamp: new Date(invoice.date).getTime() || Date.now()
      });
    }

    addLog(`SALES_INVOICE: ${invoice.id} | Customer: ${invoice.customer_id} | Tickets: ${invoice.lines.length} | Total: ₹${invoice.total_amount}`);
    await fetchData();
  }

  const getTicketBillableSummary = (ticketId: string) => {
    const profitData = engine.getTicketProfit(ticketId, transactions);
    const ticketTxns = transactions.filter(t => t.reference === ticketId);

    let gstAmount = 0;
    ticketTxns.forEach(t => {
      if (t.type === 'OUTWARD' || t.type === 'CONSUMED' || t.type === 'EXPENSE') {
        const product = inventory.find(i => i.id === t.item_id);
        const rate = product?.gst_rate || t.gst_rate || 0;
        const amt = (t.amount || (t.quantity * (t.price || 0)) || (t.quantity * (t.purchase_price || 0)));
        if (rate > 0) {
          gstAmount += amt * (rate / 100);
        }
      }
    });

    return {
      consumedAmount: profitData.cost,
      expenseAmount: profitData.expense,
      revenueAmount: profitData.revenue,
      gstAmount,
      total: profitData.revenue > 0 ? profitData.revenue : (profitData.cost + profitData.expense)
    };
  }

  const value = useMemo(() => ({
    inventory,
    transactions,
    logs,
    engineers,
    contacts,
    tickets,
    setTickets,
    invoices,
    finalizeBill,
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
    processInward,
    issueToEngineer,
    processEngineerReturn,
    processJournal,
    processBarcode,
    verifySerialForIssue,
    createTransaction,
    addContact,
    editContact,
    deleteContacts,
    recordExpense,
    recordManualExpense: recordExpense,
    saveTicketData,
    recordOutsidePurchase,
    getTicketProfit: (ticketNo: string) => engine.getTicketProfit(ticketNo, transactions),
    getAvailableStock: (productId: string) => engine.getAvailableStock(productId),
    addEngineer: (data: { name: string, type: "IT" | "TECHNICAL" }) => {
      setEngineers(prev => [...prev, { id: "eng_" + Date.now(), name: data.name, type: data.type }]);
      addLog(`ENGINEER CREATED: ${data.name}`);
    },
    processSalesInvoice,
    getTicketBillableSummary,

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

    // RBAC
    users,
    roles,
    addUser,
    editUser,
    deleteUser,
    addRole,
    editRole,
    currentUser: users[0], // Hardcoded for demo
    allModules: ALL_MODULES,

    // RBAC EXTENDED
    permissionConfig: engine.PERMISSION_CONFIG,
    userPermissions,
    updateUserPermission,
    bulkUpdateModulePermissions,
    getUserPermissions,
    checkUserPermission,

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
  }), [inventory, transactions, logs, engineers, contacts, tickets, gstConfigs, expenseConfigs, users, roles, fetchData, getEngineerSerials, getEngineerTickets, addLog, addContact, editContact, deleteContacts, addItem, editItem, deleteItems, addGstConfig, updateGstConfig, deleteGstConfig, sellFromPOS, addUser, editUser, deleteUser, addRole, userPermissions, updateUserPermission, bulkUpdateModulePermissions, checkUserPermission, getUserPermissions, invoices, finalizeBill])

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

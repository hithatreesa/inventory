import fs from 'fs'
import path from 'path'

// ---- Types ----
export interface DbItem {
  id: string
  name: string
  sku: string
  category: string
  unit: string
  price: number
  brand: string
  location: string
  threshold: number
  barcode: string
  is_serialized?: boolean
}

export interface DbEngineer {
  id: string
  name: string
}

export interface DbTicketRequirement {
  id: string
  ticket_id: string
  item_id: string
  quantity: number
}

export interface DbTicket {
  id: string
  title: string
  description: string
  status: "OPEN" | "ASSIGNED" | "REQUIREMENT_IDENTIFIED" | "PO_RAISED" | "COMPLETED"
  assigned_engineer_id?: string
  created_at: string
}

export interface DbTransaction {
  id: string
  item_id: string
  type: "PURCHASE" | "ISSUE" | "RETURN" | "ADJUSTMENT" | "SALE"
  quantity: number
  price?: number
  from_warehouse: string | null
  to_warehouse: string | null
  from_location?: "STORE" | "ENGINEER"
  to_location?: "STORE" | "ENGINEER"
  engineer_id?: string
  reference: string
  date: string
  created_at: string
}

interface DbData {
  items: DbItem[]
  engineers: DbEngineer[]
  transactions: DbTransaction[]
  tickets: DbTicket[]
  ticket_requirements: DbTicketRequirement[]
}

const DATA_FILE = path.join(process.cwd(), '.data.json')

// ---- Initial Mock Data ----
const initialData: DbData = {
  items: [
    { id: "ITM001", name: "Dell Latitude 7420", sku: "DLL-LAT-7420", category: "Computing", unit: "pcs", price: 85000, brand: "Dell", location: "Bangalore HQ", threshold: 5, barcode: "100001", is_serialized: true },
    { id: "ITM002", name: "Cisco Catalyst 9200L", sku: "CS-RT-9200L", category: "Networking", unit: "pcs", price: 145000, brand: "Cisco", location: "Main Warehouse", threshold: 2, barcode: "100002", is_serialized: true },
    { id: "ITM003", name: "Logitech MX Master 3S", sku: "LOG-MX-3S", category: "Peripherals", unit: "pcs", price: 9500, brand: "Logitech", location: "IT Hub", threshold: 10, barcode: "100003" },
    { id: "ITM004", name: "Samsung Odyssey G7 32\"", sku: "SAM-ODY-G7", category: "Displays", unit: "pcs", price: 42000, brand: "Samsung", location: "Bangalore HQ", threshold: 3, barcode: "100004" },
    { id: "ITM005", name: "Ubiquiti UniFi 6 Pro", sku: "UBI-U6-PRO", category: "Networking", unit: "pcs", price: 18000, brand: "Ubiquiti", location: "Main Warehouse", threshold: 8, barcode: "100005" },
    { id: "ITM006", name: "Apple MacBook Pro M3 14\"", sku: "APL-MBP-M3", category: "Computing", unit: "pcs", price: 169000, brand: "Apple", location: "IT Hub", threshold: 2, barcode: "100006", is_serialized: true },
    { id: "ITM007", name: "Seagate IronWolf 8TB HDD", sku: "SEA-IW-8TB", category: "Storage", unit: "pcs", price: 15500, brand: "Seagate", location: "Server Room", threshold: 12, barcode: "100007" },
    { id: "ITM008", name: "Nvidia RTX 4090 FE", sku: "NVI-4090-FE", category: "Graphics", unit: "pcs", price: 155000, brand: "Nvidia", location: "IT Hub", threshold: 1, barcode: "100008", is_serialized: true },
    { id: "ITM009", name: "APC Smart-UPS 1500VA", sku: "APC-SU-1500", category: "Power", unit: "pcs", price: 32000, brand: "APC", location: "Electrical Room", threshold: 4, barcode: "100009", is_serialized: true },
    { id: "ITM010", name: "Steelcase Gesture Chair", sku: "STC-GES-GRY", category: "Furniture", unit: "pcs", price: 88000, brand: "Steelcase", location: "Bangalore HQ", threshold: 2, barcode: "100010" }
  ],
  engineers: [
    { id: "ENG001", name: "Ravi Kumar" },
    { id: "ENG002", name: "Anil Sharma" },
    { id: "ENG003", name: "Priya Singh" },
    { id: "ENG004", name: "Vikram Malhotra" },
    { id: "ENG005", name: "Sanya Gupta" },
    { id: "ENG006", name: "Deepak Verma" }
  ],
  transactions: [
    // Initial Stock Purchases (Stock buildup)
    { id: "TXN-P-001", item_id: "ITM001", type: "PURCHASE", quantity: 30, from_warehouse: null, to_warehouse: "Bangalore HQ", reference: "PO-001", date: "2024-03-01", created_at: "2024-03-01T10:00:00Z" },
    { id: "TXN-P-002", item_id: "ITM002", type: "PURCHASE", quantity: 15, from_warehouse: null, to_warehouse: "Main Warehouse", reference: "PO-002", date: "2024-03-01", created_at: "2024-03-01T11:00:00Z" },
    { id: "TXN-P-003", item_id: "ITM003", type: "PURCHASE", quantity: 100, from_warehouse: null, to_warehouse: "IT Hub", reference: "PO-003", date: "2024-03-02", created_at: "2024-03-02T09:00:00Z" },
    { id: "TXN-P-004", item_id: "ITM006", type: "PURCHASE", quantity: 10, from_warehouse: null, to_warehouse: "IT Hub", reference: "PO-004", date: "2024-03-02", created_at: "2024-03-02T14:00:00Z" },
    { id: "TXN-P-005", item_id: "ITM005", type: "PURCHASE", quantity: 40, from_warehouse: null, to_warehouse: "Main Warehouse", reference: "PO-005", date: "2024-03-03", created_at: "2024-03-03T10:00:00Z" },

    // Engineer 1: Ravi Kumar (Active issues + some returns)
    { id: "TXN-E1-001", item_id: "ITM001", type: "ISSUE", quantity: 2, from_warehouse: "Bangalore HQ", to_warehouse: null, engineer_id: "ENG001", reference: "REQ-101", date: "2024-03-10", created_at: "2024-03-10T10:00:00Z" },
    { id: "TXN-E1-002", item_id: "ITM003", type: "ISSUE", quantity: 10, from_warehouse: "IT Hub", to_warehouse: null, engineer_id: "ENG001", reference: "REQ-101", date: "2024-03-10", created_at: "2024-03-10T10:05:00Z" },
    { id: "TXN-E1-003", item_id: "ITM003", type: "RETURN", quantity: 2, from_warehouse: null, to_warehouse: "IT Hub", engineer_id: "ENG001", reference: "RET-101", date: "2024-03-15", created_at: "2024-03-15T16:00:00Z" },
    { id: "TXN-E1-004", item_id: "ITM005", type: "ISSUE", quantity: 5, from_warehouse: "Main Warehouse", to_warehouse: null, engineer_id: "ENG001", reference: "REQ-105", date: "2024-03-18", created_at: "2024-03-18T11:00:00Z" },

    // Engineer 2: Anil Sharma (Heavy usage)
    { id: "TXN-E2-001", item_id: "ITM002", type: "ISSUE", quantity: 3, from_warehouse: "Main Warehouse", to_warehouse: null, engineer_id: "ENG002", reference: "REQ-201", date: "2024-03-11", created_at: "2024-03-11T09:30:00Z" },
    { id: "TXN-E2-002", item_id: "ITM005", type: "ISSUE", quantity: 12, from_warehouse: "Main Warehouse", to_warehouse: null, engineer_id: "ENG002", reference: "REQ-202", date: "2024-03-12", created_at: "2024-03-12T14:15:00Z" },
    
    // Engineer 3: Priya Singh (Precision gear)
    { id: "TXN-E3-001", item_id: "ITM006", type: "ISSUE", quantity: 1, from_warehouse: "IT Hub", to_warehouse: null, engineer_id: "ENG003", reference: "REQ-301", date: "2024-03-13", created_at: "2024-03-13T10:00:00Z" },
    { id: "TXN-E3-002", item_id: "ITM008", type: "ISSUE", quantity: 1, from_warehouse: "IT Hub", to_warehouse: null, engineer_id: "ENG003", reference: "REQ-301", date: "2024-03-13", created_at: "2024-03-13T10:10:00Z" },
    
    // Engineer 4: Vikram Malhotra (General maintenance)
    { id: "TXN-E4-001", item_id: "ITM003", type: "ISSUE", quantity: 20, from_warehouse: "IT Hub", to_warehouse: null, engineer_id: "ENG004", reference: "REQ-401", date: "2024-03-05", created_at: "2024-03-05T09:00:00Z" },
    { id: "TXN-E4-002", item_id: "ITM003", type: "RETURN", quantity: 15, from_warehouse: null, to_warehouse: "IT Hub", engineer_id: "ENG004", reference: "RET-401", date: "2024-03-07", created_at: "2024-03-07T15:30:00Z" },

    // Engineer 5: Sanya Gupta (Furniture / Setup)
    { id: "TXN-E5-001", item_id: "ITM010", type: "ISSUE", quantity: 2, from_warehouse: "Bangalore HQ", to_warehouse: null, engineer_id: "ENG005", reference: "REQ-501", date: "2024-03-20", created_at: "2024-03-20T10:00:00Z" },
    { id: "TXN-E5-002", item_id: "ITM004", type: "ISSUE", quantity: 4, from_warehouse: "Bangalore HQ", to_warehouse: null, engineer_id: "ENG005", reference: "REQ-502", date: "2024-03-22", created_at: "2024-03-22T11:45:00Z" },

    // Engineer 6: Deepak Verma (Power / Electrical)
    { id: "TXN-E6-001", item_id: "ITM009", type: "ISSUE", quantity: 2, from_warehouse: "Electrical Room", to_warehouse: null, engineer_id: "ENG006", reference: "REQ-601", date: "2024-03-25", created_at: "2024-03-25T14:00:00Z" }
  ],
  tickets: [],
  ticket_requirements: []
}

// ---- Core Logic ----
function getDb(): DbData {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8')
    return initialData
  }
  const data = fs.readFileSync(DATA_FILE, 'utf-8')
  const parsed = JSON.parse(data) as DbData
  if (!parsed.tickets) parsed.tickets = []
  if (!parsed.ticket_requirements) parsed.ticket_requirements = []
  return parsed
}

function saveDb(data: DbData) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export function getItems() {
  return getDb().items
}

export function getEngineers() {
  return getDb().engineers
}

export function getTransactions(itemId?: string) {
  const db = getDb()
  if (itemId) return db.transactions.filter(t => t.item_id === itemId)
  return db.transactions
}

// Calculate total stock based exclusively on transactions
export function calculateStock(itemId: string) {
  const txns = getTransactions(itemId)
  let stock = 0
  txns.forEach(txn => {
    if (txn.type === "PURCHASE") stock += txn.quantity
    if (txn.type === "RETURN") stock += txn.quantity
    if (txn.type === "ISSUE") stock -= txn.quantity
    if (txn.type === "ADJUSTMENT") stock += txn.quantity
  })
  return stock
}

// Compute engineer issues strictly based on transactions
export function calculateAssignedStock(itemId: string) {
  const txns = getTransactions(itemId)
  let assigned = 0
  txns.forEach(txn => {
    if (txn.type === "ISSUE") assigned += txn.quantity
    if (txn.type === "RETURN") assigned -= txn.quantity
  })
  return assigned
}

// For UI mapping (total owned)
export function calculateTotalQty(itemId: string) {
  const txns = getTransactions(itemId)
  let total = 0
  txns.forEach(txn => {
    if (txn.type === "PURCHASE") total += txn.quantity
    if (txn.type === "ADJUSTMENT") total += txn.quantity
  })
  return total
}

export function createTransaction(txn: Omit<DbTransaction, 'id' | 'created_at'>) {
  const db = getDb()
  
  // Validation for stock constraints
  if (txn.type === "ISSUE") {
    const available = calculateStock(txn.item_id)
    if (txn.quantity > available) {
      throw new Error(`Insufficient stock for item ${txn.item_id}. Requested: ${txn.quantity}, Available: ${available}`)
    }
  }

  // Record Transaction
  const newTxn: DbTransaction = {
    ...txn,
    id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    created_at: new Date().toISOString()
  }
  db.transactions.push(newTxn)
  saveDb(db)
  return newTxn
}

export function addItem(item: Omit<DbItem, 'id'>) {
  const db = getDb()
  const newItem: DbItem = {
    ...item,
    id: `ITM-${Date.now()}`
  }
  db.items.push(newItem)
  saveDb(db)
  return newItem
}

export function updateItem(id: string, updates: Partial<DbItem>) {
  const db = getDb()
  const index = db.items.findIndex(i => i.id === id)
  if (index === -1) throw new Error(`Item ${id} not found`)
  
  db.items[index] = { ...db.items[index], ...updates }
  saveDb(db)
  return db.items[index]
}

export function deleteItems(ids: string[]) {
  const db = getDb()
  db.items = db.items.filter(i => !ids.includes(i.id))
  // Optional: Also clean up transactions for these items? 
  // Usually better to keep them for history, but maybe mark them as orphaned.
  saveDb(db)
}

export function addEngineer(engineer: Omit<DbEngineer, 'id'>) {
  const db = getDb()
  const newEng: DbEngineer = {
    ...engineer,
    id: `ENG-${Date.now()}`
  }
  db.engineers.push(newEng)
  saveDb(db)
  return newEng
}

// ==== Ticketing Logic ====

export function getTickets() {
  return getDb().tickets || []
}

export function getTicketRequirements(ticketId?: string) {
  const db = getDb()
  if (ticketId) return (db.ticket_requirements || []).filter(r => r.ticket_id === ticketId)
  return db.ticket_requirements || []
}

export function createTicket(ticket: Omit<DbTicket, 'id' | 'created_at'>) {
  const db = getDb()
  const newTicket: DbTicket = {
    ...ticket,
    id: `TCK-${Date.now()}`,
    created_at: new Date().toISOString()
  }
  db.tickets.push(newTicket)
  saveDb(db)
  return newTicket
}

export function updateTicket(id: string, updates: Partial<DbTicket>) {
  const db = getDb()
  const index = db.tickets.findIndex(t => t.id === id)
  if (index === -1) throw new Error(`Ticket ${id} not found`)
  
  db.tickets[index] = { ...db.tickets[index], ...updates }
  saveDb(db)
  return db.tickets[index]
}

export function addTicketRequirement(req: Omit<DbTicketRequirement, 'id'>) {
  const db = getDb()
  const newReq: DbTicketRequirement = {
    ...req,
    id: `REQ-${Date.now()}`
  }
  db.ticket_requirements.push(newReq)
  saveDb(db)
  return newReq
}

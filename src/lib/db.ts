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
}

export interface DbEngineer {
  id: string
  name: string
}

export interface DbTransaction {
  id: string
  item_id: string
  type: "PURCHASE" | "ISSUE" | "RETURN" | "ADJUSTMENT"
  quantity: number
  from_warehouse: string | null
  to_warehouse: string | null
  engineer_id?: string
  reference: string
  created_at: string
}

interface DbData {
  items: DbItem[]
  engineers: DbEngineer[]
  transactions: DbTransaction[]
}

const DATA_FILE = path.join(process.cwd(), '.data.json')

// ---- Initial Mock Data ----
const initialData: DbData = {
  items: [
    { id: "ITM001", name: "Dell Laptop", sku: "DLL-LAT-74", category: "Laptop", unit: "pcs", price: 85000, brand: "Dell", location: "Bangalore Store", threshold: 2 },
    { id: "ITM002", name: "Cisco Router", sku: "CS-RT-9200", category: "Networking", unit: "pcs", price: 45000, brand: "Cisco", location: "Warehouse", threshold: 3 }
  ],
  engineers: [
    { id: "ENG001", name: "Ravi Kumar" },
    { id: "ENG002", name: "Anil Sharma" }
  ],
  transactions: []
}

// ---- Core Logic ----
function getDb(): DbData {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8')
    return initialData
  }
  const data = fs.readFileSync(DATA_FILE, 'utf-8')
  return JSON.parse(data)
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

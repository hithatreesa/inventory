// =============================================================================
// INVENTORY ENGINE — STRICT EVENT-DRIVEN STATE MACHINE
// All inventory state is DERIVED from transactions. No direct mutations.
// =============================================================================

export type TransactionType =
  | "INWARD"
  | "OUTWARD"
  | "ASSIGN"
  | "RETURN"
  | "CONSUMED"
  | "ADJUSTMENT"
  | "EXPENSE"
  | "REVENUE"
  | "JOURNAL"
  | "PO"
  | "PURCHASE"
  | "OUTSIDE_PURCHASE";

export interface Transaction {
  id: string
  type: TransactionType

  item_id: string
  serial: string
  barcode?: string
  qty?: number       // alias used by some callers
  quantity: number

  source?: "PURCHASE" | "OUTSIDE_PURCHASE"
  affects_stock?: boolean

  engineer_id?: string
  customer_id?: string
  customer_name?: string
  from_ticket?: string
  to_ticket?: string
  ticket_id?: string   // Unified ticket field

  // GST fields (stored in transaction, not inventory)
  gst_rate?: number
  cgst?: number
  sgst?: number
  igst?: number

  // Pricing
  purchase_price?: number
  sale_price?: number
  price?: number   // legacy compat
  cost?: number    // User requested cost field

  // Reference
  reference_type?: "PO" | "SALE" | "TICKET" | "ADJUSTMENT"
  reference_id?: string
  reference?: string  // legacy compat

  // Legacy metadata
  gst?: number
  warehouse_id?: string
  supplier?: string
  invoice?: string
  from_location?: "STORE" | "ENGINEER"
  to_location?: "STORE" | "ENGINEER"

  status?: string
  timestamp: number
  created_at?: number
  sub_type?: string
  notes?: string
  expense_id?: string
  amount?: number
  date?: string
}

// Internal Tracking State
export interface SerialState {
  status: "IN_STOCK" | "ASSIGNED" | "SOLD" | "CONSUMED"
  item_id: string
  currentHolder?: string   // engineer_id when ASSIGNED
  currentTicket?: string   // Target ticket for usage
  customer_id?: string     // customer_id when SOLD
  customer_name?: string   // customer_name for tracking
  quantity: number
  lastUpdated: number
}

export interface SummaryCounts {
  IN_STOCK: number
  ASSIGNED: number
  SOLD: number
  CONSUMED: number
}

export interface TicketSummary {
  revenue: number
  cost: number
  expense: number
  profit: number
  margin: number
}

// --------------------------------------------------
// IN-MEMORY LEDGER
// --------------------------------------------------
let transactions: Transaction[] = [];
let serialCounters: Record<string, number> = {};

// Derivation cache
let _cachedTxnsLength = -1;
let _cachedState: { serialMap: Record<string, SerialState>; summaryCounts: SummaryCounts } | null = null;

// Persistence
const STORAGE_KEY = 'inventory_ledger_v1';

function saveLedger() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }
}

function loadLedger() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        transactions = JSON.parse(saved);
        debugLog(`LOADED LEDGER: ${transactions.length} txns`);
      } catch (e) {
        debugLog("FAILED TO LOAD LEDGER", e);
      }
    }
  }
}

// Initial load
loadLedger();

// --------------------------------------------------
// SEED DATA
// --------------------------------------------------
serialCounters["ITM001"] = 2;
serialCounters["ITM002"] = 1;
transactions.push(
  { id: "MOCK-1", type: "INWARD", serial: "ITM001-1", item_id: "ITM001", timestamp: Date.now(), quantity: 1, to_location: "STORE" },
  { id: "MOCK-2", type: "INWARD", serial: "ITM001-2", item_id: "ITM001", timestamp: Date.now(), quantity: 1, to_location: "STORE" },
  { id: "MOCK-3", type: "INWARD", serial: "ITM002-1", item_id: "ITM002", timestamp: Date.now(), quantity: 1, to_location: "STORE" },
  { id: "MOCK-4", type: "ASSIGN", serial: "ITM001-1", item_id: "ITM001", engineer_id: "eng1", timestamp: Date.now(), quantity: 1, from_location: "STORE", to_location: "ENGINEER" },
  
  // TICKET-101 Test Case
  { id: "TXN-T101-1", type: "OUTWARD", serial: "ITM001-2", item_id: "ITM001", timestamp: Date.now() - 86400000, quantity: 1, reference: "TICKET-101", purchase_price: 38000, engineer_id: "eng1" },
  { id: "TXN-T101-2", type: "EXPENSE", serial: "EXP-101", item_id: "exp1", timestamp: Date.now() - 86400000, quantity: 1, reference: "TICKET-101", price: 500, sub_type: "INTERNAL" },
  { id: "TXN-T101-3", type: "REVENUE", serial: "REV-101", item_id: "REVENUE", timestamp: Date.now() - 86400000, quantity: 1, reference: "TICKET-101", price: 45000 },

  // TICKET-202 Test Case
  { id: "TXN-T202-1", type: "OUTWARD", serial: "ITM002-1", item_id: "ITM002", timestamp: Date.now() - 172800000, quantity: 1, reference: "TICKET-202", purchase_price: 6500, engineer_id: "eng2" },
  { id: "TXN-T202-2", type: "REVENUE", serial: "REV-202", item_id: "REVENUE", timestamp: Date.now() - 172800000, quantity: 1, reference: "TICKET-202", price: 12000 },

  // Dummy Outside Purchases
  { id: "OP-1", type: "CONSUMED", serial: "PVC-PIPE-10FT", item_id: "PVC Pipe 10ft", timestamp: Date.now() - 43200000, quantity: 2, ticket_id: "TICKET-101", cost: 450, source: "OUTSIDE_PURCHASE", affects_stock: false, date: "2024-04-26" },
  { id: "OP-2", type: "CONSUMED", serial: "CAT6-CABLE-50M", item_id: "Cat6 Cable 50m", timestamp: Date.now() - 36000000, quantity: 1, ticket_id: "TICKET-101", cost: 1200, source: "OUTSIDE_PURCHASE", affects_stock: false, date: "2024-04-26" },
  { id: "OP-3", type: "CONSUMED", serial: "ELECTRICAL-TAPE", item_id: "Electrical Tape", timestamp: Date.now() - 21600000, quantity: 5, ticket_id: "TICKET-102", cost: 250, source: "OUTSIDE_PURCHASE", affects_stock: false, date: "2024-04-27" },
  { id: "OP-4", type: "CONSUMED", serial: "SCREWS-PACK-50", item_id: "Screws Pack 50", timestamp: Date.now() - 14400000, quantity: 1, ticket_id: "TICKET-102", cost: 150, source: "OUTSIDE_PURCHASE", affects_stock: false, date: "2024-04-27" }
);

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function validateStateTransition(current: SerialState["status"] | undefined, action: TransactionType) {
  if (current === "CONSUMED") throw new Error("HARD_FAIL: INVALID_ACTION_ON_TERMINAL_STATE");

  switch (action) {
    case "INWARD":
    case "ADJUSTMENT":
      if (current) throw new Error("HARD_FAIL: SERIAL_ALREADY_EXISTS");
      break;
    case "ASSIGN":
      if (current !== "IN_STOCK")
        throw new Error(`HARD_FAIL: CANNOT_ASSIGN_FROM_${current || "NON_EXISTENT"}`);
      break;
    case "OUTWARD":
      if (current !== "IN_STOCK")
        throw new Error(`HARD_FAIL: CANNOT_SELL_FROM_${current || "NON_EXISTENT"}`);
      break;
    case "RETURN":
      // Valid from ASSIGNED (engineer return) or SOLD (customer return)
      if (current !== "ASSIGNED" && current !== "SOLD")
        throw new Error(`HARD_FAIL: CANNOT_RETURN_FROM_${current || "NON_EXISTENT"}`);
      break;
    case "CONSUMED":
      if (current !== "ASSIGNED")
        throw new Error(`HARD_FAIL: CANNOT_CONSUMED_FROM_${current || "NON_EXISTENT"}`);
      break;
    case "JOURNAL":
      if (current !== "ASSIGNED")
        throw new Error(`HARD_FAIL: CANNOT_JOURNAL_FROM_${current || "NON_EXISTENT"}`);
      break;
    case "EXPENSE":
    case "REVENUE":
      // Financial logs do not affect physical serial state
      break;
  }
}

function debugLog(msg: string, data?: any) {
  console.log(`[ENGINE] ${new Date().toISOString()} | ${msg}`, data || "");
}

// --------------------------------------------------
// SYSTEM CONTROL
// --------------------------------------------------

export function resetSystem() {
  debugLog("RESETTING SYSTEM LEDGER");
  transactions = [];
  serialCounters = {};
  _cachedTxnsLength = -1;
  _cachedState = null;
}

// --------------------------------------------------
// DERIVATION ENGINE — buildState
// --------------------------------------------------

export function buildState(
  txns: Transaction[] = transactions
): { serialMap: Record<string, SerialState>; summaryCounts: SummaryCounts } {
  if (txns === transactions && txns.length === _cachedTxnsLength && _cachedState) {
    return _cachedState;
  }

  const serialMap: Record<string, SerialState> = {};

  for (const t of txns) {
    // If transaction explicitly says it does not affect stock, skip state machine
    if (t.affects_stock === false) continue;

    const current = serialMap[t.serial];

    if (t.type === "INWARD" || t.type === "ADJUSTMENT") {
      serialMap[t.serial] = {
        status: "IN_STOCK",
        item_id: t.item_id,
        quantity: t.quantity || 1,
        lastUpdated: t.timestamp,
      };
    } else if (t.type === "OUTWARD") {
      if (current) {
        if (t.engineer_id) {
          // Transfer to engineer (Possession)
          current.status = "ASSIGNED";
          current.currentHolder = t.engineer_id;
        } else {
          // Final sale (No possession tracking needed)
          current.status = "SOLD";
          current.customer_id = t.customer_id;
          current.customer_name = t.customer_name;
          current.currentHolder = undefined;
        }
        current.lastUpdated = t.timestamp;
      }
    } else if (t.type === "ASSIGN") {
      if (current) {
        current.status = "ASSIGNED";
        current.currentHolder = t.engineer_id;
        current.currentTicket = t.reference; // ASSIGN can set initial ticket
        current.lastUpdated = t.timestamp;
      }
    } else if (t.type === "JOURNAL") {
      if (current) {
        current.currentTicket = t.to_ticket;
        current.lastUpdated = t.timestamp;
        // DOES NOT modify stock or currentHolder
      }
    } else if (t.type === "RETURN") {
      if (current) {
        current.status = "IN_STOCK";
        current.currentHolder = undefined;
        current.currentTicket = undefined;
        current.customer_id = undefined;
        current.lastUpdated = t.timestamp;
      }
    } else if (t.type === "CONSUMED") {
      if (current) {
        current.status = "CONSUMED";
        // currentHolder stays for history, or we can clear it. User said "When item is used... Update status = CONSUMED"
        current.lastUpdated = t.timestamp;
      }
    }
  }

  // Build summaryCounts
  const summaryCounts: SummaryCounts = { IN_STOCK: 0, ASSIGNED: 0, SOLD: 0, CONSUMED: 0 };
  for (const s of Object.values(serialMap)) {
    if (summaryCounts[s.status] !== undefined) {
      summaryCounts[s.status] += s.quantity;
    }
  }

  _cachedTxnsLength = txns.length;
  _cachedState = { serialMap, summaryCounts };
  return _cachedState;
}

export function getTicketProfit(ticketNo: string, txns: Transaction[] = transactions): TicketSummary {
  const ticketTxns = txns.filter(t => t.reference === ticketNo || t.ticket_id === ticketNo || t.reference_id === ticketNo);
  
  let revenue = 0;
  let cost = 0;
  let expense = 0;

  ticketTxns.forEach(t => {
    if (t.type === 'REVENUE') {
      revenue += (t.amount || (t.quantity * (t.price || 0)));
    } else if (t.type === 'OUTWARD' || t.type === 'CONSUMED') {
      // Rule 2: Always use cost_snapshot (t.price or t.amount or t.cost)
      const lineCost = t.cost || t.purchase_price || t.price || t.amount || 0;
      cost += (lineCost * (t.quantity || 1));
    } else if (t.type === 'EXPENSE') {
      expense += (t.amount || (t.quantity * (t.price || 0)));
    }
  });

  const profit = revenue - cost - expense;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return { revenue, cost, expense, profit, margin };
}

// --------------------------------------------------
// CORE ENGINE FUNCTIONS
// --------------------------------------------------

export function validateTransaction(txn: any, ledger: Transaction[] = transactions) {
  const state = buildState(ledger);
  
  // Rule 7: Ticket Linking
  if (!txn.reference && txn.type !== 'ADJUSTMENT' && txn.type !== 'INWARD' && txn.type !== 'JOURNAL') {
    throw new Error("HARD_FAIL: MISSING_TICKET");
  }

  // Rule 5 & 6: Financial Valuations
  if ((txn.type === 'EXPENSE' || txn.type === 'REVENUE' || txn.type === 'OUTWARD') && 
      (txn.amount === undefined && txn.price === undefined)) {
    throw new Error("HARD_FAIL: INVALID_AMOUNT");
  }

  if (txn.type === 'EXPENSE' && (txn.amount || 0) <= 0) {
    throw new Error("HARD_FAIL: INVALID_AMOUNT (Expense must be > 0)");
  }

  // Rule 3: Inventory Logic
  if (txn.type === 'OUTWARD' || txn.type === 'ASSIGN') {
    const current = state.serialMap[txn.serial];
    if (!current || current.status !== 'IN_STOCK') {
      throw new Error(`HARD_FAIL: INVALID_STOCK (Serial ${txn.serial} not in stock)`);
    }
  }

  // Rule 4: Return Logic
  if (txn.type === 'RETURN') {
    const current = state.serialMap[txn.serial];
    if (!current || (current.status !== 'ASSIGNED' && current.status !== 'SOLD')) {
      throw new Error(`HARD_FAIL: INVALID_RETURN (Serial ${txn.serial} not issued)`);
    }
  }

  // Rule 8: Duplicate Protection
  if (txn.type === 'INWARD' || txn.type === 'ADJUSTMENT') {
    if (state.serialMap[txn.serial]) {
      throw new Error(`HARD_FAIL: DUPLICATE_SERIAL (${txn.serial})`);
    }
  }
}

export function commitTransaction(txn: any) {
  validateTransaction(txn);
  const finalTxn: Transaction = {
    ...txn,
    id: txn.id || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: txn.timestamp || Date.now(),
    quantity: txn.quantity || 1
  };
  transactions.push(finalTxn);
  saveLedger();
  return transactions;
}

export function executeInward(params: { 
  productId: string, 
  serial: string, 
  barcode?: string,
  qty: number, 
  gst: number, 
  price: number, 
  source: string,
  metadata?: Partial<Transaction> 
}) {
  const { productId, serial, barcode, qty, gst, price, source, metadata } = params;

  return commitTransaction({
    id: `TXN-IN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type: "INWARD",
    serial,
    barcode,
    item_id: productId,
    quantity: qty || 1,
    gst_rate: gst,
    purchase_price: price,
    reference_type: source as any,
    ...metadata,
    timestamp: Date.now(),
  });
}

export function executeInwardBulk(params: {
  productId: string,
  qty: number,
  gst: number,
  price: number,
  source: string,
  metadata?: Partial<Transaction>
}) {
  const { productId, qty, gst, price, source, metadata } = params;
  if (qty <= 0) throw new Error("HARD_FAIL: INVALID_QUANTITY");
  const serial = `BULK-${productId}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  return commitTransaction({
    id: `TXN-BULK-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type: "INWARD",
    serial,
    item_id: productId,
    quantity: qty,
    gst_rate: gst,
    purchase_price: price,
    reference_type: source as any,
    ...metadata,
    timestamp: Date.now(),
  });
}

export function executeInwardBatch(batch: Transaction[]) {
  const currentState = buildState(transactions);
  const batchSerials = new Set();

  for (const t of batch) {
    if (t.serial) {
      if (batchSerials.has(t.serial)) throw new Error(`HARD_FAIL: DUPLICATE_IN_BATCH ${t.serial}`);
      validateStateTransition(currentState.serialMap[t.serial]?.status, "INWARD");
      batchSerials.add(t.serial);
    }
  }

  debugLog(`COMMITTING BATCH: ${batch.length} items`);
  transactions.push(...batch);
  saveLedger();
}

export function executeOutward(params: {
  productId: string,
  serial: string,
  qty: number,
  customer_id?: string,
  metadata?: Partial<Transaction>
}) {
  const { productId, serial, qty, customer_id, metadata } = params;
  const state = buildState(transactions);
  const item = state.serialMap[serial];

  if (!item) throw new Error(`HARD_FAIL: SERIAL_NOT_FOUND ${serial}`);

  return commitTransaction({
    id: `TXN-OUT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type: "OUTWARD",
    serial,
    item_id: item.item_id,
    customer_id,
    quantity: item.quantity,
    reference_type: "SALE",
    ...metadata,
    timestamp: Date.now(),
  });
}

export function executeOutwardBulk(params: {
  productId: string,
  qty: number,
  destination: string,
  source: string,
  metadata?: Partial<Transaction>
}) {
  const { productId, qty, destination, source, metadata } = params;
  if (qty <= 0) throw new Error("HARD_FAIL: INVALID_QUANTITY");
  const serial = `BULK-OUT-${productId}-${Date.now()}`;

  const txn: Transaction = {
    id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type: "OUTWARD",
    serial,
    item_id: productId,
    engineer_id: destination,
    timestamp: Date.now(),
    quantity: qty,
    reference_type: source as any,
    created_at: Date.now(),
    ...metadata,
  };

  debugLog("LEDGER_OUTWARD_BULK:", txn);
  transactions.push(txn);
  saveLedger();
  return serial;
}

export function sellItem(serial: string, customer_id: string, metadata?: Partial<Transaction>) {
  const state = buildState(transactions);
  const item = state.serialMap[serial];

  if (!item) throw new Error(`HARD_FAIL: SERIAL_NOT_FOUND ${serial}`);
  validateStateTransition(item.status, "OUTWARD");

  const txn: Transaction = {
    id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type: "OUTWARD",
    serial,
    item_id: item.item_id,
    customer_id,
    timestamp: Date.now(),
    quantity: item.quantity,
    reference_type: "SALE",
    reference_id: `SALE-${Date.now()}`,
    created_at: Date.now(),
    ...metadata,
  };

  debugLog("SELL:", txn);
  transactions.push(txn);
  saveLedger();
}

export function assignItem(serial: string, engineer_id: string, metadata?: Partial<Transaction>) {
  const state = buildState(transactions);
  const item = state.serialMap[serial];

  return commitTransaction({
    id: `TXN-ASSIGN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type: "ASSIGN",
    serial,
    item_id: item?.item_id || 'N/A',
    engineer_id,
    quantity: item?.quantity || 1,
    ...metadata,
    timestamp: Date.now(),
  });
}

export function returnItem(serial: string, engineer_id: string, metadata?: Partial<Transaction>) {
  const state = buildState(transactions);
  const item = state.serialMap[serial];

  // Ownership lock: only the assigned holder can return (skip for SOLD returns)
  if (item?.status === "ASSIGNED" && item.currentHolder !== engineer_id) {
    throw new Error(
      `HARD_FAIL: INVALID_OWNER ${serial}. Expected ${item.currentHolder}, provided ${engineer_id}`
    );
  }

  return commitTransaction({
    id: `TXN-RET-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type: "RETURN",
    serial,
    item_id: item?.item_id || 'N/A',
    engineer_id,
    quantity: item?.quantity || 1,
    ...metadata,
    timestamp: Date.now(),
  });
}

export function consumeItem(serial: string, engineer_id: string, metadata?: Partial<Transaction>) {
  const state = buildState(transactions);
  const item = state.serialMap[serial];

  if (item?.currentHolder !== engineer_id) {
    throw new Error(
      `HARD_FAIL: INVALID_OWNER ${serial}. Expected ${item?.currentHolder}, provided ${engineer_id}`
    );
  }

  return commitTransaction({
    id: `TXN-CONS-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type: "CONSUMED",
    serial,
    item_id: item?.item_id || 'N/A',
    engineer_id,
    quantity: item?.quantity || 1,
    ...metadata,
    timestamp: Date.now(),
  });
}

export function adjustStock(item_id: string, qty: number, metadata?: Partial<Transaction>): string[] {
  if (qty <= 0) throw new Error("HARD_FAIL: INVALID_ADJUSTMENT_QTY");
  const serials: string[] = [];

  for (let i = 0; i < qty; i++) {
    const serial = `ADJ-${item_id}-${Date.now()}-${i}`;
    commitTransaction({
      type: "ADJUSTMENT",
      serial,
      item_id,
      quantity: 1,
      ...metadata,
      timestamp: Date.now()
    });
    serials.push(serial);
  }
  return serials;
}

export function executeJournal(serial: string, engineer_id: string, from_ticket: string, to_ticket: string, metadata?: Partial<Transaction>) {
  const state = buildState(transactions);
  const item = state.serialMap[serial];

  if (!item) throw new Error(`HARD_FAIL: SERIAL_NOT_FOUND ${serial}`);
  if (item.status === "CONSUMED") throw new Error("HARD_FAIL: ALREADY_USED");
  if (item.status !== "ASSIGNED" || item.currentHolder !== engineer_id) {
    throw new Error("HARD_FAIL: INVALID_SOURCE (Item not with engineer)");
  }
  if (!from_ticket) throw new Error("HARD_FAIL: INVALID_SOURCE_TICKET");

  return commitTransaction({
    id: `TXN-JRNL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type: "JOURNAL",
    serial,
    item_id: item.item_id,
    quantity: 1,
    engineer_id,
    from_ticket,
    to_ticket,
    reference: to_ticket, // Update reference for ticket tracking
    ...metadata,
    timestamp: Date.now(),
  });
}

// --------------------------------------------------
// SELECTORS
// --------------------------------------------------

export function getAvailableStock(item_id: string) {
  const map = buildState(transactions).serialMap;
  return Object.entries(map)
    .filter(([_, data]) => data.item_id === item_id && data.status === "IN_STOCK")
    .map(([serial, data]) => ({ serial, ...data }));
}

export function getAssignedStock(item_id: string) {
  const map = buildState(transactions).serialMap;
  return Object.entries(map)
    .filter(([_, data]) => data.item_id === item_id && data.status === "ASSIGNED")
    .map(([serial, data]) => ({ serial, ...data }));
}

export function getSoldStock(item_id: string) {
  const map = buildState(transactions).serialMap;
  return Object.entries(map)
    .filter(([_, data]) => data.item_id === item_id && data.status === "SOLD")
    .map(([serial, data]) => ({ serial, ...data }));
}

export function getEngineerItems(engineer_id: string) {
  const map = buildState(transactions).serialMap;
  return Object.entries(map)
    .filter(([_, data]) => data.currentHolder === engineer_id)
    .map(([serial, data]) => ({ serial, ...data }));
}

export function getSerialHistory(serial: string) {
  return transactions.filter((t) => t.serial === serial).sort((a, b) => a.timestamp - b.timestamp);
}

export function getAllItemsGrouped() {
  const map = buildState(transactions).serialMap;
  const groups: Record<
    string,
    {
      item_id: string;
      total_qty: number;
      assigned_qty: number;
      available_qty: number;
      sold_qty: number;
    }
  > = {};

  for (const [_, data] of Object.entries(map)) {
    if (!groups[data.item_id]) {
      groups[data.item_id] = {
        item_id: data.item_id,
        total_qty: 0,
        assigned_qty: 0,
        available_qty: 0,
        sold_qty: 0,
      };
    }

    if (data.status === "IN_STOCK") {
      groups[data.item_id].total_qty += data.quantity;
      groups[data.item_id].available_qty += data.quantity;
    } else if (data.status === "ASSIGNED") {
      groups[data.item_id].total_qty += data.quantity;
      groups[data.item_id].assigned_qty += data.quantity;
    } else if (data.status === "SOLD") {
      // SOLD items are removed from available/total — only tracked in sold_qty
      groups[data.item_id].sold_qty += data.quantity;
    }
    // CONSUMED: permanently removed from all counts
  }

  return Object.values(groups);
}

export function getTransactions() {
  return transactions;
}

export function buildAuditReport(scannedSerials: string[]) {
  const state = buildState(transactions);
  const systemSerials = Object.entries(state.serialMap)
    .filter(([_, data]) => data.status === "IN_STOCK")
    .map(([serial]) => serial);

  const missing = systemSerials.filter((s) => !scannedSerials.includes(s));
  const extra = scannedSerials.filter((s) => !systemSerials.includes(s));
  const matched = scannedSerials.filter((s) => systemSerials.includes(s)).length;

  return {
    totalSystem: systemSerials.length,
    totalScanned: scannedSerials.length,
    missingSerials: missing,
    extraSerials: extra,
    matched,
  };
}

export function getAgingReport(ledger: Transaction[] = transactions) {
  const state = buildState(ledger);
  const agingReport: any[] = [];

  for (const [serial, data] of Object.entries(state.serialMap)) {
    if (data.status === "ASSIGNED") {
      const ageDays = Math.floor((Date.now() - data.lastUpdated) / (1000 * 60 * 60 * 24));
      let status: "OK" | "WARNING" | "CRITICAL" = "OK";
      if (ageDays >= 15) status = "CRITICAL";
      else if (ageDays >= 7) status = "WARNING";

      agingReport.push({
        serial,
        productId: data.item_id,
        engineerId: data.currentHolder,
        ageDays,
        status,
      });
    }
  }

  return agingReport;
}
// --------------------------------------------------
// ACCESS CONTROL ENGINE (UAC) — MODULAR PERMISSION ARCHITECTURE
// --------------------------------------------------

export const PERMISSION_CONFIG = {
  modules: [
    { id: 'dashboard', name: 'Dashboard Central' },
    { id: 'inventory', name: 'Inventory Control' },
    { id: 'pos', name: 'Point of Sale' },
    { id: 'purchase', name: 'Purchase Entry' },
    { id: 'sales', name: 'Sales Ledger' },
    { id: 'expense', name: 'Expense Tracking' },
    { id: 'engineers', name: 'Engineer Portal' },
    { id: 'users', name: 'Access Control' },
    { id: 'reports', name: 'Financial Intelligence' },
    { id: 'master', name: 'Master Data Hub' }
  ],
  divisions: [
    { id: 'view', name: 'View Access' },
    { id: 'create', name: 'Create/Entry' },
    { id: 'edit', name: 'Modify/Update' },
    { id: 'delete', name: 'Purge/Delete' }
  ]
};

export interface UserPermission {
  userId: string;
  moduleId: string;
  divisionId: string;
  allowed: boolean;
}

let userPermissions: UserPermission[] = [];
const PERMISSIONS_STORAGE_KEY = 'uac_permissions_v1';

function savePermissions() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(userPermissions));
  }
}

function loadPermissions() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (saved) {
      try {
        userPermissions = JSON.parse(saved);
      } catch (e) {
        console.error("FAILED TO LOAD PERMISSIONS", e);
      }
    }
  }
}

loadPermissions();

export function getUserPermissions(userId: string): UserPermission[] {
  return userPermissions.filter(p => p.userId === userId);
}

export function updateUserPermission(userId: string, moduleId: string, divisionId: string, allowed: boolean) {
  const idx = userPermissions.findIndex(p => p.userId === userId && p.moduleId === moduleId && p.divisionId === divisionId);
  if (idx !== -1) {
    userPermissions[idx].allowed = allowed;
  } else {
    userPermissions.push({ userId, moduleId, divisionId, allowed });
  }
  savePermissions();
  return userPermissions.filter(p => p.userId === userId);
}

export function bulkUpdateModulePermissions(userId: string, moduleId: string, allowed: boolean) {
  PERMISSION_CONFIG.divisions.forEach(div => {
    const idx = userPermissions.findIndex(p => p.userId === userId && p.moduleId === moduleId && p.divisionId === div.id);
    if (idx !== -1) {
      userPermissions[idx].allowed = allowed;
    } else {
      userPermissions.push({ userId, moduleId, divisionId: div.id, allowed });
    }
  });
  savePermissions();
  return userPermissions.filter(p => p.userId === userId);
}

export function checkPermission(userId: string, moduleId: string, divisionId: string): boolean {
  // Super Admin override (assuming first user or role-based check)
  const p = userPermissions.find(p => p.userId === userId && p.moduleId === moduleId && p.divisionId === divisionId);
  return p ? p.allowed : false;
}

// --------------------------------------------------
// GLOBAL DEBUG INTERFACE
// --------------------------------------------------
if (typeof window !== "undefined") {
  (window as any).inventoryDebug = {
    transactions,
    buildState,
    getSerialHistory,
    getAvailableStock,
    getSoldStock,
    adjustStock,
    serialCounters,
  };
}

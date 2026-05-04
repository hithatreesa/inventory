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
  | "ADDITIONAL_PURCHASE"
  | "TRAVEL_EXPENSE";

export interface Transaction {
  id: string
  type: TransactionType

  item_id: string
  serial: string
  barcode?: string
  qty?: number       // alias used by some callers
  quantity: number

  source?: "PURCHASE" | "ADDITIONAL_PURCHASE" | "STORE_ISSUE" | "RETURN" | "JOB_USAGE"
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
transactions.push(
  // --- SEED INVENTORY (Stock Master) ---
  { id: "SEED-1", type: "INWARD", serial: "CBL-BULK", item_id: "ITM-CBL", quantity: 1000, timestamp: Date.now() - 2000000, to_location: "STORE", purchase_price: 25 },
  { id: "SEED-2", type: "INWARD", serial: "RTR-001", item_id: "ITM-RTR", quantity: 5, timestamp: Date.now() - 2000000, to_location: "STORE", purchase_price: 12000 },
  { id: "SEED-3", type: "INWARD", serial: "SWT-001", item_id: "ITM-SWT", quantity: 10, timestamp: Date.now() - 2000000, to_location: "STORE", purchase_price: 4500 },
  { id: "SEED-4", type: "INWARD", serial: "ADP-001", item_id: "ITM-ADP", quantity: 50, timestamp: Date.now() - 2000000, to_location: "STORE", purchase_price: 350 },

  // --- TICKET-001: Network Setup @ Acme (Full Cycle) ---
  { id: "T1-ISS-1", type: "OUTWARD", serial: "CBL-1", item_id: "ITM-CBL", quantity: 100, reference: "TCK-001", engineer_id: "eng1", timestamp: Date.now() - 86400000 },
  { id: "T1-ISS-2", type: "OUTWARD", serial: "RTR-1", item_id: "ITM-RTR", quantity: 1, reference: "TCK-001", engineer_id: "eng1", timestamp: Date.now() - 86400000 },
  { id: "T1-RET-1", type: "RETURN", serial: "CBL-1-RET", item_id: "ITM-CBL", quantity: 15, reference: "TCK-001", engineer_id: "eng1", timestamp: Date.now() - 43200000 },
  { id: "T1-PUR-1", type: "CONSUMED", serial: "WALL-MOUNTS", item_id: "Wall Mounts", quantity: 10, ticket_id: "TCK-001", cost: 1500, source: "ADDITIONAL_PURCHASE", affects_stock: false, timestamp: Date.now() - 43200000 },
  { id: "T1-EXP-1", type: "EXPENSE", serial: "EXP-T1", item_id: "Travel", quantity: 1, amount: 450, reference: "TCK-001", timestamp: Date.now() - 43200000, notes: "Site Visit" },

  // --- TICKET-002: Server Maintenance @ Globex ---
  { id: "T2-ISS-1", type: "OUTWARD", serial: "SWT-1", item_id: "SWT-001", quantity: 1, reference: "TCK-002", engineer_id: "eng2", timestamp: Date.now() - 172800000 },
  { id: "T2-EXP-1", type: "EXPENSE", serial: "EXP-T2", item_id: "Food", quantity: 1, amount: 200, reference: "TCK-002", timestamp: Date.now() - 172800000 },

  // --- TICKET-003: CCTV Install @ Nexus ---
  { id: "T3-ISS-1", type: "OUTWARD", serial: "ADP-1", item_id: "ITM-ADP", quantity: 8, reference: "TCK-003", engineer_id: "eng3", timestamp: Date.now() - 259200000 },
  { id: "T3-PUR-1", type: "CONSUMED", serial: "BNC-CONNECTORS", item_id: "BNC Connectors", quantity: 16, ticket_id: "TCK-003", cost: 800, source: "ADDITIONAL_PURCHASE", affects_stock: false, timestamp: Date.now() - 259200000 },
  { id: "T3-EXP-1", type: "EXPENSE", serial: "EXP-T3", item_id: "Fuel", quantity: 1, amount: 350, reference: "TCK-003", timestamp: Date.now() - 259200000 }
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
  const summary = getTicketSummary(ticketNo, txns);
  
  const revenue = txns.filter(t => (t.reference === ticketNo || t.ticket_id === ticketNo) && t.type === 'REVENUE')
                      .reduce((acc, t) => acc + (t.amount || t.price || 0), 0);

  const cost = summary.itemsUsed.reduce((acc, t) => acc + (t.qty * (t.cost || 0)), 0) +
               summary.purchases.reduce((acc, t) => acc + t.cost, 0);

  const expense = summary.expenses.reduce((acc, t) => acc + t.amount, 0);
  
  const profit = revenue - cost - expense;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return { revenue, cost, expense, profit, margin };
}

export function getTicketSummary(ticketNo: string, txns: Transaction[] = transactions) {
  const ticketTxns = txns.filter(t => t.reference === ticketNo || t.ticket_id === ticketNo || t.reference_id === ticketNo);
  
  // 1. Calculate Net Items Used (Issue - Return)
  const itemMap: Record<string, { item: string, qty: number, id: string, cost: number }> = {};
  
  ticketTxns.forEach(t => {
    if (t.type === 'OUTWARD' || t.type === 'RETURN') {
      const isReturn = t.type === 'RETURN';
      const key = t.item_id;
      if (!itemMap[key]) {
        itemMap[key] = { item: t.item_id, qty: 0, id: t.item_id, cost: t.purchase_price || t.price || 0 };
      }
      itemMap[key].qty += isReturn ? -t.quantity : t.quantity;
    }
  });

  // 2. Fetch Purchases (Outside Purchases / Consumed)
  const purchases = ticketTxns
    .filter(t => t.type === 'CONSUMED' && (t.source === 'ADDITIONAL_PURCHASE' || t.source === 'PURCHASE'))
    .map(t => ({
      item: t.item_id || t.serial,
      qty: t.quantity,
      cost: t.cost || t.amount || 0
    }));

  // 3. Fetch Expenses
  const expenses = ticketTxns
    .filter(t => t.type === 'EXPENSE')
    .map(t => ({
      name: t.item_id,
      amount: t.amount || t.price || 0,
      billImageUrl: (t as any).metadata?.attachment || '/placeholder-bill.jpg'
    }));

  return {
    itemsUsed: Object.values(itemMap).filter(i => i.qty > 0),
    purchases,
    expenses
  };
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
  if ((txn.type === 'INWARD' || txn.type === 'ADJUSTMENT') && txn.source !== 'RETURN') {
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

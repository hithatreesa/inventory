export type TransactionType = "INWARD" | "ASSIGN" | "RETURN" | "CONSUMED";

export interface Transaction {
  id: string
  type: TransactionType
  serial: string
  item_id: string
  engineer_id?: string
  timestamp: number
}

// In-Memory Ticking Engine bounds
let transactions: Transaction[] = [];
let serialCounters: Record<string, number> = {};

// Seed Data
serialCounters["ITM001"] = 2;
serialCounters["ITM002"] = 1;
transactions.push(
  { id: "MOCK-1", type: "INWARD", serial: "ITM001-1", item_id: "ITM001", timestamp: 1000 },
  { id: "MOCK-2", type: "INWARD", serial: "ITM001-2", item_id: "ITM001", timestamp: 1001 },
  { id: "MOCK-3", type: "INWARD", serial: "ITM002-1", item_id: "ITM002", timestamp: 1002 },
  { id: "MOCK-4", type: "ASSIGN", serial: "ITM001-1", item_id: "ITM001", engineer_id: "ENG001", timestamp: 1003 }
);

// --------------------------------------------------
// CORE ENGINE FUNCTIONS
// --------------------------------------------------

export function inwardItem(item_id: string): string {
  if (typeof serialCounters[item_id] === "undefined") {
    serialCounters[item_id] = 0;
  }
  serialCounters[item_id]++;
  const serial = `${item_id}-${serialCounters[item_id]}`;
  
  const state = buildState(transactions);
  if (state.serialMap[serial]) {
    throw new Error(`HARD_FAIL: Duplicate serial ${serial} detected.`);
  }

  transactions.push({
    id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type: "INWARD",
    serial,
    item_id,
    timestamp: Date.now()
  });

  return serial;
}

export function assignItem(serial: string, engineer_id: string) {
  const state = buildState(transactions);
  const item = state.serialMap[serial];

  if (!item) throw new Error(`HARD_FAIL: Serial ${serial} does not exist in ledger.`);
  if (item.status !== "IN_STOCK") throw new Error(`HARD_FAIL: Expected IN_STOCK for ${serial}, but found ${item.status}.`);

  transactions.push({
    id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type: "ASSIGN",
    serial,
    item_id: item.item_id,
    engineer_id,
    timestamp: Date.now()
  });
}

export function returnItem(serial: string) {
  const state = buildState(transactions);
  const item = state.serialMap[serial];

  if (!item) throw new Error(`HARD_FAIL: Serial ${serial} does not exist in ledger.`);
  if (item.status !== "ASSIGNED") throw new Error(`HARD_FAIL: Expected ASSIGNED for ${serial}, but found ${item.status}.`);

  transactions.push({
    id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type: "RETURN",
    serial,
    item_id: item.item_id,
    timestamp: Date.now()
  });
}

export function consumeItem(serial: string) {
  const state = buildState(transactions);
  const item = state.serialMap[serial];

  if (!item) throw new Error(`HARD_FAIL: Serial ${serial} does not exist in ledger.`);
  if (item.status !== "ASSIGNED") throw new Error(`HARD_FAIL: Expected ASSIGNED for ${serial}, but found ${item.status}. Cannot consume unassigned items.`);

  transactions.push({
    id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type: "CONSUMED",
    serial,
    item_id: item.item_id,
    timestamp: Date.now()
  });
}

// --------------------------------------------------
// DERIVATION ENGINE
// --------------------------------------------------

export function buildState(txns: Transaction[]) {
  const serialMap: Record<string, { status: "IN_STOCK" | "ASSIGNED" | "CONSUMED", item_id: string, engineer_id?: string }> = {};

  for (const t of txns) {
    if (t.type === "INWARD") {
      serialMap[t.serial] = { status: "IN_STOCK", item_id: t.item_id };
    } else if (t.type === "ASSIGN") {
      serialMap[t.serial].status = "ASSIGNED";
      serialMap[t.serial].engineer_id = t.engineer_id;
    } else if (t.type === "RETURN") {
      serialMap[t.serial].status = "IN_STOCK";
      serialMap[t.serial].engineer_id = undefined;
    } else if (t.type === "CONSUMED") {
      serialMap[t.serial].status = "CONSUMED";
      serialMap[t.serial].engineer_id = undefined;
    }
  }

  return { serialMap };
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

export function getEngineerItems(engineer_id: string) {
  const map = buildState(transactions).serialMap;
  return Object.entries(map)
    .filter(([_, data]) => data.engineer_id === engineer_id && data.status === "ASSIGNED")
    .map(([serial, data]) => ({ serial, ...data }));
}

export function getSerialHistory(serial: string) {
  return transactions.filter(t => t.serial === serial).sort((a, b) => a.timestamp - b.timestamp);
}

export function getAllItemsGrouped() {
  const map = buildState(transactions).serialMap;
  const groups: Record<string, { item_id: string, total_qty: number, assigned_qty: number, available_qty: number }> = {};

  for (const [_, data] of Object.entries(map)) {
      if (!groups[data.item_id]) {
          groups[data.item_id] = { item_id: data.item_id, total_qty: 0, assigned_qty: 0, available_qty: 0 };
      }
      
      // CONSUMED is permanently removed and does not contribute to qty counts.
      if (data.status === "IN_STOCK") {
          groups[data.item_id].total_qty++;
          groups[data.item_id].available_qty++;
      } else if (data.status === "ASSIGNED") {
          groups[data.item_id].total_qty++;
          groups[data.item_id].assigned_qty++;
      }
  }
  return Object.values(groups);
}

export function getTransactions() {
  return transactions;
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
    serialCounters
  };
}

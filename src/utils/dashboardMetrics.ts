// 1. TODAY SALES
export function getTodaySales(transactions: any[]) {
  const today = new Date().toDateString();

  return transactions
    .filter(t => t.type === "SALE" && new Date(t.created_at || t.date || Date.now()).toDateString() === today)
    .reduce((sum, t) => sum + (t.price * t.quantity), 0);
}

// 2. TODAY PURCHASE
export function getTodayPurchase(transactions: any[]) {
  const today = new Date().toDateString();

  return transactions
    .filter(t => t.type === "PURCHASE" && new Date(t.created_at || t.date || Date.now()).toDateString() === today)
    .reduce((sum, t) => sum + (t.price * t.quantity), 0);
}

// 3. PENDING APPROVALS (mock status)
export function getPendingApprovals(transactions: any[]) {
  return transactions.filter(t => t.status === "PENDING" || t.status === "Pending").length;
}

// 4. STOCK CALCULATION (IMPORTANT)
export function getStockMap(transactions: any[]) {
  const stock: Record<string, number> = {};

  transactions.forEach(t => {
    if (!stock[t.item_id]) stock[t.item_id] = 0;

    if (t.type === "PURCHASE" || t.type === "INWARD") stock[t.item_id] += t.quantity;
    if (t.type === "SALE" || t.type === "OUTWARD") stock[t.item_id] -= t.quantity;
    if (t.type === "RETURN") stock[t.item_id] += t.quantity;
  });

  return stock;
}

// 5. LOW STOCK ITEMS
export function getLowStockItems(items: any[], stockMap: Record<string, number>) {
  return items.filter(item => (stockMap[item.id] || 0) < 5);
}

// 6. STOCK VALUATION
export function getStockValuation(items: any[], stockMap: Record<string, number>) {
  return items.reduce((total, item) => {
    const qty = stockMap[item.id] || 0;
    return total + (qty * (item.cost_price || item.price || 0));
  }, 0);
}

// 7. TOP SELLING ITEMS
export function getTopSellingItems(transactions: any[], items: any[]) {
  const map: Record<string, number> = {};

  transactions.forEach(t => {
    if (t.type === "SALE") {
      map[t.item_id] = (map[t.item_id] || 0) + t.quantity;
    }
  });

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, qty]) => ({
      item: items.find(i => i.id == id),
      qty
    }));
}

// 8. PROFIT MARGIN SUMMARY
export function getProfitSummary(transactions: any[], items: any[]) {
  let revenue = 0;
  let cost = 0;

  transactions.forEach(t => {
    if (t.type === "SALE") {
      const item = items.find(i => i.id == t.item_id);
      if (item) {
        revenue += (t.price || item.price || 0) * t.quantity;
        cost += (item.cost_price || item.price || 0) * t.quantity;
      }
    }
  });

  const profit = revenue - cost;
  return {
    revenue,
    cost,
    profit,
    margin: revenue ? (profit / revenue) * 100 : 0
  };
}

// 9. CATEGORY-WISE SALES
export function getCategorySales(transactions: any[], items: any[]) {
  const map: Record<string, number> = {};

  transactions.forEach(t => {
    if (t.type === "SALE") {
      const item = items.find(i => i.id == t.item_id);
      if (item && item.category) {
        if (!map[item.category]) map[item.category] = 0;
        map[item.category] += t.quantity;
      }
    }
  });

  return map;
}

// 10. DEAD STOCK (no movement in 30 days)
export function getDeadStock(transactions: any[], items: any[]) {
  const last30 = Date.now() - (30 * 24 * 60 * 60 * 1000);

  return items.filter(item => {
    const recent = transactions.find(t =>
      t.item_id == item.id &&
      new Date(t.created_at || t.date || Date.now()).getTime() > last30
    );

    return !recent;
  });
}

// 11. FAST MOVING ITEMS
export function getFastMovingItems(transactions: any[], items: any[]) {
  const map: Record<string, number> = {};

  transactions.forEach(t => {
    if (t.type === "SALE") {
      map[t.item_id] = (map[t.item_id] || 0) + t.quantity;
    }
  });

  return Object.entries(map)
    .filter(([_, qty]) => qty > 20)
    .map(([id, qty]) => ({
      item: items.find(i => i.id == id),
      qty
    }));
}

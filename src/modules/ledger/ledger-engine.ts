import { LedgerLine, TaxSummaryRow, BillSundry } from './types';

export const calculateLineAmount = (qty: number, price: number) => {
  return Number((qty * price).toFixed(2));
};

export const calculateLedgerTotals = (lines: LedgerLine[], sundries: BillSundry[], isTaxApplied: boolean) => {
  let totalQty = 0;
  let taxableAmount = 0;
  const taxMap = new Map<number, TaxSummaryRow>();

  lines.forEach(line => {
    if (line.qty > 0) {
      totalQty += Number(line.qty);
      taxableAmount += line.amount;

      if (isTaxApplied && line.gstRate > 0) {
        if (!taxMap.has(line.gstRate)) {
          taxMap.set(line.gstRate, {
            taxRate: line.gstRate,
            taxableAmount: 0,
            cgst: 0,
            sgst: 0,
            igst: 0
          });
        }
        const bucket = taxMap.get(line.gstRate)!;
        bucket.taxableAmount += line.amount;
        bucket.cgst += line.amount * ((line.gstRate / 2) / 100);
        bucket.sgst += line.amount * ((line.gstRate / 2) / 100);
      }
    }
  });

  const taxSummaries = Array.from(taxMap.values());
  const totalTax = taxSummaries.reduce((acc, curr) => acc + curr.cgst + curr.sgst, 0);
  const sundryTotal = sundries.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  
  const grandTotal = Math.round(taxableAmount + totalTax + sundryTotal);

  return {
    totalQty,
    taxableAmount,
    taxSummaries,
    sundryTotal,
    grandTotal
  };
};

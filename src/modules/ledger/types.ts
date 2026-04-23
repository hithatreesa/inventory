export interface LedgerLine {
  id: string;
  sno: number;
  productId?: string;
  description: string;
  qty: number;
  unit: string;
  price: number;
  amount: number;
  gstRate: number;
  customerName?: string;
  isLocked?: boolean;
  serials?: string[];
}

export interface LedgerHeader {
  series: string;
  date: string;
  voucherNumber: string;
  type: string;
  gstType: string;
  partyAccount: string;
  materialCentre: string;
  narration: string;
  itcEligibility?: string;
  supplierReference?: string;
}

export interface TaxSummaryRow {
  taxRate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface BillSundry {
  id: string;
  name: string;
  percentage: number;
  amount: number;
}

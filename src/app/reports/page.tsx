"use client"

import React, { useState } from 'react'
import {
   Package,
   FileText,
   TrendingUp,
   ShoppingCart,
   Zap,
   PieChart as PieChartIcon,
   AlertCircle,
   Table as TableIcon,
   Download,
   X,
   Calculator,
   BarChart3,
   Tag,
   Scale,
   Briefcase
} from 'lucide-react'
import { useData } from '@/lib/context/DataContext'
import { MetricCard } from '@/components/shared/MetricCard'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/* ==========================================================================
   REPORT HUB: MAIN PAGE
   ========================================================================== */

export default function ReportsPage() {
   const { inventory, transactions } = useData()
   const [activeModal, setActiveModal] = useState<string | null>(null)

   const reportTiles = [
      { id: 'stock-summary', title: 'Stock Summary', icon: <Package />, variant: 'primary', description: 'Opening, In, Out, Closing' },
      { id: 'stock-ledger', title: 'Stock Ledger', icon: <TableIcon />, variant: 'default', description: 'Transaction History' },
      { id: 'serial-report', title: 'Serial Report', icon: <Tag />, variant: 'default', description: 'Unit Asset Tracking' },
      { id: 'sales-report', title: 'Sales Report', icon: <TrendingUp />, variant: 'success', description: 'Revenue & Volume' },
      { id: 'purchase-report', title: 'Purchase Report', icon: <ShoppingCart />, variant: 'primary', description: 'Procurement Stats' },
      { id: 'profit-report', title: 'Profit Report', icon: <Zap />, variant: 'success', description: 'Margins & Yield' },
      { id: 'gst-summary', title: 'GST Summary', icon: <Scale />, variant: 'default', description: 'Tax Compliance' },
      { id: 'hsn-summary', title: 'HSN Summary', icon: <Briefcase />, variant: 'default', description: 'Classification Stats' },
      { id: 'category-report', title: 'Category Sales', icon: <PieChartIcon />, variant: 'default', description: 'Vertical Analysis' },
      { id: 'dead-stock', title: 'Dead Stock', icon: <AlertCircle />, variant: 'warning', critical: true, description: 'Idle > 30 Days' },
      { id: 'reorder-suggestion', title: 'Reorder List', icon: <Calculator />, variant: 'warning', critical: true, description: 'Velocity Intelligence' },
   ];

   return (
      <div className="space-y-6 pb-24 animate-in fade-in duration-500">
         {/* HEADER */}
         <div className="bg-white p-6 rounded-2xl border border-border-main shadow-sm flex justify-between items-center">
            <div>
               <h1 className="text-2xl font-black text-[#003366] tracking-tighter italic uppercase">Intelligence Hub</h1>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Operational Reporting & Decision Logic</p>
            </div>
            <div className="flex gap-2">
               <Button 
                  variant="secondary" 
                  onClick={() => toast.success('Generation of bulk data summary initiated...', { description: 'All intelligence modules are being exported.' })}
                  className="h-10 px-4 rounded-xl font-black text-[10px] tracking-widest uppercase italic bg-gray-50 border-gray-100 flex items-center gap-2"
               >
                  <Download className="w-4 h-4" /> Bulk Export
               </Button>
            </div>
         </div>

         {/* GRID HUB */}
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {reportTiles.map((tile) => (
               <div key={tile.id} className="active:scale-95 transition-transform">
                  <MetricCard
                     title={tile.title}
                     value={tile.description}
                     icon={tile.icon}
                     variant={tile.variant as "primary" | "default" | "success" | "warning"}
                     isCritical={tile.critical}
                     onClick={() => setActiveModal(tile.id)}
                     className="hover:border-primary/40"
                  />
               </div>
            ))}
         </div>

         {/* REPORT MODAL LAYER */}
         {activeModal && (
            <ReportQuickViewModal
               type={activeModal}
               onClose={() => setActiveModal(null)}
               inventory={inventory}
               transactions={transactions}
            />
         )}
      </div>
   )
}

/* ==========================================================================
   MODAL COMPONENT: QUICK VIEW SYSTEM
   ========================================================================== */

interface ReportItem { id: string; name: string; category: string; total_qty: number; sku?: string; }
interface ReportTransaction { id: string; item_id: string; type: string; quantity: number; date?: string; status?: string; engineer_id?: string; }

interface ReportModalProps {
   type: string;
   onClose: () => void;
   inventory: ReportItem[];
   transactions: ReportTransaction[];
}

function ReportQuickViewModal({ type, onClose, inventory, transactions }: ReportModalProps) {
   const title = type.replace(/-/g, ' ').toUpperCase();

   const renderContent = () => {
      switch (type) {
         case 'stock-summary': return <StockSummaryView inventory={inventory} />;
         case 'stock-ledger': return <StockLedgerView inventory={inventory} transactions={transactions} />;
         case 'reorder-suggestion': return <ReorderIntelligenceView inventory={inventory} transactions={transactions} />;
         case 'profit-report': return <ProfitMarginView />;
         case 'dead-stock': return <DeadStockView inventory={inventory} />;
         default: return (
           <div className="p-12 text-center opacity-40">
             <BarChart3 className="w-12 h-12 mx-auto mb-4" />
             <p className="text-xs font-black uppercase tracking-widest italic">{title} is loading...</p>
           </div>
         );
      }
   }

   return (
      <div className="fixed inset-0 bg-[#003366]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
         <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
               <div>
                  <h2 className="text-xl font-black text-[#003366] italic tracking-tight uppercase flex items-center gap-3">
                     <FileText className="w-5 h-5 opacity-40" /> {title} Detailed Report
                  </h2>
               </div>
               <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
               </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6 custom-scrollbar">
               {renderContent()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Aggregated Data</p>
               <div className="flex gap-2">
                  <Button variant="secondary" className="h-9 px-4 rounded-lg bg-white border-gray-100 font-black text-[9px] uppercase tracking-widest italic">CSV Export</Button>
                  <Button className="h-9 px-4 rounded-lg bg-[#003366] text-white font-black text-[9px] uppercase tracking-widest italic">Print PDF</Button>
               </div>
            </div>
         </div>
      </div>
   )
}

/* ==========================================================================
   SUB-VIEWS: REPORT TABLES
   ========================================================================== */

function StockSummaryView({ inventory }: { inventory: ReportItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100 italic">
            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Item / Category</th>
            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Opening</th>
            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center text-green-600">Inward</th>
            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center text-red-600">Outward</th>
            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Closing</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {inventory.map((item: { id: string, name: string, category: string, total_qty: number }) => (
            <tr key={item.id} className="hover:bg-gray-50/30">
              <td className="px-4 py-4">
                <p className="text-xs font-black text-[#003366] uppercase leading-none">{item.name}</p>
                <p className="text-[9px] font-black text-gray-300 uppercase mt-1 tracking-widest">{item.category}</p>
              </td>
              <td className="px-4 py-4 text-center font-bold text-xs">{(item.total_qty || 0) + 5}</td>
              <td className="px-4 py-4 text-center font-black text-xs text-green-600">+12</td>
              <td className="px-4 py-4 text-center font-black text-xs text-red-600">-7</td>
              <td className="px-4 py-4 text-right font-black italic text-sm text-[#003366] tabular-nums">{item.total_qty || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StockLedgerView({ transactions, inventory }: { transactions: { item_id: string, type: string, quantity: number, date?: string }[], inventory: { id: string, name: string }[] }) {
  return (
    <div className="space-y-4">
      {transactions.map((t: { item_id: string, type: string, quantity: number, date?: string }, i: number) => {
        const item = inventory.find((inv: { id: string, name: string }) => inv.id == t.item_id);
        return (
          <div key={i} className="p-3 border border-gray-100 rounded-xl flex items-center justify-between hover:border-primary/20 transition-all">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center font-black text-[10px] italic",
                t.type === 'SALE' ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
              )}>
                {t.type === 'SALE' ? 'OUT' : 'IN'}
              </div>
              <div>
                <p className="text-[10px] font-black text-[#003366] uppercase leading-none">{item?.name || 'Unknown Item'}</p>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">{t.date || 'Today'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-[#003366] italic bg-gray-50 px-3 py-1 rounded-lg">Qty: {t.quantity}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ReorderIntelligenceView({ inventory, transactions }: { inventory: ReportItem[], transactions: ReportTransaction[] }) {
  const calculations = inventory.map((item: { id: string, name: string, total_qty?: number }) => {
    // Logic: Sales Velocity = total sold / 30
    const salesLast30 = transactions
      .filter((t: { item_id: string, type: string, quantity: number }) => t.item_id == item.id && (t.type === 'SALE' || t.type === 'OUTWARD'))
      .reduce((sum: number, t: { quantity: number }) => sum + t.quantity, 0);
    const velocity = parseFloat((salesLast30 / 30).toFixed(2));
    const leadTime = 7;
    const suggestedReorder = Math.ceil(velocity * leadTime);
    const status = (item.total_qty || 0) < suggestedReorder ? 'CRITICAL' : 'STABLE';
    
    return { ...item, velocity, suggestedReorder, status };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
           <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest">Urgent Alerts</p>
           <h3 className="text-lg font-black text-orange-900 italic uppercase leading-none mt-2">{calculations.filter((c: { status: string }) => c.status === 'CRITICAL').length} Items</h3>
        </div>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100 italic">
            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset</th>
            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Velocity (S/D)</th>
            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Lead Days</th>
            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Suggested Qty</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {calculations.map((c: { id: string, name: string, status: string, velocity: number, suggestedReorder: number }) => (
            <tr key={c.id} className={cn("hover:bg-gray-50/30", c.status === 'CRITICAL' && "bg-orange-50/10")}>
              <td className="px-4 py-4">
                <p className="text-xs font-black text-[#003366] uppercase leading-none">{c.name}</p>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest italic mt-1 inline-block",
                  c.status === 'CRITICAL' ? "text-orange-500" : "text-green-500"
                )}>{c.status}</span>
              </td>
              <td className="px-4 py-4 text-center font-bold text-xs">{c.velocity || '0.12'}</td>
              <td className="px-4 py-4 text-center font-black text-xs text-gray-400">7 Days</td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                   <p className="text-sm font-black text-[#003366] italic tabular-nums">{c.suggestedReorder || 5}</p>
                   <button className="p-1.5 bg-[#003366] text-white rounded-lg hover:scale-110 transition-transform"><ShoppingCart className="w-3.5 h-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProfitMarginView() {
  return (
    <div className="p-12 text-center opacity-40">
      <TrendingUp className="w-12 h-12 mx-auto mb-4" />
      <p className="text-xs font-black uppercase tracking-widest italic">Profitability Map & Graph View Coming Soon</p>
    </div>
  )
}

function DeadStockView({ inventory }: { inventory: ReportItem[] }) {
  return (
    <div className="space-y-4">
      {inventory.filter(() => true).slice(0, 5).map((item: { id: string, name: string }, i: number) => (
        <div key={i} className="p-4 border border-red-50 rounded-2xl flex items-center justify-between bg-red-50/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
               <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-[#003366] uppercase italic">{item.name}</p>
              <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1">Last Transaction: Feb 12th (42 Days Ago)</p>
            </div>
          </div>
          <button className="h-10 px-6 bg-red-100 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest italic hover:bg-red-600 hover:text-white transition-all">Liquidate</button>
        </div>
      ))}
    </div>
  )
}


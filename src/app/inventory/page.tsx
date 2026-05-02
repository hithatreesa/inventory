"use client"

import React, { useState, useMemo, useEffect } from 'react'
import {
   Search,
   Download,
   Plus,
   Filter,
   Eye,
   Edit2,
   Package,
   Boxes,
   AlertCircle,
   X,
   Share2,
   Trash2,
   ArrowRightLeft,
   ChevronRight,
   Archive,
   Hash,
   Info,
   ChevronDown,
   Building2,
   Users2,
   Package2
} from 'lucide-react'
import { useData } from '@/lib/context/DataContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MetricCard } from '@/components/shared/MetricCard'
import { ItemModal } from '@/components/modals/ItemModal'
import { OutsidePurchaseModal } from '@/components/modals/OutsidePurchaseModal'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Sub-component for Side Panels
function SidePanel({
   isOpen,
   onClose,
   title,
   children,
   subtitle
}: {
   isOpen: boolean;
   onClose: () => void;
   title: string;
   children: React.ReactNode;
   subtitle?: string;
}) {
   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[100] flex justify-end">
         <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
         <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
               <div>
                  <h2 className="text-xl font-black text-[#003366] italic tracking-tight uppercase leading-none">{title}</h2>
                  {subtitle && <p className="text-sm font-black text-gray-400 uppercase tracking-widest mt-2">{subtitle}</p>}
               </div>
               <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all group">
                  <X className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               {children}
            </div>
         </div>
      </div>
   )
}

export default function InventoryPage() {
   const { inventory, transactions, engineers, returnAsset, deleteItems, adjustItem } = useData()
   const [selectedIds, setSelectedIds] = useState<string[]>([])
   const [viewMode, setViewMode] = useState<'stock' | 'outside_purchase'>('stock')
   const [filters, setFilters] = useState({
      search: '',
      category: 'All Divisions',
      brand: 'All Brands',
      status: 'All Status',
      warehouse: 'All Warehouses',
      source: 'All Sources'
   })
   const [isOPModalOpen, setIsOPModalOpen] = useState(false)
   const [activePanel, setActivePanel] = useState<{ type: 'detail' | 'serials', id: string } | null>(null)
   const [isItemModalOpen, setIsItemModalOpen] = useState(false)
   const [editingItem, setEditingItem] = useState<unknown>(null)
   const [exportMenuOpen, setExportMenuOpen] = useState<'top' | 'mobile' | 'bulk' | null>(null)

   useEffect(() => {
      const onScan = (e: Event) => {
         const customEvent = e as CustomEvent<{ item: { id: string, name: string, barcode: string } }>;
         const { item } = customEvent.detail;
         if (item) {
            const qty = prompt(`Adjust stock for ${item.name} (barcode: ${item.barcode}). Enter adjustment quantity (+/-):`, "0");
            if (qty !== null && qty !== "0") {
               adjustItem(item.id, Number(qty), 'SCAN_ADJUST');
            }
         }
      };
      window.addEventListener('barcode-scanned', onScan);
      return () => window.removeEventListener('barcode-scanned', onScan);
   }, [adjustItem]);

   const handleExport = (type: 'company' | 'engineer' | 'inhand') => {
      import('jspdf').then(jsPDFModule => {
         import('jspdf-autotable').then(autoTableModule => {
            const jsPDF = jsPDFModule.default;
            const autoTable = autoTableModule.default;
            const doc = new jsPDF();
            const dateStr = new Date().toLocaleDateString();

            if (type === 'company') {
               doc.text(`Company Inventory Report - ${dateStr}`, 14, 15);
               const tableData = inventory.map(item => [
                  item.name, item.sku || 'N/A', item.category, item.total_qty.toString(), item.assigned_qty.toString(), `Rs. ${item.price || 0}`
               ]);
               autoTable(doc, {
                  startY: 20,
                  head: [['Product Specification', 'SKU', 'Division', 'Total Qty', 'In Use', 'Unit Val']],
                  body: tableData,
               });
               doc.save(`Company_Inventory_${dateStr}.pdf`);
            } else if (type === 'engineer') {
               doc.text(`Engineer Asset Assignment Report - ${dateStr}`, 14, 15);
               const inUseTxns = transactions.filter((t: any) => t.status === 'In Use' && t.engineer_id);
               const tableData = inUseTxns.map((t: any) => {
                  const item = inventory.find(i => i.id == t.item_id);
                  const eng = (engineers || []).find((e: { id: string }) => e.id == t.engineer_id);
                  return [
                     eng ? eng.name : (t.engineer_id || 'N/A'),
                     item ? item.name : 'Unknown Item',
                     item ? (item.sku || 'N/A') : 'N/A',
                     (t.quantity || 0).toString()
                  ];
               });
               autoTable(doc, {
                  startY: 20,
                  head: [['Personnel', 'Product Specification', 'SKU', 'Qty Assigned']],
                  body: tableData,
               });
               doc.save(`Engineer_Assets_${dateStr}.pdf`);
            } else if (type === 'inhand') {
               doc.text(`In-Hand Stock Report - ${dateStr}`, 14, 15);
               const inhandItems = inventory.filter((i: { total_qty: number, assigned_qty: number }) => (i.total_qty - i.assigned_qty) > 0);
               const tableData = inhandItems.map(item => [
                  item.name, item.sku || 'N/A', item.category, item.location || 'N/A', (item.total_qty - item.assigned_qty).toString()
               ]);
               autoTable(doc, {
                  startY: 20,
                  head: [['Product Specification', 'SKU', 'Division', 'Warehouse', 'On Hand']],
                  body: tableData,
               });
               doc.save(`InHand_Stock_${dateStr}.pdf`);
            }
         });
      });
      setExportMenuOpen(null);
   };

   const filteredItems = useMemo(() => {
      return inventory.filter(item => {
         const matchSearch = item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            (item.model && item.model.toLowerCase().includes(filters.search.toLowerCase())) ||
            (item.sku && item.sku.toLowerCase().includes(filters.search.toLowerCase()))

         const available = item.total_qty - item.assigned_qty;
         const matchStatus = filters.status === 'All Status' ||
            (filters.status === 'In Stock' && available > 0) ||
            (filters.status === 'Out of Stock' && available === 0)

         const matchCategory = filters.category === 'All Divisions' || item.category === filters.category
         const matchBrand = filters.brand === 'All Brands' || item.brand === filters.brand
         const matchWarehouse = filters.warehouse === 'All Warehouses' || item.location === filters.warehouse

         return matchSearch && matchStatus && matchCategory && matchBrand && matchWarehouse
      })
   }, [inventory, filters])

   const filteredTransactions = useMemo(() => {
      return transactions.filter(t => {
         if (viewMode === 'outside_purchase' && t.source !== 'OUTSIDE_PURCHASE') return false;

         const matchSearch = (t.item_id || '').toLowerCase().includes(filters.search.toLowerCase()) ||
            (t.reference || '').toLowerCase().includes(filters.search.toLowerCase()) ||
            (t.ticket_id || '').toLowerCase().includes(filters.search.toLowerCase()) ||
            (t.serial || '').toLowerCase().includes(filters.search.toLowerCase())

         const matchSource = filters.source === 'All Sources' || t.source === filters.source
         const matchWarehouse = filters.warehouse === 'All Warehouses' || t.warehouse_id === filters.warehouse

         return matchSearch && matchSource && matchWarehouse
      })
   }, [transactions, filters, viewMode])

   const stats = useMemo(() => {
      const totalItems = inventory.length
      const totalInStock = inventory.reduce((acc, item) => acc + (item.total_qty - item.assigned_qty), 0)
      const totalAssigned = inventory.reduce((acc, item) => acc + item.assigned_qty, 0)
      const outOfStock = inventory.filter(i => (i.total_qty - i.assigned_qty) === 0).length
      return { totalItems, totalInStock, totalAssigned, outOfStock }
   }, [inventory])

   const toggleSelect = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
   }

   const toggleSelectAll = () => {
      setSelectedIds(selectedIds.length === filteredItems.length && filteredItems.length > 0 ? [] : filteredItems.map(i => i.id))
   }

   const handleDelete = async (ids: string[]) => {
      if (!confirm(`Are you sure you want to delete ${ids.length} item(s)?`)) return
      try {
         await deleteItems(ids)
         toast.success('Items deleted successfully')
         setSelectedIds([])
      } catch (err: unknown) {
         const error = err as Error;
         toast.error(error.message || 'Failed to delete items')
      }
   }

   const openAddModal = () => {
      setEditingItem(null)
      setIsItemModalOpen(true)
   }

   const openEditModal = (item: { id: string, name: string }) => {
      setEditingItem(item)
      setIsItemModalOpen(true)
   }

   const activeItem = useMemo(() => inventory.find(i => i.id === activePanel?.id), [activePanel, inventory])

   const categories = useMemo(() => {
      const cats = Array.from(new Set(inventory.map(i => i.category))).filter(Boolean)
      return ['All Divisions', ...cats]
   }, [inventory])

   return (
      <div className="space-y-6 pb-24 animate-in fade-in duration-500 text-text-main">
         {/* TOP HEADER BAR */}
         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-border-main shadow-sm gap-6 sm:gap-8 transition-all duration-300">
            <div className="w-full lg:w-auto">
               <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-4xl font-black text-[#003366] tracking-tighter italic uppercase underline decoration-primary/20 decoration-4 leading-tight">Inventory Management</h1>
               </div>
            </div>

            {/* Action Row - Fixed for zero-clipping scroll */}
            <div className="w-full lg:w-auto flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar-hide snap-x -mr-6 sm:mr-0 px-2 sm:px-0">
               <Button
                  variant="secondary"
                  className="flex-shrink-0 h-10 lg:h-12 px-3 sm:px-5 rounded-xl sm:rounded-2xl font-black text-[8px] sm:text-[10px] tracking-widest uppercase italic bg-white border-2 border-gray-100 hover:bg-gray-50 flex items-center justify-center gap-2 sm:gap-3 snap-start"
                  onClick={() => toast.info('Import functionality coming soon')}
               >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-primary" /> Import
               </Button>

               <div className="relative flex-shrink-0 snap-start">
                  <Button
                     variant="secondary"
                     className="h-10 lg:h-12 px-3 sm:px-5 rounded-xl sm:rounded-2xl font-black text-[8px] sm:text-[10px] tracking-widest uppercase italic bg-white border-2 border-gray-100 hover:bg-gray-50 flex items-center justify-center gap-2 sm:gap-3"
                     onClick={() => setExportMenuOpen(exportMenuOpen === 'top' ? null : 'top')}
                  >
                     <Download className="w-3 h-3 sm:w-4 sm:h-4 text-primary" /> Export
                  </Button>
                  {exportMenuOpen === 'top' && (
                     <div className="absolute top-full mt-3 right-0 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl z-[100] flex flex-col py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onMouseLeave={() => setExportMenuOpen(null)}>
                        <button className="px-5 py-3 hover:bg-gray-50 text-left font-black text-[10px] text-[#003366] uppercase tracking-widest italic flex items-center gap-3" onClick={() => handleExport('company')}>Company</button>
                        <button className="px-5 py-3 hover:bg-gray-50 text-left font-black text-[10px] text-[#003366] uppercase tracking-widest italic flex items-center gap-3" onClick={() => handleExport('engineer')}>Engineer</button>
                        <button className="px-5 py-3 hover:bg-gray-50 text-left font-black text-[10px] text-[#003366] uppercase tracking-widest italic flex items-center gap-3" onClick={() => handleExport('inhand')}>Inhand</button>
                     </div>
                  )}
               </div>

               <Button
                  className="flex-shrink-0 h-10 lg:h-12 px-5 sm:px-8 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[11px] tracking-widest uppercase italic shadow-lg sm:shadow-xl shadow-primary/20 flex items-center justify-center gap-2 sm:gap-3 bg-primary text-white snap-end"
                  onClick={openAddModal}
               >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> Add Item
               </Button>
            </div>
         </div>

         <ItemModal
            isOpen={isItemModalOpen}
            onClose={() => setIsItemModalOpen(false)}
            item={editingItem}
         />

         <OutsidePurchaseModal
            isOpen={isOPModalOpen}
            onClose={() => setIsOPModalOpen(false)}
         />

         {/* VIEW MODE TOGGLE */}
         <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
            <button
               onClick={() => setViewMode('stock')}
               className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all",
                  viewMode === 'stock' ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
               )}
            >
               Stock Balance
            </button>
            <button
               onClick={() => setViewMode('outside_purchase')}
               className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all",
                  viewMode === 'outside_purchase' ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
               )}
            >
               Outside Purchase
            </button>
         </div>

         {/* Section 2: KPI Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <MetricCard
               title="Total Inventory Types"
               value={stats.totalItems}
               icon={<Boxes className="w-5 h-5" />}
               variant="primary"
               onClick={() => toast.info("Viewing system-wide product categories")}
            />
            <MetricCard
               title="Current In-Stock Assets"
               value={stats.totalInStock}
               icon={<Package className="w-5 h-5" />}
               variant="default"
               onClick={() => toast.info("Filtering view to Available Assets only")}
            />
            <MetricCard
               title="Assigned (In Use) Assets"
               value={stats.totalAssigned}
               icon={<AlertCircle className="w-5 h-5" />}
               variant="warning"
               href="/inventory/registry"
            />
            <MetricCard
               title="Out of Stock Items"
               value={stats.outOfStock}
               icon={<X className="w-5 h-5" />}
               variant="warning"
               isCritical={stats.outOfStock > 0}
               href="/reports/stock"
            />
         </div>

         {/* FILTER SECTION */}
         <div id="filter-section" className="bg-white p-6 rounded-3xl border border-border-main shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
               <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-black text-[#003366] uppercase tracking-widest italic">Operational Filters</h4>
               </div>
               <button
                  onClick={() => setFilters({
                     search: '',
                     category: 'All Categories',
                     brand: 'All Brands',
                     source: 'All Sources',
                     status: 'All Status',
                     warehouse: 'All Warehouses'
                  })}
                  className="text-sm font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors underline decoration-dotted"
               >
                  Clear Filters
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
               <div className="space-y-1.5 lg:col-span-1">
                  <div className="relative">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                     <Input
                        placeholder="Search by name, barcode, or SKU"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="h-12 pl-12 bg-gray-50 border-gray-100 placeholder:italic text-sm font-bold rounded-xl"
                     />
                  </div>
               </div>

               <div className="space-y-1.5">
                  <select
                     value={filters.category}
                     onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                     className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold appearance-none italic focus:outline-none focus:ring-2 focus:ring-primary/5"
                  >
                     <option>All Divisions</option>
                     {categories.filter(c => c !== 'All Categories').map(cat => <option key={cat}>{cat}</option>)}
                  </select>
               </div>

               <div className="space-y-1.5">
                  <select
                     value={filters.brand}
                     onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                     className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold appearance-none italic focus:outline-none focus:ring-2 focus:ring-primary/5"
                  >
                     <option>All Brands</option>
                     <option>Nvidia</option>
                     <option>Intel</option>
                     <option>Cisco</option>
                  </select>
               </div>

               <div className="space-y-1.5">
                  <select
                     value={filters.warehouse}
                     onChange={(e) => setFilters({ ...filters, warehouse: e.target.value })}
                     className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold appearance-none italic focus:outline-none focus:ring-2 focus:ring-primary/5"
                  >
                     <option>All Warehouses</option>
                     <option>Main Distribution</option>
                     <option>Secondary Hub</option>
                  </select>
               </div>

               <div className="space-y-1.5">
                  <select
                     value={filters.status}
                     onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                     className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold appearance-none italic focus:outline-none focus:ring-2 focus:ring-primary/5"
                  >
                     <option>All Status</option>
                     <option>In Stock</option>
                     <option>Low Stock</option>
                     <option>Out of Stock</option>
                  </select>
               </div>
            </div>
         </div>

         {/* DATA TABLE */}
         <div className="bg-white rounded-3xl border border-border-main flex flex-col overflow-hidden shadow-sm">
            {viewMode === 'stock' ? (
               filteredItems.length > 0 ? (
                  <div className="overflow-x-auto min-h-[500px]">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-gray-50/50 border-b border-gray-100">
                              <th className="px-8 py-5 w-10">
                                 <input
                                    type="checkbox"
                                    checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/10"
                                 />
                              </th>
                              <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic">Product Specification</th>
                              <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic">Division</th>
                              <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic">Warehouse</th>
                              <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic text-center">On Hand</th>
                              <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic text-center">In Use</th>
                              <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic text-right">Unit Val</th>
                              <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic text-center">Status</th>
                              <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {filteredItems.map((item) => (
                              <tr key={item.id} className={cn(
                                 "group hover:bg-gray-50/20 transition-all cursor-pointer",
                                 selectedIds.includes(item.id) && "bg-primary/5"
                              )} onClick={() => setActivePanel({ type: 'detail', id: item.id })}>
                                 <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                                    <input
                                       type="checkbox"
                                       checked={selectedIds.includes(item.id)}
                                       onChange={() => toggleSelect(item.id)}
                                       className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/10 transition-transform active:scale-90"
                                    />
                                 </td>
                                 <td className="px-6 py-6 font-bold text-text-main">
                                    <p className="font-bold text-[#003366] italic tracking-tight uppercase leading-none">{item.name}</p>
                                    <p className="text-sm font-mono font-black text-gray-400 uppercase tracking-widest mt-1.5">{item.sku}</p>
                                 </td>
                                 <td className="px-6 py-6">
                                    <span className="text-sm font-black tracking-widest italic uppercase text-primary/60">{item.category}</span>
                                 </td>
                                 <td className="px-6 py-6">
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic">{item.location}</p>
                                 </td>
                                 <td className="px-6 py-6 text-center">
                                    <button
                                       onClick={(e) => { e.stopPropagation(); setActivePanel({ type: 'serials', id: item.id }); }}
                                       className="mx-auto px-3 py-1 bg-[#003366]/5 rounded-xl border border-[#003366]/10 flex items-center justify-center gap-2 hover:bg-[#003366]/10 transition-all group/sn active:scale-95"
                                    >
                                       <Hash className="w-3 h-3 text-[#003366] opacity-40 group-hover/sn:opacity-100" />
                                       <span className="text-sm font-black text-[#003366] italic tabular-nums">{item.total_qty} Units</span>
                                    </button>
                                 </td>
                                 <td className="px-6 py-6 text-center">
                                    <p className="text-sm font-black text-gray-400 tabular-nums italic">{item.assigned_qty}</p>
                                 </td>
                                 <td className="px-6 py-6 text-right font-black italic text-sm text-[#003366] tabular-nums tracking-tighter">
                                    ₹{(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                 </td>
                                 <td className="px-6 py-6 text-center">
                                    <span className={cn(
                                       "italic font-black text-sm tracking-tighter uppercase px-2.5 h-6 flex items-center justify-center rounded-lg shadow-sm border border-transparent",
                                       (item.total_qty - item.assigned_qty) > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                    )}>
                                       {(item.total_qty - item.assigned_qty) > 0 ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                 </td>
                                 <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1">
                                       <button onClick={() => setActivePanel({ type: 'detail', id: item.id })} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-primary hover:bg-primary/5 transition-all">
                                          <Eye className="w-4 h-4" />
                                       </button>
                                       <button onClick={() => openEditModal(item)} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-primary hover:bg-primary/5 transition-all">
                                          <Edit2 className="w-4 h-4" />
                                       </button>
                                       <div className="w-[1px] h-6 bg-gray-50 mx-1" />
                                       <button onClick={() => handleDelete([item.id])} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                                          <Trash2 className="w-4 h-4" />
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
                     <div className="w-24 h-24 bg-primary/5 rounded-[40px] flex items-center justify-center mb-8 relative group">
                        <div className="absolute inset-0 bg-primary/10 rounded-[40px] animate-ping opacity-20" />
                        <Package className="w-10 h-10 text-primary relative z-10 group-hover:scale-110 transition-transform duration-500" />
                     </div>
                     <h3 className="text-2xl font-black text-[#003366] italic tracking-tight uppercase mb-3">No items found</h3>
                     <p className="text-sm text-gray-400 font-bold max-w-md leading-relaxed mb-10 italic">No items found. Add your first product.</p>
                     <Button size="xl" className="h-16 px-12 rounded-2xl font-black text-sm tracking-widest uppercase italic shadow-2xl shadow-primary/30" onClick={openAddModal}>
                        <Plus className="w-5 h-5 mr-3" /> Add Item
                     </Button>
                  </div>
               )
            ) : (
               /* OUTSIDE PURCHASE VIEW */
               filteredTransactions.length > 0 ? (
                  <div className="overflow-x-auto min-h-[500px]">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-gray-50/50 border-b border-gray-100">
                              <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic">Date</th>
                              <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic">Item / Descr.</th>
                              <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic text-center">Qty</th>
                              <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic">Ticket / Ref</th>
                              <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic text-right">Cost</th>
                              <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest italic text-right">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {filteredTransactions.map((txn) => (
                              <tr key={txn.id} className="group hover:bg-gray-50/20 transition-all cursor-default">
                                 <td className="px-8 py-6">
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic">{txn.date}</p>
                                 </td>
                                 <td className="px-6 py-6 font-bold text-text-main">
                                    <p className="font-bold text-[#003366] italic tracking-tight uppercase leading-none">
                                       {inventory.find(i => i.id === txn.item_id)?.name || txn.item_id}
                                    </p>
                                    <p className="text-[10px] font-mono font-black text-gray-300 uppercase tracking-widest mt-1.5">{txn.serial || 'EXTERNAL'}</p>
                                 </td>
                                 <td className="px-6 py-6 text-center font-black italic tabular-nums text-sm">
                                    {txn.quantity}
                                 </td>
                                 <td className="px-6 py-6">
                                    <p className="text-sm font-black text-primary uppercase tracking-tighter italic">{txn.ticket_id || txn.reference || '-'}</p>
                                 </td>
                                 <td className="px-6 py-6 text-right font-black italic text-sm text-[#003366] tabular-nums tracking-tighter">
                                    ₹{(txn.cost || 0).toLocaleString('en-IN')}
                                 </td>
                                 <td className="px-8 py-6 text-right">
                                    <span className="italic font-black text-[10px] tracking-tighter uppercase px-2 py-0.5 rounded border bg-orange-50 text-orange-600 border-orange-100">
                                       CONSUMED
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
                     <Archive className="w-12 h-12 text-gray-200 mb-4" />
                     <h3 className="text-xl font-black text-[#003366] italic tracking-tight uppercase mb-2">No outside purchases recorded</h3>
                     <p className="text-sm text-gray-400 font-bold italic">Link your external costs to tickets to see them here.</p>
                  </div>
               )
            )}

            {/* PAGINATION */}
            <div className="p-8 bg-gray-50/30 border-t border-gray-100 flex items-center justify-end gap-6">
               <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-gray-400 uppercase tracking-widest italic">Rows per page:</span>
                  <select className="bg-white border border-gray-100 rounded-lg text-sm font-black px-3 py-1.5 focus:outline-none focus:ring-4 focus:ring-primary/5 italic">
                     <option>10</option>
                     <option>25</option>
                     <option>50</option>
                  </select>
               </div>
               <div className="flex items-center gap-2">
                  {[1, 2, 3].map(i => (
                     <button key={i} className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all border",
                        i === 1 ? "bg-[#003366] text-white border-[#003366] shadow-lg shadow-primary/20" : "bg-white text-gray-300 border-gray-100 hover:border-gray-200"
                     )}>{i}</button>
                  ))}
                  <button className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 hover:text-primary transition-all ml-1">
                     <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </div>
         </div>

         {/* BULK ACTION BAR */}
         <div className={cn(
            "fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] transition-all duration-500 transform",
            selectedIds.length > 0 ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
         )}>
            <div className="bg-[#003366] rounded-[32px] p-2 pr-6 flex items-center gap-8 shadow-[0_20px_50px_rgba(0,51,102,0.4)] border border-primary/20 backdrop-blur-xl">
               <div className="bg-white/10 px-6 py-4 rounded-[24px] border border-white/10 flex items-center gap-3">
                  <Archive className="w-5 h-5 text-white animate-pulse" />
                  <p className="text-white font-black italic tracking-tighter leading-none">
                     <span className="text-xl mr-2">{selectedIds.length}</span>
                     <span className="text-sm uppercase tracking-widest opacity-60">Selected</span>
                  </p>
               </div>
               <div className="flex gap-2">
                  <div className="relative">
                     <button
                        className="h-12 px-6 rounded-2xl bg-white/5 text-white font-black text-sm tracking-widest uppercase italic flex items-center gap-2 hover:bg-white/10 hover:translate-y-[-2px] transition-all"
                        onClick={() => setExportMenuOpen(exportMenuOpen === 'bulk' ? null : 'bulk')}
                     >
                        <Download className="w-4 h-4 text-primary" /> BULK EXPORT
                     </button>
                     {exportMenuOpen === 'bulk' && (
                        <div className="absolute bottom-full mb-2 right-0 w-36 bg-white border border-gray-100 rounded-xl shadow-xl z-50 flex flex-col py-1 overflow-hidden" onMouseLeave={() => setExportMenuOpen(null)}>
                           <button className="px-4 py-2.5 hover:bg-gray-50 text-left font-black text-xs text-[#003366] uppercase tracking-widest italic transition-colors" onClick={() => handleExport('company')}>Company</button>
                           <button className="px-4 py-2.5 hover:bg-gray-50 text-left font-black text-xs text-[#003366] uppercase tracking-widest italic transition-colors" onClick={() => handleExport('engineer')}>Engineer</button>
                           <button className="px-4 py-2.5 hover:bg-gray-50 text-left font-black text-xs text-[#003366] uppercase tracking-widest italic transition-colors" onClick={() => handleExport('inhand')}>Inhand</button>
                        </div>
                     )}
                  </div>
                  <button className="h-12 px-6 rounded-2xl bg-white/5 text-white font-black text-sm tracking-widest uppercase italic flex items-center gap-2 hover:bg-white/10 hover:translate-y-[-2px] transition-all" onClick={() => toast.info('Transfer functionality coming soon')}>
                     <ArrowRightLeft className="w-4 h-4 text-primary" /> Transfer Stock
                  </button>
                  <button onClick={() => handleDelete(selectedIds)} className="h-12 px-6 rounded-2xl bg-red-500/10 text-red-100 font-black text-sm tracking-widest uppercase italic flex items-center gap-2 hover:bg-red-500/20 hover:translate-y-[-2px] transition-all border border-red-500/20">
                     <Trash2 className="w-4 h-4 text-red-500" /> Delete
                  </button>
               </div>
               <button onClick={() => setSelectedIds([])} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all group lg:ml-4">
                  <X className="w-5 h-5 text-white/40 group-hover:text-white" />
               </button>
            </div>
         </div>

         {/* SIDE PANELS */}
         <SidePanel
            isOpen={activePanel?.type === 'detail'}
            onClose={() => setActivePanel(null)}
            title="Item Detail"
            subtitle={`Model: ${activeItem?.sku || 'N/A'}`}
         >
            {activeItem && (
               <div className="space-y-10">
                  <div className="bg-primary/5 rounded-[40px] p-10 border border-primary/10 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                     <div className="relative z-10">
                        <span className="inline-block mb-6 font-black italic tracking-widest text-primary uppercase text-sm">{activeItem?.category}</span>
                        <h3 className="text-4xl font-black text-[#003366] italic tracking-tighter uppercase leading-tight mb-4">{activeItem?.name}</h3>
                        <div className="flex gap-8">
                           <div>
                              <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic mb-1">SKU / Part Number</p>
                              <p className="text-sm font-black text-[#003366] font-mono tracking-widest">{activeItem?.sku}</p>
                           </div>
                           <div className="w-[1px] h-8 bg-[#003366]/10" />
                           <div>
                              <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic mb-1">Status</p>
                              <span className={cn(
                                 "font-black italic px-3 rounded-lg shadow-sm uppercase text-sm h-6 flex items-center justify-center border border-transparent",
                                 ((activeItem?.total_qty || 0) - (activeItem?.assigned_qty || 0)) > 0 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                              )}>{((activeItem?.total_qty || 0) - (activeItem?.assigned_qty || 0)) > 0 ? 'In Stock' : 'Out of Stock'}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Boxes className="w-5 h-5" /></div>
                        <div>
                           <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic leading-none mb-2">Total Stock</p>
                           <p className="text-3xl font-black text-[#003366] italic tracking-tighter uppercase leading-none">{activeItem?.total_qty}</p>
                        </div>
                     </div>
                     <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Info className="w-5 h-5" /></div>
                        <div>
                           <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic leading-none mb-2">In Possession</p>
                           <p className="text-3xl font-black text-gray-300 italic tracking-tighter uppercase leading-none">{activeItem?.assigned_qty}</p>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-6 pt-4">
                     <h4 className="text-sm font-black text-[#003366] uppercase tracking-[0.2em] border-b border-gray-50 pb-4 italic">Specifications</h4>
                     <div className="space-y-4">
                        {[
                           { label: 'Warehouse', value: activeItem.location || 'Main Distribution' },
                           { label: 'Brand', value: activeItem.brand || 'N/A' },
                           { label: 'Price (Default)', value: `₹${(activeItem.price || 0).toLocaleString('en-IN')}` },
                           { label: 'GST Configuration', value: activeItem.category === 'Hardware' ? '18%' : '12%' },
                        ].map((row, i) => (
                           <div key={i} className="flex justify-between items-center py-2 px-4 rounded-xl hover:bg-gray-50 transition-colors group">
                              <span className="text-sm font-black text-gray-400 uppercase tracking-widest italic group-hover:text-primary transition-colors">{row.label}</span>
                              <span className="text-sm font-black text-[#003366] italic uppercase">{row.value}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="pt-10 flex gap-4">
                     <Button size="xl" className="flex-1 rounded-3xl font-black text-sm italic tracking-widest uppercase h-16 shadow-xl shadow-primary/20" onClick={() => activeItem && openEditModal(activeItem)}>
                        <Edit2 className="w-4 h-4 mr-3" /> Edit Item
                     </Button>
                     <Button variant="secondary" size="xl" className="rounded-3xl px-12 font-black text-sm italic tracking-widest uppercase h-16 border-gray-100 bg-gray-50/50" onClick={() => toast.info('Share functionality coming soon')}>
                        <Share2 className="w-4 h-4" />
                     </Button>
                  </div>
               </div>
            )}
         </SidePanel>

         <SidePanel
            isOpen={activePanel?.type === 'serials'}
            onClose={() => setActivePanel(null)}
            title="Asset Tracking"
            subtitle={`SKU: ${activeItem?.sku || 'N/A'}`}
         >
            <div className="space-y-8">
               <div className="bg-[#003366] rounded-[40px] p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="relative z-10 flex flex-col items-center justify-center text-center">
                     <p className="text-sm font-black uppercase tracking-[0.3em] opacity-40 mb-3 italic">Current Stock</p>
                     <h3 className="text-6xl font-black italic tracking-tighter leading-none mb-2">{activeItem?.total_qty || 0}</h3>
                     <p className="text-sm font-black uppercase tracking-widest opacity-60">In Inventory</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest italic border-b border-gray-50 pb-4">Activity Log</h4>
                  <div className="grid grid-cols-1 gap-3">
                     {transactions.filter((t: { item_id: string }) => t.item_id === activeItem?.id).map((txn: { id: string, status: string, quantity: number, type: string, engineer_id?: string, date?: string }) => (
                        <div
                           key={txn.id}
                           onClick={() => txn.status === 'Returned' ? null : returnAsset(txn.id)}
                           className="bg-gray-50/50 p-6 rounded-[24px] flex flex-col gap-4 group hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10 cursor-pointer"
                        >
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className={cn(
                                    "w-3 h-3 rounded-full animate-pulse",
                                    txn.status === 'Returned' ? "bg-green-500" : "bg-orange-500"
                                 )} />
                                 <div>
                                    <span className="text-sm font-black text-[#003366] font-mono tracking-[0.15em] uppercase italic">TXN: {txn.id}</span>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1">Qty: {txn.quantity} | {txn.type}</p>
                                 </div>
                              </div>
                              <span className={cn(
                                 "h-6 px-3 rounded-lg text-[10px] font-black uppercase italic shadow-sm flex items-center justify-center border",
                                 txn.status === 'Returned' ? "bg-green-50 text-green-600 border-green-100" : "bg-orange-50 text-orange-600 border-orange-100"
                              )}>
                                 {txn.status}
                              </span>
                           </div>

                           {txn.status === 'In Use' && (
                              <div className="bg-white/50 p-4 rounded-2xl space-y-2 border border-orange-50">
                                 <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Engineer ID</span>
                                    <span className="text-xs font-black text-[#003366] uppercase italic">{txn.engineer_id}</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Date</span>
                                    <span className="text-xs font-black text-[#003366] uppercase italic">{txn.date}</span>
                                 </div>
                              </div>
                           )}

                           {txn.status === 'In Use' && (
                              <div className="flex items-center justify-center pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">
                                    Return Asset ↺
                                 </p>
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </SidePanel>
      </div>
   )
}

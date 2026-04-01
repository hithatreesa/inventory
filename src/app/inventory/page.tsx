"use client"

import React, { useState, useMemo } from 'react'
import {
   Search,
   Download,
   Plus,
   Filter,
   MoreVertical,
   Eye,
   Edit2,
   Package,
   Boxes,
   AlertCircle,
   X,
   FileText,
   Share2,
   Trash2,
   ArrowRightLeft,
   ChevronRight,
   Archive,
   Hash,
   Info
} from 'lucide-react'
import { useData } from '@/lib/context/DataContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MetricCard } from '@/components/shared/MetricCard'
import { cn } from '@/lib/utils'

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
                  {subtitle && <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{subtitle}</p>}
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
   const { items } = useData()
   const [selectedIds, setSelectedIds] = useState<string[]>([])
   const [filters, setFilters] = useState({
      search: '',
      category: 'All Categories',
      brand: 'All Brands',
      status: 'All Status',
      warehouse: 'All Warehouses'
   })
   const [activePanel, setActivePanel] = useState<{ type: 'detail' | 'serials', id: string } | null>(null)

   const filteredItems = useMemo(() => {
      return items.filter(item => {
         const matchSearch = item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            item.sku.toLowerCase().includes(filters.search.toLowerCase())
         const matchCategory = filters.category === 'All Categories' || item.category === filters.category
         const matchStatus = filters.status === 'All Status' || item.status === filters.status
         const matchWarehouse = filters.warehouse === 'All Warehouses' || item.warehouse === filters.warehouse
         return matchSearch && matchCategory && matchStatus && matchWarehouse
      })
   }, [items, filters])

   const stats = useMemo(() => {
      const totalItems = items.length
      const totalValuation = items.reduce((acc, i) => acc + (i.price * i.stock), 0)
      const lowStock = items.filter(i => i.status === 'Low Stock').length
      const outOfStock = items.filter(i => i.stock === 0).length
      return { totalItems, totalValuation, lowStock, outOfStock }
   }, [items])

   const toggleSelect = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
   }

   const toggleSelectAll = () => {
      setSelectedIds(selectedIds.length === filteredItems.length && filteredItems.length > 0 ? [] : filteredItems.map(i => i.id))
   }

   const activeItem = useMemo(() => items.find(i => i.id === activePanel?.id), [activePanel, items])

   return (
      <div className="space-y-6 pb-24 animate-in fade-in duration-500 text-text-main">
         {/* TOP HEADER BAR */}
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-8 rounded-3xl border border-border-main shadow-sm gap-6">
            <div className="w-full sm:w-auto">
               <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-[#003366] tracking-tighter italic uppercase underline decoration-primary/20 decoration-4">Inventory Management</h1>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <Button variant="secondary" className="hidden sm:flex h-9 px-3 rounded-xl font-black text-[9px] tracking-widest uppercase italic bg-white border-gray-100 hover:bg-gray-50 items-center justify-center gap-2">
                  <Plus className="w-4 h-4 text-primary" /> Import
               </Button>
               <Button variant="secondary" className="hidden sm:flex h-9 px-3 rounded-xl font-black text-[9px] tracking-widest uppercase italic bg-white border-gray-100 hover:bg-gray-50 items-center justify-center gap-2">
                  <Download className="w-4 h-4 text-primary" /> Export
               </Button>
               <Button className="h-9 px-5 rounded-xl font-black text-[9px] tracking-widest uppercase italic shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add Item
               </Button>
            </div>
         </div>

         {/* ACTION ROW - ONLY MOBILE */}
         <div className="flex sm:hidden flex-row gap-2 px-4">
            <Button
               variant="secondary"
               onClick={() => document.getElementById('filter-section')?.scrollIntoView({ behavior: 'smooth' })}
               className="flex-1 h-9 px-2 rounded-xl font-black text-[9px] tracking-widest uppercase italic bg-white border border-gray-100 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
               <Filter className="w-3 h-3 text-primary" /> Filters
            </Button>
            <Button variant="secondary" className="flex-1 h-9 px-2 rounded-xl font-black text-[9px] tracking-widest uppercase italic bg-white border border-gray-100 hover:bg-gray-50 flex items-center justify-center gap-2">
               <Plus className="w-3 h-3 text-primary" /> Import
            </Button>
            <Button variant="secondary" className="flex-1 h-9 px-2 rounded-xl font-black text-[9px] tracking-widest uppercase italic bg-white border border-gray-100 hover:bg-gray-50 flex items-center justify-center gap-2">
               <Download className="w-3 h-3 text-primary" /> Export
            </Button>
         </div>

         {/* Section 2: KPI Grid */}
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            <MetricCard
               title="Total Items Count"
               value={stats.totalItems}
               icon={<Boxes className="w-5 h-5" />}
               variant="primary"
               href="/inventory/registry"
            />
            <MetricCard
               title="Total Stock Valuation"
               value={`₹${(stats.totalValuation / 1000).toFixed(1)}K`}
               icon={<Package className="w-5 h-5" />}
               variant="default"
               href="/reports/stock"
            />
            <MetricCard
               title="Low Stock Items"
               value={stats.lowStock}
               icon={<AlertCircle className="w-5 h-5" />}
               variant="warning"
               isCritical={stats.lowStock > 0}
               href="/reports/inventory?type=low-stock"
            />
            <MetricCard
               title="Out of Stock Items"
               value={stats.outOfStock}
               icon={<X className="w-5 h-5" />}
               variant="warning"
               isCritical={stats.outOfStock > 0}
               href="/reports/inventory?type=out-of-stock"
            />
         </div>

         {/* FILTER SECTION */}
         <div id="filter-section" className="bg-white p-6 rounded-3xl border border-border-main shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
               <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <h4 className="text-[10px] font-black text-[#003366] uppercase tracking-widest italic">Operational Filters</h4>
               </div>
               <button
                  onClick={() => setFilters({ search: '', category: 'All Categories', brand: 'All Brands', status: 'All Status', warehouse: 'All Warehouses' })}
                  className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors underline decoration-dotted"
               >
                  Clear Filters
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
               <div className="space-y-1.5 lg:col-span-1">
                  <div className="relative">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                     <Input
                        placeholder="Search by name, barcode, or serial"
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
                     <option>All Categories</option>
                     <option>Hardware &rarr; Storage</option>
                     <option>Hardware &rarr; Networking</option>
                     <option>Software &rarr; License</option>
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
            {filteredItems.length > 0 ? (
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
                           <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Item Name</th>
                           <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Category</th>
                           <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Warehouse</th>
                           <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Stock Quantity</th>
                           <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Reserved Stock</th>
                           <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Price</th>
                           <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">GST %</th>
                           <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Status</th>
                           <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Actions</th>
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
                                 <p className="text-[10px] font-mono font-black text-gray-300 uppercase tracking-widest mt-1.5">{item.sku}</p>
                              </td>
                              <td className="px-6 py-6">
                                 <span className="text-[9px] font-black tracking-widest italic uppercase text-primary/60">{item.category}</span>
                              </td>
                              <td className="px-6 py-6">
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{item.warehouse || 'Central Facility'}</p>
                              </td>
                              <td className="px-6 py-6 text-center">
                                 {item.category === 'Hardware' ? (
                                    <button
                                       onClick={(e) => { e.stopPropagation(); setActivePanel({ type: 'serials', id: item.id }); }}
                                       className="mx-auto px-3 py-1 bg-[#003366]/5 rounded-xl border border-[#003366]/10 flex items-center justify-center gap-2 hover:bg-[#003366]/10 transition-all group/sn active:scale-95"
                                    >
                                       <Hash className="w-3 h-3 text-[#003366] opacity-40 group-hover/sn:opacity-100" />
                                       <span className="text-sm font-black text-[#003366] italic tabular-nums">{item.stock} SNs</span>
                                    </button>
                                 ) : (
                                    <p className="text-sm font-black text-[#003366] tabular-nums italic">{item.stock}</p>
                                 )}
                              </td>
                              <td className="px-6 py-6 text-center">
                                 <p className="text-sm font-black text-gray-300 tabular-nums italic">{Math.floor(item.stock * 0.12)}</p>
                              </td>
                              <td className="px-6 py-6 text-right font-black italic text-sm text-[#003366] tabular-nums tracking-tighter">
                                 {'₹'}{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-6 text-center text-[10px] font-black text-gray-400 italic">
                                 {item.category === 'Hardware' ? '18%' : '12%'}
                              </td>
                              <td className="px-6 py-6 text-center">
                                 <span className={cn(
                                    "italic font-black text-[9px] tracking-tighter uppercase px-2.5 h-6 flex items-center justify-center rounded-lg shadow-sm border border-transparent",
                                    item.status === 'In Stock' ? 'bg-green-50 text-green-600' : item.status === 'Low Stock' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                                 )}>
                                    {item.status}
                                 </span>
                              </td>
                              <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                                 <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => setActivePanel({ type: 'detail', id: item.id })} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-primary hover:bg-primary/5 transition-all">
                                       <Eye className="w-4 h-4" />
                                    </button>
                                    <button className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-primary hover:bg-primary/5 transition-all">
                                       <Edit2 className="w-4 h-4" />
                                    </button>
                                    <div className="w-[1px] h-6 bg-gray-50 mx-1" />
                                    <button className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-text-main transition-all">
                                       <MoreVertical className="w-4 h-4" />
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
                  <Button size="xl" className="h-16 px-12 rounded-2xl font-black text-xs tracking-widest uppercase italic shadow-2xl shadow-primary/30">
                     <Plus className="w-5 h-5 mr-3" /> Add Item
                  </Button>
               </div>
            )}

            {/* PAGINATION */}
            <div className="p-8 bg-gray-50/30 border-t border-gray-100 flex items-center justify-end gap-6">
               <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Rows per page:</span>
                  <select className="bg-white border border-gray-100 rounded-lg text-xs font-black px-3 py-1.5 focus:outline-none focus:ring-4 focus:ring-primary/5 italic">
                     <option>10</option>
                     <option>25</option>
                     <option>50</option>
                  </select>
               </div>
               <div className="flex items-center gap-2">
                  {[1, 2, 3].map(i => (
                     <button key={i} className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border",
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
                     <span className="text-[10px] uppercase tracking-widest opacity-60">Selected</span>
                  </p>
               </div>
               <div className="flex gap-2">
                  <button className="h-12 px-6 rounded-2xl bg-white/5 text-white font-black text-[10px] tracking-widest uppercase italic flex items-center gap-2 hover:bg-white/10 hover:translate-y-[-2px] transition-all">
                     <Download className="w-4 h-4 text-primary" /> Export
                  </button>
                  <button className="h-12 px-6 rounded-2xl bg-white/5 text-white font-black text-[10px] tracking-widest uppercase italic flex items-center gap-2 hover:bg-white/10 hover:translate-y-[-2px] transition-all">
                     <ArrowRightLeft className="w-4 h-4 text-primary" /> Transfer Stock
                  </button>
                  <button className="h-12 px-6 rounded-2xl bg-red-500/10 text-red-100 font-black text-[10px] tracking-widest uppercase italic flex items-center gap-2 hover:bg-red-500/20 hover:translate-y-[-2px] transition-all border border-red-500/20">
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
            subtitle={`SKU: ${activeItem?.sku || 'SK_000'}`}
         >
            {activeItem && (
               <div className="space-y-10">
                  <div className="bg-primary/5 rounded-[40px] p-10 border border-primary/10 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                     <div className="relative z-10">
                        <span className="inline-block mb-6 font-black italic tracking-widest text-primary uppercase text-[9px]">{activeItem.category}</span>
                        <h3 className="text-4xl font-black text-[#003366] italic tracking-tighter uppercase leading-tight mb-4">{activeItem.name}</h3>
                        <div className="flex gap-8">
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1">SKU / Barcode</p>
                              <p className="text-sm font-black text-[#003366] font-mono tracking-widest">{activeItem.sku}</p>
                           </div>
                           <div className="w-[1px] h-8 bg-[#003366]/10" />
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1">Status</p>
                              <span className={cn(
                                 "font-black italic px-3 rounded-lg shadow-sm uppercase text-[9px] h-6 flex items-center justify-center border border-transparent",
                                 activeItem.status === 'In Stock' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                              )}>{activeItem.status}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Boxes className="w-5 h-5" /></div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic leading-none mb-2">Stock Quantity</p>
                           <p className="text-3xl font-black text-[#003366] italic tracking-tighter uppercase leading-none">{activeItem.stock}</p>
                        </div>
                     </div>
                     <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Info className="w-5 h-5" /></div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic leading-none mb-2">Reserved Stock</p>
                           <p className="text-3xl font-black text-gray-300 italic tracking-tighter uppercase leading-none">{Math.floor(activeItem.stock * 0.12)}</p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6 pt-4">
                     <h4 className="text-[10px] font-black text-[#003366] uppercase tracking-[0.2em] border-b border-gray-50 pb-4 italic">Specifications</h4>
                     <div className="space-y-4">
                        {[
                           { label: 'Warehouse', value: activeItem.warehouse || 'Main Distribution' },
                           { label: 'Brand', value: activeItem.brand || 'N/A' },
                           { label: 'Price (Default)', value: `₹${activeItem.price.toLocaleString()}` },
                           { label: 'GST Configuration', value: activeItem.category === 'Hardware' ? '18%' : '12%' },
                        ].map((row, i) => (
                           <div key={i} className="flex justify-between items-center py-2 px-4 rounded-xl hover:bg-gray-50 transition-colors group">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic group-hover:text-primary transition-colors">{row.label}</span>
                              <span className="text-sm font-black text-[#003366] italic uppercase">{row.value}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="pt-10 flex gap-4">
                     <Button size="xl" className="flex-1 rounded-3xl font-black text-[10px] italic tracking-widest uppercase text-xs h-16 shadow-xl shadow-primary/20">
                        <Edit2 className="w-4 h-4 mr-3" /> Edit Item
                     </Button>
                     <Button variant="secondary" size="xl" className="rounded-3xl px-12 font-black text-[10px] italic tracking-widest uppercase text-xs h-16 border-gray-100 bg-gray-50/50">
                        <Share2 className="w-4 h-4" />
                     </Button>
                  </div>
               </div>
            )}
         </SidePanel>

         <SidePanel
            isOpen={activePanel?.type === 'serials'}
            onClose={() => setActivePanel(null)}
            title="Serial Inventory List"
            subtitle={`Tracking: ${activeItem?.sku || 'SK_000'}`}
         >
            <div className="space-y-8">
               <div className="bg-[#003366] rounded-[40px] p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="relative z-10 flex flex-col items-center justify-center text-center">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-3 italic">Total Serials</p>
                     <h3 className="text-6xl font-black italic tracking-tighter leading-none mb-2">{activeItem?.stock || 0}</h3>
                     <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Identity Strings</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic border-b border-gray-50 pb-4">Serial Registry</h4>
                  <div className="grid grid-cols-1 gap-2">
                     {Array.from({ length: activeItem?.stock || 0 }).map((_, i) => (
                        <div key={i} className="bg-gray-50/50 p-4 rounded-[20px] flex items-center justify-between group hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10 cursor-pointer">
                           <div className="flex items-center gap-4">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary" />
                              <span className="text-[10px] font-black text-gray-300 tracking-tighter mr-2">#{i + 1}</span>
                              <span className="text-sm font-black text-[#003366] font-mono tracking-[0.15em] uppercase italic">{activeItem?.sku?.replace('SKU-', '')}-SN{1024 + i}</span>
                           </div>
                           <span className="h-5 px-2 rounded-md text-[8px] font-black uppercase italic shadow-sm bg-green-50 text-green-600 flex items-center justify-center">In Stock</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </SidePanel>
      </div>
   )
}

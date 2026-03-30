"use client"

import React, { useState } from 'react'
import { 
  ChevronRight, 
  Package, 
  IndianRupee, 
  Lock, 
  MapPin, 
  History,
  Info,
  Barcode,
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
  Settings as SettingsIcon,
  CheckCircle2
} from 'lucide-react'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { HistoryItem, ActivityStream } from '@/components/shared/ActivityStream'
import { Button } from '@/components/ui/Button'

export default function ItemDetailPage() {
  const [tieredPricing, setTieredPricing] = useState([
    { range: '10 - 49 units', discount: '5% Off', netPrice: 1804.99 },
    { range: '50+ units', discount: '12% Off', netPrice: 1671.99 },
  ])

  const headerActions = (
    <>
      <Button variant="secondary" className="px-8 h-10">
        Discard
      </Button>
      <Button className="px-10 h-10 italic">
        Save Changes
      </Button>
    </>
  )

  return (
    <div className="space-y-8 pb-12">
      <SectionHeader 
        title="Industrial Power Module X-1" 
        breadcrumbs={[
          { label: 'Inventory', href: '/inventory' },
          { label: 'Edit Item' }
        ]}
        actions={headerActions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Basic Info */}
          <section className="bg-white p-8 rounded-3xl border border-border-main shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-text-main flex items-center gap-3">
              <Info className="w-5 h-5 text-primary" /> Basic Info
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary pl-1 uppercase tracking-wider">Product Name</label>
                <input type="text" defaultValue="Industrial Power Module X-1" className="w-full bg-sidebar-bg border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-main focus:outline-primary transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-secondary pl-1 uppercase tracking-wider">Category</label>
                  <select className="w-full bg-sidebar-bg border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-main focus:outline-primary transition-all">
                    <option>Electronic Components</option>
                    <option>Mechanical</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-secondary pl-1 uppercase tracking-wider">Manufacturer SKU</label>
                  <input type="text" defaultValue="IPM-990-2024-X" className="w-full bg-sidebar-bg border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-main focus:outline-primary transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary pl-1 uppercase tracking-wider">Technical Description</label>
                <textarea rows={4} className="w-full bg-sidebar-bg border border-border-main rounded-xl px-4 py-3 text-sm font-medium text-text-main focus:outline-primary transition-all" defaultValue="High-performance power regulation module for heavy industrial machinery. Features advanced thermal protection and redundant safety circuitry." />
              </div>
            </div>
          </section>

          {/* Pricing Architecture */}
          <section className="bg-white p-8 rounded-3xl border border-border-main shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-text-main flex items-center gap-3 lowercase italic font-black">
              <IndianRupee className="w-5 h-5 text-primary" /> Pricing Architecture
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <PricingInput label="Base Cost (INR)" value="1250.00" />
              <PricingInput label="MSRP (INR)" value="1899.99" />
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary pl-1 uppercase tracking-wider">Margin</label>
                <div className="bg-green-50/50 border border-green-200 rounded-xl px-4 py-3 text-center">
                  <span className="text-lg font-extrabold text-success">34.2%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 border-t border-border-main pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-extrabold text-text-secondary uppercase tracking-[0.2em]">TIERED PRICING SCHEDULE</h4>
                <button className="text-[10px] font-bold text-primary flex items-center gap-1"><Plus className="w-3 h-3" /> Add Tier</button>
              </div>
              <div className="space-y-3">
                {tieredPricing.map((tier, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/80 border border-border-main group hover:bg-white hover:shadow-sm transition-all">
                    <div className="grid grid-cols-3 flex-1 gap-8">
                      <div>
                        <p className="text-[9px] font-bold text-text-secondary uppercase mb-1">Quantity Range</p>
                        <p className="text-sm font-extrabold text-text-main">{tier.range}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-text-secondary uppercase mb-1">Discount</p>
                        <p className="text-sm font-extrabold text-primary">{tier.discount}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-text-secondary uppercase mb-1">Net Price</p>
                        <p className="text-sm font-extrabold text-text-main">₹{tier.netPrice}</p>
                      </div>
                    </div>
                    <button className="p-2 text-text-secondary opacity-0 group-hover:opacity-100 hover:text-warning transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (Tracking & Allocation) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Tracking */}
          <section className="bg-white p-8 rounded-3xl border border-border-main shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-text-main">Tracking Configuration</h3>
            <div className="bg-gray-100 p-6 rounded-2xl flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-xl border border-border-main shadow-inner">
                <Barcode size={80} className="text-text-main opacity-80" />
                <p className="text-[10px] font-mono mt-2 text-center text-text-secondary">EA-IPM-2024-9900-A1</p>
              </div>
            </div>
            <div className="space-y-4 pt-4">
              <ToggleRow label="Track Serial Numbers" desc="Unique IDs per unit" active />
              <ToggleRow label="Lot Control" desc="Group by production date" />
              <button className="w-full border border-primary text-primary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-all outline-none">
                <Plus className="w-4 h-4" /> Print Labels
              </button>
            </div>
          </section>

          {/* Compliance */}
          <section className="bg-blue-900 p-8 rounded-3xl border border-blue-800 shadow-xl text-white space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-primary" /> Compliance & Tax
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-extrabold opacity-60 uppercase tracking-widest pl-1">HS CODE (INTERNATIONAL)</label>
                <input type="text" defaultValue="8504.40.95" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-extrabold opacity-60 uppercase tracking-widest pl-1">TAX CATEGORY</label>
                <select className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none appearance-none">
                  <option>High-Tech Standard (15%)</option>
                  <option>Standard (21%)</option>
                </select>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl flex items-center gap-4 mt-8">
                <div className="w-8 h-8 bg-success rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold">EU RoHS Compliant</p>
                  <p className="text-[9px] opacity-60">Verified status active</p>
                </div>
              </div>
            </div>
          </section>

          {/* Allocation */}
          <section className="bg-white p-8 rounded-3xl border border-border-main shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-main">Warehouse Allocation</h3>
              <button className="text-[10px] font-bold text-primary">Manage</button>
            </div>
            <div className="space-y-4">
              <WarehouseRow name="North Hub - Bin A4" qty={42} color="bg-success" />
              <WarehouseRow name="South Logistics - Bin J12" qty={18} color="bg-warning" />
            </div>
          </section>
        </div>
      </div>
      
      {/* Media & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <section className="bg-white p-8 rounded-3xl border border-border-main shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-text-main">Product Media</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square bg-gray-100 rounded-2xl border border-border-main overflow-hidden flex items-center justify-center">
              <ImageIcon className="text-text-secondary opacity-30" size={40} />
            </div>
            <div className="aspect-square bg-gray-50 border-2 border-dashed border-border-main rounded-2xl flex flex-col items-center justify-center gap-2 group cursor-pointer hover:bg-white transition-all">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <p className="text-[10px] font-bold text-text-secondary">Add Image</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-border-main shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-text-main">Recent Activity Stream</h3>
            <span className="bg-primary/5 text-primary text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Live</span>
          </div>
          <ActivityStream>
            <HistoryItem 
              active 
              title="Inventory level updated" 
              sub="Automated synchronization • 2 hours ago" 
              icon={<RefreshCw className="w-4 h-4" />}
            />
            <HistoryItem 
              title="Metadata adjusted by Admin" 
              sub="Manufacturer SKU updated • 5 hours ago" 
              icon={<SettingsIcon className="w-4 h-4" />}
            />
            <HistoryItem 
              title="Compliance certification verified" 
              sub="RoHS 3 documentation validated • Yesterday" 
              icon={<CheckCircle2 className="w-4 h-4" />}
            />
          </ActivityStream>
        </section>
      </div>
    </div>
  )
}

function PricingInput({ label, value }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-text-secondary pl-1 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <IndianRupee className="w-3.5 h-3.5 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
        <input type="text" defaultValue={value} className="w-full bg-sidebar-bg border border-border-main rounded-xl pl-9 pr-4 py-3 text-sm font-bold text-text-main focus:outline-primary transition-all" />
      </div>
    </div>
  )
}

function ToggleRow({ label, desc, active }: any) {
  return (
    <div className="flex justify-between items-center p-4 rounded-xl hover:bg-gray-50 transition-colors">
      <div>
        <p className="text-sm font-bold text-text-main tracking-tight">{label}</p>
        <p className="text-[10px] text-text-secondary font-medium">{desc}</p>
      </div>
      <div className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${active ? 'bg-primary' : 'bg-gray-300'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${active ? 'right-0.5' : 'left-0.5'}`} />
      </div>
    </div>
  )
}

function WarehouseRow({ name, qty, color }: any) {
  return (
    <div className="space-y-2 p-2 rounded-xl hover:bg-gray-50 transition-colors">
      <div className="flex justify-between text-xs font-bold">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-text-main">{name}</span>
        </div>
        <span className="text-text-main">{qty} units available</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${(qty / 60) * 100}%` }} />
      </div>
    </div>
  )
}


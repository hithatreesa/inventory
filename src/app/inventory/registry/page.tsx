"use client"

import React, { useState } from 'react'
import { 
  Search, 
  Download, 
  Plus, 
  MoreVertical, 
  Activity, 
  Filter, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  FileText,
  ChevronRight,
  ChevronDown,
  Database,
  BarChart3
} from 'lucide-react'
import { serialNumberRegistry, auditLogs } from '@/lib/mock-data/inventory'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { MetricCard } from '@/components/shared/MetricCard'
import { Button } from '@/components/ui/Button'
import { QuickEntryModal } from '@/components/modals/QuickEntryModal'
import { toast } from 'sonner'

export default function SerialRegistryPage() {
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false)

  const handleExport = () => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
      loading: 'Compiling registry dataset...',
      success: 'Export complete. Serial_Registry_2024.csv downloaded.',
      error: 'Export failed.',
    })
  }

  const handleActionClick = (asset: string) => {
    toast.info(`Managing ${asset}`, {
      description: 'Quick actions menu: [Edit | Transfer | Decommission]'
    })
  }

  const headerActions = (
    <>
      <nav className="flex items-center gap-6 mr-6">
        {['Registry', 'Documentation', 'Support'].map(item => (
          <span 
            key={item} 
            onClick={() => toast.info(`Navigating to ${item}`)}
            className={`text-sm font-bold ${item === 'Registry' ? 'text-primary border-b-2 border-primary pb-1' : 'text-text-secondary'} cursor-pointer hover:text-primary transition-all`}
          >{item}</span>
        ))}
      </nav>
      <Button variant="secondary" className="px-6 h-10" onClick={handleExport}>
        <Download className="w-4 h-4 text-primary mr-2" /> Export Dataset
      </Button>
      <Button className="px-6 h-10 italic" onClick={() => setIsQuickEntryOpen(true)}>
        <Plus className="w-4 h-4 mr-2" /> Register New Asset
      </Button>
    </>
  )

  return (
    <div className="space-y-8 pb-12">
      <SectionHeader 
        title="Serial Number Registry" 
        prefix="ASSET MANAGEMENT" 
        actions={headerActions}
      />

      <QuickEntryModal isOpen={isQuickEntryOpen} onClose={() => setIsQuickEntryOpen(false)} />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <MetricCard 
           title="TOTAL ACTIVE ASSETS" 
           value="12,842" 
           trend="+2.4%" 
           icon={<Database className="w-6 h-6" />} 
           variant="primary"
           href="/inventory"
         />
         <MetricCard 
           title="COMPLIANCE RATE" 
           value="99.8%" 
           trend="Stable" 
           icon={<ShieldCheck className="w-6 h-6" />} 
           variant="success"
           href="/reports/financial"
         />
         <MetricCard 
           title="PENDING AUDIT" 
           value="48" 
           trend="12%" 
           icon={<AlertTriangle className="w-6 h-6" />} 
           isCritical 
           href="/reports/inventory?type=low-stock"
         />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-border-main shadow-sm flex justify-between items-center">
         <div className="flex gap-4">
            <FilterButton label="Status" value="All Active" />
            <FilterButton label="Facility" value="North America Hub" />
            <FilterButton label="Date Range" value="Last 30 Days" />
         </div>
         <p className="text-[10px] font-black text-text-secondary uppercase">Showing 1,240 of 12,842 records</p>
      </div>

      {/* Main Registry Table */}
      <div className="bg-white rounded-[40px] border border-border-main shadow-sm overflow-hidden">
         <table className="w-full text-left">
            <thead>
               <tr className="text-[9px] font-black text-text-secondary bg-gray-50/20 uppercase tracking-[0.2em] border-b border-gray-50">
                  <th className="px-10 py-5">ASSET IDENTIFICATION</th>
                  <th className="px-6 py-5">SERIAL NUMBER</th>
                  <th className="px-6 py-5">CURRENT STATUS</th>
                  <th className="px-6 py-5">DEPLOYMENT SITE</th>
                  <th className="px-6 py-5">LAST MODIFIED</th>
                  <th className="px-10 py-5 text-right">ACTIONS</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {serialNumberRegistry.map(item => (
                 <tr key={item.id} className="group hover:bg-gray-50/50 transition-all cursor-pointer" onClick={() => handleActionClick(item.asset)}>
                    <td className="px-10 py-6">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-sidebar-bg rounded-xl flex items-center justify-center text-primary border border-border-main group-hover:scale-110 transition-transform">
                             <Database className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-sm font-black text-text-main leading-none italic">{item.asset}</p>
                             <p className="text-[10px] text-text-secondary font-bold uppercase tracking-tighter mt-1">Power Systems Div.</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-6 font-mono text-xs font-black text-text-secondary">
                      <span className="bg-gray-50 px-2 py-1 rounded border border-border-main uppercase">{item.sn}</span>
                    </td>
                    <td className="px-6 py-6">
                       <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                          item.status === 'OPERATIONAL' ? 'bg-blue-50 text-primary border border-blue-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                       }`}>
                          {item.status}
                       </span>
                    </td>
                    <td className="px-6 py-6 text-xs font-bold text-text-secondary">{item.site}</td>
                    <td className="px-6 py-6 text-xs font-black text-text-main italic">{item.lastModified}</td>
                    <td className="px-10 py-6 text-right">
                       <button className="p-2 text-text-secondary hover:text-primary transition-all" onClick={(e) => { e.stopPropagation(); handleActionClick(item.asset); }}><MoreVertical className="w-5 h-5" /></button>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
         <div className="p-8 bg-gray-50/10 flex justify-between items-center border-t border-gray-50/50">
            <p className="text-[10px] font-black text-text-secondary uppercase">Page 1 of 84</p>
            <div className="flex gap-2">
               <button 
                  className="w-8 h-8 rounded-lg border border-border-main flex items-center justify-center text-text-secondary text-xs font-black hover:bg-white"
                  onClick={() => toast.info('Navigating to previous page')}
                >{'<'}</button>
               <button 
                  className="w-8 h-8 rounded-lg border border-border-main flex items-center justify-center text-text-secondary text-xs font-black hover:bg-white"
                  onClick={() => toast.info('Navigating to next page')}
                >{'>'}</button>
            </div>
         </div>
      </div>

      {/* Bottom Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
         <div className="lg:col-span-2 bg-white rounded-[32px] border border-border-main shadow-sm flex flex-col">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
               <h3 className="text-xl font-black text-text-main italic tracking-tight">Registry Audit Log</h3>
               <button 
                  className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:opacity-80"
                  onClick={() => toast.info('Opening full audit trail...')}
                >VIEW FULL HISTORY <ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="p-8 space-y-8 relative before:absolute before:left-[19px] before:top-10 before:bottom-10 before:w-[2px] before:bg-gray-100">
               {auditLogs.map(log => (
                 <div key={log.id} className="flex gap-6 relative z-10 group cursor-pointer" onClick={() => toast.info(`Viewing details for: ${log.title}`)}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xl ${
                       log.type === 'System' ? 'bg-primary' : log.type === 'User' ? 'bg-gray-400' : 'bg-warning'
                    } group-hover:scale-110 transition-transform`}>
                       {log.type === 'System' ? <BarChart3 className="w-4 h-4" /> : log.type === 'User' ? <Activity className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div className="bg-sidebar-bg p-6 rounded-3xl border border-gray-50 flex-1 group-hover:bg-white group-hover:shadow-md transition-all">
                       <p className="text-sm font-black text-text-main leading-tight italic">{log.title}</p>
                       <p className="text-[10px] font-bold text-text-secondary mt-1">{log.desc}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-white p-8 rounded-[32px] border border-border-main shadow-sm space-y-6">
               <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-black text-text-main italic">Registry Annotations</h3>
               </div>
               
               <div className="space-y-4">
                  <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 space-y-2 cursor-pointer hover:bg-primary/10 transition-all">
                     <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none">GLOBAL RULE</p>
                     <p className="text-xs font-bold text-text-main leading-relaxed">
                        Ensure all new serial numbers are validated against ISO-9001 checksum patterns before final commit.
                     </p>
                  </div>
               </div>

               <button 
                  className="w-full border-2 border-dashed border-primary/10 text-primary py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/5 transition-all outline-none"
                  onClick={() => toast.info('Opening annotation editor...')}
                >
                  Add Annotation
               </button>
            </div>
         </div>
      </div>
    </div>
  )
}


function FilterButton({ label, value }: any) {
  return (
    <div 
      className="flex items-center gap-2 px-6 py-2 bg-sidebar-bg border border-border-main rounded-xl group cursor-pointer hover:bg-white transition-all"
      onClick={() => toast.info(`Filtering by ${label}: ${value}`)}
    >
       <div className="flex items-center gap-1 opacity-60">
          <Filter className="w-3 h-3" />
          <span className="text-[10px] font-black uppercase tracking-widest">{label}:</span>
       </div>
       <span className="text-xs font-black text-text-main">{value}</span>
       <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
    </div>
  )
}

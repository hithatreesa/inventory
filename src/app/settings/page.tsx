"use client"

import React, { useState } from 'react'
import {
  Settings,
  Shield,
  Database,

  Bell,
  User,
  CreditCard,
  ChevronRight,
  Save,
  Trash2,
  Building,
  Box,
  Palette,
  Key,
  Lock,
  Download,
  Upload,
  RefreshCcw,
  Users,
  Moon,
  Layout,
  Table as TableIcon
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12 animate-in fade-in duration-500 px-4 sm:px-6">
      <div className="flex items-center justify-between mb-8 sm:mb-12">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-secondary opacity-50 mb-2 flex items-center gap-2">
            SYSTEM CONTROL <span className="animate-pulse">💎</span>
          </p>
          <h1 className="text-2xl sm:text-4xl font-black italic tracking-tighter text-[#003366] uppercase">
            Configuration
          </h1>
        </div>
        <div className="flex gap-2 sm:gap-4 scale-75 sm:scale-100 origin-right">
          <Button variant="secondary" className="text-[9px] font-black uppercase tracking-widest italic border-gray-100 h-10 px-4">Revert Changes</Button>
          <Button className="text-[9px] font-black uppercase tracking-widest italic shadow-xl shadow-primary/20 h-10 px-6">
            <Save className="w-3 h-3 mr-2" />
            Commit Updates
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar Navigation */}
        <div className="flex overflow-x-auto pb-4 mb-4 lg:pb-0 lg:mb-0 lg:flex-col lg:space-y-4 lg:col-span-3 scrollbar-hide gap-3 lg:gap-0">
          <SettingsNavItem icon={<User />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          <SettingsNavItem icon={<Building />} label="Company" active={activeTab === 'company'} onClick={() => setActiveTab('company')} />
          <SettingsNavItem icon={<Box />} label="Inventory" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
          <SettingsNavItem icon={<Bell />} label="Notifications" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
          <SettingsNavItem icon={<Shield />} label="Security" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
          <SettingsNavItem icon={<CreditCard />} label="Billing" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
          <SettingsNavItem icon={<Palette />} label="Appearance" active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} />
          <SettingsNavItem icon={<Database />} label="Data Mgmt" active={activeTab === 'data'} onClick={() => setActiveTab('data')} />
          <SettingsNavItem icon={<Settings />} label="System Admin" active={activeTab === 'system'} onClick={() => setActiveTab('system')} />
        </div>

        {/* Main Settings Form */}
        <div className="lg:col-span-9 space-y-10 min-h-[600px]">
          {/* PROFILE SECTION */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Section title="User Profile Identity">
                <div className="space-y-8">
                  <div className="flex items-center gap-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100 group transition-all hover:bg-white">
                    <div className="w-20 h-20 bg-primary/10 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-primary relative overflow-hidden group-hover:scale-105 transition-transform">
                       <User size={40} className="opacity-20" />
                       <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload size={20} className="text-white" />
                       </div>
                    </div>
                    <div className="flex-1">
                       <p className="text-xs font-black italic uppercase tracking-widest text-text-main">Profile Image</p>
                       <p className="text-[10px] font-medium text-text-secondary opacity-60 mt-1">Recommended: 400x400px JPG/PNG</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <Field label="Full Identity Name" placeholder="e.g. Johnathan Doe" defaultValue="Johnathan Doe" />
                    <Field label="Primary Auth Email" placeholder="user@enterprise.os" defaultValue="j.doe@executive.os" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <Field label="Contact Phone" placeholder="+1 (555) 000-0000" defaultValue="+1 (555) 882-9102" />
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">System Role (Read-only)</p>
                      <div className="h-11 px-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center">
                        <Shield className="w-3 h-3 mr-2 text-primary opacity-40" />
                        <span className="text-[10px] font-black italic text-primary uppercase">ADMINISTRATOR</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                     <Button variant="secondary" className="h-12 rounded-2xl border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest italic group hover:bg-primary/5 transition-all">
                        <Lock className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" /> Change Account Password
                     </Button>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* COMPANY SECTION */}
          {activeTab === 'company' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Section title="Enterprise Infrastructure">
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <Field label="Legal Entity Name" defaultValue="Global Dynamics Inc." />
                    <Field label="GST / VAT Number" defaultValue="GSTIN-882910JQ2" />
                  </div>
                  <Field label="Headquarters Address" defaultValue="128 Business Plaza, Suite 400, NY 10001" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <Field label="Corporate Email" defaultValue="hq@globaldynamics.os" />
                    <Field label="Direct Support Phone" defaultValue="+1 (212) 555-0192" />
                  </div>
                  <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 group hover:border-primary/20 transition-all bg-gray-50/30">
                     <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-300 group-hover:text-primary transition-colors shadow-sm">
                        <Building size={32} />
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-40">Drop Corporate Logo Here</p>
                     <Button variant="secondary" className="text-[9px] font-black uppercase tracking-widest italic h-10 px-6">Upload Brand Asset</Button>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* INVENTORY SECTION */}
          {activeTab === 'inventory' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Section title="Stock Management Preferences">
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Default Transaction Currency</p>
                      <Select options={['INR (₹)', 'USD ($)', 'EUR (€)', 'GBP (£)']} defaultValue="INR (₹)" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Low Stock Threshold (Global)</p>
                      <Input type="number" defaultValue="10" className="h-11 italic font-black" />
                    </div>
                  </div>

                  <ToggleField 
                    title="Enable Stock Alerts" 
                    subtitle="Monitor items falling below threshold" 
                    initialValue={true} 
                  />
                  
                  <ToggleField 
                    title="Real-time Inventory Sync" 
                    subtitle="Auto-update stock on sales/returns" 
                    initialValue={true} 
                  />
                </div>
              </Section>
            </div>
          )}

          {/* NOTIFICATIONS SECTION */}
          {activeTab === 'notifications' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Section title="Alert Orchestration">
                <div className="space-y-6">
                  <ToggleField title="Email Notifications" subtitle="Send invoice & system alerts via SMTP" initialValue={true} />
                  <ToggleField title="SMS Notifications" subtitle="Direct mobile gateway for urgent stock events" initialValue={false} />
                  <ToggleField title="Low Stock Warning System" subtitle="Active push notifications for item depletion" initialValue={true} />
                  <ToggleField title="AMC Expiry Tracking" subtitle="Alerts for support & warranty expirations" initialValue={true} />
                  <ToggleField title="Support Ticket Updates" subtitle="Notify users on ticket state changes" initialValue={true} />
                </div>
              </Section>
            </div>
          )}

          {/* SECURITY SECTION */}
          {activeTab === 'security' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Section title="Identity & Access Protocol">
                <div className="space-y-8">
                   <div className="p-8 bg-red-50/20 border border-red-100 rounded-3xl flex justify-between items-center group transition-all hover:bg-white hover:shadow-xl hover:shadow-red-200/20">
                      <div className="flex gap-4">
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-50">
                            <Lock size={20} />
                         </div>
                         <div>
                            <p className="text-sm font-black italic uppercase tracking-widest text-red-600">Change System Password</p>
                            <p className="text-[10px] text-text-secondary mt-1 font-bold uppercase opacity-60 tracking-widest">Enforcing 90-day rotation cycle</p>
                         </div>
                      </div>
                      <Button variant="secondary" className="border-red-100 text-red-500 hover:bg-red-50 text-[10px] font-black uppercase tracking-widest italic h-12 px-6">SECURE CHANGE</Button>
                   </div>

                   <ToggleField title="Enable 2FA (Multi-Factor)" subtitle="Require OTP code for administrative access" initialValue={false} />

                   <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Automatic Session Timeout</p>
                      <Select options={['15 MINUTES', '30 MINUTES', '60 MINUTES', 'NEVER_EXPIRE']} defaultValue="30 MINUTES" />
                   </div>
                </div>
              </Section>
            </div>
          )}

          {/* BILLING SECTION */}
          {activeTab === 'billing' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Section title="Fiscal Settlement Hub">
                <div className="space-y-10">
                   <div className="p-10 bg-[#003366] text-white rounded-[2.5rem] shadow-2xl shadow-primary/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
                      <div className="relative z-10 flex justify-between items-end">
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic mb-4">Current License TIER</p>
                            <p className="text-5xl font-black italic tracking-tighter uppercase italic-shadow">Enterprise Pro</p>
                            <div className="flex gap-6 mt-10">
                               <div>
                                  <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-1">RENEWAL DATE</p>
                                  <p className="text-sm font-black italic tracking-widest">01 JANUARY 2027</p>
                               </div>
                               <div>
                                  <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-1">BILLING CYCLE</p>
                                  <p className="text-sm font-black italic tracking-widest uppercase">ANNUAL_RECURRING</p>
                               </div>
                            </div>
                         </div>
                         <Button className="bg-white text-primary hover:bg-white/90 h-16 px-10 rounded-2xl italic font-black text-xs uppercase tracking-widest shadow-2xl">
                           UPGRADE SUBSCRIPTION
                         </Button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SummaryCard icon={<CreditCard />} title="Payment History" subtitle="View all previous FY invoices" />
                      <SummaryCard icon={<RefreshCcw />} title="Billing Inquiries" subtitle="Contact enterprise support" />
                   </div>
                </div>
              </Section>
            </div>
          )}

          {/* APPEARANCE SECTION */}
          {activeTab === 'appearance' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Section title="System Interface Tuning">
                <div className="space-y-8">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex items-center justify-between group transition-all hover:bg-white">
                         <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm"><Moon size={20} /></div>
                            <div>
                               <p className="text-xs font-black italic uppercase tracking-widest">Dark System Mode</p>
                               <p className="text-[9px] text-text-secondary font-bold uppercase opacity-50">Optimize for low light</p>
                            </div>
                         </div>
                         <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all" /></div>
                      </div>
                      <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex items-center justify-between group transition-all hover:bg-white">
                         <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm"><Layout size={20} /></div>
                            <div>
                               <p className="text-xs font-black italic uppercase tracking-widest">Sidebar Default</p>
                               <p className="text-[9px] text-text-secondary font-bold uppercase opacity-50">Collapsed navigation</p>
                            </div>
                         </div>
                         <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all" /></div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 pl-1">Global Data Density</p>
                      <div className="grid grid-cols-2 gap-4">
                         <DensityCard icon={<TableIcon />} title="Compact" subtitle="Maximum information display" active={true} />
                         <DensityCard icon={<Layout />} title="Comfortable" subtitle="Balanced whitespace layout" active={false} />
                      </div>
                   </div>
                </div>
              </Section>
            </div>
          )}

          {/* DATA SECTION */}
          {activeTab === 'data' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Section title="Enterprise Registry Management">
                <div className="space-y-6">
                   <ActionCard icon={<Download />} title="Export Complete Dataset" subtitle="Download SQL/CSV archives for local backup" color="primary" />
                   <ActionCard icon={<Upload />} title="Batch Inventory Import" subtitle="Upload XLSX matrices to sync stock indices" color="primary" />
                   <ActionCard icon={<RefreshCcw />} title="Full System Restore" subtitle="Revert registry to previous fiscal snapshot" color="warning" />
                </div>
              </Section>
            </div>
          )}

          {/* SYSTEM SECTION */}
          {activeTab === 'system' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Section title="Administrative Root Access">
                <div className="space-y-8">
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <AdminCard icon={<Users />} title="Manage Users" />
                      <AdminCard icon={<Shield />} title="Permissions" />
                      <AdminCard icon={<Key />} title="API Engine" />
                   </div>
                   
                   <div className="p-8 border-2 border-dashed border-red-100 bg-red-50/10 rounded-[2.5rem] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Trash2 className="w-32 h-32 text-red-600 -rotate-12 translate-x-12 -translate-y-12" />
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-sm font-black italic uppercase tracking-widest text-red-600 mb-2">Registry Purge Cycle</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary leading-relaxed max-w-xl opacity-60">
                          Warning: This action will permanently erase all testing logs and cached transaction records. Production data will remain in the primary node. 💎
                        </p>
                        <Button variant="secondary" className="mt-8 border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-black uppercase tracking-[0.2em] italic h-12 px-8 rounded-2xl group/btn">
                          <Trash2 className="w-4 h-4 mr-2 group-hover/btn:animate-wiggle" />
                          Execute System Purge
                        </Button>
                      </div>
                   </div>
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// SUB-COMPONENTS

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-6 sm:p-10 shadow-xl shadow-gray-100/20">
      <h2 className="text-sm font-black italic uppercase tracking-[0.3em] text-text-secondary mb-8 sm:mb-10 opacity-30">{title}</h2>
      {children}
    </div>
  )
}

function SettingsNavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-6 py-5 rounded-3xl transition-all duration-500 group relative overflow-hidden shrink-0 whitespace-nowrap",
        active
          ? "bg-primary text-white shadow-2xl shadow-primary/40 scale-105 z-10"
          : "bg-white/50 text-text-secondary hover:bg-white hover:shadow-xl hover:shadow-gray-200/40"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
        active ? "bg-white/20 rotate-12 scale-110" : "bg-gray-50 group-hover:bg-primary/10 group-hover:rotate-12"
      )}>
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
          className: cn("w-5 h-5", active ? "text-white" : "text-text-secondary group-hover:text-primary")
        })}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest italic">{label}</span>
      <ChevronRight className={cn(
        "w-4 h-4 transition-transform group-hover:translate-x-1 ml-auto",
        active ? "text-white/40" : "text-text-secondary/20"
      )} />
      {active && (
        <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12" />
      )}
    </button>
  )
}

function Field({ label, placeholder, defaultValue, type = "text" }: { label: string, placeholder?: string, defaultValue?: string, type?: string }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 pl-1">{label}</p>
      <Input type={type} placeholder={placeholder} defaultValue={defaultValue} className="h-11 bg-gray-50/50 border-gray-100 italic" />
    </div>
  )
}

function ToggleField({ title, subtitle, initialValue }: { title: string, subtitle: string, initialValue: boolean }) {
  const [enabled, setEnabled] = useState(initialValue)
  return (
    <div 
      onClick={() => setEnabled(!enabled)}
      className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-gray-100 cursor-pointer group transition-all hover:bg-white"
    >
      <div>
        <p className="text-sm font-black italic uppercase tracking-widest text-text-main">{title}</p>
        <p className="text-[10px] text-text-secondary mt-1 font-bold uppercase opacity-60 tracking-widest">{subtitle}</p>
      </div>
      <div className={cn(
        "w-12 h-6 rounded-full relative transition-all duration-300",
        enabled ? "bg-success shadow-lg shadow-success/20" : "bg-gray-200"
      )}>
        <div className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
          enabled ? "right-1" : "left-1"
        )} />
      </div>
    </div>
  )
}

function SummaryCard({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="p-8 border border-gray-100 rounded-3xl hover:border-primary/20 transition-all group bg-gray-50/30 hover:bg-white hover:shadow-xl hover:shadow-gray-200/40">
       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-50 mb-6 group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <p className="text-xs font-black italic uppercase tracking-widest text-text-main">{title}</p>
       <p className="text-[10px] text-text-secondary mt-1 font-bold uppercase opacity-50 tracking-widest leading-loose">{subtitle}</p>
    </div>
  )
}

function DensityCard({ icon, title, subtitle, active }: { icon: React.ReactNode, title: string, subtitle: string, active: boolean }) {
  return (
    <div className={cn(
      "p-6 rounded-3xl border transition-all cursor-pointer group",
      active ? "bg-primary text-white border-primary shadow-xl shadow-primary/20" : "bg-gray-50/50 border-gray-100 hover:bg-white"
    )}>
       <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
        active ? "bg-white/10" : "bg-white shadow-sm"
       )}>
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: cn("w-5 h-5", active ? "text-white" : "text-primary") })}
       </div>
       <p className="text-xs font-black italic uppercase tracking-widest">{title}</p>
       <p className={cn("text-[9px] font-bold uppercase opacity-60 mt-1", active ? "text-white/80" : "text-text-secondary")}>{subtitle}</p>
    </div>
  )
}

function ActionCard({ icon, title, subtitle, color }: { icon: React.ReactNode, title: string, subtitle: string, color: 'primary' | 'warning' }) {
  return (
    <div className={cn(
      "p-6 rounded-3xl border flex items-center justify-between group cursor-pointer transition-all hover:bg-white hover:shadow-xl",
      color === 'primary' ? "bg-primary/[0.02] border-primary/5 hover:border-primary/20" : "bg-warning/[0.02] border-warning/5 hover:border-warning/20"
    )}>
       <div className="flex gap-4 items-center">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
            color === 'primary' ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
          )}>
             {icon}
          </div>
          <div>
             <p className={cn("text-sm font-black italic uppercase tracking-widest", color === 'primary' ? "text-primary" : "text-warning")}>{title}</p>
             <p className="text-[10px] text-text-secondary mt-1 font-bold uppercase opacity-60 tracking-widest">{subtitle}</p>
          </div>
       </div>
       <ChevronRight className={cn("w-5 h-5 opacity-20 group-hover:opacity-100 transition-all", color === 'primary' ? "text-primary" : "text-warning")} />
    </div>
  )
}

function AdminCard({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div className="p-8 border border-gray-100 rounded-3xl bg-gray-50/50 hover:bg-white hover:shadow-xl hover:border-primary/20 transition-all group flex flex-col items-center text-center">
       <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-50 mb-4 group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <p className="text-[10px] font-black italic uppercase tracking-widest text-[#003366]">{title}</p>
    </div>
  )
}
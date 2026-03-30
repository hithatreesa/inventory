"use client"

import React from 'react'
import {
  Settings,
  Shield,
  Database,
  Globe,
  Bell,
  User,
  CreditCard,
  ChevronRight,
  Save,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState('general')

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
            <Database className="w-3 h-3 mr-2" />
            Commit Updates
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar Navigation - Responsive (Scrollable on mobile, column on desktop) */}
        <div className="flex overflow-x-auto pb-4 mb-4 lg:pb-0 lg:mb-0 lg:flex-col lg:space-y-4 lg:col-span-3 scrollbar-hide gap-3 lg:gap-0">
          <SettingsNavItem icon={<User />} label="General Info" active={activeTab === 'general'} onClick={() => setActiveTab('general')} />
          <SettingsNavItem icon={<Shield />} label="Security & IAM" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
          <SettingsNavItem icon={<Database />} label="Warehouse logic" active={activeTab === 'warehouse'} onClick={() => setActiveTab('warehouse')} />
          <SettingsNavItem icon={<Globe />} label="Fiscal Locales" active={activeTab === 'fiscal'} onClick={() => setActiveTab('fiscal')} />
          <SettingsNavItem icon={<Bell />} label="Notification API" active={activeTab === 'notification'} onClick={() => setActiveTab('notification')} />
          <SettingsNavItem icon={<CreditCard />} label="Subscription" active={activeTab === 'subscription'} onClick={() => setActiveTab('subscription')} />
        </div>

        {/* Main Settings Form */}
        <div className="lg:col-span-9 space-y-10 min-h-[600px]">
          {activeTab === 'general' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Section title="Enterprise Infrastructure">
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Legal Entity Name</p>
                      <Input defaultValue="Executive Resource Corp." className="bg-gray-50/50 border-gray-100 italic" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Operations Primary Email</p>
                      <Input defaultValue="hq-ops@executive.os" className="bg-gray-50/50 border-gray-100 italic" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Primary Locale</p>
                      <Select options={['UNITED STATES', 'INDIA', 'UAE']} defaultValue="UNITED STATES" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">System Currency</p>
                      <div className="h-11 px-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center">
                        <span className="text-[10px] font-black italic text-primary uppercase">INR (Symbol: ₹)</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Fiscal Year Start</p>
                      <Select options={['JANUARY', 'APRIL']} defaultValue="JANUARY" />
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-10">
              <Section title="Access Control Matrix">
                <div className="space-y-6 sm:space-y-8">
                  <div className="p-6 sm:p-8 bg-gray-50/50 rounded-3xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-6 group transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-200/40">
                    <div className="w-14 h-14 bg-white rounded-2xl border border-gray-100 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-black italic uppercase tracking-widest text-text-main">Multi-Factor Authentication (MFA)</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-50 mt-1">Required for high-privilege accounts 💎</p>
                    </div>
                    <Badge variant="success" className="px-4 py-1.5 rounded-full text-[9px] font-black italic uppercase tracking-widest sm:self-center">Enforced</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="p-6 bg-white border border-gray-100 rounded-3xl flex justify-between items-center group transition-all hover:border-primary/20">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Automatic Session Termination</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary mt-1">Default timeout after inactivity</p>
                      </div>
                      <span className="text-xs font-black italic text-[#003366]">45 MINUTES</span>
                    </div>
                    <div className="p-6 bg-white border border-gray-100 rounded-3xl flex justify-between items-center group transition-all hover:border-primary/20">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Login History Auditing</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary mt-1">Store metadata for security scans</p>
                      </div>
                      <Badge variant="success" className="text-[8px] font-black uppercase tracking-widest">ENABLED</Badge>
                    </div>
                  </div>
                </div>
              </Section>

              <div className="mt-8">
                <Section title="System Integrity">
                  <div className="p-6 sm:p-10 border-2 border-dashed border-red-100 bg-red-50/10 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Shield className="w-32 h-32 text-red-600 -rotate-12 translate-x-12 -translate-y-12" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-sm font-black italic uppercase tracking-widest text-red-600 mb-2">Registry Purge Cycle</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary leading-relaxed max-w-xl opacity-60">
                        Warning: Purging the system registry will permanently delete all cached transaction logs and performance metadata. This action cannot be reversed within the current fiscal cycle. 💎
                      </p>
                      <Button variant="secondary" className="mt-8 border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-black uppercase tracking-[0.2em] italic h-12 px-8 rounded-2xl group/btn">
                        <Shield className="w-4 h-4 mr-2 group-hover/btn:animate-wiggle" />
                        Full System Purge
                      </Button>
                    </div>
                  </div>
                </Section>
              </div>
            </div>
          )}

          {activeTab === 'warehouse' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Section title="Warehouse Intelligence">
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <div>
                      <p className="text-sm font-black italic uppercase tracking-widest text-text-main">Multi-Warehouse System</p>
                      <p className="text-[10px] text-text-secondary mt-1 font-bold uppercase opacity-60">Enable multiple warehouses per company</p>
                    </div>
                    <Badge variant="success" className="italic font-black text-[9px] uppercase tracking-widest">ENABLED</Badge>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">Default Warehouse</p>
                    <Select
                      options={['MAIN STORE', 'SECONDARY STORE', 'SERVICE CENTER']}
                      defaultValue="MAIN STORE"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <div>
                      <p className="text-sm font-black italic uppercase tracking-widest text-text-main">Rack Management</p>
                      <p className="text-[10px] text-text-secondary mt-1 font-bold uppercase opacity-60">Enable rack-level tracking per item</p>
                    </div>
                    <Badge variant="secondary" className="italic font-black text-[9px] uppercase tracking-widest">OPTIONAL</Badge>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-warning/5 rounded-2xl border border-warning/20">
                    <div>
                      <p className="text-sm font-black italic uppercase tracking-widest text-warning">Negative Stock Control</p>
                      <p className="text-[10px] text-text-secondary mt-1 font-bold uppercase opacity-60">Block sales if stock is unavailable</p>
                    </div>
                    <Badge variant="success" className="italic font-black text-[9px] uppercase tracking-widest">BLOCKED</Badge>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <div>
                      <p className="text-sm font-black italic uppercase tracking-widest text-text-main">Stock Transfer Approval</p>
                      <p className="text-[10px] text-text-secondary mt-1 font-bold uppercase opacity-60">Require approval before transfer</p>
                    </div>
                    <Badge variant="secondary" className="italic font-black text-[9px] uppercase tracking-widest">DISABLED</Badge>
                  </div>

                  <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-sm font-black italic uppercase tracking-widest text-primary">Auto Allocation Engine</p>
                    <p className="text-[10px] text-text-secondary mt-2 font-bold uppercase opacity-60">
                      Automatically allocate stock based on warehouse priority and availability.
                    </p>
                    <div className="mt-4">
                      <Select
                        options={['FIFO', 'LIFO', 'NEAREST WAREHOUSE']}
                        defaultValue="FIFO"
                      />
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'fiscal' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Section title="Fiscal Configuration Matrix">
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Company State</p>
                      <Select options={['KARNATAKA', 'TAMIL NADU', 'MAHARASHTRA']} defaultValue="KARNATAKA" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">GST Type</p>
                      <Select options={['REGULAR', 'COMPOSITION']} defaultValue="REGULAR" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-primary/5 rounded-2xl border border-primary/10">
                    <div>
                      <p className="text-sm font-black italic uppercase tracking-widest text-primary">GST Auto Calculation</p>
                      <p className="text-[10px] text-text-secondary mt-1 font-bold uppercase opacity-60">Auto apply CGST/SGST or IGST based on state</p>
                    </div>
                    <Badge variant="success" className="italic font-black text-[9px] uppercase tracking-widest">ENABLED</Badge>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Financial Year Start</p>
                    <Select options={['APRIL', 'JANUARY']} defaultValue="APRIL" />
                  </div>

                  <div className="flex items-center justify-between p-6 bg-warning/5 rounded-2xl border border-warning/20">
                    <div>
                      <p className="text-sm font-black italic uppercase tracking-widest text-warning">Previous FY Lock</p>
                      <p className="text-[10px] text-text-secondary mt-1 font-bold uppercase opacity-60">Prevent edits in closed financial year</p>
                    </div>
                    <Badge variant="secondary" className="italic font-black text-[9px] uppercase tracking-widest bg-warning/10 text-warning border-none">LOCKED</Badge>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'notification' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Section title="Notification Orchestration">
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <div>
                      <p className="text-sm font-black italic uppercase tracking-widest text-text-main">Email Notifications</p>
                      <p className="text-[10px] text-text-secondary mt-1 font-bold uppercase opacity-60">Send invoice & alerts via email</p>
                    </div>
                    <Badge variant="success" className="italic font-black text-[9px] uppercase tracking-widest">ACTIVE</Badge>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <div>
                      <p className="text-sm font-black italic uppercase tracking-widest text-text-main">WhatsApp Integration</p>
                      <p className="text-[10px] text-text-secondary mt-1 font-bold uppercase opacity-60">Send invoices to customers</p>
                    </div>
                    <Badge variant="secondary" className="italic font-black text-[9px] uppercase tracking-widest">NOT CONNECTED</Badge>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Webhook URL</p>
                    <Input placeholder="https://api.yourservice.com/webhook" className="bg-gray-50/50 border-gray-100 italic" />
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">API Key</p>
                    <Input type="password" placeholder="••••••••••••••••" className="bg-gray-50/50 border-gray-100 font-mono tracking-widest" />
                  </div>
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Section title="Enterprise Subscription Hub">
                <div className="space-y-10">
                  <div className="p-8 bg-primary text-white rounded-3xl shadow-xl shadow-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 italic mb-2">Current Service TIER</p>
                      <p className="text-3xl font-black italic tracking-tighter">PRO PLAN</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">Unlimited billing + Multi warehouse + Custom APIs</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 border border-gray-100 rounded-3xl text-center space-y-4 hover:border-primary/20 transition-all group">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Basic</p>
                      <p className="text-2xl font-black italic text-[#003366]">₹999<span className="text-[10px] text-gray-300">/mo</span></p>
                      <Button variant="secondary" className="w-full h-10 text-[9px] font-black uppercase tracking-[0.2em] italic border-gray-100">SELECT TIER</Button>
                    </div>

                    <div className="p-8 border-2 border-primary rounded-3xl text-center space-y-4 shadow-2xl shadow-primary/10 relative scale-105 bg-white">
                      <Badge variant="success" className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 shadow-lg border-none italic">CURRENT ACTIVE</Badge>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Professional</p>
                      <p className="text-3xl font-black italic text-[#003366]">₹1999<span className="text-[10px] text-gray-300">/mo</span></p>
                      <Button className="w-full h-10 text-[9px] font-black uppercase tracking-[0.2em] italic shadow-lg shadow-primary/20">MANAGE PLAN</Button>
                    </div>

                    <div className="p-8 border border-gray-100 rounded-3xl text-center space-y-4 hover:border-primary/20 transition-all">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Enterprise</p>
                      <p className="text-2xl font-black italic text-[#003366]">CUSTOM</p>
                      <Button variant="secondary" className="w-full h-10 text-[9px] font-black uppercase tracking-[0.2em] italic border-gray-100">CONTACT SALES</Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <div>
                      <p className="text-sm font-black italic uppercase tracking-widest text-text-main">Billing Cycle Status</p>
                      <p className="text-[10px] text-text-secondary mt-1 font-bold uppercase opacity-60">Auto-renew subscription for next fiscal period</p>
                    </div>
                    <Badge variant="secondary" className="italic font-black text-[9px] uppercase tracking-widest border-gray-100 text-text-secondary">MONTHLY_RECURRING</Badge>
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
        {React.cloneElement(icon as React.ReactElement<any>, {
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

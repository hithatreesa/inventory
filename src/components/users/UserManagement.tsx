"use client"

import React, { useState, useMemo } from 'react'
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Activity, 
  ChevronRight,
  User,
  Shield,
  LayoutGrid,
  Check,
  X,
  Lock,
  ArrowRight,
  Fingerprint,
  Cpu,
  Database
} from 'lucide-react'
import { useData, SystemUser } from '@/lib/context/DataContext'
import { UserPermission } from '@/lib/inventoryEngine'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function UserManagement() {
  const { 
    users, 
    permissionConfig, 
    updateUserPermission, 
    bulkUpdateModulePermissions, 
    getUserPermissions,
    addUser,
    editUser 
  } = useData()

  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleId: 'role-3',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  })

  const selectedUser = useMemo(() => users.find((u: SystemUser) => u.id === selectedUserId), [users, selectedUserId])
  const activePermissions = useMemo(() => getUserPermissions(selectedUserId), [getUserPermissions, selectedUserId])

  const handleSaveUser = () => {
    if (!formData.name || !formData.email) {
      toast.error("HARD_FAIL: REQUIRED_FIELDS_MISSING [Name, Email]")
      return
    }

    if (editingId) {
      editUser(editingId, formData)
      toast.success("User Security Identity Updated")
    } else {
      addUser(formData)
      toast.success("New Security Credential Created")
    }
    setIsAdding(false)
    setEditingId(null)
    setFormData({ name: '', email: '', roleId: 'role-3', status: 'ACTIVE' })
  }

  const isModuleFullyAllowed = (moduleId: string) => {
    return permissionConfig.divisions.every((div: any) => 
      activePermissions.find((p: UserPermission) => p.moduleId === moduleId && p.divisionId === div.id)?.allowed
    )
  }

  const isDivisionAllowed = (moduleId: string, divisionId: string) => {
    return activePermissions.find((p: UserPermission) => p.moduleId === moduleId && p.divisionId === divisionId)?.allowed || false
  }

  return (
    <div className="p-6 lg:p-12 space-y-8 animate-in fade-in duration-700 pb-32">
      
      {/* 🛡️ MODULAR IDENTITY SELECTOR */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-[#003366] text-white p-8 rounded-[48px] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 border-b-[6px] border-blue-900 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-8 relative z-10">
            <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center border border-white/10 backdrop-blur-md shadow-inner transition-transform group-hover:scale-105 duration-500">
              <Fingerprint className="w-10 h-10 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/60 mb-2">Access Control Terminal</p>
              <h3 className="text-5xl font-black italic tracking-tighter leading-none truncate">
                {selectedUser?.name || 'Select Identity'}
                {selectedUser && (
                  <span className={cn(
                    "ml-4 text-sm font-bold not-italic uppercase tracking-widest border-l border-white/20 pl-4",
                    selectedUser.status === 'ACTIVE' ? "text-green-400" : "text-red-400"
                  )}>
                    {selectedUser.status}
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-[32px] border border-white/10 backdrop-blur-xl relative z-10">
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedUserId(e.target.value)}
                className="h-14 bg-white text-[#003366] border-none px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none transition-all appearance-none cursor-pointer pr-14 shadow-xl min-w-[240px] hover:bg-blue-50"
              >
                <option value="" disabled>Load User Profile</option>
                {users.map((u: SystemUser) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#003366]">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
            
            <button 
              onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ name: '', email: '', roleId: 'role-3', status: 'ACTIVE' }); }}
              className="px-8 h-14 bg-[#0066FF] text-white rounded-2xl flex items-center gap-3 text-[10px] font-black tracking-widest uppercase hover:bg-blue-500 transition-all shadow-lg hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" /> Provision
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* 📊 PERMISSION LEDGER UI */}
        <div className="lg:col-span-8 space-y-8">
          {selectedUser ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-[#003366]" />
                  <h2 className="text-xl font-black italic uppercase tracking-tight text-[#003366]">Permission Ledger</h2>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">User ID: {selectedUser.id}</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {permissionConfig.modules.map((module) => (
                  <div key={module.id} className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden group">
                    {/* Module Header */}
                    <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between border-b border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                          isModuleFullyAllowed(module.id) ? "bg-[#003366] text-white shadow-lg" : "bg-white text-[#003366] border border-gray-200"
                        )}>
                          <LayoutGrid className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black italic uppercase tracking-tight text-[#003366]">{module.name}</h4>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Module-Level Authority</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => bulkUpdateModulePermissions(selectedUserId, module.id, !isModuleFullyAllowed(module.id))}
                        className={cn(
                          "px-6 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border-2",
                          isModuleFullyAllowed(module.id)
                            ? "bg-primary/5 border-primary text-primary"
                            : "bg-gray-100 border-transparent text-gray-400 hover:border-gray-200"
                        )}
                      >
                        {isModuleFullyAllowed(module.id) ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {isModuleFullyAllowed(module.id) ? 'All Divisions Active' : 'Grant Full Access'}
                      </button>
                    </div>

                    {/* Division Ledger Rows */}
                    <div className="p-2 space-y-1">
                      {permissionConfig.divisions.map((division: any) => (
                        <div 
                          key={division.id}
                          className="flex items-center justify-between px-8 py-4 rounded-3xl hover:bg-gray-50 transition-all group/row"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              isDivisionAllowed(module.id, division.id) ? "bg-green-500 animate-pulse" : "bg-gray-200"
                            )} />
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-[#003366]">{division.name}</p>
                              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter italic">Division Authorization</p>
                            </div>
                          </div>

                          <div 
                            onClick={() => updateUserPermission(selectedUserId, module.id, division.id, !isDivisionAllowed(module.id, division.id))}
                            className={cn(
                              "w-14 h-8 rounded-full p-1 cursor-pointer transition-all flex items-center relative border-2",
                              isDivisionAllowed(module.id, division.id)
                                ? "bg-primary border-primary"
                                : "bg-gray-100 border-gray-200"
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-full bg-white shadow-md transition-all flex items-center justify-center",
                              isDivisionAllowed(module.id, division.id) ? "translate-x-6" : "translate-x-0"
                            )}>
                              {isDivisionAllowed(module.id, division.id) ? (
                                <Check className="w-3 h-3 text-primary" />
                              ) : (
                                <X className="w-3 h-3 text-gray-300" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-[48px] border-2 border-dashed border-gray-200 opacity-40 italic">
              <Lock className="w-20 h-20 text-[#003366] mb-6" />
              <p className="text-xl font-black uppercase tracking-[0.3em] text-[#003366]">Unauthorized Context</p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-4">Load a user profile to begin authorization ledger</p>
            </div>
          )}
        </div>

        {/* 📋 REGISTRY & PROVISIONING */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Registry */}
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] italic text-[#003366]">System Registry</h3>
              <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Find Identity..."
                className="w-full h-12 pl-12 bg-gray-50 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none border border-transparent focus:border-blue-100"
              />
            </div>

            <div className="space-y-2">
              {users.filter((u: SystemUser) => u.name.toLowerCase().includes(search.toLowerCase())).map((user: SystemUser) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={cn(
                    "w-full p-4 rounded-2xl flex items-center justify-between group transition-all border",
                    selectedUserId === user.id 
                      ? "bg-[#003366] text-white border-[#003366] shadow-xl shadow-blue-900/20" 
                      : "bg-gray-50 text-[#003366] border-transparent hover:bg-white hover:border-gray-100"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black italic",
                      selectedUserId === user.id ? "bg-white/10" : "bg-white text-[#003366]"
                    )}>
                      {user.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-black italic uppercase tracking-tight">{user.name}</p>
                      <p className={cn("text-[8px] font-bold uppercase tracking-widest", selectedUserId === user.id ? "text-white/40" : "text-gray-400")}>
                        {user.status}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className={cn("w-4 h-4 opacity-0 transition-all", selectedUserId === user.id ? "opacity-100 translate-x-0" : "group-hover:opacity-40 -translate-x-2")} />
                </button>
              ))}
            </div>
          </div>

          {/* Provisioning Terminal */}
          {isAdding && (
            <div className="bg-[#003366] p-8 rounded-[40px] text-white shadow-2xl animate-in zoom-in-95 duration-300 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Cpu className="w-24 h-24" />
              </div>

              <div className="flex justify-between items-center relative z-10">
                <h3 className="text-lg font-black italic uppercase tracking-tight">Provisioning</h3>
                <button onClick={() => setIsAdding(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40">Identity Name</label>
                  <input 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-11 bg-white/5 rounded-xl px-4 font-bold text-xs outline-none border border-white/10 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40">Enterprise Email</label>
                  <input 
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-11 bg-white/5 rounded-xl px-4 font-bold text-xs outline-none border border-white/10 focus:border-blue-400"
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveUser}
                className="w-full h-14 bg-blue-500 text-white rounded-2xl font-black italic uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-400 active:scale-95 transition-all relative z-10"
              >
                Commit Identity
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

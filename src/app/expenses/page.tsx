"use client"

import React, { useState, useMemo, useCallback, useEffect, Suspense } from 'react'
import {
    Plus,
    Receipt,
    Calendar,
    User,
    Search,
    Filter,
    ArrowUpRight,
    Wallet,
    Trash2,
    TrendingUp,
    Zap,
    HardDrive,
    ShoppingBag,
    DollarSign,
    Save,
    Package,
    Ticket,
    Clock
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useData, Engineer } from '@/lib/context/DataContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EntityLookup } from '@/components/shared/EntityLookup'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ItemUsage {
    id: string
    itemId: string
    serial?: string
    name: string
    qty: number
    cost: number
    requiresSerial?: boolean
    isInvalid?: boolean
}

interface ExpenseEntry {
    id: string
    name: string
    amount: number
    sub_type?: string
    invoiceRef?: string
}

function ExpensesContent() {
    const { transactions, saveTicketData, inventory, engineers, expenseConfigs } = useData()
    const searchParams = useSearchParams()
    const pageType = searchParams.get('type') || 'job'

    const pageTitle = useMemo(() => {
        switch (pageType) {
            case 'outside': return 'Outside Purchase Ledger'
            case 'transport': return 'Travel Expenses'
            default: return 'Job Expense Entry'
        }
    }, [pageType])

    // Header State
    const [ticketNo, setTicketNo] = useState("")
    const [customer, setCustomer] = useState("")
    const [engineer, setEngineer] = useState<Engineer | null>(null)

    // Table States
    const [items, setItems] = useState<ItemUsage[]>([
        { id: `item-init-${Date.now()}`, itemId: "", serial: "", name: "", qty: 1, cost: 0, requiresSerial: false }
    ])
    const [expenses, setExpenses] = useState<ExpenseEntry[]>([
        { id: `exp-init-${Date.now()}`, name: "", amount: 0 }
    ])
    const [revenue, setRevenue] = useState<string>("")
    const [jobDate, setJobDate] = useState(new Date().toISOString().split('T')[0])

    // Job Temporal State
    const [jobStartDay, setJobStartDay] = useState(new Date().toISOString().split('T')[0])
    const [jobStartTime, setJobStartTime] = useState("09:00")
    const [jobEndDay, setJobEndDay] = useState(new Date().toISOString().split('T')[0])
    const [jobEndTime, setJobEndTime] = useState("18:00")

    const [isSaving, setIsSaving] = useState(false)

    // Fetch existing data
    const fetchExisting = useCallback(async () => {
        if (!ticketNo) return;
        const existing = transactions.filter(t => t.reference === ticketNo);
        if (existing.length === 0) return;

        const firstTxn = existing[0];
        setCustomer(firstTxn.customer_name || "");

        const engId = existing.find(t => t.engineer_id && t.engineer_id !== 'N/A')?.engineer_id;
        const eng = engineers.find((e: Engineer) => e.id === engId);
        if (eng) setEngineer(eng);

        const loadedItems: ItemUsage[] = existing
            .filter(t => t.type === 'OUTWARD')
            .map(t => {
                const catalogItem = inventory.find(i => i.id === t.item_id);
                return {
                    id: t.id,
                    itemId: t.item_id,
                    serial: t.serial,
                    name: catalogItem?.name || 'Unknown Item',
                    qty: t.quantity,
                    cost: t.price || 0,
                    requiresSerial: catalogItem?.is_serialized || false
                }
            });

        const loadedExpenses: ExpenseEntry[] = existing
            .filter(t => t.type === 'EXPENSE')
            .map(t => {
                const config = expenseConfigs.find(c => c.id === t.expense_id);
                return {
                    id: t.id,
                    name: config?.name || t.expense_id || 'Expense',
                    amount: t.price || 0
                }
            });

        const revTxn = existing.find(t => t.type === 'REVENUE');

        if (loadedItems.length > 0) setItems([...loadedItems, { id: `item-next-${Date.now()}`, itemId: "", serial: "", name: "", qty: 1, cost: 0, requiresSerial: false }]);
        if (loadedExpenses.length > 0) setExpenses([...loadedExpenses, { id: `exp-next-${Date.now()}`, name: "", amount: 0 }]);
        setRevenue(revTxn?.price?.toString() || "");
    }, [ticketNo, transactions, inventory, expenseConfigs, engineers]);

    const totals = useMemo(() => {
        const finalItems = items.filter(i => i.itemId);
        const finalExpenses = expenses.filter(e => e.name);

        const itemCost = finalItems.reduce((sum, i) => sum + (i.qty * i.cost), 0);
        const opexCost = finalExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalCost = itemCost + opexCost;
        const revVal = Number(revenue) || 0;
        const profit = revVal - totalCost;

        let jobDuration = 0;
        try {
            const start = new Date(`${jobStartDay}T${jobStartTime}`);
            const end = new Date(`${jobEndDay}T${jobEndTime}`);
            const diffMs = end.getTime() - start.getTime();
            if (diffMs > 0) {
                jobDuration = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
            }
        } catch (e) { }

        return { itemCost, opexCost, totalCost, revenue: revVal, profit, jobDuration };
    }, [items, expenses, revenue, jobStartDay, jobStartTime, jobEndDay, jobEndTime])

    const addItem = () => setItems(prev => [...prev, { id: `item-${Date.now()}`, itemId: "", serial: "", name: "", qty: 1, cost: 0, requiresSerial: false }])
    const addExpense = () => setExpenses(prev => [...prev, { id: `exp-${Date.now()}`, name: "", amount: 0 }])
    const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))
    const removeExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id))

    const handleSave = async () => {
        if (!ticketNo || !engineer) return toast.error("❌ HARD_FAIL: Ticket Ref and Personnel required");
        setIsSaving(true);
        try {
            await saveTicketData(ticketNo, {
                customer,
                engineerId: engineer?.id,
                items: items.filter(i => i.itemId),
                expenses: expenses.filter(e => e.name),
                outsideExpenses: [],
                revenue: totals.revenue,
                date: jobDate
            });
            toast.success(`Ledger Updated: ${ticketNo}`);
        } catch (e) {
            toast.error("❌ HARD_FAIL: Persistence failure");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-12 space-y-10">
                {/* Header Section */}
                <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-xl shadow-blue-900/5 space-y-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
                                    <Receipt className="w-7 h-7" />
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-5xl font-black text-blue-950 italic tracking-tighter uppercase leading-none">{pageTitle}</h1>
                                    <p className="text-blue-600/40 font-black text-[10px] uppercase tracking-[0.4em] italic mt-2 ml-1">Financial Intelligence HUD</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Button onClick={handleSave} disabled={isSaving} className="h-16 px-10 rounded-3xl font-black italic tracking-[0.2em] uppercase transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 shadow-2xl shadow-blue-600/20 active:scale-95">
                                {isSaving ? "Persisting..." : "Commit to Ledger"}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-8 border-t border-gray-50">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-2">Job / Expense Ref</label>
                            <div className="relative group">
                                <Input value={ticketNo} onChange={e => setTicketNo(e.target.value.toUpperCase())} onBlur={fetchExisting} placeholder="TICKET-000" className="h-14 bg-gray-50 border-none rounded-2xl px-6 font-black italic text-blue-900 uppercase tracking-widest focus:ring-2 focus:ring-blue-100" />
                                <Ticket className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-2">Customer / Project</label>
                            <Input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="CLIENT NAME..." className="h-14 bg-gray-50 border-none rounded-2xl px-6 font-bold text-gray-700" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-2">Assigned Personnel</label>
                            <EntityLookup type="engineer" value={engineer?.name || ""} onChange={(val) => !val && setEngineer(null)} onSelect={(eng: Engineer) => setEngineer(eng)} placeholder="SELECT ENGINEER..." />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-2">Execution Date</label>
                            <Input type="date" value={jobDate} onChange={e => setJobDate(e.target.value)} className="h-14 bg-gray-50 border-none rounded-2xl px-6 font-bold text-gray-700" />
                        </div>
                    </div>
                </div>

                {/* Temporal HUD Stats */}
                {pageType !== 'outside' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">Start Point (Date)</p>
                            <Input type="date" value={jobStartDay} onChange={e => setJobStartDay(e.target.value)} className="h-12 bg-gray-50/50 border-none rounded-2xl font-black italic text-blue-900" />
                        </div>
                        <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">Start Point (Time)</p>
                            <Input type="time" value={jobStartTime} onChange={e => setJobStartTime(e.target.value)} className="h-12 bg-gray-50/50 border-none rounded-2xl font-black italic text-blue-900" />
                        </div>
                        <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">End Point (Date)</p>
                            <Input type="date" value={jobEndDay} onChange={e => setJobEndDay(e.target.value)} className="h-12 bg-gray-50/50 border-none rounded-2xl font-black italic text-emerald-900" />
                        </div>
                        <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">End Point (Time)</p>
                            <Input type="time" value={jobEndTime} onChange={e => setJobEndTime(e.target.value)} className="h-12 bg-gray-50/50 border-none rounded-2xl font-black italic text-emerald-900" />
                        </div>
                    </div>
                )}

                {/* Ledger Body */}
                <div className={cn("grid gap-10", pageType === 'outside' ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-12")}>
                    {/* Main Ledger */}
                    <div className={cn(pageType === 'outside' ? "w-full" : "xl:col-span-8", "space-y-8")}>
                        <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] italic text-blue-900">
                                    <Package className="w-4 h-4" /> Item Consumption Ledger
                                </div>
                                <Button onClick={addItem} variant="ghost" size="sm" className="text-[9px] font-black uppercase text-blue-600 italic">+ Add Item</Button>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-gray-50/50 z-10">
                                        <tr className="border-b border-gray-200 text-[9px] font-black text-gray-700 uppercase tracking-[0.2em] italic">
                                            <th className="px-8 py-4">Item Specification</th>
                                            <th className="px-4 py-4">Serial Number</th>
                                            <th className="px-4 py-4 text-center">Qty</th>
                                            <th className="px-4 py-4 text-right">Cost</th>
                                            <th className="px-8 py-4 text-right">Total</th>
                                            <th className="w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {items.map((item, idx) => (
                                            <tr key={item.id} className="group hover:bg-blue-50/30 transition-colors">
                                                <td className="px-8 py-4">
                                                    <EntityLookup
                                                        type="item"
                                                        value={item.name}
                                                        onChange={(val: string) => {
                                                            const copy = [...items];
                                                            copy[idx].name = val;
                                                            setItems(copy);
                                                        }}
                                                        onSelect={(it: any) => {
                                                            const copy = [...items];
                                                            copy[idx].itemId = it.id;
                                                            copy[idx].name = it.name;
                                                            copy[idx].cost = it.purchase_price || 0;
                                                            copy[idx].requiresSerial = !!it.is_serialized;
                                                            if (idx === items.length - 1) {
                                                                copy.push({ id: `item-${Date.now()}`, itemId: "", serial: "", name: "", qty: 1, cost: 0, requiresSerial: false });
                                                            }
                                                            setItems(copy);
                                                        }}
                                                        placeholder="SEARCH MASTER..."
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Input value={item.serial || ""} onChange={e => {
                                                        const copy = [...items];
                                                        copy[idx].serial = e.target.value;
                                                        setItems(copy);
                                                    }} className="h-10 bg-white/50 border-gray-100 text-[10px] font-black uppercase tracking-widest" />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input type="number" value={item.qty} onChange={e => {
                                                        const copy = [...items];
                                                        copy[idx].qty = Number(e.target.value);
                                                        setItems(copy);
                                                    }} className="w-full bg-transparent border-none text-center font-bold outline-none" />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input type="number" value={item.cost} onChange={e => {
                                                        const copy = [...items];
                                                        copy[idx].cost = Number(e.target.value);
                                                        setItems(copy);
                                                    }} className="w-full bg-transparent border-none text-right font-bold outline-none" />
                                                </td>
                                                <td className="px-8 py-4 text-right font-black italic">₹{(item.qty * item.cost).toLocaleString()}</td>
                                                <td className="px-4">
                                                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50/50">
                                        <tr className="border-t border-gray-200">
                                            <td colSpan={4} className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic text-right">Consumption Sub-Total</td>
                                            <td className="px-8 py-4 text-right font-black text-xl italic text-blue-900 underline decoration-blue-500/30 underline-offset-8">₹{totals.itemCost.toLocaleString()}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Outside Purchase Financial Summary Table */}
                        {pageType === 'outside' && (
                            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
                                    <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] italic text-emerald-600">
                                        <TrendingUp className="w-4 h-4" /> Financial Summary
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-100 italic">
                                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-50">Item Cost</th>
                                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-50">Opex Cost</th>
                                                <th className="px-8 py-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest border-r border-gray-50 underline decoration-emerald-500/30 underline-offset-4">Billing Amount (Net)</th>
                                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Calculated Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="hover:bg-emerald-50/10 transition-colors">
                                                <td className="px-8 py-6 font-black text-xl italic text-gray-950 border-r border-gray-50">₹{totals.itemCost.toLocaleString()}</td>
                                                <td className="px-8 py-6 font-black text-xl italic text-gray-500 border-r border-gray-50">₹{totals.opexCost.toLocaleString()}</td>
                                                <td className="px-8 py-6 relative border-r border-gray-50 min-w-[250px]">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl font-black text-emerald-600/40 italic">₹</span>
                                                        <input 
                                                            type="number" 
                                                            value={revenue} 
                                                            onChange={e => setRevenue(e.target.value)} 
                                                            placeholder="0.00" 
                                                            className="w-full bg-transparent border-none text-3xl font-black text-emerald-950 placeholder:text-gray-200 outline-none italic tracking-tighter" 
                                                        />
                                                    </div>
                                                </td>
                                                <td className={cn(
                                                    "px-8 py-6 text-right font-black text-3xl italic tracking-tighter transition-all",
                                                    totals.profit >= 0 ? "bg-emerald-900 text-emerald-400" : "bg-red-900 text-red-400"
                                                )}>
                                                    ₹{totals.profit.toLocaleString()}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Col (Hidden if Outside, or shown as sidebar for Job) */}
                    {pageType !== 'outside' && (
                        <div className="xl:col-span-4 space-y-8">
                            {/* Operational Expenses (Hiding check was here before) */}
                            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                    <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest italic text-amber-600">
                                        <Wallet className="w-4 h-4" /> Operational Expenses
                                    </div>
                                    <Button onClick={addExpense} variant="ghost" size="sm" className="text-[9px] font-black uppercase text-amber-600 italic">+ Add</Button>
                                </div>
                                <div className="p-6 space-y-4">
                                    {expenses.map((exp, idx) => (
                                        <div key={exp.id} className="space-y-4 p-4 rounded-3xl hover:bg-gray-50/50 transition-colors group border border-transparent hover:border-gray-100">
                                            <div className="flex gap-4 items-center">
                                                <div className="flex-1">
                                                    <EntityLookup
                                                        type="expense"
                                                        value={exp.name}
                                                        onChange={(val: string) => {
                                                            const copy = [...expenses];
                                                            copy[idx].name = val;
                                                            setExpenses(copy);
                                                        }}
                                                        onSelect={(e: any) => {
                                                            const copy = [...expenses];
                                                            copy[idx].name = e.name;
                                                            copy[idx].amount = e.default_amount || 0;
                                                            if (idx === expenses.length - 1) {
                                                                copy.push({ id: `exp-${Date.now()}`, name: "", amount: 0 });
                                                            }
                                                            setExpenses(copy);
                                                        }}
                                                        placeholder="SELECT CATEGORY..."
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Input type="number" value={exp.amount} onChange={e => {
                                                        const copy = [...expenses];
                                                        copy[idx].amount = Number(e.target.value);
                                                        setExpenses(copy);
                                                    }} className="w-24 h-10 rounded-xl bg-gray-50 border-none font-black italic text-right text-xs" />
                                                    <button onClick={() => removeExpense(exp.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-2"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-900 to-blue-950 p-10 rounded-[40px] text-white shadow-2xl shadow-blue-900/30 space-y-6">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic text-blue-200/50">Ticket Revenue</h3>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-black text-blue-200/20 italic">₹</span>
                                    <input type="number" value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none text-5xl font-black text-white placeholder:text-white/10 outline-none pl-8 italic tracking-tighter" />
                                </div>
                                <div className="pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic text-blue-200/30">
                                    <span>Calculated Profit</span>
                                    <span className={totals.profit >= 0 ? "text-emerald-400" : "text-red-400"}>₹{totals.profit.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 text-blue-600">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest italic">Time Intelligence</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-3xl font-black italic text-blue-950">{totals.jobDuration}<span className="text-sm ml-1 text-gray-400 uppercase">hrs</span></p>
                                    <p className="text-[9px] font-black uppercase text-gray-400 italic">Total Execution Time</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function ExpensesPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center font-black italic uppercase tracking-widest text-gray-400">Loading Intelligence...</div>}>
            <ExpensesContent />
        </Suspense>
    )
}

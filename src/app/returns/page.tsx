"use client"

import React, { useState, useMemo, useCallback, useEffect } from 'react'
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
    Save
} from 'lucide-react'
import { useData } from '@/lib/context/DataContext'
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
}

interface ExpenseEntry {
    id: string
    name: string
    amount: number
}

export default function ReturnsPage() {
    const { transactions, saveTicketData, inventory, engineers, expenseConfigs, getTicketProfit } = useData()

    // Header State
    const [ticketNo, setTicketNo] = useState("")
    const [customer, setCustomer] = useState("")
    const [engineer, setEngineer] = useState<any>(null)

    // Table States
    const [items, setItems] = useState<ItemUsage[]>([])
    const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
    const [outsideExpenses, setOutsideExpenses] = useState<ExpenseEntry[]>([])
    const [revenue, setRevenue] = useState<string>("")

    // Fetch Existing Data on Ticket No Enter
    const handleFetch = useCallback(() => {
        if (!ticketNo) return;
        const existing = transactions.filter(t => t.reference === ticketNo);
        if (existing.length === 0) return toast.info(`New Ticket: ${ticketNo}`);

        // Reconstruct state from ledger
        const firstTxn = existing[0];
        setCustomer(firstTxn.notes?.split(' | ')[1] || ""); // Try to extract customer if saved in notes or use dedicated field if added
        
        const engId = existing.find(t => t.engineer_id && t.engineer_id !== 'N/A')?.engineer_id;
        const eng = engineers.find((e: any) => e.id === engId);
        if (eng) setEngineer(eng);

        const loadedItems: ItemUsage[] = existing
            .filter(t => t.type === 'OUTWARD')
            .map(t => {
                const catalogItem = inventory.find(i => i.id === t.item_id);
                return {
                    id: t.id,
                    itemId: t.item_id,
                    serial: t.serial,
                    name: catalogItem?.name || t.notes?.split(' | ')[0]?.replace('Ticket Usage: ', '') || 'Unknown Item',
                    qty: t.quantity,
                    cost: t.price || 0
                }
            });

        const loadedExpenses: ExpenseEntry[] = existing
            .filter(t => t.type === 'EXPENSE' && t.sub_type !== 'OUTSIDE')
            .map(t => {
                const config = expenseConfigs.find(c => c.id === t.expense_id);
                return {
                    id: t.id,
                    name: config?.name || t.expense_id || 'Expense',
                    amount: t.price || 0
                }
            });

        const loadedOutside: ExpenseEntry[] = existing
            .filter(t => t.type === 'EXPENSE' && t.sub_type === 'OUTSIDE')
            .map(t => ({
                id: t.id,
                name: t.notes || 'Outside Purchase',
                amount: t.price || 0
            }));

        const revTxn = existing.find(t => t.type === 'REVENUE');

        setItems(loadedItems);
        setExpenses(loadedExpenses);
        setOutsideExpenses(loadedOutside);
        setRevenue(revTxn?.price?.toString() || "");
        toast.success(`Loaded Job Data: ${ticketNo}`);
    }, [ticketNo, transactions, inventory, expenseConfigs, engineers]);

    // Rule 1: ALWAYS recompute from ledger
    const totals = useMemo(() => {
        if (!ticketNo) return { itemCost: 0, expenseCost: 0, outsideCost: 0, totalCost: 0, revenue: 0, profit: 0, margin: 0 };
        const summary = getTicketProfit(ticketNo);
        
        // Break down for UI detail
        const ticketTxns = transactions.filter(t => t.reference === ticketNo);
        const itemCost = ticketTxns.filter(t => t.type === 'OUTWARD').reduce((sum, t) => sum + (t.amount || 0), 0);
        const expenseCost = ticketTxns.filter(t => t.type === 'EXPENSE' && t.sub_type !== 'OUTSIDE').reduce((sum, t) => sum + (t.amount || 0), 0);
        const outsideCost = ticketTxns.filter(t => t.type === 'EXPENSE' && t.sub_type === 'OUTSIDE').reduce((sum, t) => sum + (t.amount || 0), 0);

        return { 
            itemCost, 
            expenseCost, 
            outsideCost, 
            totalCost: summary.cost + summary.expense, 
            revenue: summary.revenue, 
            profit: summary.profit, 
            margin: summary.margin 
        };
    }, [ticketNo, transactions, getTicketProfit])

    // Row Management
    const addItem = (serial?: string) => {
        if (serial) {
            // Auto-detect item from serial if possible
            const match = inventory.find(i => serial.includes(i.id) || serial.startsWith('UNIT-'));
            setItems(prev => [...prev, { 
                id: `item-${Date.now()}`, 
                itemId: match?.id || "", 
                serial: serial,
                name: match?.name || "Scanned Serial", 
                qty: 1, 
                cost: match?.purchase_price || 0 
            }]);
        } else {
            setItems(prev => [...prev, { id: `item-${Date.now()}`, itemId: "", serial: "", name: "", qty: 1, cost: 0 }]);
        }
    }
    const addExpense = () => setExpenses(prev => [...prev, { id: `exp-${Date.now()}`, name: "", amount: 0 }])
    const addOutsideExpense = () => setOutsideExpenses(prev => [...prev, { id: `out-${Date.now()}`, name: "", amount: 0 }])

    const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))
    const removeExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id))
    const removeOutsideExpense = (id: string) => setOutsideExpenses(prev => prev.filter(e => e.id !== id))

    const handleSave = async () => {
        if (!ticketNo) return toast.error("❌ HARD_FAIL: Ticket No required");

        // Validations
        if (items.some(i => !i.itemId || i.cost <= 0)) return toast.error("❌ HARD_FAIL: Items must have cost");
        if (totals.revenue < 0) return toast.error("❌ HARD_FAIL: Negative revenue forbidden");

        try {
            await saveTicketData(ticketNo, {
                customer,
                engineerId: engineer?.id,
                items,
                expenses,
                outsideExpenses,
                revenue: totals.revenue
            });
            toast.success(`✅ Ledger Committed: ${ticketNo}`);
        } catch (e: any) {
            toast.error(e.message);
        }
    }

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F8F9FC] p-8">
            <div className="max-w-[1600px] mx-auto space-y-10">

                {/* Header Section */}
                <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-xl shadow-blue-900/5 space-y-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/30 group-hover:rotate-6 transition-transform">
                                    <Receipt className="w-7 h-7" />
                                </div>
                                <div>
                                    <h1 className="text-5xl font-black text-blue-950 italic tracking-tighter uppercase leading-none">RETURNS</h1>
                                    <p className="text-blue-600/40 font-black text-[10px] uppercase tracking-[0.4em] italic mt-2 ml-1">Financial Intelligence HUD</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                onClick={handleSave}
                                className="h-16 px-10 bg-[#1A1C21] rounded-2xl font-black uppercase tracking-widest italic flex items-center gap-3 shadow-2xl hover:scale-105 transition-all"
                            >
                                <Save className="w-5 h-5" />
                                Commit to Ledger
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Reference (Ticket #)</label>
                            <Input
                                autoFocus
                                value={ticketNo}
                                onChange={e => setTicketNo(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleFetch()}
                                placeholder="ENTER TICKET NO + PRESS ENTER"
                                className="h-14 rounded-2xl bg-blue-50/50 border-blue-100 font-black text-blue-600 text-lg uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Customer Name</label>
                            <Input
                                value={customer}
                                onChange={e => setCustomer(e.target.value)}
                                placeholder="OPTIONAL CLIENT REF"
                                className="h-14 rounded-2xl bg-gray-50 border-gray-100 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Field Engineer</label>
                            <div className="h-14 bg-gray-50 rounded-2xl px-4 border border-gray-100 flex items-center">
                                <EntityLookup
                                    type="engineer"
                                    value={engineer?.name || ""}
                                    onChange={() => { }}
                                    onSelect={setEngineer}
                                    placeholder="SEARCH PERSONNEL..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Stats Overlay */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {[
                        { label: 'Item Cost', val: totals.itemCost, color: 'text-gray-400' },
                        { label: 'Expenses', val: totals.expenseCost + totals.outsideCost, color: 'text-gray-400' },
                        { label: 'Total Cost', val: totals.totalCost, color: 'text-red-500' },
                        { label: 'Revenue', val: totals.revenue, color: 'text-blue-600' },
                        { label: 'Net Profit', val: totals.profit, color: totals.profit >= 0 ? 'text-green-500' : 'text-red-500', isLarge: true },
                        { label: 'Margin %', val: `${totals.margin.toFixed(1)}%`, color: totals.profit >= 0 ? 'text-green-500' : 'text-red-500', isRaw: true },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-1">
                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic">{stat.label}</p>
                            <p className={cn(
                                "font-black italic tracking-tighter leading-none",
                                stat.isLarge ? "text-2xl" : "text-xl",
                                stat.color
                            )}>
                                {stat.isRaw ? stat.val : `₹${stat.val.toLocaleString()}`}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                    {/* Left Col: Items & Outside */}
                    <div className="xl:col-span-8 space-y-8">

                        {/* 1. Inventory Consumption */}
                        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest italic text-blue-900">
                                    <HardDrive className="w-4 h-4" /> Inventory Usage
                                </div>
                                <Button onClick={() => addItem()} variant="ghost" size="sm" className="text-[9px] font-black uppercase text-blue-600 italic">
                                    + Add Line
                                </Button>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-50 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] italic">
                                            <th className="px-8 py-4 w-1/3">Item Specification</th>
                                            <th className="px-4 py-4 w-1/4">Serial Number</th>
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
                                                            if (it.is_serialized && !copy[idx].serial) {
                                                                toast.info("SCAN_REQUIRED: Serialized item selected");
                                                            }
                                                            setItems(copy);
                                                        }}
                                                        placeholder="SEARCH MASTER..."
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Input 
                                                        value={item.serial || ""}
                                                        onChange={e => {
                                                            const copy = [...items];
                                                            copy[idx].serial = e.target.value;
                                                            setItems(copy);
                                                        }}
                                                        placeholder="SCAN / ENTER SERIAL"
                                                        className="h-10 bg-white/50 border-gray-100 text-[10px] font-black uppercase tracking-widest"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="number"
                                                        value={item.qty}
                                                        onChange={e => {
                                                            const copy = [...items];
                                                            copy[idx].qty = Number(e.target.value);
                                                            setItems(copy);
                                                        }}
                                                        onKeyDown={e => e.key === 'Enter' && addItem()}
                                                        className="w-full bg-transparent border-none text-center font-bold outline-none"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="number"
                                                        value={item.cost}
                                                        onChange={e => {
                                                            const copy = [...items];
                                                            copy[idx].cost = Number(e.target.value);
                                                            setItems(copy);
                                                        }}
                                                        className="w-full bg-transparent border-none text-right font-bold outline-none"
                                                    />
                                                </td>
                                                <td className="px-8 py-4 text-right font-black italic">₹{(item.qty * item.cost).toLocaleString()}</td>
                                                <td className="px-4">
                                                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {items.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-12 text-center text-[10px] font-bold text-gray-200 uppercase tracking-widest italic">No items logged</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 2. Outside Purchases */}
                        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest italic text-orange-600">
                                    <ShoppingBag className="w-4 h-4" /> Outside Purchases (External)
                                </div>
                                <Button onClick={addOutsideExpense} variant="ghost" size="sm" className="text-[9px] font-black uppercase text-orange-600 italic">
                                    + Add Ad-hoc
                                </Button>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {outsideExpenses.map((exp, idx) => (
                                    <div key={exp.id} className="flex gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100 group">
                                        <Input
                                            placeholder="ITEM / SERVICE NAME"
                                            value={exp.name}
                                            onChange={e => {
                                                const copy = [...outsideExpenses];
                                                copy[idx].name = e.target.value;
                                                setOutsideExpenses(copy);
                                            }}
                                            className="h-10 bg-white border-none text-xs font-bold"
                                        />
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={exp.amount}
                                            onChange={e => {
                                                const copy = [...outsideExpenses];
                                                copy[idx].amount = Number(e.target.value);
                                                setOutsideExpenses(copy);
                                            }}
                                            className="h-10 w-24 bg-white border-none text-xs font-black italic text-right"
                                        />
                                        <button onClick={() => removeOutsideExpense(exp.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Internal Expenses & Revenue */}
                    <div className="xl:col-span-4 space-y-8">

                        {/* 3. Internal Expenses */}
                        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest italic text-amber-600">
                                    <Wallet className="w-4 h-4" /> Operational Expenses
                                </div>
                                <Button onClick={addExpense} variant="ghost" size="sm" className="text-[9px] font-black uppercase text-amber-600 italic">
                                    + Add
                                </Button>
                            </div>
                            <div className="p-6 space-y-4">
                                {expenses.map((exp, idx) => (
                                    <div key={exp.id} className="flex gap-4 items-center group">
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
                                                    setExpenses(copy);
                                                }}
                                                placeholder="SELECT CATEGORY..."
                                            />
                                        </div>
                                        <Input
                                            type="number"
                                            value={exp.amount}
                                            onChange={e => {
                                                const copy = [...expenses];
                                                copy[idx].amount = Number(e.target.value);
                                                setExpenses(copy);
                                            }}
                                            className="w-24 h-10 rounded-xl bg-gray-50 border-none font-black italic text-right text-xs"
                                        />
                                        <button onClick={() => removeExpense(exp.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. Revenue */}
                        <div className="bg-[#1A1C21] p-10 rounded-[48px] text-white space-y-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-32 h-32" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Final Commercials</p>
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase">Total Revenue</h2>
                            </div>
                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-blue-400">₹</div>
                                <Input
                                    type="number"
                                    value={revenue}
                                    onChange={e => setRevenue(e.target.value)}
                                    placeholder="0.00"
                                    className="h-20 bg-white/5 border-white/10 rounded-3xl pl-12 text-3xl font-black italic tracking-tighter text-blue-400 placeholder:text-white/10"
                                />
                            </div>
                            <div className="pt-4 flex items-center gap-2 text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] italic">
                                <Zap className="w-3 h-3" /> Real-time Calculation Sync Active
                            </div>
                        </div>

                        {/* Pro-tip */}
                        <div className="p-8 bg-blue-50/50 rounded-[40px] border border-blue-100/50 space-y-2">
                            <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest italic flex items-center gap-2">
                                <ArrowUpRight className="w-4 h-4" /> Power User Tip
                            </p>
                            <p className="text-[10px] font-bold text-blue-700/60 leading-relaxed uppercase">
                                Press <span className="bg-white px-2 py-0.5 rounded-lg border border-blue-200">CTRL + ENTER</span> to commit this ticket instantly to the main ledger.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

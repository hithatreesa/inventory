"use client"

import React, { useState, Suspense, useMemo, useEffect } from 'react'
import {
    Receipt,
    Calendar,
    User,
    Ticket,
    DollarSign,
    Upload,
    Trash2,
    FileText,
    Save,
    Image as ImageIcon,
    Camera,
    Plus,
    Package,
    ShoppingBag,
    Plane,
    Wallet,
    X,
    CheckCircle2
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useData } from '@/lib/context/DataContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EntityLookup } from '@/components/shared/EntityLookup'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PurchaseItem {
    id: string
    item: string
    qty: string
    unit: string
    price: string
    gst_rate: string | number
}

function ExpenseModuleContent() {
    const { commitTransaction, recordAdditionalPurchase, tickets } = useData()
    const searchParams = useSearchParams()
    const pageType = searchParams.get('type') || 'job'

    // PREMIUM THEME SYSTEM (Deep Navy Blue)
    const theme = useMemo(() => {
        const baseBlue = {
            primary: '#003B73',
            dark: '#002D59',
            light: '#E6F0FF',
            accent: '#004C99',
            text: '#001A33',
        }
        switch (pageType) {
            case 'outside':
                return { ...baseBlue, icon: <ShoppingBag className="w-8 h-8" /> }
            case 'transport':
                return { ...baseBlue, icon: <Plane className="w-8 h-8" /> }
            default:
                return { ...baseBlue, icon: <Wallet className="w-8 h-8" /> }
        }
    }, [pageType])

    const pageTitle = useMemo(() => {
        if (pageType === 'outside') return 'Additional Purchase'
        if (pageType === 'transport') return 'Travel Expenses'
        return 'General Expense'
    }, [pageType])

    const [isSaving, setIsSaving] = useState(false)
    const [form, setForm] = useState({
        ticketNo: '',
        client: '',
        engineer: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        billImageUrl: '',
        type: 'LOCAL'
    })

    const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>(
        Array.from({ length: 15 }, (_, i) => ({
            id: `p-${Date.now()}-${i}`,
            item: '',
            qty: '',
            unit: 'NOS',
            price: '',
            gst_rate: 18
        }))
    )

    // DRAFT PERSISTENCE (AGENTS.md Directive)
    useEffect(() => {
        const savedForm = localStorage.getItem('EXPENSE_DRAFT_FORM')
        const savedItems = localStorage.getItem('EXPENSE_DRAFT_ITEMS')
        if (savedForm) setForm(JSON.parse(savedForm))
        if (savedItems) setPurchaseItems(JSON.parse(savedItems))
    }, [])

    useEffect(() => {
        localStorage.setItem('EXPENSE_DRAFT_FORM', JSON.stringify(form))
        localStorage.setItem('EXPENSE_DRAFT_ITEMS', JSON.stringify(purchaseItems))
    }, [form, purchaseItems])

    // INTELLI-FILL REVERSE SYNC (Requirement 3)
    useEffect(() => {
        if (!form.client && !form.engineer) return;

        // Find tickets matching current client/engineer pair
        const matches = tickets.filter(t => 
            (!form.client || t.customer_name === form.client) &&
            (!form.engineer || t.engineer_id === form.engineer)
        );

        // If exactly one match exists and it's not the current one, resolve it
        if (matches.length === 1) {
            const match = matches[0];
            if (form.ticketNo !== match.id) {
                setForm(prev => ({ 
                    ...prev, 
                    ticketNo: match.id,
                    // Auto-fill date if it was the default today's date
                    date: (prev.date === new Date().toISOString().split('T')[0]) ? (match.created_at || prev.date) : prev.date
                }));
            }
        }
    }, [form.client, form.engineer, tickets, form.ticketNo]);

    const updatePurchaseItem = (id: string, field: keyof PurchaseItem, value: string) => {
        setPurchaseItems(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    }

    const removePurchaseItem = (id: string) => {
        setPurchaseItems(prev => {
            const filtered = prev.filter(p => p.id !== id);
            if (filtered.length === 0) {
                return [
                    { id: `p-${Date.now()}-0`, item: '', qty: '', unit: 'NOS', price: '', gst_rate: '0' }
                ];
            }
            return filtered;
        });
    }

    const addMoreRows = () => {
        const startIdx = purchaseItems.length;
        const newRows = Array.from({ length: 10 }, (_, i) => ({
            id: `p-${Date.now()}-${startIdx + i}`,
            item: '',
            qty: '',
            unit: 'NOS',
            price: '',
            gst_rate: '0'
        }));
        setPurchaseItems([...purchaseItems, ...newRows]);
    }

    const activeItems = purchaseItems.filter(p => p.item || p.price);

    const totalBaseAmount = useMemo(() => {
        return activeItems.reduce((sum, p) => sum + (Number(p.qty) * Number(p.price)), 0)
    }, [activeItems])

    const totalTaxAmount = useMemo(() => {
        return activeItems.reduce((sum, p) => {
            const base = (Number(p.qty) * Number(p.price));
            return sum + (base * (Number(p.gst_rate) / 100));
        }, 0)
    }, [activeItems])

    const totalPurchaseAmount = useMemo(() => {
        return totalBaseAmount + totalTaxAmount;
    }, [totalBaseAmount, totalTaxAmount])

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setForm(prev => ({ ...prev, billImageUrl: reader.result as string }));
            toast.success("RECEIPT_CAPTURED");
        };
        reader.readAsDataURL(file);
    }

    const handleSave = async () => {
        if (!form.ticketNo) return toast.error("HARD_FAIL: TICKET_REQUIRED");
        const activeItems = purchaseItems.filter(p => p.item.trim() !== '');

        const saveOperation = async () => {
            if (pageType === 'outside') {
                if (activeItems.length === 0) throw new Error("HARD_FAIL: NO_ITEMS");
                for (const p of activeItems) {
                    await recordAdditionalPurchase({
                        item_name: p.item,
                        qty: Number(p.qty) || 0,
                        cost: Number(p.price) || 0,
                        ticket_id: form.ticketNo,
                        notes: `CLIENT: ${form.client} | ENG: ${form.engineer} | UNIT: ${p.unit}`,
                        attachment: form.billImageUrl
                    });
                }
            } else {
                if (!form.amount) throw new Error("HARD_FAIL: AMOUNT_REQUIRED");
                await commitTransaction({
                    type: pageType === 'transport' ? 'TRAVEL_EXPENSE' : 'EXPENSE',
                    reference: form.ticketNo,
                    customer_name: form.client,
                    engineer_id: form.engineer,
                    date: form.date,
                    amount: Number(form.amount),
                    price: Number(form.amount),
                    notes: form.billImageUrl ? `PROOF: ${form.billImageUrl}` : '',
                    item_id: pageType === 'transport' ? 'exp1' : 'exp5',
                    serial: `${pageType === 'transport' ? 'TRV' : 'EXP'}-${Date.now()}`,
                    timestamp: Date.now()
                });
            }

            // Clear Drafts on Success
            localStorage.removeItem('EXPENSE_DRAFT_FORM');
            localStorage.removeItem('EXPENSE_DRAFT_ITEMS');
            setForm({ ticketNo: '', client: '', engineer: '', date: new Date().toISOString().split('T')[0], amount: '', billImageUrl: '', type: form.type });
            setPurchaseItems(Array.from({ length: 15 }, (_, i) => ({
                id: `p-${Date.now()}-${i}`,
                item: '',
                qty: '',
                unit: 'NOS',
                price: '',
                gst_rate: '0'
            })));
        };

        setIsSaving(true);
        try {
            await toast.promise(saveOperation(), {
                loading: 'COMMITTING TO LEDGER...',
                success: 'TRANSACTION_COMMITTED',
                error: (err) => {
                    return err.message || "HARD_FAIL: REJECTED";
                }
            });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-4 lg:p-10 font-sans transition-colors duration-500 overflow-hidden flex flex-col h-screen">
            <div className="max-w-[1900px] mx-auto space-y-8 flex flex-col flex-1 w-full">

                {/* HUD HEADER */}
                <div className="bg-white/70 backdrop-blur-2xl p-8 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                    <div className="flex items-center gap-6">
                        <div
                            className="w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-2xl transition-all duration-500"
                            style={{ backgroundColor: theme.primary, boxShadow: `0 20px 40px ${theme.primary}33` }}
                        >
                            {theme.icon}
                        </div>
                        <div>
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-[#001A33]">
                                {pageTitle}
                            </h1>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-3 italic">Audit Ready Ledger System // v2.0</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-10">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-2">Total (Inc. GST)</p>
                            <div className="text-4xl font-black italic flex items-center gap-2 transition-colors duration-500 text-[#001A33]">
                                <span className="text-xl text-gray-300">₹</span>
                                {pageType === 'outside' ? totalPurchaseAmount.toLocaleString() : (Number(form.amount) || 0).toLocaleString()}
                            </div>
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest italic mt-2">
                                Base: ₹{totalBaseAmount.toLocaleString()} // Tax: ₹{totalTaxAmount.toLocaleString()}
                            </p>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="h-20 px-14 rounded-[30px] text-white font-black italic uppercase tracking-widest transition-all active:scale-95 shadow-[0_20px_50px_rgba(0,100,255,0.3)] flex items-center gap-3 border-none text-xl hover:brightness-110"
                            style={{ backgroundColor: theme.primary }}
                        >
                            <Save className="w-6 h-6" />
                            {isSaving ? "PROCESSING..." : "Commit Transaction"}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    {/* MAIN CONTENT AREA */}
                    <div className="h-full flex flex-col min-h-0">
                        {pageType === 'outside' ? (
                            <div className="flex gap-8 h-full min-h-0 overflow-hidden p-6 pt-4">
                                {/* METADATA COMMAND SIDEBAR */}
                                <div className="w-[400px] shrink-0 bg-white/70 backdrop-blur-3xl p-8 rounded-[40px] border border-white/50 shadow-2xl overflow-y-auto custom-scrollbar">
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 italic ml-1">Reference Ticket</label>
                                            <EntityLookup
                                                type="ticket"
                                                value={form.ticketNo || ''}
                                                ticketFilter={{ client: form.client, engineer: form.engineer }}
                                                onChange={(val) => setForm({ ...form, ticketNo: val || '' })}
                                                onSelect={(ticket) => setForm({ 
                                                    ...form, 
                                                    ticketNo: ticket.id || '', 
                                                    client: ticket.customer_name || '',
                                                    engineer: ticket.engineer_id || '',
                                                    date: ticket.created_at || form.date
                                                })}
                                                placeholder="SEARCH TICKET..."
                                                className="h-14 bg-white border-2 border-gray-100 rounded-[18px] px-6 font-black italic text-sm shadow-lg focus:border-blue-500 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 italic ml-1 transition-colors duration-500" style={{ color: theme.primary }}>Digital Proof</label>
                                            <div
                                                onClick={() => document.getElementById('receipt-upload')?.click()}
                                                className="aspect-[4/3] rounded-[30px] border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-400 hover:shadow-xl transition-all group relative overflow-hidden"
                                            >
                                                {form.billImageUrl ? (
                                                    <img src={form.billImageUrl} className="w-full h-full object-cover" alt="Bill" />
                                                ) : (
                                                    <>
                                                        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-blue-500 transition-colors">
                                                            <Camera className="w-6 h-6" />
                                                        </div>
                                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 italic">Capture Proof</p>
                                                    </>
                                                )}
                                                <input id="receipt-upload" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 italic ml-1">Ledger Date</label>
                                                <Input
                                                    type="date"
                                                    value={form.date}
                                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                                    className="h-12 bg-white border-2 border-gray-100 rounded-[15px] px-5 font-black italic text-xs shadow-md"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 italic ml-1">Purchase Type</label>
                                                <select 
                                                    value={form.type}
                                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                                    className="w-full h-12 bg-white border-2 border-gray-100 rounded-[15px] px-5 font-black italic text-xs shadow-md outline-none cursor-pointer"
                                                >
                                                    <option value="LOCAL">LOCAL</option>
                                                    <option value="INTERSTATE">INTERSTATE</option>
                                                    <option value="EXEMPTED">EXEMPTED</option>
                                                </select>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 italic ml-1">Assignment Personnel</label>
                                                <EntityLookup
                                                    type="engineer"
                                                    value={form.engineer || ''}
                                                    onChange={(val) => setForm({ ...form, engineer: val || '' })}
                                                    onSelect={(eng) => setForm({ ...form, engineer: eng.id })}
                                                    placeholder="SELECT ENGINEER..."
                                                    className="h-12 bg-white border-2 border-gray-100 rounded-[15px] px-5 font-black italic text-xs shadow-md"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 italic ml-1">Customer Name</label>
                                                <EntityLookup
                                                    type="contact"
                                                    value={form.client || ''}
                                                    onChange={(val) => setForm({ ...form, client: val || '' })}
                                                    onSelect={(contact) => setForm({ ...form, client: contact.name })}
                                                    placeholder="SEARCH CUSTOMER..."
                                                    className="h-12 bg-white border-2 border-gray-100 rounded-[15px] px-5 font-black italic text-xs shadow-md"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* MANIFEST STAGE */}
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="grid grid-cols-[60px_1fr_100px_100px_150px] gap-0 items-end shrink-0">
                                        <div className="h-16 rounded-t-[24px] flex items-center justify-center text-[10px] font-black text-white uppercase italic tracking-widest border-r border-white/5" style={{ backgroundColor: theme.dark }}>S.N.</div>
                                        <div className="h-16 rounded-t-[24px] px-8 flex items-center text-[11px] font-black text-white uppercase italic tracking-widest border-r border-white/5" style={{ backgroundColor: theme.primary }}>PRODUCT SPECIFICATION</div>
                                        <div className="h-16 rounded-t-[24px] flex items-center justify-center text-[10px] font-black text-white uppercase italic tracking-widest border-r border-white/5 opacity-90" style={{ backgroundColor: theme.primary }}>QTY</div>
                                        <div className="h-16 rounded-t-[24px] flex items-center justify-center text-[10px] font-black text-white uppercase italic tracking-widest border-r border-white/5 opacity-80" style={{ backgroundColor: theme.primary }}>UOM</div>
                                        <div className="h-16 rounded-t-[24px] flex items-center justify-end px-8 text-[12px] font-black text-white uppercase italic tracking-widest shadow-2xl relative overflow-hidden" style={{ backgroundColor: theme.primary }}>
                                            <span className="relative z-10">RATE (₹)</span>
                                            <div className="absolute top-0 right-0 w-full h-full bg-black/10" />
                                        </div>
                                    </div>

                                    <div className="bg-white/70 backdrop-blur-xl rounded-b-[30px] shadow-2xl border border-white/50 overflow-hidden flex flex-col flex-1 min-h-0">
                                        <div className="flex-1 overflow-auto custom-scrollbar">
                                            <table className="w-full border-collapse">
                                                <tbody>
                                                    {purchaseItems.map((p, idx) => (
                                                        <tr key={p.id} className={cn("transition-all border-b border-gray-100", idx % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]")}>
                                                            <td className="w-[60px] px-2 py-4 text-center text-[12px] font-black text-gray-400 italic">{idx + 1}.</td>
                                                            <td className="px-0 py-0 border-r border-gray-100">
                                                                <EntityLookup
                                                                    type="item"
                                                                    value={p.item || ''}
                                                                    onChange={(val) => updatePurchaseItem(p.id, 'item', val || '')}
                                                                    onSelect={(item) => updatePurchaseItem(p.id, 'item', item.name || '')}
                                                                    placeholder="ITEM SPECIFICATION..."
                                                                    className="w-full h-12 bg-transparent border-none px-8 font-black italic text-xs uppercase tracking-tight"
                                                                />
                                                            </td>
                                                            <td className="w-[100px] px-0 py-0 border-r border-gray-100">
                                                                <input type="number" value={p.qty || ''} onChange={(e) => updatePurchaseItem(p.id, 'qty', e.target.value)} className="w-full h-12 bg-transparent border-none text-center font-black text-sm outline-none" />
                                                            </td>
                                                            <td className="w-[100px] px-0 py-0 border-r border-gray-100">
                                                                <input value={p.unit || ''} onChange={(e) => updatePurchaseItem(p.id, 'unit', e.target.value.toUpperCase())} className="w-full h-12 bg-transparent border-none text-center font-black text-[10px] uppercase tracking-widest outline-none" />
                                                            </td>
                                                            <td className="w-[150px] px-0 py-0">
                                                                <input type="number" value={p.price || ''} onChange={(e) => updatePurchaseItem(p.id, 'price', e.target.value)} className="w-full h-12 bg-transparent border-none text-right px-8 font-black text-sm italic outline-none text-blue-600" />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="p-6 bg-[#F1F3F9]/50 flex justify-between items-center border-t border-white/50 shrink-0">
                                            <button onClick={addMoreRows} className="h-12 px-8 rounded-[18px] font-black uppercase tracking-[0.2em] transition-all italic flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 border-none group text-[11px]" style={{ backgroundColor: theme.primary, color: 'white' }}>
                                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                                                <span>Add Manifest Line</span>
                                            </button>
                                            <p className="text-[10px] font-bold text-gray-400 italic">Audit registry secured v2.0</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-start justify-center p-6 pt-4 overflow-y-auto custom-scrollbar">
                                <div className="max-w-3xl w-full bg-white/70 backdrop-blur-3xl p-10 rounded-[40px] border border-white/50 shadow-2xl">
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 italic ml-1">Reference Ticket</label>
                                            <EntityLookup
                                                type="ticket"
                                                value={form.ticketNo || ''}
                                                ticketFilter={{ client: form.client, engineer: form.engineer }}
                                                onChange={(val) => setForm({ ...form, ticketNo: val || '' })}
                                                onSelect={(ticket) => setForm({ 
                                                    ...form, 
                                                    ticketNo: ticket.id || '', 
                                                    client: ticket.customer_name || '',
                                                    engineer: ticket.engineer_id || '',
                                                    date: ticket.created_at || form.date
                                                })}
                                                placeholder="SEARCH TICKET..."
                                                className="h-16 bg-white border-2 border-gray-100 rounded-[20px] px-8 font-black italic text-lg shadow-lg focus:border-blue-500 transition-all"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 italic ml-1 transition-colors duration-500" style={{ color: theme.primary }}>Digital Proof</label>
                                                <div
                                                    onClick={() => document.getElementById('receipt-upload')?.click()}
                                                    className="aspect-[3/2] rounded-[30px] border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-400 hover:shadow-xl transition-all group relative overflow-hidden"
                                                >
                                                    {form.billImageUrl ? (
                                                        <img src={form.billImageUrl} className="w-full h-full object-cover" alt="Bill" />
                                                    ) : (
                                                        <>
                                                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-blue-500 transition-colors">
                                                                <Camera className="w-8 h-8" />
                                                            </div>
                                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 italic">Capture Proof</p>
                                                        </>
                                                    )}
                                                    <input
                                                        id="receipt-upload"
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-8 flex flex-col justify-center">
                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 italic ml-1">Ledger Date</label>
                                                    <Input
                                                        type="date"
                                                        value={form.date}
                                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                                        className="h-14 bg-white border-2 border-gray-100 rounded-[18px] px-6 font-black italic text-sm shadow-md"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 italic ml-1">Purchase Type</label>
                                                    <select 
                                                        value={form.type}
                                                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                                                        className="w-full h-14 bg-white border-2 border-gray-100 rounded-[18px] px-6 font-black italic text-sm shadow-md outline-none cursor-pointer"
                                                    >
                                                        <option value="LOCAL">LOCAL</option>
                                                        <option value="INTERSTATE">INTERSTATE</option>
                                                        <option value="EXEMPTED">EXEMPTED</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[12px] font-black uppercase tracking-[0.3em] italic ml-1 transition-colors duration-500" style={{ color: theme.primary }}>Commit Amount (₹)</label>
                                                    <Input
                                                        type="number"
                                                        value={form.amount || ''}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, amount: e.target.value })}
                                                        placeholder="0.00"
                                                        className="h-16 border-none rounded-[20px] px-8 font-black italic text-3xl shadow-xl text-blue-900"
                                                        style={{ backgroundColor: `${theme.primary}10` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 italic ml-1">Assignment Personnel</label>
                                                <EntityLookup
                                                    type="engineer"
                                                    value={form.engineer || ''}
                                                    onChange={(val) => setForm({ ...form, engineer: val || '' })}
                                                    onSelect={(eng) => setForm({ ...form, engineer: eng.id })}
                                                    placeholder="SELECT ENGINEER..."
                                                    className="h-14 bg-white border-2 border-gray-100 rounded-[18px] px-6 font-black italic text-sm shadow-md"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 italic ml-1">Customer Name</label>
                                                <EntityLookup
                                                    type="contact"
                                                    value={form.client || ''}
                                                    onChange={(val) => setForm({ ...form, client: val || '' })}
                                                    onSelect={(contact) => setForm({ ...form, client: contact.name })}
                                                    placeholder="SEARCH CUSTOMER NAME..."
                                                    className="h-14 bg-white border-2 border-gray-100 rounded-[18px] px-6 font-black italic text-sm shadow-md"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

            export default function UnifiedPremiumExpensePage() {
    return (
            <Suspense fallback={<div className="p-24 text-center font-black italic uppercase tracking-widest text-gray-400 animate-pulse">Initializing Financial Intelligence Registry...</div>}>
                <ExpenseModuleContent />
            </Suspense>
            )
}

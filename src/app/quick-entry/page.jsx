"use client";
import { useState, useMemo } from "react";
import {
    Zap,
    Plus,
    X,
    Save,
    User,
    Package,
    DollarSign,
    FileText
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useData } from "@/lib/context/DataContext";
import { toast } from "sonner";

export default function QuickEntryDemo() {
    const { inventory, transactions, addItem } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        customer: "",
        product: "",
        amount: "",
        notes: "",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // For this demo, we'll treat "Add Entry" as creating a minimal Item or just a transaction record.
            // Since we don't have a "Generic Activity" API yet, we'll create a minimal item to show persistence.
            await addItem({
                name: form.product,
                category: 'Demo',
                sku: `DEMO-${Date.now().toString().slice(-6)}`,
                unit: 'pcs',
                price: Number(form.amount) || 0,
                brand: form.customer,
                location: 'Quick Entry Hub',
                threshold: 1
            });

            setForm({
                customer: "",
                product: "",
                amount: "",
                notes: "",
            });

            setIsOpen(false);
            toast.success('System Entry Successfully Committed');
        } catch (err) {
            toast.error(err.message || 'Validation Failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Combine transactions into the ledger display
    const ledgerEntries = useMemo(() => {
        return transactions.slice(0, 10).map(t => ({
            id: t.id,
            customer: t.engineer_id || 'System',
            product: `Txn ID: ${t.item_id}`,
            amount: t.quantity,
            date: t.date
        }));
    }, [transactions]);

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 leading-none italic">TRANSACTION_HUB 🥈</p>
                    <h1 className="text-4xl font-black text-text-main tracking-tight italic">Quick Entry System</h1>
                </div>
                <Button
                    onClick={() => setIsOpen(true)}
                    className="rounded-2xl shadow-xl shadow-primary/20 font-black text-[10px] tracking-widest h-12 px-8 italic uppercase"
                >
                    <Plus className="w-5 h-5 mr-1" /> Add Entry
                </Button>
            </div>

            {/* Entries List */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-6">
                    <h3 className="text-xl font-black text-text-main italic tracking-tight uppercase leading-none">Global Transaction Ledger (Real-time)</h3>
                    <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                </div>

                <div className="bg-white rounded-[24px] border border-border-main shadow-sm divide-y divide-gray-50 overflow-hidden">
                    {ledgerEntries.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-text-secondary opacity-30">
                            <Zap className="w-12 h-12 mb-4" />
                            <p className="text-[11px] font-black uppercase tracking-[0.4em] italic leading-none">NO_ENTRY_DETECTED</p>
                        </div>
                    ) : (
                        ledgerEntries.map((item) => (
                            <div
                                key={item.id}
                                className="px-10 py-5 flex justify-between items-center group hover:bg-gray-50/50 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Zap className="w-5 h-5 fill-primary/10" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-text-main italic tracking-tight uppercase leading-none mb-2">{item.customer}</p>
                                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">
                                            {item.product} • <span className="text-primary italic font-black">Quantity: {item.amount}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40 italic">{item.date}</p>
                                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => toast.info('Detail view planned')}><Plus className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
                    <div className="bg-white rounded-[32px] p-10 w-full max-w-xl shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />

                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div>
                                <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-2 leading-none italic">QUICK_ACTION_PROTOCOL 🥈</p>
                                <h2 className="text-3xl font-black text-text-main tracking-tight italic uppercase">Add Quick Entry</h2>
                            </div>
                            <Button
                                variant="secondary"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="rounded-2xl h-12 w-12 border-gray-100 hover:rotate-90 transition-transform"
                                disabled={isSubmitting}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-60 pl-4">Creator Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            value={form.customer}
                                            onChange={(e) => setForm({ ...form, customer: e.target.value })}
                                            className="w-full bg-gray-50/50 border border-gray-100 p-4 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold placeholder:italic placeholder:font-black placeholder:text-[10px] placeholder:opacity-20"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-60 pl-4">Asset Name</label>
                                    <div className="relative group">
                                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="System Component"
                                            value={form.product}
                                            onChange={(e) => setForm({ ...form, product: e.target.value })}
                                            className="w-full bg-gray-50/50 border border-gray-100 p-4 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold placeholder:italic placeholder:font-black placeholder:text-[10px] placeholder:opacity-20"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-60 pl-4">Initial Price (₹)</label>
                                <div className="relative group">
                                    <p className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black italic">₹</p>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={form.amount}
                                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        className="w-full bg-gray-50/50 border border-gray-100 p-6 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-black text-3xl tracking-tighter italic placeholder:opacity-10"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-60 pl-4">Operational Notes</label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-4 w-4 h-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                                    <textarea
                                        placeholder="Internal transaction details..."
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        className="w-full bg-gray-50/50 border border-gray-100 p-4 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold min-h-[100px] placeholder:italic placeholder:font-black placeholder:text-[10px] placeholder:opacity-20"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 h-14 rounded-2xl font-black text-[10px] tracking-widest opacity-60 hover:opacity-100 transition-opacity"
                                    disabled={isSubmitting}
                                >
                                    CANCEL DETACH
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-[2] h-14 rounded-2xl shadow-xl shadow-primary/20 italic font-black text-[11px] tracking-widest"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'PROCESSING...' : <><Save className="w-5 h-5 mr-1" /> COMMIT ENTRY</>}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
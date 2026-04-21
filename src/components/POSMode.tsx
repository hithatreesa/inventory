"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/lib/context/DataContext';
import { toast } from 'sonner';
import { EntityLookup } from '@/components/shared/EntityLookup';

interface POSModeProps {
  onExit: () => void;
}

export default function POSMode({ onExit }: POSModeProps) {
  const { inventory, outwardItem, engineers } = useData();
  const [cart, setCart] = useState<any[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [customer, setCustomer] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Point 20: Use a dedicated Terminal ID for POS sales
  const POS_ENG_ID = "eng_pos_terminal";

  // STEP 7: ADD ITEM BY BARCODE
  const addItemByBarcode = (code: string) => {
    // Treat SKU, ID, or Name as barcode to make it functionally testable since mock data doesn't have literal barcodes
    const item = inventory.find(i => 
      i.id.toString().toLowerCase() === code.toLowerCase() || 
      (i.sku && i.sku.toLowerCase() === code.toLowerCase()) || 
      i.name.toLowerCase() === code.toLowerCase()
    );

    if (!item) return;

    setCart(prev => {
      const existing = prev.find(p => p.id === item.id);

      if (existing) {
        return prev.map(p =>
          p.id === item.id ? { ...p, qty: p.qty + 1 } : p
        );
      }

      return [...prev, { ...item, qty: 1, selling_price: item.price || 0 }];
    });
  };

  // STEP 11: COMPLETE SALE (Harden Point 20)
  const completeSale = async () => {
    if (cart.length === 0 || isProcessing) return;

    setIsProcessing(true);
    try {
        // We iterate through cart and deduct stock via the context's hardened outward flow
        for (const item of cart) {
            await outwardItem(item.id, POS_ENG_ID, item.qty, `POS_SALE_${new Date().getTime()}`);
        }
        
        toast.success("Sale Completed Successfully");
        printBill();
        setCart([]);
    } catch (err: any) {
        console.error("POS_HARD_FAIL", err);
        toast.error(err.message || "Sale failed: Stock inconsistency detected");
    } finally {
        setIsProcessing(false);
    }
  };

  // STEP 12: INSTANT PRINT
  const printBill = () => {
    window.print();
  };

  const clearCart = () => setCart([]);

  // STEP 10: KEYBOARD SHORTCUTS
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") { e.preventDefault(); completeSale(); }
      if (e.key === "Escape") { e.preventDefault(); onExit(); }
      if (e.key === "Delete") { e.preventDefault(); clearCart(); }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart, onExit]);

  // STEP 9: TOTAL CALCULATION
  const total = useMemo(() => cart.reduce((sum, item) => sum + (item.qty * item.selling_price), 0), [cart]);

  // STEP 4: UI COMPONENT STRUCTURE
  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      
      {/* HEADER (Minimal) */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black italic uppercase text-[#003366] tracking-tight">Express POS Module</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-IN')}</p>
        </div>
        <button 
          onClick={onExit} 
          className="px-6 py-2 bg-red-50 text-red-600 font-black italic uppercase text-sm tracking-widest rounded-xl hover:bg-red-100 transition-colors"
        >
          Exit POS (Esc)
        </button>
      </header>

      {/* MAIN GRID */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative pb-28 lg:pb-0">
        
        {/* LEFT (70%) -> Cart Items */}
        <div className="lg:col-span-8 flex flex-col border-r border-gray-200 bg-white shadow-sm overflow-hidden z-10 relative">
          
          {/* STEP 6: BARCODE INPUT */}
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
             <EntityLookup
               type="item"
               placeholder="Scan barcode or type SKU (e.g. CAM-001)..."
               value={barcodeInput}
               onChange={setBarcodeInput}
               onSelect={(item) => {
                 addItemByBarcode(item.sku || item.barcode || item.id);
                 setBarcodeInput("");
               }}
               className="w-full h-16 bg-white border-2 border-gray-200 rounded-[20px] px-8 font-mono text-lg font-bold tracking-tight focus:border-[#003366] focus:bg-white transition-all outline-none"
             />
          </div>
          
          {/* STEP 8: CART UI */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
             {cart.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Item</th>
                      <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Qty</th>
                      <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right hidden sm:table-cell">Price</th>
                      <th className="py-4 text-[10px] font-black text-[#003366] uppercase tracking-widest italic text-right">Total</th>
                      <th className="py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cart.map(item => (
                       <tr key={item.id} className="hover:bg-gray-50/50">
                         <td className="py-4">
                           <p className="text-sm font-black text-[#003366] italic uppercase truncate max-w-[150px] sm:max-w-xs">{item.name}</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU: {item.sku || item.id}</p>
                         </td>
                         <td className="py-4 text-center">
                           <div className="flex items-center justify-center gap-1 sm:gap-3">
                             <button onClick={() => setCart(cart.map(i => i.id === item.id ? {...i, qty: Math.max(1, i.qty - 1)} : i))} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200 active:scale-95 transition-transform">-</button>
                             <span className="font-black text-base tabular-nums w-6 text-center">{item.qty}</span>
                             <button onClick={() => setCart(cart.map(i => i.id === item.id ? {...i, qty: i.qty + 1} : i))} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200 active:scale-95 transition-transform">+</button>
                           </div>
                         </td>
                         <td className="py-4 font-black text-sm text-gray-400 text-right tabular-nums hidden sm:table-cell">₹{(item.selling_price || 0).toLocaleString('en-IN')}</td>
                         <td className="py-4 font-black text-lg text-primary text-right tabular-nums italic">₹{(item.qty * (item.selling_price || 0)).toLocaleString('en-IN')}</td>
                         <td className="py-4 text-right">
                           <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-[10px] font-black text-red-400 tracking-widest italic uppercase hover:text-red-600 px-2">X</button>
                         </td>
                       </tr>
                    ))}
                  </tbody>
                </table>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-60">
                   <div className="w-16 h-16 border-4 border-dashed border-gray-300 rounded-3xl mb-4 opacity-50"></div>
                   <p className="text-sm font-black uppercase tracking-widest italic">Cart is Empty</p>
                   <p className="text-xs font-bold uppercase tracking-widest mt-1">Scan an item to begin</p>
                </div>
             )}
          </div>
        </div>

        {/* RIGHT (30%) -> Summary + Actions */}
        <div className="lg:col-span-4 bg-gray-50/50 flex flex-col h-full right-0 p-6 lg:p-8 border-t lg:border-t-0 fixed lg:relative bottom-0 w-full z-20 rounded-t-[32px] lg:shadow-none shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
           <div className="flex-1 hidden lg:flex flex-col">
             
             {/* Customer Lookup */}
             <div className="mb-6 relative z-50">
               <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-2">Customer / Party</h2>
               <EntityLookup 
                  type="vendor"
                  value={customer} 
                  onChange={setCustomer}
                  onSelect={v => setCustomer(v.name)}
                  placeholder="Walk-in Customer..."
                  className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 font-bold text-sm tracking-tight focus:border-[#003366] outline-none"
               />
             </div>

             <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-4">Order Totals</h2>
             
             <div className="space-y-3">
               <div className="flex justify-between items-center bg-white p-4 rounded-[20px] border border-gray-100">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Units ({cart.reduce((a,b)=>a+b.qty,0)})</span>
                 <span className="font-black text-sm tabular-nums text-text-secondary">₹{total.toLocaleString('en-IN')}</span>
               </div>
               <div className="flex justify-between items-center bg-white p-4 rounded-[20px] border border-gray-100">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tax (VAT%)</span>
                 <span className="font-black text-sm tabular-nums text-gray-400 italic tracking-widest">INC.</span>
               </div>
             </div>
           </div>

           <div className="mt-auto space-y-4">
             <div className="bg-[#003366] text-white p-6 rounded-[28px] shadow-xl shadow-primary/20 flex flex-col sm:flex-row justify-between items-end sm:items-center relative overflow-hidden">
               <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.2em] italic text-blue-200">Total Payable</span>
               <span className="text-5xl font-black italic tracking-tighter tabular-nums drop-shadow-md">₹{total.toLocaleString('en-IN')}</span>
             </div>

             {/* STEP 13: MOBILE + TOUCH OPTIMIZATION (large buttons h-14/16 grid) */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
               <button onClick={clearCart} className="h-16 bg-white border-2 border-gray-200 text-gray-400 rounded-2xl font-black uppercase tracking-[0.2em] italic hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300 transition-colors text-xs active:scale-[0.98]">
                 Clear/Del
               </button>
               <button onClick={completeSale} className="h-16 bg-green-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] italic hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 text-xs active:scale-[0.98]">
                 Charge (F2)
               </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

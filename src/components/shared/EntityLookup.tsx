"use client"

import React, { useState, useEffect, useRef, KeyboardEvent, useMemo, useCallback } from 'react';
import { useData } from '@/lib/context/DataContext';
import { ItemModal } from '@/components/modals/ItemModal';
import { VendorModal } from '@/components/modals/VendorModal';
import { cn } from '@/lib/utils';
import { Search, Plus, User, Package, ChevronRight, Scan } from 'lucide-react';

interface EntityLookupProps {
  type: 'vendor' | 'item' | 'expense' | 'engineer';
  value: string;
  onChange: (val: string) => void;
  onSelect: (entity: any) => void;
  placeholder?: string;
  className?: string;
}

// Hook for Vendor Logic
function useVendorLookup(value: string) {
  const { vendors } = useData();
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), 150);
    return () => clearTimeout(timer);
  }, [value]);

  const results = useMemo(() => {
    const q = debouncedValue.toLowerCase();
    return vendors.filter(v =>
      !q ||
      v.name.toLowerCase().includes(q) ||
      (v.gstin && v.gstin.toLowerCase().includes(q)) ||
      (v.phone && v.phone.includes(q))
    ).slice(0, 10).map(v => ({ ...v, type: 'vendor' }));
  }, [debouncedValue, vendors]);

  return results;
}

// Hook for Item Logic
function useItemLookup(value: string) {
  const { inventory } = useData();
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), 150);
    return () => clearTimeout(timer);
  }, [value]);

  const results = useMemo(() => {
    const q = debouncedValue.toLowerCase();
    return inventory.filter(i =>
      !q ||
      i.name.toLowerCase().includes(q) ||
      (i.sku && i.sku.toLowerCase().includes(q)) ||
      (i.brand && i.brand.toLowerCase().includes(q)) ||
      (i.model && i.model.toLowerCase().includes(q))
    ).slice(0, 10).map(i => ({
      ...i,
      stock: (i.total_qty || 0) - (i.assigned_qty || 0),
      type: 'item'
    }));
  }, [debouncedValue, inventory]);

  return results;
}

// Hook for Expense Logic
function useExpenseLookup(value: string) {
  const { expenseConfigs } = useData();
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), 150);
    return () => clearTimeout(timer);
  }, [value]);

  const results = useMemo(() => {
    const q = debouncedValue.toLowerCase();
    return expenseConfigs.filter((e: any) =>
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q)
    ).slice(0, 10).map((e: any) => ({ ...e, type: 'expense' }));
  }, [debouncedValue, expenseConfigs]);

  return results;
}

// Hook for Engineer Logic
function useEngineerLookup(value: string) {
  const { engineers } = useData();
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), 150);
    return () => clearTimeout(timer);
  }, [value]);

  const results = useMemo(() => {
    const q = debouncedValue.toLowerCase();
    return engineers.filter((e: any) =>
      !q ||
      e.name.toLowerCase().includes(q)
    ).slice(0, 10).map((e: any) => ({ ...e, type: 'engineer' }));
  }, [debouncedValue, engineers]);

  return results;
}

export function EntityLookup({ type, value, onChange, onSelect, placeholder, className }: EntityLookupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const vendorResults = useVendorLookup(value);
  const itemResults = useItemLookup(value);
  const expenseResults = useExpenseLookup(value);
  const engineerResults = useEngineerLookup(value);
  const results = type === 'vendor' ? vendorResults : (type === 'item' ? itemResults : (type === 'expense' ? expenseResults : engineerResults));

  const handleSelect = useCallback((item: any) => {
    onSelect(item);
    onChange(item.name);
    setIsOpen(false);
  }, [onSelect, onChange]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    const handleItemCreated = (e: any) => {
      if (type === 'item' && e.detail) {
        handleSelect(e.detail);
      }
    };
    const handleVendorCreated = (e: any) => {
      if (type === 'vendor' && e.detail) {
        handleSelect(e.detail);
      }
    };

    window.addEventListener("item-created", handleItemCreated);
    window.addEventListener("vendor-created", handleVendorCreated);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("item-created", handleItemCreated);
      window.removeEventListener("vendor-created", handleVendorCreated);
    };
  }, [type, handleSelect]);

  const handleCreateNew = useCallback(() => {
    if (type === 'item') {
      setIsItemModalOpen(true);
      setIsOpen(false);
    } else if (type === 'vendor') {
      setIsVendorModalOpen(true);
      setIsOpen(false);
    }
  }, [type]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (results.length + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (results.length + 1)) % (results.length + 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex === 0) {
        handleCreateNew();
      } else if (results[selectedIndex - 1]) {
        handleSelect(results[selectedIndex - 1]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div className="relative flex items-center group">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || `Search ${type}...`}
          className="w-full bg-transparent outline-none font-black text-text-main italic tracking-tight uppercase placeholder:opacity-30"
        />
        <div className="absolute right-0 flex items-center gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
          {type === 'item' ? <Package className="w-3 h-3" /> : (type === 'vendor' || type === 'engineer' ? <User className="w-3 h-3" /> : <Scan className="w-3 h-3" />)}
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {type !== 'expense' && type !== 'engineer' && (
              <div
                onClick={handleCreateNew}
                onMouseEnter={() => setSelectedIndex(0)}
                className={cn(
                  "px-4 py-4 flex items-center justify-between cursor-pointer border-l-4 transition-all",
                  selectedIndex === 0 ? "bg-primary/5 border-primary" : "border-transparent hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    selectedIndex === 0 ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                  )}>
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={cn("text-xs font-black uppercase tracking-widest", selectedIndex === 0 ? "text-primary" : "text-gray-400")}>Register New {type}</p>
                    <p className="text-[10px] font-bold text-gray-400 italic">Add to Master Data Hub</p>
                  </div>
                </div>
                <ChevronRight className={cn("w-4 h-4 transition-transform", selectedIndex === 0 ? "text-primary translate-x-1" : "text-gray-200")} />
              </div>
            )}

            {results.length > 0 && (
              <div className="border-t border-gray-50">
                <div className="px-4 py-2 bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Database Matches</div>
                {results.map((item: any, idx: number) => {
                  const actualIdx = idx + 1;
                  const isSelected = selectedIndex === actualIdx;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(actualIdx)}
                      className={cn(
                        "px-4 py-4 cursor-pointer border-l-4 transition-all",
                        isSelected ? "bg-primary/5 border-primary" : "border-transparent hover:bg-gray-50"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={cn("text-sm font-black uppercase italic tracking-tight", isSelected ? "text-primary" : "text-gray-900")}>
                            {item.name}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {type === 'item' ? (
                              <>
                                {item.sku && <span>SKU: {item.sku}</span>}
                                {item.brand && <span>{item.brand}</span>}
                                {item.is_serialized && <span className="text-amber-500 flex items-center gap-1"><Scan className="w-2.5 h-2.5" /> Serialized</span>}
                              </>
                            ) : type === 'vendor' || type === 'engineer' ? (
                              <>
                                {item.gstin && <span>GSTIN: {item.gstin}</span>}
                                {item.phone && <span>PH: {item.phone}</span>}
                                {item.type && <span>DEPT: {item.type}</span>}
                              </>
                            ) : (
                                <>
                                    {item.category && <span>CAT: {item.category}</span>}
                                </>
                            )}
                          </div>
                        </div>
                        {type === 'item' && (
                          <div className="text-right">
                            <p className={cn("text-xs font-black", (item.stock || 0) > 0 ? "text-green-600" : "text-red-500")}>
                              {(item.stock || 0)} UNITS
                            </p>
                            <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Current Stock</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {results.length === 0 && value && (
              <div className="p-8 text-center opacity-30">
                <Search className="w-8 h-8 mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Matches Found</p>
              </div>
            )}
          </div>
        </div>
      )}

      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
      />

      <VendorModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        initialName={value.trim()}
      />
    </div>
  );
}

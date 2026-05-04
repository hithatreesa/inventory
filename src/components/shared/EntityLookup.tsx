"use client"

import React, { useState, useEffect, useRef, KeyboardEvent, useMemo, useCallback } from 'react';
import { useData } from '@/lib/context/DataContext';
import { ItemModal } from '@/components/modals/ItemModal';
import { ContactModal } from '@/components/modals/ContactModal';
import { cn } from '@/lib/utils';
import { Search, Plus, User, Package, ChevronRight, Scan, FileText } from 'lucide-react';

interface EntityLookupProps {
  type: 'contact' | 'item' | 'expense' | 'engineer' | 'ticket';
  value: string;
  onChange: (val: string) => void;
  onSelect: (entity: any) => void;
  placeholder?: string;
  className?: string;
  contactFilter?: 'VENDOR' | 'CLIENT' | 'ALL';
  ticketFilter?: { client?: string; engineer?: string };
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  "data-row"?: number;
  "data-col"?: number;
  readOnly?: boolean;
}

// Hook for Contact Logic
function useContactLookup(value: string, filter?: 'VENDOR' | 'CLIENT' | 'ALL') {
  const { contacts } = useData();
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), 150);
    return () => clearTimeout(timer);
  }, [value]);

  const results = useMemo(() => {
    const q = debouncedValue.toLowerCase();
    return contacts.filter(v =>
      (!filter || filter === 'ALL' || v.type === filter) &&
      (!q ||
        v.name.toLowerCase().includes(q) ||
        (v.gstin && v.gstin.toLowerCase().includes(q)) ||
        (v.phone && v.phone.includes(q)))
    ).slice(0, 10).map(v => ({ ...v, type: 'contact' }));
  }, [debouncedValue, contacts, filter]);

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
      (i.barcode && i.barcode.toLowerCase().includes(q)) ||
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

// Hook for Ticket Logic
function useTicketLookup(value: string, filter?: { client?: string; engineer?: string }) {
  const { tickets } = useData();
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), 150);
    return () => clearTimeout(timer);
  }, [value]);

  const results = useMemo(() => {
    const q = debouncedValue.toLowerCase();
    return (tickets || []).filter((t: any) => {
      const matchesSearch = !q ||
        t.id.toLowerCase().includes(q) ||
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(q));
      
      const matchesFilter = !filter || (
        (!filter.client || t.customer_name === filter.client) &&
        (!filter.engineer || t.engineer_id === filter.engineer)
      );

      return matchesSearch && matchesFilter;
    }).slice(0, 10).map((t: any) => ({ ...t, name: t.id, type: 'ticket' }));
  }, [debouncedValue, tickets, filter]);

  return results;
}

export const EntityLookup = React.forwardRef<HTMLInputElement, EntityLookupProps>(({ type, value, onChange, onSelect, placeholder, className, contactFilter, ticketFilter, onKeyDown: onKeyDownProp, readOnly, ...rest }: EntityLookupProps, ref) => {
  const { inventory } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const contactResults = useContactLookup(value, contactFilter);
  const itemResults = useItemLookup(value);
  const expenseResults = useExpenseLookup(value);
  const engineerResults = useEngineerLookup(value);
  const ticketResults = useTicketLookup(value, ticketFilter);
  const results = type === 'contact' ? contactResults : (type === 'item' ? itemResults : (type === 'expense' ? expenseResults : (type === 'engineer' ? engineerResults : ticketResults)));

  const handleSelect = useCallback((item: any) => {
    onSelect(item);
    // Removed redundant onChange(string) call to prevent state collision with onSelect(object)
    setIsOpen(false);
  }, [onSelect]);

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
    const handleContactCreated = (e: any) => {
      if (type === 'contact' && e.detail) {
        handleSelect(e.detail);
      }
    };

    window.addEventListener("item-created", handleItemCreated);
    window.addEventListener("contact-created", handleContactCreated);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("item-created", handleItemCreated);
      window.removeEventListener("contact-created", handleContactCreated);
    };
  }, [type, handleSelect]);

  const handleCreateNew = useCallback(() => {
    if (type === 'item') {
      setIsItemModalOpen(true);
      setIsOpen(false);
    } else if (type === 'contact') {
      setIsContactModalOpen(true);
      setIsOpen(false);
    }
  }, [type]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDownProp) {
      onKeyDownProp(e);
      if (e.defaultPrevented) return;
    }

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        if (e.key === 'Enter' && value === "") return; // Don't open on empty enter if grid navigation is needed
        setIsOpen(true);
      }
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

      // Hardware Scanner Optimization: Instant Exact Match Check
      if (type === 'item' && value) {
        const exactMatch = inventory.find(i =>
          i.sku?.toLowerCase() === value.toLowerCase() ||
          i.barcode?.toLowerCase() === value.toLowerCase()
        );
        if (exactMatch) {
          handleSelect({ ...exactMatch, type: 'item' });
          return;
        }
      }

      if (selectedIndex === 0) {
        handleCreateNew();
      } else if (results[selectedIndex - 1]) {
        handleSelect(results[selectedIndex - 1]);
      } else if (results.length === 1) {
        // Auto-select if only one result and Enter is pressed (Scanner flow)
        handleSelect(results[0]);
      }
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div className="relative flex items-center group">
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => {
            if (readOnly) return;
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (!readOnly) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          {...rest}
          placeholder={placeholder || `Search ${type}...`}
          className="w-full bg-transparent outline-none font-black text-text-main italic tracking-tight uppercase placeholder:opacity-30"
        />
        <div className="absolute right-0 flex items-center gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
          {type === 'item' ? <Package className="w-3 h-3" /> : (type === 'contact' || type === 'engineer' ? <User className="w-3 h-3" /> : (type === 'ticket' ? <FileText className="w-3 h-3" /> : <Scan className="w-3 h-3" />))}
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[450px] max-w-[90vw] bg-white border border-gray-100 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5">
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            {type !== 'expense' && type !== 'engineer' && type !== 'ticket' && (
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
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-base font-black uppercase italic tracking-tight leading-tight truncate", isSelected ? "text-primary" : "text-gray-900")}>
                            {item.name}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {type === 'item' ? (
                              <>
                                {item.sku && <span>SKU: {item.sku}</span>}
                                {item.barcode && <span>B: {item.barcode}</span>}
                                {item.brand && <span>{item.brand}</span>}
                                {item.is_serialized && <span className="text-amber-500 flex items-center gap-1"><Scan className="w-2.5 h-2.5" /> Serialized</span>}
                              </>
                            ) : type === 'contact' || type === 'engineer' ? (
                              <>
                                {item.gstin && <span>GSTIN: {item.gstin}</span>}
                                {item.phone && <span>PH: {item.phone}</span>}
                                {item.type && <span>DEPT: {item.type}</span>}
                              </>
                            ) : type === 'ticket' ? (
                              <>
                                <span>{item.title}</span>
                                {item.customer_name && <span>{item.customer_name}</span>}
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

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        initialName={value}
        defaultType={contactFilter !== 'ALL' ? contactFilter : 'VENDOR'}
      />
    </div>
  );
});

EntityLookup.displayName = 'EntityLookup';

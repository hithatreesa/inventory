"use client"

import React, { useState, useEffect, useRef, KeyboardEvent, useMemo, useCallback } from 'react';
import { useData } from '@/lib/context/DataContext';
import { ItemModal } from '@/components/modals/ItemModal';
import { VendorModal } from '@/components/modals/VendorModal';

interface EntityLookupProps {
  type: 'vendor' | 'item';
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
      (v.gst && v.gst.toLowerCase().includes(q)) ||
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
      id: i.id,
      name: i.name,
      sku: i.sku || i.barcode,
      brand: i.brand,
      model: i.model,
      gst_rate: i.gst_rate,
      isSerialized: i.is_serialized || false,
      purchasePrice: i.price,
      stock: (i.total_qty || 0) - (i.assigned_qty || 0),
      type: 'item'
    }));
  }, [debouncedValue, inventory]);

  return results;
}

export function EntityLookup({ type, value, onChange, onSelect, placeholder, className }: EntityLookupProps) {
  const { inventory } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Barcode detection state
  const lastKeyTime = useRef<number>(0);
  const keyStrokes = useRef<string>("");

  const vendorResults = useVendorLookup(value);
  const itemResults = useItemLookup(value);
  const results = type === 'vendor' ? vendorResults : itemResults;

  const handleSelect = useCallback((entity: any) => {
    onChange(entity.name);
    onSelect(entity);
    setIsOpen(false);
  }, [onChange, onSelect]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    const handleVendorCreated = (e: any) => {
      if (type === 'vendor' && e.detail) {
        handleSelect(e.detail);
      }
    };
    window.addEventListener("vendor-created", handleVendorCreated);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
    } else {
      if (!value.trim()) return;
      const newEntity = { name: value.trim(), isNew: true, type };
      handleSelect(newEntity);
    }
  }, [value, type, handleSelect]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const now = Date.now();
    const timeDiff = now - lastKeyTime.current;
    
    // Barcode detection tracking
    if (e.key.length === 1) {
      if (timeDiff > 50) {
        keyStrokes.current = e.key; // Reset if gap is too long (human typing)
      } else {
        keyStrokes.current += e.key; // Append if rapid (scanner)
      }
    }
    lastKeyTime.current = now;

    if (e.key === "Enter") {
      e.preventDefault();
      
      // Barcode intercept (ITEM ONLY - CRITICAL)
      if (type === 'item' && timeDiff < 50 && keyStrokes.current.length > 3) {
        const barcodeMatch = inventory.find(i => 
          i.sku === keyStrokes.current || 
          i.barcode === keyStrokes.current ||
          i.sku === value ||
          i.barcode === value
        );
        
        if (barcodeMatch) {
          handleSelect({
            id: barcodeMatch.id,
            name: barcodeMatch.name,
            sku: barcodeMatch.sku || barcodeMatch.barcode,
            brand: barcodeMatch.brand,
            model: barcodeMatch.model,
            gst_rate: barcodeMatch.gst_rate,
            isSerialized: barcodeMatch.is_serialized || false,
            purchasePrice: barcodeMatch.price,
            type: 'item'
          });
          keyStrokes.current = "";
          return;
        }
      }

      keyStrokes.current = "";

      if (!isOpen) {
        setIsOpen(true);
        return;
      }

      if (selectedIndex === 0) {
        handleCreateNew();
      } else if (selectedIndex - 1 < results.length) {
        handleSelect(results[selectedIndex - 1]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex(prev => Math.min(prev + 1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key !== 'Tab') {
      if (!isOpen) setIsOpen(true);
    }
  };

  return (
    <div className="relative flex-1 w-full" ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setSelectedIndex(0);
        }}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          setIsOpen(true);
          e.target.select();
        }}
        placeholder={placeholder}
        className={className || "w-full outline-none bg-transparent"}
      />

      {isOpen && (
        <div className="absolute top-full sm:top-0 sm:left-full sm:ml-2 mt-1 sm:mt-0 z-[100] w-full sm:w-[320px] bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden text-black font-sans text-xs">
          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
            {/* Create New Option (Always at top, pinned) */}
            <div
              onClick={handleCreateNew}
              onMouseEnter={() => setSelectedIndex(0)}
              className={`p-3 cursor-pointer flex gap-3 items-center border-b border-gray-100 ${selectedIndex === 0 ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100/50 flex items-center justify-center flex-shrink-0 text-blue-600 font-black text-lg pb-0.5">+</div>
              <div className="flex flex-col">
                <span className="font-black italic uppercase tracking-wider text-[10px] text-blue-500/70">Create New {type}</span>
                <span className="font-bold text-sm truncate">{value || '...'}</span>
              </div>
            </div>

            {/* Results Array */}
            {results.length > 0 && (
              <div className="py-2">
                <div className="px-3 pb-1 text-[9px] font-black italic uppercase tracking-widest text-gray-400">Database Matches</div>
                {results.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx + 1)}
                    className={`px-3 py-2 border-l-2 cursor-pointer transition-colors ${selectedIndex === idx + 1 ? 'bg-blue-50/50 border-blue-500' : 'border-transparent hover:bg-gray-50'}`}
                  >
                    <div className={selectedIndex === idx + 1 ? 'font-black text-blue-900' : 'font-bold text-gray-700'}>
                      {item.name} {type === 'item' && <span className="opacity-60 italic text-[10px]">({(item as any).stock})</span>}
                    </div>
                    <div className="text-[10px] text-gray-500 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                      {type === 'vendor' ? (
                        <>
                          {(item as any).gst && <span><span className="opacity-50">GST:</span> {(item as any).gst}</span>}
                          {(item as any).phone && <span><span className="opacity-50">PH:</span> {(item as any).phone}</span>}
                        </>
                      ) : (
                        <>
                          {(item as any).sku && <span><span className="opacity-50">SKU:</span> {(item as any).sku}</span>}
                          {(item as any).brand && <span><span className="opacity-50">BR:</span> {(item as any).brand}</span>}
                          {(item as any).isSerialized && <span className="text-amber-600 font-bold tracking-widest">SERIALIZED</span>}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isItemModalOpen && (
        <ItemModal
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
        />
      )}

      {isVendorModalOpen && (
        <VendorModal
          isOpen={isVendorModalOpen}
          onClose={() => setIsVendorModalOpen(false)}
          initialName={value.trim()}
        />
      )}
    </div>
  );
}

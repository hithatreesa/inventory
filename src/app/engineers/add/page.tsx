"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowLeft, Save } from 'lucide-react';
import { useData } from '@/lib/context/DataContext';

export default function AddEngineerPage() {
  const router = useRouter();
  const { addEngineer } = useData();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<"IT" | "TECHNICAL">('IT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    
    // Call the DataContext function
    addEngineer({ name: name.trim(), type });

    // Optional success simulation
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/engineers');
    }, 400); // Slight delay for UI smoothness
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-transparent animate-in fade-in duration-500 pb-20 max-w-3xl mx-auto">
      
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.push('/engineers')}
          className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-[#003366] hover:border-[#003366] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#003366] italic uppercase tracking-tight">Add Profile</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Register New Personnel</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-border-main p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
             <h2 className="text-lg font-black text-[#003366] italic uppercase tracking-tight">Personnel Details</h2>
             <p className="text-[10px] font-black tracking-widest uppercase text-gray-400">Fill required fields</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
             <label className="block text-[11px] font-black text-[#003366] uppercase tracking-widest italic mb-2">
                Engineer Name <span className="text-red-500">*</span>
             </label>
             <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter Engineer Name"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10 transition-all font-sans font-medium text-gray-800"
             />
          </div>

          <div>
             <label className="block text-[11px] font-black text-[#003366] uppercase tracking-widest italic mb-2">
                Deployment Type <span className="text-red-500">*</span>
             </label>
             <select 
                value={type}
                onChange={e => setType(e.target.value as "IT" | "TECHNICAL")}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10 transition-all font-sans font-medium text-gray-800"
             >
                <option value="IT">Information Technology (IT)</option>
                <option value="TECHNICAL">Technical & Core</option>
             </select>
          </div>

          <div className="pt-6 border-t border-gray-50 flex justify-end">
             <button 
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-8 py-3.5 bg-[#003366] text-white rounded-xl flex items-center gap-2 text-[12px] font-black tracking-widest uppercase hover:bg-blue-900 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isSubmitting ? (
                   <>Saving...</>
                ) : (
                   <><Save className="w-4 h-4" /> Save Profile</>
                )}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}

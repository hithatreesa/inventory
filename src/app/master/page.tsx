import { Suspense } from 'react'
import { MasterLayout } from '@/components/master/MasterLayout'

export default function MasterPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FC]">
      <Suspense fallback={<div className="p-12 animate-pulse font-black text-primary italic uppercase tracking-widest">LOADING_MASTER_DATA...</div>}>
        <MasterLayout />
      </Suspense>
    </main>
  )
}

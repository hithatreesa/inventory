"use client"

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { ItemsMaster } from './ItemsMaster'
import { ContactMaster } from './ContactMaster'
import { GstMaster } from './GstMaster'

export function MasterLayout() {
  const searchParams = useSearchParams()
  const v = searchParams.get('v') || 'items'

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-12 min-h-screen bg-transparent animate-in fade-in duration-500 pb-32">
      <div className="flex-1 min-w-0">
        {v === 'items' && <ItemsMaster />}
        {v === 'vendors' && <ContactMaster />}
        {v === 'gst' && <GstMaster />}
      </div>
    </div>
  )
}

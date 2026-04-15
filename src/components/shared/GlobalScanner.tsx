"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useData } from '@/lib/context/DataContext'
import { toast } from 'sonner'
import { usePathname } from 'next/navigation'

export function GlobalScanner() {
    const { processBarcode } = useData()
    const [buffer, setBuffer] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const pathname = usePathname()

    // Always focus the hidden input unless an actual input is focused
    useEffect(() => {
        const handleFocus = () => {
            if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'SELECT') {
                inputRef.current?.focus()
            }
        }

        const interval = setInterval(handleFocus, 500)
        return () => clearInterval(interval)
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const barcode = buffer.trim()
            if (barcode) {
                const item = processBarcode(barcode)
                
                // Dispatch a custom event that pages can listen to
                window.dispatchEvent(new CustomEvent('barcode-scanned', { 
                    detail: { barcode, item } 
                }))

                if (!item) {
                    toast.error(`UNKNOWN_BARCODE: ${barcode}`)
                } else {
                    // Optional success feedback (beep handled by pages if preferred)
                }
            }
            setBuffer('')
        }
    }

    // Only render on relevant pages to avoid unnecessary focus stealing everywhere
    const activePages = ['/purchase', '/pos', '/sales', '/inventory']
    const isRelevantPage = activePages.some(p => pathname.startsWith(p))

    if (!isRelevantPage) return null

    return (
        <div className="fixed bottom-0 left-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden">
            <input 
                ref={inputRef}
                type="text" 
                value={buffer}
                onChange={(e) => setBuffer(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="absolute inset-0 w-full h-full"
            />
        </div>
    )
}

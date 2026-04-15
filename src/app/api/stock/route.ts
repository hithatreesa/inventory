import { NextResponse } from 'next/server'
import { getItems, calculateTotalQty, calculateAssignedStock } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const items = getItems()

    const inventory = items.map(item => {
      return {
        ...item,
        total_qty: calculateTotalQty(item.id),
        assigned_qty: calculateAssignedStock(item.id)
      }
    })

    return NextResponse.json({ inventory })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    const errorStack = err instanceof Error ? err.stack : undefined
    return NextResponse.json({ error: errorMessage, stack: errorStack }, { status: 500 })
  }
}

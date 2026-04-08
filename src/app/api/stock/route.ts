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
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
  }
}

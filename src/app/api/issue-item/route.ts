import { NextResponse } from 'next/server'
import { createTransaction } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { item_id, engineer_id, quantity, reference } = body

    if (!item_id || !quantity) {
      return NextResponse.json({ error: 'Missing req fields' }, { status: 400 })
    }

    const txn = createTransaction({
      item_id,
      engineer_id,
      quantity,
      type: 'ISSUE',
      from_warehouse: 'MAIN_STORE',
      to_warehouse: 'ENGINEER',
      reference: reference || `CHALLAN-${Date.now()}`
    })

    return NextResponse.json({ success: true, txn })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

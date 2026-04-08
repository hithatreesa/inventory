import { NextResponse } from 'next/server'
import { addItem, updateItem, deleteItems } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const item = addItem(body)
    return NextResponse.json({ success: true, item })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    
    const item = updateItem(id, updates)
    return NextResponse.json({ success: true, item })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { ids } = await req.json()
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'IDs array required' }, { status: 400 })
    }
    
    deleteItems(ids)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

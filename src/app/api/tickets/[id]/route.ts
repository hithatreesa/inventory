import { NextResponse } from 'next/server'
import { updateTicket } from '../../../../lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    
    if (!id) {
       return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 })
    }

    const ticket = updateTicket(id, body)
    return NextResponse.json({ ticket })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

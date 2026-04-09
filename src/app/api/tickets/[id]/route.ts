import { NextResponse } from 'next/server'
import { updateTicket } from '../../../../lib/db'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { id } = params
    
    if (!id) {
       return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 })
    }

    const ticket = updateTicket(id, body)
    return NextResponse.json({ ticket })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

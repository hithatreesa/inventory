import { NextResponse } from 'next/server'
import { getTickets, createTicket } from '../../../lib/db'

export async function GET() {
  try {
    const tickets = getTickets()
    return NextResponse.json({ tickets })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, description, status, assigned_engineer_id } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    const ticket = createTicket({
      title,
      description,
      status: status || "OPEN",
      assigned_engineer_id
    })

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

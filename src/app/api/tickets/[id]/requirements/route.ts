import { NextResponse } from 'next/server'
import { getTicketRequirements, addTicketRequirement } from '../../../../../lib/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const requirements = getTicketRequirements(id)
    return NextResponse.json({ requirements })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { item_id, quantity } = body

    if (!item_id || !quantity) {
      return NextResponse.json({ error: 'Item ID and quantity are required' }, { status: 400 })
    }

    const requirement = addTicketRequirement({
      ticket_id: id,
      item_id,
      quantity: Number(quantity)
    })

    return NextResponse.json({ requirement }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

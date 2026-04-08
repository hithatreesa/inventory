import { NextResponse } from 'next/server'
import { getEngineers, addEngineer } from '@/lib/db'

export async function GET() {
  try {
    const engineers = getEngineers()
    return NextResponse.json({ engineers })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const engineer = addEngineer(body)
    return NextResponse.json({ success: true, engineer })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

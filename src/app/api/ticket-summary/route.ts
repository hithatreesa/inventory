import { NextRequest, NextResponse } from 'next/server';
import * as engine from '@/lib/inventoryEngine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticketNo = searchParams.get('ticketNo');

  if (!ticketNo) {
    return NextResponse.json({ error: 'Ticket number is required' }, { status: 400 });
  }

  // Use the engine's summary logic
  // This will return the seeded dummy data (TCK-001, TCK-002, TCK-003) 
  // as implemented in inventoryEngine.ts
  const summary = engine.getTicketSummary(ticketNo);

  // Auto-resolve client and engineer for the response
  // In a real app, this would be a join with the Tickets table
  const ticketDetails: Record<string, any> = {
    'TCK-001': { client: 'Acme Corp', engineer: 'Ravi' },
    'TCK-002': { client: 'Globex Inc', engineer: 'Kiran' },
    'TCK-003': { client: 'Nexus Tech Supplies', engineer: 'Arjun' },
  };

  const details = ticketDetails[ticketNo] || { client: 'Unknown Client', engineer: 'N/A' };

  return NextResponse.json({
    ...summary,
    ...details,
    ticketId: ticketNo
  });
}

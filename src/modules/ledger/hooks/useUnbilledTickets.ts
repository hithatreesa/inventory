import { useMemo } from 'react';
import { Ticket, Transaction } from '@/lib/context/DataContext';

export function useUnbilledTickets(
  tickets: Ticket[], 
  transactions: Transaction[], 
  partyAccount: string, 
  searchQuery: string
) {
  return useMemo(() => {
    if (!partyAccount) return [];
    
    // 1. Filter tickets belonging to the specified party account
    const targetCustomer = partyAccount.toLowerCase();
    const customerTickets = tickets.filter(
      t => t.customer_name?.toLowerCase() === targetCustomer
    );
    
    if (customerTickets.length === 0) return [];

    // 2. Build Set of already billed ticket references to achieve O(1) lookups
    const revenueReferences = new Set(
      transactions
        .filter(tx => tx.type === 'REVENUE')
        .map(tx => tx.reference)
    );

    // 3. Optional: Build Map of ticket to engineer_id if search query exists
    const engineerMap = new Map<string, string>();
    if (searchQuery) {
      const customerTicketIds = new Set(customerTickets.map(t => t.id));
      transactions.forEach(tx => {
        if (tx.reference && customerTicketIds.has(tx.reference) && tx.engineer_id) {
            engineerMap.set(tx.reference, tx.engineer_id.toLowerCase());
        }
      });
    }

    // 4. Final filter
    return customerTickets.filter(t => {
      // Exclude tickets already billed
      if (revenueReferences.has(t.id)) return false;

      // Apply search query logic
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const idMatch = t.id.toLowerCase().includes(q);
        const titleMatch = t.title && t.title.toLowerCase().includes(q);
        const engMatch = engineerMap.get(t.id)?.includes(q);
        
        if (!idMatch && !titleMatch && !engMatch) return false;
      }
      return true;
    });
  }, [tickets, transactions, partyAccount, searchQuery]);
}

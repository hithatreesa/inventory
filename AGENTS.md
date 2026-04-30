<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# TERAIT ERP: Core Directives

## 1. Ledger Integrity (CRITICAL)
- **Immutable Logic**: Never bypass the `inventoryEngine.ts`. All movements MUST be serial-level transactions.
- **Zero-Sum Balance**: Ensure `INWARD` and `OUTWARD/CONSUMED` balances always match the physical reality.
- **Ticket Reference**: Every revenue or cost entry MUST have a valid `ticket_id`. DO NOT create aggregated financial records; keep them granular.

## 2. Master Data Enforcement
- **No Free-Text Entities**: Use `EntityLookup` for all Items, Customers, Vendors, and Engineers.
- **Snapshot Binding**: When saving a transaction, bind it to the Master ID, not just the name.

## 3. Design Aesthetics (The "Cobalt Slate" System)
- **High Density**: Maintain the professional, HUD-like interface with tight padding and high-contrast typography.
- **Micro-interactions**: Every save or critical action MUST have a `toast.promise` for immediate feedback.
- **Typography**: Use font-black, italic, and uppercase for headers to maintain the "Financial Intelligence" vibe.

## 4. Error Handling
- **Toast First**: Always notify the user of failures via `toast.error` with a specific code (e.g., `HARD_FAIL: SERIAL_MISMATCH`).
- **Draft Persistence**: For complex forms (like Expenses), implement `localStorage` draft recovery to prevent data loss.

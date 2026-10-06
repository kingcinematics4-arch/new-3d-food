// lib/orderReference.ts
// The customer-facing order reference ("DINE-XXXXX").
//
// The reference must come from the actual stored order row and must
// never change afterwards, so a tracking link keeps working after a
// refresh. Two sources are supported, in order of preference:
//
//   1. orders.order_number - the permanent reference number assigned
//      by the database trigger when migration 008 has been applied.
//   2. A deterministic code derived from the order's permanent uuid
//      `id` - for deployments that have not run migration 008 yet.
//      The uuid is the row's primary key, so the derived code is
//      unique per order, comes from the database row itself and is
//      stable for the lifetime of the order.
//
// The lookup side resolves the identifier it was given (see
// app/api/public/orders/[id]): a stored DINE-<digits> reference is
// matched against orders.order_number, anything else (the uuid the
// create route navigates with) is matched against orders.id.

export interface OrderReferenceSource {
  id: string;
  order_number?: string | null;
}

/**
 * The reference a customer sees for this order. Never invented: it is
 * either the stored order_number or a code derived from the stored
 * row id.
 */
export function orderReference(order: OrderReferenceSource): string {
  const stored = order.order_number;
  if (typeof stored === 'string' && stored.trim() !== '') {
    return stored.trim();
  }
  const hex = String(order.id).replace(/[^0-9a-f]/gi, '').toUpperCase();
  return `DINE-${hex.slice(0, 8)}`;
}

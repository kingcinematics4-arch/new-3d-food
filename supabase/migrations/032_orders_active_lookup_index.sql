-- supabase/migrations/032_orders_active_lookup_index.sql
-- Composite index for efficient active order lookup by hotel_id + table_number
-- where payment_status != 'paid' AND status != 'cancelled'
-- This speeds up the QR code recovery flow in /menu/[slug] and /api/orders/create

CREATE INDEX IF NOT EXISTS idx_orders_hotel_table_active
  ON public.orders (hotel_id, table_number, payment_status, status)
  WHERE payment_status <> 'paid' AND status <> 'cancelled';
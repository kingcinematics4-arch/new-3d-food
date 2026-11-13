-- supabase/migrations/033_menu_item_sizes.sql
-- Size Options feature for menu items
-- Allows hotels to add size variants (Small, Medium, Large, XL, etc.) with custom prices
-- Optional per product, with ON/OFF toggle for size selection

-- ============================================================
-- menu_item_sizes table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.menu_item_sizes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name text NOT NULL,                    -- e.g., 'Small', 'Medium', 'Large', 'Extra Large'
  price numeric(10,2) NOT NULL,          -- price for this specific size
  position integer DEFAULT 0,            -- display order
  is_available boolean DEFAULT true,     -- individual size availability
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for hotel-scoped queries and ordering
CREATE INDEX IF NOT EXISTS idx_menu_item_sizes_menu_item_id ON public.menu_item_sizes (menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_sizes_hotel_id ON public.menu_item_sizes (hotel_id);

-- Enable RLS
ALTER TABLE public.menu_item_sizes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Hotel owners can manage sizes for their menu items
DROP POLICY IF EXISTS "Hotel owners can view their menu item sizes" ON public.menu_item_sizes;
CREATE POLICY "Hotel owners can view their menu item sizes"
  ON public.menu_item_sizes FOR SELECT
  USING (
    hotel_id IN (
      SELECT id FROM public.hotels WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Hotel owners can insert menu item sizes" ON public.menu_item_sizes;
CREATE POLICY "Hotel owners can insert menu item sizes"
  ON public.menu_item_sizes FOR INSERT
  WITH CHECK (
    hotel_id IN (
      SELECT id FROM public.hotels WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Hotel owners can update menu item sizes" ON public.menu_item_sizes;
CREATE POLICY "Hotel owners can update menu item sizes"
  ON public.menu_item_sizes FOR UPDATE
  USING (
    hotel_id IN (
      SELECT id FROM public.hotels WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Hotel owners can delete menu item sizes" ON public.menu_item_sizes;
CREATE POLICY "Hotel owners can delete menu item sizes"
  ON public.menu_item_sizes FOR DELETE
  USING (
    hotel_id IN (
      SELECT id FROM public.hotels WHERE user_id = auth.uid()
    )
  );

-- Public read access for available sizes of available menu items
DROP POLICY IF EXISTS "Public can view available sizes for available items" ON public.menu_item_sizes;
CREATE POLICY "Public can view available sizes for available items"
  ON public.menu_item_sizes FOR SELECT
  USING (
    is_available = true
    AND menu_item_id IN (
      SELECT id FROM public.menu_items WHERE is_available = true
    )
  );

-- ============================================================
-- Add size-related columns to menu_items
-- ============================================================
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS has_sizes boolean DEFAULT false,       -- whether this item has size variants
  ADD COLUMN IF NOT EXISTS size_selection_required boolean DEFAULT false; -- whether customer MUST select a size

-- ============================================================
-- Add size columns to order_items
-- ============================================================
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS size_id uuid REFERENCES public.menu_item_sizes(id),
  ADD COLUMN IF NOT EXISTS size_name text,           -- denormalized for display
  ADD COLUMN IF NOT EXISTS size_price numeric(10,2); -- denormalized price at time of order

-- Index for order items with sizes
CREATE INDEX IF NOT EXISTS idx_order_items_size_id ON public.order_items (size_id);

-- ============================================================
-- Updated_at trigger for menu_item_sizes
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_menu_item_sizes_updated_at ON public.menu_item_sizes;
CREATE TRIGGER trigger_menu_item_sizes_updated_at
  BEFORE UPDATE ON public.menu_item_sizes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- PostgREST schema cache reload
-- ============================================================
-- Without this the API can keep returning PGRST205 ("could not find the
-- table/relationship") for up to a few minutes after the migration runs,
-- which would keep the menu looking empty even though the data is intact.
NOTIFY pgrst, 'reload schema';
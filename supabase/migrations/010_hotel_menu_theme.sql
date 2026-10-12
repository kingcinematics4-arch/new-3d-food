-- supabase/migrations/010_hotel_menu_theme.sql
--
-- Adds a `menu_theme` column to the `hotels` table. Every hotel gets one of
-- five built-in menu templates that control the public customer-facing menu's
-- visuals and layout (background, typography, accent, cards, category nav,
-- buttons, price styling, spacing, borders, shadows, header, search, food
-- presentation, product details, cart, and order-status page).
--
-- The column is constrained to the known set of theme IDs so a stray value in
-- the API can never corrupt the menu. New hotels default to 'classic-luxury'.
--
-- IDEMPOTENT / SAFE TO RE-RUN
--   Uses DO blocks so the migration can be applied multiple times without
--   error. Only adds the column when it does not already exist.

begin;

-- Add the column if it is missing.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'hotels'
      and column_name  = 'menu_theme'
  ) then
    alter table public.hotels
      add column menu_theme text not null default 'classic-luxury';
  end if;
end$$;

-- Constrain the value to the five shipped theme IDs.
-- Drop an existing constraint first so re-runs are safe.
alter table public.hotels
  drop constraint if exists hotels_menu_theme_check;

alter table public.hotels
  add constraint hotels_menu_theme_check
  check (menu_theme in (
    'classic-luxury',
    'modern-dark',
    'fresh-minimal',
    'indian-heritage',
    'contemporary-premium'
  ));

-- Backfill existing rows that somehow ended up NULL (defensive; the NOT NULL
-- default should have handled this, but if the column was added in a prior
-- partial run without the default this guarantees every row is set).
update public.hotels
   set menu_theme = 'classic-luxury'
 where menu_theme is null;

commit;

-- RESULT (read-only, safe to ignore)
-- Shows the distinct themes in use, which should be subset of the 5 allowed IDs.
select menu_theme, count(*) as hotel_count
  from public.hotels
  group by menu_theme
  order by hotel_count desc;

-- supabase/migrations/012_theme_columns_idempotent.sql
--
-- Ensures `public.hotels` has the two columns the app now uses for theme
-- persistence:
--
--   menu_theme          text      - one of the six accepted theme IDs
--   custom_theme_config jsonb     - full bespoke CustomThemeConfig object
--
-- The previous persistence layer wrote to `data/menu-themes.json` and
-- `data/custom-themes.json` on the local filesystem. On Vercel the deployed
-- filesystem is read-only, so every save threw:
--
--   EROFS: read-only file system, open '/var/task/data/menu-themes.json'
--
-- IMPORTANT — THIS FILE IS A SCHEMA DECLARATION, NOT A RUNTIME MIGRATION.
-- Supabase does not auto-apply files under supabase/migrations/ unless the
-- project is managed with `supabase db push` / the CLI migration runner. This
-- project's DEPLOYMENT.md instructs the owner to paste SQL into the Dashboard
-- SQL Editor, so the file that was actually pasted was 010 (and later 011),
-- NOT this one. The live database therefore still lacks
-- `hotels.menu_theme` and `hotels.custom_theme_config`.
--
-- That gap is the root cause of the reported bug: PUT /api/hotel/update
-- returns 200 "Uploaded", but the `hotels` UPDATE is silently dropped for the
-- unknown columns and the theme is never stored. Every later read of the
-- public menu falls back to the hardcoded `classic-luxury` default, so the
-- selected theme never reaches the customer-facing menu.
--
-- Run this whole file in the Supabase SQL Editor to close the gap. It is
-- idempotent and safe to re-run.
--
-- IDEMPOTENT / SAFE TO RE-RUN: every statement uses IF NOT EXISTS / DO
-- blocks, and existing constraints are dropped and re-added so the migration
-- can be applied multiple times without error.

begin;

-- (1) menu_theme column -------------------------------------------------------
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

-- Constrain to the known theme IDs. Drop first so re-runs are safe.
alter table public.hotels
  drop constraint if exists hotels_menu_theme_check;

alter table public.hotels
  add constraint hotels_menu_theme_check
  check (menu_theme in (
    'classic-luxury',
    'modern-dark',
    'fresh-minimal',
    'indian-heritage',
    'contemporary-premium',
    'custom'
  ));

-- Backfill any NULL rows defensively.
update public.hotels
   set menu_theme = 'classic-luxury'
  where menu_theme is null;

-- (2) custom_theme_config column ---------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'hotels'
      and column_name  = 'custom_theme_config'
  ) then
    alter table public.hotels
      add column custom_theme_config jsonb default null;
  end if;
end$$;

-- (3) Indexes -----------------------------------------------------------------
create index if not exists idx_hotels_menu_theme
  on public.hotels (menu_theme);

commit;

-- RESULT (read-only, safe to ignore)
select 'menu_theme'          as column_name,
       (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name = 'hotels'
            and column_name = 'menu_theme')          as present,
       (select count(*) from public.hotels)           as hotel_rows
union all
select 'custom_theme_config',
       (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name = 'hotels'
            and column_name = 'custom_theme_config'),
       (select count(*) from public.hotels);
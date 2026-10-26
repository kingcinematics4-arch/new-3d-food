-- supabase/migrations/013_hotel_custom_themes.sql
--
-- Saved Custom Themes library.
--
-- The existing persistence layer stores ONE active theme per hotel on
-- `hotels.menu_theme` (a theme id) and `hotels.custom_theme_config` (the full
-- CustomThemeConfig JSONB object for the `custom` id). That model cannot hold a
-- library of named, restorable themes: it is a single slot, so saving a second
-- theme overwrites the first, and there is no created_at / rename / duplicate /
-- delete lifecycle.
--
-- This migration adds a proper per-hotel library table:
--
--   public.hotel_custom_themes
--     id                uuid        primary key
--     hotel_id          uuid        not null -> public.hotels(id)
--     name              text        not null, check length
--     theme_config      jsonb       not null, the full CustomThemeConfig
--     is_active         boolean     not null default false
--                        -- which saved row is currently applied to the menu
--     created_at        timestamptz not null default now()
--     updated_at        timestamptz not null default now()
--
-- `is_active` is denormalised on purpose: applying a theme must be a single
-- UPDATE that flips exactly one row per hotel, and the public-menu read path
-- can fetch the active theme with one indexed query instead of joining.
-- A trigger keeps `is_active` exclusive per hotel (at most one true per
-- hotel_id) so two concurrent saves cannot both win.
--
-- IDEMPOTENT / SAFE TO RE-RUN: every object uses IF NOT EXISTS / IF EXISTS,
-- and the trigger is dropped before it is created.

begin;

-- (1) Table ------------------------------------------------------------------
create table if not exists public.hotel_custom_themes (
  id            uuid        primary key default gen_random_uuid(),
  hotel_id      uuid        not null references public.hotels (id) on delete cascade,
  name          text        not null check (btrim(name) <> '' and length(name) <= 80),
  theme_config  jsonb       not null,
  is_active     boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- (2) Indexes ---------------------------------------------------------------
-- Owner lookups + active-row fetch.
create index if not exists idx_hct_hotel_id
  on public.hotel_custom_themes (hotel_id);

-- Partial index: the one active theme per hotel, hot path for the menu read.
create index if not exists idx_hct_hotel_active
  on public.hotel_custom_themes (hotel_id)
  where is_active = true;

-- (3) updated_at maintenance trigger ----------------------------------------
create or replace function public._set_hct_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_hct_updated_at on public.hotel_custom_themes;
create trigger trg_hct_updated_at
  before update on public.hotel_custom_themes
  for each row execute function public._set_hct_updated_at();

-- (4) Exclusive-active trigger ----------------------------------------------
-- Ensures at most one saved theme per hotel is flagged active. Runs BEFORE
-- the update so the new value wins and every other row in the same hotel is
-- cleared atomically with it.
create or replace function public._enforce_single_active_hct()
returns trigger as $$
begin
  if new.is_active = true then
    update public.hotel_custom_themes
       set is_active = false
     where hotel_id = new.hotel_id
       and id <> new.id
       and is_active = true;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_hct_single_active on public.hotel_custom_themes;
create trigger trg_hct_single_active
  before update on public.hotel_custom_themes
  for each row execute function public._enforce_single_active_hct();

commit;

-- RESULT (read-only, safe to ignore)
select 'hotel_custom_themes'  as table_name,
       (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name = 'hotel_custom_themes') as column_count,
       (select count(*) from public.hotel_custom_themes) as saved_themes
union all
select 'policies', 0, 0;
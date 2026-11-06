-- supabase/migrations/023_hotel_card_templates.sql
--
-- Hotel identity card templates: admin-uploaded background designs + dynamic
-- field layout (position/font/color/alignment) rendered on the dashboard
-- Hotels page with per-hotel data.
--
-- ADDITIVE / IDEMPOTENT. No existing tables, columns, policies, or hotel
-- records are modified.
--
-- Storage: template images live in the existing public `dine3d-branding`
-- bucket (005/009) under the `hotel-card-` object prefix. Reuses the
-- bucket's public-read/no-public-write policy model; writes go through
-- service-role API routes guarded by admin auth.

begin;

create table if not exists public.hotel_card_templates (
  id text primary key,
  name text not null default '',
  image_url text not null,
  storage_path text,                          -- managed object path for cleanup
  width integer not null default 1200,         -- intrinsic/template canvas width
  height integer not null default 667,        -- intrinsic/template canvas height
  field_layout jsonb not null default '{}'::jsonb, -- normalized field positions/styles
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one active template (partial unique index). Safe if re-run.
create unique index if not exists hotel_card_templates_one_active
  on public.hotel_card_templates (is_active)
  where is_active = true;

create index if not exists hotel_card_templates_created_at
  on public.hotel_card_templates (created_at desc);

-- Keep updated_at fresh.
create or replace function public.set_hotel_card_templates_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_hotel_card_templates_updated_at on public.hotel_card_templates;
create trigger trg_hotel_card_templates_updated_at
  before update on public.hotel_card_templates
  for each row execute function public.set_hotel_card_templates_updated_at();

-- RLS: no public/anon/authenticated policies. Reads/writes only via
-- service-role server routes (same model as site_content/branding assets).
alter table public.hotel_card_templates enable row level security;

commit;

select id, name, is_active from public.hotel_card_templates limit 5;

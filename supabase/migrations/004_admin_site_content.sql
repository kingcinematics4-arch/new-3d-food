-- supabase/migrations/004_admin_site_content.sql
--
-- Dine3D admin website content store.
--
-- SCOPE: this migration ONLY adds new tables. It does not alter, drop or
-- re-grant anything on hotels, categories, dishes, orders, reviews or any
-- other restaurant table. Restaurant data and admin website content are kept
-- completely separate.
--
-- SECURITY MODEL:
-- Both tables have RLS enabled and deliberately carry NO policies. With RLS on
-- and no policy, the anon and authenticated roles match zero rows and can
-- perform zero writes. Every read and write therefore has to go through a
-- server route that holds the service-role key, which is the only way to edit
-- the public Dine3D website.

-- ============================================================
-- SITE CONTENT: draft / published website document
-- ============================================================
create table if not exists public.site_content (
  id           text primary key default 'main',
  draft        jsonb not null default '{}'::jsonb,
  published    jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now(),
  published_at timestamptz
);

comment on table public.site_content is
  'Draft/published content for the public Dine3D website. Server-only access (service role).';
comment on column public.site_content.draft is
  'Editable working copy. Never rendered on the public site.';
comment on column public.site_content.published is
  'The document the public website renders. Null/empty means "never published".';

alter table public.site_content enable row level security;

-- No policies on purpose: anon + authenticated get no access at all.

-- ============================================================
-- ADMIN SESSION REVOCATION STATE
-- ============================================================
-- The admin session cookie is stateless (HMAC-signed), which keeps
-- verification cheap. Stateless alone means "logout" could only delete the
-- browser's copy while a stolen cookie stayed valid until it expired.
--
-- This single row records the instant of the most recent logout. Any session
-- token issued at or before that instant is rejected, so logout genuinely
-- invalidates the session on the server rather than in the browser.
create table if not exists public.admin_session_state (
  id         boolean primary key default true,
  revoked_at timestamptz,
  constraint admin_session_state_singleton check (id)
);

comment on table public.admin_session_state is
  'Server-side admin session revocation marker. Service-role only.';

alter table public.admin_session_state enable row level security;

insert into public.admin_session_state (id, revoked_at)
values (true, null)
on conflict (id) do nothing;
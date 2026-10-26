-- supabase/migrations/014_hotel_custom_themes_rls.sql
--
-- Row Level Security for public.hotel_custom_themes.
--
-- The API routes (app/api/hotel/themes/*) already enforce ownership server-side
-- via requireOwnedHotelId() and use the service-role client, so RLS is a
-- defence-in-depth layer: it protects the table if it is ever queried directly
-- (e.g. from the browser anon client) and guarantees a hotel can never read or
-- write another hotel's saved themes.
--
-- IDEMPOTENT / SAFE TO RE-RUN: policies are dropped before being created.

begin;

-- Enable RLS (idempotent: ALTER ... ENABLE is a no-op when already enabled).
alter table public.hotel_custom_themes enable row level security;

-- Drop any pre-existing policies so re-runs are safe.
drop policy if exists "Hotel owners can view their own saved themes" on public.hotel_custom_themes;
drop policy if exists "Hotel owners can create saved themes" on public.hotel_custom_themes;
drop policy if exists "Hotel owners can update their own saved themes" on public.hotel_custom_themes;
drop policy if exists "Hotel owners can delete their own saved themes" on public.hotel_custom_themes;

-- Ownership is derived from the authenticated session: auth.uid() must match
-- public.hotels.user_id for the row's hotel_id. The service-role client used by
-- the API routes bypasses RLS, but the routes check ownership first, so this
-- policy never blocks legitimate API traffic.

create policy "Hotel owners can view their own saved themes"
  on public.hotel_custom_themes
  for select
  using (
    exists (
      select 1 from public.hotels h
      where h.id = hotel_custom_themes.hotel_id
        and h.user_id = auth.uid()
    )
  );

create policy "Hotel owners can create saved themes"
  on public.hotel_custom_themes
  for insert
  with check (
    exists (
      select 1 from public.hotels h
      where h.id = hotel_custom_themes.hotel_id
        and h.user_id = auth.uid()
    )
  );

create policy "Hotel owners can update their own saved themes"
  on public.hotel_custom_themes
  for update
  using (
    exists (
      select 1 from public.hotels h
      where h.id = hotel_custom_themes.hotel_id
        and h.user_id = auth.uid()
    )
  );

create policy "Hotel owners can delete their own saved themes"
  on public.hotel_custom_themes
  for delete
  using (
    exists (
      select 1 from public.hotels h
      where h.id = hotel_custom_themes.hotel_id
        and h.user_id = auth.uid()
    )
  );

commit;

-- RESULT (read-only, safe to ignore)
select schemaname, tablename, policyname
  from pg_policies
 where schemaname = 'public' and tablename = 'hotel_custom_themes'
 order by policyname;

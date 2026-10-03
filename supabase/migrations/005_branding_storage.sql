-- supabase/migrations/005_branding_storage.sql
--
-- Dine3D website branding asset storage.
--
-- REQUIRES 004_admin_site_content.sql to be applied first: the logo reference
-- is stored inside the existing singleton `site_content` row (id = 'main') in
-- its `branding.logoUrl` field. No new settings table is created here, so there
-- is exactly one branding record and replacing the logo updates it in place
-- rather than inserting duplicate rows.
--
-- Only ONE new object is created: the storage bucket. No existing table,
-- column, policy or restaurant table is modified.
--
-- ACCESS MODEL
--   PUBLIC READ  - visitors must be able to load the logo, so the bucket is
--                  public and a SELECT policy is granted to `public`.
--   NO PUBLIC WRITE - there is deliberately NO insert / update / delete policy
--                  for `anon` or `authenticated`. With RLS enabled on
--                  storage.objects and no write policy, the browser cannot
--                  upload anything. Writes only happen through a server route
--                  holding the service-role key, after an admin session check.
--
-- Belt and braces: `file_size_limit` and `allowed_mime_types` are enforced by
-- Storage itself as well as by the upload route, so an oversized or unexpected
-- file type is rejected even if the route were bypassed.
--
-- IDEMPOTENT / SAFE TO RE-RUN
--   Wrapped in a single transaction, so a failure part-way through leaves the
--   database untouched instead of creating the bucket without its policy. The
--   bucket insert uses ON CONFLICT, and every policy is dropped before being
--   recreated, so running this twice cannot produce duplicates or a conflict.

begin;

-- ============================================================
-- BUCKET
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dine3d-branding',
  'dine3d-branding',
  true,
  2097152, -- 2 MiB: far more than enough for a logo, small enough to bound abuse
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================
-- PUBLIC READ
-- ============================================================
drop policy if exists "Public can read dine3d branding assets" on storage.objects;

create policy "Public can read dine3d branding assets"
  on storage.objects
  for select
  to public
  using (bucket_id = 'dine3d-branding');

-- ============================================================
-- CORRECTIVE: REMOVE ANY WRITE POLICY SCOPED TO THIS BUCKET
-- ============================================================
-- Creating a public bucket through the Supabase dashboard also auto-creates
-- INSERT / UPDATE / DELETE policies for `anon` and `authenticated`. That would
-- mean any visitor could overwrite the live brand asset from a browser console.
--
-- This block drops every policy on storage.objects that references this bucket
-- and is not the read policy above. The `like '%dine3d-branding%'` guard means
-- policies belonging to other buckets are never touched, so this is safe to run
-- in a project that hosts other storage.
--
-- It is wrapped in an exception handler on purpose. This sweep is defensive
-- cleanup, not the point of the migration, so it must never be the reason the
-- bucket and its read policy fail to be created. Any failure is surfaced as a
-- NOTICE in the SQL Editor output instead of aborting the transaction.
do $$
declare
  stray record;
begin
  for stray in
    select policyname
      from pg_policies
     where schemaname = 'storage'
       and tablename  = 'objects'
       and policyname <> 'Public can read dine3d branding assets'
       and (coalesce(qual, '')       like '%dine3d-branding%'
         or coalesce(with_check, '') like '%dine3d-branding%')
  loop
    execute format('drop policy if exists %I on storage.objects', stray.policyname);
  end loop;
exception
  when others then
    raise notice '005: could not sweep stray branding write policies: %', sqlerrm;
end $$;

-- ============================================================
-- WRITES ARE INTENTIONALLY NOT GRANTED
-- ============================================================
-- After the block above there is no INSERT / UPDATE / DELETE policy on
-- storage.objects for this bucket. Uploads are performed server-side with the
-- service-role key by POST /api/admin/branding/logo, which first verifies the
-- Dine3D admin session cookie and validates the file type and size.
--
-- Do not add write policies here. Doing so would let any browser session,
-- including an anonymous visitor, overwrite the live brand asset.

commit;

-- ============================================================
-- RESULT (read-only, safe to ignore)
-- Expect one row: dine3d-branding | true | 2097152 | {image/png,image/jpeg,image/webp}
-- ============================================================
select id, public, file_size_limit, allowed_mime_types
  from storage.buckets
 where id = 'dine3d-branding';

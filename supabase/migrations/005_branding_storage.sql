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
-- WRITES ARE INTENTIONALLY NOT GRANTED
-- ============================================================
-- There is no INSERT / UPDATE / DELETE policy on storage.objects for this
-- bucket. Uploads are performed server-side with the service-role key by
-- POST /api/admin/branding/logo, which first verifies the Dine3D admin
-- session cookie and validates the file type and size.
--
-- Do not add write policies here. Doing so would let any browser session,
-- including an anonymous visitor, overwrite the live brand asset.
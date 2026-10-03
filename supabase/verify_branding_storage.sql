-- supabase/verify_branding_storage.sql
--
-- Read-only verification for the Dine3D branding logo storage.
-- Run this in the Supabase SQL Editor AFTER applying, in order:
--   1) supabase/migrations/004_admin_site_content.sql
--   2) supabase/migrations/005_branding_storage.sql
--
-- Every query is SELECT only. Run the whole file as-is; each result tells you
-- whether the logo upload feature can work.
--
-- WHAT "GOOD" LOOKS LIKE
--   (1) one row: dine3d-branding | public = true | 2097152 | the three MIME types
--   (2) exactly one policy, read-only, for this bucket
--   (3) zero rows  <- this is the security invariant
--   (4) one row: site_content
--   (5) one row: the singleton content row the logo reference is stored in

-- (1) Does the bucket exist, is it public, and are its limits correct?
--     The application uploads PNG / JPG / WebP up to 2 MiB. If `public` is
--     false the logo will not load for visitors.
select id, public, file_size_limit, allowed_mime_types
  from storage.buckets
 where id = 'dine3d-branding';

-- (2) The policies that apply to this bucket. Expect exactly one row:
--     "Public can read dine3d branding assets" | SELECT | {public}
select policyname, cmd, roles
  from pg_policies
 where schemaname = 'storage'
   and tablename  = 'objects'
   and coalesce(qual, '') like '%dine3d-branding%'
 order by policyname;

-- (3) Write policies on this bucket. MUST return zero rows.
--     Any row here means a browser could overwrite the live logo.
select policyname, cmd, roles
  from pg_policies
 where schemaname = 'storage'
   and tablename  = 'objects'
   and cmd <> 'SELECT'
   and coalesce(qual, '') like '%dine3d-branding%'
 order by policyname;

-- (4) The table holding the logo reference (branding.logoUrl).
select table_name
  from information_schema.tables
 where table_schema = 'public'
   and table_name = 'site_content';

-- (5) The singleton row itself. branding->>'logoUrl' is the current logo
--     reference: either the bundled '/images/dine3d-logo.jpg' fallback or a
--     Supabase Storage public URL.
select id,
       branding ->> 'logoUrl'   as logo_url,
       branding ->> 'logoWidth'  as logo_width,
       branding ->> 'logoHeight' as logo_height,
       updated_at
  from public.site_content
 where id = 'main';

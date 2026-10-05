-- supabase/migrations/006_food_model_storage.sql
--
-- Dine3D hero 3D food model storage.
--
-- REQUIRES 004_admin_site_content.sql to be applied first: the model reference
-- is stored inside the existing singleton `site_content` row (id = 'main') in
-- its `hero.modelUrlGlb` field. No new settings table is created here, so there
-- is exactly one hero record and replacing the dish updates it in place rather
-- than inserting duplicate rows.
--
-- REQUIRES 005_branding_storage.sql only in the sense that this file follows the
-- same shape; the two buckets are independent and neither depends on the other.
--
-- Only ONE new object is created: the storage bucket. No existing table, column,
-- policy or restaurant table is modified.
--
-- ACCESS MODEL
--   PUBLIC READ   - every landing page visitor must be able to download the
--                   model before the hero becomes interactive, so the bucket is
--                   public and a SELECT policy is granted to `public`.
--   NO PUBLIC WRITE - there is deliberately NO insert / update / delete policy
--                   for `anon` or `authenticated`. With RLS enabled on
--                   storage.objects and no write policy, the browser cannot
--                   upload anything. Writes only happen through a server route
--                   holding the service-role key, after an admin session check.
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
  'dine3d-models',
  'dine3d-models',
  true,
  -- 25 MiB, matching MAX_MODEL_BYTES in lib/foodModel.ts. See the comment there
  -- for why the hero model is held to a much tighter budget than a logo: it is
  -- the heaviest asset every visitor downloads before the page is interactive.
  26214400,
  -- `model/gltf-binary` is the IANA-registered type for a .glb file. Browsers
  -- usually send `application/octet-stream` for it, and Supabase Storage stores
  -- whatever content type it is given, so the upload route sends the correct type
  -- explicitly rather than trusting the browser.
  array['model/gltf-binary']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================
-- PUBLIC READ
-- ============================================================
drop policy if exists "Public can read dine3d food models" on storage.objects;

create policy "Public can read dine3d food models"
  on storage.objects
  for select
  to public
  using (bucket_id = 'dine3d-models');

-- ============================================================
-- CORRECTIVE: REMOVE ANY WRITE POLICY SCOPED TO THIS BUCKET
-- ============================================================
-- Creating a public bucket through the Supabase dashboard also auto-creates
-- INSERT / UPDATE / DELETE policies for `anon` and `authenticated`. That would
-- mean any visitor could overwrite the live hero model from a browser console.
--
-- This block drops every policy on storage.objects that references this bucket
-- and is not the read policy above. The `like '%dine3d-models%'` guard means
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
       and policyname <> 'Public can read dine3d food models'
       and (coalesce(qual, '')       like '%dine3d-models%'
         or coalesce(with_check, '') like '%dine3d-models%')
  loop
    execute format('drop policy if exists %I on storage.objects', stray.policyname);
  end loop;
exception
  when others then
    raise notice '006: could not sweep stray food model write policies: %', sqlerrm;
end $$;

-- ============================================================
-- WRITES ARE INTENTIONALLY NOT GRANTED
-- ============================================================
-- After the block above there is no INSERT / UPDATE / DELETE policy on
-- storage.objects for this bucket. Uploads are performed server-side with the
-- service-role key by POST /api/admin/hero-model, which first verifies the
-- Dine3D admin session cookie and validates the GLB header, version and length.
--
-- Do not add write policies here. Doing so would let any browser session,
-- including an anonymous visitor, replace the model shown on the landing page.

commit;

-- ============================================================
-- RESULT (read-only, safe to ignore)
-- Expect one row: dine3d-models | true | 26214400 | {model/gltf-binary}
-- ============================================================
select id, public, file_size_limit, allowed_mime_types
  from storage.buckets
 where id = 'dine3d-models';

-- The stored hero model reference, or a NULL url when none has been uploaded.
-- hero is a key inside the draft JSONB column, NOT a top-level column.
select id,
       draft -> 'hero' ->> 'modelUrlGlb' as model_url_glb,
       draft -> 'hero' ->> 'modelName'   as model_name,
       updated_at
  from public.site_content
 where id = 'main';

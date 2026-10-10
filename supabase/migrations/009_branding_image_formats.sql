-- supabase/migrations/009_branding_image_formats.sql
--
-- Expands the `dine3d-branding` storage bucket to accept all common image
-- formats for hero background images, and raises the per-file size ceiling so a
-- landscape hero photo has headroom without becoming abusive.
--
-- REQUIRES 005_branding_storage.sql: this only alters the bucket row that
-- migration creates. No new tables, columns or buckets are added here.
--
-- The bucket is shared between two uses:
--   1. the site logo (PNG / JPG / WebP only, <= 2 MiB)
--   2. the hero background image (all image formats, <= 5 MiB)
--
-- Allowing every image type on the bucket is safe because the upload routes
-- enforce their own narrower `sniffImageMime` check: the logo route (005) still
-- rejects anything but PNG/JPG/WebP in its route handler, and this migration
-- does not change that. Only the hero-image route opts in to the broad set.
--
-- IDEMPOTENT / SAFE TO RE-RUN
--   A single ON CONFLICT UPDATE. Running it twice produces no error and no
--   duplicate.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dine3d-branding',
  'dine3d-branding',
  true,
  5242880, -- 5 MiB: generous for a hero photo, still bounded
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    'image/avif',
    'image/heic',
    'image/heif',
    'image/apng',
    'image/x-icon',
    'image/vnd.microsoft.icon'
  ]
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

commit;

-- RESULT (read-only, safe to ignore)
-- One row: dine3d-branding | true | 5242880 | {13 image types}
select id, public, file_size_limit, allowed_mime_types
  from storage.buckets
 where id = 'dine3d-branding';

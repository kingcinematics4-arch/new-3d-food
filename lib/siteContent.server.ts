// lib/siteContent.server.ts
//
// SERVER ONLY. Persistence for the public Dine3D website content.
//
// NEVER import this from a client component: it reaches for the Supabase
// service-role key, which bypasses RLS and must never enter a browser bundle.
//
// The `site_content` table carries no policies under RLS, so this module is the
// only way the document can be read or written. It is entirely separate from
// every restaurant table.

import { supabaseAdmin, assertSupabaseAdminConfigured } from './supabaseAdmin';
import { DEFAULT_SITE_CONTENT, normalizeSiteContent, type SiteContent } from './siteContent';

const SITE_CONTENT_ID = 'main';

export interface SiteContentRecord {
  draft: SiteContent;
  published: SiteContent;
  updatedAt: string | null;
  publishedAt: string | null;
  /** False when no publish has ever happened, so the live site is using defaults. */
  hasEverPublished: boolean;
}

async function fetchRow(): Promise<{
  draft: unknown;
  published: unknown;
  updated_at: string | null;
  published_at: string | null;
} | null> {
  assertSupabaseAdminConfigured();

  const { data, error } = await supabaseAdmin
    .from('site_content')
    .select('draft, published, updated_at, published_at')
    .eq('id', SITE_CONTENT_ID)
    .maybeSingle();

  if (error) throw error;
  return (data as any) ?? null;
}

/**
 * The document the public website renders.
 *
 * Falls back to the shipped defaults when Supabase is not configured, the
 * migration has not been applied yet, or no publish has happened. The public
 * site therefore keeps working regardless of the admin panel's state.
 */
export async function getPublishedSiteContent(): Promise<SiteContent> {
  try {
    const row = await fetchRow();
    if (!row) return DEFAULT_SITE_CONTENT;

    const published = row.published;
    const isEmpty =
      !published ||
      (typeof published === 'object' &&
        published !== null &&
        Object.keys(published as Record<string, unknown>).length === 0);

    if (isEmpty) return DEFAULT_SITE_CONTENT;

    return normalizeSiteContent(published);
  } catch {
    // Never let a storage problem take the public website down.
    return DEFAULT_SITE_CONTENT;
  }
}

/** Full document plus publishing metadata. Used by the admin overview. */
export async function getSiteContentRecord(): Promise<SiteContentRecord> {
  const row = await fetchRow();

  if (!row) {
    return {
      draft: DEFAULT_SITE_CONTENT,
      published: DEFAULT_SITE_CONTENT,
      updatedAt: null,
      publishedAt: null,
      hasEverPublished: false,
    };
  }

  const published = row.published;
  const isEmpty =
    !published ||
    (typeof published === 'object' &&
      published !== null &&
      Object.keys(published as Record<string, unknown>).length === 0);

  return {
    draft: normalizeSiteContent(row.draft),
    published: isEmpty ? DEFAULT_SITE_CONTENT : normalizeSiteContent(published),
    updatedAt: row.updated_at ?? null,
    publishedAt: row.published_at ?? null,
    hasEverPublished: !isEmpty,
  };
}

/**
 * Writes the working copy. Publishing is a separate, explicit action, so
 * nothing an owner types becomes public by accident.
 */
export async function saveSiteContentDraft(content: SiteContent): Promise<{ updatedAt: string }> {
  assertSupabaseAdminConfigured();

  const { data, error } = await supabaseAdmin
    .from('site_content')
    .upsert(
      { id: SITE_CONTENT_ID, draft: content, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
    .select('updated_at')
    .single();

  if (error) throw error;
  return { updatedAt: (data as any)?.updated_at ?? new Date().toISOString() };
}

/**
 * Promotes the current draft to the live document in a single update, so the
 * public site never observes a half-published state.
 */
export async function publishSiteContentDraft(): Promise<{ publishedAt: string }> {
  assertSupabaseAdminConfigured();

  const now = new Date().toISOString();

  // Read the row first so an unpublished site still publishes the current draft
  // (the shipped defaults) rather than an empty object.
  const row = await fetchRow();
  const draft = row?.draft && Object.keys(row.draft as Record<string, unknown>).length > 0
    ? row.draft
    : DEFAULT_SITE_CONTENT;

  const { data, error } = await supabaseAdmin
    .from('site_content')
    .upsert(
      { id: SITE_CONTENT_ID, draft, published: draft, published_at: now, updated_at: now },
      { onConflict: 'id' }
    )
    .select('published_at')
    .single();

  if (error) throw error;
  return { publishedAt: (data as any)?.published_at ?? now };
}
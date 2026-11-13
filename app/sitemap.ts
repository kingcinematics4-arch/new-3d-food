import type { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCanonicalSiteUrl } from '@/lib/siteUrl';
import { getSiteContentRecord } from '@/lib/siteContent.server';

// Read fresh on every request so a newly activated hotel is included and a
// deactivated one disappears without a redeploy.
export const dynamic = 'force-dynamic';

interface HotelRow {
  slug: string | null;
  updated_at: string | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getCanonicalSiteUrl();
  const entries: MetadataRoute.Sitemap = [];

  // Homepage. Prefer the published-content timestamp when available.
  let homeLastModified: Date | undefined;
  try {
    const record = await getSiteContentRecord();
    if (record.publishedAt) homeLastModified = new Date(record.publishedAt);
  } catch {
    // The sitemap must still work if site_content is unavailable.
  }

  entries.push({
    url: base,
    lastModified: homeLastModified,
    changeFrequency: 'weekly',
    priority: 1,
  });

  // Static public pages. These routes exist and are indexable; About and
  // Contact may also be published as homepage sections, but their standalone
  // canonical URLs are the ones Google should index.
  const legalLastModified = new Date('2026-11-13T00:00:00.000Z');
  const staticPages: Array<{
    path: string;
    changeFrequency: 'weekly' | 'monthly' | 'yearly';
    priority: number;
    lastModified?: Date;
  }> = [
    { path: '/about', changeFrequency: 'monthly', priority: 0.7, lastModified: homeLastModified },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.7, lastModified: homeLastModified },
    { path: '/features', changeFrequency: 'monthly', priority: 0.8, lastModified: legalLastModified },
    { path: '/qr-ordering-system', changeFrequency: 'monthly', priority: 0.9, lastModified: legalLastModified },
    { path: '/restaurant-qr-menu', changeFrequency: 'monthly', priority: 0.8, lastModified: legalLastModified },
    { path: '/digital-menu-for-restaurants', changeFrequency: 'monthly', priority: 0.8, lastModified: legalLastModified },
    { path: '/qr-ordering-system-thane', changeFrequency: 'monthly', priority: 0.7, lastModified: legalLastModified },
    { path: '/qr-ordering-system-navi-mumbai', changeFrequency: 'monthly', priority: 0.7, lastModified: legalLastModified },
    { path: '/qr-ordering-system-mumbai', changeFrequency: 'monthly', priority: 0.7, lastModified: legalLastModified },
    { path: '/restaurant-management-software', changeFrequency: 'monthly', priority: 0.8, lastModified: legalLastModified },
    { path: '/blog', changeFrequency: 'weekly', priority: 0.6, lastModified: legalLastModified },
    { path: '/blog/qr-ordering-system-guide', changeFrequency: 'monthly', priority: 0.6, lastModified: legalLastModified },
    { path: '/blog/digital-menu-for-restaurants', changeFrequency: 'monthly', priority: 0.6, lastModified: legalLastModified },
    { path: '/blog/restaurant-automation-software', changeFrequency: 'monthly', priority: 0.6, lastModified: legalLastModified },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3, lastModified: legalLastModified },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3, lastModified: legalLastModified },
  ];

  for (const page of staticPages) {
    entries.push({
      url: `${base}${page.path}`,
      lastModified: page.lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  }

  // Public hotel landing pages. Only active hotels with a safe, non-empty
  // public slug are eligible. The sitemap deliberately exposes nothing but the
  // public URL and the hotel's own updated_at timestamp.
  try {
    const { data, error } = await supabaseAdmin
      .from('hotels')
      .select('slug, updated_at')
      .eq('is_active', true)
      .not('slug', 'is', null);

    if (error) {
      console.error('[sitemap] hotel lookup failed:', error.message);
    } else if (Array.isArray(data)) {
      const seen = new Set<string>();
      for (const hotel of data as HotelRow[]) {
        const slug = typeof hotel.slug === 'string' ? hotel.slug.trim() : '';
        if (!slug || seen.has(slug)) continue;
        // Keep the URL path safe even if a legacy row contains punctuation.
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) continue;
        seen.add(slug);
        entries.push({
          url: `${base}/menu/${encodeURIComponent(slug)}`,
          lastModified: hotel.updated_at ? new Date(hotel.updated_at) : undefined,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  } catch (err: any) {
    console.error('[sitemap] hotel lookup threw:', err?.message || err);
  }

  return entries;
}
import type { MetadataRoute } from 'next';
import { getCanonicalSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const base = getCanonicalSiteUrl();

  const privatePaths = [
    '/admin',
    '/dashboard',
    '/login',
    '/signup',
    '/profile',
    '/your-orders',
    '/order/',
    '/order-status/',
    '/api/',
    '/auth/',
  ];

  return {
    rules: [
      // Search and discovery crawlers. These are allowed to read public pages.
      {
        userAgent: [
          'OAI-SearchBot',
          'ChatGPT-User',
          'Googlebot',
          'Bingbot',
          'PerplexityBot',
          'Perplexity-User',
          'Claude-User',
          'Applebot',
        ],
        allow: '/',
        disallow: privatePaths,
      },
      // Model-training crawlers. These are not needed for search discovery and
      // are not permitted to read the site for training purposes.
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended', 'Applebot-Extended'],
        disallow: '/',
      },
      // All other crawlers follow the same public/private split.
      {
        userAgent: '*',
        allow: '/',
        disallow: privatePaths,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
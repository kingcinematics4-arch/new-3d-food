// app/api/branding/route.ts
//
// Public, unauthenticated read of the Dine3D logo reference.
//
// The logo must render on the marketing site, on login/signup and inside the
// dashboard, none of which are behind the admin session. Rather than letting
// each of those pages reach for the service-role client, they all read the
// small cacheable payload served from here.
//
// The endpoint exposes only a public asset URL and a cache token. It never
// returns the draft document, any database detail, or anything from the
// service-role environment.

import { NextResponse } from 'next/server';
import { getLogoReference, FALLBACK_LOGO_URL } from '@/lib/branding.server';

export const runtime = 'nodejs';

/**
 * Rechecked at the edge every 30 seconds, and may be served stale for up to 10
 * minutes while an edge node refreshes in the background. Long enough to keep
 * the logo off the origin on every request, short enough that a replaced logo
 * reaches visitors quickly.
 *
 * The admin panel fetches this with `cache: 'no-store'`, so an owner always
 * sees the new logo immediately after saving, without waiting for the CDN.
 */
const CACHE_CONTROL = 'public, max-age=0, s-maxage=30, stale-while-revalidate=600';

function buildEtag(version: string | null, logoUrl: string): string {
  return `W/"dine3d-logo-${version ?? logoUrl}"`;
}

export async function GET(request: Request) {
  const logo = await getLogoReference();

  // `getLogoReference` never throws, so this endpoint always answers 200.
  // A broken or unapplied database degrades to the bundled asset instead of
  // taking down every page that shows the logo.
  const response = NextResponse.json(
    {
      success: true,
      logoUrl: logo.logoUrl,
      logoVersion: logo.logoVersion,
      logoAlt: logo.logoAlt,
      logoWidth: logo.logoWidth,
      logoHeight: logo.logoHeight,
      hasCustomLogo: logo.hasCustomLogo,
      fallbackLogoUrl: FALLBACK_LOGO_URL,
    },
    { headers: { 'Cache-Control': CACHE_CONTROL } }
  );

  const etag = buildEtag(logo.logoVersion, logo.logoUrl);
  response.headers.set('ETag', etag);

  if (request.headers.get('if-none-match') === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: { 'Cache-Control': CACHE_CONTROL, ETag: etag },
    });
  }

  return response;
}
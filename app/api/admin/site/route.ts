// app/api/admin/site/route.ts
//
// Reads and writes the Dine3D website content document.
//
// Authorization is enforced on EVERY method with `requireAdminApi`, so no
// unauthenticated caller can read the draft or write to the database even if it
// guesses the URL.

import { NextResponse } from 'next/server';
import { siteContentSchema } from '@/lib/siteContent';
import { getSiteContentRecord, saveSiteContentDraft } from '@/lib/siteContent.server';
import { requireAdminApi } from '@/lib/adminApiGuard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const record = await getSiteContentRecord();

    return NextResponse.json({
      success: true,
      draft: record.draft,
      published: record.published,
      updatedAt: record.updatedAt,
      publishedAt: record.publishedAt,
      hasEverPublished: record.hasEverPublished,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load site content.';
    const isConfigError = /configuration error/i.test(message);

    return NextResponse.json(
      { success: false, error: isConfigError ? message : 'Could not load site content. Has migration 004 been applied?' },
      { status: isConfigError ? 503 : 500 }
    );
  }
}

/**
 * Saves the working copy only.
 *
 * Publishing is deliberately a separate endpoint so that nothing the owner types
 * becomes public the moment it is typed.
 */
export async function PUT(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let parsed;
  try {
    const body = await request.json();
    parsed = siteContentSchema.parse(body);
  } catch (error) {
    const message =
      error instanceof Error && 'issues' in error
        ? `Validation failed: ${(error as any).issues?.[0]?.message ?? 'invalid content'}`
        : 'Invalid site content.';

    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  try {
    const { updatedAt } = await saveSiteContentDraft(parsed);
    return NextResponse.json({ success: true, updatedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save the draft.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
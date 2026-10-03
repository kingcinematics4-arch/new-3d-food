// app/api/admin/site/publish/route.ts
//
// Promotes the saved draft to the live public website.
//
// Separate from the draft endpoint by design: the owner can work for as long as
// they like and the public site only changes when they explicitly publish.

import { NextResponse } from 'next/server';
import { publishSiteContentDraft } from '@/lib/siteContent.server';
import { requireAdminApi } from '@/lib/adminApiGuard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const { publishedAt } = await publishSiteContentDraft();
    return NextResponse.json({ success: true, publishedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to publish changes.';
    const isConfigError = /configuration error/i.test(message);

    return NextResponse.json(
      { success: false, error: isConfigError ? message : 'Could not publish. Has migration 004 been applied?' },
      { status: isConfigError ? 503 : 500 }
    );
  }
}
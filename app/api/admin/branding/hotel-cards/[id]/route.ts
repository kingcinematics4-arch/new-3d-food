// app/api/admin/branding/hotel-cards/[id]/route.ts
import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/adminApiGuard';
import { updateTemplate, setActiveTemplate, deleteTemplate } from '@/lib/hotelCardTemplate.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const fail = (m: string, s: number) => NextResponse.json({ success: false, error: m }, { status: s, headers: NO_STORE });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdminApi(); if (denied) return denied;
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === 'activate') return NextResponse.json({ success: true, template: await setActiveTemplate(params.id) }, { headers: NO_STORE });
    const template = await updateTemplate(params.id, { name: body.name, field_layout: body.field_layout, width: body.width, height: body.height });
    return NextResponse.json({ success: true, template }, { headers: NO_STORE });
  } catch (e: any) { return fail(e?.message || 'Update failed.', 500); }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdminApi(); if (denied) return denied;
  try { return NextResponse.json({ success: true, ...(await deleteTemplate(params.id)) }, { headers: NO_STORE }); }
  catch (e: any) { return fail(e?.message || 'Delete failed.', 500); }
}

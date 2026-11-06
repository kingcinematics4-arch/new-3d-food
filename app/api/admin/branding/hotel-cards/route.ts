// app/api/admin/branding/hotel-cards/route.ts
import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/adminApiGuard';
import {
  listTemplates, uploadTemplateImage, createTemplate,
  sniffHotelCardMime, MAX_HOTEL_CARD_BYTES, ACCEPTED_HOTEL_CARD_LABEL,
} from '@/lib/hotelCardTemplate.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const fail = (m: string, s: number) => NextResponse.json({ success: false, error: m }, { status: s, headers: NO_STORE });

export async function GET() {
  const denied = await requireAdminApi(); if (denied) return denied;
  try {
    return NextResponse.json({ success: true, templates: await listTemplates() }, { headers: NO_STORE });
  } catch (e: any) {
    const msg = e?.message || 'Failed to load templates.';
    const missing = /hotel_card_templates|relation .* does not exist|42P01/i.test(msg);
    return fail(missing ? 'Hotel card templates table is missing. Apply migration 023_hotel_card_templates.sql in Supabase SQL Editor.' : msg, missing ? 503 : 500);
  }
}

export async function POST(request: Request) {
  const denied = await requireAdminApi(); if (denied) return denied;
  try {
    const ct = request.headers.get('content-type') || '';
    if (!ct.toLowerCase().includes('multipart/form-data')) return fail('Send multipart/form-data with a file field.', 415);
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') return fail(`No file received. Upload ${ACCEPTED_HOTEL_CARD_LABEL}.`, 400);
    const f = file as File;
    if (!f.size) return fail('That file is empty.', 400);
    if (f.size > MAX_HOTEL_CARD_BYTES) return fail(`Image is too large (max ${MAX_HOTEL_CARD_BYTES/(1024*1024)} MB).`, 413);
    const buffer = Buffer.from(await f.arrayBuffer());
    const mime = sniffHotelCardMime(buffer);
    if (!mime) return fail(`Unsupported image. Use ${ACCEPTED_HOTEL_CARD_LABEL}.`, 415);
    const width = Number(form.get('width')); const height = Number(form.get('height'));
    const name = typeof form.get('name') === 'string' ? String(form.get('name')) : f.name.replace(/\.[^.]+$/, '');
    const stored = await uploadTemplateImage(buffer, mime, { width, height });
    const template = await createTemplate({ ...stored, name, is_active: false });
    return NextResponse.json({ success: true, template }, { headers: NO_STORE });
  } catch (e: any) {
    return fail(e?.message || 'Upload failed.', /bucket|migration 023|hotel_card_templates/i.test(e?.message||'') ? 503 : 500);
  }
}

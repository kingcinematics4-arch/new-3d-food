// lib/hotelCardTemplate.server.ts
// SERVER ONLY. Storage + DB for hotel card templates. Uses existing
// `dine3d-branding` bucket (005/009) with `hotel-card-` object prefix.
// Service-role only; never import from client components.

import { supabaseAdmin, assertSupabaseAdminConfigured } from './supabaseAdmin';
import {
  HOTEL_CARD_BUCKET, HOTEL_CARD_PREFIX, HOTEL_CARD_MIME_TYPES,
  MAX_HOTEL_CARD_BYTES, ACCEPTED_HOTEL_CARD_LABEL,
  mergeFieldLayout, isManagedHotelCardUrl,
  type HotelCardTemplate, type HotelCardMimeType, type FieldLayout,
} from './hotelCardTemplate';

export { isManagedHotelCardUrl, mergeFieldLayout };
export type { HotelCardTemplate, FieldLayout };

const EXT: Record<HotelCardMimeType, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' };

function rowToTemplate(r: any): HotelCardTemplate {
  return {
    id: r.id, name: r.name || '', image_url: r.image_url, storage_path: r.storage_path ?? null,
    width: Number(r.width) > 0 ? Number(r.width) : 1200,
    height: Number(r.height) > 0 ? Number(r.height) : 667,
    field_layout: mergeFieldLayout(r.field_layout),
    is_active: !!r.is_active,
    created_at: r.created_at, updated_at: r.updated_at,
  };
}

export function sniffHotelCardMime(buffer: Buffer): HotelCardMimeType | null {
  if (buffer.length < 12) return null;
  const png = [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a];
  if (png.every((b,i)=>buffer[i]===b)) return 'image/png';
  if (buffer[0]===0xff && buffer[1]===0xd8 && buffer[2]===0xff) return 'image/jpeg';
  if (buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP') return 'image/webp';
  const head = buffer.toString('utf8',0,Math.min(512,buffer.length)).trim();
  if (/^<(\?xml|svg[\s>\/])/i.test(head)) return 'image/svg+xml';
  return null;
}

export async function listTemplates(): Promise<HotelCardTemplate[]> {
  assertSupabaseAdminConfigured();
  const { data, error } = await supabaseAdmin.from('hotel_card_templates').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToTemplate);
}

export async function getActiveTemplate(): Promise<HotelCardTemplate | null> {
  try {
    assertSupabaseAdminConfigured();
    const { data, error } = await supabaseAdmin.from('hotel_card_templates').select('*').eq('is_active', true).limit(1).maybeSingle();
    if (error) return null;
    return data ? rowToTemplate(data) : null;
  } catch { return null; }
}

export async function uploadTemplateImage(buffer: Buffer, mime: HotelCardMimeType, dims?: { width?: number; height?: number }) {
  assertSupabaseAdminConfigured();
  if (buffer.length > MAX_HOTEL_CARD_BYTES) throw new Error(`Image exceeds ${MAX_HOTEL_CARD_BYTES / (1024*1024)} MB.`);
  const id = `hct-${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`;
  const objectPath = `${HOTEL_CARD_PREFIX}${id}.${EXT[mime]}`;
  const { error } = await supabaseAdmin.storage.from(HOTEL_CARD_BUCKET).upload(objectPath, buffer, { contentType: mime, upsert: false, cacheControl: '31536000' });
  if (error) {
    if (/bucket not found|not found.*bucket/i.test(error.message)) {
      throw new Error(`Storage bucket "${HOTEL_CARD_BUCKET}" is missing. Apply migrations 005 and 009 in Supabase SQL Editor.`);
    }
    throw new Error(`Upload failed: ${error.message}`);
  }
  const { data } = supabaseAdmin.storage.from(HOTEL_CARD_BUCKET).getPublicUrl(objectPath);
  return {
    id, objectPath, image_url: data.publicUrl,
    width: Number(dims?.width) > 0 ? Math.round(Number(dims?.width)) : 1200,
    height: Number(dims?.height) > 0 ? Math.round(Number(dims?.height)) : 667,
  };
}

export async function createTemplate(input: { id: string; name: string; image_url: string; storage_path?: string | null; width: number; height: number; field_layout?: FieldLayout; is_active?: boolean }) {
  assertSupabaseAdminConfigured();
  const { data, error } = await supabaseAdmin.from('hotel_card_templates').insert({
    id: input.id, name: (input.name || '').slice(0, 120),
    image_url: input.image_url, storage_path: input.storage_path ?? null,
    width: input.width, height: input.height,
    field_layout: mergeFieldLayout(input.field_layout),
    is_active: !!input.is_active,
  }).select('*').single();
  if (error) throw error;
  if (input.is_active) await setActiveTemplate(input.id);
  return rowToTemplate(data);
}

export async function updateTemplate(id: string, patch: { name?: string; field_layout?: FieldLayout; width?: number; height?: number }) {
  assertSupabaseAdminConfigured();
  const body: any = {};
  if (typeof patch.name === 'string') body.name = patch.name.slice(0,120);
  if (patch.field_layout) body.field_layout = mergeFieldLayout(patch.field_layout);
  if (Number(patch.width) > 0) body.width = Math.round(Number(patch.width));
  if (Number(patch.height) > 0) body.height = Math.round(Number(patch.height));
  const { data, error } = await supabaseAdmin.from('hotel_card_templates').update(body).eq('id', id).select('*').single();
  if (error) throw error;
  return rowToTemplate(data);
}

export async function setActiveTemplate(id: string) {
  assertSupabaseAdminConfigured();
  // clear all, then set target (avoids partial-unique race in two statements but safe)
  const { error: e1 } = await supabaseAdmin.from('hotel_card_templates').update({ is_active: false }).neq('id', id);
  if (e1) throw e1;
  const { data, error } = await supabaseAdmin.from('hotel_card_templates').update({ is_active: true }).eq('id', id).select('*').single();
  if (error) throw error;
  return rowToTemplate(data);
}

export async function deleteTemplate(id: string) {
  assertSupabaseAdminConfigured();
  const { data: row } = await supabaseAdmin.from('hotel_card_templates').select('storage_path,image_url,is_active').eq('id', id).maybeSingle();
  const { error } = await supabaseAdmin.from('hotel_card_templates').delete().eq('id', id);
  if (error) throw error;
  const path = (row as any)?.storage_path || managedPath((row as any)?.image_url);
  if (path) { try { await supabaseAdmin.storage.from(HOTEL_CARD_BUCKET).remove([path]); } catch {} }
  return { deleted: true, wasActive: !!(row as any)?.is_active };
}

function managedPath(url?: string | null): string | null {
  if (!url || !isManagedHotelCardUrl(url)) return null;
  try {
    const marker = `/storage/v1/object/public/${HOTEL_CARD_BUCKET}/`;
    return decodeURIComponent(new URL(url).pathname.split(marker)[1] || '') || null;
  } catch { return null; }
}

export { MAX_HOTEL_CARD_BYTES, ACCEPTED_HOTEL_CARD_LABEL };

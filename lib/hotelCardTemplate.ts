// lib/hotelCardTemplate.ts
// Shared, dependency-free types/constants for hotel identity card templates.
// Safe for client and server imports (no Supabase/server-only).

import { formatBytes } from './branding';
export { formatBytes };

export const HOTEL_CARD_BUCKET = 'dine3d-branding';
export const HOTEL_CARD_PREFIX = 'hotel-card-';
export const MAX_HOTEL_CARD_BYTES = 8 * 1024 * 1024; // 8 MiB (landscape card art)

export const HOTEL_CARD_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
] as const;
export type HotelCardMimeType = (typeof HOTEL_CARD_MIME_TYPES)[number];
export const ACCEPTED_HOTEL_CARD_LABEL = 'PNG, JPG, WebP or SVG';
export const HOTEL_CARD_FILE_ACCEPT =
  '.png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml';

export type CardFieldKey =
  | 'hotelName'
  | 'hotelId'
  | 'owner'
  | 'email'
  | 'plan'
  | 'registered'
  | 'status';

export const CARD_FIELDS: { key: CardFieldKey; label: string }[] = [
  { key: 'hotelName', label: 'Hotel Name' },
  { key: 'hotelId', label: 'Hotel ID' },
  { key: 'owner', label: 'Owner' },
  { key: 'email', label: 'Contact Email' },
  { key: 'plan', label: 'Subscription Plan' },
  { key: 'registered', label: 'Registration Date' },
  { key: 'status', label: 'Account Status' },
];

// Position/size are percentages of the template canvas (0-100) for responsive scaling.
export interface FieldStyle {
  x: number;        // left %
  y: number;        // top %
  w: number;        // width %
  fontSize: number; // px at reference canvas (scaled on render)
  fontFamily: string;
  color: string;    // hex/rgba
  align: 'left' | 'center' | 'right';
  fontWeight: number;
  letterSpacing: number; // px at reference
  visible: boolean;
}

export type FieldLayout = Partial<Record<CardFieldKey, FieldStyle>>;

export interface HotelCardTemplate {
  id: string;
  name: string;
  image_url: string;
  storage_path?: string | null;
  width: number;
  height: number;
  field_layout: FieldLayout;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_FIELD_STYLE: Record<CardFieldKey, FieldStyle> = {
  hotelName:  { x: 50, y: 8, w: 46, fontSize: 44, fontFamily: 'var(--font-display), Georgia, serif', color: '#F5F2EB', align: 'right', fontWeight: 500, letterSpacing: 0.5, visible: true },
  hotelId:    { x: 50, y: 30, w: 24, fontSize: 18, fontFamily: 'Inter, system-ui, sans-serif', color: '#F5F2EB', align: 'left', fontWeight: 500, letterSpacing: 0, visible: true },
  owner:      { x: 50, y: 40, w: 24, fontSize: 18, fontFamily: 'Inter, system-ui, sans-serif', color: '#F5F2EB', align: 'left', fontWeight: 400, letterSpacing: 0, visible: true },
  email:      { x: 50, y: 72, w: 46, fontSize: 16, fontFamily: 'Inter, system-ui, sans-serif', color: '#F5F2EB', align: 'left', fontWeight: 400, letterSpacing: 0, visible: true },
  plan:       { x: 74, y: 30, w: 22, fontSize: 18, fontFamily: 'Inter, system-ui, sans-serif', color: '#F5F2EB', align: 'left', fontWeight: 500, letterSpacing: 0, visible: true },
  registered: { x: 74, y: 40, w: 22, fontSize: 18, fontFamily: 'Inter, system-ui, sans-serif', color: '#F5F2EB', align: 'left', fontWeight: 400, letterSpacing: 0, visible: true },
  status:     { x: 6,  y: 52, w: 20, fontSize: 14, fontFamily: 'Inter, system-ui, sans-serif', color: '#C5A46D', align: 'left', fontWeight: 600, letterSpacing: 2, visible: true },
};

export function mergeFieldLayout(layout: any): FieldLayout {
  const out: FieldLayout = {};
  for (const f of CARD_FIELDS) {
    const raw = layout && typeof layout === 'object' ? layout[f.key] : null;
    const d = DEFAULT_FIELD_STYLE[f.key];
    out[f.key] = {
      x: num(raw?.x, d.x), y: num(raw?.y, d.y), w: num(raw?.w, d.w),
      fontSize: num(raw?.fontSize, d.fontSize),
      fontFamily: typeof raw?.fontFamily === 'string' && raw.fontFamily.trim() ? raw.fontFamily : d.fontFamily,
      color: typeof raw?.color === 'string' && raw.color.trim() ? raw.color : d.color,
      align: raw?.align === 'center' || raw?.align === 'right' ? raw.align : 'left',
      fontWeight: num(raw?.fontWeight, d.fontWeight),
      letterSpacing: num(raw?.letterSpacing, d.letterSpacing),
      visible: typeof raw?.visible === 'boolean' ? raw.visible : d.visible,
    };
  }
  return out;
}
function num(v: any, fb: number) { const n = Number(v); return Number.isFinite(n) ? n : fb; }

export function isAcceptableHotelCardFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!file.size) return { ok: false, error: 'That file is empty.' };
  if (file.size > MAX_HOTEL_CARD_BYTES) return { ok: false, error: `That image is ${formatBytes(file.size)}. The maximum is ${formatBytes(MAX_HOTEL_CARD_BYTES)}.` };
  const t = (file.type || '').toLowerCase();
  if (t && !HOTEL_CARD_MIME_TYPES.includes(t as any) && !(t === '' && /\.svg$/i.test(file.name))) {
    return { ok: false, error: `Unsupported file type. Choose ${ACCEPTED_HOTEL_CARD_LABEL}.` };
  }
  return { ok: true };
}

export function isManagedHotelCardUrl(url: string | null | undefined): boolean {
  if (!url || url.startsWith('/')) return false;
  try {
    const p = new URL(url);
    const marker = `/storage/v1/object/public/${HOTEL_CARD_BUCKET}/`;
    if (!p.pathname.startsWith(marker)) return false;
    return decodeURIComponent(p.pathname.slice(marker.length)).startsWith(HOTEL_CARD_PREFIX);
  } catch { return false; }
}


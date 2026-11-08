'use client';

import React, { useMemo, useRef, useState, useEffect, type CSSProperties, type ReactNode } from 'react';
import {
  BADGE_STYLE_OPTIONS, BORDER_RADIUS_OPTIONS, BORDER_STYLE_OPTIONS, BUTTON_SIZE_OPTIONS, BUTTON_STYLE_OPTIONS,
  CARD_STYLE_OPTIONS, COLOR_PALETTES, DEFAULT_CUSTOM_THEME, FONT_CATALOG, FONT_CATEGORY_ORDER,
  MENU_LAYOUT_OPTIONS, SHADOW_OPTIONS, SPACING_OPTIONS,
  cloneCustomThemeConfig, normalizeCustomThemeConfig, normalizeHex,
  type CustomThemeConfig, type FontCategory,
} from '@/lib/customTheme';
import { CustomThemeFontLoader } from './CustomThemeFontLoader';
import CustomTemplate from './templates/CustomTemplate';
import type { PublicMenuItem, PublicHotel, PublicCategory } from '@/app/menu/[slug]/MenuContent';
import type { Hotel } from '@/lib/useHotel';

interface Props { hotel: Hotel; initialConfig?: CustomThemeConfig | null; onSaved?: (config: CustomThemeConfig) => void; onCancel?: () => void; editingThemeId?: string; initialThemeName?: string; embedded?: boolean }
const LABEL: CSSProperties = { display: 'block', marginBottom: 6, fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' };
const INPUT: CSSProperties = { width: '100%', minWidth: 0, borderRadius: 10, border: '1px solid var(--border-warm)', background: 'var(--bg-surface-2)', color: 'var(--text-primary)', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', outline: 'none' };
function Section({ number, title, children }: { number: string; title: string; children: ReactNode }) { return <section className="flex flex-col gap-4"><div className="flex items-baseline gap-2.5"><span style={{ fontSize:'0.625rem',fontWeight:700,letterSpacing:'0.12em',color:'var(--gold)' }}>{number}</span><h3 style={{ margin:0,fontSize:'0.875rem',fontWeight:600,color:'var(--text-primary)' }}>{title}</h3></div><div className="flex flex-col gap-4">{children}</div></section>; }
function Tile({ active,onClick,title,description }: { active:boolean; onClick:()=>void; title:string; description?:string }) { return <button type="button" onClick={onClick} style={{ textAlign:'left',borderRadius:10,border:`1px solid ${active ? 'var(--gold)' : 'var(--border-warm)'}`, background: active ? 'rgba(184,164,122,0.08)' : 'var(--bg-surface-2)',padding:'0.7rem 0.85rem',cursor:'pointer' }}><span style={{ display:'block',fontSize:'0.8125rem',fontWeight:600,color:'var(--text-primary)' }}>{title}</span>{description?<span style={{ display:'block',marginTop:2,fontSize:'0.6875rem',color:'var(--text-muted)',lineHeight:1.35 }}>{description}</span>:null}</button>; }
function hsvToRgb(h:number,s:number,v:number){const c=v*s,x=c*(1-Math.abs(((h/60)%2)-1)),m=v-c;let r=0,g=0,b=0;if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}return{r:Math.round((r+m)*255),g:Math.round((g+m)*255),b:Math.round((b+m)*255)};}
function rgbToHsv(r:number,g:number,b:number){const rn=r/255,gn=g/255,bn=b/255,max=Math.max(rn,gn,bn),min=Math.min(rn,gn,bn),d=max-min;let h=0;if(d){if(max===rn)h=((gn-bn)/d)%6;else if(max===gn)h=(bn-rn)/d+2;else h=(rn-gn)/d+4;h*=60;if(h<0)h+=360;}return{h,s:max?d/max:0,v:max};}
function hexToRgbObj(hex:string){const n=normalizeHex(hex,'#000000').slice(1);return{r:parseInt(n.slice(0,2),16),g:parseInt(n.slice(2,4),16),b:parseInt(n.slice(4,6),16)};}
function rgbToHexObj(r:number,g:number,b:number){const h=(v:number)=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0');return `#${h(r)}${h(g)}${h(b)}`;}
type ThemeColorKey = 'primaryColor' | 'pageBg' | 'cardBg' | 'textColor' | 'mutedTextColor';
const COLOR_PROPERTIES: { key: ThemeColorKey; label: string }[] = [
  { key: 'primaryColor', label: 'Primary / accent' },
  { key: 'pageBg', label: 'Page background' },
  { key: 'cardBg', label: 'Card background' },
  { key: 'textColor', label: 'Text color' },
  { key: 'mutedTextColor', label: 'Muted text' },
];
// Static shade palettes: 25 families × 24 shades each (600 selectable HEX values, subtle→vibrant→deep→very dark). Each shade keeps its own HEX value (never derived from/mutated by selection).
const COLOR_FAMILIES: { name: string; shades: string[] }[] = [
  { name: 'Red', shades: ['#fff5f5','#ffe3e3','#ffcccc','#ffb3b3','#ff9999','#ff8080','#ff6666','#ff4d4d','#ff3333','#f5222d','#e60023','#d90429','#cc0033','#b8002e','#a30029','#8c0023','#75001d','#5e0017','#470012','#33000d','#240009','#170006','#0d0003','#050001'] },
  { name: 'Orange', shades: ['#fff7ed','#ffedd5','#ffe0bd','#ffd1a1','#ffbf80','#ffad5e','#ff9933','#ff851a','#ff7700','#f76707','#e8590c','#d9480f','#c2410c','#ad3a0a','#993309','#852c07','#702506','#5c1f04','#471803','#331102','#240c01','#170801','#0d0500','#050200'] },
  { name: 'Yellow', shades: ['#fffde7','#fff9c4','#fff59d','#fff176','#ffee58','#ffeb3b','#ffe082','#ffd54f','#ffca28','#ffc107','#ffb300','#ffa000','#ff8f00','#ff6f00','#e65100','#cc4700','#b33d00','#993400','#802b00','#662200','#4d1900','#331100','#1f0a00','#0f0500'] },
  { name: 'Gold', shades: ['#fffef2','#fff8d6','#fff0b3','#ffe680','#ffdd57','#ffd633','#ffcc00','#f5c518','#e6b800','#d4a900','#c29600','#b08500','#9e7700','#8c6900','#7a5c00','#694f00','#574100','#453400','#332600','#241b00','#181200','#0f0b00','#080600','#030200'] },
  { name: 'Amber', shades: ['#fffbeb','#fef3c7','#fde68a','#fcd34d','#fbbf24','#f59e0b','#eab308','#d97706','#ca8a04','#b45309','#a16207','#92400e','#854d0e','#78350f','#6b2f0c','#5c280a','#4d2108','#3e1a06','#2f1405','#211003','#180b02','#100701','#080300','#030100'] },
  { name: 'Green', shades: ['#f0fff4','#dcffe4','#c1ffd0','#95f9b4','#68ed8e','#40d96c','#22c55e','#16a34a','#15803d','#166534','#14532d','#14532d','#166534','#15803d','#16a34a','#22c55e','#16a34a','#15803d','#166534','#14532d','#14532d','#052e16','#022c22','#021a14'] },
  { name: 'Lime', shades: ['#f7fee7','#ecfccb','#d9f99d','#bef264','#a3e635','#84cc16','#65a30d','#4d7c0f','#3f6212','#365314','#365314','#3f6212','#4d7c0f','#65a30d','#84cc16','#65a30d','#4d7c0f','#3f6212','#365314','#365314','#2d4a0f','#1a2e05','#111f03','#0a1202'] },
  { name: 'Emerald', shades: ['#ecfdf5','#d1fae5','#a7f3d0','#6ee7b7','#34d399','#10b981','#059669','#047857','#065f46','#064e3b','#064e3b','#065f46','#047857','#059669','#10b981','#059669','#047857','#065f46','#064e3b','#064e3b','#053c2e','#022c22','#011f18','#01140f'] },
  { name: 'Teal', shades: ['#f0fdfa','#ccfbf1','#99f6e4','#5eead4','#2dd4bf','#14b8a6','#0d9488','#0f766e','#115e59','#134e4a','#134e4a','#115e59','#0f766e','#0d9488','#14b8a6','#0d9488','#0f766e','#115e59','#134e4a','#134e4a','#0f3d39','#042f2e','#032120','#021514'] },
  { name: 'Cyan', shades: ['#ecfeff','#cffafe','#a5f3fc','#67e8f9','#22d3ee','#06b6d4','#0891b2','#0e7490','#155e75','#164e63','#164e63','#155e75','#0e7490','#0891b2','#06b6d4','#0891b2','#0e7490','#155e75','#164e63','#164e63','#123d4f','#083344','#062633','#041a22'] },
  { name: 'Sky Blue', shades: ['#f0f9ff','#e0f2fe','#bae6fd','#7dd3fc','#38bdf8','#0ea5e9','#0284c7','#0369a1','#075985','#0c4a6e','#0c4a6e','#075985','#0369a1','#0284c7','#0ea5e9','#0284c7','#0369a1','#075985','#0c4a6e','#0c4a6e','#093a57','#082f49','#052133','#031521'] },
  { name: 'Blue', shades: ['#eff6ff','#dbeafe','#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8','#1e40af','#1e3a8a','#1e3a8a','#1e40af','#1d4ed8','#2563eb','#3b82f6','#2563eb','#1d4ed8','#1e40af','#1e3a8a','#1e3a8a','#172554','#172554','#0f1838','#0a1024'] },
  { name: 'Indigo', shades: ['#eef2ff','#e0e7ff','#c7d2fe','#a5b4fc','#818cf8','#6366f1','#4f46e5','#4338ca','#3730a3','#312e81','#312e81','#3730a3','#4338ca','#4f46e5','#6366f1','#4f46e5','#4338ca','#3730a3','#312e81','#312e81','#272566','#1e1b4b','#141233','#0d0c22'] },
  { name: 'Violet', shades: ['#f5f3ff','#ede9fe','#ddd6fe','#c4b5fd','#a78bfa','#8b5cf6','#7c3aed','#6d28d9','#5b21b6','#4c1d95','#4c1d95','#5b21b6','#6d28d9','#7c3aed','#8b5cf6','#7c3aed','#6d28d9','#5b21b6','#4c1d95','#4c1d95','#3b1775','#2e1065','#1f0b45','#14072e'] },
  { name: 'Purple', shades: ['#faf5ff','#f3e8ff','#e9d5ff','#d8b4fe','#c084fc','#a855f7','#9333ea','#7e22ce','#6b21a8','#581c87','#581c87','#6b21a8','#7e22ce','#9333ea','#a855f7','#9333ea','#7e22ce','#6b21a8','#581c87','#581c87','#46166b','#3b0764','#270545','#19032e'] },
  { name: 'Magenta', shades: ['#fdf4ff','#fae8ff','#f5d0fe','#f0abfc','#e879f9','#d946ef','#c026d3','#a21caf','#86198f','#701a75','#701a75','#86198f','#a21caf','#c026d3','#d946ef','#c026d3','#a21caf','#86198f','#701a75','#701a75','#59155e','#4a044e','#310335','#210223'] },
  { name: 'Pink', shades: ['#fdf2f8','#fce7f3','#fbcfe8','#f9a8d4','#f472b6','#ec4899','#db2777','#be185d','#9d174d','#831843','#831843','#9d174d','#be185d','#db2777','#ec4899','#db2777','#be185d','#9d174d','#831843','#831843','#681336','#500724','#360518','#230310'] },
  { name: 'Rose', shades: ['#fff1f2','#ffe4e6','#fecdd3','#fda4af','#fb7185','#f43f5e','#e11d48','#be123c','#9f1239','#881337','#881337','#9f1239','#be123c','#e11d48','#f43f5e','#e11d48','#be123c','#9f1239','#881337','#881337','#6d0f2c','#4c0519','#330311','#22020b'] },
  { name: 'Brown', shades: ['#fdf8f6','#f6ece7','#ead3c8','#dbb8a5','#c99b82','#b87f60','#a66942','#945a36','#82502f','#704628','#704628','#82502f','#945a36','#a66942','#b87f60','#a66942','#945a36','#82502f','#704628','#704628','#593820','#4a2c1a','#311d11','#1f120b'] },
  { name: 'Beige', shades: ['#fdfcf9','#f8f4ec','#f0e8d8','#e6d9c1','#dac8a8','#ccb58d','#bda274','#ad8f5c','#9a7d4a','#866b3d','#866b3d','#9a7d4a','#ad8f5c','#bda274','#ccb58d','#bda274','#ad8f5c','#9a7d4a','#866b3d','#866b3d','#6b5531','#5a4628','#3b2e1a','#261e11'] },
  { name: 'Grey', shades: ['#f9fafb','#f3f4f6','#e5e7eb','#d1d5db','#9ca3af','#6b7280','#4b5563','#374151','#1f2937','#111827','#111827','#1f2937','#374151','#4b5563','#6b7280','#4b5563','#374151','#1f2937','#111827','#111827','#0d1320','#090e17','#060a10','#030508'] },
  { name: 'Slate', shades: ['#f8fafc','#f1f5f9','#e2e8f0','#cbd5e1','#b0becf','#94a3b8','#7b8da6','#64748b','#475569','#334155','#334155','#475569','#64748b','#7b8da6','#94a3b8','#64748b','#475569','#334155','#1e293b','#1e293b','#18202e','#0f172a','#0a0f1c','#05080f'] },
  { name: 'Navy', shades: ['#f0f4ff','#dde7ff','#c2d4ff','#9dbaff','#759bff','#4d7cff','#2f62f5','#1f4fe0','#1840c4','#1233a3','#1233a3','#1840c4','#1f4fe0','#2f62f5','#4d7cff','#2f62f5','#1f4fe0','#1840c4','#1233a3','#1233a3','#0e2882','#0a1f66','#071547','#040b26'] },
  { name: 'Olive', shades: ['#f9fbea','#f1f5c4','#e6ee96','#d8e466','#c7d83a','#b5c91f','#9eb015','#889814','#728013','#5d6810','#5d6810','#728013','#889814','#9eb015','#b5c91f','#9eb015','#889814','#728013','#5d6810','#5d6810','#4a530d','#3a420a','#252a06','#161903'] },
  { name: 'Copper', shades: ['#fff6f0','#ffe8d9','#ffd1b8','#ffb78f','#ff9963','#f07d3a','#dd6520','#c55312','#aa4308','#8f3706','#8f3706','#aa4308','#c55312','#dd6520','#f07d3a','#dd6520','#c55312','#aa4308','#8f3706','#8f3706','#712c05','#5a2304','#3b1703','#251002'] },
];

function CustomColorWheel({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null), drag = useRef(false), [hexInput, setHexInput] = useState(normalizeHex(value, '#c9a96e'));
  const hsv = useMemo(() => { const { r, g, b } = hexToRgbObj(value); return rgbToHsv(r, g, b); }, [value]);
  useEffect(() => setHexInput(normalizeHex(value, '#c9a96e')), [value]);
  useEffect(() => { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return; const size = canvas.width, r = size / 2, img = ctx.createImageData(size, size); for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const dx = x - r, dy = y - r, dist = Math.sqrt(dx * dx + dy * dy), i = (y * size + x) * 4; if (dist <= r) { const h = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, s = Math.min(1, dist / r), rgb = hsvToRgb(h, s, 1); img.data[i] = rgb.r; img.data[i + 1] = rgb.g; img.data[i + 2] = rgb.b; img.data[i + 3] = 255; } else img.data[i + 3] = 0; } ctx.clearRect(0, 0, size, size); ctx.putImageData(img, 0, 0); }, []);
  const pick = (clientX: number, clientY: number) => { const canvas = canvasRef.current; if (!canvas) return; const rect = canvas.getBoundingClientRect(), x = (clientX - rect.left) / rect.width * canvas.width, y = (clientY - rect.top) / rect.height * canvas.height, r = canvas.width / 2, dx = x - r, dy = y - r, dist = Math.min(r, Math.sqrt(dx * dx + dy * dy)), h = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, s = Math.min(1, dist / r), rgb = hsvToRgb(h, s, 1); onChange(rgbToHexObj(rgb.r, rgb.g, rgb.b)); };
  const marker = useMemo(() => { const r = 80, ang = hsv.h * Math.PI / 180, dist = hsv.s * r; return { left: 80 + Math.cos(ang) * dist, top: 80 + Math.sin(ang) * dist }; }, [hsv.h, hsv.s]);
  return (
    <div style={{ display: 'grid', gap: 10, padding: 10, borderRadius: 12, border: '1px solid var(--border-warm)', background: 'var(--bg-surface-2)' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
          <canvas ref={canvasRef} width={160} height={160} style={{ width: 160, height: 160, borderRadius: 999, cursor: 'crosshair', border: '1px solid var(--border-warm)' }} onPointerDown={(e) => { drag.current = true; (e.currentTarget as any).setPointerCapture?.(e.pointerId); pick(e.clientX, e.clientY); }} onPointerMove={(e) => { if (drag.current) pick(e.clientX, e.clientY); }} onPointerUp={() => { drag.current = false; }} onPointerCancel={() => { drag.current = false; }} />
          <span style={{ position: 'absolute', left: marker.left - 7, top: marker.top - 7, width: 14, height: 14, borderRadius: 999, border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,.35)', pointerEvents: 'none', background: normalizeHex(value, '#c9a96e') }} />
        </div>
        <div style={{ minWidth: 150, flex: 1 }}>
          <label style={LABEL}>HEX</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ width: 34, height: 34, borderRadius: 8, background: normalizeHex(value, '#c9a96e'), border: '1px solid var(--border-warm)', flexShrink: 0 }} />
            <input value={hexInput} onChange={(e) => { const v = e.target.value; setHexInput(v); if (/^#?[0-9a-fA-F]{6}$/.test(v.trim())) onChange(normalizeHex(v, value)); }} onBlur={() => setHexInput(normalizeHex(hexInput, value))} style={{ ...INPUT, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', textTransform: 'uppercase' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ShadeFamilyCard({ name, shades, activeValue, onPick }: { name: string; shades: string[]; activeValue: string; onPick: (hex: string) => void }) {
  // Full-width family card (one slide = 100% carousel viewport). Compact responsive shade grid (3–4 rows visible) + independent internal pagination.
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [cols, setCols] = useState(8);
  const [rows, setRows] = useState(3);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const calc = () => {
      const w = el.clientWidth || 0;
      const gap = 5;
      const minTile = 22;
      const nextCols = Math.max(5, Math.min(16, Math.floor((w + gap) / (minTile + gap)) || 8));
      // 4 rows when space allows (desktop/wide), 3 on smaller widths; keeps 3–4 rows practical.
      const nextRows = w >= 300 ? 4 : 3;
      setCols((c) => (c === nextCols ? c : nextCols));
      setRows((r) => (r === nextRows ? r : nextRows));
    };
    calc();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const PAGE_SIZE = Math.max(1, cols * rows);
  const pages = useMemo(() => {
    const p: string[][] = [];
    for (let i = 0; i < shades.length; i += PAGE_SIZE) p.push(shades.slice(i, i + PAGE_SIZE));
    return p.length ? p : [[]];
  }, [shades, PAGE_SIZE]);
  const [page, setPage] = useState(0);
  const maxPage = Math.max(0, pages.length - 1);
  const safePage = Math.min(page, maxPage);
  const canNav = pages.length > 1;
  const prev = () => setPage((n) => Math.max(0, n - 1));
  const next = () => setPage((n) => Math.min(maxPage, n + 1));
  const Arrow = ({ dir, disabled }: { dir: -1 | 1; disabled: boolean }) => (
    <button type="button" aria-label={dir === -1 ? `${name} previous shades` : `${name} more shades`} onClick={dir === -1 ? prev : next} disabled={disabled}
      style={{ width: 22, height: 22, borderRadius: 7, border: '1px solid var(--border-warm)', background: disabled ? 'rgba(255,255,255,0.02)' : 'var(--bg-surface, rgba(255,255,255,0.04))', color: disabled ? 'var(--text-dimmed, rgba(255,255,255,0.28))' : 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', padding: 0, flexShrink: 0, transition: 'background 140ms ease, color 140ms ease' }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={dir === -1 ? 'M6.5 1.5L3 5l3.5 3.5' : 'M3.5 1.5L7 5 3.5 8.5'} /></svg>
    </button>
  );
  return (
    <div style={{ flex: '0 0 100%', width: '100%', minWidth: 0, maxWidth: '100%', scrollSnapAlign: 'start', scrollSnapStop: 'always', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', minWidth: 0, borderRadius: 12, border: '1px solid var(--border-warm)', background: 'var(--bg-surface-2)', padding: '10px 12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexShrink: 0, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ width: 13, height: 13, borderRadius: 4, background: shades[Math.floor(shades.length / 2)], border: '1px solid rgba(255,255,255,0.08)' }} />
            {canNav ? <span style={{ fontSize: 10, color: 'var(--text-dimmed, rgba(255,255,255,0.45))', fontVariantNumeric: 'tabular-nums' }}>{safePage + 1}/{pages.length}</span> : null}
          </div>
        </div>
        <div ref={gridRef} style={{ width: '100%', minWidth: 0, display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: '1fr', gap: 5, alignContent: 'start', justifyItems: 'stretch', boxSizing: 'border-box' }}>
          {pages[safePage].map((shade) => {
            const selected = activeValue.toLowerCase() === shade.toLowerCase();
            return (
              <button key={`${name}-${shade}`} type="button" title={shade} onClick={() => onPick(shade)}
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: 6,
                  border: selected ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.10)',
                  background: shade,
                  cursor: 'pointer',
                  padding: 0,
                  boxSizing: 'border-box',
                  boxShadow: selected ? '0 0 0 1px rgba(0,0,0,0.5) inset, 0 0 0 2px rgba(184,164,122,0.22)' : 'inset 0 0 0 1px rgba(0,0,0,0.06)',
                  outline: 'none',
                  minWidth: 0,
                  maxWidth: 34,
                  justifySelf: 'center',
                  transition: 'transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease',
                }}
                onMouseEnter={(e) => { if (!selected) (e.currentTarget.style.transform = 'scale(1.08)'); }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: canNav ? 'space-between' : 'center', gap: 8, marginTop: 8, flexShrink: 0, minHeight: 22 }}>
          {canNav ? (
            <>
              <Arrow dir={-1} disabled={safePage === 0} />
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>{pages.map((_, i) => <span key={i} style={{ width: 4, height: 4, borderRadius: 999, background: i === safePage ? 'var(--gold)' : 'rgba(255,255,255,0.18)' }} />)}</div>
              <Arrow dir={1} disabled={safePage === maxPage} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ThemeColorEditor({ config, onSet }: { config: CustomThemeConfig; onSet: (key: ThemeColorKey, hex: string) => void }) {
  const [activeProp, setActiveProp] = useState<ThemeColorKey>('primaryColor');
  const [showWheel, setShowWheel] = useState(false);
  const familyRailRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const activeValue = normalizeHex(config[activeProp], '#c9a96e');
  // Only the selected property is updated; each shade button carries its own fixed HEX (COLOR_FAMILIES is static).
  const pickShade = (hex: string) => onSet(activeProp, normalizeHex(hex, activeValue));

  const updateFamilyScroll = () => {
    const el = familyRailRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth } = el;
    const w = Math.max(1, clientWidth);
    const idx = Math.round(scrollLeft / w);
    setCanScrollLeft(idx > 0);
    setCanScrollRight(idx < COLOR_FAMILIES.length - 1);
  };

  useEffect(() => {
    const el = familyRailRef.current;
    if (!el) return;
    updateFamilyScroll();
    const t1 = window.setTimeout(updateFamilyScroll, 60);
    const t2 = window.setTimeout(updateFamilyScroll, 250);
    el.addEventListener('scroll', updateFamilyScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateFamilyScroll) : null;
    ro?.observe(el);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); el.removeEventListener('scroll', updateFamilyScroll); ro?.disconnect(); };
  }, []);

  const nudgeFamilies = (dir: -1 | 1) => {
    const el = familyRailRef.current;
    if (!el) return;
    const w = Math.max(1, el.clientWidth);
    const idx = Math.round(el.scrollLeft / w);
    const next = Math.max(0, Math.min(COLOR_FAMILIES.length - 1, idx + dir));
    el.scrollTo({ left: next * w, behavior: 'smooth' });
    window.setTimeout(updateFamilyScroll, 350);
  };

  const FamilyNav = ({ dir }: { dir: -1 | 1 }) => {
    const canScroll = dir === -1 ? canScrollLeft : canScrollRight;
    return (
      <button
        type="button"
        aria-label={dir === -1 ? 'Previous color families' : 'Next color families'}
        onClick={() => { if (canScroll) nudgeFamilies(dir); }}
        disabled={!canScroll}
        style={{
          flex: '0 0 32px',
          width: 32,
          height: 32,
          borderRadius: 10,
          border: '1px solid var(--border-warm)',
          background: canScroll ? 'var(--bg-surface-2)' : 'rgba(255,255,255,0.02)',
          color: canScroll ? 'var(--text-primary)' : 'var(--text-dimmed, rgba(255,255,255,0.3))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: canScroll ? 'pointer' : 'not-allowed',
          padding: 0,
          boxShadow: canScroll ? '0 2px 10px rgba(0,0,0,0.18)' : 'none',
          opacity: canScroll ? 1 : 0.4,
          transition: 'opacity 150ms ease, background 150ms ease, box-shadow 150ms ease',
          flexShrink: 0,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={dir === -1 ? 'M6.5 1.5L3 5l3.5 3.5' : 'M3.5 1.5L7 5 3.5 8.5'} /></svg>
      </button>
    );
  };
  return (
    <div style={{ display: 'grid', gap: 12, minWidth: 0, maxWidth: '100%', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ minWidth: 0, maxWidth: '100%' }}>
        <label style={LABEL}>Color property</label>
        <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch' }}>
          {COLOR_PROPERTIES.map((p) => {
            const val = normalizeHex(config[p.key], '#888');
            const active = activeProp === p.key;
            return (
              <button key={p.key} type="button" onClick={() => setActiveProp(p.key)} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, border: `1px solid ${active ? 'var(--gold)' : 'var(--border-warm)'}`, background: active ? 'rgba(184,164,122,0.10)' : 'var(--bg-surface-2)', padding: '0.3rem 0.6rem 0.3rem 0.35rem', cursor: 'pointer' }}>
                <span style={{ width: 16, height: 16, borderRadius: 999, background: val, border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: activeValue, border: '1px solid var(--border-warm)', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.1 }}>Editing: {COLOR_PROPERTIES.find(p => p.key === activeProp)?.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{activeValue}</div>
          </div>
        </div>
        <button type="button" onClick={() => setShowWheel(w => !w)} className="d3-btn-subtle" style={{ padding: '0.35rem 0.65rem', fontSize: 11, flexShrink: 0 }}>{showWheel ? 'Hide Color Wheel' : 'Custom Color Wheel'}</button>
      </div>
      {showWheel ? <CustomColorWheel value={activeValue} onChange={pickShade} /> : null}
      <div style={{ minWidth: 0, maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, minWidth: 0 }}>
          <label style={{ ...LABEL, marginBottom: 0 }}>Color families ({COLOR_FAMILIES.length})</label>
          <span style={{ fontSize: 10, color: 'var(--text-dimmed, rgba(255,255,255,0.45))', flexShrink: 0 }}>Use arrows or scroll</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', contain: 'inline-size' }}>
          <FamilyNav dir={-1} />
          <div
            ref={familyRailRef}
            className="no-scrollbar"
            style={{
              display: 'flex',
              gap: 0,
              overflowX: 'auto',
              overflowY: 'hidden',
              padding: 0,
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
              minWidth: 0,
              flex: '1 1 0%',
              width: 0,
              maxWidth: '100%',
              alignItems: 'stretch',
              scrollBehavior: 'smooth',
              boxSizing: 'border-box',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            } as React.CSSProperties}
          >
            {COLOR_FAMILIES.map((family) => (
              <ShadeFamilyCard key={family.name} name={family.name} shades={family.shades} activeValue={activeValue} onPick={pickShade} />
            ))}
          </div>
          <FamilyNav dir={1} />
        </div>
      </div>
    </div>
  );
}
function FontPicker({ label,value,onChange }: { label:string; value:string; onChange:(v:string)=>void }) {
  const [query,setQuery]=useState(''); const [category,setCategory]=useState<FontCategory|'All'>('All');
  const results=useMemo(()=>{const q=query.trim().toLowerCase();return FONT_CATALOG.filter((f)=>(category==='All'||f.category===category)&&(!q||f.label.toLowerCase().includes(q)||f.category.toLowerCase().includes(q)));},[query,category]);
  const previewFonts=useMemo(()=>[value,...results.slice(0,10).map((f)=>f.value)],[value,results]);
  return <div style={{minWidth:0}}><label style={LABEL}>{label}</label><div style={{display:'grid',gap:8,border:'1px solid var(--border-warm)',borderRadius:12,background:'var(--bg-surface-2)',padding:10}}><CustomThemeFontLoader fonts={previewFonts} /><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search fonts..." style={{...INPUT,padding:'0.5rem 0.65rem'}} /><div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:2}}>{(['All',...FONT_CATEGORY_ORDER] as const).map((c)=><button key={c} type="button" onClick={()=>setCategory(c)} style={{borderRadius:999,border:`1px solid ${category===c?'var(--gold)':'var(--border-warm)'}`,background:category===c?'rgba(184,164,122,0.10)':'transparent',color:'var(--text-secondary)',padding:'0.25rem 0.55rem',fontSize:11,whiteSpace:'nowrap',cursor:'pointer'}}>{c}</button>)}</div><select value={value} onChange={(e)=>onChange(e.target.value)} style={INPUT}>{FONT_CATALOG.map((f)=><option key={f.value} value={f.value}>{f.label} — {f.category}</option>)}</select><div style={{maxHeight:180,overflowY:'auto',display:'grid',gap:6,paddingRight:2}}>{results.slice(0,24).map((f)=><button key={f.value} type="button" onClick={()=>onChange(f.value)} style={{textAlign:'left',borderRadius:10,border:`1px solid ${value===f.value?'var(--gold)':'var(--border-warm)'}`,background:value===f.value?'rgba(184,164,122,0.08)' : 'rgba(255,255,255,0.01)',padding:'0.55rem 0.65rem',cursor:'pointer'}}><div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'baseline'}}><span style={{fontFamily:`"${f.value}", sans-serif`,fontSize:15,color:'var(--text-primary)'}}>{f.label}</span><span style={{fontSize:10,color:'var(--text-dimmed)',whiteSpace:'nowrap'}}>{f.category}</span></div><div style={{fontFamily:`"${f.value}", sans-serif`,fontSize:12,color:'var(--text-muted)',marginTop:2}}>{f.sample||'Signature truffle pasta — ₹420'}</div></button>)}{!results.length?<div style={{fontSize:12,color:'var(--text-muted)',padding:'0.25rem 0.1rem'}}>No fonts match.</div>:null}</div></div></div>;
}
const SAMPLE_PREVIEW_ITEMS: PublicMenuItem[] = [
  { id:'s1',category_id:'c1',name:'Truffle Mushroom Risotto',description:'Wild morels, aged parmesan, and black truffle.',price:34,image_url:'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80',model_url_glb:'sample',model_url_usdz:null,is_veg:true,calories:520,preparation_time_mins:22,ingredients:[],allergens:[],dietary_tags:[],rating:4.9,order_count:142,is_featured:true,is_popular:false },
  { id:'s2',category_id:'c1',name:'Wagyu Striploin',description:'Charcoal-seared with roasted shallot reduction.',price:68,image_url:'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',model_url_glb:'sample',model_url_usdz:null,is_veg:false,calories:680,preparation_time_mins:25,ingredients:[],allergens:[],dietary_tags:[],rating:5.0,order_count:210,is_featured:true,is_popular:true },
  { id:'s3',category_id:'c2',name:'Saffron Arancini',description:'Crispy arborio with smoked cheese and tomato coulis.',price:18,image_url:'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80',model_url_glb:null,model_url_usdz:null,is_veg:true,calories:340,preparation_time_mins:15,ingredients:[],allergens:[],dietary_tags:[],rating:4.8,order_count:98,is_featured:false,is_popular:true },
  { id:'s4',category_id:'c2',name:'Matcha Panna Cotta',description:'Ceremonial matcha cream with passionfruit gelee.',price:16,image_url:'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',model_url_glb:null,model_url_usdz:null,is_veg:true,calories:280,preparation_time_mins:10,ingredients:[],allergens:[],dietary_tags:[],rating:4.9,order_count:85,is_featured:false,is_popular:false },
];
const PREVIEW_CATEGORIES: PublicCategory[] = [{ id:'c1',name:'Main Courses',position:1 },{ id:'c2',name:'Small Plates & Desserts',position:2 }];

export default function CustomThemeBuilder({ hotel, initialConfig, onSaved, onCancel, editingThemeId, initialThemeName, embedded = false }: Props) {
  const [config,setConfig]=useState<CustomThemeConfig>(normalizeCustomThemeConfig(initialConfig||hotel.custom_theme_config||DEFAULT_CUSTOM_THEME));
  const [previewDevice,setPreviewDevice]=useState<'mobile'|'desktop'>('mobile');
  const previewViewportRef = useRef<HTMLDivElement|null>(null);
  useEffect(()=>{ const el = previewViewportRef.current; if (el) el.scrollTop = 0; }, [previewDevice]);
  useEffect(()=>{ const el = previewViewportRef.current; if (el) el.scrollTop = 0; }, []);
  const [saving,setSaving]=useState(false); const [saveSuccess,setSaveSuccess]=useState(false); const [error,setError]=useState<string|null>(null);
  const [showSaveDialog,setShowSaveDialog]=useState(false); const [themeName,setThemeName]=useState(initialThemeName||''); const [savingToLibrary,setSavingToLibrary]=useState(false);
  const set=<K extends keyof CustomThemeConfig,>(key:K,value:CustomThemeConfig[K])=>setConfig((p)=>({ ...cloneCustomThemeConfig(p), [key]: value }));
  const setTypo=<K extends keyof CustomThemeConfig['typography'],>(key:K,value:CustomThemeConfig['typography'][K])=>setConfig((p)=>{const n=cloneCustomThemeConfig(p);n.typography={...n.typography,[key]:value};return n;});
  const applyPalette=(paletteId:string)=>{const pal=COLOR_PALETTES.find((p)=>p.id===paletteId); if(!pal) return; setConfig((p)=>({ ...cloneCustomThemeConfig(p), ...pal.colors }));};
  const handleSave=async()=>{if(!hotel.id)return;setSaving(true);setError(null);try{const next=normalizeCustomThemeConfig(config);const res=await fetch('/api/hotel/update',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({hotel_id:hotel.id,menu_theme:'custom',custom_theme_config:next})});const json=await res.json();if(!json.success)throw new Error(json.error||'Failed to save custom theme');setConfig(next);setSaveSuccess(true);onSaved?.(next);setTimeout(()=>setSaveSuccess(false),3500);}catch(err:any){setError(err.message||'Failed to save custom theme');}finally{setSaving(false);}};
  const handleSaveToLibrary=async()=>{if(!hotel.id||!themeName.trim())return;setSavingToLibrary(true);setError(null);const isEdit=Boolean(editingThemeId);try{const next=normalizeCustomThemeConfig(config);const res=await fetch(isEdit ? `/api/hotel/themes/${editingThemeId}` : '/api/hotel/themes',{method:isEdit?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hotel_id:hotel.id,name:themeName.trim(),theme_config:next,apply_now:false})});const json=await res.json();if(!json.success)throw new Error(json.error||'Failed to save theme');setConfig(next);setSaveSuccess(true);setShowSaveDialog(false);setThemeName('');onSaved?.(next);setTimeout(()=>setSaveSuccess(false),3500);}catch(err:any){setError(err.message||'Failed to save theme');}finally{setSavingToLibrary(false);}};
  const previewHotel: PublicHotel = { id:hotel.id,name:hotel.name,slug:hotel.slug,logo_url:hotel.logo_url,currency:hotel.currency||'INR (₹)',welcome_text:hotel.welcome_text||'Bespoke Dining Experience',primary_color:config.primaryColor,secondary_color:'#10b981',menu_style:config.menuLayout,card_style:config.cardStyle,dark_mode:true,typography:config.bodyFont,menu_theme:'custom',custom_theme_config:config,tax_rate:hotel.tax_rate??5,service_charge:hotel.service_charge??10,city:hotel.city };
  const previewProps = { hotel:previewHotel,customConfig:config,currency:hotel.currency||'INR (₹)',tableNumber:'',categories:PREVIEW_CATEGORIES,pills:['All','Main Courses','Small Plates & Desserts'],selectedCategory:'All',onSelectCategory:()=>{},search:'',onSearchChange:()=>{},filteredItems:SAMPLE_PREVIEW_ITEMS,featuredItems:SAMPLE_PREVIEW_ITEMS.filter(i=>i.is_featured),popularItems:SAMPLE_PREVIEW_ITEMS.filter(i=>i.is_popular&&!i.is_featured),regularItems:SAMPLE_PREVIEW_ITEMS.filter(i=>!i.is_featured&&!i.is_popular),cart:[{menuItem:SAMPLE_PREVIEW_ITEMS[0],quantity:1}],totalCount:1,totalPrice:SAMPLE_PREVIEW_ITEMS[0].price,onAdd:()=>{},onRemove:()=>{},onItemClick:()=>{},onView3D:()=>{},onOpenCart:()=>{},embeddedViewport:true };
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-neutral-950/40">
      <CustomThemeFontLoader fonts={[config.headingFont,config.bodyFont,config.priceFont]} />
      {!embedded && <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-8"><div><h2 style={{margin:0,fontSize:'1.25rem',fontWeight:600,color:'var(--text-primary)'}}>Edit Theme</h2><p style={{margin:0,fontSize:'0.8125rem',color:'var(--text-muted)'}}>Customize colors, fonts, layout, and components with immediate mobile/desktop preview.</p></div>{onCancel && <button type="button" onClick={onCancel} className="d3-btn-subtle" disabled={saving||savingToLibrary}>Close</button>}</header>}
      {(saveSuccess||error) && <div className="flex shrink-0 flex-col gap-2 border-b border-white/10 px-4 py-2 sm:px-5">{saveSuccess && <div className="d3-note d3-note-accent" style={{margin:0}}><span style={{fontSize:'0.8125rem'}}>{editingThemeId ? 'Theme saved to your library.' : `Custom theme published. Live at /menu/${hotel.slug}.`}</span></div>}{error && <div className="d3-note d3-note-danger" style={{margin:0}}><span style={{fontSize:'0.8125rem'}}>{error}</span></div>}</div>}
      <div className={`grid min-h-0 flex-1 grid-cols-1 ${embedded ? 'grid-rows-[minmax(150px,0.46fr)_minmax(0,1.54fr)]' : 'grid-rows-[minmax(220px,0.75fr)_minmax(0,1.25fr)]'} xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] xl:grid-rows-1`}>
        <section className="flex min-h-0 min-w-0 flex-col border-b border-white/10 xl:border-b-0 xl:border-r xl:overflow-hidden" style={{ maxWidth: '100%', boxSizing: 'border-box' }}><div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-5" style={{ boxSizing: 'border-box' }}><div className="mx-auto flex w-full min-w-0 max-w-[620px] flex-col gap-6" style={{ boxSizing: 'border-box' }}>
          <div><label style={LABEL}>Professional palette</label><div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}}>{COLOR_PALETTES.map((pal)=><button key={pal.id} type="button" onClick={()=>applyPalette(pal.id)} style={{textAlign:'left',borderRadius:10,border:'1px solid var(--border-warm)',background:'var(--bg-surface-2)',padding:'0.55rem 0.65rem',cursor:'pointer'}}><div style={{display:'flex',gap:4,marginBottom:6}}>{Object.values(pal.colors).slice(0,4).map((c)=><span key={c} style={{width:14,height:14,borderRadius:4,background:c,border:'1px solid rgba(255,255,255,0.08)'}} />)}</div><span style={{fontSize:12,fontWeight:600,color:'var(--text-primary)'}}>{pal.name}</span></button>)}</div></div>
          <Section number="01" title="Colors & Palette"><ThemeColorEditor config={config} onSet={(key, hex) => set(key, normalizeHex(hex, config[key]))} /></Section>
          <Section number="02" title="Typography & Fonts"><div className="grid grid-cols-1 gap-4"><FontPicker label="Heading font" value={config.headingFont} onChange={(v)=>set('headingFont',v)} /><FontPicker label="Body font" value={config.bodyFont} onChange={(v)=>set('bodyFont',v)} /><FontPicker label="Price font" value={config.priceFont} onChange={(v)=>set('priceFont',v)} /></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label style={LABEL}>Heading size ({config.typography.headingSize}px)</label><input type="range" min={14} max={34} value={config.typography.headingSize} onChange={(e)=>setTypo('headingSize',Number(e.target.value))} style={{width:'100%'}} /></div><div><label style={LABEL}>Body size ({config.typography.bodySize}px)</label><input type="range" min={12} max={20} value={config.typography.bodySize} onChange={(e)=>setTypo('bodySize',Number(e.target.value))} style={{width:'100%'}} /></div><div><label style={LABEL}>Price size ({config.typography.priceSize}px)</label><input type="range" min={12} max={28} value={config.typography.priceSize} onChange={(e)=>setTypo('priceSize',Number(e.target.value))} style={{width:'100%'}} /></div><div><label style={LABEL}>Heading weight</label><select value={config.typography.headingWeight} onChange={(e)=>setTypo('headingWeight',e.target.value as any)} style={INPUT}>{['400','500','600','700'].map(w=><option key={w} value={w}>{w}</option>)}</select></div></div></Section>
          <Section number="03" title="Cards & Components"><div><label style={LABEL}>Card style</label><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{CARD_STYLE_OPTIONS.map((o)=><Tile key={o.value} active={config.cardStyle===o.value} onClick={()=>set('cardStyle',o.value)} title={o.label} description={o.description} />)}</div></div><div><label style={LABEL}>Shadow</label><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{SHADOW_OPTIONS.map((o)=><Tile key={o.value} active={config.shadowStrength===o.value} onClick={()=>set('shadowStrength',o.value)} title={o.label} description={o.description} />)}</div></div><div><label style={LABEL}>Border style</label><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{BORDER_STYLE_OPTIONS.map((o)=><Tile key={o.value} active={config.borderStyle===o.value} onClick={()=>set('borderStyle',o.value)} title={o.label} description={o.description} />)}</div></div></Section>
          <Section number="04" title="Buttons & Badges"><div><label style={LABEL}>Button style</label><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{BUTTON_STYLE_OPTIONS.map((o)=><Tile key={o.value} active={config.buttonStyle===o.value} onClick={()=>set('buttonStyle',o.value)} title={o.label} description={o.description} />)}</div></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label style={LABEL}>Button size</label><select value={config.buttonSize} onChange={(e)=>set('buttonSize',e.target.value as any)} style={INPUT}>{BUTTON_SIZE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div><div><label style={LABEL}>Badge style</label><select value={config.badgeStyle} onChange={(e)=>set('badgeStyle',e.target.value as any)} style={INPUT}>{BADGE_STYLE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div></div></Section>
          <Section number="05" title="Layout & Spacing"><div><label style={LABEL}>Menu layout</label><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{MENU_LAYOUT_OPTIONS.map((o)=><Tile key={o.value} active={config.menuLayout===o.value} onClick={()=>set('menuLayout',o.value)} title={o.label} description={o.description} />)}</div></div><div><label style={LABEL}>Spacing</label><div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{SPACING_OPTIONS.map((o)=><Tile key={o.value} active={config.spacing===o.value} onClick={()=>set('spacing',o.value)} title={o.label} description={o.description} />)}</div></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label style={LABEL}>Card radius</label><select value={config.borderRadius} onChange={(e)=>set('borderRadius',e.target.value)} style={INPUT}>{BORDER_RADIUS_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label} ({o.value})</option>)}</select></div><div><label style={LABEL}>Image corners</label><select value={config.imageRadius} onChange={(e)=>set('imageRadius',e.target.value)} style={INPUT}>{BORDER_RADIUS_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label} ({o.value})</option>)}</select></div><div><label style={LABEL}>Button radius</label><select value={config.buttonRadius} onChange={(e)=>set('buttonRadius',e.target.value)} style={INPUT}>{BORDER_RADIUS_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label} ({o.value})</option>)}<option value="999px">Pill (999px)</option></select></div><div><label style={LABEL}>Badge radius</label><select value={config.badgeRadius} onChange={(e)=>set('badgeRadius',e.target.value)} style={INPUT}>{BORDER_RADIUS_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label} ({o.value})</option>)}<option value="999px">Pill (999px)</option></select></div></div></Section>
          <button type="button" onClick={()=>{setThemeName(initialThemeName||'');setShowSaveDialog(true);}} disabled={saving} className="d3-btn-subtle" style={{width:'100%',justifyContent:'center'}}>Save as named theme…</button>
        </div></div></section>
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #0d0e11 0%, #070709 100%)' }}>
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] px-3 py-2 sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400/90 animate-pulse" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.01em' }}>Live preview</span>
              <span className="hidden sm:inline" style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.38)' }}>
                {previewDevice === 'mobile' ? 'Customer menu · portrait' : 'Customer menu · desktop'}
              </span>
            </div>
            <div role="tablist" aria-label="Preview device" style={{ borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: 2, display: 'flex', gap: 1, flexShrink: 0 }}>
              {(['mobile', 'desktop'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  role="tab"
                  aria-selected={previewDevice === d}
                  onClick={() => setPreviewDevice(d)}
                  style={{ borderRadius: 999, border: 'none', padding: '0.28rem 0.75rem', fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer', background: previewDevice === d ? 'rgba(255,255,255,0.10)' : 'transparent', color: previewDevice === d ? '#fff' : 'rgba(255,255,255,0.52)', transition: 'background-color 150ms ease, color 150ms ease' }}
                >
                  {d === 'mobile' ? 'Mobile' : 'Desktop'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-2 sm:p-4">
            {previewDevice === 'mobile' ? (
              <div className="relative mx-auto flex h-full min-h-0 w-full items-center justify-center">
                <div
                  className="relative flex-shrink-0"
                  style={{
                    aspectRatio: '430 / 932',
                    width: 'min(100%, 480px)',
                    height: 'auto',
                    maxHeight: '100%',
                    minHeight: 520,
                    boxSizing: 'border-box',
                  }}
                  aria-label="Mobile live preview frame"
                >
                  {/* Side buttons */}
                  <div aria-hidden style={{ position: 'absolute', left: -3, top: '14%', width: 3, height: '4.2%', borderRadius: '3px 0 0 3px', background: 'linear-gradient(180deg,#3a3a3c,#2c2c2e)' }} />
                  <div aria-hidden style={{ position: 'absolute', left: -3, top: '19.5%', width: 3, height: '7%', borderRadius: '3px 0 0 3px', background: 'linear-gradient(180deg,#3a3a3c,#2c2c2e)' }} />
                  <div aria-hidden style={{ position: 'absolute', left: -3, top: '27.8%', width: 3, height: '7%', borderRadius: '3px 0 0 3px', background: 'linear-gradient(180deg,#3a3a3c,#2c2c2e)' }} />
                  <div aria-hidden style={{ position: 'absolute', right: -3, top: '21.2%', width: 3, height: '9.5%', borderRadius: '0 3px 3px 0', background: 'linear-gradient(180deg,#3a3a3c,#2c2c2e)' }} />

                  {/* Device frame */}
                  <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '13.5% / 6.2%', padding: '2.55%', background: 'linear-gradient(145deg,#2f3034 0%,#1a1b1f 45%,#121316 100%)', boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 28px 80px rgba(0,0,0,0.72), 0 10px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)', boxSizing: 'border-box' }}>
                    <div style={{ position: 'absolute', inset: 1, borderRadius: '13.2% / 6%', border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

                    {/* Screen */}
                    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '11.2% / 5.1%', overflow: 'hidden', background: config.pageBg, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)', boxSizing: 'border-box' }}>
                      {/* Dynamic Island */}
                      <div aria-hidden style={{ position: 'absolute', top: '1.25%', left: '50%', transform: 'translateX(-50%)', width: '32%', height: '4%', minHeight: 28, borderRadius: 999, background: '#000', zIndex: 50, boxShadow: '0 0 0 1px rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '3.5%', boxSizing: 'border-box' }}>
                        <span style={{ width: 9, height: 9, borderRadius: 999, background: 'radial-gradient(circle at 35% 35%, #1f2937, #050608)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }} />
                      </div>

                      {/* Scrollable content — frame stays stationary */}
                      <div
                        ref={previewViewportRef}
                        style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden', background: config.pageBg, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', boxSizing: 'border-box' }}
                      >
                        <div style={{ paddingTop: 'max(44px, 6.2%)', minHeight: '100%', width: '100%', boxSizing: 'border-box' }}>
                          <CustomTemplate {...previewProps} />
                        </div>
                      </div>

                      {/* Home indicator */}
                      <div aria-hidden style={{ position: 'absolute', bottom: '1%', left: '50%', transform: 'translateX(-50%)', width: '34%', height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.28)', zIndex: 50, pointerEvents: 'none', mixBlendMode: 'difference' }} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative flex h-full min-h-0 w-full flex-col" style={{ maxWidth: '100%', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: '#0b0c0f', boxShadow: '0 24px 64px rgba(0,0,0,0.55)', overflow: 'hidden', boxSizing: 'border-box' }}>
                <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#ff5f57' }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#febc2e' }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#28c840' }} />
                  </div>
                  <div className="mx-auto max-w-md flex-1 truncate rounded-md px-3 py-1 text-center" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.6875rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: 'rgba(255,255,255,0.45)', boxSizing: 'border-box' }}>
                    https://dine3d.app/menu/{hotel.slug}
                  </div>
                  <div style={{ width: 52 }} />
                </div>
                <div
                  ref={previewViewportRef}
                  style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', background: config.pageBg, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', boxSizing: 'border-box' }}
                >
                  <CustomTemplate {...previewProps} />
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 px-4 py-2.5 sm:px-5" style={{background:'rgba(10,10,10,0.72)',backdropFilter:'blur(10px)'}}><p className="hidden sm:block" style={{margin:0,fontSize:'0.6875rem',color:'var(--text-dimmed)',lineHeight:1.35}}>{editingThemeId?'Saving updates this theme in your library.':'Publishing applies this design to Menu, View Order, and Your Order.'}</p><div className="flex items-center gap-2 ml-auto">{onCancel && <button type="button" onClick={onCancel} className="d3-btn-subtle" disabled={saving||savingToLibrary}>Cancel</button>}<button type="button" onClick={handleSave} disabled={saving||savingToLibrary} className="d3-btn-primary" style={{padding:'0.5rem 1.125rem',opacity:saving?0.7:1}}>{saving?'Saving…':'Save Changes'}</button></div></footer>
      {showSaveDialog && <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)'}} onClick={()=>{if(!savingToLibrary)setShowSaveDialog(false);}}><div className="w-full max-w-md rounded-2xl border border-white/15 bg-neutral-900 shadow-2xl overflow-hidden" onClick={(e)=>e.stopPropagation()}><div className="px-6 py-4 border-b border-white/10"><h3 className="text-base font-bold text-white">Save as Named Theme</h3><p className="text-xs text-neutral-400 mt-1">Stored in your theme library. Apply it later from Custom Themes.</p></div><div className="p-6 space-y-4"><div><label className="d3-label mb-1.5">Theme name</label><input type="text" value={themeName} onChange={(e)=>setThemeName(e.target.value)} placeholder="e.g. Summer Garden" maxLength={80} autoFocus className="w-full bg-neutral-950 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E5A93C]" onKeyDown={(e)=>{if(e.key==='Enter')handleSaveToLibrary();if(e.key==='Escape')setShowSaveDialog(false);}} /></div>{error && <div className="d3-note d3-note-danger text-xs"><span>{error}</span></div>}</div><div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3"><button type="button" onClick={()=>{if(!savingToLibrary)setShowSaveDialog(false);}} disabled={savingToLibrary} className="d3-btn-subtle">Cancel</button><button type="button" onClick={handleSaveToLibrary} disabled={savingToLibrary||!themeName.trim()} className="d3-btn-primary">{savingToLibrary?'Saving…':'Save to Library'}</button></div></div></div>}
    </div>
  );
}

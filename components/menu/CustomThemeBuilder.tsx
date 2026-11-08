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
// Static shade palettes: 24 families × 18 shades each (432 selectable HEX values, light→dark). Each shade keeps its own HEX value (never derived from/mutated by selection).
const COLOR_FAMILIES: { name: string; shades: string[] }[] = [
  { name: 'Red', shades: ['#fff5f5','#ffe3e3','#ffc9c9','#ffa8a8','#ff8787','#ff6b6b','#fa5252','#f03e3e','#e03131','#c92a2a','#b02525','#962020','#7d1a1a','#661515','#521111','#3d0c0c','#2b0808','#1a0505'] },
  { name: 'Orange', shades: ['#fff4e6','#ffe8cc','#ffd8a8','#ffc078','#ffa94d','#ff922b','#fd7e14','#f76707','#e8590c','#d9480f','#bf400d','#a6370b','#8c2f09','#732607','#591d05','#401404','#2b0d03','#1a0802'] },
  { name: 'Yellow', shades: ['#fff9db','#fff3bf','#ffec99','#ffe066','#ffd43b','#fcc419','#fab005','#f59f00','#f08c00','#e67700','#cc6a00','#b35c00','#994f00','#804200','#663500','#4d2800','#331b00','#1a0d00'] },
  { name: 'Gold', shades: ['#fffdf2','#fff8d6','#ffefad','#ffe680','#ffda52','#ffd024','#f5c518','#e6b400','#d4a300','#bf9100','#a87e00','#916b00','#785800','#614600','#4a3500','#332400','#211700','#120d00'] },
  { name: 'Amber', shades: ['#fffbeb','#fef3c7','#fde68a','#fcd34d','#fbbf24','#f59e0b','#d97706','#b45309','#92400e','#78350f','#6b2f0c','#592607','#472004','#361802','#271101','#1a0b01','#100701','#080300'] },
  { name: 'Green', shades: ['#ebfbee','#d3f9d8','#b2f2bb','#8ce99a','#69db7c','#51cf66','#40c057','#37b24d','#2f9e44','#2b8a3e','#257636','#1f632d','#195125','#13401d','#0d3016','#08200f','#051408','#020a04'] },
  { name: 'Lime', shades: ['#f4fce3','#e9fac8','#d8f5a2','#c0eb75','#a9e34b','#94d82d','#82c91e','#74b816','#66a80f','#5c940d','#4e7d0b','#406609','#334f07','#263b05','#1a2803','#111a02','#0a1001','#050801'] },
  { name: 'Emerald', shades: ['#ecfdf5','#d1fae5','#a7f3d0','#79e8be','#4dd8a8','#26c78f','#10b981','#059669','#047857','#03694b','#025940','#014a35','#003b2b','#002d21','#002017','#00140f','#000d0a','#000605'] },
  { name: 'Teal', shades: ['#e6fcf5','#c3fae8','#96f2d7','#63e6be','#38d9a9','#20c997','#12b886','#0ca678','#099268','#087f5b','#066d4e','#055c42','#044a35','#033929','#022819','#011a11','#00100a','#000805'] },
  { name: 'Cyan', shades: ['#e3fafc','#c5f6fa','#99e9f2','#66d9e8','#3bc9db','#22b8cf','#15aabf','#1098ad','#0c8599','#0b7285','#096274','#075263','#054353','#033442','#022532','#011823','#000f15','#00080b'] },
  { name: 'Sky Blue', shades: ['#e7f5ff','#d0ebff','#a5d8ff','#74c0fc','#4dabf7','#339af0','#228be6','#1c7ed6','#1971c2','#1864ab','#155795','#124a7d','#0f3d66','#0c3050','#09243b','#061829','#040e18','#02070c'] },
  { name: 'Blue', shades: ['#edf2ff','#dbe4ff','#bac8ff','#91a7ff','#748ffc','#5c7cfa','#4c6ef5','#4263eb','#3b5bdb','#364fc7','#2f45ad','#283b93','#213179','#1a275f','#131d46','#0d1430','#080c1d','#04060f'] },
  { name: 'Indigo', shades: ['#f3f0ff','#e5dbff','#d0bfff','#b197fc','#9775fa','#845ef7','#7950f2','#7048e8','#6741d9','#5f3dc4','#5235aa','#45308f','#382875','#2b1f5c','#1f1642','#15102d','#0d0a1b','#07050e'] },
  { name: 'Violet', shades: ['#f5f3ff','#ede9fe','#ddd6fe','#c4b5fd','#a78bfa','#8b5cf6','#7c3aed','#6d28d9','#5b21b6','#4c1d95','#411981','#36156d','#2b1158','#211044','#170b30','#0f071f','#090412','#040209'] },
  { name: 'Purple', shades: ['#f8f0fc','#f3d9fa','#eebefa','#e599f7','#da77f2','#cc5de8','#be4bdb','#ae3ec9','#9c36b5','#862e9c','#742787','#622172','#501b5d','#3e1548','#2d0f34','#1e0a23','#120614','#09030a'] },
  { name: 'Magenta', shades: ['#fff0f6','#ffdeeb','#fcc2d7','#faa2c1','#f783ac','#f06595','#e64980','#d6336c','#c2255c','#a61e4d','#8f1a42','#781637','#61122c','#4b0e22','#360a18','#240710','#150409','#0a0204'] },
  { name: 'Pink', shades: ['#fff0f6','#ffdeeb','#fcc2d7','#faa2c1','#f783ac','#f06595','#e64980','#d6336c','#c2255c','#b01e53','#991a48','#82163d','#6b1232','#541028','#3d0c1d','#290813','#18050b','#0c0206'] },
  { name: 'Rose', shades: ['#fff1f2','#ffe4e6','#fecdd3','#fda4af','#fb7185','#f43f5e','#e11d48','#be123c','#9f1239','#881337','#76112f','#641028','#520d21','#400a1a','#2f0713','#20050d','#120308','#090104'] },
  { name: 'Brown', shades: ['#fdf8f6','#f6ece7','#ead3c8','#dbb8a5','#c99b82','#b87f60','#a66942','#945a36','#82502f','#704628','#5f3b22','#4f311c','#402816','#311f11','#24170d','#180f08','#0e0905','#070402'] },
  { name: 'Beige', shades: ['#fdfcf9','#f8f4ec','#f0e8d8','#e6d9c1','#dac8a8','#ccb58d','#bda274','#ad8f5c','#9a7d4a','#866b3d','#725a33','#5e4a2a','#4b3b21','#382c19','#262012','#17130b','#0d0b06','#060503'] },
  { name: 'Grey', shades: ['#f8f9fa','#f1f3f5','#e9ecef','#dee2e6','#ced4da','#adb5bd','#868e96','#6c757d','#5c636a','#495057','#3f454c','#343a40','#2a2f34','#212529','#181b1e','#101214','#090a0b','#040405'] },
  { name: 'Slate', shades: ['#f8fafc','#f1f5f9','#e2e8f0','#cbd5e1','#b0becf','#94a3b8','#7b8da6','#64748b','#526277','#475569','#3b4758','#303b49','#252f3b','#1b232d','#121820','#0b0f14','#06080b','#030405'] },
  { name: 'Navy', shades: ['#f0f4ff','#dde7ff','#c2d4ff','#9dbaff','#759bff','#4d7cff','#2f62f5','#1f4fe0','#1840c4','#1233a3','#0f2b87','#0c236d','#091b54','#07143d','#050e2a','#03091b','#02050f','#010307'] },
  { name: 'Olive', shades: ['#f9fbea','#f1f5c4','#e6ee96','#d8e466','#c7d83a','#b5c91f','#9eb015','#889814','#728013','#5d6810','#4d560d','#3e450b','#303609','#232706','#181b04','#0f1103','#090a02','#040501'] },
  { name: 'Copper', shades: ['#fff6f0','#ffe8d9','#ffd1b8','#ffb78f','#ff9963','#f07d3a','#dd6520','#c55312','#aa4308','#8f3706','#772e05','#602504','#4a1d03','#361502','#251002','#170a01','#0d0601','#060300'] },
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
            {canNav ? <span style={{ fontSize: 10, color: 'var(--text-dimmed, rgba(255,255,255,0.45))', fontVariantNumeric: 'tabular-nums' }}>{safePage + 1}/{pages.length}</span> : <span style={{ fontSize: 10, color: 'var(--text-dimmed, rgba(255,255,255,0.45))' }}>Light → Dark</span>}
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

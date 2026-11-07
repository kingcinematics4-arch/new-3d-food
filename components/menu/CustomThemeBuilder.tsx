'use client';

import React, { useMemo, useRef, useState, useEffect, type CSSProperties, type ReactNode } from 'react';
import {
  BADGE_STYLE_OPTIONS, BORDER_RADIUS_OPTIONS, BORDER_STYLE_OPTIONS, BUTTON_SIZE_OPTIONS, BUTTON_STYLE_OPTIONS,
  CARD_STYLE_OPTIONS, COLOR_PALETTES, DEFAULT_CUSTOM_THEME, FONT_CATALOG, FONT_CATEGORY_ORDER,
  MENU_LAYOUT_OPTIONS, SHADOW_OPTIONS, SPACING_OPTIONS,
  cloneCustomThemeConfig, getProfessionalShades, normalizeCustomThemeConfig, normalizeHex,
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
function ColorWheel({ value, onChange }: { value:string; onChange:(hex:string)=>void }) {
  const canvasRef=useRef<HTMLCanvasElement|null>(null), drag=useRef(false), [hexInput,setHexInput]=useState(normalizeHex(value,'#c9a96e'));
  const hsv=useMemo(()=>{const {r,g,b}=hexToRgbObj(value);return rgbToHsv(r,g,b);},[value]);
  useEffect(()=>setHexInput(normalizeHex(value,'#c9a96e')),[value]);
  useEffect(()=>{const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;const size=canvas.width,r=size/2,img=ctx.createImageData(size,size);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const dx=x-r,dy=y-r,dist=Math.sqrt(dx*dx+dy*dy),i=(y*size+x)*4;if(dist<=r){const h=(Math.atan2(dy,dx)*180/Math.PI+360)%360,s=Math.min(1,dist/r),rgb=hsvToRgb(h,s,1);img.data[i]=rgb.r;img.data[i+1]=rgb.g;img.data[i+2]=rgb.b;img.data[i+3]=255;}else img.data[i+3]=0;}ctx.clearRect(0,0,size,size);ctx.putImageData(img,0,0);},[]);
  const pick=(clientX:number,clientY:number)=>{const canvas=canvasRef.current;if(!canvas)return;const rect=canvas.getBoundingClientRect(),x=(clientX-rect.left)/rect.width*canvas.width,y=(clientY-rect.top)/rect.height*canvas.height,r=canvas.width/2,dx=x-r,dy=y-r,dist=Math.min(r,Math.sqrt(dx*dx+dy*dy)),h=(Math.atan2(dy,dx)*180/Math.PI+360)%360,s=Math.min(1,dist/r),rgb=hsvToRgb(h,s,1);onChange(rgbToHexObj(rgb.r,rgb.g,rgb.b));};
  const marker=useMemo(()=>{const r=80,ang=hsv.h*Math.PI/180,dist=hsv.s*r;return{left:80+Math.cos(ang)*dist,top:80+Math.sin(ang)*dist};},[hsv.h,hsv.s]);
  const shades=useMemo(()=>getProfessionalShades(value),[value]);
  return <div style={{display:'grid',gap:10}}><div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}><div style={{position:'relative',width:160,height:160,flexShrink:0}}><canvas ref={canvasRef} width={160} height={160} style={{width:160,height:160,borderRadius:999,cursor:'crosshair',border:'1px solid var(--border-warm)'}} onPointerDown={(e)=>{drag.current=true;(e.currentTarget as any).setPointerCapture?.(e.pointerId);pick(e.clientX,e.clientY);}} onPointerMove={(e)=>{if(drag.current)pick(e.clientX,e.clientY);}} onPointerUp={()=>{drag.current=false;}} onPointerCancel={()=>{drag.current=false;}} /><span style={{position:'absolute',left:marker.left-7,top:marker.top-7,width:14,height:14,borderRadius:999,border:'2px solid #fff',boxShadow:'0 0 0 1px rgba(0,0,0,.35)',pointerEvents:'none',background:normalizeHex(value,'#c9a96e')}} /></div><div style={{minWidth:170,flex:1}}><label style={LABEL}>HEX</label><div style={{display:'flex',gap:8,alignItems:'center'}}><span style={{width:34,height:34,borderRadius:8,background:normalizeHex(value,'#c9a96e'),border:'1px solid var(--border-warm)',flexShrink:0}} /><input value={hexInput} onChange={(e)=>{const v=e.target.value;setHexInput(v);if(/^#?[0-9a-fA-F]{6}$/.test(v.trim()))onChange(normalizeHex(v,value));}} onBlur={()=>setHexInput(normalizeHex(hexInput,value))} style={{...INPUT,fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace',textTransform:'uppercase'}} /></div></div></div><div><div style={{...LABEL,marginBottom:8}}>Shades</div><div style={{display:'grid',gridTemplateColumns:'repeat(6,minmax(0,1fr))',gap:6}}>{shades.map((s)=><button key={s} type="button" onClick={()=>onChange(s)} title={s} style={{height:28,borderRadius:8,border:normalizeHex(value,'')===s?'2px solid var(--gold)':'1px solid var(--border-warm)',background:s,cursor:'pointer',padding:0}} />)}</div></div></div>;
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
  const [saving,setSaving]=useState(false); const [saveSuccess,setSaveSuccess]=useState(false); const [error,setError]=useState<string|null>(null);
  const [showSaveDialog,setShowSaveDialog]=useState(false); const [themeName,setThemeName]=useState(initialThemeName||''); const [savingToLibrary,setSavingToLibrary]=useState(false);
  const set=<K extends keyof CustomThemeConfig,>(key:K,value:CustomThemeConfig[K])=>setConfig((p)=>({ ...cloneCustomThemeConfig(p), [key]: value }));
  const setTypo=<K extends keyof CustomThemeConfig['typography'],>(key:K,value:CustomThemeConfig['typography'][K])=>setConfig((p)=>{const n=cloneCustomThemeConfig(p);n.typography={...n.typography,[key]:value};return n;});
  const applyPalette=(paletteId:string)=>{const pal=COLOR_PALETTES.find((p)=>p.id===paletteId); if(!pal) return; setConfig((p)=>({ ...cloneCustomThemeConfig(p), ...pal.colors }));};
  const handleSave=async()=>{if(!hotel.id)return;setSaving(true);setError(null);try{const next=normalizeCustomThemeConfig(config);const res=await fetch('/api/hotel/update',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({hotel_id:hotel.id,menu_theme:'custom',custom_theme_config:next})});const json=await res.json();if(!json.success)throw new Error(json.error||'Failed to save custom theme');setConfig(next);setSaveSuccess(true);onSaved?.(next);setTimeout(()=>setSaveSuccess(false),3500);}catch(err:any){setError(err.message||'Failed to save custom theme');}finally{setSaving(false);}};
  const handleSaveToLibrary=async()=>{if(!hotel.id||!themeName.trim())return;setSavingToLibrary(true);setError(null);const isEdit=Boolean(editingThemeId);try{const next=normalizeCustomThemeConfig(config);const res=await fetch(isEdit ? `/api/hotel/themes/${editingThemeId}` : '/api/hotel/themes',{method:isEdit?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hotel_id:hotel.id,name:themeName.trim(),theme_config:next,apply_now:false})});const json=await res.json();if(!json.success)throw new Error(json.error||'Failed to save theme');setConfig(next);setSaveSuccess(true);setShowSaveDialog(false);setThemeName('');onSaved?.(next);setTimeout(()=>setSaveSuccess(false),3500);}catch(err:any){setError(err.message||'Failed to save theme');}finally{setSavingToLibrary(false);}};
  const previewHotel: PublicHotel = { id:hotel.id,name:hotel.name,slug:hotel.slug,logo_url:hotel.logo_url,currency:hotel.currency||'INR (₹)',welcome_text:hotel.welcome_text||'Bespoke Dining Experience',primary_color:config.primaryColor,secondary_color:'#10b981',menu_style:config.menuLayout,card_style:config.cardStyle,dark_mode:true,typography:config.bodyFont,menu_theme:'custom',custom_theme_config:config,tax_rate:hotel.tax_rate??5,service_charge:hotel.service_charge??10,city:hotel.city };
  const PREVIEW_ITEM = SAMPLE_PREVIEW_ITEMS[0];
  const previewProps = { hotel:previewHotel,customConfig:config,currency:hotel.currency||'INR (₹)',tableNumber:'4',categories:PREVIEW_CATEGORIES,pills:['All','Main Courses','Small Plates & Desserts'],selectedCategory:'All',onSelectCategory:()=>{},search:'',onSearchChange:()=>{},filteredItems:[PREVIEW_ITEM],featuredItems:[PREVIEW_ITEM],popularItems:[],regularItems:[],cart:[{menuItem:PREVIEW_ITEM,quantity:1}],totalCount:1,totalPrice:PREVIEW_ITEM.price,onAdd:()=>{},onRemove:()=>{},onItemClick:()=>{},onView3D:()=>{},onOpenCart:()=>{} };
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-neutral-950/40">
      <CustomThemeFontLoader fonts={[config.headingFont,config.bodyFont,config.priceFont]} />
      {!embedded && <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-8"><div><h2 style={{margin:0,fontSize:'1.25rem',fontWeight:600,color:'var(--text-primary)'}}>Edit Theme</h2><p style={{margin:0,fontSize:'0.8125rem',color:'var(--text-muted)'}}>Customize colors, fonts, layout, and components with immediate mobile/desktop preview.</p></div>{onCancel && <button type="button" onClick={onCancel} className="d3-btn-subtle" disabled={saving||savingToLibrary}>Close</button>}</header>}
      {(saveSuccess||error) && <div className="flex flex-col gap-2 border-b border-white/10 px-6 py-3 sm:px-8">{saveSuccess && <div className="d3-note d3-note-accent" style={{margin:0}}><span style={{fontSize:'0.8125rem'}}>{editingThemeId ? 'Theme saved to your library.' : `Custom theme published. Live at /menu/${hotel.slug}.`}</span></div>}{error && <div className="d3-note d3-note-danger" style={{margin:0}}><span style={{fontSize:'0.8125rem'}}>{error}</span></div>}</div>}
      <div className={`grid min-h-0 flex-1 grid-cols-1 ${embedded ? 'grid-rows-[minmax(180px,0.55fr)_minmax(0,1.45fr)]' : 'grid-rows-[minmax(220px,0.75fr)_minmax(0,1.25fr)]'} xl:grid-cols-[minmax(360px,400px)_minmax(0,1fr)] xl:grid-rows-1`}>
        <section className="flex min-h-0 flex-col border-b border-white/10 xl:border-b-0 xl:border-r xl:overflow-hidden"><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6"><div className="mx-auto flex w-full max-w-[620px] flex-col gap-8">
          <div><label style={LABEL}>Professional palette</label><div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}}>{COLOR_PALETTES.map((pal)=><button key={pal.id} type="button" onClick={()=>applyPalette(pal.id)} style={{textAlign:'left',borderRadius:10,border:'1px solid var(--border-warm)',background:'var(--bg-surface-2)',padding:'0.55rem 0.65rem',cursor:'pointer'}}><div style={{display:'flex',gap:4,marginBottom:6}}>{Object.values(pal.colors).slice(0,4).map((c)=><span key={c} style={{width:14,height:14,borderRadius:4,background:c,border:'1px solid rgba(255,255,255,0.08)'}} />)}</div><span style={{fontSize:12,fontWeight:600,color:'var(--text-primary)'}}>{pal.name}</span></button>)}</div></div>
          <Section number="01" title="Colors & Palette"><div className="grid grid-cols-1 gap-5"><div><label style={LABEL}>Primary / accent</label><ColorWheel value={config.primaryColor} onChange={(v)=>set('primaryColor',normalizeHex(v,config.primaryColor))} /></div><div><label style={LABEL}>Page background</label><ColorWheel value={config.pageBg} onChange={(v)=>set('pageBg',normalizeHex(v,config.pageBg))} /></div><div><label style={LABEL}>Card background</label><ColorWheel value={config.cardBg} onChange={(v)=>set('cardBg',normalizeHex(v,config.cardBg))} /></div><div><label style={LABEL}>Text color</label><ColorWheel value={config.textColor} onChange={(v)=>set('textColor',normalizeHex(v,config.textColor))} /></div><div><label style={LABEL}>Muted text</label><ColorWheel value={config.mutedTextColor} onChange={(v)=>set('mutedTextColor',normalizeHex(v,config.mutedTextColor))} /></div></div></Section>
          <Section number="02" title="Typography & Fonts"><div className="grid grid-cols-1 gap-4"><FontPicker label="Heading font" value={config.headingFont} onChange={(v)=>set('headingFont',v)} /><FontPicker label="Body font" value={config.bodyFont} onChange={(v)=>set('bodyFont',v)} /><FontPicker label="Price font" value={config.priceFont} onChange={(v)=>set('priceFont',v)} /></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label style={LABEL}>Heading size ({config.typography.headingSize}px)</label><input type="range" min={14} max={34} value={config.typography.headingSize} onChange={(e)=>setTypo('headingSize',Number(e.target.value))} style={{width:'100%'}} /></div><div><label style={LABEL}>Body size ({config.typography.bodySize}px)</label><input type="range" min={12} max={20} value={config.typography.bodySize} onChange={(e)=>setTypo('bodySize',Number(e.target.value))} style={{width:'100%'}} /></div><div><label style={LABEL}>Price size ({config.typography.priceSize}px)</label><input type="range" min={12} max={28} value={config.typography.priceSize} onChange={(e)=>setTypo('priceSize',Number(e.target.value))} style={{width:'100%'}} /></div><div><label style={LABEL}>Heading weight</label><select value={config.typography.headingWeight} onChange={(e)=>setTypo('headingWeight',e.target.value as any)} style={INPUT}>{['400','500','600','700'].map(w=><option key={w} value={w}>{w}</option>)}</select></div></div></Section>
          <Section number="03" title="Cards & Components"><div><label style={LABEL}>Card style</label><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{CARD_STYLE_OPTIONS.map((o)=><Tile key={o.value} active={config.cardStyle===o.value} onClick={()=>set('cardStyle',o.value)} title={o.label} description={o.description} />)}</div></div><div><label style={LABEL}>Shadow</label><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{SHADOW_OPTIONS.map((o)=><Tile key={o.value} active={config.shadowStrength===o.value} onClick={()=>set('shadowStrength',o.value)} title={o.label} description={o.description} />)}</div></div><div><label style={LABEL}>Border style</label><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{BORDER_STYLE_OPTIONS.map((o)=><Tile key={o.value} active={config.borderStyle===o.value} onClick={()=>set('borderStyle',o.value)} title={o.label} description={o.description} />)}</div></div></Section>
          <Section number="04" title="Buttons & Badges"><div><label style={LABEL}>Button style</label><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{BUTTON_STYLE_OPTIONS.map((o)=><Tile key={o.value} active={config.buttonStyle===o.value} onClick={()=>set('buttonStyle',o.value)} title={o.label} description={o.description} />)}</div></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label style={LABEL}>Button size</label><select value={config.buttonSize} onChange={(e)=>set('buttonSize',e.target.value as any)} style={INPUT}>{BUTTON_SIZE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div><div><label style={LABEL}>Badge style</label><select value={config.badgeStyle} onChange={(e)=>set('badgeStyle',e.target.value as any)} style={INPUT}>{BADGE_STYLE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div></div></Section>
          <Section number="05" title="Layout & Spacing"><div><label style={LABEL}>Menu layout</label><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{MENU_LAYOUT_OPTIONS.map((o)=><Tile key={o.value} active={config.menuLayout===o.value} onClick={()=>set('menuLayout',o.value)} title={o.label} description={o.description} />)}</div></div><div><label style={LABEL}>Spacing</label><div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{SPACING_OPTIONS.map((o)=><Tile key={o.value} active={config.spacing===o.value} onClick={()=>set('spacing',o.value)} title={o.label} description={o.description} />)}</div></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label style={LABEL}>Card radius</label><select value={config.borderRadius} onChange={(e)=>set('borderRadius',e.target.value)} style={INPUT}>{BORDER_RADIUS_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label} ({o.value})</option>)}</select></div><div><label style={LABEL}>Image corners</label><select value={config.imageRadius} onChange={(e)=>set('imageRadius',e.target.value)} style={INPUT}>{BORDER_RADIUS_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label} ({o.value})</option>)}</select></div><div><label style={LABEL}>Button radius</label><select value={config.buttonRadius} onChange={(e)=>set('buttonRadius',e.target.value)} style={INPUT}>{BORDER_RADIUS_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label} ({o.value})</option>)}<option value="999px">Pill (999px)</option></select></div><div><label style={LABEL}>Badge radius</label><select value={config.badgeRadius} onChange={(e)=>set('badgeRadius',e.target.value)} style={INPUT}>{BORDER_RADIUS_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label} ({o.value})</option>)}<option value="999px">Pill (999px)</option></select></div></div></Section>
          <button type="button" onClick={()=>{setThemeName(initialThemeName||'');setShowSaveDialog(true);}} disabled={saving} className="d3-btn-subtle" style={{width:'100%',justifyContent:'center'}}>Save as named theme…</button>
        </div></div></section>
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #0d0e11 0%, #070709 100%)' }}>
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-2.5 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400/90" />
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

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3 py-2.5 sm:px-4">
            {previewDevice === 'mobile' ? (
              <div className="flex w-full min-h-0 items-center justify-center">
                <div
                  aria-label="App preview"
                  style={{
                    width: 'min(400px, 100%)',
                    height: 'min(620px, calc(100vh - 280px), 100%)',
                    minHeight: 520,
                    maxHeight: '100%',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: config.pageBg,
                    border: '1px solid rgba(255,255,255,0.10)',
                    boxShadow: '0 18px 48px -14px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.18) inset',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: config.pageBg }}>
                    <CustomTemplate {...previewProps} previewSingleCard />
                  </div>
                </div>
              </div>            ) : (
              <div className="flex h-full w-full min-h-0 min-w-0 items-center justify-center">
                <div
                  className="flex h-full min-h-0 w-full flex-col overflow-hidden"
                  style={{
                    width: '100%',
                    maxWidth: 1180,
                    maxHeight: '100%',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: '#0f1012',
                    boxShadow: '0 20px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  <div className="flex shrink-0 items-center gap-2.5 px-3.5 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex gap-1.5" aria-hidden="true">
                      <span style={{ width: 9, height: 9, borderRadius: 999, background: '#ff5f57' }} />
                      <span style={{ width: 9, height: 9, borderRadius: 999, background: '#febc2e' }} />
                      <span style={{ width: 9, height: 9, borderRadius: 999, background: '#28c840' }} />
                    </div>
                    <div style={{ flex: 1, maxWidth: 560, margin: '0 auto', borderRadius: 7, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.16)', padding: '0.28rem 0.65rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.48)', textAlign: 'center', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      dine3d.app/menu/{hotel.slug}
                    </div>
                    <div style={{ width: 42, flexShrink: 0 }} />
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden" style={{ background: config.pageBg }}>
                    <div className="h-full min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' as any }}>
                      <CustomTemplate {...previewProps} previewSingleCard />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 px-6 py-3.5 sm:px-8" style={{background:'rgba(10,10,10,0.7)',backdropFilter:'blur(10px)'}}><p style={{margin:0,fontSize:'0.75rem',color:'var(--text-dimmed)'}}>{editingThemeId?'Saving updates this theme in your library.':'Publishing applies this design to Menu, View Order, and Your Order.'}</p><div className="flex items-center gap-2">{onCancel && <button type="button" onClick={onCancel} className="d3-btn-subtle" disabled={saving||savingToLibrary}>Cancel</button>}<button type="button" onClick={handleSave} disabled={saving||savingToLibrary} className="d3-btn-primary" style={{padding:'0.625rem 1.25rem',opacity:saving?0.7:1}}>{saving?'Saving…':'Save Changes'}</button></div></footer>
      {showSaveDialog && <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)'}} onClick={()=>{if(!savingToLibrary)setShowSaveDialog(false);}}><div className="w-full max-w-md rounded-2xl border border-white/15 bg-neutral-900 shadow-2xl overflow-hidden" onClick={(e)=>e.stopPropagation()}><div className="px-6 py-4 border-b border-white/10"><h3 className="text-base font-bold text-white">Save as Named Theme</h3><p className="text-xs text-neutral-400 mt-1">Stored in your theme library. Apply it later from Custom Themes.</p></div><div className="p-6 space-y-4"><div><label className="d3-label mb-1.5">Theme name</label><input type="text" value={themeName} onChange={(e)=>setThemeName(e.target.value)} placeholder="e.g. Summer Garden" maxLength={80} autoFocus className="w-full bg-neutral-950 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E5A93C]" onKeyDown={(e)=>{if(e.key==='Enter')handleSaveToLibrary();if(e.key==='Escape')setShowSaveDialog(false);}} /></div>{error && <div className="d3-note d3-note-danger text-xs"><span>{error}</span></div>}</div><div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3"><button type="button" onClick={()=>{if(!savingToLibrary)setShowSaveDialog(false);}} disabled={savingToLibrary} className="d3-btn-subtle">Cancel</button><button type="button" onClick={handleSaveToLibrary} disabled={savingToLibrary||!themeName.trim()} className="d3-btn-primary">{savingToLibrary?'Saving…':'Save to Library'}</button></div></div></div>}
    </div>
  );
}

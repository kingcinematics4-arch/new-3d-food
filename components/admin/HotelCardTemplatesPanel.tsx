'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdminPanel, AdminButton, AdminNote, AdminField } from '@/components/admin/ui';
import {
  CARD_FIELDS, DEFAULT_FIELD_STYLE, mergeFieldLayout,
  HOTEL_CARD_FILE_ACCEPT, ACCEPTED_HOTEL_CARD_LABEL, MAX_HOTEL_CARD_BYTES,
  isAcceptableHotelCardFile,
  type CardFieldKey, type FieldLayout, type FieldStyle, type HotelCardTemplate,
} from '@/lib/hotelCardTemplate';

const FONTS = [
  { label: 'Serif (Display)', value: 'var(--font-display), Georgia, serif' },
  { label: 'Sans (Inter)', value: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'System Sans', value: 'ui-sans-serif, system-ui, sans-serif' },
];
const SAMPLE: Record<CardFieldKey, string> = {
  hotelName: 'Grand King Hotel', hotelId: 'RK49YJ117', owner: 'Jay Vare',
  email: 'kingcinematics4@gmail.com', plan: 'CUSTOM', registered: 'Oct 2, 2026', status: 'ACTIVE',
};

type Pending = { file: File; url: string; w: number; h: number; name: string };
type PreviewHotel = { id: string; name?: string|null; slug?: string|null; location?: string|null; owner_name?: string|null; email?: string|null; subscription_plan?: string|null; is_active?: boolean|null; hotel_public_id?: string|null; created_at?: string|null };

function hotelToSample(h: PreviewHotel | null): Record<CardFieldKey, string> {
  if (!h) return SAMPLE;
  const plan = String(h.subscription_plan || 'BASIC').toUpperCase().trim().replace(/^STARTER$/, 'BASIC');
  return {
    hotelName: h.name?.trim() || SAMPLE.hotelName,
    hotelId: (h.hotel_public_id || SAMPLE.hotelId).toUpperCase(),
    owner: h.owner_name?.trim() || SAMPLE.owner,
    email: h.email?.trim() || SAMPLE.email,
    plan: ['BASIC','PRO','ULTRA','CUSTOM'].includes(plan) ? plan : 'BASIC',
    registered: formatDate(h.created_at),
    status: h.is_active === false ? 'INACTIVE' : 'ACTIVE',
  };
}
function formatDate(v?: string | null) {
  if (!v) return SAMPLE.registered;
  const d = new Date(v); if (Number.isNaN(d.getTime())) return SAMPLE.registered;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HotelCardTemplatesPanel() {
  const [templates, setTemplates] = useState<HotelCardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<HotelCardTemplate | null>(null);
  const [layout, setLayout] = useState<FieldLayout>({});
  const [sel, setSel] = useState<CardFieldKey>('hotelName');
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replaceId, setReplaceId] = useState<string | null>(null);

  const [hotels, setHotels] = useState<PreviewHotel[]>([]);
  const [hotelIdx, setHotelIdx] = useState(0);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = await fetch('/api/admin/branding/hotel-cards', { cache: 'no-store' });
      let j: any = null; try { j = await r.json(); } catch { j = null; }
      if (!r.ok || !j?.success) throw new Error(j?.error || `Failed to load templates (${r.status})`);
      setTemplates(Array.isArray(j.templates) ? j.templates : []);
    } catch (e: any) { setErr(e.message || 'Failed to load templates'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/admin/branding/hotel-cards/preview-hotels', { cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        if (alive && r.ok && j?.success && Array.isArray(j.hotels)) setHotels(j.hotels);
      } catch { /* sample fallback */ }
    })();
    return () => { alive = false; };
  }, []);
  useEffect(() => () => { if (pending) URL.revokeObjectURL(pending.url); }, [pending]);

  function pickFile(file?: File | null) {
    if (!file) return;
    const check = isAcceptableHotelCardFile(file);
    if (!check.ok) { setErr(check.error); setMsg(null); return; }
    setErr(null); setMsg(null);
    if (pending) URL.revokeObjectURL(pending.url);
    const url = URL.createObjectURL(file);
    const base = { file, url, w: 1200, h: 667, name: file.name.replace(/\.[^.]+$/, '') || 'Hotel Card Template' };
    setPending(base);
    measure(file).then(d => { if (d) setPending(p => (p && p.file === file ? { ...p, w: d.w, h: d.h } : p)); });
  }

  async function savePending(activate: boolean) {
    if (!pending) return;
    setErr(null); setMsg(null); setBusy('upload');
    try {
      const form = new FormData();
      form.append('file', pending.file, pending.file.name);
      form.append('name', pending.name);
      form.append('width', String(pending.w)); form.append('height', String(pending.h));
      const r = await fetch('/api/admin/branding/hotel-cards', { method: 'POST', body: form });
      let j: any = null; try { j = await r.json(); } catch {}
      if (!r.ok || !j?.success || !j.template) throw new Error(j?.error || `Upload failed (${r.status})`);
      let t: HotelCardTemplate = j.template;
      if (activate) {
        const ar = await fetch(`/api/admin/branding/hotel-cards/${t.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'activate' }) });
        const aj = await ar.json().catch(() => ({}));
        if (ar.ok && aj?.success && aj.template) t = aj.template;
      }
      URL.revokeObjectURL(pending.url); setPending(null);
      await load();
      openEditor(t);
      setMsg(activate ? 'Template uploaded, saved, and activated. It will apply to every hotel identity card.' : 'Template uploaded and saved. Position fields in the editor, then click “Set Active”.');
    } catch (e: any) { setErr(e.message || 'Upload failed'); }
    finally { setBusy(null); if (fileRef.current) fileRef.current.value = ''; }
  }

  function openEditor(t: HotelCardTemplate) { setEditing(t); setLayout(mergeFieldLayout(t.field_layout)); setSel('hotelName'); setMsg(null); setErr(null); }

  async function saveLayout() {
    if (!editing) return;
    setBusy('save'); setErr(null); setMsg(null);
    try {
      const r = await fetch(`/api/admin/branding/hotel-cards/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ field_layout: layout }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.success) throw new Error(j?.error || 'Save failed');
      setEditing(j.template); setTemplates(ts => ts.map(x => x.id === j.template.id ? j.template : x));
      setMsg('Layout and field positions saved permanently.');
    } catch (e: any) { setErr(e.message || 'Save failed'); } finally { setBusy(null); }
  }

  async function setActive(id: string) {
    setBusy(id); setErr(null); setMsg(null);
    try {
      const r = await fetch(`/api/admin/branding/hotel-cards/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'activate' }) });
      const j = await r.json().catch(() => ({})); if (!r.ok || !j?.success) throw new Error(j?.error || 'Failed');
      await load(); setMsg('Template activated. The Hotels dashboard will show this design filled with each hotel’s own data.'); if (editing?.id===id) setEditing(j.template);
    } catch (e: any) { setErr(e.message || 'Failed'); } finally { setBusy(null); }
  }

  async function replaceTemplate(file: File) {
    if (!replaceId) return;
    setBusy(replaceId); setErr(null); setMsg(null);
    try {
      const dims = await measure(file);
      const form = new FormData(); form.append('file', file, file.name); form.append('name', file.name.replace(/\.[^.]+$/, ''));
      if (dims) { form.append('width', String(dims.w)); form.append('height', String(dims.h)); }
      const r = await fetch('/api/admin/branding/hotel-cards', { method: 'POST', body: form });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.success || !j.template) throw new Error(j?.error || 'Replace upload failed');
      // activate new if old was active, then delete old
      const old = templates.find(t => t.id === replaceId);
      let nt = j.template;
      if (old?.is_active) {
        const ar = await fetch(`/api/admin/branding/hotel-cards/${nt.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'activate' }) });
        const aj = await ar.json().catch(() => ({})); if (ar.ok && aj?.template) nt = aj.template;
      }
      await fetch(`/api/admin/branding/hotel-cards/${replaceId}`, { method: 'DELETE' });
      await load(); openEditor(nt); setMsg('Template replaced. Adjust field positions if the new design differs, then save.');
    } catch (e: any) { setErr(e.message || 'Replace failed'); }
    finally { setBusy(null); setReplaceId(null); if (replaceRef.current) replaceRef.current.value = ''; }
  }

  async function remove(id: string) {
    if (!confirm('Delete this template permanently?')) return;
    setBusy(id); setErr(null); setMsg(null);
    try {
      const r = await fetch(`/api/admin/branding/hotel-cards/${id}`, { method: 'DELETE' });
      const j = await r.json().catch(() => ({})); if (!r.ok || !j?.success) throw new Error(j?.error || 'Delete failed');
      await load(); if (editing?.id===id) setEditing(null); setMsg(j.wasActive ? 'Template deleted. Hotels page will use the default card until another is activated.' : 'Template deleted.');
    } catch (e: any) { setErr(e.message || 'Delete failed'); } finally { setBusy(null); }
  }

  const st = (layout[sel] || DEFAULT_FIELD_STYLE[sel])!;
  const setSt = (patch: Partial<typeof st>) => setLayout(l => ({ ...mergeFieldLayout(l), [sel]: { ...(l[sel] || DEFAULT_FIELD_STYLE[sel]), ...patch } }));
  const previewHotel = hotels.length ? hotels[Math.max(0, Math.min(hotelIdx, hotels.length - 1))] : null;
  const sample = hotelToSample(previewHotel);

  return (
    <AdminPanel title="Hotel Card Templates" description="Upload a luxury card design, position dynamic hotel fields once, save & activate. Every hotel card auto-fills its own data from the database.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input ref={fileRef} type="file" accept={HOTEL_CARD_FILE_ACCEPT} style={{ display: 'none' }} onChange={e => pickFile(e.target.files?.[0])} />
        <input ref={replaceRef} type="file" accept={HOTEL_CARD_FILE_ACCEPT} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) replaceTemplate(f); }} />

        {/* Drop zone + upload */}
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files?.[0]); }}
          onClick={() => !pending && fileRef.current?.click()}
          role="button" tabIndex={0}
          onKeyDown={e => { if ((e.key==='Enter'||e.key===' ') && !pending) fileRef.current?.click(); }}
          style={{ border: `1px dashed ${drag ? 'var(--gold-dim)' : 'var(--border-warm)'}`, borderRadius: 12, padding: pending ? 14 : 22, background: drag ? 'rgba(184,164,122,0.05)' : 'var(--bg-surface)', cursor: pending ? 'default' : 'pointer', textAlign: pending ? 'left' : 'center' }}
        >
          {!pending ? (
            <>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>Drag & drop a hotel card template here</div>
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-dimmed)' }}>{ACCEPTED_HOTEL_CARD_LABEL} · max {MAX_HOTEL_CARD_BYTES/(1024*1024)} MB · or click to choose a file</div>
              <div style={{ marginTop: 12 }}><AdminButton variant="primary" onClick={() => fileRef.current?.click()}>Upload Template</AdminButton></div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <img src={pending.url} alt="Template preview" style={{ width: 260, maxWidth: '100%', borderRadius: 10, border: '1px solid var(--border-warm)', background: '#0B0B0A', display: 'block' }} />
              <div style={{ flex: '1 1 220px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Preview</strong> — not saved yet. Saving uploads to storage and stores the template in the database.</div>
                <AdminField label="Template name"><input className="d3-input" value={pending.name} onChange={e => setPending(p => p ? { ...p, name: e.target.value } : p)} /></AdminField>
                <div style={{ fontSize: 12, color: 'var(--text-dimmed)' }}>{pending.file.name} · {Math.round(pending.file.size/1024)} KB · {pending.w}×{pending.h}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <AdminButton variant="primary" onClick={() => savePending(true)} disabled={busy==='upload'}>{busy==='upload'?'Saving…':'Save & Activate'}</AdminButton>
                  <AdminButton onClick={() => savePending(false)} disabled={busy==='upload'}>Save Template</AdminButton>
                  <AdminButton variant="ghost" onClick={() => { URL.revokeObjectURL(pending.url); setPending(null); }} disabled={busy==='upload'}>Discard</AdminButton>
                </div>
              </div>
            </div>
          )}
        </div>

        {err ? <Status text={err} tone="err" /> : null}
        {msg ? <Status text={msg} tone="ok" /> : null}
        {/migration 023|hotel_card_templates/i.test(err||'') ? <AdminNote tone="accent">Run <code>supabase/migrations/023_hotel_card_templates.sql</code> in the Supabase SQL Editor, then refresh this page.</AdminNote> : null}

        {loading ? <p style={{ color: 'var(--text-dimmed)', fontSize: 13 }}>Loading templates…</p> : null}
        {!loading && templates.length === 0 && !err ? <AdminNote>No templates saved yet. Upload a PNG/JPG/JPEG/SVG card design above, preview it, then Save & Activate.</AdminNote> : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {templates.map(t => (
            <div key={t.id} style={{ border: `1px solid ${t.is_active ? 'var(--gold-dim)' : 'var(--border-warm)'}`, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-surface)' }}>
              <button type="button" onClick={() => openEditor(t)} title="Open editor" style={{ display: 'block', width: '100%', padding: 0, border: 0, background: '#0B0B0A', cursor: 'pointer', aspectRatio: `${Math.max(t.width,1)}/${Math.max(t.height,1)}` }}>
                <img src={t.image_url} alt={t.name || 'Template'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
              <div style={{ padding: '10px 11px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name || 'Untitled'}</span>
                  {t.is_active ? <span style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--gold-dim)', fontWeight: 700 }}>ACTIVE</span> : null}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <AdminButton onClick={() => openEditor(t)}>Position Fields</AdminButton>
                  {!t.is_active ? <AdminButton variant="primary" onClick={() => setActive(t.id)} disabled={busy===t.id}>{busy===t.id?'…':'Set Active'}</AdminButton> : null}
                  <AdminButton onClick={() => { setReplaceId(t.id); replaceRef.current?.click(); }} disabled={!!busy}>Replace</AdminButton>
                  <AdminButton variant="danger" onClick={() => remove(t.id)} disabled={busy===t.id}>Delete</AdminButton>
                </div>
              </div>
            </div>
          ))}
        </div>

        {editing ? (
          <div style={{ borderTop: '1px solid var(--border-warm)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)', fontWeight: 600 }}>Visual Editor — {editing.name || 'Untitled'}</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {!editing.is_active ? <AdminButton onClick={() => setActive(editing.id)} disabled={!!busy}>Set Active</AdminButton> : <span style={{ alignSelf: 'center', fontSize: 11, color: 'var(--gold-dim)', fontWeight: 700, letterSpacing: '0.1em' }}>ACTIVE TEMPLATE</span>}
                <AdminButton variant="primary" onClick={saveLayout} disabled={busy==='save'}>{busy==='save'?'Saving…':'Save Layout'}</AdminButton>
                <AdminButton onClick={() => setEditing(null)}>Close</AdminButton>
              </div>
            </div>
            <AdminNote tone="accent">Drag each dynamic field on the preview (Hotel Name, Hotel ID, Owner, Email, Plan, Registration Date, Status). Adjust font/size/color/alignment. Positions are saved as percentages (responsive) and filled from the database per hotel.</AdminNote>
            {hotels.length ? (
              <AdminField label="Live preview data (actual hotel record)">
                <select className="d3-input" value={String(hotelIdx)} onChange={e => setHotelIdx(Number(e.target.value))}>
                  {hotels.map((h, i) => <option key={h.id} value={i}>{h.name || h.slug || h.id}{h.hotel_public_id ? ` — ${h.hotel_public_id}` : ''}</option>)}
                </select>
              </AdminField>
            ) : <div style={{ fontSize: 12, color: 'var(--text-dimmed)' }}>Live preview is using sample data (real hotel records will appear here when available).</div>}
            <div className="hct-ed" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,3fr) minmax(260px,1fr)', gap: 14, alignItems: 'start' }}>
              <div style={{ minWidth: 0 }}><Canvas template={editing} layout={layout} selected={sel} sample={sample} onSelect={setSel} onMove={(k,p)=>setLayout(l=>({ ...mergeFieldLayout(l), [k]: { ...(l[k] || DEFAULT_FIELD_STYLE[k]), ...p } }))} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, border: '1px solid var(--border-warm)', borderRadius: 10, background: 'var(--bg-surface)' }}>
                <AdminField label="Dynamic field"><select className="d3-input" value={sel} onChange={e=>setSel(e.target.value as CardFieldKey)}>{CARD_FIELDS.map(f=><option key={f.key} value={f.key}>{f.label}</option>)}</select></AdminField>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}><input type="checkbox" checked={st.visible!==false} onChange={e=>setSt({visible:e.target.checked})} /> Visible</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Num label="X %" v={st.x} set={v=>setSt({x:v})} /><Num label="Y %" v={st.y} set={v=>setSt({y:v})} />
                  <Num label="Width %" v={st.w} set={v=>setSt({w:v})} /><Num label="Font size" v={st.fontSize} set={v=>setSt({fontSize:v})} />
                </div>
                <AdminField label="Font family"><select className="d3-input" value={FONTS.some(f=>f.value===st.fontFamily)?st.fontFamily:'__c'} onChange={e=>{ if(e.target.value!=='__c') setSt({fontFamily:e.target.value}); }}>{FONTS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}<option value="__c">Custom (keep current)</option></select></AdminField>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <AdminField label="Color"><input className="d3-input" type="color" value={/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(st.color)?st.color:'#f5f2eb'} onChange={e=>setSt({color:e.target.value})} style={{ padding: 4, height: 38 }} /></AdminField>
                  <AdminField label="Align"><select className="d3-input" value={st.align} onChange={e=>setSt({align:e.target.value as any})}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></AdminField>
                  <Num label="Weight" v={st.fontWeight} set={v=>setSt({fontWeight:v})} step={100} /><Num label="Letter space" v={st.letterSpacing} set={v=>setSt({letterSpacing:v})} step={0.5} />
                </div>
              </div>
            </div>
            <style jsx global>{`@media(max-width:900px){.hct-ed{grid-template-columns:1fr !important;}}`}</style>
          </div>
        ) : null}
      </div>
    </AdminPanel>
  );
}

function Num({ label, v, set, step=1 }: { label: string; v: number; set: (n:number)=>void; step?: number }) {
  return <AdminField label={label}><input className="d3-input" type="number" step={step} value={Number.isFinite(v)?v:0} onChange={e=>set(Number(e.target.value))} /></AdminField>;
}
function Status({ text, tone }: { text: string; tone: 'ok'|'err' }) {
  return <div className="d3-note" style={{ borderColor: tone==='err'?'rgba(196,102,88,0.28)':'var(--border-warm)', color: tone==='err'?'#E7B4AC':'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{text}</div>;
}
function Canvas({ template, layout, selected, sample, onSelect, onMove }: { template: HotelCardTemplate; layout: FieldLayout; selected: CardFieldKey; sample: Record<CardFieldKey,string>; onSelect:(k:CardFieldKey)=>void; onMove:(k:CardFieldKey,p:Partial<FieldStyle>)=>void }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{k:CardFieldKey,ox:number,oy:number,sx:number,sy:number}|null>(null);
  const merged = mergeFieldLayout(layout);
  const onDown = (e: React.PointerEvent, k: CardFieldKey) => {
    e.preventDefault(); onSelect(k);
    const r = ref.current?.getBoundingClientRect(); if (!r) return;
    const s = merged[k]!; drag.current = { k, ox: e.clientX, oy: e.clientY, sx: s.x, sy: s.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMoveP = (e: React.PointerEvent) => {
    const d = drag.current, r = ref.current?.getBoundingClientRect(); if (!d || !r) return;
    const dx = ((e.clientX - d.ox) / r.width) * 100; const dy = ((e.clientY - d.oy) / r.height) * 100;
    onMove(d.k, { x: clamp(d.sx+dx,0,98), y: clamp(d.sy+dy,0,98) });
  };
  const up = () => { drag.current = null; };
  return (
    <div ref={ref} onPointerMove={onMoveP} onPointerUp={up} onPointerLeave={up} style={{ position: 'relative', width: '100%', aspectRatio: `${Math.max(template.width,1)}/${Math.max(template.height,1)}`, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-warm)', background: '#0B0B0A', touchAction: 'none', containerType: 'inline-size' }}>
      <img src={template.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', display: 'block', pointerEvents: 'none' }} />
      {CARD_FIELDS.map(f => {
        const s = merged[f.key]!; if (s.visible===false) return null;
        const isSel = f.key===selected;
        return (
          <div key={f.key} onPointerDown={e=>onDown(e,f.key)} style={{ position:'absolute', left:`${s.x}%`, top:`${s.y}%`, width:`${s.w}%`, cursor:'grab', padding:'2px 4px', border:isSel?'1px dashed rgba(197,164,109,0.9)':'1px dashed rgba(245,242,235,0.14)', borderRadius:4, background:isSel?'rgba(197,164,109,0.07)':'transparent', fontFamily:s.fontFamily, fontSize:`clamp(9px, ${(s.fontSize/Math.max(template.width,1))*100}cqw, ${s.fontSize}px)`, color:s.color, fontWeight:s.fontWeight, letterSpacing:`${s.letterSpacing}px`, textAlign:s.align, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', userSelect:'none' }} title={f.label}>{sample[f.key]}</div>
        );
      })}
    </div>
  );
}
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
function measure(file: File): Promise<{w:number;h:number}|null> {
  if (/svg/i.test(file.type) || /\.svg$/i.test(file.name)) return Promise.resolve({ w: 1200, h: 667 });
  return new Promise(res => { const u=URL.createObjectURL(file); const i=new Image(); i.onload=()=>{res({w:i.naturalWidth||1200,h:i.naturalHeight||667}); URL.revokeObjectURL(u);}; i.onerror=()=>{URL.revokeObjectURL(u); res(null);}; i.src=u; });
}


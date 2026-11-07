'use client';

import React from 'react';
import { formatPrice } from '@/lib/menu';
import Dine3DLogo from '@/components/Dine3DLogo';
import { cloneCustomThemeConfig, type CustomThemeConfig } from '@/lib/customTheme';
import type { MenuTemplateProps } from './types';
import type { PublicMenuItem } from '@/app/menu/[slug]/MenuContent';

interface CustomTemplateProps extends MenuTemplateProps {
  customConfig?: CustomThemeConfig | null;
}

function mix(hex: string, other: string, t: number) {
  const n = (h: string) => { const v = (h || '#000').replace('#',''); const f = v.length===3?v.split('').map(c=>c+c).join(''):v.padEnd(6,'0').slice(0,6); return [parseInt(f.slice(0,2),16),parseInt(f.slice(2,4),16),parseInt(f.slice(4,6),16)]; };
  const a=n(hex), b=n(other); const c=a.map((v,i)=>Math.round(v+(b[i]-v)*t)); return `#${c.map(v=>v.toString(16).padStart(2,'0')).join('')}`;
}
function alpha(hex: string, a: number) {
  const v=(hex||'#000').replace('#',''); const f=v.length===3?v.split('').map(c=>c+c).join(''):v.padEnd(6,'0').slice(0,6);
  return `rgba(${parseInt(f.slice(0,2),16)},${parseInt(f.slice(2,4),16)},${parseInt(f.slice(4,6),16)},${a})`;
}
function contrast(hex: string) {
  const v=(hex||'#000').replace('#',''); const f=v.length===3?v.split('').map(c=>c+c).join(''):v.padEnd(6,'0').slice(0,6);
  const r=parseInt(f.slice(0,2),16),g=parseInt(f.slice(2,4),16),b=parseInt(f.slice(4,6),16);
  return (0.2126*r+0.7152*g+0.0722*b)/255 > 0.62 ? '#111827' : '#ffffff';
}

export default function CustomTemplate(props: CustomTemplateProps) {
  const {
    hotel, currency, tableNumber, pills, selectedCategory, onSelectCategory, search, onSearchChange,
    filteredItems, featuredItems, popularItems, regularItems, cart, totalCount, totalPrice,
    onAdd, onRemove, onItemClick, onView3D, onOpenCart,
  } = props;

  const config = cloneCustomThemeConfig(props.customConfig || (hotel as any)?.custom_theme_config);
  const p = config.primaryColor;
  const cardShadow = config.shadowStrength === 'none' ? 'none' : config.shadowStrength === 'soft' ? '0 4px 14px rgba(0,0,0,0.10)' : config.shadowStrength === 'strong' ? '0 18px 48px rgba(0,0,0,0.28)' : '0 10px 28px rgba(0,0,0,0.18)';
  const cardBorder = config.borderStyle === 'none' ? '1px solid transparent' : config.borderStyle === 'accent' ? `1px solid ${alpha(p,0.55)}` : config.borderStyle === 'defined' ? `1px solid ${alpha(p,0.28)}` : `1px solid ${alpha(p,0.16)}`;
  const pad = config.spacing === 'compact' ? 12 : config.spacing === 'spacious' ? 22 : 16;
  const gap = config.spacing === 'compact' ? 12 : config.spacing === 'spacious' ? 22 : 16;
  const btnPad = config.buttonSize === 'sm' ? '0.45rem 0.7rem' : config.buttonSize === 'lg' ? '0.85rem 1.2rem' : '0.65rem 0.95rem';
  const btnFont = config.buttonSize === 'sm' ? 12 : config.buttonSize === 'lg' ? 15 : 13;

  const buttonStyle = (primary = true): React.CSSProperties => {
    const radius = config.buttonStyle === 'pill' ? '9999px' : config.buttonRadius;
    const base: React.CSSProperties = { borderRadius: radius, padding: btnPad, fontSize: btnFont, fontWeight: config.typography.buttonTextWeight as any, fontFamily: config.priceFont, cursor: 'pointer', transition: 'all 180ms ease' };
    if (!primary) return { ...base, border: `1px solid ${alpha(p,0.35)}`, background: 'transparent', color: p };
    if (config.buttonStyle === 'outline') return { ...base, border: `1px solid ${p}`, background: 'transparent', color: p };
    if (config.buttonStyle === 'soft') return { ...base, border: `1px solid ${alpha(p,0.22)}`, background: alpha(p,0.14), color: p };
    return { ...base, border: `1px solid ${p}`, background: p, color: contrast(p) };
  };

  const cardBase = (): React.CSSProperties => ({
    backgroundColor: config.cardStyle === 'glassmorphic' ? alpha(config.cardBg, 0.72) : config.cardBg,
    color: config.textColor,
    borderRadius: config.borderRadius,
    border: config.cardStyle === 'bordered' ? `1px solid ${alpha(p,0.45)}` : config.cardStyle === 'glassmorphic' ? `1px solid ${alpha('#fff',0.14)}` : cardBorder,
    boxShadow: config.cardStyle === 'elevated' || config.shadowStrength !== 'none' ? cardShadow : 'none',
    backdropFilter: config.cardStyle === 'glassmorphic' ? 'blur(16px)' : undefined,
    WebkitBackdropFilter: config.cardStyle === 'glassmorphic' ? 'blur(16px)' : undefined,
    fontFamily: config.bodyFont,
  });

  const badgeStyle = (filled = false): React.CSSProperties => {
    const base: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.2rem 0.55rem', borderRadius: config.badgeRadius, fontSize: 11, fontWeight: 600, letterSpacing: '0.02em' };
    if (config.badgeStyle === 'solid' || filled) return { ...base, background: p, color: contrast(p), border: `1px solid ${p}` };
    if (config.badgeStyle === 'outline') return { ...base, background: 'transparent', color: p, border: `1px solid ${alpha(p,0.45)}` };
    return { ...base, background: alpha(p,0.14), color: p, border: `1px solid ${alpha(p,0.18)}` };
  };

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: config.pageBg, color: config.textColor, fontFamily: config.bodyFont, fontSize: config.typography.bodySize, fontWeight: config.typography.bodyWeight as any }}>
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b px-4 py-3" style={{ backgroundColor: alpha(config.pageBg, 0.88), borderColor: alpha(p, 0.14) }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {hotel.logo_url?.trim() ? (
              <img src={hotel.logo_url ?? undefined} alt={hotel.name} className="w-9 h-9 object-cover border flex-shrink-0" style={{ borderColor: alpha(p,0.35), borderRadius: config.imageRadius }} />
            ) : (
              <div className="w-9 h-9 border flex items-center justify-center flex-shrink-0" style={{ borderColor: alpha(p,0.35), backgroundColor: config.cardBg, borderRadius: config.imageRadius }}>
                <Dine3DLogo size="xs" href={null} />
              </div>
            )}
            <div className="min-w-0">
              <span style={{ color: p, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>{tableNumber ? `Table ${tableNumber}` : 'Menu'}</span>
              <h1 style={{ fontFamily: config.headingFont, fontSize: Math.max(15, config.typography.headingSize - 2), fontWeight: config.typography.headingWeight as any, color: config.textColor, margin: 0, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hotel.name}</h1>
            </div>
          </div>
          <button onClick={onOpenCart} style={buttonStyle(true)} className="flex items-center gap-1.5 whitespace-nowrap">
            <span>Cart</span>{totalCount > 0 ? <span>({totalCount})</span> : null}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
        <div className="relative mb-3">
          <input type="text" value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search dishes..." className="w-full pl-9 pr-4 py-2 border outline-none"
            style={{ backgroundColor: config.cardBg, color: config.textColor, borderColor: alpha(p,0.22), borderRadius: config.buttonRadius, fontFamily: config.bodyFont, fontSize: config.typography.bodySize }} />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke={p} strokeWidth="1.5"><circle cx="6" cy="6" r="4.5" /><path d="M9.5 9.5L12.5 12.5" strokeLinecap="round" /></svg>
        </div>
        {pills.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {pills.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button key={cat} onClick={() => onSelectCategory(cat)} style={{ borderRadius: config.buttonStyle === 'pill' ? '9999px' : config.buttonRadius, backgroundColor: active ? p : config.cardBg, color: active ? contrast(p) : config.textColor, border: `1px solid ${active ? p : alpha(p,0.22)}`, padding: '0.45rem 0.85rem', fontSize: Math.max(12, config.typography.bodySize - 1), fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer' }}>{cat}</button>
              );
            })}
          </div>
        )}
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6" style={{ display: 'flex', flexDirection: 'column', gap: config.spacing === 'compact' ? 20 : config.spacing === 'spacious' ? 40 : 28 }}>
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center" style={{ color: config.mutedTextColor }}><p>No dishes match your search.</p></div>
        ) : (
          <>
            {featuredItems.length > 0 && <Section title="Chef's Featured" p={p} config={config} layout={config.menuLayout} gap={gap}>{featuredItems.map((item) => <CustomDishCard key={item.id} item={item} currency={currency} cart={cart} config={config} cardStyles={cardBase()} buttonStyles={buttonStyle()} badge={badgeStyle()} onAdd={onAdd} onRemove={onRemove} onItemClick={onItemClick} onView3D={onView3D} />)}</Section>}
            {popularItems.length > 0 && <Section title="Most Popular" p={p} config={config} layout={config.menuLayout} gap={gap}>{popularItems.map((item) => <CustomDishCard key={item.id} item={item} currency={currency} cart={cart} config={config} cardStyles={cardBase()} buttonStyles={buttonStyle()} badge={badgeStyle()} onAdd={onAdd} onRemove={onRemove} onItemClick={onItemClick} onView3D={onView3D} />)}</Section>}
            {regularItems.length > 0 && <Section title={featuredItems.length || popularItems.length ? 'All Dishes' : 'Menu'} p={p} config={config} layout={config.menuLayout} gap={gap}>{regularItems.map((item) => <CustomDishCard key={item.id} item={item} currency={currency} cart={cart} config={config} cardStyles={cardBase()} buttonStyles={buttonStyle()} badge={badgeStyle()} onAdd={onAdd} onRemove={onRemove} onItemClick={onItemClick} onView3D={onView3D} />)}</Section>}
          </>
        )}
      </main>
    </div>
  );
}

function Section({ title, p, config, layout, gap, children }: { title: string; p: string; config: CustomThemeConfig; layout: CustomThemeConfig['menuLayout']; gap: number; children: React.ReactNode }) {
  const cls = layout === 'compact-list' || layout === 'editorial' ? undefined : layout === 'cards' ? 'grid grid-cols-1' : 'grid grid-cols-1 sm:grid-cols-2';
  const style: React.CSSProperties = { gap, ...(layout === 'compact-list' || layout === 'editorial' ? { display: 'flex', flexDirection: 'column' } : {}) };
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: p, flexShrink: 0 }} />
        <h2 style={{ fontFamily: config.headingFont, fontSize: config.typography.headingSize, fontWeight: config.typography.headingWeight as any, color: config.textColor, margin: 0 }}>{title}</h2>
      </div>
      <div className={cls} style={style}>{children}</div>
    </section>
  );
}

function CustomDishCard({
  item, currency, cart, config, cardStyles, buttonStyles, badge, onAdd, onRemove, onItemClick, onView3D,
}: {
  item: PublicMenuItem; currency: string | null; cart: { menuItem: PublicMenuItem; quantity: number }[]; config: CustomThemeConfig;
  cardStyles: React.CSSProperties; buttonStyles: React.CSSProperties; badge: React.CSSProperties;
  onAdd: (item: PublicMenuItem) => void; onRemove: (id: string) => void; onItemClick: (item: PublicMenuItem) => void; onView3D: (item: PublicMenuItem) => void;
}) {
  const inCart = cart.find((c) => c.menuItem.id === item.id);
  const has3D = Boolean(item.model_url_glb?.trim());
  const image = item.image_url?.trim() || '';
  const p = config.primaryColor;
  const pad = config.spacing === 'compact' ? 12 : config.spacing === 'spacious' ? 20 : 16;
  const imgRadius = config.imageRadius;

  if (config.menuLayout === 'compact-list') {
    return (
      <div onClick={() => onItemClick(item)} style={{ ...cardStyles, padding: pad, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
        <div style={{ width: 84, height: 84, flexShrink: 0, overflow: 'hidden', borderRadius: imgRadius, background: alpha(p,0.08), position: 'relative' }}>
          {image ? <img src={image} alt={item.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.mutedTextColor, fontSize: 11 }}>Dish</div>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: item.is_veg ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
            <h3 style={{ margin: 0, fontFamily: config.headingFont, fontSize: Math.max(14, config.typography.headingSize - 2), fontWeight: config.typography.headingWeight as any, color: config.textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h3>
          </div>
          {item.description ? <p style={{ margin: '0 0 6px', fontSize: Math.max(12, config.typography.bodySize - 1), color: config.mutedTextColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</p> : null}
          <span style={{ fontFamily: config.priceFont, fontSize: config.typography.priceSize, fontWeight: 700, color: p }}>{formatPrice(Number(item.price) || 0, currency)}</span>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          {inCart ? <Qty p={p} config={config} qty={inCart.quantity} onMinus={() => onRemove(item.id)} onPlus={() => onAdd(item)} /> : <button onClick={() => onAdd(item)} style={buttonStyles}>Add</button>}
        </div>
      </div>
    );
  }

  const imageHeight = config.menuLayout === 'cards' ? 280 : config.menuLayout === 'editorial' ? 240 : 200;
  return (
    <div onClick={() => onItemClick(item)} style={{ ...cardStyles, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
      <div style={{ position: 'relative', width: '100%', height: imageHeight, background: alpha(p,0.06) }}>
        {image ? <img src={image} alt={item.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: `${imgRadius} ${imgRadius} 0 0` }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.mutedTextColor }}>No photo</div>}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          <span style={badge}><span style={{ width: 6, height: 6, borderRadius: 2, background: item.is_veg ? '#22c55e' : '#ef4444' }} />{item.is_veg ? 'Veg' : 'Non-veg'}</span>
          {item.is_featured ? <span style={{ ...badge, background: p, color: contrast(p), borderColor: p }}>Featured</span> : null}
        </div>
        {has3D ? <button onClick={(e) => { e.stopPropagation(); onView3D(item); }} style={{ position: 'absolute', top: 10, right: 10, ...badge, cursor: 'pointer' }}>3D</button> : null}
      </div>
      <div style={{ padding: pad, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontFamily: config.headingFont, fontSize: config.typography.headingSize, fontWeight: config.typography.headingWeight as any, color: config.textColor, lineHeight: 1.2 }}>{item.name}</h3>
          <span style={{ fontFamily: config.priceFont, fontSize: config.typography.priceSize, fontWeight: 700, color: p, whiteSpace: 'nowrap' }}>{formatPrice(Number(item.price) || 0, currency)}</span>
        </div>
        {item.description ? <p style={{ margin: '0 0 12px', color: config.mutedTextColor, fontSize: Math.max(12, config.typography.bodySize - 1), lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{item.description}</p> : null}
        <div style={{ display: 'flex', gap: 10, fontSize: 11, color: config.mutedTextColor, marginBottom: 14 }}>
          {item.calories ? <span>{item.calories} kcal</span> : null}
          {item.preparation_time_mins ? <span>{item.preparation_time_mins} min</span> : null}
          {Number(item.rating) > 0 ? <span>★ {Number(item.rating).toFixed(1)}</span> : null}
        </div>
        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 'auto' }}>
          {inCart ? <Qty p={p} config={config} qty={inCart.quantity} onMinus={() => onRemove(item.id)} onPlus={() => onAdd(item)} full /> : <button onClick={() => onAdd(item)} style={{ ...buttonStyles, width: '100%' }}>Add to order</button>}
        </div>
      </div>
    </div>
  );
}

function Qty({ p, config, qty, onMinus, onPlus, full }: { p: string; config: CustomThemeConfig; qty: number; onMinus: () => void; onPlus: () => void; full?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: full ? '100%' : undefined, border: `1px solid ${alpha(p,0.4)}`, borderRadius: config.buttonRadius, padding: '0.35rem 0.6rem', gap: 10 }}>
      <button onClick={onMinus} style={{ background: 'transparent', border: 'none', color: p, cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>−</button>
      <span style={{ fontSize: 13, fontWeight: 700, color: config.textColor }}>{full ? `${qty} in order` : qty}</span>
      <button onClick={onPlus} style={{ background: 'transparent', border: 'none', color: p, cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>+</button>
    </div>
  );
}

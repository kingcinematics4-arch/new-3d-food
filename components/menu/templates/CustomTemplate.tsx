'use client';

import React from 'react';
import { formatPrice } from '@/lib/menu';
import DinePixelLogo from '@/components/DinePixelLogo';
import { cloneCustomThemeConfig, fontCssFamily, type CustomThemeConfig } from '@/lib/customTheme';
import type { MenuTemplateProps, CartItem, PublicMenuItemSize } from './types';
import type { PublicMenuItem } from '@/app/menu/[slug]/MenuContent';

interface CustomTemplateProps extends MenuTemplateProps {
  customConfig?: CustomThemeConfig | null;
  /** When true, render only the first card of the first non-empty section (used by theme editor preview). */
  /** Embedded in a fixed-height scroll viewport (theme editor preview): natural content height, non-sticky header, full scroll. */
  embeddedViewport?: boolean;
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
    filteredItems, featuredItems, popularItems, regularItems, cart,
    onAdd, onRemove, onItemClick, onView3D, onOpenWater, onOpenWaiter, embeddedViewport,
  } = props;

  const config = cloneCustomThemeConfig(props.customConfig || (hotel as any)?.custom_theme_config);
  const p = config.primaryColor;
  const cardShadow = config.shadowStrength === 'none' ? 'none' : config.shadowStrength === 'soft' ? '0 4px 14px rgba(0,0,0,0.10)' : config.shadowStrength === 'strong' ? '0 18px 48px rgba(0,0,0,0.28)' : '0 10px 28px rgba(0,0,0,0.18)';
  const cardBorder = config.borderStyle === 'none' ? '1px solid transparent' : config.borderStyle === 'accent' ? `1px solid ${alpha(p,0.55)}` : config.borderStyle === 'defined' ? `1px solid ${alpha(p,0.28)}` : `1px solid ${alpha(p,0.16)}`;
  const pad = config.spacing === 'compact' ? 12 : config.spacing === 'spacious' ? 22 : 14;
  const gap = config.spacing === 'compact' ? 12 : config.spacing === 'spacious' ? 22 : 14;
  const headingFamily = fontCssFamily(config.headingFont);
  const bodyFamily = fontCssFamily(config.bodyFont);
  const priceFamily = fontCssFamily(config.priceFont);
  const btnPad = config.buttonSize === 'sm' ? '0.45rem 0.7rem' : config.buttonSize === 'lg' ? '0.85rem 1.2rem' : '0.65rem 0.95rem';
  const btnFont = config.buttonSize === 'sm' ? 12 : config.buttonSize === 'lg' ? 15 : 13;

  const buttonStyle = (primary = true): React.CSSProperties => {
    const radius = config.buttonStyle === 'pill' ? '9999px' : config.buttonRadius;
    const base: React.CSSProperties = { borderRadius: radius, padding: btnPad, fontSize: btnFont, fontWeight: config.typography.buttonTextWeight as any, fontFamily: priceFamily, cursor: 'pointer', transition: 'all 180ms ease' };
    if (!primary) return { ...base, border: `1px solid ${alpha(p,0.35)}`, background: 'transparent', color: config.navTextColor || p };
    if (config.buttonStyle === 'outline') return { ...base, border: `1px solid ${p}`, background: 'transparent', color: p };
    if (config.buttonStyle === 'soft') return { ...base, border: `1px solid ${alpha(p,0.28)}`, background: alpha(p,0.16), color: config.buttonTextColor || p };
    return { ...base, border: `1px solid ${p}`, background: p, color: config.buttonTextColor || contrast(p) };
  };

  const cardBase = (): React.CSSProperties => ({
    backgroundColor: config.cardStyle === 'glassmorphic' ? alpha(config.cardBg, 0.72) : config.cardBg,
    color: config.bodyTextColor || config.textColor,
    borderRadius: config.borderRadius,
    border: config.cardStyle === 'bordered' ? `1px solid ${alpha(p,0.45)}` : config.cardStyle === 'glassmorphic' ? `1px solid ${alpha('#fff',0.14)}` : cardBorder,
    boxShadow: config.cardStyle === 'elevated' || config.shadowStrength !== 'none' ? cardShadow : 'none',
    backdropFilter: config.cardStyle === 'glassmorphic' ? 'blur(16px)' : undefined,
    WebkitBackdropFilter: config.cardStyle === 'glassmorphic' ? 'blur(16px)' : undefined,
    fontFamily: bodyFamily,
  });

  const badgeStyle = (filled = false): React.CSSProperties => {
    const base: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.2rem 0.55rem', borderRadius: config.badgeRadius, fontSize: 11, fontWeight: 600, letterSpacing: '0.02em' };
    if (config.badgeStyle === 'solid' || filled) return { ...base, background: p, color: contrast(p), border: `1px solid ${p}` };
    if (config.badgeStyle === 'outline') return { ...base, background: 'transparent', color: p, border: `1px solid ${alpha(p,0.45)}` };
    return { ...base, background: alpha(p,0.14), color: p, border: `1px solid ${alpha(p,0.18)}` };
  };

  return (
    <div
      className={embeddedViewport ? 'w-full transition-colors duration-200' : 'min-h-screen transition-colors duration-200'}
      style={{
        backgroundColor: config.pageBg,
        color: config.bodyTextColor || config.textColor,
        fontFamily: bodyFamily,
        fontSize: config.typography.bodySize,
        fontWeight: config.typography.bodyWeight as any,
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
      }}
    >
      <header
        className={embeddedViewport ? 'relative z-30 w-full backdrop-blur-xl border-b' : 'sticky top-0 z-30 w-full backdrop-blur-xl border-b'}
        style={{ backgroundColor: alpha(config.pageBg, 0.88), borderColor: alpha(p, 0.14), boxSizing: 'border-box', padding: embeddedViewport ? '8px 10px' : '10px 12px', width: '100%', maxWidth: '100%', minWidth: 0 }}
      >
        <div className="flex w-full max-w-full items-center gap-2" style={{ boxSizing: 'border-box', minWidth: 0 }}>
          <div className="flex min-w-0 flex-1 items-center gap-2" style={{ boxSizing: 'border-box', overflow: 'hidden' }}>
            <div className="flex flex-shrink-0 items-center" title="DinePixel" style={{ minWidth: 0 }}>
              <DinePixelLogo size="xs" href={null} />
            </div>
            {hotel.logo_url?.trim() ? (
              <img
                src={hotel.logo_url ?? undefined}
                alt={hotel.name}
                className="flex-shrink-0 border object-cover"
                style={{ width: embeddedViewport ? 32 : 34, height: embeddedViewport ? 32 : 34, borderColor: alpha(p, 0.35), borderRadius: config.imageRadius, boxSizing: 'border-box' }}
              />
            ) : null}
            <div className="min-w-0 flex-1" style={{ boxSizing: 'border-box', overflow: 'hidden' }}>
              <span style={{ color: config.navTextColor || config.secondaryTextColor || p, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tableNumber ? `Table ${tableNumber}` : 'MENU'}</span>
              <h1
                title={hotel.name}
                style={{
                  fontFamily: headingFamily,
                  fontSize: Math.max(13, config.typography.headingSize - (embeddedViewport ? 5 : 4)),
                  color: config.headingColor || config.textColor,
                  fontWeight: config.typography.headingWeight as any,
                  margin: 0,
                  lineHeight: 1.15,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {hotel.name}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className={`mx-auto w-full ${embeddedViewport ? 'max-w-full px-2.5 pt-2.5 pb-1.5' : 'max-w-4xl px-3 pt-3 pb-2 sm:px-4'}`} style={{ boxSizing: 'border-box', minWidth: 0, overflowX: 'hidden' }}>
        <div className="relative" style={{ boxSizing: 'border-box', marginBottom: embeddedViewport ? 10 : 12, width: '100%', minWidth: 0 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search dishes..."
            className="w-full border outline-none"
            style={{ backgroundColor: config.cardBg, color: config.bodyTextColor || config.textColor, borderColor: alpha(p, 0.22), borderRadius: config.buttonRadius, fontFamily: bodyFamily, fontSize: embeddedViewport ? Math.max(12, config.typography.bodySize - 1) : config.typography.bodySize, boxSizing: 'border-box', width: '100%', maxWidth: '100%', minWidth: 0, display: 'block', padding: embeddedViewport ? '8px 10px 8px 34px' : '8px 12px 8px 36px' }}
          />
          <svg className="pointer-events-none absolute top-1/2 -translate-y-1/2" style={{ left: embeddedViewport ? 10 : 12, width: 14, height: 14 }} viewBox="0 0 14 14" fill="none" stroke={p} strokeWidth="1.5"><circle cx="6" cy="6" r="4.5" /><path d="M9.5 9.5L12.5 12.5" strokeLinecap="round" /></svg>
        </div>

        {/* Water & Call Waiter action row */}
        <div className="flex justify-center gap-[10px] mt-[8px]" style={{ boxSizing: 'border-box', width: '100%', maxWidth: '100%', minWidth: 0 }}>
          <button
            type="button"
            onClick={onOpenWater}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '0 14px', borderRadius: '20px', height: '38px', minHeight: '38px',
              border: `1px solid ${alpha(p, 0.35)}`, backgroundColor: alpha(p, 0.12), color: p,
              fontSize: '14px', fontWeight: 500, lineHeight: 1, whiteSpace: 'nowrap', cursor: 'pointer',
              transition: 'all 180ms ease', boxSizing: 'border-box',
              WebkitAppearance: 'none', appearance: 'none',
            }}
          >
            <span style={{fontSize: '16px', lineHeight: 1}}>💧</span> Water
          </button>
          <button
            type="button"
            onClick={onOpenWaiter}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '0 14px', borderRadius: '20px', height: '38px', minHeight: '38px',
              border: `1px solid ${p}`, backgroundColor: p, color: contrast(p),
              fontSize: '14px', fontWeight: 500, lineHeight: 1, whiteSpace: 'nowrap', cursor: 'pointer',
              transition: 'all 180ms ease', boxSizing: 'border-box',
              WebkitAppearance: 'none', appearance: 'none',
            }}
          >
            <span style={{fontSize: '16px', lineHeight: 1}}>🔔</span> Call Waiter
          </button>
        </div>
{pills.length > 1 && (
          <div
            className="no-scrollbar flex items-center overflow-y-hidden overflow-x-auto py-[4px]"
            style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain', boxSizing: 'border-box', width: '100%', maxWidth: '100%', minWidth: 0, gap: embeddedViewport ? 4 : 5 }}
          >
            {pills.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  style={{ flexShrink: 0, borderRadius: '20px', backgroundColor: active ? p : config.cardBg, color: active ? contrast(p) : config.textColor, border: `1px solid ${active ? p : alpha(p, 0.22)}`, padding: '0 15px', height: '34px', minHeight: '34px', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', boxSizing: 'border-box', WebkitAppearance: 'none', appearance: 'none' }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <main
        className={`mx-auto w-full ${embeddedViewport ? 'max-w-full px-2.5 py-3' : 'max-w-4xl px-3 py-4 sm:px-4'}`}
        style={{ display: 'flex', flexDirection: 'column', gap: embeddedViewport ? (config.spacing === 'compact' ? 14 : config.spacing === 'spacious' ? 26 : 18) : (config.spacing === 'compact' ? 20 : config.spacing === 'spacious' ? 40 : 28), paddingBottom: embeddedViewport ? 32 : 24, boxSizing: 'border-box', minWidth: 0 }}
      >
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center" style={{ color: config.secondaryTextColor || config.mutedTextColor }}><p>No dishes match your search.</p></div>
        ) : (
          <>
            {featuredItems.length > 0 && <Section title="Chef's Featured" p={p} config={config} layout={config.menuLayout} gap={gap} embeddedViewport={embeddedViewport} headingFamily={headingFamily}>{featuredItems.map((item) => <CustomDishCard key={item.id} item={item} currency={currency} cart={cart} config={config} cardStyles={cardBase()} buttonStyles={buttonStyle()} badge={badgeStyle()} onAdd={onAdd} onRemove={onRemove} onItemClick={onItemClick} onView3D={onView3D} embeddedViewport={embeddedViewport} headingFamily={headingFamily} priceFamily={priceFamily} />)}</Section>}
            {popularItems.length > 0 && <Section title="Most Popular" p={p} config={config} layout={config.menuLayout} gap={gap} embeddedViewport={embeddedViewport} headingFamily={headingFamily}>{popularItems.map((item) => <CustomDishCard key={item.id} item={item} currency={currency} cart={cart} config={config} cardStyles={cardBase()} buttonStyles={buttonStyle()} badge={badgeStyle()} onAdd={onAdd} onRemove={onRemove} onItemClick={onItemClick} onView3D={onView3D} embeddedViewport={embeddedViewport} headingFamily={headingFamily} priceFamily={priceFamily} />)}</Section>}
            {regularItems.length > 0 && <Section title={featuredItems.length || popularItems.length ? 'All Dishes' : 'Menu'} p={p} config={config} layout={config.menuLayout} gap={gap} embeddedViewport={embeddedViewport} headingFamily={headingFamily}>{regularItems.map((item) => <CustomDishCard key={item.id} item={item} currency={currency} cart={cart} config={config} cardStyles={cardBase()} buttonStyles={buttonStyle()} badge={badgeStyle()} onAdd={onAdd} onRemove={onRemove} onItemClick={onItemClick} onView3D={onView3D} embeddedViewport={embeddedViewport} headingFamily={headingFamily} priceFamily={priceFamily} />)}</Section>}
          </>
        )}
      </main>
    </div>
  );
}

function Section({ title, p, config, layout, gap, children, embeddedViewport, headingFamily }: { title: string; p: string; config: CustomThemeConfig; layout: CustomThemeConfig['menuLayout']; gap: number; children: React.ReactNode; embeddedViewport?: boolean; headingFamily: string }) {
  const useTwoCol = !embeddedViewport && layout !== 'compact-list' && layout !== 'editorial' && layout !== 'cards';
  const cls = layout === 'compact-list' || layout === 'editorial' ? undefined : layout === 'cards' || !useTwoCol ? 'grid grid-cols-1' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  const style: React.CSSProperties = { gap, ...(layout === 'compact-list' || layout === 'editorial' ? { display: 'flex', flexDirection: 'column' } : {}), boxSizing: 'border-box', minWidth: 0, width: '100%' };
  return (
    <section style={{ boxSizing: 'border-box', minWidth: 0, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: embeddedViewport ? 10 : 14, minWidth: 0 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: p, flexShrink: 0 }} />
        <h2 style={{ fontFamily: headingFamily, fontSize: Math.max(15, config.typography.headingSize - (embeddedViewport ? 2 : 1)), fontWeight: config.typography.headingWeight as any, color: config.bodyTextColor || config.textColor, margin: 0, lineHeight: 1.2, overflowWrap: 'break-word', minWidth: 0 }}>{title}</h2>
      </div>
      <div className={cls} style={style}>{children}</div>
    </section>
  );
}

function CustomDishCard({
  item, currency, cart, config, cardStyles, buttonStyles, badge, onAdd, onRemove, onItemClick, onView3D, embeddedViewport, headingFamily, priceFamily,
}: {
  item: PublicMenuItem; currency: string | null; cart: CartItem[]; config: CustomThemeConfig;
  cardStyles: React.CSSProperties; buttonStyles: React.CSSProperties; badge: React.CSSProperties;
  onAdd: (item: PublicMenuItem, qty?: number, notes?: string, size?: PublicMenuItemSize | null, sizePrice?: number) => void; onRemove: (itemId: string, sizeId: string | null) => void; onItemClick: (item: PublicMenuItem) => void; onView3D: (item: PublicMenuItem) => void; embeddedViewport?: boolean; headingFamily: string; priceFamily: string;
}) {
  const inCartItems = cart.filter((c) => c.menuItem.id === item.id);
  const inCartQty = inCartItems.reduce((sum, c) => sum + c.quantity, 0);
  const inCart = inCartItems.length > 0 ? inCartItems[0] : undefined;
  const inCartSize = inCart?.size?.id || null;
  const has3D = Boolean(item.model_url_glb?.trim());
  const image = item.image_url?.trim() || '';
  const p = config.primaryColor;
  const pad = embeddedViewport ? (config.spacing === 'compact' ? 10 : config.spacing === 'spacious' ? 16 : 12) : (config.spacing === 'compact' ? 12 : config.spacing === 'spacious' ? 20 : 16);
  const imgRadius = config.imageRadius;

  if (config.menuLayout === 'compact-list') {
    return (
      <div onClick={() => onItemClick(item)} style={{ ...cardStyles, padding: pad, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
        <div style={{ width: 84, height: 84, flexShrink: 0, overflow: 'hidden', borderRadius: imgRadius, background: alpha(p,0.08), position: 'relative' }}>
          {image ? <img src={image} alt={item.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.secondaryTextColor || config.mutedTextColor, fontSize: 11 }}>Dish</div>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: item.is_veg ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
            <h3 style={{ margin: 0, fontFamily: headingFamily, fontSize: Math.max(14, config.typography.headingSize - 2), fontWeight: config.typography.headingWeight as any, color: config.bodyTextColor || config.textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h3>
          </div>
          {item.description ? <p style={{ margin: '0 0 6px', fontSize: Math.max(12, config.typography.bodySize - 1), color: config.secondaryTextColor || config.mutedTextColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</p> : null}
          <span style={{ fontFamily: priceFamily, fontSize: config.typography.priceSize, fontWeight: 700, color: p }}>{formatPrice(Number(item.price) || 0, currency)}</span>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          {inCartQty > 0 ? <Qty p={p} config={config} qty={inCartQty} onMinus={() => onRemove(item.id, inCartSize)} onPlus={() => onAdd(item)} /> : <button onClick={() => onAdd(item)} style={buttonStyles}>Add</button>}
        </div>
      </div>
    );
  }

  const imageHeight = embeddedViewport
    ? (config.menuLayout === 'cards' ? 210 : config.menuLayout === 'editorial' ? 190 : 170)
    : (config.menuLayout === 'cards' ? 260 : config.menuLayout === 'editorial' ? 220 : 180);
  const addPad = embeddedViewport ? '0.52rem 0.75rem' : (config.buttonSize === 'sm' ? '0.45rem 0.7rem' : config.buttonSize === 'lg' ? '0.85rem 1.2rem' : '0.65rem 0.95rem');
  const addFont = embeddedViewport ? 12 : (config.buttonSize === 'sm' ? 12 : config.buttonSize === 'lg' ? 15 : 13);
  return (
    <div onClick={() => onItemClick(item)} style={{ ...cardStyles, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', boxSizing: 'border-box', width: '100%', minWidth: 0, maxWidth: '100%' }}>
      <div style={{ position: 'relative', width: '100%', height: imageHeight, background: alpha(p,0.06), boxSizing: 'border-box', overflow: 'hidden' }}>
        {image ? <img src={image} alt={item.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: `${imgRadius} ${imgRadius} 0 0` }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.secondaryTextColor || config.mutedTextColor }}>No photo</div>}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 'calc(100% - 16px)', boxSizing: 'border-box' }}>
          <span style={{ ...badge, fontSize: embeddedViewport ? 10 : 11, padding: embeddedViewport ? '0.16rem 0.45rem' : badge.padding }}><span style={{ width: 6, height: 6, borderRadius: 2, background: item.is_veg ? '#22c55e' : '#ef4444' }} />{item.is_veg ? 'Veg' : 'Non-veg'}</span>
          {item.is_featured ? <span style={{ ...badge, fontSize: embeddedViewport ? 10 : 11, padding: embeddedViewport ? '0.16rem 0.45rem' : badge.padding, background: p, color: contrast(p), borderColor: p }}>Featured</span> : null}
        </div>
        {has3D ? <button type="button" onClick={(e) => { e.stopPropagation(); onView3D(item); }} style={{ position: 'absolute', top: 8, right: 8, ...badge, fontSize: embeddedViewport ? 10 : 11, padding: embeddedViewport ? '0.16rem 0.45rem' : badge.padding, cursor: 'pointer' }}>3D</button> : null}
      </div>
      <div style={{ padding: pad, display: 'flex', flexDirection: 'column', flex: 1, boxSizing: 'border-box', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6, minWidth: 0 }}>
          <h3 style={{ margin: 0, minWidth: 0, fontFamily: headingFamily, fontSize: Math.max(14, config.typography.headingSize - (embeddedViewport ? 2 : 0)), fontWeight: config.typography.headingWeight as any, color: config.bodyTextColor || config.textColor, lineHeight: 1.2, overflowWrap: 'break-word' }}>{item.name}</h3>
          <span style={{ fontFamily: priceFamily, fontSize: Math.max(13, config.typography.priceSize - (embeddedViewport ? 1 : 0)), fontWeight: 700, color: p, whiteSpace: 'nowrap', flexShrink: 0 }}>{formatPrice(Number(item.price) || 0, currency)}</span>
        </div>
        {item.description ? <p style={{ margin: embeddedViewport ? '0 0 10px' : '0 0 12px', color: config.secondaryTextColor || config.mutedTextColor, fontSize: Math.max(11, config.typography.bodySize - (embeddedViewport ? 2 : 1)), lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{item.description}</p> : null}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: embeddedViewport ? 8 : 10, fontSize: 11, color: config.secondaryTextColor || config.mutedTextColor, marginBottom: embeddedViewport ? 10 : 14 }}>
          {item.calories ? <span>{item.calories} kcal</span> : null}
          {item.preparation_time_mins ? <span>{item.preparation_time_mins} min</span> : null}
          {Number(item.rating) > 0 ? <span>★ {Number(item.rating).toFixed(1)}</span> : null}
        </div>
        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 'auto' }}>
          {inCartQty > 0 ? <Qty p={p} config={config} qty={inCartQty} onMinus={() => onRemove(item.id, inCartSize)} onPlus={() => onAdd(item)} full embeddedViewport={embeddedViewport} /> : <button type="button" onClick={() => onAdd(item)} style={{ ...buttonStyles, width: '100%', boxSizing: 'border-box', padding: addPad, fontSize: addFont }}>Add to order</button>}
        </div>
      </div>
    </div>
  );
}

function Qty({ p, config, qty, onMinus, onPlus, full, embeddedViewport }: { p: string; config: CustomThemeConfig; qty: number; onMinus: () => void; onPlus: () => void; full?: boolean; embeddedViewport?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: full ? '100%' : undefined, border: `1px solid ${alpha(p,0.4)}`, borderRadius: config.buttonRadius, padding: embeddedViewport ? '0.3rem 0.5rem' : '0.35rem 0.6rem', gap: 10, boxSizing: 'border-box' }}>
      <button type="button" onClick={onMinus} style={{ background: 'transparent', border: 'none', color: p, cursor: 'pointer', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>−</button>
      <span style={{ fontSize: embeddedViewport ? 12 : 13, fontWeight: 700, color: config.textColor }}>{full ? `${qty} in order` : qty}</span>
      <button type="button" onClick={onPlus} style={{ background: 'transparent', border: 'none', color: p, cursor: 'pointer', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>+</button>
    </div>
  );
}

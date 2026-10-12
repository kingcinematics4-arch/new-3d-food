'use client';

import React from 'react';
import { formatPrice } from '@/lib/menu';
import Dine3DLogo from '@/components/Dine3DLogo';
import { CustomThemeConfig, DEFAULT_CUSTOM_THEME } from '@/lib/customTheme';
import type { MenuTemplateProps } from './types';
import type { PublicMenuItem } from '@/app/menu/[slug]/MenuContent';

interface CustomTemplateProps extends MenuTemplateProps {
  customConfig?: CustomThemeConfig | null;
}

export default function CustomTemplate(props: CustomTemplateProps) {
  const {
    hotel,
    currency,
    tableNumber,
    pills,
    selectedCategory,
    onSelectCategory,
    search,
    onSearchChange,
    filteredItems,
    featuredItems,
    popularItems,
    regularItems,
    cart,
    totalCount,
    totalPrice,
    onAdd,
    onRemove,
    onItemClick,
    onView3D,
    onOpenCart,
  } = props;

  // Resolve custom theme config from prop, hotel property, or fallback to default
  const config: CustomThemeConfig =
    props.customConfig ||
    (hotel as any)?.custom_theme_config ||
    DEFAULT_CUSTOM_THEME;

  // Determine button styles based on config.buttonStyle
  const getButtonStyles = (isPrimary = true): React.CSSProperties => {
    const baseRadius = config.buttonStyle === 'pill' ? '9999px' : config.borderRadius;

    if (!isPrimary) {
      return {
        borderRadius: baseRadius,
        border: `1px solid ${config.primaryColor}40`,
        background: 'transparent',
        color: config.primaryColor,
        fontFamily: config.bodyFont,
      };
    }

    switch (config.buttonStyle) {
      case 'outline':
        return {
          borderRadius: baseRadius,
          border: `1px solid ${config.primaryColor}`,
          background: 'transparent',
          color: config.primaryColor,
          fontFamily: config.bodyFont,
        };
      case 'soft':
        return {
          borderRadius: baseRadius,
          border: `1px solid ${config.primaryColor}30`,
          background: `${config.primaryColor}1A`,
          color: config.primaryColor,
          fontFamily: config.bodyFont,
        };
      case 'pill':
      case 'solid':
      default:
        return {
          borderRadius: baseRadius,
          border: 'none',
          background: config.primaryColor,
          color: '#000000',
          fontFamily: config.bodyFont,
        };
    }
  };

  // Determine card container styles based on config.cardStyle
  const getCardContainerStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      backgroundColor: config.cardBg,
      borderRadius: config.borderRadius,
      fontFamily: config.bodyFont,
      color: config.textColor,
      transition: 'all 0.25s ease',
    };

    switch (config.cardStyle) {
      case 'bordered':
        return {
          ...base,
          border: `1px solid ${config.primaryColor}40`,
        };
      case 'elevated':
        return {
          ...base,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.06)',
        };
      case 'glassmorphic':
        return {
          ...base,
          backgroundColor: `${config.cardBg}CC`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
        };
      case 'flat':
      default:
        return {
          ...base,
          border: 'none',
        };
    }
  };

  return (
    <div
      className="min-h-screen transition-colors duration-200"
      style={{
        backgroundColor: config.pageBg,
        color: config.textColor,
        fontFamily: config.bodyFont,
      }}
    >
      {/* ================= 11. HEADER STYLES ================= */}
      {config.headerStyle === 'centered' && (
        <header
          className="border-b sticky top-0 z-30 backdrop-blur-md px-4 py-4"
          style={{
            backgroundColor: `${config.pageBg}E6`,
            borderColor: `${config.primaryColor}20`,
          }}
        >
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-xs uppercase tracking-wider opacity-70" style={{ fontFamily: config.bodyFont }}>
                {tableNumber ? `Table ${tableNumber}` : 'Welcome'}
              </span>

              <button
                onClick={onOpenCart}
                style={getButtonStyles(true)}
                className="px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span>Order</span>
                {totalCount > 0 && <span>({totalCount})</span>}
              </button>
            </div>

            {hotel.logo_url?.trim() ? (
              <img
                src={hotel.logo_url}
                alt={hotel.name}
                className="w-12 h-12 rounded-full object-cover border mb-2 shadow-sm"
                style={{ borderColor: config.primaryColor }}
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full border flex items-center justify-center mb-2 shadow-sm"
                style={{ borderColor: config.primaryColor, backgroundColor: config.cardBg }}
              >
                <Dine3DLogo size="xs" href={null} />
              </div>
            )}

            <h1
              className="text-xl sm:text-2xl font-bold tracking-tight"
              style={{ fontFamily: config.headingFont, color: config.textColor }}
            >
              {hotel.name}
            </h1>

            {hotel.welcome_text && (
              <p className="text-xs opacity-75 max-w-md mt-1 italic">
                {hotel.welcome_text}
              </p>
            )}
          </div>
        </header>
      )}

      {config.headerStyle === 'minimal' && (
        <header
          className="border-b sticky top-0 z-30 backdrop-blur-md px-4 py-3"
          style={{
            backgroundColor: `${config.pageBg}F0`,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1
                className="text-lg font-bold tracking-tight"
                style={{ fontFamily: config.headingFont, color: config.textColor }}
              >
                {hotel.name}
              </h1>
              {tableNumber && (
                <span className="text-[0.65rem] opacity-70 uppercase tracking-widest px-2 py-0.5 rounded border border-current">
                  T-{tableNumber}
                </span>
              )}
            </div>

            <button
              onClick={onOpenCart}
              style={getButtonStyles(true)}
              className="px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
            >
              <span>Order</span>
              {totalCount > 0 && <span>• {formatPrice(totalPrice, currency)}</span>}
            </button>
          </div>
        </header>
      )}

      {config.headerStyle === 'boxed' && (
        <header
          className="sticky top-0 z-30 px-4 py-3 border-b"
          style={{
            backgroundColor: config.cardBg,
            borderColor: config.primaryColor,
            borderBottomWidth: 2,
          }}
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="border p-1.5 px-3 rounded flex items-center gap-2" style={{ borderColor: `${config.primaryColor}60` }}>
              <span style={{ color: config.primaryColor }}>✦</span>
              <h1
                className="text-base sm:text-lg font-bold uppercase tracking-wider"
                style={{ fontFamily: config.headingFont, color: config.textColor }}
              >
                {hotel.name}
              </h1>
            </div>

            <button
              onClick={onOpenCart}
              style={getButtonStyles(true)}
              className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
            >
              {totalCount > 0 ? `Thali (${totalCount})` : 'Order'}
            </button>
          </div>
        </header>
      )}

      {config.headerStyle === 'sticky-blur' && (
        <header
          className="sticky top-0 z-30 backdrop-blur-xl border-b px-4 py-3"
          style={{
            backgroundColor: `${config.pageBg}E6`,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hotel.logo_url?.trim() ? (
                <img
                  src={hotel.logo_url}
                  alt={hotel.name}
                  className="w-9 h-9 rounded-lg object-cover border"
                  style={{ borderColor: `${config.primaryColor}40` }}
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-lg border flex items-center justify-center"
                  style={{ borderColor: `${config.primaryColor}40`, backgroundColor: config.cardBg }}
                >
                  <Dine3DLogo size="xs" href={null} />
                </div>
              )}
              <div>
                <span
                  className="text-[0.625rem] font-bold uppercase tracking-wider block"
                  style={{ color: config.primaryColor }}
                >
                  {tableNumber ? `Table ${tableNumber}` : 'Kitchen Live'}
                </span>
                <h1
                  className="text-base font-bold tracking-tight leading-tight"
                  style={{ fontFamily: config.headingFont, color: config.textColor }}
                >
                  {hotel.name}
                </h1>
              </div>
            </div>

            <button
              onClick={onOpenCart}
              style={getButtonStyles(true)}
              className="px-3.5 py-1.5 text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-md"
            >
              <span>Cart</span>
              {totalCount > 0 && <span>({totalCount})</span>}
            </button>
          </div>
        </header>
      )}

      {/* ================= SEARCH & CATEGORY BAR ================= */}
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
        <div className="relative mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search items, ingredients, flavors..."
            className="w-full pl-9 pr-4 py-2 text-xs border outline-none transition-all shadow-inner"
            style={{
              backgroundColor: config.cardBg,
              color: config.textColor,
              borderColor: `${config.primaryColor}30`,
              borderRadius: config.borderRadius,
              fontFamily: config.bodyFont,
            }}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-60"
            viewBox="0 0 14 14"
            fill="none"
            stroke={config.primaryColor}
            strokeWidth="1.5"
          >
            <circle cx="6" cy="6" r="4.5" />
            <path d="M9.5 9.5L12.5 12.5" strokeLinecap="round" />
          </svg>
        </div>

        {pills.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {pills.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className="px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200"
                  style={{
                    borderRadius: config.buttonStyle === 'pill' ? '9999px' : config.borderRadius,
                    backgroundColor: isActive ? config.primaryColor : config.cardBg,
                    color: isActive ? '#000000' : config.textColor,
                    border: `1px solid ${isActive ? config.primaryColor : `${config.primaryColor}25`}`,
                    fontFamily: config.bodyFont,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= 10. MENU LAYOUT DISPLAY ================= */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-10">
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center opacity-60">
            <p className="text-sm">No dishes match your inquiry.</p>
          </div>
        ) : (
          <>
            {/* FEATURED DISHES */}
            {featuredItems.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                  <h2
                    className="text-lg font-bold tracking-tight uppercase"
                    style={{ fontFamily: config.headingFont, color: config.textColor }}
                  >
                    Chef&apos;s Featured
                  </h2>
                </div>

                <div className={getLayoutGridClass(config.menuLayout)}>
                  {featuredItems.map((item) => (
                    <CustomDishCard
                      key={item.id}
                      item={item}
                      currency={currency}
                      cart={cart}
                      config={config}
                      cardStyles={getCardContainerStyles()}
                      buttonStyles={getButtonStyles()}
                      onAdd={onAdd}
                      onRemove={onRemove}
                      onItemClick={onItemClick}
                      onView3D={onView3D}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* POPULAR DISHES */}
            {popularItems.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                  <h2
                    className="text-lg font-bold tracking-tight uppercase"
                    style={{ fontFamily: config.headingFont, color: config.textColor }}
                  >
                    Most Popular
                  </h2>
                </div>

                <div className={getLayoutGridClass(config.menuLayout)}>
                  {popularItems.map((item) => (
                    <CustomDishCard
                      key={item.id}
                      item={item}
                      currency={currency}
                      cart={cart}
                      config={config}
                      cardStyles={getCardContainerStyles()}
                      buttonStyles={getButtonStyles()}
                      onAdd={onAdd}
                      onRemove={onRemove}
                      onItemClick={onItemClick}
                      onView3D={onView3D}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ALL DISHES */}
            {regularItems.length > 0 && (
              <section>
                {(featuredItems.length > 0 || popularItems.length > 0) && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                    <h2
                      className="text-lg font-bold tracking-tight uppercase"
                      style={{ fontFamily: config.headingFont, color: config.textColor }}
                    >
                      All Dishes
                    </h2>
                  </div>
                )}

                <div className={getLayoutGridClass(config.menuLayout)}>
                  {regularItems.map((item) => (
                    <CustomDishCard
                      key={item.id}
                      item={item}
                      currency={currency}
                      cart={cart}
                      config={config}
                      cardStyles={getCardContainerStyles()}
                      buttonStyles={getButtonStyles()}
                      onAdd={onAdd}
                      onRemove={onRemove}
                      onItemClick={onItemClick}
                      onView3D={onView3D}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function getLayoutGridClass(menuLayout: CustomThemeConfig['menuLayout']) {
  switch (menuLayout) {
    case 'editorial':
      return 'space-y-6';
    case 'compact-list':
      return 'space-y-3';
    case 'cards':
      return 'grid grid-cols-1 gap-6';
    case 'grid':
    default:
      return 'grid grid-cols-1 sm:grid-cols-2 gap-4';
  }
}

function CustomDishCard({
  item,
  currency,
  cart,
  config,
  cardStyles,
  buttonStyles,
  onAdd,
  onRemove,
  onItemClick,
  onView3D,
}: {
  item: PublicMenuItem;
  currency: string | null;
  cart: { menuItem: PublicMenuItem; quantity: number }[];
  config: CustomThemeConfig;
  cardStyles: React.CSSProperties;
  buttonStyles: React.CSSProperties;
  onAdd: (item: PublicMenuItem) => void;
  onRemove: (id: string) => void;
  onItemClick: (item: PublicMenuItem) => void;
  onView3D: (item: PublicMenuItem) => void;
}) {
  const inCart = cart.find((c) => c.menuItem.id === item.id);
  const has3D = Boolean(item.model_url_glb?.trim());
  const image = item.image_url?.trim() || '';

  // COMPACT LIST LAYOUT
  if (config.menuLayout === 'compact-list') {
    return (
      <div
        onClick={() => onItemClick(item)}
        style={cardStyles}
        className="p-3.5 flex items-center gap-3.5 cursor-pointer hover:opacity-95 transition-all"
      >
        <div
          className="relative w-20 h-20 flex-shrink-0 overflow-hidden bg-neutral-800"
          style={{ borderRadius: config.borderRadius }}
        >
          {image ? (
            <img src={image} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[0.6rem] opacity-50">Dish</div>
          )}
          {has3D && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView3D(item);
              }}
              className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[0.55rem] font-bold bg-black/80 text-white"
            >
              3D
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`}
            />
            <h3
              className="text-sm font-bold truncate"
              style={{ fontFamily: config.headingFont, color: config.textColor }}
            >
              {item.name}
            </h3>
          </div>
          {item.description && (
            <p className="text-xs opacity-70 line-clamp-1 mb-1.5">{item.description}</p>
          )}
          <span className="text-sm font-bold" style={{ color: config.primaryColor }}>
            {formatPrice(Number(item.price) || 0, currency)}
          </span>
        </div>

        <div className="flex-shrink-0">
          {inCart ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 border px-2 py-0.5"
              style={{ borderRadius: config.borderRadius, borderColor: config.primaryColor }}
            >
              <button onClick={() => onRemove(item.id)} className="font-bold text-xs">
                −
              </button>
              <span className="text-xs font-bold">{inCart.quantity}</span>
              <button onClick={() => onAdd(item)} className="font-bold text-xs">
                +
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd(item);
              }}
              style={buttonStyles}
              className="px-3 py-1.5 text-xs font-bold"
            >
              + Add
            </button>
          )}
        </div>
      </div>
    );
  }

  // STANDARD GRID / CARDS / EDITORIAL CARD
  const imageHeight =
    config.menuLayout === 'cards' ? 'h-64 sm:h-72' : config.menuLayout === 'editorial' ? 'h-56 sm:h-64' : 'h-48';

  return (
    <div
      onClick={() => onItemClick(item)}
      style={cardStyles}
      className="overflow-hidden flex flex-col justify-between cursor-pointer group hover:scale-[1.01] transition-transform duration-200"
    >
      <div className={`relative w-full ${imageHeight} overflow-hidden bg-neutral-800`}>
        {image ? (
          <img
            src={image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs opacity-50">
            No Photo
          </div>
        )}

        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${item.is_veg ? 'bg-emerald-400' : 'bg-rose-500'}`}
          />
          {item.is_featured && (
            <span
              className="px-2 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-wider"
              style={{ backgroundColor: config.primaryColor, color: '#000000' }}
            >
              Featured
            </span>
          )}
        </div>

        {has3D && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView3D(item);
            }}
            className="absolute top-3 right-3 px-2 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-wider bg-black/80 text-white border"
            style={{ borderColor: config.primaryColor }}
          >
            3D View
          </button>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <h3
              className="text-base sm:text-lg font-bold leading-tight"
              style={{ fontFamily: config.headingFont, color: config.textColor }}
            >
              {item.name}
            </h3>
            <span className="text-base font-bold whitespace-nowrap" style={{ color: config.primaryColor }}>
              {formatPrice(Number(item.price) || 0, currency)}
            </span>
          </div>

          {item.description && (
            <p className="text-xs opacity-75 line-clamp-2 leading-relaxed mb-3">
              {item.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-[0.65rem] opacity-65 mb-3">
            {item.calories ? <span>{item.calories} kcal</span> : null}
            {item.preparation_time_mins ? <span>• {item.preparation_time_mins}m</span> : null}
            {Number(item.rating) > 0 && <span>• ★ {Number(item.rating).toFixed(1)}</span>}
          </div>
        </div>

        <div className="pt-2 border-t border-current/10 flex items-center justify-between gap-2">
          {inCart ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between w-full border px-3 py-1"
              style={{ borderRadius: config.borderRadius, borderColor: config.primaryColor }}
            >
              <button onClick={() => onRemove(item.id)} className="font-bold text-sm">
                −
              </button>
              <span className="text-xs font-bold">{inCart.quantity} in order</span>
              <button onClick={() => onAdd(item)} className="font-bold text-sm">
                +
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd(item);
              }}
              style={buttonStyles}
              className="w-full py-2 text-xs font-bold tracking-wide"
            >
              Add to Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

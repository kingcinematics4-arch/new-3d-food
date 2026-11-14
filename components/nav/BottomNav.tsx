'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Utensils, ShoppingCart, Gamepad2, User, Receipt } from 'lucide-react';

interface BottomNavItem {
  icon: React.ElementType;
  label: string;
  shortLabel: string;
}

const NAV_ITEMS: BottomNavItem[] = [
  { icon: Utensils, label: 'Menu', shortLabel: 'Menu' },
  { icon: ShoppingCart, label: 'Cart', shortLabel: 'Cart' },
  { icon: Gamepad2, label: 'Games', shortLabel: 'Games' },
  { icon: Receipt, label: 'Your Orders', shortLabel: 'Orders' },
  { icon: User, label: 'Profile', shortLabel: 'Profile' },
];

export interface BottomNavProps {
  activeTab: string;
  cartCount: number;
  menuSlug: string | null;
  tableNumber: string | null;
  onTabChange: (tab: string) => void;
  onOpenCart?: () => void;
  variant?: 'bottom' | 'sidebar';
}

export default function BottomNav({
  activeTab,
  cartCount,
  menuSlug,
  tableNumber,
  onTabChange,
  onOpenCart,
  variant = 'bottom',
}: BottomNavProps) {
  const router = useRouter();

  const buildHref = (path: string) => {
    if (!menuSlug) return path;
    const hasTable = tableNumber && tableNumber.trim() !== '';
    const params = new URLSearchParams();
    params.set('slug', menuSlug);
    if (hasTable) params.set('table', tableNumber);
    const query = params.toString();
    return query ? `${path}?${query}` : path;
  };

  const menuHref = menuSlug ? `/menu/${encodeURIComponent(menuSlug)}` : '/menu';
  const gamesHref = buildHref('/games');
  const yourOrdersHref = buildHref('/your-orders');
  const profileHref = buildHref('/profile');

  const handleTabClick = (item: BottomNavItem, e: React.MouseEvent) => {
    e.preventDefault();

    if (item.label === 'Cart') {
      if (onOpenCart) {
        onOpenCart();
        return;
      }
      // Not on Menu page - navigate to Menu page for this hotel/table and open cart
      if (menuSlug) {
        onTabChange(item.label);
        const params = new URLSearchParams();
        if (tableNumber && tableNumber.trim() !== '') params.set('table', tableNumber);
        params.set('openCart', '1');
        router.push(`/menu/${encodeURIComponent(menuSlug)}?${params.toString()}`);
        return;
      }
      // No hotel context - go to home
      onTabChange(item.label);
      router.push('/');
      return;
    }

    let href: string;
    switch (item.label) {
      case 'Menu':
        href = menuHref;
        break;
      case 'Games':
        href = gamesHref;
        break;
      case 'Your Orders':
        href = yourOrdersHref;
        break;
      case 'Profile':
        href = profileHref;
        break;
      default:
        href = '/';
    }
    onTabChange(item.label);
    router.push(href);
  };

  const isSidebar = variant === 'sidebar';

  if (isSidebar) {
    return (
      <nav
        className="fixed left-0 top-0 bottom-0 z-40 w-64 hidden lg:block"
        style={{
          background: 'var(--bg-surface, rgba(11, 11, 10, 0.96))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRight: '1px solid var(--border-subtle, rgba(184, 164, 122, 0.2))',
        }}
      >
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center gap-3 px-2 py-4 border-b border-white/10">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                border: '1px solid var(--border-medium, rgba(184,164,122,0.45))',
                background: 'var(--bg-surface-2, rgba(184,164,122,0.15))',
                color: 'var(--gold, #B8A47A)',
              }}
            >
              <Utensils size={18} color="currentColor" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/45">DinePixel</p>
              <h1 className="text-base font-semibold tracking-tight text-white">Navigation</h1>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.label;
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={(e) => handleTabClick(item, e)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 outline-none text-left w-full cursor-pointer"
                  style={{
                    background: isActive ? 'var(--gold-pale, rgba(184, 164, 122, 0.14))' : 'transparent',
                    border: isActive ? '1px solid var(--border-medium, rgba(184, 164, 122, 0.35))' : '1px solid transparent',
                    color: isActive ? 'var(--gold, #B8A47A)' : 'var(--text-muted, #A8A396)',
                  }}
                >
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.2 : 1.6}
                    style={{ transition: 'all 0.2s ease', flexShrink: 0 }}
                  />
                  <span className="font-medium text-sm tracking-tight" style={{ transition: 'all 0.2s ease' }}>
                    {item.label}
                  </span>
                  {item.label === 'Cart' && cartCount > 0 && (
                    <span
                      className="ml-auto flex items-center justify-center"
                      style={{
                        width: 18,
                        height: 18,
                        minWidth: 18,
                        background: 'var(--gold, #B8A47A)',
                        color: 'var(--bg-primary, #0B0B0A)',
                        borderRadius: '50%',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        lineHeight: 1,
                        boxShadow: '0 0 0 2px rgba(11, 11, 10, 0.9)',
                      }}
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/10 pt-4 text-center">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">DinePixel</p>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      style={{
        paddingBottom: `max(env(safe-area-inset-bottom), 0.5rem)`,
        paddingTop: '0.35rem',
        background: 'var(--d3-nav-bg, rgba(11, 11, 10, 0.96))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-subtle, rgba(184, 164, 122, 0.25))',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div className="max-w-4xl mx-auto px-2 flex items-center justify-between">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.label;
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={(e) => handleTabClick(item, e)}
              className="relative flex flex-col items-center justify-center gap-1 transition-all duration-200 outline-none cursor-pointer"
              style={{
                flex: '1 1 0%',
                minWidth: 0,
                padding: '0.25rem 0.25rem 0.35rem',
                opacity: isActive ? 1 : 0.65,
                color: isActive ? 'var(--gold, #B8A47A)' : 'var(--text-dimmed, #6B675F)',
                borderBottom: isActive ? '2px solid var(--gold, #B8A47A)' : '2px solid transparent',
              }}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.4 : 1.6}
                style={{ transition: 'all 0.2s ease', flexShrink: 0 }}
              />
              <span
                className="text-[0.625rem] font-semibold tracking-tight uppercase truncate w-full text-center leading-none"
                style={{ transition: 'all 0.2s ease' }}
              >
                {item.shortLabel}
              </span>
              {item.label === 'Cart' && cartCount > 0 && (
                <span
                  className="flex items-center justify-center"
                  style={{
                    position: 'absolute',
                    top: '0px',
                    right: 'calc(50% - 16px)',
                    width: 14,
                    height: 14,
                    minWidth: 14,
                    background: 'var(--gold, #B8A47A)',
                    color: 'var(--bg-primary, #0B0B0A)',
                    borderRadius: '50%',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    boxShadow: '0 0 0 2px rgba(11, 11, 10, 0.95)',
                  }}
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

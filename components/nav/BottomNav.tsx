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
}

export default function BottomNav({
  activeTab,
  cartCount,
  menuSlug,
  tableNumber,
  onTabChange,
  onOpenCart,
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

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        paddingBottom: `max(env(safe-area-inset-bottom), 0.625rem)`,
        paddingTop: '0.3125rem',
        background: 'rgba(11, 11, 10, 0.94)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(184, 164, 122, 0.35)',
      }}
    >
      <div className="max-w-md mx-auto px-2 flex items-center justify-between">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.label;
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={(e) => handleTabClick(item, e)}
              className="flex flex-col items-center justify-center gap-0.375 transition-all duration-200 outline-none"
              style={{
                flex: '1 1 0%',
                minWidth: 0,
                padding: '0.1875rem 0.125rem',
                opacity: isActive ? 1 : 0.55,
                color: isActive ? '#B8A47A' : '#6B675F',
                borderBottom: isActive ? '2px solid #B8A47A' : 'none',
              }}
            >
              <Icon
                size={19}
                strokeWidth={isActive ? 2.5 : 1.5}
                style={{ transition: 'all 0.2s ease', flexShrink: 0 }}
              />
              <span
                className="text-[0.48rem] font-medium tracking-tight uppercase truncate w-full text-center leading-none"
                style={{ transition: 'all 0.2s ease' }}
              >
                {item.shortLabel}
              </span>
              {item.label === 'Cart' && cartCount > 0 && (
                <span
                  className="flex items-center justify-center"
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '50%',
                    transform: 'translateX(50%)',
                    width: 11,
                    height: 11,
                    minWidth: 11,
                    background: '#B8A47A',
                    color: '#0B0B0A',
                    borderRadius: '50%',
                    fontSize: '0.5rem',
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
    </nav>
  );
}

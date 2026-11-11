'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Utensils, ShoppingCart, Gamepad2, User } from 'lucide-react';

interface BottomNavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const NAV_ITEMS: BottomNavItem[] = [
  { icon: Utensils, label: 'Menu', href: '/menu' },
  { icon: ShoppingCart, label: 'Cart', href: '/cart' },
  { icon: Gamepad2, label: 'Games', href: '/games' },
  { icon: User, label: 'Profile', href: '/profile' },
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

  const menuHref = menuSlug ? `/menu/${encodeURIComponent(menuSlug)}` : '/menu';
  const gamesHref = menuSlug ? `/games?slug=${encodeURIComponent(menuSlug)}&table=${encodeURIComponent(tableNumber || '')}` : '/games';
  const profileHref = menuSlug ? `/profile?slug=${encodeURIComponent(menuSlug)}&table=${encodeURIComponent(tableNumber || '')}` : '/profile';

  const HREFS: Record<string, string> = {
    Menu: menuHref,
    Cart: '/cart',
    Games: gamesHref,
    Profile: profileHref,
  };

  const handleTabClick = (item: BottomNavItem, e: React.MouseEvent) => {
    e.preventDefault();
    if (item.label === 'Cart') {
      if (onOpenCart) {
        onOpenCart();
        return;
      }
    }
    onTabChange(item.label);
    const href = HREFS[item.label] || item.href;
    router.push(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        paddingBottom: `max(env(safe-area-inset-bottom), 1rem)`,
        paddingTop: '0.5rem',
        background: 'rgba(11, 11, 10, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(184, 164, 122, 0.35)',
      }}
    >
      <div className="max-w-md mx-auto px-4 flex items-center justify-between">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.label;
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={(e) => handleTabClick(item, e)}
              className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 transition-all duration-200 outline-none"
              style={{
                padding: '0.375rem 0.25rem',
                opacity: isActive ? 1 : 0.55,
                color: isActive ? '#B8A47A' : '#6B675F',
                borderBottom: isActive ? '2px solid #B8A47A' : 'none',
              }}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.5}
                style={{ transition: 'all 0.2s ease' }}
              />
              <span
                className="text-[0.55rem] sm:text-[0.65rem] font-medium tracking-tight uppercase"
                style={{ transition: 'all 0.2s ease', marginTop: 2 }}
              >
                {item.label}
              </span>
              {item.label === 'Cart' && cartCount > 0 && (
                <span
                  className="flex items-center justify-center"
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    width: 14,
                    height: 14,
                    minWidth: 14,
                    background: '#B8A47A',
                    color: '#0B0B0A',
                    borderRadius: '50%',
                    fontSize: '0.6rem',
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

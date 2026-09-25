'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';

// Nav item icons (SVG inline for quality)
const navIcons: Record<string, React.ReactNode> = {
  Overview: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  'Menu & 3D Models': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 1V15M2 4.5L8 8M14 4.5L8 8" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
    </svg>
  ),
  'Live Orders': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2H12L13 5H3L4 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="2" y="5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 9H11M5 12H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  'QR Code Builder': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1" y="10" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10 10H12V12M12 14H14M14 10H14.01M10 14H10.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="2.5" y="2.5" width="2" height="2" fill="currentColor" fillOpacity="0.6" />
      <rect x="11.5" y="2.5" width="2" height="2" fill="currentColor" fillOpacity="0.6" />
      <rect x="2.5" y="11.5" width="2" height="2" fill="currentColor" fillOpacity="0.6" />
    </svg>
  ),
  Analytics: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 12L5 8L8 10L11 5L14 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="2" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
    </svg>
  ),
  'Menu Design': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="2" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
      <path d="M8 2V4M8 12V14M2 8H4M12 8H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  Reviews: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L9.5 6H14L10.5 8.5L12 12.5L8 10L4 12.5L5.5 8.5L2 6H6.5L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
  'Restaurant Profile': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 14C2 11.2 4.7 9 8 9C11.3 9 14 11.2 14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
};

const navItems = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Menu & 3D Models', href: '/dashboard/menu' },
  { label: 'Live Orders', href: '/dashboard/orders' },
  { label: 'QR Code Builder', href: '/dashboard/qr' },
  { label: 'Analytics', href: '/dashboard/analytics' },
  { label: 'Menu Design', href: '/dashboard/customize' },
  { label: 'Reviews', href: '/dashboard/reviews' },
  { label: 'Restaurant Profile', href: '/dashboard/settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState('My Restaurant');
  const [userEmail, setUserEmail] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.user) {
          setUserEmail(session.user.email || '');
          const { data: userLink } = await supabaseClient
            .from('hotel_users')
            .select('hotel_id, hotel:hotels(name)')
            .eq('user_id', session.user.id)
            .single();

          if (userLink?.hotel?.name) {
            setRestaurantName(userLink.hotel.name);
          } else if (session.user.user_metadata?.hotel_name) {
            setRestaurantName(session.user.user_metadata.hotel_name);
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    router.push('/login');
  };

  const currentPage = navItems.find((n) => n.href === pathname)?.label || 'Dashboard';

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg-primary)', fontFamily: 'var(--font-body)' }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50 flex flex-col justify-between
          md:relative md:flex md:z-auto
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          width: 240,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div>
          <div
            className="flex items-center gap-2.5 px-5 py-5"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <svg width="22" height="22" viewBox="0 0 26 26" fill="none">
              <polygon points="13,1 24,7 24,19 13,25 2,19 2,7" fill="none" stroke="#C9A96E" strokeWidth="1.2" />
              <line x1="13" y1="1" x2="13" y2="25" stroke="#C9A96E" strokeWidth="0.8" strokeOpacity="0.5" />
              <line x1="2" y1="7" x2="24" y2="19" stroke="#C9A96E" strokeWidth="0.8" strokeOpacity="0.5" />
              <line x1="24" y1="7" x2="2" y2="19" stroke="#C9A96E" strokeWidth="0.8" strokeOpacity="0.5" />
            </svg>
            <div className="flex flex-col min-w-0">
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                Dine<span style={{ color: 'var(--gold)' }}>3D</span>
              </span>
              <span
                className="truncate"
                style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)', marginTop: 1 }}
              >
                {restaurantName}
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="px-3 py-4 flex flex-col gap-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 8,
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--gold)' : 'var(--text-muted)',
                    background: isActive ? 'rgba(201,169,110,0.08)' : 'transparent',
                    border: isActive ? '1px solid rgba(201,169,110,0.12)' : '1px solid transparent',
                    transition: 'all 200ms',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,248,235,0.04)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  <span style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }}>
                    {navIcons[item.label]}
                  </span>
                  <span>{item.label}</span>
                  {item.label === 'Live Orders' && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        width: 8, height: 8,
                        borderRadius: '50%',
                        background: 'var(--gold)',
                        animation: 'pulseGold 2s ease-in-out infinite',
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div
          className="px-3 py-4 flex flex-col gap-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <Link
            href="/menu/demo-restaurant"
            target="_blank"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.875rem',
              borderRadius: 8,
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              textDecoration: 'none',
              transition: 'all 200ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)';
              e.currentTarget.style.color = 'var(--gold)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M4 7C4 5 5 4 7 4C9 4 10 5 10 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            View Customer Menu
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 'auto', opacity: 0.5 }}>
              <path d="M2 8L8 2M5 2H8V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <div
            className="px-3 py-2"
            style={{
              background: 'var(--bg-surface-2)',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
            }}
          >
            <p style={{ fontSize: '0.625rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
              Signed in as
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userEmail || 'owner@restaurant.com'}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem 0.875rem',
              borderRadius: 8, fontSize: '0.75rem', fontWeight: 500,
              color: 'var(--text-dimmed)',
              background: 'none',
              border: '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 200ms',
              width: '100%', textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(200,80,80,0.06)';
              e.currentTarget.style.color = '#FCA5A5';
              e.currentTarget.style.borderColor = 'rgba(200,80,80,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--text-dimmed)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2H2V12H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M8 4.5L11 7L8 9.5M4 7H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header
          className="flex items-center justify-between px-6 flex-shrink-0"
          style={{
            height: 60,
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {/* Left — Mobile hamburger + Page title */}
          <div className="flex items-center gap-4">
            <button
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 4 }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4H16M2 9H16M2 14H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                {currentPage}
              </h1>
            </div>
          </div>

          {/* Right — Status + Actions */}
          <div className="flex items-center gap-3">
            <span className="d3-badge" style={{
              fontSize: '0.5625rem',
              background: 'rgba(100,210,150,0.08)',
              border: '1px solid rgba(100,210,150,0.2)',
              color: '#86EFAC',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#86EFAC', animation: 'pulseGold 2s ease-in-out infinite' }} />
              LIVE
            </span>
            <Link
              href="/menu/demo-restaurant"
              target="_blank"
              className="d3-btn-ghost"
              style={{ padding: '0.4375rem 1rem', fontSize: '0.75rem', display: 'none' }}
            >
              View Menu ↗
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: '2rem', background: 'var(--bg-primary)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

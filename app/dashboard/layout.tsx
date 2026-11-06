'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { supabaseClient } from '@/lib/supabaseClient';
import { useHotel, clearDashboardCache } from '@/lib/useHotel';
import { useAuth } from '@/lib/authContext';
import Dine3DLogo from '@/components/Dine3DLogo';

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
  'Menu Themes': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 6L8 10L13 6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
  'Saved Themes': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3H6L8 1L10 3H13V6L16 8L13 10V13H10L8 15L6 13H3V10L0 8L3 6V3Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="1.6" fill="currentColor" fillOpacity="0.5" />
    </svg>
  ),
  'Custom Themes': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3H6L8 1L10 3H13V6L16 8L13 10V13H10L8 15L6 13H3V10L0 8L3 6V3Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="1.6" fill="currentColor" fillOpacity="0.5" />
    </svg>
  ),
  Hotels: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 13.5V4.8L8 2.2L13.5 4.8V13.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6 13.5V10H10V13.5M5 6.2H6M7.5 6.2H8.5M10 6.2H11M5 8.2H6M7.5 8.2H8.5M10 8.2H11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M1.5 13.5H14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  Admin: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.6L9.4 2.4L11 2.1L11.7 3.6L13.2 4.3L12.9 5.9L13.7 7.3L12.9 8.7L13.2 10.3L11.7 11L11 12.5L9.4 12.2L8 13L6.6 12.2L5 12.5L4.3 11L2.8 10.3L3.1 8.7L2.3 7.3L3.1 5.9L2.8 4.3L4.3 3.6L5 2.1L6.6 2.4L8 1.6Z" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" />
      <circle cx="8" cy="7.3" r="1.9" stroke="currentColor" strokeWidth="1.15" />
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
  { label: 'Hotels', href: '/dashboard/hotels' },
  {
    label: 'Admin',
    children: [
      { label: 'Menu Design', href: '/dashboard/customize' },
      { label: 'Menu Themes', href: '/dashboard/menu-theme' },
      { label: 'Custom Themes', href: '/dashboard/custom-themes' },
    ],
  },
  { label: 'Reviews', href: '/dashboard/reviews' },
  { label: 'Restaurant Profile', href: '/dashboard/settings' },
] as const;

type NavLeaf = { label: string; href: string };
type NavGroup = { label: string; children: readonly NavLeaf[] };
type NavItem = NavLeaf | NavGroup;
const isGroup = (item: NavItem): item is NavGroup => 'children' in item;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardLayoutBody>{children}</DashboardLayoutBody>
    </QueryClientProvider>
  );
}

function DashboardLayoutBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { hotel, loading: hotelLoading } = useHotel();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [dashboardAdminAuthed, setDashboardAdminAuthed] = useState(false);
  useEffect(() => {
    let alive = true;
    const check = async () => {
      try { const r = await fetch('/api/dashboard-admin/auth/session', { cache: 'no-store' }); const j = await r.json().catch(()=>({})); if (alive) setDashboardAdminAuthed(!!j.authenticated); }
      catch { if (alive) setDashboardAdminAuthed(false); }
    };
    check();
    window.addEventListener('dashboard-admin-session', check);
    return () => { alive = false; window.removeEventListener('dashboard-admin-session', check); };
  }, []);

  // Real records only — no invented placeholders when Supabase has the data.
  const restaurantName = hotel?.name?.trim() || '';
  const hotelSlug = hotel?.slug || '';
  const menuHref = hotelSlug ? `/menu/${hotelSlug}` : '/dashboard/settings';

  const ownerName =
    hotel?.owner_name?.trim() ||
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    (user?.user_metadata?.name as string | undefined)?.trim() ||
    '';
  const userEmail = user?.email || '';

  const loading = authLoading || hotelLoading || (!hotel && !!user);

  const handleSignOut = async () => {
    clearDashboardCache();
    await supabaseClient.auth.signOut();
    router.push('/login');
  };

  // Clear cache when switching hotels/accounts
  const prevHotelId = useRef<string | null>(null);
  useEffect(() => {
    const currentHotelId = hotel?.id || null;
    if (prevHotelId.current !== null && prevHotelId.current !== currentHotelId) {
      clearDashboardCache();
    }
    prevHotelId.current = currentHotelId;
  }, [hotel?.id]);

  const allLeaves = navItems.flatMap((n) => (isGroup(n as NavItem) ? (n as NavGroup).children : [n as NavLeaf]));
  const currentPage = allLeaves.find((n) => n.href === pathname)?.label || 'Dashboard';
  const activeGroup = (navItems as readonly NavItem[]).find((n): n is NavGroup => isGroup(n) && n.children.some((c) => c.href === pathname));

  useEffect(() => { if (activeGroup) setOpenGroup(activeGroup.label); }, [activeGroup?.label]);

  const brandSubtitle = loading ? (
    <span
      style={{
        display: 'inline-block',
        width: 72,
        height: 9,
        borderRadius: 4,
        background: 'var(--bg-surface-3)',
      }}
    />
  ) : restaurantName ? (
    <span className="truncate" style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)', marginTop: 1 }}>
      {restaurantName}
    </span>
  ) : (
    <Link
      href="/dashboard/settings"
      className="truncate"
      style={{ fontSize: '0.6875rem', color: 'var(--gold-dim)', marginTop: 1 }}
    >
      Complete your profile
    </Link>
  );

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
          width: 248,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-warm)',
          flexShrink: 0,
        }}
      >
        {/* Brand — official Dine3D asset, used as supplied */}
        <div>
          <div
            className="flex items-center gap-3 px-5 py-5"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <Dine3DLogo size="xs" href="/" priority />
            <div className="flex flex-col min-w-0">
              {brandSubtitle}
            </div>
          </div>

          {/* Nav */}
          <nav className="px-3 py-5 flex flex-col gap-0.5">
            {(navItems as readonly NavItem[]).map((item) => {
              if (isGroup(item)) {
                const groupActive = item.children.some((c) => c.href === pathname);
                const isAdminGroup = item.label === 'Admin';
                const adminLandingActive = pathname === '/dashboard/admin';
                const open = (isAdminGroup ? (dashboardAdminAuthed || adminLandingActive) : false) || openGroup === item.label || groupActive;
                return (
                  <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {isAdminGroup && !dashboardAdminAuthed && !adminLandingActive ? (
                      <Link
                        href="/dashboard/admin"
                        onClick={() => setSidebarOpen(false)}
                        style={{
                          position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.875rem', borderRadius: 5, fontSize: '0.8125rem', fontWeight: adminLandingActive ? 500 : 400, color: adminLandingActive ? 'var(--text-primary)' : 'var(--text-muted)', background: 'transparent', border: '1px solid transparent', transition: 'color 200ms, background 200ms', textDecoration: 'none', width: '100%'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(243,239,231,0.03)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = adminLandingActive ? 'var(--text-primary)' : 'var(--text-muted)'; }}
                      >
                        <span aria-hidden="true" style={{ position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)', width: 2, height: adminLandingActive ? 18 : 0, background: 'var(--gold)', transition: 'height 200ms' }} />
                        <span style={{ opacity: adminLandingActive ? 1 : 0.55, flexShrink: 0, color: adminLandingActive ? 'var(--gold)' : 'inherit' }}>{navIcons[item.label]}</span>
                        <span style={{ flex: 1 }}>{item.label}</span>
                      </Link>
                    ) : (<>
                    <button
                      type="button"
                      onClick={() => setOpenGroup((v) => (v === item.label ? null : item.label))}
                      aria-expanded={open}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem 0.875rem',
                        borderRadius: 5,
                        fontSize: '0.8125rem',
                        fontWeight: groupActive ? 500 : 400,
                        color: groupActive ? 'var(--text-primary)' : 'var(--text-muted)',
                        background: 'transparent',
                        border: '1px solid transparent',
                        transition: 'color 200ms, background 200ms',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        if (!groupActive) {
                          e.currentTarget.style.background = 'rgba(243,239,231,0.03)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!groupActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-muted)';
                        }
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          left: -12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 2,
                          height: groupActive ? 18 : 0,
                          background: 'var(--gold)',
                          transition: 'height 200ms',
                        }}
                      />
                      <span style={{ opacity: groupActive ? 1 : 0.55, flexShrink: 0, color: groupActive ? 'var(--gold)' : 'inherit' }}>
                        {navIcons[item.label]}
                      </span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <svg
                        width="12" height="12" viewBox="0 0 12 12" fill="none"
                        style={{ opacity: 0.55, transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
                        aria-hidden="true"
                      >
                        <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateRows: open ? '1fr' : '0fr',
                        transition: 'grid-template-rows 220ms ease',
                      }}
                    >
                      <div style={{ overflow: 'hidden', minHeight: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 12, marginLeft: 12, borderLeft: '1px solid var(--border-subtle)' }}>
                          {item.children.map((child) => {
                            const isActive = pathname === child.href;
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setSidebarOpen(false)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.625rem',
                                  padding: '0.4375rem 0.75rem',
                                  borderRadius: 5,
                                  fontSize: '0.8125rem',
                                  fontWeight: isActive ? 500 : 400,
                                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                                  background: isActive ? 'rgba(243,239,231,0.03)' : 'transparent',
                                  border: '1px solid transparent',
                                  transition: 'color 200ms, background 200ms',
                                  textDecoration: 'none',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isActive) {
                                    e.currentTarget.style.background = 'rgba(243,239,231,0.03)';
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
                                <span style={{ opacity: isActive ? 1 : 0.5, flexShrink: 0, color: isActive ? 'var(--gold)' : 'inherit' }}>
                                  {navIcons[child.label]}
                                </span>
                                <span>{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    </>)}
                  </div>
                );
              }
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0.875rem',
                    borderRadius: 5,
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    background: 'transparent',
                    border: '1px solid transparent',
                    transition: 'color 200ms, background 200ms',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(243,239,231,0.03)';
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
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: -12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 2,
                      height: isActive ? 18 : 0,
                      background: 'var(--gold)',
                      transition: 'height 200ms',
                    }}
                  />
                  <span style={{ opacity: isActive ? 1 : 0.55, flexShrink: 0, color: isActive ? 'var(--gold)' : 'inherit' }}>
                    {navIcons[item.label]}
                  </span>
                  <span>{item.label}</span>
                  {item.label === 'Live Orders' && (
                    <span className="d3-live-dot" style={{ marginLeft: 'auto' }} />
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
            href={menuHref}
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
            className="px-3 py-2.5"
            style={{
              background: 'var(--bg-surface-2)',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
            }}
          >
            <p style={{ fontSize: '0.5625rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>
              {ownerName ? 'Owner' : 'Signed in'}
            </p>
            {ownerName ? (
              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {ownerName}
              </p>
            ) : null}
            {userEmail && (
              <p
                style={{
                  fontSize: '0.6875rem',
                  color: ownerName ? 'var(--text-dimmed)' : 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: ownerName ? 2 : 0,
                }}
              >
                {userEmail}
              </p>
            )}
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
              e.currentTarget.style.background = 'rgba(196,102,88,0.06)';
              e.currentTarget.style.color = '#D9A79E';
              e.currentTarget.style.borderColor = 'rgba(196,102,88,0.18)';
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
          className="flex items-center justify-between px-8 flex-shrink-0"
          style={{
            height: 64,
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-warm)',
          }}
        >
          {/* Left — Mobile hamburger + Page title */}
          <div className="flex items-center gap-4">
            <button
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 4 }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4H16M2 9H16M2 14H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.125rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                letterSpacing: '-0.015em',
                lineHeight: 1.2,
              }}
            >
              {currentPage}
            </h1>
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-3">
            {hotelSlug && (
              <Link
                href={menuHref}
                target="_blank"
                className="d3-btn-ghost"
                style={{ padding: '0.4375rem 1rem', fontSize: '0.75rem' }}
              >
                View Menu
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: '2.75rem 2rem', background: 'var(--bg-primary)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

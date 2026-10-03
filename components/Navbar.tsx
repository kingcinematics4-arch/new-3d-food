'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Dine3DLogo from './Dine3DLogo';

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className="d3-nav"
        style={{
          background: scrolled ? 'rgba(11,10,8,0.98)' : 'rgba(11,10,8,0.85)',
          borderBottom: scrolled ? '1px solid rgba(201,169,110,0.12)' : '1px solid rgba(201,169,110,0.06)',
        }}
      >
        <div className="d3-container">
          <div className="d3-nav__inner">

            {/* Left — Logo. The official Dine3D logo asset, used exactly as
                supplied: never redrawn, recreated or substituted. Its size comes
                from the `d3-logo--nav` tokens, so it stays generous on desktop
                and steps down on a phone without touching the links. */}
            <div className="flex-shrink-0">
              <Dine3DLogo size="md" href="/" priority className="d3-logo--nav" />
            </div>

            {/* Center — Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.01em',
                    transition: 'color 200ms',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right — Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  transition: 'color 200ms',
                  textDecoration: 'none',
                  padding: '0.375rem 0',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="d3-btn-primary"
                style={{ padding: '0.5625rem 1.375rem', fontSize: '0.8125rem' }}
              >
                Get Started
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex flex-col gap-1.5 p-2"
              aria-label="Toggle menu"
              style={{ color: 'var(--text-primary)', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              <span
                style={{
                  display: 'block', width: 20, height: 1.5, background: 'currentColor',
                  transform: mobileOpen ? 'rotate(45deg) translate(2px, 2px)' : 'none',
                  transition: 'transform 200ms',
                }}
              />
              <span
                style={{
                  display: 'block', width: 20, height: 1.5, background: 'currentColor',
                  opacity: mobileOpen ? 0 : 1,
                  transition: 'opacity 200ms',
                }}
              />
              <span
                style={{
                  display: 'block', width: 20, height: 1.5, background: 'currentColor',
                  transform: mobileOpen ? 'rotate(-45deg) translate(2px, -2px)' : 'none',
                  transition: 'transform 200ms',
                }}
              />
            </button>

          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-[99]"
          style={{ background: 'var(--bg-primary)', paddingTop: 'var(--d3-nav-h)' }}
        >
          <div className="d3-container py-8 flex flex-col gap-6">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '1.5rem',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-4 mt-4">
              <Link href="/login" className="d3-btn-ghost" style={{ justifyContent: 'center' }}>
                Sign In
              </Link>
              <Link href="/signup" className="d3-btn-primary" style={{ justifyContent: 'center' }}>
                Get Started →
              </Link>
            </div>
            <p
              className="d3-eyebrow text-center mt-4"
              style={{ color: 'var(--text-dimmed)' }}
            >
              SEE IT. EXPERIENCE IT. DINE IT.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

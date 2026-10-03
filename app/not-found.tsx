// app/not-found.tsx
//
// Branded 404 for the public Dine3D site.
//
// Reached only for URLs that do not exist. The root route `/` is a real route
// (`app/page.tsx`) and is unaffected by this file.
//
// Dine3D visual identity: near-black plane, warm ivory serif display type,
// champagne hairlines. No invented content — this page states only that the
// address does not exist and offers real navigation.

import Link from 'next/link';
import Image from 'next/image';

const DESTINATIONS = [
  { href: '/', label: 'Home', description: 'The Dine3D product' },
  { href: '/#features', label: 'Features', description: 'What Dine3D does' },
  { href: '/#pricing', label: 'Pricing', description: 'Plans and what they include' },
  { href: '/#faq', label: 'Questions', description: 'Commonly asked questions' },
  { href: '/login', label: 'Restaurant sign in', description: 'For restaurant owners' },
];

export default function NotFound() {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="d3-container" style={{ padding: '6rem 2rem' }}>
        <div className="flex flex-col items-center text-center gap-8" style={{ maxWidth: 620, margin: '0 auto' }}>
          <Image
            src="/images/dine3d-logo.jpg"
            alt="Dine3D"
            width={150}
            height={38}
            priority
            className="object-contain"
            style={{ height: 38, width: 'auto' }}
          />

          <div className="flex flex-col gap-4">
            <span
              className="d3-eyebrow"
              style={{ fontSize: '3rem', letterSpacing: '0.08em', color: 'rgba(184,164,122,0.28)' }}
            >
              404
            </span>

            <h1 className="d3-display-md" style={{ margin: 0 }}>
              This page is not on the menu.
            </h1>

            <p className="d3-body" style={{ maxWidth: '46ch', margin: 0 }}>
              The address you followed does not exist. Try one of the destinations below.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center" style={{ paddingTop: '0.5rem' }}>
            <Link href="/" className="d3-btn-primary">
              Back to the homepage
            </Link>
            <Link href="/#features" className="d3-btn-ghost">
              Explore Dine3D
            </Link>
          </div>

          <div className="d3-rule" style={{ width: '100%', margin: '1.5rem 0' }} />

          <div
            className="grid gap-px w-full"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {DESTINATIONS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col gap-1 transition-colors"
                style={{ background: 'var(--bg-surface)', padding: '1.25rem 1.5rem' }}
              >
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.label}</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>{item.description}</span>
              </Link>
            ))}
          </div>

          <p
            className="d3-eyebrow"
            style={{ color: 'var(--text-dimmed)', fontSize: '0.5625rem', letterSpacing: '0.2em' }}
          >
            SEE IT. EXPERIENCE IT. DINE IT.
          </p>
        </div>
      </div>
    </div>
  );
}
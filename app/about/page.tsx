import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPage from '@/components/site/PublicPage';
import { getPublishedSiteContent } from '@/lib/siteContent.server';
import { breadcrumbSchema, SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'About DinePixel | QR Ordering and Restaurant Technology',
    description:
      'DinePixel builds QR ordering, digital menus and restaurant management tools for modern restaurants in Mumbai, Thane, Navi Mumbai and across India.',
    alternates: {
      canonical: '/about',
    },
    openGraph: {
      title: 'About DinePixel | QR Ordering and Restaurant Technology',
      description:
        'DinePixel builds QR ordering, digital menus and restaurant management tools for modern restaurants in Mumbai, Thane, Navi Mumbai and across India.',
      type: 'website',
      url: '/about',
    },
  };
}

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'About', path: '/about' },
    ]),
    {
      '@type': 'AboutPage',
      name: 'About DinePixel',
      url: `${SITE_URL}/about`,
      description:
        'DinePixel builds QR ordering, digital menus and restaurant management tools for modern restaurants.',
      mainEntity: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en',
    },
  ],
};

const exploreLinks = [
  {
    href: '/features',
    label: 'Features',
    description: 'A complete view of the QR ordering, menu and dashboard capabilities.',
  },
  {
    href: '/qr-ordering-system',
    label: 'QR ordering system',
    description: 'The full scan-to-order and live tracking flow.',
  },
  {
    href: '/digital-menu-for-restaurants',
    label: 'Digital menu for restaurants',
    description: 'Keep menu content, pricing and availability current.',
  },
  {
    href: '/contact',
    label: 'Contact',
    description: 'Talk to the team about your restaurant.',
  },
];

export default async function AboutPage() {
  const content = await getPublishedSiteContent();
  const about = content.about;

  const heading = about.heading || 'About DinePixel';
  const headingAccent = about.headingAccent || '';
  const body =
    about.body ||
    'DinePixel turns static restaurant menus into interactive 3D and AR dining experiences. Guests scan a QR code, explore dishes in 3D, and understand their meal before ordering. Restaurants manage their menu, branding, orders and analytics from one dashboard.';

  return (
    <PublicPage>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <section
        className="d3-section"
        style={{
          background: 'var(--bg-primary)',
          paddingTop: 'calc(var(--d3-nav-h) + 4rem)',
        }}
      >
        <div className="d3-container" style={{ maxWidth: 820 }}>
          <nav aria-label="Breadcrumb" style={{ marginBottom: '2rem' }}>
            <ol
              style={{
                display: 'flex',
                gap: '0.5rem',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                fontFamily: 'var(--font-body)',
                fontSize: '0.75rem',
                color: 'var(--text-dimmed)',
              }}
            >
              <li>
                <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" style={{ color: 'var(--text-secondary)' }}>
                About
              </li>
            </ol>
          </nav>

          <span className="d3-eyebrow">{about.eyebrow || 'ABOUT'}</span>
          <h1 className="d3-display-md" style={{ marginTop: 12 }}>
            {heading}
            {headingAccent ? (
              <>
                <br />
                <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>
                  {headingAccent}
                </em>
              </>
            ) : null}
          </h1>
          <p className="d3-body" style={{ marginTop: 18, lineHeight: 1.8 }}>
            {body}
          </p>

          <div
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <p className="d3-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              DinePixel is built mobile-first. Most guests arrive by scanning a QR code on their phone,
              so the menu experience is designed for small screens, fast loading and clear dish detail.
            </p>
            <p className="d3-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              Restaurants keep full control of their menu, branding and pricing. Dishes can include
              photos, 3D models, descriptions, dietary information, sizes and availability.
            </p>
          </div>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <span className="d3-eyebrow">WHAT WE BUILD</span>
              <h2 className="d3-display-md" style={{ marginTop: 14 }}>
                The ordering layer for modern restaurants
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p className="d3-body" style={{ lineHeight: 1.8 }}>
                DinePixel connects the guest menu, the order and the restaurant dashboard. The
                platform is designed for QR table ordering, digital menus and the day-to-day work of
                running a service.
              </p>
              <p className="d3-body" style={{ lineHeight: 1.8 }}>
                It is not a replacement for a POS, accounting suite or payment gateway. DinePixel
                focuses on the guest menu and the order journey, and is designed to sit alongside
                the systems a restaurant already uses.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginTop: '3rem' }}>
            {[
              {
                title: 'QR ordering',
                body: 'A table-aware QR menu with a clear cart, item notes and live order status.',
              },
              {
                title: 'Digital menus',
                body: 'Structured menu content with categories, dishes, photos, prices and availability.',
              },
              {
                title: 'Restaurant dashboard',
                body: 'A live order board, menu controls and order history in one place.',
              },
            ].map((item) => (
              <article key={item.title} className="d3-card" style={{ padding: '1.75rem' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    marginBottom: '0.625rem',
                  }}
                >
                  {item.title}
                </h3>
                <p className="d3-body-sm" style={{ lineHeight: 1.7 }}>
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-primary)' }}>
        <div className="d3-container" style={{ maxWidth: 820 }}>
          <span className="d3-eyebrow">HOW WE THINK</span>
          <h2 className="d3-display-md" style={{ marginTop: 14 }}>
            Useful technology should disappear into the service
          </h2>
          <p className="d3-body" style={{ marginTop: 20, lineHeight: 1.8 }}>
            A QR menu should not feel like a form. It should help a guest understand the dish, make
            a choice and send an order without friction. A dashboard should not feel like a
            spreadsheet. It should show the team what is happening now and what needs attention.
          </p>
          <p className="d3-body" style={{ marginTop: 16, lineHeight: 1.8 }}>
            That is why DinePixel keeps the guest path short, the menu content structured and the
            restaurant controls close to the order. The goal is not to add another system to the
            stack. It is to make the existing service run more smoothly.
          </p>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <div style={{ maxWidth: 620, marginBottom: '3rem' }}>
            <span className="d3-eyebrow">EXPLORE</span>
            <h2 className="d3-display-md" style={{ marginTop: 14 }}>
              See how DinePixel fits your restaurant
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exploreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="d3-card"
                style={{
                  display: 'block',
                  padding: '1.75rem',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                  }}
                >
                  {link.label}
                </h3>
                <p className="d3-body-sm" style={{ lineHeight: 1.65 }}>
                  {link.description}
                </p>
                <span
                  className="d3-btn-text"
                  style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.8125rem' }}
                >
                  Read more →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
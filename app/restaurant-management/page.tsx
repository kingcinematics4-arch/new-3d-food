import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPage from '@/components/site/PublicPage';
import { breadcrumbSchema, buildPageMetadata, serviceSchema } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Restaurant Management with QR Ordering | DinePixel',
  description:
    'How DinePixel supports restaurant management: live orders, table service, menu control, staff workflow, order history and a clear view of the service day.',
  path: '/restaurant-management',
});

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Restaurant management', path: '/restaurant-management' },
    ]),
    serviceSchema({
      name: 'Restaurant management with DinePixel',
      serviceType: 'Restaurant management software',
      description:
        'DinePixel supports restaurant management with QR ordering, live order tracking, menu control, staff workflow and order history.',
      path: '/restaurant-management',
      areaServed: ['Mumbai', 'Thane', 'Navi Mumbai', 'Maharashtra', 'India'],
    }),
  ],
};

const capabilities = [
  {
    title: 'Live order flow',
    body: 'Orders arrive in the dashboard with item detail, quantities, notes and totals. Staff can move each order through preparation and service.',
  },
  {
    title: 'Table and takeaway service',
    body: 'Table QR codes support dine-in service. A general menu link supports takeaway. Both use the same menu and order view.',
  },
  {
    title: 'Menu control',
    body: 'Categories, dishes, prices, photos, sizes and availability are managed from the dashboard, so the menu can stay current without a reprint.',
  },
  {
    title: 'Staff workflow',
    body: 'The order board gives the team one place to see what is new, what is in progress and what needs attention.',
  },
  {
    title: 'Order history',
    body: 'Order records and menu activity help the team understand demand and review service over time.',
  },
  {
    title: 'Brand-consistent menu',
    body: 'The restaurant can apply its logo, colours and menu style so the guest experience feels like part of the brand.',
  },
];

const relatedLinks = [
  {
    href: '/restaurant-management-software',
    label: 'Restaurant management software',
    description: 'A deeper look at the dashboard and operational controls.',
  },
  {
    href: '/qr-ordering-system',
    label: 'QR ordering system',
    description: 'The full scan-to-order and live tracking flow.',
  },
  {
    href: '/features',
    label: 'Features',
    description: 'A complete view of the platform.',
  },
  {
    href: '/contact',
    label: 'Contact',
    description: 'Talk to the team about your restaurant.',
  },
];

export default function RestaurantManagementPage() {
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
          paddingBottom: '4rem',
        }}
      >
        <div className="d3-container" style={{ maxWidth: 920 }}>
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
                Restaurant management
              </li>
            </ol>
          </nav>

          <span className="d3-eyebrow">RESTAURANT MANAGEMENT</span>
          <h1 className="d3-display-lg" style={{ marginTop: 14, lineHeight: 1.05 }}>
            One dashboard for
            <br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>
              the whole service.
            </em>
          </h1>
          <p
            className="d3-body"
            style={{ marginTop: 24, maxWidth: 720, fontSize: '1.0625rem', lineHeight: 1.8 }}
          >
            DinePixel is the ordering and menu layer for a restaurant. It connects the guest QR menu,
            the order and the staff dashboard, so the team can see what is happening and keep the menu
            current without adding another disconnected tool.
          </p>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <div style={{ maxWidth: 620, marginBottom: '2.5rem' }}>
            <span className="d3-eyebrow">WHAT THE DASHBOARD COVERS</span>
            <h2 className="d3-display-md" style={{ marginTop: 14 }}>
              The operational view
            </h2>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-px"
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {capabilities.map((item, index) => (
              <article
                key={item.title}
                className="d3-card"
                style={{
                  padding: '1.75rem',
                  borderRadius: 0,
                  border: 'none',
                  borderRight: index % 2 !== 1 ? '1px solid var(--border-subtle)' : 'none',
                  borderBottom: index < 4 ? '1px solid var(--border-subtle)' : 'none',
                  background: 'var(--bg-surface)',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.1875rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
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
          <span className="d3-eyebrow">A SERVICE DAY</span>
          <h2 className="d3-display-md" style={{ marginTop: 14 }}>
            How it fits the work
          </h2>
          <p className="d3-body" style={{ marginTop: 20, lineHeight: 1.8 }}>
            At the start of service, the restaurant checks the menu and availability. During service,
            orders arrive in the live board and staff update the status as the kitchen and floor work
            through them. After service, order history and menu activity provide a record of what
            guests ordered and how the service moved.
          </p>
          <p className="d3-body" style={{ marginTop: 16, lineHeight: 1.8 }}>
            The point is not to replace the team. It is to remove repetitive friction: no paper ticket
            to rewrite, no separate menu version to reconcile and no need to ask the guest what they
            ordered.
          </p>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container" style={{ maxWidth: 820 }}>
          <span className="d3-eyebrow">BOUNDARIES</span>
          <h2 className="d3-display-md" style={{ marginTop: 14 }}>
            What DinePixel is not
          </h2>
          <p className="d3-body" style={{ marginTop: 20, lineHeight: 1.8 }}>
            DinePixel is not a full POS, accounting suite or payment gateway. It focuses on the QR
            menu, the order journey and the dashboard view. Restaurants keep their existing billing
            and payment process, and DinePixel sits alongside it.
          </p>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-primary)' }}>
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <div style={{ maxWidth: 620, marginBottom: '2.5rem' }}>
            <span className="d3-eyebrow">KEEP EXPLORING</span>
            <h2 className="d3-display-md" style={{ marginTop: 14 }}>
              Related pages
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="d3-card"
                style={{
                  display: 'block',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.0625rem',
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
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
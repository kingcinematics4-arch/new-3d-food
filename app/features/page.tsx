import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPage from '@/components/site/PublicPage';
import FeatureIcon from '@/components/site/FeatureIcon';
import HomeFaq from '@/components/site/HomeFaq';
import type { Faq } from '@/lib/siteContent';
import type { IconName } from '@/lib/siteContent';
import { breadcrumbSchema, buildPageMetadata, softwareApplicationSchema } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Features | DinePixel QR Ordering and Restaurant Platform',
  description:
    'Explore DinePixel features: QR menus, 3D dish views, table ordering, live order tracking, menu management, branding and restaurant analytics.',
  path: '/features',
});

interface FeatureGroup {
  icon: IconName;
  title: string;
  description: string;
  points: string[];
}

const groups: FeatureGroup[] = [
  {
    icon: 'qr',
    title: 'QR menu and table ordering',
    description:
      'Give every table a direct path into the menu. Guests scan a QR code, browse the restaurant’s menu and place an order without installing an app.',
    points: [
      'Table-aware QR links',
      'Mobile-first guest menu',
      'Item notes and quantities',
      'Takeaway menu links',
      'Order placed from the menu',
    ],
  },
  {
    icon: 'cube',
    title: '3D and AR dish experiences',
    description:
      'Where a restaurant has a 3D model, guests can inspect a dish from different angles. AR is an enhancement for supported devices, not a requirement for the menu.',
    points: [
      'Dish-level 3D viewing',
      'Optional AR placement',
      'Works alongside photos',
      'No app download for the core menu',
    ],
  },
  {
    icon: 'layers',
    title: 'Live order tracking',
    description:
      'The guest and the restaurant see the same order status. Staff move an order through the service flow, and the guest can follow it from the table.',
    points: [
      'Placed, preparing, ready and completed states',
      'Order status history',
      'Table and takeaway context',
      'Item-level detail for staff',
    ],
  },
  {
    icon: 'grid',
    title: 'Menu management',
    description:
      'Keep the menu current without reprinting. Categories, dishes, prices, photos, sizes and availability are managed from the dashboard.',
    points: [
      'Categories and dish descriptions',
      'Photos and optional 3D models',
      'Sizes and item notes',
      'Sold-out and availability controls',
      'Brand colours, logo and menu style',
    ],
  },
  {
    icon: 'chart',
    title: 'Order and menu insights',
    description:
      'Review order history and menu activity to understand what guests are choosing and where the menu can be improved.',
    points: [
      'Order history',
      'Menu interaction insight',
      'Popular dish visibility',
      'Service performance review',
    ],
  },
  {
    icon: 'sparkle',
    title: 'Guest service tools',
    description:
      'DinePixel includes guest-facing service tools such as service requests, water requests and order tracking, subject to the restaurant’s configuration.',
    points: [
      'Call-waiter and service requests',
      'Water order flow',
      'Order tracking page',
      'Split-bill view where enabled',
    ],
  },
];

const faq: Faq = {
  enabled: true,
  heading: 'Feature questions',
  headingAccent: 'answered.',
  body: 'A quick view of what DinePixel covers and where it fits alongside existing restaurant systems.',
  items: [
    {
      id: 'feature-faq-1',
      question: 'Is DinePixel a full POS system?',
      answer:
        'No. DinePixel is a QR ordering and restaurant management layer. It focuses on menus, ordering, order tracking and the guest experience. Billing and payment reconciliation stay with the restaurant’s existing process.',
    },
    {
      id: 'feature-faq-2',
      question: 'Do guests need to download an app?',
      answer:
        'No. The QR code opens the menu in the phone browser. Guests can browse and order without installing an app.',
    },
    {
      id: 'feature-faq-3',
      question: 'Can I use DinePixel for dine-in and takeaway?',
      answer:
        'Yes. Dine-in can use table QR codes, while takeaway can use a general menu link. Both use the same menu and order dashboard.',
    },
    {
      id: 'feature-faq-4',
      question: 'Do I need 3D models for every dish?',
      answer:
        'No. 3D is optional. A restaurant can run a complete QR menu with photos, descriptions, sizes and ordering, and add 3D models only where they add value.',
    },
    {
      id: 'feature-faq-5',
      question: 'Can I manage multiple restaurant locations?',
      answer:
        'DinePixel supports restaurant accounts and menu content. Multi-location groups can discuss the right account and menu structure for their business.',
    },
  ],
};

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Features', path: '/features' },
    ]),
    softwareApplicationSchema({
      name: 'DinePixel',
      description:
        'QR ordering, digital menus, 3D dish views, live order tracking and restaurant management in one platform.',
      path: '/features',
      featureList: groups.map((group) => group.title),
    }),
  ],
};

const exploreLinks = [
  {
    href: '/about-dinepixel',
    label: 'About DinePixel',
    description: 'A comprehensive, factual overview of the platform.',
  },
  {
    href: '/how-it-works',
    label: 'How it works',
    description: 'The guest and restaurant flows, step by step.',
  },
  {
    href: '/qr-ordering-system',
    label: 'QR ordering system',
    description: 'The full scan-to-order and live tracking flow.',
  },
  {
    href: '/restaurant-qr-menu',
    label: 'Restaurant QR menu',
    description: 'Dish pages, photos, 3D views and menu structure.',
  },
  {
    href: '/digital-menu-for-restaurants',
    label: 'Digital menu for restaurants',
    description: 'Keep menu content, pricing and availability current.',
  },
  {
    href: '/restaurant-management-software',
    label: 'Restaurant management software',
    description: 'The dashboard, order board and operational controls.',
  },
  {
    href: '/faq',
    label: 'FAQ',
    description: 'Short, factual answers to common questions.',
  },
];

export default function FeaturesPage() {
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
          paddingBottom: '5rem',
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
                Features
              </li>
            </ol>
          </nav>

          <span className="d3-eyebrow">FEATURES</span>
          <h1 className="d3-display-lg" style={{ marginTop: 14, lineHeight: 1.05 }}>
            Features that make DinePixel work for
            <br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>
              modern restaurants.
            </em>
          </h1>
          <p
            className="d3-body"
            style={{ marginTop: 24, maxWidth: 700, fontSize: '1.0625rem', lineHeight: 1.8 }}
          >
            DinePixel connects the guest menu, the order and the restaurant dashboard. The
            platform is designed for QR table ordering, digital menus and the day-to-day work of
            running a service, without forcing a restaurant to replace its existing billing
            system.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem', marginTop: 32 }}>
            <Link
              href="/signup"
              className="d3-btn-primary"
              style={{ padding: '0.875rem 2rem', fontSize: '0.9375rem' }}
            >
              Start Free
            </Link>
            <Link
              href="/contact"
              className="d3-btn-ghost"
              style={{ padding: '0.875rem 2rem', fontSize: '0.9375rem' }}
            >
              Talk to the team
            </Link>
          </div>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container">
          <div style={{ maxWidth: 620, marginBottom: '3rem' }}>
            <span className="d3-eyebrow">WHAT IS INCLUDED</span>
            <h2 className="d3-display-md" style={{ marginTop: 14 }}>
              One platform, from scan to service
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {groups.map((group) => (
              <article
                key={group.title}
                className="d3-card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr)',
                  gap: '1.5rem',
                  padding: '2rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1.25rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: 'rgba(201,169,110,0.08)',
                      border: '1px solid rgba(201,169,110,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--gold)',
                      flexShrink: 0,
                    }}
                  >
                    <FeatureIcon name={group.icon} />
                  </div>

                  <div style={{ flex: 1, minWidth: 240 }}>
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.375rem',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                        marginBottom: '0.625rem',
                      }}
                    >
                      {group.title}
                    </h3>
                    <p className="d3-body-sm" style={{ lineHeight: 1.7, marginBottom: '1rem' }}>
                      {group.description}
                    </p>
                    <ul
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '0.5rem 1.25rem',
                        listStyle: 'none',
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      {group.points.map((point) => (
                        <li
                          key={point}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.8125rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              background: 'var(--gold)',
                              marginTop: '0.45rem',
                              flexShrink: 0,
                            }}
                          />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-primary)' }}>
        <div className="d3-container" style={{ maxWidth: 820 }}>
          <span className="d3-eyebrow">WHERE IT FITS</span>
          <h2 className="d3-display-md" style={{ marginTop: 14 }}>
            DinePixel is the ordering and menu layer
          </h2>
          <p className="d3-body" style={{ marginTop: 20, lineHeight: 1.8 }}>
            DinePixel is not a replacement for a POS, accounting suite or payment gateway. It is
            designed to sit alongside those systems and give the restaurant a better QR menu,
            ordering flow and order-management view. Restaurants keep control of their billing and
            payment process while DinePixel handles the guest menu and order journey.
          </p>
        </div>
      </section>

      <HomeFaq faq={faq} />

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container">
          <div style={{ maxWidth: 620, marginBottom: '3rem' }}>
            <span className="d3-eyebrow">EXPLORE</span>
            <h2 className="d3-display-md" style={{ marginTop: 14 }}>
              Go deeper on the platform
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
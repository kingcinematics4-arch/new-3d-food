import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPage from '@/components/site/PublicPage';
import { breadcrumbSchema, buildPageMetadata, SITE_URL } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'What Is DinePixel? Restaurant QR Ordering Explained | DinePixel',
  description:
    'DinePixel is a restaurant QR ordering and digital menu platform with table ordering, live order tracking, order management and a restaurant dashboard. Learn what it does, who it serves and how it works.',
  path: '/about-dinepixel',
});

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'About DinePixel', path: '/about-dinepixel' },
    ]),
    {
      '@type': 'AboutPage',
      name: 'What Is DinePixel?',
      url: `${SITE_URL}/about-dinepixel`,
      description:
        'A factual overview of DinePixel: a restaurant QR ordering and digital menu platform with table ordering, live order tracking and order management.',
      mainEntity: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en',
    },
  ],
};

const quickAnswers = [
  {
    question: 'What is DinePixel?',
    answer:
      'DinePixel is a restaurant QR ordering and digital menu platform. Guests scan a QR code, browse the restaurant menu, place an order and follow its status. Restaurants manage the menu, orders and service flow from a dashboard.',
  },
  {
    question: 'Is DinePixel a QR ordering system?',
    answer:
      'Yes. QR ordering is the core entry point. A table QR code opens the menu in the phone browser, and the guest can order without installing an app.',
  },
  {
    question: 'Who can use DinePixel?',
    answer:
      'DinePixel is built for restaurants, cafes, cloud kitchens and multi-outlet restaurant groups that want a QR menu, table ordering and a clear order-management view.',
  },
  {
    question: 'Where does DinePixel serve restaurants?',
    answer:
      'DinePixel is built for restaurants across Mumbai, Thane, Navi Mumbai, Maharashtra and India. It is delivered as a web-based platform, so it is not tied to a single physical location.',
  },
];

const capabilities = [
  'QR-based restaurant ordering',
  'Digital restaurant menus',
  'Table-based food ordering',
  'Live order tracking',
  'Restaurant order management',
  'Kitchen and staff order workflow',
  'Restaurant dashboard',
  'Menu, pricing and availability controls',
];

const relatedLinks = [
  {
    href: '/features',
    label: 'Features',
    description: 'A complete view of the QR ordering, menu and dashboard capabilities.',
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
    href: '/restaurant-management',
    label: 'Restaurant management',
    description: 'How DinePixel supports the service day.',
  },
  {
    href: '/pricing',
    label: 'Pricing',
    description: 'Published plans and what each one includes.',
  },
  {
    href: '/faq',
    label: 'FAQ',
    description: 'Short, factual answers to common questions.',
  },
];

export default function AboutDinePixelPage() {
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
                About DinePixel
              </li>
            </ol>
          </nav>

          <span className="d3-eyebrow">KNOWLEDGE BASE</span>
          <h1 className="d3-display-lg" style={{ marginTop: 14, lineHeight: 1.05 }}>
            What is DinePixel?
            <br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>
              A practical guide.
            </em>
          </h1>
          <p
            className="d3-body"
            style={{ marginTop: 24, maxWidth: 760, fontSize: '1.0625rem', lineHeight: 1.8 }}
          >
            DinePixel is a restaurant QR ordering and digital menu platform. It connects the guest
            menu, the order and the restaurant dashboard so a table can scan, order and track a meal
            without installing an app, while the restaurant manages the menu and order flow from one
            place.
          </p>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <div>
              <h2 className="d3-display-md" style={{ marginBottom: '1rem' }}>
                Who developed DinePixel?
              </h2>
              <p className="d3-body" style={{ lineHeight: 1.8 }}>
                DinePixel is developed and maintained by the DinePixel product team. The public site
                does not publish a separate legal entity name, registration number or physical office
                address. For verified business details, contact{' '}
                <a href="mailto:hello@dinepixel.com" style={{ color: 'var(--gold)' }}>
                  hello@dinepixel.com
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="d3-display-md" style={{ marginBottom: '1rem' }}>
                What does DinePixel do?
              </h2>
              <p className="d3-body" style={{ lineHeight: 1.8, marginBottom: '1.25rem' }}>
                DinePixel gives a restaurant a QR entry point into its menu, a structured ordering
                flow and a dashboard for the team. It is designed for the parts of service that
                happen between the guest sitting down and the order reaching the kitchen.
              </p>
              <ul
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.625rem 1.5rem',
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                }}
              >
                {capabilities.map((item) => (
                  <li
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.625rem',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.9375rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: 'var(--gold)',
                        marginTop: '0.55rem',
                        flexShrink: 0,
                      }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="d3-display-md" style={{ marginBottom: '1rem' }}>
                How does QR ordering work?
              </h2>
              <p className="d3-body" style={{ lineHeight: 1.8, marginBottom: '1.25rem' }}>
                The guest scans a QR code at the table. The code opens the restaurant menu in the
                phone browser. The guest browses categories, opens a dish, chooses quantities and
                available options, then sends the order. The order appears in the restaurant
                dashboard, and the guest can follow the status as the team moves it forward.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Guest side',
                    body: 'Scan, browse, choose, order and track the order status from the phone.',
                  },
                  {
                    title: 'Restaurant side',
                    body: 'Receive the order, review item detail and notes, update the status and keep the menu current.',
                  },
                ].map((item) => (
                  <article key={item.title} className="d3-card" style={{ padding: '1.5rem' }}>
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.125rem',
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

            <div>
              <h2 className="d3-display-md" style={{ marginBottom: '1rem' }}>
                What features are available?
              </h2>
              <p className="d3-body" style={{ lineHeight: 1.8, marginBottom: '1.25rem' }}>
                The platform includes a QR menu, table-aware ordering, live order tracking, menu and
                availability controls, order status updates, a restaurant dashboard and order
                history. Optional dish-level 3D and AR experiences are available where the restaurant
                has added the relevant model and the device supports it.
              </p>
              <Link
                href="/features"
                className="d3-btn-ghost"
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem' }}
              >
                See all features
              </Link>
            </div>

            <div>
              <h2 className="d3-display-md" style={{ marginBottom: '1rem' }}>
                Who can use it?
              </h2>
              <p className="d3-body" style={{ lineHeight: 1.8 }}>
                DinePixel is built for restaurants, cafes, cloud kitchens and multi-outlet groups.
                A small cafe can use a QR menu and table ordering; a larger restaurant can use richer
                dish pages, table-aware links and the live order dashboard. Takeaway can use a general
                menu link instead of a table code.
              </p>
            </div>

            <div>
              <h2 className="d3-display-md" style={{ marginBottom: '1rem' }}>
                Which geographical areas does it serve?
              </h2>
              <p className="d3-body" style={{ lineHeight: 1.8 }}>
                DinePixel is built for restaurants across Mumbai, Thane, Navi Mumbai, Maharashtra and
                India. It is delivered as a web-based platform, so it is not tied to a single physical
                location.
              </p>
            </div>

            <div>
              <h2 className="d3-display-md" style={{ marginBottom: '1rem' }}>
                How is it different from traditional restaurant ordering?
              </h2>
              <p className="d3-body" style={{ lineHeight: 1.8, marginBottom: '1.25rem' }}>
                Traditional ordering often depends on a printed menu, a server taking the order and a
                separate ticket moving to the kitchen. DinePixel keeps the menu, the order and the
                status in one connected flow. The guest can order from the table, the order arrives as
                structured item data, and the menu can be updated without a reprint.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <article className="d3-card" style={{ padding: '1.5rem' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.0625rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Traditional ordering
                  </h3>
                  <p className="d3-body-sm" style={{ lineHeight: 1.7 }}>
                    Printed menu, server takes the order, ticket or handwritten note moves to the
                    kitchen, and menu changes may require a reprint.
                  </p>
                </article>
                <article className="d3-card" style={{ padding: '1.5rem' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.0625rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    DinePixel QR ordering
                  </h3>
                  <p className="d3-body-sm" style={{ lineHeight: 1.7 }}>
                    QR menu, structured order, live status, dashboard view and menu updates without a
                    reprint.
                  </p>
                </article>
              </div>
            </div>

            <div>
              <h2 className="d3-display-md" style={{ marginBottom: '1rem' }}>
                How can restaurants contact DinePixel?
              </h2>
              <p className="d3-body" style={{ lineHeight: 1.8 }}>
                Email{' '}
                <a href="mailto:hello@dinepixel.com" style={{ color: 'var(--gold)' }}>
                  hello@dinepixel.com
                </a>{' '}
                or use the{' '}
                <Link href="/contact" style={{ color: 'var(--gold)' }}>
                  contact page
                </Link>
                . Include the restaurant name and what you are trying to set up so the team can give
                a useful answer.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-primary)' }}>
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <div style={{ maxWidth: 620, marginBottom: '2.5rem' }}>
            <span className="d3-eyebrow">QUICK ANSWERS</span>
            <h2 className="d3-display-md" style={{ marginTop: 14 }}>
              The short version
            </h2>
          </div>

          <dl style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', margin: 0 }}>
            {quickAnswers.map((item) => (
              <div
                key={item.question}
                style={{
                  paddingBottom: '1.25rem',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <dt
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                  }}
                >
                  {item.question}
                </dt>
                <dd className="d3-body-sm" style={{ margin: 0, lineHeight: 1.75 }}>
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <div style={{ maxWidth: 620, marginBottom: '2.5rem' }}>
            <span className="d3-eyebrow">KEEP EXPLORING</span>
            <h2 className="d3-display-md" style={{ marginTop: 14 }}>
              Related DinePixel pages
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
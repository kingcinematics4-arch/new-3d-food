import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPage from '@/components/site/PublicPage';
import { breadcrumbSchema, buildPageMetadata, howToSchema } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'How DinePixel Works | QR Ordering Step by Step',
  description:
    'How DinePixel works for guests and restaurants: scan a QR code, browse the menu, place an order, track its status and manage it from the restaurant dashboard.',
  path: '/how-it-works',
});

const guestSteps = [
  {
    label: 'Scan the QR code',
    description: 'The guest scans the code on the table with the phone camera.',
  },
  {
    label: 'Open the menu',
    description: 'The QR code opens the restaurant menu in the phone browser. No app install is required.',
  },
  {
    label: 'Choose dishes',
    description: 'The guest browses categories, opens a dish and chooses quantity, size and item notes where available.',
  },
  {
    label: 'Place the order',
    description: 'The guest reviews the cart and sends the order to the restaurant.',
  },
  {
    label: 'Track the status',
    description: 'The guest can follow the order as it moves through preparation and service.',
  },
];

const restaurantSteps = [
  {
    label: 'Publish the menu',
    description: 'The restaurant sets up categories, dishes, prices, photos, sizes and availability in the dashboard.',
  },
  {
    label: 'Place table QR codes',
    description: 'Each table gets a QR code that opens the restaurant menu with the right table context.',
  },
  {
    label: 'Receive orders',
    description: 'Orders arrive in the live dashboard with item detail, quantities, notes and totals.',
  },
  {
    label: 'Update the status',
    description: 'Staff move the order through preparation and service while the guest sees the same status.',
  },
  {
    label: 'Review the service',
    description: 'Order history and menu activity help the team understand demand and refine the menu.',
  },
];

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'How it works', path: '/how-it-works' },
    ]),
    howToSchema({
      name: 'How DinePixel QR ordering works',
      description:
        'A step-by-step view of how a guest scans a QR code, places an order and tracks it, and how the restaurant receives and manages the order.',
      path: '/how-it-works',
      steps: guestSteps,
    }),
  ],
};

const relatedLinks = [
  {
    href: '/qr-ordering-system',
    label: 'QR ordering system',
    description: 'The full product overview and ordering flow.',
  },
  {
    href: '/restaurant-qr-menu',
    label: 'Restaurant QR menu',
    description: 'How dish pages, photos and menu content work for guests.',
  },
  {
    href: '/restaurant-management',
    label: 'Restaurant management',
    description: 'How the dashboard supports the service day.',
  },
  {
    href: '/faq',
    label: 'FAQ',
    description: 'Short, factual answers to common questions.',
  },
];

export default function HowItWorksPage() {
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
                How it works
              </li>
            </ol>
          </nav>

          <span className="d3-eyebrow">HOW IT WORKS</span>
          <h1 className="d3-display-lg" style={{ marginTop: 14, lineHeight: 1.05 }}>
            From scan to served.
            <br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>
              One connected flow.
            </em>
          </h1>
          <p
            className="d3-body"
            style={{ marginTop: 24, maxWidth: 720, fontSize: '1.0625rem', lineHeight: 1.8 }}
          >
            DinePixel connects the guest menu, the order and the restaurant dashboard. The guest
            scans a QR code and orders from the table. The order arrives in the dashboard with item
            detail and notes, and the status stays visible to both sides.
          </p>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <div style={{ maxWidth: 620, marginBottom: '2.5rem' }}>
            <span className="d3-eyebrow">GUEST FLOW</span>
            <h2 className="d3-display-md" style={{ marginTop: 14 }}>
              What the guest does
            </h2>
          </div>

          <ol
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}
          >
            {guestSteps.map((step, index) => (
              <li
                key={step.label}
                className="d3-card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto minmax(0, 1fr)',
                  gap: '1.25rem',
                  alignItems: 'start',
                  padding: '1.5rem',
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gold)',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.9375rem',
                    flexShrink: 0,
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.1875rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '0.375rem',
                    }}
                  >
                    {step.label}
                  </h3>
                  <p className="d3-body-sm" style={{ lineHeight: 1.7 }}>
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-primary)' }}>
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <div style={{ maxWidth: 620, marginBottom: '2.5rem' }}>
            <span className="d3-eyebrow">RESTAURANT FLOW</span>
            <h2 className="d3-display-md" style={{ marginTop: 14 }}>
              What the restaurant does
            </h2>
          </div>

          <ol
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}
          >
            {restaurantSteps.map((step, index) => (
              <li
                key={step.label}
                className="d3-card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto minmax(0, 1fr)',
                  gap: '1.25rem',
                  alignItems: 'start',
                  padding: '1.5rem',
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gold)',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.9375rem',
                    flexShrink: 0,
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.1875rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '0.375rem',
                    }}
                  >
                    {step.label}
                  </h3>
                  <p className="d3-body-sm" style={{ lineHeight: 1.7 }}>
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container" style={{ maxWidth: 820 }}>
          <span className="d3-eyebrow">BOUNDARIES</span>
          <h2 className="d3-display-md" style={{ marginTop: 14 }}>
            What DinePixel does not replace
          </h2>
          <p className="d3-body" style={{ marginTop: 20, lineHeight: 1.8 }}>
            DinePixel is the QR menu, ordering and order-management layer. It is not a full POS,
            accounting suite or payment gateway. Restaurants keep their existing billing and payment
            process, and DinePixel focuses on the guest menu and the order journey.
          </p>
          <p className="d3-body" style={{ marginTop: 16, lineHeight: 1.8 }}>
            It also does not remove the need for staff judgement. The kitchen checks the order, the
            floor team manages the room, and the restaurant decides how to handle special requests.
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
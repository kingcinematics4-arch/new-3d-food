import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPage from '@/components/site/PublicPage';
import { getPublishedSiteContent } from '@/lib/siteContent.server';
import { breadcrumbSchema, SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contact DinePixel | QR Ordering and Restaurant Support',
    description:
      'Contact the DinePixel team for product questions, restaurant onboarding, support or partnership enquiries. Email hello@dinepixel.com.',
    alternates: {
      canonical: '/contact',
    },
    openGraph: {
      title: 'Contact DinePixel | QR Ordering and Restaurant Support',
      description:
        'Contact the DinePixel team for product questions, restaurant onboarding, support or partnership enquiries.',
      type: 'website',
      url: '/contact',
    },
  };
}

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Contact', path: '/contact' },
    ]),
    {
      '@type': 'ContactPage',
      name: 'Contact DinePixel',
      url: `${SITE_URL}/contact`,
      description:
        'Contact the DinePixel team for product questions, restaurant onboarding, support or partnership enquiries.',
      mainEntity: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en',
    },
  ],
};

const topics = [
  {
    title: 'Product questions',
    body: 'Ask how QR ordering, digital menus, 3D dish views or live order tracking work for your restaurant.',
  },
  {
    title: 'Restaurant onboarding',
    body: 'Talk through menu setup, QR codes, table ordering and the dashboard before you start.',
  },
  {
    title: 'Support',
    body: 'Contact the team about an existing account, a menu issue or an order-flow question.',
  },
  {
    title: 'Partnerships',
    body: 'Discuss restaurant groups, multi-location setups or partnership enquiries.',
  },
];

const relatedLinks = [
  {
    href: '/about-dinepixel',
    label: 'About DinePixel',
    description: 'A comprehensive, factual overview of the platform.',
  },
  {
    href: '/features',
    label: 'Features',
    description: 'See what is included in the DinePixel platform.',
  },
  {
    href: '/faq',
    label: 'FAQ',
    description: 'Short, factual answers to common questions.',
  },
  {
    href: '/qr-ordering-system',
    label: 'QR ordering system',
    description: 'Explore the scan-to-order and live tracking flow.',
  },
  {
    href: '/about',
    label: 'About DinePixel',
    description: 'The brand page.',
  },
];

export default async function ContactPage() {
  const content = await getPublishedSiteContent();
  const contact = content.contact;

  const heading = contact.heading || 'Contact Us';
  const headingAccent = contact.headingAccent || '';
  const body =
    contact.body ||
    'Questions about DinePixel, restaurant onboarding, support or partnerships? Send us a message and we will get back to you.';
  const email = contact.email || 'hello@dinepixel.com';
  const phone = contact.phone || '';
  const address = contact.address || '';

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
                Contact
              </li>
            </ol>
          </nav>

          <span className="d3-eyebrow">{contact.eyebrow || 'CONTACT'}</span>
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

          <dl
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
              <dt className="d3-eyebrow" style={{ color: 'var(--text-dimmed)', minWidth: 80 }}>
                EMAIL
              </dt>
              <dd style={{ margin: 0 }}>
                <a href={`mailto:${email}`} style={{ color: 'var(--gold)' }}>
                  {email}
                </a>
              </dd>
            </div>

            {phone ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
                <dt className="d3-eyebrow" style={{ color: 'var(--text-dimmed)', minWidth: 80 }}>
                  PHONE
                </dt>
                <dd style={{ margin: 0, color: 'var(--text-secondary)' }}>{phone}</dd>
              </div>
            ) : null}

            {address ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
                <dt className="d3-eyebrow" style={{ color: 'var(--text-dimmed)', minWidth: 80 }}>
                  ADDRESS
                </dt>
                <dd style={{ margin: 0, color: 'var(--text-secondary)' }}>{address}</dd>
              </div>
            ) : null}
          </dl>

          <p className="d3-body-sm" style={{ marginTop: 24, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            For the fastest help, include your restaurant name, the page or order you are asking
            about, and a short description of what you are trying to do.
          </p>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <div style={{ maxWidth: 620, marginBottom: '3rem' }}>
            <span className="d3-eyebrow">HOW WE CAN HELP</span>
            <h2 className="d3-display-md" style={{ marginTop: 14 }}>
              Tell us what you are trying to solve
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((topic) => (
              <article key={topic.title} className="d3-card" style={{ padding: '1.75rem' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                  }}
                >
                  {topic.title}
                </h3>
                <p className="d3-body-sm" style={{ lineHeight: 1.7 }}>
                  {topic.body}
                </p>
              </article>
            ))}
          </div>

          <div
            className="d3-note"
            style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: 12 }}
          >
            <p className="d3-body-sm" style={{ lineHeight: 1.7, margin: 0 }}>
              DinePixel is built for restaurants across Mumbai, Thane, Navi Mumbai, Maharashtra and
              India. The platform is delivered as a web-based QR ordering and menu system, so it is
              not tied to a single physical location.
            </p>
          </div>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-primary)' }}>
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <div style={{ maxWidth: 620, marginBottom: '3rem' }}>
            <span className="d3-eyebrow">BEFORE YOU WRITE</span>
            <h2 className="d3-display-md" style={{ marginTop: 14 }}>
              Useful pages to explore
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
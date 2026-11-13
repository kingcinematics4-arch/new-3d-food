import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPage from '@/components/site/PublicPage';
import HomePricing from '@/components/site/HomePricing';
import FaqAccordion from '@/components/site/FaqAccordion';
import { getPublishedSiteContent } from '@/lib/siteContent.server';
import {
  breadcrumbSchema,
  buildPageMetadata,
  faqSchema,
  offerCatalogSchema,
} from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'DinePixel Pricing | QR Ordering Plans for Restaurants',
  description:
    'DinePixel pricing for restaurants: Starter, Pro and Enterprise plans with QR menus, 3D models, AR, analytics, custom branding and multi-location options.',
  path: '/pricing',
});

const faqGroups = [
  {
    title: 'Plans and billing',
    items: [
      {
        question: 'How much does DinePixel cost?',
        answer:
          'DinePixel publishes Starter at ₹29 per month, Pro at ₹79 per month and a custom Enterprise plan. The current published plans are shown on this page and in the product pricing section.',
      },
      {
        question: 'What is included in the Starter plan?',
        answer:
          'The Starter plan is designed for small restaurants and includes up to 30 menu items, 5 3D models, QR code generation, basic analytics and standard support.',
      },
      {
        question: 'What is included in the Pro plan?',
        answer:
          'The Pro plan is designed for growing restaurants and includes unlimited menu items, 50 3D models, AR experiences, advanced analytics, custom branding and priority support.',
      },
      {
        question: 'What is included in the Enterprise plan?',
        answer:
          'The Enterprise plan is for restaurant groups and hotels. It includes multiple restaurant locations, unlimited 3D models, a white-label platform, a dedicated account manager, custom integrations and an SLA.',
      },
    ],
  },
  {
    title: 'What is not included',
    items: [
      {
        question: 'Is DinePixel a POS or billing system?',
        answer:
          'No. DinePixel focuses on QR menus, ordering, live order tracking and restaurant management. Billing and payment reconciliation remain part of the restaurant’s existing process.',
      },
      {
        question: 'Do I need new hardware?',
        answer:
          'The guest experience runs in a phone browser. Restaurants use the dashboard in a browser, so no specialised guest hardware is required for the QR menu flow.',
      },
      {
        question: 'Do guests need to download an app?',
        answer:
          'No. The QR code opens the menu in the phone browser. Guests can browse and order without installing an app.',
      },
    ],
  },
];

const allFaqs = faqGroups.flatMap((group) => group.items);

export default async function PricingPage() {
  const content = await getPublishedSiteContent();
  const pricing = content.pricing;
  const plans = pricing.plans.filter((plan) => plan.enabled);
  const numericOffers = plans
    .map((plan) => ({
      name: plan.name,
      price: plan.price.replace(/[^0-9.]/g, ''),
    }))
    .filter((offer) => offer.name && /^\d+(?:\.\d+)?$/.test(offer.price));

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Pricing', path: '/pricing' },
      ]),
      offerCatalogSchema({
        name: 'DinePixel pricing',
        path: '/pricing',
        offers: numericOffers,
      }),
      faqSchema(allFaqs),
    ],
  };

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
                Pricing
              </li>
            </ol>
          </nav>

          <span className="d3-eyebrow">PRICING</span>
          <h1 className="d3-display-lg" style={{ marginTop: 14, lineHeight: 1.05 }}>
            Simple, transparent
            <br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>
              restaurant plans.
            </em>
          </h1>
          <p
            className="d3-body"
            style={{ marginTop: 24, maxWidth: 680, fontSize: '1.0625rem', lineHeight: 1.8 }}
          >
            DinePixel plans are built around the QR menu, ordering flow and restaurant dashboard.
            The published plans below show the current product pricing. DinePixel does not replace
            your POS, accounting suite or payment gateway.
          </p>
        </div>
      </section>

      {pricing.enabled ? (
        <HomePricing pricing={pricing} />
      ) : (
        <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
          <div className="d3-container">
            <div className="d3-empty" style={{ maxWidth: 520, margin: '0 auto' }}>
              <p className="d3-empty-title">Pricing has not been published yet.</p>
              <p className="d3-empty-body">
                Contact the team at hello@dinepixel.com for the current plans.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="d3-section" style={{ background: 'var(--bg-primary)' }}>
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <div style={{ maxWidth: 620, marginBottom: '2.5rem' }}>
            <span className="d3-eyebrow">PRICING FAQ</span>
            <h2 className="d3-display-md" style={{ marginTop: 14 }}>
              Questions about plans
            </h2>
          </div>
          <FaqAccordion groups={faqGroups} />
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container" style={{ maxWidth: 820 }}>
          <div
            className="d3-note d3-note-accent"
            style={{
              padding: '2rem',
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Not sure which plan fits?
            </h2>
            <p className="d3-body-sm" style={{ lineHeight: 1.7 }}>
              Tell the team about your restaurant format, menu size and service style. They can help
              you choose the right starting point.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <Link
                href="/signup"
                className="d3-btn-primary"
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem' }}
              >
                Start Free
              </Link>
              <Link
                href="/contact"
                className="d3-btn-ghost"
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem' }}
              >
                Talk to the team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
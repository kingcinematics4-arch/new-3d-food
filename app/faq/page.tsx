import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPage from '@/components/site/PublicPage';
import FaqAccordion, { type FaqGroup } from '@/components/site/FaqAccordion';
import { breadcrumbSchema, buildPageMetadata, faqSchema } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'DinePixel FAQ | QR Ordering, Digital Menus and Restaurant Support',
  description:
    'Factual answers about DinePixel: what it is, how QR ordering works, table ordering, digital menus, live order tracking, availability and getting started.',
  path: '/faq',
});

const groups: FaqGroup[] = [
  {
    title: 'What DinePixel is',
    description: 'Short answers about the product and what it is designed to do.',
    items: [
      {
        question: 'What is DinePixel?',
        answer:
          'DinePixel is a restaurant QR ordering and digital menu platform. Guests scan a QR code, browse the menu, place an order and follow its status. Restaurants manage the menu, orders and service flow from a dashboard.',
      },
      {
        question: 'Is DinePixel a QR ordering system?',
        answer:
          'Yes. QR ordering is the core entry point. A table QR code opens the menu in the phone browser, and the guest can order without installing an app.',
      },
      {
        question: 'Is DinePixel a POS or billing system?',
        answer:
          'No. DinePixel focuses on QR menus, ordering, live order tracking and restaurant management. Billing and payment reconciliation remain part of the restaurant’s existing process.',
      },
      {
        question: 'Do guests need to download an app?',
        answer:
          'No. The QR code opens the menu in the phone browser. Guests can browse and order without installing an app.',
      },
      {
        question: 'Do I need new hardware?',
        answer:
          'The guest experience runs in a phone browser. Restaurants use the dashboard in a browser, so no specialised guest hardware is required for the QR menu flow.',
      },
    ],
  },
  {
    title: 'How ordering works',
    description: 'The guest and restaurant flow, from scan to served.',
    items: [
      {
        question: 'How does QR ordering work?',
        answer:
          'The guest scans the QR code at the table. The code opens the restaurant menu in the phone browser. The guest browses categories, chooses quantities and available options, and places the order. The order appears in the restaurant dashboard, and the guest can follow the status.',
      },
      {
        question: 'Does DinePixel support table-based ordering?',
        answer:
          'Yes. Table-aware QR links carry the table context into the menu and the order, so dine-in service can use a QR code on each table.',
      },
      {
        question: 'Can customers order food by scanning a QR code?',
        answer:
          'Yes. Scanning the QR code is the main way guests open the menu and place an order.',
      },
      {
        question: 'Can restaurants manage orders in real time?',
        answer:
          'Yes. Orders appear in the live dashboard with item detail, quantities, notes and totals. Staff can update the order status as it moves through preparation and service.',
      },
      {
        question: 'Does DinePixel support digital menus?',
        answer:
          'Yes. The digital menu includes categories, dishes, prices, photos, descriptions, sizes and availability controls. Menu changes can be made without reprinting.',
      },
      {
        question: 'Can I use DinePixel for takeaway?',
        answer:
          'Yes. Takeaway orders can use a general menu link instead of a table QR code. The same menu and order dashboard apply.',
      },
    ],
  },
  {
    title: 'Availability and coverage',
    description: 'Where DinePixel is built to serve and what it does not replace.',
    items: [
      {
        question: 'Is DinePixel available in Mumbai?',
        answer:
          'Yes. DinePixel is built for restaurants in Mumbai and the wider Mumbai region. It is delivered as a web-based QR ordering and menu platform, so it is not tied to a single physical location.',
      },
      {
        question: 'Is DinePixel available in Thane?',
        answer:
          'Yes. DinePixel is built for restaurants across Thane, from small cafes to full-service restaurants. Table QR ordering and takeaway menu links are both supported.',
      },
      {
        question: 'Is DinePixel available in Navi Mumbai?',
        answer:
          'Yes. DinePixel is built for restaurants, cafes and cloud kitchens in Navi Mumbai. The same QR menu and order dashboard apply.',
      },
      {
        question: 'Does DinePixel serve restaurants across India?',
        answer:
          'DinePixel is built for restaurants across Mumbai, Thane, Navi Mumbai, Maharashtra and India. It is delivered as a web-based platform, so it is not tied to a single physical location.',
      },
    ],
  },
  {
    title: 'Getting started',
    description: 'How a restaurant can begin with DinePixel.',
    items: [
      {
        question: 'How can a restaurant get started with DinePixel?',
        answer:
          'Start with a free account, set up the restaurant menu and QR entry points, then publish the menu. For help with the right setup, contact hello@dinepixel.com.',
      },
      {
        question: 'Can I keep paper menus as well?',
        answer:
          'Yes. Many restaurants use a digital menu for daily changes and keep a smaller printed selection for guests who prefer paper.',
      },
      {
        question: 'Can I manage multiple restaurant locations?',
        answer:
          'DinePixel supports restaurant accounts and menu content. Multi-location groups can discuss the right account and menu structure for their business.',
      },
      {
        question: 'How can I contact DinePixel?',
        answer:
          'Email hello@dinepixel.com or use the contact page. Include your restaurant name and what you are trying to set up so the team can give a useful answer.',
      },
    ],
  },
];

const allFaqs = groups.flatMap((group) => group.items);

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'FAQ', path: '/faq' },
    ]),
    faqSchema(allFaqs),
  ],
};

const relatedLinks = [
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
    description: 'The full product overview and ordering flow.',
  },
  {
    href: '/contact',
    label: 'Contact',
    description: 'Talk to the team about your restaurant.',
  },
];

export default function FaqPage() {
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
                FAQ
              </li>
            </ol>
          </nav>

          <span className="d3-eyebrow">FAQ</span>
          <h1 className="d3-display-lg" style={{ marginTop: 14, lineHeight: 1.05 }}>
            Questions, answered
            <br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>
              without the fluff.
            </em>
          </h1>
          <p
            className="d3-body"
            style={{ marginTop: 24, maxWidth: 700, fontSize: '1.0625rem', lineHeight: 1.8 }}
          >
            Factual answers about DinePixel, QR ordering, digital menus, table ordering, live order
            tracking and getting started. If your question is not here, contact the team.
          </p>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <FaqAccordion groups={groups} />
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
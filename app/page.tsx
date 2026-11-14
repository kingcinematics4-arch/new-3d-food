// app/page.tsx
//
// PUBLIC DINEPIXEL WEBSITE
//
// A Server Component that renders the PUBLISHED content document.
//
// It reads the live document on the server and composes the page from it. No
// content is hardcoded here: every heading, plan, feature and answer comes from
// the published document that the owner controls in /admin. If nothing has been
// published yet — or storage is unavailable — the shipped defaults are used, so
// the website always renders.
//
// Admin changes never appear here until they are published. Draft edits live
// only in the /admin panel.

import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { getPublishedSiteContent } from '@/lib/siteContent.server';
import { brandingButtonClass, brandingToCssVars } from '@/lib/siteBranding';
import { SECTION_LABELS } from '@/lib/siteContent';
import { serviceSchema, softwareApplicationSchema } from '@/lib/seo';

const HOMEPAGE_TITLE = 'DinePixel – Premium QR Ordering System for Restaurants in India';
const HOMEPAGE_DESCRIPTION =
  'Discover DinePixel, a smart restaurant QR ordering system with digital menus, table ordering, live order tracking and powerful restaurant management features. Built for modern restaurants in Mumbai, Thane, Navi Mumbai and across India.';
const HOMEPAGE_URL = 'https://dinepixel.com';
const HOMEPAGE_OG_IMAGE = 'https://dinepixel.com/images/dinepixel-og.png';

export const metadata: Metadata = {
  title: HOMEPAGE_TITLE,
  description: HOMEPAGE_DESCRIPTION,
  keywords: [
    'QR ordering system',
    'best QR ordering system',
    'premium QR ordering system',
    '3D QR ordering system',
    'smart QR ordering system',
    'digital QR menu',
    'restaurant QR ordering system',
    'QR code food ordering system',
    'contactless restaurant ordering',
    'online restaurant ordering system',
    'restaurant digital menu system',
    'QR menu with online ordering',
    'restaurant management software',
    'restaurant automation software',
    'QR table ordering system',
    'scan and order restaurant system',
    'dine-in QR ordering software',
    'smart restaurant technology',
    'QR ordering system Mumbai',
    'QR ordering system Thane',
    'QR ordering system Navi Mumbai',
    'QR ordering system India',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    url: HOMEPAGE_URL,
    siteName: 'DinePixel',
    type: 'website',
    images: [
      {
        url: HOMEPAGE_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'DinePixel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    images: [HOMEPAGE_OG_IMAGE],
  },
};

import HomeHero from '@/components/site/HomeHero';
import HomeFeatures from '@/components/site/HomeFeatures';
import HomeHowItWorks from '@/components/site/HomeHowItWorks';
import HomeFaq from '@/components/site/HomeFaq';
import HomeFooter from '@/components/site/HomeFooter';
import BrandDivider from '@/components/site/BrandDivider';
import EditorialSection from '@/components/site/EditorialSection';

// Always read the current published document; never serve a stale build.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    softwareApplicationSchema({
      name: 'DinePixel',
      description: HOMEPAGE_DESCRIPTION,
      path: '/',
      featureList: [
        'QR menu and table ordering',
        '3D and AR dish experiences',
        'Live order tracking',
        'Menu management',
        'Restaurant dashboard',
        'Order and menu insights',
      ],
    }),
    serviceSchema({
      name: 'DinePixel QR Ordering System',
      serviceType: 'Restaurant QR ordering system',
      description: HOMEPAGE_DESCRIPTION,
      path: '/',
      areaServed: ['Mumbai', 'Thane', 'Navi Mumbai', 'Maharashtra', 'India'],
    }),
  ],
};

export default async function PublicHomePage() {
  const content = await getPublishedSiteContent();

  return (
    <div
      className={`flex flex-col min-h-screen ${brandingButtonClass(content.branding)}`}
      style={{
        background: content.branding.backgroundColor,
        // Branding settings are published as CSS variables, which the existing
        // d3-* classes already read. No extra stylesheet is shipped.
        ...brandingToCssVars(content.branding),
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />

      <main className="flex-1">
        {/* The page opens on the hero itself. There is no introductory
            animation in front of it and no scroll distance spent before the
            headline arrives. */}
        {content.hero.enabled ? <HomeHero hero={content.hero} /> : null}

        {/* One branded breath between the hero and the page content. */}
        {content.hero.enabled ? <BrandDivider /> : null}

        <EditorialSection
          id="about"
          label={SECTION_LABELS.about}
          content={content.about}
        />

        <HomeFeatures features={content.features} />

        <EditorialSection id="menu3d" label={SECTION_LABELS.menu3d} content={content.menu3d} />

        <EditorialSection id="ar" label={SECTION_LABELS.ar} content={content.ar} />

        <EditorialSection id="qr" label={SECTION_LABELS.qr} content={content.qr} />

        <EditorialSection
          id="dashboard"
          label={SECTION_LABELS.dashboard}
          content={content.dashboard}
        />

        <EditorialSection
          id="analytics"
          label={SECTION_LABELS.analytics}
          content={content.analytics}
        />

        <HomeHowItWorks howItWorks={content.howItWorks} />

        {content.faq.enabled ? <HomeFaq faq={content.faq} /> : null}

        <EditorialSection
          id="contact"
          label={SECTION_LABELS.contact}
          content={content.contact}
          variant="contact"
        />

        <HomeFooter footer={content.footer} branding={content.branding} />
      </main>
    </div>
  );
}
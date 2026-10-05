// app/page.tsx
//
// PUBLIC DINE3D WEBSITE
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

import Navbar from '@/components/Navbar';
import { getPublishedSiteContent } from '@/lib/siteContent.server';
import { brandingButtonClass, brandingToCssVars } from '@/lib/siteBranding';
import { SECTION_LABELS } from '@/lib/siteContent';

import HomeHero from '@/components/site/HomeHero';
import HomeFeatures from '@/components/site/HomeFeatures';
import HomeHowItWorks from '@/components/site/HomeHowItWorks';
import HomePricing from '@/components/site/HomePricing';
import HomeFaq from '@/components/site/HomeFaq';
import HomeFooter from '@/components/site/HomeFooter';
import BrandDivider from '@/components/site/BrandDivider';
import EditorialSection from '@/components/site/EditorialSection';

// Always read the current published document; never serve a stale build.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

        <HomePricing pricing={content.pricing} />

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
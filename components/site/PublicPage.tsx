import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import HomeFooter from '@/components/site/HomeFooter';
import { getPublishedSiteContent } from '@/lib/siteContent.server';
import { brandingButtonClass, brandingToCssVars } from '@/lib/siteBranding';

/**
 * Shared shell for public, indexable pages (About, Contact, Privacy, Terms).
 * Reuses the published branding and footer so these pages match the homepage
 * without duplicating the site layout.
 */
export default async function PublicPage({ children }: { children: ReactNode }) {
  const content = await getPublishedSiteContent();

  return (
    <div
      className={`flex flex-col min-h-screen ${brandingButtonClass(content.branding)}`}
      style={{
        background: content.branding.backgroundColor,
        ...brandingToCssVars(content.branding),
      }}
    >
      <Navbar />
      <main className="flex-1">{children}</main>
      <HomeFooter footer={content.footer} branding={content.branding} />
    </div>
  );
}
import type { Metadata } from 'next';
import PublicPage from '@/components/site/PublicPage';
import { getPublishedSiteContent } from '@/lib/siteContent.server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'About Us — DinePixel',
    description:
      'DinePixel turns static restaurant menus into interactive 3D and AR dining experiences, accessible through a simple QR code.',
    alternates: {
      canonical: '/about',
    },
    openGraph: {
      title: 'About Us — DinePixel',
      description:
        'DinePixel turns static restaurant menus into interactive 3D and AR dining experiences, accessible through a simple QR code.',
      type: 'website',
      url: '/about',
    },
  };
}

export default async function AboutPage() {
  const content = await getPublishedSiteContent();
  const about = content.about;

  const heading = about.heading || 'About DinePixel';
  const headingAccent = about.headingAccent || '';
  const body =
    about.body ||
    'DinePixel turns static restaurant menus into interactive 3D and AR dining experiences. Guests scan a QR code, explore dishes in 3D, and understand their meal before ordering. Restaurants manage their menu, branding, orders and analytics from one dashboard.';

  return (
    <PublicPage>
      <section className="d3-section" style={{ background: 'var(--bg-primary)' }}>
        <div className="d3-container" style={{ maxWidth: 820 }}>
          <span className="d3-eyebrow">{about.eyebrow || 'ABOUT'}</span>
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
          <p className="d3-body" style={{ marginTop: 18 }}>
            {body}
          </p>

          <div
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <p className="d3-body" style={{ color: 'var(--text-secondary)' }}>
              DinePixel is built mobile-first. Most guests arrive by scanning a QR code on their phone,
              so the menu experience is designed for small screens, fast loading and clear dish detail.
            </p>
            <p className="d3-body" style={{ color: 'var(--text-secondary)' }}>
              Restaurants keep full control of their menu, branding and pricing. Dishes can include
              photos, 3D models, descriptions, dietary information, sizes and availability.
            </p>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
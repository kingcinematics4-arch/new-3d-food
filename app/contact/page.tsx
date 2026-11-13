import type { Metadata } from 'next';
import PublicPage from '@/components/site/PublicPage';
import { getPublishedSiteContent } from '@/lib/siteContent.server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contact Us — DinePixel',
    description:
      'Contact the DinePixel team for product questions, restaurant onboarding, support or partnership enquiries.',
    alternates: {
      canonical: '/contact',
    },
    openGraph: {
      title: 'Contact Us — DinePixel',
      description:
        'Contact the DinePixel team for product questions, restaurant onboarding, support or partnership enquiries.',
      type: 'website',
      url: '/contact',
    },
  };
}

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
      <section className="d3-section" style={{ background: 'var(--bg-primary)' }}>
        <div className="d3-container" style={{ maxWidth: 820 }}>
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
          <p className="d3-body" style={{ marginTop: 18 }}>
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
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
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
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <dt className="d3-eyebrow" style={{ color: 'var(--text-dimmed)', minWidth: 80 }}>
                  PHONE
                </dt>
                <dd style={{ margin: 0, color: 'var(--text-secondary)' }}>{phone}</dd>
              </div>
            ) : null}

            {address ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <dt className="d3-eyebrow" style={{ color: 'var(--text-dimmed)', minWidth: 80 }}>
                  ADDRESS
                </dt>
                <dd style={{ margin: 0, color: 'var(--text-secondary)' }}>{address}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>
    </PublicPage>
  );
}
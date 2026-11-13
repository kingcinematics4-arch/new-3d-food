import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPage from '@/components/site/PublicPage';
import { BLOG_ARTICLES } from '@/lib/blogContent';
import { breadcrumbSchema, buildPageMetadata, SITE_URL } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Restaurant Guides and Insights | DinePixel Blog',
  description:
    'Practical guides on QR ordering, digital menus and restaurant automation for modern restaurant teams.',
  path: '/blog',
});

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
}

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
    ]),
    {
      '@type': 'Blog',
      name: 'DinePixel Blog',
      description:
        'Practical guides on QR ordering, digital menus and restaurant automation for modern restaurant teams.',
      url: `${SITE_URL}/blog`,
      inLanguage: 'en',
      publisher: { '@id': `${SITE_URL}/#organization` },
      blogPost: BLOG_ARTICLES.map((article) => ({
        '@type': 'BlogPosting',
        headline: article.title,
        description: article.metaDescription,
        url: `${SITE_URL}/blog/${article.slug}`,
        datePublished: article.datePublished,
        dateModified: article.dateModified,
      })),
    },
  ],
};

export default function BlogIndexPage() {
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
                Blog
              </li>
            </ol>
          </nav>

          <span className="d3-eyebrow">DINEPIXEL BLOG</span>
          <h1 className="d3-display-lg" style={{ marginTop: 14, lineHeight: 1.05 }}>
            Guides for modern
            <br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>
              restaurant teams.
            </em>
          </h1>
          <p
            className="d3-body"
            style={{ marginTop: 24, maxWidth: 680, fontSize: '1.0625rem', lineHeight: 1.8 }}
          >
            Practical notes on QR ordering, digital menus and restaurant automation. No invented
            statistics, no filler — just the operational questions restaurants actually ask.
          </p>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {BLOG_ARTICLES.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="d3-card"
                style={{
                  display: 'block',
                  padding: '2rem',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                  }}
                >
                  <span
                    className="d3-eyebrow"
                    style={{ color: 'var(--gold)', fontSize: '0.5625rem' }}
                  >
                    GUIDE
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.6875rem',
                      color: 'var(--text-dimmed)',
                    }}
                  >
                    {formatDate(article.datePublished)} · {article.readTime}
                  </span>
                </div>

                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.5rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.25,
                    marginBottom: '0.75rem',
                  }}
                >
                  {article.title}
                </h2>
                <p className="d3-body-sm" style={{ lineHeight: 1.7, maxWidth: 700 }}>
                  {article.excerpt}
                </p>
                <span
                  className="d3-btn-text"
                  style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.8125rem' }}
                >
                  Read the guide →
                </span>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: '3rem' }}>
            <span className="d3-eyebrow">EXPLORE THE PLATFORM</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginTop: '1.25rem' }}>
              <Link href="/qr-ordering-system" className="d3-card" style={{ padding: '1.5rem', textDecoration: 'none', color: 'inherit' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  QR ordering system
                </h3>
                <p className="d3-body-sm" style={{ lineHeight: 1.65 }}>
                  The full scan-to-order and live tracking flow.
                </p>
              </Link>
              <Link href="/digital-menu-for-restaurants" className="d3-card" style={{ padding: '1.5rem', textDecoration: 'none', color: 'inherit' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Digital menu for restaurants
                </h3>
                <p className="d3-body-sm" style={{ lineHeight: 1.65 }}>
                  Keep menu content, pricing and availability current.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
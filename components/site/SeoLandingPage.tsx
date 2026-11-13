import Link from 'next/link';
import PublicPage from '@/components/site/PublicPage';
import FeatureIcon from '@/components/site/FeatureIcon';
import HomeFaq from '@/components/site/HomeFaq';
import type { Faq } from '@/lib/siteContent';
import type { SeoPageContent } from '@/lib/seoContent';
import {
  breadcrumbSchema,
  faqSchema,
  serviceSchema,
  softwareApplicationSchema,
} from '@/lib/seo';

export default function SeoLandingPage({ page }: { page: SeoPageContent }) {
  const faq: Faq = {
    enabled: true,
    heading: page.faqTitle,
    headingAccent: '',
    body: 'If your question is not covered here, contact the DinePixel team and we will help you work through it.',
    items: page.faqs.map((item, index) => ({
      id: `${page.slug.replace(/\//g, '-')}-faq-${index + 1}`,
      question: item.question,
      answer: item.answer,
    })),
  };

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: page.navLabel, path: page.slug },
      ]),
      softwareApplicationSchema({
        name: 'DinePixel',
        description: page.metaDescription,
        path: page.slug,
        featureList: page.features.map((feature) => feature.title),
      }),
      serviceSchema({
        name: page.serviceType,
        serviceType: page.serviceType,
        description: page.heroDescription,
        path: page.slug,
        areaServed: page.areaServed,
      }),
      faqSchema(page.faqs.map((item) => ({ question: item.question, answer: item.answer }))),
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
          paddingBottom: '5rem',
        }}
      >
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <nav aria-label="Breadcrumb" style={{ marginBottom: '2rem' }}>
            <ol
              style={{
                display: 'flex',
                flexWrap: 'wrap',
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
                {page.navLabel}
              </li>
            </ol>
          </nav>

          <span className="d3-eyebrow">{page.eyebrow}</span>
          <h1 className="d3-display-lg" style={{ marginTop: 14, lineHeight: 1.05 }}>
            {page.title}
            {page.titleAccent ? (
              <>
                <br />
                <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>
                  {page.titleAccent}
                </em>
              </>
            ) : null}
          </h1>

          <p
            className="d3-body"
            style={{ marginTop: 24, maxWidth: 680, fontSize: '1.0625rem', lineHeight: 1.8 }}
          >
            {page.heroDescription}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem', marginTop: 32 }}>
            <Link
              href="/signup"
              className="d3-btn-primary"
              style={{ padding: '0.875rem 2rem', fontSize: '0.9375rem' }}
            >
              Start Free
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M2.5 7H11.5M8 3.5L11.5 7L8 10.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="/contact"
              className="d3-btn-ghost"
              style={{ padding: '0.875rem 2rem', fontSize: '0.9375rem' }}
            >
              Talk to the team
            </Link>
          </div>

          {page.highlights.length > 0 ? (
            <ul
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.875rem 1.5rem',
                listStyle: 'none',
                margin: '2.5rem 0 0',
                padding: '1.5rem 0 0',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              {page.highlights.map((highlight) => (
                <li
                  key={highlight}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.625rem',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: 'var(--gold)',
                      marginTop: '0.45rem',
                      flexShrink: 0,
                    }}
                  />
                  {highlight}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <span className="d3-eyebrow">THE PLATFORM</span>
              <h2 className="d3-display-md" style={{ marginTop: 14 }}>
                What DinePixel brings together
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {page.intro.map((paragraph) => (
                <p key={paragraph} className="d3-body" style={{ lineHeight: 1.8 }}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-primary)' }}>
        <div className="d3-container">
          <div style={{ maxWidth: 620, marginBottom: '3rem' }}>
            <span className="d3-eyebrow">CAPABILITIES</span>
            <h2 className="d3-display-md" style={{ marginTop: 14 }}>
              Built around the way service actually runs
            </h2>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px"
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {page.features.map((feature, index) => (
              <article
                key={feature.title}
                className="d3-card"
                style={{
                  padding: '2.25rem 1.75rem',
                  borderRadius: 0,
                  border: 'none',
                  borderRight: index % 3 !== 2 ? '1px solid var(--border-subtle)' : 'none',
                  borderBottom: index < 3 ? '1px solid var(--border-subtle)' : 'none',
                  background: 'var(--bg-surface)',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: 'rgba(201,169,110,0.08)',
                    border: '1px solid rgba(201,169,110,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gold)',
                    marginBottom: '1.25rem',
                  }}
                >
                  <FeatureIcon name={feature.icon} />
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.1875rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.3,
                    marginBottom: '0.625rem',
                  }}
                >
                  {feature.title}
                </h3>
                <p className="d3-body-sm" style={{ lineHeight: 1.7 }}>
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container" style={{ maxWidth: 920 }}>
          <div style={{ maxWidth: 620, marginBottom: '3rem' }}>
            <span className="d3-eyebrow">IN PRACTICE</span>
            <h2 className="d3-display-md" style={{ marginTop: 14 }}>
              {page.workflowTitle}
            </h2>
          </div>

          <ol
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              counterReset: 'seo-step',
            }}
          >
            {page.workflow.map((step, index) => (
              <li
                key={step.label}
                style={{
                  padding: '1.5rem',
                  border: '1px solid var(--border-warm)',
                  borderRadius: 12,
                  background: 'var(--bg-surface)',
                }}
              >
                <span
                  className="d3-eyebrow"
                  style={{ color: 'var(--gold)', display: 'block', marginBottom: '0.75rem' }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.0625rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                  }}
                >
                  {step.label}
                </h3>
                <p className="d3-body-sm" style={{ lineHeight: 1.65 }}>
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <HomeFaq faq={faq} />

      <section className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="d3-container">
          <div style={{ maxWidth: 620, marginBottom: '3rem' }}>
            <span className="d3-eyebrow">KEEP EXPLORING</span>
            <h2 className="d3-display-md" style={{ marginTop: 14 }}>
              {page.relatedTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {page.related.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="d3-card"
                style={{
                  display: 'block',
                  padding: '1.75rem',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.125rem',
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
                <span
                  className="d3-btn-text"
                  style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.8125rem' }}
                >
                  Read more →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
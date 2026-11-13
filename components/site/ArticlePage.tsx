import Link from 'next/link';
import PublicPage from '@/components/site/PublicPage';
import HomeFaq from '@/components/site/HomeFaq';
import type { Faq } from '@/lib/siteContent';
import type { BlogArticle } from '@/lib/blogContent';
import { articleSchema, breadcrumbSchema, faqSchema } from '@/lib/seo';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
}

export default function ArticlePage({ article }: { article: BlogArticle }) {
  const path = `/blog/${article.slug}`;
  const faq: Faq = {
    enabled: true,
    heading: 'Questions, answered.',
    headingAccent: '',
    body: 'If you have a question that is not covered here, contact the DinePixel team.',
    items: article.faqs.map((item, index) => ({
      id: `${article.slug}-faq-${index + 1}`,
      question: item.question,
      answer: item.answer,
    })),
  };

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: article.title, path },
      ]),
      articleSchema({
        headline: article.title,
        description: article.metaDescription,
        path,
        publishedTime: article.datePublished,
        modifiedTime: article.dateModified,
      }),
      faqSchema(article.faqs.map((item) => ({ question: item.question, answer: item.answer }))),
    ],
  };

  return (
    <PublicPage>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <article>
        <header
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
                <li>
                  <Link href="/blog" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                    Blog
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" style={{ color: 'var(--text-secondary)' }}>
                  {article.title}
                </li>
              </ol>
            </nav>

            <span className="d3-eyebrow">DINEPIXEL GUIDE</span>
            <h1 className="d3-display-md" style={{ marginTop: 14, lineHeight: 1.12 }}>
              {article.title}
            </h1>
            <p
              className="d3-body"
              style={{ marginTop: 20, fontSize: '1.0625rem', lineHeight: 1.8 }}
            >
              {article.excerpt}
            </p>
            <p
              style={{
                marginTop: 20,
                fontFamily: 'var(--font-body)',
                fontSize: '0.75rem',
                color: 'var(--text-dimmed)',
              }}
            >
              {formatDate(article.datePublished)} · {article.readTime}
            </p>
          </div>
        </header>

        <div className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
          <div className="d3-container" style={{ maxWidth: 820 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.75rem' }}>
              {article.sections.map((section) => (
                <section key={section.heading}>
                  <h2
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.625rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.25,
                      marginBottom: '1rem',
                    }}
                  >
                    {section.heading}
                  </h2>

                  {section.paragraphs?.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="d3-body"
                      style={{ lineHeight: 1.8, marginBottom: '1rem' }}
                    >
                      {paragraph}
                    </p>
                  ))}

                  {section.bullets && section.bullets.length > 0 ? (
                    <ul
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.625rem',
                        listStyle: 'none',
                        margin: '1rem 0 0',
                        padding: 0,
                      }}
                    >
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.625rem',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.9375rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.7,
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              background: 'var(--gold)',
                              marginTop: '0.55rem',
                              flexShrink: 0,
                            }}
                          />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </div>
        </div>

        <HomeFaq faq={faq} />

        <section className="d3-section" style={{ background: 'var(--bg-primary)' }}>
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
                See how DinePixel puts this into practice
              </h2>
              <p className="d3-body-sm" style={{ lineHeight: 1.7 }}>
                DinePixel connects the QR menu, the order and the restaurant dashboard. Start with
                a free account or talk to the team about your restaurant.
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

            <div style={{ marginTop: '3rem' }}>
              <span className="d3-eyebrow">KEEP READING</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginTop: '1.25rem' }}>
                {article.related.map((link) => (
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
          </div>
        </section>
      </article>
    </PublicPage>
  );
}
import PublicPage from '@/components/site/PublicPage';

interface LegalSection {
  heading: string;
  body: string[];
}

interface LegalPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}

export default function LegalPage({ eyebrow, title, intro, updated, sections }: LegalPageProps) {
  return (
    <PublicPage>
      <section className="d3-section" style={{ background: 'var(--bg-primary)' }}>
        <div className="d3-container" style={{ maxWidth: 820 }}>
          <span className="d3-eyebrow">{eyebrow}</span>
          <h1 className="d3-display-md" style={{ marginTop: 12 }}>
            {title}
          </h1>
          <p className="d3-body" style={{ marginTop: 16 }}>
            {intro}
          </p>
          <p
            className="d3-eyebrow"
            style={{ marginTop: 12, color: 'var(--text-dimmed)', letterSpacing: '0.08em' }}
          >
            Last updated: {updated}
          </p>

          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 28 }}>
            {sections.map((section) => (
              <div key={section.heading}>
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    lineHeight: 1.35,
                    color: 'var(--text-primary)',
                    marginBottom: 10,
                  }}
                >
                  {section.heading}
                </h2>
                {section.body.map((paragraph, index) => (
                  <p
                    key={`${section.heading}-${index}`}
                    className="d3-body"
                    style={{ marginBottom: 10, color: 'var(--text-secondary)' }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
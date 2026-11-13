import type { ReactNode } from 'react';

export interface FaqGroup {
  title: string;
  description?: string;
  items: { question: string; answer: string }[];
}

export default function FaqAccordion({ groups }: { groups: FaqGroup[] }): ReactNode {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {groups.map((group) => (
        <section key={group.title}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              lineHeight: 1.25,
              marginBottom: group.description ? '0.625rem' : '1.25rem',
            }}
          >
            {group.title}
          </h2>
          {group.description ? (
            <p className="d3-body-sm" style={{ marginBottom: '1.25rem', lineHeight: 1.7 }}>
              {group.description}
            </p>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {group.items.map((item) => (
              <details
                key={item.question}
                className="d3-card"
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: 12,
                  background: 'var(--bg-surface)',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    listStyle: 'none',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    lineHeight: 1.5,
                  }}
                >
                  {item.question}
                </summary>
                <p
                  className="d3-body-sm"
                  style={{ marginTop: '0.875rem', lineHeight: 1.75, color: 'var(--text-secondary)' }}
                >
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
'use client';

import React, { useState, useMemo } from 'react';
import { useHotel, useReviews, Review } from '@/lib/useHotel';

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

/* ============================================================
   RATING — drawn, not emoji
   ============================================================ */
function Stars({ count, size = 11 }: { count: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }} aria-label={`${count} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M6 1L7.4 4.3L11 4.6L8.4 7L9.2 10.5L6 8.8L2.8 10.5L3.6 7L1 4.6L4.6 4.3L6 1Z"
            fill={i <= count ? 'var(--gold)' : 'transparent'}
            stroke={i <= count ? 'var(--gold)' : 'var(--text-dimmed)'}
            strokeWidth="0.9"
            strokeLinejoin="round"
            opacity={i <= count ? 0.9 : 0.4}
          />
        </svg>
      ))}
    </span>
  );
}

/* ============================================================
   REVIEW ENTRY
   ============================================================ */
function ReviewCard({ review }: { review: Review }) {
  const initial = (review.customer_name || 'G').charAt(0).toUpperCase();

  return (
    <article className="d3-panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden="true"
            style={{
              width: 34,
              height: 34,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-secondary)',
              fontFamily: 'var(--font-display)',
              fontSize: '0.9375rem',
              color: 'var(--gold)',
            }}
          >
            {initial}
          </span>
          <div className="min-w-0">
            <h4
              style={{
                margin: 0,
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              {review.customer_name || 'Anonymous diner'}
            </h4>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: '0.6875rem',
                color: 'var(--text-dimmed)',
              }}
            >
              {review.menu_item_name ? (
                <>
                  Ordered <span style={{ color: 'var(--text-muted)' }}>{review.menu_item_name}</span>
                </>
              ) : (
                'Reviewed your restaurant'
              )}
              {review.table_number ? ` · Table ${review.table_number}` : ''}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <Stars count={review.rating} />
          <p
            style={{
              margin: '5px 0 0',
              fontSize: '0.625rem',
              color: 'var(--text-dimmed)',
              letterSpacing: '0.04em',
            }}
          >
            {getRelativeTime(review.created_at)}
          </p>
        </div>
      </div>

      {review.comment && (
        <blockquote
          style={{
            margin: '1.125rem 0 0',
            paddingTop: '1.125rem',
            borderTop: '1px solid var(--border-warm)',
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            lineHeight: 1.7,
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
          }}
        >
          “{review.comment}”
        </blockquote>
      )}
    </article>
  );
}

export default function ReviewsDashboardPage() {
  const { hotel, loading: hotelLoading } = useHotel();
  const { reviews, loading: reviewsLoading } = useReviews(hotel?.id || null);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  const filteredReviews = reviews.filter((r: Review) => {
    if (filterRating === 'all') return true;
    return r.rating === filterRating;
  });

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  const ratingDistribution = useMemo(() => {
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r: Review) => {
      dist[r.rating] = (dist[r.rating] || 0) + 1;
    });
    return dist;
  }, [reviews]);

  const loading = hotelLoading || reviewsLoading;

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 1180 }}>
      {/* ================= Page header ================= */}
      <header>
        <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>
          Reviews
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 500,
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            margin: '0.5rem 0 0',
          }}
        >
          Guest Feedback
        </h1>
        <p
          style={{
            margin: '0.5rem 0 0',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: 'var(--text-muted)',
            maxWidth: '56ch',
          }}
        >
          What your diners said after dining — scores, comments and the dishes they
          mentioned.
        </p>
      </header>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Gathering guest feedback…
        </p>
      ) : (
        <>
          {/* ================= Score + distribution ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-4 d3-panel p-6 flex flex-col justify-center">
              <span
                style={{
                  fontSize: '0.5625rem',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--text-dimmed)',
                }}
              >
                Average Rating
              </span>

              <span
                className="d3-figure"
                style={{ display: 'block', fontSize: '3.25rem', margin: '1rem 0 0.75rem' }}
              >
                {reviews.length === 0 ? '—' : avgRating.toFixed(1)}
              </span>

              <Stars count={reviews.length === 0 ? 0 : Math.round(avgRating)} size={13} />

              <p
                style={{
                  margin: '0.875rem 0 0',
                  fontSize: '0.6875rem',
                  color: 'var(--text-dimmed)',
                }}
              >
                {reviews.length === 0
                  ? 'No reviews yet'
                  : `Based on ${reviews.length} verified diner review${reviews.length === 1 ? '' : 's'}`}
              </p>
            </section>

            <section className="lg:col-span-8 d3-panel p-6">
              <div
                className="flex items-baseline justify-between gap-4"
                style={{ paddingBottom: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-warm)' }}
              >
                <h3 className="d3-panel-title" style={{ fontSize: '1.125rem' }}>
                  Distribution
                </h3>
                <span className="d3-chip">All ratings</span>
              </div>

              {reviews.length === 0 ? (
                <p style={{ color: 'var(--text-dimmed)', fontSize: '0.875rem' }}>
                  No rating data available.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = ratingDistribution[stars] || 0;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span
                          style={{
                            width: 54,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: '0.6875rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {stars} <Stars count={1} size={9} />
                        </span>
                        <span
                          style={{
                            flex: 1,
                            height: 3,
                            borderRadius: 2,
                            background: 'var(--bg-surface-3)',
                            overflow: 'hidden',
                          }}
                        >
                          <span
                            style={{
                              display: 'block',
                              height: '100%',
                              width: `${pct}%`,
                              background: 'var(--gold)',
                              opacity: stars === 5 ? 1 : 0.6,
                            }}
                          />
                        </span>
                        <span
                          style={{
                            width: 26,
                            textAlign: 'right',
                            flexShrink: 0,
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                            fontSize: '0.6875rem',
                            color: 'var(--text-dimmed)',
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ================= Filter ================= */}
          <div className="d3-segment" role="group" aria-label="Filter reviews by rating">
            {(['all', 5, 4, 3] as const).map((r) => (
              <button
                key={String(r)}
                type="button"
                className="d3-segment-item"
                data-active={filterRating === r}
                onClick={() => setFilterRating(r)}
              >
                {r === 'all' ? 'All' : `${r} Star`}
              </button>
            ))}
          </div>

          {/* ================= Feed ================= */}
          {filteredReviews.length === 0 ? (
            <div className="d3-empty">
              <svg width="36" height="36" viewBox="0 0 40 40" fill="none" style={{ opacity: 0.45 }} aria-hidden="true">
                <rect x="5" y="8" width="30" height="24" rx="3" stroke="currentColor" strokeWidth="1.1" />
                <path d="M12 17H28M12 22H22" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              <h3 className="d3-empty-title">No reviews found</h3>
              <p className="d3-empty-body">
                {filterRating !== 'all'
                  ? `No ${filterRating}-star reviews yet. Try a different filter.`
                  : 'Guests have not left feedback yet. Reviews appear here once diners submit them from the menu.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredReviews.map((rev: Review) => (
                <ReviewCard key={rev.id} review={rev} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
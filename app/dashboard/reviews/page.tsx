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

  const renderStars = (count: number) => {
    return '⭐'.repeat(count);
  };

  if (hotelLoading || reviewsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Customer Reviews & Dish Feedback</h1>
          <p className="text-gray-400 text-sm">
            Monitor diner ratings, feedback on 3D dishes, and customer satisfaction scores.
          </p>
        </div>
        <p className="text-sm text-gray-400">Loading reviews…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Customer Reviews & Dish Feedback</h1>
          <p className="text-gray-400 text-sm">
            Monitor diner ratings, feedback on 3D dishes, and customer satisfaction scores.
          </p>
        </div>
      </div>

      {/* Summary Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center">
          <p className="text-xs uppercase font-semibold text-gray-400">Average Rating</p>
          {reviews.length === 0 ? (
            <>
              <p className="text-5xl font-extrabold text-amber-400 mt-2">—</p>
              <p className="text-xs text-gray-400 mt-2">No reviews yet</p>
            </>
          ) : (
            <>
              <p className="text-5xl font-extrabold text-amber-400 mt-2">{avgRating.toFixed(1)}</p>
              <div className="text-lg mt-1">{renderStars(Math.round(avgRating))}</div>
              <p className="text-xs text-gray-400 mt-2">Based on {reviews.length} verified diner reviews</p>
            </>
          )}
        </div>

        <div className="md:col-span-2 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-2 flex flex-col justify-center">
          <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Rating Distribution</h3>
          {reviews.length === 0 ? (
            <p className="text-xs text-gray-400">No rating data available.</p>
          ) : (
            [5, 4, 3, 2, 1].map((stars) => {
              const count = ratingDistribution[stars] || 0;
              const pct = reviews.length > 0 ? `${Math.round((count / reviews.length) * 100)}%` : '0%';
              return (
                <div key={stars} className="flex items-center space-x-3 text-xs">
                  <span className="w-14 text-gray-400 font-medium">{stars} Stars</span>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: pct }}
                    ></div>
                  </div>
                  <span className="w-10 text-right text-gray-400 font-mono">{count}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-gray-800 pb-3 overflow-x-auto">
        {(['all', 5, 4, 3] as const).map((r) => (
          <button
            key={String(r)}
            onClick={() => setFilterRating(r)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterRating === r
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            {r === 'all' ? 'All Reviews' : `${r} Star Ratings`}
          </button>
        ))}
      </div>

      {/* Reviews Feed Grid */}
      {filteredReviews.length === 0 ? (
        <div className="p-12 text-center bg-gray-900 rounded-2xl border border-gray-800">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ color: 'var(--text-dimmed)', opacity: 0.4, margin: '0 auto 1rem' }}>
            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1.5" />
            <path d="M16 20l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>No reviews found</p>
          <p style={{ color: 'var(--text-dimmed)', fontSize: '0.875rem' }}>
            {filterRating !== 'all'
              ? `No ${filterRating}-star reviews. Try adjusting your filter.`
              : 'No customer reviews have been submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev: Review) => (
            <div
              key={rev.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                    {(rev.customer_name || 'G').charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{rev.customer_name || 'Anonymous'}</h4>
                    <p className="text-xs text-gray-400">
                      {rev.menu_item_name && (
                        <>
                          Ordered <strong className="text-amber-300">{rev.menu_item_name}</strong>
                        </>
                      )}
                      {rev.table_number && (
                        <>
                          {' '}
                          at {rev.table_number}
                        </>
                      )}
                      {!rev.menu_item_name && !rev.table_number && 'Reviewed your restaurant'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm">{renderStars(rev.rating)}</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">{getRelativeTime(rev.created_at)}</p>
                </div>
              </div>

              <p className="text-gray-300 text-xs leading-relaxed bg-gray-950/60 p-3 rounded-xl border border-gray-800">
                "{rev.comment || 'No comment provided.'}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

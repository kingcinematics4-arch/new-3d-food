'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function OrderStatusPage({ params }: { params: { orderId: string } }) {
  const { orderId } = params;
  const searchParams = useSearchParams();
  const hotelSlug = searchParams?.get('slug') || '';
  const backHref = hotelSlug ? `/menu/${hotelSlug}` : '/';
  const [currentStep, setCurrentStep] = useState<number>(2);

  const steps = [
    { title: 'Order Placed', desc: 'Sent to restaurant kitchen', icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="1.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M3.5 4.5H10.5M3.5 7H10.5M3.5 9.5H7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    )},
    { title: 'Preparing Food', desc: 'Chef is crafting your 3D dish', icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    )},
    { title: 'Ready to Serve', desc: 'Waiter is bringing to table', icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 2L12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )},
    { title: 'Completed', desc: 'Enjoy your meal!', icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
        <path d="M3.5 7L6.5 10L10.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )},
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < 3) setCurrentStep((prev) => prev + 1);
    }, 15000);
    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div
      className="min-h-screen flex flex-col justify-between max-w-lg mx-auto p-4"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
    >
      <div className="space-y-6 pt-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{
              background: 'rgba(201,169,110,0.1)',
              border: '1px solid rgba(201,169,110,0.2)',
              color: 'var(--gold)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
              <path d="M12 2A10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Live Order Tracking
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Order Ref:{' '}
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                color: 'var(--gold)',
              }}
            >
              #{orderId.slice(0, 8).toUpperCase()}
            </span>
          </p>
        </div>

        {/* Live Status Stepper */}
        <div
          className="d3-card"
          style={{
            padding: '1.5rem',
            border: '1px solid var(--border-subtle)',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <div className="space-y-6 relative" style={{ paddingLeft: '1.25rem' }}>
            <div style={{ position: 'absolute', left: 5, top: 3, bottom: 3, width: 1, background: 'var(--border-subtle)' }} />
            {steps.map((step, idx) => {
              const isDone = idx + 1 <= currentStep;
              const isCurrent = idx + 1 === currentStep;

              return (
                <div key={step.title} className="flex items-start gap-4 relative">
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDone ? 'var(--gold)' : 'var(--bg-surface-2)',
                      border: isDone ? 'none' : '1px solid var(--border-subtle)',
                      color: isDone ? '#0B0A08' : 'var(--text-dimmed)',
                      transition: 'all 300ms',
                      zIndex: 10,
                    }}
                  >
                    {step.icon}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: isCurrent ? 'var(--gold)' : isDone ? 'var(--text-primary)' : 'var(--text-dimmed)',
                        letterSpacing: '-0.01em',
                        marginBottom: 4,
                      }}
                    >
                      {step.title}
                      {isCurrent && (
                        <span
                          className="ml-2"
                          style={{
                            fontSize: '0.5rem',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '0.125rem 0.5rem',
                            borderRadius: 100,
                            background: 'rgba(201,169,110,0.15)',
                            border: '1px solid rgba(201,169,110,0.2)',
                            color: 'var(--gold)',
                          }}
                        >
                          In Progress
                        </span>
                      )}
                    </h3>
                    <p className="d3-body-sm" style={{ color: 'var(--text-muted)' }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estimated Time Card */}
        <div
          className="d3-card"
          style={{
            padding: '1.5rem',
            border: '1px solid rgba(201,169,110,0.2)',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(201,169,110,0.08) 0%, var(--bg-surface) 100%)',
            textAlign: 'center',
          }}
        >
          <p className="d3-eyebrow" style={{ color: 'var(--gold)' }}>
            Estimated Wait Time
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.5rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              marginTop: '0.5rem',
            }}
          >
            12 - 15 Mins
          </p>
          <p className="d3-body-sm" style={{ marginTop: '0.5rem', color: 'var(--text-dimmed)' }}>
            Sit back and relax at Table #1
          </p>
        </div>
      </div>

      {/* Back to Menu Link */}
      <div className="pb-6 pt-4 text-center">
        <Link
          href={backHref}
          className="d3-btn-text"
          style={{ fontSize: '0.8125rem', fontWeight: 500 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: 4 }}>
            <path d="M10 2L2 6L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to 3D Menu
        </Link>
      </div>
    </div>
  );
}
'use client';

// components/site/HomeHero.tsx
//
// The hero. A Server Component cannot drive the mount-triggered reveal
// animation, so this one section is a Client Component. All of its content
// arrives as props from the published document — there are no hardcoded
// strings here.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Hero } from '@/lib/siteContent';
import Dine3DLogo from '@/components/Dine3DLogo';
import HeroViewer from './HeroViewer';

export default function HomeHero({ hero }: { hero: Hero }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = hero.stats.filter((stat) => stat.value || stat.label);

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'var(--bg-primary)', paddingTop: 'var(--d3-nav-h)' }}
    >
      {/* Optional owner-supplied hero image */}
      {hero.imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero.imageUrl}
            alt={hero.imageAlt || ''}
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: 'cover', opacity: 0.25 }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(11,11,10,0.6), rgba(11,11,10,0.92))' }}
          />
        </>
      ) : (
        <>
          {/* Subtle background grid */}
          <div className="absolute inset-0 d3-bg-grid" style={{ opacity: 0.6 }} />

          {/* Atmospheric radial glow */}
          <div
            className="absolute"
            style={{
              top: '10%',
              right: '-10%',
              width: '60vw',
              height: '60vw',
              maxWidth: 800,
              maxHeight: 800,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(201,169,110,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            className="absolute"
            style={{
              bottom: '0',
              left: '-5%',
              width: '40vw',
              height: '40vw',
              maxWidth: 600,
              maxHeight: 600,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(201,169,110,0.03) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      <div className="d3-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center min-h-[calc(100vh-var(--d3-nav-h))] py-20">
          {/* -------------------------------------------- LEFT: TEXT */}
          <div className="flex flex-col gap-8">
            {/* Brand anchor. The exact logo, small and quiet, so the left column
                carries the Dine3D identity without the headline losing the
                page. */}
            <div className={mounted ? 'animate-fade-up' : 'opacity-0'}>
              <Dine3DLogo size="sm" href={null} className="d3-logo--anchor" />
            </div>

            {hero.showEyebrow && hero.eyebrow ? (
              <div className={mounted ? 'animate-fade-up' : 'opacity-0'}>
                <span className="d3-badge d3-badge-gold">
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--gold)',
                      display: 'inline-block',
                    }}
                  />
                  {hero.eyebrow}
                </span>
              </div>
            ) : null}

            {hero.heading ? (
              <div className={mounted ? 'animate-fade-up delay-100' : 'opacity-0'}>
                <h1 className="d3-display-xl" style={{ color: 'var(--text-primary)', lineHeight: '1.0' }}>
                  {hero.heading}
                  {hero.headingAccent ? (
                    <>
                      <br />
                      <em
                        style={{
                          fontStyle: 'italic',
                          color: 'var(--gold)',
                          fontWeight: 300,
                        }}
                      >
                        {hero.headingAccent}
                      </em>
                    </>
                  ) : null}
                </h1>
              </div>
            ) : null}

            {hero.subheading || hero.secondaryText ? (
              <div
                className={mounted ? 'animate-fade-up delay-200' : 'opacity-0'}
                style={{ maxWidth: 440 }}
              >
                {hero.subheading ? (
                  <p className="d3-body" style={{ fontSize: '1.0625rem', lineHeight: 1.8 }}>
                    {hero.subheading}
                  </p>
                ) : null}
                {hero.secondaryText ? (
                  <p className="d3-body-sm" style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>
                    {hero.secondaryText}
                  </p>
                ) : null}
              </div>
            ) : null}

            {hero.ctaText || (hero.showSecondaryCta && hero.secondaryCtaText) ? (
              <div className={`flex flex-wrap gap-4 ${mounted ? 'animate-fade-up delay-300' : 'opacity-0'}`}>
                {hero.ctaText ? (
                  <Link
                    href={hero.ctaHref || '/signup'}
                    className="d3-btn-primary"
                    style={{ fontSize: '0.9375rem', padding: '0.875rem 2rem' }}
                  >
                    {hero.ctaText}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2.5 7H11.5M8 3.5L11.5 7L8 10.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                ) : null}

                {hero.showSecondaryCta && hero.secondaryCtaText ? (
                  <Link
                    href={hero.secondaryCtaHref || '/#how-it-works'}
                    className="d3-btn-ghost"
                    style={{ fontSize: '0.9375rem', padding: '0.875rem 2rem' }}
                  >
                    {hero.secondaryCtaText}
                  </Link>
                ) : null}
              </div>
            ) : null}

            {hero.showStats && stats.length > 0 ? (
              <div className={`flex items-center gap-6 pt-4 ${mounted ? 'animate-fade-up delay-400' : 'opacity-0'}`}>
                {stats.map((stat, index) => (
                  <React.Fragment key={stat.id}>
                    {index > 0 ? (
                      <div
                        style={{
                          width: 1,
                          height: 40,
                          background:
                            'linear-gradient(to bottom, transparent, var(--border-light), transparent)',
                        }}
                      />
                    ) : null}
                    <div className="flex flex-col gap-0.5">
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.5rem',
                          fontWeight: 600,
                          color: 'var(--gold)',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {stat.value}
                      </span>
                      {stat.label ? (
                        <span
                          className="d3-eyebrow"
                          style={{ color: 'var(--text-dimmed)', fontSize: '0.6rem' }}
                        >
                          {stat.label}
                        </span>
                      ) : null}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            ) : null}
          </div>

          {/* -------------------------------------------- RIGHT: 3D VIEWER */}
          {hero.showViewer ? (
            <div
              className={`relative ${mounted ? 'animate-fade-up delay-200' : 'opacity-0'}`}
              style={{ minHeight: 480 }}
            >
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(201,169,110,0.06) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-surface)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'rgba(21,19,15,0.8)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="d3-badge d3-badge-gold"
                      style={{ padding: '0.125rem 0.5rem', fontSize: '0.5625rem' }}
                    >
                      3D LIVE
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      Your dishes, in 3D
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-dimmed)', fontSize: '0.6875rem' }}>
                    Drag to rotate · Scroll to zoom
                  </span>
                </div>

                <HeroViewer />

                {(hero.viewerTitle || hero.viewerCaption) && (
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      background: 'rgba(21,19,15,0.9)',
                    }}
                  >
                    <div className="flex flex-col">
                      {hero.viewerTitle ? (
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.125rem',
                            color: 'var(--text-primary)',
                            fontWeight: 500,
                          }}
                        >
                          {hero.viewerTitle}
                        </span>
                      ) : null}
                      {hero.viewerCaption ? (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
                          {hero.viewerCaption}
                        </span>
                      ) : null}
                    </div>

                    {hero.ctaText ? (
                      <Link
                        href={hero.ctaHref || '/signup'}
                        className="d3-btn-primary"
                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.75rem' }}
                      >
                        {hero.ctaText}
                      </Link>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ color: 'var(--text-dimmed)', animation: 'floatSlow 3s ease-in-out infinite' }}
      >
        <span style={{ fontSize: '0.5625rem', letterSpacing: '0.2em' }}>SCROLL</span>
        <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
          <rect x="1" y="1" width="10" height="18" rx="5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
          <rect x="5" y="4" width="2" height="4" rx="1" fill="currentColor" fillOpacity="0.4">
            <animate attributeName="y" values="4;8;4" dur="2s" repeatCount="indefinite" />
          </rect>
        </svg>
      </div>
    </section>
  );
}
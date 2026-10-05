'use client';

// components/site/HomeHero.tsx
//
// The hero. A Server Component cannot drive the mount-triggered reveal
// animation, so this one section is a Client Component. All of its content
// arrives as props from the published document — there are no hardcoded
// strings here.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Hero } from '@/lib/siteContent';
import Dine3DLogo from '@/components/Dine3DLogo';
import HeroViewer from './HeroViewer';

export default function HomeHero({ hero }: { hero: Hero }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

            </div>

          {/* -------------------------------------------- RIGHT: 3D VIEWER */}
          {hero.showViewer ? (
            <div
              className={`relative ${mounted ? 'animate-fade-up delay-200' : 'opacity-0'}`}
              style={{ minHeight: 440 }}
            >
              {/* The demonstration itself: one finished dish on a plate, free to
                  turn. Everything that used to frame it — a "3D LIVE" tag, the
                  drag/scroll instruction, a panel caption and a second copy of the
                  same button — is gone, because the plate explains the offer on its
                  own and the duplicate button competed with the primary one. */}
              <div
                className="relative overflow-hidden"
                style={{
                  height: 'clamp(320px, 42vw, 460px)',
                  borderRadius: 16,
                  background:
                    'radial-gradient(ellipse at 50% 45%, rgba(201,169,110,0.07) 0%, transparent 68%)',
                }}
              >
                <HeroViewer modelUrlGlb={hero.modelUrlGlb} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
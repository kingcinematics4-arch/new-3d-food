'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';

// Dynamically import 3D viewer to avoid SSR issues
const FoodModelViewer = dynamic(() => import('@/components/3d/FoodModelViewer'), { ssr: false });

/* ============================================================
   HERO SECTION
   ============================================================ */
function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'var(--bg-primary)', paddingTop: '70px' }}
    >
      {/* Subtle background grid */}
      <div
        className="absolute inset-0 d3-bg-grid"
        style={{ opacity: 0.6 }}
      />

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

      <div className="d3-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center min-h-[calc(100vh-70px)] py-20">

          {/* Left Column — Text */}
          <div className="flex flex-col gap-8">
            {/* Eyebrow */}
            <div className={`${mounted ? 'animate-fade-up' : 'opacity-0'}`}>
              <span className="d3-badge d3-badge-gold">
                <span
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--gold)', display: 'inline-block',
                    animation: 'pulseGold 2s ease-in-out infinite',
                  }}
                />
                DINE3D
              </span>
            </div>

            {/* Main Headline */}
            <div className={`${mounted ? 'animate-fade-up delay-100' : 'opacity-0'}`}>
              <h1
                className="d3-display-xl"
                style={{ color: 'var(--text-primary)', lineHeight: '1.0' }}
              >
                See your meal
                <br />
                <em
                  style={{
                    fontStyle: 'italic',
                    color: 'var(--gold)',
                    fontWeight: 300,
                  }}
                >
                  before you order.
                </em>
              </h1>
            </div>

            {/* Body Copy */}
            <div
              className={`${mounted ? 'animate-fade-up delay-200' : 'opacity-0'}`}
              style={{ maxWidth: 440 }}
            >
              <p className="d3-body" style={{ fontSize: '1.0625rem', lineHeight: 1.8 }}>
                Turn your restaurant menu into an interactive 3D dining experience.
              </p>
              <p className="d3-body-sm" style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>
                Scan a QR code. Explore dishes in 3D. Understand your meal before ordering.
              </p>
            </div>

            {/* CTAs */}
            <div
              className={`flex flex-wrap gap-4 ${mounted ? 'animate-fade-up delay-300' : 'opacity-0'}`}
            >
              <Link href="/signup" className="d3-btn-primary" style={{ fontSize: '0.9375rem', padding: '0.875rem 2rem' }}>
                Start Free
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7H11.5M8 3.5L11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/#how-it-works" className="d3-btn-ghost" style={{ fontSize: '0.9375rem', padding: '0.875rem 2rem' }}>
                See How It Works
              </Link>
            </div>

            {/* Social proof */}
            <div
              className={`flex items-center gap-6 pt-4 ${mounted ? 'animate-fade-up delay-400' : 'opacity-0'}`}
            >
              <div
                style={{
                  width: 1, height: 40,
                  background: 'linear-gradient(to bottom, transparent, var(--border-light), transparent)',
                }}
              />
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
                  500+
                </span>
                <span className="d3-eyebrow" style={{ color: 'var(--text-dimmed)', fontSize: '0.6rem' }}>
                  RESTAURANTS ONBOARDED
                </span>
              </div>
              <div
                style={{
                  width: 1, height: 40,
                  background: 'linear-gradient(to bottom, transparent, var(--border-light), transparent)',
                }}
              />
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
                  2M+
                </span>
                <span className="d3-eyebrow" style={{ color: 'var(--text-dimmed)', fontSize: '0.6rem' }}>
                  QR SCANS SERVED
                </span>
              </div>
              <div
                style={{
                  width: 1, height: 40,
                  background: 'linear-gradient(to bottom, transparent, var(--border-light), transparent)',
                }}
              />
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
                  30%
                </span>
                <span className="d3-eyebrow" style={{ color: 'var(--text-dimmed)', fontSize: '0.6rem' }}>
                  AVG ORDER UPLIFT
                </span>
              </div>
            </div>
          </div>

          {/* Right Column — 3D Viewer */}
          <div
            className={`relative ${mounted ? 'animate-fade-up delay-200' : 'opacity-0'}`}
            style={{ minHeight: 480 }}
          >
            {/* Gold atmospheric border */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(201,169,110,0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* 3D Viewer Container */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                border: '1px solid var(--border-light)',
                background: 'var(--bg-surface)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              }}
            >
              {/* Top label bar */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'rgba(21,19,15,0.8)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="d3-badge d3-badge-gold" style={{ padding: '0.125rem 0.5rem', fontSize: '0.5625rem' }}>
                    3D LIVE
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>
                    Signature Wagyu Gourmet Burger
                  </span>
                </div>
                <span style={{ color: 'var(--text-dimmed)', fontSize: '0.6875rem' }}>Drag to rotate · Scroll to zoom</span>
              </div>

              {/* 3D Viewer */}
              <div style={{ height: 420 }}>
                <FoodModelViewer
                  modelUrlGlb="/models/burger.glb"
                  altText="Signature Wagyu Gourmet Burger"
                  autoRotate={true}
                  className="h-full w-full"
                />
              </div>

              {/* Bottom metadata bar */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'rgba(21,19,15,0.9)',
                }}
              >
                <div className="flex flex-col">
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    $22.50
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>780 cal · 15 min</span>
                </div>
                <Link
                  href="/menu/demo-restaurant"
                  className="d3-btn-primary"
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.75rem' }}
                >
                  View Full Menu
                </Link>
              </div>
            </div>

            {/* Floating feature pill */}
            <div
              className="absolute -bottom-4 -left-4 animate-float-slow"
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-light)',
                borderRadius: 12,
                padding: '0.75rem 1rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(201,169,110,0.1)',
                    border: '1px solid rgba(201,169,110,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem',
                  }}
                >
                  📱
                </div>
                <div className="flex flex-col">
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 600 }}>AR Ready</span>
                  <span style={{ color: 'var(--text-dimmed)', fontSize: '0.6rem' }}>NATIVE AUGMENTED REALITY</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ color: 'var(--text-dimmed)', animation: 'floatSlow 3s ease-in-out infinite' }}
      >
        <span style={{ fontSize: '0.5625rem', letterSpacing: '0.2em', fontFamily: 'var(--font-body)' }}>SCROLL</span>
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

/* ============================================================
   FEATURES SECTION
   ============================================================ */
const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L3 6V14L10 18L17 14V6L10 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M10 2V18M3 6L10 10M17 6L10 10" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      </svg>
    ),
    eyebrow: 'VISUALIZATION',
    title: 'Photoreal 3D Models',
    desc: 'Bring every dish to life with immersive 3D visualization, realistic lighting, materials and presentation.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.2" />
        <path d="M10 6V10L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="10" cy="10" r="2" fill="currentColor" fillOpacity="0.3" />
      </svg>
    ),
    eyebrow: 'MOBILE',
    title: 'Native AR Experiences',
    desc: 'Let guests explore dishes directly from their phones through immersive augmented reality.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M7 7H7.01M13 7H13.01M7 13H7.01M13 13H13.01M10 10H10.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    eyebrow: 'QR',
    title: 'Instant QR Menus',
    desc: 'Give every restaurant a simple QR-powered entry point into the complete Dine3D experience.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 14L7 10L10 13L14 8L17 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
    eyebrow: 'DATA',
    title: 'Live Analytics',
    desc: 'Understand scans, menu interactions, popular dishes and customer engagement in real time.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3C10 3 6 5 3 10C6 15 10 17 10 17C10 17 14 15 17 10C14 5 10 3 10 3Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
    eyebrow: 'BRANDING',
    title: 'Your Brand, Elevated',
    desc: "Customize the experience with your restaurant's logo, colors, menu and brand identity.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 10C3 6.13 6.13 3 10 3C13.87 3 17 6.13 17 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M10 10L13 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="10" cy="10" r="1.5" fill="currentColor" />
        <path d="M6 14C7.5 16 9 17 10 17C11 17 12.5 16 14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    eyebrow: 'PERFORMANCE',
    title: 'Fast Everywhere',
    desc: 'Optimized for fast loading, mobile devices and modern web experiences globally.',
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="d3-section relative" style={{ background: 'var(--bg-secondary)' }}>
      {/* Subtle top border gradient */}
      <div className="d3-divider" />

      <div className="d3-container">
        {/* Section header */}
        <div className="text-center mb-20" style={{ maxWidth: 560, margin: '0 auto 5rem' }}>
          <span className="d3-eyebrow block mb-4">CAPABILITIES</span>
          <h2 className="d3-display-md" style={{ marginBottom: '1.25rem' }}>
            Crafted for<br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>modern dining</em>
          </h2>
          <p className="d3-body">
            Everything you need to bring your menu into the physical world — beautifully.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
          {features.map((feat, i) => (
            <div
              key={i}
              className="d3-card group"
              style={{
                padding: '2.5rem 2rem',
                borderRadius: 0,
                border: 'none',
                borderRight: (i % 3 !== 2) ? '1px solid var(--border-subtle)' : 'none',
                borderBottom: (i < 3) ? '1px solid var(--border-subtle)' : 'none',
                background: 'var(--bg-surface)',
                transition: 'background 300ms',
                cursor: 'default',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
            >
              {/* Icon container */}
              <div
                style={{
                  width: 44, height: 44,
                  borderRadius: 10,
                  background: 'rgba(201,169,110,0.08)',
                  border: '1px solid rgba(201,169,110,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--gold)',
                  marginBottom: '1.5rem',
                  transition: 'all 300ms',
                }}
                style-hover="background: rgba(201,169,110,0.15);"
              >
                {feat.icon}
              </div>

              <span className="d3-eyebrow block mb-3" style={{ color: 'var(--gold-dim)', fontSize: '0.5625rem' }}>
                {feat.eyebrow}
              </span>

              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  marginBottom: '0.75rem',
                  lineHeight: 1.3,
                }}
              >
                {feat.title}
              </h3>

              <p className="d3-body-sm">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   HOW IT WORKS SECTION
   ============================================================ */
const steps = [
  { num: '01', label: 'Scan', desc: "Guests scan the restaurant's Dine3D QR code." },
  { num: '02', label: 'Explore', desc: 'They browse the menu and inspect dishes through interactive 3D experiences.' },
  { num: '03', label: 'Customize', desc: 'They select quantity, preferences and special instructions.' },
  { num: '04', label: 'Order', desc: 'They add items to the cart and place the order.' },
  { num: '05', label: 'Prepare', desc: 'The restaurant receives the order instantly through its dashboard.' },
  { num: '06', label: 'Serve', desc: 'Restaurant staff update the order status until it is completed.' },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="d3-section" style={{ background: 'var(--bg-primary)' }}>
      <div className="d3-container">
        {/* Header */}
        <div className="mb-20" style={{ maxWidth: 480 }}>
          <span className="d3-eyebrow block mb-4">THE EXPERIENCE</span>
          <h2 className="d3-display-md">
            From QR code<br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>to table.</em>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col gap-4">
              {/* Number */}
              <div className="flex items-center gap-4">
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '4rem',
                    fontWeight: 300,
                    color: 'rgba(201,169,110,0.15)',
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                  }}
                >
                  {step.num}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              </div>

              {/* Label */}
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {step.label}
              </h3>

              {/* Description */}
              <p className="d3-body-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PRICING SECTION
   ============================================================ */
const plans = [
  {
    name: 'Starter',
    tagline: 'For small restaurants',
    price: '$29',
    period: '/month',
    features: [
      'Up to 30 menu items',
      '5 3D models included',
      'QR code generator',
      'Basic analytics',
      'Standard support',
    ],
    cta: 'Get Started',
    href: '/signup',
    featured: false,
  },
  {
    name: 'Pro',
    tagline: 'For growing restaurants',
    price: '$79',
    period: '/month',
    features: [
      'Unlimited menu items',
      '50 3D models included',
      'AR experiences',
      'Advanced analytics',
      'Custom branding',
      'Priority support',
    ],
    cta: 'Get Started',
    href: '/signup',
    featured: true,
  },
  {
    name: 'Enterprise',
    tagline: 'For restaurant groups & hotels',
    price: 'Custom',
    period: '',
    features: [
      'Multiple restaurant locations',
      'Unlimited 3D models',
      'White-label platform',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guaranteed',
    ],
    cta: 'Contact Sales',
    href: 'mailto:hello@dine3d.com',
    featured: false,
  },
];

function PricingSection() {
  return (
    <section id="pricing" className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
      <div className="d3-divider" />
      <div className="d3-container">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="d3-eyebrow block mb-4">PRICING</span>
          <h2 className="d3-display-md">
            Simple,<br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>transparent pricing.</em>
          </h2>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              style={{
                background: plan.featured ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                border: plan.featured ? '1px solid var(--border-medium)' : '1px solid var(--border-subtle)',
                borderRadius: 16,
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {plan.featured && (
                <div
                  className="absolute top-0 right-0 left-0 h-px"
                  style={{ background: 'linear-gradient(to right, transparent, var(--gold), transparent)' }}
                />
              )}
              {plan.featured && (
                <span
                  className="d3-badge d3-badge-gold absolute top-4 right-4"
                  style={{ fontSize: '0.5625rem' }}
                >
                  MOST POPULAR
                </span>
              )}

              <div>
                <span className="d3-eyebrow block mb-2" style={{ color: 'var(--text-dimmed)', fontSize: '0.5625rem' }}>
                  {plan.tagline.toUpperCase()}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.375rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {plan.name}
                </h3>
              </div>

              <div className="flex items-end gap-1">
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '3rem',
                    fontWeight: 400,
                    color: plan.featured ? 'var(--gold)' : 'var(--text-primary)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    {plan.period}
                  </span>
                )}
              </div>

              <div className="d3-divider" />

              <ul className="flex flex-col gap-3">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'var(--gold)' }}>
                      <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={plan.featured ? 'd3-btn-primary' : 'd3-btn-ghost'}
                style={{ justifyContent: 'center', marginTop: 'auto' }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FAQ SECTION
   ============================================================ */
const faqs = [
  { q: 'What is Dine3D?', a: 'Dine3D is a premium restaurant technology platform that transforms static menus into interactive 3D and AR dining experiences, accessible through a simple QR code.' },
  { q: 'How does the QR menu work?', a: 'Each restaurant gets a unique QR code. Guests scan it with any smartphone camera — no app download required — and instantly access the 3D menu experience.' },
  { q: 'Does Dine3D support AR?', a: 'Yes. Where supported by the device (iOS via Safari, Android via Chrome), guests can place dishes in their real environment using native augmented reality.' },
  { q: 'Can restaurants upload their own 3D models?', a: 'Yes. Restaurants can upload GLB and GLTF format 3D models through the dashboard, or choose from our curated preset model library.' },
  { q: 'Can I customize my menu?', a: 'Absolutely. Each restaurant has full control over branding: logo, colors, typography, cover image, categories and every dish detail.' },
  { q: 'How does ordering work?', a: 'Guests browse the 3D menu, add items to cart, add notes, and place orders. The restaurant receives orders instantly in the dashboard and kitchen display.' },
  { q: 'Can customers add special instructions?', a: 'Yes. Customers can add special instructions for each item as well as a general note with the order.' },
  { q: 'Can I track analytics?', a: 'Yes. The analytics dashboard shows QR scans, menu views, dish interactions, AR launches, popular dishes, orders, revenue, and conversion rates.' },
  { q: 'Does it work on mobile?', a: 'Dine3D is built mobile-first. The customer menu experience is optimized for smartphones since most guests access it via QR code on their phone.' },
  { q: 'Can multiple restaurants use one Dine3D account?', a: "Each restaurant gets its own account and isolated dashboard. For multi-location restaurant groups, our Enterprise plan supports multiple locations under one management view." },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="d3-section" style={{ background: 'var(--bg-primary)' }}>
      <div className="d3-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left */}
          <div className="flex flex-col gap-6">
            <span className="d3-eyebrow">QUESTIONS</span>
            <h2 className="d3-display-md">
              Frequently<br />
              <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>asked.</em>
            </h2>
            <p className="d3-body">
              Everything you need to know about Dine3D. Can't find an answer?{' '}
              <a href="mailto:hello@dine3d.com" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>
                Contact us.
              </a>
            </p>
          </div>

          {/* Right — Accordion */}
          <div className="flex flex-col">
            {faqs.map((faq, i) => (
              <div
                key={i}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between text-left py-5 gap-4"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      letterSpacing: '-0.01em',
                      color: openIndex === i ? 'var(--gold)' : 'var(--text-primary)',
                      transition: 'color 200ms',
                    }}
                  >
                    {faq.q}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{
                      flexShrink: 0,
                      color: 'var(--text-muted)',
                      transform: openIndex === i ? 'rotate(45deg)' : 'rotate(0deg)',
                      transition: 'transform 300ms',
                    }}
                  >
                    <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
                <div
                  style={{
                    maxHeight: openIndex === i ? 300 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <p className="d3-body-sm" style={{ paddingBottom: '1.25rem' }}>
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CTA BANNER
   ============================================================ */
function CTABanner() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '6rem 0',
      }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(201,169,110,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="d3-container relative z-10 text-center flex flex-col items-center gap-8">
        <span className="d3-eyebrow">READY TO BEGIN</span>
        <h2 className="d3-display-lg" style={{ maxWidth: 600 }}>
          Bring your menu<br />
          <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>
            to life in 3D.
          </em>
        </h2>
        <p className="d3-body" style={{ maxWidth: 440 }}>
          Join hundreds of restaurants delivering unforgettable dining experiences with Dine3D.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/signup" className="d3-btn-primary" style={{ padding: '0.875rem 2.25rem', fontSize: '0.9375rem' }}>
            Start Free Today →
          </Link>
          <Link href="/menu/demo-restaurant" className="d3-btn-ghost" style={{ padding: '0.875rem 2.25rem', fontSize: '0.9375rem' }}>
            View Live Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '5rem 0 3rem',
      }}
    >
      <div className="d3-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand column */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
                <polygon points="13,1 24,7 24,19 13,25 2,19 2,7" fill="none" stroke="#C9A96E" strokeWidth="1.2" />
                <line x1="13" y1="1" x2="13" y2="25" stroke="#C9A96E" strokeWidth="0.8" strokeOpacity="0.5" />
                <line x1="2" y1="7" x2="24" y2="19" stroke="#C9A96E" strokeWidth="0.8" strokeOpacity="0.5" />
                <line x1="24" y1="7" x2="2" y2="19" stroke="#C9A96E" strokeWidth="0.8" strokeOpacity="0.5" />
              </svg>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                Dine<span style={{ color: 'var(--gold)' }}>3D</span>
              </span>
            </div>
            <p className="d3-eyebrow" style={{ color: 'var(--text-dimmed)', letterSpacing: '0.15em', fontSize: '0.5625rem' }}>
              SEE IT. EXPERIENCE IT. DINE IT.
            </p>
            <p className="d3-body-sm" style={{ maxWidth: 260 }}>
              The premium 3D restaurant menu platform for modern hospitality.
            </p>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-4">
            <span className="d3-eyebrow" style={{ color: 'var(--text-dimmed)', fontSize: '0.5625rem' }}>PRODUCT</span>
            {['Features', 'How It Works', 'Pricing', 'FAQ'].map((item) => (
              <Link
                key={item}
                href={`/#${item.toLowerCase().replace(/ /g, '-')}`}
                className="d3-btn-text"
                style={{ fontSize: '0.875rem' }}
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Company */}
          <div className="flex flex-col gap-4">
            <span className="d3-eyebrow" style={{ color: 'var(--text-dimmed)', fontSize: '0.5625rem' }}>COMPANY</span>
            {['About', 'Contact'].map((item) => (
              <Link key={item} href="#" className="d3-btn-text" style={{ fontSize: '0.875rem' }}>
                {item}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-4">
            <span className="d3-eyebrow" style={{ color: 'var(--text-dimmed)', fontSize: '0.5625rem' }}>LEGAL</span>
            {['Privacy', 'Terms'].map((item) => (
              <Link key={item} href="#" className="d3-btn-text" style={{ fontSize: '0.875rem' }}>
                {item}
              </Link>
            ))}
          </div>
        </div>

        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', fontFamily: 'var(--font-body)' }}>
            © {currentYear} Dine3D. All rights reserved.
          </p>
          <p className="d3-eyebrow" style={{ color: 'var(--text-dimmed)', fontSize: '0.5rem', letterSpacing: '0.15em' }}>
            PREMIUM 3D RESTAURANT TECHNOLOGY
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   MAIN PAGE EXPORT
   ============================================================ */
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <FAQSection />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}

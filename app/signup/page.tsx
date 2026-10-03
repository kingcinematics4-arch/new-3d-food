'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import Dine3DLogo from '@/components/Dine3DLogo';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    hotel_name: '',
    owner_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [step, setStep] = useState(1); // Multi-step form

  // Ref-based guard: React state is not applied synchronously, so a double click
  // could otherwise fire two signups (and two confirmation emails) for a single
  // user action.
  const submitInFlight = useRef(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitInFlight.current) return;

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    submitInFlight.current = true;
    setLoading(true);
    setError(null);

    try {
      // Exactly one signup request per submit action.
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      // Supabase still needs the emailed confirmation link before sign-in.
      // Show a "check your email" state instead of redirecting, and never
      // request another email from here.
      if (data.requiresEmailConfirmation) {
        setAwaitingConfirmation(true);
        setSuccess(false);
        return;
      }

      // Adopt the session the API route just wrote to the shared Supabase
      // session cookie, so the mounted AuthProvider is authenticated by the time
      // the dashboard renders.
      if (data.session?.access_token && data.session?.refresh_token) {
        const { error: adoptError } = await supabaseClient.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        if (adoptError) throw new Error(adoptError.message);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      submitInFlight.current = false;
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg-primary)', fontFamily: 'var(--font-body)' }}
    >
      {/* Left — Editorial Brand Panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          padding: '4rem',
        }}
      >
        <div className="absolute inset-0 d3-bg-grid" style={{ opacity: 0.4 }} />
        <div
          className="absolute"
          style={{
            top: '-10%',
            right: '-20%',
            width: '80%',
            height: '80%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(201,169,110,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo — official Dine3D asset, used as supplied */}
        <div className="relative z-10">
          <Dine3DLogo size="md" href="/" priority />
        </div>

        {/* Headline */}
        <div className="relative z-10 flex flex-col gap-6">
          <span className="d3-eyebrow" style={{ color: 'var(--text-dimmed)' }}>JOIN DINE3D</span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 3vw, 3.25rem)',
              fontWeight: 400,
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
              color: 'var(--text-primary)',
            }}
          >
            Build your restaurant's{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--gold)', fontWeight: 300 }}>
              digital dining experience.
            </em>
          </h1>
          <p className="d3-body" style={{ maxWidth: 340 }}>
            Create your 3D menu, launch your QR experience, and start taking orders today.
          </p>

          {/* Features list */}
          <ul className="flex flex-col gap-3 mt-2">
            {[
              '3D food visualization',
              'Native AR experiences',
              'Live order management',
              'Advanced analytics',
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-3" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--gold)', flexShrink: 0 }}>
                  <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <p className="d3-eyebrow" style={{ color: 'var(--text-dimmed)', fontSize: '0.5rem', letterSpacing: '0.2em' }}>
            SEE IT. EXPERIENCE IT. DINE IT.
          </p>
        </div>
      </div>

      {/* Right — Sign Up Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-16 overflow-y-auto">

        {/* Mobile logo — official Dine3D asset, used as supplied */}
        <div className="lg:hidden mb-10">
          <Dine3DLogo size="sm" href="/" priority />
        </div>

        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Header */}
          <div className="mb-8">
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
                lineHeight: 1.2,
              }}
            >
              Create Restaurant
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--gold)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Sign In
              </Link>
            </p>
          </div>

          {/* Check your email state */}
          {awaitingConfirmation && (
            <div className="d3-note d3-note-accent" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
              <div className="flex items-center gap-2" style={{ color: 'var(--gold)', fontWeight: 500 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
                  <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M1.5 3.5L7 8L12.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span>Check your email</span>
              </div>
              <p style={{ margin: 0 }}>
                Your restaurant was created. We sent a confirmation link to{' '}
                <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formData.email}</strong>. Open it to
                activate your account, then sign in.
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>
                The link expires after a limited time. If it has expired, request a new one from the
                sign-in screen — we only send a new email when you ask for it.
              </p>
              <Link
                href="/login"
                style={{
                  alignSelf: 'flex-start',
                  color: 'var(--gold)',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                Go to Sign In
              </Link>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="d3-note d3-note-accent">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
                <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Restaurant created. Taking you to the dashboard…</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="d3-note d3-note-danger">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.1" />
                <path d="M7 4.5V7.5M7 9.5V9.51" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Row: Restaurant name + Owner name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="d3-label">Restaurant Name</label>
                <input
                  type="text" name="hotel_name" required
                  value={formData.hotel_name} onChange={handleChange}
                  placeholder="Your restaurant name"
                  className="d3-input"
                />
              </div>
              <div>
                <label className="d3-label">Owner Name</label>
                <input
                  type="text" name="owner_name" required
                  value={formData.owner_name} onChange={handleChange}
                  placeholder="Your name"
                  className="d3-input"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="d3-label">Email Address</label>
              <input
                type="email" name="email" required
                value={formData.email} onChange={handleChange}
                placeholder="you@example.com"
                className="d3-input"
              />
            </div>

            {/* Row: Password + Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="d3-label">Password</label>
                <input
                  type={showPw ? 'text' : 'password'} name="password" required
                  minLength={8}
                  value={formData.password} onChange={handleChange}
                  placeholder="Min. 8 characters"
                  className="d3-input"
                />
              </div>
              <div>
                <label className="d3-label">Confirm Password</label>
                <input
                  type={showPw ? 'text' : 'password'} name="confirmPassword" required
                  value={formData.confirmPassword} onChange={handleChange}
                  placeholder="Repeat password"
                  className="d3-input"
                />
              </div>
            </div>

            {/* Row: Phone + City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="d3-label">Phone (Optional)</label>
                <input
                  type="text" name="phone"
                  value={formData.phone} onChange={handleChange}
                  placeholder="+1 555 000 0000"
                  className="d3-input"
                />
              </div>
              <div>
                <label className="d3-label">City (Optional)</label>
                <input
                  type="text" name="city"
                  value={formData.city} onChange={handleChange}
                  placeholder="Your city"
                  className="d3-input"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="d3-label">Address (Optional)</label>
              <input
                type="text" name="address"
                value={formData.address} onChange={handleChange}
                placeholder="Street address"
                className="d3-input"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              className="d3-btn-primary w-full"
              style={{
                justifyContent: 'center',
                padding: '0.875rem',
                fontSize: '0.9375rem',
                marginTop: '0.5rem',
                opacity: (loading || success) ? 0.6 : 1,
                cursor: (loading || success) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                    <path d="M8 2A6 6 0 0 1 14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Creating Restaurant...
                </>
              ) : 'Create Restaurant →'}
            </button>
          </form>

          <p style={{ color: 'var(--text-dimmed)', fontSize: '0.6875rem', marginTop: '1.5rem', lineHeight: 1.6 }}>
            By creating an account, you agree to Dine3D's{' '}
            <a href="#" style={{ color: 'var(--gold)' }}>Terms of Service</a>{' '}
            and{' '}
            <a href="#" style={{ color: 'var(--gold)' }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

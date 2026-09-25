'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg-primary)', fontFamily: 'var(--font-body)' }}
    >
      {/* Left — Editorial Brand Panel (desktop only) */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          padding: '4rem',
        }}
      >
        {/* Background subtle grid */}
        <div className="absolute inset-0 d3-bg-grid" style={{ opacity: 0.5 }} />

        {/* Gold atmospheric glow */}
        <div
          className="absolute"
          style={{
            bottom: '-10%',
            left: '-20%',
            width: '80%',
            height: '80%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(201,169,110,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <polygon points="13,1 24,7 24,19 13,25 2,19 2,7" fill="none" stroke="#C9A96E" strokeWidth="1.2" />
            <line x1="13" y1="1" x2="13" y2="25" stroke="#C9A96E" strokeWidth="0.8" strokeOpacity="0.5" />
            <line x1="2" y1="7" x2="24" y2="19" stroke="#C9A96E" strokeWidth="0.8" strokeOpacity="0.5" />
            <line x1="24" y1="7" x2="2" y2="19" stroke="#C9A96E" strokeWidth="0.8" strokeOpacity="0.5" />
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            Dine<span style={{ color: 'var(--gold)' }}>3D</span>
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 flex flex-col gap-6">
          <span className="d3-eyebrow" style={{ color: 'var(--text-dimmed)' }}>RESTAURANT DASHBOARD</span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 3.5vw, 3.75rem)',
              fontWeight: 400,
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
              color: 'var(--text-primary)',
            }}
          >
            Welcome back<br />
            to the{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--gold)', fontWeight: 300 }}>
              future of dining.
            </em>
          </h1>
          <p className="d3-body" style={{ maxWidth: 340 }}>
            Manage your 3D menu, QR experience, orders and analytics — all from one elegant dashboard.
          </p>
        </div>

        {/* Bottom caption */}
        <div className="relative z-10">
          <p className="d3-eyebrow" style={{ color: 'var(--text-dimmed)', fontSize: '0.5rem', letterSpacing: '0.2em' }}>
            SEE IT. EXPERIENCE IT. DINE IT.
          </p>
        </div>
      </div>

      {/* Right — Sign In Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-16">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-12">
          <svg width="22" height="22" viewBox="0 0 26 26" fill="none">
            <polygon points="13,1 24,7 24,19 13,25 2,19 2,7" fill="none" stroke="#C9A96E" strokeWidth="1.2" />
            <line x1="13" y1="1" x2="13" y2="25" stroke="#C9A96E" strokeWidth="0.8" strokeOpacity="0.5" />
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 500 }}>
            Dine<span style={{ color: 'var(--gold)' }}>3D</span>
          </span>
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Form header */}
          <div className="mb-10">
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
              Sign In
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Don't have an account?{' '}
              <Link
                href="/signup"
                style={{ color: 'var(--gold)', textDecoration: 'underline', textUnderlineOffset: 3 }}
              >
                Create one
              </Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-lg"
              style={{
                background: 'rgba(200,80,80,0.06)',
                border: '1px solid rgba(200,80,80,0.2)',
                color: '#FCA5A5',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div>
              <label className="d3-label">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@restaurant.com"
                className="d3-input"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="d3-label" style={{ margin: 0 }}>Password</label>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--text-dimmed)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="d3-input"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-dimmed)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8C1 8 4 3 8 3C12 3 15 8 15 8C15 8 12 13 8 13C4 13 1 8 1 8Z" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M2 2L14 14" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8C1 8 4 3 8 3C12 3 15 8 15 8C15 8 12 13 8 13C4 13 1 8 1 8Z" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="d3-btn-primary w-full"
              style={{
                justifyContent: 'center',
                padding: '0.875rem',
                fontSize: '0.9375rem',
                marginTop: '0.5rem',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                    <path d="M8 2A6 6 0 0 1 14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>Sign In</>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            <span style={{ color: 'var(--text-dimmed)', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          </div>

          {/* Demo access */}
          <Link
            href="/dashboard"
            className="d3-btn-ghost w-full"
            style={{ justifyContent: 'center', fontSize: '0.875rem' }}
          >
            View Demo Dashboard
          </Link>

        </div>
      </div>
    </div>
  );
}

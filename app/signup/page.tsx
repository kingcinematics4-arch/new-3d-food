'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const [showPw, setShowPw] = useState(false);
  const [step, setStep] = useState(1); // Multi-step form

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
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

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <svg width="22" height="22" viewBox="0 0 26 26" fill="none">
            <polygon points="13,1 24,7 24,19 13,25 2,19 2,7" fill="none" stroke="#C9A96E" strokeWidth="1.2" />
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 500 }}>
            Dine<span style={{ color: 'var(--gold)' }}>3D</span>
          </span>
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

          {/* Success */}
          {success && (
            <div
              className="mb-6 px-4 py-3 rounded-lg flex items-center gap-3"
              style={{
                background: 'rgba(100,210,150,0.06)',
                border: '1px solid rgba(100,210,150,0.2)',
                color: '#86EFAC',
                fontSize: '0.875rem',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Restaurant created! Redirecting to dashboard...
            </div>
          )}

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

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Row: Restaurant name + Owner name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="d3-label">Restaurant Name</label>
                <input
                  type="text" name="hotel_name" required
                  value={formData.hotel_name} onChange={handleChange}
                  placeholder="Grand Palace Bistro"
                  className="d3-input"
                />
              </div>
              <div>
                <label className="d3-label">Owner Name</label>
                <input
                  type="text" name="owner_name" required
                  value={formData.owner_name} onChange={handleChange}
                  placeholder="Alex Morgan"
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
                placeholder="owner@restaurant.com"
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
                  placeholder="+1 (555) 000-0000"
                  className="d3-input"
                />
              </div>
              <div>
                <label className="d3-label">City (Optional)</label>
                <input
                  type="text" name="city"
                  value={formData.city} onChange={handleChange}
                  placeholder="New York"
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
                placeholder="123 Culinary Blvd, Suite 100"
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

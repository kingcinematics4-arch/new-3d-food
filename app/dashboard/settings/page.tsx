'use client';

import React, { useState, useEffect } from 'react';
import { useHotel } from '@/lib/useHotel';

type FormData = {
  hotel_id: string;
  name: string;
  owner_name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  logo_url: string;
  primary_color: string;
  welcome_text: string;
  custom_domain: string;
  currency: string;
  tax_rate: number;
  service_charge: number;
};

/* ============================================================
   FORM SECTION
   ============================================================ */
function Section({
  index,
  title,
  note,
  aside,
  children,
}: {
  index: string;
  title: string;
  note?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="d3-panel p-6 sm:p-7">
      <div
        className="flex flex-wrap items-baseline justify-between gap-3"
        style={{ paddingBottom: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-warm)' }}
      >
        <div className="flex items-baseline gap-3">
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.8125rem',
              color: 'var(--gold-dim)',
              letterSpacing: '0.08em',
            }}
          >
            {index}
          </span>
          <h2 className="d3-panel-title">{title}</h2>
        </div>
        {aside}
      </div>
      {note && (
        <p
          style={{
            margin: '0 0 1.5rem',
            fontSize: '0.8125rem',
            lineHeight: 1.7,
            color: 'var(--text-muted)',
            maxWidth: '60ch',
          }}
        >
          {note}
        </p>
      )}
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { hotel, loading: hotelLoading } = useHotel();
  const [formData, setFormData] = useState<FormData>({
    hotel_id: '',
    name: '',
    owner_name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    logo_url: '',
    primary_color: '#B8A47A',
    welcome_text: '',
    custom_domain: '',
    currency: 'USD ($)',
    tax_rate: 8.875,
    service_charge: 5.0,
  });

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hotel) {
      setFormData((prev) => ({
        ...prev,
        hotel_id: hotel.id,
        name: hotel.name || '',
        owner_name: hotel.owner_name || '',
        email: hotel.email || '',
        phone: hotel.phone || '',
        city: hotel.city || '',
        address: hotel.address || '',
        logo_url: hotel.logo_url || '',
        primary_color: hotel.primary_color || '#B8A47A',
        welcome_text: hotel.welcome_text || '',
        custom_domain: hotel.custom_domain || '',
        currency: hotel.currency || 'USD ($)',
        tax_rate: hotel.tax_rate || 8.875,
        service_charge: hotel.service_charge || 5.0,
      }));
    }
  }, [hotel]);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);
    setError(null);

    try {
      const res = await fetch('/api/hotel/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const menuPath = formData.name
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')}`
    : 'Generated after you save your restaurant name';

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 940 }}>
      {/* ================= Page header ================= */}
      <header>
        <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>
          Restaurant Profile
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
          Your Establishment
        </h1>
        <p
          style={{
            margin: '0.5rem 0 0',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: 'var(--text-muted)',
            maxWidth: '58ch',
          }}
        >
          The details that appear on your guest menu, your receipts and your QR standees.
        </p>
      </header>

      {savedSuccess && (
        <div className="d3-note d3-note-accent">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
            <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Profile and branding saved.</span>
        </div>
      )}

      {error && (
        <div className="d3-note d3-note-danger">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.1" />
            <path d="M7 4.5V7.5M7 9.5V9.51" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ---------- Identity ---------- */}
        <Section
          index="01"
          title="Identity"
          note="How your restaurant is named and addressed across the menu and standees."
        >
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="d3-label" htmlFor="hotel-name">
                  Restaurant Name
                </label>
                <input
                  id="hotel-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="d3-input"
                />
              </div>
              <div>
                <label className="d3-label" htmlFor="owner-name">
                  Owner / Manager
                </label>
                <input
                  id="owner-name"
                  type="text"
                  required
                  value={formData.owner_name}
                  onChange={(e) => set('owner_name', e.target.value)}
                  className="d3-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="d3-label" htmlFor="hotel-email">
                  Contact Email
                </label>
                <input
                  id="hotel-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="d3-input"
                />
              </div>
              <div>
                <label className="d3-label" htmlFor="hotel-phone">
                  Phone
                </label>
                <input
                  id="hotel-phone"
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className="d3-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="d3-label" htmlFor="hotel-address">
                  Street Address
                </label>
                <input
                  id="hotel-address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => set('address', e.target.value)}
                  className="d3-input"
                />
              </div>
              <div>
                <label className="d3-label" htmlFor="hotel-city">
                  City
                </label>
                <input
                  id="hotel-city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => set('city', e.target.value)}
                  className="d3-input"
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ---------- Branding ---------- */}
        <Section
          index="02"
          title="Branding"
          note="The single accent tone used for prices, rules and calls to action on your guest menu."
        >
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="d3-label">Accent Colour</span>
                <div className="d3-swatch">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => set('primary_color', e.target.value)}
                    aria-label="Brand accent colour"
                  />
                  <code>{formData.primary_color}</code>
                </div>
              </div>
              <div>
                <label className="d3-label" htmlFor="logo-url">
                  Logo Image URL
                </label>
                <input
                  id="logo-url"
                  type="text"
                  value={formData.logo_url}
                  onChange={(e) => set('logo_url', e.target.value)}
                  placeholder="https://…"
                  className="d3-input"
                />
              </div>
            </div>

            <div>
              <label className="d3-label" htmlFor="welcome-text">
                Welcome Banner
              </label>
              <input
                id="welcome-text"
                type="text"
                value={formData.welcome_text}
                onChange={(e) => set('welcome_text', e.target.value)}
                className="d3-input"
              />
            </div>
          </div>
        </Section>

        {/* ---------- Domain ---------- */}
        <Section
          index="03"
          title="Domain"
          aside={<span className="d3-chip">Optional</span>}
        >
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <span className="d3-label">Current Menu Address</span>
              <input type="text" disabled value={menuPath} className="d3-input" style={{ opacity: 0.6 }} />
            </div>

            <div>
              <label className="d3-label" htmlFor="custom-domain">
                Custom Domain
              </label>
              <input
                id="custom-domain"
                type="text"
                value={formData.custom_domain}
                onChange={(e) => set('custom_domain', e.target.value)}
                placeholder="menu.yourrestaurant.com"
                className="d3-input"
              />
            </div>

            <div className="d3-note">
              <span>
                <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>DNS, once purchased.</strong>{' '}
                Point a <strong style={{ color: 'var(--text-secondary)' }}>CNAME</strong> record for{' '}
                <strong style={{ color: 'var(--text-secondary)' }}>menu</strong> (or{' '}
                <strong style={{ color: 'var(--text-secondary)' }}>@</strong> for the root) to{' '}
                <code style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                  cname.vercel-dns.com
                </code>
                . You can add the domain later without interrupting service.
              </span>
            </div>
          </div>
        </Section>

        {/* ---------- Commerce ---------- */}
        <Section
          index="04"
          title="Commerce"
          note="Currency and the percentages added to a guest's bill at checkout."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="d3-label" htmlFor="currency">
                Currency
              </label>
              <input
                id="currency"
                type="text"
                value={formData.currency}
                onChange={(e) => set('currency', e.target.value)}
                className="d3-input"
              />
            </div>
            <div>
              <label className="d3-label" htmlFor="tax-rate">
                Sales Tax (%)
              </label>
              <input
                id="tax-rate"
                type="number"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => set('tax_rate', parseFloat(e.target.value) || 0)}
                className="d3-input"
              />
            </div>
            <div>
              <label className="d3-label" htmlFor="service-charge">
                Service Charge (%)
              </label>
              <input
                id="service-charge"
                type="number"
                step="0.1"
                value={formData.service_charge}
                onChange={(e) => set('service_charge', parseFloat(e.target.value) || 0)}
                className="d3-input"
              />
            </div>
          </div>
        </Section>

        {/* ---------- Save ---------- */}
        <div
          className="flex flex-wrap items-center justify-between gap-4"
          style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-warm)' }}
        >
          <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
            Changes apply to your guest menu immediately after saving.
          </p>
          <button type="submit" className="d3-btn-primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>

      {hotelLoading && (
        <p style={{ color: 'var(--text-dimmed)', fontSize: '0.75rem' }}>
          Loading your profile…
        </p>
      )}
    </div>
  );
}
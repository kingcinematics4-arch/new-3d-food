'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useHotel } from '@/lib/useHotel';
import { useDashboardDialogs } from '@/components/dashboard/DashboardDialogs';

// Fixed champagne-gold foreground for QR codes (no per-user ink customisation).
const QR_FOREGROUND = '#C9A15D';

export default function QRBuilderPage() {
  const { hotel, loading: hotelLoading } = useHotel();
  const { toast } = useDashboardDialogs();
  const [tableNumber, setTableNumber] = useState('1');
  const [hotelSlug, setHotelSlug] = useState('');
  const [bgColor, setBgColor] = useState('#0B0B0A');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [batchCount, setBatchCount] = useState<string>('10');
  const [batchQrs, setBatchQrs] = useState<{ table: string; url: string; qrDataUrl: string }[]>([]);

  useEffect(() => {
    if (hotel?.slug) {
      setHotelSlug(hotel.slug);
    }
  }, [hotel]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const menuUrl = hotelSlug ? `${origin}/menu/${hotelSlug}?table=${tableNumber}` : '';

  useEffect(() => {
    generateQrCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableNumber, bgColor, hotelSlug]);

  const generateQrCode = async () => {
    if (!hotelSlug || !menuUrl) return;
    try {
      const url = await QRCode.toDataURL(menuUrl, {
        width: 360,
        margin: 2,
        color: {
          dark: QR_FOREGROUND,
          light: bgColor,
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  const handleGenerateBatch = async () => {
    const count = Math.min(50, Math.max(1, Math.trunc(Number(batchCount) || 10)));
    setBatchCount(String(count));
    const list: { table: string; url: string; qrDataUrl: string }[] = [];
    for (let i = 1; i <= count; i++) {
      const tNum = `${i}`;
      const url = `${origin}/menu/${hotelSlug}?table=${tNum}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: QR_FOREGROUND, light: bgColor },
      });
      list.push({ table: tNum, url, qrDataUrl: dataUrl });
    }
    setBatchQrs(list);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_Table_${tableNumber}.png`;
    link.click();
  };

  const handleCopyLink = async () => {
    if (!menuUrl) return;
    try {
      await navigator.clipboard.writeText(menuUrl);
      toast('Table menu link copied.', 'success');
    } catch {
      toast('Unable to copy the link. Please copy it manually.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 1180 }}>
      {/* ================= Page header ================= */}
      <header>
        <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>
          QR Code Builder
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
          Table Standee Studio
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
          Compose a printed tabletop standee for each table. Every code opens your guest
          menu with the table number already attached to the order.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= Controls ================= */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="d3-panel p-6">
            <div
              className="flex items-baseline justify-between gap-4"
              style={{ paddingBottom: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-warm)' }}
            >
              <h2 className="d3-panel-title" style={{ fontSize: '1.125rem' }}>
                Composition
              </h2>
              <span className="d3-chip">Single</span>
            </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="d3-label" htmlFor="qr-table">
                  Table Number / Name
                </label>
                <input
                  id="qr-table"
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="5, Patio 2, Terrace"
                  className="d3-input"
                />
              </div>

              <div>
                <span className="d3-label">Paper</span>
                <div className="d3-swatch">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    aria-label="QR background colour"
                  />
                  <code>{bgColor}</code>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, paddingTop: '0.25rem' }}>
                <button type="button" onClick={handleDownload} className="d3-btn-primary" style={{ flex: 1 }}>
                  Download PNG
                </button>
                <button type="button" onClick={handleCopyLink} className="d3-btn-subtle" style={{ flex: 1 }}>
                  Copy Link
                </button>
              </div>
            </div>
          </section>

          {/* Batch */}
          <section className="d3-panel p-6">
            <div
              className="flex items-baseline justify-between gap-4"
              style={{ paddingBottom: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-warm)' }}
            >
              <h2 className="d3-panel-title" style={{ fontSize: '1.125rem' }}>
                Whole Room
              </h2>
              <span className="d3-chip">Batch</span>
            </div>

            <p
              style={{
                margin: '0 0 1rem',
                fontSize: '0.8125rem',
                lineHeight: 1.7,
                color: 'var(--text-muted)',
              }}
            >
              Generate a numbered set of standees for every table in one pass.
            </p>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ width: 96 }}>
                <label className="d3-label" htmlFor="qr-batch">
                  Tables
                </label>
                <input
                  id="qr-batch"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={50}
                  step={1}
                  value={batchCount}
                  onChange={(e) => setBatchCount(e.target.value)}
                  className="d3-input"
                />
              </div>
              <button
                type="button"
                onClick={handleGenerateBatch}
                className="d3-btn-quiet"
                style={{ flex: 1 }}
                disabled={!hotelSlug}
              >
                Generate {batchCount || '0'} Codes
              </button>
            </div>
          </section>
        </div>

        {/* ================= Standee preview ================= */}
        <div className="lg:col-span-7">
          <div
            className="flex items-baseline justify-between gap-4"
            style={{ paddingBottom: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-warm)' }}
          >
            <h2 className="d3-panel-title" style={{ fontSize: '1.125rem' }}>
              Tabletop Standee
            </h2>
            <span className="d3-chip">Preview</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '2.5rem 1rem',
              borderRadius: 10,
              border: '1px solid var(--border-warm)',
              background: 'var(--bg-secondary)',
            }}
          >
            <div
              style={{
                width: 280,
                padding: '2rem 1.75rem',
                borderRadius: 8,
                background: bgColor || '#0B0B0A',
                border: `1px solid ${QR_FOREGROUND}`,
                boxShadow: '0 28px 64px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '1.25rem',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.5rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: QR_FOREGROUND,
                }}
              >
                Dine3D
              </p>

              <div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.25rem',
                    fontWeight: 500,
                    letterSpacing: '-0.015em',
                    lineHeight: 1.25,
                    color: QR_FOREGROUND,
                  }}
                >
                  Scan to view the menu
                </h3>
                <p
                  style={{
                    margin: '0.375rem 0 0',
                    fontSize: '0.6875rem',
                    lineHeight: 1.6,
                    opacity: 0.62,
                    color: QR_FOREGROUND,
                  }}
                >
                  No app required — open with your camera.
                </p>
              </div>

              {qrDataUrl && (
                <a
                  href={menuUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Open the guest menu"
                  style={{
                    display: 'block',
                    padding: 14,
                    background: bgColor || '#fff',
                    border: '1px solid rgba(128,128,128,0.25)',
                    borderRadius: 6,
                  }}
                >
                  <img
                    src={qrDataUrl}
                    alt={`QR code for table ${tableNumber}`}
                    style={{ width: 168, height: 168, objectFit: 'contain', display: 'block' }}
                  />
                </a>
              )}

              <div
                style={{
                  paddingTop: '1rem',
                  width: '100%',
                  borderTop: `1px solid ${QR_FOREGROUND}`,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1rem',
                    letterSpacing: '0.04em',
                    color: QR_FOREGROUND,
                  }}
                >
                  Table {tableNumber}
                </span>
              </div>
            </div>
          </div>

          {!hotelSlug && !hotelLoading && (
            <p
              style={{
                marginTop: '1.25rem',
                fontSize: '0.75rem',
                color: 'var(--text-dimmed)',
                textAlign: 'center',
              }}
            >
              Add your restaurant slug in the profile settings to generate live codes.
            </p>
          )}
        </div>
      </div>

      {/* ================= Batch results ================= */}
      {batchQrs.length > 0 && (
        <section className="d3-panel p-6">
          <div
            className="flex flex-wrap items-baseline justify-between gap-4"
            style={{ paddingBottom: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-warm)' }}
          >
            <h2 className="d3-panel-title" style={{ fontSize: '1.125rem' }}>
              Generated Standees · {batchQrs.length}
            </h2>
            <button type="button" onClick={() => window.print()} className="d3-btn-quiet">
              Print Set
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {batchQrs.map((item) => (
              <div key={item.table} style={{ textAlign: 'center' }}>
                <a
                  href={item.qrDataUrl}
                  download={`Table_${item.table}.png`}
                  style={{ display: 'block' }}
                >
                  <img
                    src={item.qrDataUrl}
                    alt={`QR code for table ${item.table}`}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      objectFit: 'contain',
                      padding: 8,
                      borderRadius: 6,
                      border: '1px solid var(--border-warm)',
                      background: bgColor || '#fff',
                    }}
                  />
                </a>
                <p
                  style={{
                    margin: '0.625rem 0 0',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.9375rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  Table {item.table}
                </p>
                <a
                  href={item.qrDataUrl}
                  download={`Table_${item.table}.png`}
                  style={{
                    display: 'inline-block',
                    marginTop: 4,
                    fontSize: '0.625rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-dimmed)',
                    textDecoration: 'none',
                  }}
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
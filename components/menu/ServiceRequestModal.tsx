'use client';

import React, { useState, useEffect } from 'react';

export interface ServiceRequestModalProps {
  hotelId: string;
  tableNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted?: () => void;
}

const REQUEST_OPTIONS = [
  { type: 'call_waiter', label: 'Call Waiter', icon: '🔔', desc: 'Notify floor staff to attend your table' },
  { type: 'drinking_water', label: 'Request Drinking Water', icon: '💧', desc: 'Request complimentary drinking water' },
  { type: 'cutlery', label: 'Request Extra Cutlery', icon: '🍴', desc: 'Forks, spoons, knives or plates' },
  { type: 'tissue', label: 'Request Tissue', icon: '🧻', desc: 'Extra napkins or tissues' },
  { type: 'assistance', label: 'Request Assistance', icon: '🙋‍♂️', desc: 'Help with menu or dietary queries' },
  { type: 'bill', label: 'Request Bill', icon: '🧾', desc: 'Request your final check' },
] as const;

export default function ServiceRequestModal({
  hotelId,
  tableNumber,
  isOpen,
  onClose,
  onRequestSubmitted,
}: ServiceRequestModalProps) {
  const [selectedType, setSelectedType] = useState<string>('call_waiter');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'duplicate'; text: string } | null>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  // Fetch active requests for this table
  useEffect(() => {
    if (!isOpen || !hotelId || !tableNumber) return;
    let dead = false;
    const fetchActive = async () => {
      try {
        const res = await fetch(`/api/service-requests/active?hotel_id=${encodeURIComponent(hotelId)}&table_number=${encodeURIComponent(tableNumber)}`);
        const data = await res.json();
        if (!dead && data.success) {
          setRecentRequests(data.requests || []);
        }
      } catch {}
    };
    fetchActive();
    const interval = setInterval(fetchActive, 4000);
    return () => {
      dead = true;
      clearInterval(interval);
    };
  }, [isOpen, hotelId, tableNumber]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || submitting) return;
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: hotelId,
          table_number: tableNumber,
          request_type: selectedType,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit request');
      }

      if (data.duplicate) {
        setStatusMessage({
          type: 'duplicate',
          text: data.message || 'A similar request was already sent just now. The waiter has been notified!',
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Request sent! A waiter is on their way to Table ' + tableNumber + '.',
        });
        setMessage('');
        if (onRequestSubmitted) onRequestSubmitted();
      }

      // Refresh list
      const refRes = await fetch(`/api/service-requests/active?hotel_id=${encodeURIComponent(hotelId)}&table_number=${encodeURIComponent(tableNumber)}`);
      const refData = await refRes.json();
      if (refData.success) {
        setRecentRequests(refData.requests || []);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Could not send request. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'new':
        return <span style={{ background: 'rgba(217, 119, 6, 0.15)', color: '#F59E0B', padding: '2px 8px', borderRadius: 100, fontSize: '0.6875rem', fontWeight: 600 }}>Sent</span>;
      case 'accepted':
        return <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', padding: '2px 8px', borderRadius: 100, fontSize: '0.6875rem', fontWeight: 600 }}>Accepted</span>;
      case 'in_progress':
        return <span style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#C084FC', padding: '2px 8px', borderRadius: 100, fontSize: '0.6875rem', fontWeight: 600 }}>In Progress</span>;
      case 'completed':
        return <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '2px 8px', borderRadius: 100, fontSize: '0.6875rem', fontWeight: 600 }}>✓ Completed</span>;
      case 'cancelled':
        return <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', padding: '2px 8px', borderRadius: 100, fontSize: '0.6875rem', fontWeight: 600 }}>Cancelled</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto flex flex-col sm:rounded-2xl rounded-t-2xl shadow-2xl"
        style={{
          background: 'var(--bg-surface, #141413)',
          border: '1px solid var(--border-warm, rgba(201,169,110,0.2))',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle, rgba(243,239,231,0.08))' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔔</span>
              <h2
                style={{
                  fontFamily: 'var(--font-display, serif)',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--text-primary, #F3EFE7)',
                  margin: 0,
                }}
              >
                Call Waiter
              </h2>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-dimmed, #7A766F)' }}>
              Table {tableNumber || 'Service'} • Quick Staff Assistance
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--bg-surface-2, #1E1D1A)',
              border: '1px solid var(--border-subtle, rgba(243,239,231,0.08))',
              color: 'var(--text-muted, #9E988D)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="p-5 flex flex-col gap-4"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1.25rem)' }}
        >
          {statusMessage && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 8,
                fontSize: '0.8125rem',
                lineHeight: 1.5,
                background:
                  statusMessage.type === 'error'
                    ? 'rgba(239, 68, 68, 0.12)'
                    : statusMessage.type === 'duplicate'
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(16, 185, 129, 0.12)',
                border: `1px solid ${
                  statusMessage.type === 'error'
                    ? '#EF4444'
                    : statusMessage.type === 'duplicate'
                    ? '#F59E0B'
                    : '#10B981'
                }`,
                color:
                  statusMessage.type === 'error'
                    ? '#FCA5A5'
                    : statusMessage.type === 'duplicate'
                    ? '#FCD34D'
                    : '#6EE7B7',
              }}
            >
              {statusMessage.text}
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.6875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-dimmed, #7A766F)',
                marginBottom: '0.5rem',
                fontWeight: 600,
              }}
            >
              Select Request Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REQUEST_OPTIONS.map((opt) => {
                const active = selectedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      setSelectedType(opt.type);
                      setStatusMessage(null);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 8,
                      textAlign: 'left',
                      background: active ? 'rgba(201,169,110,0.12)' : 'var(--bg-surface-2, #1E1D1A)',
                      border: `1px solid ${active ? 'var(--gold, #C9A96E)' : 'var(--border-subtle, rgba(243,239,231,0.08))'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{opt.icon}</span>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: active ? 'var(--gold, #C9A96E)' : 'var(--text-primary, #F3EFE7)',
                        }}
                      >
                        {opt.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed, #7A766F)', lineHeight: 1.3 }}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.6875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-dimmed, #7A766F)',
                marginBottom: '0.5rem',
                fontWeight: 600,
              }}
            >
              Optional Note / Request Details
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Please bring warm water, or extra spoons..."
              rows={2}
              maxLength={300}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                borderRadius: 8,
                background: 'var(--bg-surface-2, #1E1D1A)',
                border: '1px solid var(--border-subtle, rgba(243,239,231,0.08))',
                color: 'var(--text-primary, #F3EFE7)',
                fontSize: '0.8125rem',
                resize: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="d3-btn-primary"
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'var(--gold, #C9A96E)',
              color: '#0B0B0A',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Calling Waiter...' : 'Send Request to Staff 🔔'}
          </button>

          {/* Table request history / live status */}
          {recentRequests.length > 0 && (
            <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle, rgba(243,239,231,0.08))', paddingTop: '0.75rem' }}>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-dimmed, #7A766F)',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                }}
              >
                Table {tableNumber} Requests Today
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentRequests.slice(0, 3).map((r) => {
                  const opt = REQUEST_OPTIONS.find((o) => o.type === r.request_type);
                  return (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--bg-surface-2, #1E1D1A)',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span>{opt?.icon || '🔔'}</span>
                        <span style={{ color: 'var(--text-primary, #F3EFE7)', fontWeight: 500 }}>
                          {opt?.label || r.request_type}
                        </span>
                      </div>
                      <div>{statusBadge(r.status)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

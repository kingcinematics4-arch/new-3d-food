// components/admin/ui.tsx
//
// Presentational primitives for the Dine3D admin panel.
//
// Deliberately built from the existing `d3-*` design system (near-black
// surfaces, warm ivory type, champagne hairlines, editorial serif headings) so
// the panel is visually continuous with the product it controls. No new colour
// system, no glassmorphism, no glows, no bright yellow / orange / blue.
//
// These are pure presentational components with no `'use client'` directive, so
// they can be rendered from either a server or a client parent.

import React from 'react';

/* ============================================================
   PAGE FRAME
   ============================================================ */

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 mb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="d3-eyebrow" style={{ color: 'var(--gold-dim)' }}>
            {eyebrow}
          </span>
          <h1
            className="d3-display-md"
            style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', margin: 0 }}
          >
            {title}
          </h1>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      {description ? (
        <p className="d3-body-sm" style={{ maxWidth: '62ch', margin: 0 }}>
          {description}
        </p>
      ) : null}

      <div className="d3-rule" />
    </header>
  );
}

/* ============================================================
   PANELS
   ============================================================ */

export function AdminPanel({
  title,
  description,
  children,
  aside,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="d3-panel" style={{ overflow: 'hidden' }}>
      {title ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
          style={{ borderBottom: '1px solid var(--border-warm)' }}
        >
          <div className="flex flex-col gap-1">
            <h2 className="d3-panel-title" style={{ margin: 0 }}>
              {title}
            </h2>
            {description ? (
              <p className="d3-body-sm" style={{ margin: 0, color: 'var(--text-dimmed)' }}>
                {description}
              </p>
            ) : null}
          </div>
          {aside ? <div className="flex items-center gap-2">{aside}</div> : null}
        </div>
      ) : null}

      <div className="p-6">{children}</div>
    </section>
  );
}

/* ============================================================
   FIELDS
   ============================================================ */

export function AdminField({
  label,
  hint,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="d3-label">{label}</span>
      {children}
      {hint ? (
        <span className="block mt-1.5" style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function AdminInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      className="d3-input"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function AdminTextarea({
  value,
  onChange,
  rows = 4,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <textarea
      className="d3-input resize-y"
      rows={rows}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * Toggle switch.
 * Built from a track and a marker rather than a coloured pill so it stays
 * monochrome until it is on, at which point it picks up the champagne accent.
 */
export function AdminToggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 text-left w-full group"
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0,
          marginTop: 2,
          width: 34,
          height: 19,
          borderRadius: 10,
          padding: 2,
          display: 'flex',
          justifyContent: checked ? 'flex-end' : 'flex-start',
          background: checked ? 'var(--gold-dim)' : 'var(--bg-surface-3)',
          border: '1px solid var(--border-warm)',
          transition: 'background var(--transition-base)',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span
          style={{
            width: 13,
            height: 13,
            borderRadius: '50%',
            background: checked ? 'var(--gold-pale)' : 'var(--text-dimmed)',
            transition: 'background var(--transition-base)',
          }}
        />
      </span>

      <span className="flex flex-col gap-0.5">
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{label}</span>
        {description ? (
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)', lineHeight: 1.5 }}>
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}

/* ============================================================
   CHOICE CONTROLS
   ============================================================ */

export function AdminOptionRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string; description?: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))` }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="d3-option"
          data-active={value === option.value}
          onClick={() => onChange(option.value)}
        >
          <span className="block" style={{ color: 'inherit' }}>
            {option.label}
          </span>
          {option.description ? (
            <span className="block mt-1" style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
              {option.description}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/** Colour control: a native swatch plus a hex field, with Dine3D presets. */
export function AdminColorField({
  label,
  value,
  onChange,
  presets,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  presets: readonly { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="d3-label">{label}</span>

      <div className="d3-swatch">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} swatch`}
        />
        <input
          className="d3-input"
          style={{ padding: '0.375rem 0.5rem', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '0.75rem' }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            title={preset.label}
            aria-label={preset.label}
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              background: preset.value,
              border:
                value.toLowerCase() === preset.value.toLowerCase()
                  ? '1px solid var(--gold-pale)'
                  : '1px solid var(--border-warm)',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   BUTTONS
   ============================================================ */

export function AdminButton({
  children,
  onClick,
  variant = 'default',
  type = 'button',
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
  disabled?: boolean;
  title?: string;
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: {
      background: 'var(--bg-surface-2)',
      border: '1px solid var(--border-medium)',
      color: 'var(--gold-pale)',
    },
    primary: {
      background: 'var(--bg-elevated)',
      border: '1px solid var(--gold-dim)',
      color: 'var(--text-primary)',
    },
    ghost: {
      background: 'transparent',
      border: '1px solid var(--border-warm)',
      color: 'var(--text-muted)',
    },
    danger: {
      background: 'transparent',
      border: '1px solid rgba(196,102,88,0.24)',
      color: '#D9A79E',
    },
  };

  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="d3-btn-quiet"
      style={{
        ...styles[variant],
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

/** Compact square control used for reorder / remove actions on list rows. */
export function AdminIconButton({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="d3-btn-inline"
      style={{
        padding: '0.3125rem 0.4375rem',
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

/* ============================================================
   EMPTY STATE
   Shown when nothing has been configured. Never a placeholder pretending to be
   real content.
   ============================================================ */

export function AdminEmpty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="d3-empty">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-dimmed)' }}>
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.1" />
        <path d="M3 9H21" stroke="currentColor" strokeWidth="1.1" />
        <path d="M8 14H13" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
      <span className="d3-empty-title">{title}</span>
      <p className="d3-empty-body">{body}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

/** Inline hint used to explain a section that exists but has no content yet. */
export function AdminNote({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'accent' }) {
  const className = tone === 'accent' ? 'd3-note d3-note-accent' : 'd3-note';
  return (
    <div className={className}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1" />
        <path d="M7 4.2V7.2M7 9.4H7.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

/** Small readonly value display, e.g. in the overview. */
export function AdminReadonly({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="d3-label" style={{ marginBottom: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: '0.875rem', color: value ? 'var(--text-primary)' : 'var(--text-dimmed)' }}>
        {value || 'Not set'}
      </span>
    </div>
  );
}

/** Hairline-separated row inside a panel. */
export function AdminRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-4" style={{ borderTop: '1px solid var(--border-warm)' }}>
      {children}
    </div>
  );
}
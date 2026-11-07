'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type ToastTone = 'info' | 'success' | 'error';

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

interface PromptOptions {
  title: string;
  body?: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  validate?: (value: string) => string | null;
}

interface DialogsApi {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const DialogsContext = createContext<DialogsApi | null>(null);

export function useDashboardDialogs(): DialogsApi {
  const ctx = useContext(DialogsContext);
  if (!ctx) {
    throw new Error('useDashboardDialogs must be used within DashboardDialogsProvider');
  }
  return ctx;
}

type ActiveDialog =
  | { kind: 'confirm'; options: ConfirmOptions; resolve: (value: boolean) => void }
  | {
      kind: 'prompt';
      options: PromptOptions;
      resolve: (value: string | null) => void;
    };

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function DashboardDialogsProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [active, setActive] = useState<ActiveDialog | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const [promptError, setPromptError] = useState<string | null>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = uid();
      setToasts((prev) => [...prev, { id, message, tone }]);
      window.setTimeout(() => dismissToast(id), tone === 'error' ? 5200 : 3600);
    },
    [dismissToast],
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setActive({ kind: 'confirm', options, resolve });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setPromptValue(options.initialValue ?? '');
      setPromptError(null);
      setActive({ kind: 'prompt', options, resolve });
    });
  }, []);

  const closeActive = useCallback(
    (result: boolean | string | null) => {
      if (!active) return;
      if (active.kind === 'confirm') active.resolve(Boolean(result));
      else active.resolve(typeof result === 'string' ? result : null);
      setActive(null);
      setPromptValue('');
      setPromptError(null);
    },
    [active],
  );

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeActive(active.kind === 'confirm' ? false : null);
      }
    };
    document.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => {
      if (active.kind === 'prompt') promptInputRef.current?.focus();
      else primaryBtnRef.current?.focus();
    }, 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [active, closeActive]);

  const submitPrompt = useCallback(() => {
    if (!active || active.kind !== 'prompt') return;
    const value = promptValue.trim();
    const validationError = active.options.validate ? active.options.validate(value) : null;
    if (validationError) {
      setPromptError(validationError);
      return;
    }
    if (!value) {
      setPromptError('This field is required.');
      return;
    }
    closeActive(value);
  }, [active, promptValue, closeActive]);

  const api = useMemo(() => ({ toast, confirm, prompt }), [toast, confirm, prompt]);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.25rem',
    background: 'rgba(6,5,4,0.72)',
    backdropFilter: 'blur(8px)',
  };

  const panelStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 440,
    borderRadius: 14,
    border: '1px solid var(--border-warm)',
    background: 'var(--bg-surface)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
    overflow: 'hidden',
  };

  const toneStyles = (tone: ToastTone): React.CSSProperties => {
    if (tone === 'success') {
      return {
        borderColor: 'rgba(16,185,129,0.28)',
        background: 'linear-gradient(180deg, rgba(16,185,129,0.08), var(--bg-surface))',
      };
    }
    if (tone === 'error') {
      return {
        borderColor: 'rgba(196,102,88,0.28)',
        background: 'linear-gradient(180deg, rgba(196,102,88,0.08), var(--bg-surface))',
      };
    }
    return {
      borderColor: 'rgba(184,164,122,0.22)',
      background: 'linear-gradient(180deg, rgba(184,164,122,0.06), var(--bg-surface))',
    };
  };

  return (
    <DialogsContext.Provider value={api}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 110,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          width: 'min(380px, calc(100vw - 32px))',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '0.875rem 1rem',
              borderRadius: 12,
              border: '1px solid var(--border-warm)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
              ...toneStyles(t.tone),
            }}
          >
            <span
              aria-hidden="true"
              style={{
                marginTop: 2,
                width: 8,
                height: 8,
                borderRadius: '50%',
                flexShrink: 0,
                background:
                  t.tone === 'success'
                    ? '#10b981'
                    : t.tone === 'error'
                      ? '#C46658'
                      : 'var(--gold)',
              }}
            />
            <p style={{ margin: 0, flex: 1, fontSize: '0.8125rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
              {t.message}
            </p>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dimmed)',
                cursor: 'pointer',
                padding: 2,
                lineHeight: 1,
                fontSize: '1rem',
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {active && (
        <div
          style={overlayStyle}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeActive(active.kind === 'confirm' ? false : null);
          }}
        >
          <div style={panelStyle} role="dialog" aria-modal="true" aria-label={active.options.title}>
            <div style={{ padding: '1.25rem 1.25rem 1rem' }}>
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 500,
                  letterSpacing: '-0.015em',
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                {active.options.title}
              </h2>
              {active.options.body && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem', lineHeight: 1.65, color: 'var(--text-muted)' }}>
                  {active.options.body}
                </p>
              )}

              {active.kind === 'prompt' && (
                <div style={{ marginTop: '1rem' }}>
                  {active.options.label && (
                    <label
                      htmlFor="d3-dialog-prompt"
                      className="d3-label"
                      style={{ display: 'block', marginBottom: 6 }}
                    >
                      {active.options.label}
                    </label>
                  )}
                  <input
                    ref={promptInputRef}
                    id="d3-dialog-prompt"
                    type="text"
                    className="d3-input"
                    value={promptValue}
                    placeholder={active.options.placeholder}
                    onChange={(e) => {
                      setPromptValue(e.target.value);
                      if (promptError) setPromptError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitPrompt();
                      }
                    }}
                    autoComplete="off"
                  />
                  {promptError && (
                    <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: '#C46658' }}>{promptError}</p>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                padding: '0.875rem 1.25rem 1.25rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                className="d3-btn-subtle"
                onClick={() => closeActive(active.kind === 'confirm' ? false : null)}
              >
                {active.options.cancelLabel || 'Cancel'}
              </button>
              {active.kind === 'confirm' ? (
                <button
                  ref={primaryBtnRef}
                  type="button"
                  className={active.options.tone === 'danger' ? 'd3-btn-quiet' : 'd3-btn-primary'}
                  style={
                    active.options.tone === 'danger'
                      ? { borderColor: 'rgba(196,102,88,0.35)', color: '#D9A79E' }
                      : undefined
                  }
                  onClick={() => closeActive(true)}
                >
                  {active.options.confirmLabel || 'Confirm'}
                </button>
              ) : (
                <button ref={primaryBtnRef} type="button" className="d3-btn-primary" onClick={submitPrompt}>
                  {active.options.confirmLabel || 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogsContext.Provider>
  );
}

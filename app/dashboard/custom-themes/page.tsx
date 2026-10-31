'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useHotel } from '@/lib/useHotel';
import CustomThemeBuilder from '@/components/menu/CustomThemeBuilder';
import type { CustomThemeConfig } from '@/lib/customTheme';

interface SavedTheme {
  id: string;
  hotel_id: string;
  name: string;
  theme_config: CustomThemeConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiThemeList {
  success: boolean;
  themes?: SavedTheme[];
  error?: string;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function PreviewThumbnail({ config }: { config: CustomThemeConfig }) {
  const accent = config.primaryColor || '#E5A93C';
  const bg = config.pageBg || '#121212';
  const cardBg = config.cardBg || '#1C1C1E';
  const text = config.textColor || '#F5F5F7';
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-white/15"
      style={{
        height: 110,
        background: bg,
        color: text,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${bg} 0%, ${cardBg} 60%, ${accent} 100%)`,
          opacity: 0.9,
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div
          style={{
            height: 10,
            width: 28,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.15)',
            marginBottom: 6,
          }}
        />
        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              height: 14,
              width: 14,
              borderRadius: '50%',
              background: accent,
            }}
          />
          <div
            style={{
              height: 14,
              width: 14,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.15)',
            }}
          />
          <div
            style={{
              height: 14,
              width: 14,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.15)',
            }}
          />
        </div>
      </div>
      <div className="absolute top-2 right-2 text-[0.65rem] font-bold tracking-tighter uppercase opacity-70">
        CUSTOM
      </div>
    </div>
  );
}

const BUTTON_STYLE = 'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5';
const BTN_PRIMARY = `${BUTTON_STYLE} bg-[#E5A93C] text-black hover:bg-[#F0BC5E]`;
const BTN_GHOST = `${BUTTON_STYLE} border-white/20 text-neutral-300 hover:border-white hover:text-white`;
const BTN_DANGER = `${BUTTON_STYLE} border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300`;
const BTN_OUTLINE = `${BUTTON_STYLE} border-white/20 text-neutral-400 hover:border-white hover:text-white`;

export default function CustomThemesPage() {
  const { hotel, loading: hotelLoading, refetch } = useHotel();
  const [themes, setThemes] = useState<SavedTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingTheme, setEditingTheme] = useState<SavedTheme | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState<string | null>(null);
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);

  const fetchThemes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/hotel/themes');
      const json: ApiThemeList = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load saved themes');
      }
      setThemes(json.themes || []);
      const active = (json.themes || []).find((t) => t.is_active);
      setActiveThemeId(active ? active.id : null);
    } catch (err: any) {
      setError(err.message || 'Failed to load saved themes');
      setThemes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const handleCreate = () => {
    setEditingThemeId(null);
    setCreating(true);
  };

  const handleApply = async (themeId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hotel/themes/${themeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotel?.id || '', action: 'apply' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to apply theme');
      }
      await fetchThemes();
    } catch (err: any) {
      setError(err.message || 'Failed to apply theme');
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (themeId: string, currentName: string) => {
    const name = window.prompt('Enter new theme name', currentName);
    if (!name || !name.trim() || name.trim() === currentName) return;
    setSavingEdit(themeId);
    try {
      const res = await fetch(`/api/hotel/themes/${themeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotel?.id || '', name: name.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to rename theme');
      }
      await fetchThemes();
    } catch (err: any) {
      setError(err.message || 'Failed to rename theme');
    } finally {
      setSavingEdit(null);
    }
  };

  const handleDuplicate = async (themeId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hotel/themes/${themeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotel?.id || '', action: 'duplicate' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to duplicate theme');
      }
      await fetchThemes();
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate theme');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (themeId: string) => {
    if (!window.confirm('Delete this saved theme? This cannot be undone.')) return;
    setDeletingId(themeId);
    try {
      const res = await fetch(`/api/hotel/themes/${themeId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotel?.id || '' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete theme');
      }
      await fetchThemes();
    } catch (err: any) {
      setError(err.message || 'Failed to delete theme');
    } finally {
      setDeletingId(null);
    }
  };

  const activeId = hotel ? activeThemeId : null;

  if (hotelLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="flex flex-col gap-2 text-center">
          <div
            className="w-10 h-10 rounded-full border-2 border-white/10 border-t-[#E5A93C] animate-spin"
            style={{ width: 40, height: 40 }}
          />
          <p className="text-neutral-400 text-sm">Loading saved themes…</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-neutral-400 text-sm">No hotel linked to this account.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 1100 }}>
      {/* ================= Page header ================= */}
      <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5">
        <div>
          <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>
            Custom Themes
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
            Saved Custom Themes
          </h1>
          <p
            style={{
              margin: '0.5rem 0 0',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: 'var(--text-muted)',
              maxWidth: '60ch',
            }}
          >
            Your library of saved, named custom themes. Apply one to make it
            active on your public customer-facing menu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hotel?.slug && (
            <Link
              href={`/menu/${hotel.slug}`}
              target="_blank"
              className="d3-btn-ghost flex items-center gap-2"
              style={{ flexShrink: 0 }}
            >
              <span>Open Live Menu</span>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M2.5 9.5L9.5 2.5M4.5 2.5H9.5V7.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          )}
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="d3-btn-primary px-5 py-2.5 text-xs font-bold whitespace-nowrap flex items-center gap-2"
          >
            {creating ? 'Creating…' : '+ Create Custom Theme'}
          </button>
        </div>
      </header>

      {error && (
        <div className="d3-note d3-note-danger">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
            <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ================= Empty state ================= */}
      {themes.length === 0 && (
        <section
          className="flex flex-col items-center justify-center py-20 text-center"
          style={{ border: '2px dashed var(--border-warm)', borderRadius: 'var(--d3-panel-radius, 10px)' }}
        >
          <div
            className="w-16 h-16 rounded-full bg-neutral-900 border border-white/15 flex items-center justify-center mb-4"
            style={{ flexShrink: 0 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
            No saved themes yet
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '40ch', margin: '0 0 1.5rem' }}>
            Build a custom theme in the Theme Studio and save it to your library.
            Saved themes can be renamed, duplicated, and applied to your public menu.
          </p>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="d3-btn-primary px-6 py-2.5 text-sm font-bold flex items-center gap-2"
          >
            {creating ? 'Creating…' : '+ Create Custom Theme'}
          </button>
        </section>
      )}

      {/* ================= Theme library grid ================= */}
      {themes.length > 0 && (
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {themes.map((theme) => {
              const isActive = theme.id === activeId;
              return (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={isActive}
                  hotelId={hotel.id}
                  onApply={handleApply}
                  onRename={handleRename}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onEdit={(themeId) => {
                    const t = themes.find((x) => x.id === themeId);
                    setEditingTheme(t ?? null);
                    setEditingThemeId(themeId);
                    setCreating(true);
                  }}
                  renaming={savingEdit === theme.id}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ================= Create / Edit editor ================= */}
      {creating && hotel && (
        <CreateThemeEditor
          hotel={hotel}
          themeToEdit={editingTheme ? themes.find((t) => t.id === editingThemeId) || null : null}
          onDone={() => {
            setCreating(false);
            setEditingThemeId(null);
            setEditingTheme(null);
            fetchThemes();
            if (refetch) refetch();
          }}
        />
      )}
    </div>
  );
}

interface ThemeCardProps {
  theme: SavedTheme;
  isActive: boolean;
  hotelId: string;
  onApply: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  renaming: boolean;
}

function ThemeCard({
  theme,
  isActive,
  hotelId,
  onApply,
  onRename,
  onDuplicate,
  onDelete,
  onEdit,
  renaming,
}: ThemeCardProps) {
  const config = theme.theme_config;
  const accent = config?.primaryColor || '#E5A93C';
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="d3-panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        border: isActive ? '1px solid var(--gold)' : '1px solid var(--border-warm)',
        background: isActive ? 'rgba(184,164,122,0.04)' : 'var(--bg-secondary)',
      }}
    >
      {/* Header: name + active badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {theme.name}
          </span>
          {isActive && (
            <span className="px-2 py-0.5 rounded-full text-[0.625rem] bg-[#B8A47A] text-black font-bold">
              Active
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: '0.65rem',
            color: 'var(--text-dimmed)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {formatDate(theme.created_at)}
        </span>
      </div>

      {/* Preview thumbnail */}
      <PreviewThumbnail config={config} />

      {/* Status */}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1"
          style={{
            fontSize: '0.6875rem',
            fontWeight: 500,
            color: isActive ? '#10b981' : 'var(--text-muted)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isActive ? '#10b981' : 'var(--text-dimmed)',
            }}
          />
          {isActive ? 'Applied to public menu' : 'In library'}
        </span>
      </div>

      <div className="mt-auto flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onEdit(theme.id)}
          disabled={renaming}
          className={`${BTN_GHOST} ${renaming ? 'opacity-50 pointer-events-none' : ''}`}
          title="Edit theme"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4h6M5 8L2 11" />
          </svg>
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={() => onRename(theme.id, theme.name)}
          disabled={renaming}
          className={`${BTN_GHOST} ${renaming ? 'opacity-50 pointer-events-none' : ''}`}
          title="Rename theme"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2V6H2M10 12L2 11M10 12H2" />
          </svg>
          <span>Rename</span>
        </button>

        <button
          type="button"
          onClick={() => onDuplicate(theme.id)}
          className={BTN_GHOST}
          title="Duplicate theme"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 11V3M14 7H4" />
          </svg>
          <span>Duplicate</span>
        </button>

        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className={BTN_DANGER}
          title="Delete theme"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span>Delete</span>
        </button>

        <button
          type="button"
          onClick={() => onApply(theme.id)}
          disabled={isActive}
          className={`${isActive ? 'opacity-50 pointer-events-none' : ''} ${BTN_PRIMARY}`}
          title={isActive ? 'Already active' : 'Apply to public menu'}
        >
          {isActive ? 'Applied' : 'Apply Theme'}
        </button>
      </div>

      {confirmDelete && (
        <div
          className="mt-3 flex gap-2 pt-3 border-t border-white/10"
          style={{ background: 'rgba(196,102,88,0.06)', borderRadius: 'var(--d3-panel-radius, 10px)', padding: '0.875rem' }}
        >
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', margin: '0 0 0.75rem' }}>
            Delete “{theme.name}”? This cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => {
              setConfirmDelete(false);
              onDelete(theme.id);
            }}
            className="px-3 py-1 rounded-lg text-xs font-bold text-red-400 border border-red-500/40 hover:bg-red-500/10"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="px-3 py-1 rounded-lg text-xs font-bold text-neutral-300 border border-white/20 hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      )}
      </div>
    );
  }

interface CreateThemeEditorProps {
  hotel: import('@/lib/useHotel').Hotel;
  themeToEdit: SavedTheme | null;
  onDone: () => void;
}

function CreateThemeEditor({ hotel, themeToEdit, onDone }: CreateThemeEditorProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => onDone(), 120);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-white/15 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {themeToEdit ? 'Edit Theme' : 'Create Custom Theme'}
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              {themeToEdit
                ? 'Modify the saved theme and save your changes.'
                : 'Design your theme and give it a name to save it to your library.'}
            </p>
          </div>
          <button type="button" onClick={handleClose} className="text-neutral-400 hover:text-white">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l6 6M12 6l-6 6" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <CustomThemeBuilder
            hotel={hotel}
            initialConfig={themeToEdit?.theme_config || undefined}
            editingThemeId={themeToEdit?.id || undefined}
            initialThemeName={themeToEdit?.name || undefined}
            onSaved={() => {
              handleClose();
            }}
          />
        </div>

        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-white/20 text-neutral-300 hover:text-white text-xs font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-[#E5A93C] hover:bg-[#F0BC5E] text-black text-xs font-bold transition-all"
          >
            {themeToEdit ? 'Save Changes' : 'Save Theme'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

// app/admin/(panel)/features/page.tsx
//
// FEATURE CARDS
//
// Full control over the capability grid: add, delete, reorder, rename, rewrite
// the description, choose an icon and switch individual cards off.
//
// Reordering is done with explicit move controls rather than drag-and-drop, so
// the order is reachable by keyboard and works identically everywhere.

import React from 'react';
import { useSiteContent } from '@/components/admin/SiteContentProvider';
import {
  AdminPageHeader,
  AdminPanel,
  AdminField,
  AdminInput,
  AdminTextarea,
  AdminToggle,
  AdminEmpty,
  AdminNote,
  AdminIconButton,
} from '@/components/admin/ui';
import FeatureIcon, { ICON_LABELS } from '@/components/site/FeatureIcon';
import { ICON_OPTIONS, createItemId } from '@/lib/siteContent';
import type { Feature } from '@/lib/siteContent';

export default function AdminFeaturesPage() {
  const { draft, update, loading } = useSiteContent();
  const features = draft.features;

  const setSection = <K extends keyof typeof features>(key: K, value: (typeof features)[K]) =>
    update((current) => ({ ...current, features: { ...current.features, [key]: value } }));

  const setItem = (id: string, patch: Partial<Feature>) =>
    setSection(
      'items',
      features.items.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= features.items.length) return;

    const next = [...features.items];
    [next[index], next[target]] = [next[target], next[index]];
    setSection('items', next);
  };

  const remove = (id: string) => setSection('items', features.items.filter((item) => item.id !== id));

  const add = () =>
    setSection('items', [
      ...features.items,
      {
        id: createItemId('feat'),
        enabled: true,
        icon: 'cube',
        eyebrow: '',
        title: '',
        description: '',
        imageUrl: '',
      },
    ]);

  if (loading) {
    return (
      <>
        <AdminPageHeader eyebrow="FEATURES" title="Feature cards" />
        <div className="d3-panel p-8" style={{ color: 'var(--text-dimmed)', fontSize: '0.875rem' }}>
          Loading…
        </div>
      </>
    );
  }

  const visible = features.items.filter((item) => item.enabled && item.title).length;

  return (
    <>
      <AdminPageHeader
        eyebrow="FEATURES"
        title="Feature cards"
        description="The grid of capability cards. Only cards with a title appear on the website."
        actions={
          <button type="button" className="d3-btn-quiet" onClick={add}>
            + Add feature
          </button>
        }
      />

      <div className="flex flex-col gap-6">
        <AdminPanel title="Section">
          <div className="flex flex-col gap-4">
            <AdminToggle
              checked={features.enabled}
              onChange={(v) => setSection('enabled', v)}
              label="Show the features section"
              description="When off, the whole grid is hidden from visitors."
            />
            <div className="d3-rule" />
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <AdminField label="Small label">
                <AdminInput
                  value={features.eyebrow}
                  onChange={(v) => setSection('eyebrow', v)}
                  placeholder="CAPABILITIES"
                />
              </AdminField>
              <AdminField label="Heading">
                <AdminInput
                  value={features.heading}
                  onChange={(v) => setSection('heading', v)}
                  placeholder="Crafted for"
                />
              </AdminField>
              <AdminField label="Heading second line">
                <AdminInput
                  value={features.headingAccent}
                  onChange={(v) => setSection('headingAccent', v)}
                  placeholder="modern dining"
                />
              </AdminField>
            </div>
            <AdminField label="Intro text">
              <AdminTextarea
                value={features.body}
                onChange={(v) => setSection('body', v)}
                rows={3}
                placeholder="One or two sentences above the grid."
              />
            </AdminField>
          </div>
        </AdminPanel>

        <AdminPanel
          title="Cards"
          description={`${visible} card${visible === 1 ? '' : 's'} will appear on the website.`}
          aside={
            <button type="button" className="d3-btn-inline" onClick={add}>
              + Add
            </button>
          }
        >
          {features.items.length === 0 ? (
            <AdminEmpty
              title="No feature cards yet"
              body="The grid is empty. Add a card for each capability you want to describe, or switch the section off."
              action={
                <button type="button" className="d3-btn-quiet" onClick={add}>
                  Add the first feature
                </button>
              }
            />
          ) : (
            <div className="flex flex-col gap-5">
              {features.items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4"
                  style={{
                    padding: '1.25rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-warm)',
                    borderRadius: 8,
                    opacity: item.enabled ? 1 : 0.6,
                  }}
                >
                  {/* Row header: preview, title, controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                      <span
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 8,
                          background: 'rgba(184,164,122,0.08)',
                          border: '1px solid rgba(184,164,122,0.16)',
                          color: 'var(--gold)',
                        }}
                      >
                        <FeatureIcon name={item.icon} size={18} />
                      </span>

                      <div className="flex flex-col gap-0.5" style={{ minWidth: 0 }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {item.title || <em style={{ color: 'var(--text-dimmed)' }}>Untitled card</em>}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
                          {item.enabled ? 'Visible' : 'Hidden'} · {ICON_LABELS[item.icon]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <AdminIconButton label="Move up" onClick={() => move(index, -1)} disabled={index === 0}>
                        ↑
                      </AdminIconButton>
                      <AdminIconButton
                        label="Move down"
                        onClick={() => move(index, 1)}
                        disabled={index === features.items.length - 1}
                      >
                        ↓
                      </AdminIconButton>
                      <AdminIconButton label="Delete feature" onClick={() => remove(item.id)}>
                        Remove
                      </AdminIconButton>
                    </div>
                  </div>

                  <div className="d3-rule" />

                  <div className="flex flex-col gap-4">
                    <AdminToggle
                      checked={item.enabled}
                      onChange={(v) => setItem(item.id, { enabled: v })}
                      label="Show this card"
                      description="Hidden cards keep their content but do not appear on the website."
                    />

                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                      <AdminField label="Title">
                        <AdminInput
                          value={item.title}
                          onChange={(v) => setItem(item.id, { title: v })}
                          placeholder="Feature title"
                        />
                      </AdminField>

                      <AdminField label="Small label">
                        <AdminInput
                          value={item.eyebrow}
                          onChange={(v) => setItem(item.id, { eyebrow: v })}
                          placeholder="Optional"
                        />
                      </AdminField>

                      <AdminField label="Image path" hint="Optional. A site path or https URL.">
                        <AdminInput
                          value={item.imageUrl}
                          onChange={(v) => setItem(item.id, { imageUrl: v })}
                          placeholder="Leave empty"
                        />
                      </AdminField>
                    </div>

                    <AdminField label="Description">
                      <AdminTextarea
                        value={item.description}
                        onChange={(v) => setItem(item.id, { description: v })}
                        rows={3}
                        placeholder="What this capability does for a restaurant."
                      />
                    </AdminField>

                    <AdminField label="Icon">
                      <div className="flex flex-wrap gap-1.5">
                        {ICON_OPTIONS.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setItem(item.id, { icon: name })}
                            title={ICON_LABELS[name]}
                            aria-label={ICON_LABELS[name]}
                            aria-pressed={item.icon === name}
                            className="flex items-center justify-center"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 6,
                              background: item.icon === name ? 'var(--bg-surface-2)' : 'transparent',
                              border:
                                item.icon === name
                                  ? '1px solid var(--border-medium)'
                                  : '1px solid var(--border-warm)',
                              color: item.icon === name ? 'var(--gold-pale)' : 'var(--text-dimmed)',
                              cursor: 'pointer',
                            }}
                          >
                            <FeatureIcon name={name} size={16} />
                          </button>
                        ))}
                      </div>
                    </AdminField>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>

        <AdminNote>
          Icons come from a fixed monochrome set. Titles, descriptions and figures must describe the
          product truthfully — the panel will not generate placeholder content.
        </AdminNote>
      </div>
    </>
  );
}
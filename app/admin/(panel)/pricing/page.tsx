'use client';

// app/admin/(panel)/pricing/page.tsx
//
// PRICING
//
// Edit subscription plans: name, tagline, price, period, the included feature
// list and the call to action. Plans can be added, deleted, reordered,
// highlighted as recommended and switched off.

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
  AdminIconButton,
  AdminNote,
} from '@/components/admin/ui';
import { createItemId } from '@/lib/siteContent';
import type { Plan } from '@/lib/siteContent';

export default function AdminPricingPage() {
  const { draft, update, loading } = useSiteContent();
  const pricing = draft.pricing;

  const setSection = <K extends keyof typeof pricing>(key: K, value: (typeof pricing)[K]) =>
    update((current) => ({ ...current, pricing: { ...current.pricing, [key]: value } }));

  const setPlan = (id: string, patch: Partial<Plan>) =>
    setSection('plans', pricing.plans.map((plan) => (plan.id === id ? { ...plan, ...patch } : plan)));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= pricing.plans.length) return;

    const next = [...pricing.plans];
    [next[index], next[target]] = [next[target], next[index]];
    setSection('plans', next);
  };

  const addPlan = () =>
    setSection('plans', [
      ...pricing.plans,
      {
        id: createItemId('plan'),
        enabled: true,
        name: '',
        tagline: '',
        price: '',
        period: '',
        features: [''],
        ctaText: '',
        ctaHref: '/signup',
        featured: false,
      },
    ]);

  if (loading) {
    return (
      <>
        <AdminPageHeader eyebrow="PRICING" title="Pricing" />
        <div className="d3-panel p-8" style={{ color: 'var(--text-dimmed)', fontSize: '0.875rem' }}>
          Loading…
        </div>
      </>
    );
  }

  const live = pricing.plans.filter((plan) => plan.enabled && plan.name).length;

  return (
    <>
      <AdminPageHeader
        eyebrow="PRICING"
        title="Pricing"
        description="The plans shown on the public website. Only plans with a name are rendered."
        actions={
          <button type="button" className="d3-btn-quiet" onClick={addPlan}>
            + Add plan
          </button>
        }
      />

      <div className="flex flex-col gap-6">
        <AdminPanel title="Section">
          <div className="flex flex-col gap-4">
            <AdminToggle
              checked={pricing.enabled}
              onChange={(v) => setSection('enabled', v)}
              label="Show the pricing section"
              description="When off, plans are hidden from visitors."
            />
            <div className="d3-rule" />
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <AdminField label="Small label">
                <AdminInput
                  value={pricing.eyebrow}
                  onChange={(v) => setSection('eyebrow', v)}
                  placeholder="PRICING"
                />
              </AdminField>
              <AdminField label="Heading">
                <AdminInput
                  value={pricing.heading}
                  onChange={(v) => setSection('heading', v)}
                  placeholder="Simple,"
                />
              </AdminField>
              <AdminField label="Heading second line">
                <AdminInput
                  value={pricing.headingAccent}
                  onChange={(v) => setSection('headingAccent', v)}
                  placeholder="transparent pricing."
                />
              </AdminField>
            </div>
            <AdminField label="Intro text">
              <AdminTextarea
                value={pricing.body}
                onChange={(v) => setSection('body', v)}
                rows={2}
                placeholder="Optional text above the plans."
              />
            </AdminField>
          </div>
        </AdminPanel>

        <AdminPanel
          title="Plans"
          description={`${live} plan${live === 1 ? '' : 's'} will appear on the website.`}
          aside={
            <button type="button" className="d3-btn-inline" onClick={addPlan}>
              + Add
            </button>
          }
        >
          {pricing.plans.length === 0 ? (
            <AdminEmpty
              title="No plans configured"
              body="Pricing is empty. Add the plans you actually offer, or switch the section off until you are ready."
              action={
                <button type="button" className="d3-btn-quiet" onClick={addPlan}>
                  Add the first plan
                </button>
              }
            />
          ) : (
            <div className="flex flex-col gap-5">
              {pricing.plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className="flex flex-col gap-4"
                  style={{
                    padding: '1.25rem',
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${plan.featured ? 'var(--border-medium)' : 'var(--border-warm)'}`,
                    borderRadius: 8,
                    opacity: plan.enabled ? 1 : 0.6,
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {plan.name || <em style={{ color: 'var(--text-dimmed)' }}>Untitled plan</em>}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
                        {plan.enabled ? 'Visible' : 'Hidden'}
                        {plan.featured ? ' · highlighted' : ''}
                        {plan.price ? ` · ${plan.price}${plan.period}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <AdminIconButton label="Move up" onClick={() => move(index, -1)} disabled={index === 0}>
                        ↑
                      </AdminIconButton>
                      <AdminIconButton
                        label="Move down"
                        onClick={() => move(index, 1)}
                        disabled={index === pricing.plans.length - 1}
                      >
                        ↓
                      </AdminIconButton>
                      <AdminIconButton
                        label="Delete plan"
                        onClick={() =>
                          setSection('plans', pricing.plans.filter((p) => p.id !== plan.id))
                        }
                      >
                        Remove
                      </AdminIconButton>
                    </div>
                  </div>

                  <div className="d3-rule" />

                  <div className="flex flex-col gap-4">
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
                      <AdminToggle
                        checked={plan.enabled}
                        onChange={(v) => setPlan(plan.id, { enabled: v })}
                        label="Show this plan"
                      />
                      <AdminToggle
                        checked={plan.featured}
                        onChange={(v) => setPlan(plan.id, { featured: v })}
                        label="Highlight as recommended"
                        description="Adds the champagne marker. Use it on one plan only."
                      />
                    </div>

                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
                      <AdminField label="Plan name">
                        <AdminInput
                          value={plan.name}
                          onChange={(v) => setPlan(plan.id, { name: v })}
                          placeholder="Pro"
                        />
                      </AdminField>
                      <AdminField label="Tagline">
                        <AdminInput
                          value={plan.tagline}
                          onChange={(v) => setPlan(plan.id, { tagline: v })}
                          placeholder="For growing restaurants"
                        />
                      </AdminField>
                      <AdminField label="Price" hint="Use a word like “Custom” if it varies.">
                        <AdminInput
                          value={plan.price}
                          onChange={(v) => setPlan(plan.id, { price: v })}
                          placeholder="$79"
                        />
                      </AdminField>
                      <AdminField label="Period">
                        <AdminInput
                          value={plan.period}
                          onChange={(v) => setPlan(plan.id, { period: v })}
                          placeholder="/month"
                        />
                      </AdminField>
                    </div>

                    <AdminField label="What's included" hint="One line per row. Empty lines are ignored.">
                      <textarea
                        className="d3-input resize-y"
                        rows={Math.max(3, plan.features.length + 1)}
                        value={plan.features.join('\n')}
                        onChange={(e) =>
                          setPlan(plan.id, {
                            features: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
                          })
                        }
                        placeholder={'Unlimited menu items\nAR experiences\nAdvanced analytics'}
                      />
                    </AdminField>

                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
                      <AdminField label="Button text">
                        <AdminInput
                          value={plan.ctaText}
                          onChange={(v) => setPlan(plan.id, { ctaText: v })}
                          placeholder="Get Started"
                        />
                      </AdminField>
                      <AdminField label="Button destination">
                        <AdminInput
                          value={plan.ctaHref}
                          onChange={(v) => setPlan(plan.id, { ctaHref: v })}
                          placeholder="/signup"
                        />
                      </AdminField>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>

        <AdminNote>
          Enter only real prices and real inclusions. A plan with no name is never rendered, so you
          can stage a new plan before announcing it.
        </AdminNote>
      </div>
    </>
  );
}
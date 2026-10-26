'use client';

import React, { useState } from 'react';
import {
  CustomThemeConfig,
  DEFAULT_CUSTOM_THEME,
  TEMPLATE_PRESETS,
  FONT_OPTIONS,
  BORDER_RADIUS_OPTIONS,
  CARD_STYLE_OPTIONS,
  BUTTON_STYLE_OPTIONS,
  MENU_LAYOUT_OPTIONS,
  HEADER_STYLE_OPTIONS,
} from '@/lib/customTheme';
import CustomTemplate from './templates/CustomTemplate';
import type { PublicMenuItem, PublicHotel, PublicCategory } from '@/app/menu/[slug]/MenuContent';
import type { Hotel } from '@/lib/useHotel';

interface CustomThemeBuilderProps {
  hotel: Hotel;
  initialConfig?: CustomThemeConfig | null;
  onSaved?: (config: CustomThemeConfig) => void;
  editingThemeId?: string;
  initialThemeName?: string;
}

const SAMPLE_PREVIEW_ITEMS: PublicMenuItem[] = [
  {
    id: 'sample-1',
    category_id: 'cat-1',
    name: 'Truffle & Forest Mushroom Risotto',
    description: 'Wild morels, aged Parmigiano-Reggiano, and freshly shaved black winter truffle.',
    price: 34,
    image_url: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80',
    model_url_glb: 'sample',
    model_url_usdz: null,
    is_veg: true,
    calories: 520,
    preparation_time_mins: 22,
    ingredients: ['Arborio Rice', 'Truffle', 'Mushrooms'],
    allergens: ['Dairy'],
    dietary_tags: ['Vegetarian'],
    rating: 4.9,
    order_count: 142,
    is_featured: true,
    is_popular: false,
  },
  {
    id: 'sample-2',
    category_id: 'cat-1',
    name: 'Dry-Aged Wagyu Striploin',
    description: 'Miyazaki A5 beef seared over binchotan charcoal with roasted shallot reduction.',
    price: 68,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    model_url_glb: 'sample',
    model_url_usdz: null,
    is_veg: false,
    calories: 680,
    preparation_time_mins: 25,
    ingredients: ['A5 Wagyu', 'Bone Marrow'],
    allergens: [],
    dietary_tags: ['Chef Signature'],
    rating: 5.0,
    order_count: 210,
    is_featured: true,
    is_popular: true,
  },
  {
    id: 'sample-3',
    category_id: 'cat-2',
    name: 'Crispy Saffron Arancini',
    description: 'Golden arborio spheres filled with smoked scamorza and sun-dried tomato coulis.',
    price: 18,
    image_url: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80',
    model_url_glb: null,
    model_url_usdz: null,
    is_veg: true,
    calories: 340,
    preparation_time_mins: 15,
    ingredients: ['Saffron', 'Rice', 'Scamorza'],
    allergens: ['Dairy'],
    dietary_tags: ['Vegetarian'],
    rating: 4.8,
    order_count: 98,
    is_featured: false,
    is_popular: true,
  },
  {
    id: 'sample-4',
    category_id: 'cat-2',
    name: 'Artisan Matcha Panna Cotta',
    description: 'Ceremonial grade Uji matcha cream topped with passionfruit gelee.',
    price: 16,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    model_url_glb: null,
    model_url_usdz: null,
    is_veg: true,
    calories: 280,
    preparation_time_mins: 10,
    ingredients: ['Matcha', 'Cream', 'Passionfruit'],
    allergens: ['Dairy'],
    dietary_tags: ['Vegetarian'],
    rating: 4.9,
    order_count: 85,
    is_featured: false,
    is_popular: false,
  },
];

const PREVIEW_CATEGORIES: PublicCategory[] = [
  { id: 'cat-1', name: 'Main Courses', position: 1 },
  { id: 'cat-2', name: 'Small Plates & Desserts', position: 2 },
];

export default function CustomThemeBuilder({
  hotel,
  initialConfig,
  onSaved,
  editingThemeId,
  initialThemeName,
}: CustomThemeBuilderProps) {
  const [config, setConfig] = useState<CustomThemeConfig>(
    initialConfig || hotel.custom_theme_config || DEFAULT_CUSTOM_THEME
  );

  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [themeName, setThemeName] = useState(initialThemeName || '');
  const [savingToLibrary, setSavingToLibrary] = useState(false);

  // Update a single configuration field
  const updateConfig = <K extends keyof CustomThemeConfig>(key: K, value: CustomThemeConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Reset to a built-in template's configuration
  const handleResetToTemplate = (templateKey: string) => {
    const preset = TEMPLATE_PRESETS[templateKey];
    if (preset) {
      setConfig({ ...preset.config });
      setResetMessage(`Reset to "${preset.name}" preset!`);
      setTimeout(() => setResetMessage(null), 3000);
    }
  };

  // Save custom theme config to the hotel's active theme slot
  const handleSave = async () => {
    if (!hotel.id) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/hotel/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: hotel.id,
          menu_theme: 'custom',
          custom_theme_config: config,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        if (res.status === 503) {
          throw new Error(
            json.error ||
              'The database is missing the theme columns. Run supabase/migrations/012_theme_columns_idempotent.sql in the Supabase SQL Editor, then save again.'
          );
        }
        throw new Error(json.error || 'Failed to save custom theme configuration');
      }

      setSaveSuccess(true);
      if (onSaved) onSaved(config);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to save custom theme');
    } finally {
      setSaving(false);
    }
  };

  // Save the current design as a NAMED theme in the hotel's library. This does
  // NOT touch the active theme — it just stores a restorable copy. The owner
  // must later Apply it from the Custom Themes page. When editingThemeId is
  // set, this updates the existing saved theme instead of creating a new one.
  const handleSaveToLibrary = async () => {
    if (!hotel.id || !themeName.trim()) return;
    setSavingToLibrary(true);
    setError(null);

    const isEdit = Boolean(editingThemeId);
    try {
      const res = await fetch(
        isEdit
          ? `/api/hotel/themes/${editingThemeId}`
          : '/api/hotel/themes',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotel_id: hotel.id,
            name: themeName.trim(),
            theme_config: config,
            apply_now: false,
          }),
        }
      );
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || isEdit ? 'Failed to update theme' : 'Failed to save theme to library');
      }

      setSaveSuccess(true);
      setShowSaveDialog(false);
      setThemeName('');
      if (onSaved) onSaved(config);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || (isEdit ? 'Failed to update theme' : 'Failed to save theme to library'));
    } finally {
      setSavingToLibrary(false);
    }
  };

  // Mock public hotel data for live preview
  const previewHotel: PublicHotel = {
    id: hotel.id,
    name: hotel.name,
    slug: hotel.slug,
    logo_url: hotel.logo_url,
    currency: hotel.currency || 'USD',
    welcome_text: hotel.welcome_text || 'Bespoke Dining Experience',
    primary_color: config.primaryColor,
    secondary_color: '#10b981',
    menu_style: config.menuLayout,
    card_style: config.cardStyle,
    dark_mode: true,
    typography: config.bodyFont,
    menu_theme: 'custom',
    custom_theme_config: config,
    tax_rate: hotel.tax_rate ?? 5,
    service_charge: hotel.service_charge ?? 10,
    city: hotel.city,
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Notifications */}
      {saveSuccess && (
        <div className="d3-note d3-note-accent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-semibold">
              Custom theme published! Your public menu at /menu/{hotel.slug} is now live with this design.
            </span>
          </div>
        </div>
      )}

      {resetMessage && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
          {resetMessage}
        </div>
      )}

      {error && (
        <div className="d3-note d3-note-danger flex items-center gap-2">
          <span>✕</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Studio Grid: Controls on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= CONTROLS COLUMN (5 Cols) ================= */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Header & Reset Action */}
          <div className="d3-panel p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-white/10">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Theme Studio</h2>
                <p className="text-xs text-neutral-400">Design your bespoke guest menu</p>
              </div>

              {/* Reset to Template Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-[0.65rem] uppercase font-bold text-neutral-400">Reset:</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleResetToTemplate(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="bg-neutral-900 border border-white/20 rounded px-2.5 py-1 text-xs text-[#E5A93C] focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>
                    Choose preset…
                  </option>
                  {Object.entries(TEMPLATE_PRESETS).map(([key, p]) => (
                    <option key={key} value={key} className="bg-neutral-900 text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 1. Page & Card Backgrounds */}
            <div className="space-y-4 mb-6">
              <span className="text-[0.65rem] uppercase font-bold tracking-wider text-[#E5A93C]">
                1. Colors &amp; Palette
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="d3-label mb-1">Page Background</label>
                  <div className="flex items-center gap-2 bg-neutral-900/80 border border-white/15 rounded-lg p-1.5">
                    <input
                      type="color"
                      value={config.pageBg}
                      onChange={(e) => updateConfig('pageBg', e.target.value)}
                      className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.pageBg}
                      onChange={(e) => updateConfig('pageBg', e.target.value)}
                      className="w-full bg-transparent text-xs text-white font-mono uppercase focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="d3-label mb-1">Card Background</label>
                  <div className="flex items-center gap-2 bg-neutral-900/80 border border-white/15 rounded-lg p-1.5">
                    <input
                      type="color"
                      value={config.cardBg}
                      onChange={(e) => updateConfig('cardBg', e.target.value)}
                      className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.cardBg}
                      onChange={(e) => updateConfig('cardBg', e.target.value)}
                      className="w-full bg-transparent text-xs text-white font-mono uppercase focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="d3-label mb-1">Primary / Accent</label>
                  <div className="flex items-center gap-2 bg-neutral-900/80 border border-white/15 rounded-lg p-1.5">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => updateConfig('primaryColor', e.target.value)}
                      className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.primaryColor}
                      onChange={(e) => updateConfig('primaryColor', e.target.value)}
                      className="w-full bg-transparent text-xs text-white font-mono uppercase focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="d3-label mb-1">Text Color</label>
                  <div className="flex items-center gap-2 bg-neutral-900/80 border border-white/15 rounded-lg p-1.5">
                    <input
                      type="color"
                      value={config.textColor}
                      onChange={(e) => updateConfig('textColor', e.target.value)}
                      className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.textColor}
                      onChange={(e) => updateConfig('textColor', e.target.value)}
                      className="w-full bg-transparent text-xs text-white font-mono uppercase focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Typography */}
            <div className="space-y-4 mb-6">
              <span className="text-[0.65rem] uppercase font-bold tracking-wider text-[#E5A93C]">
                2. Typography Fonts
              </span>

              <div className="space-y-3">
                <div>
                  <label className="d3-label mb-1">Heading Font</label>
                  <select
                    value={config.headingFont}
                    onChange={(e) => updateConfig('headingFont', e.target.value)}
                    className="w-full bg-neutral-900 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E5A93C]"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value} className="bg-neutral-900">
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="d3-label mb-1">Body Font</label>
                  <select
                    value={config.bodyFont}
                    onChange={(e) => updateConfig('bodyFont', e.target.value)}
                    className="w-full bg-neutral-900 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E5A93C]"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value} className="bg-neutral-900">
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Border Radius & Card Style */}
            <div className="space-y-4 mb-6">
              <span className="text-[0.65rem] uppercase font-bold tracking-wider text-[#E5A93C]">
                3. Shapes &amp; Surfaces
              </span>

              <div>
                <label className="d3-label mb-1.5">Border Radius</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {BORDER_RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => updateConfig('borderRadius', r.value)}
                      className={`px-2 py-1.5 rounded text-[0.65rem] font-bold transition-all ${
                        config.borderRadius === r.value
                          ? 'bg-[#E5A93C] text-black shadow-sm'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-white/10'
                      }`}
                    >
                      {r.value}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="d3-label mb-1.5">Card Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {CARD_STYLE_OPTIONS.map((cs) => (
                    <button
                      key={cs.value}
                      type="button"
                      onClick={() => updateConfig('cardStyle', cs.value)}
                      className={`p-2.5 rounded-lg text-left transition-all border ${
                        config.cardStyle === cs.value
                          ? 'border-[#E5A93C] bg-[#E5A93C]/10 text-white'
                          : 'border-white/10 bg-neutral-900 hover:bg-neutral-850 text-neutral-300'
                      }`}
                    >
                      <span className="block text-xs font-bold">{cs.label}</span>
                      <span className="block text-[0.6rem] text-neutral-400 mt-0.5">{cs.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="d3-label mb-1.5">Button Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {BUTTON_STYLE_OPTIONS.map((bs) => (
                    <button
                      key={bs.value}
                      type="button"
                      onClick={() => updateConfig('buttonStyle', bs.value)}
                      className={`p-2.5 rounded-lg text-left transition-all border ${
                        config.buttonStyle === bs.value
                          ? 'border-[#E5A93C] bg-[#E5A93C]/10 text-white'
                          : 'border-white/10 bg-neutral-900 hover:bg-neutral-850 text-neutral-300'
                      }`}
                    >
                      <span className="block text-xs font-bold">{bs.label}</span>
                      <span className="block text-[0.6rem] text-neutral-400 mt-0.5">{bs.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Menu Layout & Header Style */}
            <div className="space-y-4 mb-6">
              <span className="text-[0.65rem] uppercase font-bold tracking-wider text-[#E5A93C]">
                4. Layout &amp; Header
              </span>

              <div>
                <label className="d3-label mb-1.5">Menu Layout</label>
                <div className="grid grid-cols-2 gap-2">
                  {MENU_LAYOUT_OPTIONS.map((ml) => (
                    <button
                      key={ml.value}
                      type="button"
                      onClick={() => updateConfig('menuLayout', ml.value)}
                      className={`p-2.5 rounded-lg text-left transition-all border ${
                        config.menuLayout === ml.value
                          ? 'border-[#E5A93C] bg-[#E5A93C]/10 text-white'
                          : 'border-white/10 bg-neutral-900 hover:bg-neutral-850 text-neutral-300'
                      }`}
                    >
                      <span className="block text-xs font-bold">{ml.label}</span>
                      <span className="block text-[0.6rem] text-neutral-400 mt-0.5">{ml.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="d3-label mb-1.5">Header &amp; Navigation Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {HEADER_STYLE_OPTIONS.map((hs) => (
                    <button
                      key={hs.value}
                      type="button"
                      onClick={() => updateConfig('headerStyle', hs.value)}
                      className={`p-2.5 rounded-lg text-left transition-all border ${
                        config.headerStyle === hs.value
                          ? 'border-[#E5A93C] bg-[#E5A93C]/10 text-white'
                          : 'border-white/10 bg-neutral-900 hover:bg-neutral-850 text-neutral-300'
                      }`}
                    >
                      <span className="block text-xs font-bold">{hs.label}</span>
                      <span className="block text-[0.6rem] text-neutral-400 mt-0.5">{hs.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Action */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 px-4 rounded-xl bg-[#E5A93C] hover:bg-[#F0BC5E] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_4px_20px_rgba(229,169,60,0.3)] flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
                      <path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>Saving Custom Theme…</span>
                  </>
                ) : (
                  <span>Save &amp; Publish Custom Theme</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setThemeName('');
                  setShowSaveDialog(true);
                }}
                disabled={saving}
                className="w-full py-2.5 px-4 rounded-xl border border-white/20 hover:border-[#E5A93C] text-neutral-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M7 2V9M4 6H10" strokeLinecap="round" />
                  <rect x="2" y="2" width="10" height="10" rx="2" />
                </svg>
                Save as Named Theme…
              </button>
            </div>
          </div>
        </div>

        {/* ================= LIVE PREVIEW COLUMN (7 Cols) ================= */}
        <div className="lg:col-span-7 flex flex-col gap-4 sticky top-6">
          {/* Top Bar with Mobile / Desktop Toggle */}
          <div className="flex items-center justify-between bg-neutral-900/90 border border-white/10 px-4 py-2.5 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Real-Time Live Preview
              </span>
            </div>

            {/* Mobile / Desktop View Mode Segment */}
            <div className="flex items-center bg-black/60 p-1 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  previewDevice === 'mobile'
                    ? 'bg-[#E5A93C] text-black shadow-sm font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>📱</span>
                <span>Mobile</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  previewDevice === 'desktop'
                    ? 'bg-[#E5A93C] text-black shadow-sm font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>💻</span>
                <span>Desktop</span>
              </button>
            </div>
          </div>

          {/* Interactive Preview Container */}
          <div className="w-full flex justify-center bg-neutral-950/80 border border-white/10 rounded-2xl p-4 sm:p-6 min-h-[640px] max-h-[820px] overflow-hidden">
            {previewDevice === 'mobile' ? (
              /* SMARTPHONE FRAME */
              <div className="w-[380px] max-w-full h-[760px] rounded-[40px] border-4 border-neutral-700 bg-neutral-950 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative">
                {/* Speaker notch */}
                <div className="w-full h-6 bg-neutral-900 flex items-center justify-center relative flex-shrink-0 z-40 border-b border-white/5">
                  <div className="w-16 h-3 bg-black rounded-full" />
                </div>

                {/* Inner Phone Viewport with scroll */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <CustomTemplate
                    hotel={previewHotel}
                    customConfig={config}
                    currency={hotel.currency || '$'}
                    tableNumber="4"
                    categories={PREVIEW_CATEGORIES}
                    pills={['All', 'Mains', 'Desserts']}
                    selectedCategory="All"
                    onSelectCategory={() => {}}
                    search=""
                    onSearchChange={() => {}}
                    filteredItems={SAMPLE_PREVIEW_ITEMS}
                    featuredItems={SAMPLE_PREVIEW_ITEMS.filter((i) => i.is_featured)}
                    popularItems={SAMPLE_PREVIEW_ITEMS.filter((i) => i.is_popular && !i.is_featured)}
                    regularItems={SAMPLE_PREVIEW_ITEMS.filter((i) => !i.is_featured && !i.is_popular)}
                    cart={[{ menuItem: SAMPLE_PREVIEW_ITEMS[0], quantity: 1 }]}
                    totalCount={1}
                    totalPrice={SAMPLE_PREVIEW_ITEMS[0].price}
                    onAdd={() => {}}
                    onRemove={() => {}}
                    onItemClick={() => {}}
                    onView3D={() => {}}
                    onOpenCart={() => {}}
                  />
                </div>

                {/* Bottom home bar */}
                <div className="w-full h-4 bg-neutral-900 flex items-center justify-center flex-shrink-0">
                  <div className="w-24 h-1 bg-neutral-600 rounded-full" />
                </div>
              </div>
            ) : (
              /* WIDESCREEN DESKTOP BROWSER FRAME */
              <div className="w-full h-[760px] rounded-xl border border-white/15 bg-neutral-950 shadow-2xl overflow-hidden flex flex-col">
                {/* Browser address bar mockup */}
                <div className="px-4 py-2 bg-neutral-900 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex-1 max-w-sm mx-auto bg-black/40 rounded px-3 py-0.5 text-[0.65rem] font-mono text-neutral-400 text-center truncate">
                    https://dine3d.app/menu/{hotel.slug}
                  </div>
                </div>

                {/* Inner Desktop Viewport */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <CustomTemplate
                    hotel={previewHotel}
                    customConfig={config}
                    currency={hotel.currency || '$'}
                    tableNumber="4"
                    categories={PREVIEW_CATEGORIES}
                    pills={['All', 'Mains', 'Desserts']}
                    selectedCategory="All"
                    onSelectCategory={() => {}}
                    search=""
                    onSearchChange={() => {}}
                    filteredItems={SAMPLE_PREVIEW_ITEMS}
                    featuredItems={SAMPLE_PREVIEW_ITEMS.filter((i) => i.is_featured)}
                    popularItems={SAMPLE_PREVIEW_ITEMS.filter((i) => i.is_popular && !i.is_featured)}
                    regularItems={SAMPLE_PREVIEW_ITEMS.filter((i) => !i.is_featured && !i.is_popular)}
                    cart={[{ menuItem: SAMPLE_PREVIEW_ITEMS[0], quantity: 1 }]}
                    totalCount={1}
                    totalPrice={SAMPLE_PREVIEW_ITEMS[0].price}
                    onAdd={() => {}}
                    onRemove={() => {}}
                    onItemClick={() => {}}
                    onView3D={() => {}}
                    onOpenCart={() => {}}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save as Named Theme dialog */}
      {showSaveDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => {
            if (!savingToLibrary) setShowSaveDialog(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/15 bg-neutral-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-base font-bold text-white tracking-tight">Save as Named Theme</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Stored in your theme library. This does not change your active menu — apply it later from Custom Themes.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Live mini preview */}
              <div
                className="rounded-xl p-4 flex items-center gap-4"
                style={{
                  background: config.pageBg,
                  color: config.textColor,
                  fontFamily: config.bodyFont,
                  borderRadius: config.borderRadius,
                  border: config.cardStyle === 'bordered' ? `1px solid ${config.primaryColor}` : 'none',
                }}
              >
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0"
                  style={{ background: config.primaryColor, color: '#fff' }}
                >
                  D
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">Dish preview</p>
                  <p className="text-xs opacity-70 truncate">
                    {config.menuLayout} · {config.cardStyle} · {config.headingFont}
                  </p>
                </div>
                <div
                  className="ml-auto px-3 py-1 rounded-full text-xs font-bold flex-shrink-0"
                  style={{ background: config.primaryColor, color: '#fff' }}
                >
                  ${12}
                </div>
              </div>

              <div>
                <label className="d3-label mb-1.5">Theme name</label>
                <input
                  type="text"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  placeholder="e.g. Summer Garden, Monochrome Gold…"
                  maxLength={80}
                  autoFocus
                  className="w-full bg-neutral-950 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E5A93C]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveToLibrary();
                    if (e.key === 'Escape') setShowSaveDialog(false);
                  }}
                />
              </div>

              {error && (
                <div className="d3-note d3-note-danger text-xs">
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!savingToLibrary) setShowSaveDialog(false);
                }}
                disabled={savingToLibrary}
                className="px-4 py-2 rounded-lg border border-white/20 text-neutral-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveToLibrary}
                disabled={savingToLibrary || !themeName.trim()}
                className="px-4 py-2 rounded-lg bg-[#E5A93C] hover:bg-[#F0BC5E] text-black text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {savingToLibrary ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
                      <path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>Saving…</span>
                  </>
                ) : (
                  <span>Save to Library</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

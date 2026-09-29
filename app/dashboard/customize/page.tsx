'use client';

import React, { useState } from 'react';
import { useHotel, useHotelCustomization } from '@/lib/useHotel';

export default function CustomizeMenuPage() {
  const { hotel, loading: hotelLoading } = useHotel();
  const { customization, loading: customizationLoading, saveCustomization, setCustomization } = useHotelCustomization(hotel?.id || null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const hotelSlug = hotel?.slug || '';
  const menuHref = hotelSlug ? `/menu/${hotelSlug}` : '/dashboard/settings';
  const hotelName = hotel?.name || 'Your Restaurant';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCustomization(customization);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (hotelLoading || customizationLoading) {
    return <p className="text-sm text-gray-400">Loading customization settings…</p>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Menu Design & Theme Customizer</h1>
          <p className="text-gray-400 text-sm">
            Customize the look and feel of your customer-facing digital 3D menu in real time.
          </p>
        </div>
        <a
          href={menuHref}
          target="_blank"
          className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-amber-400 font-bold text-xs border border-amber-500/30 flex items-center space-x-2"
        >
          <span>👁 Preview Customer Menu</span>
          <span>↗</span>
        </a>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold">
          ✓ Menu Design saved! Open /menu/{hotelSlug} to see live changes.
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-7 bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-3">
            Visual & Layout Settings
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Primary Accent Color
              </label>
              <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded-xl border border-gray-700">
                <input
                  type="color"
                  value={customization.primary_color}
                  onChange={(e) => setCustomization({ ...customization, primary_color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                />
                <span className="text-xs font-mono text-gray-300">{customization.primary_color}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Secondary Accent Color
              </label>
              <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded-xl border border-gray-700">
                <input
                  type="color"
                  value={customization.secondary_color}
                  onChange={(e) => setCustomization({ ...customization, secondary_color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                />
                <span className="text-xs font-mono text-gray-300">{customization.secondary_color}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
              Menu Layout Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cards', label: '🎴 3D Cards' },
                { id: 'grid', label: '🔳 Grid View' },
                { id: 'list', label: '☰ Compact List' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCustomization({ ...customization, menu_style: item.id as any })}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                    customization.menu_style === item.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
              Card Visual Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'glassmorphic', label: '✨ Glassmorphism' },
                { id: 'minimal', label: '☁ Minimal' },
                { id: 'bordered', label: '🔲 Bordered' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCustomization({ ...customization, card_style: item.id as any })}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                    customization.card_style === item.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Typography
              </label>
              <select
                value={customization.typography}
                onChange={(e) => setCustomization({ ...customization, typography: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs"
              >
                <option value="Inter">Modern (Inter)</option>
                <option value="Outfit">Trendy (Outfit)</option>
                <option value="Playfair Display">Elegant Serif (Playfair)</option>
                <option value="Roboto">Clean (Roboto)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Base Theme Mode
              </label>
              <button
                type="button"
                onClick={() => setCustomization({ ...customization, dark_mode: !customization.dark_mode })}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs font-bold flex items-center justify-between"
              >
                <span>{customization.dark_mode ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
                <span className="text-[10px] text-amber-400">Toggle</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
              Welcome Banner Text
            </label>
            <input
              type="text"
              value={customization.welcome_banner}
              onChange={(e) => setCustomization({ ...customization, welcome_banner: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-sm shadow-xl shadow-amber-500/20"
          >
            Save & Publish Theme Customization
          </button>
        </div>

        {/* Live Customer Card Preview */}
        <div className="lg:col-span-5 bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white border-b border-gray-800 pb-3">
              Live Phone Preview
            </h3>

            <div
              className={`mt-4 p-4 rounded-2xl border space-y-3 transition ${
                customization.dark_mode
                  ? 'bg-gray-950 text-white border-gray-800'
                  : 'bg-gray-100 text-gray-900 border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-black text-xs"
                  style={{ backgroundColor: customization.primary_color }}
                >
                  3D
                </div>
                <div>
                  <p className="font-bold text-xs">{hotelName}</p>
                  <p className="text-[10px] opacity-70">Table #1</p>
                </div>
              </div>

              <div
                className="p-3 rounded-xl text-xs text-white"
                style={{ backgroundColor: customization.primary_color }}
              >
                <p className="font-semibold">{customization.welcome_banner}</p>
              </div>

              {/* Sample Card */}
              <div
                className={`p-3 rounded-xl border space-y-2 ${
                  customization.card_style === 'glassmorphic'
                    ? 'bg-gray-900/60 backdrop-blur border-gray-700'
                    : customization.card_style === 'minimal'
                    ? 'bg-gray-900 border-none shadow'
                    : 'bg-gray-900 border-amber-500/40'
                }`}
              >
                <div className="h-28 bg-gray-800 rounded-lg flex items-center justify-center text-3xl">
                  🍔
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Signature Dish</span>
                  <span style={{ color: customization.primary_color }} className="font-extrabold">
                    $22.50
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-gray-400">
              Style: <strong>{customization.menu_style}</strong> • Font: <strong>{customization.typography}</strong>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

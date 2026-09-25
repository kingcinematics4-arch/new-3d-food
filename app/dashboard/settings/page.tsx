'use client';

import React, { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    hotel_id: 'demo-hotel-1',
    name: 'Grand Bistro & Lounge',
    owner_name: 'Alex Morgan',
    email: 'owner@grandbistro.com',
    phone: '+1 (555) 234-5678',
    city: 'New York',
    address: '123 Culinary Blvd, Suite 100',
    logo_url: '',
    primary_color: '#f59e0b',
    welcome_text: 'Experience our delicious menu in interactive 3D!',
    custom_domain: '',
    currency: 'USD ($)',
    tax_rate: 8.875,
    service_charge: 5.0,
  });

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHotelProfile();
  }, []);

  const fetchHotelProfile = async () => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session?.user) {
        const { data } = await supabaseClient
          .from('hotel_users')
          .select('hotel_id, hotel:hotels(*)')
          .eq('user_id', session.user.id)
          .single();

        if (data?.hotel) {
          const rawHotel = data.hotel as unknown;
          const h = (Array.isArray(rawHotel) ? rawHotel[0] : rawHotel) as Record<string, any> | undefined;
          if (h) {
            setFormData((prev) => ({
              ...prev,
              hotel_id: h.id || prev.hotel_id,
              name: h.name || prev.name,
              owner_name: h.owner_name || prev.owner_name,
              email: h.email || prev.email,
              phone: h.phone || prev.phone,
              city: h.city || prev.city,
              address: h.address || prev.address,
              custom_domain: h.custom_domain || '',
            }));
          }
        }
      }
    } catch (e) {
      console.warn('Profile fetch error, using default settings state:', e);
    }
  };

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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Restaurant Settings & Custom Branding</h1>
        <p className="text-gray-400 text-sm">
          Manage your restaurant profile, custom domain setup, branding accent colors, and tax rules.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
          ✓ Restaurant profile & branding settings updated successfully!
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Hotel Profile */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-3 flex items-center space-x-2">
            <span>🏨</span>
            <span>Restaurant Profile Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Owner / Manager Name
              </label>
              <input
                type="text"
                required
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Street Address
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                City
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Custom Branding & Theme Accent */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-3 flex items-center space-x-2">
            <span>🎨</span>
            <span>Custom Branding & Theme Styling</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Theme Accent Color
              </label>
              <div className="flex items-center space-x-3 bg-gray-800 p-2 rounded-xl border border-gray-700">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-gray-300">{formData.primary_color}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Logo Image URL (Optional)
              </label>
              <input
                type="text"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://domain.com/logo.png"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
              Customer Welcome Banner Text
            </label>
            <input
              type="text"
              value={formData.welcome_text}
              onChange={(e) => setFormData({ ...formData, welcome_text: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 3: Custom Domain Setup Placeholder */}
        <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-3 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span>🌐</span>
              <span>Custom Domain Setup (Vercel Integration)</span>
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
              Ready for Domain Connection
            </span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Current Vercel Deployment URL
              </label>
              <input
                type="text"
                disabled
                value={`https://dish3d.vercel.app/menu/${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700 text-amber-300 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Custom Domain (Connect when purchased)
              </label>
              <input
                type="text"
                value={formData.custom_domain}
                onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                placeholder="e.g. menu.grandbistro.com or grandbistro-menu.com"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* DNS Instructions Box */}
            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-2 text-xs text-gray-400">
              <p className="font-bold text-amber-400 uppercase text-[11px] tracking-wider">
                💡 DNS CNAME Configuration Instructions (When domain is purchased):
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Type: <strong className="text-white">CNAME</strong></li>
                <li>Host: <strong className="text-white">menu</strong> (or <strong className="text-white">@</strong> for root domain)</li>
                <li>Value / Points To: <strong className="text-white font-mono">cname.vercel-dns.com</strong></li>
              </ul>
              <p className="text-[11px] text-gray-500 pt-1">
                Note: You can add your domain here anytime later without affecting current development.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Taxes & Currency */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-3 flex items-center space-x-2">
            <span>💵</span>
            <span>Taxes & Service Charge Rules</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Currency
              </label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Sales Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Service Charge (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.service_charge}
                onChange={(e) => setFormData({ ...formData, service_charge: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-sm shadow-xl shadow-amber-500/20 transition transform active:scale-98 disabled:opacity-50"
        >
          {loading ? 'Saving Changes...' : 'Save Restaurant Settings & Branding'}
        </button>
      </form>
    </div>
  );
}

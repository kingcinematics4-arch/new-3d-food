'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useHotel } from '@/lib/useHotel';

export default function QRBuilderPage() {
  const { hotel, loading: hotelLoading } = useHotel();
  const [tableNumber, setTableNumber] = useState('1');
  const [hotelSlug, setHotelSlug] = useState('');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [templateStyle, setTemplateStyle] = useState<'classic' | 'dark_gold' | 'minimal'>('dark_gold');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [batchCount, setBatchCount] = useState<number>(10);
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
  }, [tableNumber, fgColor, bgColor, hotelSlug]);

  const generateQrCode = async () => {
    if (!hotelSlug || !menuUrl) return;
    try {
      const url = await QRCode.toDataURL(menuUrl, {
        width: 360,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  const handleGenerateBatch = async () => {
    const list = [];
    for (let i = 1; i <= batchCount; i++) {
      const tNum = `${i}`;
      const url = `${origin}/menu/${hotelSlug}?table=${tNum}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    alert(`Table Menu Link copied: ${menuUrl}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>QR Code Builder & Table Standee Studio</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Generate custom branded QR codes and printable table standees pointing directly to your digital 3D menu.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-5 bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-3">
            QR Customization Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Table Number / Name
              </label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. 5, Patio 2, VIP"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                  Foreground Color
                </label>
                <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded-xl border border-gray-700">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-gray-300">{fgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                  Background Color
                </label>
                <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded-xl border border-gray-700">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-gray-300">{bgColor}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Table Standee Frame Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dark_gold', label: 'Dark Gold' },
                  { id: 'classic', label: 'Classic Light' },
                  { id: 'minimal', label: 'Minimal Black' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setTemplateStyle(s.id as any)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      templateStyle === s.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleDownload}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition"
              >
                📥 Download High-Res PNG
              </button>
              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-200 font-semibold text-xs border border-gray-700 transition"
              >
                🔗 Copy Table Menu Link ({menuUrl})
              </button>
            </div>
          </div>

          {/* Batch Generator Section */}
          <div className="pt-4 border-t border-gray-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Batch QR Generator</h3>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={1}
                max={50}
                value={batchCount}
                onChange={(e) => setBatchCount(parseInt(e.target.value) || 10)}
                className="w-24 px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs"
              />
              <button
                onClick={handleGenerateBatch}
                className="flex-1 py-2 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-amber-400 font-bold text-xs border border-amber-500/30"
              >
                ⚡ Batch Create (1 to {batchCount})
              </button>
            </div>
          </div>
        </div>

        {/* Live Standee Preview */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
          <p className="text-xs uppercase font-semibold text-gray-400 mb-4 tracking-wider">
            Printable Tabletop Standee Preview
          </p>

          {/* Standee Frame Render */}
          <div
            className={`w-72 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center space-y-4 border transition ${
              templateStyle === 'dark_gold'
                ? 'bg-gradient-to-b from-gray-950 via-slate-900 to-amber-950/60 border-amber-500/40 text-white'
                : templateStyle === 'classic'
                ? 'bg-white text-gray-900 border-gray-300'
                : 'bg-black text-white border-gray-800'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-black font-extrabold text-lg shadow-lg">
              3D
            </div>

            <div>
              <h3 className="font-extrabold text-lg tracking-tight">SCAN TO VIEW 3D MENU</h3>
              <p className="text-[11px] opacity-75 mt-0.5">Experience interactive dishes in 360°</p>
            </div>

            {/* QR Image */}
            {qrDataUrl && (
               <a href={`${menuUrl}`} target="_blank" className="p-3 bg-white rounded-2xl shadow-md border group relative">
                <img src={qrDataUrl} alt="QR Code" className="w-44 h-44 object-contain" />
                <span className="absolute inset-0 bg-black/60 rounded-2xl text-amber-300 text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  Test Menu Link ↗
                </span>
              </a>
            )}

            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500 text-black font-extrabold text-sm shadow-md">
                TABLE #{tableNumber}
              </span>
              <p className="text-[10px] opacity-60 mt-2">No App Required • Scan with Phone Camera</p>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Results Grid */}
      {batchQrs.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-lg font-bold text-white">Batch Generated Table QRs ({batchQrs.length})</h3>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs shadow-md"
            >
              🖨 Print Batch Grid
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {batchQrs.map((item) => (
              <div key={item.table} className="bg-gray-800/80 p-3 rounded-xl border border-gray-700 text-center space-y-2">
                <img src={item.qrDataUrl} alt={`Table ${item.table}`} className="w-28 h-28 mx-auto object-contain rounded-lg bg-white p-1" />
                <p className="font-bold text-xs text-amber-400">Table #{item.table}</p>
                <a
                  href={item.qrDataUrl}
                  download={`Table_${item.table}.png`}
                  className="inline-block text-[10px] text-gray-300 hover:text-white underline"
                >
                  Download PNG
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

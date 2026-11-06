'use client';

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";

import DinePixelLuxuryHotelCard from "@/components/DinePixelLuxuryHotelCard";

type HotelRow = {
  id: string;
  name: string;
  slug?: string | null;
  logo_url?: string | null;
  city?: string | null;
  owner_name?: string | null;
  email?: string | null;
  phone?: string | null;
  is_active?: boolean;
  created_at?: string | null;
  hotel_public_id?: string | null;
  subscription_plan?: string | null;
};

export default function HotelsPage() {
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<HotelRow[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadHotels() {
    setLoadError(null);
    const r = await fetch("/api/dashboard-admin/hotels", { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.success) throw new Error(j.error || "Failed to load hotels");
    setHotels(Array.isArray(j.hotels) ? j.hotels : []);
    setCanManage(!!j.canManage);
  }

  useEffect(() => {
    (async () => {
      try {
        await loadHotels();
      } catch (e: any) {
        setLoadError(e.message || "Failed to load hotels");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function setActive(id: string, is_active: boolean) {
    setBusyId(id);
    setLoadError(null);
    try {
      const r = await fetch(`/api/dashboard-admin/hotels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) throw new Error(j.error || "Update failed");
      setHotels((hs) => hs.map((h) => (h.id === id ? { ...h, is_active } : h)));
    } catch (e: any) {
      setLoadError(e.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading{"\u2026"}</p>;

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22, width: "100%" }}>
      <header>
        <span className="d3-eyebrow" style={{ fontSize: "0.5625rem" }}>Registered</span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem,3vw,2.3rem)", fontWeight: 500, color: "var(--text-primary)", margin: "0.45rem 0 0", letterSpacing: "-0.025em" }}>Hotels</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.35rem", maxWidth: 640, lineHeight: 1.55 }}>Registered hotels as premium identity cards with permanent IDs, plans, and actions.</p>
      </header>
      {loadError ? <div className="d3-note" style={{ borderColor: "rgba(196,102,88,0.25)", color: "#D9A79E" }}>{loadError}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 720px))", gap: 16, alignItems: "start", justifyContent: "start" }}>
        {hotels.map((h) => {
          const active = h.is_active !== false;
          return (
            <DinePixelLuxuryHotelCard
              key={h.id}
              hotel={h}
              canManage={canManage}
              isBusy={busyId === h.id}
              onViewMenu={() => {
                if (h.slug) window.open(`/menu/${h.slug}`, "_blank", "noopener");
              }}
              onSetActive={(next) => setActive(h.id, next)}
            />
          );
        })}
        {hotels.length === 0 ? <div className="d3-panel" style={{ padding: "1.5rem", color: "var(--text-muted)", borderRadius: 14 }}>No hotels found for this account.</div> : null}
      </div>
    </div>
  );
}

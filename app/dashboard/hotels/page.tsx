'use client';

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";

type Plan = "BASIC" | "PRO" | "ULTRA" | "CUSTOM";
type HotelRow = {
  id: string; name: string; slug?: string | null; logo_url?: string | null; city?: string | null;
  owner_name?: string | null; email?: string | null; phone?: string | null; is_active?: boolean;
  created_at?: string | null; hotel_public_id?: string | null; subscription_plan?: string | null;
};

const PLANS: Plan[] = ["BASIC", "PRO", "ULTRA", "CUSTOM"];
const normPlan = (v?: string | null): Plan => {
  const p = (v || "").trim().toUpperCase();
  if (p === "STARTER" || p === "BASIC" || !p) return "BASIC";
  return (PLANS as string[]).includes(p) ? (p as Plan) : "BASIC";
};
const planLabel = (p: Plan) => (p === "BASIC" ? "Basic" : p === "PRO" ? "Pro" : p === "ULTRA" ? "Ultra" : "Custom");
const planTone = (p: Plan) => {
  const m: Record<Plan, { fg: string; bd: string; bg: string }> = {
    BASIC: { fg: "#D8D4CC", bd: "rgba(216,212,204,0.22)", bg: "rgba(216,212,204,0.07)" },
    PRO: { fg: "#E6C98A", bd: "rgba(201,169,110,0.38)", bg: "rgba(201,169,110,0.12)" },
    ULTRA: { fg: "#DCCFFF", bd: "rgba(186,160,255,0.34)", bg: "rgba(186,160,255,0.1)" },
    CUSTOM: { fg: "#B8ECE5", bd: "rgba(174,230,222,0.3)", bg: "rgba(174,230,222,0.09)" },
  };
  return m[p];
};

function fmtDate(s?: string | null) {
  if (!s) return "\u2014";
  try { return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); } catch { return "\u2014"; }
}

function Badge({ children, tone }: { children: React.ReactNode; tone: { fg: string; bd: string; bg: string } }) {
  return <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.11em", textTransform: "uppercase", padding: "3px 7px", borderRadius: 999, border: `1px solid ${tone.bd}`, color: tone.fg, background: tone.bg, lineHeight: 1, whiteSpace: "nowrap" }}>{children}</span>;
}

const Field = ({ icon, label, value, gold, mono }: { icon: React.ReactNode; label: string; value: React.ReactNode; gold?: boolean; mono?: boolean }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(243,239,231,0.42)", marginBottom: 2 }}>
      <span style={{ display: "inline-flex", opacity: 0.85 }}>{icon}</span>
      <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" }}>{label}</span>
    </div>
    <div title={typeof value === "string" ? value : undefined} style={{ fontSize: 12, fontWeight: gold ? 650 : 520, color: gold ? "#E2C57A" : "rgba(243,239,231,0.88)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined, letterSpacing: mono ? "0.02em" : undefined, textShadow: gold ? "0 0 18px rgba(201,169,110,0.18)" : undefined }}>{value || "\u2014"}</div>
  </div>
);

const I = {
  id: <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="4" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7.2h3M5 9.4h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  user: <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.6" r="2.1" stroke="currentColor" strokeWidth="1.3"/><path d="M3.8 12.8c.5-1.9 2.1-3 4.2-3s3.7 1.1 4.2 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  mail: <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="4" width="11" height="8" rx="1.4" stroke="currentColor" strokeWidth="1.3"/><path d="M3.2 5.2 8 8.4l4.8-3.2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  cal: <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="3" y="4" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 2.8V5M10 2.8V5M3.3 7h9.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  plan: <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2.8 9.4 5.6l3.1.5-2.2 2.1.5 3.1L8 9.8l-2.8 1.5.5-3.1-2.2-2.1 3.1-.5L8 2.8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
};

function Deco() {
  return (
    <svg aria-hidden viewBox="0 0 520 260" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      <defs>
        <linearGradient id="dg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D4B36A" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#8E7342" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="dg2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0DFC0" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#C9A96E" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M-20 260 L180 -20 L260 -20 L60 260 Z" fill="url(#dg1)" />
      <path d="M220 -20 L310 -20 L520 150 L520 230 Z" fill="url(#dg2)" />
      <path d="M-20 170 L80 260 L40 260 L-20 200 Z" fill="#C9A96E" fillOpacity="0.08" />
      <path d="M350 260 L520 120 L520 160 L390 260 Z" fill="#C9A96E" fillOpacity="0.06" />
      <path d="M120 260 L170 200 L188 200 L138 260 Z" fill="#E6C98A" fillOpacity="0.05" />
      <g stroke="#C9A96E" strokeOpacity="0.09" strokeWidth="1">
        <line x1="170" y1="0" x2="0" y2="170" />
        <line x1="210" y1="0" x2="40" y2="170" />
        <line x1="330" y1="0" x2="520" y2="190" />
        <line x1="370" y1="0" x2="520" y2="150" />
      </g>
      <circle cx="430" cy="52" r="38" stroke="#C9A96E" strokeOpacity="0.07" strokeWidth="1" fill="none" />
      <circle cx="430" cy="52" r="24" stroke="#C9A96E" strokeOpacity="0.05" strokeWidth="1" fill="none" />
    </svg>
  );
}

export default function HotelsPage() {
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<HotelRow[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

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
      try { await loadHotels(); } catch (e: any) { setLoadError(e.message || "Failed to load hotels"); } finally { setLoading(false); }
    })();
  }, []);

  async function setActive(id: string, is_active: boolean) {
    setBusyId(id); setLoadError(null);
    try {
      const r = await fetch(`/api/dashboard-admin/hotels/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) throw new Error(j.error || "Update failed");
      setHotels((hs) => hs.map((h) => (h.id === id ? { ...h, is_active } : h)));
    } catch (e: any) { setLoadError(e.message || "Update failed"); } finally { setBusyId(null); }
  }

  if (loading) return <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading{"\u2026"}</p>;

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22, width: "100%" }}>
      <header>
        <span className="d3-eyebrow" style={{ fontSize: "0.5625rem" }}>Registered</span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem,3vw,2.3rem)", fontWeight: 500, color: "var(--text-primary)", margin: "0.45rem 0 0", letterSpacing: "-0.025em" }}>Hotels</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.35rem", maxWidth: 640, lineHeight: 1.55 }}>Registered hotels as premium business cards with permanent IDs, plans, and actions.</p>
      </header>
      {loadError ? <div className="d3-note" style={{ borderColor: "rgba(196,102,88,0.25)", color: "#D9A79E" }}>{loadError}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 720px))", gap: 16, alignItems: "start", justifyContent: "start" }}>
        {hotels.map((h) => {
          const active = h.is_active !== false;
          const plan = normPlan(h.subscription_plan);
          const isHovered = hovered === h.id;
          const initial = (h.name || "H").trim().slice(0, 1).toUpperCase() || "H";
          const statusTone = active ? { fg: "#CFE6D7", bd: "rgba(120,180,140,0.28)", bg: "rgba(70,120,86,0.18)" } : { fg: "#E8D0CB", bd: "rgba(196,140,130,0.26)", bg: "rgba(120,70,64,0.18)" };
          return (
            <article
              key={h.id}
              className="hotel-biz-card"
              onMouseEnter={() => setHovered(h.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                width: "100%",
                maxWidth: 720,
                borderRadius: 16,
                overflow: "hidden",
                border: `1px solid ${isHovered ? "rgba(201,169,110,0.34)" : "rgba(201,169,110,0.14)"}`,
                background: "linear-gradient(135deg, #151515 0%, #0f0f0f 48%, #131210 100%)",
                boxShadow: isHovered ? "0 22px 50px rgba(0,0,0,0.46), 0 0 0 1px rgba(201,169,110,0.06) inset" : "0 10px 28px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.02) inset",
                transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                transition: "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
              }}
            >
              <Deco />
              <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(201,169,110,0.05) 0%, rgba(201,169,110,0) 28%, rgba(201,169,110,0) 72%, rgba(201,169,110,0.04) 100%)", pointerEvents: "none" }} />

              <div className="hotel-biz-body" style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0, 0.94fr) minmax(0, 1.06fr)", gap: 0, flex: 1, minHeight: 0 }}>
                <div className="hotel-biz-left" style={{ padding: "14px 14px 12px", display: "flex", flexDirection: "column", minWidth: 0, borderRight: "1px solid rgba(201,169,110,0.1)", background: "linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0))" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, overflow: "hidden", border: "1px solid rgba(201,169,110,0.28)", background: "linear-gradient(160deg, rgba(201,169,110,0.16), rgba(255,255,255,0.02) 55%, rgba(0,0,0,0.35))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 22px rgba(0,0,0,0.28)" }}>
                      {h.logo_url ? <img src={h.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#E6C98A", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>{initial}</span>}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(201,169,110,0.72)", marginBottom: 3 }}>DinePixel Hotel</div>
                      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "rgba(248,244,236,0.96)", letterSpacing: "-0.02em", lineHeight: 1.12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={h.name || ""}>{h.name || "Unnamed hotel"}</h2>
                      <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "rgba(243,239,231,0.52)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.city || "Location not set"}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    <Badge tone={statusTone}>{active ? "Active" : "Inactive"}</Badge>
                    <Badge tone={planTone(plan)}>{planLabel(plan)}</Badge>
                  </div>
                  <div style={{ marginTop: "auto", paddingTop: 10, fontSize: 8.5, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(201,169,110,0.32)" }}>Hotel Identity Card</div>
                </div>

                <div style={{ padding: "14px 14px 10px", display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "10px 12px", alignContent: "start" }}>
                    <Field icon={I.id} label="Hotel ID" value={h.hotel_public_id || "Pending migration"} gold mono />
                    <Field icon={I.plan} label="Plan" value={planLabel(plan)} />
                    <Field icon={I.user} label="Owner" value={h.owner_name || "\u2014"} />
                    <Field icon={I.cal} label="Registered" value={fmtDate(h.created_at)} />
                    <div style={{ gridColumn: "1 / -1" }}>
                      <Field icon={I.mail} label="Contact Email" value={h.email || h.phone || "\u2014"} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px 10px", borderTop: "1px solid rgba(201,169,110,0.12)", background: "linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.22))" }}>
                {h.slug ? (
                  <a href={`/menu/${h.slug}`} target="_blank" rel="noopener noreferrer" className="d3-btn-subtle" style={{ minHeight: 32, padding: "0 13px", borderRadius: 10, fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>View Menu</a>
                ) : (
                  <span className="d3-btn-subtle" aria-disabled="true" style={{ minHeight: 32, padding: "0 13px", borderRadius: 10, fontSize: 12, opacity: 0.42, pointerEvents: "none", display: "inline-flex", alignItems: "center", flex: "0 0 auto" }}>No Menu</span>
                )}
                {canManage ? (
                  <button type="button" className={active ? "d3-btn-ghost" : "d3-btn-subtle"} disabled={busyId === h.id} onClick={() => setActive(h.id, !active)} style={{ minHeight: 32, padding: "0 13px", borderRadius: 10, fontSize: 12, fontWeight: 600, flex: "0 0 auto" }}>
                    {busyId === h.id ? "Saving\u2026" : active ? "Set Inactive" : "Set Active"}
                  </button>
                ) : null}
                <span style={{ marginLeft: "auto", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(201,169,110,0.28)" }}>DinePixel</span>
              </div>
            </article>
          );
        })}
        {hotels.length === 0 ? <div className="d3-panel" style={{ padding: "1.5rem", color: "var(--text-muted)", borderRadius: 14 }}>No hotels found for this account.</div> : null}
      </div>
      <style jsx global>{`
        @media (min-width: 641px) {
          .hotel-biz-card { aspect-ratio: 1.8 / 1; max-width: 720px; }
        }
        @media (max-width: 640px) {
          .hotel-biz-card { aspect-ratio: auto; max-width: 100%; }
          .hotel-biz-body { grid-template-columns: 1fr !important; }
          .hotel-biz-left { border-right: 0 !important; border-bottom: 1px solid rgba(201,169,110,0.1) !important; }
        }
      `}</style>
    </div>
  );
}

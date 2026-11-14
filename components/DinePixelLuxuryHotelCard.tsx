import React from "react";
import "@/components/DinePixelLuxuryHotelCard.css";

type LuxuryHotel = {
  id: string;
  name?: string | null;
  hotel_name?: string | null;
  hotel_id?: string | null;
  hotel_public_id?: string | null;
  owner_name?: string | null;
  owner?: string | null;
  email?: string | null;
  contact_email?: string | null;
  subscription_plan?: string | null;
  plan?: string | null;
  registration_date?: string | null;
  created_at?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  slug?: string | null;
  logo_url?: string | null;
};

type DinePixelLuxuryHotelCardProps = {
  hotel: LuxuryHotel;
  onViewMenu: () => void;
  onSetActive?: (isActive: boolean) => void;
  canManage?: boolean;
  isBusy?: boolean;
};

const GoldIcon = ({ type }: { type: "hotel" | "user" | "mail" | "plan" | "date" | "status" }) => {
  const paths = {
    hotel: <><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 21v-5h6v5M9 7h1m4 0h1M9 11h1m4 0h1" /></>,
    user: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0116 0v2z" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 7 9-7" /></>,
    plan: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18m-13 5h4" /></>,
    date: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18" /></>,
    status: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="25" height="25">
      {paths[type]}
    </svg>
  );
};

export default function DinePixelLuxuryHotelCard({
  hotel,
  onViewMenu,
  onSetActive,
  canManage = false,
  isBusy = false,
}: DinePixelLuxuryHotelCardProps) {
  if (!hotel) return null;

  const isActive = hotel.is_active !== false;
  const status = isActive ? "Active" : "Inactive";

  const data = {
    name: hotel.hotel_name || hotel.name || "Hotel",
    id: hotel.hotel_public_id || hotel.hotel_id || hotel.id || "—",
    owner: hotel.owner_name || hotel.owner || "—",
    email: hotel.contact_email || hotel.email || "—",
    plan: hotel.subscription_plan || hotel.plan || "Custom",
    date: hotel.registration_date || hotel.created_at || "—",
    status,
    logoUrl: hotel.logo_url || null,
  };

  const formatted =
    data.date !== "—"
      ? new Date(data.date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const planLabel = (value: string) => {
    const p = (value || "").trim().toUpperCase();
    if (p === "STARTER" || p === "BASIC" || !p) return "Basic";
    if (p === "PRO") return "Pro";
    if (p === "ULTRA") return "Ultra";
    if (p === "CUSTOM") return "Custom";
    return value;
  };

  const handleSetActive = () => {
    if (onSetActive) onSetActive(!isActive);
  };

  return (
    <article className="dpx-card">
      <section className="dpx-brand">
        <div className="dpx-monogram">
          {data.logoUrl ? (
            <img
              src={data.logoUrl}
              alt="Hotel logo"
              className="dpx-logo"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          ) : (
            <img
              src="/images/dinepixel-logo.png"
              alt="DinePixel"
              className="dpx-logo"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          )}
        </div>

        <div className="dpx-wordmark">DinePixel</div>
        <div className="dpx-tagline">
          SEE IT. EXPERIENCE IT. DINE IT.
        </div>

        <div className="dpx-badges">
          <span className={`dpx-badge dpx-badge-active`}>{data.status.toUpperCase()}</span>
          <span className="dpx-badge">{planLabel(data.plan).toUpperCase()}</span>
        </div>
      </section>

      <section className="dpx-information">
        <h2 className="dpx-hotel-name" title={data.name}>
          {data.name}
        </h2>
        <div className="dpx-divider" aria-hidden="true" />

        <div className="dpx-grid">
          <Info icon="hotel" label="HOTEL ID" value={data.id} />
          <Info icon="plan" label="SUBSCRIPTION PLAN" value={planLabel(data.plan)} />
          <Info icon="user" label="OWNER" value={data.owner} />
          <Info icon="date" label="REGISTERED" value={formatted} />
        </div>

        <div className="dpx-email">
          <Info icon="mail" label="CONTACT EMAIL" value={data.email} />
        </div>

        <div className="dpx-bottom">
          <span className="dpx-bottom-label">DINEPIXEL HOSPITALITY TECHNOLOGY</span>
          <div className="dpx-actions">
            <button className="dpx-view-menu" type="button" onClick={onViewMenu}>
              View Menu <span aria-hidden="true">↗</span>
            </button>
            {canManage && (
              <button className="dpx-set-active" type="button" disabled={isBusy} onClick={handleSetActive}>
                {isActive ? "Set Inactive" : "Set Active"}
              </button>
            )}
          </div>
        </div>
      </section>
    </article>
  );
}

function Info({ icon, label, value }: { icon: "hotel" | "user" | "mail" | "plan" | "date" | "status"; label: string; value: string }) {
  return (
    <div className="dpx-info">
      <div className="dpx-icon"><GoldIcon type={icon} /></div>
      <div className="dpx-info-content">
        <span className="dpx-label">{label}</span>
        <strong className="dpx-value" title={value}>
          {value}
        </strong>
      </div>
    </div>
  );
}

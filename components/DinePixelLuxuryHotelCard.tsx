import React, { useId } from "react";
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

  const gradientId = useId();
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
      <div className="dpx-decoration">
        <svg viewBox="0 0 100 100" fill="none">
          <path d="M20 12A12 12 0 0 0 12 20" stroke="#B88A48" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
          <path d="M80 88A12 12 0 0 0 88 80" stroke="#B88A48" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
        </svg>
      </div>

      <section className="dpx-brand">
        <div className="dpx-monogram" aria-hidden="true">
          <svg viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#E4D4A8" />
                <stop offset="1" stopColor="#8F6B30" />
              </linearGradient>
            </defs>
            <path d="M26 26V74" stroke={`url(#${gradientId})`} strokeWidth="7.5" strokeLinecap="round" />
            <path d="M26 28C38 28 74 28 74 52C74 76 38 76 26 76" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" />
            <path d="M44 58Q56 40 68 58" stroke={`url(#${gradientId})`} strokeWidth="4.5" fill="none" strokeLinecap="round" strokeOpacity="0.85" />
            <circle cx="56" cy="36" r="2.5" fill="#D6AD69" opacity="0.9" />
          </svg>
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

        <svg className="dpx-interior" viewBox="0 0 200 140" fill="none" aria-hidden="true">
          <rect width="200" height="140" fill="#070706" />
          <path d="M0 92Q100 84 200 92L200 140L0 140Z" fill="#0a0a09" />
          <circle cx="56" cy="48" r="22" fill="#B88A48" opacity="0.07" />
          <circle cx="152" cy="44" r="18" fill="#D6AD69" opacity="0.06" />
          <circle cx="118" cy="60" r="16" fill="#B88A48" opacity="0.07" />
          <path d="M104 100Q118 82 132 100" stroke="#D6AD69" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
          <circle cx="118" cy="78" r="2" fill="#D6AD69" opacity="0.9" />
          <path d="M0 124Q100 122 200 124" stroke="rgba(214, 173, 105, 0.12)" strokeWidth="2" fill="none" />
        </svg>

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

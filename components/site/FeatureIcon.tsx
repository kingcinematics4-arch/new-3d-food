// components/site/FeatureIcon.tsx
//
// Fixed registry of minimal monochrome icons for the Dine3D site.
//
// The admin panel stores an icon NAME from this allowlist rather than markup,
// so an owner can restyle a feature card but can never inject arbitrary SVG
// into the published page. Every glyph is a thin single-stroke outline drawn in
// `currentColor`, so it inherits the surrounding champagne or ivory tone.

import React from 'react';
import { ICON_OPTIONS, type IconName } from '@/lib/siteContent';

const PATHS: Record<IconName, React.ReactNode> = {
  cube: (
    <>
      <path d="M12 3L4 7v10l8 4 8-4V7l-8-4Z" strokeLinejoin="round" />
      <path d="M12 3v18M4 7l8 4 8-4" strokeOpacity="0.5" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11 18.5h2" strokeLinecap="round" />
    </>
  ),
  qr: (
    <>
      <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="3.5" y="14.5" width="6" height="6" rx="1" />
      <path d="M14.5 14.5h2.5v2.5M20.5 17v3.5h-6" strokeLinecap="round" />
    </>
  ),
  chart: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 15.5l4-4.5 3.5 3 4.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3c5 0 9 3.6 9 8 0 2.5-2 4-4 4h-1.5a2 2 0 0 0-1.4 3.4c.4.4.6.9.6 1.4 0 1.2-1 2.2-2.3 2.2C7 22 3 18 3 12.8 3 7.3 7 3 12 3Z" strokeLinejoin="round" />
      <circle cx="8.5" cy="10" r="1" />
      <circle cx="12" cy="7.5" r="1" />
      <circle cx="15.5" cy="9" r="1" />
    </>
  ),
  bolt: <path d="M13.5 2.5L5 13.5h5.5L10 21.5 19 10.5h-5.5l0-8Z" strokeLinejoin="round" />,
  sparkle: (
    <>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" strokeLinejoin="round" />
      <path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" strokeLinejoin="round" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.5l7.5 3v6c0 4.5-3.1 8.6-7.5 10-4.4-1.4-7.5-5.5-7.5-10v-6l7.5-3Z" strokeLinejoin="round" />
      <path d="M9 12l2.2 2.2L15.5 10" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.6-4-9s1.5-6.6 4-9Z" />
    </>
  ),
  utensils: (
    <>
      <path d="M6 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M8 12v9" strokeLinecap="round" />
      <path d="M16 3c-1.7 1.3-2.5 3.2-2.5 5.5 0 1.6.7 2.5 2.5 2.5M16 11v10" strokeLinecap="round" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8.5h3l1.5-2.5h9L18 8.5h3v11H3v-11Z" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.5V12l3.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5Z" strokeLinejoin="round" />
      <path d="M3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5" strokeLinejoin="round" />
    </>
  ),
  star: (
    <path
      d="M12 3.5l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.9l6-.8L12 3.5Z"
      strokeLinejoin="round"
    />
  ),
};

export const ICON_LABELS: Record<IconName, string> = {
  cube: 'Cube',
  phone: 'Phone',
  qr: 'QR Code',
  chart: 'Chart',
  palette: 'Palette',
  bolt: 'Bolt',
  sparkle: 'Sparkle',
  shield: 'Shield',
  globe: 'Globe',
  utensils: 'Utensils',
  camera: 'Camera',
  grid: 'Grid',
  clock: 'Clock',
  layers: 'Layers',
  star: 'Star',
};

interface FeatureIconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function FeatureIcon({ name, size = 20, strokeWidth = 1.2, className }: FeatureIconProps) {
  const path = PATHS[name] ?? PATHS.cube;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      {path}
    </svg>
  );
}

export { ICON_OPTIONS };
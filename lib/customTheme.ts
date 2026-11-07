// lib/customTheme.ts
// Data structures and presets for the Dine3D Custom Theme Builder

export interface CustomThemeConfig {
  /** 1. Page background color (hex, rgb, etc.) */
  pageBg: string;
  /** 2. Card background color */
  cardBg: string;
  /** 3. Primary accent / brand color */
  primaryColor: string;
  /** 4. Text / ink color */
  textColor: string;
  /** 5. Heading font family */
  headingFont: string;
  /** 6. Body font family */
  bodyFont: string;
  /** 7. Border radius (e.g. 0px, 8px, 16px, 24px) */
  borderRadius: string;
  /** 8. Card surface style */
  cardStyle: 'flat' | 'bordered' | 'elevated' | 'glassmorphic';
  /** 9. Button style */
  buttonStyle: 'solid' | 'outline' | 'soft' | 'pill';
  /** 10. Menu items layout */
  menuLayout: 'grid' | 'editorial' | 'compact-list' | 'cards';
  /** 11. Header & navigation style (fixed: Sticky Blur Bar) */
  headerStyle: 'sticky-blur';
}

export const DEFAULT_CUSTOM_THEME: CustomThemeConfig = {
  pageBg: '#121212',
  cardBg: '#1C1C1E',
  primaryColor: '#E5A93C',
  textColor: '#F5F5F7',
  headingFont: 'Manrope',
  bodyFont: 'Inter',
  borderRadius: '12px',
  cardStyle: 'bordered',
  buttonStyle: 'solid',
  menuLayout: 'grid',
  headerStyle: 'sticky-blur',
};

export const FONT_OPTIONS = [
  { label: 'Cormorant Garamond (Editorial Serif)', value: 'Cormorant Garamond' },
  { label: 'Playfair Display (Luxury Serif)', value: 'Playfair Display' },
  { label: 'Manrope (Modern Clean Sans)', value: 'Manrope' },
  { label: 'Inter (Neutral Swiss Sans)', value: 'Inter' },
  { label: 'Outfit (Geometric Contemporary)', value: 'Outfit' },
  { label: 'Roboto (Classic Grotesk)', value: 'Roboto' },
];

export const BORDER_RADIUS_OPTIONS = [
  { label: 'Sharp (0px)', value: '0px' },
  { label: 'Subtle (6px)', value: '6px' },
  { label: 'Balanced (12px)', value: '12px' },
  { label: 'Rounded (20px)', value: '20px' },
  { label: 'Extra Curved (28px)', value: '28px' },
];

export const CARD_STYLE_OPTIONS: Array<{ label: string; value: CustomThemeConfig['cardStyle']; description: string }> = [
  { label: 'Bordered', value: 'bordered', description: 'Thin hairline border using accent color' },
  { label: 'Elevated', value: 'elevated', description: 'Deep ambient shadow with soft edge' },
  { label: 'Glassmorphic', value: 'glassmorphic', description: 'Translucent frosted glass with blur' },
  { label: 'Flat Minimal', value: 'flat', description: 'Clean seamless surface with no border' },
];

export const BUTTON_STYLE_OPTIONS: Array<{ label: string; value: CustomThemeConfig['buttonStyle']; description: string }> = [
  { label: 'Solid Accent', value: 'solid', description: 'Filled button in primary color' },
  { label: 'Outline', value: 'outline', description: 'Transparent with crisp accent border' },
  { label: 'Soft Wash', value: 'soft', description: 'Gentle translucent accent tint' },
  { label: 'Pill Capsule', value: 'pill', description: 'Fully rounded modern pill' },
];

export const MENU_LAYOUT_OPTIONS: Array<{ label: string; value: CustomThemeConfig['menuLayout']; description: string }> = [
  { label: 'Modern Grid', value: 'grid', description: 'Two-column balanced photo cards' },
  { label: 'Editorial Magazine', value: 'editorial', description: 'Wide spacious rows with generous breathing room' },
  { label: 'Compact List', value: 'compact-list', description: 'Sleek café-style horizontal list with thumbnail' },
  { label: 'Hero Cards', value: 'cards', description: 'Large photography-dominant stacked cards' },
];

export const HEADER_STYLE_OPTIONS: Array<{ label: string; value: CustomThemeConfig['headerStyle']; description: string }> = [
  { label: 'Sticky Blur Bar', value: 'sticky-blur', description: 'Fixed header style for all menus' },
];

/** Presets used by the "Reset to Template" feature */
export const TEMPLATE_PRESETS: Record<string, { name: string; config: CustomThemeConfig }> = {
  'classic-luxury': {
    name: 'Classic Luxury',
    config: {
      pageBg: '#F8F5F0',
      cardBg: '#FFFFFF',
      primaryColor: '#9A8760',
      textColor: '#1A1A1A',
      headingFont: 'Cormorant Garamond',
      bodyFont: 'Inter',
      borderRadius: '12px',
      cardStyle: 'bordered',
      buttonStyle: 'outline',
      menuLayout: 'editorial',
      headerStyle: 'sticky-blur',
    },
  },
  'modern-dark': {
    name: 'Modern Dark',
    config: {
      pageBg: '#0A0A0A',
      cardBg: '#141414',
      primaryColor: '#E1C99A',
      textColor: '#FFFFFF',
      headingFont: 'Manrope',
      bodyFont: 'Inter',
      borderRadius: '16px',
      cardStyle: 'elevated',
      buttonStyle: 'solid',
      menuLayout: 'grid',
      headerStyle: 'sticky-blur',
    },
  },
  'fresh-minimal': {
    name: 'Fresh Minimal',
    config: {
      pageBg: '#F9FAF8',
      cardBg: '#FFFFFF',
      primaryColor: '#2E7D32',
      textColor: '#1E231F',
      headingFont: 'Inter',
      bodyFont: 'Inter',
      borderRadius: '24px',
      cardStyle: 'flat',
      buttonStyle: 'soft',
      menuLayout: 'cards',
      headerStyle: 'sticky-blur',
    },
  },
  'indian-heritage': {
    name: 'Indian Heritage',
    config: {
      pageBg: '#1D150E',
      cardBg: '#2A2015',
      primaryColor: '#C69A6E',
      textColor: '#E8E1D1',
      headingFont: 'Cormorant Garamond',
      bodyFont: 'Inter',
      borderRadius: '8px',
      cardStyle: 'bordered',
      buttonStyle: 'outline',
      menuLayout: 'cards',
      headerStyle: 'sticky-blur',
    },
  },
  'contemporary-premium': {
    name: 'Contemporary Premium',
    config: {
      pageBg: '#F5F3EF',
      cardBg: '#FFFFFF',
      primaryColor: '#A67C52',
      textColor: '#1A1A1A',
      headingFont: 'Manrope',
      bodyFont: 'Inter',
      borderRadius: '0px',
      cardStyle: 'flat',
      buttonStyle: 'solid',
      menuLayout: 'editorial',
      headerStyle: 'sticky-blur',
    },
  },
};

function hexToRgbParts(hex: string): { r: number; g: number; b: number } | null {
  if (typeof hex !== 'string') return null;
  const h = hex.trim().replace('#', '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  if (/^[0-9a-fA-F]{6}$/.test(h)) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  return null;
}

function rgbaFromHex(hex: string, alpha: number): string {
  const p = hexToRgbParts(hex);
  if (!p) return hex;
  return `rgba(${p.r},${p.g},${p.b},${alpha})`;
}

function mixWith(hex: string, target: { r: number; g: number; b: number }, amount: number): string {
  const p = hexToRgbParts(hex);
  if (!p) return hex;
  const t = Math.max(0, Math.min(1, amount));
  const r = Math.round(p.r + (target.r - p.r) * t);
  const g = Math.round(p.g + (target.g - p.g) * t);
  const b = Math.round(p.b + (target.b - p.b) * t);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function isLight(hex: string): boolean {
  const p = hexToRgbParts(hex);
  if (!p) return false;
  const l = (0.2126 * p.r + 0.7152 * p.g + 0.0722 * p.b) / 255;
  return l > 0.62;
}

/**
 * Maps a saved CustomThemeConfig to the Dine3D CSS variable system so the
 * same token-driven UI (menu chrome, cart/View Order, order tracking) reflects
 * the restaurant's active custom theme on every customer page.
 */
export function customThemeToCssVars(config?: Partial<CustomThemeConfig> | null): Record<string, string> {
  if (!config || typeof config !== 'object') return {};
  const c = { ...DEFAULT_CUSTOM_THEME, ...config } as CustomThemeConfig;
  const primary = c.primaryColor || DEFAULT_CUSTOM_THEME.primaryColor;
  const text = c.textColor || DEFAULT_CUSTOM_THEME.textColor;
  const page = c.pageBg || DEFAULT_CUSTOM_THEME.pageBg;
  const card = c.cardBg || DEFAULT_CUSTOM_THEME.cardBg;
  const lightPage = isLight(page);
  const surface2 = mixWith(card, lightPage ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 }, lightPage ? 0.04 : 0.06);
  const surface3 = mixWith(card, lightPage ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 }, lightPage ? 0.08 : 0.12);
  const muted = mixWith(text, hexToRgbParts(page) || { r: 128, g: 128, b: 128 }, 0.45);
  const dimmed = mixWith(text, hexToRgbParts(page) || { r: 128, g: 128, b: 128 }, 0.65);
  const headingFont = `'${String(c.headingFont || 'Manrope').replace(/'/g, '')}', system-ui, sans-serif`;
  const bodyFont = `'${String(c.bodyFont || 'Inter').replace(/'/g, '')}', system-ui, sans-serif`;
  const radius = c.borderRadius || '12px';
  const vars: Record<string, string> = {
    '--bg-primary': page,
    '--bg-secondary': mixWith(page, hexToRgbParts(card) || { r: 0, g: 0, b: 0 }, 0.35),
    '--bg-tertiary': surface2,
    '--bg-surface': card,
    '--bg-surface-2': surface2,
    '--bg-surface-3': surface3,
    '--bg-elevated': surface3,
    '--gold': primary,
    '--gold-bright': mixWith(primary, { r: 255, g: 255, b: 255 }, 0.18),
    '--gold-dim': mixWith(primary, { r: 0, g: 0, b: 0 }, 0.35),
    '--gold-pale': mixWith(primary, { r: 255, g: 255, b: 255 }, 0.28),
    '--gold-deep': mixWith(primary, { r: 0, g: 0, b: 0 }, 0.2),
    '--text-primary': text,
    '--text-secondary': mixWith(text, hexToRgbParts(page) || { r: 128, g: 128, b: 128 }, 0.2),
    '--text-muted': muted,
    '--text-dimmed': dimmed,
    '--text-gold': primary,
    '--border-subtle': rgbaFromHex(primary, 0.12),
    '--border-light': rgbaFromHex(primary, 0.22),
    '--border-medium': rgbaFromHex(primary, 0.34),
    '--border-warm': lightPage ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
    '--border-solid': mixWith(card, hexToRgbParts(text) || { r: 128, g: 128, b: 128 }, 0.16),
    '--font-display': headingFont,
    '--font-body': bodyFont,
    '--d3-card-radius': radius,
    '--d3-modal-radius': radius,
    '--d3-input-radius': radius === '0px' ? '0px' : '8px',
    '--d3-btn-radius': c.buttonStyle === 'pill' ? '9999px' : radius,
    '--d3-badge-radius': c.buttonStyle === 'pill' ? '9999px' : '4px',
    '--d3-chip-radius': c.buttonStyle === 'pill' ? '9999px' : '6px',
    '--d3-header-bg': rgbaFromHex(page, 0.92),
    '--d3-nav-bg': rgbaFromHex(page, 0.92),
    '--d3-shadow-card':
      c.cardStyle === 'elevated'
        ? `0 8px 32px ${rgbaFromHex(text, 0.18)}`
        : c.cardStyle === 'glassmorphic'
          ? `0 8px 24px ${rgbaFromHex(primary, 0.16)}`
          : `0 1px 3px ${rgbaFromHex(text, 0.08)}`,
    '--d3-shadow-card-hover': `0 8px 28px ${rgbaFromHex(primary, 0.14)}`,
    '--d3-shadow-elevated': `0 2px 10px ${rgbaFromHex(text, 0.12)}`,
  };
  return vars;
}

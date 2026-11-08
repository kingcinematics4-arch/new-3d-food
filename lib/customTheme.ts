export type CustomButtonStyle = 'solid' | 'outline' | 'pill' | 'soft';
export type CustomCardStyle = 'flat' | 'elevated' | 'bordered' | 'glassmorphic';
export type CustomHeaderStyle = 'brand-first' | 'minimal-bar' | 'banner' | 'utility';
export type CustomMenuLayout = 'grid' | 'compact-list' | 'editorial' | 'cards';

export type CustomShadowStrength = 'none' | 'soft' | 'medium' | 'strong';
export type CustomBorderStyle = 'none' | 'subtle' | 'defined' | 'accent';
export type CustomBadgeStyle = 'soft' | 'solid' | 'outline';
export type CustomContentSpacing = 'compact' | 'comfortable' | 'spacious';
export type CustomFontWeight = '400' | '500' | '600' | '700';
export type CustomButtonSize = 'sm' | 'md' | 'lg';

export interface CustomThemeTypography {
  headingSize: number;
  bodySize: number;
  priceSize: number;
  headingWeight: CustomFontWeight;
  bodyWeight: CustomFontWeight;
  buttonTextWeight: CustomFontWeight;
}

export interface CustomThemeConfig {
  primaryColor: string;
  pageBg: string;
  cardBg: string;
  textColor: string;
  mutedTextColor: string;
  headingColor: string;
  bodyTextColor: string;
  secondaryTextColor: string;
  buttonTextColor: string;
  navTextColor: string;
  headingFont: string;
  bodyFont: string;
  priceFont: string;
  borderRadius: string;
  imageRadius: string;
  buttonRadius: string;
  badgeRadius: string;
  shadowStrength: CustomShadowStrength;
  borderStyle: CustomBorderStyle;
  cardStyle: CustomCardStyle;
  buttonStyle: CustomButtonStyle;
  buttonSize: CustomButtonSize;
  badgeStyle: CustomBadgeStyle;
  spacing: CustomContentSpacing;
  menuLayout: CustomMenuLayout;
  headerStyle: CustomHeaderStyle;
  typography: CustomThemeTypography;
}

export const DEFAULT_CUSTOM_THEME_TYPOGRAPHY: CustomThemeTypography = {
  headingSize: 18,
  bodySize: 14,
  priceSize: 16,
  headingWeight: '600',
  bodyWeight: '400',
  buttonTextWeight: '600',
};

export const DEFAULT_CUSTOM_THEME: CustomThemeConfig = {
  primaryColor: '#c9a96e',
  pageBg: '#07070a',
  cardBg: '#12121a',
  textColor: '#f0e8d8',
  mutedTextColor: '#9a9080',
  headingColor: '#f0e8d8',
  bodyTextColor: '#f0e8d8',
  secondaryTextColor: '#9a9080',
  buttonTextColor: '#07070a',
  navTextColor: '#f0e8d8',
  headingFont: 'Playfair Display',
  bodyFont: 'DM Sans',
  priceFont: 'DM Sans',
  borderRadius: '16px',
  imageRadius: '14px',
  buttonRadius: '12px',
  badgeRadius: '999px',
  shadowStrength: 'medium',
  borderStyle: 'subtle',
  cardStyle: 'elevated',
  buttonStyle: 'soft',
  buttonSize: 'md',
  badgeStyle: 'soft',
  spacing: 'comfortable',
  menuLayout: 'compact-list',
  headerStyle: 'minimal-bar',
  typography: { ...DEFAULT_CUSTOM_THEME_TYPOGRAPHY },
};

export type FontCategory = 'Modern & Premium' | 'Luxury & Elegant' | 'Professional & Minimal' | 'Bold & Display' | 'Monospace';

export interface FontOptionMeta {
  value: string;
  label: string;
  category: FontCategory;
  /** Google Fonts family name to load (omit/null if not on Google Fonts; a sensible CSS fallback is still applied). */
  google?: string | null;
  /** CSS font-family fallback stack used for previews/rendering. */
  fallback?: string;
  /** Google Fonts weight axis; defaults handled by googleFontHref. */
  weights?: string;
  sample?: string;
}

export interface TypographyCombination {
  id: string;
  name: string;
  description: string;
  headingFont: string;
  bodyFont: string;
  priceFont?: string;
}

const FONT_SAMPLE = 'The Perfect Dining Experience';

export const FONT_CATALOG: FontOptionMeta[] = [
  // Modern & Premium (real Google Fonts)
  { value: 'Inter', label: 'Inter', category: 'Modern & Premium', google: 'Inter', fallback: 'system-ui, -apple-system, Segoe UI, sans-serif', sample: FONT_SAMPLE },
  { value: 'Manrope', label: 'Manrope', category: 'Modern & Premium', google: 'Manrope', fallback: 'system-ui, sans-serif', sample: FONT_SAMPLE },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', category: 'Modern & Premium', google: 'Plus Jakarta Sans', fallback: 'system-ui, sans-serif', sample: FONT_SAMPLE },
  { value: 'DM Sans', label: 'DM Sans', category: 'Modern & Premium', google: 'DM Sans', fallback: 'system-ui, sans-serif', sample: FONT_SAMPLE },
  { value: 'Outfit', label: 'Outfit', category: 'Modern & Premium', google: 'Outfit', fallback: 'system-ui, sans-serif', sample: FONT_SAMPLE },
  { value: 'Urbanist', label: 'Urbanist', category: 'Modern & Premium', google: 'Urbanist', fallback: 'system-ui, sans-serif', sample: FONT_SAMPLE },
  { value: 'Sora', label: 'Sora', category: 'Modern & Premium', google: 'Sora', fallback: 'system-ui, sans-serif', sample: FONT_SAMPLE },
  // Luxury & Elegant (real Google Fonts)
  { value: 'Playfair Display', label: 'Playfair Display', category: 'Luxury & Elegant', google: 'Playfair Display', fallback: 'Georgia, "Times New Roman", serif', sample: FONT_SAMPLE },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond', category: 'Luxury & Elegant', google: 'Cormorant Garamond', fallback: 'Georgia, serif', sample: FONT_SAMPLE },
  { value: 'Libre Baskerville', label: 'Libre Baskerville', category: 'Luxury & Elegant', google: 'Libre Baskerville', fallback: 'Georgia, serif', sample: FONT_SAMPLE },
  { value: 'DM Serif Display', label: 'DM Serif Display', category: 'Luxury & Elegant', google: 'DM Serif Display', fallback: 'Georgia, serif', weights: 'ital,wght@0,400;1,400', sample: FONT_SAMPLE },
  { value: 'Lora', label: 'Lora', category: 'Luxury & Elegant', google: 'Lora', fallback: 'Georgia, serif', sample: FONT_SAMPLE },
  { value: 'Prata', label: 'Prata', category: 'Luxury & Elegant', google: 'Prata', fallback: 'Georgia, serif', weights: 'wght@400', sample: FONT_SAMPLE },
  { value: 'Cinzel', label: 'Cinzel', category: 'Luxury & Elegant', google: 'Cinzel', fallback: 'Georgia, serif', sample: FONT_SAMPLE },
  // Professional & Minimal (real Google Fonts; Geist/General Sans not on Google Fonts — included with sensible fallbacks)
  { value: 'Geist', label: 'Geist', category: 'Professional & Minimal', google: null, fallback: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif', sample: FONT_SAMPLE },
  { value: 'IBM Plex Sans', label: 'IBM Plex Sans', category: 'Professional & Minimal', google: 'IBM Plex Sans', fallback: 'system-ui, sans-serif', sample: FONT_SAMPLE },
  { value: 'Work Sans', label: 'Work Sans', category: 'Professional & Minimal', google: 'Work Sans', fallback: 'system-ui, sans-serif', sample: FONT_SAMPLE },
  { value: 'Montserrat', label: 'Montserrat', category: 'Professional & Minimal', google: 'Montserrat', fallback: 'system-ui, sans-serif', sample: FONT_SAMPLE },
  { value: 'General Sans', label: 'General Sans', category: 'Professional & Minimal', google: null, fallback: '"DM Sans", system-ui, sans-serif', sample: FONT_SAMPLE },
  { value: 'Source Sans 3', label: 'Source Sans 3', category: 'Professional & Minimal', google: 'Source Sans 3', fallback: 'system-ui, sans-serif', sample: FONT_SAMPLE },
  // Bold & Display (real Google Fonts)
  { value: 'Space Grotesk', label: 'Space Grotesk', category: 'Bold & Display', google: 'Space Grotesk', fallback: 'system-ui, sans-serif', sample: FONT_SAMPLE },
  { value: 'Syne', label: 'Syne', category: 'Bold & Display', google: 'Syne', fallback: 'system-ui, sans-serif', sample: FONT_SAMPLE },
  { value: 'Archivo', label: 'Archivo', category: 'Bold & Display', google: 'Archivo', fallback: 'system-ui, sans-serif', sample: FONT_SAMPLE },
  { value: 'Oswald', label: 'Oswald', category: 'Bold & Display', google: 'Oswald', fallback: 'Arial Narrow, sans-serif', sample: FONT_SAMPLE },
  { value: 'Bebas Neue', label: 'Bebas Neue', category: 'Bold & Display', google: 'Bebas Neue', fallback: 'Arial Narrow, sans-serif', weights: 'wght@400', sample: FONT_SAMPLE },
  { value: 'League Spartan', label: 'League Spartan', category: 'Bold & Display', google: 'League Spartan', fallback: 'system-ui, sans-serif', sample: FONT_SAMPLE },
  // Utility (kept for prices/technical accents)
  { value: 'IBM Plex Mono', label: 'IBM Plex Mono', category: 'Monospace', google: 'IBM Plex Mono', fallback: 'ui-monospace, SFMono-Regular, Menlo, monospace', sample: FONT_SAMPLE },
];

export const FONT_OPTIONS = FONT_CATALOG.map(({ value, label }) => ({ value, label }));

export const FONT_CATEGORY_ORDER: FontCategory[] = ['Modern & Premium', 'Luxury & Elegant', 'Professional & Minimal', 'Bold & Display', 'Monospace'];

export const TYPOGRAPHY_COMBINATIONS: TypographyCombination[] = [
  { id: 'luxury-restaurant', name: 'Luxury Restaurant', description: 'Opulent serif headings with refined readability', headingFont: 'Playfair Display', bodyFont: 'Lora', priceFont: 'DM Sans' },
  { id: 'modern-fine-dining', name: 'Modern Fine Dining', description: 'Elegant display paired with contemporary sans', headingFont: 'DM Serif Display', bodyFont: 'Plus Jakarta Sans', priceFont: 'Manrope' },
  { id: 'premium-hotel', name: 'Premium Hotel', description: 'Polished hospitality with crisp hierarchy', headingFont: 'Cormorant Garamond', bodyFont: 'Montserrat', priceFont: 'Montserrat' },
  { id: 'minimal-cafe', name: 'Minimal Cafe', description: 'Clean, warm, and effortlessly readable', headingFont: 'Manrope', bodyFont: 'Inter', priceFont: 'Inter' },
  { id: 'contemporary-restaurant', name: 'Contemporary Restaurant', description: 'Confident modern character with clarity', headingFont: 'Space Grotesk', bodyFont: 'DM Sans', priceFont: 'Space Grotesk' },
  { id: 'elegant-hospitality', name: 'Elegant Hospitality', description: 'Classic sophistication for premium service', headingFont: 'Libre Baskerville', bodyFont: 'Outfit', priceFont: 'Outfit' },
];

export interface BorderRadiusOption {
  label: string;
  value: string;
}

export const BORDER_RADIUS_OPTIONS: BorderRadiusOption[] = [
  { label: 'None', value: '0px' },
  { label: 'XS', value: '6px' },
  { label: 'SM', value: '10px' },
  { label: 'MD', value: '14px' },
  { label: 'LG', value: '18px' },
  { label: 'XL', value: '24px' },
  { label: '2XL', value: '32px' },
];

export const SHADOW_OPTIONS: { label: string; value: CustomShadowStrength; description: string }[] = [
  { label: 'None', value: 'none', description: 'Flat surfaces with no shadow' },
  { label: 'Soft', value: 'soft', description: 'Light depth for clean menus' },
  { label: 'Medium', value: 'medium', description: 'Balanced card elevation' },
  { label: 'Strong', value: 'strong', description: 'High contrast depth' },
];

export const BORDER_STYLE_OPTIONS: { label: string; value: CustomBorderStyle; description: string }[] = [
  { label: 'None', value: 'none', description: 'No visible card border' },
  { label: 'Subtle', value: 'subtle', description: 'Quiet separation' },
  { label: 'Defined', value: 'defined', description: 'Clear card edges' },
  { label: 'Accent', value: 'accent', description: 'Uses the primary color' },
];

export const SPACING_OPTIONS: { label: string; value: CustomContentSpacing; description: string }[] = [
  { label: 'Compact', value: 'compact', description: 'Denser menu presentation' },
  { label: 'Comfortable', value: 'comfortable', description: 'Balanced spacing' },
  { label: 'Spacious', value: 'spacious', description: 'Airy, premium spacing' },
];

export const BADGE_STYLE_OPTIONS: { label: string; value: CustomBadgeStyle; description: string }[] = [
  { label: 'Soft', value: 'soft', description: 'Tinted badges' },
  { label: 'Solid', value: 'solid', description: 'Filled badges' },
  { label: 'Outline', value: 'outline', description: 'Outlined badges' },
];

export const BUTTON_SIZE_OPTIONS: { label: string; value: CustomButtonSize }[] = [
  { label: 'Small', value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large', value: 'lg' },
];

export interface CardStyleOption {
  label: string;
  value: CustomCardStyle;
  description: string;
}

export const CARD_STYLE_OPTIONS: CardStyleOption[] = [
  { label: 'Flat', value: 'flat', description: 'Clean, no shadow' },
  { label: 'Elevated', value: 'elevated', description: 'Subtle depth shadow' },
  { label: 'Bordered', value: 'bordered', description: 'Outlined edges' },
  { label: 'Glassmorphic', value: 'glassmorphic', description: 'Frosted glass look' },
];

export interface ButtonStyleOption {
  label: string;
  value: CustomButtonStyle;
  description: string;
}

export const BUTTON_STYLE_OPTIONS: ButtonStyleOption[] = [
  { label: 'Solid', value: 'solid', description: 'Filled primary color' },
  { label: 'Outline', value: 'outline', description: 'Bordered, transparent' },
  { label: 'Pill', value: 'pill', description: 'Fully rounded solid' },
  { label: 'Soft', value: 'soft', description: 'Light tinted background' },
];

export interface MenuLayoutOption {
  label: string;
  value: CustomMenuLayout;
  description: string;
}

export const MENU_LAYOUT_OPTIONS: MenuLayoutOption[] = [
  { label: 'Grid', value: 'grid', description: 'Two-column card grid' },
  { label: 'List', value: 'compact-list', description: 'Compact vertical list' },
  { label: 'Editorial', value: 'editorial', description: 'Large featured cards' },
  { label: 'Cards', value: 'cards', description: 'Single-column cards' },
];

export interface ColorPalette {
  id: string;
  name: string;
  colors: { primaryColor: string; pageBg: string; cardBg: string; textColor: string; mutedTextColor: string };
}

export const COLOR_PALETTES: ColorPalette[] = [
  { id: 'noir-gold', name: 'Noir Gold', colors: { primaryColor: '#c9a96e', pageBg: '#07070a', cardBg: '#12121a', textColor: '#f0e8d8', mutedTextColor: '#9a9080' } },
  { id: 'ivory-espresso', name: 'Ivory Espresso', colors: { primaryColor: '#8b5e34', pageBg: '#f7f1e8', cardBg: '#fffaf2', textColor: '#2b2118', mutedTextColor: '#766858' } },
  { id: 'sage-stone', name: 'Sage Stone', colors: { primaryColor: '#5f7a67', pageBg: '#f3f4ef', cardBg: '#ffffff', textColor: '#1f2923', mutedTextColor: '#66756b' } },
  { id: 'ocean-night', name: 'Ocean Night', colors: { primaryColor: '#4ea1d3', pageBg: '#08131d', cardBg: '#101f2d', textColor: '#eaf4ff', mutedTextColor: '#90a8bf' } },
  { id: 'rose-cream', name: 'Rose Cream', colors: { primaryColor: '#c86b85', pageBg: '#fff4f6', cardBg: '#ffffff', textColor: '#352328', mutedTextColor: '#8b6771' } },
  { id: 'citrus-fresh', name: 'Citrus Fresh', colors: { primaryColor: '#e09f3e', pageBg: '#fffaf0', cardBg: '#ffffff', textColor: '#2f2618', mutedTextColor: '#8a7658' } },
  { id: 'forest-ember', name: 'Forest Ember', colors: { primaryColor: '#d97745', pageBg: '#0e1512', cardBg: '#17211c', textColor: '#eef3ed', mutedTextColor: '#8fa095' } },
  { id: 'royal-plum', name: 'Royal Plum', colors: { primaryColor: '#b07adf', pageBg: '#120d18', cardBg: '#1d1628', textColor: '#f5efff', mutedTextColor: '#a595c2' } },
  { id: 'slate-lime', name: 'Slate Lime', colors: { primaryColor: '#84cc16', pageBg: '#0b1020', cardBg: '#141b2f', textColor: '#e8eefc', mutedTextColor: '#94a3c4' } },
  { id: 'terracotta-sand', name: 'Terracotta Sand', colors: { primaryColor: '#c96a4b', pageBg: '#f8efe7', cardBg: '#fff8f2', textColor: '#35241d', mutedTextColor: '#8c6f64' } },
  { id: 'mono-silver', name: 'Mono Silver', colors: { primaryColor: '#c0c7d1', pageBg: '#0b0d10', cardBg: '#151922', textColor: '#f3f5f7', mutedTextColor: '#98a2b3' } },
  { id: 'midnight-teal', name: 'Midnight Teal', colors: { primaryColor: '#2dd4bf', pageBg: '#061417', cardBg: '#0f2227', textColor: '#e6fffb', mutedTextColor: '#84b7b0' } },
];

export interface TemplatePreset {
  name: string;
  description: string;
  config: CustomThemeConfig;
}

function preset(partial: Partial<CustomThemeConfig> & { typography?: Partial<CustomThemeTypography> }): CustomThemeConfig {
  return normalizeCustomThemeConfig({ ...DEFAULT_CUSTOM_THEME, ...partial, typography: { ...DEFAULT_CUSTOM_THEME_TYPOGRAPHY, ...(partial.typography || {}) } });
}

export const TEMPLATE_PRESETS: Record<string, TemplatePreset> = {
  modern: {
    name: 'Modern Dark',
    description: 'Clean, dark design with warm gold accents',
    config: preset({ primaryColor: '#c9a96e', pageBg: '#07070a', cardBg: '#12121a', textColor: '#f0e8d8', mutedTextColor: '#9a9080', headingFont: 'Playfair Display', bodyFont: 'DM Sans', priceFont: 'DM Sans', cardStyle: 'elevated', buttonStyle: 'soft' }),
  },
  'fine-dining': {
    name: 'Fine Dining',
    description: 'Luxurious dark theme with editorial layout',
    config: preset({ primaryColor: '#d4af37', pageBg: '#0d0a07', cardBg: '#17120d', textColor: '#f5efe3', mutedTextColor: '#a08b73', headingFont: 'Cormorant Garamond', bodyFont: 'Lato', priceFont: 'Cormorant Garamond', menuLayout: 'editorial', cardStyle: 'bordered', borderStyle: 'accent', spacing: 'spacious' }),
  },
  minimal: {
    name: 'Minimal Light',
    description: 'Clean, bright design with elegant simplicity',
    config: preset({ primaryColor: '#374151', pageBg: '#f8fafc', cardBg: '#ffffff', textColor: '#111827', mutedTextColor: '#6b7280', headingFont: 'Inter', bodyFont: 'Inter', priceFont: 'Inter', cardStyle: 'bordered', buttonStyle: 'outline', shadowStrength: 'soft' }),
  },
  vibrant: {
    name: 'Vibrant & Bold',
    description: 'Energetic colors with a playful card layout',
    config: preset({ primaryColor: '#ff6b35', pageBg: '#fff8f4', cardBg: '#ffffff', textColor: '#231f20', mutedTextColor: '#7a6d66', headingFont: 'Montserrat', bodyFont: 'Nunito Sans', priceFont: 'Montserrat', cardStyle: 'elevated', buttonStyle: 'pill', badgeStyle: 'solid', shadowStrength: 'strong' }),
  },
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function normalizeHex(input: string | null | undefined, fallback: string): string {
  if (!input || typeof input !== 'string') return fallback;
  let v = input.trim();
  if (!v) return fallback;
  if (!v.startsWith('#')) v = `#${v}`;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : fallback;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = normalizeHex(hex, '#000000').slice(1);
  return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), d = max - min;
  let h = 0;
  if (d) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

export function hsvToHex(h: number, s: number, v: number): string {
  const hh = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (hh < 60) { r = c; g = x; }
  else if (hh < 120) { r = x; g = c; }
  else if (hh < 180) { g = c; b = x; }
  else if (hh < 240) { g = x; b = c; }
  else if (hh < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a), cb = hexToRgb(b), tt = clamp(t, 0, 1);
  return rgbToHex(ca.r + (cb.r - ca.r) * tt, ca.g + (cb.g - ca.g) * tt, ca.b + (cb.b - ca.b) * tt);
}

export function getReadableTextColor(bg: string): string {
  const { r, g, b } = hexToRgb(bg);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.62 ? '#111827' : '#f8fafc';
}

export function getColorShades(hex: string, count = 12): string[] {
  const base = normalizeHex(hex, '#c9a96e');
  const { h, s } = hexToHsv(base);
  const isLight = hexToHsv(base).v > 0.72;
  const steps = Array.from({ length: count }, (_, i) => i / (count - 1));
  return steps.map((t) => {
    if (isLight) {
      return hsvToHex(h, clamp(s * (0.3 + t * 0.9), 0, 1), clamp(0.98 - t * 0.72, 0.12, 1));
    }
    return hsvToHex(h, clamp(s * (0.25 + t * 0.85), 0, 1), clamp(0.14 + t * 0.84, 0.08, 1));
  });
}

export function getProfessionalShades(hex: string): string[] {
  return getColorShades(hex, 12);
}

export function deriveMutedTextColor(textColor: string, pageBg: string): string {
  return mixHex(textColor, pageBg, 0.45);
}

export function fontCssFamily(fontName: string): string {
  const meta = resolveFontOption(fontName);
  const fb = meta.fallback || 'system-ui, -apple-system, Segoe UI, sans-serif';
  return `"${meta.value}", ${fb}`;
}

export function resolveFontOption(value: string | null | undefined): FontOptionMeta {
  const raw = (value || '').trim();
  if (!raw) return FONT_CATALOG[0];
  const found = FONT_CATALOG.find((f) => f.value.toLowerCase() === raw.toLowerCase() || f.label.toLowerCase() === raw.toLowerCase());
  if (found) return found;
  const looksSerif = /(serif|display|garamond|baskerville|playfair|bodoni|didot)/i.test(raw);
  return { value: raw, label: raw, category: looksSerif ? 'Luxury & Elegant' : 'Modern & Premium', google: raw, fallback: looksSerif ? 'Georgia, "Times New Roman", serif' : 'system-ui, -apple-system, Segoe UI, sans-serif', sample: FONT_SAMPLE };
}

export function googleFontHref(fonts: string[]): string | null {
  const resolved = Array.from(new Set(fonts.map((f) => (f || '').trim()).filter(Boolean))).map(resolveFontOption);
  const families = resolved.filter((m) => m.google !== null && (m.google || m.value));
  if (!families.length) return null;
  const q = families.map((m) => {
    const fam = (m.google || m.value).trim();
    const w = m.weights || 'ital,wght@0,400;0,500;0,600;0,700';
    return `family=${encodeURIComponent(fam).replace(/%20/g, '+')}:${w}`;
  }).join('&');
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}

function normalizeEnum<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function normalizePx(v: unknown, fallback: string): string {
  if (typeof v === 'number' && Number.isFinite(v)) return `${clamp(v, 0, 48)}px`;
  if (typeof v !== 'string') return fallback;
  const s = v.trim();
  if (/^\d+(\.\d+)?px$/.test(s)) return s;
  if (/^\d+(\.\d+)?$/.test(s)) return `${clamp(Number(s), 0, 48)}px`;
  return fallback;
}

export function normalizeCustomThemeConfig(raw: unknown): CustomThemeConfig {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Partial<CustomThemeConfig> & Record<string, unknown>;
  const d = DEFAULT_CUSTOM_THEME;
  const primaryColor = normalizeHex((src.primaryColor as string) || (src as any).accentColor, d.primaryColor);
  const pageBg = normalizeHex(src.pageBg as string, d.pageBg);
  const cardBg = normalizeHex(src.cardBg as string, d.cardBg);
  const textColor = normalizeHex(src.textColor as string, d.textColor);
  const mutedTextColor = normalizeHex(src.mutedTextColor as string, deriveMutedTextColor(textColor, pageBg));
  const bodyTextColor = normalizeHex((src.bodyTextColor as string) || textColor, textColor);
  const headingColor = normalizeHex((src.headingColor as string) || textColor, textColor);
  const secondaryTextColor = normalizeHex((src.secondaryTextColor as string) || mutedTextColor, mutedTextColor);
  const buttonTextColor = normalizeHex(src.buttonTextColor as string, (() => { const v = (primaryColor||'#000').replace('#',''); const f=v.length===3?v.split('').map((c:string)=>c+c).join(''):v.padEnd(6,'0').slice(0,6); const r=parseInt(f.slice(0,2),16),g=parseInt(f.slice(2,4),16),b=parseInt(f.slice(4,6),16); return (r*299+g*587+b*114)/1000 > 155 ? '#07070a' : '#f0e8d8'; })());
  const navTextColor = normalizeHex((src.navTextColor as string) || textColor, textColor);
  const tSrc = (src.typography && typeof src.typography === 'object' ? src.typography : {}) as Partial<CustomThemeTypography>;
  const typography: CustomThemeTypography = {
    headingSize: clamp(Number(tSrc.headingSize) || d.typography.headingSize, 14, 34),
    bodySize: clamp(Number(tSrc.bodySize) || d.typography.bodySize, 12, 20),
    priceSize: clamp(Number(tSrc.priceSize) || d.typography.priceSize, 12, 28),
    headingWeight: normalizeEnum(tSrc.headingWeight, ['400', '500', '600', '700'] as const, d.typography.headingWeight),
    bodyWeight: normalizeEnum(tSrc.bodyWeight, ['400', '500', '600', '700'] as const, d.typography.bodyWeight),
    buttonTextWeight: normalizeEnum(tSrc.buttonTextWeight, ['400', '500', '600', '700'] as const, d.typography.buttonTextWeight),
  };  return {
    primaryColor,
    pageBg,
    cardBg,
    textColor,
    mutedTextColor,
    headingColor,
    bodyTextColor,
    secondaryTextColor,
    buttonTextColor,
    navTextColor,
    headingFont: resolveFontOption(src.headingFont as string).value || d.headingFont,
    bodyFont: resolveFontOption(src.bodyFont as string).value || d.bodyFont,
    priceFont: resolveFontOption((src.priceFont || src.bodyFont) as string).value || d.priceFont,
    borderRadius: normalizePx(src.borderRadius, d.borderRadius),
    imageRadius: normalizePx(src.imageRadius, d.imageRadius),
    buttonRadius: normalizePx(src.buttonRadius, d.buttonRadius),
    badgeRadius: normalizePx(src.badgeRadius, d.badgeRadius),
    shadowStrength: normalizeEnum(src.shadowStrength, ['none', 'soft', 'medium', 'strong'] as const, d.shadowStrength),
    borderStyle: normalizeEnum(src.borderStyle, ['none', 'subtle', 'defined', 'accent'] as const, d.borderStyle),
    cardStyle: normalizeEnum(src.cardStyle, ['flat', 'elevated', 'bordered', 'glassmorphic'] as const, d.cardStyle),
    buttonStyle: normalizeEnum(src.buttonStyle, ['solid', 'outline', 'pill', 'soft'] as const, d.buttonStyle),
    buttonSize: normalizeEnum(src.buttonSize, ['sm', 'md', 'lg'] as const, d.buttonSize),
    badgeStyle: normalizeEnum(src.badgeStyle, ['soft', 'solid', 'outline'] as const, d.badgeStyle),
    spacing: normalizeEnum(src.spacing, ['compact', 'comfortable', 'spacious'] as const, d.spacing),
    menuLayout: normalizeEnum(src.menuLayout, ['grid', 'compact-list', 'editorial', 'cards'] as const, d.menuLayout),
    headerStyle: normalizeEnum(src.headerStyle, ['brand-first', 'minimal-bar', 'banner', 'utility'] as const, d.headerStyle),
    typography,
  };
}

export function cloneCustomThemeConfig(config?: Partial<CustomThemeConfig> | null): CustomThemeConfig {
  return normalizeCustomThemeConfig(config || DEFAULT_CUSTOM_THEME);
}

export function isCustomThemeConfigEqual(a?: CustomThemeConfig | null, b?: CustomThemeConfig | null): boolean {
  return JSON.stringify(normalizeCustomThemeConfig(a)) === JSON.stringify(normalizeCustomThemeConfig(b));
}

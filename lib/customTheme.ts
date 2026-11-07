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
  menuLayout: 'grid',
  headerStyle: 'minimal-bar',
  typography: DEFAULT_CUSTOM_THEME_TYPOGRAPHY,
};

export type FontCategory = 'Sans Serif' | 'Serif' | 'Display' | 'Elegant' | 'Modern' | 'Monospace';

export interface FontOptionMeta {
  value: string;
  label: string;
  category: FontCategory;
  google?: string;
  sample?: string;
}

export const FONT_CATALOG: FontOptionMeta[] = [
  { value: 'DM Sans', label: 'DM Sans', category: 'Sans Serif', sample: 'Clean modern menu' },
  { value: 'Inter', label: 'Inter', category: 'Sans Serif', sample: 'Clear and balanced' },
  { value: 'Manrope', label: 'Manrope', category: 'Sans Serif', sample: 'Friendly professional' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', category: 'Sans Serif', sample: 'Contemporary dining' },
  { value: 'Outfit', label: 'Outfit', category: 'Sans Serif', sample: 'Modern hospitality' },
  { value: 'Poppins', label: 'Poppins', category: 'Sans Serif', sample: 'Rounded and approachable' },
  { value: 'Montserrat', label: 'Montserrat', category: 'Sans Serif', sample: 'Bold urban menu' },
  { value: 'Nunito Sans', label: 'Nunito Sans', category: 'Sans Serif', sample: 'Soft and readable' },
  { value: 'Work Sans', label: 'Work Sans', category: 'Sans Serif', sample: 'Neutral and crisp' },
  { value: 'Source Sans 3', label: 'Source Sans 3', category: 'Sans Serif', sample: 'Practical clarity' },
  { value: 'Lato', label: 'Lato', category: 'Sans Serif', sample: 'Warm readability' },
  { value: 'Open Sans', label: 'Open Sans', category: 'Sans Serif', sample: 'Familiar and clear' },
  { value: 'Raleway', label: 'Raleway', category: 'Sans Serif', sample: 'Light premium feel' },
  { value: 'Rubik', label: 'Rubik', category: 'Sans Serif', sample: 'Soft geometric' },
  { value: 'Figtree', label: 'Figtree', category: 'Sans Serif', sample: 'Fresh and modern' },
  { value: 'Sora', label: 'Sora', category: 'Modern', sample: 'Tech-forward dining' },
  { value: 'Space Grotesk', label: 'Space Grotesk', category: 'Modern', sample: 'Distinctive modern' },
  { value: 'Urbanist', label: 'Urbanist', category: 'Modern', sample: 'Sleek contemporary' },
  { value: 'Playfair Display', label: 'Playfair Display', category: 'Serif', sample: 'Classic fine dining' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond', category: 'Serif', sample: 'Elegant signature' },
  { value: 'Lora', label: 'Lora', category: 'Serif', sample: 'Comfortable editorial' },
  { value: 'Merriweather', label: 'Merriweather', category: 'Serif', sample: 'Rich and readable' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville', category: 'Serif', sample: 'Traditional premium' },
  { value: 'Crimson Pro', label: 'Crimson Pro', category: 'Serif', sample: 'Refined bookish' },
  { value: 'Source Serif 4', label: 'Source Serif 4', category: 'Serif', sample: 'Balanced serif' },
  { value: 'EB Garamond', label: 'EB Garamond', category: 'Elegant', sample: 'Timeless luxury' },
  { value: 'Fraunces', label: 'Fraunces', category: 'Elegant', sample: 'Characterful craft' },
  { value: 'Spectral', label: 'Spectral', category: 'Elegant', sample: 'Graceful detail' },
  { value: 'Bodoni Moda', label: 'Bodoni Moda', category: 'Elegant', sample: 'High-fashion dining' },
  { value: 'Cinzel', label: 'Cinzel', category: 'Display', sample: 'Grand presentation' },
  { value: 'Marcellus', label: 'Marcellus', category: 'Display', sample: 'Calm sophistication' },
  { value: 'Prata', label: 'Prata', category: 'Display', sample: 'Editorial luxury' },
  { value: 'Yeseva One', label: 'Yeseva One', category: 'Display', sample: 'Expressive headings' },
  { value: 'Oswald', label: 'Oswald', category: 'Display', sample: 'Strong condensed' },
  { value: 'Bebas Neue', label: 'Bebas Neue', category: 'Display', sample: 'Bold statement' },
  { value: 'IBM Plex Mono', label: 'IBM Plex Mono', category: 'Monospace', sample: 'Precise price tags' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono', category: 'Monospace', sample: 'Technical clarity' },
];

export const FONT_OPTIONS = FONT_CATALOG.map(({ value, label }) => ({ value, label }));

export const FONT_CATEGORY_ORDER: FontCategory[] = ['Sans Serif', 'Serif', 'Elegant', 'Display', 'Modern', 'Monospace'];

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

export function resolveFontOption(value: string | null | undefined): FontOptionMeta {
  const raw = (value || '').trim();
  if (!raw) return FONT_CATALOG[0];
  const found = FONT_CATALOG.find((f) => f.value.toLowerCase() === raw.toLowerCase() || f.label.toLowerCase() === raw.toLowerCase());
  if (found) return found;
  return { value: raw, label: raw, category: 'Sans Serif' };
}

export function googleFontHref(fonts: string[]): string | null {
  const families = Array.from(new Set(fonts.map((f) => resolveFontOption(f).value).filter(Boolean)));
  if (!families.length) return null;
  const q = families.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:ital,wght@0,400;0,500;0,600;0,700`).join('&');
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
  const tSrc = (src.typography && typeof src.typography === 'object' ? src.typography : {}) as Partial<CustomThemeTypography>;
  const typography: CustomThemeTypography = {
    headingSize: clamp(Number(tSrc.headingSize) || d.typography.headingSize, 14, 34),
    bodySize: clamp(Number(tSrc.bodySize) || d.typography.bodySize, 12, 20),
    priceSize: clamp(Number(tSrc.priceSize) || d.typography.priceSize, 12, 28),
    headingWeight: normalizeEnum(tSrc.headingWeight, ['400', '500', '600', '700'] as const, d.typography.headingWeight),
    bodyWeight: normalizeEnum(tSrc.bodyWeight, ['400', '500', '600', '700'] as const, d.typography.bodyWeight),
    buttonTextWeight: normalizeEnum(tSrc.buttonTextWeight, ['400', '500', '600', '700'] as const, d.typography.buttonTextWeight),
  };
  return {
    primaryColor,
    pageBg,
    cardBg,
    textColor,
    mutedTextColor,
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

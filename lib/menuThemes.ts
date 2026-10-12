// lib/menuThemes.ts
//
// Five hotel menu themes. Each theme is a complete visual + layout recipe:
// it defines CSS custom properties (colors, typography, spacing, borders,
// shadows) and layout flags that control structure rather than just hue.
//
// The server persists only the theme ID on the `hotels` row. At render
// time the public menu page applies a matching `.d3-theme-<id>` class
// to its root element, and the CSS in `app/globals.css` overrides the
// base design tokens. Layout flags are read by the React layer to
// switch structural arrangements (card shape, image ratio, header style,
// etc.) so each theme is genuinely distinct — not just a colour swap.

export type MenuThemeId =
  | 'classic-luxury'
  | 'modern-dark'
  | 'fresh-minimal'
  | 'indian-heritage'
  | 'contemporary-premium'
  | 'custom';

/** Tuple of all valid theme IDs — used by Zod enums and CHECK constraints. */
export const MENU_THEME_IDS: [string, ...string[]] = [
  'classic-luxury',
  'modern-dark',
  'fresh-minimal',
  'indian-heritage',
  'contemporary-premium',
  'custom',
];

/** Layout flag — how dish cards are shaped and stacked. */
export type CardVariant = 'rounded' | 'sharp' | 'pilled' | 'outlined';

/** Layout flag — category navigation presentation. */
export type CategoryNavVariant = 'pills' | 'underline' | 'boxed' | 'sidebar';

/** Layout flag — page header presentation. */
export type HeaderVariant = 'standard' | 'centered' | 'minimal';

/** Layout flag — food image aspect ratio inside cards. */
export type ImageRatio = '4/3' | '16/9' | '1/1' | '3/4';

export interface MenuTheme {
  id: MenuThemeId;
  name: string;
  description: string;
  /** Short label shown in dashboard previews. */
  label: string;
  /** CSS variable overrides — consumed by app/globals.css. */
  css: Record<string, string>;
  /** Layout flags — consumed by React components. */
  layout: {
    cardVariant: CardVariant;
    categoryNav: CategoryNavVariant;
    header: HeaderVariant;
    imageRatio: ImageRatio;
    containerMax: string;
    sectionGap: string;
    borderRadius: string;
  };
}

const themes: Record<MenuThemeId, MenuTheme> = {
  'classic-luxury': {
    id: 'classic-luxury',
    name: 'Classic Luxury',
    label: 'Classic Luxury',
    description:
      'Warm cream and deep gold — a timeless fine-dining menu with serif headings, generous whitespace, and spacious card layouts.',
    css: {
      '--bg-primary': '#F4F1EA',
      '--bg-secondary': '#F8F5F0',
      '--bg-tertiary': '#EAE7E1',
      '--bg-surface': '#FFFFFF',
      '--bg-surface-2': '#F4F1EA',
      '--bg-surface-3': '#EAE7E1',
      '--bg-elevated': '#E0DDD6',
      '--gold': '#B8A47A',
      '--gold-bright': '#CDB98F',
      '--gold-dim': '#6E6350',
      '--gold-pale': '#D9CBAB',
      '--gold-deep': '#9A8760',
      '--text-primary': '#1A1A1A',
      '--text-secondary': '#4A4A40',
      '--text-muted': '#7B776E',
      '--text-dimmed': '#A6A297',
      '--border-subtle': 'rgba(184,164,122,0.12)',
      '--border-light': 'rgba(184,164,122,0.20)',
      '--border-medium': 'rgba(184,164,122,0.30)',
      '--border-warm': 'rgba(184,164,122,0.08)',
      '--border-solid': '#E3DFDA',
      '--font-display': "'Cormorant Garamond', Georgia, serif",
      '--font-body': "'Inter', system-ui, sans-serif",
      '--d3-shadow-card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      '--d3-shadow-card-hover': '0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)',
      '--d3-shadow-elevated': '0 1px 3px rgba(0,0,0,0.08)',
    },
    layout: {
      cardVariant: 'rounded',
      categoryNav: 'pills',
      header: 'standard',
      imageRatio: '4/3',
      containerMax: '720px',
      sectionGap: '2.5rem',
      borderRadius: '12px',
    },
  },

  'modern-dark': {
    id: 'modern-dark',
    name: 'Modern Dark',
    label: 'Modern Dark',
    description:
      'Deep charcoal canvas with high-contrast cards, bold typography, and food photography that pops against the darkness.',
    css: {
      '--bg-primary': '#0A0A0A',
      '--bg-secondary': '#0F0F0F',
      '--bg-tertiary': '#121212',
      '--bg-surface': '#141414',
      '--bg-surface-2': '#1A1A1A',
      '--bg-surface-3': '#202020',
      '--bg-elevated': '#252525',
      '--gold': '#E1C99A',
      '--gold-bright': '#F0DCAF',
      '--gold-dim': '#8A7C5E',
      '--gold-pale': '#F0DCAF',
      '--gold-deep': '#B89C5C',
      '--text-primary': '#FFFFFF',
      '--text-secondary': '#D1D1D1',
      '--text-muted': '#A0A0A0',
      '--text-dimmed': '#787878',
      '--border-subtle': 'rgba(225,225,225,0.06)',
      '--border-light': 'rgba(225,225,225,0.10)',
      '--border-medium': 'rgba(225,225,225,0.18)',
      '--border-warm': 'rgba(225,225,225,0.08)',
      '--border-solid': '#2A2A2A',
      '--font-display': "'Manrope', system-ui, sans-serif",
      '--font-body': "'Inter', system-ui, sans-serif",
      '--d3-shadow-card': '0 1px 3px rgba(0,0,0,0.30)',
      '--d3-shadow-card-hover': '0 8px 32px rgba(0,0,0,0.50)',
      '--d3-shadow-elevated': '0 2px 8px rgba(0,0,0,0.40)',
    },
    layout: {
      cardVariant: 'sharp',
      categoryNav: 'underline',
      header: 'standard',
      imageRatio: '16/9',
      containerMax: '800px',
      sectionGap: '2rem',
      borderRadius: '4px',
    },
  },

  'fresh-minimal': {
    id: 'fresh-minimal',
    name: 'Fresh Minimal',
    label: 'Fresh Minimal',
    description:
      'Bright white space with soft green accents, rounded cards, and clean typography for an airy, modern café feel.',
    css: {
      '--bg-primary': '#FFFFFF',
      '--bg-secondary': '#FAFAFA',
      '--bg-tertiary': '#F5F5F5',
      '--bg-surface': '#FFFFFF',
      '--bg-surface-2': '#F7F9F7',
      '--bg-surface-3': '#EDF1ED',
      '--bg-elevated': '#EAEFF1',
      '--gold': '#2E7D32',
      '--gold-bright': '#4CAF50',
      '--gold-dim': '#6B8E23',
      '--gold-pale': '#66BB6A',
      '--gold-deep': '#1B5E20',
      '--text-primary': '#0A0A0A',
      '--text-secondary': '#555555',
      '--text-muted': '#7A7A7A',
      '--text-dimmed': '#A8A8A8',
      '--border-subtle': 'rgba(46,125,50,0.10)',
      '--border-light': 'rgba(46,125,50,0.18)',
      '--border-medium': 'rgba(46,125,50,0.28)',
      '--border-warm': 'rgba(0,0,0,0.06)',
      '--border-solid': '#E3E3E3',
      '--font-display': "'Inter', system-ui, sans-serif",
      '--font-body': "'Inter', system-ui, sans-serif",
      '--d3-shadow-card': '0 1px 3px rgba(0,0,0,0.05)',
      '--d3-shadow-card-hover': '0 4px 16px rgba(0,0,0,0.08)',
      '--d3-shadow-elevated': '0 1px 3px rgba(0,0,0,0.06)',
    },
    layout: {
      cardVariant: 'pilled',
      categoryNav: 'pills',
      header: 'centered',
      imageRatio: '1/1',
      containerMax: '760px',
      sectionGap: '2rem',
      borderRadius: '16px',
    },
  },

  'indian-heritage': {
    id: 'indian-heritage',
    name: 'Indian Heritage',
    label: 'Indian Heritage',
    description:
      'Earthy terracotta and deep gold with traditional decorative accents — a rich, sophisticated menu that celebrates heritage craftsmanship.',
    css: {
      '--bg-primary': '#1D150E',
      '--bg-secondary': '#2A2015',
      '--bg-tertiary': '#35291C',
      '--bg-surface': '#2A2015',
      '--bg-surface-2': '#35291C',
      '--bg-surface-3': '#3E3223',
      '--bg-elevated': '#473B2A',
      '--gold': '#C69A6E',
      '--gold-bright': '#D4AF7C',
      '--gold-dim': '#8B6A42',
      '--gold-pale': '#E0C498',
      '--gold-deep': '#A37C4F',
      '--text-primary': '#E8E1D1',
      '--text-secondary': '#C9BAA0',
      '--text-muted': '#A69470',
      '--text-dimmed': '#806F4D',
      '--border-subtle': 'rgba(198,154,110,0.12)',
      '--border-light': 'rgba(198,154,110,0.22)',
      '--border-medium': 'rgba(198,154,110,0.34)',
      '--border-warm': 'rgba(198,154,110,0.10)',
      '--border-solid': '#5A4630',
      '--font-display': "'Cormorant Garamond', Georgia, serif",
      '--font-body': "'Inter', system-ui, sans-serif",
      '--d3-shadow-card': '0 1px 3px rgba(0,0,0,0.25)',
      '--d3-shadow-card-hover': '0 6px 24px rgba(0,0,0,0.40)',
      '--d3-shadow-elevated': '0 2px 10px rgba(0,0,0,0.30)',
    },
    layout: {
      cardVariant: 'outlined',
      categoryNav: 'boxed',
      header: 'standard',
      imageRatio: '4/3',
      containerMax: '720px',
      sectionGap: '2.5rem',
      borderRadius: '8px',
    },
  },

  'contemporary-premium': {
    id: 'contemporary-premium',
    name: 'Contemporary Premium',
    label: 'Contemporary Premium',
    description:
      'Neutral warmth with large imagery, strong typography, and minimalist borders — a clean editorial menu that puts every dish on a pedestal.',
    css: {
      '--bg-primary': '#F5F3EF',
      '--bg-secondary': '#EDEAE3',
      '--bg-tertiary': '#E0DED6',
      '--bg-surface': '#FFFFFF',
      '--bg-surface-2': '#F7F5EF',
      '--bg-surface-3': '#ECEAE1',
      '--bg-elevated': '#E0DED6',
      '--gold': '#A67C52',
      '--gold-bright': '#B8926A',
      '--gold-dim': '#7A6042',
      '--gold-pale': '#C9AA86',
      '--gold-deep': '#8A6B45',
      '--text-primary': '#1A1A1A',
      '--text-secondary': '#5A5A50',
      '--text-muted': '#8C8C7E',
      '--text-dimmed': '#AEB0A3',
      '--border-subtle': 'rgba(166,124,82,0.08)',
      '--border-light': 'rgba(166,124,82,0.16)',
      '--border-medium': 'rgba(166,124,82,0.26)',
      '--border-warm': 'rgba(0,0,0,0.04)',
      '--border-solid': '#DAD9D1',
      '--font-display': "'Manrope', 'Inter', system-ui, sans-serif",
      '--font-body': "'Inter', system-ui, sans-serif",
      '--d3-shadow-card': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
      '--d3-shadow-card-hover': '0 8px 28px rgba(0,0,0,0.08)',
      '--d3-shadow-elevated': '0 2px 6px rgba(0,0,0,0.06)',
    },
    layout: {
      cardVariant: 'outlined',
      categoryNav: 'underline',
      header: 'centered',
      imageRatio: '16/9',
      containerMax: '960px',
      sectionGap: '3rem',
      borderRadius: '0px',
    },
  },
  custom: {
    id: 'custom',
    name: 'Custom Theme',
    label: 'Custom Theme',
    description:
      'Fully personalized menu design with bespoke background, typography, colors, and layout tailored to your brand.',
    css: {
      '--bg-primary': '#121212',
      '--bg-secondary': '#1C1C1E',
      '--bg-tertiary': '#242426',
      '--bg-surface': '#1C1C1E',
      '--bg-surface-2': '#242426',
      '--bg-surface-3': '#2C2C2E',
      '--bg-elevated': '#38383A',
      '--gold': '#E5A93C',
      '--gold-bright': '#F0BC5E',
      '--gold-dim': '#8F661B',
      '--gold-pale': '#FADCA0',
      '--gold-deep': '#B88224',
      '--text-primary': '#F5F5F7',
      '--text-secondary': '#D1D1D6',
      '--text-muted': '#8E8E93',
      '--text-dimmed': '#636366',
      '--border-subtle': 'rgba(229,169,60,0.12)',
      '--border-light': 'rgba(229,169,60,0.22)',
      '--border-medium': 'rgba(229,169,60,0.35)',
      '--border-warm': 'rgba(255,255,255,0.08)',
      '--border-solid': '#38383A',
      '--font-display': "'Manrope', system-ui, sans-serif",
      '--font-body': "'Inter', system-ui, sans-serif",
    },
    layout: {
      cardVariant: 'rounded',
      categoryNav: 'pills',
      header: 'standard',
      imageRatio: '16/9',
      containerMax: '860px',
      sectionGap: '2rem',
      borderRadius: '12px',
    },
  },
};

/** The default theme applied when a hotel has no `menu_theme` set. */
export const DEFAULT_MENU_THEME: MenuThemeId = 'classic-luxury';

/** Ordered list of all themes (use for rendering picker grids). */
export const MENU_THEMES: MenuTheme[] = Object.values(themes);

/** Look up a theme by ID. Falls back to the default if unknown. */
export function getMenuTheme(id?: string | null): MenuTheme {
  if (id && id in themes) return themes[id as MenuThemeId];
  return themes[DEFAULT_MENU_THEME];
}

/** CSS class name applied to the root element for a given theme. */
export function menuThemeClass(id?: string | null): string {
  const theme = getMenuTheme(id);
  return `d3-theme-${theme.id}`;
}

/** Returns `true` when `id` is one of the five accepted theme values. */
export function isValidMenuTheme(id: unknown): id is MenuThemeId {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(themes, id);
}

export { themes };

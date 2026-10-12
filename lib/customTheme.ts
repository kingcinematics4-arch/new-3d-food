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
  /** 11. Header & navigation style */
  headerStyle: 'centered' | 'sticky-blur' | 'minimal' | 'boxed';
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
  { label: 'Sticky Blur Bar', value: 'sticky-blur', description: 'Modern floating glass header with status pill' },
  { label: 'Centered Stately', value: 'centered', description: 'Emblem in center with stately typography' },
  { label: 'Minimalist Clean', value: 'minimal', description: 'Uncluttered inline header with direct search' },
  { label: 'Framed Boxed', value: 'boxed', description: 'Framed header with double borders' },
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
      headerStyle: 'centered',
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
      headerStyle: 'minimal',
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
      headerStyle: 'boxed',
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
      headerStyle: 'minimal',
    },
  },
};

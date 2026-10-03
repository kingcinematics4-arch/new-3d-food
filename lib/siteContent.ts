// lib/siteContent.ts
//
// The single source of truth for the content of the public Dine3D website.
//
// This module is intentionally dependency-free (no Supabase, no `next/headers`,
// no `server-only`) so it can be imported from server components, route
// handlers AND client components without dragging secrets into the browser.
//
// DATA POLICY
// -----------
// There is deliberately no invented content in here. Every string that describes
// the product is the copy that already ships on the live Dine3D site; it is
// carried over so the redesign is preserved and becomes editable rather than
// replaced with placeholders.
//
// Sections that do not exist on the site yet (About, 3D Food Menu, AR, QR
// Ordering, Restaurant Dashboard, Analytics, Contact) ship DISABLED with empty
// strings and empty arrays, so they render as an explicit "not configured yet"
// empty state instead of fake copy, fake statistics, fake testimonials, fake
// restaurants, fake customers, fake revenue or fake menu items.

import { z } from 'zod';

/* ============================================================
   SHARED PRIMITIVES
   ============================================================ */

const hexColor = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a hex colour such as #B8A47A');

/** Free text the owner types into the panel. */
const text = (max: number) => z.string().trim().max(max);

/** A value the owner did not fill in. Rendered as an empty state, never invented. */
const optionalText = (max: number) => text(max).default('');

/**
 * An internal link or asset path.
 * `javascript:` / `data:` are rejected so a published document can never carry
 * an executable URL through the admin panel. `mailto:` and `tel:` are allowed
 * because the pricing and contact sections legitimately link out to email and
 * phone.
 */
const safePath = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) => v === '' || /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(v),
      'Must be an https URL, a mailto:/tel: link, a site path starting with /, or an anchor (#)'
    )
    .default('');

const shortId = z.string().trim().min(1).max(64);

/* ============================================================
   OPTION ALLOWLISTS
   Only fixed vocabularies are accepted. The admin can pick from these, never
   submit arbitrary CSS / HTML / font strings.
   ============================================================ */

export const TYPOGRAPHY_OPTIONS = [
  { value: 'editorial', label: 'Editorial Serif', description: 'Cormorant Garamond display with Inter body' },
  { value: 'modern', label: 'Modern Sans', description: 'Inter throughout, tighter and more neutral' },
  { value: 'classic', label: 'Classic Serif', description: 'Cormorant Garamond for display and body' },
] as const;

export const BUTTON_STYLE_OPTIONS = [
  { value: 'outline', label: 'Outline', description: 'Charcoal body, champagne hairline' },
  { value: 'ghost', label: 'Ghost', description: 'Transparent, hairline border only' },
  { value: 'solid', label: 'Solid', description: 'Filled champagne, near-black type' },
] as const;

export const ICON_OPTIONS = [
  'cube',
  'phone',
  'qr',
  'chart',
  'palette',
  'bolt',
  'sparkle',
  'shield',
  'globe',
  'utensils',
  'camera',
  'grid',
  'clock',
  'layers',
  'star',
] as const;

const iconName = z.enum(ICON_OPTIONS);
export type IconName = (typeof ICON_OPTIONS)[number];

/** Accent swatches offered in the branding editor. All inside the Dine3D identity. */
export const ACCENT_PRESETS = [
  { value: '#B8A47A', label: 'Champagne' },
  { value: '#C9A96E', label: 'Muted Gold' },
  { value: '#CDB98F', label: 'Pale Champagne' },
  { value: '#9A8760', label: 'Deep Bronze' },
  { value: '#A89684', label: 'Warm Taupe' },
  { value: '#C2BCB0', label: 'Ivory Stone' },
] as const;

export const BACKGROUND_PRESETS = [
  { value: '#0B0B0A', label: 'Near Black' },
  { value: '#0D0D0C', label: 'Soft Black' },
  { value: '#121210', label: 'Charcoal' },
  { value: '#14130F', label: 'Warm Charcoal' },
] as const;

/* ============================================================
   BRANDING
   ============================================================ */

const brandingSchema = z.object({
  /** Official Dine3D logo. Defaults to the shipped asset; never redrawn. */
  logoUrl: z.string().trim().max(300).default('/images/dine3d-logo.jpg'),
  logoAlt: optionalText(120),
  faviconUrl: safePath(300),
  typography: z.enum(['editorial', 'modern', 'classic']).default('editorial'),
  accentColor: hexColor.default('#B8A47A'),
  backgroundColor: hexColor.default('#0B0B0A'),
  buttonStyle: z.enum(['outline', 'ghost', 'solid']).default('outline'),
});
export type Branding = z.infer<typeof brandingSchema>;

/* ============================================================
   SECTION CONTENT
   Every section can be switched off independently.
   ============================================================ */

const heroStatSchema = z.object({
  id: shortId,
  value: optionalText(40),
  label: optionalText(60),
});
export type HeroStat = z.infer<typeof heroStatSchema>;

const heroSchema = z.object({
  enabled: z.boolean().default(true),
  showEyebrow: z.boolean().default(true),
  showSecondaryCta: z.boolean().default(true),
  showStats: z.boolean().default(true),
  showViewer: z.boolean().default(true),
  eyebrow: optionalText(60),
  /** First line of the headline. */
  heading: optionalText(120),
  /** Second line, rendered in the accent italic treatment. */
  headingAccent: optionalText(120),
  subheading: optionalText(400),
  secondaryText: optionalText(400),
  ctaText: optionalText(40),
  ctaHref: safePath(300),
  secondaryCtaText: optionalText(40),
  secondaryCtaHref: safePath(300),
  imageUrl: safePath(300),
  imageAlt: optionalText(160),
  viewerTitle: optionalText(80),
  viewerCaption: optionalText(160),
  stats: z.array(heroStatSchema).max(6).default([]),
});
export type Hero = z.infer<typeof heroSchema>;

/** Generic editorial block used by the sections that are not yet configured. */
const editorialSectionSchema = z.object({
  enabled: z.boolean().default(false),
  eyebrow: optionalText(60),
  heading: optionalText(140),
  headingAccent: optionalText(140),
  body: optionalText(1200),
  imageUrl: safePath(300),
  imageAlt: optionalText(160),
  primaryCtaText: optionalText(40),
  primaryCtaHref: safePath(300),
  items: z.array(z.object({ id: shortId, title: optionalText(80), description: optionalText(300) })).max(24).default([]),
});
export type EditorialSection = z.infer<typeof editorialSectionSchema>;

const featureSchema = z.object({
  id: shortId,
  enabled: z.boolean().default(true),
  icon: iconName.default('cube'),
  eyebrow: optionalText(40),
  title: optionalText(80),
  description: optionalText(400),
  imageUrl: safePath(300),
});
export type Feature = z.infer<typeof featureSchema>;

const featuresSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrow: optionalText(60),
  heading: optionalText(140),
  headingAccent: optionalText(140),
  body: optionalText(600),
  items: z.array(featureSchema).max(24).default([]),
});
export type Features = z.infer<typeof featuresSchema>;

const planSchema = z.object({
  id: shortId,
  enabled: z.boolean().default(true),
  name: optionalText(60),
  tagline: optionalText(80),
  price: optionalText(40),
  period: optionalText(30),
  features: z.array(optionalText(120)).max(24).default([]),
  ctaText: optionalText(40),
  ctaHref: safePath(300),
  featured: z.boolean().default(false),
});
export type Plan = z.infer<typeof planSchema>;

const pricingSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrow: optionalText(60),
  heading: optionalText(140),
  headingAccent: optionalText(140),
  body: optionalText(600),
  plans: z.array(planSchema).max(6).default([]),
});
export type Pricing = z.infer<typeof pricingSchema>;

const stepSchema = z.object({
  id: shortId,
  enabled: z.boolean().default(true),
  label: optionalText(60),
  description: optionalText(300),
});
export type Step = z.infer<typeof stepSchema>;

const howItWorksSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrow: optionalText(60),
  heading: optionalText(140),
  headingAccent: optionalText(140),
  body: optionalText(600),
  steps: z.array(stepSchema).max(12).default([]),
});
export type HowItWorks = z.infer<typeof howItWorksSchema>;

const faqItemSchema = z.object({
  id: shortId,
  question: optionalText(200),
  answer: optionalText(1200),
});
export type FaqItem = z.infer<typeof faqItemSchema>;

const faqSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrow: optionalText(60),
  heading: optionalText(140),
  headingAccent: optionalText(140),
  body: optionalText(600),
  items: z.array(faqItemSchema).max(40).default([]),
});
export type Faq = z.infer<typeof faqSchema>;

const contactSchema = z.object({
  enabled: z.boolean().default(false),
  eyebrow: optionalText(60),
  heading: optionalText(140),
  headingAccent: optionalText(140),
  body: optionalText(600),
  email: text(200).default(''),
  phone: optionalText(60),
  address: optionalText(240),
});
export type Contact = z.infer<typeof contactSchema>;

const footerLinkSchema = z.object({
  id: shortId,
  label: optionalText(60),
  href: safePath(300),
});
export type FooterLink = z.infer<typeof footerLinkSchema>;

const footerColumnSchema = z.object({
  id: shortId,
  title: optionalText(40),
  links: z.array(footerLinkSchema).max(12).default([]),
});
export type FooterColumn = z.infer<typeof footerColumnSchema>;

const footerSchema = z.object({
  enabled: z.boolean().default(true),
  tagline: optionalText(120),
  description: optionalText(400),
  copyrightText: optionalText(200),
  closingHeading: optionalText(140),
  closingAccent: optionalText(140),
  closingBody: optionalText(400),
  closingCtaText: optionalText(40),
  closingCtaHref: safePath(300),
  closingSecondaryCtaText: optionalText(40),
  closingSecondaryCtaHref: safePath(300),
  columns: z.array(footerColumnSchema).max(6).default([]),
});
export type Footer = z.infer<typeof footerSchema>;

/* ============================================================
   DOCUMENT
   ============================================================ */

export const siteContentSchema = z.object({
  version: z.literal(1).default(1),
  branding: brandingSchema.default({}),
  hero: heroSchema.default({}),
  about: editorialSectionSchema.default({}),
  features: featuresSchema.default({}),
  menu3d: editorialSectionSchema.default({}),
  ar: editorialSectionSchema.default({}),
  qr: editorialSectionSchema.default({}),
  dashboard: editorialSectionSchema.default({}),
  analytics: editorialSectionSchema.default({}),
  pricing: pricingSchema.default({}),
  howItWorks: howItWorksSchema.default({}),
  faq: faqSchema.default({}),
  contact: contactSchema.default({}),
  footer: footerSchema.default({}),
});

export type SiteContent = z.infer<typeof siteContentSchema>;

/** Keys an admin can toggle independently, in the order they appear on the site. */
export const SECTION_KEYS = [
  'hero',
  'about',
  'features',
  'menu3d',
  'ar',
  'qr',
  'dashboard',
  'analytics',
  'pricing',
  'howItWorks',
  'faq',
  'contact',
  'footer',
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  hero: 'Hero',
  about: 'About Dine3D',
  features: 'Features',
  menu3d: '3D Food Menu',
  ar: 'AR Experience',
  qr: 'QR Ordering',
  dashboard: 'Restaurant Dashboard',
  analytics: 'Analytics',
  pricing: 'Pricing',
  howItWorks: 'How It Works',
  faq: 'FAQ',
  contact: 'Contact',
  footer: 'Footer',
};

export const SECTION_DESCRIPTIONS: Record<SectionKey, string> = {
  hero: 'The first screen. Headline, supporting copy and calls to action.',
  about: 'Editorial introduction to the Dine3D platform.',
  features: 'Grid of capability cards.',
  menu3d: 'How dishes are presented in interactive 3D.',
  ar: 'Native augmented reality placement on guest devices.',
  qr: 'The QR entry point used at the table.',
  dashboard: 'The restaurant-side control panel.',
  analytics: 'Reporting available to restaurants.',
  pricing: 'Subscription plans and what each one includes.',
  howItWorks: 'Numbered walkthrough of the guest journey.',
  faq: 'Questions and answers.',
  contact: 'Direct contact details for the Dine3D team.',
  footer: 'Closing call to action, link columns and legal line.',
};

/* ============================================================
   DEFAULTS
   Existing live copy, so nothing that is already published is lost.
   Newly introduced sections stay disabled and empty.
   ============================================================ */

const emptyEditorial = {
  enabled: false,
  eyebrow: '',
  heading: '',
  headingAccent: '',
  body: '',
  imageUrl: '',
  imageAlt: '',
  primaryCtaText: '',
  primaryCtaHref: '',
  items: [],
};

export const DEFAULT_SITE_CONTENT: SiteContent = siteContentSchema.parse({
  version: 1,

  branding: {
    logoUrl: '/images/dine3d-logo.jpg',
    logoAlt: 'Dine3D',
    faviconUrl: '',
    typography: 'editorial',
    accentColor: '#B8A47A',
    backgroundColor: '#0B0B0A',
    buttonStyle: 'outline',
  },

  hero: {
    enabled: true,
    showEyebrow: true,
    showSecondaryCta: true,
    showStats: true,
    showViewer: true,
    eyebrow: 'DINE3D',
    heading: 'See your meal',
    headingAccent: 'before you order.',
    subheading: 'Turn your restaurant menu into an interactive 3D dining experience.',
    secondaryText: 'Scan a QR code. Explore dishes in 3D. Understand your meal before ordering.',
    ctaText: 'Start Free',
    ctaHref: '/signup',
    secondaryCtaText: 'See How It Works',
    secondaryCtaHref: '/#how-it-works',
    imageUrl: '',
    imageAlt: '',
    viewerTitle: 'Upload your own GLB',
    viewerCaption: 'Menus, prices and 3D models come from your data',
    stats: [
      { id: 'stat-1', value: '360°', label: '3D MENU VIEWER' },
      { id: 'stat-2', value: 'GLB / USDZ', label: 'YOUR OWN MODELS' },
      { id: 'stat-3', value: 'No App', label: 'SCAN AND ORDER' },
    ],
  },

  about: { ...emptyEditorial },

  features: {
    enabled: true,
    eyebrow: 'CAPABILITIES',
    heading: 'Crafted for',
    headingAccent: 'modern dining',
    body: 'Everything you need to bring your menu into the physical world — beautifully.',
    items: [
      {
        id: 'feat-1',
        enabled: true,
        icon: 'cube',
        eyebrow: 'VISUALIZATION',
        title: 'Photoreal 3D Models',
        description: 'Bring every dish to life with immersive 3D visualization, realistic lighting, materials and presentation.',
        imageUrl: '',
      },
      {
        id: 'feat-2',
        enabled: true,
        icon: 'phone',
        eyebrow: 'MOBILE',
        title: 'Native AR Experiences',
        description: 'Let guests explore dishes directly from their phones through immersive augmented reality.',
        imageUrl: '',
      },
      {
        id: 'feat-3',
        enabled: true,
        icon: 'qr',
        eyebrow: 'QR',
        title: 'Instant QR Menus',
        description: 'Give every restaurant a simple QR-powered entry point into the complete Dine3D experience.',
        imageUrl: '',
      },
      {
        id: 'feat-4',
        enabled: true,
        icon: 'chart',
        eyebrow: 'DATA',
        title: 'Live Analytics',
        description: 'Understand scans, menu interactions, popular dishes and customer engagement in real time.',
        imageUrl: '',
      },
      {
        id: 'feat-5',
        enabled: true,
        icon: 'palette',
        eyebrow: 'BRANDING',
        title: 'Your Brand, Elevated',
        description: "Customize the experience with your restaurant's logo, colors, menu and brand identity.",
        imageUrl: '',
      },
      {
        id: 'feat-6',
        enabled: true,
        icon: 'bolt',
        eyebrow: 'PERFORMANCE',
        title: 'Fast Everywhere',
        description: 'Optimized for fast loading, mobile devices and modern web experiences globally.',
        imageUrl: '',
      },
    ],
  },

  menu3d: { ...emptyEditorial },
  ar: { ...emptyEditorial },
  qr: { ...emptyEditorial },
  dashboard: { ...emptyEditorial },
  analytics: { ...emptyEditorial },

  pricing: {
    enabled: true,
    eyebrow: 'PRICING',
    heading: 'Simple,',
    headingAccent: 'transparent pricing.',
    body: '',
    plans: [
      {
        id: 'plan-1',
        enabled: true,
        name: 'Starter',
        tagline: 'For small restaurants',
        price: '$29',
        period: '/month',
        features: ['Up to 30 menu items', '5 3D models included', 'QR code generator', 'Basic analytics', 'Standard support'],
        ctaText: 'Get Started',
        ctaHref: '/signup',
        featured: false,
      },
      {
        id: 'plan-2',
        enabled: true,
        name: 'Pro',
        tagline: 'For growing restaurants',
        price: '$79',
        period: '/month',
        features: [
          'Unlimited menu items',
          '50 3D models included',
          'AR experiences',
          'Advanced analytics',
          'Custom branding',
          'Priority support',
        ],
        ctaText: 'Get Started',
        ctaHref: '/signup',
        featured: true,
      },
      {
        id: 'plan-3',
        enabled: true,
        name: 'Enterprise',
        tagline: 'For restaurant groups & hotels',
        price: 'Custom',
        period: '',
        features: [
          'Multiple restaurant locations',
          'Unlimited 3D models',
          'White-label platform',
          'Dedicated account manager',
          'Custom integrations',
          'SLA guaranteed',
        ],
        ctaText: 'Contact Sales',
        ctaHref: 'mailto:hello@dine3d.com',
        featured: false,
      },
    ],
  },

  howItWorks: {
    enabled: true,
    eyebrow: 'THE EXPERIENCE',
    heading: 'From QR code',
    headingAccent: 'to table.',
    body: '',
    steps: [
      { id: 'step-1', enabled: true, label: 'Scan', description: "Guests scan the restaurant's Dine3D QR code." },
      { id: 'step-2', enabled: true, label: 'Explore', description: 'They browse the menu and inspect dishes through interactive 3D experiences.' },
      { id: 'step-3', enabled: true, label: 'Customize', description: 'They select quantity, preferences and special instructions.' },
      { id: 'step-4', enabled: true, label: 'Order', description: 'They add items to the cart and place the order.' },
      { id: 'step-5', enabled: true, label: 'Prepare', description: 'The restaurant receives the order instantly through its dashboard.' },
      { id: 'step-6', enabled: true, label: 'Serve', description: 'Restaurant staff update the order status until it is completed.' },
    ],
  },

  faq: {
    enabled: true,
    eyebrow: 'QUESTIONS',
    heading: 'Frequently',
    headingAccent: 'asked.',
    body: "Everything you need to know about Dine3D. Can't find an answer? Contact us.",
    items: [
      { id: 'faq-1', question: 'What is Dine3D?', answer: 'Dine3D is a premium restaurant technology platform that transforms static menus into interactive 3D and AR dining experiences, accessible through a simple QR code.' },
      { id: 'faq-2', question: 'How does the QR menu work?', answer: 'Each restaurant gets a unique QR code. Guests scan it with any smartphone camera — no app download required — and instantly access the 3D menu experience.' },
      { id: 'faq-3', question: 'Does Dine3D support AR?', answer: 'Yes. Where supported by the device (iOS via Safari, Android via Chrome), guests can place dishes in their real environment using native augmented reality.' },
      { id: 'faq-4', question: 'Can restaurants upload their own 3D models?', answer: 'Yes. Restaurants upload their own GLB and USDZ models per dish through the dashboard. A dish only appears in 3D once its model is saved.' },
      { id: 'faq-5', question: 'Can I customize my menu?', answer: 'Absolutely. Each restaurant has full control over branding: logo, colors, typography, cover image, categories and every dish detail.' },
      { id: 'faq-6', question: 'How does ordering work?', answer: 'Guests browse the 3D menu, add items to cart, add notes, and place orders. The restaurant receives orders instantly in the dashboard and kitchen display.' },
      { id: 'faq-7', question: 'Can customers add special instructions?', answer: 'Yes. Customers can add special instructions for each item as well as a general note with the order.' },
      { id: 'faq-8', question: 'Can I track analytics?', answer: 'Yes. The analytics dashboard shows QR scans, menu views, dish interactions, AR launches, popular dishes, orders, revenue, and conversion rates.' },
      { id: 'faq-9', question: 'Does it work on mobile?', answer: 'Dine3D is built mobile-first. The customer menu experience is optimized for smartphones since most guests access it via QR code on their phone.' },
      { id: 'faq-10', question: 'Can multiple restaurants use one Dine3D account?', answer: "Each restaurant gets its own account and isolated dashboard. For multi-location restaurant groups, our Enterprise plan supports multiple locations under one management view." },
    ],
  },

  contact: {
    enabled: false,
    eyebrow: '',
    heading: '',
    headingAccent: '',
    body: '',
    email: '',
    phone: '',
    address: '',
  },

  footer: {
    enabled: true,
    tagline: 'SEE IT. EXPERIENCE IT. DINE IT.',
    description: 'The premium 3D restaurant menu platform for modern hospitality.',
    copyrightText: '© Dine3D. All rights reserved.',
    closingHeading: 'Bring your menu',
    closingAccent: 'to life in 3D.',
    closingBody: 'Create your restaurant and publish your own menu.',
    closingCtaText: 'Start Free Today',
    closingCtaHref: '/signup',
    closingSecondaryCtaText: 'Sign In to Dashboard',
    closingSecondaryCtaHref: '/login',
    columns: [
      {
        id: 'col-1',
        title: 'PRODUCT',
        links: [
          { id: 'link-1', label: 'Features', href: '/#features' },
          { id: 'link-2', label: 'How It Works', href: '/#how-it-works' },
          { id: 'link-3', label: 'Pricing', href: '/#pricing' },
          { id: 'link-4', label: 'FAQ', href: '/#faq' },
        ],
      },
      {
        id: 'col-2',
        title: 'COMPANY',
        links: [
          { id: 'link-5', label: 'About', href: '/#about' },
          { id: 'link-6', label: 'Contact', href: '/#contact' },
        ],
      },
      {
        id: 'col-3',
        title: 'LEGAL',
        links: [
          { id: 'link-7', label: 'Privacy', href: '#' },
          { id: 'link-8', label: 'Terms', href: '#' },
        ],
      },
    ],
  },
});

/* ============================================================
   NORMALISATION
   ============================================================ */

/**
 * Turns arbitrary stored JSON into a document the rest of the app can trust.
 * Never throws: a corrupt or partially-written row degrades field-by-field into
 * the defaults instead of taking the website down.
 */
export function normalizeSiteContent(input: unknown): SiteContent {
  const result = siteContentSchema.safeParse(input);
  if (result.success) return result.data;

  // Salvage what we can from a document that only partially validates.
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const salvaged: Record<string, unknown> = {};
  for (const key of Object.keys(siteContentSchema.shape)) {
    const fieldSchema = siteContentSchema.shape[key as keyof typeof siteContentSchema.shape];
    if (!fieldSchema) continue;
    const parsed = fieldSchema.safeParse(raw[key]);
    salvaged[key] = parsed.success ? parsed.data : (fieldSchema as z.ZodDefault<z.ZodTypeAny>)._def.defaultValue();
  }

  const second = siteContentSchema.safeParse(salvaged);
  return second.success ? second.data : DEFAULT_SITE_CONTENT;
}

/** Short, collision-resistant enough for list item keys. */
export function createItemId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}${random}`;
}
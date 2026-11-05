// lib/menu.ts
import { z } from 'zod';

export const menuItemSchema = z.object({
  id: z.string().optional(),
  category_id: z.string().uuid().nullable().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  image_url: z.string().optional(),
  model_url_glb: z.string().optional(),
  model_url_usdz: z.string().optional(),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_popular: z.boolean().default(false),
  is_veg: z.boolean().default(false),
  allergens: z.array(z.string()).default([]),
  rating: z.number().min(0).max(5).default(0),
  order_count: z.number().int().default(0),
  dietary_tags: z.array(z.string()).default([]),
  calories: z.number().optional(),
  preparation_time_mins: z.number().optional(),
  ingredients: z.array(z.string()).default([]),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;

export interface MenuItem {
  id: string;
  hotel_id: string;
  category_id?: string;
  category?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  model_url_glb?: string;
  model_url_usdz?: string;
  is_available: boolean;
  is_featured: boolean;
  is_popular: boolean;
  is_veg: boolean;
  allergens?: string[];
  rating: number;
  order_count: number;
  dietary_tags?: string[];
  calories?: number;
  preparation_time_mins?: number;
  ingredients?: string[];
  created_at?: string;
}

export interface PublicHotel {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  currency?: string | null;
  welcome_text?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  menu_style?: string | null;
  card_style?: string | null;
  dark_mode?: boolean;
  typography?: string | null;
  menu_theme?: string | null;
  tax_rate?: number;
  service_charge?: number;
  city?: string | null;
}

// There is no preset model library: a dish is only shown in 3D once the
// restaurant has stored its own GLB/USDZ file for that dish.

// ============================================================
// CURRENCY FORMATTING
//
// Dine3D is built for the Indian F&B market, so the default currency
// for every restaurant is INR (₹) with en-IN locale. A restaurant can
// still override its currency in the dashboard, but until it does,
// every price renders in INR.
//
// The shared `formatPrice` below is the ONLY place in the application
// that turns a numeric price into a display string. Every component
// must import it from here — no component may hardcode a `$` symbol
// or roll its own `toFixed`/`toLocaleString` for prices.
//
// Stored numeric prices are NEVER converted, multiplied or divided.
// ============================================================

const DEFAULT_CURRENCY = 'INR';

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  NZD: 'NZ$',
  AED: 'AED ',
  SAR: 'SAR ',
  QAR: 'QR ',
  KWD: 'KD ',
  BRL: 'R$',
  MXN: 'MX$',
  ARS: 'AR$',
  COP: 'COL$',
  ZAR: 'R',
  NGN: '₦',
  KES: 'KSh ',
  GHS: 'GH₵',
  EGP: 'E£',
  MAD: 'MAD ',
  LKR: 'Rs ',
  NPR: 'Rs ',
  PKR: '₨',
  BDT: '৳',
  IDR: 'Rp ',
  MYR: 'RM ',
  THB: '฿',
  VND: '₫',
  PHP: '₱',
  RUB: '₽',
  UAH: '₴',
  TRY: '₺',
  CHF: 'CHF ',
  SEK: 'kr ',
  NOK: 'kr ',
  DKK: 'kr ',
  PLN: 'zł ',
};

const ZERO_DECIMAL_CURRENCIES = new Set([
  'JPY', 'KRW', 'VND', 'CLP', 'COP', 'ISK', 'IDR', 'PYG', 'RWF', 'UGX', 'XOF', 'XAF',
]);

// ISO 4217 currency codes that use the Indian lakh/crore grouping.
const INDIAN_GROUPING_CURRENCIES = new Set([
  'INR', 'NPR', 'LKR', 'PKR', 'BDT',
]);

function currencyLocale(code: string): string {
  return INDIAN_GROUPING_CURRENCIES.has(code) ? 'en-IN' : 'en-US';
}

/**
 * Resolve a free-text currency string (e.g. "INR (₹)") to its ISO
 * 4217 code, symbol and decimal places. Defaults to INR when the
 * value is empty or unrecognised.
 */
export function resolveCurrency(code?: string | null): { symbol: string; decimals: number } {
  const raw = (code || '').trim();
  if (!raw) return { symbol: CURRENCY_SYMBOLS[DEFAULT_CURRENCY], decimals: 2 };

  const key = raw.split(/[\s(\[]/)[0].toUpperCase();
  const symbol =
    CURRENCY_SYMBOLS[key] ||
    raw.match(/\(([^)]+)\)/)?.[1] ||
    (/[A-Za-z]{2,}/.test(raw) ? `${raw} ` : raw);

  return { symbol, decimals: ZERO_DECIMAL_CURRENCIES.has(key) ? 0 : 2 };
}

/**
 * Normalise a stored currency value to INR for display.
 *
 * Dine3D is built for the Indian F&B market, so every restaurant is
 * rendered in INR regardless of what the `currency` column holds.
 * This is a DISPLAY-ONLY normalisation: it never touches numeric
 * prices, tax, service charge, payment amounts or historical order
 * rows. Those remain byte-for-byte unchanged.
 *
 * Values that already use INR (or an Indian-rupee variant) pass
 * through unchanged. Any USD / dollar / `$`-only value is mapped to
 * the INR default so the shared formatter always emits `₹`.
 */
export function normalizeCurrency(code?: string | null): string {
  const raw = (code || '').trim();
  if (!raw) return 'INR (₹)';

  const lower = raw.toLowerCase();
  const looksInr =
    lower.includes('inr') ||
    lower.includes('₹') ||
    lower.includes('rupee') ||
    lower.includes('rupees');

  if (looksInr) return 'INR (₹)';

  // Anything USD / dollar / $-only is treated as INR for display.
  if (
    lower.includes('usd') ||
    lower.includes('dollar') ||
    lower.includes('$') ||
    lower === 'usd' ||
    lower === 'usd ($)' ||
    lower === 'usd($)' ||
    lower === '$'
  ) {
    return 'INR (₹)';
  }

  // Unknown / foreign currencies pass through so non-Indian
  // restaurants can still display their own currency.
  return raw;
}

/**
 * Shared currency formatter.
 *
 * Uses `Intl.NumberFormat` with `style: 'currency'` so the output always
 * contains the correct symbol and grouping for the currency. INR prices
 * render as `₹1,500.00` (en-IN grouping); other currencies fall back to
 * the default `en-US` grouping.
 *
 * The numeric `price` is never altered — only its display string.
 */
export function formatPrice(price: number, currency?: string | null): string {
  // Normalise the stored currency to INR for display BEFORE
  // formatting. This guarantees that even if a restaurant's
  // `currency` column still holds a legacy USD value, every price
  // renders with the ₹ symbol. The numeric `price` is never
  // altered — only the display string.
  const normalized = normalizeCurrency(currency);
  const raw = normalized.trim();
  let code = raw.split(/[\s(\[]/)[0].toUpperCase();
  if (!code) code = DEFAULT_CURRENCY;

  const value = typeof price === 'number' && Number.isFinite(price) ? price : 0;
  const decimals = ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 2;

  try {
    return new Intl.NumberFormat(currencyLocale(code), {
      style: 'currency',
      currency: code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    // Unknown currency code — fall back to symbol + plain number.
    const symbol = CURRENCY_SYMBOLS[code] || CURRENCY_SYMBOLS[DEFAULT_CURRENCY] || '';
    return `${symbol}${value.toFixed(decimals)}`;
  }
}
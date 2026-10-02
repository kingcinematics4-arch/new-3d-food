// lib/menu.ts
import { z } from 'zod';

export const menuItemSchema = z.object({
  id: z.string().optional(),
  category_id: z.string().optional(),
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

// There is no preset model library: a dish is only shown in 3D once the
// restaurant has stored its own GLB/USDZ file for that dish.

// ============================================================
// CURRENCY FORMATTING
// The hotel's `currency` column stores a free-text value such as
// "USD ($)" or "INR (₹)". We resolve it to a symbol so prices render
// in whatever currency the restaurant actually set in Supabase.
// ============================================================

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

export function resolveCurrency(code?: string | null): { symbol: string; decimals: number } {
  const raw = (code || '').trim();
  if (!raw) return { symbol: '$', decimals: 2 };

  const key = raw.split(/[\s(\[]/)[0].toUpperCase();
  const symbol =
    CURRENCY_SYMBOLS[key] ||
    raw.match(/\(([^)]+)\)/)?.[1] ||
    (/[A-Za-z]{2,}/.test(raw) ? `${raw} ` : raw);

  return { symbol, decimals: ZERO_DECIMAL_CURRENCIES.has(key) ? 0 : 2 };
}

export function formatPrice(price: number, currency?: string | null): string {
  const { symbol, decimals } = resolveCurrency(currency);
  const value = typeof price === 'number' && Number.isFinite(price) ? price : 0;
  return `${symbol}${value.toFixed(decimals)}`;
}

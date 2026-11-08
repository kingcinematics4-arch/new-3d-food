// lib/waterSettings.ts
// Water ordering configuration and types

export interface WaterSizeOption {
  size: string; // e.g. "250ml", "500ml", "1L"
  price: number;
  enabled: boolean;
}

export interface WaterTypeConfig {
  enabled: boolean;
  price: number; // For normal water, always 0
  sizes?: WaterSizeOption[];
}

export interface HotelWaterSettings {
  normal: WaterTypeConfig;
  mineral: WaterTypeConfig;
  cold: WaterTypeConfig;
}

export const DEFAULT_WATER_SETTINGS: HotelWaterSettings = {
  normal: {
    enabled: true,
    price: 0,
  },
  mineral: {
    enabled: true,
    price: 20,
    sizes: [
      { size: '500ml', price: 10, enabled: true },
      { size: '1L', price: 20, enabled: true },
    ],
  },
  cold: {
    enabled: true,
    price: 25,
    sizes: [
      { size: '500ml', price: 15, enabled: true },
      { size: '1L', price: 25, enabled: true },
    ],
  },
};

export function sanitizeWaterSettings(raw: any): HotelWaterSettings {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_WATER_SETTINGS;
  }

  const normal: WaterTypeConfig = {
    enabled: raw.normal?.enabled ?? true,
    price: 0, // Normal water is ALWAYS 0 / free
  };

  const sanitizeSizes = (sizesRaw: any[]): WaterSizeOption[] => {
    if (!Array.isArray(sizesRaw)) return [];
    return sizesRaw.map((s) => ({
      size: String(s?.size || '').trim(),
      price: Math.max(0, Number(s?.price) || 0),
      enabled: s?.enabled !== false,
    })).filter((s) => s.size.length > 0);
  };

  const mineral: WaterTypeConfig = {
    enabled: raw.mineral?.enabled ?? true,
    price: Math.max(0, Number(raw.mineral?.price) || 0),
    sizes: Array.isArray(raw.mineral?.sizes)
      ? sanitizeSizes(raw.mineral.sizes)
      : DEFAULT_WATER_SETTINGS.mineral.sizes,
  };

  const cold: WaterTypeConfig = {
    enabled: raw.cold?.enabled ?? true,
    price: Math.max(0, Number(raw.cold?.price) || 0),
    sizes: Array.isArray(raw.cold?.sizes)
      ? sanitizeSizes(raw.cold.sizes)
      : DEFAULT_WATER_SETTINGS.cold.sizes,
  };

  return { normal, mineral, cold };
}

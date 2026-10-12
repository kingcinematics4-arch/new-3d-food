// lib/customThemeStore.server.ts
// Server-only per-hotel custom theme configuration storage.
// Persists each hotel's custom configuration independently so Hotel A's
// custom theme can NEVER affect Hotel B.
import { promises as fs } from 'fs';
import path from 'path';
import { CustomThemeConfig, DEFAULT_CUSTOM_THEME } from './customTheme';

const STORE_PATH = path.join(process.cwd(), 'data', 'custom-themes.json');

export async function readCustomThemeStore(): Promise<Record<string, CustomThemeConfig>> {
  try {
    const content = await fs.readFile(STORE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function writeCustomThemeStore(data: Record<string, CustomThemeConfig>): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/** Get the saved custom theme for a specific hotel (or null if none) */
export async function getStoredCustomTheme(hotelId: string): Promise<CustomThemeConfig | null> {
  if (!hotelId) return null;
  const store = await readCustomThemeStore();
  return store[hotelId] || null;
}

/** Save a custom theme strictly for a specific hotel */
export async function setStoredCustomTheme(hotelId: string, config: CustomThemeConfig): Promise<void> {
  if (!hotelId) return;
  const store = await readCustomThemeStore();
  store[hotelId] = config;
  await writeCustomThemeStore(store);
}

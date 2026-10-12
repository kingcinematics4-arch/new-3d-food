import { promises as fs } from 'fs';
import path from 'path';

const STORE_PATH = path.join(process.cwd(), 'data', 'menu-themes.json');

export async function readThemeStore(): Promise<Record<string, string>> {
  try {
    const content = await fs.readFile(STORE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function writeThemeStore(data: Record<string, string>): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getStoredMenuTheme(hotelId: string): Promise<string | null> {
  const store = await readThemeStore();
  return store[hotelId] || null;
}

export async function setStoredMenuTheme(hotelId: string, theme: string): Promise<void> {
  const store = await readThemeStore();
  store[hotelId] = theme;
  await writeThemeStore(store);
}

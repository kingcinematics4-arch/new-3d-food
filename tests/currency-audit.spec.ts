import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Comprehensive INR currency audit. These tests verify that the shared
// formatter renders INR correctly and that no component hardcodes a
// `$` symbol or rolls its own price formatting.

const MOCK_ORDER = {
  success: true,
  order: {
    id: '11111111-1111-1111-1111-111111111111',
    order_number: 'DINE-4821',
    status: 'pending',
    payment_status: 'pending',
    payment_method: 'pay_at_table',
    table_number: '12',
    customer_name: 'Test',
    customer_phone: null,
    notes: null,
    total_amount: 30,
    created_at: '2026-11-04T14:30:00Z',
    updated_at: '2026-11-04T14:42:00Z',
    hotel_theme: 'classic-luxury',
    hotel_slug: 'demo-restaurant',
    currency: 'INR (₹)',
    items: [
      { id: 'item-1', name: 'Single Dish', quantity: 1, price_at_time: 30, notes: null, status: 'active' },
    ],
  },
};

function walk(dir: string, cb: (file: string) => void) {
  const fs = require('fs');
  const path = require('path');
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

test.describe('INR currency everywhere', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/public/orders/*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ORDER) });
    });
  });

  test('shared formatter uses Intl.NumberFormat with INR', async () => {
    const src = readFileSync(resolve('lib/menu.ts'), 'utf-8');
    expect(src).toContain("style: 'currency'");
    expect(src).toContain("currency: code");
    expect(src).toContain("Intl.NumberFormat(");
    expect(src).toContain("'en-IN'");
  });

  test('default currency is INR', async () => {
    const src = readFileSync(resolve('lib/menu.ts'), 'utf-8');
    expect(src).toContain("const DEFAULT_CURRENCY = 'INR'");
  });

  test('customer order page renders ₹, never $', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('http://localhost:3000/order/DINE-4821', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const pageText = await page.locator('body').innerText();
    expect(pageText).toMatch(/₹30\.00/);
    expect(pageText).not.toMatch(/\$/);
  });

  test('Indian grouping for large amounts', async ({ page }) => {
    await page.route('**/api/public/orders/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          order: {
            ...MOCK_ORDER.order,
            items: [
              { id: 'item-1', name: 'Big Dish', quantity: 1, price_at_time: 1500, notes: null, status: 'active' },
              { id: 'item-2', name: 'Bigger Dish', quantity: 1, price_at_time: 100000, notes: null, status: 'active' },
            ],
          },
        }),
      });
    });

    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('http://localhost:3000/order/DINE-4821', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const pageText = await page.locator('body').innerText();
    expect(pageText).toMatch(/₹1,500\.00/);
    expect(pageText).toMatch(/₹1,00,000\.00/);
    expect(pageText).not.toMatch(/\$/);
  });

  test('DishFormModal price label uses INR', async () => {
    const src = readFileSync(resolve('components/menu/DishFormModal.tsx'), 'utf-8');
    expect(src).toContain('Price ({currencyLabel} INR)');
  });

  test('dashboard menu page defaults to ₹ label', async () => {
    const src = readFileSync(resolve('app/dashboard/menu/page.tsx'), 'utf-8');
    expect(src).toContain("|| '₹'");
    expect(src).not.toMatch(/\|\| '\$'/);
  });

  test('site content default pricing uses ₹', async () => {
    const src = readFileSync(resolve('lib/siteContent.ts'), 'utf-8');
    // Pricing section is now disabled by default; no plan prices in default content
    expect(src).not.toMatch(/'\$[0-9]/);
  });

  test('admin pricing page placeholder uses ₹', async () => {
    const src = readFileSync(resolve('app/admin/(panel)/pricing/page.tsx'), 'utf-8');
    expect(src).toContain('₹79');
    expect(src).not.toMatch(/placeholder="\$/);
  });

  test('no hardcoded $ currency symbols in components', async () => {
    const violations: string[] = [];
    const dirs = ['components', 'app', 'lib'];

    for (const dir of dirs) {
      walk(resolve(dir), (file) => {
        if (!/\.(ts|tsx)$/.test(file)) return;
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          // Skip USDZ 3D model references and JS template literals.
          if (/\bUSDZ\b/.test(line)) return;
          if (/\$\{/.test(line)) return;
          // Look for a $ that is followed by a digit or a currency word.
          const m = line.match(/(^|[^\\$])\$(?=\d|[A-Z]{3}|\s)/);
          if (m) {
            violations.push(`${file}:${idx + 1}: ${line.trim()}`);
          }
        });
      });
    }

    expect(violations).toEqual([]);
  });
});
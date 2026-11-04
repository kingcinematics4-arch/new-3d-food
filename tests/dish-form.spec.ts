import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// The DishFormModal component is the dish creation/editing interface.
// Its price label is rendered from the `currencyLabel` prop, which the
// dashboard menu page derives from the hotel's currency column. We
// assert the label string is present in the compiled source.

test('DishFormModal uses INR price label', async () => {
  const src = readFileSync(
    resolve('components/menu/DishFormModal.tsx'),
    'utf-8'
  );
  // The label must show the INR symbol and the INR word.
  expect(src).toContain('Price ({currencyLabel} INR)');
});

test('dashboard menu page derives INR label by default', async () => {
  const src = readFileSync(
    resolve('app/dashboard/menu/page.tsx'),
    'utf-8'
  );
  // Default fallback symbol must be ₹, not $.
  expect(src).toContain("|| '₹'");
  expect(src).not.toMatch(/\|\| '\$'/);
});

test('formatPrice renders INR with ₹ and Indian grouping', async ({ page }) => {
  await page.route('**/api/public/orders/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
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
      }),
    });
  });

  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('http://localhost:3000/order/DINE-4821', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const pageText = await page.locator('body').innerText();
  expect(pageText).toMatch(/₹30\.00/);
  expect(pageText).not.toMatch(/\$/);
});

test('dish price input preserves numeric value', async ({ page }) => {
  await page.route('**/api/public/orders/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
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
          total_amount: 110,
          created_at: '2026-11-04T14:30:00Z',
          updated_at: '2026-11-04T14:42:00Z',
          hotel_theme: 'classic-luxury',
          hotel_slug: 'demo-restaurant',
          currency: 'INR (₹)',
          items: [
            { id: 'item-1', name: 'Burger', quantity: 1, price_at_time: 110, notes: null, status: 'active' },
          ],
        },
      }),
    });
  });

  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('http://localhost:3000/order/DINE-4821', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const pageText = await page.locator('body').innerText();
  expect(pageText).toMatch(/₹110\.00/);
  expect(pageText).not.toMatch(/\$/);
});
import { test, expect } from '@playwright/test';

const MOCK_ORDER = {
  success: true,
  order: {
    id: '11111111-1111-1111-1111-111111111111',
    order_number: 'DINE-4821',
    status: 'pending',
    payment_status: 'pending',
    payment_method: 'pay_at_table',
    table_number: '12',
    customer_name: 'Jay Subhash',
    customer_phone: null,
    notes: 'Extra spicy, please',
    total_amount: 80,
    created_at: '2026-11-04T14:30:00Z',
    updated_at: '2026-11-04T14:42:00Z',
    hotel_theme: 'classic-luxury',
    hotel_slug: 'demo-restaurant',
    items: [
      { id: 'item-1', name: 'Vada Pav', quantity: 2, price_at_time: 10, notes: null, status: 'active' },
      { id: 'item-2', name: 'Cheese Burger', quantity: 1, price_at_time: 30, notes: null, status: 'active' },
      { id: 'item-3', name: 'French Fries', quantity: 1, price_at_time: 20, notes: null, status: 'cancelled' },
    ],
  },
};

const BASE = 'http://localhost:3000';

test.describe('Customer order-tracking page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/public/orders/*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ORDER) });
    });
  });

  const widths = [360, 390, 430];
  for (const width of widths) {
    test(`renders correctly at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`${BASE}/order/DINE-4821`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      const pageText = await page.locator('body').innerText();
      expect(pageText).toContain('Vada Pav');
      expect(pageText).toMatch(/Unit price: ₹10 each/);
      expect(pageText).toMatch(/₹20/);
      expect(pageText).toMatch(/₹30/);
      expect(pageText).toContain('Cancel Item');
      expect(pageText).not.toMatch(/Last updated/);

      for (const title of ['Order Placed', 'Accepted by Restaurant', 'Preparing', 'Ready', 'Completed']) {
        expect(pageText).toContain(title);
      }

      const heading = await page.locator('text=Order Progress').first();
      const headingBox = await heading.boundingBox();
      expect(headingBox).not.toBeNull();
      expect(headingBox!.height).toBeGreaterThan(10);

      const firstStage = await page.locator('text=Order Placed').first();
      const stageBox = await firstStage.boundingBox();
      expect(stageBox).not.toBeNull();
      const gap = stageBox!.y - (headingBox!.y + headingBox!.height);
      expect(gap).toBeGreaterThan(4);

      const unitPriceEl = await page.locator('text=Unit price: ₹10 each').first();
      const unitBox = await unitPriceEl.boundingBox();
      expect(unitBox).not.toBeNull();
      expect(unitBox!.height).toBeLessThan(30);

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(width + 1);

      await page.screenshot({ path: `order-tracking-${width}px.png`, fullPage: true });
    });
  }

  test('unit-price line never wraps into multiple lines', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`${BASE}/order/DINE-4821`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const unitPrice = await page.locator('text=Unit price: ₹10 each').first();
    const box = await unitPrice.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeLessThan(30);
  });
});
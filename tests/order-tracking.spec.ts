import { test, expect } from '@playwright/test';

// A representative order that exercises every part of the customer
// tracking page: active items, a cancelled item, and a terminal status
// so the progress bar and summary logic are both rendered.
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
      {
        id: 'item-1',
        name: 'Vada Pav',
        quantity: 2,
        price_at_time: 10,
        notes: null,
        status: 'active',
      },
      {
        id: 'item-2',
        name: 'Cheese Burger',
        quantity: 1,
        price_at_time: 30,
        notes: null,
        status: 'active',
      },
      {
        id: 'item-3',
        name: 'French Fries',
        quantity: 1,
        price_at_time: 20,
        notes: null,
        status: 'cancelled',
      },
    ],
  },
};

test.describe('Customer order-tracking page', () => {
  test.beforeEach(async ({ page }) => {
    // The guest tracking page reads its data from /api/public/orders/[id].
    // Intercept it so the test runs deterministically without a database.
    await page.route('**/api/public/orders/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ORDER),
      });
    });
  });

  const widths = [360, 390, 430];
  for (const width of widths) {
    test(`renders correctly at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
await page.goto('http://localhost:3000/order/DINE-4821', { waitUntil: 'networkidle' });

      // The progress section must NOT contain the "Last updated" line.
      const progressText = await page.locator('text=Order Progress').first().locator('..').innerText();
      expect(progressText).not.toMatch(/Last updated/);

      // Each item card must show the required fields.
      const pageText = await page.locator('body').innerText();
      expect(pageText).toContain('Vada Pav');
      expect(pageText).toMatch(/Unit price: ₹10 each/);
      expect(pageText).toMatch(/₹20/);
      expect(pageText).toMatch(/₹30/);
      expect(pageText).toContain('Cancel Item');

      // The unit-price line must be its own element with no overlap.
      const unitPriceEl = await page.locator('text=Unit price: ₹10 each').first();
      const unitBox = await unitPriceEl.boundingBox();
      expect(unitBox).not.toBeNull();
      expect(unitBox!.height).toBeLessThan(30);

      // The subtotal must not overlap the unit-price text.
      const subtotalEl = await page.locator('text=₹20').first();
      const subtotalBox = await subtotalEl.boundingBox();
      expect(subtotalBox).not.toBeNull();
      const overlapX = unitBox!.x < subtotalBox!.x + subtotalBox!.width &&
        unitBox!.x + unitBox!.width > subtotalBox!.x;
      const overlapY = unitBox!.y < subtotalBox!.y + subtotalBox!.height &&
        unitBox!.y + unitBox!.height > subtotalBox!.y;
      expect(overlapX && overlapY).toBe(false);

      // The summary must show a single prominent total, no "Original Total".
      const summary = await page.locator('text=Order Summary').first().locator('..').first().locator('..').first();
      const summaryText = await summary.innerText();
      expect(summaryText).not.toMatch(/Original Total/);
      expect(summaryText).not.toMatch(/Current Total/);
      expect(summaryText).toMatch(/order total/i);
      expect(summaryText).toMatch(/₹50/);

      // No horizontal overflow at this width.
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(width + 1);

      await page.screenshot({
        path: `order-tracking-${width}px.png`,
        fullPage: true,
      });
    });
  }

  test('unit-price line never wraps into multiple lines', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('http://localhost:3000/order/DINE-4821', { waitUntil: 'networkidle' });

    const unitPrice = await page.locator('text=Unit price: ₹10 each').first();
    const box = await unitPrice.boundingBox();
    expect(box).not.toBeNull();
    // A single-line element should be roughly as tall as one line of text.
    expect(box!.height).toBeLessThan(30);
  });
});
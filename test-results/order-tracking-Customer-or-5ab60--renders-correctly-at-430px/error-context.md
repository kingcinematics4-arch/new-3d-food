# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: order-tracking.spec.ts >> Customer order-tracking page >> renders correctly at 430px
- Location: tests\order-tracking.spec.ts:40:9

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/order/DINE-4821
Call log:
  - navigating to "http://localhost:3000/order/DINE-4821", waiting until "domcontentloaded"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const MOCK_ORDER = {
  4   |   success: true,
  5   |   order: {
  6   |     id: '11111111-1111-1111-1111-111111111111',
  7   |     order_number: 'DINE-4821',
  8   |     status: 'pending',
  9   |     payment_status: 'pending',
  10  |     payment_method: 'pay_at_table',
  11  |     table_number: '12',
  12  |     customer_name: 'Jay Subhash',
  13  |     customer_phone: null,
  14  |     notes: 'Extra spicy, please',
  15  |     total_amount: 80,
  16  |     created_at: '2026-11-04T14:30:00Z',
  17  |     updated_at: '2026-11-04T14:42:00Z',
  18  |     hotel_theme: 'classic-luxury',
  19  |     hotel_slug: 'demo-restaurant',
  20  |     currency: 'INR (₹)',
  21  |     items: [
  22  |       { id: 'item-1', name: 'Vada Pav', quantity: 2, price_at_time: 10, notes: null, status: 'active' },
  23  |       { id: 'item-2', name: 'Cheese Burger', quantity: 1, price_at_time: 30, notes: null, status: 'active' },
  24  |       { id: 'item-3', name: 'French Fries', quantity: 1, price_at_time: 20, notes: null, status: 'cancelled' },
  25  |     ],
  26  |   },
  27  | };
  28  | 
  29  | const BASE = 'http://localhost:3000';
  30  | 
  31  | test.describe('Customer order-tracking page', () => {
  32  |   test.beforeEach(async ({ page }) => {
  33  |     await page.route('**/api/public/orders/*', async (route) => {
  34  |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ORDER) });
  35  |     });
  36  |   });
  37  | 
  38  |   const widths = [360, 390, 430];
  39  |   for (const width of widths) {
  40  |     test(`renders correctly at ${width}px`, async ({ page }) => {
  41  |       await page.setViewportSize({ width, height: 800 });
> 42  |       await page.goto(`${BASE}/order/DINE-4821`, { waitUntil: 'domcontentloaded' });
      |                  ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/order/DINE-4821
  43  |       await page.waitForTimeout(1500);
  44  | 
  45  |       const pageText = await page.locator('body').innerText();
  46  |       expect(pageText).toContain('Vada Pav');
  47  |       expect(pageText).toMatch(/Unit price: ₹10\.00 each/);
  48  |       expect(pageText).toMatch(/₹20\.00/);
  49  |       expect(pageText).toMatch(/₹30\.00/);
  50  |       expect(pageText).toContain('Cancel Item');
  51  |       expect(pageText).not.toMatch(/Last updated/);
  52  | 
  53  |       // INR currency symbol must be used everywhere; no USD sign.
  54  |       expect(pageText).not.toMatch(/\$/);
  55  | 
  56  |       for (const title of ['Order Placed', 'Accepted by Restaurant', 'Preparing', 'Ready', 'Completed']) {
  57  |         expect(pageText).toContain(title);
  58  |       }
  59  | 
  60  |       const heading = await page.locator('text=Order Progress').first();
  61  |       const headingBox = await heading.boundingBox();
  62  |       expect(headingBox).not.toBeNull();
  63  |       expect(headingBox!.height).toBeGreaterThan(10);
  64  | 
  65  |       const firstStage = await page.locator('text=Order Placed').first();
  66  |       const stageBox = await firstStage.boundingBox();
  67  |       expect(stageBox).not.toBeNull();
  68  |       const gap = stageBox!.y - (headingBox!.y + headingBox!.height);
  69  |       expect(gap).toBeGreaterThan(4);
  70  | 
  71  |       const unitPriceEl = await page.locator('text=Unit price: ₹10.00 each').first();
  72  |       const unitBox = await unitPriceEl.boundingBox();
  73  |       expect(unitBox).not.toBeNull();
  74  |       expect(unitBox!.height).toBeLessThan(30);
  75  | 
  76  |       const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  77  |       expect(bodyWidth).toBeLessThanOrEqual(width + 1);
  78  | 
  79  |       await page.screenshot({ path: `order-tracking-${width}px.png`, fullPage: true });
  80  |     });
  81  |   }
  82  | 
  83  |   test('unit-price line never wraps into multiple lines', async ({ page }) => {
  84  |     await page.setViewportSize({ width: 360, height: 800 });
  85  |     await page.goto(`${BASE}/order/DINE-4821`, { waitUntil: 'domcontentloaded' });
  86  |     await page.waitForTimeout(1500);
  87  | 
  88  |     const unitPrice = await page.locator('text=Unit price: ₹10.00 each').first();
  89  |     const box = await unitPrice.boundingBox();
  90  |     expect(box).not.toBeNull();
  91  |     expect(box!.height).toBeLessThan(30);
  92  |   });
  93  | 
  94  |   test('uses INR formatting for totals', async ({ page }) => {
  95  |     await page.setViewportSize({ width: 390, height: 800 });
  96  |     await page.goto(`${BASE}/order/DINE-4821`, { waitUntil: 'domcontentloaded' });
  97  |     await page.waitForTimeout(1500);
  98  | 
  99  |     const pageText = await page.locator('body').innerText();
  100 |     // Active total = 2×10 + 1×30 = 50, cancelled item excluded.
  101 |     expect(pageText).toMatch(/₹50\.00/);
  102 |     expect(pageText).not.toMatch(/\$/);
  103 |   });
  104 | 
  105 | test('INR Indian number formatting', async ({ page }) => {
  106 |     // Override the default mock with a single high-price item so we
  107 |     // can assert Indian grouping (₹1,500.00) on the rendered page.
  108 |     await page.route('**/api/public/orders/*', async (route) => {
  109 |       await route.fulfill({
  110 |         status: 200,
  111 |         contentType: 'application/json',
  112 |         body: JSON.stringify({
  113 |           success: true,
  114 |           order: {
  115 |             ...MOCK_ORDER.order,
  116 |             items: [
  117 |               { id: 'item-1', name: 'Big Dish', quantity: 1, price_at_time: 1500, notes: null, status: 'active' },
  118 |             ],
  119 |           },
  120 |         }),
  121 |       });
  122 |     });
  123 | 
  124 |     await page.setViewportSize({ width: 390, height: 800 });
  125 |     await page.goto(`${BASE}/order/DINE-4821`, { waitUntil: 'domcontentloaded' });
  126 |     await page.waitForTimeout(1500);
  127 |     const bigText = await page.locator('body').innerText();
  128 |     expect(bigText).toMatch(/₹1,500\.00/);
  129 |     expect(bigText).not.toMatch(/\$/);
  130 |   });
  131 | });
```
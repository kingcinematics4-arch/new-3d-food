# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: __tooltip_shots__.spec.ts >> tooltip screenshots >> mobile narrow - first/middle/last
- Location: tests\__tooltip_shots__.spec.ts:40:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.apexcharts-inner') to be visible

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - link [ref=e5] [cursor=pointer]:
    - /url: /
    - img "Dine3D" [ref=e7]
  - generic [ref=e8]:
    - text: "404"
    - heading "This page is not on the menu." [level=1] [ref=e9]
    - paragraph [ref=e10]: The address you followed does not exist. Try one of the destinations below.
  - generic [ref=e11]:
    - link "Back to the homepage" [ref=e12] [cursor=pointer]:
      - /url: /
    - link "Explore DinePixel" [ref=e13] [cursor=pointer]:
      - /url: /#features
  - generic [ref=e14]:
    - link "HomeThe DinePixel product" [ref=e15] [cursor=pointer]:
      - /url: /
    - link "FeaturesWhat DinePixel does" [ref=e16] [cursor=pointer]:
      - /url: /#features
    - link "PricingPlans and what they include" [ref=e17] [cursor=pointer]:
      - /url: /#pricing
    - link "QuestionsCommonly asked questions" [ref=e18] [cursor=pointer]:
      - /url: /#faq
    - link "Restaurant sign inFor restaurant owners" [ref=e19] [cursor=pointer]:
      - /url: /login
  - paragraph [ref=e20]: SEE IT. EXPERIENCE IT. DINE IT.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | async function showTooltipAt(page: any, index: number) {
  4  |   // Hover the marker for the given data point index in the first series.
  5  |   // ApexCharts renders markers as .apexcharts-marker; for area charts with
  6  |   // markers hidden by default (hover shows), we trigger via the series path
  7  |   // points. More reliable: use the chart's grid to compute x position.
  8  |   const box = await page.locator('#chart-wrap .apexcharts-inner').boundingBox();
  9  |   if (!box) throw new Error('chart inner not found');
  10 |   const categories = 7;
  11 |   const x = box.x + (box.width * index) / (categories - 1);
  12 |   const y = box.y + box.height * 0.5;
  13 |   await page.mouse.move(x, y);
  14 |   await page.waitForTimeout(350);
  15 |   await expect(page.locator('.apexcharts-tooltip')).toBeVisible();
  16 | }
  17 | 
  18 | test.describe('tooltip screenshots', () => {
  19 |   test('desktop - first/middle/last', async ({ page }) => {
  20 |     await page.setViewportSize({ width: 1280, height: 800 });
  21 |     await page.goto('http://localhost:3000/__tooltip_test__', { waitUntil: 'networkidle' });
  22 |     await page.waitForSelector('.apexcharts-inner');
  23 |     await page.waitForTimeout(500);
  24 | 
  25 |     await showTooltipAt(page, 0);
  26 |     await page.screenshot({ path: 'test-results/tooltip-desktop-first.png', fullPage: false });
  27 |     const first = await page.locator('.apexcharts-tooltip').boundingBox();
  28 |     const inner = await page.locator('#chart-wrap .apexcharts-inner').boundingBox();
  29 |     console.log('desktop-first', JSON.stringify({ first, inner }));
  30 | 
  31 |     await showTooltipAt(page, 3);
  32 |     await page.screenshot({ path: 'test-results/tooltip-desktop-middle.png', fullPage: false });
  33 |     console.log('desktop-middle', JSON.stringify({ tip: await page.locator('.apexcharts-tooltip').boundingBox() }));
  34 | 
  35 |     await showTooltipAt(page, 6);
  36 |     await page.screenshot({ path: 'test-results/tooltip-desktop-last.png', fullPage: false });
  37 |     console.log('desktop-last', JSON.stringify({ tip: await page.locator('.apexcharts-tooltip').boundingBox(), inner }));
  38 |   });
  39 | 
  40 |   test('mobile narrow - first/middle/last', async ({ page }) => {
  41 |     await page.setViewportSize({ width: 390, height: 844 });
  42 |     await page.goto('http://localhost:3000/__tooltip_test__', { waitUntil: 'networkidle' });
> 43 |     await page.waitForSelector('.apexcharts-inner');
     |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  44 |     await page.waitForTimeout(500);
  45 | 
  46 |     await showTooltipAt(page, 0);
  47 |     await page.screenshot({ path: 'test-results/tooltip-mobile-first.png', fullPage: false });
  48 |     console.log('mobile-first', JSON.stringify({ tip: await page.locator('.apexcharts-tooltip').boundingBox(), inner: await page.locator('#chart-wrap .apexcharts-inner').boundingBox() }));
  49 | 
  50 |     await showTooltipAt(page, 3);
  51 |     await page.screenshot({ path: 'test-results/tooltip-mobile-middle.png', fullPage: false });
  52 |     console.log('mobile-middle', JSON.stringify({ tip: await page.locator('.apexcharts-tooltip').boundingBox() }));
  53 | 
  54 |     await showTooltipAt(page, 6);
  55 |     await page.screenshot({ path: 'test-results/tooltip-mobile-last.png', fullPage: false });
  56 |     console.log('mobile-last', JSON.stringify({ tip: await page.locator('.apexcharts-tooltip').boundingBox(), inner: await page.locator('#chart-wrap .apexcharts-inner').boundingBox() }));
  57 |   });
  58 | });
  59 | 
```
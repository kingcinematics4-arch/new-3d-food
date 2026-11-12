const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[CONSOLE ERROR] ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`[PAGE ERROR] ${err.message}`));

  // ---------- Orbit Pop ----------
  console.log('\n===== Orbit Pop =====');
  await page.goto('http://localhost:3001/games/bubble-shooter', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Start Level 1")');
  await page.waitForTimeout(1000);

  const canvasBox = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  console.log('Canvas box:', JSON.stringify(canvasBox));

  // Log all pointer events
  await page.evaluate(() => {
    window.__events = [];
    const canvas = document.querySelector('canvas');
    canvas.addEventListener('pointerdown', (e) => {
      window.__events.push({ type: 'pointerdown', x: e.clientX, y: e.clientY });
    });
    canvas.addEventListener('pointermove', (e) => {
      window.__events.push({ type: 'pointermove', x: e.clientX, y: e.clientY });
    });
    canvas.addEventListener('pointerup', (e) => {
      window.__events.push({ type: 'pointerup', x: e.clientX, y: e.clientY });
    });
  });

  // Drag left
  await page.mouse.move(canvasBox.x + canvasBox.w * 0.5, canvasBox.y + canvasBox.h * 0.85);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + canvasBox.w * 0.2, canvasBox.y + canvasBox.h * 0.4);
  await page.waitForTimeout(300);
  await page.mouse.up();
  await page.waitForTimeout(500);

  const events = await page.evaluate(() => window.__events);
  console.log('Pointer events:', JSON.stringify(events.slice(0, 10)));
  console.log('Errors:', JSON.stringify(errors.slice(0, 5)));

  await browser.close();
})();
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  // Use a larger viewport
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[CONSOLE ERROR] ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`[PAGE ERROR] ${err.message}`));

  // ---------- Block Forge ----------
  console.log('\n===== Block Forge =====');
  errors.length = 0;
  await page.goto('http://localhost:3001/games/block-blast', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Start Puzzle")');
  await page.waitForTimeout(500);

  // Check WebGL by trying to get the renderer info
  const webglInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { canvas: false };
    const contexts = [];
    for (const t of ['webgl2','webgl','experimental-webgl']) {
      try { const c = canvas.getContext(t); if (c) contexts.push(t); } catch(e) {}
    }
    return { canvas: true, contexts };
  });
  console.log('WebGL contexts:', JSON.stringify(webglInfo));

  // Check for grid lines in the DOM
  const gridInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return { canvasW: canvas.width, canvasH: canvas.height };
  });
  console.log('Canvas size:', JSON.stringify(gridInfo));

  // Check tray and board visibility
  const visibility = await page.evaluate(() => {
    const tray = document.querySelector('[class*="pointer-events-auto"]');
    const board = document.querySelector('canvas');
    return { 
      hasTray: !!tray, 
      hasCanvas: !!board,
      canvasDisplay: board ? getComputedStyle(board).display : 'none'
    };
  });
  console.log('Visibility:', JSON.stringify(visibility));

  // Take screenshot
  await page.screenshot({ path: 'block-forge.png' });
  console.log('Screenshot saved: block-forge.png');

  // ---------- Orbit Pop ----------
  console.log('\n===== Orbit Pop =====');
  errors.length = 0;
  await page.goto('http://localhost:3001/games/bubble-shooter', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Start Level 1")');
  await page.waitForTimeout(500);

  // Test aiming by injecting into the Three.js scene
  const aimTest = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return { canvasW: canvas.width, canvasH: canvas.height };
  });
  console.log('Canvas size:', JSON.stringify(aimTest));

  // Simulate pointer events on canvas
  const canvasBox = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });

  // Move to left side and press
  await page.mouse.move(canvasBox.x + canvasBox.w * 0.2, canvasBox.y + canvasBox.h * 0.6);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + canvasBox.w * 0.5, canvasBox.y + canvasBox.h * 0.3);
  await page.waitForTimeout(200);
  await page.mouse.up();
  await page.waitForTimeout(500);
  console.log('After aim+shoot errors:', JSON.stringify(errors.slice(0, 5)));

  await page.screenshot({ path: 'orbit-pop.png' });
  console.log('Screenshot saved: orbit-pop.png');

  await browser.close();
})();
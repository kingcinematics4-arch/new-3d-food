const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
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
  console.log('Initial errors:', JSON.stringify(errors.slice(0, 5)));

  await page.click('button:has-text("Start Puzzle")');
  await page.waitForTimeout(500);
  console.log('After Start errors:', JSON.stringify(errors.slice(0, 5)));

  // Inspect tray buttons
  const trayInfo = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const trayBtns = buttons.filter(b => b.className && b.className.includes('flex-1'));
    return trayBtns.map((b, i) => ({
      idx: i,
      rect: b.getBoundingClientRect()
    }));
  });
  console.log('Tray buttons count:', trayInfo.length);

  // Check WebGL
  const threeInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { canvas: false };
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return { canvas: true, gl: !!gl, w: canvas.width, h: canvas.height };
  });
  console.log('Canvas/ WebGL:', JSON.stringify(threeInfo));

  // Pick a piece and place it
  if (trayInfo.length > 0) {
    const firstTray = trayInfo[0];
    await page.mouse.click(firstTray.rect.x + firstTray.rect.width/2, firstTray.rect.y + firstTray.rect.height/2);
    await page.waitForTimeout(300);

    const canvasBox = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      const r = c.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    const boardX = canvasBox.x + canvasBox.w * 0.5;
    const boardY = canvasBox.y + canvasBox.h * 0.4;
    await page.mouse.click(boardX, boardY);
    await page.waitForTimeout(500);
    console.log('After place errors:', JSON.stringify(errors.slice(0, 5)));

    const scoreInfo = await page.evaluate(() => {
      const stats = Array.from(document.querySelectorAll('.text-lg, [class*="font-semibold"]'));
      return stats.map(s => s.textContent.trim()).slice(0, 10);
    });
    console.log('Score display:', JSON.stringify(scoreInfo));
  }

  // ---------- Orbit Pop ----------
  console.log('\n===== Orbit Pop =====');
  errors.length = 0;
  await page.goto('http://localhost:3001/games/bubble-shooter', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  console.log('Initial errors:', JSON.stringify(errors.slice(0, 5)));

  await page.click('button:has-text("Start Level 1")');
  await page.waitForTimeout(500);
  console.log('After Start errors:', JSON.stringify(errors.slice(0, 5)));

  const bubbleInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { canvas: false };
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return { canvas: true, gl: !!gl, w: canvas.width, h: canvas.height };
  });
  console.log('Canvas/ WebGL:', JSON.stringify(bubbleInfo));

  // Drag to aim left then release to shoot
  const canvasBox = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  console.log('Canvas box:', JSON.stringify(canvasBox));

  // Drag left
  const startX = canvasBox.x + canvasBox.w * 0.5;
  const startY = canvasBox.y + canvasBox.h * 0.85;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + canvasBox.w * 0.2, canvasBox.y + canvasBox.h * 0.4);
  await page.waitForTimeout(300);
  await page.mouse.up();
  await page.waitForTimeout(500);
  console.log('After shoot errors:', JSON.stringify(errors.slice(0, 5)));

  // Drag right and shoot
  await page.mouse.move(canvasBox.x + canvasBox.w * 0.5, canvasBox.y + canvasBox.h * 0.85);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + canvasBox.w * 0.8, canvasBox.y + canvasBox.h * 0.4);
  await page.waitForTimeout(300);
  await page.mouse.up();
  await page.waitForTimeout(500);
  console.log('After 2nd shoot errors:', JSON.stringify(errors.slice(0, 5)));

  const bubbleScore = await page.evaluate(() => {
    const stats = Array.from(document.querySelectorAll('.text-lg, [class*="font-semibold"]'));
    return stats.map(s => s.textContent.trim()).slice(0, 10);
  });
  console.log('Bubble score:', JSON.stringify(bubbleScore));

  await browser.close();
})();
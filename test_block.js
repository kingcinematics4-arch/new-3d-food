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
  console.log('\n===== Block Forge 3D =====');
  errors.length = 0;
  await page.goto('http://localhost:3001/games/block-blast', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  console.log('Initial errors:', JSON.stringify(errors.slice(0, 10)));

  // Click Start
  await page.click('button:has-text("Start Puzzle")');
  await page.waitForTimeout(500);
  console.log('After Start errors:', JSON.stringify(errors.slice(0, 10)));

  // Inspect tray buttons
  const trayInfo = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const trayBtns = buttons.filter(b => b.className && b.className.includes('flex-1'));
    return trayBtns.map((b, i) => ({
      idx: i,
      text: b.textContent.trim().substring(0, 40),
      class: b.className.substring(0, 80),
      rect: b.getBoundingClientRect()
    }));
  });
  console.log('Tray buttons:', JSON.stringify(trayInfo, null, 2));

  // Check canvas / WebGL presence
  const threeInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { canvas: false };
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return { canvas: true, gl: !!gl, w: canvas.width, h: canvas.height };
  });
  console.log('Canvas/ WebGL:', JSON.stringify(threeInfo));

  // Try to pick a piece and place
  if (trayInfo.length > 0) {
    const firstTray = trayInfo[0];
    console.log('Clicking tray piece 0 at', firstTray.rect.x, firstTray.rect.y);
    await page.mouse.click(firstTray.rect.x + firstTray.rect.width/2, firstTray.rect.y + firstTray.rect.height/2);
    await page.waitForTimeout(300);
    console.log('After pick errors:', JSON.stringify(errors.slice(0, 10)));

    // Check if drag state changed
    const dragState = await page.evaluate(() => {
      // look for ghost boxes in the scene
      const all = Array.from(document.querySelectorAll('canvas'));
      return { canvasCount: all.length };
    });
    console.log('Drag state:', JSON.stringify(dragState));

    // Click on board center
    const canvasBox = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      const r = c.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    const boardX = canvasBox.x + canvasBox.w * 0.5;
    const boardY = canvasBox.y + canvasBox.h * 0.4;
    console.log('Clicking board at', boardX, boardY);
    await page.mouse.click(boardX, boardY);
    await page.waitForTimeout(500);
    console.log('After place errors:', JSON.stringify(errors.slice(0, 10)));
  }

  // Check score
  const scoreInfo = await page.evaluate(() => {
    const stats = Array.from(document.querySelectorAll('.text-lg, [class*="font-semibold"]'));
    return stats.map(s => s.textContent.trim()).slice(0, 10);
  });
  console.log('Score display:', JSON.stringify(scoreInfo));

  await browser.close();
})();
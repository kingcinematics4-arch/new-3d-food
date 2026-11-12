const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[CONSOLE ERROR] ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`[PAGE ERROR] ${err.message}`));

  // ---------- Orbit Pop ----------
  console.log('\n===== Orbit Pop 3D =====');
  errors.length = 0;
  await page.goto('http://localhost:3001/games/bubble-shooter', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  console.log('Initial errors:', JSON.stringify(errors.slice(0, 10)));

  // Click Start
  await page.click('button:has-text("Start Level 1")');
  await page.waitForTimeout(500);
  console.log('After Start errors:', JSON.stringify(errors.slice(0, 10)));

  // Check canvas / WebGL
  const threeInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { canvas: false };
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return { canvas: true, gl: !!gl, w: canvas.width, h: canvas.height };
  });
  console.log('Canvas/ WebGL:', JSON.stringify(threeInfo));

  // Check shooter angle and projectile state
  const state1 = await page.evaluate(() => {
    // Try to access the React state via window (not directly accessible)
    // Instead check DOM for projectile mesh presence
    const canvas = document.querySelector('canvas');
    return { canvasW: canvas.width, canvasH: canvas.height };
  });
  console.log('State after start:', JSON.stringify(state1));

  // Move mouse to aim
  const canvasBox = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  console.log('Canvas box:', JSON.stringify(canvasBox));

  // Move to left side
  await page.mouse.move(canvasBox.x + canvasBox.w * 0.3, canvasBox.y + canvasBox.h * 0.8);
  await page.waitForTimeout(200);
  console.log('After move errors:', JSON.stringify(errors.slice(0, 10)));

  // Click to shoot
  await page.mouse.click(canvasBox.x + canvasBox.w * 0.3, canvasBox.y + canvasBox.h * 0.8);
  await page.waitForTimeout(500);
  console.log('After shoot errors:', JSON.stringify(errors.slice(0, 10)));

  // Wait for projectile to move
  await page.waitForTimeout(1000);
  console.log('After projectile wait errors:', JSON.stringify(errors.slice(0, 10)));

  // Check score
  const scoreInfo = await page.evaluate(() => {
    const stats = Array.from(document.querySelectorAll('.text-lg, [class*="font-semibold"]'));
    return stats.map(s => s.textContent.trim()).slice(0, 10);
  });
  console.log('Score display:', JSON.stringify(scoreInfo));

  await browser.close();
})();
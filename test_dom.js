const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[CONSOLE ERROR] ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`[PAGE ERROR] ${err.message}`));

  // ---------- Block Forge ----------
  console.log('\n===== Block Forge =====');
  await page.goto('http://localhost:3001/games/block-blast', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Start Puzzle")');
  await page.waitForTimeout(1000);

  // Check Three.js scene children
  const sceneInfo = await page.evaluate(() => {
    // Try to access the Three.js scene via the fiber internals
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return { gl: false };
    
    // Check how many draw calls / objects are in the scene
    // We can inspect the render lists
    return { 
      gl: true, 
      canvasW: canvas.width, 
      canvasH: canvas.height,
      // Check if there are any mesh elements in the scene by looking at the scene graph
      hasGrid: document.querySelectorAll('canvas').length
    };
  });
  console.log('Scene info:', JSON.stringify(sceneInfo));

  // Check pixel colors at board center
  const pixelInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return { gl: false };
    // Read pixels from the center of the canvas
    const pixels = new Uint8Array(4);
    // Read from center
    gl.readPixels(canvas.width/2, canvas.height/2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return { centerPixel: Array.from(pixels) };
  });
  console.log('Center pixel:', JSON.stringify(pixelInfo));

  // Check if grid lines are in the DOM
  const domInfo = await page.evaluate(() => {
    const allMeshes = document.querySelectorAll('canvas');
    return { canvasCount: allMeshes.length };
  });
  console.log('DOM info:', JSON.stringify(domInfo));

  // ---------- Orbit Pop ----------
  console.log('\n===== Orbit Pop =====');
  await page.goto('http://localhost:3001/games/bubble-shooter', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Start Level 1")');
  await page.waitForTimeout(1000);

  // Check shooter angle after aiming
  const canvasBox = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });

  // Simulate drag left
  await page.mouse.move(canvasBox.x + canvasBox.w * 0.5, canvasBox.y + canvasBox.h * 0.85);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + canvasBox.w * 0.2, canvasBox.y + canvasBox.h * 0.4);
  await page.waitForTimeout(300);
  await page.mouse.up();
  await page.waitForTimeout(500);

  // Check for errors
  console.log('After aim+shoot errors:', JSON.stringify(errors.slice(0, 5)));

  // Check if projectile was created
  const projectileInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return { canvasW: canvas.width, canvasH: canvas.height };
  });
  console.log('Canvas:', JSON.stringify(projectileInfo));

  await browser.close();
})();
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[CONSOLE ERROR] ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`[PAGE ERROR] ${err.message}`));

  const games = ['endless-runner', 'block-blast', 'bubble-shooter', 'traffic-racer'];
  for (const g of games) {
    errors.length = 0;
    console.log(`\n===== Testing /games/${g} =====`);
    await page.goto(`http://localhost:3001/games/${g}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const html = await page.content();
    console.log(`  Page length: ${html.length}`);
    // Check if canvas or canvas fallback present
    const canvasCount = await page.evaluate(() => document.querySelectorAll('canvas').length);
    const startBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.map(b => b.textContent.trim()).filter(t => t.includes('Start') || t.includes('Play'));
    });
    console.log(`  canvases: ${canvasCount}, start buttons: ${JSON.stringify(startBtn)}`);
    console.log(`  errors: ${JSON.stringify(errors.slice(0, 5))}`);
  }
  await browser.close();
})();
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const requests = [];
  page.on('request', req => {
    requests.push(`${req.method()} ${req.url()}`);
  });
  page.on('requestfailed', req => {
    console.log(`[REQUEST FAILED] ${req.url()} — ${req.failure()?.errorText}`);
  });
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[CONSOLE ERROR] ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`[PAGE ERROR] ${err.message}`));

  // Test 1: direct /games
  console.log('\n===== Test 1: Direct /games =====');
  errors.length = 0; requests.length = 0;
  await page.goto('http://localhost:3001/games', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const navCount = requests.filter(r => r.includes('/games')).length;
  console.log(`  /games requests: ${navCount}`);
  console.log(`  errors: ${JSON.stringify(errors.slice(0, 5))}`);
  const hasArcade = await page.evaluate(() => document.body.innerText.includes('Arcade Lounge'));
  console.log(`  Arcade Lounge visible: ${hasArcade}`);

  // Test 2: refresh /games
  console.log('\n===== Test 2: Refresh /games =====');
  errors.length = 0; requests.length = 0;
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const navCount2 = requests.filter(r => r.includes('/games')).length;
  console.log(`  /games requests after refresh: ${navCount2}`);
  console.log(`  errors: ${JSON.stringify(errors.slice(0, 5))}`);
  const hasArcade2 = await page.evaluate(() => document.body.innerText.includes('Arcade Lounge'));
  console.log(`  Arcade Lounge visible: ${hasArcade2}`);

  // Test 3: navigate to menu then back to games
  console.log('\n===== Test 3: Menu -> Games =====');
  errors.length = 0; requests.length = 0;
  await page.goto('http://localhost:3001/menu', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.goto('http://localhost:3001/games', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const navCount3 = requests.filter(r => r.includes('/games')).length;
  console.log(`  /games requests: ${navCount3}`);
  console.log(`  errors: ${JSON.stringify(errors.slice(0, 5))}`);

  // Test 4: back/forward
  console.log('\n===== Test 4: Browser back/forward =====');
  errors.length = 0; requests.length = 0;
  await page.goto('http://localhost:3001/games', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(500);
  await page.goto('http://localhost:3001/menu', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(500);
  await page.goBack();
  await page.waitForTimeout(2000);
  const navCount4 = requests.filter(r => r.includes('/games')).length;
  console.log(`  /games requests on back: ${navCount4}`);
  console.log(`  errors: ${JSON.stringify(errors.slice(0, 5))}`);

  // Test 5: open a game
  console.log('\n===== Test 5: Open a game =====');
  errors.length = 0; requests.length = 0;
  await page.goto('http://localhost:3001/games/endless-runner', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const navCount5 = requests.filter(r => r.includes('/games')).length;
  console.log(`  /games requests: ${navCount5}`);
  console.log(`  errors: ${JSON.stringify(errors.slice(0, 5))}`);
  const hasRunner = await page.evaluate(() => document.body.innerText.includes('Neon Sprint'));
  console.log(`  Neon Sprint visible: ${hasRunner}`);

  await browser.close();
})();
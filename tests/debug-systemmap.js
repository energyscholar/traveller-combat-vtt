const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('[BROWSER]', msg.text()));

  await page.goto('http://localhost:3000/operations/');
  await page.waitForSelector('#btn-gm-login');
  await page.click('#btn-gm-login');
  await page.waitForSelector('.campaign-card');
  await page.click('.campaign-card');
  await page.waitForSelector('#gm-start-session-btn');
  await page.click('#gm-start-session-btn');
  await new Promise(r => setTimeout(r, 1500));

  // Open system map
  await page.evaluate(() => window.showSystemMap());
  await new Promise(r => setTimeout(r, 1000));

  // Debug output
  const debug = await page.evaluate(() => {
    const state = window.systemMapState || {};
    const canvas = document.getElementById('system-map-canvas');
    return {
      hasCanvas: Boolean(canvas),
      canvasWidth: canvas ? canvas.width : 0,
      canvasHeight: canvas ? canvas.height : 0,
      hasCtx: Boolean(state.ctx),
      hasSystem: Boolean(state.system),
      systemStars: state.system && state.system.stars ? state.system.stars.length : 0,
      systemPlanets: state.system && state.system.planets ? state.system.planets.length : 0,
      zoom: state.zoom,
      devicePixelRatio: window.devicePixelRatio
    };
  });
  console.log('DEBUG:', JSON.stringify(debug, null, 2));

  await browser.close();
})();

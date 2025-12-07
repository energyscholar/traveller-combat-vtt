const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Capture all console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('SystemMap')) {
      console.log('[BROWSER]', text);
    }
  });

  await page.goto('http://localhost:3000/operations/');
  await page.waitForSelector('#btn-gm-login');
  await page.click('#btn-gm-login');
  await new Promise(r => setTimeout(r, 1000));
  await page.waitForSelector('.campaign-card');
  await page.click('.campaign-card');
  await new Promise(r => setTimeout(r, 500));
  await page.waitForSelector('#gm-start-session-btn');
  await page.click('#gm-start-session-btn');
  await new Promise(r => setTimeout(r, 1500));

  // Open system map via menu
  console.log('Opening hamburger menu...');
  await page.evaluate(() => {
    const hamburger = document.querySelector('.hamburger-menu-toggle') ||
                      document.querySelector('#hamburger-toggle');
    if (hamburger) hamburger.click();
  });
  await new Promise(r => setTimeout(r, 500));

  console.log('Clicking System Map menu...');
  await page.evaluate(() => {
    const menuItems = document.querySelectorAll('.hamburger-menu-item');
    for (const item of menuItems) {
      if (item.textContent.includes('System Map')) {
        item.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  // Check state
  const state = await page.evaluate(() => {
    const sms = window.systemMapState || {};
    return {
      hasCanvas: Boolean(sms.canvas),
      hasCtx: Boolean(sms.ctx),
      canvasWidth: sms.canvas ? sms.canvas.width : 0,
      canvasHeight: sms.canvas ? sms.canvas.height : 0,
      hasSystem: Boolean(sms.system),
      systemName: sms.system ? sms.system.name : null,
      starsCount: sms.system && sms.system.stars ? sms.system.stars.length : 0,
      planetsCount: sms.system && sms.system.planets ? sms.system.planets.length : 0,
      zoom: sms.zoom,
      offsetX: sms.offsetX,
      offsetY: sms.offsetY,
      AU_TO_PIXELS: sms.AU_TO_PIXELS,
      time: sms.time,
      paused: sms.paused
    };
  });

  console.log('\n=== SYSTEM MAP STATE ===');
  console.log(JSON.stringify(state, null, 2));

  // Check if system has valid star positions
  if (state.hasSystem) {
    const starInfo = await page.evaluate(() => {
      const sms = window.systemMapState;
      if (!sms.system || !sms.system.stars) return null;
      return sms.system.stars.map(s => ({
        type: s.type,
        position: s.position,
        radius: s.radius,
        color: s.color
      }));
    });
    console.log('\n=== STARS ===');
    console.log(JSON.stringify(starInfo, null, 2));
  }

  // Print relevant console logs
  console.log('\n=== CONSOLE LOGS (SystemMap) ===');
  consoleLogs.filter(l => l.includes('SystemMap')).forEach(l => console.log(l));

  await browser.close();
})();

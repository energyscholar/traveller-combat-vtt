const {
  createPage,
  navigateToOperations,
  gmLogin,
  delay,
  DELAYS
} = require('./puppeteer-utils');

(async () => {
  const { browser, page } = await createPage({ headless: true, width: 1400, height: 900 });

  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    // Navigate to operations
    await navigateToOperations(page);

    // GM Login
    await gmLogin(page);

    // Click start session button
    await page.waitForSelector('#btn-start-session', { timeout: 5000 });
    await page.click('#btn-start-session');
    await delay(DELAYS.SCREEN_TRANSITION);

    // Wait for role tabs - wait for any role tab first
    await page.waitForSelector('.role-tab', { timeout: 15000 });
    await delay(500);

    // Click pilot tab
    const pilotTab = await page.$('.role-tab[data-role="pilot"]');
    if (pilotTab) {
      await pilotTab.click();
      await delay(2000); // Wait for embedded map to render
    } else {
      console.log('Warning: Pilot tab not found');
    }

    // Take screenshot of pilot map
    await page.screenshot({
      path: 'Screenshots/AR-102-pilot-system-map.png',
      fullPage: false
    });

    console.log('Screenshot saved: Screenshots/AR-102-pilot-system-map.png');

    if (errors.length > 0) {
      console.log('JS Errors:', errors.slice(0, 5).join('\n'));
    } else {
      console.log('No JS errors');
    }
  } finally {
    await browser.close();
  }
})().catch(e => console.error('Error:', e.message));

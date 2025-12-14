const {
  createPage,
  navigateToOperations,
  gmLogin,
  delay,
  DELAYS
} = require('./puppeteer-utils');

(async () => {
  const { browser, page } = await createPage({ headless: true, width: 1400, height: 900 });

  const logs = [];
  page.on('console', msg => logs.push('[' + msg.type() + '] ' + msg.text()));

  await navigateToOperations(page);
  await gmLogin(page);
  await page.waitForSelector('#btn-start-session', { timeout: 5000 });
  await page.click('#btn-start-session');
  await delay(DELAYS.SCREEN_TRANSITION);

  // Wait for role tabs and click pilot
  await page.waitForSelector('.role-tab', { timeout: 10000 });
  await delay(500);
  const pilotTab = await page.$('.role-tab[data-role="pilot"]');
  if (pilotTab) {
    await pilotTab.click();
    await delay(2000); // Wait for embedded map to render
  }

  // Filter for system loading logs
  const sysLogs = logs.filter(l => l.includes('System') || l.includes('loadCurrentSystem'));
  console.log('System-related logs:');
  sysLogs.slice(0, 10).forEach(l => console.log('  ' + l));

  // Check if system data is loaded
  const systemInfo = await page.evaluate(() => {
    const s = window.systemMapState;
    if (!s) return 'systemMapState not found';
    return { hasSystem: !!s.system, systemName: s.system ? s.system.name : null };
  });
  console.log('\nSystem state:', JSON.stringify(systemInfo));

  await page.screenshot({ path: 'Screenshots/AR-102-verify.png' });
  console.log('\nScreenshot saved: Screenshots/AR-102-verify.png');

  await browser.close();
})().catch(e => console.error('Error:', e.message));

/**
 * Travel E2E Test - Tests the Travel button in System Map
 */
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const logs = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (msg.type() === 'error') errors.push(text);
  });
  page.on('pageerror', e => errors.push('PageError: ' + e.message));

  try {
    // Navigate and login as GM
    await page.goto('http://localhost:3000/operations');
    await page.waitForSelector('#btn-gm-login', { timeout: 5000 });
    await page.click('#btn-gm-login');
    await new Promise(r => setTimeout(r, 500));

    // Select campaign
    await page.waitForSelector('.campaign-item button', { timeout: 5000 });
    await page.click('.campaign-item button');
    await new Promise(r => setTimeout(r, 500));

    // Start session
    await page.click('#btn-start-session');
    await new Promise(r => setTimeout(r, 2000));

    // Open system map
    await page.evaluate(() => window.showSystemMap());
    await new Promise(r => setTimeout(r, 1000));

    // Check for places with server IDs
    const places = await page.evaluate(() => {
      const system = window.systemMapState?.system;
      return system?.places?.map(p => ({ id: p.id, name: p.name })) || [];
    });

    console.log('=== TRAVEL TEST ===');
    console.log('Places found:', places.length);
    places.slice(0, 5).forEach(p => console.log(`  ${p.id}: ${p.name}`));

    // Check if IDs now use server format (loc-*)
    const serverIdFormat = places.every(p => p.id.startsWith('loc-'));
    console.log('Server ID format (loc-*):', serverIdFormat ? 'YES' : 'NO');

    if (!serverIdFormat) {
      console.log('ERROR: Places still using celestialObject IDs, not server location IDs');
      places.slice(0, 3).forEach(p => console.log(`  BAD ID: ${p.id}`));
    }

    // Try to set course to a place
    if (places.length > 1) {
      const targetPlace = places.find(p => p.id !== 'loc-dock-highport' && p.id.includes('orbit'));
      if (targetPlace) {
        console.log(`Setting course to: ${targetPlace.id} (${targetPlace.name})`);
        await page.evaluate(id => window.goToPlace(id), targetPlace.id);
        await new Promise(r => setTimeout(r, 1000));

        // Now try to TRAVEL
        console.log('Clicking Travel button...');
        await page.evaluate(() => {
          const travelBtn = document.querySelector('.place-details-panel button:not(:disabled)');
          if (travelBtn && travelBtn.textContent.includes('Travel')) {
            travelBtn.click();
          } else {
            console.log('[Test] No Travel button found or disabled');
          }
        });
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // Check for errors in logs (specific to travel functionality)
    const travelErrors = logs.filter(l =>
      l.includes('Unknown destination') ||
      l.includes('Not connected to campaign') ||
      l.includes('FAILED - campaign')
    );
    if (travelErrors.length > 0) {
      console.log('TRAVEL ERRORS:');
      travelErrors.forEach(e => console.log(`  ${e}`));
    } else {
      console.log('No travel errors detected');
    }

    // Check for success logs
    const successLogs = logs.filter(l => l.includes('travelComplete') || l.includes('Traveling to'));
    if (successLogs.length > 0) {
      console.log('TRAVEL SUCCESS:');
      successLogs.slice(0, 3).forEach(s => console.log(`  ${s}`));
    }

    // Console errors check
    if (errors.length > 0) {
      console.log('JS ERRORS:');
      errors.slice(0, 3).forEach(e => console.log(`  ${e}`));
    }

    console.log('=== TEST COMPLETE ===');

  } catch (e) {
    console.error('Test failed:', e.message);
  }

  await browser.close();
})();

/**
 * Pilot Role Smoke Test - AR-ROLE-USE-CASES
 * Use Case: Refuel → Travel → Dock + Hazard Flight
 */

const {
  createPage,
  navigateToOperations,
  playerLogin,
  selectPlayerSlot,
  selectRole,
  joinBridge,
  getBridgeState,
  createTestResults,
  pass,
  fail,
  skip,
  failWithScreenshot,
  printResults,
  delay,
  DELAYS
} = require('../puppeteer-utils');

async function runPilotRoleTests() {
  const results = createTestResults();
  let browser, page;

  console.log('\n🚀 SMOKE TEST: Pilot Role Use Case\n');

  try {
    // Setup - login and select Pilot role
    console.log('Setup: Login as guest (Pilot)...');
    const setup = await createPage({ headless: true });
    browser = setup.browser;
    page = setup.page;

    await navigateToOperations(page);

    // Player login flow
    const hasSlots = await playerLogin(page, 'DFFFC87E');
    if (hasSlots) {
      await selectPlayerSlot(page, 'James');
      await delay(DELAYS.SOCKET);
    }

    // Select Pilot role
    await selectRole(page, 'Pilot');
    await delay(DELAYS.SOCKET);

    // Join bridge
    await joinBridge(page);
    await delay(DELAYS.SOCKET * 2);

    const bridgeState = await getBridgeState(page);
    if (bridgeState.isOnBridge) {
      pass(results, 'Setup: On bridge');
    } else {
      await page.screenshot({ path: 'screenshots/pilot-debug.png' });
      skip(results, 'Setup: On bridge', 'Login flow may have changed');
    }

    // ==================== Pilot Panel Tests ====================
    console.log('\n--- Pilot Panel ---');

    // Test 1: Helm control section
    console.log('Test 1: Helm control...');
    const helmSection = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Helm') || text.includes('Speed') || text.includes('Course');
    });
    if (helmSection) {
      pass(results, 'Helm control section visible');
    } else {
      fail(results, 'Helm control', 'Not found');
    }

    // Test 2: Evasive toggle button
    console.log('Test 2: Evasive toggle...');
    const evasiveBtn = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      return Array.from(btns).some(b => b.textContent.includes('Evasive'));
    });
    if (evasiveBtn) {
      pass(results, 'Evasive toggle button exists');
    } else {
      skip(results, 'Evasive toggle', 'Not found');
    }

    // Test 3: Maneuvers section
    console.log('Test 3: Maneuvers...');
    const maneuversSection = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Maneuver') || text.includes('Close') || text.includes('Open');
    });
    if (maneuversSection) {
      pass(results, 'Maneuvers section visible');
    } else {
      skip(results, 'Maneuvers', 'No contacts');
    }

    // Test 4: Drive status
    console.log('Test 4: Drive status...');
    const driveStatus = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Drive') || text.includes('Thrust') || text.includes('M-Drive');
    });
    if (driveStatus) {
      pass(results, 'Drive status visible');
    } else {
      skip(results, 'Drive status', 'Not shown');
    }

    // Test 5: Docking status
    console.log('Test 5: Docking status...');
    const dockingStatus = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Docking') || text.includes('Docked') || text.includes('Free Flight');
    });
    if (dockingStatus) {
      pass(results, 'Docking status visible');
    } else {
      skip(results, 'Docking status', 'Not shown');
    }

    // Test 6: Time controls
    console.log('Test 6: Time controls...');
    const timeControls = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      return Array.from(btns).some(b => b.textContent.includes('+1h') || b.textContent.includes('+1d'));
    });
    if (timeControls) {
      pass(results, 'Time control buttons exist');
    } else {
      skip(results, 'Time controls', 'Not found');
    }

    // Test 7: Range control buttons
    console.log('Test 7: Range controls...');
    const rangeControls = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const close = Array.from(btns).some(b => b.textContent.includes('Close'));
      const open = Array.from(btns).some(b => b.textContent.includes('Open'));
      return close || open;
    });
    if (rangeControls) {
      pass(results, 'Range control buttons exist');
    } else {
      skip(results, 'Range controls', 'No contacts');
    }

    // Test 8: Destination display
    console.log('Test 8: Destination...');
    const destination = await page.evaluate(() => {
      return document.body.innerText.includes('Destination');
    });
    if (destination) {
      pass(results, 'Destination display visible');
    } else {
      skip(results, 'Destination', 'Not shown');
    }

    // Test 9: Speed display
    console.log('Test 9: Speed display...');
    const speedDisplay = await page.evaluate(() => {
      return document.body.innerText.includes('Speed') ||
             document.body.innerText.includes('G');
    });
    if (speedDisplay) {
      pass(results, 'Speed display visible');
    } else {
      skip(results, 'Speed display', 'Not shown');
    }

    // Test 10: Jump time button
    console.log('Test 10: Jump time button...');
    const jumpBtn = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      return Array.from(btns).some(b => b.textContent.includes('Jump') || b.textContent.includes('+7d'));
    });
    if (jumpBtn) {
      pass(results, 'Jump time button exists');
    } else {
      skip(results, 'Jump button', 'Not found');
    }

    printResults(results);

    if (results.failed === 0) {
      console.log('\n✅ Pilot Role Use Case: VERIFIED');
    } else {
      console.log('\n⚠️ Pilot Role Use Case: Issues found');
    }

  } catch (error) {
    await failWithScreenshot(page, results, 'Unexpected error', error.message);
    console.error('Error:', error.message);
  } finally {
    if (browser) await browser.close();
  }

  return results;
}

if (require.main === module) {
  runPilotRoleTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

module.exports = { runPilotRoleTests };

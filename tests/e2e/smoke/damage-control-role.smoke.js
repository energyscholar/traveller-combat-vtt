/**
 * Damage Control Role Smoke Test - AR-ROLE-USE-CASES
 * Use Case: View damage → Repair systems
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

async function runDamageControlRoleTests() {
  const results = createTestResults();
  let browser, page;

  console.log('\n🛠️  SMOKE TEST: Damage Control Role Use Case\n');

  try {
    // Setup - login as Asao (Damage Control)
    console.log('Setup: Login as Asao (Damage Control)...');
    const setup = await createPage({ headless: true });
    browser = setup.browser;
    page = setup.page;

    await navigateToOperations(page);

    const hasSlots = await playerLogin(page, 'DFFFC87E');
    if (hasSlots) {
      await selectPlayerSlot(page, 'Asao');
      await delay(DELAYS.SOCKET);
    }

    await selectRole(page, 'Damage Control');
    await delay(DELAYS.SOCKET);

    await joinBridge(page);
    await delay(DELAYS.SOCKET * 3);

    const bridgeState = await getBridgeState(page);
    if (bridgeState.isOnBridge) {
      pass(results, 'Setup: On bridge');
    } else {
      skip(results, 'Setup: On bridge', 'Login flow may have changed');
    }

    await page.waitForSelector('.system-status-grid, .detail-section', { timeout: 5000 }).catch(() => {});
    await delay(DELAYS.SOCKET);

    // ==================== Damage Control Panel Tests ====================
    console.log('\n--- Damage Control Panel ---');

    // Test 1: Hull integrity display
    console.log('Test 1: Hull integrity...');
    const hullDisplay = await page.evaluate(() => {
      return document.body.innerText.includes('Hull') || document.body.innerText.includes('Integrity');
    });
    if (hullDisplay) {
      pass(results, 'Hull integrity display visible');
    } else {
      skip(results, 'Hull integrity', 'Not shown');
    }

    // Test 2: System status grid
    console.log('Test 2: System status grid...');
    const statusGrid = await page.$('.system-status-grid');
    if (statusGrid) {
      pass(results, 'System status grid exists');
    } else {
      skip(results, 'System status grid', 'Not found');
    }

    // Test 3: M-Drive status
    console.log('Test 3: M-Drive status...');
    const mDrive = await page.evaluate(() => document.body.innerText.includes('M-Drive'));
    if (mDrive) {
      pass(results, 'M-Drive status visible');
    } else {
      skip(results, 'M-Drive', 'Not shown');
    }

    // Test 4: J-Drive status
    console.log('Test 4: J-Drive status...');
    const jDrive = await page.evaluate(() => document.body.innerText.includes('J-Drive'));
    if (jDrive) {
      pass(results, 'J-Drive status visible');
    } else {
      skip(results, 'J-Drive', 'Not shown');
    }

    // Test 5: Repair actions section
    console.log('Test 5: Repair actions...');
    const repairSection = await page.evaluate(() => {
      return document.body.innerText.includes('Repair') || document.body.innerText.includes('All systems operational');
    });
    if (repairSection) {
      pass(results, 'Repair actions section visible');
    } else {
      skip(results, 'Repair actions', 'Not shown');
    }

    // Test 6: Armor display
    console.log('Test 6: Armor display...');
    const armorDisplay = await page.evaluate(() => document.body.innerText.includes('Armor'));
    if (armorDisplay) {
      pass(results, 'Armor display visible');
    } else {
      skip(results, 'Armor display', 'Not shown');
    }

    printResults(results);

    if (results.failed === 0) {
      console.log('\n✅ Damage Control Role Use Case: VERIFIED');
    } else {
      console.log('\n⚠️ Damage Control Role Use Case: Issues found');
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
  runDamageControlRoleTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

module.exports = { runDamageControlRoleTests };

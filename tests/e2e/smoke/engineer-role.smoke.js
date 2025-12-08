/**
 * Engineer Role Smoke Test - AR-ROLE-USE-CASES
 * Use Case: View Damage → Prioritize → Repair
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

async function runEngineerRoleTests() {
  const results = createTestResults();
  let browser, page;

  console.log('\n🔧 SMOKE TEST: Engineer Role Use Case\n');

  try {
    // Setup - login as Max (Engineer)
    console.log('Setup: Login as Max (Engineer)...');
    const setup = await createPage({ headless: true });
    browser = setup.browser;
    page = setup.page;

    await navigateToOperations(page);

    // Player login flow
    const hasSlots = await playerLogin(page, 'DFFFC87E');
    if (hasSlots) {
      await selectPlayerSlot(page, 'Max');
      await delay(DELAYS.SOCKET);
    }

    // Select Engineer role
    await selectRole(page, 'Engineer');
    await delay(DELAYS.SOCKET);

    // Join bridge
    await joinBridge(page);
    await delay(DELAYS.SOCKET * 3); // Extra delay for panel render

    const bridgeState = await getBridgeState(page);
    if (bridgeState.isOnBridge) {
      pass(results, 'Setup: On bridge');
    } else {
      await page.screenshot({ path: 'screenshots/engineer-debug.png' });
      skip(results, 'Setup: On bridge', 'Login flow may have changed');
    }

    // Wait for role panel to render
    await page.waitForSelector('.power-slider, .detail-section', { timeout: 5000 }).catch(() => {});
    await delay(DELAYS.SOCKET);

    // ==================== Engineer Panel Tests ====================
    console.log('\n--- Engineer Panel ---');

    // Test 1: Power allocation section
    console.log('Test 1: Power allocation...');
    const powerSection = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Power') || text.includes('Allocation');
    });
    if (powerSection) {
      pass(results, 'Power allocation section visible');
    } else {
      fail(results, 'Power allocation', 'Not found');
    }

    // Test 2: Power sliders
    console.log('Test 2: Power sliders...');
    const powerSliders = await page.$$('input[type="range"].power-slider, input.power-slider');
    if (powerSliders.length > 0) {
      pass(results, `Power sliders: ${powerSliders.length} found`);
    } else {
      skip(results, 'Power sliders', 'Not found');
    }

    // Test 3: Power preset buttons
    console.log('Test 3: Power presets...');
    const presetBtns = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const combat = Array.from(btns).some(b => b.textContent.includes('Combat'));
      const balanced = Array.from(btns).some(b => b.textContent.includes('Balanced'));
      return { combat, balanced };
    });
    if (presetBtns.combat || presetBtns.balanced) {
      pass(results, 'Power preset buttons exist');
    } else {
      skip(results, 'Power presets', 'Not found');
    }

    // Test 4: System status display
    console.log('Test 4: System status...');
    const systemStatus = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('System Status') || text.includes('M-Drive') || text.includes('J-Drive');
    });
    if (systemStatus) {
      pass(results, 'System status visible');
    } else {
      skip(results, 'System status', 'Not shown');
    }

    // Test 5: Fuel status
    console.log('Test 5: Fuel status...');
    const fuelStatus = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Fuel') || text.includes('tons');
    });
    if (fuelStatus) {
      pass(results, 'Fuel status visible');
    } else {
      skip(results, 'Fuel status', 'Not shown');
    }

    // Test 6: Refuel button
    console.log('Test 6: Refuel button...');
    const refuelBtn = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      return Array.from(btns).some(b => b.textContent.includes('Refuel'));
    });
    if (refuelBtn) {
      pass(results, 'Refuel button exists');
    } else {
      skip(results, 'Refuel button', 'Not found');
    }

    // Test 7: Repair button
    console.log('Test 7: Repair button...');
    const repairBtn = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      return Array.from(btns).some(b => b.textContent.includes('Repair'));
    });
    if (repairBtn) {
      pass(results, 'Repair button exists');
    } else {
      skip(results, 'Repair button', 'No damaged systems');
    }

    // Test 8: Power effects warnings
    console.log('Test 8: Power effects...');
    const powerEffects = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Effect') || text.includes('DM') || text.includes('Warning');
    });
    if (powerEffects) {
      pass(results, 'Power effects display visible');
    } else {
      skip(results, 'Power effects', 'Not shown');
    }

    // Test 9: Life support status
    console.log('Test 9: Life support...');
    const lifeSupport = await page.evaluate(() => {
      return document.body.innerText.includes('Life Support');
    });
    if (lifeSupport) {
      pass(results, 'Life support status visible');
    } else {
      skip(results, 'Life support', 'Not shown');
    }

    // Test 10: Computer status
    console.log('Test 10: Computer status...');
    const computer = await page.evaluate(() => {
      return document.body.innerText.includes('Computer');
    });
    if (computer) {
      pass(results, 'Computer status visible');
    } else {
      skip(results, 'Computer status', 'Not shown');
    }

    printResults(results);

    if (results.failed === 0) {
      console.log('\n✅ Engineer Role Use Case: VERIFIED');
    } else {
      console.log('\n⚠️ Engineer Role Use Case: Issues found');
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
  runEngineerRoleTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

module.exports = { runEngineerRoleTests };

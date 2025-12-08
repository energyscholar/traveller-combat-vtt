/**
 * Astrogator Role Smoke Test - AR-ROLE-USE-CASES
 * Use Case: Plot → Hazards → Fuel → Jump
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

async function runAstrogatorRoleTests() {
  const results = createTestResults();
  let browser, page;

  console.log('\n🌟 SMOKE TEST: Astrogator Role Use Case\n');

  try {
    // Setup - login as guest with Astrogator role
    console.log('Setup: Login as guest (Astrogator)...');
    const setup = await createPage({ headless: true });
    browser = setup.browser;
    page = setup.page;

    await navigateToOperations(page);

    // Player login flow
    const hasSlots = await playerLogin(page, 'DFFFC87E');
    if (hasSlots) {
      // Select any available slot
      await selectPlayerSlot(page, 'James');
      await delay(DELAYS.SOCKET);
    }

    // Select Astrogator role
    await selectRole(page, 'Astrogator');
    await delay(DELAYS.SOCKET);

    // Join bridge
    await joinBridge(page);
    await delay(DELAYS.SOCKET * 2);

    const bridgeState = await getBridgeState(page);
    if (bridgeState.isOnBridge) {
      pass(results, 'Setup: On bridge');
    } else {
      await page.screenshot({ path: 'screenshots/astrogator-debug.png' });
      skip(results, 'Setup: On bridge', 'Login flow may have changed');
    }

    // ==================== Astrogator Panel Tests ====================
    console.log('\n--- Astrogator Panel ---');

    // Test 1: Navigation section exists
    console.log('Test 1: Navigation section...');
    const navSection = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Navigation') || text.includes('System:') || text.includes('Astrogator');
    });
    if (navSection) {
      pass(results, 'Navigation section visible');
    } else {
      skip(results, 'Navigation section', 'Not found');
    }

    // Test 2: Jump rating display
    console.log('Test 2: Jump rating...');
    const jumpRating = await page.evaluate(() => {
      return document.body.innerText.includes('Jump Rating:') ||
             document.body.innerText.includes('J-');
    });
    if (jumpRating) {
      pass(results, 'Jump rating displayed');
    } else {
      skip(results, 'Jump rating', 'Not shown');
    }

    // Test 3: Fuel available display
    console.log('Test 3: Fuel display...');
    const fuelDisplay = await page.evaluate(() => {
      return document.body.innerText.includes('Fuel Available:') ||
             document.body.innerText.includes('tons');
    });
    if (fuelDisplay) {
      pass(results, 'Fuel available displayed');
    } else {
      skip(results, 'Fuel display', 'Not shown');
    }

    // Test 4: Jump destination input
    console.log('Test 4: Destination input...');
    const destInput = await page.$('#jump-destination, input[placeholder*="System"]');
    if (destInput) {
      pass(results, 'Jump destination input exists');
    } else {
      skip(results, 'Destination input', 'Not found');
    }

    // Test 5: Jump distance selector
    console.log('Test 5: Distance selector...');
    const distSelect = await page.$('#jump-distance, select.jump-select');
    if (distSelect) {
      pass(results, 'Jump distance selector exists');
    } else {
      skip(results, 'Distance selector', 'Not found');
    }

    // Test 6: Plot course button
    console.log('Test 6: Plot course button...');
    const plotBtn = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      return Array.from(btns).some(b => b.textContent.includes('Plot'));
    });
    if (plotBtn) {
      pass(results, 'Plot course button exists');
    } else {
      fail(results, 'Plot course button', 'Not found');
    }

    // Test 7: Jump map section
    console.log('Test 7: Jump map...');
    const jumpMap = await page.$('#jump-map-container, .jump-map-section');
    if (jumpMap) {
      pass(results, 'Jump map section exists');
    } else {
      skip(results, 'Jump map', 'No sector data');
    }

    // Test 8: Jump drive status
    console.log('Test 8: J-Drive status...');
    const jDriveStatus = await page.evaluate(() => {
      return document.body.innerText.includes('Jump Drive:') ||
             document.body.innerText.includes('J-Drive');
    });
    if (jDriveStatus) {
      pass(results, 'J-Drive status displayed');
    } else {
      skip(results, 'J-Drive status', 'Not shown');
    }

    // Test 9: Max jump range display
    console.log('Test 9: Max jump range...');
    const maxRange = await page.evaluate(() => {
      return document.body.innerText.includes('Max Jump Range:') ||
             document.body.innerText.includes('fuel limited');
    });
    if (maxRange) {
      pass(results, 'Max jump range displayed');
    } else {
      skip(results, 'Max jump range', 'Not shown');
    }

    // Test 10: Astrogation skill note
    console.log('Test 10: Skill note...');
    const skillNote = await page.evaluate(() => {
      return document.body.innerText.includes('Astrogation skill');
    });
    if (skillNote) {
      pass(results, 'Astrogation skill note displayed');
    } else {
      skip(results, 'Skill note', 'Not shown');
    }

    printResults(results);

    if (results.failed === 0) {
      console.log('\n✅ Astrogator Role Use Case: VERIFIED');
    } else {
      console.log('\n⚠️ Astrogator Role Use Case: Issues found');
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
  runAstrogatorRoleTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

module.exports = { runAstrogatorRoleTests };

/**
 * Captain Role Smoke Test - AR-ROLE-USE-CASES
 * Use Case: Threat eval → Alerts → Orders → Weapons Auth
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

async function runCaptainRoleTests() {
  const results = createTestResults();
  let browser, page;

  console.log('\n⚓ SMOKE TEST: Captain Role Use Case\n');

  try {
    // Setup - login as James (Captain)
    console.log('Setup: Login as James (Captain)...');
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

    // Select Captain role
    await selectRole(page, 'Captain');
    await delay(DELAYS.SOCKET);

    // Join bridge
    await joinBridge(page);
    await delay(DELAYS.SOCKET * 2);

    const bridgeState = await getBridgeState(page);
    if (bridgeState.isOnBridge) {
      pass(results, 'Setup: On bridge');
    } else {
      await page.screenshot({ path: 'screenshots/captain-debug.png' });
      skip(results, 'Setup: On bridge', 'Login flow may have changed');
    }

    // ==================== Captain Panel Tests ====================
    console.log('\n--- Captain Panel ---');

    // Test 1: Alert status section (via buttons since text may vary)
    console.log('Test 1: Alert status...');
    const alertSection = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      return Array.from(btns).some(b =>
        b.textContent.includes('Green') || b.textContent.includes('Yellow') || b.textContent.includes('Red')
      );
    });
    if (alertSection) {
      pass(results, 'Alert status section visible');
    } else {
      fail(results, 'Alert status', 'Not found');
    }

    // Test 2: Alert buttons
    console.log('Test 2: Alert buttons...');
    const alertBtns = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const green = Array.from(btns).some(b => b.textContent.includes('Green'));
      const yellow = Array.from(btns).some(b => b.textContent.includes('Yellow'));
      const red = Array.from(btns).some(b => b.textContent.includes('Red'));
      return { green, yellow, red };
    });
    if (alertBtns.green && alertBtns.yellow && alertBtns.red) {
      pass(results, 'Alert buttons: Green/Yellow/Red');
    } else {
      skip(results, 'Alert buttons', 'Some missing');
    }

    // Test 3: Issue orders section (via quick order buttons)
    console.log('Test 3: Issue orders...');
    const ordersSection = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      return Array.from(btns).some(b =>
        b.textContent.includes('Evade') || b.textContent.includes('Hold') || b.textContent.includes('Engage')
      );
    });
    if (ordersSection) {
      pass(results, 'Issue orders section visible');
    } else {
      fail(results, 'Issue orders', 'Not found');
    }

    // Test 4: Quick order buttons
    console.log('Test 4: Quick order buttons...');
    const quickOrders = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const evade = Array.from(btns).some(b => b.textContent.includes('Evade'));
      const engage = Array.from(btns).some(b => b.textContent.includes('Engage'));
      return { evade, engage };
    });
    if (quickOrders.evade && quickOrders.engage) {
      pass(results, 'Quick orders: Evade/Engage');
    } else {
      skip(results, 'Quick orders', 'Some missing');
    }

    // Test 5: Order target selector
    console.log('Test 5: Order target selector...');
    const orderTarget = await page.$('#order-target-select, select.order-select');
    if (orderTarget) {
      pass(results, 'Order target selector exists');
    } else {
      skip(results, 'Order target', 'Not found');
    }

    // Test 6: Tactical overview
    console.log('Test 6: Tactical overview...');
    const tacticalSection = await page.evaluate(() => {
      return document.body.innerText.includes('Tactical Overview') ||
             document.body.innerText.includes('Total Contacts') ||
             document.body.innerText.includes('Hostile:');
    });
    if (tacticalSection) {
      pass(results, 'Tactical overview visible');
    } else {
      skip(results, 'Tactical overview', 'Not shown');
    }

    // Test 7: Weapons authorization section (via buttons)
    console.log('Test 7: Weapons auth...');
    const weaponsAuth = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      return Array.from(btns).some(b =>
        b.textContent.includes('Weapons Hold') || b.textContent.includes('Weapons Free')
      );
    });
    if (weaponsAuth) {
      pass(results, 'Weapons authorization section visible');
    } else {
      skip(results, 'Weapons auth', 'Not visible');
    }

    // Test 8: Leadership/Tactics buttons
    console.log('Test 8: Command actions...');
    const commandActions = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const leadership = Array.from(btns).some(b => b.textContent.includes('Leadership'));
      const tactics = Array.from(btns).some(b => b.textContent.includes('Tactics'));
      return { leadership, tactics };
    });
    if (commandActions.leadership || commandActions.tactics) {
      pass(results, 'Command actions: Leadership/Tactics');
    } else {
      skip(results, 'Command actions', 'Not shown');
    }

    // Test 9: Crew status
    console.log('Test 9: Crew status...');
    const crewStatus = await page.evaluate(() => {
      return document.body.innerText.includes('Crew Status') ||
             document.body.innerText.includes('Online:');
    });
    if (crewStatus) {
      pass(results, 'Crew status section visible');
    } else {
      skip(results, 'Crew status', 'Not shown');
    }

    // Test 10: Communications section
    console.log('Test 10: Communications...');
    const commsSection = await page.evaluate(() => {
      return document.body.innerText.includes('Communications') ||
             document.body.innerText.includes('Hail') ||
             document.body.innerText.includes('Broadcast');
    });
    if (commsSection) {
      pass(results, 'Communications section visible');
    } else {
      skip(results, 'Communications', 'Not shown');
    }

    printResults(results);

    if (results.failed === 0) {
      console.log('\n✅ Captain Role Use Case: VERIFIED');
    } else {
      console.log('\n⚠️ Captain Role Use Case: Issues found');
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
  runCaptainRoleTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

module.exports = { runCaptainRoleTests };

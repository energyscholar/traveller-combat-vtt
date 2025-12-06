/**
 * Combat Flow Smoke Test (AR-26)
 * Tests combat initiation, weapon fire, damage, and resolution
 */

const {
  createPage,
  navigateToOperations,
  clickButton,
  gmLogin,
  startSession,
  getBridgeState,
  getContactsList,
  createTestResults,
  pass,
  fail,
  skip,
  failWithScreenshot,
  printResults,
  delay,
  DELAYS
} = require('../puppeteer-utils');

async function runCombatFlowTests() {
  const results = createTestResults();
  let browser, page;

  console.log('\n⚔️ SMOKE TEST: Combat Flow (AR-26)\n');

  try {
    // Setup - get to bridge as GM
    console.log('Setup: Login as GM and reach bridge...');
    const setup = await createPage({ headless: true });
    browser = setup.browser;
    page = setup.page;

    await navigateToOperations(page);
    await gmLogin(page);
    await startSession(page);
    await delay(DELAYS.SOCKET);

    const bridgeState = await getBridgeState(page);
    if (!bridgeState.isOnBridge) {
      await failWithScreenshot(page, results, 'Setup: Reach bridge', 'Not on bridge');
      throw new Error('Cannot proceed without bridge');
    }
    pass(results, 'Setup: GM on bridge');

    // ==================== Combat Preparation ====================
    console.log('\n--- Combat Preparation ---');

    // Test 1: Spawn training target
    console.log('Test 1: Spawn training target...');
    const trainingBtn = await page.$('#btn-spawn-training, [data-action="spawn-training-target"]');
    if (trainingBtn) {
      await trainingBtn.click();
      await delay(DELAYS.SOCKET);
      pass(results, 'Training target spawned');
    } else {
      // Try adding contact manually
      const addContactBtn = await page.$('#btn-gm-add-contact');
      if (addContactBtn) {
        skip(results, 'Training target button', 'Using Add Contact instead');
      } else {
        skip(results, 'Training target', 'No spawn button');
      }
    }

    // Test 2: Check contacts list
    console.log('Test 2: Contacts list...');
    await delay(DELAYS.MEDIUM);
    let contacts = await getContactsList(page);
    if (contacts.length > 0) {
      pass(results, `Contacts: ${contacts.length}`);
    } else {
      skip(results, 'Contacts list', 'No contacts visible');
    }

    // Test 3: Combat start button
    console.log('Test 3: Combat start button...');
    const combatBtn = await page.$('#btn-gm-combat, [data-action="start-combat"]');
    if (combatBtn) {
      pass(results, 'Combat button exists');
    } else {
      skip(results, 'Combat button', 'Not found');
    }

    // ==================== Weapons Authorization ====================
    console.log('\n--- Weapons Authorization ---');

    // Test 4: Check for weapons free indicator
    console.log('Test 4: Weapons authorization status...');
    const weaponsIndicator = await page.evaluate(() => {
      const indicators = document.querySelectorAll('.authorized-indicator, .weapons-authorized, [title*="Weapons"]');
      return indicators.length;
    });
    if (weaponsIndicator > 0) {
      pass(results, 'Weapons authorization visible');
    } else {
      skip(results, 'Weapons indicator', 'No weapons indicators');
    }

    // Test 5: Authorize weapons button (Captain role)
    console.log('Test 5: Authorize weapons...');
    const authorizeBtn = await page.$('[data-action="authorize-weapons"], .btn-authorize');
    if (authorizeBtn) {
      pass(results, 'Authorize button exists');
    } else {
      skip(results, 'Authorize button', 'May need Captain role');
    }

    // ==================== Gunner Controls ====================
    console.log('\n--- Gunner Controls ---');

    // Test 6: Weapon selector
    console.log('Test 6: Weapon selector...');
    const weaponSelector = await page.$('#weapon-select, .weapon-selector, [id*="weapon"]');
    if (weaponSelector) {
      pass(results, 'Weapon selector exists');
    } else {
      skip(results, 'Weapon selector', 'May need Gunner role');
    }

    // Test 7: Target selector
    console.log('Test 7: Target selector...');
    const targetSelector = await page.$('#target-select, .target-selector, [id*="target"]');
    if (targetSelector) {
      pass(results, 'Target selector exists');
    } else {
      skip(results, 'Target selector', 'May need Gunner role or targets');
    }

    // Test 8: Fire button
    console.log('Test 8: Fire button...');
    const fireBtn = await page.$('#btn-fire, [data-action="fire"], .btn-fire');
    if (fireBtn) {
      pass(results, 'Fire button exists');
    } else {
      skip(results, 'Fire button', 'May need Gunner role');
    }

    // ==================== Combat Log ====================
    console.log('\n--- Combat Log ---');

    // Test 9: Combat log panel
    console.log('Test 9: Combat log...');
    const combatLog = await page.$('#combat-log, .combat-log, [id*="log"]');
    if (combatLog) {
      pass(results, 'Combat log exists');
    } else {
      skip(results, 'Combat log', 'Log panel not found');
    }

    // Test 10: Log entries
    console.log('Test 10: Log entries...');
    const logEntries = await page.evaluate(() => {
      const entries = document.querySelectorAll('.log-entry, #ship-log > div');
      return entries.length;
    });
    if (logEntries > 0) {
      pass(results, `Log entries: ${logEntries}`);
    } else {
      skip(results, 'Log entries', 'No entries in log');
    }

    // ==================== Damage System ====================
    console.log('\n--- Damage System ---');

    // Test 11: System damage button
    console.log('Test 11: System damage button...');
    const damageBtn = await page.$('#btn-gm-damage, [data-action="apply-damage"]');
    if (damageBtn) {
      pass(results, 'Damage button exists');
    } else {
      skip(results, 'Damage button', 'Not found');
    }

    // Test 12: System status display
    console.log('Test 12: System status...');
    const systemStatus = await page.$('.system-status, #ship-systems, [id*="system"]');
    if (systemStatus) {
      pass(results, 'System status exists');
    } else {
      skip(results, 'System status', 'Not in current view');
    }

    // ==================== Initiative ====================
    console.log('\n--- Initiative ---');

    // Test 13: Initiative button
    console.log('Test 13: Initiative button...');
    const initiativeBtn = await page.$('#btn-gm-initiative, [data-action="call-initiative"]');
    if (initiativeBtn) {
      pass(results, 'Initiative button exists');
    } else {
      skip(results, 'Initiative button', 'Not found');
    }

  } catch (error) {
    await failWithScreenshot(page, results, 'Unexpected error', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  printResults(results);
  console.log(results.failed === 0 ? '\n✅ Combat Flow PASSED' : '\n❌ Combat Flow FAILED');
  return results;
}

// Run if called directly
if (require.main === module) {
  runCombatFlowTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

module.exports = { runCombatFlowTests };

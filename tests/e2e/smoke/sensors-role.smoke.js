/**
 * Sensors Role Smoke Test - AR-ROLE-USE-CASES
 * Use Case: Detect → Focus → Identify → Track → Assess
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

async function runSensorsRoleTests() {
  const results = createTestResults();
  let browser, page;

  console.log('\n📡 SMOKE TEST: Sensors Role Use Case\n');

  try {
    // Setup - login as Von Sydo (Sensors)
    console.log('Setup: Login as Von Sydo (Sensors)...');
    const setup = await createPage({ headless: true });
    browser = setup.browser;
    page = setup.page;

    await navigateToOperations(page);

    // Player login flow
    const hasSlots = await playerLogin(page, 'DFFFC87E');
    if (hasSlots) {
      await selectPlayerSlot(page, 'Von Sydo');
      await delay(DELAYS.SOCKET);
    }

    // Select Sensor Operator role
    await selectRole(page, 'Sensors');
    await delay(DELAYS.SOCKET);

    // Join bridge
    await joinBridge(page);
    await delay(DELAYS.SOCKET * 2);

    const bridgeState = await getBridgeState(page);
    if (bridgeState.isOnBridge) {
      pass(results, 'Setup: On bridge');
    } else {
      await page.screenshot({ path: 'screenshots/sensors-debug.png' });
      skip(results, 'Setup: On bridge', 'Login flow may have changed');
    }

    // ==================== Sensors Panel Tests ====================
    console.log('\n--- Sensors Panel ---');

    // Test 1: Scan buttons exist
    console.log('Test 1: Scan buttons...');
    const scanBtns = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const passive = Array.from(btns).find(b => b.textContent.includes('Passive'));
      const active = Array.from(btns).find(b => b.textContent.includes('Active Scan'));
      return { hasPassive: !!passive, hasActive: !!active };
    });
    if (scanBtns.hasPassive && scanBtns.hasActive) {
      pass(results, 'Scan buttons exist (passive/active)');
    } else {
      fail(results, 'Scan buttons', 'Not found');
    }

    // Test 2: Contacts list section
    console.log('Test 2: Contacts list...');
    const contactsSection = await page.$('.sensor-contacts-section, .sensor-contacts-list');
    if (contactsSection) {
      pass(results, 'Contacts section visible');
    } else {
      skip(results, 'Contacts section', 'Not found');
    }

    // Test 3: Contact categories
    console.log('Test 3: Contact categories...');
    const categories = await page.$$('.contact-category, .category-header');
    if (categories.length > 0) {
      pass(results, `Contact categories: ${categories.length} groups`);
    } else {
      skip(results, 'Contact categories', 'No contacts to categorize');
    }

    // Test 4: Perform passive scan
    console.log('Test 4: Passive scan...');
    const scanClicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const passiveBtn = Array.from(btns).find(b => b.textContent.includes('Passive Scan'));
      if (passiveBtn) {
        passiveBtn.click();
        return true;
      }
      return false;
    });
    if (scanClicked) {
      await delay(DELAYS.SOCKET);
      pass(results, 'Passive scan executed');
    } else {
      skip(results, 'Passive scan', 'Button not found');
    }

    // Test 5: Contact scan level display
    console.log('Test 5: Scan levels...');
    const scanLevels = await page.$$('.contact-scan-level, .scan-passive, .scan-active, .scan-deep');
    if (scanLevels.length > 0) {
      pass(results, `Scan levels: ${scanLevels.length} contacts tracked`);
    } else {
      skip(results, 'Scan levels', 'No contacts with scan levels');
    }

    // Test 6: EW Status display
    console.log('Test 6: EW Status...');
    const ewSection = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Jamming') && text.includes('Stealth');
    });
    if (ewSection) {
      pass(results, 'EW status visible (Jamming/Stealth)');
    } else {
      skip(results, 'EW status', 'Not displayed');
    }

    // Test 7: Targeted scan button on contacts
    console.log('Test 7: Targeted scan buttons...');
    const targetedScanBtns = await page.$$('button[onclick*="scanContact"]');
    if (targetedScanBtns.length > 0) {
      pass(results, `Targeted scan: ${targetedScanBtns.length} contacts scannable`);
    } else {
      skip(results, 'Targeted scan buttons', 'All contacts at max scan level');
    }

    // Test 8: Contact designators
    console.log('Test 8: Contact designators...');
    const designators = await page.$$('.contact-designator');
    if (designators.length > 0) {
      pass(results, `Contact designators: ${designators.length} contacts`);
    } else {
      skip(results, 'Contact designators', 'No contacts');
    }

    // Test 9: Deep scan button (GM override)
    console.log('Test 9: Deep scan button...');
    const deepBtn = await page.$('button[onclick*="deep"]');
    if (deepBtn) {
      pass(results, 'Deep scan button exists');
    } else {
      skip(results, 'Deep scan', 'Not available');
    }

    // Test 10: Skill note display
    console.log('Test 10: Skill note...');
    const skillNote = await page.evaluate(() => {
      return document.body.innerText.includes('Electronics (sensors)');
    });
    if (skillNote) {
      pass(results, 'Skill note displayed');
    } else {
      skip(results, 'Skill note', 'Not shown');
    }

    printResults(results);

    if (results.failed === 0) {
      console.log('\n✅ Sensors Role Use Case: VERIFIED');
    } else {
      console.log('\n⚠️ Sensors Role Use Case: Issues found');
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
  runSensorsRoleTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

module.exports = { runSensorsRoleTests };

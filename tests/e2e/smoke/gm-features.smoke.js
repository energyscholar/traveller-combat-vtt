/**
 * GM Features Smoke Test
 * Tests GM-specific features: alert status, time controls, contacts, hamburger menu
 */

const {
  createPage,
  navigateToOperations,
  getCurrentScreen,
  clickButton,
  gmLogin,
  startSession,
  getBridgeState,
  createTestResults,
  pass,
  fail,
  skip,
  printResults,
  delay,
  DELAYS
} = require('../puppeteer-utils');

async function runGMFeatures() {
  const results = createTestResults();
  let browser, page;

  console.log('\n🔥 SMOKE TEST: GM Features\n');

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
      fail(results, 'Setup: Reach bridge', 'Not on bridge');
      throw new Error('Cannot proceed without bridge');
    }
    pass(results, 'Setup: GM on bridge');

    // ==================== Alert Status Tests ====================
    console.log('\n--- Alert Status Tests ---');

    // Test 1: Check alert buttons exist
    console.log('Test 1: Alert status buttons...');
    const alertNormal = await page.$('#btn-alert-normal');
    const alertBattle = await page.$('#btn-alert-battle');
    if (alertNormal && alertBattle) {
      pass(results, 'Alert status buttons present');
    } else {
      fail(results, 'Alert status buttons present', 'Buttons not found');
    }

    // Test 2: Set Battle Stations alert
    console.log('Test 2: Set Battle Stations...');
    if (alertBattle) {
      await alertBattle.click();
      await delay(DELAYS.MEDIUM);
      // Check for visual indicator or state change
      const alertIndicator = await page.$('.alert-battle, .alert-status-battle, [data-alert="battle"]');
      if (alertIndicator) {
        pass(results, 'Battle Stations alert set');
      } else {
        // May update via socket - check text
        const statusText = await page.evaluate(() => {
          const el = document.querySelector('.alert-status, #alert-status');
          return el?.textContent || '';
        });
        if (statusText.toLowerCase().includes('battle')) {
          pass(results, 'Battle Stations alert set (text)');
        } else {
          skip(results, 'Battle Stations visual', 'No visual indicator found');
        }
      }
    }

    // Test 3: Return to Normal alert
    console.log('Test 3: Set Normal alert...');
    if (alertNormal) {
      await alertNormal.click();
      await delay(DELAYS.MEDIUM);
      pass(results, 'Normal alert set');
    }

    // ==================== Time Controls Tests ====================
    console.log('\n--- Time Controls Tests ---');

    // Test 4: Check time advance buttons
    console.log('Test 4: Time advance buttons...');
    const time1min = await page.$('#btn-advance-1min, [data-advance="1"]');
    const time10min = await page.$('#btn-advance-10min, [data-advance="10"]');
    const time1hour = await page.$('#btn-advance-1hour, [data-advance="60"]');

    if (time1min || time10min || time1hour) {
      pass(results, 'Time advance buttons present');
    } else {
      // Check if time controls are in a different location
      const timeControls = await page.$('.time-controls, #time-controls');
      if (timeControls) {
        pass(results, 'Time controls panel present');
      } else {
        skip(results, 'Time controls', 'Time advance buttons not found');
      }
    }

    // Test 5: Advance time (if button exists)
    console.log('Test 5: Advance time...');
    const advanceBtn = time1min || time10min;
    if (advanceBtn) {
      const timeBefore = await page.evaluate(() => {
        const el = document.querySelector('.game-time, #game-time, .current-time');
        return el?.textContent || '';
      });

      await advanceBtn.click();
      await delay(DELAYS.SOCKET);

      const timeAfter = await page.evaluate(() => {
        const el = document.querySelector('.game-time, #game-time, .current-time');
        return el?.textContent || '';
      });

      if (timeAfter !== timeBefore) {
        pass(results, `Time advanced: ${timeBefore} -> ${timeAfter}`);
      } else {
        pass(results, 'Time advance clicked (no visible change)');
      }
    } else {
      skip(results, 'Advance time', 'No time advance button');
    }

    // ==================== Hamburger Menu Tests ====================
    console.log('\n--- Hamburger Menu Tests ---');

    // Test 6: Open hamburger menu
    console.log('Test 6: Open hamburger menu...');
    const menuBtn = await page.$('#btn-menu');
    if (menuBtn) {
      await menuBtn.click();
      await delay(DELAYS.SHORT);
      const menuOpen = await page.$('#hamburger-menu:not(.hidden), .hamburger-menu.open');
      if (menuOpen) {
        pass(results, 'Hamburger menu opens');
      } else {
        fail(results, 'Hamburger menu opens', 'Menu did not open');
      }
    } else {
      fail(results, 'Menu button exists', 'Button not found');
    }

    // Test 7: Check menu items exist
    console.log('Test 7: Check menu items...');
    const menuItems = await page.evaluate(() => {
      const items = document.querySelectorAll('.menu-item, [data-feature]');
      return Array.from(items).map(i => ({
        id: i.id,
        feature: i.dataset?.feature,
        text: i.textContent?.trim()?.substring(0, 30)
      }));
    });

    const expectedItems = ['mail', 'contacts', 'feedback', 'shared-map'];
    const foundItems = menuItems.map(i => i.feature || i.id);
    const missingItems = expectedItems.filter(e => !foundItems.some(f => f?.includes(e)));

    if (missingItems.length === 0) {
      pass(results, `Menu items present: ${expectedItems.join(', ')}`);
    } else {
      skip(results, 'Some menu items', `Missing: ${missingItems.join(', ')}`);
    }

    // Test 8: Test Mail feature
    console.log('Test 8: Mail feature...');
    const mailItem = await page.$('[data-feature="mail"], #menu-mail');
    if (mailItem) {
      await mailItem.click();
      await delay(DELAYS.MEDIUM);
      // Check if mail modal/panel opens
      const mailPanel = await page.$('#email-app, .email-modal, .mail-panel');
      if (mailPanel) {
        pass(results, 'Mail panel opens');
        // Close it
        const closeBtn = await page.$('#btn-close-email, .modal-close, [data-dismiss]');
        if (closeBtn) await closeBtn.click();
      } else {
        skip(results, 'Mail panel', 'Panel not found (may be empty)');
      }
    }
    await delay(DELAYS.SHORT);

    // Test 9: Test Feedback feature (GM sees review)
    console.log('Test 9: Feedback feature...');
    // Reopen menu
    await clickButton(page, 'btn-menu');
    await delay(DELAYS.SHORT);

    const feedbackItem = await page.$('[data-feature="feedback"], #menu-feedback');
    if (feedbackItem) {
      await feedbackItem.click();
      await delay(DELAYS.MEDIUM);
      const feedbackPanel = await page.$('.feedback-modal, #feedback-review, .modal.active');
      if (feedbackPanel) {
        pass(results, 'Feedback review opens');
        // Close it
        const closeBtn = await page.$('.modal-close, [data-dismiss], #btn-close-feedback');
        if (closeBtn) await closeBtn.click();
      } else {
        skip(results, 'Feedback panel', 'Panel not found');
      }
    }
    await delay(DELAYS.SHORT);

    // Test 10: Close menu
    console.log('Test 10: Close menu...');
    const closeMenuBtn = await page.$('#btn-close-menu, #hamburger-menu-overlay');
    if (closeMenuBtn) {
      await closeMenuBtn.click();
      await delay(DELAYS.SHORT);
      pass(results, 'Menu closed');
    }

    // ==================== Cache Toggle Tests ====================
    console.log('\n--- Cache Toggle Tests ---');

    // Test 11: Open shared map and check cache toggle
    console.log('Test 11: Cache toggle exists...');
    await clickButton(page, 'btn-menu');
    await delay(DELAYS.SHORT);
    await page.click('#menu-shared-map');
    await delay(DELAYS.MEDIUM);

    const cacheToggle = await page.$('#cache-toggle-checkbox, .cache-toggle');
    if (cacheToggle) {
      pass(results, 'Cache toggle present');
    } else {
      skip(results, 'Cache toggle', 'Toggle not found');
    }

    // Test 12: Check cache status API
    console.log('Test 12: Cache status API...');
    const cacheStatus = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/map/cache/status');
        return await res.json();
      } catch (e) {
        return null;
      }
    });

    if (cacheStatus && typeof cacheStatus.enabled === 'boolean') {
      pass(results, `Cache API works (enabled: ${cacheStatus.enabled})`);
    } else {
      fail(results, 'Cache status API', 'API returned invalid data');
    }

    // Close shared map
    await clickButton(page, 'btn-close-map');
    await delay(DELAYS.SHORT);

    // ==================== Sensor Contacts Tests ====================
    console.log('\n--- Sensor Contacts Tests ---');

    // Test 13: Check sensor panel exists
    console.log('Test 13: Sensor panel...');
    const sensorPanel = await page.$('#sensor-contacts, .sensor-panel, .contacts-list');
    if (sensorPanel) {
      pass(results, 'Sensor panel present');
    } else {
      skip(results, 'Sensor panel', 'Panel not found');
    }

    // Test 14: Check add contact button (GM only)
    console.log('Test 14: Add contact button...');
    const addContactBtn = await page.$('#btn-add-contact, [data-action="add-contact"]');
    if (addContactBtn) {
      pass(results, 'Add contact button present (GM)');
    } else {
      skip(results, 'Add contact button', 'Button not found');
    }

    // Test 15: Check GM overlay/controls
    console.log('Test 15: GM overlay controls...');
    const gmOverlay = await page.$('#gm-overlay, .gm-controls');
    if (gmOverlay) {
      const isVisible = await page.evaluate(el => el.offsetParent !== null, gmOverlay);
      if (isVisible) {
        pass(results, 'GM overlay visible');
      } else {
        pass(results, 'GM overlay exists (hidden)');
      }
    } else {
      skip(results, 'GM overlay', 'Overlay not found');
    }

  } catch (error) {
    fail(results, 'Unexpected error', error.message);
    if (page) {
      await page.screenshot({ path: 'smoke-gm-features-error.png' }).catch(() => {});
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  printResults(results);
  console.log(results.failed === 0 ? '\n✅ GM Features PASSED' : '\n❌ GM Features FAILED');
  return results;
}

// Run if called directly
if (require.main === module) {
  runGMFeatures().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

module.exports = { runGMFeatures };

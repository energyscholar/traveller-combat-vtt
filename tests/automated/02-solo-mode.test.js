/**
 * Stage 13.1: Solo Mode Tests
 * Test solo mode functionality and help debug AI weapon detection
 */

const { launchBrowser, createPage, TIMEOUTS } = require('./setup');
const { screenshotOnFailure, takeScreenshot } = require('./helpers/screenshots');
const { clickElement, selectOption, getText, elementExists } = require('./helpers/elements');
const { waitForVisible, waitForText, waitForCondition } = require('./helpers/wait');

describe('02 - Solo Mode Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await launchBrowser();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await createPage(browser);
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('Can start solo mode', async () => {
    try {
      // Navigate directly to solo mode
      await page.goto('http://localhost:3000?mode=solo', {
        waitUntil: 'networkidle0',
        timeout: TIMEOUTS.long
      });

      // Should show ship selection screen
      await waitForVisible(page, '#ship-selection-screen');

      // Verify we're in solo mode (not multiplayer)
      const url = page.url();
      expect(url).toContain('mode=solo');

      await takeScreenshot(page, 'solo-mode-started');
      console.log('✅ Solo mode started');
    } catch (err) {
      await screenshotOnFailure(page, 'solo-start-failed');
      throw err;
    }
  });

  test('Can select ship in solo mode', async () => {
    try {
      await page.goto('http://localhost:3000?mode=solo', {
        waitUntil: 'networkidle0',
        timeout: TIMEOUTS.long
      });

      // Click scout ship option
      await clickElement(page, '#ship-option-scout', 'select-scout');

      // Verify ship is selected (should have 'selected' class)
      const isSelected = await page.$eval('#ship-option-scout', el =>
        el.classList.contains('selected')
      );
      expect(isSelected).toBe(true);

      console.log('✅ Ship selected in solo mode');
    } catch (err) {
      await screenshotOnFailure(page, 'solo-select-ship-failed');
      throw err;
    }
  });

  test('Can start combat in solo mode', async () => {
    try {
      await page.goto('http://localhost:3000?mode=solo', {
        waitUntil: 'networkidle0',
        timeout: TIMEOUTS.long
      });

      // Select scout
      await clickElement(page, '#ship-option-scout', 'select-scout-combat');

      // Select range
      await selectOption(page, '#range-select', 'Short', 'select-range');

      // Click ready button
      await clickElement(page, '#ready-button', 'ready-button');

      // Wait for combat HUD to appear
      await waitForVisible(page, '#space-combat-hud', TIMEOUTS.long);

      // Verify combat started
      const hudVisible = await elementExists(page, '#space-combat-hud');
      expect(hudVisible).toBe(true);

      await takeScreenshot(page, 'solo-combat-started');
      console.log('✅ Solo combat started');
    } catch (err) {
      await screenshotOnFailure(page, 'solo-start-combat-failed');
      throw err;
    }
  });

  test('Can inspect AI opponent data structures', async () => {
    try {
      await page.goto('http://localhost:3000?mode=solo', {
        waitUntil: 'networkidle0',
        timeout: TIMEOUTS.long
      });

      // Start combat
      await clickElement(page, '#ship-option-scout');
      await selectOption(page, '#range-select', 'Short');
      await clickElement(page, '#ready-button');

      // Wait for combat to start
      await waitForVisible(page, '#space-combat-hud', TIMEOUTS.long);

      // Give combat a moment to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Inspect combat state in browser console
      const combatState = await page.evaluate(() => {
        // This runs in the browser context
        return {
          hasSocket: typeof socket !== 'undefined',
          socketConnected: typeof socket !== 'undefined' ? socket.connected : false,
          // Try to access any global combat state
          windowKeys: Object.keys(window).filter(k =>
            k.toLowerCase().includes('combat') ||
            k.toLowerCase().includes('state') ||
            k.toLowerCase().includes('player')
          )
        };
      });

      console.log('🔍 Combat State:', JSON.stringify(combatState, null, 2));

      // Take screenshot for manual inspection
      await takeScreenshot(page, 'solo-combat-state');

      console.log('✅ AI data inspection complete');
    } catch (err) {
      await screenshotOnFailure(page, 'solo-inspect-failed');
      throw err;
    }
  });

  test('Combat log shows activity', async () => {
    try {
      await page.goto('http://localhost:3000?mode=solo', {
        waitUntil: 'networkidle0',
        timeout: TIMEOUTS.long
      });

      // Start combat
      await clickElement(page, '#ship-option-scout');
      await selectOption(page, '#range-select', 'Short');
      await clickElement(page, '#ready-button');

      // Wait for combat
      await waitForVisible(page, '#space-combat-hud', TIMEOUTS.long);

      // Wait a bit for combat log to populate
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get combat log content
      const combatLogText = await getText(page, '#combat-log');

      console.log('📜 Combat Log:');
      console.log(combatLogText);

      // Verify log has some content
      expect(combatLogText.length).toBeGreaterThan(10);

      await takeScreenshot(page, 'solo-combat-log');
      console.log('✅ Combat log inspection complete');
    } catch (err) {
      await screenshotOnFailure(page, 'solo-combat-log-failed');
      throw err;
    }
  });

  test('Can fire weapon in solo mode', async () => {
    try {
      await page.goto('http://localhost:3000?mode=solo', {
        waitUntil: 'networkidle0',
        timeout: TIMEOUTS.long
      });

      // Start combat
      await clickElement(page, '#ship-option-scout');
      await selectOption(page, '#range-select', 'Short');
      await clickElement(page, '#ready-button');

      // Wait for combat
      await waitForVisible(page, '#space-combat-hud', TIMEOUTS.long);

      // Wait for fire button to be enabled
      await waitForCondition(page, () => {
        const fireBtn = document.querySelector('#fire-button');
        return fireBtn && !fireBtn.disabled;
      }, TIMEOUTS.medium);

      // Get combat log before firing
      const logBefore = await getText(page, '#combat-log');

      // Fire weapon
      await clickElement(page, '#fire-button', 'fire-weapon');

      // Wait for combat log to update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get combat log after firing
      const logAfter = await getText(page, '#combat-log');

      // Verify log changed
      expect(logAfter).not.toBe(logBefore);

      await takeScreenshot(page, 'solo-after-firing');
      console.log('✅ Weapon fired successfully');
    } catch (err) {
      await screenshotOnFailure(page, 'solo-fire-weapon-failed');
      throw err;
    }
  });
});

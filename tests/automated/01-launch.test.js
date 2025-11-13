/**
 * Stage 13.1: Basic Launch Test
 * Smoke test to verify Puppeteer and app work together
 */

const { launchBrowser, createPage, TIMEOUTS } = require('./setup');
const { screenshotOnFailure, takeScreenshot } = require('./helpers/screenshots');

describe('01 - Basic Launch Tests', () => {
  let browser;
  let page;

  // Launch browser before all tests
  beforeAll(async () => {
    browser = await launchBrowser();
  });

  // Close browser after all tests
  afterAll(async () => {
    if (browser) {
      await browser.close();
      console.log('✅ Browser closed');
    }
  });

  // Create fresh page before each test
  beforeEach(async () => {
    page = await createPage(browser);
  });

  // Close page after each test
  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('Can launch browser and create page', async () => {
    expect(browser).toBeDefined();
    expect(page).toBeDefined();
  });

  test('Can navigate to main menu', async () => {
    try {
      // Navigate to app
      await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle0',
        timeout: TIMEOUTS.long
      });

      // Wait for main menu to appear
      await page.waitForSelector('#main-menu-screen', {
        visible: true,
        timeout: TIMEOUTS.medium
      });

      // Verify we're on the main menu
      const mainMenu = await page.$('#main-menu-screen');
      expect(mainMenu).not.toBeNull();

      // Take success screenshot
      await takeScreenshot(page, 'main-menu-loaded');

      console.log('✅ Main menu loaded successfully');
    } catch (err) {
      await screenshotOnFailure(page, 'main-menu-load-failed');
      throw err;
    }
  });

  test('Main menu has all expected buttons', async () => {
    try {
      await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle0',
        timeout: TIMEOUTS.long
      });

      await page.waitForSelector('#main-menu-screen', {
        visible: true,
        timeout: TIMEOUTS.medium
      });

      // Check for Space Battle button
      const spaceBattleBtn = await page.$('#btn-space-battle');
      expect(spaceBattleBtn).not.toBeNull();

      // Check for Solo Battle button
      const soloBattleBtn = await page.$('#btn-solo-battle');
      expect(soloBattleBtn).not.toBeNull();

      // Check for Customize Ship button
      const customizeBtn = await page.$('#btn-customize-ship');
      expect(customizeBtn).not.toBeNull();

      console.log('✅ All menu buttons present');
    } catch (err) {
      await screenshotOnFailure(page, 'menu-buttons-check-failed');
      throw err;
    }
  });

  test('Can click Space Battle button', async () => {
    try {
      await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle0',
        timeout: TIMEOUTS.long
      });

      // Wait for menu
      await page.waitForSelector('#btn-space-battle', {
        visible: true,
        timeout: TIMEOUTS.medium
      });

      // Click Space Battle button
      await page.click('#btn-space-battle');

      // Wait for ship selection screen
      await page.waitForSelector('#ship-selection-screen', {
        visible: true,
        timeout: TIMEOUTS.medium
      });

      // Verify we're on ship selection
      const shipSelection = await page.$('#ship-selection-screen');
      expect(shipSelection).not.toBeNull();

      // Take screenshot
      await takeScreenshot(page, 'ship-selection-loaded');

      console.log('✅ Navigated to ship selection');
    } catch (err) {
      await screenshotOnFailure(page, 'space-battle-click-failed');
      throw err;
    }
  });

  test('Can click Solo Battle button', async () => {
    try {
      await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle0',
        timeout: TIMEOUTS.long
      });

      // Wait for menu
      await page.waitForSelector('#btn-solo-battle', {
        visible: true,
        timeout: TIMEOUTS.medium
      });

      // Click Solo Battle button
      await page.click('#btn-solo-battle');

      // Wait for ship selection screen (solo mode also shows ship selection)
      await page.waitForSelector('#ship-selection-screen', {
        visible: true,
        timeout: TIMEOUTS.medium
      });

      // Verify we're on ship selection
      const shipSelection = await page.$('#ship-selection-screen');
      expect(shipSelection).not.toBeNull();

      // Take screenshot
      await takeScreenshot(page, 'solo-ship-selection-loaded');

      console.log('✅ Navigated to solo mode ship selection');
    } catch (err) {
      await screenshotOnFailure(page, 'solo-battle-click-failed');
      throw err;
    }
  });
});

/**
 * System Map Smoke Test
 * Tests AR-29.5: Star system map display with procedural generation
 */

const {
  createPage,
  navigateToOperations,
  clickButton,
  gmLogin,
  startSession,
  createTestResults,
  pass,
  fail,
  printResults,
  delay,
  DELAYS
} = require('../puppeteer-utils');

const path = require('path');
const fs = require('fs');

// Screenshot directory
const SCREENSHOT_DIR = path.join(__dirname, '..', '..', '..', 'screenshots');

async function takeScreenshot(page, name) {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  const filename = `system-map-${name}-${Date.now()}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`  📸 Screenshot: ${filename}`);
  return filepath;
}

async function runSystemMapSmokeTest() {
  const results = createTestResults();
  let browser, page;

  console.log('\n🔥 SMOKE TEST: System Map (AR-29.5)\n');

  try {
    // Setup
    const setup = await createPage({ headless: true, logConsole: true });
    browser = setup.browser;
    page = setup.page;

    // Step 1: Navigate and GM Login
    console.log('Step 1: Navigate and GM Login...');
    await navigateToOperations(page);

    // Click GM Login and wait for campaigns to load via socket
    await clickButton(page, 'btn-gm-login');
    await delay(DELAYS.SOCKET * 2); // Extra wait for socket

    // Take debug screenshot
    await takeScreenshot(page, 'after-gm-click');

    // Check if campaigns loaded, if not try creating one
    const campaignList = await page.$('#campaign-list');
    const campaigns = await page.evaluate(() => {
      const list = document.getElementById('campaign-list');
      if (!list) return [];
      const items = list.querySelectorAll('.campaign-card, button, [data-campaign-id]');
      return Array.from(items).map(el => el.textContent?.trim()?.substring(0, 50));
    });

    console.log(`  Found ${campaigns.length} campaigns:`, campaigns);

    if (campaigns.length === 0) {
      // Try to create a new campaign
      console.log('  No campaigns found, attempting to create one...');
      const createBtn = await page.$('#btn-create-campaign, button[id*="create"]');
      if (createBtn) {
        await createBtn.click();
        await delay(DELAYS.SOCKET);
        const nameInput = await page.$('#campaign-name, input[name="campaign-name"]');
        if (nameInput) {
          await nameInput.type('Test Campaign');
          const submitBtn = await page.$('button[type="submit"], #btn-save-campaign');
          if (submitBtn) await submitBtn.click();
          await delay(DELAYS.SOCKET);
        }
      }
    }

    // Click first campaign if available
    const firstCampaign = await page.$('#campaign-list .campaign-card, #campaign-list button');
    if (firstCampaign) {
      await firstCampaign.click();
      await delay(DELAYS.SOCKET);
      pass(results, 'GM Login successful');
    } else {
      // Check if we're already past campaign select (auto-selected)
      const onSetup = await page.$('#gm-setup-screen.active');
      if (onSetup) {
        pass(results, 'GM Login successful (auto-selected campaign)');
      } else {
        fail(results, 'GM Login', 'No campaigns available');
        throw new Error('Cannot proceed without campaign');
      }
    }

    // Step 2: Start session
    console.log('Step 2: Start session...');
    await startSession(page);
    await delay(DELAYS.LONG);
    pass(results, 'Session started');

    // Step 3: Open hamburger menu
    console.log('Step 3: Open hamburger menu...');
    const hamburger = await page.$('.hamburger-menu-toggle, #hamburger-toggle, [aria-label="Menu"]');
    if (hamburger) {
      await hamburger.click();
      await delay(DELAYS.MEDIUM);
      pass(results, 'Hamburger menu opened');
    } else {
      // Try clicking by selector or fallback
      const clicked = await page.evaluate(() => {
        const btn = document.querySelector('.hamburger-menu-toggle') ||
                    document.querySelector('#hamburger-toggle') ||
                    document.querySelector('[class*="hamburger"]');
        if (btn) { btn.click(); return true; }
        return false;
      });
      if (clicked) {
        await delay(DELAYS.MEDIUM);
        pass(results, 'Hamburger menu opened (fallback)');
      } else {
        fail(results, 'Open hamburger menu', 'Menu toggle not found');
      }
    }

    // Step 4: Click System Map option
    console.log('Step 4: Click System Map menu item...');
    const systemMapClicked = await page.evaluate(() => {
      const menuItems = document.querySelectorAll('.hamburger-menu-item, [data-action], .menu-item');
      for (const item of menuItems) {
        if (item.textContent.includes('System Map')) {
          item.click();
          return true;
        }
      }
      // Also try by data-action
      const actionItem = document.querySelector('[data-action="system-map"]');
      if (actionItem) { actionItem.click(); return true; }
      return false;
    });

    if (systemMapClicked) {
      await delay(DELAYS.LONG);
      pass(results, 'System Map menu clicked');
    } else {
      fail(results, 'Click System Map', 'Menu item not found');
    }

    // Step 5: Verify system map overlay opened
    console.log('Step 5: Verify system map overlay...');
    const overlayExists = await page.$('#system-map-overlay');
    if (overlayExists) {
      pass(results, 'System map overlay created');
    } else {
      fail(results, 'System map overlay', 'Overlay not found');
    }

    // Step 6: Verify canvas was created
    console.log('Step 6: Verify canvas rendering...');
    const canvasExists = await page.$('#system-map-canvas');
    if (canvasExists) {
      const canvasInfo = await page.evaluate(() => {
        const canvas = document.getElementById('system-map-canvas');
        return {
          width: canvas.width,
          height: canvas.height,
          visible: canvas.offsetParent !== null
        };
      });
      if (canvasInfo.width > 0 && canvasInfo.height > 0) {
        pass(results, `Canvas created (${canvasInfo.width}x${canvasInfo.height})`);
      } else {
        fail(results, 'Canvas created', 'Canvas has zero dimensions');
      }
    } else {
      fail(results, 'Canvas exists', 'Canvas element not found');
    }

    // Take screenshot of initial system
    await takeScreenshot(page, 'initial');

    // Step 7: Test system selector exists
    console.log('Step 7: Verify test system selector...');
    const selectExists = await page.$('#test-system-select');
    if (selectExists) {
      pass(results, 'Test system selector available');
      // Take screenshots of test systems
      const testSystems = ['dorannia', 'flammarion', 'caladbolg'];
      for (const sys of testSystems) {
        await page.select('#test-system-select', sys);
        await delay(DELAYS.MEDIUM);
        await takeScreenshot(page, sys);
      }
    } else {
      fail(results, 'System selector', 'Selector not found');
    }

    // Step 8: Verify time controls exist
    console.log('Step 8: Verify time controls...');
    const timeControlsExist = await page.$('#btn-time-forward-100');
    const pauseBtnExists = await page.$('#btn-time-pause');
    const speedSelectExists = await page.$('#time-speed-select');
    if (timeControlsExist && pauseBtnExists && speedSelectExists) {
      pass(results, 'Time controls present (forward, pause, speed)');
    } else {
      fail(results, 'Time controls', 'Some controls missing');
    }

    // Step 9: Close system map
    console.log('Step 9: Close system map...');
    await page.click('#btn-close-system-map');
    await delay(DELAYS.MEDIUM);

    const overlayGone = await page.$('#system-map-overlay');
    if (!overlayGone) {
      pass(results, 'System map closed');
    } else {
      // Check if removed from DOM
      const stillVisible = await page.evaluate(() => {
        const el = document.getElementById('system-map-overlay');
        return el && el.offsetParent !== null;
      });
      if (!stillVisible) {
        pass(results, 'System map closed');
      } else {
        fail(results, 'Close system map', 'Overlay still visible');
      }
    }

  } catch (error) {
    console.error('  ❌ TEST ERROR:', error.message);
    fail(results, 'Test execution', error.message);

    // Try to take error screenshot
    if (page) {
      try {
        await takeScreenshot(page, 'error');
      } catch (e) {}
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  printResults(results);
  return results;
}

// Run if called directly
if (require.main === module) {
  runSystemMapSmokeTest()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Test runner error:', err);
      process.exit(1);
    });
}

module.exports = { runSystemMapSmokeTest };

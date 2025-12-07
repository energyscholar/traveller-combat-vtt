/**
 * Traveller Map Smoke Test
 * Tests AR-MAPFIX-1 Phase 2: Shared TravellerMap display
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

const SCREENSHOT_DIR = path.join(__dirname, '..', '..', '..', 'screenshots');

// Track screenshots taken during test for cleanup
const capturedScreenshots = [];

async function takeScreenshot(page, name) {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  const filename = `traveller-map-${name}-${Date.now()}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  capturedScreenshots.push(filepath);
  console.log(`  📸 Screenshot: ${filename}`);
  return filepath;
}

// Clean up screenshots after successful test
function cleanupTestScreenshots() {
  for (const filepath of capturedScreenshots) {
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (e) { /* ignore cleanup errors */ }
  }
  capturedScreenshots.length = 0;
}

async function runTravellerMapSmokeTest() {
  const results = createTestResults();
  let browser, page;

  console.log('\n🔥 SMOKE TEST: Traveller Map (AR-MAPFIX-1)\n');

  try {
    // Setup
    const setup = await createPage({ headless: true, logConsole: true });
    browser = setup.browser;
    page = setup.page;

    // Step 1: Navigate and GM Login
    console.log('Step 1: Navigate and GM Login...');
    await navigateToOperations(page);
    await clickButton(page, 'btn-gm-login');
    await delay(DELAYS.SOCKET * 3); // Extra wait for socket + campaign load

    // Take debug screenshot
    await takeScreenshot(page, 'after-gm-click');

    // Check if campaigns loaded
    const campaigns = await page.evaluate(() => {
      const list = document.getElementById('campaign-list');
      if (!list) return [];
      const items = list.querySelectorAll('.campaign-card, button, [data-campaign-id]');
      return Array.from(items).map(el => el.textContent?.trim()?.substring(0, 50));
    });
    console.log(`  Found ${campaigns.length} campaigns:`, campaigns);

    // Select first campaign
    const firstCampaign = await page.$('#campaign-list .campaign-card, #campaign-list button');
    if (firstCampaign) {
      await firstCampaign.click();
      await delay(DELAYS.SOCKET);
      pass(results, 'GM Login successful');
    } else {
      // Check if we're already past campaign select
      const onSetup = await page.$('#gm-setup-screen.active');
      if (onSetup) {
        pass(results, 'GM Login successful (auto-selected)');
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
    const menuClicked = await page.evaluate(() => {
      const btn = document.querySelector('.hamburger-menu-toggle') ||
                  document.querySelector('#hamburger-toggle');
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (menuClicked) {
      await delay(DELAYS.MEDIUM);
      pass(results, 'Hamburger menu opened');
    } else {
      fail(results, 'Open hamburger menu', 'Menu toggle not found');
    }

    // Step 4: Click Shared Map option
    console.log('Step 4: Click Shared Map menu item...');
    const sharedMapClicked = await page.evaluate(() => {
      const menuItems = document.querySelectorAll('.hamburger-menu-item, [data-action], .menu-item');
      for (const item of menuItems) {
        if (item.textContent.includes('Shared Map')) {
          item.click();
          return true;
        }
      }
      return false;
    });

    if (sharedMapClicked) {
      await delay(DELAYS.LONG * 2); // Extra time for map image to load
      pass(results, 'Shared Map menu clicked');
    } else {
      fail(results, 'Click Shared Map', 'Menu item not found');
    }

    // Step 5: Verify shared map overlay opened
    console.log('Step 5: Verify shared map overlay...');
    const overlayExists = await page.$('#shared-map-overlay');
    if (overlayExists) {
      pass(results, 'Shared map overlay created');
    } else {
      fail(results, 'Shared map overlay', 'Overlay not found');
    }

    // Step 6: Verify map image loaded
    console.log('Step 6: Verify map image...');
    const mapImageInfo = await page.evaluate(() => {
      const img = document.getElementById('shared-map-image');
      if (!img) return { found: false };
      return {
        found: true,
        src: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        loaded: img.complete && img.naturalHeight > 0
      };
    });

    if (mapImageInfo.found && mapImageInfo.loaded) {
      pass(results, `Map image loaded (${mapImageInfo.width}x${mapImageInfo.height})`);
    } else if (mapImageInfo.found) {
      // Image exists but not loaded yet - wait more
      await delay(DELAYS.LONG * 2);
      const recheck = await page.evaluate(() => {
        const img = document.getElementById('shared-map-image');
        return img && img.complete && img.naturalHeight > 0;
      });
      if (recheck) {
        pass(results, 'Map image loaded (after wait)');
      } else {
        fail(results, 'Map image load', 'Image not fully loaded');
      }
    } else {
      fail(results, 'Map image', 'Image element not found');
    }

    // Take screenshot of map
    await takeScreenshot(page, 'subsector-view');

    // Step 7: Verify map is showing correct sector
    console.log('Step 7: Verify map sector...');
    const mapSrc = await page.evaluate(() => {
      const img = document.getElementById('shared-map-image');
      return img ? img.src : '';
    });

    if (mapSrc.includes('sector=')) {
      const sectorMatch = mapSrc.match(/sector=([^&]+)/);
      const hexMatch = mapSrc.match(/hex=(\d+)/);
      console.log(`  Map showing: sector=${sectorMatch?.[1]}, hex=${hexMatch?.[1]}`);
      pass(results, `Map showing ${sectorMatch?.[1] || 'unknown'} sector`);
    } else {
      fail(results, 'Map sector', 'Cannot determine sector from URL');
    }

    // Step 8: Close map and verify return
    console.log('Step 8: Close shared map...');
    const closeBtn = await page.$('#shared-map-close');
    if (closeBtn) {
      await closeBtn.click();
      await delay(DELAYS.MEDIUM);

      const overlayGone = await page.evaluate(() => {
        const el = document.getElementById('shared-map-overlay');
        return !el || el.classList.contains('hidden');
      });

      if (overlayGone) {
        pass(results, 'Shared map closed');
      } else {
        fail(results, 'Close map', 'Overlay still visible');
      }
    } else {
      fail(results, 'Close button', 'Not found');
    }

    await takeScreenshot(page, 'after-close');

  } catch (error) {
    console.error('  ❌ TEST ERROR:', error.message);
    fail(results, 'Test execution', error.message);

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

  // Auto-cleanup screenshots on success (keep on failure for debugging)
  if (results.failed === 0) {
    cleanupTestScreenshots();
    console.log('  🧹 Screenshots cleaned up (test passed)');
  } else {
    console.log(`  📁 Screenshots preserved for debugging (${capturedScreenshots.length} files)`);
  }

  return results;
}

// Run if called directly
if (require.main === module) {
  runTravellerMapSmokeTest()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Test runner error:', err);
      process.exit(1);
    });
}

module.exports = { runTravellerMapSmokeTest };

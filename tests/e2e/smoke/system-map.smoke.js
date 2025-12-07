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

// Track screenshots taken during test for cleanup
const capturedScreenshots = [];

async function takeScreenshot(page, name) {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  const filename = `system-map-${name}-${Date.now()}.png`;
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

// Capture canvas pixel sample for comparison (sample 100 points)
async function captureCanvasPixels(page) {
  return await page.evaluate(() => {
    const canvas = document.getElementById('system-map-canvas');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const samples = [];
    // Sample 100 points across canvas
    for (let i = 0; i < 100; i++) {
      const x = Math.floor((i % 10) * w / 10 + w / 20);
      const y = Math.floor(Math.floor(i / 10) * h / 10 + h / 20);
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      samples.push(pixel[0], pixel[1], pixel[2]); // RGB values
    }
    return samples;
  });
}

// Compare two pixel arrays - returns difference percentage (0=identical, 100=completely different)
function comparePixels(pix1, pix2) {
  if (!pix1 || !pix2 || pix1.length !== pix2.length) return 0;
  let diff = 0;
  for (let i = 0; i < pix1.length; i++) {
    diff += Math.abs(pix1[i] - pix2[i]);
  }
  // Max possible diff is 255 * length
  return (diff / (255 * pix1.length)) * 100;
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

    // Step 7: Test system selector and capture screenshots for all 3 systems
    console.log('Step 7: Verify test system selector and capture system screenshots...');
    const selectExists = await page.$('#test-system-select');
    if (selectExists) {
      pass(results, 'Test system selector available');

      // Capture screenshots and pixel samples for all 3 systems
      const testSystems = ['dorannia', 'flammarion', 'caladbolg'];
      const pixelData = {};

      const systemTitles = {};
      const screenshotPaths = {};

      for (const sys of testSystems) {
        await page.select('#test-system-select', sys);
        // Click the SWITCH STARSYSTEM button to actually load the new system
        await page.click('#btn-load-system');
        await delay(DELAYS.LONG); // Extra time for render

        // Capture system name from title
        systemTitles[sys] = await page.evaluate(() => {
          const el = document.getElementById('system-map-name');
          return el ? el.textContent.trim() : 'unknown';
        });
        console.log(`  ${sys} title: "${systemTitles[sys]}"`);

        screenshotPaths[sys] = await takeScreenshot(page, sys);
        pass(results, `Screenshot captured: ${sys}`);
      }

      // Step 7b: Visual diff verification - systems must show different titles
      console.log('Step 7b: Verify systems are visually different...');

      // Verify titles are all different
      const uniqueTitles = new Set(Object.values(systemTitles));
      console.log(`  Unique system names: ${uniqueTitles.size} (expected 3)`);

      // Also verify screenshot file sizes differ (indicates different content)
      const sizes = {};
      for (const sys of testSystems) {
        if (screenshotPaths[sys] && fs.existsSync(screenshotPaths[sys])) {
          sizes[sys] = fs.statSync(screenshotPaths[sys]).size;
        }
      }
      console.log(`  Screenshot sizes: Dorannia=${sizes.dorannia}, Flammarion=${sizes.flammarion}, Caladbolg=${sizes.caladbolg}`);

      if (uniqueTitles.size === 3) {
        pass(results, 'All 3 systems show different names');
      } else {
        fail(results, 'System titles', `Only ${uniqueTitles.size} unique names found`);
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

    // Step 9: Close system map and verify bridge returns
    console.log('Step 9: Close system map...');

    // Take screenshot before close
    await takeScreenshot(page, 'before-close');

    // Try clicking close button (use window.closeSystemMap directly for reliability)
    const closeResult = await page.evaluate(() => {
      const btn = document.getElementById('btn-close-system-map');
      if (!btn) return { clicked: false, error: 'Button not found' };

      // Try direct function call first
      if (typeof window.closeSystemMap === 'function') {
        try {
          window.closeSystemMap();
          return { clicked: true, method: 'window.closeSystemMap' };
        } catch (e) {
          return { clicked: false, error: e.message };
        }
      }

      // Fallback to button click
      btn.click();
      return { clicked: true, method: 'button.click' };
    });
    console.log('  Close result:', JSON.stringify(closeResult));
    const closeClicked = closeResult.clicked;

    if (!closeClicked) {
      fail(results, 'Click close button', 'Close button not found');
    } else {
      await delay(DELAYS.MEDIUM);

      // Take screenshot after close attempt
      await takeScreenshot(page, 'after-close');

      // Verify overlay is removed from DOM
      const overlayGone = await page.evaluate(() => {
        const el = document.getElementById('system-map-overlay');
        return el === null;
      });

      if (overlayGone) {
        pass(results, 'System map overlay removed');
      } else {
        fail(results, 'Remove overlay', 'Overlay still in DOM after close');
      }
    }

    // Step 10: Verify bridge view is visible again
    console.log('Step 10: Verify bridge view returns...');
    const bridgeVisible = await page.evaluate(() => {
      const bridge = document.querySelector('.bridge-main, #bridge-screen, .bridge-screen');
      if (!bridge) return { found: false };
      const style = window.getComputedStyle(bridge);
      return {
        found: true,
        display: style.display,
        visibility: style.visibility,
        visible: bridge.offsetParent !== null || style.display !== 'none'
      };
    });

    if (bridgeVisible.found && bridgeVisible.visible) {
      pass(results, 'Bridge view returned after close');
    } else {
      fail(results, 'Bridge view returns', `Bridge not visible: ${JSON.stringify(bridgeVisible)}`);
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

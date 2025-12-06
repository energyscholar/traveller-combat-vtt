/**
 * Comprehensive UI Explorer - Puppeteer Script
 * Systematically explores every screen and function, taking screenshots
 *
 * Run: node tests/e2e/comprehensive-ui-explorer.js
 * Output: screenshots/ui-explorer/*.png
 */

const {
  createPage,
  navigateToOperations,
  clickButton,
  gmLogin,
  startSession,
  getBridgeState,
  delay,
  DELAYS
} = require('./puppeteer-utils');

const fs = require('fs');
const path = require('path');

// Screenshot output directory
const SCREENSHOT_DIR = path.join(__dirname, '../../screenshots/ui-explorer');

// All roles to explore
const ROLES = [
  'captain',
  'pilot',
  'astrogator',
  'engineer',
  'gunner',
  'sensors',
  'comms',
  'damage_control',
  'medic',
  'steward'
];

/**
 * Ensure screenshot directory exists
 */
function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

/**
 * Take a screenshot with timestamp
 */
async function screenshot(page, name) {
  const filename = `${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`  [SCREENSHOT] ${filename}`);
  return filepath;
}

/**
 * Explore login screen
 */
async function exploreLoginScreen(page) {
  console.log('\n=== LOGIN SCREEN ===');

  await screenshot(page, '01-login-screen');

  // Check for GM and Player login buttons
  const gmBtn = await page.$('#btn-gm-login');
  const playerBtn = await page.$('#btn-player-login');

  console.log(`  GM Login button: ${gmBtn ? 'Found' : 'Missing'}`);
  console.log(`  Player Login button: ${playerBtn ? 'Found' : 'Missing'}`);
}

/**
 * Explore GM campaign selection
 */
async function exploreGMCampaignSelect(page) {
  console.log('\n=== GM CAMPAIGN SELECT ===');

  await clickButton(page, 'btn-gm-login');
  await delay(DELAYS.LONG);

  await screenshot(page, '02-gm-campaign-select');

  // Get campaign cards
  const campaigns = await page.evaluate(() => {
    const cards = document.querySelectorAll('.campaign-card');
    return Array.from(cards).map(c => c.querySelector('.campaign-title')?.textContent);
  });

  console.log(`  Campaigns found: ${campaigns.length}`);
  campaigns.forEach(c => console.log(`    - ${c}`));
}

/**
 * Explore GM setup screen
 */
async function exploreGMSetup(page) {
  console.log('\n=== GM SETUP ===');

  // Click Select button on first campaign card
  const selectBtn = await page.$('.btn-select');
  if (selectBtn) {
    await selectBtn.click();
    await delay(DELAYS.LONG);
  } else {
    console.log('  [WARNING] Select button not found');
  }

  await screenshot(page, '03-gm-setup');

  // Get campaign code
  const code = await page.evaluate(() => {
    return document.querySelector('#campaign-code-value')?.textContent;
  });
  console.log(`  Campaign code: ${code}`);
}

/**
 * Explore bridge main screen
 */
async function exploreBridge(page) {
  console.log('\n=== BRIDGE MAIN ===');

  // Start session
  const startBtn = await page.$('#btn-start-session');
  if (startBtn) {
    await startBtn.click();
    await delay(DELAYS.LONG);
  }

  await screenshot(page, '04-bridge-overview');

  // Check key elements
  const elements = await page.evaluate(() => {
    return {
      header: !!document.querySelector('.bridge-header'),
      statusBar: !!document.querySelector('.ship-status-bar'),
      rolePanel: !!document.querySelector('#role-panel'),
      sensorDisplay: !!document.querySelector('#sensor-display'),
      systemsButton: !!document.querySelector('#btn-ship-systems')
    };
  });

  console.log('  Bridge elements:');
  Object.entries(elements).forEach(([k, v]) => {
    console.log(`    ${k}: ${v ? 'Present' : 'Missing'}`);
  });
}

/**
 * Explore ship systems panel
 */
async function exploreShipSystems(page) {
  console.log('\n=== SHIP SYSTEMS PANEL ===');

  const systemsBtn = await page.$('#btn-ship-systems');
  if (systemsBtn) {
    await systemsBtn.click();
    await delay(DELAYS.SHORT);
    await screenshot(page, '05-ship-systems-panel');

    // Get system statuses
    const systems = await page.evaluate(() => {
      const items = document.querySelectorAll('.system-item');
      return Array.from(items).map(item => ({
        name: item.querySelector('.system-name')?.textContent,
        status: item.querySelector('.system-status-text')?.textContent,
        damaged: item.classList.contains('damaged') || item.classList.contains('critical')
      }));
    });

    console.log(`  Systems found: ${systems.length}`);
    systems.forEach(s => {
      console.log(`    ${s.name}: ${s.status}${s.damaged ? ' [DAMAGED]' : ''}`);
    });

    // Close panel
    const closeBtn = await page.$('#btn-close-ship-systems');
    if (closeBtn) await closeBtn.click();
    await delay(DELAYS.SHORT);
  }
}

/**
 * Explore each role panel
 */
async function exploreRoles(page) {
  console.log('\n=== ROLE PANELS ===');

  for (const role of ROLES) {
    console.log(`\n  --- ${role.toUpperCase()} ---`);

    // Try to select role
    const roleBtn = await page.$(`[data-role="${role}"], #role-${role}, .role-btn[data-role="${role}"]`);

    if (roleBtn) {
      await roleBtn.click();
      await delay(DELAYS.MEDIUM);

      await screenshot(page, `06-role-${role}`);

      // Get role panel content
      const panelInfo = await page.evaluate((roleName) => {
        const panel = document.querySelector('#role-panel');
        const buttons = Array.from(panel?.querySelectorAll('button') || [])
          .map(b => b.textContent?.trim())
          .filter(t => t && t.length < 30);

        return {
          hasContent: !!panel?.innerHTML,
          buttons: buttons.slice(0, 10) // First 10 buttons
        };
      }, role);

      if (panelInfo.buttons.length > 0) {
        console.log(`    Buttons: ${panelInfo.buttons.join(', ')}`);
      }
    } else {
      console.log(`    [Role button not found]`);
    }
  }
}

/**
 * Explore sensor contacts and tooltip
 */
async function exploreSensorContacts(page) {
  console.log('\n=== SENSOR CONTACTS ===');

  // First select sensors role
  const sensorsBtn = await page.$('[data-role="sensors"]');
  if (sensorsBtn) {
    await sensorsBtn.click();
    await delay(DELAYS.MEDIUM);
  }

  await screenshot(page, '07-sensor-contacts-list');

  // Get contacts
  const contacts = await page.evaluate(() => {
    const items = document.querySelectorAll('.contact-item');
    return Array.from(items).map(item => ({
      name: item.querySelector('.contact-name')?.textContent?.trim(),
      range: item.querySelector('.contact-range-band')?.textContent?.trim()
    }));
  });

  console.log(`  Contacts found: ${contacts.length}`);
  contacts.slice(0, 5).forEach(c => {
    console.log(`    - ${c.name} (${c.range || 'unknown range'})`);
  });

  // Click first contact to show tooltip
  const firstContact = await page.$('.contact-item');
  if (firstContact) {
    await firstContact.click();
    await delay(DELAYS.SHORT);
    await screenshot(page, '08-sensor-tooltip');

    // Check tooltip position
    const tooltipInfo = await page.evaluate(() => {
      const tooltip = document.querySelector('.contact-tooltip:not(.hidden)');
      if (!tooltip) return null;

      const rect = tooltip.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0 && rect.height > 0
      };
    });

    if (tooltipInfo) {
      console.log(`  Tooltip: visible=${tooltipInfo.visible}, position=(${tooltipInfo.left}, ${tooltipInfo.top})`);
    } else {
      console.log('  Tooltip: NOT VISIBLE');
    }
  }
}

/**
 * Explore system map
 */
async function exploreSystemMap(page) {
  console.log('\n=== SYSTEM MAP ===');

  // Look for System Map button
  const mapBtn = await page.$('#btn-show-system-map, [data-action="show-system-map"]');
  if (mapBtn) {
    await mapBtn.click();
    await delay(DELAYS.LONG);

    await screenshot(page, '09-system-map');

    // Check for map elements
    const mapInfo = await page.evaluate(() => {
      return {
        canvas: !!document.querySelector('#system-map-canvas'),
        controls: !!document.querySelector('.system-map-controls'),
        systemSelect: !!document.querySelector('#test-system-select'),
        loadButton: !!document.querySelector('#btn-load-system'),
        placesButton: !!document.querySelector('#btn-places')
      };
    });

    console.log('  Map elements:');
    Object.entries(mapInfo).forEach(([k, v]) => {
      console.log(`    ${k}: ${v ? 'Present' : 'Missing'}`);
    });

    // Close map
    const closeBtn = await page.$('#btn-close-system-map');
    if (closeBtn) {
      await closeBtn.click();
      await delay(DELAYS.SHORT);
    }
  } else {
    console.log('  System Map button not found');
  }
}

/**
 * Explore GM overlay/menu
 */
async function exploreGMMenu(page) {
  console.log('\n=== GM MENU ===');

  const menuBtn = await page.$('#btn-bridge-menu');
  if (menuBtn) {
    await menuBtn.click();
    await delay(DELAYS.SHORT);

    await screenshot(page, '10-gm-menu');

    // Get menu items
    const menuItems = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.gm-overlay button, #gm-overlay button, .bridge-menu button');
      return Array.from(buttons).map(b => b.textContent?.trim()).filter(t => t);
    });

    console.log(`  Menu items: ${menuItems.join(', ')}`);

    // Close menu
    const closeBtn = await page.$('.btn-close-menu, #btn-close-gm-overlay');
    if (closeBtn) {
      await closeBtn.click();
      await delay(DELAYS.SHORT);
    }
  }
}

/**
 * Main exploration function
 */
async function runExplorer() {
  console.log('\n========================================');
  console.log('COMPREHENSIVE UI EXPLORER');
  console.log('========================================');

  ensureScreenshotDir();
  console.log(`\nScreenshots will be saved to: ${SCREENSHOT_DIR}\n`);

  let browser, page;

  try {
    // Setup
    const setup = await createPage({ headless: true });
    browser = setup.browser;
    page = setup.page;

    // Navigate to app
    await navigateToOperations(page);

    // Explore each area
    await exploreLoginScreen(page);
    await exploreGMCampaignSelect(page);
    await exploreGMSetup(page);
    await exploreBridge(page);
    await exploreShipSystems(page);
    await exploreRoles(page);
    await exploreSensorContacts(page);
    await exploreSystemMap(page);
    await exploreGMMenu(page);

    console.log('\n========================================');
    console.log('EXPLORATION COMPLETE');
    console.log('========================================');
    console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`);

    // List screenshots
    const files = fs.readdirSync(SCREENSHOT_DIR);
    console.log(`\nGenerated ${files.length} screenshots:`);
    files.forEach(f => console.log(`  - ${f}`));

  } catch (error) {
    console.error('\n[ERROR]', error.message);
    if (page) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error-state.png') });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run
runExplorer().catch(console.error);

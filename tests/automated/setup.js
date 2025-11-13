/**
 * Automated Test Setup
 * Stage 13.1: Basic Puppeteer configuration
 */

const puppeteer = require('puppeteer');

// Global configuration for ChromeOS
const BROWSER_CONFIG = {
  headless: 'new',
  args: [
    '--no-sandbox',           // Required for containers
    '--disable-setuid-sandbox', // Required for containers
    '--disable-dev-shm-usage',  // Overcome limited resource problems
    '--disable-gpu'             // Applicable to Linux
  ]
};

// Test timeout configuration
const TIMEOUTS = {
  short: 5000,    // 5 seconds
  medium: 10000,  // 10 seconds
  long: 30000     // 30 seconds
};

/**
 * Launch browser for testing
 * @returns {Promise<Browser>}
 */
async function launchBrowser() {
  try {
    const browser = await puppeteer.launch(BROWSER_CONFIG);
    console.log('✅ Browser launched successfully');
    return browser;
  } catch (err) {
    console.error('❌ Failed to launch browser:', err.message);
    throw err;
  }
}

/**
 * Create new page with default settings
 * @param {Browser} browser
 * @returns {Promise<Page>}
 */
async function createPage(browser) {
  const page = await browser.newPage();

  // Set viewport for consistent rendering
  await page.setViewport({ width: 1280, height: 720 });

  // Log console messages from the page
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[PAGE ${type.toUpperCase()}]`, msg.text());
    }
  });

  // Log page errors
  page.on('pageerror', error => {
    console.error('[PAGE ERROR]', error.message);
  });

  return page;
}

module.exports = {
  launchBrowser,
  createPage,
  BROWSER_CONFIG,
  TIMEOUTS
};

/**
 * AR-106: Browser cleanup helper for E2E tests
 * Ensures Puppeteer browsers are always closed, even on timeout or error
 */

const puppeteer = require('puppeteer');

const DEFAULT_TIMEOUT_MS = 30000;
const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];

/**
 * Run a test function with automatic browser cleanup
 * @param {Function} fn - Async function that receives (browser, page)
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Timeout in ms (default: 30000)
 * @param {Object} options.viewport - Page viewport (default: 1400x900)
 * @param {boolean} options.headless - Run headless (default: true)
 * @returns {Promise} - Resolves with fn return value, rejects on error/timeout
 */
async function withBrowser(fn, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT_MS,
    viewport = { width: 1400, height: 900 },
    headless = true
  } = options;

  let browser = null;
  let timeoutId = null;
  let timedOut = false;

  // Timeout handler - force cleanup and exit
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      timedOut = true;
      reject(new Error(`Test timed out after ${timeout}ms`));
    }, timeout);
  });

  try {
    browser = await puppeteer.launch({
      headless,
      args: PUPPETEER_ARGS
    });

    const page = await browser.newPage();
    await page.setViewport(viewport);

    // Race between test and timeout
    const result = await Promise.race([
      fn(browser, page),
      timeoutPromise
    ]);

    return result;
  } finally {
    // Always clear timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Always close browser
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Browser may already be closed, ignore
        console.error('Warning: browser.close() failed:', e.message);
      }
    }

    // Exit with error code if timed out (for CI)
    if (timedOut) {
      process.exit(1);
    }
  }
}

/**
 * Run a test with browser, server check, and cleanup
 * @param {Function} fn - Async function that receives (browser, page)
 * @param {Object} options - Same as withBrowser, plus:
 * @param {string} options.url - URL to navigate to (default: http://localhost:3000/operations)
 * @param {string} options.waitFor - Selector to wait for after navigation
 */
async function withBrowserAndServer(fn, options = {}) {
  const {
    url = 'http://localhost:3000/operations',
    waitFor = '#btn-gm-login',
    ...browserOptions
  } = options;

  return withBrowser(async (browser, page) => {
    // Navigate and wait for server
    await page.goto(url, { timeout: 10000 });

    if (waitFor) {
      await page.waitForSelector(waitFor, { timeout: 8000 });
    }

    return fn(browser, page);
  }, browserOptions);
}

/**
 * Collect console logs from page
 * @param {Page} page - Puppeteer page
 * @returns {Object} - { logs: string[], errors: string[] }
 */
function collectLogs(page) {
  const logs = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  page.on('pageerror', err => {
    errors.push(`PageError: ${err.message}`);
  });

  return { logs, errors };
}

/**
 * Wait helper that doesn't block forever
 * @param {number} ms - Milliseconds to wait
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  withBrowser,
  withBrowserAndServer,
  collectLogs,
  wait,
  DEFAULT_TIMEOUT_MS,
  PUPPETEER_ARGS
};

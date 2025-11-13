/**
 * Screenshot Helper Functions
 * Stage 13.1: Screenshot management for test debugging
 */

const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../screenshots');

/**
 * Ensure screenshot directory exists
 */
function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

/**
 * Take screenshot on test failure
 * @param {Page} page - Puppeteer page
 * @param {string} testName - Name of the test
 * @returns {Promise<string>} Path to screenshot
 */
async function screenshotOnFailure(page, testName) {
  ensureScreenshotDir();

  const timestamp = Date.now();
  const filename = `${testName}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);

  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filepath}`);

  return filepath;
}

/**
 * Take screenshot with custom name
 * @param {Page} page - Puppeteer page
 * @param {string} name - Screenshot name
 * @returns {Promise<string>} Path to screenshot
 */
async function takeScreenshot(page, name) {
  ensureScreenshotDir();

  const timestamp = Date.now();
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);

  await page.screenshot({ path: filepath });
  console.log(`📸 Screenshot: ${filepath}`);

  return filepath;
}

/**
 * Clean up old screenshots (older than 7 days)
 */
function cleanupOldScreenshots() {
  if (!fs.existsSync(SCREENSHOT_DIR)) return;

  const files = fs.readdirSync(SCREENSHOT_DIR);
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  files.forEach(file => {
    const filepath = path.join(SCREENSHOT_DIR, file);
    const stats = fs.statSync(filepath);

    if (stats.mtimeMs < sevenDaysAgo) {
      fs.unlinkSync(filepath);
      console.log(`🗑️  Deleted old screenshot: ${file}`);
    }
  });
}

module.exports = {
  screenshotOnFailure,
  takeScreenshot,
  cleanupOldScreenshots,
  SCREENSHOT_DIR
};

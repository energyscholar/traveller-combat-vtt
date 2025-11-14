/**
 * Screenshot Capture Tool
 * Automatically captures professional screenshots of Traveller Combat VTT
 * for use in README and documentation
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots');
const BASE_URL = 'http://localhost:3000';

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Screenshot 1: Main multiplayer interface
    console.log('📸 Capturing main interface...');
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('#status', { timeout: 5000 });
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-main-interface.png'),
      fullPage: false
    });
    console.log('   ✅ 01-main-interface.png\n');

    // Screenshot 2: Ship customizer
    console.log('📸 Capturing ship customizer...');
    const customizerButton = await page.$('button[onclick*="customizer"]');
    if (customizerButton) {
      await customizerButton.click();
      await page.waitForTimeout(1000); // Wait for UI to render
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '02-ship-customizer.png'),
        fullPage: false
      });
      console.log('   ✅ 02-ship-customizer.png\n');
    } else {
      console.log('   ⚠️  Ship customizer button not found, skipping\n');
    }

    // Screenshot 3: Test mode with ships
    console.log('📸 Capturing test mode with ships...');
    await page.goto(`${BASE_URL}/test.html`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('#status', { timeout: 5000 });

    // Try to add ships if possible
    const addShipButton = await page.$('button:has-text("Add Ship")');
    if (addShipButton) {
      await addShipButton.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-test-mode.png'),
      fullPage: false
    });
    console.log('   ✅ 03-test-mode.png\n');

    // Screenshot 4: Combat state visualization (if available)
    console.log('📸 Capturing combat visualization...');
    const canvas = await page.$('canvas');
    if (canvas) {
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '04-combat-visualization.png'),
        fullPage: false
      });
      console.log('   ✅ 04-combat-visualization.png\n');
    } else {
      console.log('   ⚠️  Canvas not found, skipping combat visualization\n');
    }

    // Screenshot 5: Full page view
    console.log('📸 Capturing full page view...');
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle2' });
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-full-page.png'),
      fullPage: true
    });
    console.log('   ✅ 05-full-page.png\n');

    console.log('✨ Screenshot capture complete!\n');
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}\n`);

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Main execution
if (require.main === module) {
  captureScreenshots()
    .then(() => {
      console.log('🎉 All screenshots captured successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Screenshot capture failed:', error);
      process.exit(1);
    });
}

module.exports = { captureScreenshots };

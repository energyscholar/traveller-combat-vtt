// Simple browser connectivity test
// Verifies the server starts, page loads, and Socket.io connection works
// Takes screenshots for visual verification
// Run with: node tests/integration/browser-simple.test.js
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[36m';
const RESET = '\x1b[0m';

let server;
let browser;

async function startServer() {
  return new Promise((resolve) => {
    console.log(`${BLUE}Starting server...${RESET}`);
    server = spawn('node', ['server.js'], { stdio: ['pipe', 'pipe', 'pipe'] });

    server.stdout.on('data', (data) => {
      if (data.toString().includes('Server running') || data.toString().includes('listening')) {
        resolve();
      }
    });

    setTimeout(resolve, 3000); // Timeout fallback
  });
}

async function stopServer() {
  if (server) {
    server.kill();
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function runTests() {
  try {
    await startServer();
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`${BLUE}Launching browser...${RESET}`);
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      protocolTimeout: 180000 // 3 minutes
    });

    console.log(`${BLUE}Opening page...${RESET}`);
    const page = await browser.newPage();

    // Capture console logs
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('[TEST]')) {
        console.log(`  Browser: ${text}`);
      }
    });

    await page.goto('http://localhost:3000?mode=battle', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log(`${GREEN}✓ Page loaded${RESET}`);

    // Take screenshot
    await page.screenshot({ path: 'test-screenshot-1.png' });
    console.log(`${GREEN}✓ Screenshot saved: test-screenshot-1.png${RESET}`);

    // Wait for Socket.io connection
    console.log(`${BLUE}Waiting for Socket.io...${RESET}`);
    await page.waitForFunction(
      () => !document.getElementById('testModeBtn').disabled,
      { timeout: 15000 }
    );
    console.log(`${GREEN}✓ Socket.io connected${RESET}`);

    // Get page state
    const state = await page.evaluate(() => {
      return {
        btnText: document.getElementById('testModeBtn').textContent,
        btnDisabled: document.getElementById('testModeBtn').disabled,
        logCount: document.querySelectorAll('.log-entry').length
      };
    });

    console.log(`${GREEN}✓ Button state: "${state.btnText}" (disabled: ${state.btnDisabled})${RESET}`);
    console.log(`${GREEN}✓ Log entries: ${state.logCount}${RESET}`);

    // Take final screenshot
    await page.screenshot({ path: 'test-screenshot-2.png' });
    console.log(`${GREEN}✓ Final screenshot saved: test-screenshot-2.png${RESET}`);

    await browser.close();
    await stopServer();

    console.log(`\n${GREEN}Simple integration test PASSED ✅${RESET}\n`);
    process.exit(0);

  } catch (error) {
    console.error(`${RED}Error:${RESET}`, error);
    if (browser) await browser.close();
    await stopServer();
    process.exit(1);
  }
}

runTests();

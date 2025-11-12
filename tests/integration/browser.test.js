// Browser integration tests using Puppeteer (initial version)
// Attempts to click the "Run Tests" button and wait for completion
// Note: This version has timing issues. Use browser-full.test.js instead.
// Run with: node tests/integration/browser.test.js

const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

// ANSI color codes for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';
const RESET = '\x1b[0m';

let server;
let browser;

// Start the server
async function startServer() {
  return new Promise((resolve, reject) => {
    console.log(`${BLUE}Starting server on port 3000...${RESET}`);
    server = spawn('node', ['server.js'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running') || output.includes('listening')) {
        console.log(`${GREEN}✓ Server started${RESET}`);
        resolve();
      }
    });

    server.stderr.on('data', (data) => {
      console.error(`Server error: ${data}`);
    });

    server.on('error', reject);

    // Timeout after 10 seconds
    setTimeout(() => {
      console.log(`${YELLOW}Server startup timeout - assuming it started${RESET}`);
      resolve();
    }, 10000);
  });
}

// Stop the server
async function stopServer() {
  if (server) {
    console.log(`${BLUE}Stopping server...${RESET}`);
    server.kill();
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`${GREEN}✓ Server stopped${RESET}`);
  }
}

// Run the browser tests
async function runTests() {
  console.log('\n========================================');
  console.log('STAGE 2 BROWSER INTEGRATION TESTS');
  console.log('========================================\n');

  try {
    // Start server
    await startServer();

    // Give server a moment to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Launch browser
    console.log(`${BLUE}Launching headless Chrome...${RESET}`);
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log(`${GREEN}✓ Browser launched${RESET}`);

    // Open TWO tabs (required for multi-tab sync test)
    console.log(`${BLUE}Opening Tab 1 at http://localhost:3000?mode=battle...${RESET}`);
    const page1 = await browser.newPage();

    // Listen to console logs from tab 1
    const testResults = [];
    page1.on('console', msg => {
      const text = msg.text();
      if (text.includes('[TEST]') || text.includes('✅') || text.includes('❌')) {
        testResults.push(text);
      }
    });

    await page1.goto('http://localhost:3000?mode=battle', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    console.log(`${GREEN}✓ Tab 1 loaded${RESET}`);

    // Open second tab for multi-tab sync testing
    console.log(`${BLUE}Opening Tab 2 at http://localhost:3000?mode=battle...${RESET}`);
    const page2 = await browser.newPage();
    await page2.goto('http://localhost:3000?mode=battle', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    console.log(`${GREEN}✓ Tab 2 loaded (for sync testing)${RESET}`);

    // Wait for Socket.io connection on tab 1 (test button becomes enabled)
    console.log(`${BLUE}Waiting for Socket.io connection on Tab 1...${RESET}`);
    await page1.waitForFunction(
      () => !document.getElementById('testModeBtn').disabled,
      { timeout: 15000 }
    );
    console.log(`${GREEN}✓ Connected to server${RESET}`);

    // Click the test button on tab 1
    console.log(`${BLUE}Clicking "Run Tests" button on Tab 1...${RESET}`);
    await page1.click('#testModeBtn');
    console.log(`${GREEN}✓ Tests started${RESET}\n`);

    // Wait for tests to complete
    console.log(`${YELLOW}Running tests (this may take 30+ seconds)...${RESET}\n`);

    // Wait for the test completion message - checking the actual button text
    await page1.waitForFunction(
      () => {
        const btn = document.getElementById('testModeBtn');
        const btnText = btn ? btn.textContent : '';
        const logs = Array.from(document.querySelectorAll('.log-entry'));
        const hasCompletionLog = logs.some(log =>
          log.textContent.includes('All Tests Passed') ||
          log.textContent.includes('Tests Passed') ||
          log.textContent.includes('Some Failed')
        );
        // Button text changes to "✅ Tests Passed" or "⚠️ Some Failed" when done
        return hasCompletionLog || btnText.includes('Tests Passed') || btnText.includes('Some Failed');
      },
      { timeout: 60000 }
    );

    // Give it a moment to finish logging
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract test results from tab 1
    const results = await page1.evaluate(() => {
      const logs = Array.from(document.querySelectorAll('.log-entry'));
      return logs.map(log => ({
        text: log.textContent,
        classes: log.className
      }));
    });

    // Display results
    console.log('========================================');
    console.log('TEST RESULTS:');
    console.log('========================================\n');

    let passCount = 0;
    let failCount = 0;

    for (const result of results) {
      const text = result.text;

      if (result.classes.includes('test-pass') || text.includes('✅') || text.includes('PASS')) {
        console.log(`${GREEN}✅ ${text}${RESET}`);
        passCount++;
      } else if (result.classes.includes('test-fail') || text.includes('❌') || text.includes('FAIL')) {
        console.log(`${RED}❌ ${text}${RESET}`);
        failCount++;
      } else if (result.classes.includes('test') || text.includes('Test')) {
        console.log(`${BLUE}${text}${RESET}`);
      }
    }

    console.log('\n========================================');
    if (failCount === 0 && passCount > 0) {
      console.log(`${GREEN}ALL TESTS PASSED ✅${RESET}`);
      console.log(`${GREEN}Passed: ${passCount}${RESET}`);
    } else {
      console.log(`${RED}SOME TESTS FAILED ❌${RESET}`);
      console.log(`${GREEN}Passed: ${passCount}${RESET}`);
      console.log(`${RED}Failed: ${failCount}${RESET}`);
    }
    console.log('========================================\n');

    // Close browser
    await browser.close();
    console.log(`${GREEN}✓ Browser closed${RESET}`);

    // Stop server
    await stopServer();

    // Exit with appropriate code
    process.exit(failCount > 0 ? 1 : 0);

  } catch (error) {
    console.error(`${RED}Error during tests:${RESET}`, error);

    if (browser) {
      await browser.close();
    }
    await stopServer();

    process.exit(1);
  }
}

// Run tests
runTests();

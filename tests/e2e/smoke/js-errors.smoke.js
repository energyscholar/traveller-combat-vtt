/**
 * JS Error Smoke Test
 * Loads GM and Player paths to catch client-side JavaScript errors
 * (syntax errors, undefined functions, etc)
 */

const {
  createPage,
  navigateToOperations,
  gmLogin,
  playerLogin,
  startSession,
  delay,
  DELAYS,
  getConsoleErrors,
  createTestResults,
  pass,
  fail,
  printResults
} = require('../puppeteer-utils');

async function runJSErrorCheck() {
  const results = createTestResults();
  let browser, page;

  console.log('\n🔍 JS ERROR SMOKE TEST\n');

  try {
    // Setup
    const setup = await createPage({ headless: true });
    browser = setup.browser;
    page = setup.page;

    // ==================== GM PATH ====================
    console.log('=== GM Path ===');

    // Step 1: Load Operations page
    console.log('Step 1: Load Operations page...');
    await navigateToOperations(page);
    await delay(DELAYS.PAGE_LOAD);

    let errors = getConsoleErrors(page);
    if (errors.length === 0) {
      pass(results, 'Login screen - no JS errors');
    } else {
      fail(results, 'Login screen - no JS errors', errors.map(e => e.text).join('; '));
    }

    // Step 2: GM Login
    console.log('Step 2: GM Login...');
    const { campaigns, code } = await gmLogin(page);
    await delay(DELAYS.MEDIUM);

    errors = getConsoleErrors(page);
    if (errors.length === 0) {
      pass(results, 'GM Setup screen - no JS errors');
    } else {
      fail(results, 'GM Setup screen - no JS errors', errors.map(e => e.text).join('; '));
    }

    // Step 3: Start Session (loads bridge)
    console.log('Step 3: Start Session (Bridge)...');
    await startSession(page);
    await delay(DELAYS.LONG);

    errors = getConsoleErrors(page);
    if (errors.length === 0) {
      pass(results, 'Bridge screen - no JS errors');
    } else {
      fail(results, 'Bridge screen - no JS errors', errors.map(e => e.text).join('; '));
    }

    // Step 4: Click through role panels
    console.log('Step 4: Click role panels...');
    const roles = ['pilot', 'gunner', 'engineer', 'sensor_operator', 'captain'];
    for (const role of roles) {
      try {
        await page.click(`[data-role="${role}"]`);
        await delay(DELAYS.SHORT);
      } catch (e) {
        // Role button might not exist
      }
    }
    await delay(DELAYS.MEDIUM);

    errors = getConsoleErrors(page);
    if (errors.length === 0) {
      pass(results, 'Role panels - no JS errors');
    } else {
      fail(results, 'Role panels - no JS errors', errors.map(e => e.text).join('; '));
    }

    // ==================== PLAYER PATH ====================
    console.log('\n=== Player Path ===');

    // Fresh page for player
    const playerSetup = await createPage({ headless: true });
    const playerPage = playerSetup.page;

    // Step 5: Player login
    console.log('Step 5: Player Login...');
    await navigateToOperations(playerPage);
    await delay(DELAYS.SHORT);

    // Use the code from GM session
    await playerLogin(playerPage, code);
    await delay(DELAYS.MEDIUM);

    errors = getConsoleErrors(playerPage);
    if (errors.length === 0) {
      pass(results, 'Player lobby - no JS errors');
    } else {
      fail(results, 'Player lobby - no JS errors', errors.map(e => e.text).join('; '));
    }

    // Step 6: Select a role
    console.log('Step 6: Select role...');
    try {
      await playerPage.click('[data-role="pilot"]');
      await delay(DELAYS.MEDIUM);
    } catch (e) {
      // May already be assigned
    }

    errors = getConsoleErrors(playerPage);
    if (errors.length === 0) {
      pass(results, 'Player role selection - no JS errors');
    } else {
      fail(results, 'Player role selection - no JS errors', errors.map(e => e.text).join('; '));
    }

    await playerSetup.browser.close();

  } catch (error) {
    fail(results, 'Test execution', error.message);
  } finally {
    if (browser) await browser.close();
  }

  printResults(results);
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  runJSErrorCheck();
}

module.exports = { runJSErrorCheck };

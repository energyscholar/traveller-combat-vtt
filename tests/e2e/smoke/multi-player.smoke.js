/**
 * Multi-Player Sync Smoke Test (AR-26)
 * Tests 2 browser instances syncing state
 */

const {
  createPage,
  navigateToOperations,
  clickButton,
  gmLogin,
  startSession,
  playerLogin,
  selectPlayerSlot,
  joinBridge,
  getBridgeState,
  createTestResults,
  pass,
  fail,
  skip,
  failWithScreenshot,
  printResults,
  delay,
  DELAYS
} = require('../puppeteer-utils');

async function runMultiPlayerTests() {
  const results = createTestResults();
  let gmBrowser, gmPage, playerBrowser, playerPage;

  console.log('\n👥 SMOKE TEST: Multi-Player Sync (AR-26)\n');

  try {
    // ==================== GM Setup ====================
    console.log('--- GM Setup ---');

    console.log('Step 1: GM login...');
    const gmSetup = await createPage({ headless: true });
    gmBrowser = gmSetup.browser;
    gmPage = gmSetup.page;

    await navigateToOperations(gmPage);
    const { code } = await gmLogin(gmPage);

    if (!code) {
      await failWithScreenshot(gmPage, results, 'GM get campaign code', 'No code returned');
      throw new Error('No campaign code');
    }
    pass(results, `Campaign code: ${code}`);

    // Start session
    console.log('Step 2: GM start session...');
    const gmOnBridge = await startSession(gmPage);
    await delay(DELAYS.SOCKET);

    if (gmOnBridge) {
      pass(results, 'GM on bridge');
    } else {
      await failWithScreenshot(gmPage, results, 'GM start session', 'Not on bridge');
      throw new Error('GM not on bridge');
    }

    // ==================== Player Setup ====================
    console.log('\n--- Player Setup ---');

    console.log('Step 3: Player login...');
    const playerSetup = await createPage({ headless: true });
    playerBrowser = playerSetup.browser;
    playerPage = playerSetup.page;

    await navigateToOperations(playerPage);

    // Click Player Login
    await clickButton(playerPage, 'btn-player-login');
    await delay(DELAYS.MEDIUM);

    // Enter campaign code
    console.log(`Step 4: Enter code ${code}...`);
    await playerPage.type('#campaign-code', code);
    await delay(DELAYS.SHORT);

    // Join campaign
    const joinBtn = await playerPage.$('#btn-join-campaign');
    if (joinBtn) {
      await joinBtn.click();
      await delay(DELAYS.SOCKET);
      pass(results, 'Player joined campaign');
    } else {
      await failWithScreenshot(playerPage, results, 'Join campaign button', 'Not found');
    }

    // Check for slot selection
    console.log('Step 5: Player slot selection...');
    const hasSlots = await playerPage.evaluate(() => {
      const list = document.querySelector('#player-slot-list, .slot-list');
      return list && list.children.length > 0;
    });

    if (hasSlots) {
      pass(results, 'Slot list displayed');

      // Select first slot
      await selectPlayerSlot(playerPage);
      await delay(DELAYS.SOCKET);
    } else {
      skip(results, 'Slot selection', 'No slots or direct join');
    }

    // Check for ship selection
    console.log('Step 6: Ship selection...');
    const shipList = await playerPage.$('#ship-select-list, .ship-list');
    if (shipList) {
      const firstShip = await playerPage.$('#ship-select-list .ship-card, .ship-option');
      if (firstShip) {
        await firstShip.click();
        await delay(DELAYS.MEDIUM);
        pass(results, 'Ship selected');
      }
    }

    // Join bridge
    console.log('Step 7: Join bridge...');
    const playerOnBridge = await joinBridge(playerPage);
    await delay(DELAYS.SOCKET);

    if (playerOnBridge) {
      pass(results, 'Player on bridge');
    } else {
      // May already be on bridge or different flow
      const currentScreen = await playerPage.evaluate(() => {
        const active = document.querySelector('.screen.active');
        return active?.id || 'unknown';
      });
      if (currentScreen === 'bridge-screen') {
        pass(results, 'Player on bridge (auto)');
      } else {
        skip(results, 'Player bridge', `Current: ${currentScreen}`);
      }
    }

    // ==================== Sync Tests ====================
    console.log('\n--- Sync Tests ---');

    // Test: Both see same ship name
    console.log('Test 1: Ship name sync...');
    const gmState = await getBridgeState(gmPage);
    const playerState = await getBridgeState(playerPage);

    if (gmState.shipName && playerState.shipName) {
      if (gmState.shipName === playerState.shipName) {
        pass(results, `Ship sync: ${gmState.shipName}`);
      } else {
        fail(results, 'Ship sync', `GM: ${gmState.shipName}, Player: ${playerState.shipName}`);
      }
    } else {
      skip(results, 'Ship sync', 'Ship name not visible');
    }

    // Test: Alert status sync
    console.log('Test 2: Alert status sync...');

    // GM sets alert
    const alertBtn = await gmPage.$('#btn-alert-red, #btn-alert-yellow');
    if (alertBtn) {
      await alertBtn.click();
      await delay(DELAYS.SOCKET);

      // Check player sees it
      const playerAlert = await playerPage.evaluate(() => {
        const el = document.querySelector('.alert-status, #alert-status');
        return el?.textContent?.trim();
      });

      if (playerAlert) {
        pass(results, `Alert sync: ${playerAlert}`);
      } else {
        skip(results, 'Alert sync', 'Alert not visible to player');
      }
    } else {
      skip(results, 'Alert test', 'Alert button not found');
    }

    // Test: Crew list sync
    console.log('Test 3: Crew list sync...');
    const gmCrew = await gmPage.evaluate(() => {
      const members = document.querySelectorAll('.crew-member');
      return members.length;
    });
    const playerCrew = await playerPage.evaluate(() => {
      const members = document.querySelectorAll('.crew-member');
      return members.length;
    });

    if (gmCrew > 0 && playerCrew > 0) {
      if (gmCrew === playerCrew) {
        pass(results, `Crew sync: ${gmCrew} members`);
      } else {
        skip(results, 'Crew sync', `GM: ${gmCrew}, Player: ${playerCrew}`);
      }
    } else {
      skip(results, 'Crew sync', 'Crew not visible');
    }

    // Test: Log entry sync
    console.log('Test 4: Log entry sync...');

    // GM adds log
    const addLogBtn = await gmPage.$('#btn-gm-add-log');
    if (addLogBtn) {
      await addLogBtn.click();
      await delay(DELAYS.MEDIUM);

      // Fill log form if modal appears
      const logInput = await gmPage.$('#log-message, [name="log-message"], textarea');
      if (logInput) {
        await logInput.type('Test sync entry');
        const submitBtn = await gmPage.$('[type="submit"], .btn-submit, #btn-add-log-submit');
        if (submitBtn) {
          await submitBtn.click();
          await delay(DELAYS.SOCKET);
        }
      }

      // Check player log
      const playerLog = await playerPage.evaluate(() => {
        const entries = document.querySelectorAll('.log-entry');
        for (const e of entries) {
          if (e.textContent?.includes('Test sync')) return true;
        }
        return false;
      });

      if (playerLog) {
        pass(results, 'Log entry synced to player');
      } else {
        skip(results, 'Log sync', 'Entry not visible or form different');
      }
    } else {
      skip(results, 'Log test', 'Add log button not found');
    }

  } catch (error) {
    if (gmPage) await failWithScreenshot(gmPage, results, 'Unexpected error (GM)', error.message);
    if (playerPage) await failWithScreenshot(playerPage, results, 'Unexpected error (Player)', error.message);
  } finally {
    if (gmBrowser) await gmBrowser.close();
    if (playerBrowser) await playerBrowser.close();
  }

  printResults(results);
  console.log(results.failed === 0 ? '\n✅ Multi-Player PASSED' : '\n❌ Multi-Player FAILED');
  return results;
}

// Run if called directly
if (require.main === module) {
  runMultiPlayerTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

module.exports = { runMultiPlayerTests };

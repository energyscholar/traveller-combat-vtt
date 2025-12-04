/**
 * Player Happy Path Smoke Test
 * Tests core Player flow: login -> join campaign -> select slot/ship/role -> join bridge
 */

const {
  createPage,
  navigateToOperations,
  getCurrentScreen,
  clickButton,
  waitForScreen,
  gmLogin,
  startSession,
  playerLogin,
  selectPlayerSlot,
  selectShip,
  selectRole,
  joinBridge,
  getBridgeState,
  createTestResults,
  pass,
  fail,
  skip,
  printResults,
  delay,
  DELAYS
} = require('../puppeteer-utils');

async function runPlayerHappyPath(campaignCode = null) {
  const results = createTestResults();
  let gmBrowser, gmPage, playerBrowser, playerPage;

  console.log('\n🔥 SMOKE TEST: Player Happy Path\n');

  try {
    // Step 1: Set up GM first (to get campaign code)
    console.log('Step 1: Setup GM session...');
    const gmSetup = await createPage({ headless: true });
    gmBrowser = gmSetup.browser;
    gmPage = gmSetup.page;

    await navigateToOperations(gmPage);
    const gmResult = await gmLogin(gmPage);

    if (!gmResult.code) {
      fail(results, 'Get campaign code from GM', 'No campaign code available');
      throw new Error('Cannot proceed without campaign code');
    }
    pass(results, `Got campaign code: ${gmResult.code}`);
    campaignCode = gmResult.code;

    // Start GM session
    await startSession(gmPage);
    await delay(DELAYS.SOCKET);
    pass(results, 'GM session started');

    // Step 2: Launch player browser
    console.log('Step 2: Launch player browser...');
    const playerSetup = await createPage({ headless: true, verbose: true });
    playerBrowser = playerSetup.browser;
    playerPage = playerSetup.page;

    await navigateToOperations(playerPage);
    pass(results, 'Player navigated to login');

    // Step 3: Check Player Login button
    console.log('Step 3: Check Player Login button...');
    const screens = await getCurrentScreen(playerPage);
    const playerBtn = screens[0]?.buttons?.find(b => b.id === 'btn-player-login');
    if (playerBtn && playerBtn.visible) {
      pass(results, 'Player Login button visible');
    } else {
      fail(results, 'Player Login button visible', `Buttons found: ${screens[0]?.buttons?.map(b => b.id).join(', ')}`);
    }

    // Step 4: Click Player Login
    console.log('Step 4: Click Player Login...');
    const clicked = await clickButton(playerPage, 'btn-player-login');
    if (clicked) {
      pass(results, 'Clicked Player Login');
    } else {
      fail(results, 'Click Player Login', 'Button not clickable');
    }
    await delay(DELAYS.LONG);

    // Step 5: Check for campaign code input
    console.log('Step 5: Check campaign code input...');
    const codeInput = await playerPage.$('#campaign-code');
    if (codeInput) {
      pass(results, 'Campaign code input visible');
    } else {
      // Check what screen we're on
      const current = await getCurrentScreen(playerPage);
      fail(results, 'Campaign code input visible', `Current screen: ${current[0]?.id}, buttons: ${current[0]?.buttons?.map(b => b.id).join(', ')}`);

      // Take screenshot for debugging
      await playerPage.screenshot({ path: 'smoke-player-no-code-input.png' });
      console.log('Screenshot saved: smoke-player-no-code-input.png');
    }

    // Step 6: Enter campaign code
    console.log('Step 6: Enter campaign code...');
    if (codeInput) {
      await playerPage.type('#campaign-code', campaignCode);
      pass(results, `Entered campaign code: ${campaignCode}`);
    } else {
      skip(results, 'Enter campaign code', 'No input field');
    }

    // Step 7: Click Join Campaign
    console.log('Step 7: Click Join Campaign...');
    const joinBtn = await playerPage.$('#btn-join-campaign');
    if (joinBtn) {
      await joinBtn.click();
      await delay(DELAYS.SOCKET);
      pass(results, 'Clicked Join Campaign');
    } else {
      const btns = await getCurrentScreen(playerPage);
      fail(results, 'Click Join Campaign', `Join button not found. Available: ${btns[0]?.buttons?.map(b => b.id).join(', ')}`);
    }

    // Step 8: Check for player slot selection
    console.log('Step 8: Check player slot selection...');
    await delay(DELAYS.LONG);
    const slotList = await playerPage.$('#player-slot-list');
    const hasSlots = slotList && await playerPage.evaluate(el => el.children.length > 0, slotList).catch(() => false);
    if (hasSlots) {
      pass(results, 'Player slot list visible');
    } else {
      const current = await getCurrentScreen(playerPage);
      fail(results, 'Player slot list visible', `Current: ${current[0]?.id}`);
      await playerPage.screenshot({ path: 'smoke-player-no-slots.png' });
    }

    // Step 9: Select player slot
    console.log('Step 9: Select player slot...');
    const slotSelected = await selectPlayerSlot(playerPage);
    if (slotSelected) {
      pass(results, 'Selected player slot');
    } else {
      skip(results, 'Select player slot', 'No slots available');
    }

    // Step 10: Select ship (if required)
    console.log('Step 10: Select ship...');
    await delay(DELAYS.MEDIUM);
    const shipList = await playerPage.$('#ship-select-list');
    if (shipList) {
      const shipSelected = await selectShip(playerPage);
      if (shipSelected) {
        pass(results, 'Selected ship');
      } else {
        skip(results, 'Select ship', 'No ships available');
      }
    } else {
      skip(results, 'Select ship', 'Ship selection not required');
    }

    // Step 11: Select role
    console.log('Step 11: Select role...');
    await delay(DELAYS.MEDIUM);
    const roleSelected = await selectRole(playerPage);
    if (roleSelected) {
      pass(results, 'Selected role');
    } else {
      skip(results, 'Select role', 'No roles available');
    }

    // Step 12: Join Bridge
    console.log('Step 12: Join Bridge...');
    const joinedBridge = await joinBridge(playerPage);
    if (joinedBridge) {
      pass(results, 'Joined bridge');
    } else {
      const current = await getCurrentScreen(playerPage);
      fail(results, 'Join bridge', `Current: ${current[0]?.id}`);
      await playerPage.screenshot({ path: 'smoke-player-join-failed.png' });
    }

    // Step 13: Verify on bridge
    console.log('Step 13: Verify on bridge...');
    await delay(DELAYS.LONG);
    const bridgeState = await getBridgeState(playerPage);
    if (bridgeState.isOnBridge) {
      pass(results, 'Player on bridge screen');
    } else {
      fail(results, 'Player on bridge screen', 'Not on bridge');
    }

  } catch (error) {
    fail(results, 'Unexpected error', error);
    if (playerPage) {
      await playerPage.screenshot({ path: 'smoke-player-error.png' }).catch(() => {});
    }
  } finally {
    if (playerBrowser) await playerBrowser.close();
    if (gmBrowser) await gmBrowser.close();
  }

  printResults(results);
  console.log(results.failed === 0 ? '\n✅ Player Happy Path PASSED' : '\n❌ Player Happy Path FAILED');
  return results;
}

// Run if called directly
if (require.main === module) {
  runPlayerHappyPath().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

module.exports = { runPlayerHappyPath };

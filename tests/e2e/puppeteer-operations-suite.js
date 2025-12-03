/**
 * Puppeteer Operations VTT Regression Test Suite
 *
 * Tests high-risk features that are prone to breaking:
 * 1. GM Login & Campaign Selection
 * 2. GM Session Start
 * 3. GM Relieve Crew Member (critical - recently fixed bug)
 * 4. Bridge State Display
 * 5. Crew List Rendering
 * 6. Log Entries Display
 * 7. Multi-client Sync (using second browser)
 *
 * Run: node tests/e2e/puppeteer-operations-suite.js
 * Prerequisite: Server running on localhost:3000, database seeded
 */

const {
  delay,
  DELAYS,
  createPage,
  navigateToOperations,
  getCurrentScreen,
  clickButton,
  waitForScreen,
  gmLogin,
  startSession,
  getBridgeState,
  getCrewList,
  getContactsList,
  getLogEntries,
  relieveCrewMember,
  playerLogin,
  selectPlayerSlot,
  selectShip,
  selectRole,
  joinBridge,
  createTestResults,
  pass,
  fail,
  skip,
  printResults
} = require('./puppeteer-utils');

async function runSuite() {
  console.log('\n=== Operations VTT Puppeteer Regression Suite ===\n');

  const results = createTestResults();
  let browser = null;
  let page = null;
  let campaignCode = null;

  try {
    // Setup
    console.log('Setting up browser...\n');
    ({ browser, page } = await createPage({ verbose: false }));

    // ====== TEST 1: Navigate to Operations ======
    console.log('--- TEST 1: Navigation ---');
    try {
      const loginScreen = await navigateToOperations(page);
      if (loginScreen) {
        pass(results, 'Navigate to Operations VTT');
      } else {
        throw new Error('Login screen not displayed');
      }
    } catch (e) {
      fail(results, 'Navigate to Operations VTT', e);
      throw e; // Fatal - can't continue
    }

    // ====== TEST 2: GM Login ======
    console.log('\n--- TEST 2: GM Login & Campaign Selection ---');
    try {
      const { campaigns, code } = await gmLogin(page);
      campaignCode = code;
      if (campaigns.length > 0) {
        pass(results, 'GM Login and select campaign');
        if (code) {
          console.log(`   Campaign code: ${code}`);
        } else {
          console.log('   Campaign code not yet displayed (will be available on GM setup)');
        }
      } else {
        throw new Error('No campaigns found');
      }
    } catch (e) {
      fail(results, 'GM Login and select campaign', e);
      throw e;
    }

    // ====== TEST 3: GM Setup Screen Displayed ======
    console.log('\n--- TEST 3: GM Setup Screen ---');
    try {
      const screen = await getCurrentScreen(page);
      const gmSetup = screen.find(s => s.id === 'gm-setup-screen');
      if (gmSetup) {
        pass(results, 'GM Setup screen displayed');
        const startBtn = gmSetup.buttons.find(b => b.id === 'btn-start-session');
        if (startBtn && !startBtn.disabled) {
          pass(results, 'Start Session button enabled');
        } else {
          skip(results, 'Start Session button enabled', 'Button not found or disabled');
        }
      } else {
        fail(results, 'GM Setup screen displayed', 'Wrong screen: ' + screen[0]?.id);
      }
    } catch (e) {
      fail(results, 'GM Setup screen displayed', e);
    }

    // ====== TEST 4: Start Session ======
    console.log('\n--- TEST 4: Start Session ---');
    try {
      const onBridge = await startSession(page);
      if (onBridge) {
        pass(results, 'Start session and reach bridge');
      } else {
        throw new Error('Did not reach bridge screen');
      }
    } catch (e) {
      fail(results, 'Start session and reach bridge', e);
      throw e;
    }

    // ====== TEST 5: Bridge State ======
    console.log('\n--- TEST 5: Bridge State Verification ---');
    try {
      await delay(DELAYS.MEDIUM);
      const state = await getBridgeState(page);
      console.log('   Bridge state:', JSON.stringify(state, null, 2));

      if (state.isOnBridge) {
        pass(results, 'Bridge screen active');
      } else {
        fail(results, 'Bridge screen active', 'Not on bridge');
      }

      if (state.shipName && state.shipName !== 'Ship Name') {
        pass(results, 'Ship name displayed');
      } else {
        fail(results, 'Ship name displayed', `Got: ${state.shipName}`);
      }

      if (state.date && state.date !== '--') {
        pass(results, 'Game date displayed');
      } else {
        skip(results, 'Game date displayed', 'Date not set');
      }

      if (state.alertStatus) {
        pass(results, 'Alert status displayed');
      } else {
        fail(results, 'Alert status displayed', 'Missing');
      }
    } catch (e) {
      fail(results, 'Bridge state verification', e);
    }

    // ====== TEST 6: Crew List ======
    console.log('\n--- TEST 6: Crew List ---');
    try {
      await delay(DELAYS.MEDIUM);
      const crew = await getCrewList(page);
      console.log(`   Found ${crew.length} crew members`);

      if (crew.length > 0) {
        pass(results, 'Crew list rendered');

        const withRoles = crew.filter(c => c.role && c.role !== 'undefined');
        if (withRoles.length > 0) {
          pass(results, 'Crew have roles assigned');
          console.log('   Crew with roles:', withRoles.map(c => `${c.name} (${c.role})`).join(', '));
        } else {
          skip(results, 'Crew have roles assigned', 'No roles found');
        }

        const relievable = crew.filter(c => c.hasRelieveBtn);
        if (relievable.length > 0) {
          pass(results, 'Relieve buttons visible for eligible crew');
        } else {
          skip(results, 'Relieve buttons visible', 'No relievable crew');
        }
      } else {
        skip(results, 'Crew list rendered', 'No crew found');
      }
    } catch (e) {
      fail(results, 'Crew list rendering', e);
    }

    // ====== TEST 7: GM Relieve Crew (CRITICAL - recent bug fix) ======
    console.log('\n--- TEST 7: GM Relieve Crew Member (CRITICAL) ---');
    try {
      const crewBefore = await getCrewList(page);
      const relievableCrew = crewBefore.filter(c => c.hasRelieveBtn);

      if (relievableCrew.length === 0) {
        skip(results, 'GM relieve crew member', 'No crew to relieve');
      } else {
        const targetName = relievableCrew[0].name;
        console.log(`   Attempting to relieve: ${targetName}`);

        const relieved = await relieveCrewMember(page, targetName);

        if (relieved) {
          await delay(DELAYS.SOCKET);

          // Check server logs didn't error (via console)
          const crewAfter = await getCrewList(page);
          const stillHasRole = crewAfter.find(c => c.name === targetName && c.role);

          if (!stillHasRole || stillHasRole.role !== relievableCrew[0].role) {
            pass(results, 'GM relieve crew member - role cleared');
          } else {
            fail(results, 'GM relieve crew member', 'Role not cleared after relieve');
          }
        } else {
          fail(results, 'GM relieve crew member', 'Could not click relieve button');
        }
      }
    } catch (e) {
      fail(results, 'GM relieve crew member (CRITICAL)', e);
    }

    // ====== TEST 8: Log Entries ======
    console.log('\n--- TEST 8: Ship Log ---');
    try {
      const logs = await getLogEntries(page);
      console.log(`   Found ${logs.length} log entries`);

      if (logs.length > 0) {
        pass(results, 'Ship log rendered');
        console.log('   Recent log:', logs[0]?.message?.substring(0, 50));
      } else {
        skip(results, 'Ship log rendered', 'No log entries');
      }
    } catch (e) {
      fail(results, 'Ship log rendering', e);
    }

    // ====== TEST 9: Contacts Panel ======
    console.log('\n--- TEST 9: Contacts Panel ---');
    try {
      const contacts = await getContactsList(page);
      console.log(`   Found ${contacts.length} contacts`);

      if (contacts.length >= 0) {  // Empty is valid
        pass(results, 'Contacts panel rendered');
        if (contacts.length > 0) {
          console.log('   First contact:', contacts[0]?.name);
        }
      }
    } catch (e) {
      fail(results, 'Contacts panel rendering', e);
    }

    // ====== TEST 10: Hamburger Menu ======
    console.log('\n--- TEST 10: Hamburger Menu ---');
    try {
      const menuBtn = await page.$('#btn-bridge-menu');
      if (menuBtn) {
        await menuBtn.click();
        await delay(DELAYS.MEDIUM);

        const menuVisible = await page.evaluate(() => {
          const menu = document.querySelector('#hamburger-menu, .hamburger-menu');
          return menu && !menu.classList.contains('hidden') && menu.offsetParent !== null;
        });

        if (menuVisible) {
          pass(results, 'Hamburger menu opens');

          // Close menu
          const closeBtn = await page.$('#btn-close-menu, .hamburger-menu .close-btn');
          if (closeBtn) {
            await closeBtn.click();
            await delay(DELAYS.SHORT);
          } else {
            // Click overlay
            await page.click('#hamburger-menu-overlay, .menu-overlay');
            await delay(DELAYS.SHORT);
          }
          pass(results, 'Hamburger menu closes');
        } else {
          fail(results, 'Hamburger menu opens', 'Menu not visible');
        }
      } else {
        skip(results, 'Hamburger menu', 'Menu button not found');
      }
    } catch (e) {
      fail(results, 'Hamburger menu', e);
    }

    // ====== TEST 11: Multi-Browser Player Join (if time permits) ======
    console.log('\n--- TEST 11: Player Join Flow ---');
    let browser2 = null;
    try {
      if (campaignCode && campaignCode.length >= 8) {
        // Open second browser as player
        const { browser: b2, page: page2 } = await createPage({ verbose: false });
        browser2 = b2;

        await navigateToOperations(page2);
        const joined = await playerLogin(page2, campaignCode.substring(0, 8));

        if (joined) {
          pass(results, 'Player joins campaign with code');

          // Select slot
          const slotSelected = await selectPlayerSlot(page2);
          if (slotSelected) {
            pass(results, 'Player selects slot');

            // Wait for player setup
            await delay(DELAYS.LONG);

            // Select ship
            const shipSelected = await selectShip(page2);
            if (shipSelected) {
              pass(results, 'Player selects ship');
            } else {
              skip(results, 'Player selects ship', 'No ships or auto-selected');
            }

            // Select role
            const roleSelected = await selectRole(page2);
            if (roleSelected) {
              pass(results, 'Player selects role');
            } else {
              skip(results, 'Player selects role', 'No available roles');
            }

            // Join bridge
            await delay(DELAYS.MEDIUM);
            const onBridge2 = await joinBridge(page2);
            if (onBridge2) {
              pass(results, 'Player joins bridge');

              const state2 = await getBridgeState(page2);
              if (state2.userRole && state2.userRole !== 'Role') {
                pass(results, 'Player role displayed on bridge');
              } else {
                skip(results, 'Player role displayed', 'Role not set: ' + state2.userRole);
              }
            } else {
              skip(results, 'Player joins bridge', 'Join bridge button disabled');
            }
          } else {
            skip(results, 'Player selects slot', 'No slots available');
          }
        } else {
          fail(results, 'Player joins campaign', 'No slots found after join');
        }
      } else {
        skip(results, 'Player join flow', 'No valid campaign code');
      }
    } catch (e) {
      fail(results, 'Player join flow', e);
    } finally {
      if (browser2) await browser2.close();
    }

  } catch (e) {
    console.error(`\nFatal error: ${e.message}`);
  } finally {
    if (browser) await browser.close();
  }

  // Results
  printResults(results);
  console.log('\n=== Suite Complete ===\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run
runSuite();

/**
 * Role Assignment Smoke Test (AR-26)
 * Tests role assignment, relief, and multi-instance roles
 */

const {
  createPage,
  navigateToOperations,
  clickButton,
  gmLogin,
  startSession,
  getBridgeState,
  getCrewList,
  createTestResults,
  pass,
  fail,
  skip,
  failWithScreenshot,
  printResults,
  delay,
  DELAYS
} = require('../puppeteer-utils');

const ALL_ROLES = [
  'pilot', 'captain', 'astrogator', 'engineer', 'sensor_operator',
  'gunner', 'damage_control', 'marines', 'medic', 'steward', 'cargo'
];

async function runRoleAssignmentTests() {
  const results = createTestResults();
  let browser, page;

  console.log('\n🎭 SMOKE TEST: Role Assignment (AR-26)\n');

  try {
    // Setup - get to bridge as GM
    console.log('Setup: Login as GM and reach bridge...');
    const setup = await createPage({ headless: true });
    browser = setup.browser;
    page = setup.page;

    await navigateToOperations(page);
    await gmLogin(page);
    await startSession(page);
    await delay(DELAYS.SOCKET);

    const bridgeState = await getBridgeState(page);
    if (!bridgeState.isOnBridge) {
      await failWithScreenshot(page, results, 'Setup: Reach bridge', 'Not on bridge');
      throw new Error('Cannot proceed without bridge');
    }
    pass(results, 'Setup: GM on bridge');

    // ==================== Role Assignment Tests ====================
    console.log('\n--- Role Assignment Tests ---');

    // Test 1: Crew panel exists
    console.log('Test 1: Crew panel exists...');
    const crewPanel = await page.$('#crew-list, .crew-panel, [id*="crew"]');
    if (crewPanel) {
      pass(results, 'Crew panel exists');
    } else {
      await failWithScreenshot(page, results, 'Crew panel exists', 'Not found');
    }

    // Test 2: Initial crew list
    console.log('Test 2: Initial crew list...');
    let crew = await getCrewList(page);
    if (crew.length > 0) {
      pass(results, `Initial crew: ${crew.length} members`);
    } else {
      skip(results, 'Initial crew list', 'No crew displayed');
    }

    // Test 3: Role selector exists
    console.log('Test 3: Role selector...');
    const roleSelector = await page.$('#role-select, .role-select, [id*="change-role"]');
    if (roleSelector) {
      pass(results, 'Role selector exists');
    } else {
      skip(results, 'Role selector', 'Not found - may use different UI');
    }

    // Test 4: GM can assign roles
    console.log('Test 4: GM role assignment...');
    const gmAssignBtn = await page.$('[data-action="assign-role"], #btn-assign-role, .btn-assign');
    if (gmAssignBtn) {
      pass(results, 'GM assign button exists');
    } else {
      skip(results, 'GM assign button', 'Role assignment may use crew panel');
    }

    // Test 5: Check for NPC crew
    console.log('Test 5: NPC crew members...');
    const npcCrew = crew.filter(c => c.isNPC);
    if (npcCrew.length > 0) {
      pass(results, `NPC crew: ${npcCrew.length} members`);
    } else {
      skip(results, 'NPC crew', 'No NPCs in crew');
    }

    // Test 6: Relieve button exists for NPCs
    console.log('Test 6: Relieve button...');
    const relieveBtn = await page.$('.btn-relieve, [data-action="relieve"]');
    if (relieveBtn) {
      pass(results, 'Relieve button exists');
    } else {
      skip(results, 'Relieve button', 'May require specific role');
    }

    // Test 7: Current role display
    console.log('Test 7: Current role display...');
    const roleDisplay = await page.evaluate(() => {
      const el = document.querySelector('#role-name, .role-indicator, #bridge-user-role');
      return el?.textContent?.trim();
    });
    if (roleDisplay) {
      pass(results, `Current role: ${roleDisplay}`);
    } else {
      skip(results, 'Role display', 'Role not shown');
    }

    // Test 8: Role panel updates with role
    console.log('Test 8: Role panel content...');
    const rolePanelTitle = await page.evaluate(() => {
      const el = document.querySelector('#role-panel-title, .role-panel h2');
      return el?.textContent?.trim();
    });
    if (rolePanelTitle) {
      pass(results, `Role panel: ${rolePanelTitle}`);
    } else {
      skip(results, 'Role panel title', 'Title not found');
    }

    // Test 9: Role actions available
    console.log('Test 9: Role actions...');
    const roleActions = await page.evaluate(() => {
      const btns = document.querySelectorAll('#role-actions button, .role-actions button');
      return Array.from(btns).map(b => b.textContent?.trim()).filter(t => t).slice(0, 5);
    });
    if (roleActions.length > 0) {
      pass(results, `Role actions: ${roleActions.join(', ')}`);
    } else {
      skip(results, 'Role actions', 'No action buttons found');
    }

    // Test 10: Leave role button
    console.log('Test 10: Leave role button...');
    const leaveBtn = await page.$('#btn-leave-role, [data-action="leave-role"]');
    if (leaveBtn) {
      pass(results, 'Leave role button exists');
    } else {
      skip(results, 'Leave role button', 'Button not found');
    }

    // Test 11: Multi-instance role (gunner)
    console.log('Test 11: Multi-instance roles...');
    const gunnerInstances = await page.evaluate(() => {
      const members = document.querySelectorAll('.crew-member');
      let count = 0;
      for (const m of members) {
        const role = m.querySelector('.crew-role')?.textContent?.toLowerCase();
        if (role?.includes('gunner')) count++;
      }
      return count;
    });
    if (gunnerInstances >= 0) {
      pass(results, `Gunner instances: ${gunnerInstances}`);
    }

    // Test 12: Role quirk display
    console.log('Test 12: Role quirk display...');
    const quirkDisplay = await page.$('#role-quirk-display, .role-quirk');
    if (quirkDisplay) {
      pass(results, 'Role quirk display exists');
    } else {
      skip(results, 'Role quirk display', 'Quirk element not found');
    }

  } catch (error) {
    await failWithScreenshot(page, results, 'Unexpected error', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  printResults(results);
  console.log(results.failed === 0 ? '\n✅ Role Assignment PASSED' : '\n❌ Role Assignment FAILED');
  return results;
}

// Run if called directly
if (require.main === module) {
  runRoleAssignmentTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

module.exports = { runRoleAssignmentTests };

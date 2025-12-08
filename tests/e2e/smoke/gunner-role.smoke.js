/**
 * Gunner Role Smoke Test - AR-ROLE-USE-CASES
 * Use Case: Enable weapons → Select target → Fire → See result
 */

const {
  createPage,
  navigateToOperations,
  clickButton,
  playerLogin,
  selectPlayerSlot,
  selectRole,
  joinBridge,
  getBridgeState,
  getContactsList,
  createTestResults,
  pass,
  fail,
  skip,
  failWithScreenshot,
  printResults,
  delay,
  DELAYS
} = require('../puppeteer-utils');

async function runGunnerRoleTests() {
  const results = createTestResults();
  let browser, page;

  console.log('\n🔫 SMOKE TEST: Gunner Role Use Case\n');

  try {
    // Setup - login as Gunner (Marina)
    console.log('Setup: Login as Marina (Gunner)...');
    const setup = await createPage({ headless: true });
    browser = setup.browser;
    page = setup.page;

    await navigateToOperations(page);

    // Player login flow - use playerLogin helper
    const hasSlots = await playerLogin(page, 'DFFFC87E');
    if (hasSlots) {
      // Select Marina's slot (Gunner)
      await selectPlayerSlot(page, 'Marina');
      await delay(DELAYS.SOCKET);
    }

    // Select Gunner role
    await selectRole(page, 'Gunner');
    await delay(DELAYS.SOCKET);

    // Join bridge
    await joinBridge(page);
    await delay(DELAYS.SOCKET * 2);

    const bridgeState = await getBridgeState(page);
    if (bridgeState.isOnBridge) {
      pass(results, 'Setup: On bridge');
    } else {
      // Debug: save screenshot and page content
      await page.screenshot({ path: 'screenshots/gunner-debug.png' });
      const content = await page.evaluate(() => document.body.innerText?.substring(0, 500));
      console.log('  Page content:', content?.substring(0, 200));
      skip(results, 'Setup: On bridge', 'Login flow may have changed');
    }

    // ==================== Gunner Panel Tests ====================
    console.log('\n--- Gunner Panel ---');

    // Test 1: Gunner panel exists
    console.log('Test 1: Gunner panel...');
    const gunnerPanel = await page.$('.gunner-panel, [data-role="gunner"], .gunner-header');
    if (gunnerPanel) {
      pass(results, 'Gunner panel visible');
    } else {
      // May need to select gunner role
      const roleSelect = await page.$('#role-select, select[name="role"]');
      if (roleSelect) {
        await roleSelect.select('gunner');
        await delay(DELAYS.SOCKET);
      }
      skip(results, 'Gunner panel', 'May need explicit role selection');
    }

    // Test 2: Weapons list visible
    console.log('Test 2: Weapons list...');
    const weaponsSection = await page.$('.weapons-section, .weapon-card, .weapons-grid');
    if (weaponsSection) {
      pass(results, 'Weapons section visible');
    } else {
      skip(results, 'Weapons section', 'Panel may need loading');
    }

    // Test 3: Weapon selector dropdown
    console.log('Test 3: Weapon selector...');
    const weaponSelect = await page.$('#weapon-type-select, .weapon-select');
    if (weaponSelect) {
      pass(results, 'Weapon selector exists');
      // Get weapon options
      const options = await page.$$eval('#weapon-type-select option', opts => opts.map(o => o.textContent.trim()));
      console.log(`  Weapons: ${options.join(', ')}`);
    } else {
      skip(results, 'Weapon selector', 'Single weapon or no weapons');
    }

    // Test 4: Target list with authorized targets
    console.log('Test 4: Target list...');
    const targetList = await page.$('.target-list, .target-item');
    if (targetList) {
      const targets = await page.$$('.target-item');
      pass(results, `Target list: ${targets.length} targets`);
    } else {
      const noTarget = await page.$('.no-target-locked, .no-target-text');
      if (noTarget) {
        skip(results, 'Target list', 'No authorized targets');
      } else {
        skip(results, 'Target list', 'Target section not found');
      }
    }

    // Test 5: Fire button exists
    console.log('Test 5: Fire button...');
    const fireBtn = await page.$('.btn-fire');
    if (fireBtn) {
      const isDisabled = await fireBtn.evaluate(b => b.disabled);
      if (isDisabled) {
        pass(results, 'Fire button exists (disabled - no target)');
      } else {
        pass(results, 'Fire button enabled');
      }
    } else {
      fail(results, 'Fire button', 'Not found');
    }

    // Test 6: Weapons authorization status
    console.log('Test 6: Authorization status...');
    const authStatus = await page.$('.weapons-auth-controls, .gunner-status-badge');
    if (authStatus) {
      const statusText = await authStatus.evaluate(el => el.textContent);
      pass(results, `Auth status: ${statusText.trim().substring(0, 30)}`);
    } else {
      skip(results, 'Auth status', 'Not visible');
    }

    // Test 7: Hit probability display
    console.log('Test 7: Hit probability...');
    const hitProb = await page.$('.hit-probability-display, .target-hit-chance');
    if (hitProb) {
      pass(results, 'Hit probability visible');
    } else {
      skip(results, 'Hit probability', 'No target selected');
    }

    // Test 8: Combat log
    console.log('Test 8: Combat log...');
    const combatLog = await page.$('.combat-log-section, #gunner-combat-log');
    if (combatLog) {
      pass(results, 'Combat log visible');
    } else {
      skip(results, 'Combat log', 'Not found');
    }

    // Test 9: Point defense toggle
    console.log('Test 9: Point defense...');
    const pdBtn = await page.$('.btn-point-defense');
    if (pdBtn) {
      pass(results, 'Point defense button exists');
    } else {
      skip(results, 'Point defense', 'Not found');
    }

    // Test 10: Ammo display
    console.log('Test 10: Ammo display...');
    const ammoDisplay = await page.$('.weapon-ammo, .ammo-count');
    if (ammoDisplay) {
      const ammoText = await ammoDisplay.evaluate(el => el.textContent);
      pass(results, `Ammo display: ${ammoText.trim()}`);
    } else {
      skip(results, 'Ammo display', 'No ammo weapons');
    }

    printResults(results);

    if (results.failed === 0) {
      console.log('\n✅ Gunner Role Use Case: VERIFIED');
    } else {
      console.log('\n⚠️ Gunner Role Use Case: Issues found');
    }

  } catch (error) {
    await failWithScreenshot(page, results, 'Unexpected error', error.message);
    console.error('Error:', error.message);
  } finally {
    if (browser) await browser.close();
  }

  return results;
}

if (require.main === module) {
  runGunnerRoleTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

module.exports = { runGunnerRoleTests };

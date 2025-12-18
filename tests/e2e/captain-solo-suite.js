#!/usr/bin/env node
/**
 * Captain Solo E2E Test Suite
 *
 * Tests: AR-171, AR-172, AR-173
 * Use Cases: CS-1 through CS-4
 *
 * Verifies Captain can operate all ship functions without changing roles.
 */

const puppeteer = require('puppeteer');
const { clickOrHotkey, sleep, verifyState, writeTodoForFailures } = require('./helpers/click-or-hotkey');

const CAMPAIGN_CODE = 'DFFFC87E';
const RESULTS = { passed: 0, failed: 0, errors: [] };

async function loginAsCaptain(page) {
  await page.goto('http://localhost:3000/operations', { waitUntil: 'networkidle2' });
  await sleep(2000);

  // Click Player
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach(b => {
      if (b.textContent.includes('Player')) b.click();
    });
  });
  await sleep(1000);

  // Enter code
  await page.type('#campaign-code', CAMPAIGN_CODE);
  await sleep(500);

  // Join
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach(b => {
      if (b.textContent.includes('Join as Player')) b.click();
    });
  });
  await sleep(2000);

  // Select first slot
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    btns.find(b => b.textContent.trim() === 'Join')?.click();
  });
  await sleep(2000);

  // Select Captain role
  await page.evaluate(() => {
    document.querySelector('[data-role-id="captain"]')?.click();
  });
  await sleep(1000);

  // Join Bridge
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach(b => {
      if (b.textContent.includes('Join Bridge')) b.click();
    });
  });
  await sleep(3000);
}

// ==============================================
// CS-1: Captain Pilot Sub-Panel
// ==============================================
async function testCS1_PilotSubPanel(page) {
  console.log('\n--- CS-1: Captain → Pilot Sub-Panel ---');

  // Open role panel
  await page.keyboard.press('2');
  await sleep(1000);

  // Switch to pilot sub-panel
  const switched = await page.evaluate(() => {
    if (typeof window.switchCaptainPanel === 'function') {
      window.switchCaptainPanel('pilot');
      return true;
    }
    return false;
  });
  await sleep(1500);

  if (!switched) {
    RESULTS.failed++;
    RESULTS.errors.push('CS-1: switchCaptainPanel not available');
    return false;
  }

  // Verify pilot controls visible
  const controls = await page.evaluate(() => ({
    hasSetCourse: !!Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent.includes('Set Course')) ||
                  !!document.getElementById('btn-set-course') ||
                  !!document.querySelector('[onclick*="showPlacesOverlay"]'),
    hasTravel: !!Array.from(document.querySelectorAll('button'))
                 .find(b => b.textContent.includes('Travel')),
    hasEvasive: !!document.getElementById('evasive-toggle') ||
                !!Array.from(document.querySelectorAll('button'))
                  .find(b => b.textContent.includes('Evasive')),
    hasHelmStatus: !!document.querySelector('.helm-status, .pilot-helm'),
    noErrors: !document.body.textContent.includes('Error') &&
              !document.body.textContent.includes('undefined')
  }));

  console.log('  Pilot controls found:', controls);

  if (controls.noErrors && (controls.hasSetCourse || controls.hasTravel)) {
    console.log('  ✓ CS-1 PASSED');
    RESULTS.passed++;
    return true;
  } else {
    console.log('  ✗ CS-1 FAILED - Missing pilot controls or errors detected');
    RESULTS.failed++;
    RESULTS.errors.push('CS-1: Pilot sub-panel missing controls');
    return false;
  }
}

// ==============================================
// CS-2: Captain Astrogator Sub-Panel (Already works)
// ==============================================
async function testCS2_AstrogatorSubPanel(page) {
  console.log('\n--- CS-2: Captain → Astrogator Sub-Panel ---');

  // Switch to astrogator
  await page.evaluate(() => window.switchCaptainPanel('astrogator'));
  await sleep(1500);

  const controls = await page.evaluate(() => ({
    hasDestInput: !!document.getElementById('jump-destination'),
    hasPlotButton: !!Array.from(document.querySelectorAll('button'))
                     .find(b => b.textContent.includes('Plot')),
    hasJumpMap: !!document.querySelector('.jump-map, #jump-map-container'),
    noErrors: !document.body.textContent.includes('Error')
  }));

  console.log('  Astrogator controls found:', controls);

  if (controls.hasDestInput || controls.hasPlotButton) {
    console.log('  ✓ CS-2 PASSED');
    RESULTS.passed++;
    return true;
  } else {
    console.log('  ✗ CS-2 FAILED');
    RESULTS.failed++;
    return false;
  }
}

// ==============================================
// CS-3: Captain Engineer Sub-Panel
// ==============================================
async function testCS3_EngineerSubPanel(page) {
  console.log('\n--- CS-3: Captain → Engineer Sub-Panel ---');

  // Switch to engineer
  await page.evaluate(() => window.switchCaptainPanel('engineer'));
  await sleep(1500);

  const controls = await page.evaluate(() => {
    const bodyText = document.body.textContent;
    const errorMatch = bodyText.match(/Error[^s]?\s*:?\s*\w{0,30}/gi);
    const undefMatch = bodyText.includes('undefined');
    // Find context around 'undefined'
    const undefIdx = bodyText.indexOf('undefined');
    const undefContext = undefIdx >= 0 ? bodyText.substring(Math.max(0, undefIdx - 30), undefIdx + 40) : null;
    return {
      undefContext,
      hasFuelStatus: !!document.querySelector('.fuel-status, .fuel-display'),
      hasPowerControls: !!document.querySelector('.power-allocation, .power-controls'),
      hasSystemStatus: !!document.querySelector('.system-status, .systems-grid'),
      hasRepairButton: !!Array.from(document.querySelectorAll('button'))
                         .find(b => b.textContent.includes('Repair')),
      errorText: errorMatch ? errorMatch.slice(0, 3) : null,
      hasUndefined: undefMatch,
      noErrors: !bodyText.includes('Error') &&
              !bodyText.includes('undefined')
    };
  });

  console.log('  Engineer controls found:', controls);

  if (controls.noErrors && (controls.hasFuelStatus || controls.hasPowerControls)) {
    console.log('  ✓ CS-3 PASSED');
    RESULTS.passed++;
    return true;
  } else {
    console.log('  ✗ CS-3 FAILED - Missing engineer controls or errors detected');
    RESULTS.failed++;
    RESULTS.errors.push('CS-3: Engineer sub-panel missing controls');
    return false;
  }
}

// ==============================================
// CS-4: Full Solo Journey
// ==============================================
async function testCS4_FullSoloJourney(page) {
  console.log('\n--- CS-4: Full Solo Journey ---');
  console.log('  (Requires CS-1, CS-2, CS-3 to pass first)');

  // This test combines all sub-panels
  // Travel to jump point → Check fuel → Plot jump → Execute

  // Step 1: Use Pilot panel to navigate to system map
  await page.evaluate(() => window.switchCaptainPanel('pilot'));
  await sleep(1000);

  // Step 2: Use Engineer panel to check fuel
  await page.evaluate(() => window.switchCaptainPanel('engineer'));
  await sleep(1000);

  await page.evaluate(() => window.state?.socket?.emit('ops:getFuelStatus'));
  await sleep(500);

  const fuel = await page.evaluate(() => window.state?.fuelStatus);
  console.log('  Fuel status:', fuel?.total, '/', fuel?.max, 'tons');

  // Step 3: Use Astrogator panel to verify jump capability
  await page.evaluate(() => window.switchCaptainPanel('astrogator'));
  await sleep(1000);

  const jumpStatus = await page.evaluate(() => window.state?.jumpStatus);
  console.log('  Jump status:', jumpStatus?.inJump ? 'In Jump' : 'Ready');

  // Step 4: Return to Captain panel
  await page.evaluate(() => window.switchCaptainPanel('captain'));
  await sleep(1000);

  // Verify we can switch between all panels without errors
  const state = await page.evaluate(() => ({
    panel: window.state?.captainActivePanel,
    errors: window.state?.lastError
  }));

  if (state.panel === 'captain' && !state.errors) {
    console.log('  ✓ CS-4 PASSED - Full panel rotation complete');
    RESULTS.passed++;
    return true;
  } else {
    console.log('  ✗ CS-4 FAILED');
    RESULTS.failed++;
    return false;
  }
}

// ==============================================
// Main
// ==============================================
(async () => {
  console.log('═'.repeat(50));
  console.log('CAPTAIN SOLO E2E TEST SUITE');
  console.log('═'.repeat(50));

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1400,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  page.on('dialog', async dialog => {
    console.log('  [DIALOG]', dialog.message().substring(0, 50));
    await dialog.accept();
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('404')) {
        RESULTS.errors.push(`Console: ${text.substring(0, 80)}`);
      }
    }
  });

  try {
    await loginAsCaptain(page);
    console.log('✓ Logged in as Captain\n');

    await testCS1_PilotSubPanel(page);
    await testCS2_AstrogatorSubPanel(page);
    await testCS3_EngineerSubPanel(page);
    await testCS4_FullSoloJourney(page);

  } catch (err) {
    console.error('\n✗ SUITE ERROR:', err.message);
    RESULTS.errors.push(err.message);
    await page.screenshot({ path: '/tmp/captain-solo-error.png' });
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('RESULTS');
  console.log('═'.repeat(50));
  console.log(`Passed: ${RESULTS.passed}`);
  console.log(`Failed: ${RESULTS.failed}`);

  if (RESULTS.errors.length > 0) {
    console.log('\nErrors:');
    RESULTS.errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
  }

  await browser.close();

  process.exit(RESULTS.failed > 0 ? 1 : 0);
})();

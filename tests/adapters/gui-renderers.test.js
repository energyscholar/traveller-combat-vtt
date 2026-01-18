/**
 * T4.2: GUI Renderers Tests
 * Verifies GUI renderers are pure functions that return HTML strings
 */

const {
  renderers,
  renderRole,
  renderGunner,
  escapeHtml,
  progressBar,
  kvRow
} = require('../../public/operations-v2/adapters/gui-renderers');

function runTests() {
  console.log('=== T4.2: GUI Renderers Tests ===\n');
  const results = { passed: 0, failed: 0 };

  // Test 1: renderers object has all roles
  const expectedRoles = ['gunner', 'pilot', 'sensors', 'engineer', 'captain', 'damage-control', 'astrogator', 'observer'];
  const missingRoles = expectedRoles.filter(r => typeof renderers[r] !== 'function');

  if (missingRoles.length === 0) {
    console.log('✓ renderers has all 8 roles');
    results.passed++;
  } else {
    console.log(`✗ renderers missing: ${missingRoles.join(', ')}`);
    results.failed++;
  }

  // Test 2: renderGunner returns HTML string
  const mockVm = createMockGunnerVm();
  const output = renderGunner(mockVm);

  if (typeof output === 'string' && output.includes('<div') && output.includes('gunner')) {
    console.log('✓ renderGunner returns HTML string');
    results.passed++;
  } else {
    console.log('✗ renderGunner output wrong');
    console.log('  Type:', typeof output);
    results.failed++;
  }

  // Test 3: Output contains role panel class
  if (output.includes('role-panel') && output.includes('gunner-panel')) {
    console.log('✓ Output contains role-panel class');
    results.passed++;
  } else {
    console.log('✗ Output missing role-panel class');
    results.failed++;
  }

  // Test 4: Output contains data-action attributes (not inline handlers)
  if (output.includes('data-action=') && !output.includes('onclick=')) {
    console.log('✓ Uses data-action attributes (no inline handlers)');
    results.passed++;
  } else {
    console.log('✗ Should use data-action, not onclick');
    results.failed++;
  }

  // Test 5: Renderers have no side effects
  const vmCopy = JSON.parse(JSON.stringify(mockVm));
  renderGunner(mockVm);
  const vmNoTs = { ...mockVm, timestamp: 0 };
  const copyNoTs = { ...vmCopy, timestamp: 0 };

  if (JSON.stringify(vmNoTs) === JSON.stringify(copyNoTs)) {
    console.log('✓ renderers have no side effects');
    results.passed++;
  } else {
    console.log('✗ renderer modified ViewModel');
    results.failed++;
  }

  // Test 6: escapeHtml prevents XSS
  const xssInput = '<script>alert("xss")</script>';
  const escaped = escapeHtml(xssInput);
  if (!escaped.includes('<script>') && escaped.includes('&lt;script&gt;')) {
    console.log('✓ escapeHtml prevents XSS');
    results.passed++;
  } else {
    console.log('✗ escapeHtml does not escape properly');
    results.failed++;
  }

  // Test 7: progressBar returns valid HTML
  const bar = progressBar(75, '75%');
  if (bar.includes('progress-bar') && bar.includes('progress-fill') && bar.includes('75%')) {
    console.log('✓ progressBar returns valid HTML');
    results.passed++;
  } else {
    console.log('✗ progressBar output wrong');
    results.failed++;
  }

  // Test 8: kvRow returns valid HTML
  const row = kvRow('Label', 'Value');
  if (row.includes('kv-row') && row.includes('Label') && row.includes('Value')) {
    console.log('✓ kvRow returns valid HTML');
    results.passed++;
  } else {
    console.log('✗ kvRow output wrong');
    results.failed++;
  }

  // Test 9: All renderers return strings
  let allStrings = true;
  for (const role of expectedRoles) {
    const testVm = createMockViewModel(role);
    const result = renderers[role](testVm);
    if (typeof result !== 'string') {
      console.log(`  ✗ ${role} renderer did not return string`);
      allStrings = false;
    }
  }

  if (allStrings) {
    console.log('✓ All renderers return strings');
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 10: renderRole dispatches correctly
  const pilotVm = createMockViewModel('pilot');
  const pilotOutput = renderRole(pilotVm);
  if (pilotOutput.includes('pilot-panel')) {
    console.log('✓ renderRole dispatches correctly');
    results.passed++;
  } else {
    console.log('✗ renderRole dispatch failed');
    results.failed++;
  }

  console.log(`\n=== Results: ${results.passed}/${results.passed + results.failed} passed ===`);
  return results.failed === 0;
}

function createMockGunnerVm() {
  return {
    type: 'gunner',
    version: 1,
    timestamp: Date.now(),
    data: {
      targeting: { selected: { name: 'Target-1', rangeBand: 'medium' } }
    },
    derived: {
      statusBadge: 'WEAPONS HOLD',
      statusClass: 'weapons-hold',
      turretText: 'Turret 1',
      weaponCountText: '2 weapons',
      targetCountText: '1 target',
      hitChanceText: '58%',
      rangeDMText: '-1'
    },
    actions: {
      fire: { enabled: false, reason: 'Weapons not authorized' },
      selectTarget: { enabled: true, reason: null }
    }
  };
}

function createMockViewModel(role) {
  return {
    type: role,
    version: 1,
    timestamp: Date.now(),
    data: {
      targeting: { selected: null },
      fuel: { percentFull: 50 },
      power: { percentUsed: 50 },
      hull: { percent: 100 },
      jump: { inJump: false, rating: 2, fuelAvailable: 20 },
      navigation: { currentSystem: 'Test' }
    },
    derived: {
      statusBadge: 'TEST',
      statusClass: 'test',
      turretText: 'Turret 1',
      weaponCountText: '1 weapon',
      targetCountText: '0 targets',
      hitChanceText: '--',
      rangeDMText: '--',
      locationText: 'Test',
      destinationText: 'None',
      thrustText: '2G / 2G',
      headingText: 'Holding',
      jumpTimeText: '--',
      contactCountText: '0 contacts',
      shipsText: '0 ships',
      stationsText: '0 stations',
      threatCountText: 'None',
      lockStatusText: 'No lock',
      fuelText: '20/40 tons',
      fuelPercentText: '50%',
      powerPercentText: '50%',
      damagedCountText: '0 damaged',
      repairQueueText: 'No repairs',
      canJumpText: 'Yes',
      shipNameText: 'Test Ship',
      shipClassText: 'Scout',
      crewCountText: '4/4 crew',
      alertText: 'Normal',
      contactSummaryText: '0 contacts',
      hostileSummaryText: 'None hostile',
      hullText: '100/100 HP',
      hullPercentText: '100%',
      damageCountText: '0 systems damaged',
      fireCountText: 'No fires',
      breachCountText: 'No breaches',
      jumpRatingText: 'J-2',
      jumpRangeText: '2 parsecs',
      currentSystemText: 'Test',
      fuelRequiredText: '20 tons',
      fuelAvailableText: '40 tons',
      watchRoleFormatted: 'Pilot',
      lastUpdateText: 'Now'
    },
    actions: {
      fire: { enabled: false, reason: 'Test' },
      selectTarget: { enabled: true, reason: null },
      setDestination: { enabled: true, reason: null },
      evasiveManeuvers: { enabled: false, reason: 'Test' },
      scan: { enabled: false, reason: 'Test' },
      lock: { enabled: false, reason: 'Test' },
      unlock: { enabled: false, reason: 'Test' },
      adjustPower: { enabled: true, reason: null },
      repair: { enabled: false, reason: 'Test' },
      processFuel: { enabled: false, reason: 'Test' },
      setAlert: { enabled: true, reason: null },
      issueOrder: { enabled: true, reason: null },
      relieveCrew: { enabled: true, reason: null },
      repairHull: { enabled: false, reason: 'Test' },
      repairSystem: { enabled: false, reason: 'Test' },
      firefighting: { enabled: false, reason: 'Test' },
      sealBreach: { enabled: false, reason: 'Test' },
      plotJump: { enabled: true, reason: null },
      initiateJump: { enabled: false, reason: 'Test' },
      cancelJump: { enabled: false, reason: 'Test' },
      switchRole: { enabled: true, reason: null }
    }
  };
}

if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests };

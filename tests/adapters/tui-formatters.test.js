/**
 * T3.1: TUI Formatters Tests
 * Verifies formatters are pure functions that return ANSI strings
 */

const { formatters, ANSI, stripAnsi } = require('../../lib/adapters/tui-formatters');
const { createGunnerViewModel } = require('../../lib/viewmodels/role-viewmodels/gunner-viewmodel');

function runTests() {
  console.log('=== T3.1: TUI Formatters Tests ===\n');
  const results = { passed: 0, failed: 0 };

  // Test 1: formatters object has all roles
  const expectedRoles = ['gunner', 'pilot', 'sensors', 'engineer', 'captain', 'damage-control', 'astrogator', 'observer'];
  const missingRoles = expectedRoles.filter(r => typeof formatters[r] !== 'function');

  if (missingRoles.length === 0) {
    console.log('✓ formatters has all 8 roles');
    results.passed++;
  } else {
    console.log(`✗ formatters missing: ${missingRoles.join(', ')}`);
    results.failed++;
  }

  // Test 2: ANSI object has color codes
  if (ANSI.RESET && ANSI.BOLD && ANSI.RED && ANSI.GREEN && ANSI.YELLOW) {
    console.log('✓ ANSI object has color codes');
    results.passed++;
  } else {
    console.log('✗ ANSI object missing color codes');
    results.failed++;
  }

  // Test 3: formatGunner returns string with ANSI codes
  const mockState = { weaponsAuth: { mode: 'hold' }, roe: 'hold' };
  const mockTemplate = { weapons: [{ id: 'laser', name: 'Pulse Laser' }] };
  const vm = createGunnerViewModel(mockState, mockTemplate, [], 1, mockTemplate.weapons);
  const output = formatters.gunner(vm);

  if (typeof output === 'string' && output.includes('\x1b[')) {
    console.log('✓ formatGunner returns string with ANSI codes');
    results.passed++;
  } else {
    console.log('✗ formatGunner output wrong');
    console.log('  Type:', typeof output);
    console.log('  Has ANSI:', output.includes('\x1b['));
    results.failed++;
  }

  // Test 4: Output contains role identifier
  if (output.includes('GUNNER')) {
    console.log('✓ Output contains "GUNNER"');
    results.passed++;
  } else {
    console.log('✗ Output missing "GUNNER"');
    results.failed++;
  }

  // Test 5: formatters have no side effects
  const vmCopy = JSON.parse(JSON.stringify(vm));
  formatters.gunner(vm);
  const afterFormat = JSON.stringify(vm);
  const beforeFormat = JSON.stringify(vmCopy);

  // Note: timestamp may differ, so compare without it
  const vmNoTs = { ...vm, timestamp: 0 };
  const copyNoTs = { ...vmCopy, timestamp: 0 };

  if (JSON.stringify(vmNoTs) === JSON.stringify(copyNoTs)) {
    console.log('✓ formatters have no side effects');
    results.passed++;
  } else {
    console.log('✗ formatter modified ViewModel');
    results.failed++;
  }

  // Test 6: stripAnsi removes all ANSI codes
  const stripped = stripAnsi(output);
  if (!stripped.includes('\x1b[') && stripped.includes('GUNNER')) {
    console.log('✓ stripAnsi removes ANSI codes');
    results.passed++;
  } else {
    console.log('✗ stripAnsi failed');
    results.failed++;
  }

  // Test 7: All formatters return strings
  const roles = Object.keys(formatters);
  let allStrings = true;
  for (const role of roles) {
    // Create minimal ViewModel for each role
    const testVm = {
      type: role,
      version: 1,
      timestamp: Date.now(),
      data: {
        weapons: { list: [] },
        targeting: { contacts: [], selected: null },
        authorization: { mode: 'hold' },
        fuel: { percentFull: 50, total: 20, max: 40 },
        power: { percentUsed: 50 },
        systems: { damaged: [] },
        repairs: { queue: [] },
        hull: { percent: 100, current: 100, max: 100 },
        jump: { rating: 2, fuelAvailable: 20 },
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
        flightSeverity: 'normal',
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
        watchingText: 'Pilot',
        lastUpdateText: 'Now'
      },
      actions: {
        fire: { enabled: false, reason: 'Test' },
        selectTarget: { enabled: false, reason: 'Test' },
        selectWeapon: { enabled: false, reason: 'Test' },
        setDestination: { enabled: true, reason: null },
        evasiveManeuvers: { enabled: false, reason: 'Test' },
        exitJump: { enabled: false, reason: 'Test' },
        setThrust: { enabled: true, reason: null },
        scan: { enabled: false, reason: 'Test' },
        lock: { enabled: false, reason: 'Test' },
        unlock: { enabled: false, reason: 'Test' },
        toggleEW: { enabled: true, reason: null },
        adjustPower: { enabled: true, reason: null },
        repair: { enabled: false, reason: 'Test' },
        processFuel: { enabled: false, reason: 'Test' },
        emergencyPower: { enabled: true, reason: null },
        setAlert: { enabled: true, reason: null },
        issueOrder: { enabled: true, reason: null },
        relieveCrew: { enabled: true, reason: null },
        initiateRescue: { enabled: false, reason: 'Test' },
        repairHull: { enabled: false, reason: 'Test' },
        repairSystem: { enabled: false, reason: 'Test' },
        firefighting: { enabled: false, reason: 'Test' },
        sealBreach: { enabled: false, reason: 'Test' },
        plotJump: { enabled: true, reason: null },
        initiateJump: { enabled: false, reason: 'Test' },
        cancelJump: { enabled: false, reason: 'Test' },
        viewChart: { enabled: true, reason: null },
        switchRole: { enabled: true, reason: null },
        requestControl: { enabled: false, reason: 'Test' }
      }
    };

    const result = formatters[role](testVm);
    if (typeof result !== 'string') {
      console.log(`  ✗ ${role} formatter did not return string`);
      allStrings = false;
    }
  }

  if (allStrings) {
    console.log('✓ All formatters return strings');
    results.passed++;
  } else {
    results.failed++;
  }

  console.log(`\n=== Results: ${results.passed}/${results.passed + results.failed} passed ===`);
  return results.failed === 0;
}

if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests };

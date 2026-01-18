/**
 * T3.2: TUI Visual Regression Tests
 * Uses snapshots to verify formatter output doesn't change unexpectedly
 */

const fs = require('fs');
const path = require('path');
const { formatters, stripAnsi } = require('../../lib/adapters/tui-formatters');
const { createGunnerViewModel } = require('../../lib/viewmodels/role-viewmodels/gunner-viewmodel');
const { createPilotViewModel } = require('../../lib/viewmodels/role-viewmodels/pilot-viewmodel');

const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');

// Ensure snapshot directory exists
if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

/**
 * Compare output to snapshot, create if missing
 * @param {string} name - Snapshot name
 * @param {string} output - Current output
 * @returns {object} { match, reason }
 */
function matchSnapshot(name, output) {
  const snapshotPath = path.join(SNAPSHOT_DIR, `${name}.txt`);
  const stripped = stripAnsi(output);

  if (!fs.existsSync(snapshotPath)) {
    // Create snapshot
    fs.writeFileSync(snapshotPath, stripped);
    return { match: true, reason: 'created' };
  }

  const expected = fs.readFileSync(snapshotPath, 'utf8');
  if (stripped === expected) {
    return { match: true, reason: 'matched' };
  }

  return {
    match: false,
    reason: 'mismatch',
    expected: expected.substring(0, 200),
    actual: stripped.substring(0, 200)
  };
}

function runTests() {
  console.log('=== T3.2: TUI Visual Regression Tests ===\n');
  const results = { passed: 0, failed: 0 };

  // Test 1: Gunner weapons-hold snapshot
  const gunnerHoldVm = createGunnerViewModel(
    { weaponsAuth: { mode: 'hold' }, roe: 'hold' },
    { weapons: [{ id: 'laser', name: 'Pulse Laser', status: 'ready' }] },
    [{ id: 'c1', designation: 'Contact-1', marking: 'unknown', range_band: 'medium' }],
    1,
    [{ id: 'laser', name: 'Pulse Laser', status: 'ready' }]
  );
  const gunnerHoldOutput = formatters.gunner(gunnerHoldVm);
  const gunnerHoldResult = matchSnapshot('gunner-weapons-hold', gunnerHoldOutput);

  if (gunnerHoldResult.match) {
    console.log(`✓ Gunner weapons-hold snapshot (${gunnerHoldResult.reason})`);
    results.passed++;
  } else {
    console.log('✗ Gunner weapons-hold snapshot mismatch');
    console.log('  Expected:', gunnerHoldResult.expected);
    console.log('  Actual:', gunnerHoldResult.actual);
    results.failed++;
  }

  // Test 2: Gunner weapons-free snapshot
  const gunnerFreeVm = createGunnerViewModel(
    { weaponsAuth: { mode: 'free' }, roe: 'free' },
    { weapons: [{ id: 'laser', name: 'Pulse Laser', status: 'ready' }] },
    [{ id: 'c1', designation: 'Hostile-1', marking: 'hostile', range_band: 'short' }],
    1,
    [{ id: 'laser', name: 'Pulse Laser', status: 'ready' }]
  );
  const gunnerFreeOutput = formatters.gunner(gunnerFreeVm);
  const gunnerFreeResult = matchSnapshot('gunner-weapons-free', gunnerFreeOutput);

  if (gunnerFreeResult.match) {
    console.log(`✓ Gunner weapons-free snapshot (${gunnerFreeResult.reason})`);
    results.passed++;
  } else {
    console.log('✗ Gunner weapons-free snapshot mismatch');
    results.failed++;
  }

  // Test 3: Pilot in-flight snapshot
  const pilotVm = createPilotViewModel(
    { locationName: 'Mora Highport', destination: 'Rhylanor' },
    { thrust: 2 },
    { destination: 'Rhylanor' },
    { inJump: false },
    null,
    null
  );
  const pilotOutput = formatters.pilot(pilotVm);
  const pilotResult = matchSnapshot('pilot-flight', pilotOutput);

  if (pilotResult.match) {
    console.log(`✓ Pilot flight snapshot (${pilotResult.reason})`);
    results.passed++;
  } else {
    console.log('✗ Pilot flight snapshot mismatch');
    results.failed++;
  }

  // Test 4: Pilot in-jump snapshot
  const pilotJumpVm = createPilotViewModel(
    { locationName: 'Jump Space' },
    { thrust: 2 },
    {},
    { inJump: true, hoursRemaining: 120, destination: 'Rhylanor' },
    null,
    null
  );
  const pilotJumpOutput = formatters.pilot(pilotJumpVm);
  const pilotJumpResult = matchSnapshot('pilot-jump', pilotJumpOutput);

  if (pilotJumpResult.match) {
    console.log(`✓ Pilot jump snapshot (${pilotJumpResult.reason})`);
    results.passed++;
  } else {
    console.log('✗ Pilot jump snapshot mismatch');
    results.failed++;
  }

  // Test 5: Output contains expected sections
  const strippedGunner = stripAnsi(gunnerHoldOutput);
  const hasSections = strippedGunner.includes('GUNNER') &&
                      strippedGunner.includes('Turret') &&
                      strippedGunner.includes('Actions');

  if (hasSections) {
    console.log('✓ Output contains expected sections');
    results.passed++;
  } else {
    console.log('✗ Output missing expected sections');
    results.failed++;
  }

  // Test 6: Consistent formatting across calls
  const output1 = stripAnsi(formatters.gunner(gunnerHoldVm));
  const output2 = stripAnsi(formatters.gunner(gunnerHoldVm));

  if (output1 === output2) {
    console.log('✓ Consistent output across calls');
    results.passed++;
  } else {
    console.log('✗ Output inconsistent across calls');
    results.failed++;
  }

  console.log(`\n=== Results: ${results.passed}/${results.passed + results.failed} passed ===`);
  return results.failed === 0;
}

if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests, matchSnapshot };

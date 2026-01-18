/**
 * T2.2: Gunner ViewModel Tests
 * Verifies gunner ViewModel wraps state without duplication
 */

const { createGunnerViewModel } = require('../../lib/viewmodels/role-viewmodels/gunner-viewmodel');
const { getGunnerState } = require('../../lib/engine/roles/gunner-state');

function runTests() {
  console.log('=== T2.2: Gunner ViewModel Tests ===\n');
  const results = { passed: 0, failed: 0 };

  // Mock data
  const mockShipState = { weapons: { weaponsFree: true }, weaponsAuth: { mode: 'free' }, roe: 'free' };
  const mockTemplate = { weapons: [{ id: 'pulse', name: 'Pulse Laser', status: 'ready' }] };
  const mockContacts = [{ id: 'c1', designation: 'Hostile-1', marking: 'hostile', range_band: 'medium' }];

  // Test 1: ViewModel wraps state without duplicating logic
  const vm = createGunnerViewModel(mockShipState, mockTemplate, mockContacts, 1, mockTemplate.weapons);
  const state = getGunnerState(mockShipState, mockTemplate, mockContacts, 1, mockTemplate.weapons);

  if (JSON.stringify(vm.data.authorization) === JSON.stringify(state.authorization)) {
    console.log('✓ data.authorization matches state');
    results.passed++;
  } else {
    console.log('✗ data.authorization does not match state');
    console.log('  VM:', JSON.stringify(vm.data.authorization));
    console.log('  State:', JSON.stringify(state.authorization));
    results.failed++;
  }

  if (JSON.stringify(vm.data.weapons) === JSON.stringify(state.weapons)) {
    console.log('✓ data.weapons matches state');
    results.passed++;
  } else {
    console.log('✗ data.weapons does not match state');
    results.failed++;
  }

  // Test 2: Derived display values exist
  if (vm.derived.statusBadge === 'WEAPONS FREE' && vm.derived.statusClass === 'weapons-free') {
    console.log('✓ derived.statusBadge and statusClass correct for weapons free');
    results.passed++;
  } else {
    console.log(`✗ derived values wrong: badge="${vm.derived.statusBadge}", class="${vm.derived.statusClass}"`);
    results.failed++;
  }

  // Test 3: Actions have enabled/reason
  if (vm.actions.fire && typeof vm.actions.fire.enabled === 'boolean' &&
      (vm.actions.fire.reason === null || typeof vm.actions.fire.reason === 'string')) {
    console.log('✓ actions.fire has enabled and reason');
    results.passed++;
  } else {
    console.log('✗ actions.fire structure wrong');
    console.log('  Got:', JSON.stringify(vm.actions.fire));
    results.failed++;
  }

  // Test 4: Fire action enabled when authorized
  if (vm.actions.fire.enabled === true) {
    console.log('✓ fire action enabled when weapons free');
    results.passed++;
  } else {
    console.log(`✗ fire action not enabled: ${vm.actions.fire.reason}`);
    results.failed++;
  }

  // Test 5: Weapons hold state
  const holdState = { weaponsAuth: { mode: 'hold' }, roe: 'hold' };
  const vmHold = createGunnerViewModel(holdState, mockTemplate, mockContacts, 1, mockTemplate.weapons);
  if (vmHold.derived.statusBadge === 'WEAPONS HOLD' && vmHold.derived.statusClass === 'weapons-hold') {
    console.log('✓ derived values correct for weapons hold');
    results.passed++;
  } else {
    console.log(`✗ hold state wrong: badge="${vmHold.derived.statusBadge}"`);
    results.failed++;
  }

  // Test 6: Fire disabled when weapons hold
  if (vmHold.actions.fire.enabled === false && vmHold.actions.fire.reason) {
    console.log(`✓ fire disabled when hold: "${vmHold.actions.fire.reason}"`);
    results.passed++;
  } else {
    console.log('✗ fire should be disabled when hold');
    results.failed++;
  }

  // Test 7: ViewModel type and version
  if (vm.type === 'gunner' && vm.version === 1) {
    console.log('✓ type is "gunner" and version is 1');
    results.passed++;
  } else {
    console.log(`✗ type="${vm.type}", version=${vm.version}`);
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

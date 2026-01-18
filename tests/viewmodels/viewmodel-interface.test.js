/**
 * T2.1: ViewModel Interface Contract Tests
 * Verifies the base ViewModel structure is correct
 */

const { createViewModel, createAction, isValidViewModel, VIEWMODEL_VERSION } = require('../../lib/viewmodels/base-viewmodel');

function runTests() {
  console.log('=== T2.1: ViewModel Interface Tests ===\n');
  const results = { passed: 0, failed: 0 };

  // Test 1: createViewModel has required properties
  const vm = createViewModel('test', { foo: 1 }, { bar: 2 }, { baz: {} });
  if (vm.type === 'test' &&
      vm.version === VIEWMODEL_VERSION &&
      vm.timestamp > 0 &&
      JSON.stringify(vm.data) === '{"foo":1}' &&
      JSON.stringify(vm.derived) === '{"bar":2}' &&
      JSON.stringify(vm.actions) === '{"baz":{}}') {
    console.log('✓ createViewModel has required properties');
    results.passed++;
  } else {
    console.log('✗ createViewModel missing properties');
    console.log('  Got:', JSON.stringify(vm, null, 2));
    results.failed++;
  }

  // Test 2: Version is correct
  if (vm.version === 1) {
    console.log('✓ Version is 1');
    results.passed++;
  } else {
    console.log(`✗ Version is ${vm.version}, expected 1`);
    results.failed++;
  }

  // Test 3: Timestamp is recent
  const now = Date.now();
  if (vm.timestamp > now - 1000 && vm.timestamp <= now) {
    console.log('✓ Timestamp is recent');
    results.passed++;
  } else {
    console.log(`✗ Timestamp not recent: ${vm.timestamp}`);
    results.failed++;
  }

  // Test 4: JSON serializable
  try {
    const json = JSON.stringify(vm);
    const parsed = JSON.parse(json);
    if (parsed.type === 'test' && parsed.version === VIEWMODEL_VERSION) {
      console.log('✓ ViewModel is JSON serializable');
      results.passed++;
    } else {
      console.log('✗ Parsed JSON has wrong values');
      results.failed++;
    }
  } catch (e) {
    console.log(`✗ JSON serialization failed: ${e.message}`);
    results.failed++;
  }

  // Test 5: createAction creates valid action
  const enabledAction = createAction(true);
  const disabledAction = createAction(false, 'Not available');
  if (enabledAction.enabled === true && enabledAction.reason === null &&
      disabledAction.enabled === false && disabledAction.reason === 'Not available') {
    console.log('✓ createAction creates valid actions');
    results.passed++;
  } else {
    console.log('✗ createAction has wrong structure');
    results.failed++;
  }

  // Test 6: isValidViewModel validates correctly
  if (isValidViewModel(vm) === true &&
      isValidViewModel({}) === false &&
      isValidViewModel(null) === false) {
    console.log('✓ isValidViewModel validates correctly');
    results.passed++;
  } else {
    console.log('✗ isValidViewModel validation wrong');
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

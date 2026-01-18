/**
 * T1.2: E2E Config Module Tests
 * Verifies test parameterization works correctly
 */

function runTests() {
  console.log('=== T1.2: E2E Config Module Tests ===\n');
  const results = { passed: 0, failed: 0 };

  // Clear cache to test fresh
  delete require.cache[require.resolve('../../tests/e2e/config')];
  delete process.env.INTERFACE_PATH;

  // Test 1: Exports required values
  const config = require('../../tests/e2e/config');
  if (config.BASE_URL && config.INTERFACE_PATH && config.fullUrl) {
    console.log('✓ Config exports BASE_URL, INTERFACE_PATH, fullUrl');
    results.passed++;
  } else {
    console.log('✗ Config missing required exports');
    results.failed++;
  }

  // Test 2: fullUrl matches expected format
  if (config.fullUrl.match(/^http/)) {
    console.log(`✓ fullUrl is valid URL: ${config.fullUrl}`);
    results.passed++;
  } else {
    console.log('✗ fullUrl is not a valid URL');
    results.failed++;
  }

  // Test 3: Defaults to /operations
  if (config.INTERFACE_PATH === '/operations') {
    console.log('✓ Defaults to /operations when env not set');
    results.passed++;
  } else {
    console.log(`✗ Default path wrong: ${config.INTERFACE_PATH}`);
    results.failed++;
  }

  // Test 4: Respects INTERFACE_PATH env var
  delete require.cache[require.resolve('../../tests/e2e/config')];
  process.env.INTERFACE_PATH = '/operations/v2';
  const config2 = require('../../tests/e2e/config');
  if (config2.INTERFACE_PATH === '/operations/v2') {
    console.log('✓ Respects INTERFACE_PATH=/operations/v2');
    results.passed++;
  } else {
    console.log(`✗ Did not respect env var: ${config2.INTERFACE_PATH}`);
    results.failed++;
  }

  // Cleanup
  delete process.env.INTERFACE_PATH;

  console.log(`\n=== Results: ${results.passed}/${results.passed + results.failed} passed ===`);
  return results.failed === 0;
}

// Run if executed directly
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests };

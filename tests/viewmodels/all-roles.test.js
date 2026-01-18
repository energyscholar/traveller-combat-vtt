/**
 * T2.3: All Role ViewModels Exist
 * Verifies all 8 role ViewModels exist and export create functions
 */

function runTests() {
  console.log('=== T2.3: All Role ViewModels Exist ===\n');
  const results = { passed: 0, failed: 0 };

  const roles = [
    'gunner',
    'pilot',
    'sensors',
    'engineer',
    'captain',
    'damage-control',
    'astrogator',
    'observer'
  ];

  for (const role of roles) {
    const fnName = 'create' + role.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('') + 'ViewModel';

    try {
      const mod = require(`../../lib/viewmodels/role-viewmodels/${role}-viewmodel`);

      if (typeof mod[fnName] === 'function') {
        console.log(`✓ ${role}-viewmodel.js exports ${fnName}`);
        results.passed++;
      } else {
        console.log(`✗ ${role}-viewmodel.js missing ${fnName} function`);
        console.log(`  Exports:`, Object.keys(mod));
        results.failed++;
      }
    } catch (e) {
      console.log(`✗ ${role}-viewmodel.js failed to load: ${e.message}`);
      results.failed++;
    }
  }

  // Test that all ViewModels can be instantiated with minimal args
  console.log('\n--- Instantiation Tests ---\n');

  const minimalTests = [
    { role: 'gunner', args: [{}, {}, [], 1, []] },
    { role: 'pilot', args: [{}, {}, {}] },
    { role: 'sensors', args: [{}, []] },
    { role: 'engineer', args: [{}, {}, {}, [], {}] },
    { role: 'captain', args: [{}, {}, {}, [], []] },
    { role: 'damage-control', args: [{}, {}] },
    { role: 'astrogator', args: [{}, {}, {}, {}] },
    { role: 'observer', args: [] }
  ];

  for (const test of minimalTests) {
    const fnName = 'create' + test.role.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('') + 'ViewModel';

    try {
      const mod = require(`../../lib/viewmodels/role-viewmodels/${test.role}-viewmodel`);
      const vm = mod[fnName](...test.args);

      if (vm.type && vm.version && vm.data && vm.derived && vm.actions) {
        console.log(`✓ ${test.role} ViewModel instantiates correctly`);
        results.passed++;
      } else {
        console.log(`✗ ${test.role} ViewModel missing properties`);
        results.failed++;
      }
    } catch (e) {
      console.log(`✗ ${test.role} ViewModel instantiation failed: ${e.message}`);
      results.failed++;
    }
  }

  console.log(`\n=== Results: ${results.passed}/${results.passed + results.failed} passed ===`);
  return results.failed === 0;
}

if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests };

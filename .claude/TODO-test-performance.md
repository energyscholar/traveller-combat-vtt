# TODO: Unit Test Performance Analysis

## Task
Perform a comprehensive sweep of all unit tests to identify tests that:
- Take too long to execute (>1 second per test file)
- Consume excessive memory or CPU resources
- Have poor performance characteristics that could slow down CI/CD

## Potentially Problematic Tests to Investigate

### Candidates (requires profiling)
- `tests/unit/space-combat.test.js` - Large integration-style tests
- `tests/unit/space-combat-resolution.test.js` - Complex battle simulations
- `tests/unit/combat.test.js` - Older comprehensive combat tests
- `tests/unit/weapon-system.test.js` - Extensive weapon calculations

### Investigation Steps
1. Run each test file with timing: `/usr/bin/time -v node tests/unit/[file].test.js`
2. Identify tests taking >500ms
3. Profile memory usage during test execution
4. Check for:
   - Unnecessary file I/O operations
   - Large object allocations
   - Missing test cleanup (memory leaks)
   - Repeated expensive operations that could be memoized

### Fixes to Consider
- Move slow integration tests to separate `tests/integration/` if not already there
- Add test timeouts for long-running tests
- Mock expensive operations (file system, external APIs)
- Use test fixtures instead of regenerating data
- Parallelize independent test suites

## Priority
LOW - Tests currently run fast enough for development workflow

## Notes
- Baseline all tests first before optimization
- Don't prematurely optimize - measure first
- Focus on tests that run in CI/CD most frequently

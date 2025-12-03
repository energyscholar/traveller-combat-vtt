# AR-18: Test Speed Optimizations

**Goal**: Reduce test suite runtime without compromising accuracy
**Current**: ~15 seconds for 325 tests
**Target**: <8 seconds (50% reduction)

---

## Stage Overview

| Stage | Name | Benefit | Risk | Effort |
|-------|------|---------|------|--------|
| 18.1 | Parallel test suites | 40-50% faster | Low | Medium |
| 18.2 | Skip unchanged files | 30% faster | Low | Medium |
| 18.3 | Lighter fixtures | 15% faster | Low | Easy |
| 18.4 | Shared DB connections | 20% faster | Medium | Medium |
| 18.5 | Jest worker optimization | 25% faster | Low | Easy |
| 18.6 | Test file organization | 10% faster | None | Easy |
| 18.7 | Mock heavy operations | 35% faster | Medium | Medium |
| 18.8 | Selective test runs | 60% faster (dev) | None | Easy |
| 18.9 | Test output reduction | 5% faster | None | Done |
| 18.10 | Metrics & validation | Prove gains | None | Easy |

---

## Stage Details

### 18.1 Parallel Test Suites

**What**: Run independent test suites concurrently

**Current**: Sequential execution via `tests/run-all-tests.js`
**Target**: Parallel execution with worker threads

**Implementation**:
```javascript
// run-all-tests.js
const { Worker } = require('worker_threads');
const suites = ['combat', 'operations', 'security', ...];

// Run in parallel batches
await Promise.all(suites.map(suite =>
  new Promise(resolve => {
    const worker = new Worker('./test-runner.js', { workerData: { suite } });
    worker.on('exit', resolve);
  })
));
```

**Risk**: Low - tests should be independent
**Benefit**: 40-50% faster
**Effort**: Medium (~2 hours)

---

### 18.2 Skip Unchanged Files

**What**: Only run tests for files that changed since last run

**Implementation**:
```bash
# Use git to detect changes
git diff --name-only HEAD~1 | grep -E '\.(js|ts)$'

# Map changed files to test files
# lib/operations/accounts.js -> tests/operations-handlers.test.js
```

**Integration**: Add `--changed` flag to test runner

**Risk**: Low - full suite still available
**Benefit**: 30% faster in dev workflow
**Effort**: Medium (~3 hours)

---

### 18.3 Lighter Fixtures

**What**: Reduce test data size where not needed

**Current**: Full ship/character objects in many tests
**Target**: Minimal fixtures for unit tests

**Example**:
```javascript
// Before: Full ship object
const ship = { id: 'test', name: 'Test', hull: 40, armor: 4, ... 50 more fields };

// After: Only what test needs
const ship = { id: 'test', hull: 40 };
```

**Risk**: Low - functional tests keep full fixtures
**Benefit**: 15% faster
**Effort**: Easy (~1 hour)

---

### 18.4 Shared DB Connections

**What**: Reuse SQLite connections across tests

**Current**: Each test file may open/close DB
**Target**: Single connection pool

**Implementation**:
```javascript
// test-setup.js
let sharedDb = null;
beforeAll(() => { sharedDb = openDb(); });
afterAll(() => { sharedDb.close(); });
```

**Risk**: Medium - tests must clean up properly
**Benefit**: 20% faster
**Effort**: Medium (~2 hours)

---

### 18.5 Jest Worker Optimization

**What**: Tune Jest parallelization settings

**Current**: Default Jest settings
**Target**: Optimized for project size

**Implementation** (package.json or jest.config.js):
```json
{
  "maxWorkers": "50%",
  "testTimeout": 5000,
  "cache": true,
  "cacheDirectory": ".jest-cache"
}
```

**Note**: Currently using custom runner, not Jest. Would need migration or similar optimization for custom runner.

**Risk**: Low
**Benefit**: 25% faster
**Effort**: Easy (~30 min)

---

### 18.6 Test File Organization

**What**: Group fast tests together, slow tests separate

**Current**: Mixed fast/slow tests
**Target**:
- `tests/unit/` - Fast pure functions (<1s total)
- `tests/integration/` - DB/socket tests (~5s)
- `tests/e2e/` - Browser tests (~30s, run separately)

**Benefit**: Can run unit tests frequently, integration less often
**Risk**: None
**Effort**: Easy (~1 hour reorganization)

---

### 18.7 Mock Heavy Operations

**What**: Mock slow external operations in unit tests

**Targets**:
- File system operations
- Network calls
- Crypto operations
- Large data processing

**Implementation**:
```javascript
jest.mock('fs', () => ({
  readFileSync: jest.fn(() => 'mock data'),
  writeFileSync: jest.fn()
}));
```

**Risk**: Medium - mocks can hide real bugs
**Benefit**: 35% faster for affected tests
**Effort**: Medium (~3 hours)

---

### 18.8 Selective Test Runs

**What**: CLI flags for running subsets

**Implementation**:
```bash
npm test -- --unit          # Unit tests only (~2s)
npm test -- --integration   # Integration only (~5s)
npm test -- --file=combat   # Single suite
npm test -- --changed       # Changed files only
npm test                    # All tests (default)
```

**Current**: `npm test tests/security/` works partially

**Risk**: None
**Benefit**: 60% faster in development
**Effort**: Easy (~1 hour)

---

### 18.9 Test Output Reduction

**What**: Minimize console output during tests

**Status**: ✅ Already implemented
- TEST_QUIET mode in test-helpers.js
- Compact output format
- Verbose only on failures

**Benefit**: 5% faster (I/O reduction)

---

### 18.10 Metrics & Validation

**What**: Measure and track test performance

**Metrics to Track**:
```
Total runtime: Xs
Per-suite times:
  - combat: Xs
  - operations: Xs
  - security: Xs
Slowest tests:
  1. test-name: Xms
  2. test-name: Xms
```

**Implementation**:
```javascript
// Add timing to test runner
const start = Date.now();
// run tests
console.log(`Suite completed in ${Date.now() - start}ms`);
```

**Validation**: Before/after comparison
**Risk**: None
**Effort**: Easy (~30 min)

---

## Implementation Priority

**Phase 1 (Quick Wins)**:
- 18.5 Jest/runner optimization
- 18.8 Selective test runs
- 18.10 Metrics

**Phase 2 (Medium Effort)**:
- 18.1 Parallel suites
- 18.3 Lighter fixtures
- 18.6 File organization

**Phase 3 (Higher Effort)**:
- 18.2 Skip unchanged
- 18.4 Shared DB
- 18.7 Mock heavy ops

---

## Expected Results

| Phase | Time | Improvement |
|-------|------|-------------|
| Current | ~15s | baseline |
| Phase 1 | ~10s | 33% faster |
| Phase 2 | ~7s | 53% faster |
| Phase 3 | ~5s | 67% faster |

---

## Quick Reference

```
FAST TEST PATTERNS:
1. Parallel suites
2. Skip unchanged files
3. Minimal fixtures
4. Shared connections
5. Selective runs
6. Mock I/O

SLOW PATTERNS (avoid):
1. Sequential suites
2. Always run all
3. Full objects everywhere
4. New DB per test
5. Verbose output
6. Real file I/O in unit tests
```

---

## Current Test Breakdown

```
33 suites, 325 tests, ~15s total

By type:
- Unit: ~200 tests (~5s)
- Integration: ~100 tests (~8s)
- Security: ~25 tests (~2s)

Slowest suites (estimate):
- operations-handlers: ~3s
- space-combat: ~2s
- export-import: ~2s
```

/**
 * Smoke Test Runner
 * Runs all smoke tests in sequence
 */

const { runGMHappyPath } = require('./smoke/gm-happy-path.smoke');
const { runPlayerHappyPath } = require('./smoke/player-happy-path.smoke');
const { runGMFeatures } = require('./smoke/gm-features.smoke');

async function runAllSmokeTests() {
  console.log('='.repeat(60));
  console.log('SMOKE TEST SUITE - Operations VTT');
  console.log('='.repeat(60));
  console.log('');

  const allResults = [];
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  // Run GM Happy Path
  try {
    const gmResults = await runGMHappyPath();
    allResults.push({ name: 'GM Happy Path', results: gmResults });
    totalPassed += gmResults.passed;
    totalFailed += gmResults.failed;
    totalSkipped += gmResults.skipped || 0;
  } catch (error) {
    console.error('GM Happy Path crashed:', error.message);
    totalFailed++;
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // Run GM Features
  try {
    const gmFeaturesResults = await runGMFeatures();
    allResults.push({ name: 'GM Features', results: gmFeaturesResults });
    totalPassed += gmFeaturesResults.passed;
    totalFailed += gmFeaturesResults.failed;
    totalSkipped += gmFeaturesResults.skipped || 0;
  } catch (error) {
    console.error('GM Features crashed:', error.message);
    totalFailed++;
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // Run Player Happy Path
  try {
    const playerResults = await runPlayerHappyPath();
    allResults.push({ name: 'Player Happy Path', results: playerResults });
    totalPassed += playerResults.passed;
    totalFailed += playerResults.failed;
    totalSkipped += playerResults.skipped || 0;
  } catch (error) {
    console.error('Player Happy Path crashed:', error.message);
    totalFailed++;
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('SMOKE TEST SUMMARY');
  console.log('='.repeat(60));

  for (const suite of allResults) {
    const status = suite.results.failed === 0 ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`${status} ${suite.name}: ${suite.results.passed} passed, ${suite.results.failed} failed`);
  }

  console.log('');
  console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('='.repeat(60));

  process.exit(totalFailed > 0 ? 1 : 0);
}

runAllSmokeTests();

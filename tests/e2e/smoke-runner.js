/**
 * Smoke Test Runner
 * Runs all smoke tests in sequence
 */

const { runGMHappyPath } = require('./smoke/gm-happy-path.smoke');
const { runPlayerHappyPath } = require('./smoke/player-happy-path.smoke');
const { runGMFeatures } = require('./smoke/gm-features.smoke');
const { runSensorUXTests } = require('./smoke/sensor-ux.smoke');
const { runRoleAssignmentTests } = require('./smoke/role-assignment.smoke');
const { runCombatFlowTests } = require('./smoke/combat-flow.smoke');
const { runMultiPlayerTests } = require('./smoke/multi-player.smoke');

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

  console.log('\n' + '-'.repeat(60) + '\n');

  // Run Sensor UX Tests (AR-25)
  try {
    const sensorResults = await runSensorUXTests();
    allResults.push({ name: 'Sensor UX', results: sensorResults });
    totalPassed += sensorResults.passed;
    totalFailed += sensorResults.failed;
    totalSkipped += sensorResults.skipped || 0;
  } catch (error) {
    console.error('Sensor UX crashed:', error.message);
    totalFailed++;
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // Run Role Assignment Tests (AR-26)
  try {
    const roleResults = await runRoleAssignmentTests();
    allResults.push({ name: 'Role Assignment', results: roleResults });
    totalPassed += roleResults.passed;
    totalFailed += roleResults.failed;
    totalSkipped += roleResults.skipped || 0;
  } catch (error) {
    console.error('Role Assignment crashed:', error.message);
    totalFailed++;
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // Run Combat Flow Tests (AR-26)
  try {
    const combatResults = await runCombatFlowTests();
    allResults.push({ name: 'Combat Flow', results: combatResults });
    totalPassed += combatResults.passed;
    totalFailed += combatResults.failed;
    totalSkipped += combatResults.skipped || 0;
  } catch (error) {
    console.error('Combat Flow crashed:', error.message);
    totalFailed++;
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // Run Multi-Player Tests (AR-26)
  try {
    const multiResults = await runMultiPlayerTests();
    allResults.push({ name: 'Multi-Player', results: multiResults });
    totalPassed += multiResults.passed;
    totalFailed += multiResults.failed;
    totalSkipped += multiResults.skipped || 0;
  } catch (error) {
    console.error('Multi-Player crashed:', error.message);
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

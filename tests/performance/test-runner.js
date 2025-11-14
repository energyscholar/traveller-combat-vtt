#!/usr/bin/env node
// Puppeteer Test Runner CLI
// Purpose: Command-line interface for running Puppeteer scenarios
// Usage: node tests/performance/test-runner.js [options]

const { runScenario, runScenarios, validatePerformance } = require('./puppeteer-runner');
const scenarios = require('../scenarios');

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const scenarioName = args.find(arg => arg.startsWith('--scenario='))?.split('=')[1];

  console.log('========================================');
  console.log('PUPPETEER TEST RUNNER (Headless Mode)');
  console.log('========================================\n');

  let results;

  if (scenarioName) {
    // Run single scenario
    const scenario = scenarios.getScenario(scenarioName);
    if (!scenario) {
      console.error(`❌ Scenario not found: ${scenarioName}`);
      console.log('\nAvailable scenarios:');
      scenarios.listScenarios().forEach(s => {
        console.log(`  - ${s.name}`);
      });
      process.exit(1);
    }

    console.log(`Running scenario: ${scenario.name}\n`);
    const result = await runScenario(scenario, { verbose });

    // Validate performance
    const validation = validatePerformance(result, scenario);

    // Display results
    displayResult(result, validation);

    process.exit(result.success && validation.passed ? 0 : 1);

  } else {
    // Run all scenarios
    console.log(`Running ${scenarios.all.length} scenarios...\n`);
    results = await runScenarios(scenarios.all, { verbose });

    // Display summary
    displaySummary(results);

    process.exit(results.summary.failed === 0 ? 0 : 1);
  }
}

function displayResult(result, validation) {
  console.log('\n========================================');
  console.log('SCENARIO RESULTS');
  console.log('========================================\n');

  console.log(`Scenario: ${result.scenario}`);
  console.log(`Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Steps: ${result.steps.length} (${result.steps.filter(s => s.success).length} passed)`);
  console.log(`Duration: ${Math.round(result.metrics.totalDuration)}ms`);
  console.log(`Memory: ${Math.round(result.metrics.finalMemory)}MB`);

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.description || 'Fatal'}: ${err.error}`);
    });
  }

  if (validation) {
    console.log('\n📊 Performance Validation:');
    console.log(`Overall: ${validation.passed ? '✅ PASSED' : '❌ FAILED'}`);
    validation.checks.forEach(check => {
      const status = check.passed ? '✅' : '❌';
      console.log(`  ${status} ${check.name}: ${check.actual} (target: ${check.target})`);
    });
  }

  console.log('\n========================================\n');
}

function displaySummary(results) {
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================\n');

  console.log(`Total Scenarios: ${results.summary.total}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⏱️  Total Duration: ${Math.round(results.summary.totalDuration)}ms`);
  console.log(`📊 Average Duration: ${Math.round(results.summary.averageDuration)}ms`);

  console.log('\nScenario Results:');
  results.scenarios.forEach((result, i) => {
    const status = result.success ? '✅' : '❌';
    const duration = Math.round(result.metrics.totalDuration);
    console.log(`  ${status} ${result.scenario} (${duration}ms)`);
  });

  console.log('\n========================================\n');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };

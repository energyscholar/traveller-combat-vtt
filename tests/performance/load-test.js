#!/usr/bin/env node
// Multi-Client Load Testing Framework
// Purpose: Simulate multiple concurrent battles for performance testing
// Mode: Headless (fast execution, parallel clients)
// Session: 6, Phase 2.2

const { runScenario, launchBrowser } = require('./puppeteer-runner');
const scenarios = require('../scenarios');
const { performance } = require('perf_hooks');

/**
 * Run multiple scenarios in parallel
 * @param {Object} scenario - Scenario to run
 * @param {number} concurrency - Number of parallel instances
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Load test results
 */
async function runLoadTest(scenario, concurrency = 2, options = {}) {
  const {
    baseUrl = 'http://localhost:3000',
    verbose = false
  } = options;

  console.log(`\n========================================`);
  console.log(`LOAD TEST: ${scenario.name}`);
  console.log(`========================================`);
  console.log(`Concurrency: ${concurrency} clients`);
  console.log(`Base URL: ${baseUrl}\n`);

  const startTime = performance.now();
  const results = {
    scenario: scenario.name,
    concurrency,
    clients: [],
    metrics: {
      totalDuration: 0,
      successfulClients: 0,
      failedClients: 0,
      averageDuration: 0,
      peakMemory: 0,
      totalMemory: 0,
      averageMemory: 0
    },
    errors: []
  };

  try {
    // Launch all clients in parallel
    console.log(`🚀 Launching ${concurrency} concurrent clients...`);

    const clientPromises = [];
    for (let i = 0; i < concurrency; i++) {
      const clientId = i + 1;
      const clientPromise = runClientScenario(scenario, clientId, { baseUrl, verbose })
        .then(result => {
          if (verbose) console.log(`✅ Client ${clientId} completed`);
          return result;
        })
        .catch(error => {
          if (verbose) console.error(`❌ Client ${clientId} failed: ${error.message}`);
          return {
            clientId,
            success: false,
            error: error.message,
            metrics: {}
          };
        });

      clientPromises.push(clientPromise);
    }

    // Wait for all clients to complete
    console.log(`⏳ Running scenarios in parallel...`);
    const clientResults = await Promise.all(clientPromises);

    // Aggregate results
    results.clients = clientResults;

    clientResults.forEach(client => {
      if (client.success) {
        results.metrics.successfulClients++;
        results.metrics.totalMemory += client.metrics.finalMemory || 0;
        results.metrics.peakMemory = Math.max(
          results.metrics.peakMemory,
          client.metrics.finalMemory || 0
        );
      } else {
        results.metrics.failedClients++;
        results.errors.push({
          clientId: client.clientId,
          error: client.error
        });
      }
    });

    if (results.metrics.successfulClients > 0) {
      results.metrics.averageMemory =
        results.metrics.totalMemory / results.metrics.successfulClients;
    }

  } catch (error) {
    results.errors.push({
      fatal: true,
      error: error.message,
      stack: error.stack
    });
  }

  const endTime = performance.now();
  results.metrics.totalDuration = endTime - startTime;
  results.metrics.averageDuration =
    results.metrics.totalDuration / concurrency;

  return results;
}

/**
 * Run a single client scenario
 * @param {Object} scenario - Scenario definition
 * @param {number} clientId - Client identifier
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Client result
 */
async function runClientScenario(scenario, clientId, options = {}) {
  const { baseUrl, verbose } = options;

  if (verbose) console.log(`[Client ${clientId}] Starting scenario: ${scenario.name}`);

  const result = await runScenario(scenario, { baseUrl, verbose: false });
  result.clientId = clientId;

  return result;
}

/**
 * Run progressive load test (2, 5, 10 clients)
 * @param {Object} scenario - Scenario to test
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Progressive test results
 */
async function runProgressiveLoadTest(scenario, options = {}) {
  const {
    levels = [2, 5, 10],
    baseUrl = 'http://localhost:3000',
    verbose = false,
    stopOnFailure = false
  } = options;

  console.log(`\n========================================`);
  console.log(`PROGRESSIVE LOAD TEST`);
  console.log(`========================================`);
  console.log(`Scenario: ${scenario.name}`);
  console.log(`Load Levels: ${levels.join(', ')} clients`);
  console.log(`========================================\n`);

  const results = {
    scenario: scenario.name,
    levels: [],
    summary: {
      totalTests: levels.length,
      passedTests: 0,
      failedTests: 0,
      maxConcurrency: 0
    }
  };

  for (const level of levels) {
    console.log(`\n📊 Testing ${level} concurrent clients...\n`);

    const levelResult = await runLoadTest(scenario, level, { baseUrl, verbose });
    results.levels.push(levelResult);

    const success = levelResult.metrics.successfulClients === level;
    if (success) {
      results.summary.passedTests++;
      results.summary.maxConcurrency = level;
      console.log(`\n✅ Load test PASSED: ${level} clients`);
    } else {
      results.summary.failedTests++;
      console.log(`\n❌ Load test FAILED: ${level} clients`);

      if (stopOnFailure) {
        console.log(`⚠️  Stopping progressive test (stopOnFailure=true)`);
        break;
      }
    }

    // Display level summary
    displayLoadTestSummary(levelResult);

    // Delay between levels
    if (levels.indexOf(level) < levels.length - 1) {
      console.log(`\n⏸️  Waiting 2 seconds before next level...\n`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * Display load test summary
 * @param {Object} result - Load test result
 */
function displayLoadTestSummary(result) {
  console.log(`\n────────────────────────────────────────`);
  console.log(`LOAD TEST SUMMARY`);
  console.log(`────────────────────────────────────────`);
  console.log(`Scenario: ${result.scenario}`);
  console.log(`Concurrency: ${result.concurrency} clients`);
  console.log(`Success Rate: ${result.metrics.successfulClients}/${result.concurrency} (${Math.round((result.metrics.successfulClients / result.concurrency) * 100)}%)`);
  console.log(`Total Duration: ${Math.round(result.metrics.totalDuration)}ms`);
  console.log(`Average Duration: ${Math.round(result.metrics.averageDuration)}ms`);
  console.log(`Peak Memory: ${Math.round(result.metrics.peakMemory)}MB`);
  console.log(`Average Memory: ${Math.round(result.metrics.averageMemory)}MB`);

  if (result.errors.length > 0) {
    console.log(`\n❌ Errors: ${result.errors.length}`);
    result.errors.slice(0, 3).forEach((err, i) => {
      console.log(`  ${i + 1}. Client ${err.clientId}: ${err.error}`);
    });
    if (result.errors.length > 3) {
      console.log(`  ... and ${result.errors.length - 3} more`);
    }
  }

  console.log(`────────────────────────────────────────\n`);
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const scenarioName = args.find(arg => arg.startsWith('--scenario='))?.split('=')[1];
  const concurrency = parseInt(args.find(arg => arg.startsWith('--clients='))?.split('=')[1]) || 2;
  const progressive = args.includes('--progressive');

  let scenario;
  if (scenarioName) {
    scenario = scenarios.getScenario(scenarioName);
    if (!scenario) {
      console.error(`❌ Scenario not found: ${scenarioName}`);
      process.exit(1);
    }
  } else {
    // Default to basic combat
    scenario = scenarios.basicCombat;
  }

  let results;
  if (progressive) {
    const levels = args.find(arg => arg.startsWith('--levels='))?.split('=')[1]
      ?.split(',').map(n => parseInt(n)) || [2, 5, 10];

    results = await runProgressiveLoadTest(scenario, {
      levels,
      verbose,
      stopOnFailure: args.includes('--stop-on-failure')
    });

    // Display final summary
    console.log(`\n========================================`);
    console.log(`PROGRESSIVE TEST COMPLETE`);
    console.log(`========================================`);
    console.log(`Passed: ${results.summary.passedTests}/${results.summary.totalTests}`);
    console.log(`Max Concurrency: ${results.summary.maxConcurrency} clients`);
    console.log(`========================================\n`);

    process.exit(results.summary.failedTests === 0 ? 0 : 1);

  } else {
    results = await runLoadTest(scenario, concurrency, { verbose });
    displayLoadTestSummary(results);

    process.exit(results.metrics.successfulClients === concurrency ? 0 : 1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  runLoadTest,
  runProgressiveLoadTest,
  runClientScenario
};

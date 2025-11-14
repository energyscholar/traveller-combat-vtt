// Puppeteer Headless Runner
// Purpose: Fast, headless execution of test scenarios for performance testing
// Mode: Headless (no visible browser, full speed)
// Session: 6, Phase 2.1

const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');

/**
 * Launch headless browser with ChromeOS compatibility
 * @returns {Promise<Browser>} Puppeteer browser instance
 */
async function launchBrowser() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Reduce memory usage
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions'
    ]
  });

  return browser;
}

/**
 * Execute a single step from scenario
 * @param {Page} page - Puppeteer page
 * @param {Object} step - Step definition
 * @returns {Promise<Object>} Step result with timing
 */
async function executeStep(page, step) {
  const startTime = performance.now();
  let result = { success: false, error: null };

  try {
    switch (step.action) {
      case 'click':
        await page.waitForSelector(step.selector, { timeout: 10000 });
        await page.click(step.selector);
        result.success = true;
        break;

      case 'select':
        await page.waitForSelector(step.selector, { timeout: 10000 });
        await page.select(step.selector, step.value);
        result.success = true;
        break;

      case 'type':
        await page.waitForSelector(step.selector, { timeout: 10000 });
        await page.type(step.selector, step.text);
        result.success = true;
        break;

      case 'getText':
        await page.waitForSelector(step.selector, { timeout: 10000 });
        const text = await page.$eval(step.selector, el => el.textContent);
        result.success = true;
        result.text = text;
        break;

      case 'waitForSelector':
        await page.waitForSelector(step.selector, { timeout: step.timeout || 10000 });
        result.success = true;
        break;

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }

    // Handle wait conditions
    if (step.wait) {
      if (step.wait.selector) {
        await page.waitForSelector(step.wait.selector, { timeout: 10000 });
      } else if (step.wait.timeout) {
        await page.waitForTimeout(step.wait.timeout);
      }
    }

  } catch (error) {
    result.error = error.message;
  }

  const endTime = performance.now();
  result.duration = endTime - startTime;

  return result;
}

/**
 * Execute a complete test scenario
 * @param {Object} scenario - Scenario definition
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Scenario results with metrics
 */
async function runScenario(scenario, options = {}) {
  const {
    baseUrl = 'http://localhost:3000',
    verbose = false
  } = options;

  const startTime = performance.now();
  const results = {
    scenario: scenario.name,
    success: false,
    steps: [],
    metrics: {},
    errors: []
  };

  let browser = null;
  let page = null;

  try {
    // Launch browser
    if (verbose) console.log(`[Puppeteer] Launching browser for: ${scenario.name}`);
    browser = await launchBrowser();
    page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to base URL
    if (verbose) console.log(`[Puppeteer] Navigating to: ${baseUrl}`);
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Collect initial metrics
    const initialMetrics = await page.metrics();
    results.metrics.initialMemory = initialMetrics.JSHeapUsedSize / 1024 / 1024; // MB

    // Execute Puppeteer steps
    if (verbose) console.log(`[Puppeteer] Executing ${scenario.puppeteerSteps.length} steps`);
    for (let i = 0; i < scenario.puppeteerSteps.length; i++) {
      const step = scenario.puppeteerSteps[i];

      if (verbose) console.log(`[Puppeteer] Step ${i + 1}: ${step.description}`);

      const stepResult = await executeStep(page, step);
      results.steps.push({
        index: i,
        description: step.description,
        ...stepResult
      });

      if (!stepResult.success) {
        results.errors.push({
          step: i,
          description: step.description,
          error: stepResult.error
        });

        if (verbose) console.error(`[Puppeteer] Step ${i + 1} FAILED: ${stepResult.error}`);

        // Continue or abort based on error severity
        if (step.critical !== false) {
          throw new Error(`Critical step failed: ${step.description}`);
        }
      }
    }

    // Collect final metrics
    const finalMetrics = await page.metrics();
    results.metrics.finalMemory = finalMetrics.JSHeapUsedSize / 1024 / 1024; // MB
    results.metrics.memoryDelta = results.metrics.finalMemory - results.metrics.initialMemory;

    results.success = true;
    if (verbose) console.log(`[Puppeteer] ✅ Scenario completed successfully`);

  } catch (error) {
    results.success = false;
    results.errors.push({
      fatal: true,
      error: error.message,
      stack: error.stack
    });

    if (verbose) console.error(`[Puppeteer] ❌ Scenario FAILED: ${error.message}`);
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
    }
  }

  const endTime = performance.now();
  results.metrics.totalDuration = endTime - startTime;
  results.metrics.averageStepDuration = results.steps.length > 0
    ? results.steps.reduce((sum, s) => sum + s.duration, 0) / results.steps.length
    : 0;

  return results;
}

/**
 * Run multiple scenarios in sequence
 * @param {Array<Object>} scenarios - Array of scenarios
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Combined results
 */
async function runScenarios(scenarios, options = {}) {
  const results = {
    scenarios: [],
    summary: {
      total: scenarios.length,
      passed: 0,
      failed: 0,
      totalDuration: 0
    }
  };

  const startTime = performance.now();

  for (const scenario of scenarios) {
    const result = await runScenario(scenario, options);
    results.scenarios.push(result);

    if (result.success) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }
  }

  const endTime = performance.now();
  results.summary.totalDuration = endTime - startTime;
  results.summary.averageDuration = results.summary.totalDuration / scenarios.length;

  return results;
}

/**
 * Validate scenario against performance targets
 * @param {Object} result - Scenario result
 * @param {Object} scenario - Scenario definition
 * @returns {Object} Validation result
 */
function validatePerformance(result, scenario) {
  const validation = {
    passed: true,
    checks: []
  };

  const metrics = scenario.performanceMetrics;
  if (!metrics) return validation;

  // Check total duration
  if (metrics.maxTotalDuration) {
    const passed = result.metrics.totalDuration <= metrics.maxTotalDuration;
    validation.checks.push({
      name: 'Total Duration',
      target: `${metrics.maxTotalDuration}ms`,
      actual: `${Math.round(result.metrics.totalDuration)}ms`,
      passed
    });
    if (!passed) validation.passed = false;
  }

  // Check memory usage
  if (metrics.maxMemory) {
    const passed = result.metrics.finalMemory <= metrics.maxMemory;
    validation.checks.push({
      name: 'Memory Usage',
      target: `${metrics.maxMemory}MB`,
      actual: `${Math.round(result.metrics.finalMemory)}MB`,
      passed
    });
    if (!passed) validation.passed = false;
  }

  return validation;
}

module.exports = {
  launchBrowser,
  executeStep,
  runScenario,
  runScenarios,
  validatePerformance
};

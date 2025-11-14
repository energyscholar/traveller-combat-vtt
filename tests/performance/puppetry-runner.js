// Puppetry Visible Runner
// Purpose: Slow, visible execution with visual feedback for demonstrations
// Mode: Visible browser with highlighting and status overlay
// Session: 6, Phase 3.1

const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');

/**
 * Delay helper (Puppeteer's waitForTimeout was deprecated)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Launch visible browser with slow motion
 * @param {Object} options - Launch options
 * @returns {Promise<Browser>} Puppeteer browser instance
 */
async function launchVisibleBrowser(options = {}) {
  const {
    slowMo = 500, // 500ms delay between actions
    headless = false
  } = options;

  const browser = await puppeteer.launch({
    headless,
    slowMo,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ],
    defaultViewport: null // Use full window size
  });

  return browser;
}

/**
 * Inject status overlay into page
 * @param {Page} page - Puppeteer page
 * @returns {Promise<void>}
 */
async function injectStatusOverlay(page) {
  await page.evaluate(() => {
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'puppetry-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: rgba(26, 26, 26, 0.95);
      border: 2px solid #667eea;
      border-radius: 8px;
      padding: 15px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #fff;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    `;

    overlay.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #444;">
        <span style="font-size: 24px; margin-right: 10px;">🤖</span>
        <strong style="font-size: 16px;">PUPPETRY ACTIVE</strong>
      </div>
      <div id="puppetry-status" style="margin-bottom: 8px; color: #ffa500;">
        <strong>Status:</strong> <span id="puppetry-status-text">Initializing...</span>
      </div>
      <div id="puppetry-action" style="margin-bottom: 8px; color: #4ade80;">
        <strong>Now:</strong> <span id="puppetry-action-text">-</span>
      </div>
      <div id="puppetry-next" style="margin-bottom: 8px; color: #888;">
        <strong>Next:</strong> <span id="puppetry-next-text">-</span>
      </div>
      <div id="puppetry-progress" style="color: #667eea;">
        <strong>Progress:</strong> <span id="puppetry-progress-text">0/0</span>
      </div>
    `;

    document.body.appendChild(overlay);
  });
}

/**
 * Update status overlay
 * @param {Page} page - Puppeteer page
 * @param {Object} status - Status update
 * @returns {Promise<void>}
 */
async function updateStatus(page, status) {
  const {
    current = null,
    next = null,
    progress = null,
    statusText = null
  } = status;

  await page.evaluate((data) => {
    if (data.current !== null) {
      const el = document.getElementById('puppetry-action-text');
      if (el) el.textContent = data.current;
    }
    if (data.next !== null) {
      const el = document.getElementById('puppetry-next-text');
      if (el) el.textContent = data.next;
    }
    if (data.progress !== null) {
      const el = document.getElementById('puppetry-progress-text');
      if (el) el.textContent = data.progress;
    }
    if (data.statusText !== null) {
      const el = document.getElementById('puppetry-status-text');
      if (el) el.textContent = data.statusText;
    }
  }, status);
}

/**
 * Highlight element before interaction
 * @param {Page} page - Puppeteer page
 * @param {string} selector - Element selector
 * @param {number} duration - Highlight duration (ms)
 * @returns {Promise<void>}
 */
async function highlightElement(page, selector, duration = 1000) {
  await page.evaluate((sel, dur) => {
    const element = document.querySelector(sel);
    if (element) {
      const originalBorder = element.style.border;
      const originalBoxShadow = element.style.boxShadow;
      const originalTransition = element.style.transition;

      element.style.transition = 'all 0.3s ease';
      element.style.border = '3px solid #fbbf24';
      element.style.boxShadow = '0 0 20px #fbbf24';

      // Scroll into view smoothly
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Restore after duration
      setTimeout(() => {
        element.style.transition = originalTransition;
        element.style.border = originalBorder;
        element.style.boxShadow = originalBoxShadow;
      }, dur);
    }
  }, selector, duration);
}

/**
 * Execute a single puppetry step with visual feedback
 * @param {Page} page - Puppeteer page
 * @param {Object} step - Step definition from scenario
 * @param {number} stepIndex - Current step index
 * @param {number} totalSteps - Total number of steps
 * @returns {Promise<Object>} Step result
 */
async function executePuppetryStep(page, step, stepIndex, totalSteps) {
  const startTime = performance.now();
  const result = { success: false, error: null };

  try {
    // Update status overlay
    const nextStep = stepIndex < totalSteps - 1 ? 'Next step...' : 'Complete';
    await updateStatus(page, {
      current: step.feedback || step.description,
      next: nextStep,
      progress: `${stepIndex + 1}/${totalSteps}`,
      statusText: 'Running'
    });

    // Highlight element if specified
    if (step.highlight) {
      await highlightElement(page, step.highlight, 800);
    } else if (step.selector) {
      await highlightElement(page, step.selector, 800);
    }

    // Delay before action (puppetry is SLOW and deliberate)
    if (step.delay) {
      await delay(step.delay);
    }

    // Execute action
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
        await page.type(step.selector, step.text, { delay: 100 }); // Slow typing
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
        await delay(step.wait.timeout);
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
 * Run a scenario in visible puppetry mode
 * @param {Object} scenario - Scenario definition
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Scenario results
 */
async function runPuppetryScenario(scenario, options = {}) {
  const {
    baseUrl = 'http://localhost:3000',
    slowMo = 500,
    verbose = true,
    keepOpen = 5000 // Keep browser open for 5s after completion
  } = options;

  if (verbose) {
    console.log(`\n========================================`);
    console.log(`PUPPETRY MODE: ${scenario.name}`);
    console.log(`========================================`);
    console.log(`Mode: Visible, Slow, Human-Watchable`);
    console.log(`Base URL: ${baseUrl}\n`);
  }

  const startTime = performance.now();
  const results = {
    scenario: scenario.name,
    mode: 'puppetry',
    success: false,
    steps: [],
    metrics: {},
    errors: []
  };

  let browser = null;
  let page = null;

  try {
    // Launch visible browser
    if (verbose) console.log(`🚀 Launching visible browser (slowMo: ${slowMo}ms)...`);
    browser = await launchVisibleBrowser({ slowMo });
    const pages = await browser.pages();
    page = pages[0] || await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate
    if (verbose) console.log(`🌐 Navigating to: ${baseUrl}`);
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Inject status overlay
    if (verbose) console.log(`📊 Injecting status overlay...`);
    await injectStatusOverlay(page);
    await delay(1000); // Let user see overlay

    // Execute puppetry steps
    const steps = scenario.puppetrySteps;
    if (verbose) console.log(`🎭 Executing ${steps.length} puppetry steps...\n`);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      if (verbose) {
        console.log(`Step ${i + 1}/${steps.length}: ${step.description}`);
        if (step.feedback) console.log(`  💬 "${step.feedback}"`);
      }

      const stepResult = await executePuppetryStep(page, step, i, steps.length);
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

        if (verbose) console.error(`  ❌ FAILED: ${stepResult.error}`);

        if (step.critical !== false) {
          throw new Error(`Critical step failed: ${step.description}`);
        }
      } else {
        if (verbose) console.log(`  ✅ Success (${Math.round(stepResult.duration)}ms)`);
      }
    }

    // Update final status
    await updateStatus(page, {
      current: 'Scenario complete!',
      next: '-',
      statusText: '✅ Complete'
    });

    results.success = true;
    if (verbose) console.log(`\n✅ Puppetry scenario COMPLETE\n`);

    // Keep browser open for viewing
    if (keepOpen > 0) {
      if (verbose) console.log(`⏸️  Keeping browser open for ${keepOpen / 1000}s...`);
      await delay(keepOpen);
    }

  } catch (error) {
    results.success = false;
    results.errors.push({
      fatal: true,
      error: error.message,
      stack: error.stack
    });

    if (verbose) console.error(`\n❌ Puppetry scenario FAILED: ${error.message}\n`);

    // Keep browser open on error for debugging
    if (browser && keepOpen > 0) {
      if (verbose) console.log(`⏸️  Keeping browser open for debugging (${keepOpen / 1000}s)...`);
      await delay(keepOpen);
    }
  } finally {
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

module.exports = {
  launchVisibleBrowser,
  injectStatusOverlay,
  updateStatus,
  highlightElement,
  executePuppetryStep,
  runPuppetryScenario
};

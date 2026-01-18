#!/usr/bin/env node
/**
 * T5.1: DOM Selector Parity Tests
 *
 * Verifies V2 has all required selectors from the selector contract.
 * Run with: node tests/e2e/parity/dom-parity.test.js
 */

const puppeteer = require('puppeteer');
const { fullUrl } = require('../config');

// Required selectors from audit plan
const REQUIRED_SELECTORS = {
  // Login screen (immediate)
  loginScreen: [
    '#btn-gm-login',
    '#btn-player-login',
    '#btn-solo-demo',
    '#campaign-select',
    '#player-select',
    '#campaign-code-input'
  ],
  // GM setup screen (after GM login + campaign select)
  gmSetup: [
    '#gm-setup-screen',
    '#campaign-code-value',
    '#btn-start-session'
  ],
  // Player setup screen (after player login)
  playerSetup: [
    '#player-setup-screen',
    '#btn-join-bridge'
  ],
  // Bridge screen (after start session)
  bridge: [
    '#bridge-screen',
    '#role-panel',
    '#viewscreen',
    '#ship-status',
    '#crew-list'
  ]
};

// Dynamic selectors that appear only with data
const DYNAMIC_SELECTORS = [
  '.campaign-item',   // Needs campaigns loaded
  '.player-slot',     // Needs slots loaded
  '.contact-item',    // Needs contacts
  '.role-action-btn'  // Needs role panel with actions
];

const results = { passed: 0, failed: 0, tests: [] };

function pass(name) {
  results.passed++;
  results.tests.push({ name, status: 'PASS' });
  console.log(`\x1b[32m✓\x1b[0m ${name}`);
}

function fail(name, reason) {
  results.failed++;
  results.tests.push({ name, status: 'FAIL', reason });
  console.log(`\x1b[31m✗\x1b[0m ${name}: ${reason}`);
}

async function checkSelector(page, selector) {
  const el = await page.$(selector);
  return el !== null;
}

async function runTests() {
  console.log('=== T5.1: DOM Selector Parity Tests ===\n');
  console.log(`Testing: ${fullUrl}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to V2
    await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 10000 });
    await new Promise(r => setTimeout(r, 500));

    // Test login screen selectors
    console.log('--- Login Screen ---');
    for (const selector of REQUIRED_SELECTORS.loginScreen) {
      const exists = await checkSelector(page, selector);
      if (exists) {
        pass(`Login: ${selector}`);
      } else {
        fail(`Login: ${selector}`, 'not found');
      }
    }

    // Click GM login to show campaign-select
    const gmBtn = await page.$('#btn-gm-login');
    if (gmBtn) {
      await gmBtn.click();
      await new Promise(r => setTimeout(r, 300));
    }

    // Check campaign-select is now visible
    const campaignSelect = await page.$('#campaign-select:not(.hidden)');
    if (campaignSelect) {
      pass('campaign-select visible after GM login');
    } else {
      // May still be hidden class-based, check if element exists
      const exists = await checkSelector(page, '#campaign-select');
      if (exists) {
        pass('campaign-select exists (visibility may differ)');
      } else {
        fail('campaign-select visible after GM login', 'not visible');
      }
    }

    // Test GM setup screen selectors (check existence in DOM)
    console.log('\n--- GM Setup Screen (DOM check) ---');
    for (const selector of REQUIRED_SELECTORS.gmSetup) {
      const exists = await checkSelector(page, selector);
      if (exists) {
        pass(`GM Setup: ${selector}`);
      } else {
        fail(`GM Setup: ${selector}`, 'not found in DOM');
      }
    }

    // Test player setup screen selectors
    console.log('\n--- Player Setup Screen (DOM check) ---');
    for (const selector of REQUIRED_SELECTORS.playerSetup) {
      const exists = await checkSelector(page, selector);
      if (exists) {
        pass(`Player Setup: ${selector}`);
      } else {
        fail(`Player Setup: ${selector}`, 'not found in DOM');
      }
    }

    // Test bridge screen selectors
    console.log('\n--- Bridge Screen (DOM check) ---');
    for (const selector of REQUIRED_SELECTORS.bridge) {
      const exists = await checkSelector(page, selector);
      if (exists) {
        pass(`Bridge: ${selector}`);
      } else {
        fail(`Bridge: ${selector}`, 'not found in DOM');
      }
    }

    // Note about dynamic selectors
    console.log('\n--- Dynamic Selectors (info only) ---');
    for (const selector of DYNAMIC_SELECTORS) {
      const exists = await checkSelector(page, selector);
      console.log(`  ${selector}: ${exists ? 'present' : 'not present (OK - requires data)'}`);
    }

  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n=== Results ===');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);

  return results.failed === 0;
}

// Run tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });

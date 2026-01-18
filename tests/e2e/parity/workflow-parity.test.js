#!/usr/bin/env node
/**
 * T5.2: Workflow Parity Tests
 *
 * Verifies V2 workflows match V1 behavior.
 * Run with: node tests/e2e/parity/workflow-parity.test.js
 */

const puppeteer = require('puppeteer');
const { fullUrl, BASE_URL } = require('../config');

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

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runTests() {
  console.log('=== T5.2: Workflow Parity Tests ===\n');
  console.log(`Testing: ${fullUrl}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Capture console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', err => errors.push(err.message));

    // ============================================
    // Test 1: Page loads without JS errors
    // ============================================
    console.log('--- Page Load ---');
    await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 10000 });
    await delay(500);

    // Filter out expected errors (favicon, socket reconnect, etc.)
    const realErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.includes('net::ERR')
    );

    if (realErrors.length === 0) {
      pass('Page loads without JS errors');
    } else {
      fail('Page loads without JS errors', realErrors.join('; '));
    }

    // ============================================
    // Test 2: Login screen is active
    // ============================================
    const loginActive = await page.$('#login-screen.active');
    if (loginActive) {
      pass('Login screen is active on load');
    } else {
      fail('Login screen is active on load', 'login-screen not active');
    }

    // ============================================
    // Test 3: GM Login workflow - click shows campaign-select
    // ============================================
    console.log('\n--- GM Login Workflow ---');
    const gmBtn = await page.$('#btn-gm-login');
    if (gmBtn) {
      await gmBtn.click();
      await delay(300);

      // Check campaign-select becomes visible (either active or not hidden)
      const campaignSelectVisible = await page.evaluate(() => {
        const el = document.getElementById('campaign-select');
        if (!el) return false;
        return !el.classList.contains('hidden');
      });

      if (campaignSelectVisible) {
        pass('GM login shows campaign-select');
      } else {
        fail('GM login shows campaign-select', 'campaign-select still hidden');
      }
    } else {
      fail('GM login shows campaign-select', 'btn-gm-login not found');
    }

    // ============================================
    // Test 4: Back button returns to login options
    // ============================================
    const backBtn = await page.$('#btn-back-login');
    if (backBtn) {
      await backBtn.click();
      await delay(300);

      const loginOptionsVisible = await page.evaluate(() => {
        const gmBtn = document.getElementById('btn-gm-login');
        return gmBtn && gmBtn.offsetParent !== null;
      });

      if (loginOptionsVisible) {
        pass('Back button returns to login options');
      } else {
        fail('Back button returns to login options', 'login options not visible');
      }
    } else {
      fail('Back button returns to login options', 'btn-back-login not found');
    }

    // ============================================
    // Test 5: Player login workflow - click shows player-select
    // ============================================
    console.log('\n--- Player Login Workflow ---');
    const playerBtn = await page.$('#btn-player-login');
    if (playerBtn) {
      await playerBtn.click();
      await delay(300);

      const playerSelectVisible = await page.evaluate(() => {
        const el = document.getElementById('player-select');
        if (!el) return false;
        return !el.classList.contains('hidden');
      });

      if (playerSelectVisible) {
        pass('Player login shows player-select');
      } else {
        fail('Player login shows player-select', 'player-select still hidden');
      }
    } else {
      fail('Player login shows player-select', 'btn-player-login not found');
    }

    // ============================================
    // Test 6: Campaign code input exists and is editable
    // ============================================
    const codeInput = await page.$('#campaign-code-input');
    if (codeInput) {
      await codeInput.type('TEST123');
      const value = await page.$eval('#campaign-code-input', el => el.value);
      if (value === 'TEST123') {
        pass('Campaign code input is editable');
      } else {
        fail('Campaign code input is editable', `value is "${value}"`);
      }
    } else {
      fail('Campaign code input is editable', 'campaign-code-input not found');
    }

    // ============================================
    // Test 7: Solo demo button exists and is clickable
    // ============================================
    console.log('\n--- Solo Demo ---');
    // Go back to login first
    const backBtn2 = await page.$('#btn-back-player');
    if (backBtn2) {
      await backBtn2.click();
      await delay(300);
    }

    const soloBtn = await page.$('#btn-solo-demo');
    if (soloBtn) {
      // Don't actually click (would need server), just verify it exists and is enabled
      const isEnabled = await page.$eval('#btn-solo-demo', el => !el.disabled);
      if (isEnabled) {
        pass('Solo demo button exists and is enabled');
      } else {
        fail('Solo demo button exists and is enabled', 'button is disabled');
      }
    } else {
      fail('Solo demo button exists and is enabled', 'btn-solo-demo not found');
    }

    // ============================================
    // Test 8: All screens exist in DOM
    // ============================================
    console.log('\n--- Screen Structure ---');
    const screens = ['login-screen', 'gm-setup-screen', 'player-setup-screen', 'bridge-screen'];
    for (const screenId of screens) {
      const screen = await page.$(`#${screenId}`);
      if (screen) {
        pass(`Screen exists: ${screenId}`);
      } else {
        fail(`Screen exists: ${screenId}`, 'not found');
      }
    }

    // ============================================
    // Test 9: Bridge screen has required panels
    // ============================================
    console.log('\n--- Bridge Structure ---');
    const bridgePanels = ['viewscreen', 'role-panel', 'ship-status', 'crew-list'];
    for (const panelId of bridgePanels) {
      const panel = await page.$(`#${panelId}`);
      if (panel) {
        pass(`Bridge panel exists: ${panelId}`);
      } else {
        fail(`Bridge panel exists: ${panelId}`, 'not found');
      }
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

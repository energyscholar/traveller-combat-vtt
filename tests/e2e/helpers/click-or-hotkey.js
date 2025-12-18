/**
 * Click-or-Hotkey Helper for E2E Tests
 *
 * Strategy: Try clicking first, fall back to hotkey if click fails.
 * Creates TODO notes for failed clicks to fix later.
 */

const fs = require('fs');
const path = require('path');

// Track click failures for TODO generation
const clickFailures = [];

/**
 * Try to click an element, fall back to hotkey if click fails
 * @param {Page} page - Puppeteer page
 * @param {Object} options
 * @param {string} options.selector - CSS selector to try
 * @param {string} options.text - Button text to search for
 * @param {string} options.hotkey - Hotkey fallback (e.g., 'p', 'Escape')
 * @param {string} options.name - Human-readable control name
 * @param {number} options.waitMs - Wait after action (default 1000)
 * @returns {Promise<'clicked'|'hotkey'|false>}
 */
async function clickOrHotkey(page, { selector, text, hotkey, name, waitMs = 1000 }) {
  // Try click first
  const clicked = await page.evaluate((sel, txt) => {
    // By selector
    let el = sel ? document.querySelector(sel) : null;

    // By button text (fallback)
    if (!el && txt) {
      el = Array.from(document.querySelectorAll('button, .menu-item, a'))
        .find(b => b.textContent?.includes(txt));
    }

    if (el && !el.disabled) {
      el.click();
      return 'clicked';
    }

    return null;
  }, selector, text);

  if (clicked) {
    console.log(`  ✓ Clicked: ${name}`);
    await sleep(waitMs);
    return 'clicked';
  }

  // Fallback to hotkey
  if (hotkey) {
    console.log(`  ⚠ Click failed for "${name}", using hotkey: ${hotkey}`);
    clickFailures.push({ name, selector, text, hotkey });
    await page.keyboard.press(hotkey);
    await sleep(waitMs);
    return 'hotkey';
  }

  console.log(`  ✗ FAILED: ${name} - no click, no hotkey`);
  clickFailures.push({ name, selector, text, hotkey: null });
  return false;
}

/**
 * Click by selector only (no fallback)
 */
async function clickSelector(page, selector, name, waitMs = 1000) {
  const clicked = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el && !el.disabled) {
      el.click();
      return true;
    }
    return false;
  }, selector);

  if (clicked) {
    console.log(`  ✓ Clicked: ${name}`);
    await sleep(waitMs);
    return true;
  }

  console.log(`  ✗ Selector not found: ${name} (${selector})`);
  return false;
}

/**
 * Click by button text
 */
async function clickButtonText(page, text, name, waitMs = 1000) {
  const clicked = await page.evaluate((txt) => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent?.includes(txt) && !b.disabled);
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }, text);

  if (clicked) {
    console.log(`  ✓ Clicked: ${name}`);
    await sleep(waitMs);
    return true;
  }

  console.log(`  ✗ Button text not found: ${name} ("${text}")`);
  return false;
}

/**
 * Right-click an element (for context menus)
 */
async function rightClick(page, selector, name, waitMs = 1500) {
  const result = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { found: false };

    const rect = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 2,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    }));
    return { found: true };
  }, selector);

  if (result.found) {
    console.log(`  ✓ Right-clicked: ${name}`);
    await sleep(waitMs);
    return true;
  }

  console.log(`  ✗ Element not found for right-click: ${name} (${selector})`);
  return false;
}

/**
 * Type into an input
 */
async function typeInput(page, selector, value, name, waitMs = 500) {
  const input = await page.$(selector);
  if (input) {
    await input.click({ clickCount: 3 }); // Select all
    await input.type(value);
    console.log(`  ✓ Typed: ${name} = "${value}"`);
    await sleep(waitMs);
    return true;
  }
  console.log(`  ✗ Input not found: ${name} (${selector})`);
  return false;
}

/**
 * Press a hotkey
 */
async function pressKey(page, key, name, waitMs = 1000) {
  await page.keyboard.press(key);
  console.log(`  ✓ Pressed: ${name} (${key})`);
  await sleep(waitMs);
  return true;
}

/**
 * Simple sleep function
 */
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Verify state by evaluating in page context
 */
async function verifyState(page, evalFn, description) {
  const result = await page.evaluate(evalFn);
  console.log(`  → ${description}:`, JSON.stringify(result));
  return result;
}

/**
 * Get all click failures (for TODO generation)
 */
function getClickFailures() {
  return [...clickFailures];
}

/**
 * Write TODO file for click failures
 */
function writeTodoForFailures(testName) {
  if (clickFailures.length === 0) return;

  const todoDir = path.join(__dirname, '../../../.claude/todos');
  const todoPath = path.join(todoDir, `TODO-click-failures-${testName}.md`);

  let content = `# TODO: Fix Click Failures - ${testName}

**Priority:** MEDIUM
**Category:** E2E Test / UI Selectors
**Found in:** RUN-USECASES-1

## Click Failures Found

`;

  for (const f of clickFailures) {
    content += `### ${f.name}
- Selector tried: \`${f.selector || 'none'}\`
- Text tried: "${f.text || 'none'}"
- Hotkey fallback: ${f.hotkey || 'NONE - TEST FAILED'}

`;
  }

  content += `## Investigation Checklist
- [ ] Check if selectors exist in DOM
- [ ] Check if elements are visible/enabled
- [ ] Check for timing issues
- [ ] Consider adding data-testid attributes
`;

  fs.writeFileSync(todoPath, content);
  console.log(`\n📝 TODO written: ${todoPath}`);
}

/**
 * Clear failures for fresh test
 */
function clearFailures() {
  clickFailures.length = 0;
}

module.exports = {
  clickOrHotkey,
  clickSelector,
  clickButtonText,
  rightClick,
  typeInput,
  pressKey,
  sleep,
  verifyState,
  getClickFailures,
  writeTodoForFailures,
  clearFailures
};

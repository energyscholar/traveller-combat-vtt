/**
 * Wait Helper Functions
 * Stage 13.1: Proper wait strategies (no arbitrary setTimeout)
 */

const { TIMEOUTS } = require('../setup');

/**
 * Wait for element to be visible
 * @param {Page} page
 * @param {string} selector
 * @param {number} timeout
 * @returns {Promise<ElementHandle>}
 */
async function waitForVisible(page, selector, timeout = TIMEOUTS.medium) {
  return await page.waitForSelector(selector, {
    visible: true,
    timeout
  });
}

/**
 * Wait for element to be hidden
 * @param {Page} page
 * @param {string} selector
 * @param {number} timeout
 * @returns {Promise<void>}
 */
async function waitForHidden(page, selector, timeout = TIMEOUTS.medium) {
  return await page.waitForSelector(selector, {
    hidden: true,
    timeout
  });
}

/**
 * Wait for function to return true
 * @param {Page} page
 * @param {Function} fn - Function to evaluate in page context
 * @param {number} timeout
 * @returns {Promise<void>}
 */
async function waitForCondition(page, fn, timeout = TIMEOUTS.medium) {
  return await page.waitForFunction(fn, { timeout });
}

/**
 * Wait for combat state to match expected value
 * @param {Page} page
 * @param {string} stateKey - Key in combatState object
 * @param {any} expectedValue - Expected value
 * @param {number} timeout
 * @returns {Promise<void>}
 */
async function waitForCombatState(page, stateKey, expectedValue, timeout = TIMEOUTS.medium) {
  return await page.waitForFunction(
    (key, expected) => {
      return window.combatState && window.combatState[key] === expected;
    },
    { timeout },
    stateKey,
    expectedValue
  );
}

/**
 * Wait for element to contain text
 * @param {Page} page
 * @param {string} selector
 * @param {string} text
 * @param {number} timeout
 * @returns {Promise<void>}
 */
async function waitForText(page, selector, text, timeout = TIMEOUTS.medium) {
  return await page.waitForFunction(
    (sel, txt) => {
      const element = document.querySelector(sel);
      return element && element.textContent.includes(txt);
    },
    { timeout },
    selector,
    text
  );
}

/**
 * Wait for network to be idle
 * @param {Page} page
 * @param {number} timeout
 * @returns {Promise<void>}
 */
async function waitForNetworkIdle(page, timeout = TIMEOUTS.medium) {
  return await page.waitForNetworkIdle({ timeout });
}

/**
 * Smart wait: Wait for element and verify it's actually interactive
 * @param {Page} page
 * @param {string} selector
 * @param {number} timeout
 * @returns {Promise<ElementHandle>}
 */
async function waitForInteractive(page, selector, timeout = TIMEOUTS.medium) {
  const element = await waitForVisible(page, selector, timeout);

  // Wait a bit for any animations to complete
  await new Promise(resolve => setTimeout(resolve, 100));

  // Verify element is not disabled
  const isDisabled = await page.evaluate(sel => {
    const el = document.querySelector(sel);
    return el && (el.disabled || el.hasAttribute('disabled'));
  }, selector);

  if (isDisabled) {
    throw new Error(`Element ${selector} is disabled`);
  }

  return element;
}

module.exports = {
  waitForVisible,
  waitForHidden,
  waitForCondition,
  waitForCombatState,
  waitForText,
  waitForNetworkIdle,
  waitForInteractive
};

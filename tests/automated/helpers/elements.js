/**
 * Element Interaction Helpers
 * Stage 13.1: Safe element interaction functions
 */

const { waitForInteractive, waitForVisible } = require('./wait');
const { screenshotOnFailure } = require('./screenshots');

/**
 * Click element safely
 * @param {Page} page
 * @param {string} selector
 * @param {string} testName - For screenshot on failure
 * @returns {Promise<void>}
 */
async function clickElement(page, selector, testName = 'click') {
  try {
    await waitForInteractive(page, selector);
    await page.click(selector);
    // Small delay for any immediate UI updates
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (err) {
    await screenshotOnFailure(page, `${testName}-click-failed`);
    throw new Error(`Failed to click ${selector}: ${err.message}`);
  }
}

/**
 * Type text into input
 * @param {Page} page
 * @param {string} selector
 * @param {string} text
 * @param {string} testName
 * @returns {Promise<void>}
 */
async function typeText(page, selector, text, testName = 'type') {
  try {
    await waitForInteractive(page, selector);
    await page.type(selector, text);
  } catch (err) {
    await screenshotOnFailure(page, `${testName}-type-failed`);
    throw new Error(`Failed to type into ${selector}: ${err.message}`);
  }
}

/**
 * Select option from dropdown
 * @param {Page} page
 * @param {string} selector
 * @param {string} value
 * @param {string} testName
 * @returns {Promise<void>}
 */
async function selectOption(page, selector, value, testName = 'select') {
  try {
    await waitForInteractive(page, selector);
    await page.select(selector, value);
  } catch (err) {
    await screenshotOnFailure(page, `${testName}-select-failed`);
    throw new Error(`Failed to select ${value} in ${selector}: ${err.message}`);
  }
}

/**
 * Get text content of element
 * @param {Page} page
 * @param {string} selector
 * @returns {Promise<string>}
 */
async function getText(page, selector) {
  await waitForVisible(page, selector);
  return await page.$eval(selector, el => el.textContent);
}

/**
 * Get attribute value
 * @param {Page} page
 * @param {string} selector
 * @param {string} attribute
 * @returns {Promise<string>}
 */
async function getAttribute(page, selector, attribute) {
  await waitForVisible(page, selector);
  return await page.$eval(selector, (el, attr) => el.getAttribute(attr), attribute);
}

/**
 * Check if element exists (doesn't wait)
 * @param {Page} page
 * @param {string} selector
 * @returns {Promise<boolean>}
 */
async function elementExists(page, selector) {
  const element = await page.$(selector);
  return element !== null;
}

/**
 * Check if element is visible
 * @param {Page} page
 * @param {string} selector
 * @returns {Promise<boolean>}
 */
async function isVisible(page, selector) {
  return await page.evaluate(sel => {
    const element = document.querySelector(sel);
    if (!element) return false;

    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }, selector);
}

/**
 * Get element's computed style property
 * @param {Page} page
 * @param {string} selector
 * @param {string} property
 * @returns {Promise<string>}
 */
async function getComputedStyle(page, selector, property) {
  return await page.evaluate((sel, prop) => {
    const element = document.querySelector(sel);
    if (!element) return null;
    return window.getComputedStyle(element)[prop];
  }, selector, property);
}

module.exports = {
  clickElement,
  typeText,
  selectOption,
  getText,
  getAttribute,
  elementExists,
  isVisible,
  getComputedStyle
};

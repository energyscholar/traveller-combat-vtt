/**
 * DOM Helper Utilities
 * Common DOM manipulation functions to reduce code duplication
 */

/**
 * Removes 'hidden' class from an element
 * @param {string} id - Element ID
 */
export function show(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('hidden');
  }
}

/**
 * Adds 'hidden' class to an element
 * @param {string} id - Element ID
 */
export function hide(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('hidden');
  }
}

/**
 * Toggles visibility based on boolean value
 * @param {string} id - Element ID
 * @param {boolean} visible - Whether element should be visible
 */
export function toggle(id, visible) {
  if (visible) {
    show(id);
  } else {
    hide(id);
  }
}

/**
 * Sets text content of an element safely
 * @param {string} id - Element ID
 * @param {string} text - Text to set
 */
export function setText(id, text) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
  }
}

/**
 * Gets value from an input element
 * @param {string} id - Element ID
 * @returns {string} - The input value or empty string if not found
 */
export function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

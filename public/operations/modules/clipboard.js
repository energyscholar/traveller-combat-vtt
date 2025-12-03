/**
 * Clipboard Utilities
 * Helper functions for clipboard operations with user feedback
 */

/**
 * Copies text to clipboard with visual feedback on a button
 * @param {string} text - Text to copy to clipboard
 * @param {string} buttonId - ID of button to show feedback on
 * @param {string} successText - Text to show on success (default: 'Copied!')
 * @param {number} duration - Duration to show feedback in ms (default: 2000)
 */
export async function copyWithFeedback(text, buttonId, successText = 'Copied!', duration = 2000) {
  try {
    await navigator.clipboard.writeText(text);

    const btn = document.getElementById(buttonId);
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = successText;
      btn.classList.add('btn-copy-success');

      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('btn-copy-success');
      }, duration);
    }
  } catch (error) {
    // Show error notification - assumes showNotification exists globally
    if (typeof showNotification === 'function') {
      showNotification('Failed to copy to clipboard', 'error');
    } else {
      console.error('Failed to copy to clipboard:', error);
    }
  }
}

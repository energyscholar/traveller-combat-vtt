/**
 * GUI Adapter - Consumes ViewModels and renders via pure renderers
 *
 * Handles DOM updates without polluting renderers with DOM manipulation.
 * Uses event delegation for action binding.
 *
 * @module public/operations-v2/adapters/gui-adapter
 */

/* global renderers */

/**
 * GUIAdapter class for rendering role panels to DOM
 */
class GUIAdapter {
  /**
   * Create GUI adapter
   * @param {object} options
   * @param {HTMLElement} options.container - Root container element
   * @param {function} options.onAction - Action handler callback
   */
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.onAction = options.onAction || (() => {});
    this.roleContainers = {};
    this._boundActionHandler = this._handleAction.bind(this);

    // Set up event delegation
    this.container.addEventListener('click', this._boundActionHandler);
  }

  /**
   * Handle action button clicks via event delegation
   * @param {Event} event - Click event
   */
  _handleAction(event) {
    const target = event.target.closest('[data-action]');
    if (!target || target.disabled) return;

    const action = target.dataset.action;
    const data = { ...target.dataset };
    delete data.action;

    this.onAction(action, data, event);
  }

  /**
   * Set the action handler
   * @param {function} handler - Action handler callback(action, data, event)
   */
  setActionHandler(handler) {
    this.onAction = handler;
  }

  /**
   * Render a ViewModel to a specific container
   * @param {object} vm - Role ViewModel
   * @param {HTMLElement|string} container - Container element or selector
   */
  render(vm, container) {
    const el = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!el) {
      console.warn(`GUIAdapter: Container not found for ${vm.type}`);
      return;
    }

    const html = window.renderers ? window.renderers.renderRole(vm) : '';
    el.innerHTML = html;
  }

  /**
   * Register a container for a role
   * @param {string} role - Role type
   * @param {HTMLElement|string} container - Container element or selector
   */
  registerRole(role, container) {
    const el = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    this.roleContainers[role] = el;
  }

  /**
   * Update a role's panel with new ViewModel
   * @param {object} vm - Role ViewModel
   */
  update(vm) {
    const container = this.roleContainers[vm.type];
    if (container) {
      this.render(vm, container);
    }
  }

  /**
   * Update multiple role panels
   * @param {object[]} vms - Array of ViewModels
   */
  updateAll(vms) {
    for (const vm of vms) {
      this.update(vm);
    }
  }

  /**
   * Show a screen by ID
   * @param {string} screenId - Screen element ID
   */
  showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // Show target screen
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.add('active');
    }
  }

  /**
   * Render a list of items to a container
   * @param {string} containerId - Container element ID
   * @param {object[]} items - Array of items
   * @param {function} renderer - Render function for each item
   */
  renderList(containerId, items, renderer) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = '<div class="empty-list">No items</div>';
      return;
    }

    container.innerHTML = items.map(renderer).join('');
  }

  /**
   * Set text content of an element
   * @param {string} elementId - Element ID
   * @param {string} text - Text content
   */
  setText(elementId, text) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = text;
    }
  }

  /**
   * Set HTML content of an element
   * @param {string} elementId - Element ID
   * @param {string} html - HTML content
   */
  setHtml(elementId, html) {
    const el = document.getElementById(elementId);
    if (el) {
      el.innerHTML = html;
    }
  }

  /**
   * Toggle visibility of an element
   * @param {string} elementId - Element ID
   * @param {boolean} visible - Whether to show
   */
  setVisible(elementId, visible) {
    const el = document.getElementById(elementId);
    if (el) {
      el.classList.toggle('hidden', !visible);
    }
  }

  /**
   * Destroy the adapter (cleanup)
   */
  destroy() {
    this.container.removeEventListener('click', this._boundActionHandler);
    this.roleContainers = {};
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.GUIAdapter = GUIAdapter;
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GUIAdapter };
}

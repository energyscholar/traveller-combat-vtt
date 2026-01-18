/**
 * Base ViewModel Factory
 *
 * Creates standardized ViewModel objects that wrap role state.
 * ViewModels provide:
 * - type: Role identifier
 * - version: Schema version for compatibility
 * - timestamp: When the ViewModel was created
 * - data: Raw state from role state module
 * - derived: Display-ready computed values
 * - actions: Action availability with enabled/reason
 *
 * @module lib/viewmodels/base-viewmodel
 */

const VIEWMODEL_VERSION = 1;

/**
 * Create a standardized ViewModel object
 * @param {string} type - Role identifier (e.g., 'gunner', 'pilot')
 * @param {object} data - Raw state data from role-state module
 * @param {object} derived - Display-ready computed values
 * @param {object} actions - Action state { actionName: { enabled, reason } }
 * @returns {object} ViewModel object
 */
function createViewModel(type, data, derived, actions) {
  return {
    type,
    version: VIEWMODEL_VERSION,
    timestamp: Date.now(),
    data,
    derived,
    actions
  };
}

/**
 * Create an action state object
 * @param {boolean} enabled - Whether action can be executed
 * @param {string|null} reason - Reason if disabled, null if enabled
 * @returns {object} Action state { enabled, reason }
 */
function createAction(enabled, reason = null) {
  return {
    enabled,
    reason: enabled ? null : reason
  };
}

/**
 * Validate a ViewModel has required structure
 * @param {object} vm - ViewModel to validate
 * @returns {boolean} True if valid
 */
function isValidViewModel(vm) {
  return !!(vm &&
    typeof vm.type === 'string' &&
    typeof vm.version === 'number' &&
    typeof vm.timestamp === 'number' &&
    vm.data !== undefined &&
    vm.derived !== undefined &&
    vm.actions !== undefined);
}

module.exports = {
  createViewModel,
  createAction,
  isValidViewModel,
  VIEWMODEL_VERSION
};

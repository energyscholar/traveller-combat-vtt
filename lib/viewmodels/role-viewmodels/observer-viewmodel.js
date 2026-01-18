/**
 * Observer ViewModel
 * Wraps observer-state.js to provide display-ready data.
 * @module lib/viewmodels/role-viewmodels/observer-viewmodel
 */

const { createViewModel, createAction } = require('../base-viewmodel');
const { getObserverState } = require('../../engine/roles/observer-state');

function createObserverViewModel(watchRole = 'pilot', context = {}) {
  const state = getObserverState(watchRole, context);

  const derived = {
    statusBadge: 'OBSERVING',
    statusClass: 'observer-active',

    watchingText: state.watchRole ? state.watchRole.charAt(0).toUpperCase() + state.watchRole.slice(1) : 'None',
    watchRoleFormatted: state.watchRole
      ? state.watchRole.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'None',

    lastUpdateText: state.lastUpdate
      ? new Date(state.lastUpdate).toLocaleTimeString()
      : 'Never'
  };

  const actions = {
    switchRole: createAction(true, null),
    requestControl: createAction(false, 'Observer cannot take control')
  };

  return createViewModel('observer', state, derived, actions);
}

module.exports = { createObserverViewModel };

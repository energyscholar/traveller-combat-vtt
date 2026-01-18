/**
 * Sensors ViewModel
 * Wraps sensors-state.js to provide display-ready data.
 * @module lib/viewmodels/role-viewmodels/sensors-viewmodel
 */

const { createViewModel, createAction } = require('../base-viewmodel');
const { getSensorsState } = require('../../engine/roles/sensors-state');

function createSensorsViewModel(shipState, contacts, environmentalData = null, panelMode = 'expanded') {
  const state = getSensorsState(shipState, contacts, environmentalData, panelMode);

  const derived = {
    statusBadge: state.summary.statusText,
    statusClass: state.summary.statusIcon === 'red' ? 'threat-detected' :
                 state.summary.statusIcon === 'yellow' ? 'unknown-contacts' : 'all-clear',

    contactCountText: `${state.summary.totalNonCelestial} contact${state.summary.totalNonCelestial !== 1 ? 's' : ''}`,
    threatCountText: state.threats.hasThreats ? `${state.threats.hostileCount} hostile` : 'None',

    lockStatusText: state.lock.hasLock ? `Locked: ${state.lock.target}` : 'No lock',

    shipsText: `${state.contacts.counts.ships} ship${state.contacts.counts.ships !== 1 ? 's' : ''}`,
    stationsText: `${state.contacts.counts.stations} station${state.contacts.counts.stations !== 1 ? 's' : ''}`
  };

  const hasContacts = state.contacts.counts.total > 0;
  const actions = {
    scan: createAction(hasContacts, hasContacts ? null : 'No contacts to scan'),
    lock: createAction(hasContacts && !state.lock.hasLock,
      !hasContacts ? 'No contacts' : state.lock.hasLock ? 'Already locked' : null),
    unlock: createAction(state.lock.hasLock, state.lock.hasLock ? null : 'No lock active'),
    toggleEW: createAction(true, null)
  };

  return createViewModel('sensors', state, derived, actions);
}

module.exports = { createSensorsViewModel };

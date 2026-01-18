/**
 * Captain ViewModel
 * Wraps captain-state.js to provide display-ready data.
 * @module lib/viewmodels/role-viewmodels/captain-viewmodel
 */

const { createViewModel, createAction } = require('../base-viewmodel');
const { getCaptainState } = require('../../engine/roles/captain-state');

function createCaptainViewModel(shipState, template, ship, crewOnline, contacts, rescueTargets = [], activePanel = 'captain') {
  const state = getCaptainState(shipState, template, ship, crewOnline, contacts, rescueTargets, activePanel);

  const alertLevel = state.alert?.level || 'green';

  const derived = {
    statusBadge: alertLevel === 'red' ? 'RED ALERT' :
                 alertLevel === 'yellow' ? 'YELLOW ALERT' : 'NORMAL',
    statusClass: `alert-${alertLevel}`,

    crewCountText: `${state.crew?.online || 0}/${state.crew?.total || 0} crew`,
    alertText: state.alert?.text || 'Normal operations',

    shipNameText: state.ship?.name || 'Unknown',
    shipClassText: state.ship?.class || 'Unknown class',

    contactSummaryText: state.tactical?.contactCount
      ? `${state.tactical.contactCount} contacts`
      : 'No contacts',
    hostileSummaryText: state.tactical?.hostileCount
      ? `${state.tactical.hostileCount} hostile`
      : 'None hostile'
  };

  const actions = {
    setAlert: createAction(true, null),
    issueOrder: createAction(true, null),
    relieveCrew: createAction((state.crew?.online || 0) > 0,
      (state.crew?.online || 0) > 0 ? null : 'No crew to relieve'),
    initiateRescue: createAction(rescueTargets.length > 0,
      rescueTargets.length > 0 ? null : 'No rescue targets')
  };

  return createViewModel('captain', state, derived, actions);
}

module.exports = { createCaptainViewModel };

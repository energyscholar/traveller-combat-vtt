/**
 * Pilot ViewModel
 * Wraps pilot-state.js to provide display-ready data.
 * @module lib/viewmodels/role-viewmodels/pilot-viewmodel
 */

const { createViewModel, createAction } = require('../base-viewmodel');
const { getPilotState, canNavigate, getFlightConditionSeverity } = require('../../engine/roles/pilot-state');

function createPilotViewModel(shipState, template, campaign, jumpStatus = {}, flightConditions = null, pendingTravel = null) {
  const state = getPilotState(shipState, template, campaign, jumpStatus, flightConditions, pendingTravel);

  const severity = getFlightConditionSeverity(state.flightConditions);

  const derived = {
    statusBadge: state.jump.inJump ? 'IN JUMP' :
                 state.docking.docked ? 'DOCKED' : 'FLIGHT',
    statusClass: state.jump.inJump ? 'in-jump' :
                 state.docking.docked ? 'docked' : 'flight',

    locationText: state.navigation.location,
    destinationText: state.navigation.destination || 'None',
    thrustText: `${state.drive.currentThrust}G / ${state.drive.maxThrust}G`,
    headingText: state.navigation.heading,

    flightSeverity: severity,
    flightSeverityClass: severity === 'danger' ? 'severity-danger' :
                         severity === 'warning' ? 'severity-warning' : 'severity-normal',

    jumpTimeText: state.jump.hoursRemaining !== undefined
      ? `${Math.floor(state.jump.hoursRemaining / 24)}d ${state.jump.hoursRemaining % 24}h`
      : '--'
  };

  const canNav = canNavigate(state);
  const actions = {
    setDestination: createAction(canNav, canNav ? null : 'Cannot navigate'),
    setThrust: createAction(!state.jump.inJump && !state.drive.mDriveDamaged,
      state.jump.inJump ? 'In jump' : state.drive.mDriveDamaged ? 'M-Drive damaged' : null),
    evasiveManeuvers: createAction(state.maneuvers.canManeuver,
      state.maneuvers.canManeuver ? null : 'No contacts to evade'),
    exitJump: createAction(state.jump.canExit, state.jump.canExit ? null : 'Cannot exit jump yet')
  };

  return createViewModel('pilot', state, derived, actions);
}

module.exports = { createPilotViewModel };

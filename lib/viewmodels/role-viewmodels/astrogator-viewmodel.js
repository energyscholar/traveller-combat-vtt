/**
 * Astrogator ViewModel
 * Wraps astrogator-state.js to provide display-ready data.
 * @module lib/viewmodels/role-viewmodels/astrogator-viewmodel
 */

const { createViewModel, createAction } = require('../base-viewmodel');
const { getAstrogatorState } = require('../../engine/roles/astrogator-state');

function createAstrogatorViewModel(shipState, template, jumpStatus, campaign, systemStatus) {
  const state = getAstrogatorState(shipState, template, jumpStatus, campaign, systemStatus);

  const derived = {
    statusBadge: state.jump.inJump ? 'IN JUMP' :
                 state.jump.plotted ? 'JUMP READY' : 'STANDBY',
    statusClass: state.jump.inJump ? 'in-jump' :
                 state.jump.plotted ? 'jump-ready' : 'standby',

    jumpRatingText: `J-${state.jump.rating}`,
    jumpRangeText: `${state.jump.rating} parsec${state.jump.rating !== 1 ? 's' : ''}`,

    currentSystemText: state.navigation.currentSystem || 'Unknown',
    destinationText: state.jump.destination || 'None plotted',

    fuelRequiredText: state.jump.fuelRequired
      ? `${state.jump.fuelRequired} tons`
      : '--',
    fuelAvailableText: `${state.jump.fuelAvailable} tons`,

    canJumpText: state.jump.canJump ? 'Ready' : state.jump.cannotJumpReason || 'Not ready'
  };

  const actions = {
    plotJump: createAction(!state.jump.inJump && !state.jump.jDriveDisabled,
      state.jump.inJump ? 'Already in jump' :
      state.jump.jDriveDisabled ? 'J-Drive disabled' : null),
    initiateJump: createAction(state.jump.canJump,
      state.jump.canJump ? null : state.jump.cannotJumpReason || 'Cannot jump'),
    cancelJump: createAction(state.jump.plotted && !state.jump.inJump,
      !state.jump.plotted ? 'No jump plotted' :
      state.jump.inJump ? 'Already in jump' : null),
    viewChart: createAction(true, null)
  };

  return createViewModel('astrogator', state, derived, actions);
}

module.exports = { createAstrogatorViewModel };

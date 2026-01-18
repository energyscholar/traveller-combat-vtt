/**
 * Engineer ViewModel
 * Wraps engineer-state.js to provide display-ready data.
 * @module lib/viewmodels/role-viewmodels/engineer-viewmodel
 */

const { createViewModel, createAction } = require('../base-viewmodel');
const { getEngineerState } = require('../../engine/roles/engineer-state');

function createEngineerViewModel(shipState, template, systemStatus, damagedSystems, fuelStatus, repairQueue = []) {
  const state = getEngineerState(shipState, template, systemStatus, damagedSystems, fuelStatus, repairQueue);

  const damagedCount = state.systems?.damaged?.length || 0;
  const repairQueueCount = state.repairs?.queue?.length || 0;

  const derived = {
    statusBadge: state.fuel?.criticalFuel ? 'FUEL CRITICAL' :
                 state.fuel?.lowFuel ? 'FUEL LOW' :
                 state.power?.overloaded ? 'OVERLOAD' : 'NOMINAL',
    statusClass: state.fuel?.criticalFuel ? 'fuel-critical' :
                 state.fuel?.lowFuel ? 'fuel-low' :
                 state.power?.overloaded ? 'power-overload' : 'nominal',

    fuelText: `${state.fuel?.total || 0}/${state.fuel?.max || 0} tons`,
    fuelPercentText: `${state.fuel?.percentFull || 0}%`,
    powerPercentText: `${state.power?.percentUsed || 0}%`,

    damagedCountText: `${damagedCount} damaged`,
    repairQueueText: repairQueueCount > 0
      ? `${repairQueueCount} in queue`
      : 'No repairs',

    canJumpText: state.fuel?.canJump ? 'Yes' : 'Insufficient fuel'
  };

  const hasDamaged = damagedCount > 0;
  const hasFuelProcessor = state.fuel?.hasFuelProcessor || false;
  const unrefinedFuel = state.fuel?.breakdown?.unrefined || 0;
  const overloaded = state.power?.overloaded || false;

  const actions = {
    adjustPower: createAction(true, null),
    repair: createAction(hasDamaged, hasDamaged ? null : 'No damaged systems'),
    processFuel: createAction(hasFuelProcessor && unrefinedFuel > 0,
      !hasFuelProcessor ? 'No fuel processor' :
      unrefinedFuel === 0 ? 'No unrefined fuel' : null),
    emergencyPower: createAction(!overloaded,
      overloaded ? 'Already overloaded' : null)
  };

  return createViewModel('engineer', state, derived, actions);
}

module.exports = { createEngineerViewModel };

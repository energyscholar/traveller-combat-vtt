/**
 * Gunner ViewModel
 *
 * Wraps gunner-state.js to provide display-ready data.
 * Does NOT duplicate logic - delegates to state module.
 *
 * @module lib/viewmodels/role-viewmodels/gunner-viewmodel
 */

const { createViewModel, createAction } = require('../base-viewmodel');
const { getGunnerState, canEngageTarget } = require('../../engine/roles/gunner-state');

/**
 * Status badge text based on authorization
 */
const STATUS_BADGES = {
  free: 'WEAPONS FREE',
  defensive: 'DEFENSIVE',
  hold: 'WEAPONS HOLD'
};

/**
 * Status CSS class based on authorization
 */
const STATUS_CLASSES = {
  free: 'weapons-free',
  defensive: 'weapons-defensive',
  hold: 'weapons-hold'
};

/**
 * Create Gunner ViewModel
 * @param {object} shipState - Current ship state
 * @param {object} template - Ship template data
 * @param {array} contacts - Sensor contacts
 * @param {number} roleInstance - Turret assignment (1-based)
 * @param {array} shipWeapons - Ship weapons array
 * @returns {object} ViewModel
 */
function createGunnerViewModel(shipState, template, contacts, roleInstance = 1, shipWeapons = []) {
  // Get state from state module (no duplication)
  const state = getGunnerState(shipState, template, contacts, roleInstance, shipWeapons);

  // Derive display values from state
  const authMode = state.authorization.mode;
  const roe = state.authorization.roe;

  // Use ROE if mode is hold
  const effectiveMode = authMode === 'hold' ? roe : authMode;

  const derived = {
    statusBadge: STATUS_BADGES[effectiveMode] || 'WEAPONS HOLD',
    statusClass: STATUS_CLASSES[effectiveMode] || 'weapons-hold',

    // Formatted hit chance
    hitChanceText: state.targeting.hitChance !== null
      ? `${state.targeting.hitChance}%`
      : '--',

    // Weapon count summary
    weaponCountText: `${state.weapons.list.length} weapon${state.weapons.list.length !== 1 ? 's' : ''}`,

    // Target count summary
    targetCountText: `${state.targeting.contacts.length} target${state.targeting.contacts.length !== 1 ? 's' : ''}`,

    // Turret assignment text
    turretText: state.assignment.turret
      ? `Turret ${state.assignment.turret}`
      : 'Unassigned',

    // Range DM formatted
    rangeDMText: state.targeting.rangeDM !== null
      ? (state.targeting.rangeDM >= 0 ? `+${state.targeting.rangeDM}` : `${state.targeting.rangeDM}`)
      : '--'
  };

  // Action availability (delegates to state module)
  const engageResult = canEngageTarget(state);
  const actions = {
    fire: createAction(engageResult.canEngage, engageResult.reason),

    selectTarget: createAction(
      state.targeting.hasTargets,
      state.targeting.hasTargets ? null : 'No targets in range'
    ),

    selectWeapon: createAction(
      state.weapons.list.length > 1,
      state.weapons.list.length > 1 ? null : 'Only one weapon available'
    )
  };

  return createViewModel('gunner', state, derived, actions);
}

module.exports = {
  createGunnerViewModel
};

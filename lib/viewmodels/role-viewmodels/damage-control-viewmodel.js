/**
 * Damage Control ViewModel
 * Provides display-ready data for damage control role.
 * Note: No dedicated state module - derives from ship state.
 * @module lib/viewmodels/role-viewmodels/damage-control-viewmodel
 */

const { createViewModel, createAction } = require('../base-viewmodel');

/**
 * Get damage control state from ship state
 * @param {object} shipState - Ship state
 * @param {object} template - Ship template
 * @param {array} damagedSystems - List of damaged systems
 * @param {array} activeFires - List of active fires
 * @param {array} breaches - List of hull breaches
 * @returns {object} State object
 */
function getDamageControlState(shipState, template, damagedSystems = [], activeFires = [], breaches = []) {
  const hull = shipState?.hull || {};
  const maxHull = template?.hull || 100;
  const currentHull = hull.current ?? maxHull;
  const hullPercent = Math.round((currentHull / maxHull) * 100);

  return {
    hull: {
      current: currentHull,
      max: maxHull,
      percent: hullPercent,
      damaged: currentHull < maxHull,
      critical: hullPercent < 25
    },
    systems: {
      damaged: damagedSystems,
      count: damagedSystems.length
    },
    fires: {
      active: activeFires,
      count: activeFires.length,
      hasActive: activeFires.length > 0
    },
    breaches: {
      active: breaches,
      count: breaches.length,
      hasActive: breaches.length > 0
    },
    emergencyStatus: activeFires.length > 0 || breaches.length > 0 ? 'emergency' : 'normal'
  };
}

function createDamageControlViewModel(shipState, template, damagedSystems = [], activeFires = [], breaches = []) {
  const state = getDamageControlState(shipState, template, damagedSystems, activeFires, breaches);

  const derived = {
    statusBadge: state.emergencyStatus === 'emergency' ? 'EMERGENCY' :
                 state.hull.critical ? 'HULL CRITICAL' :
                 state.systems.count > 0 ? 'DAMAGE' : 'ALL CLEAR',
    statusClass: state.emergencyStatus === 'emergency' ? 'emergency' :
                 state.hull.critical ? 'hull-critical' :
                 state.systems.count > 0 ? 'damage-present' : 'all-clear',

    hullText: `${state.hull.current}/${state.hull.max} HP`,
    hullPercentText: `${state.hull.percent}%`,

    damageCountText: `${state.systems.count} system${state.systems.count !== 1 ? 's' : ''} damaged`,
    fireCountText: state.fires.count > 0 ? `${state.fires.count} fire${state.fires.count !== 1 ? 's' : ''}` : 'No fires',
    breachCountText: state.breaches.count > 0 ? `${state.breaches.count} breach${state.breaches.count !== 1 ? 'es' : ''}` : 'No breaches'
  };

  const actions = {
    repairHull: createAction(state.hull.damaged, state.hull.damaged ? null : 'Hull at maximum'),
    repairSystem: createAction(state.systems.count > 0, state.systems.count > 0 ? null : 'No damaged systems'),
    firefighting: createAction(state.fires.hasActive, state.fires.hasActive ? null : 'No active fires'),
    sealBreach: createAction(state.breaches.hasActive, state.breaches.hasActive ? null : 'No active breaches')
  };

  return createViewModel('damage-control', state, derived, actions);
}

module.exports = { createDamageControlViewModel, getDamageControlState };

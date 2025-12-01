/**
 * AI Decision Logic
 * Decision-making for AI opponent actions
 *
 * Delegates to AIContext for strategy-based decisions.
 * Legacy functions maintained for backward compatibility.
 *
 * @see lib/combat/ai/strategies/ for Strategy Pattern implementation
 */

const { combat: combatLog } = require('../../logger');
const { SHIPS } = require('../../combat');
const { AIContext, RANGE_BANDS } = require('./strategies');

// Default AI context using balanced strategy
let defaultAIContext = new AIContext('balanced');

/**
 * Get incoming missiles targeting the AI player
 * @param {Object} combat - Combat state
 * @param {string} aiPlayerId - AI player ID
 * @returns {Array} Incoming missiles
 */
function getIncomingMissiles(combat, aiPlayerId) {
  return combat.missileTracker ?
    combat.missileTracker.getMissilesTargeting(aiPlayerId) : [];
}

/**
 * Find available weapons for AI
 * @param {Object} shipData - Ship definition
 * @param {Object} aiData - AI player state
 * @returns {Object} { missileWeapon, laserWeapon }
 */
function findAvailableWeapons(shipData, aiData) {
  let missileWeapon = null;
  let laserWeapon = null;

  if (!shipData || !shipData.weapons) {
    return { missileWeapon, laserWeapon };
  }

  for (let w = 0; w < shipData.weapons.length; w++) {
    const weapon = shipData.weapons[w];
    if (weapon.id === 'missiles' && aiData.ammo && aiData.ammo.missiles > 0) {
      missileWeapon = { turret: 0, weapon: w };
      combatLog.info(`[AI] Found missile weapon at index ${w}`);
    } else if (weapon.id && weapon.id.includes('Laser')) {
      laserWeapon = { turret: 0, weapon: w };
      combatLog.info(`[AI] Found laser weapon at index ${w}: ${weapon.name}`);
    }
  }

  return { missileWeapon, laserWeapon };
}

/**
 * Choose weapon based on range
 * @param {string} range - Current combat range
 * @param {Object} missileWeapon - Missile weapon data
 * @param {Object} laserWeapon - Laser weapon data
 * @param {Object} aiData - AI player state
 * @returns {Object|null} Chosen weapon or null
 */
function chooseWeaponForRange(range, missileWeapon, laserWeapon, aiData) {
  const rangeIndex = RANGE_BANDS.indexOf(range);
  const isLongRange = rangeIndex >= 4;  // Long or further

  if (isLongRange && missileWeapon && aiData.ammo && aiData.ammo.missiles > 0) {
    combatLog.info(`[AI] Attacking at long range with missile`);
    return missileWeapon;
  } else if (laserWeapon) {
    combatLog.info(`[AI] Attacking with laser`);
    return laserWeapon;
  }

  return null;
}

/**
 * Make AI decision for current turn using Strategy Pattern
 * @param {Object} combat - Combat state
 * @param {Object} aiPlayer - AI player reference
 * @param {string} [strategyName] - Optional strategy override
 * @returns {Object} { action: string, params: Object }
 */
function makeAIDecision(combat, aiPlayer, strategyName = null) {
  // Allow strategy override per call
  if (strategyName && strategyName !== defaultAIContext.getStrategyName()) {
    defaultAIContext.setStrategy(strategyName);
  }

  return defaultAIContext.makeDecision(combat, aiPlayer);
}

/**
 * Set the default AI strategy
 * @param {string} strategyName - Strategy name (balanced, aggressive, defensive, cautious)
 */
function setAIStrategy(strategyName) {
  defaultAIContext.setStrategy(strategyName);
}

/**
 * Get available AI strategies
 * @returns {string[]} Strategy names
 */
function getAvailableStrategies() {
  return AIContext.getAvailableStrategies();
}

/**
 * Create a new AI context with specific strategy
 * @param {string} [strategyName='balanced'] - Strategy name
 * @returns {AIContext} New AI context
 */
function createAIContext(strategyName = 'balanced') {
  return new AIContext(strategyName);
}

module.exports = {
  // Strategy Pattern exports
  AIContext,
  createAIContext,
  setAIStrategy,
  getAvailableStrategies,

  // Legacy exports (backward compatible)
  RANGE_BANDS,
  getIncomingMissiles,
  findAvailableWeapons,
  chooseWeaponForRange,
  makeAIDecision
};

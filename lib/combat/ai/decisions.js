/**
 * AI Decision Logic
 * Decision-making for AI opponent actions
 */

const { combat: combatLog } = require('../../logger');
const { SHIPS } = require('../../combat');

// Range bands for weapon selection
const RANGE_BANDS = ['Adjacent', 'Close', 'Short', 'Medium', 'Long', 'Very Long', 'Distant'];

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
 * Make AI decision for current turn
 * @param {Object} combat - Combat state
 * @param {Object} aiPlayer - AI player reference
 * @returns {Object} { action: string, params: Object }
 */
function makeAIDecision(combat, aiPlayer) {
  const aiData = aiPlayer === combat.player1 ? combat.player1 : combat.player2;
  const currentRange = combat.range;

  // Check for incoming missiles
  const incomingMissiles = getIncomingMissiles(combat, aiData.id);

  // Random number for decision weights
  const roll = Math.random() * 100;

  // HIGH PRIORITY: Point defense if missiles incoming (50% chance)
  if (incomingMissiles.length > 0 && roll < 50) {
    combatLog.info(`[AI] Incoming missiles detected, attempting point defense`);
    return {
      action: 'pointDefense',
      params: {
        targetMissileId: incomingMissiles[0].id
      }
    };
  }

  // MEDIUM PRIORITY: Use sandcaster if available and recently hit (30% chance if damaged)
  const healthPercent = (aiData.hull / aiData.maxHull) * 100;
  if (aiData.ammo && aiData.ammo.sandcaster > 0 && healthPercent < 90 && roll < 30) {
    combatLog.info(`[AI] Using sandcaster (hull at ${healthPercent.toFixed(0)}%)`);
    return {
      action: 'sandcaster',
      params: {}
    };
  }

  // MEDIUM PRIORITY: Dodge maneuver (10% chance)
  if (roll < 40) {  // 40-30 = 10% since sandcaster used 30%
    combatLog.info(`[AI] Performing dodge maneuver`);
    return {
      action: 'dodge',
      params: {}
    };
  }

  // DEFAULT: Attack with appropriate weapon based on range
  const shipData = SHIPS[aiData.ship];
  if (!shipData || !shipData.weapons) {
    combatLog.info(`[AI] No ship data or weapons found for ${aiData.ship}`);
    combatLog.info(`[AI] No valid actions available, ending turn`);
    return {
      action: 'endTurn',
      params: {}
    };
  }

  const { missileWeapon, laserWeapon } = findAvailableWeapons(shipData, aiData);
  const chosenWeapon = chooseWeaponForRange(currentRange, missileWeapon, laserWeapon, aiData);

  if (chosenWeapon) {
    return {
      action: 'fire',
      params: {
        turret: chosenWeapon.turret,
        weapon: chosenWeapon.weapon,
        target: 'opponent'
      }
    };
  }

  // Fallback: End turn if no valid action
  combatLog.info(`[AI] No valid actions available, ending turn`);
  return {
    action: 'endTurn',
    params: {}
  };
}

module.exports = {
  RANGE_BANDS,
  getIncomingMissiles,
  findAvailableWeapons,
  chooseWeaponForRange,
  makeAIDecision
};

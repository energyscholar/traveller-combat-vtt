/**
 * BaseStrategy - Abstract base class for AI decision strategies
 *
 * Defines the interface for all AI strategies. Concrete strategies
 * implement decide() to return combat actions based on their personality.
 *
 * @example
 * class AggressiveStrategy extends BaseStrategy {
 *   decide(context) {
 *     // Always attack
 *     return this.createFireAction(context);
 *   }
 * }
 *
 * @see README.md Architecture Patterns table
 * @see .claude/DESIGN-PATTERN-REFACTOR.md Stage 2
 */

const { combat: combatLog } = require('../../../logger');

class BaseStrategy {
  /**
   * @param {string} name - Strategy name for logging
   */
  constructor(name = 'Base') {
    this.name = name;
  }

  /**
   * Make a decision for the AI's turn
   * @abstract
   * @param {Object} context - Decision context
   * @param {Object} context.combat - Combat state
   * @param {Object} context.aiPlayer - AI player reference
   * @param {Object} context.aiData - AI player state (hull, ammo, etc.)
   * @param {Object} context.enemyData - Enemy player state
   * @param {string} context.range - Current combat range
   * @param {Array} context.incomingMissiles - Missiles targeting AI
   * @param {Object} context.weapons - Available weapons
   * @returns {Object} { action: string, params: Object }
   */
  decide(context) {
    throw new Error('Strategy.decide() must be implemented by subclass');
  }

  /**
   * Calculate health percentage
   * @param {Object} playerData - Player data with hull/maxHull
   * @returns {number} Health as percentage (0-100)
   */
  getHealthPercent(playerData) {
    return (playerData.hull / playerData.maxHull) * 100;
  }

  /**
   * Check if range is long (favors missiles)
   * @param {string} range - Range band name
   * @returns {boolean}
   */
  isLongRange(range) {
    const RANGE_BANDS = ['Adjacent', 'Close', 'Short', 'Medium', 'Long', 'Very Long', 'Distant'];
    return RANGE_BANDS.indexOf(range) >= 4;
  }

  /**
   * Create a fire action
   * @param {Object} context - Decision context
   * @param {Object} [weapon] - Specific weapon to use (optional)
   * @returns {Object} Fire action
   */
  createFireAction(context, weapon = null) {
    const { weapons, range, aiData } = context;

    // Choose weapon if not specified
    let chosenWeapon = weapon;
    if (!chosenWeapon) {
      if (this.isLongRange(range) && weapons.missileWeapon && aiData.ammo?.missiles > 0) {
        chosenWeapon = weapons.missileWeapon;
      } else {
        chosenWeapon = weapons.laserWeapon;
      }
    }

    if (!chosenWeapon) {
      return this.createEndTurnAction('No weapons available');
    }

    combatLog.info(`[AI:${this.name}] Firing weapon`);
    return {
      action: 'fire',
      params: {
        turret: chosenWeapon.turret,
        weapon: chosenWeapon.weapon,
        target: 'opponent'
      }
    };
  }

  /**
   * Create a point defense action
   * @param {Object} context - Decision context
   * @returns {Object} Point defense action
   */
  createPointDefenseAction(context) {
    const { incomingMissiles } = context;
    if (!incomingMissiles?.length) {
      return null;
    }
    combatLog.info(`[AI:${this.name}] Using point defense`);
    return {
      action: 'pointDefense',
      params: {
        targetMissileId: incomingMissiles[0].id
      }
    };
  }

  /**
   * Create a sandcaster action
   * @param {Object} context - Decision context
   * @returns {Object|null} Sandcaster action or null if unavailable
   */
  createSandcasterAction(context) {
    const { aiData } = context;
    if (!aiData.ammo?.sandcaster || aiData.ammo.sandcaster <= 0) {
      return null;
    }
    combatLog.info(`[AI:${this.name}] Using sandcaster`);
    return {
      action: 'sandcaster',
      params: {}
    };
  }

  /**
   * Create a dodge action
   * @returns {Object} Dodge action
   */
  createDodgeAction() {
    combatLog.info(`[AI:${this.name}] Performing dodge`);
    return {
      action: 'dodge',
      params: {}
    };
  }

  /**
   * Create an end turn action
   * @param {string} [reason='No valid actions'] - Reason for ending turn
   * @returns {Object} End turn action
   */
  createEndTurnAction(reason = 'No valid actions') {
    combatLog.info(`[AI:${this.name}] Ending turn: ${reason}`);
    return {
      action: 'endTurn',
      params: {}
    };
  }

  /**
   * Random roll helper
   * @returns {number} Random number 0-100
   */
  roll() {
    return Math.random() * 100;
  }
}

module.exports = { BaseStrategy };

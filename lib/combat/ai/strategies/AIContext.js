/**
 * AIContext - Strategy Pattern context/executor
 *
 * Selects and executes AI strategies. Can switch strategies at runtime
 * based on combat situation or configuration.
 *
 * @example
 * const context = new AIContext('aggressive');
 * const decision = context.makeDecision(combat, aiPlayer);
 *
 * // Switch strategy mid-combat
 * context.setStrategy('defensive');
 *
 * @see README.md Architecture Patterns table
 * @see .claude/DESIGN-PATTERN-REFACTOR.md Stage 2
 */

const { combat: combatLog } = require('../../../logger');
const { SHIPS } = require('../../../combat');
const { BalancedStrategy } = require('./BalancedStrategy');
const { AggressiveStrategy } = require('./AggressiveStrategy');
const { DefensiveStrategy } = require('./DefensiveStrategy');
const { CautiousStrategy } = require('./CautiousStrategy');

// Strategy registry
const STRATEGIES = {
  balanced: BalancedStrategy,
  aggressive: AggressiveStrategy,
  defensive: DefensiveStrategy,
  cautious: CautiousStrategy
};

// Range bands for context building
const RANGE_BANDS = ['Adjacent', 'Close', 'Short', 'Medium', 'Long', 'Very Long', 'Distant'];

class AIContext {
  /**
   * @param {string} [strategyName='balanced'] - Initial strategy name
   */
  constructor(strategyName = 'balanced') {
    this.setStrategy(strategyName);
  }

  /**
   * Set the current strategy
   * @param {string} strategyName - Strategy identifier
   * @throws {Error} If strategy not found
   */
  setStrategy(strategyName) {
    const StrategyClass = STRATEGIES[strategyName];
    if (!StrategyClass) {
      throw new Error(`Unknown AI strategy: ${strategyName}. Available: ${Object.keys(STRATEGIES).join(', ')}`);
    }
    this.strategy = new StrategyClass();
    this.strategyName = strategyName;
    combatLog.info(`[AI] Strategy set to: ${strategyName}`);
  }

  /**
   * Get current strategy name
   * @returns {string}
   */
  getStrategyName() {
    return this.strategyName;
  }

  /**
   * Get available strategy names
   * @returns {string[]}
   */
  static getAvailableStrategies() {
    return Object.keys(STRATEGIES);
  }

  /**
   * Build decision context from combat state
   * @param {Object} combat - Combat state
   * @param {Object} aiPlayer - AI player reference
   * @returns {Object} Decision context
   */
  buildContext(combat, aiPlayer) {
    const aiData = aiPlayer === combat.player1 ? combat.player1 : combat.player2;
    const enemyData = aiPlayer === combat.player1 ? combat.player2 : combat.player1;
    const shipData = SHIPS[aiData.ship];

    // Find available weapons
    const weapons = this._findWeapons(shipData, aiData);

    // Get incoming missiles
    const incomingMissiles = combat.missileTracker ?
      combat.missileTracker.getMissilesTargeting(aiData.id) : [];

    return {
      combat,
      aiPlayer,
      aiData,
      enemyData,
      range: combat.range,
      incomingMissiles,
      weapons,
      shipData
    };
  }

  /**
   * Find available weapons for AI
   * @private
   */
  _findWeapons(shipData, aiData) {
    let missileWeapon = null;
    let laserWeapon = null;

    if (!shipData?.weapons) {
      return { missileWeapon, laserWeapon };
    }

    for (let w = 0; w < shipData.weapons.length; w++) {
      const weapon = shipData.weapons[w];
      if (weapon.id === 'missiles' && aiData.ammo?.missiles > 0) {
        missileWeapon = { turret: 0, weapon: w };
      } else if (weapon.id?.includes('Laser')) {
        laserWeapon = { turret: 0, weapon: w };
      }
    }

    return { missileWeapon, laserWeapon };
  }

  /**
   * Make a decision using the current strategy
   * @param {Object} combat - Combat state
   * @param {Object} aiPlayer - AI player reference
   * @returns {Object} { action: string, params: Object }
   */
  makeDecision(combat, aiPlayer) {
    const context = this.buildContext(combat, aiPlayer);

    // Validate we have required data
    if (!context.shipData?.weapons) {
      combatLog.info(`[AI] No ship data or weapons for ${context.aiData?.ship}`);
      return {
        action: 'endTurn',
        params: {}
      };
    }

    return this.strategy.decide(context);
  }

  /**
   * Suggest a strategy based on combat situation
   * @param {Object} combat - Combat state
   * @param {Object} aiPlayer - AI player reference
   * @returns {string} Suggested strategy name
   */
  static suggestStrategy(combat, aiPlayer) {
    const aiData = aiPlayer === combat.player1 ? combat.player1 : combat.player2;
    const healthPercent = (aiData.hull / aiData.maxHull) * 100;

    // Low health = defensive
    if (healthPercent < 30) {
      return 'defensive';
    }

    // High health = aggressive
    if (healthPercent > 80) {
      return 'aggressive';
    }

    // Default to balanced
    return 'balanced';
  }
}

module.exports = { AIContext, STRATEGIES, RANGE_BANDS };

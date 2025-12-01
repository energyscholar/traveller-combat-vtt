/**
 * DefensiveStrategy - Survival-focused AI
 *
 * Prioritizes defense and survival:
 * - Always intercepts incoming missiles
 * - Uses sandcasters frequently when damaged
 * - Dodges often
 * - Only attacks when no defensive options needed
 *
 * @see BaseStrategy for interface documentation
 */

const { BaseStrategy } = require('./BaseStrategy');

class DefensiveStrategy extends BaseStrategy {
  constructor() {
    super('Defensive');
  }

  /**
   * Make a defensive decision focused on survival
   * @param {Object} context - Decision context
   * @returns {Object} { action: string, params: Object }
   */
  decide(context) {
    const { aiData, incomingMissiles, weapons } = context;
    const roll = this.roll();
    const healthPercent = this.getHealthPercent(aiData);

    // HIGH PRIORITY: Always try point defense if missiles incoming (80% chance)
    if (incomingMissiles.length > 0 && roll < 80) {
      const action = this.createPointDefenseAction(context);
      if (action) return action;
    }

    // HIGH PRIORITY: Use sandcaster when damaged (50% chance when hull < 80%)
    if (healthPercent < 80 && roll < 50) {
      const action = this.createSandcasterAction(context);
      if (action) return action;
    }

    // MEDIUM PRIORITY: Dodge frequently (25% chance)
    if (roll >= 50 && roll < 75) {
      return this.createDodgeAction();
    }

    // LOW PRIORITY: Attack only when feeling safe
    if (weapons.missileWeapon || weapons.laserWeapon) {
      return this.createFireAction(context);
    }

    return this.createEndTurnAction();
  }
}

module.exports = { DefensiveStrategy };

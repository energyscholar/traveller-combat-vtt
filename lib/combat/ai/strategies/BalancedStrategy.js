/**
 * BalancedStrategy - Situational AI decision making
 *
 * The default AI strategy that adapts based on combat situation:
 * - Defends against missiles when threatened
 * - Uses sandcaster when damaged
 * - Occasionally dodges
 * - Attacks with appropriate weapons for range
 *
 * @see BaseStrategy for interface documentation
 */

const { BaseStrategy } = require('./BaseStrategy');

class BalancedStrategy extends BaseStrategy {
  constructor() {
    super('Balanced');
  }

  /**
   * Make a balanced decision based on combat situation
   * @param {Object} context - Decision context
   * @returns {Object} { action: string, params: Object }
   */
  decide(context) {
    const { aiData, incomingMissiles, weapons } = context;
    const roll = this.roll();
    const healthPercent = this.getHealthPercent(aiData);

    // HIGH PRIORITY: Point defense if missiles incoming (50% chance)
    if (incomingMissiles.length > 0 && roll < 50) {
      const action = this.createPointDefenseAction(context);
      if (action) return action;
    }

    // MEDIUM PRIORITY: Use sandcaster if damaged (30% chance when hull < 90%)
    if (healthPercent < 90 && roll < 30) {
      const action = this.createSandcasterAction(context);
      if (action) return action;
    }

    // LOW PRIORITY: Dodge maneuver (10% chance)
    if (roll >= 30 && roll < 40) {
      return this.createDodgeAction();
    }

    // DEFAULT: Attack with appropriate weapon
    if (weapons.missileWeapon || weapons.laserWeapon) {
      return this.createFireAction(context);
    }

    return this.createEndTurnAction();
  }
}

module.exports = { BalancedStrategy };

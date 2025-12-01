/**
 * AggressiveStrategy - Maximum damage output AI
 *
 * Prioritizes offense over defense:
 * - Rarely uses sandcasters or dodges
 * - Only uses point defense when critical
 * - Prefers missiles at long range
 * - Always attacks when possible
 *
 * @see BaseStrategy for interface documentation
 */

const { BaseStrategy } = require('./BaseStrategy');

class AggressiveStrategy extends BaseStrategy {
  constructor() {
    super('Aggressive');
  }

  /**
   * Make an aggressive decision focused on damage output
   * @param {Object} context - Decision context
   * @returns {Object} { action: string, params: Object }
   */
  decide(context) {
    const { aiData, incomingMissiles, weapons } = context;
    const roll = this.roll();
    const healthPercent = this.getHealthPercent(aiData);

    // Only use point defense if multiple missiles incoming (20% chance)
    if (incomingMissiles.length >= 2 && roll < 20) {
      const action = this.createPointDefenseAction(context);
      if (action) return action;
    }

    // Only use sandcaster if critically damaged (10% chance when hull < 30%)
    if (healthPercent < 30 && roll < 10) {
      const action = this.createSandcasterAction(context);
      if (action) return action;
    }

    // Rarely dodge (5% chance)
    if (roll >= 90 && roll < 95) {
      return this.createDodgeAction();
    }

    // PRIORITY: Attack with weapons (95% of the time)
    if (weapons.missileWeapon || weapons.laserWeapon) {
      return this.createFireAction(context);
    }

    return this.createEndTurnAction();
  }
}

module.exports = { AggressiveStrategy };

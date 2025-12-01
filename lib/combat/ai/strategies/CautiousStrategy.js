/**
 * CautiousStrategy - Conservative AI play
 *
 * Conservative approach balancing offense and defense:
 * - Intercepts most missiles
 * - Uses defensive measures when moderately damaged
 * - Dodges regularly
 * - Attacks at medium rate
 *
 * Good for easier difficulty or merchant ships.
 *
 * @see BaseStrategy for interface documentation
 */

const { BaseStrategy } = require('./BaseStrategy');

class CautiousStrategy extends BaseStrategy {
  constructor() {
    super('Cautious');
  }

  /**
   * Make a cautious, conservative decision
   * @param {Object} context - Decision context
   * @returns {Object} { action: string, params: Object }
   */
  decide(context) {
    const { aiData, incomingMissiles, weapons } = context;
    const roll = this.roll();
    const healthPercent = this.getHealthPercent(aiData);

    // HIGH PRIORITY: Point defense if missiles incoming (70% chance)
    if (incomingMissiles.length > 0 && roll < 70) {
      const action = this.createPointDefenseAction(context);
      if (action) return action;
    }

    // MEDIUM PRIORITY: Use sandcaster when damaged (40% chance when hull < 70%)
    if (healthPercent < 70 && roll < 40) {
      const action = this.createSandcasterAction(context);
      if (action) return action;
    }

    // MEDIUM PRIORITY: Dodge frequently (20% chance)
    if (roll >= 40 && roll < 60) {
      return this.createDodgeAction();
    }

    // MEDIUM PRIORITY: Attack (40% of remaining)
    if (weapons.missileWeapon || weapons.laserWeapon) {
      return this.createFireAction(context);
    }

    return this.createEndTurnAction();
  }
}

module.exports = { CautiousStrategy };

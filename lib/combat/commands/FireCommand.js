/**
 * FireCommand - Laser/beam weapon attack command
 *
 * Encapsulates a weapon fire action with full validation,
 * execution, and undo support.
 *
 * @example
 * const cmd = new FireCommand({
 *   combat,
 *   actor: attacker,
 *   target: defender,
 *   weapon: { type: 'pulse_laser', damage: '2d6' },
 *   weaponIndex: 0
 * });
 *
 * @see BaseCommand for interface documentation
 * @see lib/weapons/strategies for attack resolution
 */

const { BaseCommand } = require('./BaseCommand');
const { WeaponContext } = require('../../weapons/strategies');
const { SHIPS } = require('../../combat');

class FireCommand extends BaseCommand {
  /**
   * @param {Object} context - Command context
   * @param {Object} context.combat - Combat state
   * @param {Object} context.actor - Attacking player
   * @param {Object} context.target - Target player
   * @param {Object} [context.weapon] - Weapon to fire
   * @param {number} [context.weaponIndex=0] - Index of weapon to fire
   */
  constructor(context) {
    super('fire', context);

    this.weaponIndex = context.weaponIndex ?? 0;
    this.weapon = context.weapon || this.getWeaponFromShip();
    this.weaponContext = new WeaponContext();

    // Additional state for undo
    this.damageDealt = 0;
    this.criticalHit = null;
  }

  /**
   * Get weapon from actor's ship definition
   * @returns {Object|null}
   */
  getWeaponFromShip() {
    const shipData = SHIPS[this.actor?.ship];
    if (!shipData?.weapons) return null;
    return shipData.weapons[this.weaponIndex] || null;
  }

  /**
   * Validate fire command
   * @returns {Object} { valid: boolean, reason?: string }
   */
  validate() {
    // Check turn
    const turnCheck = this.validateTurn();
    if (!turnCheck.valid) return turnCheck;

    // Check not already acted
    const actedCheck = this.validateNotActed();
    if (!actedCheck.valid) return actedCheck;

    // Check weapon exists
    if (!this.weapon) {
      return { valid: false, reason: 'no_weapon' };
    }

    // Check target exists
    if (!this.target) {
      return { valid: false, reason: 'no_target' };
    }

    // Check range restriction (if weapon has one)
    if (this.weapon.rangeRestriction && this.combat?.range) {
      const range = this.combat.range.toLowerCase();
      if (!this.weapon.rangeRestriction.includes(range)) {
        return { valid: false, reason: 'out_of_range' };
      }
    }

    return { valid: true };
  }

  /**
   * Execute the fire command
   * @returns {Object} Attack result
   */
  execute() {
    // Capture state before changes
    this.previousState = this.captureState();

    // Build attack context for weapon strategy
    const attackContext = {
      weapon: this.weapon,
      attacker: this.actor,
      defender: this.target,
      range: this.combat?.range || 'Medium',
      gunnerSkill: this.getGunnerSkill()
    };

    // Resolve attack using weapon strategy
    const result = this.weaponContext.attack(attackContext);

    // Apply damage if hit
    if (result.hit && result.damage > 0) {
      this.damageDealt = result.damage;
      this.target.hull -= result.damage;
      if (this.target.hull < 0) this.target.hull = 0;
    }

    // Mark turn as complete
    if (this.combat?.turnComplete) {
      this.combat.turnComplete[this.actor.id] = true;
    }

    this.executed = true;
    this.result = result;

    return result;
  }

  /**
   * Get gunner skill from actor's crew
   * @returns {number}
   */
  getGunnerSkill() {
    // Check if actor has assigned crew with gunner skill
    if (this.actor?.crew) {
      for (const crewMember of Object.values(this.actor.crew)) {
        if (crewMember?.skills?.gunner) {
          return crewMember.skills.gunner;
        }
      }
    }
    return 0;
  }

  /**
   * Capture fire-specific state
   * @returns {Object}
   */
  captureState() {
    const baseState = super.captureState();
    return {
      ...baseState,
      targetCriticals: this.target?.criticals ? [...this.target.criticals] : []
    };
  }

  /**
   * Restore fire-specific state
   * @param {Object} state
   */
  restoreState(state) {
    super.restoreState(state);
    if (this.target && state.targetCriticals) {
      this.target.criticals = [...state.targetCriticals];
    }
  }

  /**
   * Command summary
   * @returns {Object}
   */
  toJSON() {
    return {
      ...super.toJSON(),
      weapon: this.weapon?.name || this.weapon?.type,
      damage: this.damageDealt,
      hit: this.result?.hit ?? false
    };
  }
}

module.exports = { FireCommand };

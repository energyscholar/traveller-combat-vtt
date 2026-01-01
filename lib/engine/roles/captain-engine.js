/**
 * Captain Engine - Command and tactics actions
 *
 * Handles:
 * - Tactics bonus for initiative
 * - Leadership for morale
 * - Coordination between roles
 * - Orders and commands
 *
 * @module lib/engine/roles/captain-engine
 */

const { BaseRoleEngine } = require('./base-role-engine');

class CaptainEngine extends BaseRoleEngine {
  /**
   * Create captain engine
   * @param {Object} ship - Ship state
   * @param {Object} options
   * @param {Object} options.combat - Combat state reference
   * @param {Array} options.crew - Array of crew role engines
   * @param {Object} options.eventBus - Shared event bus
   * @param {Object} options.rng - RNG for testing
   */
  constructor(ship, options = {}) {
    super('captain', ship, options);
    this.crewEngines = options.crew || [];
  }

  defineActions() {
    const base = super.defineActions();

    return {
      ...base,

      tactics: {
        label: 'Apply tactics',
        description: 'Tactics check for initiative bonus (+Effect DM)',
        isDefault: true,
        execute: () => this.applyTactics()
      },

      leadership: {
        label: 'Leadership',
        description: 'Boost crew morale and effectiveness (+1 DM to all crew)',
        canExecute: () => !this.ship.leadershipApplied,
        disabledReason: 'Leadership already applied this round',
        execute: () => this.leadership()
      },

      coordinate: {
        label: 'Coordinate',
        description: 'Enable two crew to act in same phase',
        canExecute: () => this.canCoordinate(),
        disabledReason: 'Coordination already used this round',
        execute: (params) => this.coordinate(params)
      },

      issue_order: {
        label: 'Issue order',
        description: 'Give specific order to crew member',
        execute: (params) => this.issueOrder(params)
      },

      weapons_free: {
        label: 'Weapons free',
        description: 'Authorize all weapons to engage',
        execute: () => this.setWeaponsFree(true)
      },

      weapons_hold: {
        label: 'Weapons hold',
        description: 'Order weapons to hold fire',
        execute: () => this.setWeaponsFree(false)
      },

      evasive_all: {
        label: 'All hands evasive',
        description: 'Ship-wide evasive maneuvers order',
        execute: () => this.orderEvasive()
      },

      ram: {
        label: 'Ramming speed',
        description: 'Order ramming attack (desperate measure)',
        canExecute: () => this.canRam(),
        disabledReason: 'Not in close range or insufficient thrust',
        execute: (params) => this.ram(params)
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTION IMPLEMENTATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Apply tactics for initiative bonus
   */
  applyTactics() {
    const check = this.performSkillCheck('tactics', 8);

    if (!check.success) {
      return {
        success: true,
        action: 'tactics',
        bonus: 0,
        check
      };
    }

    // Store tactics bonus for initiative
    this.ship.tacticsBonus = check.effect;

    return {
      success: true,
      action: 'tactics',
      bonus: check.effect,
      check
    };
  }

  /**
   * Leadership to boost crew effectiveness
   */
  leadership() {
    const check = this.performSkillCheck('leadership', 8);

    if (!check.success) {
      return {
        success: true,
        action: 'leadership',
        boosted: false,
        check
      };
    }

    // Apply leadership bonus to all crew
    this.ship.leadershipBonus = Math.max(1, check.effect);
    this.ship.leadershipApplied = true;

    return {
      success: true,
      action: 'leadership',
      boosted: true,
      bonus: this.ship.leadershipBonus,
      check
    };
  }

  /**
   * Coordinate two crew members
   */
  coordinate(params = {}) {
    const { roles } = params;

    if (!roles || roles.length !== 2) {
      return { success: false, error: 'Must specify exactly two roles to coordinate' };
    }

    const check = this.performSkillCheck('tactics', 8);

    if (!check.success) {
      return {
        success: true,
        action: 'coordinate',
        coordinated: false,
        check
      };
    }

    // Mark roles as coordinated
    this.ship.coordinatedRoles = roles;
    this.ship.coordinationUsed = true;

    return {
      success: true,
      action: 'coordinate',
      coordinated: true,
      roles,
      check
    };
  }

  /**
   * Issue order to specific crew
   */
  issueOrder(params = {}) {
    const { role, order, priority } = params;

    if (!role || !order) {
      return { success: false, error: 'Must specify role and order' };
    }

    // Track orders
    this.ship.orders = this.ship.orders || [];
    this.ship.orders.push({
      role,
      order,
      priority: priority || 'normal',
      issued: Date.now()
    });

    return {
      success: true,
      action: 'issue_order',
      role,
      order,
      priority: priority || 'normal'
    };
  }

  /**
   * Set weapons authorization
   */
  setWeaponsFree(enabled) {
    this.ship.weaponsFree = enabled;

    return {
      success: true,
      action: enabled ? 'weapons_free' : 'weapons_hold',
      weaponsFree: enabled
    };
  }

  /**
   * Order ship-wide evasive maneuvers
   */
  orderEvasive() {
    this.ship.evasiveOrder = true;

    return {
      success: true,
      action: 'evasive_all',
      ordered: true
    };
  }

  /**
   * Ramming attack
   */
  ram(params = {}) {
    const { target } = params;

    if (!target) {
      return { success: false, error: 'Must specify target' };
    }

    // Check range - must be close/adjacent
    const range = this.combat?.range || 'Medium';
    if (!['Close', 'Adjacent'].includes(range)) {
      return { success: false, error: 'Must be at Close or Adjacent range' };
    }

    // Pilot check to hit
    const check = this.performSkillCheck('pilot', 10);

    if (!check.success) {
      return {
        success: true,
        action: 'ram',
        hit: false,
        target: target.name,
        check
      };
    }

    // Ramming damage based on ship size
    const ramDamage = Math.floor((this.ship.hull || 40) / 4);
    const selfDamage = Math.floor(ramDamage / 2);

    // Apply damage to both ships
    if (target.hull !== undefined) {
      target.hull = Math.max(0, target.hull - ramDamage);
    }
    this.ship.hull = Math.max(0, (this.ship.hull || 40) - selfDamage);

    return {
      success: true,
      action: 'ram',
      hit: true,
      target: target.name,
      ramDamage,
      selfDamage,
      check
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AVAILABILITY CHECKS
  // ─────────────────────────────────────────────────────────────────────────────

  canCoordinate() {
    return !this.ship.coordinationUsed;
  }

  canRam() {
    const range = this.combat?.range || 'Medium';
    const hasThrust = (this.ship.thrustRemaining ?? this.ship.thrust ?? 0) > 0;
    return ['Close', 'Adjacent'].includes(range) && hasThrust;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ROUND MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Reset captain-specific state for new round
   */
  resetForRound() {
    this.ship.leadershipApplied = false;
    this.ship.coordinationUsed = false;
    this.ship.coordinatedRoles = null;
    this.ship.tacticsBonus = 0;
  }
}

module.exports = { CaptainEngine };

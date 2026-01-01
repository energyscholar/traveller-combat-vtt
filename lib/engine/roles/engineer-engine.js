/**
 * Engineer Engine - Power and damage control actions
 *
 * Handles:
 * - Power allocation and boost
 * - Damage control repairs
 * - Emergency power reactions
 *
 * @module lib/engine/roles/engineer-engine
 */

const { BaseRoleEngine } = require('./base-role-engine');

class EngineerEngine extends BaseRoleEngine {
  /**
   * Create engineer engine
   * @param {Object} ship - Ship state with power and systems
   * @param {Object} options
   * @param {Object} options.eventBus - Shared event bus
   * @param {Object} options.rng - RNG for testing
   */
  constructor(ship, options = {}) {
    super('engineer', ship, options);
  }

  defineActions() {
    const base = super.defineActions();

    return {
      ...base,

      boost_power: {
        label: 'Boost power',
        description: 'Increase available power by 10% (Engineer check)',
        isDefault: true,
        canExecute: () => this.canBoostPower(),
        disabledReason: 'Power plant at maximum capacity',
        execute: () => this.boostPower()
      },

      damage_control: {
        label: 'Damage control',
        description: 'Repair damaged system (Engineer check)',
        canExecute: () => this.hasDamagedSystems(),
        disabledReason: 'No damaged systems to repair',
        execute: (params) => this.damageControl(params)
      },

      emergency_power: {
        label: 'Emergency power',
        description: 'Instant power boost (reaction, costs 1 power plant stress)',
        canExecute: () => this.canEmergencyPower(),
        disabledReason: 'Power plant too stressed for emergency power',
        execute: () => this.emergencyPower()
      },

      repair_hull: {
        label: 'Repair hull',
        description: 'Attempt to patch hull damage (1d6 HP restored on success)',
        canExecute: () => this.hasHullDamage(),
        disabledReason: 'Hull at maximum',
        execute: () => this.repairHull()
      },

      redistribute_power: {
        label: 'Redistribute power',
        description: 'Shift power between systems',
        execute: (params) => this.redistributePower(params)
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTION IMPLEMENTATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Boost available power by 10%
   */
  boostPower() {
    const check = this.performSkillCheck('engineer', 8);

    if (!check.success) {
      return {
        success: true,
        action: 'boost_power',
        boosted: false,
        check
      };
    }

    // Calculate boost amount (10% of max power)
    const maxPower = this.ship.maxPower ?? this.ship.power ?? 100;
    const boostAmount = Math.ceil(maxPower * 0.1);

    // Apply boost
    const currentPower = this.ship.power ?? maxPower;
    this.ship.power = Math.min(currentPower + boostAmount, maxPower * 1.2); // Can exceed max by 20%

    // Track boost for this round
    this.ship.powerBoosted = true;

    return {
      success: true,
      action: 'boost_power',
      boosted: true,
      boostAmount,
      newPower: this.ship.power,
      check
    };
  }

  /**
   * Attempt to repair a damaged system
   */
  damageControl(params = {}) {
    const { system } = params;
    const damagedSystems = this.getDamagedSystems();

    if (damagedSystems.length === 0) {
      return { success: false, error: 'No damaged systems' };
    }

    // If no system specified, repair most critical
    const targetSystem = system || this.getMostCriticalSystem(damagedSystems);

    if (!targetSystem) {
      return { success: false, error: 'Invalid system' };
    }

    // Engineer check - harder for more damaged systems
    const systemDamage = this.getSystemDamage(targetSystem);
    const difficulty = 8 + Math.floor(systemDamage / 2);

    const check = this.performSkillCheck('engineer', difficulty);

    if (!check.success) {
      return {
        success: true,
        action: 'damage_control',
        repaired: false,
        system: targetSystem,
        check
      };
    }

    // Reduce damage on system
    this.repairSystemDamage(targetSystem);

    return {
      success: true,
      action: 'damage_control',
      repaired: true,
      system: targetSystem,
      remainingDamage: this.getSystemDamage(targetSystem),
      check
    };
  }

  /**
   * Emergency power boost (reaction)
   */
  emergencyPower() {
    // Adds stress to power plant
    this.ship.powerPlantStress = (this.ship.powerPlantStress || 0) + 1;

    // Immediate power boost
    const boostAmount = 20;
    const currentPower = this.ship.power ?? this.ship.maxPower ?? 100;
    this.ship.power = currentPower + boostAmount;

    return {
      success: true,
      action: 'emergency_power',
      boostAmount,
      newPower: this.ship.power,
      stress: this.ship.powerPlantStress
    };
  }

  /**
   * Attempt hull repair
   */
  repairHull() {
    const check = this.performSkillCheck('engineer', 8);

    if (!check.success) {
      return {
        success: true,
        action: 'repair_hull',
        repaired: false,
        hullRestored: 0,
        check
      };
    }

    // 1d6 hull restored on success
    const hullRestored = this.rng.roll1d6();
    const currentHull = this.ship.hull ?? 0;
    const maxHull = this.ship.maxHull ?? 100;

    this.ship.hull = Math.min(currentHull + hullRestored, maxHull);

    return {
      success: true,
      action: 'repair_hull',
      repaired: true,
      hullRestored,
      newHull: this.ship.hull,
      check
    };
  }

  /**
   * Redistribute power between systems
   */
  redistributePower(params = {}) {
    const { from, to, amount } = params;

    if (!from || !to || !amount) {
      return { success: false, error: 'Must specify from, to, and amount' };
    }

    // Get current power allocations
    const allocations = this.ship.powerAllocations || {};
    const fromPower = allocations[from] || 0;

    if (fromPower < amount) {
      return { success: false, error: `Insufficient power in ${from}` };
    }

    // Transfer power
    allocations[from] = fromPower - amount;
    allocations[to] = (allocations[to] || 0) + amount;
    this.ship.powerAllocations = allocations;

    return {
      success: true,
      action: 'redistribute_power',
      from,
      to,
      amount,
      newAllocations: { ...allocations }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AVAILABILITY CHECKS
  // ─────────────────────────────────────────────────────────────────────────────

  canBoostPower() {
    // Can't boost if already boosted this round
    if (this.ship.powerBoosted) return false;

    // Can't boost if at 120% capacity
    const current = this.ship.power ?? 0;
    const max = this.ship.maxPower ?? this.ship.power ?? 100;
    return current < max * 1.2;
  }

  hasDamagedSystems() {
    return this.getDamagedSystems().length > 0;
  }

  canEmergencyPower() {
    // Power plant can only take 3 stress before failing
    const stress = this.ship.powerPlantStress || 0;
    return stress < 3;
  }

  hasHullDamage() {
    const current = this.ship.hull ?? 0;
    const max = this.ship.maxHull ?? 100;
    return current < max;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SYSTEM HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get list of damaged systems
   */
  getDamagedSystems() {
    const systems = this.ship.systems || {};
    const damaged = [];

    for (const [name, system] of Object.entries(systems)) {
      if (system.hits > 0 || system.disabled) {
        damaged.push(name);
      }
    }

    // Also check criticals array
    const criticals = this.ship.criticals || [];
    for (const crit of criticals) {
      if (crit.system && !damaged.includes(crit.system)) {
        damaged.push(crit.system);
      }
    }

    return damaged;
  }

  /**
   * Get most critical (highest damage) system
   */
  getMostCriticalSystem(damagedSystems) {
    let mostCritical = null;
    let highestDamage = 0;

    for (const system of damagedSystems) {
      const damage = this.getSystemDamage(system);
      if (damage > highestDamage) {
        highestDamage = damage;
        mostCritical = system;
      }
    }

    return mostCritical;
  }

  /**
   * Get damage level for a system
   */
  getSystemDamage(system) {
    const systems = this.ship.systems || {};
    const systemState = systems[system];

    if (systemState?.disabled) return 3;
    if (systemState?.hits) return systemState.hits;

    // Check criticals
    const criticals = this.ship.criticals || [];
    const crit = criticals.find(c => c.system === system);
    return crit?.severity || 0;
  }

  /**
   * Reduce damage on a system
   */
  repairSystemDamage(system) {
    const systems = this.ship.systems || {};

    if (systems[system]) {
      if (systems[system].disabled && systems[system].hits <= 1) {
        systems[system].disabled = false;
      }
      systems[system].hits = Math.max(0, (systems[system].hits || 0) - 1);
    }

    // Also update criticals
    const criticals = this.ship.criticals || [];
    const critIndex = criticals.findIndex(c => c.system === system);
    if (critIndex >= 0) {
      if (criticals[critIndex].severity <= 1) {
        criticals.splice(critIndex, 1);
      } else {
        criticals[critIndex].severity--;
      }
    }
  }
}

module.exports = { EngineerEngine };

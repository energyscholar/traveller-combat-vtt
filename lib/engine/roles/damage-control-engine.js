/**
 * Damage Control Engine - Repair and emergency response actions
 *
 * Handles:
 * - Hull repairs
 * - System repairs
 * - Firefighting
 * - Breach containment
 *
 * Note: Overlaps with Engineer but specialized for combat damage response.
 *
 * @module lib/engine/roles/damage-control-engine
 */

const { BaseRoleEngine } = require('./base-role-engine');

class DamageControlEngine extends BaseRoleEngine {
  /**
   * Create damage control engine
   * @param {Object} ship - Ship state
   * @param {Object} options
   * @param {Object} options.eventBus - Shared event bus
   * @param {Object} options.rng - RNG for testing
   */
  constructor(ship, options = {}) {
    super('damage_control', ship, options);
  }

  defineActions() {
    const base = super.defineActions();

    return {
      ...base,

      repair_hull: {
        label: 'Repair hull',
        description: 'Patch hull breaches (restores 1d6 HP on success)',
        isDefault: true,
        canExecute: () => this.hasHullDamage(),
        disabledReason: 'Hull at maximum',
        execute: () => this.repairHull()
      },

      repair_system: {
        label: 'Repair system',
        description: 'Attempt to restore damaged system',
        canExecute: () => this.hasDamagedSystems(),
        disabledReason: 'No damaged systems',
        execute: (params) => this.repairSystem(params)
      },

      firefighting: {
        label: 'Firefighting',
        description: 'Extinguish fires (reaction)',
        canExecute: () => this.hasActiveFires(),
        disabledReason: 'No active fires',
        execute: () => this.firefighting()
      },

      seal_breach: {
        label: 'Seal breach',
        description: 'Seal hull breach to prevent atmosphere loss',
        canExecute: () => this.hasBreaches(),
        disabledReason: 'No active breaches',
        execute: (params) => this.sealBreach(params)
      },

      emergency_bulkhead: {
        label: 'Emergency bulkhead',
        description: 'Seal off damaged section (reaction)',
        canExecute: () => this.canSealBulkhead(),
        disabledReason: 'No sections to seal',
        execute: (params) => this.emergencyBulkhead(params)
      },

      damage_assessment: {
        label: 'Damage assessment',
        description: 'Survey all damage for repair priority',
        execute: () => this.damageAssessment()
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTION IMPLEMENTATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Repair hull damage
   */
  repairHull() {
    const check = this.performSkillCheck('mechanic', 8);

    if (!check.success) {
      return {
        success: true,
        action: 'repair_hull',
        repaired: false,
        hullRestored: 0,
        check
      };
    }

    // 1d6 hull restored, +1 per effect
    const baseRepair = this.rng.roll1d6();
    const effectBonus = Math.max(0, check.effect);
    const hullRestored = baseRepair + effectBonus;

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
   * Repair damaged system
   */
  repairSystem(params = {}) {
    const { system } = params;
    const damagedSystems = this.getDamagedSystems();

    if (damagedSystems.length === 0) {
      return { success: false, error: 'No damaged systems' };
    }

    const targetSystem = system || this.getPrioritySystem(damagedSystems);

    if (!targetSystem || !damagedSystems.includes(targetSystem)) {
      return { success: false, error: 'Invalid system' };
    }

    // Mechanic check - difficulty based on damage severity
    const severity = this.getSystemSeverity(targetSystem);
    const difficulty = 6 + severity * 2;

    const check = this.performSkillCheck('mechanic', difficulty);

    if (!check.success) {
      return {
        success: true,
        action: 'repair_system',
        repaired: false,
        system: targetSystem,
        check
      };
    }

    // Reduce damage
    this.reduceSystemDamage(targetSystem);

    return {
      success: true,
      action: 'repair_system',
      repaired: true,
      system: targetSystem,
      remainingSeverity: this.getSystemSeverity(targetSystem),
      check
    };
  }

  /**
   * Firefighting to extinguish fires
   */
  firefighting() {
    const fires = this.getActiveFires();

    if (fires.length === 0) {
      return { success: false, error: 'No active fires' };
    }

    // No skill check - automatic but time-consuming
    const fireToFight = fires[0];

    // Reduce fire intensity
    if (fireToFight.intensity > 1) {
      fireToFight.intensity--;
    } else {
      // Extinguish fire
      this.removeFire(fireToFight.location);
    }

    return {
      success: true,
      action: 'firefighting',
      location: fireToFight.location,
      extinguished: fireToFight.intensity <= 1,
      remainingFires: this.getActiveFires().length
    };
  }

  /**
   * Seal hull breach
   */
  sealBreach(params = {}) {
    const { location } = params;
    const breaches = this.getBreaches();

    if (breaches.length === 0) {
      return { success: false, error: 'No breaches' };
    }

    const targetBreach = location
      ? breaches.find(b => b.location === location)
      : breaches[0];

    if (!targetBreach) {
      return { success: false, error: 'Invalid breach location' };
    }

    const check = this.performSkillCheck('mechanic', 8);

    if (!check.success) {
      return {
        success: true,
        action: 'seal_breach',
        sealed: false,
        location: targetBreach.location,
        check
      };
    }

    // Remove breach
    this.removeBreach(targetBreach.location);

    return {
      success: true,
      action: 'seal_breach',
      sealed: true,
      location: targetBreach.location,
      remainingBreaches: this.getBreaches().length,
      check
    };
  }

  /**
   * Emergency bulkhead sealing
   */
  emergencyBulkhead(params = {}) {
    const { section } = params;

    if (!section) {
      return { success: false, error: 'Must specify section' };
    }

    // Automatic - no check required
    this.ship.sealedSections = this.ship.sealedSections || [];
    if (!this.ship.sealedSections.includes(section)) {
      this.ship.sealedSections.push(section);
    }

    return {
      success: true,
      action: 'emergency_bulkhead',
      section,
      sealed: true
    };
  }

  /**
   * Comprehensive damage assessment
   */
  damageAssessment() {
    const systems = this.getDamagedSystems();
    const fires = this.getActiveFires();
    const breaches = this.getBreaches();

    const hullDamage = this.ship.maxHull
      ? this.ship.maxHull - (this.ship.hull || 0)
      : 0;

    const assessment = {
      hullDamage,
      hullPercent: this.ship.maxHull
        ? Math.round(((this.ship.hull || 0) / this.ship.maxHull) * 100)
        : 100,
      damagedSystems: systems.map(s => ({
        system: s,
        severity: this.getSystemSeverity(s),
        priority: this.getSystemPriority(s)
      })),
      activeFires: fires.length,
      activeBreaches: breaches.length,
      sealedSections: this.ship.sealedSections || [],
      criticalStatus: this.getCriticalStatus()
    };

    return {
      success: true,
      action: 'damage_assessment',
      assessment
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AVAILABILITY CHECKS
  // ─────────────────────────────────────────────────────────────────────────────

  hasHullDamage() {
    const current = this.ship.hull ?? 0;
    const max = this.ship.maxHull ?? 100;
    return current < max;
  }

  hasDamagedSystems() {
    return this.getDamagedSystems().length > 0;
  }

  hasActiveFires() {
    return this.getActiveFires().length > 0;
  }

  hasBreaches() {
    return this.getBreaches().length > 0;
  }

  canSealBulkhead() {
    // Can always seal a section if there are any damage conditions
    return this.hasBreaches() || this.hasActiveFires();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DAMAGE HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get list of damaged systems
   */
  getDamagedSystems() {
    const damaged = [];
    const systems = this.ship.systems || {};

    for (const [name, state] of Object.entries(systems)) {
      if (state.hits > 0 || state.disabled) {
        damaged.push(name);
      }
    }

    // Check criticals
    const criticals = this.ship.criticals || [];
    for (const crit of criticals) {
      if (crit.system && !damaged.includes(crit.system)) {
        damaged.push(crit.system);
      }
    }

    return damaged;
  }

  /**
   * Get system severity (damage level)
   */
  getSystemSeverity(system) {
    const systems = this.ship.systems || {};
    const state = systems[system];

    if (state?.disabled) return 3;
    if (state?.hits) return state.hits;

    const criticals = this.ship.criticals || [];
    const crit = criticals.find(c => c.system === system);
    return crit?.severity || 0;
  }

  /**
   * Get priority for system repair
   */
  getSystemPriority(system) {
    const priorities = {
      powerPlant: 1,
      mDrive: 2,
      lifSupport: 2,
      sensors: 3,
      jDrive: 4,
      weapons: 4
    };
    return priorities[system] || 5;
  }

  /**
   * Get highest priority damaged system
   */
  getPrioritySystem(damagedSystems) {
    return damagedSystems.sort((a, b) =>
      this.getSystemPriority(a) - this.getSystemPriority(b)
    )[0];
  }

  /**
   * Reduce damage on a system
   */
  reduceSystemDamage(system) {
    const systems = this.ship.systems || {};

    if (systems[system]) {
      if (systems[system].disabled && systems[system].hits <= 1) {
        systems[system].disabled = false;
      }
      systems[system].hits = Math.max(0, (systems[system].hits || 0) - 1);
    }

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

  /**
   * Get active fires
   */
  getActiveFires() {
    return this.ship.fires || [];
  }

  /**
   * Remove fire at location
   */
  removeFire(location) {
    if (!this.ship.fires) return;
    const index = this.ship.fires.findIndex(f => f.location === location);
    if (index >= 0) {
      this.ship.fires.splice(index, 1);
    }
  }

  /**
   * Get hull breaches
   */
  getBreaches() {
    return this.ship.breaches || [];
  }

  /**
   * Remove breach at location
   */
  removeBreach(location) {
    if (!this.ship.breaches) return;
    const index = this.ship.breaches.findIndex(b => b.location === location);
    if (index >= 0) {
      this.ship.breaches.splice(index, 1);
    }
  }

  /**
   * Get overall critical status
   */
  getCriticalStatus() {
    const hullPercent = this.ship.maxHull
      ? ((this.ship.hull || 0) / this.ship.maxHull) * 100
      : 100;

    if (hullPercent <= 10) return 'critical';
    if (hullPercent <= 25) return 'severe';
    if (hullPercent <= 50) return 'moderate';
    if (hullPercent < 100) return 'light';
    return 'none';
  }
}

module.exports = { DamageControlEngine };

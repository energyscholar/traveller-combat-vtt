/**
 * Pilot Engine - Navigation and maneuver actions
 *
 * Handles:
 * - Range band changes (close, maintain, flee)
 * - Evasive maneuvers
 * - Thrust allocation
 *
 * @module lib/engine/roles/pilot-engine
 */

const { BaseRoleEngine } = require('./base-role-engine');

/**
 * Range bands in order from closest to farthest
 */
const RANGE_BANDS = ['Adjacent', 'Close', 'Short', 'Medium', 'Long', 'Very Long', 'Distant'];

/**
 * Thrust cost to change range by one band
 */
const THRUST_PER_RANGE = 1;

class PilotEngine extends BaseRoleEngine {
  /**
   * Create pilot engine
   * @param {Object} ship - Ship state
   * @param {Object} options
   * @param {Object} options.combat - Combat state with range property
   * @param {Object} options.eventBus - Shared event bus
   * @param {Object} options.rng - RNG for testing
   */
  constructor(ship, options = {}) {
    super('pilot', ship, options);
  }

  defineActions() {
    const base = super.defineActions();

    return {
      ...base,

      maintain: {
        label: 'Maintain range',
        description: 'Hold current distance from target',
        isDefault: true,
        execute: () => this.maintainRange()
      },

      close: {
        label: 'Close range',
        description: 'Move to closer range band (costs thrust)',
        canExecute: () => this.canCloseRange(),
        disabledReason: this.getCloseRangeDisabledReason(),
        execute: () => this.closeRange()
      },

      open: {
        label: 'Open range',
        description: 'Move to farther range band (costs thrust)',
        canExecute: () => this.canOpenRange(),
        disabledReason: this.getOpenRangeDisabledReason(),
        execute: () => this.openRange()
      },

      evade: {
        label: 'Evasive maneuvers',
        description: 'Harder to hit (-2 DM to enemy attacks), but own attacks suffer -1 DM',
        canExecute: () => this.canEvade(),
        disabledReason: 'Insufficient thrust for evasive maneuvers',
        execute: () => this.evade()
      },

      flee: {
        label: 'Flee combat',
        description: 'Attempt to break contact and escape (pilot check)',
        canExecute: () => this.canFlee(),
        disabledReason: this.getFleeDisabledReason(),
        execute: () => this.attemptFlee()
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTION IMPLEMENTATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Maintain current range - no thrust cost
   */
  maintainRange() {
    return {
      success: true,
      action: 'maintain',
      range: this.getCurrentRange()
    };
  }

  /**
   * Close range by one band
   */
  closeRange() {
    const currentRange = this.getCurrentRange();
    const currentIndex = RANGE_BANDS.indexOf(currentRange);

    if (currentIndex <= 0) {
      return { success: false, error: 'Already at closest range' };
    }

    // Check thrust
    const thrustAvailable = this.getThrustAvailable();
    if (thrustAvailable < THRUST_PER_RANGE) {
      return { success: false, error: 'Insufficient thrust' };
    }

    // Apply range change
    const newRange = RANGE_BANDS[currentIndex - 1];
    this.setRange(newRange);
    this.consumeThrust(THRUST_PER_RANGE);

    return {
      success: true,
      action: 'close',
      oldRange: currentRange,
      newRange,
      thrustUsed: THRUST_PER_RANGE
    };
  }

  /**
   * Open range by one band
   */
  openRange() {
    const currentRange = this.getCurrentRange();
    const currentIndex = RANGE_BANDS.indexOf(currentRange);

    if (currentIndex >= RANGE_BANDS.length - 1) {
      return { success: false, error: 'Already at maximum range' };
    }

    // Check thrust
    const thrustAvailable = this.getThrustAvailable();
    if (thrustAvailable < THRUST_PER_RANGE) {
      return { success: false, error: 'Insufficient thrust' };
    }

    // Apply range change
    const newRange = RANGE_BANDS[currentIndex + 1];
    this.setRange(newRange);
    this.consumeThrust(THRUST_PER_RANGE);

    return {
      success: true,
      action: 'open',
      oldRange: currentRange,
      newRange,
      thrustUsed: THRUST_PER_RANGE
    };
  }

  /**
   * Engage evasive maneuvers
   */
  evade() {
    const thrustRequired = 1;
    const thrustAvailable = this.getThrustAvailable();

    if (thrustAvailable < thrustRequired) {
      return { success: false, error: 'Insufficient thrust' };
    }

    // Set evasive flag on ship
    this.ship.evasiveManeuvers = true;
    this.consumeThrust(thrustRequired);

    return {
      success: true,
      action: 'evade',
      defensePenalty: -2,  // Enemy attacks at -2
      attackPenalty: -1,   // Own attacks at -1
      thrustUsed: thrustRequired
    };
  }

  /**
   * Attempt to flee combat
   */
  attemptFlee() {
    // Need to be at Long range or beyond
    const currentRange = this.getCurrentRange();
    const rangeIndex = RANGE_BANDS.indexOf(currentRange);
    const longIndex = RANGE_BANDS.indexOf('Long');

    if (rangeIndex < longIndex) {
      return {
        success: false,
        error: 'Must be at Long range or beyond to flee'
      };
    }

    // Pilot skill check - opposed if enemy pursues
    const check = this.performSkillCheck('pilot', 8);

    if (check.success) {
      // Mark ship as fled
      this.ship.fled = true;

      return {
        success: true,
        action: 'flee',
        escaped: true,
        check
      };
    }

    return {
      success: true,  // Action succeeded, but escape failed
      action: 'flee',
      escaped: false,
      check
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AVAILABILITY CHECKS
  // ─────────────────────────────────────────────────────────────────────────────

  canCloseRange() {
    const currentRange = this.getCurrentRange();
    const currentIndex = RANGE_BANDS.indexOf(currentRange);
    const hasThrust = this.getThrustAvailable() >= THRUST_PER_RANGE;
    return currentIndex > 0 && hasThrust;
  }

  getCloseRangeDisabledReason() {
    const currentRange = this.getCurrentRange();
    const currentIndex = RANGE_BANDS.indexOf(currentRange);
    if (currentIndex <= 0) return 'Already at closest range';
    if (this.getThrustAvailable() < THRUST_PER_RANGE) return 'Insufficient thrust';
    return null;
  }

  canOpenRange() {
    const currentRange = this.getCurrentRange();
    const currentIndex = RANGE_BANDS.indexOf(currentRange);
    const hasThrust = this.getThrustAvailable() >= THRUST_PER_RANGE;
    return currentIndex < RANGE_BANDS.length - 1 && hasThrust;
  }

  getOpenRangeDisabledReason() {
    const currentRange = this.getCurrentRange();
    const currentIndex = RANGE_BANDS.indexOf(currentRange);
    if (currentIndex >= RANGE_BANDS.length - 1) return 'Already at maximum range';
    if (this.getThrustAvailable() < THRUST_PER_RANGE) return 'Insufficient thrust';
    return null;
  }

  canEvade() {
    return this.getThrustAvailable() >= 1;
  }

  canFlee() {
    const currentRange = this.getCurrentRange();
    const rangeIndex = RANGE_BANDS.indexOf(currentRange);
    const longIndex = RANGE_BANDS.indexOf('Long');
    return rangeIndex >= longIndex;
  }

  getFleeDisabledReason() {
    const currentRange = this.getCurrentRange();
    const rangeIndex = RANGE_BANDS.indexOf(currentRange);
    const longIndex = RANGE_BANDS.indexOf('Long');
    if (rangeIndex < longIndex) return 'Must be at Long range or beyond';
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  getCurrentRange() {
    return this.combat?.range || 'Medium';
  }

  setRange(newRange) {
    if (this.combat) {
      this.combat.range = newRange;
    }
  }

  getThrustAvailable() {
    // Check ship thrust remaining, or use ship's base thrust
    return this.ship.thrustRemaining ?? this.ship.thrust ?? 0;
  }

  consumeThrust(amount) {
    if (this.ship.thrustRemaining !== undefined) {
      this.ship.thrustRemaining -= amount;
    } else if (this.ship.thrust !== undefined) {
      this.ship.thrustRemaining = this.ship.thrust - amount;
    }
  }
}

module.exports = { PilotEngine, RANGE_BANDS, THRUST_PER_RANGE };

/**
 * BaseCommand - Abstract base class for combat actions
 *
 * Implements Command Pattern for combat actions. Each command encapsulates:
 * - validate(): Check preconditions (turn, ammo, combat state)
 * - execute(): Perform the action (resolve attack, update state)
 * - undo(): Reverse the action (restore previous state)
 *
 * Commands maintain state snapshots for undo/redo functionality.
 *
 * @example
 * const fire = new FireCommand({ combat, attacker, weapon, target });
 * if (fire.validate().valid) {
 *   const result = fire.execute();
 *   invoker.recordCommand(fire); // For undo/redo
 * }
 *
 * @see README.md Architecture Patterns table
 * @see .claude/DESIGN-PATTERN-REFACTOR.md Stage 4
 */

class BaseCommand {
  /**
   * @param {string} type - Command type identifier
   * @param {Object} context - Command context
   * @param {Object} context.combat - Combat state
   * @param {Object} context.actor - Acting player/ship
   * @param {Object} [context.target] - Target player/ship
   */
  constructor(type, context) {
    if (new.target === BaseCommand) {
      throw new Error('BaseCommand is abstract and cannot be instantiated directly');
    }

    this.type = type;
    this.combat = context.combat;
    this.actor = context.actor;
    this.target = context.target || null;
    this.timestamp = Date.now();
    this.executed = false;

    // State snapshot for undo (populated on execute)
    this.previousState = null;
    this.result = null;
  }

  /**
   * Validate command preconditions
   * @abstract
   * @returns {Object} { valid: boolean, reason?: string }
   */
  validate() {
    throw new Error('BaseCommand.validate() must be implemented by subclass');
  }

  /**
   * Execute the command
   * @abstract
   * @returns {Object} Execution result
   */
  execute() {
    throw new Error('BaseCommand.execute() must be implemented by subclass');
  }

  /**
   * Undo the command (restore previous state)
   * @returns {boolean} Success
   */
  undo() {
    if (!this.executed || !this.previousState) {
      return false;
    }

    // Restore state snapshot
    this.restoreState(this.previousState);
    this.executed = false;
    return true;
  }

  /**
   * Redo the command (re-execute with same result)
   * @returns {Object|null} Cached result or null if never executed
   */
  redo() {
    if (this.executed) {
      return null; // Already executed
    }

    if (!this.result) {
      return this.execute(); // First time
    }

    // Re-apply cached result
    this.applyResult(this.result);
    this.executed = true;
    return this.result;
  }

  /**
   * Capture current state for undo
   * Override in subclasses for command-specific state
   * @returns {Object} State snapshot
   */
  captureState() {
    return {
      actorHull: this.actor?.hull,
      targetHull: this.target?.hull,
      round: this.combat?.round,
      activePlayer: this.combat?.activePlayer,
      turnComplete: this.combat?.turnComplete ? { ...this.combat.turnComplete } : {}
    };
  }

  /**
   * Restore state from snapshot
   * @param {Object} state - State snapshot
   */
  restoreState(state) {
    if (this.actor && state.actorHull !== undefined) {
      this.actor.hull = state.actorHull;
    }
    if (this.target && state.targetHull !== undefined) {
      this.target.hull = state.targetHull;
    }
    if (this.combat) {
      if (state.round !== undefined) this.combat.round = state.round;
      if (state.activePlayer !== undefined) this.combat.activePlayer = state.activePlayer;
      if (state.turnComplete) this.combat.turnComplete = { ...state.turnComplete };
    }
  }

  /**
   * Apply cached result to state
   * Override in subclasses for command-specific application
   * @param {Object} result - Cached execution result
   */
  applyResult(result) {
    // Default: re-apply damage to target
    if (result.damage && this.target) {
      this.target.hull -= result.damage;
      if (this.target.hull < 0) this.target.hull = 0;
    }
  }

  /**
   * Common validation: check if it's actor's turn
   * @returns {Object} { valid: boolean, reason?: string }
   */
  validateTurn() {
    if (!this.combat) {
      return { valid: false, reason: 'no_combat' };
    }
    if (this.combat.activePlayer !== this.actor?.id) {
      return { valid: false, reason: 'not_your_turn' };
    }
    return { valid: true };
  }

  /**
   * Common validation: check if actor already acted
   * @returns {Object} { valid: boolean, reason?: string }
   */
  validateNotActed() {
    if (!this.combat || !this.actor) {
      return { valid: false, reason: 'invalid_state' };
    }
    if (this.combat.turnComplete?.[this.actor.id]) {
      return { valid: false, reason: 'already_acted' };
    }
    return { valid: true };
  }

  /**
   * Common validation: check ammo
   * @param {string} ammoType - Type of ammo to check
   * @param {number} [required=1] - Amount required
   * @returns {Object} { valid: boolean, reason?: string }
   */
  validateAmmo(ammoType, required = 1) {
    if (!this.actor?.ammo) {
      return { valid: false, reason: 'no_ammo_data' };
    }
    if ((this.actor.ammo[ammoType] || 0) < required) {
      return { valid: false, reason: `insufficient_${ammoType}` };
    }
    return { valid: true };
  }

  /**
   * Get command summary for logging/history
   * @returns {Object}
   */
  toJSON() {
    return {
      type: this.type,
      actor: this.actor?.id,
      target: this.target?.id,
      timestamp: this.timestamp,
      executed: this.executed,
      result: this.result
    };
  }
}

module.exports = { BaseCommand };

/**
 * CommandInvoker - Executes commands and maintains history for undo/redo
 *
 * Central command executor that:
 * - Validates commands before execution
 * - Executes commands and records them
 * - Maintains command history per combat
 * - Provides undo/redo functionality
 *
 * @example
 * const invoker = new CommandInvoker();
 * const cmd = new FireCommand(context);
 * const result = invoker.execute(cmd, combatId);
 * if (result.success) {
 *   // Action completed
 * }
 * // Later: undo the action
 * invoker.undo(combatId);
 *
 * @see README.md Architecture Patterns table
 * @see .claude/DESIGN-PATTERN-REFACTOR.md Stage 4
 */

class CommandInvoker {
  constructor() {
    // Map of combatId -> { history: Command[], undoStack: Command[] }
    this.combatHistories = new Map();

    // Maximum commands to keep in history per combat
    this.maxHistory = 100;
  }

  /**
   * Get or create history for a combat
   * @param {string} combatId - Combat identifier
   * @returns {Object} { history: Command[], undoStack: Command[] }
   */
  getHistory(combatId) {
    if (!this.combatHistories.has(combatId)) {
      this.combatHistories.set(combatId, {
        history: [],
        undoStack: []
      });
    }
    return this.combatHistories.get(combatId);
  }

  /**
   * Execute a command
   * @param {BaseCommand} command - Command to execute
   * @param {string} combatId - Combat identifier
   * @returns {Object} { success: boolean, result?: Object, error?: string }
   */
  execute(command, combatId) {
    // Validate first
    const validation = command.validate();
    if (!validation.valid) {
      return {
        success: false,
        error: validation.reason
      };
    }

    // Capture state before execution
    command.previousState = command.captureState();

    // Execute
    try {
      const result = command.execute();
      command.result = result;
      command.executed = true;

      // Record in history
      const { history, undoStack } = this.getHistory(combatId);
      history.push(command);

      // Clear redo stack on new action
      undoStack.length = 0;

      // Trim history if needed
      if (history.length > this.maxHistory) {
        history.shift();
      }

      return {
        success: true,
        result
      };
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Undo the last command for a combat
   * @param {string} combatId - Combat identifier
   * @returns {Object} { success: boolean, command?: BaseCommand, error?: string }
   */
  undo(combatId) {
    const { history, undoStack } = this.getHistory(combatId);

    if (history.length === 0) {
      return {
        success: false,
        error: 'no_commands_to_undo'
      };
    }

    const command = history.pop();

    try {
      const undone = command.undo();
      if (undone) {
        undoStack.push(command);
        return {
          success: true,
          command
        };
      } else {
        // Put it back if undo failed
        history.push(command);
        return {
          success: false,
          error: 'undo_failed'
        };
      }
    } catch (err) {
      history.push(command);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Redo the last undone command for a combat
   * @param {string} combatId - Combat identifier
   * @returns {Object} { success: boolean, command?: BaseCommand, result?: Object, error?: string }
   */
  redo(combatId) {
    const { history, undoStack } = this.getHistory(combatId);

    if (undoStack.length === 0) {
      return {
        success: false,
        error: 'no_commands_to_redo'
      };
    }

    const command = undoStack.pop();

    try {
      const result = command.redo();
      if (result !== null) {
        history.push(command);
        return {
          success: true,
          command,
          result
        };
      } else {
        undoStack.push(command);
        return {
          success: false,
          error: 'redo_failed'
        };
      }
    } catch (err) {
      undoStack.push(command);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Check if undo is available
   * @param {string} combatId - Combat identifier
   * @returns {boolean}
   */
  canUndo(combatId) {
    const { history } = this.getHistory(combatId);
    return history.length > 0;
  }

  /**
   * Check if redo is available
   * @param {string} combatId - Combat identifier
   * @returns {boolean}
   */
  canRedo(combatId) {
    const { undoStack } = this.getHistory(combatId);
    return undoStack.length > 0;
  }

  /**
   * Get command history for a combat
   * @param {string} combatId - Combat identifier
   * @param {number} [limit=10] - Maximum commands to return
   * @returns {Array<Object>} Command summaries
   */
  getCommandHistory(combatId, limit = 10) {
    const { history } = this.getHistory(combatId);
    return history.slice(-limit).map(cmd => cmd.toJSON());
  }

  /**
   * Clear history for a combat (e.g., combat ended)
   * @param {string} combatId - Combat identifier
   */
  clearHistory(combatId) {
    this.combatHistories.delete(combatId);
  }

  /**
   * Get undo/redo status for UI
   * @param {string} combatId - Combat identifier
   * @returns {Object} { canUndo: boolean, canRedo: boolean, historyCount: number }
   */
  getStatus(combatId) {
    const { history, undoStack } = this.getHistory(combatId);
    return {
      canUndo: history.length > 0,
      canRedo: undoStack.length > 0,
      historyCount: history.length,
      undoCount: undoStack.length
    };
  }
}

// Singleton instance for global access
const commandInvoker = new CommandInvoker();

module.exports = { CommandInvoker, commandInvoker };

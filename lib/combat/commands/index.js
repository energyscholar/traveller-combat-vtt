/**
 * Combat Commands - Command Pattern Module Exports
 *
 * Provides Command Pattern implementation for combat actions.
 * Each action is encapsulated as a command with validate/execute/undo.
 *
 * @example
 * const { FireCommand, commandInvoker } = require('./commands');
 * const cmd = new FireCommand({ combat, actor, target, weapon });
 * const result = commandInvoker.execute(cmd, combatId);
 *
 * @see README.md Architecture Patterns table
 * @see .claude/DESIGN-PATTERN-REFACTOR.md Stage 4
 */

const { BaseCommand } = require('./BaseCommand');
const { CommandInvoker, commandInvoker } = require('./CommandInvoker');
const { FireCommand } = require('./FireCommand');

// Additional commands to be added:
// - MissileCommand
// - PointDefenseCommand
// - SandcasterCommand
// - EndTurnCommand

module.exports = {
  // Base
  BaseCommand,

  // Invoker
  CommandInvoker,
  commandInvoker,

  // Commands (40% - FireCommand only)
  FireCommand
};

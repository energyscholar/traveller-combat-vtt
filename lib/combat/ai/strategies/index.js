/**
 * AI Strategies Module - Strategy Pattern exports
 *
 * Provides centralized access to all AI strategy classes.
 *
 * @example
 * const { AIContext, BalancedStrategy } = require('./strategies');
 *
 * const aiContext = new AIContext('aggressive');
 * const decision = aiContext.makeDecision(combat, aiPlayer);
 *
 * @see README.md Architecture Patterns table
 * @see .claude/DESIGN-PATTERN-REFACTOR.md Stage 2
 */

const { BaseStrategy } = require('./BaseStrategy');
const { BalancedStrategy } = require('./BalancedStrategy');
const { AggressiveStrategy } = require('./AggressiveStrategy');
const { DefensiveStrategy } = require('./DefensiveStrategy');
const { CautiousStrategy } = require('./CautiousStrategy');
const { AIContext, STRATEGIES, RANGE_BANDS } = require('./AIContext');

module.exports = {
  // Context (executor)
  AIContext,

  // Base class
  BaseStrategy,

  // Concrete strategies
  BalancedStrategy,
  AggressiveStrategy,
  DefensiveStrategy,
  CautiousStrategy,

  // Configuration
  STRATEGIES,
  RANGE_BANDS
};

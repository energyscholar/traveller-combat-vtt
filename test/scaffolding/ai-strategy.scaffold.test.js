/**
 * AI Strategy Pattern Scaffolding Tests
 *
 * These tests verify the Strategy Pattern implementation for AI decisions.
 * They will be removed after the design pattern refactor is complete.
 *
 * @see .claude/DESIGN-PATTERN-REFACTOR.md Stage 2
 */

const {
  AIContext,
  BaseStrategy,
  BalancedStrategy,
  AggressiveStrategy,
  DefensiveStrategy,
  CautiousStrategy,
  STRATEGIES
} = require('../../lib/combat/ai/strategies');

const {
  makeAIDecision,
  setAIStrategy,
  getAvailableStrategies,
  createAIContext
} = require('../../lib/combat/ai/decisions');

// Mock combat state for testing
function createMockCombat(options = {}) {
  return {
    player1: {
      id: 'player1',
      ship: 'scout',
      hull: options.player1Hull ?? 40,
      maxHull: 40,
      ammo: { missiles: 5, sandcaster: 10 }
    },
    player2: {
      id: 'ai_player',
      ship: 'scout',
      hull: options.aiHull ?? 40,
      maxHull: 40,
      ammo: { missiles: 5, sandcaster: 10 }
    },
    range: options.range ?? 'Medium',
    missileTracker: {
      getMissilesTargeting: (id) => options.incomingMissiles ?? []
    }
  };
}

describe('AI Strategy Pattern - Scaffolding Tests', () => {
  describe('BaseStrategy', () => {
    test('cannot be instantiated for decisions directly', () => {
      const base = new BaseStrategy('Test');
      expect(() => base.decide({})).toThrow('must be implemented');
    });

    test('provides helper methods', () => {
      const base = new BaseStrategy('Test');
      expect(base.getHealthPercent({ hull: 30, maxHull: 40 })).toBe(75);
      expect(base.isLongRange('Long')).toBe(true);
      expect(base.isLongRange('Medium')).toBe(false);
    });

    test('creates actions correctly', () => {
      const base = new BaseStrategy('Test');

      const dodge = base.createDodgeAction();
      expect(dodge.action).toBe('dodge');

      const endTurn = base.createEndTurnAction();
      expect(endTurn.action).toBe('endTurn');
    });
  });

  describe('AIContext', () => {
    test('creates with default balanced strategy', () => {
      const ctx = new AIContext();
      expect(ctx.getStrategyName()).toBe('balanced');
    });

    test('accepts strategy name in constructor', () => {
      const ctx = new AIContext('aggressive');
      expect(ctx.getStrategyName()).toBe('aggressive');
    });

    test('throws for unknown strategy', () => {
      expect(() => new AIContext('unknown')).toThrow('Unknown AI strategy');
    });

    test('can switch strategies', () => {
      const ctx = new AIContext('balanced');
      ctx.setStrategy('defensive');
      expect(ctx.getStrategyName()).toBe('defensive');
    });

    test('lists available strategies', () => {
      const strategies = AIContext.getAvailableStrategies();
      expect(strategies).toContain('balanced');
      expect(strategies).toContain('aggressive');
      expect(strategies).toContain('defensive');
      expect(strategies).toContain('cautious');
    });

    test('makes decisions using strategy', () => {
      const ctx = new AIContext('balanced');
      const combat = createMockCombat();
      const decision = ctx.makeDecision(combat, combat.player2);

      expect(decision).toHaveProperty('action');
      expect(decision).toHaveProperty('params');
    });
  });

  describe('BalancedStrategy', () => {
    test('makes balanced decisions', () => {
      const strategy = new BalancedStrategy();
      expect(strategy.name).toBe('Balanced');
    });
  });

  describe('AggressiveStrategy', () => {
    test('makes aggressive decisions', () => {
      const strategy = new AggressiveStrategy();
      expect(strategy.name).toBe('Aggressive');
    });
  });

  describe('DefensiveStrategy', () => {
    test('makes defensive decisions', () => {
      const strategy = new DefensiveStrategy();
      expect(strategy.name).toBe('Defensive');
    });
  });

  describe('CautiousStrategy', () => {
    test('makes cautious decisions', () => {
      const strategy = new CautiousStrategy();
      expect(strategy.name).toBe('Cautious');
    });
  });

  describe('decisions.js API', () => {
    test('makeAIDecision uses default strategy', () => {
      const combat = createMockCombat();
      const decision = makeAIDecision(combat, combat.player2);
      expect(decision).toHaveProperty('action');
    });

    test('makeAIDecision accepts strategy override', () => {
      const combat = createMockCombat();
      const decision = makeAIDecision(combat, combat.player2, 'aggressive');
      expect(decision).toHaveProperty('action');
    });

    test('setAIStrategy changes default', () => {
      setAIStrategy('cautious');
      // Verify it doesn't throw
      const combat = createMockCombat();
      const decision = makeAIDecision(combat, combat.player2);
      expect(decision).toHaveProperty('action');

      // Reset to balanced
      setAIStrategy('balanced');
    });

    test('getAvailableStrategies returns list', () => {
      const strategies = getAvailableStrategies();
      expect(strategies.length).toBeGreaterThanOrEqual(4);
    });

    test('createAIContext creates new context', () => {
      const ctx = createAIContext('defensive');
      expect(ctx.getStrategyName()).toBe('defensive');
    });
  });

  describe('Strategy Behavior', () => {
    // Run each strategy multiple times to verify they produce valid actions
    const strategies = ['balanced', 'aggressive', 'defensive', 'cautious'];

    for (const strategyName of strategies) {
      test(`${strategyName} produces valid actions`, () => {
        const ctx = new AIContext(strategyName);
        const combat = createMockCombat();

        // Run 10 iterations to check consistency
        for (let i = 0; i < 10; i++) {
          const decision = ctx.makeDecision(combat, combat.player2);
          expect(['fire', 'pointDefense', 'sandcaster', 'dodge', 'endTurn']).toContain(decision.action);
        }
      });
    }

    test('defensive strategy uses point defense more with incoming missiles', () => {
      const ctx = new AIContext('defensive');
      const combat = createMockCombat({
        incomingMissiles: [{ id: 'missile1' }]
      });

      // Count point defense decisions over 20 runs
      let pdCount = 0;
      for (let i = 0; i < 20; i++) {
        const decision = ctx.makeDecision(combat, combat.player2);
        if (decision.action === 'pointDefense') pdCount++;
      }

      // Defensive should use PD frequently (80% chance)
      expect(pdCount).toBeGreaterThan(10);
    });

    test('aggressive strategy attacks more frequently', () => {
      const ctx = new AIContext('aggressive');
      const combat = createMockCombat();

      // Count fire decisions over 20 runs
      let fireCount = 0;
      for (let i = 0; i < 20; i++) {
        const decision = ctx.makeDecision(combat, combat.player2);
        if (decision.action === 'fire') fireCount++;
      }

      // Aggressive should fire frequently (90%+ chance)
      expect(fireCount).toBeGreaterThan(15);
    });
  });

  describe('Strategy Integration', () => {
    test('suggestStrategy based on health', () => {
      // Low health = defensive
      const lowHealthCombat = createMockCombat({ aiHull: 10 });
      expect(AIContext.suggestStrategy(lowHealthCombat, lowHealthCombat.player2)).toBe('defensive');

      // High health = aggressive
      const highHealthCombat = createMockCombat({ aiHull: 40 });
      expect(AIContext.suggestStrategy(highHealthCombat, highHealthCombat.player2)).toBe('aggressive');
    });
  });
});

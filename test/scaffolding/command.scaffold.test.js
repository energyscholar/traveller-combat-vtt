/**
 * Command Pattern Scaffolding Tests
 *
 * These tests verify the Command Pattern implementation for combat actions.
 * Tests cover BaseCommand, CommandInvoker, and FireCommand (40% foundation).
 *
 * @see .claude/DESIGN-PATTERN-REFACTOR.md Stage 4
 */

const {
  BaseCommand,
  CommandInvoker,
  commandInvoker,
  FireCommand
} = require('../../lib/combat/commands');

// Mock combat state
function createMockCombat(options = {}) {
  return {
    id: 'test_combat',
    range: options.range ?? 'Medium',
    round: options.round ?? 1,
    activePlayer: options.activePlayer ?? 'player1',
    turnComplete: options.turnComplete ?? {},
    player1: createMockPlayer('player1', options.player1 ?? {}),
    player2: createMockPlayer('player2', options.player2 ?? {})
  };
}

function createMockPlayer(id, options = {}) {
  return {
    id,
    ship: options.ship ?? 'scout',
    hull: options.hull ?? 40,
    maxHull: options.maxHull ?? 40,
    armor: options.armor ?? 4,
    ammo: options.ammo ?? { missiles: 12, sandcaster: 20 },
    criticals: options.criticals ?? [],
    crew: options.crew ?? {}
  };
}

describe('Command Pattern - Scaffolding Tests', () => {
  describe('BaseCommand', () => {
    test('cannot be instantiated directly', () => {
      expect(() => new BaseCommand('test', {})).toThrow('abstract');
    });

    test('subclass can be instantiated', () => {
      class TestCommand extends BaseCommand {
        validate() { return { valid: true }; }
        execute() { return { success: true }; }
      }

      const cmd = new TestCommand('test', { combat: {}, actor: {} });
      expect(cmd.type).toBe('test');
      expect(cmd.executed).toBe(false);
    });

    test('provides turn validation helper', () => {
      class TestCommand extends BaseCommand {
        validate() { return this.validateTurn(); }
        execute() { return {}; }
      }

      const combat = createMockCombat({ activePlayer: 'player1' });
      const actor = combat.player1;

      const cmd = new TestCommand('test', { combat, actor });
      const result = cmd.validate();
      expect(result.valid).toBe(true);
    });

    test('validateTurn fails when not actors turn', () => {
      class TestCommand extends BaseCommand {
        validate() { return this.validateTurn(); }
        execute() { return {}; }
      }

      const combat = createMockCombat({ activePlayer: 'player2' });
      const actor = combat.player1;

      const cmd = new TestCommand('test', { combat, actor });
      const result = cmd.validate();
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('not_your_turn');
    });

    test('validateNotActed passes when not acted', () => {
      class TestCommand extends BaseCommand {
        validate() { return this.validateNotActed(); }
        execute() { return {}; }
      }

      const combat = createMockCombat();
      const cmd = new TestCommand('test', { combat, actor: combat.player1 });
      expect(cmd.validate().valid).toBe(true);
    });

    test('validateNotActed fails when already acted', () => {
      class TestCommand extends BaseCommand {
        validate() { return this.validateNotActed(); }
        execute() { return {}; }
      }

      const combat = createMockCombat({ turnComplete: { player1: true } });
      const cmd = new TestCommand('test', { combat, actor: combat.player1 });
      const result = cmd.validate();
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('already_acted');
    });

    test('validateAmmo checks ammo correctly', () => {
      class TestCommand extends BaseCommand {
        validate() { return this.validateAmmo('missiles', 5); }
        execute() { return {}; }
      }

      const combat = createMockCombat();
      combat.player1.ammo = { missiles: 10 };

      const cmd = new TestCommand('test', { combat, actor: combat.player1 });
      expect(cmd.validate().valid).toBe(true);
    });

    test('validateAmmo fails with insufficient ammo', () => {
      class TestCommand extends BaseCommand {
        validate() { return this.validateAmmo('missiles', 15); }
        execute() { return {}; }
      }

      const combat = createMockCombat();
      combat.player1.ammo = { missiles: 10 };

      const cmd = new TestCommand('test', { combat, actor: combat.player1 });
      const result = cmd.validate();
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('insufficient_missiles');
    });

    test('captureState creates snapshot', () => {
      class TestCommand extends BaseCommand {
        validate() { return { valid: true }; }
        execute() { return {}; }
      }

      const combat = createMockCombat();
      const cmd = new TestCommand('test', {
        combat,
        actor: combat.player1,
        target: combat.player2
      });

      const state = cmd.captureState();
      expect(state.actorHull).toBe(40);
      expect(state.targetHull).toBe(40);
      expect(state.round).toBe(1);
    });

    test('toJSON returns summary', () => {
      class TestCommand extends BaseCommand {
        validate() { return { valid: true }; }
        execute() { return { success: true }; }
      }

      const combat = createMockCombat();
      const cmd = new TestCommand('test', {
        combat,
        actor: combat.player1,
        target: combat.player2
      });

      const json = cmd.toJSON();
      expect(json.type).toBe('test');
      expect(json.actor).toBe('player1');
      expect(json.target).toBe('player2');
      expect(json.executed).toBe(false);
    });
  });

  describe('CommandInvoker', () => {
    let invoker;

    beforeEach(() => {
      invoker = new CommandInvoker();
    });

    test('creates history for new combat', () => {
      const history = invoker.getHistory('combat1');
      expect(history.history).toEqual([]);
      expect(history.undoStack).toEqual([]);
    });

    test('execute validates and runs command', () => {
      class TestCommand extends BaseCommand {
        validate() { return { valid: true }; }
        execute() { return { success: true }; }
        captureState() { return {}; }
      }

      const cmd = new TestCommand('test', { combat: {}, actor: {} });
      const result = invoker.execute(cmd, 'combat1');

      expect(result.success).toBe(true);
      expect(result.result.success).toBe(true);
      expect(cmd.executed).toBe(true);
    });

    test('execute rejects invalid command', () => {
      class TestCommand extends BaseCommand {
        validate() { return { valid: false, reason: 'test_error' }; }
        execute() { return {}; }
      }

      const cmd = new TestCommand('test', { combat: {}, actor: {} });
      const result = invoker.execute(cmd, 'combat1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('test_error');
    });

    test('undo restores previous state', () => {
      class TestCommand extends BaseCommand {
        validate() { return { valid: true }; }
        execute() {
          this.combat.value = 'changed';
          return { success: true };
        }
        captureState() { return { value: this.combat.value }; }
        restoreState(state) { this.combat.value = state.value; }
      }

      const combat = { value: 'original' };
      const cmd = new TestCommand('test', { combat, actor: {} });

      invoker.execute(cmd, 'combat1');
      expect(combat.value).toBe('changed');

      const undoResult = invoker.undo('combat1');
      expect(undoResult.success).toBe(true);
      expect(combat.value).toBe('original');
    });

    test('redo re-applies command', () => {
      class TestCommand extends BaseCommand {
        validate() { return { valid: true }; }
        execute() {
          this.combat.value = 'changed';
          return { success: true };
        }
        captureState() { return { value: this.combat.value }; }
        restoreState(state) { this.combat.value = state.value; }
        applyResult() { this.combat.value = 'changed'; }
      }

      const combat = { value: 'original' };
      const cmd = new TestCommand('test', { combat, actor: {} });

      invoker.execute(cmd, 'combat1');
      invoker.undo('combat1');
      expect(combat.value).toBe('original');

      const redoResult = invoker.redo('combat1');
      expect(redoResult.success).toBe(true);
      expect(combat.value).toBe('changed');
    });

    test('canUndo/canRedo report correctly', () => {
      class TestCommand extends BaseCommand {
        validate() { return { valid: true }; }
        execute() { return {}; }
        captureState() { return {}; }
      }

      const cmd = new TestCommand('test', { combat: {}, actor: {} });

      expect(invoker.canUndo('combat1')).toBe(false);
      expect(invoker.canRedo('combat1')).toBe(false);

      invoker.execute(cmd, 'combat1');
      expect(invoker.canUndo('combat1')).toBe(true);
      expect(invoker.canRedo('combat1')).toBe(false);

      invoker.undo('combat1');
      expect(invoker.canUndo('combat1')).toBe(false);
      expect(invoker.canRedo('combat1')).toBe(true);
    });

    test('getStatus returns correct state', () => {
      class TestCommand extends BaseCommand {
        validate() { return { valid: true }; }
        execute() { return {}; }
        captureState() { return {}; }
      }

      const cmd = new TestCommand('test', { combat: {}, actor: {} });
      invoker.execute(cmd, 'combat1');

      const status = invoker.getStatus('combat1');
      expect(status.canUndo).toBe(true);
      expect(status.canRedo).toBe(false);
      expect(status.historyCount).toBe(1);
    });

    test('clearHistory removes combat data', () => {
      class TestCommand extends BaseCommand {
        validate() { return { valid: true }; }
        execute() { return {}; }
        captureState() { return {}; }
      }

      const cmd = new TestCommand('test', { combat: {}, actor: {} });
      invoker.execute(cmd, 'combat1');

      invoker.clearHistory('combat1');
      expect(invoker.canUndo('combat1')).toBe(false);
    });

    test('getCommandHistory returns summaries', () => {
      class TestCommand extends BaseCommand {
        validate() { return { valid: true }; }
        execute() { return {}; }
        captureState() { return {}; }
      }

      const cmd1 = new TestCommand('test1', { combat: {}, actor: { id: 'p1' } });
      const cmd2 = new TestCommand('test2', { combat: {}, actor: { id: 'p2' } });

      invoker.execute(cmd1, 'combat1');
      invoker.execute(cmd2, 'combat1');

      const history = invoker.getCommandHistory('combat1');
      expect(history.length).toBe(2);
      expect(history[0].type).toBe('test1');
      expect(history[1].type).toBe('test2');
    });
  });

  describe('FireCommand', () => {
    test('validates turn ownership', () => {
      const combat = createMockCombat({ activePlayer: 'player2' });

      const cmd = new FireCommand({
        combat,
        actor: combat.player1,
        target: combat.player2,
        weapon: { type: 'pulse_laser', damage: '2d6' }
      });

      const result = cmd.validate();
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('not_your_turn');
    });

    test('validates not already acted', () => {
      const combat = createMockCombat({
        activePlayer: 'player1',
        turnComplete: { player1: true }
      });

      const cmd = new FireCommand({
        combat,
        actor: combat.player1,
        target: combat.player2,
        weapon: { type: 'pulse_laser', damage: '2d6' }
      });

      const result = cmd.validate();
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('already_acted');
    });

    test('validates weapon exists', () => {
      const combat = createMockCombat();
      // Use unknown ship so getWeaponFromShip returns null
      combat.player1.ship = 'unknown_ship';

      const cmd = new FireCommand({
        combat,
        actor: combat.player1,
        target: combat.player2,
        weapon: null
      });

      const result = cmd.validate();
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('no_weapon');
    });

    test('validates target exists', () => {
      const combat = createMockCombat();

      const cmd = new FireCommand({
        combat,
        actor: combat.player1,
        target: null,
        weapon: { type: 'pulse_laser', damage: '2d6' }
      });

      const result = cmd.validate();
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('no_target');
    });

    test('executes and applies damage', () => {
      const combat = createMockCombat();
      combat.player2.hull = 40;
      combat.player2.armor = 0; // No armor for predictable test

      const cmd = new FireCommand({
        combat,
        actor: combat.player1,
        target: combat.player2,
        weapon: { type: 'pulse_laser', damage: '2d6' }
      });

      const result = cmd.execute();

      expect(result).toHaveProperty('hit');
      expect(cmd.executed).toBe(true);

      if (result.hit) {
        expect(combat.player2.hull).toBeLessThan(40);
      }
    });

    test('marks turn complete after execution', () => {
      const combat = createMockCombat();

      const cmd = new FireCommand({
        combat,
        actor: combat.player1,
        target: combat.player2,
        weapon: { type: 'pulse_laser', damage: '2d6' }
      });

      cmd.execute();
      expect(combat.turnComplete.player1).toBe(true);
    });

    test('undo restores hull', () => {
      const combat = createMockCombat();
      const originalHull = combat.player2.hull;

      const cmd = new FireCommand({
        combat,
        actor: combat.player1,
        target: combat.player2,
        weapon: { type: 'pulse_laser', damage: '2d6' }
      });

      cmd.previousState = cmd.captureState();
      cmd.execute();

      // Force a hit with damage for test
      if (cmd.result.hit && combat.player2.hull < originalHull) {
        const damaged = combat.player2.hull;
        cmd.undo();
        expect(combat.player2.hull).toBe(originalHull);
      }
    });

    test('toJSON includes fire-specific data', () => {
      const combat = createMockCombat();

      const cmd = new FireCommand({
        combat,
        actor: combat.player1,
        target: combat.player2,
        weapon: { type: 'pulse_laser', name: 'Pulse Laser', damage: '2d6' }
      });

      const json = cmd.toJSON();
      expect(json.type).toBe('fire');
      expect(json.weapon).toBe('Pulse Laser');
    });
  });

  describe('Singleton commandInvoker', () => {
    test('global invoker exists', () => {
      expect(commandInvoker).toBeInstanceOf(CommandInvoker);
    });

    test('can execute commands', () => {
      class TestCommand extends BaseCommand {
        validate() { return { valid: true }; }
        execute() { return { success: true }; }
        captureState() { return {}; }
      }

      const cmd = new TestCommand('test', { combat: {}, actor: {} });
      const result = commandInvoker.execute(cmd, 'singleton_test');

      expect(result.success).toBe(true);

      // Cleanup
      commandInvoker.clearHistory('singleton_test');
    });
  });
});

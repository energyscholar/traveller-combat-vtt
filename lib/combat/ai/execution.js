/**
 * AI Execution Logic
 * Execute AI opponent turns in combat
 */

const { combat: combatLog } = require('../../logger');
const { SHIPS, resolveAttack } = require('../../combat');
const { isDummyAI, emitToPlayer } = require('./helpers');
const { makeAIDecision } = require('./decisions');

/**
 * Execute AI turn automatically
 * @param {Object} combat - Combat state
 * @param {Object} io - Socket.io server instance
 * @param {Map} activeCombats - Map of active combat sessions
 */
function executeAITurn(combat, io, activeCombats) {
  if (!isDummyAI(combat.activePlayer)) {
    combatLog.error(`[AI] executeAITurn called but active player is not AI: ${combat.activePlayer}`);
    return;
  }

  const aiPlayer = combat.activePlayer === combat.player1.id ? combat.player1 : combat.player2;
  const humanPlayer = combat.activePlayer === combat.player1.id ? combat.player2 : combat.player1;

  combatLog.info(`[AI] Executing turn for ${aiPlayer.ship}`);

  // Make AI decision
  const decision = makeAIDecision(combat, aiPlayer);

  combatLog.info(`[AI] Decision: ${decision.action}`, decision.params);

  // Execute the chosen action
  switch (decision.action) {
    case 'fire': {
      combatLog.info(`[AI] Executing weapon fire (turret ${decision.params.turret}, weapon ${decision.params.weapon})`);

      // Get weapon data
      const shipData = SHIPS[aiPlayer.ship];
      const weaponIndex = decision.params.weapon;
      const weaponObj = shipData && shipData.weapons ? shipData.weapons[weaponIndex] : null;

      if (!weaponObj) {
        combatLog.error(`[AI] Invalid weapon index: ${weaponIndex}`);
        break;
      }

      // Resolve attack using same logic as player
      const attackResult = resolveAttack(
        aiPlayer,
        humanPlayer,
        {
          range: combat.range.toLowerCase(),
          weapon: weaponObj
        }
      );

      combatLog.info(`[AI] Attack result:`, attackResult);

      if (attackResult.hit) {
        // Apply damage
        humanPlayer.hull -= attackResult.damage;
        if (humanPlayer.hull < 0) humanPlayer.hull = 0;

        combatLog.info(`[AI] HIT! ${attackResult.damage} damage. Target hull: ${humanPlayer.hull}/${humanPlayer.maxHull}`);

        // Emit to human player (if not AI)
        if (!isDummyAI(humanPlayer.id)) {
          const humanSocket = io.sockets.sockets.get(humanPlayer.id);
          if (humanSocket && humanSocket.connected) {
            humanSocket.emit('space:attacked', {
              hit: true,
              damage: attackResult.damage,
              hull: humanPlayer.hull,
              maxHull: humanPlayer.maxHull
            });
          }
        }

        // Check for critical hits
        const hullPercent = (humanPlayer.hull / humanPlayer.maxHull) * 100;
        if (hullPercent <= 50 && attackResult.damage > 0 && Math.random() < 0.3) {
          const criticalSystems = ['Turret', 'Sensors', 'Maneuver Drive', 'Jump Drive', 'Power Plant'];
          const criticalSystem = criticalSystems[Math.floor(Math.random() * criticalSystems.length)];

          humanPlayer.criticals.push(criticalSystem);
          combatLog.info(`[AI] Critical hit on ${criticalSystem}!`);

          if (!isDummyAI(humanPlayer.id)) {
            const humanSocket = io.sockets.sockets.get(humanPlayer.id);
            if (humanSocket && humanSocket.connected) {
              humanSocket.emit('space:critical', {
                target: humanPlayer.id === combat.player1.id ? 'player1' : 'player2',
                system: criticalSystem,
                damage: attackResult.damage
              });
            }
          }
        }

        // Check for combat end
        if (humanPlayer.hull <= 0) {
          combatLog.info(`[AI] Target destroyed! AI wins combat.`);

          const combatId = [...activeCombats.entries()].find(([_, c]) => c === combat)?.[0];
          if (combatId) {
            activeCombats.delete(combatId);
          }

          if (!isDummyAI(humanPlayer.id)) {
            const humanSocket = io.sockets.sockets.get(humanPlayer.id);
            if (humanSocket && humanSocket.connected) {
              humanSocket.emit('space:combatEnd', {
                winner: aiPlayer.id === combat.player1.id ? 'player1' : 'player2',
                loser: humanPlayer.id === combat.player1.id ? 'player1' : 'player2',
                reason: 'ship_destroyed',
                finalHull: {
                  player1: combat.player1.hull,
                  player2: combat.player2.hull
                },
                rounds: combat.round
              });
            }
          }
          return; // Combat ended, don't continue turn processing
        }
      } else {
        combatLog.info(`[AI] MISS! Attack roll: ${attackResult.attackRoll}, Total: ${attackResult.total}`);

        if (!isDummyAI(humanPlayer.id)) {
          const humanSocket = io.sockets.sockets.get(humanPlayer.id);
          if (humanSocket && humanSocket.connected) {
            humanSocket.emit('space:attacked', {
              hit: false,
              damage: 0,
              hull: humanPlayer.hull,
              maxHull: humanPlayer.maxHull
            });
          }
        }
      }
      break;
    }

    case 'pointDefense':
      // Point defense not yet implemented
      combatLog.info(`[AI] Point defense not yet implemented (missile ${decision.params.targetMissileId})`);
      break;

    case 'sandcaster':
      // Sandcaster not yet implemented
      combatLog.info(`[AI] Sandcaster not yet implemented`);
      break;

    case 'dodge':
      // Dodge not yet implemented
      combatLog.info(`[AI] Dodge maneuver not yet implemented`);
      break;

    case 'endTurn':
      // Just end turn
      combatLog.info(`[AI] Ending turn with no action`);
      break;
  }

  // Mark AI turn as complete
  combat.turnComplete[combat.activePlayer] = true;

  // Check if both players completed turns (trigger next round or turn change)
  if (combat.turnComplete[combat.player1.id] && combat.turnComplete[combat.player2.id]) {
    // New round
    combat.round++;
    combat.turnComplete = { [combat.player1.id]: false, [combat.player2.id]: false };
    combat.activePlayer = (combat.round % 2 === 1) ? combat.player1.id : combat.player2.id;

    const newRoundData = {
      round: combat.round,
      player1Hull: combat.player1.hull,
      player2Hull: combat.player2.hull,
      activePlayer: combat.activePlayer
    };

    emitToPlayer(io, combat.player1.id, 'space:newRound', newRoundData);
    emitToPlayer(io, combat.player2.id, 'space:newRound', newRoundData);
    combatLog.info(`[AI] New round ${combat.round} started`);

    // If new round starts with AI, trigger AI turn again
    if (isDummyAI(combat.activePlayer)) {
      combatLog.info(`[AI] New round starts with AI turn, executing...`);
      setTimeout(() => {
        executeAITurn(combat, io, activeCombats);
      }, 1500);
    }
  } else {
    // Switch to other player
    combat.activePlayer = combat.activePlayer === combat.player1.id ? combat.player2.id : combat.player1.id;

    const turnChangeData = {
      activePlayer: combat.activePlayer,
      round: combat.round
    };

    emitToPlayer(io, combat.player1.id, 'space:turnChange', turnChangeData);
    emitToPlayer(io, combat.player2.id, 'space:turnChange', turnChangeData);
    combatLog.info(`[AI] Turn switched to ${combat.activePlayer === combat.player1.id ? 'Player 1' : 'Player 2'}`);
  }
}

module.exports = {
  executeAITurn
};

/**
 * Space Combat Socket Handlers
 * Handles all space combat events:
 * - Ship selection (space:shipSelected, space:rangeSelected, space:playerReady)
 * - Combat actions (space:fire, space:launchMissile, space:pointDefense, space:useSandcaster)
 * - Turn management (space:endTurn, space:abandonBattle)
 *
 * TODO: Refactor to Command Pattern (SOON)
 * =========================================
 * Each action (fire, launchMissile, pointDefense, useSandcaster, endTurn) should be
 * encapsulated as a Command object implementing:
 *   - validate() - Check preconditions (turn, ammo, combat state)
 *   - execute() - Perform the action (resolve attack, update state)
 *   - emit() - Broadcast results to players
 *
 * Benefits of Command Pattern here:
 *   - Undo/Replay support for game replays
 *   - Action queuing for simultaneous resolution
 *   - Consistent validation across all actions
 *   - Built-in logging/auditing
 *   - Easier testing of individual commands
 *
 * Proposed structure:
 *   lib/combat/commands/
 *     - BaseCommand.js       (abstract base with validate/execute/emit)
 *     - FireCommand.js       (laser/beam weapon attacks)
 *     - MissileCommand.js    (missile launch)
 *     - PointDefenseCommand.js
 *     - SandcasterCommand.js
 *     - EndTurnCommand.js
 */

const { socket: socketLog, combat: combatLog } = require('../logger');
const { resolveAttack, SHIPS } = require('../combat');
const { MissileTracker } = require('../weapons/missiles');
const { useSandcaster, canUseSandcaster } = require('../weapons/sandcasters');
const { generateDefaultCrew } = require('../combat/game');
const {
  createDummyPlayer,
  isDummyAI,
  emitToPlayer
} = require('../combat/ai');
const state = require('../state');
const services = require('../services');

/**
 * Register space combat handlers
 * @param {Socket} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance
 * @param {Object} deps - Dependencies { connections, activeCombats, connectionId, executeAITurn }
 */
function register(socket, io, deps) {
  const {
    connections,
    activeCombats,
    connectionId,
    executeAITurn
  } = deps;

  const { checkRateLimit, updateConnectionActivity } = services;

  // ======== STAGE 8.6: SPACE COMBAT SHIP SELECTION ========

  socket.on('space:shipSelected', (data) => {
    updateConnectionActivity(socket.id);
    combatLog.info(` Player ${connectionId} selected ship: ${data.ship}`);
    socket.spaceSelection.ship = data.ship;
  });

  socket.on('space:rangeSelected', (data) => {
    updateConnectionActivity(socket.id);
    combatLog.info(` Player ${connectionId} selected range: ${data.range}`);
    socket.spaceSelection.range = data.range;
  });

  socket.on('space:playerReady', (data) => {
    updateConnectionActivity(socket.id);
    combatLog.info(` Player ${connectionId} ready with ${data.ship} at ${data.range}`);

    socket.spaceSelection.ship = data.ship;
    socket.spaceSelection.range = data.range;
    socket.spaceSelection.ready = true;

    // Notify other players that this player is ready
    socket.broadcast.emit('space:opponentReady', {
      ship: data.ship,
      range: data.range
    });

    // Check if both players are ready
    const allSockets = Array.from(connections.keys()).map(id => io.sockets.sockets.get(id));
    const readyPlayers = allSockets.filter(s => s && s.spaceSelection && s.spaceSelection.ready);

    combatLog.info(` ${readyPlayers.length}/${allSockets.length} players ready`);

    // Check if player requested solo mode (vs AI)
    const soloMode = data.soloMode === true;

    // Start combat if: (1) 2 players ready, OR (2) solo mode with 1 player
    if (readyPlayers.length >= 2 || (soloMode && readyPlayers.length === 1)) {
      const player1 = readyPlayers[0];
      const player2 = soloMode && readyPlayers.length === 1 ? createDummyPlayer(player1) : readyPlayers[1];

      if (soloMode && readyPlayers.length === 1) {
        combatLog.info(` SOLO MODE: Starting with AI opponent`);
      } else {
        combatLog.info(` MULTIPLAYER MODE: Both players ready`);
      }

      // Use the last player's range selection
      const finalRange = player2.spaceSelection.range || player1.spaceSelection.range || 'Short';

      combatLog.info(` Starting! Range: ${finalRange}`);
      combatLog.info(` Ships: ${player1.spaceSelection.ship} vs ${player2.spaceSelection.ship}`);

      // Broadcast combat start to both players
      io.emit('space:combatStart', {
        range: finalRange,
        ships: {
          player1: player1.spaceSelection.ship,
          player2: player2.spaceSelection.ship
        }
      });

      // Reset ready state
      readyPlayers.forEach(s => {
        if (s && s.spaceSelection) {
          s.spaceSelection.ready = false;
        }
      });

      // Initialize combat state
      const combatId = `${player1.id}_${player2.id}`;
      if (!activeCombats.has(combatId)) {
        // Helper function to create player combat data from ship selection
        const createPlayerData = (player) => {
          const shipType = player.spaceSelection.ship;
          const shipData = SHIPS[shipType];
          const crew = generateDefaultCrew(shipType);

          // STAGE 11: Initialize ammo for each weapon type
          const ammo = {
            missiles: 12,
            sandcaster: 20
          };

          return {
            id: player.id,
            name: shipData ? shipData.name : shipType,
            ship: shipType,
            hull: shipData ? shipData.hull : 20,
            maxHull: shipData ? shipData.maxHull : 20,
            armor: shipData ? shipData.armor : 2,
            pilotSkill: shipData ? shipData.pilotSkill : 0,
            turrets: shipType === 'scout' ? 1 : 2,
            crew: crew,
            criticals: [],
            ammo: ammo
          };
        };

        // STAGE 11: Create missile tracker for this combat
        const missileTracker = new MissileTracker();

        activeCombats.set(combatId, {
          id: combatId,
          player1: createPlayerData(player1),
          player2: createPlayerData(player2),
          range: finalRange,
          round: 1,
          activePlayer: player1.id,
          turnComplete: { [player1.id]: false, [player2.id]: false },
          missileTracker: missileTracker,
          startTime: Date.now(),
          lastActivity: Date.now(),
          history: []
        });
        combatLog.info(` Combat state initialized: ${combatId}`);

        // Notify both players who goes first (Player 1 always starts)
        const turnChangeData = {
          activePlayer: player1.id,
          round: 1
        };
        emitToPlayer(io, player1.id, 'space:turnChange', turnChangeData);
        emitToPlayer(io, player2.id, 'space:turnChange', turnChangeData);
        combatLog.info(` Initial turn set to player1: ${player1.id}`);
      }
    }
  });

  // ======== STAGE 8.8: SPACE COMBAT RESOLUTION ========

  // Handle fire action
  socket.on('space:fire', (data) => {
    if (!checkRateLimit(socket.id)) {
      socketLog.warn(`⛔ Player ${connectionId} rate limited (space:fire)`);
      socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
      return;
    }

    updateConnectionActivity(socket.id);
    combatLog.info(`[SPACE:FIRE] Player ${connectionId} firing`, data);

    // Find combat for this player
    let combat = null;
    let attackerPlayer = null;
    let defenderPlayer = null;
    let attackerSocket = null;
    let defenderSocket = null;

    for (const [combatId, c] of activeCombats.entries()) {
      if (c.player1.id === socket.id) {
        combat = c;
        attackerPlayer = c.player1;
        defenderPlayer = c.player2;
        attackerSocket = socket;
        defenderSocket = io.sockets.sockets.get(c.player2.id);
        state.updateCombatActivity(combatId);
        break;
      } else if (c.player2.id === socket.id) {
        combat = c;
        attackerPlayer = c.player2;
        defenderPlayer = c.player1;
        attackerSocket = socket;
        defenderSocket = io.sockets.sockets.get(c.player1.id);
        state.updateCombatActivity(combatId);
        break;
      }
    }

    if (!combat) {
      combatLog.info(`[SPACE:FIRE] No active combat found for player ${connectionId}`);
      return;
    }

    // Check if it's this player's turn
    if (combat.activePlayer !== socket.id) {
      combatLog.info(`[SPACE:FIRE] Not player's turn: ${connectionId}`);
      socket.emit('space:notYourTurn', { message: 'Wait for your turn!' });
      return;
    }

    // STAGE 11: Check if player has already fired this round
    if (combat.turnComplete[socket.id]) {
      combatLog.info(`[SPACE:FIRE] Player already fired this round: ${connectionId}`);
      socket.emit('space:alreadyFired', { message: 'You already fired this round!' });
      return;
    }

    // Resolve attack using combat library
    const shipData = SHIPS[attackerPlayer.ship];
    const weaponIndex = data.weapon || 0;
    const weaponObj = shipData && shipData.weapons ? shipData.weapons[weaponIndex] : null;

    const attackResult = resolveAttack(
      attackerPlayer,
      defenderPlayer,
      {
        range: combat.range.toLowerCase(),
        weapon: weaponObj
      }
    );

    combatLog.info(`[SPACE:FIRE] Attack result:`, attackResult);

    if (attackResult.hit) {
      // Apply damage
      defenderPlayer.hull -= attackResult.damage;
      if (defenderPlayer.hull < 0) defenderPlayer.hull = 0;

      combatLog.info(`[SPACE:FIRE] HIT! ${attackResult.damage} damage. Hull: ${defenderPlayer.hull}/${defenderPlayer.maxHull}`);

      // Safe emit to attacker
      if (attackerSocket && attackerSocket.connected) {
        attackerSocket.emit('space:attackResult', {
          hit: true,
          damage: attackResult.damage,
          targetHull: defenderPlayer.hull,
          attackRoll: attackResult.attackRoll,
          total: attackResult.total
        });
      } else {
        socketLog.error(` Attacker socket disconnected during combat! Combat: ${combat.id}, Attacker: ${attackerPlayer.id}`);
      }

      // Safe emit to defender (skip AI)
      if (!isDummyAI(defenderPlayer.id)) {
        if (defenderSocket && defenderSocket.connected) {
          defenderSocket.emit('space:attacked', {
            hit: true,
            damage: attackResult.damage,
            hull: defenderPlayer.hull,
            maxHull: defenderPlayer.maxHull
          });
        } else {
          // Real player disconnected - forfeit combat
          socketLog.error(` Defender socket disconnected during combat! Combat: ${combat.id}, Defender: ${defenderPlayer.id}`);
          combatLog.info(`[SPACE:FORFEIT] ${defenderPlayer.id} disconnected, awarding victory to ${attackerPlayer.id}`);

          activeCombats.delete(combat.id);

          if (attackerSocket && attackerSocket.connected) {
            attackerSocket.emit('space:combatEnd', {
              winner: attackerPlayer.id === combat.player1.id ? 'player1' : 'player2',
              loser: defenderPlayer.id === combat.player1.id ? 'player1' : 'player2',
              reason: 'opponent_disconnected',
              finalHull: {
                player1: combat.player1.hull,
                player2: combat.player2.hull
              },
              rounds: combat.round
            });
          }
          return;
        }
      }

      // Check for critical hits
      const hullPercent = (defenderPlayer.hull / defenderPlayer.maxHull) * 100;
      if (hullPercent <= 50 && attackResult.damage > 0 && Math.random() < 0.3) {
        const criticalSystems = ['Turret', 'Sensors', 'Maneuver Drive', 'Jump Drive', 'Power Plant'];
        const criticalSystem = criticalSystems[Math.floor(Math.random() * criticalSystems.length)];

        defenderPlayer.criticals.push(criticalSystem);

        const criticalData = {
          target: defenderPlayer.id === combat.player1.id ? 'player1' : 'player2',
          system: criticalSystem,
          damage: attackResult.damage
        };

        if (attackerSocket && attackerSocket.connected) {
          attackerSocket.emit('space:critical', criticalData);
        }

        if (defenderSocket && defenderSocket.connected) {
          defenderSocket.emit('space:critical', criticalData);
        }

        combatLog.info(`[SPACE:CRITICAL] ${criticalSystem} damaged!`);
      }

      // Check for victory
      if (defenderPlayer.hull <= 0) {
        const winner = attackerPlayer.id === combat.player1.id ? 'player1' : 'player2';
        const loser = defenderPlayer.id === combat.player1.id ? 'player1' : 'player2';

        combatLog.info(`[SPACE:VICTORY] ${winner} wins! ${loser} destroyed.`);

        const victoryData = {
          winner,
          loser,
          finalHull: {
            player1: combat.player1.hull,
            player2: combat.player2.hull
          },
          rounds: combat.round
        };

        if (attackerSocket && attackerSocket.connected) {
          attackerSocket.emit('space:combatEnd', victoryData);
        }

        if (defenderSocket && defenderSocket.connected) {
          defenderSocket.emit('space:combatEnd', victoryData);
        }

        activeCombats.delete(combat.id);
        return;
      }
    } else {
      combatLog.info(`[SPACE:FIRE] MISS!`);

      if (attackerSocket && attackerSocket.connected) {
        attackerSocket.emit('space:attackResult', {
          hit: false,
          attackRoll: attackResult.attackRoll,
          total: attackResult.total,
          targetNumber: attackResult.targetNumber
        });
      }

      // Skip emit if defender is AI
      if (!isDummyAI(defenderPlayer.id)) {
        if (defenderSocket && defenderSocket.connected) {
          defenderSocket.emit('space:attacked', { hit: false });
        } else {
          // Real player disconnected - forfeit
          combatLog.info(`[SPACE:FORFEIT] ${defenderPlayer.id} disconnected during miss, awarding victory to ${attackerPlayer.id}`);

          activeCombats.delete(combat.id);

          if (attackerSocket && attackerSocket.connected) {
            attackerSocket.emit('space:combatEnd', {
              winner: attackerPlayer.id === combat.player1.id ? 'player1' : 'player2',
              loser: defenderPlayer.id === combat.player1.id ? 'player1' : 'player2',
              reason: 'opponent_disconnected',
              finalHull: {
                player1: combat.player1.hull,
                player2: combat.player2.hull
              },
              rounds: combat.round
            });
          }
          return;
        }
      }
    }

    // Mark turn as complete for this player
    combat.turnComplete[socket.id] = true;

    // Handle round/turn transitions
    handleTurnTransition(combat, io, executeAITurn);
  });

  // STAGE 11: Handle missile launch
  socket.on('space:launchMissile', (data) => {
    if (!checkRateLimit(socket.id)) {
      socketLog.warn(`⛔ Player ${connectionId} rate limited (space:launchMissile)`);
      socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
      return;
    }

    updateConnectionActivity(socket.id);
    combatLog.info(`[SPACE:MISSILE] Player ${connectionId} launching missile`);

    // Find combat for this player
    let combat = null;
    for (const [combatId, c] of activeCombats.entries()) {
      if (c.player1.id === socket.id || c.player2.id === socket.id) {
        combat = c;
        break;
      }
    }

    if (!combat) {
      combatLog.info(`[SPACE:MISSILE] No active combat found for player ${connectionId}`);
      socket.emit('space:error', { message: 'No active combat found' });
      return;
    }

    // Determine attacker and defender
    const isPlayer1 = socket.id === combat.player1.id;
    const attackerPlayer = isPlayer1 ? combat.player1 : combat.player2;
    const defenderPlayer = isPlayer1 ? combat.player2 : combat.player1;
    const attackerSocket = socket;
    const defenderSocket = io.sockets.sockets.get(defenderPlayer.id);

    // Check if it's this player's turn
    if (combat.activePlayer !== socket.id) {
      combatLog.info(`[SPACE:MISSILE] Not player's turn: ${connectionId}`);
      socket.emit('space:notYourTurn', { message: 'Wait for your turn!' });
      return;
    }

    // Check if player has already fired this round
    if (combat.turnComplete[socket.id]) {
      combatLog.info(`[SPACE:MISSILE] Player already fired this round: ${connectionId}`);
      socket.emit('space:alreadyFired', { message: 'You already fired this round!' });
      return;
    }

    // Check missile ammo
    if (attackerPlayer.ammo.missiles <= 0) {
      combatLog.info(`[SPACE:MISSILE] No missile ammo remaining: ${connectionId}`);
      socket.emit('space:noAmmo', { message: 'No missiles remaining!' });
      return;
    }

    // Launch missile
    const missile = combat.missileTracker.launchMissile({
      attackerId: attackerPlayer.id,
      defenderId: defenderPlayer.id,
      currentRange: combat.range.toLowerCase(),
      round: combat.round
    });

    // Decrement ammo
    attackerPlayer.ammo.missiles--;

    combatLog.info(`[SPACE:MISSILE] Missile launched: ${missile.id} from ${attackerPlayer.name} to ${defenderPlayer.name} at ${missile.launchRange}`);

    // Emit to both players
    const missileData = {
      missileId: missile.id,
      attacker: attackerPlayer.name,
      defender: defenderPlayer.name,
      currentRange: missile.currentRange,
      ammoRemaining: attackerPlayer.ammo.missiles
    };

    if (attackerSocket && attackerSocket.connected) {
      attackerSocket.emit('space:missileLaunched', { ...missileData, isAttacker: true });
    }

    if (defenderSocket && defenderSocket.connected) {
      defenderSocket.emit('space:missileLaunched', { ...missileData, isAttacker: false });
    }

    // Mark turn as complete for this player
    combat.turnComplete[socket.id] = true;

    // Handle round/turn transitions (with missile updates)
    handleMissileTurnTransition(combat, io, activeCombats, executeAITurn);
  });

  // STAGE 11: Handle point defense against missiles
  socket.on('space:pointDefense', (data) => {
    if (!checkRateLimit(socket.id)) {
      socketLog.warn(`⛔ Player ${connectionId} rate limited (space:pointDefense)`);
      socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
      return;
    }

    updateConnectionActivity(socket.id);
    combatLog.info(`[SPACE:POINT_DEFENSE] Player ${connectionId} using point defense against ${data.missileId}`);

    // Find combat for this player
    let combat = null;
    for (const [combatId, c] of activeCombats.entries()) {
      if (c.player1.id === socket.id || c.player2.id === socket.id) {
        combat = c;
        break;
      }
    }

    if (!combat) {
      combatLog.info(`[SPACE:POINT_DEFENSE] No active combat found for player ${connectionId}`);
      socket.emit('space:error', { message: 'No active combat found' });
      return;
    }

    // Determine defender
    const isPlayer1 = socket.id === combat.player1.id;
    const defenderPlayer = isPlayer1 ? combat.player1 : combat.player2;

    // Attempt point defense
    const result = combat.missileTracker.pointDefense(
      data.missileId,
      defenderPlayer,
      defenderPlayer.crew.gunner || 0
    );

    if (!result.success) {
      combatLog.info(`[SPACE:POINT_DEFENSE] Point defense failed: ${result.reason}`);
      socket.emit('space:error', { message: `Point defense failed: ${result.reason}` });
      return;
    }

    combatLog.info(`[SPACE:POINT_DEFENSE] Result: ${result.destroyed ? 'DESTROYED' : 'MISSED'} (roll: ${result.total})`);

    // Emit to both players
    const pdData = {
      missileId: data.missileId,
      destroyed: result.destroyed,
      roll: result.roll,
      total: result.total,
      defender: defenderPlayer.name
    };

    const p1Socket = io.sockets.sockets.get(combat.player1.id);
    const p2Socket = io.sockets.sockets.get(combat.player2.id);

    if (p1Socket && p1Socket.connected) {
      p1Socket.emit('space:pointDefenseResult', pdData);
    }

    if (p2Socket && p2Socket.connected) {
      p2Socket.emit('space:pointDefenseResult', pdData);
    }
  });

  // STAGE 11: Handle sandcaster defense
  socket.on('space:useSandcaster', (data) => {
    if (!checkRateLimit(socket.id)) {
      socketLog.warn(`⛔ Player ${connectionId} rate limited (space:useSandcaster)`);
      socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
      return;
    }

    updateConnectionActivity(socket.id);
    combatLog.info(`[SPACE:SANDCASTER] Player ${connectionId} using sandcaster`);

    // Find combat for this player
    let combat = null;
    for (const [combatId, c] of activeCombats.entries()) {
      if (c.player1.id === socket.id || c.player2.id === socket.id) {
        combat = c;
        break;
      }
    }

    if (!combat) {
      combatLog.info(`[SPACE:SANDCASTER] No active combat found for player ${connectionId}`);
      socket.emit('space:error', { message: 'No active combat found' });
      return;
    }

    // Determine defender
    const isPlayer1 = socket.id === combat.player1.id;
    const defenderPlayer = isPlayer1 ? combat.player1 : combat.player2;

    // Check range (sandcasters only work at adjacent or close)
    if (!canUseSandcaster(combat.range.toLowerCase())) {
      combatLog.info(`[SPACE:SANDCASTER] Cannot use sandcaster at ${combat.range}`);
      socket.emit('space:error', { message: 'Sandcasters only work at adjacent or close range' });
      return;
    }

    // Check ammo
    if (defenderPlayer.ammo.sandcaster <= 0) {
      combatLog.info(`[SPACE:SANDCASTER] No sandcaster ammo remaining: ${connectionId}`);
      socket.emit('space:noAmmo', { message: 'No sandcaster ammo remaining!' });
      return;
    }

    // Use sandcaster
    const result = useSandcaster({
      gunnerSkill: defenderPlayer.crew.gunner || 0,
      attackType: data.attackType || 'laser',
      ammoRemaining: defenderPlayer.ammo.sandcaster
    });

    // Decrement ammo
    defenderPlayer.ammo.sandcaster--;

    combatLog.info(`[SPACE:SANDCASTER] Result: ${result.success ? 'SUCCESS' : 'FAILED'} (armor bonus: ${result.armorBonus})`);

    // Emit result back to defender
    const sandData = {
      success: result.success,
      armorBonus: result.armorBonus,
      roll: result.roll,
      total: result.total,
      ammoRemaining: defenderPlayer.ammo.sandcaster
    };

    socket.emit('space:sandcasterResult', sandData);

    // Store temporary armor bonus for this attack (if successful)
    if (result.success) {
      defenderPlayer.tempArmorBonus = result.armorBonus;
      combatLog.info(`[SPACE:SANDCASTER] Temporary armor bonus: +${result.armorBonus}`);
    }
  });

  // Handle end turn
  socket.on('space:endTurn', () => {
    if (!checkRateLimit(socket.id)) {
      socketLog.warn(`⛔ Player ${connectionId} rate limited (space:endTurn)`);
      socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
      return;
    }

    updateConnectionActivity(socket.id);
    combatLog.info(`[SPACE:END_TURN] Player ${connectionId} ending turn`);

    // Find combat for this player
    let combat = null;
    for (const [combatId, c] of activeCombats.entries()) {
      if (c.player1.id === socket.id || c.player2.id === socket.id) {
        combat = c;
        break;
      }
    }

    if (!combat) {
      combatLog.info(`[SPACE:END_TURN] No active combat found for player ${connectionId}`);
      return;
    }

    // Mark turn as complete for this player
    combat.turnComplete[socket.id] = true;

    combatLog.info(`[SPACE:END_TURN] Turn complete for ${connectionId}`);

    // Handle round/turn transitions
    handleTurnTransition(combat, io, executeAITurn);
  });

  // SOLO MODE: Handle battle abandon
  socket.on('space:abandonBattle', () => {
    combatLog.info(`[SOLO MODE] Player ${connectionId} abandoned battle`);

    // Find and cleanup combat state
    let combatId = null;
    for (const [id, combat] of activeCombats.entries()) {
      if (combat.player1.id === socket.id || combat.player2.id === socket.id) {
        combatId = id;
        break;
      }
    }

    if (combatId) {
      activeCombats.delete(combatId);
      combatLog.info(`[SOLO MODE] Combat ${combatId} cleaned up after abandon`);
    }

    // Reset player state
    socket.spaceSelection = null;

    // Send confirmation
    socket.emit('space:battleAbandoned');
  });
}

/**
 * Handle turn/round transitions after an action
 */
function handleTurnTransition(combat, io, executeAITurn) {
  // Check if both players have completed their turns
  if (combat.turnComplete[combat.player1.id] && combat.turnComplete[combat.player2.id]) {
    // Start new round
    combat.round++;
    combat.turnComplete = { [combat.player1.id]: false, [combat.player2.id]: false };

    // Player 1 goes first on odd rounds, Player 2 on even rounds
    combat.activePlayer = (combat.round % 2 === 1) ? combat.player1.id : combat.player2.id;

    combatLog.info(`[SPACE:ROUND] Starting round ${combat.round}, active player: ${combat.activePlayer === combat.player1.id ? 'Player 1' : 'Player 2'}`);

    const newRoundData = {
      round: combat.round,
      player1Hull: combat.player1.hull,
      player2Hull: combat.player2.hull,
      activePlayer: combat.activePlayer
    };

    // Emit to both players with safety checks (skips dummy AI)
    emitToPlayer(io, combat.player1.id, 'space:newRound', newRoundData);
    emitToPlayer(io, combat.player2.id, 'space:newRound', newRoundData);

    // SOLO MODE: If new round starts with AI turn, execute it
    if (isDummyAI(combat.activePlayer)) {
      combatLog.info(`[SOLO MODE] New round starts with AI turn, executing...`);
      setTimeout(() => {
        executeAITurn(combat, io);
      }, 1500);
    }
  } else {
    // Switch active player
    combat.activePlayer = combat.activePlayer === combat.player1.id ? combat.player2.id : combat.player1.id;

    const turnChangeData = {
      activePlayer: combat.activePlayer,
      round: combat.round
    };

    // Emit to both players with safety checks (skips dummy AI)
    emitToPlayer(io, combat.player1.id, 'space:turnChange', turnChangeData);
    emitToPlayer(io, combat.player2.id, 'space:turnChange', turnChangeData);

    combatLog.info(`[SPACE:TURN_CHANGE] Active player: ${combat.activePlayer}`);

    // SOLO MODE: If it's dummy AI's turn, execute AI action automatically
    if (isDummyAI(combat.activePlayer)) {
      combatLog.info(`[SOLO MODE] AI turn detected, executing AI action...`);
      setTimeout(() => {
        executeAITurn(combat, io);
      }, 1000);
    }
  }
}

/**
 * Handle turn/round transitions with missile updates
 */
function handleMissileTurnTransition(combat, io, activeCombats, executeAITurn) {
  // Check if both players have completed their turns
  if (combat.turnComplete[combat.player1.id] && combat.turnComplete[combat.player2.id]) {
    // Start new round
    combat.round++;
    combat.turnComplete = { [combat.player1.id]: false, [combat.player2.id]: false };

    // STAGE 11: Update missiles at start of new round
    const missileUpdates = combat.missileTracker.updateMissiles(combat.round);

    combatLog.info(`[SPACE:ROUND] Starting round ${combat.round}, ${missileUpdates.length} missile updates`);

    // Process missile updates
    for (const update of missileUpdates) {
      if (update.action === 'moved') {
        combatLog.info(`[SPACE:MISSILE] ${update.missileId} moved to ${update.newRange}`);

        const moveData = {
          missileId: update.missileId,
          newRange: update.newRange,
          oldRange: update.oldRange
        };

        const p1Socket = io.sockets.sockets.get(combat.player1.id);
        const p2Socket = io.sockets.sockets.get(combat.player2.id);

        if (p1Socket && p1Socket.connected) {
          p1Socket.emit('space:missileMoved', moveData);
        }

        if (p2Socket && p2Socket.connected) {
          p2Socket.emit('space:missileMoved', moveData);
        }
      } else if (update.action === 'impact') {
        // Missile reached target - resolve impact
        const impactResult = combat.missileTracker.resolveMissileImpact(update.missileId);

        if (impactResult.hit) {
          // Apply damage to defender
          const missile = impactResult.missile;
          const defender = missile.target === combat.player1.id ? combat.player1 : combat.player2;
          defender.hull -= impactResult.damage;
          if (defender.hull < 0) defender.hull = 0;

          combatLog.info(`[SPACE:MISSILE] ${update.missileId} IMPACT! ${impactResult.damage} damage. Hull: ${defender.hull}/${defender.maxHull}`);

          const impactData = {
            missileId: update.missileId,
            hit: true,
            damage: impactResult.damage,
            damageRoll: impactResult.damageRoll,
            targetHull: defender.hull,
            targetMaxHull: defender.maxHull
          };

          const p1Socket = io.sockets.sockets.get(combat.player1.id);
          const p2Socket = io.sockets.sockets.get(combat.player2.id);

          if (p1Socket && p1Socket.connected) {
            p1Socket.emit('space:missileImpact', impactData);
          }

          if (p2Socket && p2Socket.connected) {
            p2Socket.emit('space:missileImpact', impactData);
          }

          // Check for victory
          if (defender.hull <= 0) {
            const winner = defender.id === combat.player1.id ? 'player2' : 'player1';
            const loser = defender.id === combat.player1.id ? 'player1' : 'player2';

            combatLog.info(`[SPACE:VICTORY] ${winner} wins! ${loser} destroyed by missile.`);

            const victoryData = {
              winner,
              loser,
              finalHull: {
                player1: combat.player1.hull,
                player2: combat.player2.hull
              },
              rounds: combat.round
            };

            if (p1Socket && p1Socket.connected) {
              p1Socket.emit('space:combatEnd', victoryData);
            }

            if (p2Socket && p2Socket.connected) {
              p2Socket.emit('space:combatEnd', victoryData);
            }

            // Clean up combat
            activeCombats.delete(combat.id);
            return;
          }
        }
      }
    }

    const newRoundData = {
      round: combat.round,
      player1Hull: combat.player1.hull,
      player2Hull: combat.player2.hull,
      activePlayer: combat.activePlayer
    };

    // Emit to both players with safety checks
    const p1Socket = io.sockets.sockets.get(combat.player1.id);
    const p2Socket = io.sockets.sockets.get(combat.player2.id);

    if (p1Socket && p1Socket.connected) {
      p1Socket.emit('space:newRound', newRoundData);
    }

    if (p2Socket && p2Socket.connected) {
      p2Socket.emit('space:newRound', newRoundData);
    }

    combatLog.info(`[SPACE:ROUND] Round ${combat.round} notifications sent`);
  } else {
    // Switch active player
    combat.activePlayer = combat.activePlayer === combat.player1.id ? combat.player2.id : combat.player1.id;

    const turnChangeData = {
      activePlayer: combat.activePlayer,
      round: combat.round
    };

    const p1Socket = io.sockets.sockets.get(combat.player1.id);
    const p2Socket = io.sockets.sockets.get(combat.player2.id);

    if (p1Socket && p1Socket.connected) {
      p1Socket.emit('space:turnChange', turnChangeData);
    }

    if (p2Socket && p2Socket.connected) {
      p2Socket.emit('space:turnChange', turnChangeData);
    }

    combatLog.info(`[SPACE:TURN_CHANGE] Active player: ${combat.activePlayer}`);

    // SOLO MODE: If it's dummy AI's turn, execute AI action automatically
    if (isDummyAI(combat.activePlayer)) {
      combatLog.info(`[SOLO MODE] AI turn detected after missile launch, executing AI action...`);
      setTimeout(() => {
        executeAITurn(combat, io);
      }, 1000);
    }
  }
}

module.exports = {
  register
};

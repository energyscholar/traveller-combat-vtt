/**
 * Legacy Ground Combat Socket Handlers
 * Handles ground combat system (original gameplay mode)
 * - hello, combat, engineerRepair, moveShip, resetGame, startGame, endTurn
 */

const { socket: socketLog, game: gameLog, combat: combatLog } = require('../logger');
const { resolveAttack, getAttackBreakdown, SHIPS, applyCrew, engineerRepair, hexDistance, rangeFromDistance, validateMove } = require('../combat');

/**
 * Register legacy ground combat handlers
 * @param {Socket} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance
 * @param {Object} deps - Dependencies { connections, shipState, gameState, connectionId, getShipAssignments, startNewRound, endTurn, resetShipStates, resetGameState }
 */
function register(socket, io, deps) {
  const {
    connections,
    shipState,
    gameState,
    connectionId,
    getShipAssignments,
    startNewRound,
    endTurn: endTurnFn,
    resetShipStates,
    resetGameState
  } = deps;

  const conn = connections.get(socket.id);

  // Handle "hello" messages (Stage 1)
  socket.on('hello', (data) => {
    const timestamp = Date.now();
    socketLog.info(` Tab ${connectionId} says hello`);

    io.emit('helloReceived', {
      fromTab: connectionId,
      message: data.message || 'Hello!',
      timestamp: timestamp,
      serverTime: timestamp
    });
  });

  // Handle combat action (Stage 4 - UPDATED with turn validation)
  socket.on('combat', (data) => {
    const conn = connections.get(socket.id);

    combatLog.info(` Player ${connectionId} (${conn.ship}) initiates combat`);
    combatLog.info(` Attacker: ${data.attacker}, Target: ${data.target}`);
    combatLog.info(` Range: ${data.range}, Dodge: ${data.dodge}`);

    // Stage 3: Validate player can only control their assigned ship
    if (conn.ship !== data.attacker) {
      combatLog.info(` REJECTED: Player ${connectionId} tried to attack with ${data.attacker} but controls ${conn.ship}`);
      socket.emit('combatError', {
        message: `You can only attack with your assigned ship (${conn.ship || 'none'})`,
        yourShip: conn.ship,
        attemptedShip: data.attacker
      });
      return;
    }

    // Stage 4: Validate it's the player's turn
    if (gameState.currentRound > 0 && conn.ship !== gameState.currentTurn) {
      combatLog.info(` REJECTED: Not ${conn.ship}'s turn (current: ${gameState.currentTurn})`);
      socket.emit('combatError', {
        message: `It's not your turn! Current turn: ${gameState.currentTurn || 'game not started'}`,
        currentTurn: gameState.currentTurn
      });
      return;
    }

    // Get base ships for stats
    const attackerBase = SHIPS[data.attacker];
    const targetBase = SHIPS[data.target];

    if (!attackerBase || !targetBase) {
      socket.emit('combatError', { message: 'Invalid ship' });
      return;
    }

    // Stage 5: Get selected weapon
    const weaponId = data.weapon || (attackerBase.weapons && attackerBase.weapons[0].id);
    const weapon = attackerBase.weapons.find(w => w.id === weaponId);

    if (!weapon) {
      socket.emit('combatError', { message: 'Invalid weapon selected' });
      return;
    }

    combatLog.info(` Weapon: ${weapon.name}`);

    // Stage 5: Validate ammo if weapon uses ammo
    if (weapon.ammo !== null) {
      const currentAmmo = shipState[data.attacker].ammo[weapon.id];
      if (currentAmmo <= 0) {
        combatLog.info(` REJECTED: Out of ammo for ${weapon.name}`);
        socket.emit('combatError', {
          message: `Out of ammo for ${weapon.name}!`
        });
        return;
      }
      combatLog.info(` ${weapon.name} ammo: ${currentAmmo}`);
    }

    // Stage 5: Validate range restriction
    if (weapon.rangeRestriction && !weapon.rangeRestriction.includes(data.range)) {
      combatLog.info(` REJECTED: ${weapon.name} out of range (${data.range})`);
      socket.emit('combatError', {
        message: `${weapon.name} out of range! Valid ranges: ${weapon.rangeRestriction.join(', ')}`
      });
      return;
    }

    // Use current ship state (with current hull values)
    let attackerShip = {
      ...attackerBase,
      hull: shipState[data.attacker].hull
    };
    const targetShip = {
      ...targetBase,
      hull: shipState[data.target].hull
    };

    // Stage 6: Apply crew to attacker ship
    if (shipState[data.attacker].crew) {
      attackerShip = applyCrew(attackerShip, shipState[data.attacker].crew);
    }

    // Check if target is already destroyed
    if (targetShip.hull <= 0) {
      socket.emit('combatError', {
        message: `${targetBase.name} is already destroyed!`
      });
      return;
    }

    // Stage 5: Resolve combat with weapon
    const result = resolveAttack(attackerShip, targetShip, {
      range: data.range,
      dodge: data.dodge,
      seed: data.seed,
      weapon: weapon
    });

    const breakdown = getAttackBreakdown(result);

    combatLog.info(` Result: ${result.hit ? 'HIT' : 'MISS'} with ${weapon.name}`);

    // Stage 5: Decrement ammo if weapon uses ammo (regardless of hit/miss)
    if (weapon.ammo !== null) {
      const oldAmmo = shipState[data.attacker].ammo[weapon.id];
      shipState[data.attacker].ammo[weapon.id]--;
      combatLog.info(` ${weapon.name}: ${oldAmmo} → ${shipState[data.attacker].ammo[weapon.id]}`);
    }

    if (result.hit) {
      combatLog.info(` Damage: ${result.damage} (${targetShip.hull} → ${result.newHull} hull)`);

      // Update persistent ship state
      const oldHull = shipState[data.target].hull;
      shipState[data.target].hull = result.newHull;

      combatLog.info(` ${targetBase.name} hull: ${oldHull} → ${shipState[data.target].hull}`);

      // Check for victory
      if (shipState[data.target].hull <= 0) {
        combatLog.info(` ${attackerBase.name} has destroyed ${targetBase.name}!`);
      }
    }

    // Broadcast result to all tabs
    io.emit('combatResult', {
      fromPlayer: connectionId,
      result: result,
      breakdown: breakdown,
      timestamp: Date.now()
    });

    // Broadcast updated ship states (hull + ammo)
    io.emit('shipStateUpdate', {
      ships: shipState
    });
  });

  // Stage 6: Handle engineer repair action
  socket.on('engineerRepair', (data) => {
    const conn = connections.get(socket.id);
    combatLog.info(` Player ${connectionId} (${conn.ship}) requests engineer repair`);

    // Validate player controls this ship
    if (conn.ship !== data.ship) {
      socket.emit('repairError', {
        message: `You can only repair your assigned ship (${conn.ship || 'none'})`
      });
      return;
    }

    // Validate it's the player's turn
    if (gameState.currentRound > 0 && conn.ship !== gameState.currentTurn) {
      socket.emit('repairError', {
        message: `It's not your turn! Current turn: ${gameState.currentTurn || 'game not started'}`
      });
      return;
    }

    // Check if engineer is alive
    const engineer = shipState[data.ship].crew.engineer;
    if (!engineer || engineer.health <= 0) {
      socket.emit('repairError', {
        message: 'Engineer is dead or not assigned!'
      });
      return;
    }

    // Perform repair
    const shipToRepair = {
      ...SHIPS[data.ship],
      hull: shipState[data.ship].hull,
      maxHull: shipState[data.ship].maxHull
    };

    const repairResult = engineerRepair(shipToRepair, engineer, { seed: data.seed });

    combatLog.info(` ${engineer.name} repairs ${repairResult.hullRepaired} HP (${shipToRepair.hull} → ${repairResult.newHull})`);

    // Update ship state
    shipState[data.ship].hull = repairResult.newHull;

    // Broadcast repair result to all players
    io.emit('repairResult', {
      ship: data.ship,
      engineer: engineer.name,
      hullRepaired: repairResult.hullRepaired,
      newHull: repairResult.newHull,
      fromPlayer: connectionId
    });

    // Broadcast updated ship states
    io.emit('shipStateUpdate', {
      ships: shipState
    });
  });

  // Stage 7: Handle ship movement
  socket.on('moveShip', (data) => {
    const conn = connections.get(socket.id);
    combatLog.info(` Player ${connectionId} (${conn.ship}) requests move to (${data.to.q}, ${data.to.r})`);

    // Validate player controls this ship
    if (conn.ship !== data.ship) {
      socket.emit('moveError', {
        message: `You can only move your assigned ship (${conn.ship || 'none'})`
      });
      return;
    }

    // Validate it's the player's turn
    if (gameState.currentRound > 0 && conn.ship !== gameState.currentTurn) {
      socket.emit('moveError', {
        message: `It's not your turn! Current turn: ${gameState.currentTurn || 'game not started'}`
      });
      return;
    }

    // Get current position and movement points
    const from = shipState[data.ship].position;
    const movementPoints = shipState[data.ship].movement;

    // Validate move
    const moveResult = validateMove(from, data.to, movementPoints);

    if (!moveResult.valid) {
      combatLog.info(` REJECTED: ${moveResult.error}`);
      socket.emit('moveError', {
        message: moveResult.error
      });
      return;
    }

    // Check if destination is occupied by another ship
    const otherShip = data.ship === 'scout' ? 'free_trader' : 'scout';
    const otherPos = shipState[otherShip].position;
    if (otherPos.q === data.to.q && otherPos.r === data.to.r) {
      socket.emit('moveError', {
        message: 'Destination hex is occupied!'
      });
      return;
    }

    // Execute move
    const oldPosition = { ...shipState[data.ship].position };
    shipState[data.ship].position = moveResult.newPosition;

    combatLog.info(` ${data.ship} moved from (${oldPosition.q},${oldPosition.r}) to (${moveResult.newPosition.q},${moveResult.newPosition.r})`);

    // Calculate new range between ships
    const scoutPos = shipState.scout.position;
    const free_traderPos = shipState.free_trader.position;
    const distance = hexDistance(scoutPos, free_traderPos);
    const range = rangeFromDistance(distance);

    combatLog.info(` Ships now at distance ${distance} (${range})`);

    // Broadcast move result to all players
    io.emit('moveResult', {
      ship: data.ship,
      from: oldPosition,
      to: moveResult.newPosition,
      distance: hexDistance(from, data.to),
      fromPlayer: connectionId,
      newRange: range
    });

    // Broadcast updated ship states
    io.emit('shipStateUpdate', {
      ships: shipState
    });
  });

  // Stage 4: Handle game reset request
  socket.on('resetGame', () => {
    gameLog.info(` Player ${connectionId} requested game reset`);
    resetShipStates();
    resetGameState();

    // Broadcast reset to all players
    io.emit('gameReset', {
      message: 'Game has been reset',
      initiatedBy: connectionId,
      currentRound: gameState.currentRound,
      currentTurn: gameState.currentTurn
    });

    // Send updated ship states
    io.emit('shipStateUpdate', {
      ships: shipState
    });
  });

  // Stage 4: Handle start game request
  socket.on('startGame', () => {
    gameLog.info(` Player ${connectionId} requested game start`);

    // Check if both players are connected
    const assignments = getShipAssignments();
    if (!assignments.scout || !assignments.free_trader) {
      socket.emit('gameError', {
        message: 'Need both Scout and Free Trader players to start game'
      });
      return;
    }

    // Start first round
    const roundData = startNewRound();

    // Broadcast to all players
    io.emit('roundStart', {
      round: roundData.round,
      initiative: roundData.initiative,
      currentTurn: roundData.currentTurn,
      message: `Round ${roundData.round} begins!`
    });
  });

  // Stage 4: Handle end turn request
  socket.on('endTurn', () => {
    const conn = connections.get(socket.id);
    gameLog.info(` Player ${connectionId} (${conn.ship}) requested end turn`);

    // Validate it's their turn
    if (conn.ship !== gameState.currentTurn) {
      socket.emit('gameError', {
        message: `It's not your turn! Current turn: ${gameState.currentTurn}`
      });
      return;
    }

    // End turn and advance
    const turnData = endTurnFn();

    if (turnData.round > gameState.currentRound - 1 || turnData.newRound === false) {
      // Normal turn change or new round
      if (turnData.initiative) {
        // New round started
        io.emit('roundStart', {
          round: turnData.round,
          initiative: turnData.initiative,
          currentTurn: turnData.currentTurn,
          message: `Round ${turnData.round} begins!`
        });
      } else {
        // Just a turn change
        io.emit('turnChange', {
          round: turnData.round,
          currentTurn: turnData.currentTurn,
          message: `${turnData.currentTurn}'s turn`
        });
      }
    }
  });
}

module.exports = {
  register
};

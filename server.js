// Traveller Combat VTT - Stage 4
// Purpose: Add combat rounds and turn system
// Time: 2-3 hours

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const { resolveAttack, formatAttackResult, getAttackBreakdown, SHIPS, CREW, applyCrew, engineerRepair } = require('./lib/combat');
const { DiceRoller } = require('./lib/dice');

// Serve static files from public directory
app.use(express.static('public'));
app.use(express.json());

// Track connections and ship assignments
let connectionCount = 0;
const connections = new Map();

// Stage 5: Initialize ammo for each weapon
function initializeAmmo(ship) {
  const ammo = {};
  ship.weapons.forEach(weapon => {
    if (weapon.ammo !== null) {
      ammo[weapon.id] = weapon.ammo;
    }
  });
  return ammo;
}

// Stage 3: Track persistent ship state (hull, etc.)
// Stage 5: Added ammo tracking
// Stage 6: Added crew assignments
const shipState = {
  scout: {
    hull: SHIPS.scout.hull,
    maxHull: SHIPS.scout.maxHull,
    armor: SHIPS.scout.armor,
    pilotSkill: SHIPS.scout.pilotSkill,
    ammo: initializeAmmo(SHIPS.scout),  // Stage 5: Track ammo per weapon
    crew: {  // Stage 6: Track crew assignments
      pilot: {...CREW.scout[0]},  // Default: assign all crew
      gunner: {...CREW.scout[1]},
      engineer: {...CREW.scout[2]}
    }
  },
  corsair: {
    hull: SHIPS.corsair.hull,
    maxHull: SHIPS.corsair.maxHull,
    armor: SHIPS.corsair.armor,
    pilotSkill: SHIPS.corsair.pilotSkill,
    ammo: initializeAmmo(SHIPS.corsair),  // Stage 5: Track ammo per weapon
    crew: {  // Stage 6: Track crew assignments
      pilot: {...CREW.corsair[0]},  // Default: assign all crew
      gunner: {...CREW.corsair[1]},
      engineer: {...CREW.corsair[2]}
    }
  }
};

// Stage 4: Track game state (rounds, turns, initiative)
const gameState = {
  currentRound: 0,
  currentTurn: null, // 'scout' or 'corsair'
  initiative: {
    scout: null,
    corsair: null
  },
  roundHistory: []
};

// Helper: Reset ship states to full hull
// Stage 5: Also reset ammo
function resetShipStates() {
  shipState.scout.hull = SHIPS.scout.maxHull;
  shipState.corsair.hull = SHIPS.corsair.maxHull;
  shipState.scout.ammo = initializeAmmo(SHIPS.scout);
  shipState.corsair.ammo = initializeAmmo(SHIPS.corsair);
  console.log('[GAME] Ship states reset (hull + ammo)');
}

// Helper: Get available ship for new player
function getAvailableShip() {
  const assignedShips = Array.from(connections.values())
    .map(conn => conn.ship)
    .filter(ship => ship !== null);

  if (!assignedShips.includes('scout')) return 'scout';
  if (!assignedShips.includes('corsair')) return 'corsair';
  return null; // No ships available (spectator mode)
}

// Helper: Get all current assignments
function getShipAssignments() {
  const assignments = { scout: null, corsair: null };
  connections.forEach((conn, socketId) => {
    if (conn.ship === 'scout') assignments.scout = conn.id;
    if (conn.ship === 'corsair') assignments.corsair = conn.id;
  });
  return assignments;
}

// Stage 4: Helper - Roll initiative for both ships
function rollInitiative() {
  const dice = new DiceRoller();

  // Roll 2d6 + pilot skill for each ship
  const scoutRoll = dice.roll2d6();
  const scoutInitiative = scoutRoll.total + shipState.scout.pilotSkill;

  const corsairRoll = dice.roll2d6();
  const corsairInitiative = corsairRoll.total + shipState.corsair.pilotSkill;

  gameState.initiative.scout = {
    roll: scoutRoll,
    total: scoutInitiative
  };

  gameState.initiative.corsair = {
    roll: corsairRoll,
    total: corsairInitiative
  };

  console.log(`[INITIATIVE] Scout: ${scoutRoll.total} + ${shipState.scout.pilotSkill} = ${scoutInitiative}`);
  console.log(`[INITIATIVE] Corsair: ${corsairRoll.total} + ${shipState.corsair.pilotSkill} = ${corsairInitiative}`);

  // Determine who goes first (handle ties by re-rolling)
  if (scoutInitiative > corsairInitiative) {
    gameState.currentTurn = 'scout';
    console.log('[INITIATIVE] Scout goes first');
  } else if (corsairInitiative > scoutInitiative) {
    gameState.currentTurn = 'corsair';
    console.log('[INITIATIVE] Corsair goes first');
  } else {
    // Tie - Scout wins ties (simple tiebreaker)
    gameState.currentTurn = 'scout';
    console.log('[INITIATIVE] Tie! Scout wins tiebreaker');
  }

  return {
    scout: gameState.initiative.scout,
    corsair: gameState.initiative.corsair,
    firstTurn: gameState.currentTurn
  };
}

// Stage 4: Helper - Start a new round
function startNewRound() {
  gameState.currentRound++;
  console.log(`[ROUND] Starting Round ${gameState.currentRound}`);

  // Roll initiative at the start of each round
  const initiativeResult = rollInitiative();

  // Add to round history
  gameState.roundHistory.push({
    round: gameState.currentRound,
    initiative: initiativeResult,
    actions: []
  });

  return {
    round: gameState.currentRound,
    initiative: initiativeResult,
    currentTurn: gameState.currentTurn
  };
}

// Stage 4: Helper - End current turn and advance to next player
function endTurn() {
  const previousTurn = gameState.currentTurn;

  // Switch to other player
  if (gameState.currentTurn === 'scout') {
    gameState.currentTurn = 'corsair';
  } else if (gameState.currentTurn === 'corsair') {
    // Corsair's turn ends, round ends, new round starts
    return startNewRound();
  }

  console.log(`[TURN] ${previousTurn} turn ended, ${gameState.currentTurn} turn begins`);

  return {
    round: gameState.currentRound,
    currentTurn: gameState.currentTurn,
    newRound: false
  };
}

// Stage 4: Helper - Reset game state (rounds and turns)
function resetGameState() {
  gameState.currentRound = 0;
  gameState.currentTurn = null;
  gameState.initiative.scout = null;
  gameState.initiative.corsair = null;
  gameState.roundHistory = [];
  console.log('[GAME] Game state reset');
}

// Socket.io connection handling
io.on('connection', (socket) => {
  connectionCount++;
  const connectionId = connectionCount;
  const assignedShip = getAvailableShip();

  connections.set(socket.id, {
    id: connectionId,
    ship: assignedShip,
    connected: Date.now()
  });

  console.log(`[CONNECT] Player ${connectionId} connected (socket: ${socket.id})`);
  console.log(`[ASSIGN] Player ${connectionId} assigned: ${assignedShip || 'spectator'}`);
  console.log(`[STATUS] ${connections.size} players connected`);

  // Send welcome with ship assignment
  socket.emit('welcome', {
    message: `You are Player ${connectionId}`,
    playerId: connectionId,
    assignedShip: assignedShip,
    role: assignedShip || 'spectator',
    totalPlayers: connections.size
  });

  // Broadcast to others that a new player joined
  socket.broadcast.emit('playerJoined', {
    playerId: connectionId,
    ship: assignedShip,
    totalPlayers: connections.size,
    assignments: getShipAssignments()
  });

  // Send current game state to new player
  socket.emit('gameState', {
    assignments: getShipAssignments(),
    totalPlayers: connections.size,
    shipStates: shipState,
    currentRound: gameState.currentRound,
    currentTurn: gameState.currentTurn,
    initiative: gameState.initiative
  });

  // Broadcast updated ship states to all players
  io.emit('shipStateUpdate', {
    ships: shipState
  });
  
  // Handle "hello" messages (Stage 1)
  socket.on('hello', (data) => {
    const timestamp = Date.now();
    console.log(`[HELLO] Tab ${connectionId} says hello`);
    
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

    console.log(`[COMBAT] Player ${connectionId} (${conn.ship}) initiates combat`);
    console.log(`[COMBAT] Attacker: ${data.attacker}, Target: ${data.target}`);
    console.log(`[COMBAT] Range: ${data.range}, Dodge: ${data.dodge}`);

    // Stage 3: Validate player can only control their assigned ship
    if (conn.ship !== data.attacker) {
      console.log(`[COMBAT] REJECTED: Player ${connectionId} tried to attack with ${data.attacker} but controls ${conn.ship}`);
      socket.emit('combatError', {
        message: `You can only attack with your assigned ship (${conn.ship || 'none'})`,
        yourShip: conn.ship,
        attemptedShip: data.attacker
      });
      return;
    }

    // Stage 4: Validate it's the player's turn
    if (gameState.currentRound > 0 && conn.ship !== gameState.currentTurn) {
      console.log(`[COMBAT] REJECTED: Not ${conn.ship}'s turn (current: ${gameState.currentTurn})`);
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

    console.log(`[COMBAT] Weapon: ${weapon.name}`);

    // Stage 5: Validate ammo if weapon uses ammo
    if (weapon.ammo !== null) {
      const currentAmmo = shipState[data.attacker].ammo[weapon.id];
      if (currentAmmo <= 0) {
        console.log(`[COMBAT] REJECTED: Out of ammo for ${weapon.name}`);
        socket.emit('combatError', {
          message: `Out of ammo for ${weapon.name}!`
        });
        return;
      }
      console.log(`[COMBAT] ${weapon.name} ammo: ${currentAmmo}`);
    }

    // Stage 5: Validate range restriction
    if (weapon.rangeRestriction && !weapon.rangeRestriction.includes(data.range)) {
      console.log(`[COMBAT] REJECTED: ${weapon.name} out of range (${data.range})`);
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

    console.log(`[COMBAT] Result: ${result.hit ? 'HIT' : 'MISS'} with ${weapon.name}`);

    // Stage 5: Decrement ammo if weapon uses ammo (regardless of hit/miss)
    if (weapon.ammo !== null) {
      const oldAmmo = shipState[data.attacker].ammo[weapon.id];
      shipState[data.attacker].ammo[weapon.id]--;
      console.log(`[AMMO] ${weapon.name}: ${oldAmmo} → ${shipState[data.attacker].ammo[weapon.id]}`);
    }

    if (result.hit) {
      console.log(`[COMBAT] Damage: ${result.damage} (${targetShip.hull} → ${result.newHull} hull)`);

      // Update persistent ship state
      const oldHull = shipState[data.target].hull;
      shipState[data.target].hull = result.newHull;

      console.log(`[STATE] ${targetBase.name} hull: ${oldHull} → ${shipState[data.target].hull}`);

      // Check for victory
      if (shipState[data.target].hull <= 0) {
        console.log(`[VICTORY] ${attackerBase.name} has destroyed ${targetBase.name}!`);
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
    console.log(`[REPAIR] Player ${connectionId} (${conn.ship}) requests engineer repair`);

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

    console.log(`[REPAIR] ${engineer.name} repairs ${repairResult.hullRepaired} HP (${shipToRepair.hull} → ${repairResult.newHull})`);

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

  // Stage 4: Handle game reset request (UPDATED to reset game state)
  socket.on('resetGame', () => {
    console.log(`[RESET] Player ${connectionId} requested game reset`);
    resetShipStates();
    resetGameState(); // Stage 4: Also reset rounds/turns

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

  // Handle "ping" for latency measurement
  socket.on('ping', (data) => {
    socket.emit('pong', {
      clientTimestamp: data.timestamp,
      serverTimestamp: Date.now()
    });
  });

  // Stage 4: Handle start game request
  socket.on('startGame', () => {
    const conn = connections.get(socket.id);
    console.log(`[START] Player ${connectionId} requested game start`);

    // Check if both players are connected
    const assignments = getShipAssignments();
    if (!assignments.scout || !assignments.corsair) {
      socket.emit('gameError', {
        message: 'Need both Scout and Corsair players to start game'
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
    console.log(`[TURN] Player ${connectionId} (${conn.ship}) requested end turn`);

    // Validate it's their turn
    if (conn.ship !== gameState.currentTurn) {
      socket.emit('gameError', {
        message: `It's not your turn! Current turn: ${gameState.currentTurn}`
      });
      return;
    }

    // End turn and advance
    const turnData = endTurn();

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
  
  socket.on('disconnect', () => {
    const conn = connections.get(socket.id);
    const duration = Date.now() - conn.connected;
    const disconnectedShip = conn.ship;

    console.log(`[DISCONNECT] Player ${connectionId} (${disconnectedShip || 'spectator'}) disconnected after ${duration}ms`);
    connections.delete(socket.id);
    console.log(`[STATUS] ${connections.size} players remaining`);

    // Broadcast updated game state to remaining players
    socket.broadcast.emit('playerLeft', {
      playerId: connectionId,
      ship: disconnectedShip,
      totalPlayers: connections.size,
      assignments: getShipAssignments()
    });
  });
});

// REST API endpoint for combat (for testing)
app.post('/api/combat', (req, res) => {
  const { attacker, target, range, dodge } = req.body;
  
  const attackerShip = SHIPS[attacker];
  const targetShip = SHIPS[target];
  
  if (!attackerShip || !targetShip) {
    return res.status(400).json({ error: 'Invalid ship' });
  }
  
  const result = resolveAttack(attackerShip, targetShip, { range, dodge });
  const breakdown = getAttackBreakdown(result);
  
  res.json({
    result,
    breakdown,
    formatted: formatAttackResult(result)
  });
});

// Health check endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    stage: 4,
    players: connections.size,
    assignments: getShipAssignments(),
    currentRound: gameState.currentRound,
    currentTurn: gameState.currentTurn,
    uptime: process.uptime()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('========================================');
  console.log('TRAVELLER COMBAT VTT - STAGE 4');
  console.log('========================================');
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('New in Stage 4:');
  console.log('- Round counter and tracking');
  console.log('- Turn-based combat (Scout → Corsair → repeat)');
  console.log('- Initiative system (2d6 + pilot skill)');
  console.log('- Turn validation (can only act on your turn)');
  console.log('- End Turn button to advance turns');
  console.log('');
  console.log('Instructions:');
  console.log('1. Open FIRST tab → You get Scout');
  console.log('2. Open SECOND tab → You get Corsair');
  console.log('3. Click "Start Game" to begin Round 1');
  console.log('4. Take turns attacking (Scout → Corsair)');
  console.log('5. Click "End Turn" to pass to opponent');
  console.log('========================================');
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Test API - Remote Control Endpoints for Puppeteer/Puppetry
// Purpose: Programmatic battle control for automated testing
// Security: Only enabled when NODE_ENV=test or ENABLE_TEST_API=true
// Status: Session 6, Phase 1.3

const { server: log } = require('./logger');

/**
 * Register test API endpoints for programmatic control
 * @param {Express} app - Express application
 * @param {SocketIO} io - Socket.io server instance
 * @param {Map} activeCombats - Active combat sessions map
 * @param {Map} connections - Player connections map
 */
function registerTestAPI(app, io, activeCombats, connections) {
  // Security check - only enable in test mode
  const testAPIEnabled = process.env.NODE_ENV === 'test' || process.env.ENABLE_TEST_API === 'true';

  if (!testAPIEnabled) {
    log.info('Test API disabled (set NODE_ENV=test or ENABLE_TEST_API=true to enable)');
    return;
  }

  log.warn('⚠️  Test API ENABLED - Remote control endpoints active');

  // ========================================
  // BATTLE MANAGEMENT
  // ========================================

  /**
   * GET /api/test/battles/active
   * List all active battles
   */
  app.get('/api/test/battles/active', (req, res) => {
    const battles = Array.from(activeCombats.entries()).map(([battleId, combat]) => ({
      battleId,
      players: combat.players.map(p => ({
        id: p.id,
        ship: p.spaceSelection.ship,
        ready: p.spaceSelection.ready
      })),
      range: combat.range,
      round: combat.round,
      phase: combat.currentPhase,
      currentTurn: combat.currentTurn
    }));

    res.json({
      success: true,
      count: battles.length,
      battles
    });
  });

  /**
   * GET /api/test/battle/:battleId/state
   * Get full battle state including ship stats, ammo, etc.
   */
  app.get('/api/test/battle/:battleId/state', (req, res) => {
    const { battleId } = req.params;
    const combat = activeCombats.get(battleId);

    if (!combat) {
      return res.status(404).json({
        success: false,
        error: 'Battle not found'
      });
    }

    res.json({
      success: true,
      battleId,
      state: {
        range: combat.range,
        round: combat.round,
        phase: combat.currentPhase,
        currentTurn: combat.currentTurn,
        players: combat.players.map(p => ({
          id: p.id,
          ship: p.spaceSelection.ship,
          hull: combat.shipStats[p.id].hull,
          maxHull: combat.shipStats[p.id].maxHull,
          armour: combat.shipStats[p.id].armour,
          ammunition: combat.ammunition ? combat.ammunition[p.id] : null,
          initiative: combat.initiative[p.id]
        })),
        missiles: combat.missiles ? {
          active: combat.missiles.activeMissiles.length,
          missiles: combat.missiles.activeMissiles.map(m => ({
            id: m.id,
            attacker: m.attacker,
            target: m.target,
            turnsToImpact: m.turnsToImpact
          }))
        } : null
      }
    });
  });

  /**
   * GET /api/test/players/:playerId/state
   * Get specific player state
   */
  app.get('/api/test/players/:playerId/state', (req, res) => {
    const { playerId } = req.params;

    // Find which battle this player is in
    let playerBattle = null;
    let playerData = null;

    for (const [battleId, combat] of activeCombats.entries()) {
      const player = combat.players.find(p => p.id === playerId);
      if (player) {
        playerBattle = battleId;
        playerData = {
          id: player.id,
          ship: player.spaceSelection.ship,
          hull: combat.shipStats[playerId].hull,
          maxHull: combat.shipStats[playerId].maxHull,
          armour: combat.shipStats[playerId].armour,
          ammunition: combat.ammunition ? combat.ammunition[playerId] : null,
          initiative: combat.initiative[playerId],
          isMyTurn: combat.currentTurn === playerId
        };
        break;
      }
    }

    if (!playerData) {
      return res.status(404).json({
        success: false,
        error: 'Player not found in any active battle'
      });
    }

    res.json({
      success: true,
      battleId: playerBattle,
      player: playerData
    });
  });

  /**
   * POST /api/test/battle/create
   * Create a new test battle session
   * Body: { player1Ship: 'scout', player2Ship: 'free_trader', range: 'Short' }
   */
  app.post('/api/test/battle/create', (req, res) => {
    const { player1Ship, player2Ship, range } = req.body;

    if (!player1Ship || !player2Ship || !range) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: player1Ship, player2Ship, range'
      });
    }

    // Generate battle ID
    const battleId = `test-battle-${Date.now()}`;

    // Create test player objects
    const player1 = {
      id: `test-player-1-${Date.now()}`,
      spaceSelection: {
        ship: player1Ship,
        range,
        ready: true
      }
    };

    const player2 = {
      id: `test-player-2-${Date.now()}`,
      spaceSelection: {
        ship: player2Ship,
        range,
        ready: true
      }
    };

    // Store in connections map (needed for battle state)
    connections.set(player1.id, { playerNum: 1, battleId });
    connections.set(player2.id, { playerNum: 2, battleId });

    // Initialize combat session (will be done by socket handler normally)
    // This is a simplified version for API testing
    activeCombats.set(battleId, {
      players: [player1, player2],
      range,
      round: 1,
      currentPhase: 'gunner',
      currentTurn: null,
      initiative: {},
      shipStats: {},
      ammunition: {},
      missiles: null
    });

    log.info(`Test battle created: ${battleId} (${player1Ship} vs ${player2Ship} at ${range})`);

    res.json({
      success: true,
      battleId,
      player1Id: player1.id,
      player2Id: player2.id,
      message: 'Test battle created. Use WebSocket to initialize combat state.'
    });
  });

  // ========================================
  // COMBAT ACTIONS (via Socket.io)
  // ========================================
  // Note: Most combat actions (fire, endTurn, etc.) are handled via Socket.io
  // The test framework should use Socket.io client to send these events
  // These HTTP endpoints provide READ-ONLY state inspection
  // For WRITE actions, use Socket.io:
  //   - 'fireWeapon'
  //   - 'endTurn'
  //   - 'launchMissile'
  //   - 'pointDefense'
  //   - 'useSandcaster'

  /**
   * POST /api/test/action/simulate
   * Simulate a combat action (development/testing only)
   * Body: { battleId, playerId, action, params }
   */
  app.post('/api/test/action/simulate', (req, res) => {
    const { battleId, playerId, action, params } = req.body;

    if (!battleId || !playerId || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: battleId, playerId, action'
      });
    }

    const combat = activeCombats.get(battleId);
    if (!combat) {
      return res.status(404).json({
        success: false,
        error: 'Battle not found'
      });
    }

    res.json({
      success: true,
      message: 'Action simulation endpoint - use Socket.io for actual actions',
      note: 'Connect via Socket.io and emit events: fireWeapon, endTurn, launchMissile, etc.',
      action,
      params
    });
  });

  // ========================================
  // SYSTEM INSPECTION
  // ========================================

  /**
   * GET /api/test/connections
   * List all active connections
   */
  app.get('/api/test/connections', (req, res) => {
    const conns = Array.from(connections.entries()).map(([socketId, data]) => ({
      socketId,
      playerNum: data.playerNum,
      battleId: data.battleId,
      isConnected: io.sockets.sockets.has(socketId)
    }));

    res.json({
      success: true,
      count: conns.length,
      connections: conns
    });
  });

  /**
   * GET /api/test/status
   * Get test API status and capabilities
   */
  app.get('/api/test/status', (req, res) => {
    res.json({
      success: true,
      status: 'active',
      environment: process.env.NODE_ENV || 'development',
      testAPIEnabled: true,
      capabilities: {
        battleManagement: true,
        stateInspection: true,
        readOnly: true,
        socketIORequired: true
      },
      endpoints: {
        GET: [
          '/api/test/battles/active',
          '/api/test/battle/:battleId/state',
          '/api/test/players/:playerId/state',
          '/api/test/connections',
          '/api/test/status'
        ],
        POST: [
          '/api/test/battle/create',
          '/api/test/action/simulate'
        ]
      },
      socketEvents: {
        emit: [
          'fireWeapon',
          'endTurn',
          'launchMissile',
          'pointDefense',
          'useSandcaster',
          'engineerRepair'
        ],
        listen: [
          'combatStateUpdate',
          'combatLogUpdate',
          'turnChange',
          'gameOver'
        ]
      }
    });
  });

  log.info('Test API routes registered successfully');
}

module.exports = { registerTestAPI };

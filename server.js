// Traveller Combat VTT - Stage 2
// Purpose: Add Mongoose Traveller 2e combat math
// Time: 1 hour

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const { resolveAttack, formatAttackResult, getAttackBreakdown, SHIPS } = require('./lib/combat');

// Serve static files from public directory
app.use(express.static('public'));
app.use(express.json());

// Track connections
let connectionCount = 0;
const connections = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  connectionCount++;
  const connectionId = connectionCount;
  
  connections.set(socket.id, {
    id: connectionId,
    connected: Date.now()
  });
  
  console.log(`[CONNECT] Tab ${connectionId} connected (socket: ${socket.id})`);
  console.log(`[STATUS] ${connections.size} tabs connected`);
  
  socket.emit('welcome', {
    message: `You are Tab ${connectionId}`,
    tabId: connectionId,
    totalTabs: connections.size
  });
  
  socket.broadcast.emit('tabConnected', {
    tabId: connectionId,
    totalTabs: connections.size
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
  
  // Handle combat action (Stage 2 - NEW)
  socket.on('combat', (data) => {
    console.log(`[COMBAT] Tab ${connectionId} initiates combat`);
    console.log(`[COMBAT] Attacker: ${data.attacker}, Target: ${data.target}`);
    console.log(`[COMBAT] Range: ${data.range}, Dodge: ${data.dodge}`);
    
    // Get ships
    const attacker = SHIPS[data.attacker];
    const target = SHIPS[data.target];
    
    if (!attacker || !target) {
      socket.emit('error', { message: 'Invalid ship' });
      return;
    }
    
    // Resolve combat
    const result = resolveAttack(attacker, target, {
      range: data.range,
      dodge: data.dodge,
      seed: data.seed
    });
    
    const breakdown = getAttackBreakdown(result);
    
    console.log(`[COMBAT] Result: ${result.hit ? 'HIT' : 'MISS'}`);
    if (result.hit) {
      console.log(`[COMBAT] Damage: ${result.damage} (${target.hull} → ${result.newHull} hull)`);
    }
    
    // Broadcast result to all tabs
    io.emit('combatResult', {
      fromTab: connectionId,
      result: result,
      breakdown: breakdown,
      timestamp: Date.now()
    });
  });
  
  // Handle "ping" for latency measurement
  socket.on('ping', (data) => {
    socket.emit('pong', {
      clientTimestamp: data.timestamp,
      serverTimestamp: Date.now()
    });
  });
  
  socket.on('disconnect', () => {
    const conn = connections.get(socket.id);
    const duration = Date.now() - conn.connected;
    
    console.log(`[DISCONNECT] Tab ${connectionId} disconnected after ${duration}ms`);
    connections.delete(socket.id);
    console.log(`[STATUS] ${connections.size} tabs remaining`);
    
    socket.broadcast.emit('tabDisconnected', {
      tabId: connectionId,
      totalTabs: connections.size
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
    stage: 2,
    connections: connections.size,
    uptime: process.uptime()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('========================================');
  console.log('TRAVELLER COMBAT VTT - STAGE 2');
  console.log('========================================');
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('New in Stage 2:');
  console.log('- Mongoose Traveller 2e combat rules');
  console.log('- Attack resolution (2d6 + skill + range - dodge >= 8)');
  console.log('- Damage calculation (2d6 - armor)');
  console.log('- Scout vs Corsair test ships');
  console.log('');
  console.log('Instructions:');
  console.log('1. Open in TWO browser tabs');
  console.log('2. Select attacker, target, range, dodge');
  console.log('3. Click "Attack!" to resolve combat');
  console.log('4. Watch both tabs see the same result');
  console.log('========================================');
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

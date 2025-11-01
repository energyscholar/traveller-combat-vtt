# Stage 1: Hello World (Two-Tab Sync)

**Date:** 2025-10-31
**Duration:** 1 hour
**Goal:** Prove real-time synchronization between browser tabs

## What Was Built

- Basic Socket.io server (`server.js`)
- HTML interface (`public/index.html`)
- Two-way message synchronization
- Tab identification system

## Success Criteria Met

- ✅ Open two browser tabs
- ✅ Type message in tab 1
- ✅ See message appear in tab 2 instantly
- ✅ Both tabs maintain unique IDs

## Technical Implementation
```javascript
// Server assigns unique tab IDs
io.on('connection', (socket) => {
  const tabId = tabCounter++;
  socket.emit('tabAssignment', tabId);
});

// Broadcast to all connected clients
io.emit('message', data);
```

## Files

- `server.js` - Socket.io server with tab tracking
- `public/index.html` - Client with real-time updates

## Next Stage

Stage 2: Add Traveller combat rules and math

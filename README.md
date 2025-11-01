# Traveller Combat VTT - Stage 1

## What This Is
Basic Socket.io server that proves two browser tabs can communicate in real-time.

## Stage 1 Goal
✅ Two tabs connect via Socket.io
✅ One tab sends "hello", other tab receives it
✅ Measure latency (<100ms target)

## Running
```bash
npm install
npm start
```

Then:
1. Open port 3000 in browser (Codespaces: Ports tab → globe icon)
2. Open the SAME URL in a second tab
3. Click "Send Hello" in one tab
4. Watch both tabs receive the message

## Success Criteria
✅ Two tabs connect in <5 seconds
✅ Message sent → received in <100ms
✅ Console shows latency measurement

## Files
- `server.js` - Express + Socket.io server
- `public/index.html` - Client UI

## Time Required
- Build: Already done! ✅
- Install: 1 minute
- Test: 2 minutes
- Total: ~3 minutes

## Next Stage
Stage 2: Add Mongoose Traveller 2e combat math (dice rolls, hit/miss, damage)

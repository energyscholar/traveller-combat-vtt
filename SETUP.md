# Traveller Combat VTT - Fresh Container Setup

## Quick Start (5 minutes)

### 1. Clone the Repository
```bash
cd /workspaces
git clone https://github.com/energyscholar/traveller-combat.git
cd traveller-combat
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Verify Installation
```bash
# Check all files present
ls -la

# Verify Claude documentation
ls -la .claude/*/

# Run tests
npm test
```

### 4. Start the Server
```bash
node server.js
```

Server will start on port 3000. Open two browser tabs to test.

## Current Status

- **Stage:** 2 Complete ✅
- **Next:** Stage 3 (Multiplayer Sync)
- **Tests:** 7/7 passing

## Resume Work

Upload `.claude/handoffs/HANDOFF-STAGE-2-COMPLETE.md` to Claude and say:
> "Continue from handoff document. Start Stage 3."

## Verify Everything Works

1. Server starts without errors
2. Browser shows combat interface
3. Two tabs can connect
4. Test button (orange, bottom-right) shows 7/7 tests passing

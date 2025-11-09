# Traveller Combat VTT - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
npm test
```

Expected: 328/328 tests passing across 19 test suites

### 3. Start the Server
```bash
npm start
```

Server starts on `http://localhost:3000`

### 4. Play the Game

**Single Player Testing:**
- Open `http://localhost:3000` in one browser tab
- Select ship (Scout or Free Trader)
- Choose starting range
- Click Ready
- Combat starts automatically vs AI opponent

**Two Player:**
- Open `http://localhost:3000` in TWO browser tabs
- Both players select ships and range
- Both click Ready
- Combat begins with hex movement and initiative system

## Current Status

- **Stage:** 9 Complete ✅
- **Features:** Full space combat with movement, initiative, weapons, crew
- **Tests:** 328/328 passing (100%)
- **Next:** Stage 10+ (Enhanced combat features)

## Verify Everything Works

1. Run `npm test` - All 328 tests should pass
2. Run `npm start` - Server starts on port 3000
3. Open browser to `http://localhost:3000`
4. Single player mode: Select ship → Click Ready → Combat starts
5. Test combat actions: Fire weapons, move on hex grid, end turn

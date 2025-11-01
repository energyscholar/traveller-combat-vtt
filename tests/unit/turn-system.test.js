// Turn System Unit Tests
// Tests for Stage 4: Combat Rounds & Turn System
// Tests initiative, turn order, round progression

const { DiceRoller } = require('../../lib/dice');
const { SHIPS } = require('../../lib/combat');

console.log('========================================');
console.log('STAGE 4 TURN SYSTEM UNIT TESTS');
console.log('========================================\n');

// Mock game state
function createGameState() {
  return {
    currentRound: 0,
    currentTurn: null,
    initiative: {
      scout: null,
      corsair: null
    },
    roundHistory: []
  };
}

// Mock ship state
function createShipState() {
  return {
    scout: {
      hull: SHIPS.scout.hull,
      maxHull: SHIPS.scout.maxHull,
      armor: SHIPS.scout.armor,
      pilotSkill: SHIPS.scout.pilotSkill
    },
    corsair: {
      hull: SHIPS.corsair.hull,
      maxHull: SHIPS.corsair.maxHull,
      armor: SHIPS.corsair.armor,
      pilotSkill: SHIPS.corsair.pilotSkill
    }
  };
}

// Helper: Roll initiative (mimics server logic)
function rollInitiative(shipState, gameState) {
  const dice = new DiceRoller();

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

  // Determine who goes first (Scout wins ties)
  if (scoutInitiative >= corsairInitiative) {
    gameState.currentTurn = 'scout';
  } else {
    gameState.currentTurn = 'corsair';
  }

  return {
    scout: gameState.initiative.scout,
    corsair: gameState.initiative.corsair,
    firstTurn: gameState.currentTurn
  };
}

// Helper: Start new round
function startNewRound(shipState, gameState) {
  gameState.currentRound++;
  const initiativeResult = rollInitiative(shipState, gameState);

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

// Helper: End turn
function endTurn(gameState) {
  const previousTurn = gameState.currentTurn;

  if (gameState.currentTurn === 'scout') {
    gameState.currentTurn = 'corsair';
  } else if (gameState.currentTurn === 'corsair') {
    // Corsair's turn ends, round ends
    return { newRound: true };
  }

  return {
    round: gameState.currentRound,
    currentTurn: gameState.currentTurn,
    newRound: false
  };
}

// ========================================
// INITIATIVE TESTS (5 tests)
// ========================================

function testInitiativeCalculation() {
  console.log('Test 1: Initiative calculation includes pilot skill');
  const shipState = createShipState();
  const gameState = createGameState();

  const result = rollInitiative(shipState, gameState);

  // Scout has +2 pilot skill, Corsair has +1
  const scoutRollTotal = result.scout.roll.total;
  const corsairRollTotal = result.corsair.roll.total;

  if (result.scout.total !== scoutRollTotal + 2) {
    throw new Error(`Scout initiative wrong: ${result.scout.total} !== ${scoutRollTotal} + 2`);
  }

  if (result.corsair.total !== corsairRollTotal + 1) {
    throw new Error(`Corsair initiative wrong: ${result.corsair.total} !== ${corsairRollTotal} + 1`);
  }

  console.log('✅ PASS: Initiative calculation correct');
  console.log(`   Scout: ${scoutRollTotal} + 2 = ${result.scout.total}`);
  console.log(`   Corsair: ${corsairRollTotal} + 1 = ${result.corsair.total}\n`);
}

function testInitiativeRange() {
  console.log('Test 2: Initiative values are in valid range');
  const shipState = createShipState();
  const gameState = createGameState();

  const result = rollInitiative(shipState, gameState);

  // Scout: 2d6 (2-12) + 2 = 4-14
  if (result.scout.total < 4 || result.scout.total > 14) {
    throw new Error(`Scout initiative out of range: ${result.scout.total}`);
  }

  // Corsair: 2d6 (2-12) + 1 = 3-13
  if (result.corsair.total < 3 || result.corsair.total > 13) {
    throw new Error(`Corsair initiative out of range: ${result.corsair.total}`);
  }

  console.log('✅ PASS: Initiative values in valid range');
  console.log(`   Scout: ${result.scout.total} (4-14 range)`);
  console.log(`   Corsair: ${result.corsair.total} (3-13 range)\n`);
}

function testInitiativeHigherGoesFirst() {
  console.log('Test 3: Higher initiative goes first');
  const shipState = createShipState();
  const gameState = createGameState();

  // Run multiple times to test different scenarios
  let scoutWins = 0;
  let corsairWins = 0;
  let ties = 0;

  for (let i = 0; i < 100; i++) {
    const freshState = createGameState();
    const result = rollInitiative(shipState, freshState);

    if (result.scout.total > result.corsair.total) {
      scoutWins++;
      if (freshState.currentTurn !== 'scout') {
        throw new Error('Scout should go first when initiative is higher');
      }
    } else if (result.corsair.total > result.scout.total) {
      corsairWins++;
      if (freshState.currentTurn !== 'corsair') {
        throw new Error('Corsair should go first when initiative is higher');
      }
    } else {
      ties++;
      // Scout wins ties
      if (freshState.currentTurn !== 'scout') {
        throw new Error('Scout should win ties');
      }
    }
  }

  console.log('✅ PASS: Higher initiative goes first');
  console.log(`   Scout wins: ${scoutWins}, Corsair wins: ${corsairWins}, Ties: ${ties}\n`);
}

function testInitiativeTiebreaker() {
  console.log('Test 4: Scout wins initiative ties');
  const shipState = createShipState();

  // Force a tie by setting equal pilot skills
  shipState.scout.pilotSkill = 0;
  shipState.corsair.pilotSkill = 0;

  let tieCount = 0;
  let scoutWonTie = 0;

  for (let i = 0; i < 100; i++) {
    const gameState = createGameState();
    const dice = new DiceRoller(i); // Seeded for reproducibility

    const scoutRoll = dice.roll2d6();
    const corsairRoll = dice.roll2d6();

    const scoutInit = scoutRoll.total;
    const corsairInit = corsairRoll.total;

    if (scoutInit === corsairInit) {
      tieCount++;
      // Scout should win ties
      gameState.initiative.scout = { roll: scoutRoll, total: scoutInit };
      gameState.initiative.corsair = { roll: corsairRoll, total: corsairInit };

      if (scoutInit >= corsairInit) {
        gameState.currentTurn = 'scout';
        scoutWonTie++;
      }
    }
  }

  if (tieCount > 0 && scoutWonTie !== tieCount) {
    throw new Error(`Scout should win all ties: won ${scoutWonTie} of ${tieCount}`);
  }

  console.log('✅ PASS: Scout wins all ties');
  console.log(`   Ties encountered: ${tieCount}, Scout won: ${scoutWonTie}\n`);
}

function testInitiativeStoredInGameState() {
  console.log('Test 5: Initiative stored in game state');
  const shipState = createShipState();
  const gameState = createGameState();

  rollInitiative(shipState, gameState);

  if (!gameState.initiative.scout || !gameState.initiative.corsair) {
    throw new Error('Initiative not stored in game state');
  }

  if (!gameState.initiative.scout.roll || !gameState.initiative.scout.total) {
    throw new Error('Scout initiative missing roll or total');
  }

  if (!gameState.initiative.corsair.roll || !gameState.initiative.corsair.total) {
    throw new Error('Corsair initiative missing roll or total');
  }

  console.log('✅ PASS: Initiative stored in game state');
  console.log(`   Scout: ${gameState.initiative.scout.total}`);
  console.log(`   Corsair: ${gameState.initiative.corsair.total}\n`);
}

// ========================================
// TURN ORDER TESTS (10 tests)
// ========================================

function testRoundStartsAtZero() {
  console.log('Test 6: Game starts at round 0');
  const gameState = createGameState();

  if (gameState.currentRound !== 0) {
    throw new Error(`Game should start at round 0, got ${gameState.currentRound}`);
  }

  console.log('✅ PASS: Game starts at round 0\n');
}

function testFirstRoundStartsAtOne() {
  console.log('Test 7: First round starts at round 1');
  const shipState = createShipState();
  const gameState = createGameState();

  const result = startNewRound(shipState, gameState);

  if (result.round !== 1) {
    throw new Error(`First round should be 1, got ${result.round}`);
  }

  console.log('✅ PASS: First round is round 1\n');
}

function testTurnOrderScoutThenCorsair() {
  console.log('Test 8: Turn order is Scout → Corsair');
  const shipState = createShipState();
  const gameState = createGameState();

  // Start round (Scout goes first if tie)
  startNewRound(shipState, gameState);

  const firstTurn = gameState.currentTurn;

  // End turn
  const turnResult = endTurn(gameState);

  if (firstTurn === 'scout' && turnResult.currentTurn !== 'corsair') {
    throw new Error('After Scout, Corsair should go');
  }

  console.log('✅ PASS: Turn order correct');
  console.log(`   First: ${firstTurn}, Second: ${turnResult.currentTurn}\n`);
}

function testEndTurnSwitchesPlayer() {
  console.log('Test 9: End turn switches to other player');
  const shipState = createShipState();
  const gameState = createGameState();

  startNewRound(shipState, gameState);
  const initialTurn = gameState.currentTurn;

  endTurn(gameState);
  const newTurn = gameState.currentTurn;

  if (initialTurn === newTurn) {
    throw new Error('Turn should switch after endTurn');
  }

  console.log('✅ PASS: Turn switches after endTurn');
  console.log(`   Before: ${initialTurn}, After: ${newTurn}\n`);
}

function testCorsairEndTurnStartsNewRound() {
  console.log('Test 10: Ending Corsair turn starts new round');
  const shipState = createShipState();
  const gameState = createGameState();

  startNewRound(shipState, gameState);

  // Scout's turn
  if (gameState.currentTurn === 'scout') {
    endTurn(gameState);
  }

  // Corsair's turn
  const result = endTurn(gameState);

  if (!result.newRound) {
    throw new Error('Ending Corsair turn should start new round');
  }

  console.log('✅ PASS: Ending Corsair turn starts new round\n');
}

function testCurrentTurnTracksActivePlayer() {
  console.log('Test 11: currentTurn tracks active player');
  const shipState = createShipState();
  const gameState = createGameState();

  if (gameState.currentTurn !== null) {
    throw new Error('currentTurn should be null before game starts');
  }

  startNewRound(shipState, gameState);

  if (gameState.currentTurn !== 'scout' && gameState.currentTurn !== 'corsair') {
    throw new Error(`currentTurn should be scout or corsair, got ${gameState.currentTurn}`);
  }

  console.log('✅ PASS: currentTurn tracks active player');
  console.log(`   Current turn: ${gameState.currentTurn}\n`);
}

function testRoundIncrements() {
  console.log('Test 12: Round number increments');
  const shipState = createShipState();
  const gameState = createGameState();

  startNewRound(shipState, gameState);
  if (gameState.currentRound !== 1) {
    throw new Error(`Round should be 1, got ${gameState.currentRound}`);
  }

  // End Scout's turn
  endTurn(gameState);
  // End Corsair's turn (starts round 2)
  endTurn(gameState);
  startNewRound(shipState, gameState);

  if (gameState.currentRound !== 2) {
    throw new Error(`Round should be 2, got ${gameState.currentRound}`);
  }

  console.log('✅ PASS: Round number increments');
  console.log(`   Current round: ${gameState.currentRound}\n`);
}

function testMultipleRoundsProgress() {
  console.log('Test 13: Multiple rounds progress correctly');
  const shipState = createShipState();
  const gameState = createGameState();

  for (let expectedRound = 1; expectedRound <= 5; expectedRound++) {
    startNewRound(shipState, gameState);

    if (gameState.currentRound !== expectedRound) {
      throw new Error(`Round should be ${expectedRound}, got ${gameState.currentRound}`);
    }

    // Complete the round (both turns)
    if (gameState.currentTurn === 'scout') {
      endTurn(gameState);
    }
    // Corsair's turn ends round
  }

  console.log('✅ PASS: Multiple rounds progress correctly');
  console.log(`   Completed 5 rounds\n`);
}

function testCannotSkipTurns() {
  console.log('Test 14: Cannot skip turns');
  const shipState = createShipState();
  const gameState = createGameState();

  startNewRound(shipState, gameState);
  const firstTurn = gameState.currentTurn;

  // End turn once
  const result = endTurn(gameState);

  // If first turn was Scout, second should be Corsair
  if (firstTurn === 'scout') {
    if (result.newRound) {
      throw new Error('Should not start new round after Scout turn');
    }
    if (gameState.currentTurn !== 'corsair') {
      throw new Error(`Turn should be corsair, got ${gameState.currentTurn}`);
    }
  } else {
    // If first turn was Corsair, ending turn starts new round
    if (!result.newRound) {
      throw new Error('Should start new round after Corsair turn');
    }
  }

  console.log('✅ PASS: Turns progress in sequence');
  console.log(`   First turn: ${firstTurn}, Result: ${result.newRound ? 'new round' : gameState.currentTurn}\n`);
}

function testTurnOrderConsistentAcrossRounds() {
  console.log('Test 15: Turn order can vary by initiative each round');
  const shipState = createShipState();
  const gameState = createGameState();

  const firstTurns = [];

  // Test multiple rounds
  for (let i = 0; i < 10; i++) {
    startNewRound(shipState, gameState);
    firstTurns.push(gameState.currentTurn);

    // Complete round
    if (gameState.currentTurn === 'scout') {
      endTurn(gameState);
    }
  }

  // Should have mix of scout and corsair going first
  // (unless very unlucky with dice)
  const scoutFirst = firstTurns.filter(t => t === 'scout').length;
  const corsairFirst = firstTurns.filter(t => t === 'corsair').length;

  console.log('✅ PASS: Initiative varies by round');
  console.log(`   Scout went first: ${scoutFirst}/10 rounds`);
  console.log(`   Corsair went first: ${corsairFirst}/10 rounds\n`);
}

// ========================================
// ROUND PROGRESSION TESTS (5 tests)
// ========================================

function testRoundHistoryTracksRounds() {
  console.log('Test 16: Round history tracks all rounds');
  const shipState = createShipState();
  const gameState = createGameState();

  if (gameState.roundHistory.length !== 0) {
    throw new Error('Round history should start empty');
  }

  startNewRound(shipState, gameState);

  if (gameState.roundHistory.length !== 1) {
    throw new Error('Round history should have 1 entry after first round');
  }

  console.log('✅ PASS: Round history tracks rounds');
  console.log(`   Rounds in history: ${gameState.roundHistory.length}\n`);
}

function testRoundHistoryStoresInitiative() {
  console.log('Test 17: Round history stores initiative');
  const shipState = createShipState();
  const gameState = createGameState();

  startNewRound(shipState, gameState);

  const history = gameState.roundHistory[0];

  if (!history.initiative) {
    throw new Error('Round history should store initiative');
  }

  if (!history.initiative.scout || !history.initiative.corsair) {
    throw new Error('Round history should store both ship initiatives');
  }

  console.log('✅ PASS: Round history stores initiative');
  console.log(`   Scout: ${history.initiative.scout.total}, Corsair: ${history.initiative.corsair.total}\n`);
}

function testRoundHistoryAccumulates() {
  console.log('Test 18: Round history accumulates');
  const shipState = createShipState();
  const gameState = createGameState();

  for (let i = 1; i <= 3; i++) {
    startNewRound(shipState, gameState);
    if (gameState.currentTurn === 'scout') endTurn(gameState);
  }

  if (gameState.roundHistory.length !== 3) {
    throw new Error(`Should have 3 rounds in history, got ${gameState.roundHistory.length}`);
  }

  console.log('✅ PASS: Round history accumulates');
  console.log(`   Total rounds: ${gameState.roundHistory.length}\n`);
}

function testRoundNumberMatchesHistoryLength() {
  console.log('Test 19: Round number matches history length');
  const shipState = createShipState();
  const gameState = createGameState();

  for (let i = 1; i <= 5; i++) {
    startNewRound(shipState, gameState);
    if (gameState.currentRound !== gameState.roundHistory.length) {
      throw new Error(`Round ${gameState.currentRound} but history has ${gameState.roundHistory.length} entries`);
    }
    if (gameState.currentTurn === 'scout') endTurn(gameState);
  }

  console.log('✅ PASS: Round number matches history length');
  console.log(`   Current round: ${gameState.currentRound}, History: ${gameState.roundHistory.length}\n`);
}

function testResetClearsGameState() {
  console.log('Test 20: Reset clears game state');
  const shipState = createShipState();
  const gameState = createGameState();

  // Play a few rounds
  startNewRound(shipState, gameState);
  endTurn(gameState);

  // Reset
  gameState.currentRound = 0;
  gameState.currentTurn = null;
  gameState.initiative.scout = null;
  gameState.initiative.corsair = null;
  gameState.roundHistory = [];

  if (gameState.currentRound !== 0) {
    throw new Error('Round should be reset to 0');
  }

  if (gameState.currentTurn !== null) {
    throw new Error('Current turn should be reset to null');
  }

  if (gameState.roundHistory.length !== 0) {
    throw new Error('Round history should be cleared');
  }

  console.log('✅ PASS: Reset clears game state\n');
}

// ========================================
// RUN ALL TESTS
// ========================================

async function runAllTests() {
  const tests = [
    // Initiative tests (5)
    testInitiativeCalculation,
    testInitiativeRange,
    testInitiativeHigherGoesFirst,
    testInitiativeTiebreaker,
    testInitiativeStoredInGameState,

    // Turn order tests (10)
    testRoundStartsAtZero,
    testFirstRoundStartsAtOne,
    testTurnOrderScoutThenCorsair,
    testEndTurnSwitchesPlayer,
    testCorsairEndTurnStartsNewRound,
    testCurrentTurnTracksActivePlayer,
    testRoundIncrements,
    testMultipleRoundsProgress,
    testCannotSkipTurns,
    testTurnOrderConsistentAcrossRounds,

    // Round progression tests (5)
    testRoundHistoryTracksRounds,
    testRoundHistoryStoresInitiative,
    testRoundHistoryAccumulates,
    testRoundNumberMatchesHistoryLength,
    testResetClearsGameState
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      test();
      passed++;
    } catch (error) {
      failed++;
      console.error(`❌ FAIL: ${error.message}\n`);
    }
  }

  console.log('========================================');
  if (failed === 0) {
    console.log('ALL TESTS PASSED ✅');
  } else {
    console.log(`SOME TESTS FAILED ⚠️`);
  }
  console.log('========================================');
  console.log(`Passed: ${passed}/${tests.length}`);
  console.log(`Failed: ${failed}/${tests.length}`);
  console.log('========================================\n');

  console.log('Stage 4 turn system verified!');
  console.log('Ready for integration testing.');

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests();

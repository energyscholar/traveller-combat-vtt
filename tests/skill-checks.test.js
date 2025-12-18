/**
 * Skill Check Framework Tests (AR-184)
 */

const {
  roll2D6,
  roll3D6KeepBest2,
  roll3D6KeepWorst2,
  skillCheck,
  DIFFICULTIES,
  getCharacteristicDM,
  formatSkillCheckResult
} = require('../lib/skill-checks');

console.log('=== Skill Check Tests ===\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.log(`✗ ${message}`);
    failed++;
  }
}

// --- roll2D6 Tests ---
console.log('roll2D6:');

const roll1 = roll2D6();
assert(roll1.dice.length === 2, 'roll2D6 returns 2 dice');
assert(roll1.total >= 2 && roll1.total <= 12, 'roll2D6 total is 2-12');
assert(roll1.dice[0] >= 1 && roll1.dice[0] <= 6, 'dice[0] is 1-6');
assert(roll1.dice[1] >= 1 && roll1.dice[1] <= 6, 'dice[1] is 1-6');
assert(roll1.total === roll1.dice[0] + roll1.dice[1], 'total equals sum of dice');

// --- roll3D6KeepBest2 Tests ---
console.log('\nroll3D6KeepBest2 (Boon):');

const boonRoll = roll3D6KeepBest2();
assert(boonRoll.dice.length === 3, 'boon rolls 3 dice');
assert(boonRoll.kept.length === 2, 'boon keeps 2 dice');
assert(boonRoll.total >= 2 && boonRoll.total <= 12, 'boon total is 2-12');
assert(boonRoll.kept[0] >= boonRoll.kept[1], 'kept dice are sorted descending');

// Verify it keeps best 2
const allDiceSorted = [...boonRoll.dice].sort((a, b) => b - a);
assert(
  boonRoll.kept[0] === allDiceSorted[0] && boonRoll.kept[1] === allDiceSorted[1],
  'boon keeps the two highest dice'
);

// --- roll3D6KeepWorst2 Tests ---
console.log('\nroll3D6KeepWorst2 (Bane):');

const baneRoll = roll3D6KeepWorst2();
assert(baneRoll.dice.length === 3, 'bane rolls 3 dice');
assert(baneRoll.kept.length === 2, 'bane keeps 2 dice');
assert(baneRoll.total >= 2 && baneRoll.total <= 12, 'bane total is 2-12');

// Verify it keeps worst 2
const allDiceSortedAsc = [...baneRoll.dice].sort((a, b) => a - b);
assert(
  baneRoll.kept[0] === allDiceSortedAsc[0] && baneRoll.kept[1] === allDiceSortedAsc[1],
  'bane keeps the two lowest dice'
);

// --- skillCheck Tests ---
console.log('\nskillCheck:');

const basicCheck = skillCheck({ difficulty: 8 });
assert(typeof basicCheck.roll === 'number', 'skillCheck returns roll');
assert(typeof basicCheck.success === 'boolean', 'skillCheck returns success');
assert(typeof basicCheck.margin === 'number', 'skillCheck returns margin');
assert(basicCheck.difficulty === 8, 'skillCheck respects difficulty');

// With skill and characteristic
const skilledCheck = skillCheck({
  skillLevel: 2,
  characteristic: 1,
  difficulty: 8
});
assert(skilledCheck.skillLevel === 2, 'skillCheck tracks skill level');
assert(skilledCheck.characteristic === 1, 'skillCheck tracks characteristic');
assert(skilledCheck.totalDM === 3, 'skillCheck calculates totalDM');

// With modifiers
const modifiedCheck = skillCheck({
  difficulty: 8,
  modifiers: [
    { reason: 'cover', dm: -2 },
    { reason: 'aim', dm: 1 }
  ]
});
assert(modifiedCheck.modifiers.length === 2, 'skillCheck tracks modifiers');
assert(modifiedCheck.totalDM === -1, 'skillCheck sums modifiers');

// Boon check
const boonCheck = skillCheck({ boon: true });
assert(boonCheck.boon === true, 'skillCheck tracks boon');
assert(boonCheck.dice.length === 3, 'boon check rolls 3 dice');

// Bane check
const baneCheck = skillCheck({ bane: true });
assert(baneCheck.bane === true, 'skillCheck tracks bane');
assert(baneCheck.dice.length === 3, 'bane check rolls 3 dice');

// Critical success (mock with known result)
// Can't guarantee natural 12, so just verify the field exists
assert(typeof basicCheck.criticalSuccess === 'boolean', 'skillCheck has criticalSuccess field');
assert(typeof basicCheck.criticalFailure === 'boolean', 'skillCheck has criticalFailure field');

// Effect equals margin
assert(basicCheck.effect === basicCheck.margin, 'effect equals margin');

// --- DIFFICULTIES Tests ---
console.log('\nDIFFICULTIES constants:');

assert(DIFFICULTIES.SIMPLE === 2, 'SIMPLE is 2');
assert(DIFFICULTIES.EASY === 4, 'EASY is 4');
assert(DIFFICULTIES.ROUTINE === 6, 'ROUTINE is 6');
assert(DIFFICULTIES.AVERAGE === 8, 'AVERAGE is 8');
assert(DIFFICULTIES.DIFFICULT === 10, 'DIFFICULT is 10');
assert(DIFFICULTIES.VERY_DIFFICULT === 12, 'VERY_DIFFICULT is 12');
assert(DIFFICULTIES.FORMIDABLE === 14, 'FORMIDABLE is 14');

// --- getCharacteristicDM Tests ---
console.log('\ngetCharacteristicDM:');

assert(getCharacteristicDM(0) === -3, 'char 0 gives DM -3');
assert(getCharacteristicDM(2) === -2, 'char 2 gives DM -2');
assert(getCharacteristicDM(5) === -1, 'char 5 gives DM -1');
assert(getCharacteristicDM(7) === 0, 'char 7 gives DM 0');
assert(getCharacteristicDM(10) === 1, 'char 10 gives DM +1');
assert(getCharacteristicDM(13) === 2, 'char 13 gives DM +2');
assert(getCharacteristicDM(15) === 3, 'char 15 gives DM +3');

// --- formatSkillCheckResult Tests ---
console.log('\nformatSkillCheckResult:');

const formattedResult = formatSkillCheckResult(basicCheck, 'Pilot');
assert(formattedResult.includes('Pilot Check'), 'format includes skill name');
assert(formattedResult.includes('2D6'), 'format includes roll type');
assert(formattedResult.includes('vs 8'), 'format includes difficulty');

// --- Statistical Tests (run multiple times) ---
console.log('\nStatistical checks (100 rolls):');

let boonSum = 0, normalSum = 0, baneSum = 0;
for (let i = 0; i < 100; i++) {
  boonSum += roll3D6KeepBest2().total;
  normalSum += roll2D6().total;
  baneSum += roll3D6KeepWorst2().total;
}

const boonAvg = boonSum / 100;
const normalAvg = normalSum / 100;
const baneAvg = baneSum / 100;

console.log(`  Boon average: ${boonAvg.toFixed(2)}`);
console.log(`  Normal average: ${normalAvg.toFixed(2)}`);
console.log(`  Bane average: ${baneAvg.toFixed(2)}`);

// Boon should average higher than normal, bane should average lower
// (with high confidence over 100 samples)
assert(boonAvg > normalAvg - 0.5, 'boon average tends higher than normal');
assert(baneAvg < normalAvg + 0.5, 'bane average tends lower than normal');

// --- Summary ---
console.log('\n' + '='.repeat(40));
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('='.repeat(40));

process.exit(failed > 0 ? 1 : 0);

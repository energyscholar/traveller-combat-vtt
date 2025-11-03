// Mongoose Traveller 2e combat resolution
// Rules: Attack = 2d6 + Skill + Range_DM - Dodge_DM >= 8

const fs = require('fs');
const path = require('path');
const { DiceRoller } = require('./dice');

// Load combat rules from JSON
const rulesPath = path.join(__dirname, '../data/rules/combat-rules.json');
const RULES = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));

// Stage 5: Test ships with multiple weapons
const SHIPS = {
  scout: {
    name: 'Scout',
    hull: 10,
    maxHull: 10,
    armor: 2,
    pilotSkill: 2,
    weapons: [
      {
        id: 'pulseLaser',
        name: 'Pulse Laser',
        damage: '2d6',
        ammo: null,  // unlimited (energy weapon)
        rangeRestriction: null  // all ranges
      },
      {
        id: 'missiles',
        name: 'Missiles',
        damage: '4d6',
        ammo: 6,  // 6 shots total
        longRangeBonus: 2  // +2 DM at long range (negates penalty)
      }
    ]
  },
  corsair: {
    name: 'Corsair',
    hull: 15,
    maxHull: 15,
    armor: 4,
    pilotSkill: 1,
    weapons: [
      {
        id: 'beamLaser',
        name: 'Beam Laser',
        damage: '3d6',
        ammo: null,  // unlimited (energy weapon)
        rangeRestriction: ['adjacent', 'close', 'medium']  // close-medium only
      },
      {
        id: 'missiles',
        name: 'Missiles',
        damage: '4d6',
        ammo: 6,  // 6 shots total
        longRangeBonus: 2  // +2 DM at long range (negates penalty)
      }
    ]
  }
};

// Stage 5: Helper function to roll damage dice
function rollDamageDice(roller, damageDice) {
  // Parse damage dice string (e.g., "2d6", "3d6", "4d6")
  const match = damageDice.match(/(\d+)d6/);
  if (!match) {
    throw new Error(`Invalid damage dice format: ${damageDice}`);
  }

  const numDice = parseInt(match[1]);

  // Use roller to roll Nd6
  const result = roller.roll(numDice, 6);

  return {
    dice: result.dice,
    total: result.total,
    formula: damageDice
  };
}

// Stage 5: Resolve attack with weapon selection
function resolveAttack(attacker, target, options = {}) {
  const roller = new DiceRoller(options.seed);

  // Stage 5: Get weapon (default to first weapon for backward compatibility)
  const weapon = options.weapon || (attacker.weapons && attacker.weapons[0]) || { damage: '2d6' };

  // Attack roll: 2d6 + skill + range - dodge
  const attackRoll = roller.roll2d6();
  const skill = attacker.pilotSkill || 0;
  let rangeDM = RULES.rangeDMs[options.range || 'medium'];
  const dodgeDM = RULES.dodgeDMs[options.dodge || 'none'];

  // Stage 5: Apply missile long range bonus
  if (weapon.longRangeBonus && options.range === 'long') {
    rangeDM += weapon.longRangeBonus;
  }

  const attackTotal = attackRoll.total + skill + rangeDM - dodgeDM;
  const hit = attackTotal >= RULES.attackTarget;

  const result = {
    attacker: attacker.name,
    target: target.name,
    weapon: weapon.name || 'Unknown Weapon',
    attackRoll: attackRoll,
    skill: skill,
    rangeDM: rangeDM,
    dodgeDM: dodgeDM,
    attackTotal: attackTotal,
    hit: hit,
    seed: attackRoll.seed
  };

  // If hit, roll damage using weapon damage dice
  if (hit) {
    const damageRoll = rollDamageDice(roller, weapon.damage || '2d6');
    const damage = Math.max(0, damageRoll.total - target.armor);

    result.damageRoll = damageRoll;
    result.armor = target.armor;
    result.damage = damage;
    result.newHull = target.hull - damage;
  }

  return result;
}

// Format attack result as human-readable text
function formatAttackResult(result) {
  let text = `${result.attacker} attacks ${result.target}`;
  // Stage 5: Include weapon name
  if (result.weapon) {
    text += ` with ${result.weapon}`;
  }
  text += `\n`;
  text += `Roll: [${result.attackRoll.dice.join(',')}] = ${result.attackRoll.total}\n`;
  text += `Modifiers: +${result.skill} (skill) +${result.rangeDM} (range) -${result.dodgeDM} (dodge)\n`;
  text += `Total: ${result.attackTotal} vs target ${RULES.attackTarget}\n`;

  if (result.hit) {
    text += `✓ HIT!\n`;
    text += `Damage: [${result.damageRoll.dice.join(',')}] = ${result.damageRoll.total} - ${result.armor} (armor) = ${result.damage}\n`;
    text += `Hull: ${result.target} ${result.newHull} remaining`;
  } else {
    text += `✗ MISS`;
  }

  return text;
}

// Get detailed breakdown for UI
function getAttackBreakdown(result) {
  return {
    summary: result.hit ? 'HIT' : 'MISS',
    attackRoll: {
      dice: result.attackRoll.dice,
      total: result.attackRoll.total
    },
    modifiers: [
      { name: 'Pilot Skill', value: result.skill },
      { name: 'Range', value: result.rangeDM },
      { name: 'Dodge', value: -result.dodgeDM }
    ],
    total: result.attackTotal,
    target: RULES.attackTarget,
    hit: result.hit,
    damage: result.hit ? {
      roll: result.damageRoll.dice,
      total: result.damageRoll.total,
      armor: result.armor,
      final: result.damage,
      hullRemaining: result.newHull
    } : null
  };
}

module.exports = {
  RULES,
  SHIPS,
  resolveAttack,
  formatAttackResult,
  getAttackBreakdown,
  rollDamageDice  // Stage 5: Export for testing
};

/**
 * Crew Health System (AR-47)
 * Tracks injuries, conditions, and treatment for crew members
 */

const { db, generateId } = require('./database');

// Wound types
const WOUND_TYPES = {
  LACERATION: 'laceration',
  BURN: 'burn',
  IMPACT: 'impact',
  INTERNAL: 'internal',
  RADIATION: 'radiation'
};

// Wound severity
const SEVERITY = {
  MINOR: 'minor',
  MODERATE: 'moderate',
  SEVERE: 'severe',
  CRITICAL: 'critical'
};

// Body locations
const LOCATIONS = {
  HEAD: 'head',
  TORSO: 'torso',
  ARM_L: 'arm-l',
  ARM_R: 'arm-r',
  LEG_L: 'leg-l',
  LEG_R: 'leg-r'
};

// Conditions (non-wound status effects)
const CONDITION_TYPES = {
  FATIGUE: 'fatigue',
  ALTITUDE_SICKNESS: 'altitude_sickness',
  DRUGGED: 'drugged',
  SEDATED: 'sedated',
  POISONED: 'poisoned',
  STUNNED: 'stunned'
};

// Consciousness states
const CONSCIOUSNESS = {
  ALERT: 'alert',
  DAZED: 'dazed',
  UNCONSCIOUS: 'unconscious',
  DEAD: 'dead'
};

// Treatment time by severity (in rounds)
const TREATMENT_TIME = {
  minor: 2,
  moderate: 4,
  severe: 8,
  critical: 12
};

// DM penalty by severity
const SEVERITY_DM = {
  minor: -1,
  moderate: -2,
  severe: -3,
  critical: -4
};

/**
 * Initialize health tables
 */
function initHealthTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS crew_health (
      character_id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      current_endurance INTEGER DEFAULT 8,
      max_endurance INTEGER DEFAULT 8,
      consciousness TEXT DEFAULT 'alert',
      treatment_in_progress TEXT,
      last_updated TEXT,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS crew_wounds (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL,
      type TEXT DEFAULT 'impact',
      severity TEXT DEFAULT 'minor',
      location TEXT DEFAULT 'torso',
      dm_penalty INTEGER DEFAULT -1,
      bleed_rate INTEGER DEFAULT 0,
      treated INTEGER DEFAULT 0,
      treatment_time INTEGER DEFAULT 0,
      required_time INTEGER DEFAULT 2,
      created_at TEXT,
      FOREIGN KEY (character_id) REFERENCES crew_health(character_id)
    );

    CREATE TABLE IF NOT EXISTS crew_conditions (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT DEFAULT 'mild',
      dm_penalty INTEGER DEFAULT -1,
      duration INTEGER,
      source TEXT,
      created_at TEXT,
      FOREIGN KEY (character_id) REFERENCES crew_health(character_id)
    );
  `);
}

// Initialize on load
try {
  initHealthTables();
} catch (e) {
  // Tables may exist
}

/**
 * Get or create health record for character
 */
function getHealth(characterId, campaignId) {
  let health = db.prepare('SELECT * FROM crew_health WHERE character_id = ?').get(characterId);

  if (!health && campaignId) {
    db.prepare(`
      INSERT INTO crew_health (character_id, campaign_id, last_updated)
      VALUES (?, ?, datetime('now'))
    `).run(characterId, campaignId);
    health = db.prepare('SELECT * FROM crew_health WHERE character_id = ?').get(characterId);
  }

  if (health) {
    // Attach wounds and conditions
    health.wounds = db.prepare('SELECT * FROM crew_wounds WHERE character_id = ? ORDER BY created_at DESC').all(characterId);
    health.conditions = db.prepare('SELECT * FROM crew_conditions WHERE character_id = ?').all(characterId);
    health.totalDM = calculateTotalDM(health);
  }

  return health;
}

/**
 * Calculate total DM penalty from wounds and conditions
 */
function calculateTotalDM(health) {
  let dm = 0;

  for (const wound of health.wounds || []) {
    if (!wound.treated) {
      dm += wound.dm_penalty;
    }
  }

  for (const condition of health.conditions || []) {
    dm += condition.dm_penalty;
  }

  return dm;
}

/**
 * Get all crew health for a campaign
 */
function getCampaignHealth(campaignId) {
  const healthRecords = db.prepare('SELECT * FROM crew_health WHERE campaign_id = ?').all(campaignId);

  return healthRecords.map(health => {
    health.wounds = db.prepare('SELECT * FROM crew_wounds WHERE character_id = ?').all(health.character_id);
    health.conditions = db.prepare('SELECT * FROM crew_conditions WHERE character_id = ?').all(health.character_id);
    health.totalDM = calculateTotalDM(health);
    return health;
  });
}

/**
 * Add wound to character
 */
function addWound(characterId, campaignId, woundData) {
  // Ensure health record exists
  getHealth(characterId, campaignId);

  const {
    type = 'impact',
    severity = 'minor',
    location = 'torso',
    bleedRate = 0
  } = woundData;

  const id = generateId();
  const dmPenalty = SEVERITY_DM[severity] || -1;
  const requiredTime = TREATMENT_TIME[severity] || 2;

  db.prepare(`
    INSERT INTO crew_wounds (id, character_id, type, severity, location, dm_penalty, bleed_rate, required_time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, characterId, type, severity, location, dmPenalty, bleedRate, requiredTime);

  // Update consciousness if severe
  if (severity === 'critical') {
    updateConsciousness(characterId, 'dazed');
  }

  return getWound(id);
}

/**
 * Get wound by ID
 */
function getWound(id) {
  return db.prepare('SELECT * FROM crew_wounds WHERE id = ?').get(id);
}

/**
 * Apply treatment to wound
 */
function treatWound(woundId, treatmentRounds = 1) {
  const wound = getWound(woundId);
  if (!wound) return null;

  const newTime = wound.treatment_time + treatmentRounds;
  const treated = newTime >= wound.required_time;

  db.prepare(`
    UPDATE crew_wounds
    SET treatment_time = ?, treated = ?, bleed_rate = ?
    WHERE id = ?
  `).run(newTime, treated ? 1 : 0, treated ? 0 : wound.bleed_rate, woundId);

  return getWound(woundId);
}

/**
 * Stabilize character (stop all bleeding)
 */
function stabilize(characterId) {
  db.prepare('UPDATE crew_wounds SET bleed_rate = 0 WHERE character_id = ?').run(characterId);
  return getHealth(characterId);
}

/**
 * Add condition to character
 */
function addCondition(characterId, campaignId, conditionData) {
  getHealth(characterId, campaignId);

  const {
    type,
    severity = 'mild',
    duration = null,
    source = 'unknown'
  } = conditionData;

  const id = generateId();
  const dmPenalty = severity === 'mild' ? -1 : severity === 'moderate' ? -2 : -3;

  db.prepare(`
    INSERT INTO crew_conditions (id, character_id, type, severity, dm_penalty, duration, source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, characterId, type, severity, dmPenalty, duration, source);

  return getCondition(id);
}

/**
 * Get condition by ID
 */
function getCondition(id) {
  return db.prepare('SELECT * FROM crew_conditions WHERE id = ?').get(id);
}

/**
 * Remove condition
 */
function removeCondition(conditionId) {
  db.prepare('DELETE FROM crew_conditions WHERE id = ?').run(conditionId);
}

/**
 * Update consciousness state
 */
function updateConsciousness(characterId, state) {
  db.prepare('UPDATE crew_health SET consciousness = ?, last_updated = datetime(\'now\') WHERE character_id = ?')
    .run(state, characterId);
  return getHealth(characterId);
}

/**
 * Apply endurance damage
 */
function applyDamage(characterId, damage) {
  const health = getHealth(characterId);
  if (!health) return null;

  const newEnd = Math.max(0, health.current_endurance - damage);
  let consciousness = health.consciousness;

  if (newEnd === 0 && consciousness !== 'dead') {
    consciousness = 'unconscious';
  }

  db.prepare(`
    UPDATE crew_health
    SET current_endurance = ?, consciousness = ?, last_updated = datetime('now')
    WHERE character_id = ?
  `).run(newEnd, consciousness, characterId);

  return getHealth(characterId);
}

/**
 * Heal endurance
 */
function healEndurance(characterId, amount) {
  const health = getHealth(characterId);
  if (!health) return null;

  const newEnd = Math.min(health.max_endurance, health.current_endurance + amount);

  db.prepare(`
    UPDATE crew_health
    SET current_endurance = ?, last_updated = datetime('now')
    WHERE character_id = ?
  `).run(newEnd, characterId);

  return getHealth(characterId);
}

/**
 * Triage - get injured crew sorted by severity
 */
function triage(campaignId) {
  const allHealth = getCampaignHealth(campaignId);

  // Filter to injured only and sort by severity
  const injured = allHealth.filter(h =>
    h.wounds.length > 0 ||
    h.conditions.length > 0 ||
    h.current_endurance < h.max_endurance
  );

  // Sort by total DM (most negative first = most injured)
  injured.sort((a, b) => a.totalDM - b.totalDM);

  return injured;
}

/**
 * Process bleeding (call each round)
 */
function processBleedingRound(campaignId) {
  const allHealth = getCampaignHealth(campaignId);
  const affected = [];

  for (const health of allHealth) {
    let totalBleed = 0;
    for (const wound of health.wounds) {
      if (wound.bleed_rate > 0 && !wound.treated) {
        totalBleed += wound.bleed_rate;
      }
    }

    if (totalBleed > 0) {
      applyDamage(health.character_id, totalBleed);
      affected.push({ characterId: health.character_id, bleedDamage: totalBleed });
    }
  }

  return affected;
}

module.exports = {
  WOUND_TYPES,
  SEVERITY,
  LOCATIONS,
  CONDITION_TYPES,
  CONSCIOUSNESS,
  getHealth,
  getCampaignHealth,
  addWound,
  getWound,
  treatWound,
  stabilize,
  addCondition,
  getCondition,
  removeCondition,
  updateConsciousness,
  applyDamage,
  healEndurance,
  triage,
  processBleedingRound,
  calculateTotalDM
};

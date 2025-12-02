/**
 * Characters Module (Autorun 9)
 * Player characters with UPP stats, skills, and equipment
 * Includes parsers for importing character data
 */

const { db, generateId } = require('./database');

// Stat names in UPP order
const STAT_ORDER = ['str', 'dex', 'end', 'int', 'edu', 'soc'];

/**
 * Parse UPP string to stats object
 * @param {string} upp - UPP string like "789A87" or "789AB7"
 * @returns {Object} Stats object {str, dex, end, int, edu, soc, psi?}
 */
function parseUPP(upp) {
  if (!upp || typeof upp !== 'string') return null;

  // Clean the input - remove spaces, dashes, common prefixes
  const clean = upp.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();

  if (clean.length < 6) return null;

  const stats = {};
  const chars = clean.split('');

  // Parse first 6 characters as standard UPP
  for (let i = 0; i < 6 && i < chars.length; i++) {
    const val = parseInt(chars[i], 16);
    if (isNaN(val)) return null;
    stats[STAT_ORDER[i]] = val;
  }

  // 7th character is PSI if present
  if (chars.length >= 7) {
    const psi = parseInt(chars[6], 16);
    if (!isNaN(psi)) stats.psi = psi;
  }

  return stats;
}

/**
 * Convert stats object to UPP string
 * @param {Object} stats - Stats object
 * @returns {string} UPP string like "789A87"
 */
function toUPP(stats) {
  if (!stats) return '';
  let upp = '';
  for (const stat of STAT_ORDER) {
    const val = stats[stat] ?? 7;
    upp += val.toString(16).toUpperCase();
  }
  if (stats.psi !== undefined && stats.psi !== null) {
    upp += stats.psi.toString(16).toUpperCase();
  }
  return upp;
}

/**
 * Parse skills from freeform text
 * Handles formats like:
 * - "Pilot-2, Gunnery-1, Vacc Suit-1"
 * - "Pilot 2, Gunnery 1"
 * - "Pilot: 2, Gunnery: 1"
 * @param {string} text - Freeform skills text
 * @returns {Object} Skills object {skillName: level}
 */
function parseSkills(text) {
  if (!text || typeof text !== 'string') return {};

  const skills = {};

  // Common skill patterns
  // Match: "Skill Name-2", "Skill Name 2", "Skill Name: 2", "Skill Name (2)"
  const patterns = [
    /([A-Za-z][A-Za-z\s]+?)\s*[-:]\s*(\d+)/g,  // "Pilot-2" or "Pilot: 2"
    /([A-Za-z][A-Za-z\s]+?)\s+(\d+)(?=[,;\n]|$)/g,  // "Pilot 2,"
    /([A-Za-z][A-Za-z\s]+?)\s*\((\d+)\)/g,  // "Pilot (2)"
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const skillName = match[1].trim();
      const level = parseInt(match[2]);

      // Normalize skill name (title case, collapse spaces)
      const normalized = skillName
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      // Only add if valid level (0-6 is normal range)
      if (!isNaN(level) && level >= 0 && level <= 6) {
        skills[normalized] = level;
      }
    }
  }

  return skills;
}

/**
 * Parse careers from text
 * @param {string} text - Career text like "Navy (2 terms), Scout (1 term)"
 * @returns {Array} Array of career objects
 */
function parseCareers(text) {
  if (!text || typeof text !== 'string') return [];

  const careers = [];

  // Match: "Career Name (N terms)" or "Career Name - Rank N" etc.
  const pattern = /([A-Za-z][A-Za-z\s]+?)(?:\s*\((\d+)\s*terms?\)|\s*[-:]\s*(\d+)\s*terms?)?/gi;

  let match;
  while ((match = pattern.exec(text)) !== null) {
    const name = match[1].trim();
    const terms = parseInt(match[2] || match[3]) || 1;

    if (name.length > 2) {
      careers.push({ name, terms, rank: 0, rankTitle: '' });
    }
  }

  return careers;
}

/**
 * Create a new character
 * @param {string} campaignId - Campaign ID
 * @param {Object} charData - Character data
 * @returns {Object} Created character
 */
function createCharacter(campaignId, charData) {
  const {
    playerAccountId = null,
    name,
    species = 'Human',
    homeworld = null,
    age = null,
    stats = {},
    careers = [],
    skills = {},
    equipment = [],
    weapons = [],
    armor = null,
    credits = 0,
    shipShares = 0,
    importConfidence = null,
    importRawText = null
  } = charData;

  const id = generateId();

  const stmt = db.prepare(`
    INSERT INTO characters (
      id, campaign_id, player_account_id, name, species, homeworld, age,
      str, dex, end, int, edu, soc, psi,
      careers, skills, equipment, weapons, armor, credits, ship_shares,
      import_confidence, import_raw_text
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, campaignId, playerAccountId, name, species, homeworld, age,
    stats.str ?? 7, stats.dex ?? 7, stats.end ?? 7,
    stats.int ?? 7, stats.edu ?? 7, stats.soc ?? 7, stats.psi ?? null,
    JSON.stringify(careers), JSON.stringify(skills),
    JSON.stringify(equipment), JSON.stringify(weapons),
    armor, credits, shipShares,
    importConfidence, importConfidence < 80 ? importRawText : null
  );

  return getCharacter(id);
}

/**
 * Parse JSON fields in character
 */
function parseCharacterFields(char) {
  if (!char) return null;
  char.careers = JSON.parse(char.careers || '[]');
  char.skills = JSON.parse(char.skills || '{}');
  char.equipment = JSON.parse(char.equipment || '[]');
  char.weapons = JSON.parse(char.weapons || '[]');
  // Build stats object for convenience
  char.stats = {
    str: char.str,
    dex: char.dex,
    end: char.end,
    int: char.int,
    edu: char.edu,
    soc: char.soc,
    psi: char.psi
  };
  char.upp = toUPP(char.stats);
  return char;
}

/**
 * Get a character by ID
 * @param {string} id - Character ID
 * @returns {Object|null} Character or null
 */
function getCharacter(id) {
  const stmt = db.prepare('SELECT * FROM characters WHERE id = ?');
  return parseCharacterFields(stmt.get(id));
}

/**
 * Get all characters for a campaign
 * @param {string} campaignId - Campaign ID
 * @returns {Array} Characters
 */
function getCharactersByCampaign(campaignId) {
  const stmt = db.prepare('SELECT * FROM characters WHERE campaign_id = ? ORDER BY name ASC');
  return stmt.all(campaignId).map(parseCharacterFields);
}

/**
 * Get character for a player account
 * @param {string} playerAccountId - Player account ID
 * @returns {Object|null} Character or null
 */
function getCharacterByPlayer(playerAccountId) {
  const stmt = db.prepare('SELECT * FROM characters WHERE player_account_id = ?');
  return parseCharacterFields(stmt.get(playerAccountId));
}

/**
 * Update a character
 * @param {string} id - Character ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated character
 */
function updateCharacter(id, updates) {
  const allowedFields = [
    'name', 'species', 'homeworld', 'age',
    'str', 'dex', 'end', 'int', 'edu', 'soc', 'psi',
    'careers', 'skills', 'equipment', 'weapons', 'armor',
    'credits', 'ship_shares', 'player_account_id'
  ];
  const setFields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowedFields.includes(dbKey)) {
      setFields.push(`${dbKey} = ?`);
      if (typeof value === 'object' && value !== null) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
    }
  }

  if (setFields.length === 0) return getCharacter(id);

  values.push(id);
  const stmt = db.prepare(`
    UPDATE characters
    SET ${setFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(...values);

  return getCharacter(id);
}

/**
 * Delete a character
 * @param {string} id - Character ID
 * @returns {boolean} Success
 */
function deleteCharacter(id) {
  const stmt = db.prepare('DELETE FROM characters WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Link character to player account
 * @param {string} characterId - Character ID
 * @param {string} playerAccountId - Player account ID
 * @returns {Object} Updated character
 */
function linkCharacterToPlayer(characterId, playerAccountId) {
  const stmt = db.prepare(`
    UPDATE characters
    SET player_account_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(playerAccountId, characterId);
  return getCharacter(characterId);
}

/**
 * Export character to JSON format
 * @param {string} id - Character ID
 * @returns {Object} Character data for export
 */
function exportCharacter(id) {
  const char = getCharacter(id);
  if (!char) return null;

  return {
    name: char.name,
    species: char.species,
    homeworld: char.homeworld,
    age: char.age,
    upp: char.upp,
    stats: char.stats,
    careers: char.careers,
    skills: char.skills,
    equipment: char.equipment,
    weapons: char.weapons,
    armor: char.armor,
    credits: char.credits,
    shipShares: char.ship_shares
  };
}

module.exports = {
  // Parsers
  parseUPP,
  toUPP,
  parseSkills,
  parseCareers,

  // CRUD
  createCharacter,
  getCharacter,
  getCharactersByCampaign,
  getCharacterByPlayer,
  updateCharacter,
  deleteCharacter,
  linkCharacterToPlayer,
  exportCharacter,

  // Constants
  STAT_ORDER
};

/**
 * AR-29.5: Star Systems Database Module
 * Manages generated star system data (procedural systems)
 */

const { db, generateId } = require('./database');

/**
 * Get a generated system by sector and hex
 * @param {string} sector - Sector name (e.g., "Spinward Marches")
 * @param {string} hex - Hex location (e.g., "1815")
 * @returns {Object|null} System data or null if not found
 */
function getGeneratedSystem(sector, hex) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM generated_systems
      WHERE sector = ? AND hex = ?
    `);
    const row = stmt.get(sector, hex);
    if (row && row.system_data) {
      return {
        ...row,
        system_data: JSON.parse(row.system_data)
      };
    }
    return null;
  } catch (err) {
    console.error('[STARSYS] Error getting generated system:', err.message);
    return null;
  }
}

/**
 * Save a generated system to the database
 * @param {string} sector - Sector name
 * @param {string} hex - Hex location
 * @param {Object} systemData - Full system data object
 * @param {Object} options - Additional options
 * @returns {boolean} Success status
 */
function saveGeneratedSystem(sector, hex, systemData, options = {}) {
  try {
    const id = `${sector}:${hex}`;
    const seed = options.seed || parseInt(hex, 16) || 12345;

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO generated_systems
      (id, sector, hex, name, uwp, stellar_class, system_data, seed, generated_at, modified_by, modified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
    `);

    stmt.run(
      id,
      sector,
      hex,
      systemData.name || null,
      systemData.uwp || null,
      systemData.stellarClass || null,
      JSON.stringify(systemData),
      seed,
      options.modifiedBy || null,
      options.modifiedBy ? new Date().toISOString() : null
    );

    console.log(`[STARSYS] Saved system: ${systemData.name || hex} (${sector}:${hex})`);
    return true;
  } catch (err) {
    console.error('[STARSYS] Error saving generated system:', err.message);
    return false;
  }
}

/**
 * Delete a generated system (for regeneration)
 * @param {string} sector - Sector name
 * @param {string} hex - Hex location
 * @returns {boolean} Success status
 */
function deleteGeneratedSystem(sector, hex) {
  try {
    const stmt = db.prepare(`
      DELETE FROM generated_systems
      WHERE sector = ? AND hex = ?
    `);
    const result = stmt.run(sector, hex);
    console.log(`[STARSYS] Deleted system: ${sector}:${hex} (${result.changes} rows)`);
    return result.changes > 0;
  } catch (err) {
    console.error('[STARSYS] Error deleting generated system:', err.message);
    return false;
  }
}

/**
 * Get all generated systems for a sector
 * @param {string} sector - Sector name
 * @returns {Array} List of generated systems
 */
function getGeneratedSystemsBySector(sector) {
  try {
    const stmt = db.prepare(`
      SELECT id, sector, hex, name, uwp, stellar_class, seed, generated_at
      FROM generated_systems
      WHERE sector = ?
      ORDER BY hex
    `);
    return stmt.all(sector);
  } catch (err) {
    console.error('[STARSYS] Error getting systems by sector:', err.message);
    return [];
  }
}

/**
 * Get count of generated systems
 * @returns {number} Total count
 */
function getGeneratedSystemCount() {
  try {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM generated_systems');
    return stmt.get().count;
  } catch (err) {
    console.error('[STARSYS] Error counting systems:', err.message);
    return 0;
  }
}

module.exports = {
  getGeneratedSystem,
  saveGeneratedSystem,
  deleteGeneratedSystem,
  getGeneratedSystemsBySector,
  getGeneratedSystemCount
};

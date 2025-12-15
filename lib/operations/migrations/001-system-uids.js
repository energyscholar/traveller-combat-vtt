/**
 * Migration 001: Add System UIDs
 *
 * AR-115: Database UID Normalization (Phase 1)
 *
 * Adds nullable system_uid columns to prepare for UID-based lookups.
 * This is a non-breaking change - existing string columns remain.
 */

/**
 * Apply migration
 * @param {Database} db - better-sqlite3 database instance
 */
function up(db) {
  console.log('[Migration 001] Adding system UID columns...');

  // Add system_uid to campaigns (nullable, will be populated later)
  const hasCampaignUid = db.prepare(`
    SELECT COUNT(*) as count FROM pragma_table_info('campaigns')
    WHERE name = 'system_uid'
  `).get().count > 0;

  if (!hasCampaignUid) {
    db.exec(`ALTER TABLE campaigns ADD COLUMN system_uid TEXT`);
    console.log('[Migration 001] Added system_uid to campaigns');
  }

  // Add system_uid to locations table
  const hasLocationUid = db.prepare(`
    SELECT COUNT(*) as count FROM pragma_table_info('locations')
    WHERE name = 'system_uid'
  `).get().count > 0;

  if (!hasLocationUid) {
    db.exec(`ALTER TABLE locations ADD COLUMN system_uid TEXT`);
    console.log('[Migration 001] Added system_uid to locations');
  }

  // Add system_uid to contacts table
  const hasContactUid = db.prepare(`
    SELECT COUNT(*) as count FROM pragma_table_info('contacts')
    WHERE name = 'system_uid'
  `).get().count > 0;

  if (!hasContactUid) {
    db.exec(`ALTER TABLE contacts ADD COLUMN system_uid TEXT`);
    console.log('[Migration 001] Added system_uid to contacts');
  }

  console.log('[Migration 001] Complete');
}

/**
 * Rollback migration
 * @param {Database} db - better-sqlite3 database instance
 */
function down(db) {
  console.log('[Migration 001] Rolling back system UID columns...');

  // SQLite doesn't support DROP COLUMN before 3.35.0
  // For older versions, would need to recreate tables
  // For now, just leave columns (they're nullable, harmless)
  console.log('[Migration 001] Rollback: Columns left in place (nullable, harmless)');
}

/**
 * Check if migration has been applied
 * @param {Database} db - better-sqlite3 database instance
 * @returns {boolean}
 */
function isApplied(db) {
  try {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('campaigns')
      WHERE name = 'system_uid'
    `).get();
    return result.count > 0;
  } catch {
    return false;
  }
}

module.exports = {
  id: '001-system-uids',
  description: 'Add system UID columns to campaigns, locations, contacts',
  up,
  down,
  isApplied
};

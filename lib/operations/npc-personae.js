/**
 * AR-130: NPC Personae Module
 * NPCs with AI personalities for email conversations
 * Each NPC has personality traits, goals, and can send/receive email
 */

const { db, generateId } = require('./database');

/**
 * Create a new NPC persona
 * @param {string} campaignId - Campaign ID
 * @param {Object} data - NPC data
 * @returns {Object} Created NPC persona
 */
function createPersona(campaignId, data) {
  const id = generateId('npc');
  const stmt = db.prepare(`
    INSERT INTO npc_personae (id, campaign_id, name, personality, goals, situation, wealth, location, mail_delay_weeks, system_prompt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, campaignId, data.name, data.personality, data.goals, data.situation, data.wealth, data.location, data.mailDelayWeeks || 1, data.systemPrompt);
  return getPersona(id);
}

/**
 * Get an NPC persona by ID
 * @param {string} id - Persona ID
 * @returns {Object|null} NPC persona or null
 */
function getPersona(id) {
  return db.prepare('SELECT * FROM npc_personae WHERE id = ?').get(id);
}

/**
 * Get all NPC personae for a campaign
 * @param {string} campaignId - Campaign ID
 * @returns {Array} List of NPC personae
 */
function getPersonaeByCampaign(campaignId) {
  return db.prepare('SELECT * FROM npc_personae WHERE campaign_id = ? ORDER BY name').all(campaignId);
}

/**
 * Update an NPC persona
 * @param {string} id - Persona ID
 * @param {Object} data - Updated data
 * @returns {Object} Updated persona
 */
function updatePersona(id, data) {
  const fields = [];
  const values = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.personality !== undefined) { fields.push('personality = ?'); values.push(data.personality); }
  if (data.goals !== undefined) { fields.push('goals = ?'); values.push(data.goals); }
  if (data.situation !== undefined) { fields.push('situation = ?'); values.push(data.situation); }
  if (data.wealth !== undefined) { fields.push('wealth = ?'); values.push(data.wealth); }
  if (data.location !== undefined) { fields.push('location = ?'); values.push(data.location); }
  if (data.mailDelayWeeks !== undefined) { fields.push('mail_delay_weeks = ?'); values.push(data.mailDelayWeeks); }
  if (data.systemPrompt !== undefined) { fields.push('system_prompt = ?'); values.push(data.systemPrompt); }

  if (fields.length === 0) return getPersona(id);

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE npc_personae SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getPersona(id);
}

/**
 * Delete an NPC persona
 * @param {string} id - Persona ID
 * @returns {boolean} Success
 */
function deletePersona(id) {
  const result = db.prepare('DELETE FROM npc_personae WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * Add a connection between an NPC and a PC
 * @param {string} npcId - NPC persona ID
 * @param {string} pcId - Player character ID
 * @param {string} campaignId - Campaign ID
 * @param {string} relationship - Relationship type
 * @param {string} notes - Optional notes
 * @returns {Object} Created connection
 */
function addConnection(npcId, pcId, campaignId, relationship, notes = null) {
  const stmt = db.prepare(`
    INSERT INTO npc_pc_connections (npc_id, pc_id, campaign_id, relationship, notes)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(npcId, pcId, campaignId, relationship, notes);
  return { id: result.lastInsertRowid, npcId, pcId, campaignId, relationship, notes };
}

/**
 * Get connections for an NPC
 * @param {string} npcId - NPC persona ID
 * @returns {Array} List of connections
 */
function getConnectionsForNPC(npcId) {
  return db.prepare('SELECT * FROM npc_pc_connections WHERE npc_id = ?').all(npcId);
}

/**
 * Get connections for a PC
 * @param {string} pcId - Player character ID
 * @returns {Array} List of connections
 */
function getConnectionsForPC(pcId) {
  return db.prepare('SELECT * FROM npc_pc_connections WHERE pc_id = ?').all(pcId);
}

/**
 * Remove a connection
 * @param {number} connectionId - Connection ID
 * @returns {boolean} Success
 */
function removeConnection(connectionId) {
  const result = db.prepare('DELETE FROM npc_pc_connections WHERE id = ?').run(connectionId);
  return result.changes > 0;
}

module.exports = {
  createPersona,
  getPersona,
  getPersonaeByCampaign,
  updatePersona,
  deletePersona,
  addConnection,
  getConnectionsForNPC,
  getConnectionsForPC,
  removeConnection
};

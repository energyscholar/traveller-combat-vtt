/**
 * Comms System (AR-39)
 * Real-time communication channels and transmissions
 * Extends mail system for live operations
 */

const { db, generateId } = require('./database');

// Channel frequencies/types
const CHANNEL_TYPES = {
  EMERGENCY: 'emergency',
  MILITARY: 'military',
  CIVILIAN: 'civilian',
  PRIVATE: 'private',
  BROADCAST: 'broadcast'
};

// Channel priorities
const CHANNEL_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Transmission types
const TRANSMISSION_TYPES = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
  INTERCEPTED: 'intercepted',
  BROADCAST: 'broadcast'
};

/**
 * Initialize comms tables
 */
function initCommsTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS comms_channels (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'civilian',
      frequency TEXT,
      monitoring INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'normal',
      encrypted INTEGER DEFAULT 0,
      last_activity TEXT,
      notes TEXT,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS comms_transmissions (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      channel_id TEXT,
      type TEXT DEFAULT 'incoming',
      from_name TEXT,
      from_contact_id TEXT,
      to_target TEXT,
      content TEXT,
      priority TEXT DEFAULT 'normal',
      timestamp TEXT,
      read INTEGER DEFAULT 0,
      archived INTEGER DEFAULT 0,
      attachments TEXT,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (channel_id) REFERENCES comms_channels(id)
    );

    CREATE TABLE IF NOT EXISTS comms_state (
      campaign_id TEXT PRIMARY KEY,
      jamming INTEGER DEFAULT 0,
      signal_strength INTEGER DEFAULT 100,
      interference INTEGER DEFAULT 0,
      active_channels TEXT DEFAULT '[]',
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );
  `);
}

// Initialize on load
try {
  initCommsTables();
} catch (e) {
  // Tables may already exist
}

/**
 * Get or create comms state for campaign
 */
function getCommsState(campaignId) {
  let state = db.prepare('SELECT * FROM comms_state WHERE campaign_id = ?').get(campaignId);

  if (!state) {
    db.prepare('INSERT INTO comms_state (campaign_id) VALUES (?)').run(campaignId);
    state = db.prepare('SELECT * FROM comms_state WHERE campaign_id = ?').get(campaignId);
  }

  state.active_channels = JSON.parse(state.active_channels || '[]');
  return state;
}

/**
 * Update comms state
 */
function updateCommsState(campaignId, updates) {
  const { jamming, signal_strength, interference, active_channels } = updates;

  const parts = [];
  const values = [];

  if (jamming !== undefined) { parts.push('jamming = ?'); values.push(jamming ? 1 : 0); }
  if (signal_strength !== undefined) { parts.push('signal_strength = ?'); values.push(signal_strength); }
  if (interference !== undefined) { parts.push('interference = ?'); values.push(interference); }
  if (active_channels !== undefined) { parts.push('active_channels = ?'); values.push(JSON.stringify(active_channels)); }

  if (parts.length === 0) return getCommsState(campaignId);

  values.push(campaignId);
  db.prepare(`UPDATE comms_state SET ${parts.join(', ')} WHERE campaign_id = ?`).run(...values);

  return getCommsState(campaignId);
}

/**
 * Create a communication channel
 */
function createChannel(campaignId, channelData) {
  const {
    name,
    type = 'civilian',
    frequency = null,
    priority = 'normal',
    encrypted = false,
    notes = null
  } = channelData;

  const id = generateId();

  db.prepare(`
    INSERT INTO comms_channels (id, campaign_id, name, type, frequency, priority, encrypted, notes, last_activity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, campaignId, name, type, frequency, priority, encrypted ? 1 : 0, notes);

  return getChannel(id);
}

/**
 * Get channel by ID
 */
function getChannel(id) {
  return db.prepare('SELECT * FROM comms_channels WHERE id = ?').get(id);
}

/**
 * Get all channels for campaign
 */
function getChannels(campaignId) {
  return db.prepare('SELECT * FROM comms_channels WHERE campaign_id = ? ORDER BY priority DESC, name').all(campaignId);
}

/**
 * Toggle channel monitoring
 */
function toggleChannelMonitoring(channelId, monitoring) {
  db.prepare('UPDATE comms_channels SET monitoring = ? WHERE id = ?').run(monitoring ? 1 : 0, channelId);
  return getChannel(channelId);
}

/**
 * Send a transmission
 */
function sendTransmission(campaignId, transmissionData) {
  const {
    channelId = null,
    type = 'outgoing',
    fromName,
    fromContactId = null,
    toTarget = 'broadcast',
    content,
    priority = 'normal',
    attachments = null
  } = transmissionData;

  const id = generateId();
  const timestamp = new Date().toISOString();

  db.prepare(`
    INSERT INTO comms_transmissions
    (id, campaign_id, channel_id, type, from_name, from_contact_id, to_target, content, priority, timestamp, attachments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, campaignId, channelId, type, fromName, fromContactId, toTarget, content, priority, timestamp,
    attachments ? JSON.stringify(attachments) : null);

  // Update channel last activity
  if (channelId) {
    db.prepare('UPDATE comms_channels SET last_activity = ? WHERE id = ?').run(timestamp, channelId);
  }

  return getTransmission(id);
}

/**
 * Get transmission by ID
 */
function getTransmission(id) {
  const t = db.prepare('SELECT * FROM comms_transmissions WHERE id = ?').get(id);
  if (t && t.attachments) t.attachments = JSON.parse(t.attachments);
  return t;
}

/**
 * Get recent transmissions for campaign
 */
function getRecentTransmissions(campaignId, limit = 50) {
  const transmissions = db.prepare(`
    SELECT * FROM comms_transmissions
    WHERE campaign_id = ? AND archived = 0
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(campaignId, limit);

  return transmissions.map(t => {
    if (t.attachments) t.attachments = JSON.parse(t.attachments);
    return t;
  });
}

/**
 * Get transmissions by channel
 */
function getTransmissionsByChannel(channelId, limit = 20) {
  const transmissions = db.prepare(`
    SELECT * FROM comms_transmissions
    WHERE channel_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(channelId, limit);

  return transmissions.map(t => {
    if (t.attachments) t.attachments = JSON.parse(t.attachments);
    return t;
  });
}

/**
 * Mark transmission as read
 */
function markTransmissionRead(id) {
  db.prepare('UPDATE comms_transmissions SET read = 1 WHERE id = ?').run(id);
  return getTransmission(id);
}

/**
 * Calculate effective signal strength with interference
 */
function getEffectiveSignal(campaignId) {
  const state = getCommsState(campaignId);
  const effective = Math.max(0, state.signal_strength - state.interference);
  return {
    base: state.signal_strength,
    interference: state.interference,
    effective,
    quality: effective > 80 ? 'excellent' : effective > 50 ? 'good' : effective > 20 ? 'poor' : 'critical'
  };
}

/**
 * Apply jamming effects
 */
function setJamming(campaignId, isJamming, intensity = 50) {
  return updateCommsState(campaignId, {
    jamming: isJamming,
    interference: isJamming ? intensity : 0
  });
}

module.exports = {
  CHANNEL_TYPES,
  CHANNEL_PRIORITY,
  TRANSMISSION_TYPES,
  getCommsState,
  updateCommsState,
  createChannel,
  getChannel,
  getChannels,
  toggleChannelMonitoring,
  sendTransmission,
  getTransmission,
  getRecentTransmissions,
  getTransmissionsByChannel,
  markTransmissionRead,
  getEffectiveSignal,
  setJamming
};

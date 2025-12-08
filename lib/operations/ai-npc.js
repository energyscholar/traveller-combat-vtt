/**
 * AI NPC Response System (AR-41)
 * Generates AI-powered NPC responses using Claude API
 * Uses NPC dossier personality/motivations for consistent characterization
 * Supports per-campaign API keys with server fallback
 */

const Anthropic = require('@anthropic-ai/sdk');
const crypto = require('crypto');
const { getNPCDossier, getNPCDossiersByCampaign } = require('./npc-dossiers');
const { sendMail, getMailThread } = require('./mail');
const { db, generateId } = require('./database');

// Simple encryption for API keys at rest
const ENCRYPTION_KEY = process.env.AI_KEY_ENCRYPTION_SECRET || 'default-dev-key-change-in-prod!';

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText) {
  if (!encryptedText) return null;
  try {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    console.error('API key decryption failed');
    return null;
  }
}

// Cache of Anthropic clients per campaign
const clientCache = new Map();

/**
 * Get API key for campaign (priority: campaign > server env)
 */
function getAPIKey(campaignId) {
  // Try campaign-specific key first
  if (campaignId) {
    const row = db.prepare('SELECT ai_api_key FROM campaigns WHERE id = ?').get(campaignId);
    if (row && row.ai_api_key) {
      const decrypted = decrypt(row.ai_api_key);
      if (decrypted) return decrypted;
    }
  }
  // Fall back to server env var
  return process.env.ANTHROPIC_API_KEY || null;
}

/**
 * Set API key for campaign (GM only)
 */
function setCampaignAPIKey(campaignId, apiKey) {
  const encrypted = apiKey ? encrypt(apiKey) : null;
  db.prepare('UPDATE campaigns SET ai_api_key = ? WHERE id = ?').run(encrypted, campaignId);
  // Clear cached client
  clientCache.delete(campaignId);
  return { success: true, hasKey: !!apiKey };
}

/**
 * Check if campaign has AI configured
 */
function hasAIKey(campaignId) {
  return !!getAPIKey(campaignId);
}

/**
 * Get Anthropic client for campaign
 */
function getClient(campaignId) {
  // Check cache first
  if (campaignId && clientCache.has(campaignId)) {
    return clientCache.get(campaignId);
  }

  const apiKey = getAPIKey(campaignId);
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });

  // Cache if campaign-specific
  if (campaignId) {
    clientCache.set(campaignId, client);
  }

  return client;
}

// Response status
const AI_STATUS = {
  PENDING: 'pending',
  GENERATING: 'generating',
  READY: 'ready',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SENT: 'sent'
};

/**
 * Build system prompt for NPC based on dossier
 */
function buildNPCPrompt(npc, campaignContext = {}) {
  const parts = [
    `You are ${npc.name}${npc.title ? `, ${npc.title}` : ''}.`,
    `Role: ${npc.role || 'neutral contact'}`,
  ];

  if (npc.personality) {
    parts.push(`Personality: ${npc.personality}`);
  }

  if (npc.motivation_public) {
    parts.push(`Known motivation: ${npc.motivation_public}`);
  }

  if (npc.motivation_hidden) {
    parts.push(`Hidden agenda (influences your responses subtly): ${npc.motivation_hidden}`);
  }

  if (npc.background) {
    parts.push(`Background: ${npc.background}`);
  }

  if (npc.location_text) {
    parts.push(`Current location: ${npc.location_text}`);
  }

  // Add campaign context
  if (campaignContext.currentDate) {
    parts.push(`Current date: ${campaignContext.currentDate}`);
  }

  if (campaignContext.recentEvents) {
    parts.push(`Recent events: ${campaignContext.recentEvents}`);
  }

  parts.push(`
IMPORTANT GUIDELINES:
- Stay in character as ${npc.name} at all times
- Respond naturally as this character would in the Traveller RPG universe
- Keep responses concise (1-3 paragraphs for messages)
- Reference your known motivations but hint at hidden ones subtly
- Use appropriate formality based on your role and relationship
- Never break character or acknowledge being an AI
`);

  return parts.join('\n');
}

/**
 * Generate AI response for incoming player mail
 * @param {string} npcId - NPC dossier ID
 * @param {string} playerMessage - The player's message
 * @param {Object} context - Campaign context
 * @returns {Promise<Object>} Generated response with status
 */
async function generateNPCResponse(npcId, playerMessage, context = {}) {
  const client = getClient(context.campaignId);

  if (!client) {
    return {
      status: AI_STATUS.REJECTED,
      error: 'AI not configured (no API key for this campaign)',
      fallback: true
    };
  }

  const npc = getNPCDossier(npcId);
  if (!npc) {
    return {
      status: AI_STATUS.REJECTED,
      error: 'NPC not found'
    };
  }

  const systemPrompt = buildNPCPrompt(npc, context);

  // Get conversation history if available
  let conversationHistory = [];
  if (context.threadId) {
    const thread = getMailThread(context.threadId);
    if (thread && thread.length > 0) {
      conversationHistory = thread.slice(-6).map(mail => ({
        role: mail.sender_type === 'player' ? 'user' : 'assistant',
        content: mail.body
      }));
    }
  }

  // Add current message
  conversationHistory.push({
    role: 'user',
    content: playerMessage
  });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: conversationHistory
    });

    const generatedText = response.content[0].text;

    return {
      status: AI_STATUS.READY,
      npcId,
      npcName: npc.name,
      response: generatedText,
      generatedAt: new Date().toISOString(),
      tokens: response.usage
    };

  } catch (error) {
    console.error('AI NPC generation error:', error.message);
    return {
      status: AI_STATUS.REJECTED,
      error: error.message
    };
  }
}

/**
 * Generate emergency/distress NPC transmission
 * For adventure scenarios with urgent communications
 */
async function generateEmergencyTransmission(npcId, scenario, context = {}) {
  const client = getClient(context.campaignId);

  if (!client) {
    return { status: AI_STATUS.REJECTED, error: 'AI not configured for this campaign' };
  }

  const npc = getNPCDossier(npcId);
  if (!npc) {
    return { status: AI_STATUS.REJECTED, error: 'NPC not found' };
  }

  const systemPrompt = buildNPCPrompt(npc, context);

  const emergencyPrompt = `
You are sending an urgent transmission. Scenario: ${scenario}

Generate a brief, urgent communication (2-4 sentences) appropriate for:
- Radio/video transmission
- Emergency situation
- Your character and role

Include emotional state and urgency appropriate to the scenario.
`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: 'user', content: emergencyPrompt }]
    });

    return {
      status: AI_STATUS.READY,
      npcId,
      npcName: npc.name,
      response: response.content[0].text,
      type: 'emergency',
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    return { status: AI_STATUS.REJECTED, error: error.message };
  }
}

/**
 * Queue AI response for GM review (optional workflow)
 */
function queueForReview(campaignId, aiResponse) {
  const id = generateId();

  const stmt = db.prepare(`
    INSERT INTO ai_response_queue (id, campaign_id, npc_id, npc_name, response_text, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  stmt.run(id, campaignId, aiResponse.npcId, aiResponse.npcName, aiResponse.response, AI_STATUS.PENDING);

  return { id, ...aiResponse, status: AI_STATUS.PENDING };
}

/**
 * Get pending AI responses for GM review
 */
function getPendingResponses(campaignId) {
  const stmt = db.prepare(`
    SELECT * FROM ai_response_queue
    WHERE campaign_id = ? AND status = ?
    ORDER BY created_at ASC
  `);
  return stmt.all(campaignId, AI_STATUS.PENDING);
}

/**
 * Approve and send AI response
 */
function approveAndSend(responseId, edits = null) {
  const stmt = db.prepare('SELECT * FROM ai_response_queue WHERE id = ?');
  const queued = stmt.get(responseId);

  if (!queued) return null;

  const finalText = edits || queued.response_text;

  // Update queue status
  db.prepare('UPDATE ai_response_queue SET status = ?, response_text = ? WHERE id = ?')
    .run(AI_STATUS.SENT, finalText, responseId);

  // Send as mail
  const mail = sendMail(queued.campaign_id, {
    senderName: queued.npc_name,
    senderType: 'npc',
    recipientType: 'ship',
    subject: 'Re: Your message',
    body: finalText,
    sentDate: new Date().toISOString()
  });

  return mail;
}

/**
 * Check if AI NPC system is available for campaign
 */
function isAIAvailable(campaignId) {
  return hasAIKey(campaignId);
}

/**
 * Initialize AI tables and columns
 */
function initAITables() {
  // AI response queue table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_response_queue (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      npc_id TEXT,
      npc_name TEXT,
      response_text TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT,
      reviewed_at TEXT,
      reviewed_by TEXT,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    )
  `);

  // Add ai_api_key column to campaigns if not exists
  try {
    db.exec(`ALTER TABLE campaigns ADD COLUMN ai_api_key TEXT`);
  } catch (e) {
    // Column already exists
  }
}

// Initialize on load
try {
  initAITables();
} catch (e) {
  // Table may already exist
}

module.exports = {
  AI_STATUS,
  generateNPCResponse,
  generateEmergencyTransmission,
  queueForReview,
  getPendingResponses,
  approveAndSend,
  isAIAvailable,
  hasAIKey,
  setCampaignAPIKey,
  buildNPCPrompt
};

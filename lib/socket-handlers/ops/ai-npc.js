/**
 * AI NPC Socket Handlers (AR-41)
 * Handles AI-powered NPC communication events
 */

const {
  generateNPCResponse,
  generateEmergencyTransmission,
  queueForReview,
  getPendingResponses,
  approveAndSend,
  isAIAvailable,
  hasAIKey,
  setCampaignAPIKey
} = require('../../operations/ai-npc');
const { sendMail } = require('../../operations/mail');
const { getNPCDossier } = require('../../operations/npc-dossiers');

/**
 * Register AI NPC socket handlers
 */
function register(ctx) {
  const { socket, io, opsSession, sanitizeError } = ctx;

  // Check if AI is available for this campaign
  socket.on('ai:status', (callback) => {
    if (typeof callback === 'function') {
      callback({
        available: isAIAvailable(opsSession.campaignId),
        campaignId: opsSession.campaignId
      });
    }
  });

  // GM: Set campaign API key
  socket.on('ai:setAPIKey', (data, callback) => {
    if (!opsSession.isGM) {
      if (typeof callback === 'function') {
        callback({ error: 'Only GM can set API key' });
      }
      return;
    }

    const { apiKey } = data;
    const result = setCampaignAPIKey(opsSession.campaignId, apiKey);

    if (typeof callback === 'function') {
      callback(result);
    }
  });

  // GM: Check if campaign has API key configured
  socket.on('ai:hasKey', (callback) => {
    if (typeof callback === 'function') {
      callback({ hasKey: hasAIKey(opsSession.campaignId) });
    }
  });

  // Request AI response for player mail to NPC
  socket.on('ai:generateResponse', async (data, callback) => {
    const { npcId, playerMessage, campaignId, threadId, autoSend = false } = data;

    if (!npcId || !playerMessage) {
      if (typeof callback === 'function') {
        callback({ error: 'Missing npcId or playerMessage' });
      }
      return;
    }

    try {
      const context = {
        threadId,
        currentDate: new Date().toISOString()
      };

      const result = await generateNPCResponse(npcId, playerMessage, context);

      if (result.status === 'ready') {
        if (autoSend) {
          // Auto-send without GM review
          const mail = sendMail(campaignId, {
            senderName: result.npcName,
            senderType: 'npc',
            recipientType: 'ship',
            subject: 'Re: Message',
            body: result.response,
            sentDate: new Date().toISOString()
          });

          // Notify all clients of new mail
          io.to(`campaign:${campaignId}`).emit('mail:received', mail);

          if (typeof callback === 'function') {
            callback({ success: true, mail, aiResponse: result });
          }
        } else {
          // Queue for GM review
          const queued = queueForReview(campaignId, result);

          // Notify GM of pending response
          io.to(`campaign:${campaignId}`).emit('ai:pendingResponse', queued);

          if (typeof callback === 'function') {
            callback({ success: true, queued });
          }
        }
      } else {
        if (typeof callback === 'function') {
          callback({ error: result.error || 'Generation failed' });
        }
      }

    } catch (error) {
      console.error('AI response error:', error);
      if (typeof callback === 'function') {
        callback({ error: error.message });
      }
    }
  });

  // Generate emergency transmission (for adventure scenarios)
  socket.on('ai:emergencyTransmission', async (data, callback) => {
    const { npcId, scenario, campaignId } = data;

    if (!npcId || !scenario) {
      if (typeof callback === 'function') {
        callback({ error: 'Missing npcId or scenario' });
      }
      return;
    }

    try {
      const result = await generateEmergencyTransmission(npcId, scenario);

      if (result.status === 'ready') {
        // Broadcast as transmission to all bridge crew
        io.to(`campaign:${campaignId}`).emit('comms:transmission', {
          type: 'emergency',
          from: result.npcName,
          message: result.response,
          timestamp: result.generatedAt
        });

        if (typeof callback === 'function') {
          callback({ success: true, transmission: result });
        }
      } else {
        if (typeof callback === 'function') {
          callback({ error: result.error });
        }
      }

    } catch (error) {
      if (typeof callback === 'function') {
        callback({ error: error.message });
      }
    }
  });

  // GM: Get pending AI responses
  socket.on('ai:getPending', (data, callback) => {
    const { campaignId } = data;

    const pending = getPendingResponses(campaignId);

    if (typeof callback === 'function') {
      callback({ pending });
    }
  });

  // GM: Approve AI response (optionally with edits)
  socket.on('ai:approve', (data, callback) => {
    const { responseId, edits, campaignId } = data;

    const mail = approveAndSend(responseId, edits);

    if (mail) {
      // Notify all clients of new mail
      io.to(`campaign:${campaignId}`).emit('mail:received', mail);

      if (typeof callback === 'function') {
        callback({ success: true, mail });
      }
    } else {
      if (typeof callback === 'function') {
        callback({ error: 'Response not found' });
      }
    }
  });

  // GM: Reject AI response
  socket.on('ai:reject', (data, callback) => {
    const { responseId } = data;

    // Just mark as rejected in queue
    const { db } = require('../../operations/database');
    db.prepare('UPDATE ai_response_queue SET status = ? WHERE id = ?')
      .run('rejected', responseId);

    if (typeof callback === 'function') {
      callback({ success: true });
    }
  });

}

module.exports = { register };

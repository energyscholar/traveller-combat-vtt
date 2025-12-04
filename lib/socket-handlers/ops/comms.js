/**
 * Communications Handlers - Mail, NPC Contacts, NPC Crew
 * Part of the modular socket handler architecture
 */

/**
 * Register communications handlers
 * @param {Object} ctx - Handler context from context.js
 */
function register(ctx) {
  const {
    socket, io, opsSession, operations,
    socketLog, sanitizeError
  } = ctx;

  // --- Mail System ---

  // Get mail for current player
  socket.on('ops:getMail', () => {
    try {
      if (!opsSession.campaignId) {
        socket.emit('ops:error', { message: 'Not in a campaign' });
        return;
      }
      const campaign = operations.getCampaign(opsSession.campaignId);
      const currentDate = campaign?.current_date || '1105-001';

      let mail;
      if (opsSession.isGM) {
        mail = operations.getMailByCampaign(opsSession.campaignId);
      } else {
        mail = operations.getMailForPlayer(opsSession.campaignId, opsSession.accountId, currentDate);
      }

      const unreadCount = opsSession.isGM ? 0 :
        operations.getUnreadMailCount(opsSession.campaignId, opsSession.accountId, currentDate);

      socket.emit('ops:mailList', { mail, unreadCount });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Mail', error));
      socketLog.error('[OPS] Error getting mail:', error);
    }
  });

  // Mark mail as read
  socket.on('ops:markMailRead', (data) => {
    try {
      const { mailId } = data;
      operations.markMailRead(mailId);
      socket.emit('ops:mailUpdated', { mailId, isRead: true });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Mail', error));
    }
  });

  // Archive mail
  socket.on('ops:archiveMail', (data) => {
    try {
      const { mailId } = data;
      operations.archiveMail(mailId);
      socket.emit('ops:mailArchived', { mailId });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Mail', error));
    }
  });

  // Player reply to mail sender
  socket.on('ops:replyToMail', (data) => {
    try {
      const { originalMailId, subject, body } = data;
      if (!opsSession.accountId) {
        socket.emit('ops:error', { message: 'Must be logged in to reply' });
        return;
      }
      const campaign = operations.getCampaign(opsSession.campaignId);
      const currentDate = campaign?.current_date || '1105-001';

      const originalMail = operations.getMail(originalMailId);
      if (!originalMail) {
        socket.emit('ops:error', { message: 'Original mail not found' });
        return;
      }

      const player = operations.getPlayer(opsSession.accountId);
      const senderName = player?.character_name || player?.name || 'Unknown';

      const mail = operations.sendMail(opsSession.campaignId, {
        senderName,
        senderType: 'player',
        recipientId: null,
        recipientType: 'npc',
        subject: subject || `Re: ${originalMail.subject}`,
        body,
        sentDate: currentDate
      });

      socket.emit('ops:mailSent', { mail, isReply: true });

      io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:playerReplied', {
        playerName: senderName,
        originalSender: originalMail.sender_name,
        subject: mail.subject
      });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Mail', error));
      socketLog.error('[OPS] Error replying to mail:', error);
    }
  });

  // GM: Send mail
  socket.on('ops:sendMail', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can send mail' });
        return;
      }
      const campaign = operations.getCampaign(opsSession.campaignId);
      const mail = operations.sendMail(opsSession.campaignId, {
        ...data,
        sentDate: campaign?.current_date || '1105-001'
      });
      socket.emit('ops:mailSent', { mail });

      if (data.recipientId) {
        io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:newMail', {
          recipientId: data.recipientId,
          subject: mail.subject,
          senderName: mail.sender_name
        });
      }
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Mail', error));
      socketLog.error('[OPS] Error sending mail:', error);
    }
  });

  // --- NPC Contacts ---

  // Get NPC contacts
  socket.on('ops:getNPCContacts', () => {
    try {
      if (!opsSession.campaignId) {
        socket.emit('ops:error', { message: 'Not in a campaign' });
        return;
      }

      let contacts;
      if (opsSession.isGM) {
        contacts = operations.getNPCContactsByCampaign(opsSession.campaignId);
      } else {
        contacts = operations.getNPCContactsForPlayer(opsSession.campaignId, opsSession.accountId);
      }

      socket.emit('ops:npcContactsList', { contacts, isGM: opsSession.isGM });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Contact', error));
      socketLog.error('[OPS] Error getting NPC contacts:', error);
    }
  });

  // GM: Add NPC contact
  socket.on('ops:addNPCContact', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can add NPC contacts' });
        return;
      }
      const contact = operations.addNPCContact(opsSession.campaignId, data);
      socket.emit('ops:npcContactAdded', { contact });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Contact', error));
      socketLog.error('[OPS] Error adding NPC contact:', error);
    }
  });

  // GM: Update NPC contact visibility
  socket.on('ops:updateNPCContactVisibility', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can update NPC contact visibility' });
        return;
      }
      const { contactId, visibleTo } = data;
      const contact = operations.updateNPCContact(contactId, { visibleTo });
      socket.emit('ops:npcContactUpdated', { contact });

      io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:npcContactsRefresh');
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Contact', error));
      socketLog.error('[OPS] Error updating NPC contact visibility:', error);
    }
  });

  // --- NPC Crew Management ---

  // Add NPC crew member
  socket.on('ops:addNPCCrew', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can add NPC crew' });
        return;
      }
      const { shipId, name, role, skillLevel, personality } = data;
      const crew = operations.addNPCCrew(shipId, name, role, {
        skill_level: skillLevel || 1,
        personality: personality || ''
      });
      socket.emit('ops:npcCrewAdded', { crew });
      io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:crewUpdate', { crew });
      socketLog.info(`[OPS] NPC crew added: ${name} (${role})`);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('NPC', error));
      socketLog.error('[OPS] Error adding NPC crew:', error);
    }
  });

  // Update NPC crew member
  socket.on('ops:updateNPCCrew', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can update NPC crew' });
        return;
      }
      const { crewId, updates } = data;
      const crew = operations.updateNPCCrew(crewId, updates);
      if (!crew) {
        socket.emit('ops:error', { message: 'Crew member not found' });
        return;
      }
      socket.emit('ops:npcCrewUpdated', { crew });
      io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:crewUpdate', { crew });
      socketLog.info(`[OPS] NPC crew updated: ${crewId}`);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('NPC', error));
      socketLog.error('[OPS] Error updating NPC crew:', error);
    }
  });

  // Delete NPC crew member
  socket.on('ops:deleteNPCCrew', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can delete NPC crew' });
        return;
      }
      const { crewId } = data;
      const deleted = operations.deleteNPCCrew(crewId);
      if (deleted) {
        socket.emit('ops:npcCrewDeleted', { crewId });
        io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:crewUpdate', { deleted: crewId });
        socketLog.info(`[OPS] NPC crew deleted: ${crewId}`);
      } else {
        socket.emit('ops:error', { message: 'Crew member not found' });
      }
    } catch (error) {
      socket.emit('ops:error', sanitizeError('NPC', error));
      socketLog.error('[OPS] Error deleting NPC crew:', error);
    }
  });
}

module.exports = { register };

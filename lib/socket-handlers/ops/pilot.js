/**
 * AR-30: Pilot Role Socket Handlers
 * Handles: evasive maneuvers, range control, course setting
 */

const operations = require('../../operations');

// In-memory state (ephemeral per session)
const pilotState = {
  // Map<campaignId, { evasive, destination, eta, rangeHistory, timeBlocked }>
  campaigns: new Map()
};

// Range band progression (per Traveller rules)
const RANGE_BANDS = ['adjacent', 'close', 'short', 'medium', 'long', 'veryLong', 'distant'];

/**
 * Get or create pilot state for a campaign
 */
function getPilotState(campaignId) {
  if (!pilotState.campaigns.has(campaignId)) {
    pilotState.campaigns.set(campaignId, {
      evasive: false,
      evasiveStartTime: null,
      destination: null,
      eta: null,
      rangeHistory: [], // Recent range changes (last 20)
      timeBlocked: false // GM can block pilot from passing time (default: off - pilot CAN pass time)
    });
  }
  return pilotState.campaigns.get(campaignId);
}

/**
 * Add to range history (keeps last 20)
 */
function addToRangeHistory(state, entry) {
  state.rangeHistory.unshift({
    ...entry,
    timestamp: new Date().toISOString()
  });
  if (state.rangeHistory.length > 20) {
    state.rangeHistory.pop();
  }
}

/**
 * Register pilot handlers
 * @param {Object} ctx - Shared context from context.js
 */
function register(ctx) {
  const { socket, io, opsSession, socketLog, sanitizeError } = ctx;

  // Toggle evasive maneuvers
  socket.on('ops:setEvasive', async (data) => {
    try {
      const { enabled } = data;
      const campaignId = opsSession.campaignId;

      if (!campaignId) {
        socket.emit('ops:error', { message: 'Not in a campaign' });
        return;
      }

      // Verify pilot role or GM
      const role = opsSession.role;
      if (role !== 'pilot' && !opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only Pilot can toggle evasive maneuvers' });
        return;
      }

      const state = getPilotState(campaignId);
      state.evasive = enabled;
      state.evasiveStartTime = enabled ? Date.now() : null;

      // Broadcast to all in campaign
      io.to(`ops:campaign:${campaignId}`).emit('ops:evasiveChanged', {
        enabled,
        attackDM: enabled ? -2 : 0,
        setBy: opsSession.playerName || 'Pilot',
        timestamp: new Date().toISOString()
      });

      // Log to ship log
      try {
        await operations.addShipLogEntry(campaignId, {
          type: 'pilot',
          action: enabled ? 'evasive_start' : 'evasive_end',
          message: enabled ? 'Evasive maneuvers initiated' : 'Evasive maneuvers ended',
          player: opsSession.playerName
        });
      } catch (logErr) {
        socketLog.error('[PILOT] Log error:', logErr.message);
      }

      socketLog.info(`[PILOT] ${opsSession.playerName} ${enabled ? 'started' : 'ended'} evasive in ${campaignId}`);
    } catch (error) {
      socketLog.error('[PILOT] setEvasive error:', error);
      socket.emit('ops:error', { message: sanitizeError(error) });
    }
  });

  // Change range to a contact
  socket.on('ops:setRange', async (data) => {
    try {
      const { contactId, action } = data; // action: 'approach' | 'withdraw' | 'maintain'
      const campaignId = opsSession.campaignId;

      if (!campaignId) {
        socket.emit('ops:error', { message: 'Not in a campaign' });
        return;
      }

      // Verify pilot role or GM
      const role = opsSession.role;
      if (role !== 'pilot' && !opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only Pilot can change range' });
        return;
      }

      // Get campaign and contact
      const campaign = await operations.getCampaign(campaignId);
      if (!campaign) {
        socket.emit('ops:error', { message: 'Campaign not found' });
        return;
      }

      const contacts = campaign.sensorContacts || [];
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) {
        socket.emit('ops:error', { message: 'Contact not found' });
        return;
      }

      const currentRange = contact.range || 'medium';
      const currentIndex = RANGE_BANDS.indexOf(currentRange);
      let newIndex = currentIndex;

      if (action === 'approach' && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (action === 'withdraw' && currentIndex < RANGE_BANDS.length - 1) {
        newIndex = currentIndex + 1;
      }

      const newRange = RANGE_BANDS[newIndex];

      if (newRange !== currentRange) {
        // Update contact range
        contact.range = newRange;
        await operations.updateCampaign(campaignId, { sensorContacts: contacts });

        const state = getPilotState(campaignId);
        addToRangeHistory(state, {
          contactId,
          contactName: contact.designation || contact.name,
          action,
          from: currentRange,
          to: newRange
        });

        // Broadcast range change
        io.to(`ops:campaign:${campaignId}`).emit('ops:rangeChanged', {
          contactId,
          newRange,
          previousRange: currentRange,
          action,
          setBy: opsSession.playerName || 'Pilot',
          timestamp: new Date().toISOString()
        });

        // Log
        try {
          await operations.addShipLogEntry(campaignId, {
            type: 'pilot',
            action: 'range_change',
            message: `${action === 'approach' ? 'Closing' : 'Withdrawing'} to ${newRange} range from ${contact.designation || contact.name}`,
            player: opsSession.playerName
          });
        } catch (logErr) {
          socketLog.error('[PILOT] Log error:', logErr.message);
        }

        socketLog.info(`[PILOT] Range ${contactId}: ${currentRange} -> ${newRange}`);
      } else {
        socket.emit('ops:info', { message: `Already at ${action === 'approach' ? 'closest' : 'furthest'} range` });
      }
    } catch (error) {
      socketLog.error('[PILOT] setRange error:', error);
      socket.emit('ops:error', { message: sanitizeError(error) });
    }
  });

  // Set course/destination
  socket.on('ops:setCourse', async (data) => {
    try {
      const { destination, eta, travelTime } = data;
      const campaignId = opsSession.campaignId;

      if (!campaignId) {
        socket.emit('ops:error', { message: 'Not in a campaign' });
        return;
      }

      const role = opsSession.role;
      if (role !== 'pilot' && !opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only Pilot can set course' });
        return;
      }

      const state = getPilotState(campaignId);
      state.destination = destination;
      state.eta = eta;

      // Update campaign
      await operations.updateCampaign(campaignId, {
        destination,
        eta,
        travelTime: travelTime || null
      });

      // Broadcast
      io.to(`ops:campaign:${campaignId}`).emit('ops:courseChanged', {
        destination,
        eta,
        travelTime,
        setBy: opsSession.playerName || 'Pilot',
        timestamp: new Date().toISOString()
      });

      // Log
      try {
        await operations.addShipLogEntry(campaignId, {
          type: 'pilot',
          action: 'course_set',
          message: `Course set for ${destination}${eta ? ` (ETA: ${eta})` : ''}`,
          player: opsSession.playerName
        });
      } catch (logErr) {
        socketLog.error('[PILOT] Log error:', logErr.message);
      }

      socketLog.info(`[PILOT] Course set to ${destination} in ${campaignId}`);
    } catch (error) {
      socketLog.error('[PILOT] setCourse error:', error);
      socket.emit('ops:error', { message: sanitizeError(error) });
    }
  });

  // Clear destination
  socket.on('ops:clearCourse', async () => {
    try {
      const campaignId = opsSession.campaignId;
      if (!campaignId) return;

      const role = opsSession.role;
      if (role !== 'pilot' && !opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only Pilot can clear course' });
        return;
      }

      const state = getPilotState(campaignId);
      state.destination = null;
      state.eta = null;

      await operations.updateCampaign(campaignId, {
        destination: null,
        eta: null,
        travelTime: null
      });

      io.to(`ops:campaign:${campaignId}`).emit('ops:courseCleared', {
        setBy: opsSession.playerName || 'Pilot',
        timestamp: new Date().toISOString()
      });

      socketLog.info(`[PILOT] Course cleared in ${campaignId}`);
    } catch (error) {
      socketLog.error('[PILOT] clearCourse error:', error);
      socket.emit('ops:error', { message: sanitizeError(error) });
    }
  });

  // Pass time for journey (advance time by travelTime hours)
  socket.on('ops:passTime', async (data) => {
    try {
      const { hours, reason } = data;
      const campaignId = opsSession.campaignId;

      if (!campaignId) {
        socket.emit('ops:error', { message: 'Not in a campaign' });
        return;
      }

      // Check role - pilot or GM
      const role = opsSession.role;
      if (role !== 'pilot' && !opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only Pilot can pass time' });
        return;
      }

      // Check if GM has blocked time advancement
      const state = getPilotState(campaignId);
      if (state.timeBlocked && !opsSession.isGM) {
        socket.emit('ops:error', { message: 'GM has blocked time advancement' });
        return;
      }

      // Validate hours
      const hoursToPass = parseInt(hours) || 0;
      if (hoursToPass <= 0 || hoursToPass > 168) { // Max 1 week
        socket.emit('ops:error', { message: 'Invalid time: 1-168 hours allowed' });
        return;
      }

      // Get current date and advance
      const campaign = await operations.getCampaign(campaignId);
      const newDate = operations.advanceDate(campaign.current_date, hoursToPass, 0);

      await operations.updateCampaign(campaignId, {
        current_date: newDate
      });

      // Broadcast time update
      io.to(`ops:campaign:${campaignId}`).emit('ops:timeUpdated', {
        currentDate: newDate,
        hoursAdvanced: hoursToPass,
        reason: reason || `Pilot passed ${hoursToPass} hours`,
        advancedBy: opsSession.playerName || 'Pilot'
      });

      // Log
      try {
        await operations.addShipLogEntry(campaignId, {
          type: 'pilot',
          action: 'time_passed',
          message: `${hoursToPass} hours passed${reason ? `: ${reason}` : ''}`,
          player: opsSession.playerName
        });
      } catch (logErr) {
        socketLog.error('[PILOT] Log error:', logErr.message);
      }

      socketLog.info(`[PILOT] Passed ${hoursToPass}h in ${campaignId}, new date: ${newDate}`);
    } catch (error) {
      socketLog.error('[PILOT] passTime error:', error);
      socket.emit('ops:error', { message: sanitizeError(error) });
    }
  });

  // GM: Block/unblock pilot time advancement
  socket.on('ops:setTimeBlocked', async (data) => {
    try {
      const { blocked } = data;
      const campaignId = opsSession.campaignId;

      if (!campaignId) {
        socket.emit('ops:error', { message: 'Not in a campaign' });
        return;
      }

      // GM only
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can toggle time block' });
        return;
      }

      const state = getPilotState(campaignId);
      state.timeBlocked = !!blocked;

      // Broadcast
      io.to(`ops:campaign:${campaignId}`).emit('ops:timeBlockedChanged', {
        blocked: state.timeBlocked,
        setBy: 'GM'
      });

      socketLog.info(`[PILOT] Time advancement ${state.timeBlocked ? 'blocked' : 'unblocked'} in ${campaignId}`);
    } catch (error) {
      socketLog.error('[PILOT] setTimeBlocked error:', error);
      socket.emit('ops:error', { message: sanitizeError(error) });
    }
  });

  // Get pilot status
  socket.on('ops:getPilotStatus', () => {
    const campaignId = opsSession.campaignId;
    if (!campaignId) return;

    const state = getPilotState(campaignId);
    socket.emit('ops:pilotStatus', {
      evasive: state.evasive,
      destination: state.destination,
      eta: state.eta,
      rangeHistory: state.rangeHistory.slice(0, 10),
      timeBlocked: state.timeBlocked
    });
  });
}

/**
 * Check if evasive maneuvers are active for a campaign
 */
function isEvasive(campaignId) {
  const state = pilotState.campaigns.get(campaignId);
  return state?.evasive || false;
}

/**
 * Get evasive DM for combat (-2 to incoming attacks)
 */
function getEvasiveDM(campaignId) {
  return isEvasive(campaignId) ? -2 : 0;
}

/**
 * Get pilot state (for other modules)
 */
function getState(campaignId) {
  return pilotState.campaigns.get(campaignId) || null;
}

module.exports = {
  register,
  isEvasive,
  getEvasiveDM,
  getState,
  RANGE_BANDS
};

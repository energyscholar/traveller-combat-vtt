/**
 * Operations Socket Handlers
 * Handles all operations-related socket events:
 * - Campaign management (ops:getCampaigns, ops:createCampaign, etc.)
 * - Player accounts (ops:joinCampaignAsPlayer, ops:selectPlayerSlot, etc.)
 * - Bridge operations (ops:joinBridge, ops:addLogEntry, etc.)
 * - Ship management (ops:selectShip, ops:addShip, etc.)
 */

const operations = require('../operations');
const { socket: socketLog } = require('../logger');

/**
 * Register operations handlers
 * @param {Socket} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance
 * @param {Object} state - Shared application state (not used currently)
 */
function register(socket, io, state) {
  // Track operations session state for this socket
  let opsSession = {
    campaignId: null,
    accountId: null,
    isGM: false,
    isGuest: false,
    shipId: null,
    role: null
  };

  // --- Campaign Management (GM) ---

  // Get all campaigns (GM login)
  socket.on('ops:getCampaigns', () => {
    try {
      const campaigns = operations.getAllCampaigns();
      socket.emit('ops:campaigns', { campaigns });
      socketLog.info(`[OPS] Retrieved ${campaigns.length} campaigns`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to get campaigns', error: error.message });
      socketLog.error('[OPS] Error getting campaigns:', error);
    }
  });

  // Create new campaign
  socket.on('ops:createCampaign', (data) => {
    try {
      const { name, gmName } = data;
      if (!name || !gmName) {
        socket.emit('ops:error', { message: 'Campaign name and GM name are required' });
        return;
      }
      const campaign = operations.createCampaign(name, gmName);
      socket.emit('ops:campaignCreated', { campaign });
      socketLog.info(`[OPS] Campaign created: ${campaign.id} "${name}" by ${gmName}`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to create campaign', error: error.message });
      socketLog.error('[OPS] Error creating campaign:', error);
    }
  });

  // Select campaign (GM loads campaign data)
  socket.on('ops:selectCampaign', (data) => {
    try {
      const { campaignId } = data;
      const fullData = operations.getFullCampaignData(campaignId);
      if (!fullData) {
        socket.emit('ops:error', { message: 'Campaign not found' });
        return;
      }
      opsSession.campaignId = campaignId;
      opsSession.isGM = true;
      socket.join(`ops:campaign:${campaignId}`);
      socket.emit('ops:campaignData', fullData);
      socketLog.info(`[OPS] GM selected campaign: ${campaignId}`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to load campaign', error: error.message });
      socketLog.error('[OPS] Error loading campaign:', error);
    }
  });

  // Update campaign settings
  socket.on('ops:updateCampaign', (data) => {
    try {
      const { campaignId, updates } = data;
      if (!opsSession.isGM || opsSession.campaignId !== campaignId) {
        socket.emit('ops:error', { message: 'Not authorized to update this campaign' });
        return;
      }
      const campaign = operations.updateCampaign(campaignId, updates);
      io.to(`ops:campaign:${campaignId}`).emit('ops:campaignUpdated', { campaign });
      socketLog.info(`[OPS] Campaign updated: ${campaignId}`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to update campaign', error: error.message });
      socketLog.error('[OPS] Error updating campaign:', error);
    }
  });

  // Delete campaign
  socket.on('ops:deleteCampaign', (data) => {
    try {
      const { campaignId } = data;
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can delete campaigns' });
        return;
      }
      operations.deleteCampaign(campaignId);
      socket.emit('ops:campaignDeleted', { campaignId });
      socketLog.info(`[OPS] Campaign deleted: ${campaignId}`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to delete campaign', error: error.message });
      socketLog.error('[OPS] Error deleting campaign:', error);
    }
  });

  // --- Player Slot Management (GM) ---

  // Create player slot
  socket.on('ops:createPlayerSlot', (data) => {
    try {
      const { campaignId, slotName } = data;
      if (!opsSession.isGM || opsSession.campaignId !== campaignId) {
        socket.emit('ops:error', { message: 'Not authorized' });
        return;
      }
      const account = operations.createPlayerSlot(campaignId, slotName);
      io.to(`ops:campaign:${campaignId}`).emit('ops:playerSlotCreated', { account });
      socketLog.info(`[OPS] Player slot created: ${account.id} "${slotName}"`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to create player slot', error: error.message });
      socketLog.error('[OPS] Error creating player slot:', error);
    }
  });

  // Delete player slot
  socket.on('ops:deletePlayerSlot', (data) => {
    try {
      const { accountId } = data;
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can delete player slots' });
        return;
      }
      operations.deletePlayerSlot(accountId);
      io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:playerSlotDeleted', { accountId });
      socketLog.info(`[OPS] Player slot deleted: ${accountId}`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to delete player slot', error: error.message });
      socketLog.error('[OPS] Error deleting player slot:', error);
    }
  });

  // --- Player Join Flow ---

  // Player joins campaign by code/ID
  socket.on('ops:joinCampaignAsPlayer', (data) => {
    try {
      const { campaignId } = data;
      const campaign = operations.getCampaign(campaignId);
      if (!campaign) {
        socket.emit('ops:error', { message: 'Campaign not found. Check the code and try again.' });
        return;
      }
      const players = operations.getPlayerAccountsByCampaign(campaignId);
      opsSession.campaignId = campaignId;
      socket.join(`ops:campaign:${campaignId}`);
      socket.emit('ops:campaignJoined', {
        campaign,
        availableSlots: players.filter(p => !p.last_login || Date.now() - new Date(p.last_login).getTime() > 300000)
      });
      socketLog.info(`[OPS] Player viewing campaign: ${campaignId}`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to join campaign', error: error.message });
      socketLog.error('[OPS] Error joining campaign:', error);
    }
  });

  // Player selects their slot
  socket.on('ops:selectPlayerSlot', (data) => {
    try {
      const { accountId } = data;
      const account = operations.getPlayerAccount(accountId);
      if (!account) {
        socket.emit('ops:error', { message: 'Player slot not found' });
        return;
      }
      operations.recordPlayerLogin(accountId);
      opsSession.accountId = accountId;
      opsSession.isGuest = false;
      // Get ships available for this campaign
      const ships = operations.getPartyShips(account.campaign_id);
      socket.emit('ops:playerSlotSelected', {
        account,
        ships,
        availableRoles: operations.ALL_ROLES
      });
      // Notify others in campaign
      socket.to(`ops:campaign:${account.campaign_id}`).emit('ops:playerJoined', {
        accountId,
        slotName: account.slot_name
      });
      socketLog.info(`[OPS] Player selected slot: ${accountId} "${account.slot_name}"`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to select player slot', error: error.message });
      socketLog.error('[OPS] Error selecting player slot:', error);
    }
  });

  // Guest joins campaign (any role, skill 0)
  socket.on('ops:joinAsGuest', (data) => {
    try {
      const { campaignId, guestName } = data;
      const campaign = operations.getCampaign(campaignId);
      if (!campaign) {
        socket.emit('ops:error', { message: 'Campaign not found' });
        return;
      }
      // Guest doesn't get a database account, just session state
      opsSession.campaignId = campaignId;
      opsSession.isGuest = true;
      opsSession.guestName = guestName || 'Guest';
      socket.join(`ops:campaign:${campaignId}`);
      // Get ships available
      const ships = operations.getPartyShips(campaignId);
      socket.emit('ops:guestJoined', {
        campaign,
        ships,
        availableRoles: operations.ALL_ROLES,
        guestName: opsSession.guestName,
        defaultSkill: 0  // Guests always start with skill 0
      });
      socketLog.info(`[OPS] Guest "${opsSession.guestName}" joined campaign: ${campaignId}`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to join as guest', error: error.message });
      socketLog.error('[OPS] Error joining as guest:', error);
    }
  });

  // GM overrides guest skill level
  socket.on('ops:setGuestSkill', (data) => {
    try {
      const { targetSocketId, role, skillLevel } = data;
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can set guest skill levels' });
        return;
      }
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.emit('ops:skillOverride', { role, skillLevel });
        socketLog.info(`[OPS] GM set guest skill: ${role} = ${skillLevel}`);
      }
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to set guest skill', error: error.message });
    }
  });

  // --- Character Import ---

  // Import character data
  socket.on('ops:importCharacter', (data) => {
    try {
      const { characterData } = data;
      if (!opsSession.accountId && !opsSession.isGuest) {
        socket.emit('ops:error', { message: 'Must select a player slot first' });
        return;
      }
      if (opsSession.isGuest) {
        // For guests, just store in session
        opsSession.character = characterData;
        socket.emit('ops:characterImported', { character: characterData });
        socketLog.info(`[OPS] Guest character set: ${characterData.name}`);
      } else {
        const account = operations.importCharacter(opsSession.accountId, characterData);
        socket.emit('ops:characterImported', { character: account.character_data });
        socketLog.info(`[OPS] Character imported: ${characterData.name}`);
      }
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to import character', error: error.message });
      socketLog.error('[OPS] Error importing character:', error);
    }
  });

  // --- Ship & Role Selection ---

  // Select ship
  socket.on('ops:selectShip', (data) => {
    try {
      const { shipId } = data;
      const ship = operations.getShip(shipId);
      if (!ship) {
        socket.emit('ops:error', { message: 'Ship not found' });
        return;
      }
      opsSession.shipId = shipId;
      if (opsSession.accountId) {
        operations.updatePlayerAccount(opsSession.accountId, { ship_id: shipId });
      }
      // Get crew already on this ship
      const crew = operations.getPlayersByShip(shipId);
      const npcCrew = operations.getNPCCrewByShip(shipId);
      socket.emit('ops:shipSelected', {
        ship,
        crew,
        npcCrew,
        takenRoles: crew.map(c => c.role).filter(r => r)
      });
      socketLog.info(`[OPS] Ship selected: ${shipId} "${ship.name}"`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to select ship', error: error.message });
      socketLog.error('[OPS] Error selecting ship:', error);
    }
  });

  // Assign role (with validation for multiple identical roles)
  socket.on('ops:assignRole', (data) => {
    try {
      const { role } = data;
      if (!opsSession.shipId) {
        socket.emit('ops:error', { message: 'Must select a ship first' });
        return;
      }
      // Note: isRoleAvailable checks if role is taken by another player
      // For ships with multiple identical roles (e.g., 2 gunners), we'd need
      // to check ship configuration for max slots per role (future enhancement)
      if (!opsSession.isGuest) {
        const isAvailable = operations.isRoleAvailable(opsSession.shipId, role, opsSession.accountId);
        if (!isAvailable) {
          socket.emit('ops:error', { message: `Role "${role}" is already taken on this ship` });
          return;
        }
        operations.assignRole(opsSession.accountId, role);
      }
      opsSession.role = role;
      socket.emit('ops:roleAssigned', { role });
      // Notify others in campaign
      socket.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:crewUpdate', {
        shipId: opsSession.shipId,
        accountId: opsSession.accountId,
        slotName: opsSession.isGuest ? opsSession.guestName : null,
        role
      });
      socketLog.info(`[OPS] Role assigned: ${role}`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to assign role', error: error.message });
      socketLog.error('[OPS] Error assigning role:', error);
    }
  });

  // --- Bridge Operations ---

  // Join bridge (player ready to operate)
  socket.on('ops:joinBridge', () => {
    try {
      if (!opsSession.shipId || !opsSession.role) {
        socket.emit('ops:error', { message: 'Must select ship and role before joining bridge' });
        return;
      }
      socket.join(`ops:bridge:${opsSession.shipId}`);
      // Get current bridge state
      const ship = operations.getShip(opsSession.shipId);
      const crew = operations.getPlayersByShip(opsSession.shipId);
      const npcCrew = operations.getNPCCrewByShip(opsSession.shipId);
      const campaign = operations.getCampaign(opsSession.campaignId);
      const logs = operations.getShipLog(opsSession.shipId, { limit: 50 });
      const roleView = operations.ROLE_VIEWS[opsSession.role] || operations.ROLE_VIEWS.pilot;
      socket.emit('ops:bridgeJoined', {
        ship,
        crew,
        npcCrew,
        campaign,
        logs,
        role: opsSession.role,
        roleView,
        alertStatus: ship.current_state.alertStatus || 'NORMAL'
      });
      // Notify bridge
      io.to(`ops:bridge:${opsSession.shipId}`).emit('ops:crewOnBridge', {
        accountId: opsSession.accountId,
        role: opsSession.role,
        name: opsSession.isGuest ? opsSession.guestName : null
      });
      socketLog.info(`[OPS] Joined bridge: ${opsSession.shipId} as ${opsSession.role}`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to join bridge', error: error.message });
      socketLog.error('[OPS] Error joining bridge:', error);
    }
  });

  // GM starts session
  socket.on('ops:startSession', () => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can start session' });
        return;
      }
      // Add log entry
      const ships = operations.getPartyShips(opsSession.campaignId);
      const campaign = operations.getCampaign(opsSession.campaignId);
      ships.forEach(ship => {
        operations.addLogEntry(ship.id, opsSession.campaignId, {
          gameDate: campaign.current_date,
          entryType: 'session',
          message: 'Session started',
          actor: 'GM'
        });
      });
      io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:sessionStarted', {
        gameDate: campaign.current_date,
        currentSystem: campaign.current_system
      });
      socketLog.info(`[OPS] Session started for campaign: ${opsSession.campaignId}`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to start session', error: error.message });
      socketLog.error('[OPS] Error starting session:', error);
    }
  });

  // Add ship log entry
  socket.on('ops:addLogEntry', (data) => {
    try {
      const { message, entryType } = data;
      if (!opsSession.shipId) {
        socket.emit('ops:error', { message: 'Not on a ship' });
        return;
      }
      const campaign = operations.getCampaign(opsSession.campaignId);
      const entry = operations.addLogEntry(opsSession.shipId, opsSession.campaignId, {
        gameDate: campaign.current_date,
        entryType: entryType || 'note',
        message,
        actor: opsSession.isGuest ? opsSession.guestName : opsSession.role
      });
      io.to(`ops:bridge:${opsSession.shipId}`).emit('ops:logEntry', { entry });
      socketLog.info(`[OPS] Log entry added: ${message.substring(0, 50)}`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to add log entry', error: error.message });
      socketLog.error('[OPS] Error adding log entry:', error);
    }
  });

  // GM advances time
  socket.on('ops:advanceTime', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can advance time' });
        return;
      }
      const { hours = 0, minutes = 0 } = data;
      const campaign = operations.getCampaign(opsSession.campaignId);
      // Parse current date (format: YYYY-DDD HH:MM)
      const [datePart, timePart] = campaign.current_date.split(' ');
      const [year, day] = datePart.split('-').map(Number);
      const [currentHours, currentMinutes] = (timePart || '00:00').split(':').map(Number);

      let newMinutes = currentMinutes + minutes;
      let newHours = currentHours + hours + Math.floor(newMinutes / 60);
      newMinutes = newMinutes % 60;
      let newDay = day + Math.floor(newHours / 24);
      newHours = newHours % 24;
      let newYear = year + Math.floor((newDay - 1) / 365);
      newDay = ((newDay - 1) % 365) + 1;

      const newDate = `${newYear}-${String(newDay).padStart(3, '0')} ${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
      operations.updateCampaign(opsSession.campaignId, { current_date: newDate });

      // Log time advance
      const ships = operations.getPartyShips(opsSession.campaignId);
      ships.forEach(ship => {
        operations.addLogEntry(ship.id, opsSession.campaignId, {
          gameDate: newDate,
          entryType: 'time',
          message: `Time advanced: +${hours}h ${minutes}m`,
          actor: 'GM'
        });
      });

      io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:timeAdvanced', {
        previousDate: campaign.current_date,
        newDate,
        hoursAdvanced: hours,
        minutesAdvanced: minutes
      });
      socketLog.info(`[OPS] Time advanced to: ${newDate}`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to advance time', error: error.message });
      socketLog.error('[OPS] Error advancing time:', error);
    }
  });

  // Set alert status (Captain or GM)
  socket.on('ops:setAlertStatus', (data) => {
    try {
      const { status } = data;
      if (!opsSession.isGM && opsSession.role !== 'captain') {
        socket.emit('ops:error', { message: 'Only Captain or GM can change alert status' });
        return;
      }
      if (!['NORMAL', 'YELLOW', 'RED'].includes(status)) {
        socket.emit('ops:error', { message: 'Invalid alert status' });
        return;
      }
      operations.updateShipState(opsSession.shipId, { alertStatus: status });
      const campaign = operations.getCampaign(opsSession.campaignId);
      operations.addLogEntry(opsSession.shipId, opsSession.campaignId, {
        gameDate: campaign.current_date,
        entryType: 'alert',
        message: `Alert status changed to ${status}`,
        actor: opsSession.isGM ? 'GM' : 'Captain'
      });
      io.to(`ops:bridge:${opsSession.shipId}`).emit('ops:alertStatusChanged', {
        status,
        alertInfo: operations.ALERT_STATUS[status]
      });
      socketLog.info(`[OPS] Alert status changed: ${status}`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to set alert status', error: error.message });
      socketLog.error('[OPS] Error setting alert status:', error);
    }
  });

  // --- Ship Management (GM) ---

  // Add ship to campaign
  socket.on('ops:addShip', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can add ships' });
        return;
      }
      const { name, shipData, isPartyShip } = data;
      const ship = operations.addShip(opsSession.campaignId, name, shipData, {
        isPartyShip: isPartyShip !== false,
        visibleToPlayers: true
      });
      io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:shipAdded', { ship });
      socketLog.info(`[OPS] Ship added: ${ship.id} "${name}"`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to add ship', error: error.message });
      socketLog.error('[OPS] Error adding ship:', error);
    }
  });

  // Delete ship
  socket.on('ops:deleteShip', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can delete ships' });
        return;
      }
      const { shipId } = data;
      operations.deleteShip(shipId);
      io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:shipDeleted', { shipId });
      socketLog.info(`[OPS] Ship deleted: ${shipId}`);
    } catch (error) {
      socket.emit('ops:error', { message: 'Failed to delete ship', error: error.message });
      socketLog.error('[OPS] Error deleting ship:', error);
    }
  });
}

module.exports = {
  register
};

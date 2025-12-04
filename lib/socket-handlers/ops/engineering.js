/**
 * Engineering/Systems Handlers
 * Handles: getSystemStatus, applySystemDamage, repairSystem, clearSystemDamage
 */

/**
 * Register engineering handlers
 * @param {Object} ctx - Shared context from context.js
 */
function register(ctx) {
  const { socket, io, opsSession, operations, socketLog, sanitizeError } = ctx;

  // Get system status for current ship
  socket.on('ops:getSystemStatus', () => {
    try {
      if (!opsSession.shipId) {
        socket.emit('ops:error', { message: 'Not on a ship' });
        return;
      }
      const ship = operations.getShip(opsSession.shipId);
      const systemStatus = operations.getSystemStatuses(ship);
      const damagedSystems = operations.getDamagedSystems(ship);
      socket.emit('ops:systemStatus', { systemStatus, damagedSystems });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('System', error));
      socketLog.error('[OPS] Error getting system status:', error);
    }
  });

  // GM applies damage to ship system
  socket.on('ops:applySystemDamage', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can apply damage' });
        return;
      }
      const { shipId, location, severity } = data;
      const targetShipId = shipId || opsSession.shipId;
      if (!targetShipId) {
        socket.emit('ops:error', { message: 'No ship specified' });
        return;
      }
      const result = operations.applySystemDamage(targetShipId, location, severity);
      if (!result.success) {
        socket.emit('ops:error', { message: result.error });
        return;
      }
      const campaign = operations.getCampaign(opsSession.campaignId);
      operations.addLogEntry(targetShipId, opsSession.campaignId, {
        gameDate: campaign.current_date,
        entryType: 'damage',
        message: `System damage: ${location} (Severity ${severity})`,
        actor: 'GM'
      });
      io.to(`ops:bridge:${targetShipId}`).emit('ops:systemDamaged', {
        location,
        severity,
        totalSeverity: result.totalSeverity,
        message: result.message,
        systemStatus: result.systemStatus
      });
      socketLog.info(`[OPS] System damage applied: ${location} sev ${severity} on ${targetShipId}`);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Damage', error));
      socketLog.error('[OPS] Error applying system damage:', error);
    }
  });

  // Engineer attempts repair
  socket.on('ops:repairSystem', (data) => {
    try {
      if (!opsSession.shipId) {
        socket.emit('ops:error', { message: 'Not on a ship' });
        return;
      }
      if (!opsSession.isGM && opsSession.role !== 'engineer' && opsSession.role !== 'damage_control') {
        socket.emit('ops:error', { message: 'Only engineers can repair systems' });
        return;
      }
      const { location, engineerSkill = 0 } = data;
      const result = operations.repairSystem(opsSession.shipId, location, engineerSkill);
      const campaign = operations.getCampaign(opsSession.campaignId);
      operations.addLogEntry(opsSession.shipId, opsSession.campaignId, {
        gameDate: campaign.current_date,
        entryType: 'repair',
        message: result.message,
        actor: opsSession.isGM ? 'GM' : 'Engineer'
      });
      io.to(`ops:bridge:${opsSession.shipId}`).emit('ops:repairAttempted', {
        ...result,
        location
      });
      socketLog.info(`[OPS] Repair attempted: ${location} - ${result.success ? 'success' : 'failed'}`);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Repair', error));
      socketLog.error('[OPS] Error repairing system:', error);
    }
  });

  // GM clears damage from system
  socket.on('ops:clearSystemDamage', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can clear damage' });
        return;
      }
      const { shipId, location } = data;
      const targetShipId = shipId || opsSession.shipId;
      if (!targetShipId) {
        socket.emit('ops:error', { message: 'No ship specified' });
        return;
      }
      const result = operations.clearSystemDamage(targetShipId, location);
      if (!result.success) {
        socket.emit('ops:error', { message: result.error });
        return;
      }
      const campaign = operations.getCampaign(opsSession.campaignId);
      operations.addLogEntry(targetShipId, opsSession.campaignId, {
        gameDate: campaign.current_date,
        entryType: 'repair',
        message: `Damage cleared: ${location === 'all' ? 'all systems' : location}`,
        actor: 'GM'
      });
      io.to(`ops:bridge:${targetShipId}`).emit('ops:systemDamageCleared', {
        location: result.cleared,
        systemStatus: result.systemStatus
      });
      socketLog.info(`[OPS] System damage cleared: ${location} on ${targetShipId}`);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Damage', error));
      socketLog.error('[OPS] Error clearing system damage:', error);
    }
  });
}

module.exports = { register };

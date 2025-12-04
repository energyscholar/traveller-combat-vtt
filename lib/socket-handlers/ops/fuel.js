/**
 * Fuel Management Handlers
 * Handles: getFuelStatus, getRefuelOptions, canRefuel, refuel,
 *          startFuelProcessing, checkFuelProcessing, getJumpFuelPenalties
 */

/**
 * Register fuel handlers
 * @param {Object} ctx - Shared context from context.js
 */
function register(ctx) {
  const { socket, io, opsSession, operations, socketLog, sanitizeError } = ctx;

  // Get fuel status for current ship
  socket.on('ops:getFuelStatus', () => {
    try {
      if (!opsSession.shipId) {
        socket.emit('ops:error', { message: 'Not on a ship' });
        return;
      }
      const fuelStatus = operations.getFuelStatus(opsSession.shipId);
      socket.emit('ops:fuelStatus', fuelStatus);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Fuel', error));
      socketLog.error('[OPS] Error getting fuel status:', error);
    }
  });

  // Get available refueling sources
  socket.on('ops:getRefuelOptions', () => {
    try {
      if (!opsSession.campaignId) {
        socket.emit('ops:error', { message: 'Not in a campaign' });
        return;
      }
      const sources = operations.getAvailableSources(opsSession.campaignId);
      let fuelStatus = null;
      if (opsSession.shipId) {
        fuelStatus = operations.getFuelStatus(opsSession.shipId);
      }
      socket.emit('ops:refuelOptions', {
        sources,
        fuelStatus,
        fuelTypes: operations.FUEL_TYPES
      });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Fuel', error));
      socketLog.error('[OPS] Error getting refuel options:', error);
    }
  });

  // Check if can refuel from source
  socket.on('ops:canRefuel', (data) => {
    try {
      if (!opsSession.shipId) {
        socket.emit('ops:error', { message: 'Not on a ship' });
        return;
      }
      const { sourceId, tons } = data;
      const result = operations.canRefuel(opsSession.shipId, sourceId, tons);
      socket.emit('ops:canRefuelResult', result);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Fuel', error));
      socketLog.error('[OPS] Error checking refuel:', error);
    }
  });

  // Execute refueling
  socket.on('ops:refuel', (data) => {
    try {
      if (!opsSession.shipId) {
        socket.emit('ops:error', { message: 'Not on a ship' });
        return;
      }
      if (!opsSession.isGM && opsSession.role !== 'engineer' && opsSession.role !== 'pilot') {
        socket.emit('ops:error', { message: 'Only engineer or pilot can manage refueling' });
        return;
      }
      const { sourceId, tons } = data;
      const result = operations.refuel(opsSession.shipId, opsSession.campaignId, sourceId, tons);
      if (!result.success) {
        socket.emit('ops:error', { message: result.error });
        return;
      }
      io.to(`ops:bridge:${opsSession.shipId}`).emit('ops:refueled', {
        ...result,
        initiatedBy: opsSession.isGM ? 'GM' : opsSession.role
      });
      socketLog.info(`[OPS] Refueled ${tons} tons of ${result.fuelType} from ${sourceId}`);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Fuel', error));
      socketLog.error('[OPS] Error refueling:', error);
    }
  });

  // Start fuel processing
  socket.on('ops:startFuelProcessing', (data) => {
    try {
      if (!opsSession.shipId) {
        socket.emit('ops:error', { message: 'Not on a ship' });
        return;
      }
      if (!opsSession.isGM && opsSession.role !== 'engineer') {
        socket.emit('ops:error', { message: 'Only engineer can process fuel' });
        return;
      }
      const { tons } = data;
      const result = operations.startFuelProcessing(opsSession.shipId, opsSession.campaignId, tons);
      if (!result.success) {
        socket.emit('ops:error', { message: result.error });
        return;
      }
      io.to(`ops:bridge:${opsSession.shipId}`).emit('ops:fuelProcessingStarted', {
        ...result,
        initiatedBy: opsSession.isGM ? 'GM' : 'Engineer'
      });
      socketLog.info(`[OPS] Started processing ${tons} tons of fuel (${result.timeHours}h)`);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Fuel', error));
      socketLog.error('[OPS] Error starting fuel processing:', error);
    }
  });

  // Check fuel processing status
  socket.on('ops:checkFuelProcessing', () => {
    try {
      if (!opsSession.shipId) {
        socket.emit('ops:error', { message: 'Not on a ship' });
        return;
      }
      const result = operations.checkFuelProcessing(opsSession.shipId, opsSession.campaignId);
      socket.emit('ops:fuelProcessingStatus', result);
      if (result.completed) {
        io.to(`ops:bridge:${opsSession.shipId}`).emit('ops:fuelProcessingCompleted', {
          tons: result.tons,
          newFuelStatus: result.newFuelStatus
        });
      }
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Fuel', error));
      socketLog.error('[OPS] Error checking fuel processing:', error);
    }
  });

  // Get jump fuel penalties
  socket.on('ops:getJumpFuelPenalties', (data) => {
    try {
      if (!opsSession.shipId) {
        socket.emit('ops:error', { message: 'Not on a ship' });
        return;
      }
      const { fuelNeeded } = data;
      const penalties = operations.getJumpFuelPenalties(opsSession.shipId, fuelNeeded);
      socket.emit('ops:jumpFuelPenalties', penalties);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Fuel', error));
      socketLog.error('[OPS] Error getting fuel penalties:', error);
    }
  });
}

module.exports = { register };

/**
 * AR-27: Shared Map Socket Handlers
 * Handles: shareMap, unshareMap, updateMapView, getMapState
 */

const sharedMap = require('../../operations/shared-map');

/**
 * Register shared map handlers
 * @param {Object} ctx - Shared context from context.js
 */
function register(ctx) {
  const { socket, io, opsSession, socketLog, sanitizeError } = ctx;

  // GM shares map with all players
  socket.on('ops:shareMap', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can share the map' });
        return;
      }
      if (!opsSession.campaignId) {
        socket.emit('ops:error', { message: 'No campaign selected' });
        return;
      }

      const { center, sector, hex, zoom } = data || {};
      const state = sharedMap.shareMap(opsSession.campaignId, {
        center,
        sector,
        hex,
        zoom,
        sharedBy: socket.id
      });

      // Broadcast to all in campaign - they should auto-switch to map view
      io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:mapShared', {
        ...state,
        autoSwitch: true
      });

      socketLog.info(`[OPS] Map shared for campaign: ${opsSession.campaignId}`);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Map', error));
      socketLog.error('[OPS] Error sharing map:', error);
    }
  });

  // GM stops sharing map
  socket.on('ops:unshareMap', () => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can unshare the map' });
        return;
      }
      if (!opsSession.campaignId) {
        socket.emit('ops:error', { message: 'No campaign selected' });
        return;
      }

      sharedMap.unshareMap(opsSession.campaignId);

      // Broadcast to all - they should return to role panels
      io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:mapUnshared', {});

      socketLog.info(`[OPS] Map unshared for campaign: ${opsSession.campaignId}`);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Map', error));
      socketLog.error('[OPS] Error unsharing map:', error);
    }
  });

  // GM updates map view (pan/zoom) - all players follow
  socket.on('ops:updateMapView', (data) => {
    try {
      if (!opsSession.isGM) {
        // Non-GM can't update shared view
        return;
      }
      if (!opsSession.campaignId) {
        return;
      }

      const { center, sector, hex, zoom } = data || {};
      const state = sharedMap.updateMapView(opsSession.campaignId, {
        center,
        sector,
        hex,
        zoom
      });

      // Broadcast updated view to all
      io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:mapViewUpdated', state);
    } catch (error) {
      socketLog.error('[OPS] Error updating map view:', error);
    }
  });

  // Get current map state (for reconnecting clients)
  socket.on('ops:getMapState', () => {
    try {
      if (!opsSession.campaignId) {
        socket.emit('ops:mapState', { shared: false });
        return;
      }

      const state = sharedMap.getMapState(opsSession.campaignId);
      socket.emit('ops:mapState', state);
    } catch (error) {
      socket.emit('ops:mapState', { shared: false });
    }
  });
}

module.exports = { register };

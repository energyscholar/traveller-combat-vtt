/**
 * Steward Role Socket Handlers (AR-46)
 * Handles passenger management and morale
 */

const passengerManifest = require('../../operations/passenger-manifest');

/**
 * Register Steward socket handlers
 */
function register(ctx) {
  const { socket, io, opsSession, operations, sanitizeError } = ctx;

  // Get passenger manifest
  socket.on('steward:getManifest', () => {
    try {
      if (!opsSession.shipId) {
        socket.emit('ops:error', { message: 'Not assigned to a ship' });
        return;
      }
      const passengers = passengerManifest.getPassengers(opsSession.shipId);
      const capacity = passengerManifest.getPassengerCapacity(opsSession.shipId);
      const usage = passengerManifest.getCapacityUsage(opsSession.shipId);

      socket.emit('steward:manifest', { passengers, capacity, usage });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Steward', error));
    }
  });

  // Get single passenger
  socket.on('steward:getPassenger', (data) => {
    try {
      const { passengerId } = data;
      const passenger = passengerManifest.getPassenger(passengerId);
      socket.emit('steward:passengerDetail', { passenger });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Steward', error));
    }
  });

  // Add passenger (boarding)
  socket.on('steward:addPassenger', (data) => {
    try {
      if (!opsSession.shipId) return;
      const passenger = passengerManifest.addPassenger(opsSession.shipId, data);

      socket.emit('steward:passengerAdded', { passenger });
      io.to(`campaign:${opsSession.campaignId}`).emit('steward:manifestUpdated', {
        shipId: opsSession.shipId
      });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Steward', error));
    }
  });

  // Remove passenger (disembarking)
  socket.on('steward:removePassenger', (data) => {
    try {
      const { passengerId } = data;
      passengerManifest.removePassenger(passengerId);

      socket.emit('steward:passengerRemoved', { passengerId });
      io.to(`campaign:${opsSession.campaignId}`).emit('steward:manifestUpdated', {
        shipId: opsSession.shipId
      });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Steward', error));
    }
  });

  // Assign cabin
  socket.on('steward:assignCabin', (data) => {
    try {
      const { passengerId, cabin } = data;
      const passenger = passengerManifest.assignCabin(passengerId, cabin);

      socket.emit('steward:cabinAssigned', { passenger });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Steward', error));
    }
  });

  // Set restraint (for emergency)
  socket.on('steward:setRestraint', (data) => {
    try {
      const { passengerId, restraint } = data;
      const passenger = passengerManifest.setRestraint(passengerId, restraint);

      socket.emit('steward:restraintSet', { passenger });
      io.to(`campaign:${opsSession.campaignId}`).emit('steward:passengerUpdated', { passenger });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Steward', error));
    }
  });

  // Secure all passengers for emergency
  socket.on('steward:secureAll', () => {
    try {
      if (!opsSession.shipId) return;
      const passengers = passengerManifest.secureAllPassengers(opsSession.shipId);

      socket.emit('steward:allSecured', { passengers });
      io.to(`campaign:${opsSession.campaignId}`).emit('steward:emergencySecure', {
        shipId: opsSession.shipId,
        count: passengers.length
      });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Steward', error));
    }
  });

  // Calm passenger
  socket.on('steward:calmPassenger', (data) => {
    try {
      const { passengerId, success = true } = data;
      const passenger = passengerManifest.calmPassenger(passengerId, success);

      socket.emit('steward:passengerCalmed', { passenger, success });
      io.to(`campaign:${opsSession.campaignId}`).emit('steward:passengerUpdated', { passenger });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Steward', error));
    }
  });

  // Resolve demand
  socket.on('steward:resolveDemand', (data) => {
    try {
      const { demandId } = data;
      const demand = passengerManifest.resolveDemand(demandId);
      const passenger = passengerManifest.getPassenger(demand.passenger_id);

      socket.emit('steward:demandResolved', { demand, passenger });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Steward', error));
    }
  });

  // GM: Add demand
  socket.on('steward:addDemand', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can add demands' });
        return;
      }

      const { passengerId, type, description, urgency } = data;
      const demand = passengerManifest.addDemand(passengerId, { type, description, urgency });
      const passenger = passengerManifest.getPassenger(passengerId);

      // Notify steward of new demand
      io.to(`campaign:${opsSession.campaignId}`).emit('steward:newDemand', { demand, passenger });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Steward', error));
    }
  });

  // GM: Update capacity
  socket.on('steward:updateCapacity', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can update capacity' });
        return;
      }

      const { shipId, staterooms, low_berths, emergency_seats } = data;
      const capacity = passengerManifest.updatePassengerCapacity(shipId, {
        staterooms, low_berths, emergency_seats
      });

      socket.emit('steward:capacityUpdated', { capacity });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Steward', error));
    }
  });

  // GM: Apply morale effect (combat, danger, etc.)
  socket.on('steward:applyMoraleEffect', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can apply morale effects' });
        return;
      }

      const { shipId, effect, amount = 10 } = data;
      const passengers = passengerManifest.applyMoraleEffect(shipId, effect, amount);

      io.to(`campaign:${opsSession.campaignId}`).emit('steward:moraleChanged', {
        shipId,
        effect,
        passengers
      });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Steward', error));
    }
  });
}

module.exports = { register };

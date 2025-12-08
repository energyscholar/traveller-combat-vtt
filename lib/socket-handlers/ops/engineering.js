/**
 * Engineering/Systems Handlers
 * Handles: getSystemStatus, applySystemDamage, repairSystem, clearSystemDamage, power management
 */

// Power presets per AR-31.2
const POWER_PRESETS = {
  combat: { mDrive: 100, weapons: 100, sensors: 100, lifeSupport: 75, computer: 75, label: 'Combat' },
  silent: { mDrive: 25, weapons: 25, sensors: 25, lifeSupport: 50, computer: 50, label: 'Silent Running' },
  jump: { mDrive: 50, weapons: 25, sensors: 50, lifeSupport: 75, computer: 100, label: 'Jump Prep' },
  standard: { mDrive: 75, weapons: 75, sensors: 75, lifeSupport: 75, computer: 75, label: 'Standard' }
};

// Default power allocation
const DEFAULT_POWER = { mDrive: 75, weapons: 75, sensors: 75, lifeSupport: 75, computer: 75 };

/**
 * Calculate DM effects based on power levels
 * @param {Object} power - Power allocation { mDrive, weapons, sensors, ... }
 * @returns {Object} Effects { weaponsDM, sensorsDM, thrustLimit }
 */
function calculatePowerEffects(power) {
  const effects = { weaponsDM: 0, sensorsDM: 0, thrustMultiplier: 1.0 };

  // Weapons < 50% → -2 DM
  if (power.weapons < 50) effects.weaponsDM = -2;
  else if (power.weapons < 75) effects.weaponsDM = -1;

  // Sensors < 50% → -2 DM (affects detection)
  if (power.sensors < 50) effects.sensorsDM = -2;
  else if (power.sensors < 75) effects.sensorsDM = -1;

  // M-Drive affects thrust (percentage of max)
  effects.thrustMultiplier = power.mDrive / 100;

  return effects;
}

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

  // AR-31.2: Set power preset
  socket.on('ops:setPowerPreset', (data) => {
    try {
      if (!opsSession.shipId) {
        socket.emit('ops:error', { message: 'Not on a ship' });
        return;
      }
      if (!opsSession.isGM && opsSession.role !== 'engineer') {
        socket.emit('ops:error', { message: 'Only Engineer can change power allocation' });
        return;
      }
      const { preset } = data;
      if (!POWER_PRESETS[preset]) {
        socket.emit('ops:error', { message: 'Invalid power preset' });
        return;
      }
      const power = { ...POWER_PRESETS[preset] };
      delete power.label;
      const effects = calculatePowerEffects(power);

      operations.updateShipState(opsSession.shipId, { power, powerEffects: effects });

      const campaign = operations.getCampaign(opsSession.campaignId);
      operations.addLogEntry(opsSession.shipId, opsSession.campaignId, {
        gameDate: campaign.current_date,
        entryType: 'engineering',
        message: `Power preset: ${POWER_PRESETS[preset].label}`,
        actor: opsSession.isGM ? 'GM' : 'Engineer'
      });

      io.to(`ops:bridge:${opsSession.shipId}`).emit('ops:powerChanged', {
        power,
        effects,
        preset,
        setBy: opsSession.playerName || 'Engineer'
      });
      socketLog.info(`[OPS] Power preset ${preset} applied on ${opsSession.shipId}`);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Power', error));
      socketLog.error('[OPS] Error setting power preset:', error);
    }
  });

  // AR-31.3: Set custom power levels per system
  socket.on('ops:setPower', (data) => {
    try {
      if (!opsSession.shipId) {
        socket.emit('ops:error', { message: 'Not on a ship' });
        return;
      }
      if (!opsSession.isGM && opsSession.role !== 'engineer') {
        socket.emit('ops:error', { message: 'Only Engineer can change power allocation' });
        return;
      }
      const { mDrive = 75, weapons = 75, sensors = 75, lifeSupport = 75, computer = 75 } = data;

      // Validate bounds (0-100)
      const clamp = (v) => Math.max(0, Math.min(100, v));
      const power = {
        mDrive: clamp(mDrive),
        weapons: clamp(weapons),
        sensors: clamp(sensors),
        lifeSupport: clamp(lifeSupport),
        computer: clamp(computer)
      };

      const effects = calculatePowerEffects(power);
      operations.updateShipState(opsSession.shipId, { power, powerEffects: effects });

      io.to(`ops:bridge:${opsSession.shipId}`).emit('ops:powerChanged', {
        power,
        effects,
        preset: null,
        setBy: opsSession.playerName || 'Engineer'
      });
      socketLog.info(`[OPS] Power manually set on ${opsSession.shipId}: M${power.mDrive} W${power.weapons} S${power.sensors}`);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Power', error));
      socketLog.error('[OPS] Error setting power:', error);
    }
  });

  // AR-31.7: Get power status (for initial load)
  socket.on('ops:getPowerStatus', () => {
    try {
      if (!opsSession.shipId) {
        socket.emit('ops:error', { message: 'Not on a ship' });
        return;
      }
      const ship = operations.getShip(opsSession.shipId);
      const power = ship.current_state?.power || DEFAULT_POWER;
      const effects = ship.current_state?.powerEffects || calculatePowerEffects(power);

      socket.emit('ops:powerStatus', { power, effects, presets: POWER_PRESETS });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Power', error));
      socketLog.error('[OPS] Error getting power status:', error);
    }
  });

  // AR-49: Add repair to queue (GM only)
  socket.on('ops:addRepair', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can add repairs' });
        return;
      }
      if (!opsSession.shipId) {
        socket.emit('ops:error', { message: 'Not on a ship' });
        return;
      }

      const { system, hoursRequired, partsRequired } = data;
      const ship = operations.getShip(opsSession.shipId);
      const shipState = ship.current_state || {};
      const repairQueue = shipState.repairQueue || [];

      const repair = {
        id: `repair-${Date.now()}`,
        system,
        hoursRequired: hoursRequired || 4,
        hoursRemaining: hoursRequired || 4,
        partsRequired: partsRequired || null,
        status: repairQueue.length === 0 ? 'in_progress' : 'queued',
        addedAt: Date.now()
      };

      repairQueue.push(repair);
      operations.updateShip(opsSession.shipId, { ship_state: { ...shipState, repairQueue } });

      io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:repairQueue', { repairs: repairQueue });
      socketLog.info(`[OPS] Repair added: ${system}`);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Repair', error));
      socketLog.error('[OPS] Error adding repair:', error);
    }
  });

  // AR-49: Progress repair (reduces hours remaining)
  socket.on('ops:progressRepair', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can progress repairs' });
        return;
      }
      if (!opsSession.shipId) return;

      const { repairId, hours = 1 } = data;
      const ship = operations.getShip(opsSession.shipId);
      const shipState = ship.current_state || {};
      const repairQueue = shipState.repairQueue || [];

      const repair = repairQueue.find(r => r.id === repairId);
      if (repair) {
        repair.hoursRemaining = Math.max(0, repair.hoursRemaining - hours);
        if (repair.hoursRemaining === 0) {
          repair.status = 'completed';
          // Start next queued repair
          const nextQueued = repairQueue.find(r => r.status === 'queued');
          if (nextQueued) nextQueued.status = 'in_progress';
        }
        operations.updateShip(opsSession.shipId, { ship_state: { ...shipState, repairQueue } });
        io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:repairQueue', { repairs: repairQueue });
      }
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Repair', error));
    }
  });

  // AR-49: Clear completed repairs
  socket.on('ops:clearCompletedRepairs', () => {
    try {
      if (!opsSession.isGM) return;
      if (!opsSession.shipId) return;

      const ship = operations.getShip(opsSession.shipId);
      const shipState = ship.current_state || {};
      const repairQueue = (shipState.repairQueue || []).filter(r => r.status !== 'completed');

      operations.updateShip(opsSession.shipId, { ship_state: { ...shipState, repairQueue } });
      io.to(`ops:campaign:${opsSession.campaignId}`).emit('ops:repairQueue', { repairs: repairQueue });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Repair', error));
    }
  });
}

module.exports = { register };

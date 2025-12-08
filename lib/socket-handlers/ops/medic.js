/**
 * Medic Role Socket Handlers (AR-47)
 * Handles crew health, treatment, and medical events
 */

const crewHealth = require('../../operations/crew-health');

/**
 * Register Medic socket handlers
 */
function register(ctx) {
  const { socket, io, opsSession, operations, sanitizeError } = ctx;

  // Get all crew health for campaign
  socket.on('medic:getCrewHealth', () => {
    try {
      if (!opsSession.campaignId) return;
      const health = crewHealth.getCampaignHealth(opsSession.campaignId);
      socket.emit('medic:crewHealth', { health });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Medic', error));
    }
  });

  // Get specific character health
  socket.on('medic:getCharacterHealth', (data) => {
    try {
      const { characterId } = data;
      const health = crewHealth.getHealth(characterId, opsSession.campaignId);
      socket.emit('medic:characterHealth', { health });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Medic', error));
    }
  });

  // Triage - get injured sorted by severity
  socket.on('medic:triage', () => {
    try {
      if (!opsSession.campaignId) return;
      const injured = crewHealth.triage(opsSession.campaignId);
      socket.emit('medic:triageList', { injured });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Medic', error));
    }
  });

  // Treat wound
  socket.on('medic:treatWound', (data) => {
    try {
      const { woundId, rounds = 1 } = data;
      const wound = crewHealth.treatWound(woundId, rounds);

      if (wound) {
        // Get updated health for the character
        const health = crewHealth.getHealth(wound.character_id, opsSession.campaignId);

        socket.emit('medic:woundTreated', { wound, health });

        // Notify all of health change
        io.to(`campaign:${opsSession.campaignId}`).emit('medic:healthUpdated', {
          characterId: wound.character_id,
          health
        });
      }
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Medic', error));
    }
  });

  // Stabilize character
  socket.on('medic:stabilize', (data) => {
    try {
      const { characterId } = data;
      const health = crewHealth.stabilize(characterId);

      socket.emit('medic:stabilized', { health });

      io.to(`campaign:${opsSession.campaignId}`).emit('medic:healthUpdated', {
        characterId,
        health
      });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Medic', error));
    }
  });

  // Apply first aid (heal some endurance)
  socket.on('medic:firstAid', (data) => {
    try {
      const { characterId, amount = 1 } = data;
      const health = crewHealth.healEndurance(characterId, amount);

      socket.emit('medic:firstAidApplied', { health });

      io.to(`campaign:${opsSession.campaignId}`).emit('medic:healthUpdated', {
        characterId,
        health
      });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Medic', error));
    }
  });

  // Remove condition (treat altitude sickness, etc.)
  socket.on('medic:removeCondition', (data) => {
    try {
      const { conditionId, characterId } = data;
      crewHealth.removeCondition(conditionId);
      const health = crewHealth.getHealth(characterId, opsSession.campaignId);

      socket.emit('medic:conditionRemoved', { conditionId, health });

      io.to(`campaign:${opsSession.campaignId}`).emit('medic:healthUpdated', {
        characterId,
        health
      });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Medic', error));
    }
  });

  // GM: Add wound to character
  socket.on('medic:addWound', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can add wounds' });
        return;
      }

      const { characterId, type, severity, location, bleedRate } = data;
      const wound = crewHealth.addWound(characterId, opsSession.campaignId, {
        type, severity, location, bleedRate
      });
      const health = crewHealth.getHealth(characterId, opsSession.campaignId);

      socket.emit('medic:woundAdded', { wound, health });

      io.to(`campaign:${opsSession.campaignId}`).emit('medic:healthUpdated', {
        characterId,
        health
      });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Medic', error));
    }
  });

  // GM: Add condition to character
  socket.on('medic:addCondition', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can add conditions' });
        return;
      }

      const { characterId, type, severity, duration, source } = data;
      const condition = crewHealth.addCondition(characterId, opsSession.campaignId, {
        type, severity, duration, source
      });
      const health = crewHealth.getHealth(characterId, opsSession.campaignId);

      socket.emit('medic:conditionAdded', { condition, health });

      io.to(`campaign:${opsSession.campaignId}`).emit('medic:healthUpdated', {
        characterId,
        health
      });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Medic', error));
    }
  });

  // GM: Apply damage
  socket.on('medic:applyDamage', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can apply damage' });
        return;
      }

      const { characterId, damage } = data;
      const health = crewHealth.applyDamage(characterId, damage);

      io.to(`campaign:${opsSession.campaignId}`).emit('medic:healthUpdated', {
        characterId,
        health
      });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Medic', error));
    }
  });

  // GM: Update consciousness
  socket.on('medic:setConsciousness', (data) => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can set consciousness' });
        return;
      }

      const { characterId, state } = data;
      const health = crewHealth.updateConsciousness(characterId, state);

      io.to(`campaign:${opsSession.campaignId}`).emit('medic:healthUpdated', {
        characterId,
        health
      });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Medic', error));
    }
  });

  // GM: Process bleeding round
  socket.on('medic:processBleedingRound', () => {
    try {
      if (!opsSession.isGM) {
        socket.emit('ops:error', { message: 'Only GM can process bleeding' });
        return;
      }

      const affected = crewHealth.processBleedingRound(opsSession.campaignId);

      if (affected.length > 0) {
        io.to(`campaign:${opsSession.campaignId}`).emit('medic:bleedingProcessed', { affected });

        // Send updated health for all affected
        for (const { characterId } of affected) {
          const health = crewHealth.getHealth(characterId, opsSession.campaignId);
          io.to(`campaign:${opsSession.campaignId}`).emit('medic:healthUpdated', {
            characterId,
            health
          });
        }
      }

      socket.emit('medic:bleedingRoundComplete', { affected });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Medic', error));
    }
  });
}

module.exports = { register };

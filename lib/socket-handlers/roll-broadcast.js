/**
 * AR-98: Roll Results Broadcast
 * Broadcasts dice roll results to the bridge chat
 */

/**
 * Broadcast a roll result to the bridge chat
 * @param {Object} io - Socket.IO server instance
 * @param {string} campaignId - Campaign ID to broadcast to
 * @param {Object} rollData - Roll information
 * @param {string} rollData.roller - Name of the person/station making the roll
 * @param {string} rollData.action - What the roll is for (e.g., "Sensor Scan", "Attack")
 * @param {number[]} rollData.dice - Array of dice values
 * @param {number} rollData.total - Sum of dice
 * @param {number} rollData.modifier - Total modifiers applied
 * @param {number} rollData.result - Final result (total + modifier)
 * @param {number} rollData.target - Target number to beat
 * @param {boolean} rollData.success - Whether the roll succeeded
 * @param {string} [rollData.details] - Optional additional details
 */
function broadcastRollResult(io, campaignId, rollData) {
  if (!io || !campaignId) return;

  const { roller, action, dice, total, modifier, result, target, success, details } = rollData;

  // Format dice display: [3, 4] -> "3+4"
  const diceDisplay = dice.join('+');
  const modifierDisplay = modifier >= 0 ? `+${modifier}` : `${modifier}`;
  const successText = success ? '✓ Success' : '✗ Fail';
  const effect = result - target;
  const effectDisplay = effect >= 0 ? `+${effect}` : `${effect}`;

  // Build message: "Sensor Scan: 2D6(3+4)+3 = 10 vs 8 ✓ Success (Effect +2)"
  let message = `🎲 ${action}: 2D6(${diceDisplay})${modifierDisplay} = ${result} vs ${target} ${successText} (Effect ${effectDisplay})`;
  if (details) {
    message += ` - ${details}`;
  }

  const transmission = {
    id: `roll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'roll',
    channel: 'bridge',
    fromName: roller,
    message: message,
    timestamp: new Date().toISOString(),
    rollData: {
      dice,
      total,
      modifier,
      result,
      target,
      success,
      effect
    }
  };

  io.to(`campaign:${campaignId}`).emit('comms:newTransmission', transmission);
}

module.exports = { broadcastRollResult };

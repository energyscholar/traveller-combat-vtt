/**
 * AR-201: Ship Systems Socket Handlers
 *
 * Handles engineering and damage control events:
 * - System status
 * - System damage
 * - Repairs
 */

import { registerHandler } from './index.js';

// ==================== System Status ====================

function handleSystemStatus(data, state, helpers) {
  state.systemStatus = data.systemStatus;
  state.damagedSystems = data.damagedSystems;
  if (state.selectedRole === 'engineer' || state.selectedRole === 'damage_control') {
    helpers.renderRoleDetailPanel(state.selectedRole);
  }
}

function handleSystemDamaged(data, state, helpers) {
  state.systemStatus = data.systemStatus;
  state.damagedSystems = Object.keys(data.systemStatus).filter(s =>
    data.systemStatus[s]?.totalSeverity > 0
  );
  helpers.showNotification(`System damage: ${helpers.formatSystemName(data.location)} (Severity ${data.severity})`, 'warning');
  if (state.selectedRole === 'engineer' || state.selectedRole === 'damage_control') {
    helpers.renderRoleDetailPanel(state.selectedRole);
  }
}

function handleRepairAttempted(data, state, helpers) {
  state.systemStatus = data.systemStatus;
  state.damagedSystems = Object.keys(data.systemStatus).filter(s =>
    data.systemStatus[s]?.totalSeverity > 0
  );
  const notifType = data.success ? 'success' : 'warning';
  helpers.showNotification(data.message, notifType);
  if (state.selectedRole === 'engineer' || state.selectedRole === 'damage_control') {
    helpers.renderRoleDetailPanel(state.selectedRole);
  }
}

function handleSystemDamageCleared(data, state, helpers) {
  state.systemStatus = data.systemStatus;
  state.damagedSystems = Object.keys(data.systemStatus).filter(s =>
    data.systemStatus[s]?.totalSeverity > 0
  );
  helpers.showNotification(`Damage cleared: ${data.location === 'all' ? 'all systems' : helpers.formatSystemName(data.location)}`, 'success');
  if (state.selectedRole === 'engineer' || state.selectedRole === 'damage_control') {
    helpers.renderRoleDetailPanel(state.selectedRole);
  }
}

// ==================== Register All Handlers ====================

registerHandler('ops:systemStatus', handleSystemStatus);
registerHandler('ops:systemDamaged', handleSystemDamaged);
registerHandler('ops:repairAttempted', handleRepairAttempted);
registerHandler('ops:systemDamageCleared', handleSystemDamageCleared);

// Export for testing
export {
  handleSystemStatus,
  handleSystemDamaged,
  handleRepairAttempted,
  handleSystemDamageCleared
};

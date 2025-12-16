/**
 * AR-153 Phase 1C: Copy/Export Utilities Module
 * Clipboard copy functions for logs and panels
 */

/**
 * Copy ship log to clipboard as formatted text
 */
export function copyShipLog() {
  const logEl = document.getElementById('ship-log');
  if (!logEl) {
    showNotification('Ship log not found', 'error');
    return;
  }

  const entries = logEl.querySelectorAll('.log-entry');
  const lines = [];

  lines.push('=== SHIP LOG ===');
  lines.push(`Copied: ${new Date().toISOString()}`);
  lines.push('');

  entries.forEach(entry => {
    const time = entry.querySelector('.log-time')?.textContent || '';
    const type = entry.querySelector('.log-type')?.textContent || '';
    const msg = entry.querySelector('.log-message')?.textContent || '';
    lines.push(`[${time}] [${type}] ${msg}`);
  });

  navigator.clipboard.writeText(lines.join('\n'))
    .then(() => showNotification('Ship log copied', 'success'))
    .catch(() => showNotification('Copy failed', 'error'));
}

/**
 * Copy sensor panel contacts to clipboard
 * @param {Object} state - Application state
 */
export function copySensorPanel(state) {
  const contacts = state.contacts || [];
  const lines = [];

  lines.push('=== SENSOR CONTACTS ===');
  lines.push(`Copied: ${new Date().toISOString()}`);
  lines.push(`Total: ${contacts.length}`);
  lines.push('');

  contacts.forEach(c => {
    lines.push(`[${c.id?.slice(0,8)}] ${c.transponder || c.name || 'Unknown'}`);
    lines.push(`  Type: ${c.type || '?'} | Range: ${c.range_band || '?'} | Bearing: ${c.bearing || 0}°`);
    lines.push(`  Marking: ${c.marking || 'unknown'} | Scan: ${c.scan_level || 0}`);
    lines.push('');
  });

  navigator.clipboard.writeText(lines.join('\n'))
    .then(() => showNotification('Sensor data copied', 'success'))
    .catch(() => showNotification('Copy failed', 'error'));
}

/**
 * Copy current role panel state to clipboard
 * @param {Object} state - Application state
 */
export function copyRolePanel(state) {
  const rolePanel = document.getElementById('role-panel-content');
  if (!rolePanel) {
    showNotification('Role panel not found', 'error');
    return;
  }

  const lines = [];
  lines.push('=== ROLE PANEL ===');
  lines.push(`Role: ${state.selectedRole || 'none'}`);
  lines.push(`Copied: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(rolePanel.innerText);

  navigator.clipboard.writeText(lines.join('\n'))
    .then(() => showNotification('Role panel copied', 'success'))
    .catch(() => showNotification('Copy failed', 'error'));
}

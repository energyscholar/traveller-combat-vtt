/**
 * AR-204: Damage Control Role Panel
 * Extracted from role-panels.js for maintainability.
 */

import { formatSystemName } from '../utils.js';
import { renderSystemStatusItem, getSystemTooltip } from './shared.js';

/**
 * Generate Damage Control role panel HTML
 * @param {object} shipState - Current ship state
 * @param {object} template - Ship template data
 * @param {object} systemStatus - System damage status
 * @param {array} damagedSystems - List of damaged system names
 * @returns {string} HTML string
 */
export function getDamageControlPanel(shipState, template, systemStatus = {}, damagedSystems = []) {
  // AR-38.3: Merge combat damage with template-based system damage
  const shipSystems = shipState.systems || template.systems || {};
  const templateDamagedSystems = Object.entries(shipSystems)
    .filter(([name, sys]) => sys && sys.health !== undefined && sys.health < 100)
    .map(([name, sys]) => ({ name, health: sys.health, issue: sys.issue, status: sys.status }));

  // Combine combat damage + template damage for repair list
  const allDamagedSystems = [
    ...damagedSystems,
    ...templateDamagedSystems.map(s => s.name).filter(n => !damagedSystems.includes(n))
  ];

  return `
    <div class="detail-section">
      <h4>Hull Integrity</h4>
      <div class="detail-stats">
        <div class="stat-row">
          <span>Hull:</span>
          <span class="stat-value">${shipState.hull ?? template.hull ?? 100}/${template.hull || 100}</span>
        </div>
        <div class="stat-row">
          <span>Armor:</span>
          <span class="stat-value">${template.armor || 0}</span>
        </div>
      </div>
    </div>
    <div class="detail-section">
      <h4>System Status</h4>
      <div class="system-status-grid">
        ${renderSystemStatusItem('M-Drive', systemStatus.mDrive, getSystemTooltip('mDrive', template))}
        ${renderSystemStatusItem('Power Plant', systemStatus.powerPlant, getSystemTooltip('powerPlant', template))}
        ${renderSystemStatusItem('J-Drive', systemStatus.jDrive, getSystemTooltip('jDrive', template))}
        ${renderSystemStatusItem('Sensors', systemStatus.sensors, getSystemTooltip('sensors', template))}
        ${renderSystemStatusItem('Computer', systemStatus.computer, getSystemTooltip('computer', template))}
        ${renderSystemStatusItem('Armour', systemStatus.armour, getSystemTooltip('armour', template))}
        ${renderSystemStatusItem('Weapons', systemStatus.weapon, getSystemTooltip('weapon', template))}
        ${renderSystemStatusItem('Hull', systemStatus.hull, getSystemTooltip('hull', template))}
        ${renderSystemStatusItem('Fuel', systemStatus.fuel)}
        ${renderSystemStatusItem('Cargo', systemStatus.cargo)}
      </div>
      ${templateDamagedSystems.length > 0 ? `
      <h5 style="margin-top: 12px;">Auxiliary Systems</h5>
      <div class="system-status-grid">
        ${templateDamagedSystems.map(sys => `
          <div class="system-status-item ${sys.health < 50 ? 'critical' : 'damaged'}">
            <span class="system-name">${sys.name}</span>
            <span class="system-state">${sys.health}% - ${sys.status}</span>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
    ${allDamagedSystems.length > 0 ? `
    <div class="detail-section">
      <h4>Repair Actions</h4>
      <div class="repair-controls">
        <select id="repair-target" class="repair-select">
          ${allDamagedSystems.map(s => `<option value="${s}">${formatSystemName(s)}</option>`).join('')}
        </select>
        <button onclick="attemptRepair()" class="btn btn-small" title="Roll repair check (8+) to fix selected system. DM penalty equals damage severity.">Attempt Repair</button>
      </div>
      <div class="repair-info">
        <small>Repair check (8+) with DM = -Severity</small>
      </div>
    </div>
    ` : `
    <div class="detail-section">
      <h4>Repair Actions</h4>
      <div class="placeholder">All systems operational</div>
    </div>
    `}
  `;
}

/**
 * AR-204: Steward Role Panel
 * Extracted from role-panels.js for maintainability.
 */

import { escapeHtml } from '../utils.js';

/**
 * Generate Steward role panel HTML
 * @param {object} shipState - Current ship state
 * @param {object} template - Ship template data
 * @param {array} crewOnline - Online crew list
 * @returns {string} HTML string
 */
export function getStewardPanel(shipState, template, crewOnline = []) {
  // Passenger manifest
  const passengers = shipState.passengers || [];
  const highPassengers = passengers.filter(p => p.class === 'high').length;
  const midPassengers = passengers.filter(p => p.class === 'middle').length;
  const lowPassengers = passengers.filter(p => p.class === 'low').length;

  // Cargo status
  const cargoUsed = shipState.cargoUsed || 0;
  const cargoCapacity = template.cargo || 0;

  // Life support
  const lifeSupport = shipState.lifeSupport || { status: 'NOMINAL', days: 30 };

  // Morale (crew satisfaction)
  const crewMorale = shipState.crewMorale || 'Good';
  const moraleColors = { 'Excellent': 'text-success', 'Good': '', 'Fair': 'text-warning', 'Poor': 'text-danger' };

  return `
    <div class="detail-section steward-passengers">
      <h4>Passenger Manifest</h4>
      <div class="detail-stats">
        <div class="stat-row">
          <span>High Passage:</span>
          <span class="stat-value">${highPassengers}</span>
        </div>
        <div class="stat-row">
          <span>Middle Passage:</span>
          <span class="stat-value">${midPassengers}</span>
        </div>
        <div class="stat-row">
          <span>Low Berths:</span>
          <span class="stat-value">${lowPassengers}</span>
        </div>
        <div class="stat-row">
          <span>Total:</span>
          <span class="stat-value">${passengers.length}</span>
        </div>
      </div>
      ${passengers.length > 0 ? `
      <div class="passenger-list" style="margin-top: 8px; max-height: 100px; overflow-y: auto;">
        <ul style="margin: 0; padding-left: 16px; font-size: 0.85em;">
          ${passengers.slice(0, 5).map(p => `
            <li>${escapeHtml(p.name || 'Passenger')} (${p.class || 'standard'})</li>
          `).join('')}
          ${passengers.length > 5 ? `<li>...and ${passengers.length - 5} more</li>` : ''}
        </ul>
      </div>
      ` : ''}
    </div>

    <div class="detail-section steward-cargo">
      <h4>Cargo & Stores</h4>
      <div class="detail-stats">
        <div class="stat-row">
          <span>Cargo Hold:</span>
          <span class="stat-value ${cargoUsed >= cargoCapacity ? 'text-warning' : ''}">${cargoUsed}/${cargoCapacity} dT</span>
        </div>
        <div class="stat-row">
          <span>Life Support:</span>
          <span class="stat-value ${lifeSupport.days < 7 ? 'text-danger' : lifeSupport.days < 14 ? 'text-warning' : ''}">${lifeSupport.days} days</span>
        </div>
      </div>
    </div>

    <div class="detail-section steward-morale">
      <h4>Crew Welfare</h4>
      <div class="detail-stats">
        <div class="stat-row">
          <span>Crew Count:</span>
          <span class="stat-value">${crewOnline.length}</span>
        </div>
        <div class="stat-row">
          <span>Morale:</span>
          <span class="stat-value ${moraleColors[crewMorale] || ''}">${crewMorale}</span>
        </div>
      </div>
    </div>

    <div class="detail-section steward-actions">
      <h4>Steward Actions</h4>
      <div class="action-buttons" style="display: flex; flex-wrap: wrap; gap: 6px;">
        <button onclick="roleAction('servePassengers')" class="btn btn-small"
                title="Attend to passenger needs. Improves satisfaction, may generate tips or trade rumors.">
          Serve Passengers
        </button>
        <button onclick="roleAction('inventoryCheck')" class="btn btn-small"
                title="Review cargo manifest and consumables. Identifies shortages before they become critical.">
          Check Inventory
        </button>
        <button onclick="roleAction('boostMorale')" class="btn btn-small"
                title="Organize crew recreation. Costs some consumables but improves morale and reduces stress effects.">
          Boost Morale
        </button>
      </div>
    </div>
  `;
}

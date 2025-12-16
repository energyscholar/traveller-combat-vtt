/**
 * AR-151-2b: Ship Status Modal Module
 * TIP-2: Display detailed ship status information
 */

import { getStatusColor } from './utils.js';

/**
 * Show ship status modal with current ship details
 * @param {Object} state - Application state
 * @param {Function} showModal - Function to show modal by template ID
 * @param {Function} formatShipWeapons - Function to format weapons HTML
 */
export function showShipStatusModal(state, showModal, formatShipWeapons) {
  if (!state.ship) return;

  showModal('template-ship-status');

  const ship = state.ship;
  const template = ship.template_data || {};
  const shipData = ship.ship_data || {};
  const shipState = ship.current_state || {};

  // Set name
  document.getElementById('ship-status-name').textContent = ship.name;

  // Build content
  const maxHull = template.hull || 100;
  const currentHull = shipState.hull ?? maxHull;
  const hullPercent = Math.round((currentHull / maxHull) * 100);

  const maxFuel = template.fuel || 40;
  const currentFuel = shipState.fuel ?? maxFuel;
  const fuelPercent = Math.round((currentFuel / maxFuel) * 100);

  let content = `
    <div class="ship-info-grid">
      <div class="info-section">
        <h4>Ship Details</h4>
        <div class="info-row"><span class="label">Type:</span><span class="value">${shipData.type || 'Unknown'}</span></div>
        <div class="info-row"><span class="label">Tech Level:</span><span class="value">TL${shipData.techLevel || '?'}</span></div>
        <div class="info-row"><span class="label">Tonnage:</span><span class="value">${shipData.tonnage || '?'} tons</span></div>
        <div class="info-row"><span class="label">Thrust:</span><span class="value">${shipData.thrust || '?'}-G</span></div>
        <div class="info-row"><span class="label">Jump:</span><span class="value">J-${shipData.jump || '?'}</span></div>
        <div class="info-row"><span class="label">Sensors:</span><span class="value">${shipData.sensors || 'Standard'}</span></div>
        <div class="info-row"><span class="label">Computer:</span><span class="value">${shipData.computer || 'Model/1'}</span></div>
      </div>
      <div class="info-section">
        <h4>Current Status</h4>
        <div class="info-row"><span class="label">Hull:</span><span class="value ${getStatusColor(hullPercent)}">${hullPercent}%</span></div>
        <div class="info-row"><span class="label">Fuel:</span><span class="value ${getStatusColor(fuelPercent)}">${currentFuel}/${maxFuel} tons</span></div>
        <div class="info-row"><span class="label">Power:</span><span class="value">${shipState.powerPercent ?? 100}%</span></div>
        <div class="info-row"><span class="label">Alert:</span><span class="value alert-${(shipState.alertStatus || 'normal').toLowerCase()}">${shipState.alertStatus || 'Normal'}</span></div>
        <div class="info-row"><span class="label">Location:</span><span class="value">${shipState.location || 'Unknown'}</span></div>
      </div>
    </div>
  `;

  // Ship systems if available
  if (shipState.systems) {
    content += `<div class="info-section"><h4>Ship Systems</h4>`;
    for (const [name, sys] of Object.entries(shipState.systems)) {
      const statusClass = sys.status === 'operational' ? 'status-green' :
                         sys.status === 'degraded' ? 'status-yellow' : 'status-red';
      content += `<div class="info-row">
        <span class="label">${name}:</span>
        <span class="value ${statusClass}">${sys.health || 100}% - ${sys.status || 'Unknown'}</span>
      </div>`;
    }
    content += `</div>`;
  }

  // Weapons - get from template_data turrets
  const weaponsHtml = formatShipWeapons(template);
  if (weaponsHtml) {
    content += `<div class="info-section weapons-section"><h4>Armament</h4>${weaponsHtml}</div>`;
  }

  document.getElementById('ship-status-content').innerHTML = content;
}

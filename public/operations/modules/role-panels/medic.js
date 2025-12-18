/**
 * AR-204: Medic Role Panel
 * Extracted from role-panels.js for maintainability.
 */

import { escapeHtml } from '../utils.js';

/**
 * Generate Medic role panel HTML
 * @param {object} shipState - Current ship state
 * @param {object} template - Ship template data
 * @param {array} crewOnline - Online crew list
 * @param {object} medicalConditions - Medical conditions data
 * @returns {string} HTML string
 */
export function getMedicPanel(shipState, template, crewOnline = [], medicalConditions = null) {
  // Medical conditions section HTML
  const medicalConditionsHtml = medicalConditions ? `
    <div class="detail-section medical-conditions">
      <h4>Medical Status</h4>
      <div class="detail-stats">
        ${medicalConditions.alertLevel ? `
        <div class="stat-row">
          <span>Alert Level:</span>
          <span class="stat-value ${medicalConditions.alertLevel === 'Critical' ? 'text-danger' : medicalConditions.alertLevel === 'Elevated' ? 'text-warning' : ''}">${medicalConditions.alertLevel}</span>
        </div>
        ` : ''}
        ${medicalConditions.supplyLevel !== undefined ? `
        <div class="stat-row">
          <span>Medical Supplies:</span>
          <span class="stat-value ${medicalConditions.supplyLevel <= 25 ? 'text-danger' : medicalConditions.supplyLevel <= 50 ? 'text-warning' : ''}">${medicalConditions.supplyLevel}%</span>
        </div>
        ` : ''}
        ${medicalConditions.bedCapacity !== undefined ? `
        <div class="stat-row">
          <span>Beds Available:</span>
          <span class="stat-value">${medicalConditions.bedsUsed || 0}/${medicalConditions.bedCapacity}</span>
        </div>
        ` : ''}
      </div>
      ${medicalConditions.patients && medicalConditions.patients.length > 0 ? `
      <div class="patient-list" style="margin-top: 8px;">
        <strong>Patients:</strong>
        <ul style="margin: 4px 0 0 0; padding-left: 16px;">
          ${medicalConditions.patients.map(p => `
            <li class="${p.severity === 'critical' ? 'text-danger' : p.severity === 'serious' ? 'text-warning' : ''}">
              ${escapeHtml(p.name)} - ${escapeHtml(p.condition)}${p.treatmentEta ? ` (${p.treatmentEta})` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}
      ${medicalConditions.hazard ? `
      <div class="medical-hazard" style="margin-top: 8px; padding: 8px; background: rgba(220,53,69,0.15); border-radius: 4px;">
        <strong class="text-danger">⚠ ${escapeHtml(medicalConditions.hazard)}</strong>
      </div>
      ` : ''}
    </div>
  ` : '';

  // Crew health overview
  const crewCount = crewOnline?.length || 0;
  const healthyCount = medicalConditions?.healthyCrew ?? crewCount;
  const injuredCount = medicalConditions?.patients?.length || 0;

  return `
    <div class="detail-section">
      <h4>Sickbay</h4>
      <div class="detail-stats">
        <div class="stat-row">
          <span>Crew Health:</span>
          <span class="stat-value ${injuredCount > 0 ? 'text-warning' : 'text-success'}">${healthyCount}/${crewCount} healthy</span>
        </div>
        <div class="stat-row">
          <span>Injured:</span>
          <span class="stat-value ${injuredCount > 0 ? 'text-danger' : ''}">${injuredCount}</span>
        </div>
      </div>
    </div>

    ${medicalConditionsHtml}

    <div class="detail-section">
      <h4>Medical Actions</h4>
      <div class="action-buttons">
        <button onclick="roleAction('triage')" class="btn btn-small">Triage</button>
        <button onclick="roleAction('treatInjury')" class="btn btn-small">Treat Injury</button>
        <button onclick="roleAction('checkSupplies')" class="btn btn-small">Check Supplies</button>
      </div>
    </div>
  `;
}

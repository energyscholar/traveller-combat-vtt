/**
 * AR-204: Marines Role Panel
 * Extracted from role-panels.js for maintainability.
 */

import { escapeHtml } from '../utils.js';

/**
 * Generate Marines role panel HTML
 * @param {object} shipState - Current ship state
 * @param {object} template - Ship template data
 * @param {object} boardingConditions - Boarding conditions data
 * @returns {string} HTML string
 */
export function getMarinesPanel(shipState, template, boardingConditions = null) {
  // Default squad status
  const squadReady = shipState.marineSquadReady ?? true;
  const squadSize = template.marineComplement || 4;

  // Boarding conditions section HTML
  const boardingConditionsHtml = boardingConditions ? `
    <div class="detail-section boarding-conditions">
      <h4>Tactical Situation</h4>
      <div class="detail-stats">
        ${boardingConditions.alertLevel ? `
        <div class="stat-row">
          <span>Alert Level:</span>
          <span class="stat-value ${boardingConditions.alertLevel === 'Combat' ? 'text-danger' : boardingConditions.alertLevel === 'Elevated' ? 'text-warning' : ''}">${boardingConditions.alertLevel}</span>
        </div>
        ` : ''}
        ${boardingConditions.hostileCount !== undefined ? `
        <div class="stat-row">
          <span>Hostile Count:</span>
          <span class="stat-value ${boardingConditions.hostileCount > 0 ? 'text-danger' : 'text-success'}">${boardingConditions.hostileCount}</span>
        </div>
        ` : ''}
        ${boardingConditions.deckControl ? `
        <div class="stat-row">
          <span>Deck Control:</span>
          <span class="stat-value ${boardingConditions.deckControl === 'Contested' ? 'text-warning' : boardingConditions.deckControl === 'Enemy' ? 'text-danger' : 'text-success'}">${boardingConditions.deckControl}</span>
        </div>
        ` : ''}
        ${boardingConditions.breachPoints !== undefined ? `
        <div class="stat-row">
          <span>Breach Points:</span>
          <span class="stat-value ${boardingConditions.breachPoints > 0 ? 'text-danger' : ''}">${boardingConditions.breachPoints}</span>
        </div>
        ` : ''}
      </div>
      ${boardingConditions.sectors && boardingConditions.sectors.length > 0 ? `
      <div class="sector-list" style="margin-top: 8px;">
        <strong>Sector Status:</strong>
        <ul style="margin: 4px 0 0 0; padding-left: 16px;">
          ${boardingConditions.sectors.map(s => `
            <li class="${s.status === 'hostile' ? 'text-danger' : s.status === 'contested' ? 'text-warning' : 'text-success'}">
              ${escapeHtml(s.name)} - ${escapeHtml(s.status)}
            </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}
      ${boardingConditions.hazard ? `
      <div class="boarding-hazard" style="margin-top: 8px; padding: 8px; background: rgba(220,53,69,0.15); border-radius: 4px;">
        <strong class="text-danger">⚠ ${escapeHtml(boardingConditions.hazard)}</strong>
      </div>
      ` : ''}
    </div>
  ` : '';

  return `
    <div class="detail-section">
      <h4>Marine Detachment</h4>
      <div class="detail-stats">
        <div class="stat-row">
          <span>Squad Status:</span>
          <span class="stat-value ${squadReady ? 'text-success' : 'text-warning'}">${squadReady ? 'Ready' : 'Deploying'}</span>
        </div>
        <div class="stat-row">
          <span>Squad Size:</span>
          <span class="stat-value">${squadSize} marines</span>
        </div>
        <div class="stat-row">
          <span>Equipment:</span>
          <span class="stat-value">${shipState.marineEquipment || 'Standard'}</span>
        </div>
      </div>
    </div>

    ${boardingConditionsHtml}

    <div class="detail-section">
      <h4>Tactical Actions</h4>
      <div class="action-buttons" style="display: flex; flex-wrap: wrap; gap: 6px;">
        <button onclick="roleAction('securityPatrol')" class="btn btn-small"
                title="Deploy marines on patrol routes. Increases internal security, detects intruders earlier. Takes 1 hour to establish full coverage.">
          Security Patrol
        </button>
        <button onclick="roleAction('prepareBoarding')" class="btn btn-small"
                title="Prep for boarding action: issue weapons, breaching charges, vacc suits. Marines ready at airlock. Takes 10 minutes.">
          Prep Boarding
        </button>
        <button onclick="roleAction('repelBoarders')" class="btn btn-small btn-danger"
                title="ALERT: Hostile boarders detected! Marines engage enemy forces. Triggers tactical combat resolution.">
          Repel Boarders
        </button>
      </div>
    </div>
  `;
}

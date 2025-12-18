/**
 * AR-204: Captain Role Panel
 * Extracted from role-panels.js for maintainability.
 */

import { escapeHtml } from '../utils.js';
import { getPilotPanel } from './pilot.js';
import { getEngineerPanel } from './engineer.js';
import { getAstrogatorPanel } from './astrogator.js';

/**
 * Generate Captain role panel HTML
 * @param {object} shipState - Current ship state
 * @param {object} template - Ship template data
 * @param {object} ship - Full ship object
 * @param {array} crewOnline - Online crew list
 * @param {array} contacts - Sensor contacts
 * @param {array} rescueTargets - Rescue targets
 * @returns {string} HTML string
 */
export function getCaptainPanel(shipState, template, ship, crewOnline, contacts, rescueTargets = []) {
  // AR-131+: Get active sub-panel for captain's role switching
  const activePanel = window.state?.captainActivePanel || 'captain';

  // AR-131+: Tab bar for role switching (always show at top)
  const tabBar = `
    <div class="captain-tab-bar" style="display: flex; gap: 4px; margin-bottom: 12px; padding: 4px; background: var(--bg-tertiary); border-radius: 6px;">
      <button onclick="window.switchCaptainPanel('captain')" class="btn btn-tiny ${activePanel === 'captain' ? 'btn-primary' : 'btn-secondary'}" title="Captain orders and status">
        Captain
      </button>
      <button onclick="window.switchCaptainPanel('astrogator')" class="btn btn-tiny ${activePanel === 'astrogator' ? 'btn-primary' : 'btn-secondary'}" title="Plot jumps and navigation">
        Astrogator
      </button>
      <button onclick="window.switchCaptainPanel('pilot')" class="btn btn-tiny ${activePanel === 'pilot' ? 'btn-primary' : 'btn-secondary'}" title="Ship maneuvering">
        Pilot
      </button>
      <button onclick="window.switchCaptainPanel('engineer')" class="btn btn-tiny ${activePanel === 'engineer' ? 'btn-primary' : 'btn-secondary'}" title="Systems and repairs">
        Engineer
      </button>
    </div>
  `;

  // AR-131+: If showing a different role's panel, delegate to that panel function
  if (activePanel === 'astrogator') {
    // AR-168: Get jumpStatus from window.state for proper IN JUMP display
    const jumpStatus = window.state?.jumpStatus || {};
    const campaign = window.state?.campaign || {};
    const systemStatus = ship?.current_state?.systemStatus || {};
    return tabBar + getAstrogatorPanel(shipState, template, jumpStatus, campaign, systemStatus);
  }
  if (activePanel === 'pilot') {
    // AR-171: Fix signature - getPilotPanel expects (shipState, template, campaign, jumpStatus, flightConditions)
    const campaign = window.state?.campaign || {};
    const jumpStatus = window.state?.jumpStatus || {};
    const flightConditions = window.state?.flightConditions || null;
    return tabBar + getPilotPanel(shipState, template, campaign, jumpStatus, flightConditions);
  }
  if (activePanel === 'engineer') {
    // AR-172: Fix signature - getEngineerPanel expects (shipState, template, systemStatus, damagedSystems, fuelStatus, repairQueue)
    const systemStatus = window.state?.systemStatus || ship?.current_state?.systemStatus || {};
    const damagedSystems = window.state?.damagedSystems || [];
    const fuelStatus = window.state?.fuelStatus || { total: 0, max: 0, breakdown: {} };
    const repairQueue = window.state?.repairQueue || [];
    return tabBar + getEngineerPanel(shipState, template, systemStatus, damagedSystems, fuelStatus, repairQueue);
  }

  // Captain panel content below
  // Filter to targetable contacts only
  const targetableContacts = contacts?.filter(c => c.is_targetable) || [];
  const authorizedTargets = targetableContacts.filter(c => c.weapons_free);
  const unauthorizedTargets = targetableContacts.filter(c => !c.weapons_free);

  // Alert status colors
  const alertColors = {
    'NORMAL': '#28a745',
    'GREEN': '#28a745',
    'YELLOW': '#ffc107',
    'RED': '#dc3545'
  };
  const alertStatus = shipState.alertStatus || 'NORMAL';
  const alertColor = alertColors[alertStatus] || '#28a745';

  // Count contacts by marking
  const hostileCount = contacts?.filter(c => c.marking === 'hostile').length || 0;
  const unknownCount = contacts?.filter(c => !c.marking || c.marking === 'unknown').length || 0;

  // Hailable contacts (have transponder and are ships/stations)
  const hailableContacts = contacts?.filter(c =>
    c.transponder && c.transponder !== 'NONE' &&
    !c.celestial && c.type &&
    ['Ship', 'Station', 'Starport', 'Base', 'Patrol', 'Free Trader', 'Far Trader', 'System Defense Boat'].includes(c.type)
  ) || [];

  return tabBar + `
    <div class="detail-section captain-alert-section">
      <h4>Alert Status</h4>
      <div class="alert-status-display" style="border-left: 4px solid ${alertColor}; padding-left: 10px;">
        <span class="alert-status-text" style="color: ${alertColor}; font-weight: bold; font-size: 1.2em;">
          ${alertStatus === 'NORMAL' ? 'GREEN' : alertStatus}
        </span>
      </div>
      <div class="alert-controls" style="margin-top: 10px; display: flex; gap: 5px;">
        <button onclick="window.captainSetAlert('GREEN')" class="btn btn-small ${alertStatus === 'NORMAL' || alertStatus === 'GREEN' ? 'btn-success' : 'btn-secondary'}" title="Normal operations">
          Green
        </button>
        <button onclick="window.captainSetAlert('YELLOW')" class="btn btn-small ${alertStatus === 'YELLOW' ? 'btn-warning' : 'btn-secondary'}" title="Battle stations - combat readiness">
          Yellow
        </button>
        <button onclick="window.captainSetAlert('RED')" class="btn btn-small ${alertStatus === 'RED' ? 'btn-danger' : 'btn-secondary'}" title="Emergency - all hands">
          Red
        </button>
      </div>
    </div>

    <div class="detail-section captain-orders-section">
      <h4>Issue Orders</h4>
      <div class="quick-orders" style="margin-bottom: 8px; display: flex; gap: 5px; flex-wrap: wrap;">
        <button onclick="window.captainQuickOrder('Evade')" class="btn btn-small btn-secondary" title="Order evasive maneuvers">Evade</button>
        <button onclick="window.captainQuickOrder('Hold Position')" class="btn btn-small btn-secondary" title="Maintain current position">Hold</button>
        <button onclick="window.captainQuickOrder('Engage')" class="btn btn-small btn-secondary" title="Engage hostiles">Engage</button>
        <button onclick="window.captainQuickOrder('Stand Down')" class="btn btn-small btn-secondary" title="Return to normal ops">Stand Down</button>
      </div>
      <div class="nav-orders" style="margin-bottom: 8px; display: flex; gap: 5px; flex-wrap: wrap;">
        <button onclick="window.captainNavOrder('Emergency Stop')" class="btn btn-small btn-danger" title="All stop - emergency">E-Stop</button>
        <button onclick="window.captainNavOrder('Pursue')" class="btn btn-small btn-warning" title="Pursue target">Pursue</button>
        <button onclick="window.captainNavOrder('Run Silent')" class="btn btn-small btn-secondary" title="Minimize emissions">Silent</button>
        <button onclick="window.captainNavOrder('Full Thrust')" class="btn btn-small btn-primary" title="Maximum acceleration">Full</button>
      </div>
      ${contacts?.length > 0 ? `
      <div class="contact-orders" style="margin-bottom: 8px; display: flex; gap: 5px; align-items: center;">
        <select id="order-contact-select" class="order-select" style="flex: 1; max-width: 150px;">
          ${contacts.map(c => `
            <option value="${c.id}">${escapeHtml(c.transponder || c.name || 'Contact')}</option>
          `).join('')}
        </select>
        <button onclick="window.captainContactOrder('intercept')" class="btn btn-small btn-warning" title="Intercept contact">Intercept</button>
        <button onclick="window.captainContactOrder('track')" class="btn btn-small btn-secondary" title="Track contact">Track</button>
        <button onclick="window.captainContactOrder('avoid')" class="btn btn-small btn-secondary" title="Avoid contact">Avoid</button>
      </div>
      ` : ''}
      <div class="order-input-row" style="display: flex; gap: 5px;">
        <select id="order-target-select" class="order-select" style="flex: 0 0 100px;">
          <option value="all">All Crew</option>
          <option value="pilot">Pilot</option>
          <option value="gunner">Gunner</option>
          <option value="engineer">Engineer</option>
          <option value="sensor_operator">Sensors</option>
        </select>
        <input type="text" id="order-text-input" class="order-input" placeholder="Enter order..." maxlength="200" style="flex: 1;">
        <button onclick="window.captainIssueOrder()" class="btn btn-small btn-primary" title="Send order to selected crew">Send</button>
      </div>
      <div id="pending-orders" class="pending-orders" style="margin-top: 10px; max-height: 100px; overflow-y: auto;"></div>
    </div>

    <div class="detail-section captain-contacts-section">
      <h4>Tactical Overview</h4>
      <div class="detail-stats">
        <div class="stat-row">
          <span>Total Contacts:</span>
          <span class="stat-value">${contacts?.length || 0}</span>
        </div>
        <div class="stat-row">
          <span>Hostile:</span>
          <span class="stat-value ${hostileCount > 0 ? 'text-danger' : ''}">${hostileCount}</span>
        </div>
        <div class="stat-row">
          <span>Unknown:</span>
          <span class="stat-value ${unknownCount > 0 ? 'text-warning' : ''}">${unknownCount}</span>
        </div>
      </div>
      ${contacts?.length > 0 ? `
        <div class="contact-marking" style="margin-top: 10px;">
          <label for="mark-contact-select">Mark Contact:</label>
          <select id="mark-contact-select" class="mark-select" style="width: 100%; margin-top: 5px;">
            ${contacts.map(c => `
              <option value="${c.id}">${escapeHtml(c.name || 'Unknown')} - ${c.marking || 'unknown'}</option>
            `).join('')}
          </select>
          <div class="marking-buttons" style="margin-top: 5px; display: flex; gap: 5px;">
            <button onclick="window.captainMarkContact('friendly')" class="btn btn-small btn-success" title="Mark as friendly">Friendly</button>
            <button onclick="window.captainMarkContact('neutral')" class="btn btn-small btn-secondary" title="Mark as neutral">Neutral</button>
            <button onclick="window.captainMarkContact('hostile')" class="btn btn-small btn-danger" title="Mark as hostile">Hostile</button>
          </div>
        </div>
      ` : ''}
    </div>

    <div class="detail-section captain-weapons-section">
      <h4>Weapons Authorization</h4>
      <div class="weapons-auth-master" style="margin-bottom: 10px;">
        <button onclick="window.captainWeaponsAuth('hold')" class="btn btn-small ${shipState.weaponsAuth?.mode !== 'free' ? 'btn-warning' : 'btn-secondary'}" title="Gunners cannot fire">
          Weapons Hold
        </button>
        <button onclick="window.captainWeaponsAuth('free')" class="btn btn-small ${shipState.weaponsAuth?.mode === 'free' ? 'btn-danger' : 'btn-secondary'}" title="Gunners may engage">
          Weapons Free
        </button>
      </div>
      ${targetableContacts.length === 0 ? `
        <div class="placeholder">No targetable contacts</div>
      ` : `
        <div class="weapons-auth-status">
          <div class="stat-row">
            <span>Authorized:</span>
            <span class="stat-value ${authorizedTargets.length > 0 ? 'text-warning' : ''}">${authorizedTargets.length}</span>
          </div>
        </div>
      `}
    </div>

    <div class="detail-section captain-crew-section">
      <h4>Crew Status</h4>
      <div class="detail-stats">
        <div class="stat-row">
          <span>Online:</span>
          <span class="stat-value">${crewOnline?.length || 0}</span>
        </div>
        <div class="stat-row">
          <span>NPC Crew:</span>
          <span class="stat-value">${ship?.npcCrew?.length || 0}</span>
        </div>
      </div>
      <button onclick="window.captainRequestStatus()" class="btn btn-small btn-secondary" style="margin-top: 10px;" title="Request status from all stations">
        Request Status Report
      </button>
    </div>

    <div class="detail-section captain-leadership-section">
      <h4>Command Actions</h4>
      <div class="leadership-buttons" style="display: flex; gap: 5px; flex-wrap: wrap;">
        <button onclick="window.captainLeadershipCheck()" class="btn btn-small btn-primary" title="Roll Leadership to give DM to next crew action">
          Leadership Check
        </button>
        <button onclick="window.captainTacticsCheck()" class="btn btn-small btn-primary" title="Roll Tactics for initiative bonus">
          Tactics Check
        </button>
      </div>
      <div id="leadership-result" class="leadership-result" style="margin-top: 10px;"></div>
    </div>

    ${rescueTargets.length > 0 ? `
    <div class="detail-section captain-rescue-section">
      <h4>Rescue Priorities (${rescueTargets.length})</h4>
      <div class="rescue-list">
        ${rescueTargets.sort((a, b) => (a.eta || 999) - (b.eta || 999)).map((r, i) => `
          <div class="rescue-item ${r.eta && r.eta < 10 ? 'urgent' : ''}" style="padding: 6px 8px; background: ${i === 0 ? 'rgba(220,53,69,0.15)' : 'var(--bg-secondary)'}; border-radius: 4px; margin: 4px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="rescue-name">${escapeHtml(r.name || 'Unknown')}</span>
              <span class="rescue-count" style="font-weight: bold;">${r.count || '?'} souls</span>
            </div>
            <div style="font-size: 0.85em; color: var(--text-muted); display: flex; justify-content: space-between;">
              <span>${escapeHtml(r.location || '')}</span>
              ${r.eta ? `<span class="${r.eta < 10 ? 'text-danger' : 'text-warning'}">ETA: ${r.eta}m</span>` : ''}
            </div>
            ${r.notes ? `<div style="font-size: 0.8em; font-style: italic; color: var(--text-muted);">${escapeHtml(r.notes)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="detail-section captain-solo-section">
      <h4>Ship Operations (Solo Mode)</h4>
      <p style="color: var(--text-muted); font-size: 0.8em; margin-bottom: 8px;">
        Command all ship functions directly. Skill: Captain=0, Filled Role=1, Skilled Crew=their skill.
      </p>
      <div class="solo-controls" style="display: flex; flex-direction: column; gap: 8px;">
        <div class="solo-group">
          <label style="font-size: 0.85em; color: var(--text-secondary);">Navigation</label>
          <div style="display: flex; gap: 5px; margin-top: 4px;">
            <button id="btn-captain-solo-plot" onclick="window.captainSoloCommand('plotJump')" class="btn btn-small btn-secondary" title="Plot jump course to destination">
              Plot Jump
            </button>
            <button id="btn-captain-solo-verify" onclick="window.captainSoloCommand('verifyPosition')" class="btn btn-small btn-secondary" title="Verify position after jump exit">
              Verify Position
            </button>
          </div>
        </div>
        <div class="solo-group">
          <label style="font-size: 0.85em; color: var(--text-secondary);">Helm</label>
          <div style="display: flex; gap: 5px; margin-top: 4px;">
            <button id="btn-captain-solo-course" onclick="window.captainSoloCommand('setCourse')" class="btn btn-small btn-secondary" title="Set course to destination">
              Set Course
            </button>
          </div>
        </div>
        <div class="solo-group">
          <label style="font-size: 0.85em; color: var(--text-secondary);">Engineering</label>
          <div style="display: flex; gap: 5px; margin-top: 4px;">
            <button id="btn-captain-solo-refuel" onclick="window.captainSoloCommand('refuel')" class="btn btn-small btn-secondary" title="Begin refueling">
              Refuel
            </button>
            <button id="btn-captain-solo-refine" onclick="window.captainSoloCommand('refineFuel')" class="btn btn-small btn-secondary" title="Process unrefined fuel">
              Refine Fuel
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="detail-section captain-comms-section">
      <h4>Communications</h4>
      ${hailableContacts.length === 0 ? `
        <div class="placeholder">No hailable contacts in range</div>
      ` : `
        <div class="hail-controls">
          <select id="hail-contact-select" class="hail-select" style="width: 100%; margin-bottom: 8px;">
            ${hailableContacts.map(c => `
              <option value="${c.id}">${escapeHtml(c.transponder || c.name || 'Unknown')} (${c.type})</option>
            `).join('')}
          </select>
          <div class="hail-buttons" style="display: flex; gap: 5px; margin-bottom: 8px;">
            <button onclick="window.hailSelectedContact()" class="btn btn-small btn-primary" title="Open channel to selected contact">
              Hail
            </button>
            <button onclick="window.broadcastMessage()" class="btn btn-small btn-secondary" title="Broadcast to all contacts">
              Broadcast
            </button>
          </div>
          <div class="message-input-row" style="display: flex; gap: 5px;">
            <input type="text" id="comms-message-input" class="comms-input" placeholder="Enter message..." maxlength="500" style="flex: 1;">
            <button onclick="window.sendCommsMessage()" class="btn btn-small btn-success" title="Send message to selected contact">
              Send
            </button>
          </div>
        </div>
      `}
    </div>
  `;
}

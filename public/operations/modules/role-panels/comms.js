/**
 * AR-204: Comms Role Panel
 * Extracted from role-panels.js for maintainability.
 */

import { escapeHtml } from '../utils.js';

/**
 * Generate Comms role panel HTML
 * @param {object} shipState - Current ship state
 * @param {array} contacts - Sensor contacts
 * @param {array} crewOnline - Online crew list
 * @returns {string} HTML string
 */
export function getCommsPanel(shipState, contacts = [], crewOnline = []) {
  // Find hailable contacts (have transponder and are ships/stations)
  const hailableContacts = contacts?.filter(c =>
    c.transponder && c.transponder !== 'NONE' &&
    !c.celestial && c.type &&
    ['Ship', 'Station', 'Starport', 'Base', 'Patrol', 'Free Trader', 'Far Trader', 'System Defense Boat'].includes(c.type)
  ) || [];

  // Active hail status
  const activeHail = shipState.activeHail || null;
  const transponderStatus = shipState.transponder || 'ACTIVE';
  const radioStatus = shipState.radioStatus || 'STANDBY';

  // Unread message count
  const unreadCount = shipState.unreadMailCount || 0;

  return `
    <div class="detail-section comms-status">
      <h4>Communications Status</h4>
      <div class="detail-stats">
        <div class="stat-row">
          <span>Transponder:</span>
          <span class="stat-value ${transponderStatus === 'SILENT' ? 'text-warning' : 'text-success'}">${transponderStatus}</span>
        </div>
        <div class="stat-row">
          <span>Radio:</span>
          <span class="stat-value">${radioStatus}</span>
        </div>
        ${unreadCount > 0 ? `
        <div class="stat-row">
          <span>Unread Messages:</span>
          <span class="stat-value text-warning">${unreadCount}</span>
        </div>
        ` : ''}
      </div>
      ${activeHail ? `
      <div class="active-hail" style="margin-top: 8px; padding: 8px; background: rgba(40,167,69,0.15); border-radius: 4px;">
        <strong>Active Channel:</strong> ${escapeHtml(activeHail.target)}
        <button onclick="roleAction('endHail')" class="btn btn-small btn-secondary" style="margin-left: 8px;">End</button>
      </div>
      ` : ''}
    </div>

    <div class="detail-section comms-email">
      <h4>Ship Mail</h4>
      <div class="action-buttons">
        <button onclick="window.openEmailApp()" class="btn btn-small ${unreadCount > 0 ? 'btn-warning' : 'btn-primary'}"
                title="Open ship mail system">
          ${unreadCount > 0 ? `📬 Messages (${unreadCount})` : '📧 Open Mail'}
        </button>
      </div>
    </div>

    <div class="detail-section comms-hailing">
      <h4>Hailing</h4>
      ${hailableContacts.length > 0 ? `
        <div class="hail-contacts" style="margin-bottom: 8px;">
          <select id="hail-contact-select" class="hail-select" style="width: 100%;">
            ${hailableContacts.map(c => `
              <option value="${c.id}">${escapeHtml(c.transponder || c.name || 'Unknown')}</option>
            `).join('')}
          </select>
        </div>
        <div class="action-buttons" style="display: flex; gap: 6px;">
          <button onclick="window.hailSelectedContact()" class="btn btn-small btn-primary"
                  title="Open voice channel to selected contact">
            Hail
          </button>
          <button onclick="window.broadcastMessage()" class="btn btn-small btn-secondary"
                  title="Broadcast message on open frequencies">
            Broadcast
          </button>
        </div>
      ` : `
        <div class="placeholder">No contacts with active transponders</div>
      `}
    </div>

    <div class="detail-section comms-actions">
      <h4>Communications Actions</h4>
      <div class="action-buttons" style="display: flex; flex-wrap: wrap; gap: 6px;">
        <button onclick="roleAction('toggleTransponder')" class="btn btn-small ${transponderStatus === 'SILENT' ? 'btn-warning' : 'btn-secondary'}"
                title="Toggle ship transponder. Silent running hides identity but violates traffic regulations.">
          ${transponderStatus === 'SILENT' ? 'Enable Transponder' : 'Go Silent'}
        </button>
        <button onclick="roleAction('scanFrequencies')" class="btn btn-small"
                title="Scan local radio frequencies for chatter, distress signals, or encrypted comms.">
          Scan Frequencies
        </button>
        <button onclick="roleAction('requestDocking')" class="btn btn-small"
                title="Request docking clearance from starport or station.">
          Request Docking
        </button>
      </div>
    </div>

    <div class="detail-section comms-bridge-chat">
      <h4>Bridge Chat</h4>
      <div id="bridge-chat-log" class="chat-log" style="height: 150px; overflow-y: auto; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; margin-bottom: 8px; font-size: 12px;">
        <div class="chat-placeholder" style="color: #666; font-style: italic;">No messages yet...</div>
      </div>
      <div style="display: flex; gap: 6px;">
        <input type="text" id="bridge-chat-input" class="form-control" placeholder="Type message..."
               style="flex: 1; padding: 6px; background: rgba(255,255,255,0.1); border: 1px solid #444; border-radius: 4px; color: #fff;"
               onkeypress="if(event.key==='Enter') window.sendBridgeChatMessage()">
        <button onclick="window.sendBridgeChatMessage()" class="btn btn-small btn-primary">Send</button>
      </div>
    </div>
  `;
}

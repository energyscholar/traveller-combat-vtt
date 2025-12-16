/**
 * AR-151-5c: GM Prep Locations Module
 * Stage 8.2: Location management for GM Prep panel
 */

import { escapeHtml } from './utils.js';

/**
 * Render locations list in GM Prep panel (with tree structure)
 * @param {Object} state - Application state
 * @param {Function} showNotification - Notification function
 */
export function renderPrepLocations(state, showNotification) {
  const list = document.getElementById('locations-list');
  const count = document.getElementById('locations-count');
  const locations = state.prepLocations || [];

  if (count) count.textContent = `${locations.length} location${locations.length !== 1 ? 's' : ''}`;
  if (!list) return;

  if (locations.length === 0) {
    list.innerHTML = '<p class="placeholder">No locations prepared</p>';
    return;
  }

  // Build tree structure
  const rootLocs = locations.filter(l => !l.parent_id);
  const childMap = {};
  locations.forEach(l => {
    if (l.parent_id) {
      if (!childMap[l.parent_id]) childMap[l.parent_id] = [];
      childMap[l.parent_id].push(l);
    }
  });

  function renderLoc(loc, depth = 0) {
    const children = childMap[loc.id] || [];
    const indent = depth * 16;
    return `
      <div class="prep-item" style="margin-left: ${indent}px" data-location-id="${loc.id}">
        <div class="prep-item-header">
          <span class="prep-item-title">${escapeHtml(loc.name)}</span>
          <span class="prep-item-status ${loc.visibility}">${loc.visibility}</span>
        </div>
        <div class="prep-item-desc">
          ${escapeHtml(loc.location_type || 'scene')}
          ${loc.uwp ? ` (${escapeHtml(loc.uwp)})` : ''}
        </div>
        <div class="prep-item-actions">
          ${loc.visibility === 'hidden' ?
            `<button class="btn btn-primary btn-sm" onclick="revealLocation('${loc.id}')">Reveal</button>` :
            `<button class="btn btn-sm" onclick="hideLocation('${loc.id}')">Hide</button>`
          }
        </div>
      </div>
      ${children.map(c => renderLoc(c, depth + 1)).join('')}
    `;
  }

  list.innerHTML = rootLocs.map(loc => renderLoc(loc)).join('');
}

/**
 * Reveal location to players
 * @param {Object} state - Application state
 * @param {Function} showNotification - Notification function
 * @param {Function} renderCallback - Callback to re-render list
 * @param {string} locationId - Location ID
 */
export function revealLocation(state, showNotification, renderCallback, locationId) {
  state.socket.emit('ops:revealLocation', { locationId });
  const loc = state.prepLocations.find(l => l.id === locationId);
  if (loc) {
    loc.visibility = 'revealed';
    renderCallback();
  }
  showNotification('Location revealed', 'success');
}

/**
 * Hide location from players
 * @param {Object} state - Application state
 * @param {Function} renderCallback - Callback to re-render list
 * @param {string} locationId - Location ID
 */
export function hideLocation(state, renderCallback, locationId) {
  const loc = state.prepLocations.find(l => l.id === locationId);
  if (loc) {
    loc.visibility = 'hidden';
    renderCallback();
  }
}

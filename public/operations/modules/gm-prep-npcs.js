/**
 * AR-151-5b: GM Prep NPCs Module
 * Stage 8.2: NPC management for GM Prep panel
 */

import { escapeHtml } from './utils.js';

/**
 * Render NPCs list in GM Prep panel
 * @param {Object} state - Application state
 * @param {Function} showNotification - Notification function
 */
export function renderPrepNpcs(state, showNotification) {
  const list = document.getElementById('npcs-list');
  const count = document.getElementById('npcs-count');
  const npcs = state.prepNpcs || [];

  if (count) count.textContent = `${npcs.length} NPC${npcs.length !== 1 ? 's' : ''}`;
  if (!list) return;

  if (npcs.length === 0) {
    list.innerHTML = '<p class="placeholder">No NPCs prepared</p>';
    return;
  }

  list.innerHTML = npcs.map(npc => `
    <div class="prep-item" data-npc-id="${npc.id}">
      <div class="prep-item-header">
        <span class="prep-item-title">${escapeHtml(npc.name)}</span>
        <span class="prep-item-status ${npc.visibility}">${npc.visibility}</span>
      </div>
      <div class="prep-item-desc">
        ${npc.title ? `<strong>${escapeHtml(npc.title)}</strong> - ` : ''}
        ${escapeHtml(npc.role || 'neutral')}
        ${npc.location_text ? ` @ ${escapeHtml(npc.location_text)}` : ''}
      </div>
      <div class="prep-item-meta">
        <span>Status: ${npc.current_status || 'alive'}</span>
        ${npc.motivation_hidden ? '<span>Has hidden motivation</span>' : ''}
      </div>
      <div class="prep-item-actions">
        ${npc.visibility === 'hidden' ?
          `<button class="btn btn-primary" onclick="revealNpc('${npc.id}')">Reveal</button>` :
          `<button class="btn" onclick="hideNpc('${npc.id}')">Hide</button>`
        }
        <button class="btn" onclick="showNpcDetail('${npc.id}')">Detail</button>
      </div>
    </div>
  `).join('');
}

/**
 * Reveal NPC to players
 * @param {Object} state - Application state
 * @param {Function} showNotification - Notification function
 * @param {Function} renderCallback - Callback to re-render list
 * @param {string} npcId - NPC ID
 */
export function revealNpc(state, showNotification, renderCallback, npcId) {
  state.socket.emit('ops:revealNPC', { npcId });
  // Optimistic update
  const npc = state.prepNpcs.find(n => n.id === npcId);
  if (npc) {
    npc.visibility = 'revealed';
    renderCallback();
  }
  showNotification('NPC revealed to players', 'success');
}

/**
 * Hide NPC from players
 * @param {Object} state - Application state
 * @param {Function} renderCallback - Callback to re-render list
 * @param {string} npcId - NPC ID
 */
export function hideNpc(state, renderCallback, npcId) {
  // Would need ops:hideNPC handler - for now just update locally
  const npc = state.prepNpcs.find(n => n.id === npcId);
  if (npc) {
    npc.visibility = 'hidden';
    renderCallback();
  }
}

/**
 * Show NPC detail modal
 * @param {Object} state - Application state
 * @param {Function} showModalContent - Modal display function
 * @param {string} npcId - NPC ID
 */
export function showNpcDetail(state, showModalContent, npcId) {
  const npc = state.prepNpcs.find(n => n.id === npcId);
  if (!npc) return;

  const html = `
    <div class="modal-header">
      <h2>${escapeHtml(npc.name)}</h2>
      <button class="btn-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      ${npc.title ? `<p><strong>Title:</strong> ${escapeHtml(npc.title)}</p>` : ''}
      <p><strong>Role:</strong> ${escapeHtml(npc.role || 'neutral')}</p>
      <p><strong>Status:</strong> ${escapeHtml(npc.current_status || 'alive')}</p>
      ${npc.location_text ? `<p><strong>Location:</strong> ${escapeHtml(npc.location_text)}</p>` : ''}
      ${npc.personality ? `<p><strong>Personality:</strong> ${escapeHtml(npc.personality)}</p>` : ''}
      ${npc.motivation_public ? `<p><strong>Public Motivation:</strong> ${escapeHtml(npc.motivation_public)}</p>` : ''}
      ${npc.motivation_hidden ? `<p><strong>Hidden Motivation:</strong> <em>${escapeHtml(npc.motivation_hidden)}</em></p>` : ''}
      ${npc.background ? `<p><strong>Background:</strong> ${escapeHtml(npc.background)}</p>` : ''}
      ${npc.notes ? `<p><strong>GM Notes:</strong> ${escapeHtml(npc.notes)}</p>` : ''}
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Close</button>
      ${npc.visibility === 'hidden' ?
        `<button class="btn btn-primary" onclick="revealNpc('${npc.id}'); closeModal();">Reveal</button>` : ''
      }
    </div>
  `;
  showModalContent(html);
}

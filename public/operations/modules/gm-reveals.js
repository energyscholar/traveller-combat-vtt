/**
 * AR-151-5a: GM Reveals Module
 * Stage 8.1: Reveal management for GM Prep
 */

import { escapeHtml } from './utils.js';

/**
 * Render reveals list in GM Prep panel
 * @param {Object} state - Application state
 */
export function renderPrepReveals(state) {
  const list = document.getElementById('reveals-list');
  const count = document.getElementById('reveals-count');
  const reveals = state.prepReveals || [];

  if (count) count.textContent = `${reveals.length} reveal${reveals.length !== 1 ? 's' : ''}`;

  if (!list) return;

  if (reveals.length === 0) {
    list.innerHTML = '<p class="placeholder">No reveals prepared</p>';
    return;
  }

  list.innerHTML = reveals.map(reveal => `
    <div class="prep-item" data-reveal-id="${reveal.id}">
      <div class="prep-item-header">
        <span class="prep-item-title">${escapeHtml(reveal.title)}</span>
        <span class="prep-item-status ${reveal.status}">${reveal.status}</span>
      </div>
      <div class="prep-item-desc">${escapeHtml(reveal.description || '')}</div>
      <div class="prep-item-meta">
        <span>Type: ${reveal.type || 'info'}</span>
        ${reveal.target ? `<span>To: ${reveal.target}</span>` : ''}
      </div>
      <div class="prep-item-actions">
        <button class="btn btn-primary" onclick="revealToPlayers('${reveal.id}')">Reveal</button>
        <button class="btn" onclick="editReveal('${reveal.id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteReveal('${reveal.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

/**
 * Show modal to add new reveal
 * @param {Function} showModalContent - Modal display function
 */
export function showAddRevealModal(showModalContent) {
  const html = `
    <div class="modal-header">
      <h2>Add Reveal</h2>
      <button class="btn-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label for="reveal-title">Title</label>
        <input type="text" id="reveal-title" class="form-input" placeholder="Brief title for GM reference">
      </div>
      <div class="form-group">
        <label for="reveal-type">Type</label>
        <select id="reveal-type" class="form-input">
          <option value="info">Information</option>
          <option value="secret">Secret</option>
          <option value="clue">Clue</option>
          <option value="event">Event Trigger</option>
          <option value="npc">NPC Introduction</option>
        </select>
      </div>
      <div class="form-group">
        <label for="reveal-description">Content (shown to players)</label>
        <textarea id="reveal-description" class="form-input" rows="4" placeholder="What players will see when revealed"></textarea>
      </div>
      <div class="form-group">
        <label for="reveal-target">Target (optional)</label>
        <select id="reveal-target" class="form-input">
          <option value="">All Players</option>
          <option value="captain">Captain Only</option>
          <option value="pilot">Pilot Only</option>
          <option value="sensor_operator">Sensor Operator Only</option>
        </select>
      </div>
      <div class="form-group">
        <label for="reveal-notes">GM Notes (not shown to players)</label>
        <textarea id="reveal-notes" class="form-input" rows="2" placeholder="Private notes for GM"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitReveal()">Add Reveal</button>
    </div>
  `;
  showModalContent(html);
}

/**
 * Submit new reveal
 * @param {Object} state - Application state
 * @param {Function} showNotification - Notification function
 * @param {Function} closeModal - Modal close function
 */
export function submitReveal(state, showNotification, closeModal) {
  const title = document.getElementById('reveal-title')?.value?.trim();
  const type = document.getElementById('reveal-type')?.value;
  const description = document.getElementById('reveal-description')?.value?.trim();
  const target = document.getElementById('reveal-target')?.value;
  const notes = document.getElementById('reveal-notes')?.value?.trim();

  if (!title) {
    showNotification('Title is required', 'error');
    return;
  }

  if (!description) {
    showNotification('Content is required', 'error');
    return;
  }

  state.socket.emit('ops:addReveal', {
    campaignId: state.campaign.id,
    title,
    type,
    description,
    target: target || null,
    notes: notes || null
  });

  closeModal();
  showNotification('Reveal added', 'success');
}

/**
 * Reveal to players
 * @param {Object} state - Application state
 * @param {Function} showNotification - Notification function
 * @param {string} revealId - Reveal ID
 */
export function revealToPlayers(state, showNotification, revealId) {
  const reveal = (state.prepReveals || []).find(r => r.id === revealId);
  if (!reveal) return;

  // Confirm before revealing
  if (confirm(`Reveal "${reveal.title}" to ${reveal.target || 'all players'}?`)) {
    state.socket.emit('ops:executeReveal', {
      campaignId: state.campaign.id,
      revealId
    });
  }
}

/**
 * Edit reveal modal
 * @param {Object} state - Application state
 * @param {Function} showModalContent - Modal display function
 * @param {string} revealId - Reveal ID
 */
export function editReveal(state, showModalContent, revealId) {
  const reveal = (state.prepReveals || []).find(r => r.id === revealId);
  if (!reveal) return;

  const html = `
    <div class="modal-header">
      <h2>Edit Reveal</h2>
      <button class="btn-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label for="reveal-title">Title</label>
        <input type="text" id="reveal-title" class="form-input" value="${escapeHtml(reveal.title)}">
      </div>
      <div class="form-group">
        <label for="reveal-type">Type</label>
        <select id="reveal-type" class="form-input">
          <option value="info" ${reveal.type === 'info' ? 'selected' : ''}>Information</option>
          <option value="secret" ${reveal.type === 'secret' ? 'selected' : ''}>Secret</option>
          <option value="clue" ${reveal.type === 'clue' ? 'selected' : ''}>Clue</option>
          <option value="event" ${reveal.type === 'event' ? 'selected' : ''}>Event Trigger</option>
          <option value="npc" ${reveal.type === 'npc' ? 'selected' : ''}>NPC Introduction</option>
        </select>
      </div>
      <div class="form-group">
        <label for="reveal-description">Content</label>
        <textarea id="reveal-description" class="form-input" rows="4">${escapeHtml(reveal.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label for="reveal-target">Target</label>
        <select id="reveal-target" class="form-input">
          <option value="" ${!reveal.target ? 'selected' : ''}>All Players</option>
          <option value="captain" ${reveal.target === 'captain' ? 'selected' : ''}>Captain Only</option>
          <option value="pilot" ${reveal.target === 'pilot' ? 'selected' : ''}>Pilot Only</option>
          <option value="sensor_operator" ${reveal.target === 'sensor_operator' ? 'selected' : ''}>Sensor Operator Only</option>
        </select>
      </div>
      <div class="form-group">
        <label for="reveal-notes">GM Notes</label>
        <textarea id="reveal-notes" class="form-input" rows="2">${escapeHtml(reveal.notes || '')}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="updateReveal('${revealId}')">Save Changes</button>
    </div>
  `;
  showModalContent(html);
}

/**
 * Update reveal
 * @param {Object} state - Application state
 * @param {Function} showNotification - Notification function
 * @param {Function} closeModal - Modal close function
 * @param {string} revealId - Reveal ID
 */
export function updateReveal(state, showNotification, closeModal, revealId) {
  const title = document.getElementById('reveal-title')?.value?.trim();
  const type = document.getElementById('reveal-type')?.value;
  const description = document.getElementById('reveal-description')?.value?.trim();
  const target = document.getElementById('reveal-target')?.value;
  const notes = document.getElementById('reveal-notes')?.value?.trim();

  if (!title || !description) {
    showNotification('Title and content are required', 'error');
    return;
  }

  state.socket.emit('ops:updateReveal', {
    campaignId: state.campaign.id,
    revealId,
    title,
    type,
    description,
    target: target || null,
    notes: notes || null
  });

  closeModal();
  showNotification('Reveal updated', 'success');
}

/**
 * Delete reveal
 * @param {Object} state - Application state
 * @param {Function} showNotification - Notification function
 * @param {string} revealId - Reveal ID
 */
export function deleteReveal(state, showNotification, revealId) {
  if (confirm('Delete this reveal?')) {
    state.socket.emit('ops:deleteReveal', {
      campaignId: state.campaign.id,
      revealId
    });
    showNotification('Reveal deleted', 'info');
  }
}

/**
 * Show reveal modal for players
 * @param {Function} showModalContent - Modal display function
 * @param {Function} closeModal - Modal close function
 * @param {Object} data - Reveal data
 */
export function showPlayerRevealModal(showModalContent, closeModal, data) {
  const html = `
    <div class="modal-header">
      <h2>${data.type === 'secret' ? '🔒 Secret' : data.type === 'clue' ? '🔍 Clue' : 'ℹ️ Information'}</h2>
      <button class="btn-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="reveal-content" style="font-size: 16px; line-height: 1.6; padding: 16px 0;">
        ${escapeHtml(data.content).replace(/\n/g, '<br>')}
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="closeModal()">Acknowledged</button>
    </div>
  `;
  showModalContent(html);
}

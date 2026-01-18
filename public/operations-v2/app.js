/**
 * Operations VTT V2 - Main Application
 *
 * Orchestrates socket communication and GUI adapter.
 * Target: <500 LOC
 *
 * @module public/operations-v2/app
 */

/* global io, GUIAdapter, renderers */

// ============================================
// STATE
// ============================================

const state = {
  socket: null,
  adapter: null,
  mode: null, // 'gm' | 'player' | 'solo'
  campaignId: null,
  campaignCode: null,
  shipId: null,
  role: null,
  slotId: null,
  userName: null,
  campaigns: [],
  playerSlots: [],
  ships: [],
  availableRoles: [],
  crew: [],
  contacts: [],
  connected: false
};

// ============================================
// INITIALIZATION
// ============================================

function init() {
  console.log('[OPS-V2] Initializing V2 interface...');

  // Initialize GUI adapter
  state.adapter = new GUIAdapter({
    container: document.getElementById('app'),
    onAction: handleAction
  });

  // Connect to socket
  connectSocket();

  console.log('[OPS-V2] V2 interface ready');
}

// ============================================
// SOCKET CONNECTION
// ============================================

function connectSocket() {
  state.socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  // Connection events
  state.socket.on('connect', handleConnect);
  state.socket.on('disconnect', handleDisconnect);
  state.socket.on('connect_error', handleConnectError);

  // Campaign events
  state.socket.on('ops:campaigns', handleCampaigns);
  state.socket.on('ops:campaignData', handleCampaignData);
  state.socket.on('ops:campaignCreated', handleCampaignCreated);

  // Player events
  state.socket.on('ops:campaignJoined', handleCampaignJoined);
  state.socket.on('ops:playerSlots', handlePlayerSlots);
  state.socket.on('ops:playerSlotSelected', handlePlayerSlotSelected);
  state.socket.on('ops:playerJoined', handlePlayerJoined);
  state.socket.on('ops:slotStatusUpdate', handleSlotStatusUpdate);

  // Bridge events
  state.socket.on('ops:bridgeUpdate', handleBridgeUpdate);
  state.socket.on('ops:roleUpdate', handleRoleUpdate);

  // Error events
  state.socket.on('ops:error', handleError);

  state.socket.on('ops:bridgeJoined', handleBridgeJoined);
  state.socket.on('ops:crewOnBridge', handleCrewUpdate);
  state.socket.on('ops:contacts', handleContacts);
  state.socket.on('ops:sessionStarted', handleSessionStarted);
}

function handleConnect() {
  console.log('[OPS-V2] Connected to server');
  state.connected = true;
  state.adapter.setVisible('connection-status', false);

  // Ping to keep alive
  setInterval(() => {
    if (state.connected) {
      state.socket.emit('ops:ping');
    }
  }, 30000);
}

function handleDisconnect() {
  console.log('[OPS-V2] Disconnected from server');
  state.connected = false;
  state.adapter.setText('connection-text', 'Disconnected - Reconnecting...');
  state.adapter.setVisible('connection-status', true);
}

function handleConnectError(err) {
  console.error('[OPS-V2] Connection error:', err.message);
  showError('Connection failed: ' + err.message);
}

// ============================================
// SOCKET HANDLERS
// ============================================

function handleCampaigns(data) {
  console.log('[OPS-V2] Received campaigns:', data.campaigns?.length || 0);
  state.campaigns = data.campaigns || [];

  const container = document.getElementById('campaign-list');
  if (container) {
    if (state.campaigns.length === 0) {
      container.innerHTML = '<div class="empty-list">No campaigns yet</div>';
    } else {
      container.innerHTML = state.campaigns.map(c => renderers.renderCampaignItem(c)).join('');
    }
  }
}

function handleCampaignData(data) {
  console.log('[OPS-V2] Campaign data:', data.campaign?.name);
  state.campaignId = data.campaign?.id;
  state.campaignCode = data.campaign?.id?.substring(0, 8)?.toUpperCase() || null;

  // Auto-select first party ship
  const partyShips = (data.ships || []).filter(s => s.is_party_ship);
  if (partyShips.length > 0) {
    state.shipId = partyShips[0].id;
  }

  state.adapter.setText('campaign-code-value', state.campaignCode || '--------');
  state.adapter.setText('gm-campaign-name', data.campaign?.name || 'Campaign');

  if (state.mode === 'gm') {
    state.adapter.showScreen('gm-setup-screen');
  }
}

function handleCampaignCreated(data) {
  console.log('[OPS-V2] Campaign created:', data.campaign?.name);
  handleCampaignData(data);
}

function handleCampaignJoined(data) {
  console.log('[OPS-V2] Campaign joined:', data.campaign?.name);
  state.campaignId = data.campaign?.id;
  state.campaignCode = data.campaign?.id?.substring(0, 8)?.toUpperCase() || null;
  // Delegate to player slots handler with available slots
  handlePlayerSlots({ slots: data.availableSlots || [] });
}

function handlePlayerSlots(data) {
  console.log('[OPS-V2] Player slots:', data.slots?.length || 0);
  state.playerSlots = data.slots || [];

  const container = document.getElementById('player-slot-list');
  if (container) {
    if (state.playerSlots.length === 0) {
      container.innerHTML = '<div class="empty-list">No slots available</div>';
    } else {
      container.innerHTML = state.playerSlots.map(s => renderers.renderPlayerSlot(s)).join('');
    }
  }

  // Show slot selection
  state.adapter.setVisible('player-select', false);
  state.adapter.setVisible('player-slot-select', true);
}

function handlePlayerSlotSelected(data) {
  console.log('[OPS-V2] Player slot selected:', data.account?.slot_name);
  state.slotId = data.account?.id;
  state.userName = data.account?.slot_name;
  state.ships = data.ships || [];
  state.availableRoles = data.availableRoles || [];

  // Use pre-existing role/ship from account if available
  const existingRole = data.account?.role;
  const existingShipId = data.account?.ship_id;
  if (existingShipId) state.shipId = existingShipId;
  if (existingRole) state.role = existingRole;

  // Populate ships list
  const shipContainer = document.getElementById('ship-select-list');
  if (shipContainer) {
    if (state.ships.length === 0) {
      shipContainer.innerHTML = '<div class="empty-list">No ships available</div>';
    } else if (state.ships.length === 1 || existingShipId) {
      // Auto-select single ship or use existing
      state.shipId = existingShipId || state.ships[0].id;
      const shipName = state.ships.find(s => s.id === state.shipId)?.name || 'Ship';
      shipContainer.innerHTML = `<div class="ship-card selected">${shipName}</div>`;
    } else {
      shipContainer.innerHTML = state.ships.map(s =>
        `<div class="ship-card" data-action="selectShip" data-ship-id="${s.id}">${s.name}</div>`
      ).join('');
    }
  }

  // Populate roles list, highlight existing role
  const roleContainer = document.getElementById('role-select-list');
  if (roleContainer) {
    roleContainer.innerHTML = state.availableRoles.map(r =>
      `<div class="role-option ${r === existingRole ? 'selected' : ''}" data-action="selectRole" data-role-id="${r}">${r}</div>`
    ).join('');
  }

  // Enable join button if ship and role are set
  const joinBtn = document.getElementById('btn-join-bridge');
  if (joinBtn && state.shipId && state.role) {
    joinBtn.disabled = false;
  }

  state.adapter.showScreen('player-setup-screen');
}

function handlePlayerJoined(data) {
  console.log('[OPS-V2] Player joined:', data.slotId);
  state.slotId = data.slotId;
  state.role = data.role;
  state.userName = data.name;

  // Navigate to player setup or bridge
  if (data.onBridge) {
    state.adapter.showScreen('bridge-screen');
    updateBridgeHeader(data);
  } else {
    state.adapter.showScreen('player-setup-screen');
  }
}

function handleSlotStatusUpdate(data) {
  if (state.playerSlots.length > 0) handlePlayerSlots({ slots: data.slots || state.playerSlots });
}
function handleBridgeUpdate(data) {
  updateBridgeHeader(data);
  if (data.hull) state.adapter.setText('hull-value', `${data.hull.percent || 100}%`);
  if (data.power) state.adapter.setText('power-value', `${data.power.percent || 100}%`);
  if (data.fuel) state.adapter.setText('fuel-value', `${data.fuel.percent || 100}%`);
  if (data.crew) state.adapter.setHtml('crew-list', data.crew.map(c => renderers.renderCrewMember(c)).join(''));
  if (data.contacts) state.adapter.setHtml('contact-list', data.contacts.map(c => renderers.renderContactItem(c)).join(''));
}
function handleRoleUpdate(data) { /* Role panel via ViewModel - not yet implemented */ }
function handleError(error) { console.error('[OPS-V2] Server error:', error.message); showError(error.message); }

function handleBridgeJoined(data) {
  console.log('[OPS-V2] Bridge joined:', data.ship?.name);
  state.crew = [...(data.crew || []), ...(data.npcCrew || [])].filter(c => c.role !== 'gm' && !c.isGM);
  state.contacts = data.contacts || [];
  state.shipId = data.ship?.id || state.shipId;
  renderCrewList(); renderContacts(); state.adapter.showScreen('bridge-screen');
}

function handleCrewUpdate(data) { state.crew = (data.crew || []).filter(c => c.role !== 'gm' && !c.isGM); renderCrewList(); }
function handleContacts(data) { state.contacts = data.contacts || []; renderContacts(); }
function handleSessionStarted(data) { console.log('[OPS-V2] Session started:', data.currentSystem); }
function renderCrewList() { const el = document.getElementById('crew-list'); if (el) el.innerHTML = state.crew.length ? state.crew.map(c => renderers.renderCrewMember(c)).join('') : ''; }
function renderContacts() { const el = document.getElementById('contacts-panel'); if (el) el.innerHTML = state.contacts.length ? state.contacts.map(c => renderers.renderContactItem(c)).join('') : ''; }

// ============================================
// ACTION HANDLERS
// ============================================

const actionHandlers = {
  gmLogin: startGMLogin, playerLogin: startPlayerLogin, soloDemo: startSoloDemo,
  backToLogin, createCampaign, joinCampaign, startSession, joinBridge, copyCode, logout,
  backToPlayerSelect: () => { state.adapter.setVisible('player-slot-select', false); state.adapter.setVisible('player-select', true); },
  selectCampaign: (d) => selectCampaign(d.campaignId),
  selectSlot: (d) => selectSlot(d.slotId),
  selectShip: (d) => selectShip(d.shipId),
  selectRole: (d) => selectRole(d.roleId),
  closeToast: () => state.adapter.setVisible('error-toast', false)
};
function handleAction(action, data) {
  console.log('[OPS-V2] Action:', action, data);
  const handler = actionHandlers[action];
  if (handler) handler(data); else console.log('[OPS-V2] Unknown action:', action);
}

// ============================================
// LOGIN FLOWS
// ============================================

function startGMLogin() {
  state.mode = 'gm';
  state.adapter.setVisible('login-options', false);
  state.adapter.setVisible('campaign-select', true);

  // Request campaigns
  state.socket.emit('ops:getCampaigns');
}

function startPlayerLogin() {
  state.mode = 'player';
  state.adapter.setVisible('login-options', false);
  state.adapter.setVisible('player-select', true);
}

function startSoloDemo() {
  state.mode = 'solo';
  console.log('[OPS-V2] Starting solo demo...');
  state.socket.emit('ops:joinSoloDemoCampaign');
}

function backToLogin() {
  state.mode = null;
  state.adapter.setVisible('campaign-select', false);
  state.adapter.setVisible('player-select', false);
  state.adapter.setVisible('player-slot-select', false);
  state.adapter.setVisible('login-options', true);
}

function selectCampaign(campaignId) {
  console.log('[OPS-V2] Selecting campaign:', campaignId);
  state.socket.emit('ops:selectCampaign', { campaignId });
}

function createCampaign() {
  const name = prompt('Campaign name:');
  if (name) {
    state.socket.emit('ops:createCampaign', { name });
  }
}

function joinCampaign() {
  const codeInput = document.getElementById('campaign-code');
  const code = codeInput?.value?.trim();

  if (!code) {
    showError('Please enter a campaign code');
    return;
  }

  console.log('[OPS-V2] Joining campaign with code:', code);
  state.socket.emit('ops:joinCampaignAsPlayer', { campaignId: code });
}

function selectSlot(slotId) {
  console.log('[OPS-V2] Selecting slot:', slotId);
  // Server expects accountId, not slotId
  state.socket.emit('ops:selectPlayerSlot', { accountId: slotId });
}

function selectShip(shipId) {
  console.log('[OPS-V2] Selecting ship:', shipId);
  state.shipId = shipId;
  // Update UI to show selection
  document.querySelectorAll('#ship-select-list .ship-card').forEach(el => {
    el.classList.toggle('selected', el.dataset.shipId === shipId);
  });
  // Enable join button
  const joinBtn = document.getElementById('btn-join-bridge');
  if (joinBtn) joinBtn.disabled = false;
}

function selectRole(roleId) {
  console.log('[OPS-V2] Selecting role:', roleId);
  state.role = roleId;
  // Update UI to show selection
  document.querySelectorAll('#role-select-list .role-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.roleId === roleId);
  });
  // Enable join button
  const joinBtn = document.getElementById('btn-join-bridge');
  if (joinBtn) joinBtn.disabled = false;
}

function startSession() {
  console.log('[OPS-V2] Starting session...');
  state.socket.emit('ops:startSession', { campaignId: state.campaignId });
  // GM joins bridge after starting session
  state.socket.emit('ops:joinBridge', {
    shipId: state.shipId,
    role: 'gm',
    isGM: true
  });
}

function joinBridge() {
  console.log('[OPS-V2] Joining bridge...');
  state.socket.emit('ops:joinBridge', {
    campaignId: state.campaignId,
    slotId: state.slotId,
    shipId: state.shipId,
    role: state.role
  });
}

function copyCode() {
  const code = state.campaignCode || document.getElementById('campaign-code-value')?.textContent;
  if (code && code !== '--------') {
    navigator.clipboard.writeText(code).then(() => {
      showToast('Code copied!');
    }).catch(() => {
      showError('Failed to copy code');
    });
  }
}

function logout() {
  state.socket.emit('ops:logout');
  state.mode = null;
  state.campaignId = null;
  state.campaignCode = null;
  state.slotId = null;
  state.role = null;
  state.adapter.showScreen('login-screen');
  backToLogin();
}

// ============================================
// UI HELPERS
// ============================================

function updateBridgeHeader(data) {
  if (data.shipName) state.adapter.setText('bridge-ship-name', data.shipName);
  if (data.location) state.adapter.setText('bridge-location', data.location);
  if (data.date) state.adapter.setText('bridge-date', data.date);
  if (data.role) state.adapter.setText('bridge-user-role', data.role);
  if (data.userName) state.adapter.setText('bridge-user-name', data.userName);

  // Update alert status
  const alertEl = document.getElementById('alert-status');
  if (alertEl && data.alertLevel) {
    alertEl.className = `alert-status alert-${data.alertLevel}`;
    const textEl = alertEl.querySelector('.alert-text');
    if (textEl) {
      textEl.textContent = data.alertLevel === 'red' ? 'Red Alert' :
                           data.alertLevel === 'yellow' ? 'Yellow Alert' : 'Normal';
    }
  }
}

function showError(message) {
  state.adapter.setText('error-message', message);
  state.adapter.setVisible('error-toast', true);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    state.adapter.setVisible('error-toast', false);
  }, 5000);
}

function showToast(message) {
  state.adapter.setText('error-message', message);
  state.adapter.setVisible('error-toast', true);

  setTimeout(() => {
    state.adapter.setVisible('error-toast', false);
  }, 2000);
}

// ============================================
// BOOTSTRAP
// ============================================

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { state, init, handleAction };
}

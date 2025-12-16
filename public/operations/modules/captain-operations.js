/**
 * AR-153 Phase 4: Captain Operations Module
 * Captain commands, orders, and crew management
 *
 * Note: Uses global showNotification from notifications.js
 */

/**
 * Check if user has captain permission
 * @param {Object} state - Application state
 * @returns {boolean} True if user can act as captain
 */
function hasCaptainPermission(state) {
  return state.selectedRole === 'captain' || state.isGM;
}

/**
 * Set alert status (Captain only)
 * @param {Object} state - Application state
 * @param {string} alertStatus - GREEN, YELLOW, or RED
 */
export function captainSetAlert(state, alertStatus) {
  if (!hasCaptainPermission(state)) {
    showNotification('Only Captain can change alert status', 'error');
    return;
  }
  // Map GREEN to NORMAL for backend compatibility
  const status = alertStatus === 'GREEN' ? 'NORMAL' : alertStatus;
  state.socket.emit('ops:setAlertStatus', { alertStatus: status });
  showNotification(`Alert status: ${alertStatus}`, alertStatus === 'RED' ? 'error' : alertStatus === 'YELLOW' ? 'warning' : 'success');
}

/**
 * Issue quick order (Captain only)
 * @param {Object} state - Application state
 * @param {string} order - Order text
 */
export function captainQuickOrder(state, order) {
  if (!hasCaptainPermission(state)) {
    showNotification('Only Captain can issue orders', 'error');
    return;
  }
  state.socket.emit('ops:issueOrder', { target: 'all', order, requiresAck: true });
  showNotification(`Order issued: ${order}`, 'info');
}

/**
 * Issue navigation order (Captain → Pilot)
 * @param {Object} state - Application state
 * @param {string} orderType - Navigation order type
 */
export function captainNavOrder(state, orderType) {
  if (!hasCaptainPermission(state)) {
    showNotification('Only Captain can issue orders', 'error');
    return;
  }
  state.socket.emit('ops:issueOrder', { target: 'pilot', order: orderType, orderType: 'navigation', requiresAck: true });
  showNotification(`Navigation: ${orderType}`, orderType === 'Emergency Stop' ? 'warning' : 'info');
}

/**
 * Issue contact-targeted order (Captain → Pilot/Gunner)
 * @param {Object} state - Application state
 * @param {string} action - Action to take on contact
 */
export function captainContactOrder(state, action) {
  if (!hasCaptainPermission(state)) {
    showNotification('Only Captain can issue orders', 'error');
    return;
  }
  const contactSelect = document.getElementById('order-contact-select');
  if (!contactSelect?.value) {
    showNotification('Select a contact first', 'warning');
    return;
  }
  const contactId = contactSelect.value;
  const contactName = contactSelect.options[contactSelect.selectedIndex]?.text || 'contact';
  const order = `${action.charAt(0).toUpperCase() + action.slice(1)} ${contactName}`;
  const target = action === 'intercept' || action === 'avoid' ? 'pilot' : 'all';
  state.socket.emit('ops:issueOrder', { target, order, contactId, orderType: action, requiresAck: true });
  showNotification(`Order: ${order}`, action === 'intercept' ? 'warning' : 'info');
}

/**
 * Issue custom order (Captain only)
 * @param {Object} state - Application state
 */
export function captainIssueOrder(state) {
  if (!hasCaptainPermission(state)) {
    showNotification('Only Captain can issue orders', 'error');
    return;
  }
  const targetSelect = document.getElementById('order-target-select');
  const orderInput = document.getElementById('order-text-input');
  if (!orderInput || !orderInput.value.trim()) {
    showNotification('Enter an order', 'warning');
    return;
  }
  const target = targetSelect?.value || 'all';
  const order = orderInput.value.trim();
  state.socket.emit('ops:issueOrder', { target, order, requiresAck: true });
  orderInput.value = '';
  showNotification(`Order sent to ${target}: ${order}`, 'info');
}

/**
 * Mark contact (Captain only)
 * @param {Object} state - Application state
 * @param {string} marking - Contact marking (friendly, hostile, neutral, unknown)
 */
export function captainMarkContact(state, marking) {
  if (!hasCaptainPermission(state)) {
    showNotification('Only Captain can mark contacts', 'error');
    return;
  }
  const contactSelect = document.getElementById('mark-contact-select');
  if (!contactSelect) {
    showNotification('No contact selected', 'error');
    return;
  }
  const contactId = contactSelect.value;
  state.socket.emit('ops:markContact', { contactId, marking });
  showNotification(`Contact marked as ${marking}`, marking === 'hostile' ? 'warning' : 'info');
}

/**
 * Set weapons authorization (Captain only)
 * @param {Object} state - Application state
 * @param {string} mode - free or hold
 */
export function captainWeaponsAuth(state, mode) {
  if (state.selectedRole !== 'captain' && state.selectedRole !== 'gunner' && !state.isGM) {
    showNotification('Only Captain or Gunner can authorize weapons', 'error');
    return;
  }
  state.socket.emit('ops:setWeaponsAuth', { mode, targets: ['all'] });
  showNotification(`Weapons ${mode === 'free' ? 'FREE' : 'HOLD'}`, mode === 'free' ? 'warning' : 'info');
}

/**
 * Request status from crew (Captain only)
 * @param {Object} state - Application state
 */
export function captainRequestStatus(state) {
  if (!hasCaptainPermission(state)) {
    showNotification('Only Captain can request status', 'error');
    return;
  }
  state.socket.emit('ops:requestStatus', { target: 'all' });
  showNotification('Status report requested', 'info');
}

/**
 * Leadership check (Captain only)
 * @param {Object} state - Application state
 */
export function captainLeadershipCheck(state) {
  if (!hasCaptainPermission(state)) {
    showNotification('Only Captain can make leadership checks', 'error');
    return;
  }
  // TODO: Get actual skill from character
  const skill = 0;
  state.socket.emit('ops:leadershipCheck', { skill, target: 'all' });
}

/**
 * Tactics check (Captain only)
 * @param {Object} state - Application state
 */
export function captainTacticsCheck(state) {
  if (!hasCaptainPermission(state)) {
    showNotification('Only Captain can make tactics checks', 'error');
    return;
  }
  // TODO: Get actual skill from character
  const skill = 0;
  state.socket.emit('ops:tacticsCheck', { skill });
}

/**
 * Acknowledge an order (any crew)
 * @param {Object} state - Application state
 * @param {string} orderId - Order ID to acknowledge
 */
export function acknowledgeOrder(state, orderId) {
  state.socket.emit('ops:acknowledgeOrder', { orderId });
  showNotification('Order acknowledged', 'success');
}

/**
 * Captain Solo Mode - execute commands directly
 * Routes to existing role handlers with captain override
 * @param {Object} state - Application state
 * @param {Function} showPlacesOverlayFn - Function to show places overlay
 * @param {string} command - Command to execute
 */
export function captainSoloCommand(state, showPlacesOverlayFn, command) {
  switch (command) {
    case 'plotJump':
      // Open jump plot modal or show destinations
      showNotification('Select a jump destination from the Astrogator panel', 'info');
      // Could open a modal here - for MVP, direct to astrogator panel
      break;

    case 'verifyPosition':
      state.socket.emit('ops:verifyPosition');
      showNotification('Verifying position...', 'info');
      break;

    case 'setCourse':
      // Show destinations panel
      showPlacesOverlayFn();
      showNotification('Select destination from Places panel', 'info');
      break;

    case 'refuel':
      // Trigger refuel dialog
      state.socket.emit('ops:getAvailableFuelSources');
      showNotification('Checking available fuel sources...', 'info');
      break;

    case 'refineFuel':
      state.socket.emit('ops:startFuelProcessing', { tons: 'all' });
      showNotification('Starting fuel processing...', 'info');
      break;

    default:
      showNotification(`Unknown command: ${command}`, 'warning');
  }

  // Log the captain's action
  state.socket.emit('ops:addLogEntry', {
    entryType: 'command',
    message: `Captain orders: ${command}`,
    actor: 'Captain'
  });
}

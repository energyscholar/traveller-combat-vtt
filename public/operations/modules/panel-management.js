/**
 * AR-153 Phase 2C: Panel Management Module
 * Role panel expansion and collapse functionality
 */

/**
 * Expand role panel to half-screen, full-screen, or pilot-map mode
 * @param {Object} state - Application state
 * @param {Function} showEmbeddedMap - Function to show embedded system map
 * @param {string} mode - 'half', 'full', or 'pilot-map'
 */
export function expandRolePanel(state, showEmbeddedMap, mode) {
  const rolePanel = document.getElementById('role-panel');
  const bridgeMain = document.querySelector('.bridge-main');

  // Collapse any existing expansion first
  collapseRolePanel(state);

  if (mode === 'half') {
    bridgeMain.classList.add('role-expanded-half');
    // Also show detail view in half-screen mode
    const detail = document.getElementById('role-detail-view');
    detail?.classList.remove('hidden');
  } else if (mode === 'full') {
    rolePanel.classList.add('expanded-full');
    // Also show detail view in full-screen mode
    const detail = document.getElementById('role-detail-view');
    detail?.classList.remove('hidden');
  } else if (mode === 'pilot-map') {
    // AR-94: Pilot default view - panel 1/3, system map 2/3
    bridgeMain.classList.add('pilot-map-layout');
    const detail = document.getElementById('role-detail-view');
    detail?.classList.remove('hidden');
    // Show embedded system map
    showEmbeddedMap();
  }

  // Remember expansion state for this role
  if (state.selectedRole) {
    state.selectedRolePanelExpanded = state.selectedRolePanelExpanded || {};
    state.selectedRolePanelExpanded[state.selectedRole] = mode;
  }
}

/**
 * Collapse role panel back to normal size
 * @param {Object} state - Application state
 * @param {Function} hideEmbeddedMap - Function to hide embedded system map (optional)
 */
export function collapseRolePanel(state, hideEmbeddedMap) {
  const rolePanel = document.getElementById('role-panel');
  const bridgeMain = document.querySelector('.bridge-main');

  rolePanel.classList.remove('expanded-full');
  bridgeMain.classList.remove('role-expanded-half');
  bridgeMain.classList.remove('pilot-map-layout');  // AR-94
  if (hideEmbeddedMap) hideEmbeddedMap();  // AR-94

  // Clear remembered expansion state
  if (state.selectedRole && state.selectedRolePanelExpanded) {
    state.selectedRolePanelExpanded[state.selectedRole] = null;
  }
}

/**
 * Toggle generic panel expansion
 * @param {Object} state - Application state
 * @param {Function} expandRolePanelFn - Bound expandRolePanel function
 * @param {Function} collapseRolePanelFn - Bound collapseRolePanel function
 * @param {string} panelId - Panel element ID
 */
export function togglePanelExpand(state, expandRolePanelFn, collapseRolePanelFn, panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;

  // Role panel uses its own expand system
  if (panelId === 'role-panel') {
    if (panel.classList.contains('expanded-full')) {
      collapseRolePanelFn();
    } else {
      expandRolePanelFn('full');
    }
    return;
  }

  // Generic panel expansion
  if (panel.classList.contains('panel-expanded')) {
    collapseExpandedPanel(state);
  } else {
    expandPanel(state, panelId);
  }
}

/**
 * Expand a panel to overlay the main content
 * @param {Object} state - Application state
 * @param {string} panelId - Panel element ID
 */
export function expandPanel(state, panelId) {
  // First collapse any existing expanded panel
  collapseExpandedPanel(state);

  const panel = document.getElementById(panelId);
  if (!panel) return;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'panel-expand-overlay';
  overlay.id = 'panel-expand-overlay';
  overlay.onclick = () => collapseExpandedPanel(state);
  document.body.appendChild(overlay);

  // Expand panel
  panel.classList.add('panel-expanded');
  state.expandedPanelId = panelId;
}

/**
 * Collapse any expanded panel
 * @param {Object} state - Application state
 */
export function collapseExpandedPanel(state) {
  const overlay = document.getElementById('panel-expand-overlay');
  if (overlay) overlay.remove();

  if (state.expandedPanelId) {
    const panel = document.getElementById(state.expandedPanelId);
    if (panel) panel.classList.remove('panel-expanded');
    state.expandedPanelId = null;
  }
}

/**
 * Update body class for role-specific styling
 * @param {Object} state - Application state
 */
export function updateRoleClass(state) {
  const body = document.body;
  // Remove any existing role classes
  body.className = body.className.replace(/\brole-\w+\b/g, '').trim();
  // Add current role class
  if (state.selectedRole) {
    body.classList.add(`role-${state.selectedRole.replace('_', '-')}`);
  }
}

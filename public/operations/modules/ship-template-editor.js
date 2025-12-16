/**
 * AR-153 Phase 6: Ship Template Editor Module
 * Complex ship configuration form with validation
 *
 * Note: Uses globals showNotification, showModal from app.js
 */

// Module-level editor state (encapsulated within module)
const shipEditor = {
  shipId: null,
  templateId: null,
  editData: null,
  weapons: [],
  systems: []
};

/**
 * Get current editor state (for testing/debugging)
 * @returns {Object} Current editor state
 */
export function getEditorState() {
  return shipEditor;
}

/**
 * Set editor state from external source (for socket handlers)
 * @param {Object} data - Editor state updates
 */
export function setEditorData(data) {
  if (data.editData !== undefined) shipEditor.editData = data.editData;
  if (data.weapons !== undefined) shipEditor.weapons = data.weapons;
  if (data.systems !== undefined) shipEditor.systems = data.systems;
  if (data.templateId !== undefined) shipEditor.templateId = data.templateId;
}

/**
 * Open ship editor for existing ship or new custom ship
 * @param {Object} state - Application state
 * @param {Function} showModalFn - Function to show modal
 * @param {string|null} shipId - Existing ship ID or null for new
 */
export function openShipEditor(state, showModalFn, shipId = null) {
  shipEditor.shipId = shipId;
  shipEditor.editData = null;
  shipEditor.weapons = [];
  shipEditor.systems = [];

  // Load templates if not already loaded
  state.socket.emit('ops:getShipTemplates');

  // If editing existing ship, load its data
  if (shipId) {
    const ship = state.ships.find(s => s.id === shipId);
    if (ship) {
      shipEditor.editData = JSON.parse(JSON.stringify(ship.ship_data || {}));
      shipEditor.templateId = ship.template_id;
      shipEditor.weapons = shipEditor.editData.weapons || [];
      shipEditor.systems = shipEditor.editData.systems || [];
    }
  }

  showModalFn('template-edit-ship');
}

/**
 * Populate ship editor with data
 * @param {Object} state - Application state
 */
export function populateShipEditor(state) {
  const select = document.getElementById('edit-ship-template');
  if (!select) return;

  // Populate template dropdown
  if (!state.shipTemplates || state.shipTemplates.length === 0) {
    select.innerHTML = '<option value="">No templates available</option>';
  } else {
    // Group by tonnage
    const byTonnage = {};
    state.shipTemplates.forEach(t => {
      const key = t.tonnage;
      if (!byTonnage[key]) byTonnage[key] = [];
      byTonnage[key].push(t);
    });

    select.innerHTML = '<option value="">-- Select Base Template --</option>' +
      Object.keys(byTonnage)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(tonnage => {
          const ships = byTonnage[tonnage];
          return ships.map(t =>
            `<option value="${t.id}" ${shipEditor.templateId === t.id ? 'selected' : ''}>
              ${t.name} (${t.tonnage}t, J-${t.jump || 0})
            </option>`
          ).join('');
        }).join('');
  }

  // If editing existing ship, populate name
  if (shipEditor.shipId) {
    const ship = state.ships.find(s => s.id === shipEditor.shipId);
    if (ship) {
      document.getElementById('edit-ship-name').value = ship.name;
    }
  }

  // If we have editData, populate all fields
  if (shipEditor.editData) {
    populateEditorFields(shipEditor.editData);
  }
}

/**
 * Populate all editor fields from ship data
 * @param {Object} data - Ship data object
 */
export function populateEditorFields(data) {
  // Hull tab
  document.getElementById('edit-hull-tonnage').value = data.tonnage || data.hull?.tonnage || 100;
  document.getElementById('edit-hull-config').value = data.hull?.configuration || 'standard';
  document.getElementById('edit-hull-points').value = data.hull?.hullPoints || data.hullPoints || 40;
  document.getElementById('edit-armor-rating').value = data.armour?.rating || data.armourRating || 0;
  document.getElementById('edit-armor-type').value = data.armour?.type || 'none';

  // Drives tab
  document.getElementById('edit-mdrive-thrust').value = data.drives?.manoeuvre?.thrust || data.thrust || 1;
  document.getElementById('edit-jdrive-rating').value = data.drives?.jump?.rating || data.jump || 0;
  document.getElementById('edit-power-output').value = data.power?.output || 50;
  document.getElementById('edit-fuel-capacity').value = data.fuel?.total || 20;
  document.getElementById('edit-computer').value = data.computer?.processing || 1;
  document.getElementById('edit-sensors').value = data.sensors?.grade || 'civilian';

  // Cargo tab
  document.getElementById('edit-cargo-tonnage').value = data.cargo?.tonnage || 0;
  document.getElementById('edit-staterooms').value = data.staterooms?.standard?.count || 0;
  document.getElementById('edit-low-berths').value = data.staterooms?.lowBerths?.count || 0;
  document.getElementById('edit-common-areas').value = data.commonAreas?.tonnage || 0;

  // Weapons and systems
  shipEditor.weapons = data.weapons || [];
  shipEditor.systems = data.systems || [];
  renderWeaponsList();
  renderSystemsList();

  // Update validation
  updateValidationSummary();
}

/**
 * Load full template data when selection changes
 * @param {Object} state - Application state
 * @param {string} templateId - Template ID
 */
export function loadTemplateForEditor(state, templateId) {
  if (!templateId) {
    shipEditor.templateId = null;
    shipEditor.editData = null;
    document.getElementById('edit-template-preview').innerHTML = '';
    return;
  }

  shipEditor.templateId = templateId;
  state.socket.emit('ops:getFullTemplate', { templateId });
}

/**
 * Render weapons list in editor
 */
export function renderWeaponsList() {
  const container = document.getElementById('edit-weapons-list');
  if (!container) return;

  const weaponNames = {
    pulse_laser: 'Pulse Laser',
    beam_laser: 'Beam Laser',
    sandcaster: 'Sandcaster',
    missile_rack: 'Missile Rack',
    particle_beam: 'Particle Beam'
  };

  const mountNames = {
    turret_single: 'Single Turret',
    turret_double: 'Double Turret',
    turret_triple: 'Triple Turret',
    barbette: 'Barbette',
    bay: 'Bay'
  };

  if (shipEditor.weapons.length === 0) {
    container.innerHTML = '<p class="placeholder">No weapons installed</p>';
    return;
  }

  container.innerHTML = shipEditor.weapons.map((w, idx) => `
    <div class="weapon-item">
      <div class="weapon-info">
        <span class="weapon-name">${weaponNames[w.type] || w.type || w.name || 'Unknown'}</span>
        <span class="weapon-mount">${mountNames[w.mount] || w.mount || ''}</span>
      </div>
      <button class="btn-remove" data-remove-weapon="${idx}">Remove</button>
    </div>
  `).join('');

  // Add remove handlers
  container.querySelectorAll('[data-remove-weapon]').forEach(btn => {
    btn.addEventListener('click', () => {
      shipEditor.weapons.splice(parseInt(btn.dataset.removeWeapon), 1);
      renderWeaponsList();
      updateValidationSummary();
    });
  });
}

/**
 * Render systems list in editor
 */
export function renderSystemsList() {
  const container = document.getElementById('edit-systems-list');
  if (!container) return;

  const systemNames = {
    fuel_processor: 'Fuel Processor',
    fuel_scoops: 'Fuel Scoops',
    cargo_crane: 'Cargo Crane',
    repair_drones: 'Repair Drones',
    probe_drones: 'Probe Drones',
    medical_bay: 'Medical Bay',
    workshop: 'Workshop'
  };

  if (shipEditor.systems.length === 0) {
    container.innerHTML = '<p class="placeholder">No additional systems</p>';
    return;
  }

  container.innerHTML = shipEditor.systems.map((s, idx) => `
    <div class="system-item">
      <div class="system-info">
        <span class="system-name">${systemNames[s.type] || s.type || 'Unknown'}</span>
        <span class="system-detail">${s.tonnage ? s.tonnage + 't' : ''}</span>
      </div>
      <button class="btn-remove" data-remove-system="${idx}">Remove</button>
    </div>
  `).join('');

  // Add remove handlers
  container.querySelectorAll('[data-remove-system]').forEach(btn => {
    btn.addEventListener('click', () => {
      shipEditor.systems.splice(parseInt(btn.dataset.removeSystem), 1);
      renderSystemsList();
      updateValidationSummary();
    });
  });
}

/**
 * Add weapon from selectors
 */
export function addWeaponToEditor() {
  const type = document.getElementById('edit-weapon-type').value;
  const mount = document.getElementById('edit-weapon-mount').value;

  shipEditor.weapons.push({ type, mount });
  renderWeaponsList();
  updateValidationSummary();
}

/**
 * Add system from selector
 */
export function addSystemToEditor() {
  const type = document.getElementById('edit-system-type').value;

  // Default tonnage by system type
  const tonnages = {
    fuel_processor: 1,
    fuel_scoops: 0,
    cargo_crane: 3,
    repair_drones: 1,
    probe_drones: 1,
    medical_bay: 4,
    workshop: 6
  };

  shipEditor.systems.push({ type, tonnage: tonnages[type] || 1 });
  renderSystemsList();
  updateValidationSummary();
}

/**
 * Update validation summary panel
 * @returns {boolean} True if validation passes
 */
export function updateValidationSummary() {
  const container = document.getElementById('edit-validation-summary');
  if (!container) return true;

  const tonnage = parseInt(document.getElementById('edit-hull-tonnage')?.value) || 100;

  // Calculate used tonnage
  let usedTonnage = 0;

  // Hull components (rough estimates)
  const mdrive = parseInt(document.getElementById('edit-mdrive-thrust')?.value) || 0;
  const jdrive = parseInt(document.getElementById('edit-jdrive-rating')?.value) || 0;
  const fuel = parseInt(document.getElementById('edit-fuel-capacity')?.value) || 0;
  const cargo = parseInt(document.getElementById('edit-cargo-tonnage')?.value) || 0;
  const staterooms = parseInt(document.getElementById('edit-staterooms')?.value) || 0;
  const lowBerths = parseInt(document.getElementById('edit-low-berths')?.value) || 0;
  const common = parseInt(document.getElementById('edit-common-areas')?.value) || 0;

  // Drive tonnage estimates (% of hull per G/J)
  usedTonnage += (tonnage * mdrive * 0.01); // M-drive
  usedTonnage += (tonnage * jdrive * 0.05); // J-drive
  usedTonnage += fuel; // Fuel
  usedTonnage += 10; // Bridge (fixed)
  usedTonnage += cargo;
  usedTonnage += staterooms * 4; // 4t per stateroom
  usedTonnage += lowBerths * 0.5; // 0.5t per low berth
  usedTonnage += common;

  // Systems tonnage
  shipEditor.systems.forEach(s => {
    usedTonnage += s.tonnage || 0;
  });

  // Weapons tonnage (1t per turret, rough)
  shipEditor.weapons.forEach(() => {
    usedTonnage += 1;
  });

  const tonnagePercent = Math.min((usedTonnage / tonnage) * 100, 100);
  const tonnageClass = tonnagePercent > 100 ? 'error' : tonnagePercent > 90 ? 'warning' : '';

  // Power calculation
  const powerOutput = parseInt(document.getElementById('edit-power-output')?.value) || 50;
  const powerUsed = 20 + (mdrive * 10) + (jdrive * 10) + (shipEditor.weapons.length * 5);
  const powerPercent = Math.min((powerUsed / powerOutput) * 100, 100);
  const powerClass = powerUsed > powerOutput ? 'error' : powerUsed > powerOutput * 0.9 ? 'warning' : '';

  const errors = [];
  if (usedTonnage > tonnage) {
    errors.push(`Tonnage exceeded: ${Math.round(usedTonnage)}t used of ${tonnage}t available`);
  }
  if (powerUsed > powerOutput) {
    errors.push(`Power exceeded: ${powerUsed} used of ${powerOutput} available`);
  }

  container.innerHTML = `
    <div class="tonnage-bar">
      <span class="tonnage-text">Tonnage: ${Math.round(usedTonnage)}/${tonnage}t</span>
      <div class="bar">
        <div class="bar-fill ${tonnageClass}" style="width: ${tonnagePercent}%"></div>
      </div>
    </div>
    <div class="power-bar">
      <span class="power-text">Power: ${powerUsed}/${powerOutput}</span>
      <div class="bar">
        <div class="bar-fill ${powerClass}" style="width: ${powerPercent}%"></div>
      </div>
    </div>
    ${errors.length > 0 ? `
      <div class="validation-errors">
        ${errors.map(e => `<div class="validation-error">${e}</div>`).join('')}
      </div>
    ` : ''}
  `;

  return errors.length === 0;
}

/**
 * Collect editor data into ship object
 * @returns {Object} Ship data object
 */
export function collectEditorData() {
  return {
    tonnage: parseInt(document.getElementById('edit-hull-tonnage').value) || 100,
    thrust: parseInt(document.getElementById('edit-mdrive-thrust').value) || 1,
    jump: parseInt(document.getElementById('edit-jdrive-rating').value) || 0,
    hull: {
      tonnage: parseInt(document.getElementById('edit-hull-tonnage').value) || 100,
      configuration: document.getElementById('edit-hull-config').value || 'standard',
      hullPoints: parseInt(document.getElementById('edit-hull-points').value) || 40
    },
    armour: {
      type: document.getElementById('edit-armor-type').value || 'none',
      rating: parseInt(document.getElementById('edit-armor-rating').value) || 0
    },
    drives: {
      manoeuvre: {
        thrust: parseInt(document.getElementById('edit-mdrive-thrust').value) || 1
      },
      jump: {
        rating: parseInt(document.getElementById('edit-jdrive-rating').value) || 0
      }
    },
    power: {
      output: parseInt(document.getElementById('edit-power-output').value) || 50
    },
    fuel: {
      total: parseInt(document.getElementById('edit-fuel-capacity').value) || 20
    },
    computer: {
      processing: parseInt(document.getElementById('edit-computer').value) || 1
    },
    sensors: {
      grade: document.getElementById('edit-sensors').value || 'civilian'
    },
    weapons: shipEditor.weapons,
    systems: shipEditor.systems,
    cargo: {
      tonnage: parseInt(document.getElementById('edit-cargo-tonnage').value) || 0
    },
    staterooms: {
      standard: { count: parseInt(document.getElementById('edit-staterooms').value) || 0 },
      lowBerths: { count: parseInt(document.getElementById('edit-low-berths').value) || 0 }
    },
    commonAreas: {
      tonnage: parseInt(document.getElementById('edit-common-areas').value) || 0
    }
  };
}

/**
 * Save edited ship
 * @param {Object} state - Application state
 */
export function saveEditedShip(state) {
  const name = document.getElementById('edit-ship-name').value.trim();
  if (!name) {
    showNotification('Please enter a ship name', 'error');
    return;
  }

  if (!updateValidationSummary()) {
    if (!confirm('Ship configuration has validation errors. Save anyway?')) {
      return;
    }
  }

  const shipData = collectEditorData();

  if (shipEditor.shipId) {
    // Update existing ship
    state.socket.emit('ops:updateShip', {
      shipId: shipEditor.shipId,
      name,
      shipData
    });
  } else {
    // Create new custom ship
    state.socket.emit('ops:addCustomShip', {
      name,
      templateId: shipEditor.templateId,
      shipData,
      isPartyShip: true
    });
  }
}

/**
 * Switch editor tab
 * @param {string} tabId - Tab ID
 */
export function switchEditorTab(tabId) {
  // Update tab buttons
  document.querySelectorAll('.editor-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update panels
  document.querySelectorAll('.editor-panel').forEach(panel => {
    panel.classList.toggle('hidden', !panel.id.endsWith(tabId));
  });
}

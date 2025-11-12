// ======== SHIP CUSTOMIZER - STAGE 12.3 ========
// SVG-based ship customization interface

// Ship template data (loaded from JSON files)
let shipTemplates = {};
let currentTemplate = 'scout';
let currentModifications = {};
let selectedComponent = null;

// ======== INITIALIZATION ========

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[CUSTOMIZER] Initializing ship customizer...');

  // Load ship templates
  await loadShipTemplates();

  // Set up event listeners
  setupEventListeners();

  // Load initial ship (Scout)
  loadShipTemplate('scout');

  console.log('[CUSTOMIZER] Initialization complete');
});

// ======== SHIP TEMPLATE LOADING ========

async function loadShipTemplates() {
  try {
    const response = await fetch('/data/ships/index.json');
    const index = await response.json();

    for (const shipId of index.ships) {
      const shipResponse = await fetch(`/data/ships/${shipId}.json`);
      const shipData = await shipResponse.json();
      shipTemplates[shipId] = shipData;
    }

    console.log('[CUSTOMIZER] Loaded ship templates:', Object.keys(shipTemplates));
  } catch (error) {
    console.error('[CUSTOMIZER] Failed to load ship templates:', error);
  }
}

function loadShipTemplate(templateId) {
  const template = shipTemplates[templateId];
  if (!template) {
    console.error('[CUSTOMIZER] Template not found:', templateId);
    return;
  }

  currentTemplate = templateId;
  currentModifications = {}; // Reset modifications
  selectedComponent = null;

  // Update UI
  updateSchematicTitle(template);
  renderShipSVG(template);
  updateCostDisplay(template);
  clearComponentPanel();

  console.log('[CUSTOMIZER] Loaded template:', templateId);
}

// ======== SVG GENERATION ========

function renderShipSVG(template) {
  const container = document.getElementById('ship-schematic-display');
  const svg = generateShipSVG(template);
  container.innerHTML = svg;

  // Add click listeners to clickable components
  const clickableComponents = container.querySelectorAll('.clickable-component');
  clickableComponents.forEach(component => {
    component.addEventListener('click', (e) => {
      e.stopPropagation();
      const componentType = component.getAttribute('data-component');
      const componentId = component.getAttribute('data-component-id');
      handleComponentClick(componentType, componentId, component);
    });
  });

  console.log('[CUSTOMIZER] SVG rendered for:', template.id);
}

function generateShipSVG(template) {
  const shipId = template.id;

  // SVG generators for each ship type
  const svgGenerators = {
    scout: generateScoutSVG,
    free_trader: generateFreeTraderSVG,
    far_trader: generateFarTraderSVG,
    patrol_corvette: generatePatrolCorvetteSVG,
    mercenary_cruiser: generateMercenaryCruiserSVG,
    subsidised_liner: generateSubsidisedLinerSVG,
    safari_ship: generateSafariShipSVG,
    seeker: generateSeekerSVG,
    laboratory_ship: generateLaboratoryShipSVG
  };

  const generator = svgGenerators[shipId];
  if (!generator) {
    console.warn('[CUSTOMIZER] No SVG generator for:', shipId);
    return generateGenericSVG(template);
  }

  return generator(template);
}

// ======== SVG TEMPLATES FOR EACH SHIP ========

function generateScoutSVG(template) {
  const turretCount = template.turrets ? template.turrets.length : 1;

  return `
    <svg class="ship-svg" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg">
      <!-- Ship hull outline -->
      <polygon points="150,20 250,100 250,300 150,380 50,300 50,100"
               fill="#1a1a2e" stroke="#16213e" stroke-width="2"/>

      <!-- Turret 1 (front) -->
      <circle id="turret1" cx="150" cy="80" r="25"
              fill="${turretCount >= 1 ? '#0f3460' : '#2a2a2a'}"
              stroke="${turretCount >= 1 ? '#667eea' : '#444'}" stroke-width="2"
              class="clickable-component" data-component="turret" data-component-id="turret1"/>
      <text x="150" y="82" class="component-label">Turret 1</text>
      <text x="150" y="95" class="component-sublabel">${getTurretLabel(template, 0)}</text>

      <!-- Cargo Bay (middle-left) -->
      <rect id="cargo" x="70" y="180" width="70" height="60"
            fill="#533483" stroke="#f5576c" stroke-width="2"
            class="clickable-component" data-component="cargo" data-component-id="cargo"/>
      <text x="105" y="210" class="component-label">Cargo</text>
      <text x="105" y="223" class="component-sublabel">${template.cargo || 20}t</text>

      <!-- Fuel (middle-right) -->
      <rect id="fuel" x="160" y="180" width="70" height="60"
            fill="#533483" stroke="#f5576c" stroke-width="2"
            class="clickable-component" data-component="fuel" data-component-id="fuel"/>
      <text x="195" y="210" class="component-label">Fuel</text>
      <text x="195" y="223" class="component-sublabel">${template.fuel || 20}t</text>

      <!-- M-Drive (rear-left) -->
      <rect id="m-drive" x="85" y="310" width="55" height="40"
            fill="#e94560" stroke="#667eea" stroke-width="2"
            class="clickable-component" data-component="m-drive" data-component-id="m-drive"/>
      <text x="112" y="330" class="component-label">M-Drive</text>
      <text x="112" y="343" class="component-sublabel">Thrust ${template.thrust || 2}</text>

      <!-- J-Drive (rear-right) -->
      <rect id="j-drive" x="160" y="310" width="55" height="40"
            fill="#e94560" stroke="#667eea" stroke-width="2"
            class="clickable-component" data-component="j-drive" data-component-id="j-drive"/>
      <text x="187" y="330" class="component-label">J-Drive</text>
      <text x="187" y="343" class="component-sublabel">Jump ${template.jump || 2}</text>
    </svg>
  `;
}

function generateFreeTraderSVG(template) {
  const turretCount = template.turrets ? template.turrets.length : 2;

  return `
    <svg class="ship-svg" viewBox="0 0 350 450" xmlns="http://www.w3.org/2000/svg">
      <!-- Ship hull (rectangular merchant) -->
      <rect x="75" y="30" width="200" height="390"
            fill="#1a1a2e" stroke="#16213e" stroke-width="2" rx="10"/>

      <!-- Turret 1 (front-left) -->
      <circle cx="130" cy="70" r="22"
              fill="${turretCount >= 1 ? '#0f3460' : '#2a2a2a'}"
              stroke="${turretCount >= 1 ? '#667eea' : '#444'}" stroke-width="2"
              class="clickable-component" data-component="turret" data-component-id="turret1"/>
      <text x="130" y="73" class="component-label">T1</text>
      <text x="130" y="85" class="component-sublabel">${getTurretLabel(template, 0)}</text>

      <!-- Turret 2 (front-right) -->
      <circle cx="220" cy="70" r="22"
              fill="${turretCount >= 2 ? '#0f3460' : '#2a2a2a'}"
              stroke="${turretCount >= 2 ? '#667eea' : '#444'}" stroke-width="2"
              class="clickable-component" data-component="turret" data-component-id="turret2"/>
      <text x="220" y="73" class="component-label">T2</text>
      <text x="220" y="85" class="component-sublabel">${getTurretLabel(template, 1)}</text>

      <!-- Cargo Bay -->
      <rect x="95" y="150" width="80" height="140"
            fill="#533483" stroke="#f5576c" stroke-width="2"
            class="clickable-component" data-component="cargo" data-component-id="cargo"/>
      <text x="135" y="220" class="component-label">Cargo</text>
      <text x="135" y="233" class="component-sublabel">${template.cargo || 82}t</text>

      <!-- Fuel -->
      <rect x="185" y="150" width="80" height="140"
            fill="#533483" stroke="#f5576c" stroke-width="2"
            class="clickable-component" data-component="fuel" data-component-id="fuel"/>
      <text x="225" y="220" class="component-label">Fuel</text>
      <text x="225" y="233" class="component-sublabel">${template.fuel || 40}t</text>

      <!-- M-Drive -->
      <rect x="95" y="350" width="70" height="50"
            fill="#e94560" stroke="#667eea" stroke-width="2"
            class="clickable-component" data-component="m-drive" data-component-id="m-drive"/>
      <text x="130" y="375" class="component-label">M-Drive</text>
      <text x="130" y="388" class="component-sublabel">Thrust ${template.thrust || 1}</text>

      <!-- J-Drive -->
      <rect x="185" y="350" width="70" height="50"
            fill="#e94560" stroke="#667eea" stroke-width="2"
            class="clickable-component" data-component="j-drive" data-component-id="j-drive"/>
      <text x="220" y="375" class="component-label">J-Drive</text>
      <text x="220" y="388" class="component-sublabel">Jump ${template.jump || 1}</text>
    </svg>
  `;
}

// Generic SVG for ships without custom templates
function generateGenericSVG(template) {
  const turretCount = template.turrets ? template.turrets.length : 0;
  const tonnage = template.tonnage || 100;

  // Scale ship based on tonnage
  const width = Math.min(250, 150 + (tonnage / 10));
  const height = Math.min(450, 300 + (tonnage / 5));

  return `
    <svg class="ship-svg" viewBox="0 0 ${width + 100} ${height + 50}" xmlns="http://www.w3.org/2000/svg">
      <!-- Ship hull -->
      <rect x="50" y="30" width="${width}" height="${height}"
            fill="#1a1a2e" stroke="#16213e" stroke-width="2" rx="10"/>

      <!-- Turrets (max 4 displayed) -->
      ${Array.from({ length: Math.min(turretCount, 4) }, (_, i) => {
        const x = 50 + width / 5 + (i * width / 5);
        return `
          <circle cx="${x}" cy="70" r="20"
                  fill="#0f3460" stroke="#667eea" stroke-width="2"
                  class="clickable-component" data-component="turret" data-component-id="turret${i + 1}"/>
          <text x="${x}" y="73" class="component-label">T${i + 1}</text>
        `;
      }).join('')}

      <!-- Cargo & Fuel -->
      <rect x="${50 + width / 4}" y="${height / 2}" width="${width / 3}" height="${height / 3}"
            fill="#533483" stroke="#f5576c" stroke-width="2"
            class="clickable-component" data-component="cargo" data-component-id="cargo"/>
      <text x="${50 + width / 2}" y="${height / 2 + height / 6}" class="component-label">Cargo</text>

      <!-- M-Drive -->
      <rect x="${50 + width / 4}" y="${height - 70}" width="${width / 3}" height="50"
            fill="#e94560" stroke="#667eea" stroke-width="2"
            class="clickable-component" data-component="m-drive" data-component-id="m-drive"/>
      <text x="${50 + width / 2}" y="${height - 40}" class="component-label">M-Drive</text>

      <text x="${50 + width / 2}" y="${height + 30}" class="component-label" style="font-size: 14px; fill: #aaa;">
        ${template.name} (${tonnage}t)
      </text>
    </svg>
  `;
}

// Simplified generators for other ships (using generic for now)
function generateFarTraderSVG(template) { return generateGenericSVG(template); }
function generatePatrolCorvetteSVG(template) { return generateGenericSVG(template); }
function generateMercenaryCruiserSVG(template) { return generateGenericSVG(template); }
function generateSubsidisedLinerSVG(template) { return generateGenericSVG(template); }
function generateSafariShipSVG(template) { return generateGenericSVG(template); }
function generateSeekerSVG(template) { return generateGenericSVG(template); }
function generateLaboratoryShipSVG(template) { return generateGenericSVG(template); }

// ======== HELPER FUNCTIONS ========

function getTurretLabel(template, index) {
  if (!template.turrets || !template.turrets[index]) {
    return 'Empty';
  }

  const turret = template.turrets[index];
  const typeLabel = turret.type.charAt(0).toUpperCase() + turret.type.slice(1);
  const weaponCount = turret.weapons ? turret.weapons.length : 0;

  return `${typeLabel} (${weaponCount})`;
}

function updateSchematicTitle(template) {
  const title = document.getElementById('ship-schematic-title');
  title.textContent = `${template.name} (${template.tonnage}t ${template.role})`;
}

function updateCostDisplay(template) {
  const baseCost = template.cost ? (template.cost / 1000000) : 0;
  const modCost = calculateModificationCost();
  const totalCost = baseCost + modCost;

  document.getElementById('base-cost').textContent = `MCr ${baseCost.toFixed(2)}`;
  document.getElementById('mod-cost').textContent = `+ MCr ${modCost.toFixed(2)}`;
  document.getElementById('total-cost').textContent = `MCr ${totalCost.toFixed(2)}`;
}

function calculateModificationCost() {
  // TODO: Implement in Sub-stage 12.4
  return 0.00;
}

// ======== COMPONENT INTERACTION ========

function handleComponentClick(componentType, componentId, element) {
  console.log('[CUSTOMIZER] Component clicked:', componentType, componentId);

  // Remove previous selection
  document.querySelectorAll('.clickable-component').forEach(el => {
    el.classList.remove('selected');
  });

  // Add selection to clicked component
  element.classList.add('selected');
  selectedComponent = { type: componentType, id: componentId };

  // Show component panel
  showComponentPanel(componentType, componentId);
}

function showComponentPanel(componentType, componentId) {
  const panel = document.getElementById('component-panel-content');
  const template = shipTemplates[currentTemplate];

  let panelHTML = '';

  switch (componentType) {
    case 'turret':
      panelHTML = generateTurretPanel(componentId, template);
      break;
    case 'cargo':
      panelHTML = generateCargoPanel(template);
      break;
    case 'fuel':
      panelHTML = generateFuelPanel(template);
      break;
    case 'm-drive':
      panelHTML = generateMDrivePanel(template);
      break;
    case 'j-drive':
      panelHTML = generateJDrivePanel(template);
      break;
    default:
      panelHTML = '<p>Component customization coming soon!</p>';
  }

  panel.innerHTML = panelHTML;
  panel.classList.add('component-panel-active');
}

function generateTurretPanel(turretId, template) {
  return `
    <div class="panel-header">
      <div class="panel-title">🎯 ${turretId.toUpperCase()}</div>
      <button class="panel-close" onclick="clearComponentPanel()">×</button>
    </div>
    <div class="panel-body">
      <p style="color: #aaa; font-size: 0.9em;">
        Turret customization will be implemented in Sub-stage 12.4 (Ship Customization UI).
      </p>
      <p style="color: #888; font-size: 0.85em; margin-top: 10px;">
        Features coming soon:<br>
        • Turret type selection (Single/Double/Triple)<br>
        • Weapon assignment<br>
        • Cost calculation
      </p>
    </div>
  `;
}

function generateCargoPanel(template) {
  return `
    <div class="panel-header">
      <div class="panel-title">📦 Cargo Bay</div>
      <button class="panel-close" onclick="clearComponentPanel()">×</button>
    </div>
    <div class="panel-body">
      <p style="color: #aaa;">Current: ${template.cargo || 0} tons</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 10px;">
        Cargo/Fuel trade-off coming in Sub-stage 12.4
      </p>
    </div>
  `;
}

function generateFuelPanel(template) {
  return `
    <div class="panel-header">
      <div class="panel-title">⛽ Fuel Tanks</div>
      <button class="panel-close" onclick="clearComponentPanel()">×</button>
    </div>
    <div class="panel-body">
      <p style="color: #aaa;">Current: ${template.fuel || 0} tons</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 10px;">
        Cargo/Fuel trade-off coming in Sub-stage 12.4
      </p>
    </div>
  `;
}

function generateMDrivePanel(template) {
  return `
    <div class="panel-header">
      <div class="panel-title">🚀 Maneuver Drive</div>
      <button class="panel-close" onclick="clearComponentPanel()">×</button>
    </div>
    <div class="panel-body">
      <p style="color: #aaa;">Current Thrust: ${template.thrust || 0}</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 10px;">
        Drive upgrades coming in Sub-stage 12.4
      </p>
    </div>
  `;
}

function generateJDrivePanel(template) {
  return `
    <div class="panel-header">
      <div class="panel-title">⭐ Jump Drive</div>
      <button class="panel-close" onclick="clearComponentPanel()">×</button>
    </div>
    <div class="panel-body">
      <p style="color: #aaa;">Current Jump: ${template.jump || 0}</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 10px;">
        Drive upgrades coming in Sub-stage 12.4
      </p>
    </div>
  `;
}

function clearComponentPanel() {
  const panel = document.getElementById('component-panel-content');
  panel.innerHTML = `
    <div class="panel-placeholder">
      <p style="text-align: center; color: #888; margin: 20px;">
        Click a component on the ship schematic to customize it
      </p>
    </div>
  `;
  panel.classList.remove('component-panel-active');

  // Clear selection
  document.querySelectorAll('.clickable-component').forEach(el => {
    el.classList.remove('selected');
  });
  selectedComponent = null;
}

// ======== EVENT LISTENERS ========

function setupEventListeners() {
  // Template selection
  const templateOptions = document.querySelectorAll('.template-option');
  templateOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Update active state
      templateOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');

      // Load template
      const templateId = option.getAttribute('data-template');
      loadShipTemplate(templateId);
    });
  });

  // Back to menu button
  document.getElementById('back-to-menu').addEventListener('click', () => {
    window.location.href = '/';
  });

  // Save ship button
  document.getElementById('save-ship-button').addEventListener('click', () => {
    const shipName = document.getElementById('ship-name').value.trim();
    if (!shipName) {
      alert('Please enter a ship name');
      return;
    }

    alert('Ship saving will be implemented in Sub-stage 12.5 (Ship Library)');
  });
}

/**
 * AR-201: Ship Management Socket Handlers
 *
 * Handles ship CRUD and template operations:
 * - Ship add/delete/update
 * - Ship templates
 * - Template editor data
 */

import { registerHandler } from './index.js';

// ==================== Ship CRUD ====================

function handleShipAdded(data, state, helpers) {
  state.ships.push(data.ship);
  helpers.renderGMSetup();
  helpers.renderPlayerSetup();
  helpers.closeModal();
  helpers.showNotification(`Ship "${data.ship.name}" added`, 'success');
}

function handleShipDeleted(data, state, helpers) {
  state.ships = state.ships.filter(s => s.id !== data.shipId);
  helpers.renderGMSetup();
}

function handleShipUpdated(data, state, helpers) {
  const idx = state.ships.findIndex(s => s.id === data.ship.id);
  if (idx >= 0) {
    state.ships[idx] = data.ship;
  }
  helpers.renderGMSetup();
  helpers.closeModal();
  helpers.showNotification(`Ship "${data.ship.name}" updated`, 'success');
}

// ==================== Templates ====================

function handleShipTemplates(data, state, helpers) {
  state.shipTemplates = data.templates;
  helpers.populateShipTemplateSelect();
  // Also populate ship editor if open
  helpers.populateShipEditor();
}

function handleFullTemplate(data, state, helpers) {
  if (data.template) {
    // AR-153: Use setEditorData from module
    helpers.setEditorData({
      editData: data.template,
      weapons: data.template.weapons || [],
      systems: data.template.systems || []
    });
    helpers.populateEditorFields(data.template);

    // Show preview
    const preview = document.getElementById('edit-template-preview');
    if (preview) {
      preview.innerHTML = `
        <div class="preview-stats">
          <div class="preview-stat">
            <span class="label">Tonnage</span>
            <span class="value">${data.template.tonnage || 100}t</span>
          </div>
          <div class="preview-stat">
            <span class="label">Jump</span>
            <span class="value">J-${data.template.drives?.jump?.rating || 0}</span>
          </div>
          <div class="preview-stat">
            <span class="label">Thrust</span>
            <span class="value">${data.template.drives?.manoeuvre?.thrust || 0}G</span>
          </div>
          <div class="preview-stat">
            <span class="label">Hull</span>
            <span class="value">${data.template.hull?.hullPoints || 40} HP</span>
          </div>
        </div>
      `;
    }
  }
}

// ==================== Register All Handlers ====================

registerHandler('ops:shipAdded', handleShipAdded);
registerHandler('ops:shipDeleted', handleShipDeleted);
registerHandler('ops:shipUpdated', handleShipUpdated);
registerHandler('ops:shipTemplates', handleShipTemplates);
registerHandler('ops:fullTemplate', handleFullTemplate);

// Export for testing
export {
  handleShipAdded,
  handleShipDeleted,
  handleShipUpdated,
  handleShipTemplates,
  handleFullTemplate
};

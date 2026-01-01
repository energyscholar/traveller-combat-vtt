/**
 * AR-214: Adventure Module Socket Handlers
 *
 * Handles adventure module management events:
 * - Module list refresh
 * - Module import/update/delete
 * - Module detail summary
 */

import { registerHandler } from './index.js';
import { escapeHtml } from '../modules/utils.js';

// ==================== Module Management ====================

function handleModuleList(data, state, helpers) {
  state.adventureModules = data.modules || [];
  if (typeof window.renderPrepModules === 'function') {
    window.renderPrepModules();
  }
}

function handleModuleImported(data, state, helpers) {
  helpers.showNotification(`Module "${data.moduleName}" imported successfully!`, 'success');
  state.socket.emit('ops:getModules');
  // Refresh prep data to show imported content
  if (state.campaign?.id) {
    state.socket.emit('ops:getPrepData', { campaignId: state.campaign.id });
  }
}

function handleModuleUpdated(data, state, helpers) {
  const idx = state.adventureModules.findIndex(m => m.id === data.module.id);
  if (idx >= 0) {
    state.adventureModules[idx] = data.module;
  }
  if (typeof window.renderPrepModules === 'function') {
    window.renderPrepModules();
  }
}

function handleModuleDeleted(data, state, helpers) {
  state.adventureModules = state.adventureModules.filter(m => m.id !== data.moduleId);
  if (typeof window.renderPrepModules === 'function') {
    window.renderPrepModules();
  }
  helpers.showNotification('Module deleted', 'info');
  // Refresh prep data
  if (state.campaign?.id) {
    state.socket.emit('ops:getPrepData', { campaignId: state.campaign.id });
  }
}

function handleModuleSummary(data, state, helpers) {
  const summary = data.summary;
  if (!summary) {
    helpers.showNotification('Module not found', 'error');
    return;
  }
  const counts = summary.contentCounts || {};
  const html = `
    <div class="modal-header">
      <h2>${escapeHtml(summary.module_name)}</h2>
      <button class="btn-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <p><strong>Version:</strong> ${escapeHtml(summary.module_version)}</p>
      <p><strong>Status:</strong> ${summary.is_active ? 'Active' : 'Disabled'}</p>
      <p><strong>Imported:</strong> ${new Date(summary.imported_at).toLocaleString()}</p>
      <h4>Content Summary</h4>
      <table class="info-table">
        <tr><th>Type</th><th>Total</th><th>Gated</th></tr>
        ${Object.entries(counts).map(([type, c]) =>
          `<tr><td>${type}</td><td>${c.total}</td><td>${c.gated}</td></tr>`
        ).join('')}
      </table>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Close</button>
    </div>
  `;

  // Use showModalContent via window since it's defined in app.js
  if (typeof window.showModalContent === 'function') {
    window.showModalContent(html);
  } else {
    // Fallback: direct modal manipulation
    const modalBody = document.getElementById('modal-body');
    if (modalBody) {
      modalBody.innerHTML = html;
      document.getElementById('modal-overlay').classList.add('active');
    }
  }
}

// ==================== Register All Handlers ====================

registerHandler('ops:moduleList', handleModuleList);
registerHandler('ops:moduleImported', handleModuleImported);
registerHandler('ops:moduleUpdated', handleModuleUpdated);
registerHandler('ops:moduleDeleted', handleModuleDeleted);
registerHandler('ops:moduleSummary', handleModuleSummary);

// Export for testing
export {
  handleModuleList,
  handleModuleImported,
  handleModuleUpdated,
  handleModuleDeleted,
  handleModuleSummary
};

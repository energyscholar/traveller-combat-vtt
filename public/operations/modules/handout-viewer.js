/**
 * AR-151-4b: Handout Viewer Module
 * Stage 9.3: Display handouts shared by GM
 */

/**
 * Show handout modal
 * @param {Function} showModalContent - Function to show modal content
 * @param {Object} handout - Handout data
 */
export function showHandoutModal(showModalContent, handout) {
  const html = `
    <div class="modal-header">
      <h2>Handout</h2>
      <button class="btn-close" data-close-modal>×</button>
    </div>
    <div class="modal-body">
      <div class="handout-viewer">
        <div class="handout-title">${handout.title}</div>
        <div class="handout-content">
          ${handout.content}
        </div>
        ${handout.sharedBy ? `<div class="handout-meta">Shared by: ${handout.sharedBy}</div>` : ''}
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-close-modal>Close</button>
    </div>
  `;
  showModalContent(html);
}

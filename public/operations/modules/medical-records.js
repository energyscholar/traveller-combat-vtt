/**
 * AR-151-4a: Medical Records Module
 * AR-48: Ship medical records and health status
 */

import { escapeHtml } from './utils.js';

/**
 * Show medical records modal (loading state)
 * @param {Object} state - Application state
 * @param {Function} showModalContent - Function to show modal content
 */
export function showMedicalRecords(state, showModalContent) {
  // Request health data from server
  state.socket.emit('ops:getMedicalRecords');

  // Show loading state
  const html = `
    <div class="modal-header">
      <h2>🏥 Medical Records</h2>
      <button class="btn-close" data-close-modal>×</button>
    </div>
    <div class="modal-body medical-records">
      <div class="loading">Loading medical data...</div>
    </div>
  `;
  showModalContent(html);
}

/**
 * Handle medical records response and populate modal
 * @param {Object} data - Medical data from server
 */
export function handleMedicalRecords(data) {
  const { health = [], triage = [] } = data;
  const modalBody = document.querySelector('.modal-body.medical-records');
  if (!modalBody) return;

  let html = '';

  if (triage.length === 0 && health.length === 0) {
    // AR-93: Medical Records Easter Egg - Traveller-themed medical humor
    const medicalJokes = [
      { warning: 'CAUTION: Crew member claims "space madness" is real', note: 'Recommend ignoring unless they start talking to the ship.' },
      { warning: 'REMINDER: Jump sickness is not cured by "hair of the dog"', note: 'Engineering has been notified about the still.' },
      { warning: 'NOTE: "Vacc suit rash" is not contagious', note: 'But telling the crew that is.' },
      { warning: 'ALERT: Someone has been eating the Zhodani rations again', note: 'Telepathic indigestion is not covered by ship insurance.' },
      { warning: 'WARNING: Ship medic found practicing with a "healing crystal"', note: 'It was a broken sensor relay.' },
      { warning: 'NOTICE: Low gravity bone density is not an excuse to skip workout', note: 'Captain has authorized "motivational airlocks."' },
      { warning: 'UPDATE: Cure for "Vargr fleas" still not found', note: 'Recommend not arm wrestling on shore leave.' },
      { warning: 'MEMO: "Aslan honor duel wounds" not covered as workplace injury', note: 'Should have declined the challenge.' }
    ];
    const joke = medicalJokes[Math.floor(Math.random() * medicalJokes.length)];
    html = `
      <div class="medical-summary" style="text-align: center; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
        <h4>All Crew Healthy</h4>
        <p style="color: var(--text-muted);">No injuries or conditions to report.</p>
        <hr style="margin: 20px 0; border-color: var(--border-color);">
        <div style="text-align: left; padding: 10px; background: rgba(255,193,7,0.1); border-radius: 4px; border-left: 3px solid var(--warning-color);">
          <strong style="color: var(--warning-color);">${joke.warning}</strong>
          <p style="color: var(--text-muted); margin: 5px 0 0 0; font-size: 0.9em;">${joke.note}</p>
        </div>
      </div>
    `;
  } else {
    // Triage section (urgent cases first)
    if (triage.length > 0) {
      html += '<div class="medical-section"><h4>Triage Priority</h4><div class="triage-list">';
      for (const t of triage) {
        const severityClass = t.severity === 'critical' ? 'text-danger' : t.severity === 'severe' ? 'text-warning' : '';
        html += `
          <div class="triage-item">
            <span class="triage-name">${escapeHtml(t.name || 'Unknown')}</span>
            <span class="triage-severity ${severityClass}">${t.severity || 'stable'}</span>
            <span class="triage-wounds">${t.wounds || 0} wounds</span>
          </div>
        `;
      }
      html += '</div></div>';
    }

    // Full health records
    html += '<div class="medical-section"><h4>Crew Health Status</h4><div class="health-list">';
    for (const h of health) {
      const statusColor = h.consciousness === 'alert' ? 'text-success' :
                          h.consciousness === 'unconscious' ? 'text-danger' : 'text-warning';
      const woundCount = h.wounds?.length || 0;
      const conditionCount = h.conditions?.length || 0;

      html += `
        <div class="health-item" style="padding: 8px; border-bottom: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between;">
            <strong>${escapeHtml(h.name || h.character_id || 'Unknown')}</strong>
            <span class="${statusColor}">${h.consciousness || 'alert'}</span>
          </div>
          <div style="font-size: 12px; color: var(--text-muted);">
            END: ${h.current_end ?? '?'}/${h.max_end ?? '?'} |
            Wounds: ${woundCount} | Conditions: ${conditionCount}
            ${h.total_dm ? ` | DM: ${h.total_dm}` : ''}
          </div>
        </div>
      `;
    }
    html += '</div></div>';
  }

  modalBody.innerHTML = html;
}

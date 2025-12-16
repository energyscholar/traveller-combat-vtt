/**
 * AR-151-2c: Mail Modal Module
 * Autorun 6: Ship mail viewing and interaction
 */

/**
 * Show mail list modal
 * @param {Object} state - Application state
 * @param {Function} showModalContent - Function to show modal content
 * @param {Array} mailList - List of mail messages
 * @param {number} unreadCount - Count of unread messages
 */
export function showMailModal(state, showModalContent, mailList, unreadCount) {
  let html = `
    <div class="modal-header">
      <h2>Ship Mail ${unreadCount > 0 ? `<span class="mail-unread-badge">${unreadCount} unread</span>` : ''}</h2>
      <button class="btn-close" data-close-modal>×</button>
    </div>
    <div class="modal-body mail-modal-body">
  `;

  if (!mailList || mailList.length === 0) {
    html += '<p class="text-muted">No mail messages.</p>';
  } else {
    html += '<div class="mail-list">';
    for (const mail of mailList) {
      const isRead = mail.is_read ? '' : 'unread';
      html += `
        <div class="mail-item ${isRead}" data-mail-id="${mail.id}">
          <div class="mail-item-header">
            <span class="mail-sender">${mail.sender_name}</span>
            <span class="mail-date">${mail.sent_date}</span>
          </div>
          <div class="mail-subject">${mail.subject}</div>
          <div class="mail-preview">${mail.body.substring(0, 100)}${mail.body.length > 100 ? '...' : ''}</div>
        </div>
      `;
    }
    html += '</div>';
  }

  html += `
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-close-modal>Close</button>
    </div>
  `;

  showModalContent(html);

  // Setup mail item click handlers
  document.querySelectorAll('.mail-item').forEach(item => {
    item.addEventListener('click', () => {
      const mailId = item.dataset.mailId;
      const mail = mailList.find(m => m.id === mailId);
      if (mail) {
        showMailDetailModal(state, showModalContent, mail);
        if (!mail.is_read) {
          state.socket.emit('ops:markMailRead', { mailId });
        }
      }
    });
  });
}

/**
 * Show mail detail modal
 * @param {Object} state - Application state
 * @param {Function} showModalContent - Function to show modal content
 * @param {Object} mail - Mail message object
 */
export function showMailDetailModal(state, showModalContent, mail) {
  const html = `
    <div class="modal-header">
      <h2>Mail</h2>
      <button class="btn-close" data-close-modal>×</button>
    </div>
    <div class="modal-body">
      <div class="mail-detail">
        <div class="mail-detail-header">
          <div class="mail-from"><strong>From:</strong> ${mail.sender_name}</div>
          <div class="mail-subject-line"><strong>Subject:</strong> ${mail.subject}</div>
          <div class="mail-date-line"><strong>Date:</strong> ${mail.sent_date}</div>
        </div>
        <div class="mail-detail-body">
          ${mail.body.split('\n').join('<br>')}
        </div>
      </div>
      <div class="mail-compose-reply hidden" id="mail-compose-reply">
        <textarea id="mail-reply-body" placeholder="Type your reply..." rows="4"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="state.socket.emit('ops:getMail')">Back to Inbox</button>
      <button class="btn btn-primary" id="btn-mail-reply" data-mail-id="${mail.id}" data-sender="${mail.sender_name}" data-subject="${mail.subject}">Reply</button>
      <button class="btn btn-warning" id="btn-mail-archive" data-mail-id="${mail.id}">Archive</button>
      <button class="btn btn-secondary" data-close-modal>Close</button>
    </div>
  `;
  showModalContent(html);

  // Reply button handler
  document.getElementById('btn-mail-reply').addEventListener('click', (e) => {
    const composeDiv = document.getElementById('mail-compose-reply');
    const replyBtn = e.target;

    if (composeDiv.classList.contains('hidden')) {
      // Show compose area
      composeDiv.classList.remove('hidden');
      replyBtn.textContent = 'Send Reply';
      document.getElementById('mail-reply-body').focus();
    } else {
      // Send reply
      const body = document.getElementById('mail-reply-body').value.trim();
      if (!body) {
        // showError not available in module - use alert as fallback
        alert('Please enter a reply message');
        return;
      }
      state.socket.emit('ops:replyToMail', {
        originalMailId: replyBtn.dataset.mailId,
        subject: `Re: ${replyBtn.dataset.subject}`,
        body
      });
      // showMessage not available in module
      state.socket.emit('ops:getMail');
    }
  });

  // Archive button handler
  document.getElementById('btn-mail-archive').addEventListener('click', (e) => {
    const mailId = e.target.dataset.mailId;
    state.socket.emit('ops:archiveMail', { mailId });
    state.socket.emit('ops:getMail');
  });
}

/**
 * Update mail badge count
 * @param {Object} state - Application state
 */
export function updateMailBadge(state) {
  const badge = document.getElementById('mail-badge');
  if (!badge) return;

  const unreadCount = state.unreadMailCount || 0;
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

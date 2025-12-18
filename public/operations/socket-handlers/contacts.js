/**
 * AR-201: Contact Socket Handlers
 *
 * Handles sensor contacts:
 * - Contact list
 * - Contact add/update/delete
 */

import { registerHandler } from './index.js';

// ==================== Contact List ====================

function handleContacts(data, state, helpers) {
  state.contacts = data.contacts;
  helpers.renderContacts();
  helpers.renderCombatContactsList(); // Autorun 14
  helpers.checkSensorThreats(); // AR-138.3: Auto-expand on threat
}

function handleContactAdded(data, state, helpers) {
  state.contacts.push(data.contact);
  helpers.renderContacts();
  helpers.renderCombatContactsList(); // Autorun 14
  helpers.showNotification(`Contact added: ${data.contact.name || data.contact.type}`, 'info');
  helpers.checkSensorThreats(); // AR-138.3: Auto-expand on threat
}

function handleContactUpdated(data, state, helpers) {
  const idx = state.contacts.findIndex(c => c.id === data.contact.id);
  if (idx >= 0) state.contacts[idx] = data.contact;
  helpers.renderContacts();
  helpers.renderCombatContactsList(); // Autorun 14
}

function handleContactDeleted(data, state, helpers) {
  state.contacts = state.contacts.filter(c => c.id !== data.contactId);
  helpers.renderContacts();
  helpers.renderCombatContactsList(); // Autorun 14
}

// ==================== Register All Handlers ====================

registerHandler('ops:contacts', handleContacts);
registerHandler('ops:contactAdded', handleContactAdded);
registerHandler('ops:contactUpdated', handleContactUpdated);
registerHandler('ops:contactDeleted', handleContactDeleted);

// Export for testing
export {
  handleContacts,
  handleContactAdded,
  handleContactUpdated,
  handleContactDeleted
};

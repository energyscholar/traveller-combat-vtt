/**
 * Operations Socket Handlers - Thin wrapper
 *
 * This file delegates to the modular handler architecture in ./ops/
 * Original 3900-line monolith has been split into domain-specific modules:
 *
 * - ops/context.js     - Shared state and helpers
 * - ops/core.js        - Ping, reconnect, puppeteer auth
 * - ops/campaign.js    - Campaign CRUD operations
 * - ops/player.js      - Player slots, accounts, guests
 * - ops/bridge.js      - Ship selection, roles, session, crew
 * - ops/sensors.js     - Contacts, scanning, weapons authorization
 * - ops/ship.js        - Ship templates and management
 * - ops/engineering.js - System damage and repair
 * - ops/astrogation.js - Jump drive operations
 * - ops/fuel.js        - Fuel management and processing
 * - ops/gm.js          - GM tools, prep, reveals, hailing
 * - ops/comms.js       - Mail, NPC contacts, NPC crew
 * - ops/combat.js      - Combat mode, gunner actions
 * - ops/feedback.js    - Player feedback system
 * - ops/index.js       - Module registry and orchestration
 */

// Re-export everything from the modular architecture
module.exports = require('./ops');

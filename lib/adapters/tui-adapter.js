/**
 * TUI Adapter - Terminal User Interface for Role Panels
 *
 * Consumes ViewModels and renders via pure formatters.
 * Handles terminal output without polluting formatters with I/O.
 *
 * @module lib/adapters/tui-adapter
 */

const { formatters, formatRole, ANSI } = require('./tui-formatters');

// Import ViewModel creators
const { createGunnerViewModel } = require('../viewmodels/role-viewmodels/gunner-viewmodel');
const { createPilotViewModel } = require('../viewmodels/role-viewmodels/pilot-viewmodel');
const { createSensorsViewModel } = require('../viewmodels/role-viewmodels/sensors-viewmodel');
const { createEngineerViewModel } = require('../viewmodels/role-viewmodels/engineer-viewmodel');
const { createCaptainViewModel } = require('../viewmodels/role-viewmodels/captain-viewmodel');
const { createDamageControlViewModel } = require('../viewmodels/role-viewmodels/damage-control-viewmodel');
const { createAstrogatorViewModel } = require('../viewmodels/role-viewmodels/astrogator-viewmodel');
const { createObserverViewModel } = require('../viewmodels/role-viewmodels/observer-viewmodel');

/**
 * ViewModel creator registry
 */
const viewModelCreators = {
  gunner: createGunnerViewModel,
  pilot: createPilotViewModel,
  sensors: createSensorsViewModel,
  engineer: createEngineerViewModel,
  captain: createCaptainViewModel,
  'damage-control': createDamageControlViewModel,
  astrogator: createAstrogatorViewModel,
  observer: createObserverViewModel
};

/**
 * TUI Adapter class for rendering role panels
 */
class TUIAdapter {
  /**
   * Create TUI adapter
   * @param {object} options
   * @param {function} options.output - Output function (default: console.log)
   * @param {boolean} options.clearScreen - Whether to clear screen on render
   */
  constructor(options = {}) {
    this.output = options.output || console.log;
    this.clearScreen = options.clearScreen || false;
  }

  /**
   * Render a ViewModel to the terminal
   * @param {object} vm - Any role ViewModel
   */
  render(vm) {
    if (this.clearScreen) {
      this.output(ANSI.CLEAR + ANSI.HOME);
    }
    this.output(formatRole(vm));
  }

  /**
   * Render multiple ViewModels in columns
   * @param {object[]} vms - Array of ViewModels
   * @param {number} columnWidth - Width per column
   */
  renderColumns(vms, columnWidth = 40) {
    if (vms.length === 0) return;

    // Format each ViewModel
    const formatted = vms.map(vm => formatRole(vm).split('\n'));

    // Find max height
    const maxHeight = Math.max(...formatted.map(f => f.length));

    // Pad each column to max height
    const padded = formatted.map(lines => {
      while (lines.length < maxHeight) {
        lines.push('');
      }
      return lines;
    });

    // Output line by line, side by side
    for (let i = 0; i < maxHeight; i++) {
      const line = padded.map(col => {
        const text = col[i] || '';
        // Pad to column width (accounting for ANSI codes)
        const visibleLength = text.replace(/\x1b\[[0-9;]*m/g, '').length;
        const padding = Math.max(0, columnWidth - visibleLength);
        return text + ' '.repeat(padding);
      }).join(' ');
      this.output(line);
    }
  }

  /**
   * Create and render a role panel from raw state
   * @param {string} role - Role type
   * @param {object} context - State data for the role
   */
  renderRole(role, context) {
    const creator = viewModelCreators[role];
    if (!creator) {
      this.output(`${ANSI.RED}Unknown role: ${role}${ANSI.RESET}`);
      return;
    }

    // Extract args based on role
    const vm = this.createViewModelFromContext(role, context);
    this.render(vm);
  }

  /**
   * Create ViewModel from context object
   * @param {string} role - Role type
   * @param {object} ctx - Context with state data
   * @returns {object} ViewModel
   */
  createViewModelFromContext(role, ctx) {
    switch (role) {
      case 'gunner':
        return createGunnerViewModel(
          ctx.shipState || {},
          ctx.template || {},
          ctx.contacts || [],
          ctx.roleInstance || 1,
          ctx.shipWeapons || []
        );
      case 'pilot':
        return createPilotViewModel(
          ctx.shipState || {},
          ctx.template || {},
          ctx.campaign || {},
          ctx.jumpStatus || {},
          ctx.flightConditions || null,
          ctx.pendingTravel || null
        );
      case 'sensors':
        return createSensorsViewModel(
          ctx.shipState || {},
          ctx.contacts || [],
          ctx.environmentalData || null,
          ctx.panelMode || 'expanded'
        );
      case 'engineer':
        return createEngineerViewModel(
          ctx.shipState || {},
          ctx.template || {},
          ctx.systemStatus || {},
          ctx.damagedSystems || [],
          ctx.fuelStatus || {},
          ctx.repairQueue || []
        );
      case 'captain':
        return createCaptainViewModel(
          ctx.shipState || {},
          ctx.template || {},
          ctx.ship || {},
          ctx.crewOnline || [],
          ctx.contacts || [],
          ctx.rescueTargets || [],
          ctx.activePanel || 'captain'
        );
      case 'damage-control':
        return createDamageControlViewModel(
          ctx.shipState || {},
          ctx.template || {},
          ctx.damagedSystems || [],
          ctx.activeFires || [],
          ctx.breaches || []
        );
      case 'astrogator':
        return createAstrogatorViewModel(
          ctx.shipState || {},
          ctx.template || {},
          ctx.jumpStatus || {},
          ctx.campaign || {},
          ctx.systemStatus || {}
        );
      case 'observer':
        return createObserverViewModel(
          ctx.watchRole || 'pilot',
          ctx
        );
      default:
        throw new Error(`Unknown role: ${role}`);
    }
  }
}

module.exports = {
  TUIAdapter,
  viewModelCreators
};

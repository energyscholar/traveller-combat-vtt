/**
 * AR-204: Role Panels Registry
 *
 * Central exports for all role panel functions.
 * Individual panels extracted for maintainability.
 */

// Shared utilities
export { renderSystemStatusItem, getSystemTooltip } from './shared.js';

// Individual role panels
import { getPilotPanel } from './pilot.js';
import { getEngineerPanel } from './engineer.js';
import { getGunnerPanel } from './gunner.js';
import { getCaptainPanel } from './captain.js';
import { getSensorOperatorPanel } from './sensors.js';
import { getAstrogatorPanel } from './astrogator.js';
import { getDamageControlPanel } from './damage-control.js';
import { getMedicPanel } from './medic.js';
import { getMarinesPanel } from './marines.js';
import { getCommsPanel } from './comms.js';
import { getStewardPanel } from './steward.js';
import { getObserverPanel } from './observer.js';

// Re-export all panel functions
export {
  getPilotPanel,
  getEngineerPanel,
  getGunnerPanel,
  getCaptainPanel,
  getSensorOperatorPanel,
  getAstrogatorPanel,
  getDamageControlPanel,
  getMedicPanel,
  getMarinesPanel,
  getCommsPanel,
  getStewardPanel,
  getObserverPanel
};

/**
 * Get role detail panel HTML content
 * @param {string} role - Role identifier
 * @param {object} context - Context object with state
 * @returns {string} HTML string
 */
export function getRoleDetailContent(role, context) {
  const { shipState = {}, template = {}, systemStatus = {}, damagedSystems = [],
          fuelStatus, jumpStatus = {}, campaign, contacts = [], crewOnline = [], ship,
          roleInstance = 1, shipWeapons = [], combatLog = [], environmentalData = null,
          repairQueue = [], rescueTargets = [], flightConditions = null,
          medicalConditions = null, targetConditions = null, boardingConditions = null } = context;

  switch (role) {
    case 'pilot':
      return getPilotPanel(shipState, template, campaign, jumpStatus, flightConditions);

    case 'engineer':
      return getEngineerPanel(shipState, template, systemStatus, damagedSystems, fuelStatus, repairQueue);

    case 'gunner':
      return getGunnerPanel(shipState, template, contacts, roleInstance, shipWeapons, combatLog, targetConditions);

    case 'captain':
      return getCaptainPanel(shipState, template, ship, crewOnline, contacts, rescueTargets);

    case 'sensor_operator':
      return getSensorOperatorPanel(shipState, contacts, environmentalData);

    case 'astrogator':
      return getAstrogatorPanel(shipState, template, jumpStatus, campaign, systemStatus);

    case 'damage_control':
      return getDamageControlPanel(shipState, template, systemStatus, damagedSystems);

    case 'medic':
      return getMedicPanel(shipState, template, crewOnline, medicalConditions);

    case 'marines':
      return getMarinesPanel(shipState, template, boardingConditions);

    case 'comms':
      return getCommsPanel(shipState, contacts, crewOnline);

    case 'steward':
      return getStewardPanel(shipState, template, crewOnline);

    case 'observer':
      // AR-128: Pass full context so observer can watch other roles
      return getObserverPanel(shipState, template, campaign, jumpStatus, contacts, context);

    default:
      // AR-69: Fall back to Observer panel for unknown roles
      return getObserverPanel(shipState, template, campaign, jumpStatus, contacts, context);
  }
}

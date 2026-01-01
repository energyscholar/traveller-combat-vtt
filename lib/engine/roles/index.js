/**
 * Role Engines - Pure game logic for crew roles
 *
 * Each role engine:
 * - Extends BaseRoleEngine
 * - Defines role-specific actions
 * - Emits events for rendering
 *
 * @module lib/engine/roles
 */

const { BaseRoleEngine, roll1d6, roll2d6 } = require('./base-role-engine');
const { PilotEngine, RANGE_BANDS, THRUST_PER_RANGE } = require('./pilot-engine');
const { GunnerEngine } = require('./gunner-engine');
const { EngineerEngine } = require('./engineer-engine');
const { SensorsEngine } = require('./sensors-engine');
const { CaptainEngine } = require('./captain-engine');
const { DamageControlEngine } = require('./damage-control-engine');

module.exports = {
  BaseRoleEngine,
  roll1d6,
  roll2d6,
  PilotEngine,
  RANGE_BANDS,
  THRUST_PER_RANGE,
  GunnerEngine,
  EngineerEngine,
  SensorsEngine,
  CaptainEngine,
  DamageControlEngine
};

// ======== TRAVELLER COMBAT VTT - SHIP VALIDATION LIBRARY ========
// Centralized exports for all ship validation modules

const JumpDrive = require('./ship-jump-drive');
const ManoeuvreDrive = require('./ship-manoeuvre-drive');
const PowerPlant = require('./ship-power-plant');
const Sensors = require('./ship-sensors');
const Bridge = require('./ship-bridge');
const Staterooms = require('./ship-staterooms');
const Weapons = require('./ship-weapons');
const Armour = require('./ship-armour');

/**
 * Ship Validation Library
 *
 * Complete ship design validation based on Mongoose Traveller 2E High Guard 2022
 *
 * @module ShipValidation
 * @exports {Object} All ship component validation modules
 */
module.exports = {
  // Individual component modules
  JumpDrive,
  ManoeuvreDrive,
  PowerPlant,
  Sensors,
  Bridge,
  Staterooms,
  Weapons,
  Armour,

  // Quick access to common functions
  validators: {
    validateJumpDrive: JumpDrive.validateJumpDrive,
    validateManoeuvreDrive: ManoeuvreDrive.validateManoeuvreDrive,
    validatePowerPlant: PowerPlant.validatePowerPlant,
    validateSensors: Sensors.validateSensors,
    validateBridge: Bridge.validateBridge,
    validateStaterooms: Staterooms.validateStaterooms,
    validateWeapons: Weapons.validateWeapons,
    validateArmour: Armour.validateArmour
  },

  // Package calculators
  packages: {
    calculateJumpPackage: JumpDrive.calculateJumpPackage,
    calculateManoeuvrePackage: ManoeuvreDrive.calculateManoeuvrePackage,
    calculatePowerPackage: PowerPlant.calculatePowerPackage,
    calculateSensorPackage: Sensors.calculateSensorPackage,
    calculateStateroomPackage: Staterooms.calculateStateroomPackage,
    calculateWeaponsPackage: Weapons.calculateWeaponsPackage,
    calculateArmourPackage: Armour.calculateArmourPackage
  },

  // Utility functions
  utils: {
    calculateHardpoints: Weapons.calculateHardpoints,
    calculateBasicPower: PowerPlant.calculateBasicPower,
    calculateTotalPowerRequirement: PowerPlant.calculateTotalPowerRequirement,
    calculateCrewRequirements: Staterooms.calculateCrewRequirements,
    getBestPowerPlantType: PowerPlant.getBestPowerPlantType,
    getBestSensorGrade: Sensors.getBestSensorGrade,
    getBestArmourType: Armour.getBestArmourType,
    getRecommendedBridgeType: Bridge.getRecommendedBridgeType
  }
};

/**
 * Validate complete ship design
 *
 * @param {Object} shipSpec - Ship specification object
 * @returns {Object} Comprehensive validation results
 */
function validateCompleteShip(shipSpec) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    componentValidation: {}
  };

  const { hull, drives, power, sensors, bridge, staterooms, weapons, armour, techLevel } = shipSpec;

  // Validate jump drive
  if (drives && drives.jump) {
    const jumpResult = JumpDrive.validateJumpDrive(
      hull.tonnage,
      drives.jump.rating,
      techLevel
    );
    results.componentValidation.jumpDrive = jumpResult;
    if (!jumpResult.valid) results.valid = false;
    results.errors.push(...jumpResult.errors);
    results.warnings.push(...jumpResult.warnings);
  }

  // Validate manoeuvre drive
  if (drives && drives.manoeuvre) {
    const manoeuvreResult = ManoeuvreDrive.validateManoeuvreDrive(
      hull.tonnage,
      drives.manoeuvre.thrust,
      techLevel
    );
    results.componentValidation.manoeuvreDrive = manoeuvreResult;
    if (!manoeuvreResult.valid) results.valid = false;
    results.errors.push(...manoeuvreResult.errors);
    results.warnings.push(...manoeuvreResult.warnings);
  }

  // Validate power plant
  if (power) {
    const powerResult = PowerPlant.validatePowerPlant(
      power.output,
      power.type,
      techLevel
    );
    results.componentValidation.powerPlant = powerResult;
    if (!powerResult.valid) results.valid = false;
    results.errors.push(...powerResult.errors);
    results.warnings.push(...powerResult.warnings);
  }

  // Add more validations as needed...

  return results;
}

module.exports.validateCompleteShip = validateCompleteShip;

/**
 * JSON Schema Validation Module
 * Validates adventure packages and character imports using Ajv
 * Stage 9.5: Data Integrity
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const path = require('path');
const fs = require('fs');

// Initialize Ajv with all errors mode
const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);

// Load schemas
const schemasDir = path.join(__dirname, '../../schemas');
const adventureSchema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'adventure.schema.json'), 'utf8'));
const characterSchema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'character.schema.json'), 'utf8'));

// Compile validators
const validateAdventure = ajv.compile(adventureSchema);
const validateCharacter = ajv.compile(characterSchema);

/**
 * Format Ajv errors into readable messages
 * @param {Array} errors - Ajv error array
 * @returns {Array<string>} Human-readable error messages
 */
function formatErrors(errors) {
  if (!errors) return [];
  return errors.map(err => {
    const path = err.instancePath || '/';
    const message = err.message || 'Unknown error';
    return `${path}: ${message}`;
  });
}

/**
 * Validate adventure package data
 * @param {Object} data - Adventure data to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateAdventureData(data) {
  const valid = validateAdventure(data);
  return {
    valid,
    errors: valid ? [] : formatErrors(validateAdventure.errors)
  };
}

/**
 * Validate character data
 * @param {Object} data - Character data to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateCharacterData(data) {
  const valid = validateCharacter(data);
  return {
    valid,
    errors: valid ? [] : formatErrors(validateCharacter.errors)
  };
}

/**
 * Validate and throw on adventure import
 * @param {Object} data - Adventure data
 * @throws {Error} If validation fails
 */
function validateAdventureImport(data) {
  const result = validateAdventureData(data);
  if (!result.valid) {
    const error = new Error('Adventure validation failed');
    error.validationErrors = result.errors;
    throw error;
  }
  return data;
}

/**
 * Validate and throw on adventure export
 * @param {Object} data - Adventure data
 * @throws {Error} If validation fails (indicates a bug)
 */
function validateAdventureExport(data) {
  const result = validateAdventureData(data);
  if (!result.valid) {
    console.error('Export validation failed:', result.errors);
    const error = new Error('Internal export error - data validation failed');
    error.validationErrors = result.errors;
    throw error;
  }
  return data;
}

/**
 * Validate character import with warnings
 * @param {Object} data - Character data
 * @returns {Object} { data, warnings: string[] }
 */
function validateCharacterImport(data) {
  const result = validateCharacterData(data);
  if (!result.valid) {
    // For character imports, return warnings instead of throwing
    // Allow partial data to pass through
    return {
      data,
      warnings: result.errors,
      valid: false
    };
  }
  return {
    data,
    warnings: [],
    valid: true
  };
}

/**
 * Get schema for external validation tools
 * @param {string} schemaName - 'adventure' or 'character'
 * @returns {Object} JSON Schema object
 */
function getSchema(schemaName) {
  switch (schemaName) {
    case 'adventure':
      return adventureSchema;
    case 'character':
      return characterSchema;
    default:
      throw new Error(`Unknown schema: ${schemaName}`);
  }
}

module.exports = {
  validateAdventureData,
  validateCharacterData,
  validateAdventureImport,
  validateAdventureExport,
  validateCharacterImport,
  getSchema,
  formatErrors
};

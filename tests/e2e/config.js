/**
 * E2E Test Configuration Module
 * Single source of truth for test URLs
 *
 * Environment variables:
 *   INTERFACE_PATH - Set to /operations/v2 for V2 testing (default: /operations)
 *   BASE_PORT - Override port (default: 3000)
 */

const BASE_PORT = process.env.BASE_PORT || 3000;
const BASE_URL = `http://localhost:${BASE_PORT}`;
const INTERFACE_PATH = process.env.INTERFACE_PATH || '/operations';

// Full URL to the interface being tested
const fullUrl = `${BASE_URL}${INTERFACE_PATH}`;

module.exports = {
  BASE_PORT,
  BASE_URL,
  INTERFACE_PATH,
  fullUrl
};

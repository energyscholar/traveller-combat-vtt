/**
 * AR-153 Phase 1A: Power Management Module
 * Engineer power allocation functions
 */

/**
 * Set power allocation to a preset
 * @param {Object} state - Application state
 * @param {string} preset - combat, silent, jump, or standard
 */
export function setPowerPreset(state, preset) {
  if (!state.socket || !state.shipId) {
    showNotification('Not connected to ship', 'error');
    return;
  }
  state.socket.emit('ops:setPowerPreset', { preset });
}

/**
 * Update power levels from sliders
 * @param {Object} state - Application state
 */
export function updatePower(state) {
  if (!state.socket || !state.shipId) return;

  const sliders = document.querySelectorAll('.power-slider');
  const power = {};
  sliders.forEach(slider => {
    power[slider.dataset.system] = parseInt(slider.value, 10);
  });

  state.socket.emit('ops:setPower', power);
}

/**
 * Request current power status
 * @param {Object} state - Application state
 */
export function requestPowerStatus(state) {
  if (state.socket && state.shipId) {
    state.socket.emit('ops:getPowerStatus');
  }
}

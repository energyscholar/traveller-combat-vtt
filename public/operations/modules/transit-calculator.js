/**
 * AR-153 Phase 1B: Transit Calculator Module
 * Brachistochrone transit time calculation UI
 *
 * Note: Uses global calculateBrachistochrone and formatDistance from helpers.js
 */

/**
 * Update transit calculator display
 */
export function updateTransitCalculator() {
  const distanceInput = document.getElementById('transit-distance');
  const accelSelect = document.getElementById('transit-accel');
  const timeDisplay = document.getElementById('transit-time');
  const turnoverDisplay = document.getElementById('transit-turnover');
  const velocityDisplay = document.getElementById('transit-velocity');

  if (!distanceInput || !accelSelect) return;

  const distance = parseFloat(distanceInput.value) || 100000;
  const accel = parseFloat(accelSelect.value) || 2;

  const result = calculateBrachistochrone(distance, accel);

  if (timeDisplay) timeDisplay.textContent = result.timeFormatted;
  if (turnoverDisplay) turnoverDisplay.textContent = formatDistance(result.turnoverKm);
  if (velocityDisplay) {
    const velocity = result.maxVelocityKmh;
    if (velocity > 1000000) {
      velocityDisplay.textContent = `${(velocity / 1000000).toFixed(1)} Mkm/h`;
    } else if (velocity > 1000) {
      velocityDisplay.textContent = `${(velocity / 1000).toFixed(1)}k km/h`;
    } else {
      velocityDisplay.textContent = `${velocity.toFixed(0)} km/h`;
    }
  }
}

/**
 * Show physics explanation modal
 * @param {Function} showModalContent - Modal display function
 */
export function showPhysicsExplanation(showModalContent) {
  const html = `
    <div class="modal-header">
      <h2>Physics: Brachistochrone</h2>
      <button class="btn-close" data-close-modal>×</button>
    </div>
    <div class="modal-body">
      <div class="physics-explanation">
        <h3>Brachistochrone Transit</h3>
        <p><strong>"Brachistochrone"</strong> = Greek for "shortest time"</p>

        <h4>How it works:</h4>
        <ol>
          <li>Accelerate at constant thrust toward destination</li>
          <li>At midpoint (<strong>turnover</strong>), flip ship 180°</li>
          <li>Decelerate at same thrust to arrive stopped</li>
        </ol>

        <h4>The Formula:</h4>
        <div class="formula-box">
          <code>t = 2 × √(d ÷ a)</code>
        </div>
        <p>Where: <em>t</em> = time, <em>d</em> = distance, <em>a</em> = acceleration</p>

        <h4>Key Insights:</h4>
        <ul>
          <li>Double the distance → only 1.41× longer (√2)</li>
          <li>Double the thrust → only 0.71× time (1/√2)</li>
          <li>Max velocity at turnover: <code>v = √(a × d)</code></li>
        </ul>

        <h4>Example:</h4>
        <p>100,000 km at 2G = ~1h 46m transit</p>
        <p>At turnover: 50,000 km out, velocity ~1,400 km/s</p>
      </div>
    </div>
  `;

  showModalContent(html);
}

/**
 * Initialize transit calculator event listeners
 */
export function setupTransitCalculator() {
  // Update on input change
  document.addEventListener('input', (e) => {
    if (e.target.id === 'transit-distance' || e.target.id === 'transit-accel') {
      updateTransitCalculator();
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'transit-accel') {
      updateTransitCalculator();
    }
  });

  // Physics explanation click
  document.addEventListener('click', (e) => {
    if (e.target.closest('.formula-help') || e.target.closest('.physics-badge')) {
      if (typeof window.showPhysicsExplanation === 'function') {
        window.showPhysicsExplanation();
      }
    }
  });

  // Initial calculation
  setTimeout(updateTransitCalculator, 100);
}

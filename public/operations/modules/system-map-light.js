/**
 * System Map Light - Simple display-only system map for bridge status panel
 *
 * NUCLEAR FIX: Replaces compact-viewscreen.js which had panel sliding bug
 *
 * Key simplifications:
 * - NO ResizeObserver (fixed CSS height)
 * - NO panel switching (map only)
 * - NO complex state sync (reads from window.systemMapState)
 * - Click to open full GM System Map
 */

// Module state
let canvas = null;
let ctx = null;
let container = null;
let animationFrameId = null;
let time = 0;
let isExpanded = false;

// Constants
const TIME_SPEED = 0.0005; // 0.25x of original speed for gentle animation
const AU_SCALE = 100; // pixels per AU at zoom 1.0
const Y_SCALE = 0.6;  // Isometric compression
const STORAGE_KEY = 'ops_system_map_light_expanded';

/**
 * Initialize the system map light component
 * @param {HTMLElement} containerEl - The container element
 */
export function initSystemMapLight(containerEl) {
  container = containerEl;

  // Load saved expand state
  isExpanded = localStorage.getItem(STORAGE_KEY) === 'true';

  // Create simple DOM structure with toggle button
  container.innerHTML = `
    <div class="system-map-light ${isExpanded ? 'expanded' : ''}" title="Click to open full system map">
      <canvas></canvas>
      <div class="system-map-light-label">SYSTEM VIEW</div>
      <button class="system-map-light-toggle" title="Toggle panel size">
        ${isExpanded ? '▼' : '▲'}
      </button>
    </div>
  `;

  canvas = container.querySelector('canvas');
  ctx = canvas.getContext('2d');

  // Toggle button - prevent click from opening full map
  const toggleBtn = container.querySelector('.system-map-light-toggle');
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleExpand();
  });

  // Set canvas size from container (fixed by CSS)
  resizeCanvas();

  // Click to open full system map (but not on toggle button)
  container.querySelector('.system-map-light').addEventListener('click', (e) => {
    if (!e.target.classList.contains('system-map-light-toggle')) {
      openFullSystemMap();
    }
  });

  // Start animation
  startAnimation();

  // Listen for system changes
  if (window.systemMapEvents) {
    window.systemMapEvents.on('systemLoaded', () => {
      console.log('[SystemMapLight] System loaded, refreshing');
    });
  }

  console.log('[SystemMapLight] Initialized, expanded:', isExpanded);
}

/**
 * Toggle between expanded and collapsed states
 */
function toggleExpand() {
  isExpanded = !isExpanded;
  localStorage.setItem(STORAGE_KEY, isExpanded);

  const wrapper = container.querySelector('.system-map-light');
  const toggleBtn = container.querySelector('.system-map-light-toggle');

  if (isExpanded) {
    wrapper.classList.add('expanded');
    toggleBtn.textContent = '▼';
  } else {
    wrapper.classList.remove('expanded');
    toggleBtn.textContent = '▲';
  }

  // Resize canvas after state change
  setTimeout(resizeCanvas, 50);
  console.log('[SystemMapLight] Toggled to:', isExpanded ? 'expanded' : 'collapsed');
}

/**
 * Destroy the component and clean up
 */
export function destroySystemMapLight() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (container) {
    container.removeEventListener('click', openFullSystemMap);
    container.innerHTML = '';
  }
  canvas = null;
  ctx = null;
  container = null;
  console.log('[SystemMapLight] Destroyed');
}

/**
 * Resize canvas to match container
 */
function resizeCanvas() {
  if (!canvas || !container) return;
  const wrapper = container.querySelector('.system-map-light');
  if (!wrapper) return;

  const rect = wrapper.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}

/**
 * Open the full GM System Map overlay
 */
function openFullSystemMap() {
  if (typeof window.showSystemMap === 'function') {
    window.showSystemMap();
  } else {
    console.warn('[SystemMapLight] window.showSystemMap not available');
  }
}

/**
 * Start the animation loop
 */
function startAnimation() {
  function animate() {
    time += TIME_SPEED;
    render();
    animationFrameId = requestAnimationFrame(animate);
  }
  animationFrameId = requestAnimationFrame(animate);
}

/**
 * Main render function
 */
function render() {
  if (!ctx || !canvas) return;

  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;

  // Clear canvas
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, width, height);

  // Get system data from global state
  const systemState = window.systemMapState;
  if (!systemState?.system?.celestialObjects) {
    // No system loaded - show placeholder
    ctx.fillStyle = '#334';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('No system data', centerX, centerY);
    return;
  }

  const objects = systemState.system.celestialObjects;
  const zoom = calculateAutoZoom(objects, width, height);
  const auToPixels = AU_SCALE * zoom;

  // Draw star glow
  const star = objects.find(o => o.type === 'Star');
  if (star) {
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30);
    gradient.addColorStop(0, star.color || '#ffdd88');
    gradient.addColorStop(0.3, 'rgba(255, 200, 100, 0.3)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Star core
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.max(3, 8 * zoom), 0, Math.PI * 2);
    ctx.fillStyle = star.color || '#ffdd88';
    ctx.fill();
  }

  // Calculate system seed from name for deterministic but varied planet variants
  const systemName = systemState.system.name || 'unknown';
  const systemSeed = hashString(systemName);

  // Draw orbits and planets with seed-based variant indices for visual variety
  let planetIndex = 0;
  objects.forEach(obj => {
    if (obj.type === 'Star' || !obj.orbitAU) return;

    const orbitRadius = obj.orbitAU * auToPixels;

    // Skip if orbit too small or too large
    if (orbitRadius < 5 || orbitRadius > Math.max(width, height)) return;

    // Draw orbit path (subtle)
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, orbitRadius, orbitRadius * Y_SCALE, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(60, 80, 100, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Calculate deterministic initial orbital position from seed
    // Uses golden angle (137.5°) for nice distribution of multiple planets
    const initialBearing = ((systemSeed + planetIndex * 137) % 360) * (Math.PI / 180);
    const angle = initialBearing + time;
    const x = centerX + Math.cos(angle) * orbitRadius;
    const y = centerY + Math.sin(angle) * orbitRadius * Y_SCALE;

    // Use system seed + planet index for unique variant per system
    const variantIndex = (systemSeed + planetIndex) % 4;

    // Draw planet with variant styling
    const baseRadius = Math.max(2, Math.min(8, (obj.radiusKm || 5000) / 5000 * zoom * 3));
    const sizemod = getSizeModifier(obj.type, variantIndex);
    const radius = baseRadius * sizemod;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = obj.color || getPlanetColor(obj.type, variantIndex);
    ctx.fill();

    // Draw rings for gas giants that have them
    if (hasRings(obj.type, variantIndex) && radius > 3) {
      const innerR = radius * 1.3;
      const outerR = radius * 1.8;
      ctx.strokeStyle = 'rgba(200, 180, 150, 0.4)';
      ctx.lineWidth = (outerR - innerR) * 0.4;
      ctx.beginPath();
      ctx.ellipse(x, y, (innerR + outerR) / 2, (innerR + outerR) / 2 * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    planetIndex++;
  });

  // Draw ship marker if available
  const shipState = window.systemMapState?.partyShip;
  if (shipState?.position) {
    const sx = centerX + shipState.position.x * auToPixels;
    const sy = centerY + shipState.position.y * auToPixels * Y_SCALE;

    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#4488ff';
    ctx.fill();
    ctx.strokeStyle = '#88ccff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/**
 * Calculate zoom to fit system in view
 */
function calculateAutoZoom(objects, width, height) {
  let maxOrbit = 1;
  objects.forEach(obj => {
    if (obj.orbitAU && obj.orbitAU > maxOrbit) {
      maxOrbit = obj.orbitAU;
    }
  });

  const minDimension = Math.min(width, height) * 0.4;
  return minDimension / (maxOrbit * AU_SCALE);
}

/**
 * Simple string hash for deterministic seeding
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash % 1000);
}

/**
 * Gas giant variants - 4 distinct types
 */
const GAS_GIANT_COLORS = [
  '#d4a574',  // Jupiter-like (tan)
  '#e8d4a0',  // Saturn-like (pale gold)
  '#cc8866',  // Hot Jupiter (reddish)
  '#88aacc'   // Ice Giant (blue-green)
];

const GAS_GIANT_RINGS = [false, true, false, true];
const GAS_GIANT_SIZES = [1.2, 1.0, 0.8, 0.9];

/**
 * Rocky planet variants - 4 types
 */
const ROCKY_COLORS = [
  '#b87855',  // Mars-like
  '#888888',  // Mercury-like
  '#ccaa77',  // Venus-like
  '#554433'   // Dark asteroid
];
const ROCKY_SIZES = [0.9, 0.7, 1.0, 0.6];

/**
 * Get color for planet type with variant
 * @param {number} index - Object index for variant selection
 */
function getPlanetColor(type, index = 0) {
  if (type === 'Gas Giant') {
    return GAS_GIANT_COLORS[index % GAS_GIANT_COLORS.length];
  }
  if (type === 'Ice Giant') {
    return GAS_GIANT_COLORS[3]; // Always blue-green
  }
  if (type === 'Planet') {
    return ROCKY_COLORS[index % ROCKY_COLORS.length];
  }
  const defaults = {
    'Asteroid Belt': '#666666',
    'Moon': '#aabbcc',
    'Station': '#44ff88'
  };
  return defaults[type] || '#888888';
}

/**
 * Get size modifier for planet type with variant
 */
function getSizeModifier(type, index = 0) {
  if (type === 'Gas Giant') {
    return GAS_GIANT_SIZES[index % GAS_GIANT_SIZES.length];
  }
  if (type === 'Planet') {
    return ROCKY_SIZES[index % ROCKY_SIZES.length];
  }
  return 1.0;
}

/**
 * Check if gas giant variant should have rings
 */
function hasRings(type, index = 0) {
  if (type === 'Gas Giant' || type === 'Ice Giant') {
    return GAS_GIANT_RINGS[index % GAS_GIANT_RINGS.length];
  }
  return false;
}

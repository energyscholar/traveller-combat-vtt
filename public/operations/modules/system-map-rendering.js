/**
 * AR-201 Phase 5: System Map Rendering
 *
 * Canvas drawing functions for system map visualization.
 * Extracted from system-map.js for maintainability.
 */

// State and helpers injected via init
let state = null;
let helpers = null;

/**
 * Initialize rendering module with state and helpers
 * @param {Object} mapState - systemMapState object
 * @param {Object} mapHelpers - Helper functions { getYScale, getDate }
 */
export function initSystemMapRendering(mapState, mapHelpers) {
  state = mapState;
  helpers = mapHelpers;
}

/**
 * Draw twinkling background stars
 */
export function drawBackgroundStars(ctx, width, height) {
  const starCount = 200;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';

  for (let i = 0; i < starCount; i++) {
    const x = ((i * 7919) % width);
    const y = ((i * 104729) % height);
    const size = ((i * 31) % 3) * 0.5 + 0.5;
    const twinkle = Math.sin(state.time * 2 + i) * 0.3 + 0.7;

    ctx.globalAlpha = twinkle * 0.8;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * Draw a star with glow effect
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} size - Star radius
 * @param {string} stellarClass - G, K, M, A, B, F, O
 * @param {string} glowColor
 */
export function drawStar(ctx, x, y, size, stellarClass, glowColor) {
  const starColors = {
    O: '#9bb0ff',  // Blue
    B: '#aabfff',  // Blue-white
    A: '#cad7ff',  // White
    F: '#f8f7ff',  // Yellow-white
    G: '#fff4ea',  // Yellow (like Sol)
    K: '#ffd2a1',  // Orange
    M: '#ffcc6f',  // Red
    L: '#ff6633',  // Brown dwarf
    T: '#cc3300',  // Brown dwarf
    D: '#ffffff'   // White dwarf
  };

  const coreColor = starColors[stellarClass] || starColors.G;

  // Outer glow
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
  gradient.addColorStop(0, coreColor);
  gradient.addColorStop(0.1, coreColor);
  gradient.addColorStop(0.4, 'rgba(255, 200, 100, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, size * 4, 0, Math.PI * 2);
  ctx.fill();

  // Core
  const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
  coreGradient.addColorStop(0, '#ffffff');
  coreGradient.addColorStop(0.5, coreColor);
  coreGradient.addColorStop(1, coreColor);

  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();

  // Flare effect
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2 + state.time * 0.1;
    const len = size * 2.5;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }
}

/**
 * Draw an orbit path
 */
export function drawOrbitPath(ctx, centerX, centerY, radius) {
  ctx.strokeStyle = state.colors.orbitPath;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 10]);

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius, radius * helpers.getYScale(), 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);
}

/**
 * Draw planetary rings
 * @param {string} ringSize - 'large', 'thin', or default
 */
export function drawRings(ctx, x, y, planetSize, ringSize = 'default') {
  if (!isFinite(x) || !isFinite(y) || !isFinite(planetSize) || planetSize <= 0) return;

  let innerRadius, outerRadius, color, lineWidth;

  if (ringSize === 'large') {
    // Saturn-like prominent rings
    innerRadius = planetSize * 1.2;
    outerRadius = planetSize * 2.2;
    color = 'rgba(220, 200, 170, 0.6)';
    lineWidth = (outerRadius - innerRadius) * 0.5;
  } else if (ringSize === 'thin') {
    // Neptune/Uranus-like thin rings
    innerRadius = planetSize * 1.4;
    outerRadius = planetSize * 1.7;
    color = 'rgba(150, 170, 190, 0.4)';
    lineWidth = (outerRadius - innerRadius) * 0.3;
  } else {
    // Default medium rings
    innerRadius = planetSize * 1.3;
    outerRadius = planetSize * 2;
    color = 'rgba(200, 180, 150, 0.5)';
    lineWidth = (outerRadius - innerRadius) * 0.4;
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  ctx.beginPath();
  ctx.ellipse(x, y, (innerRadius + outerRadius) / 2, (innerRadius + outerRadius) / 2 * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Gas giant variants - 4 distinct types based on real science
 * 0: Jupiter-like (banded, no rings, possible Great Red Spot)
 * 1: Saturn-like (prominent rings, yellowish)
 * 2: Hot Jupiter (reddish, no rings, close orbiter)
 * 3: Ice Giant (blue-green, thin rings) - like Neptune/Uranus
 */
const GAS_GIANT_VARIANTS = [
  { colors: ['#d4a574', '#c49464', '#b48454', '#e8c4a0'], rings: false, spot: true, sizemod: 1.2 },
  { colors: ['#e8d4a0', '#d8c490', '#c8b480', '#f0e0b0'], rings: true, ringSize: 'large', spot: false, sizemod: 1.0 },
  { colors: ['#cc8866', '#bb7755', '#aa6644', '#dd9977'], rings: false, spot: false, sizemod: 0.8 },
  { colors: ['#88aacc', '#7799bb', '#6688aa', '#99bbdd'], rings: true, ringSize: 'thin', spot: false, sizemod: 0.9 }
];

/**
 * Rocky planet variants - 4 distinct types
 * 0: Mars-like (reddish, dusty)
 * 1: Mercury-like (grey, cratered)
 * 2: Venus-like (yellowish, clouded)
 * 3: Dark asteroid-like (very dark, irregular)
 */
const ROCKY_VARIANTS = [
  { colors: ['#b87855', '#a86745', '#985635'], sizemod: 0.9 },
  { colors: ['#888888', '#777777', '#666666'], sizemod: 0.7 },
  { colors: ['#ccaa77', '#bb9966', '#aa8855'], sizemod: 1.0 },
  { colors: ['#554433', '#443322', '#332211'], sizemod: 0.6 }
];

/**
 * Ice world variants - 3 types
 */
const ICE_VARIANTS = [
  { colors: ['#a8c8dc', '#88a8bc', '#c8e8fc'], sizemod: 1.0 },  // Europa-like
  { colors: ['#ddeeff', '#ccddee', '#bbccdd'], sizemod: 0.8 },  // Bright ice
  { colors: ['#99aabb', '#8899aa', '#778899'], sizemod: 0.9 }   // Dirty ice
];

/**
 * Draw a planet with variant styling
 * @param {string} type - 'rocky', 'gas', 'ice', 'habitable'
 * @param {number} variantIndex - Index for deterministic variant selection
 */
export function drawPlanet(ctx, x, y, size, type, variantIndex = 0) {
  // Guard against non-finite values that break createRadialGradient
  if (!isFinite(x) || !isFinite(y) || !isFinite(size) || size <= 0) {
    console.warn('[SystemMap] drawPlanet: Invalid parameters', { x, y, size, type });
    return;
  }

  let palette, variant;
  let finalSize = size;

  if (type === 'gas') {
    variant = GAS_GIANT_VARIANTS[variantIndex % GAS_GIANT_VARIANTS.length];
    palette = variant.colors;
    finalSize = size * variant.sizemod;
  } else if (type === 'ice') {
    variant = ICE_VARIANTS[variantIndex % ICE_VARIANTS.length];
    palette = variant.colors;
    finalSize = size * variant.sizemod;
  } else if (type === 'habitable') {
    palette = ['#4a7c59', '#3a6c49', '#2a5c39', '#5a8c69'];
  } else {
    // rocky or default
    variant = ROCKY_VARIANTS[variantIndex % ROCKY_VARIANTS.length];
    palette = variant.colors;
    finalSize = size * variant.sizemod;
  }

  // Planet sphere with shading
  const gradient = ctx.createRadialGradient(
    x - finalSize * 0.3, y - finalSize * 0.3, 0,
    x, y, finalSize
  );
  gradient.addColorStop(0, palette[palette.length - 1] || palette[0]);
  gradient.addColorStop(0.5, palette[0]);
  gradient.addColorStop(1, palette[1] || palette[0]);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, finalSize, 0, Math.PI * 2);
  ctx.fill();

  // Gas giant specific features
  if (type === 'gas' && variant) {
    // Draw bands for gas giants
    drawGasGiantBands(ctx, x, y, finalSize, palette);

    // Draw spot (like Great Red Spot) for variant 0
    if (variant.spot && finalSize > 6) {
      drawGiantSpot(ctx, x, y, finalSize);
    }

    // Draw rings based on variant
    if (variant.rings && finalSize > 5) {
      drawRings(ctx, x, y, finalSize, variant.ringSize);
    }
  }

  // Atmosphere glow for habitable worlds
  if (type === 'habitable') {
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, finalSize + 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/**
 * Simple string hash for deterministic seeding
 * @param {string} str - String to hash
 * @returns {number} Hash value (0-1000)
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash % 1000);
}

/**
 * Draw horizontal bands on gas giants
 */
function drawGasGiantBands(ctx, x, y, size, palette) {
  if (size < 5) return;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.clip();

  const bandCount = Math.min(5, Math.floor(size / 3));
  const bandHeight = (size * 2) / bandCount;

  for (let i = 0; i < bandCount; i++) {
    const yPos = y - size + (i * bandHeight);
    const colorIndex = i % palette.length;
    ctx.fillStyle = palette[colorIndex] + (i % 2 === 0 ? 'cc' : '88');
    ctx.fillRect(x - size, yPos, size * 2, bandHeight);
  }
  ctx.restore();
}

/**
 * Draw a storm spot like Jupiter's Great Red Spot
 */
function drawGiantSpot(ctx, x, y, size) {
  const spotX = x + size * 0.3;
  const spotY = y + size * 0.1;
  const spotSize = size * 0.25;

  const gradient = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, spotSize);
  gradient.addColorStop(0, '#cc6644');
  gradient.addColorStop(0.6, '#aa5533');
  gradient.addColorStop(1, '#884422');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(spotX, spotY, spotSize, spotSize * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw moons around a planet
 */
export function drawMoons(ctx, planetX, planetY, planet, zoom) {
  const getYScale = helpers.getYScale;
  for (let i = 0; i < planet.moons.length; i++) {
    const moon = planet.moons[i];
    const moonOrbitRadius = Math.max(15, (moon.orbitRadius / 50000) * zoom);
    const moonAngle = state.time * 2 + i * Math.PI / 3;
    const moonX = planetX + Math.cos(moonAngle) * moonOrbitRadius;
    const moonY = planetY + Math.sin(moonAngle) * moonOrbitRadius * getYScale();
    const moonSize = Math.max(2, (moon.size / 2000) * zoom);

    // Moon orbit path
    ctx.strokeStyle = 'rgba(100, 100, 120, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.ellipse(planetX, planetY, moonOrbitRadius, moonOrbitRadius * getYScale(), 0, 0, Math.PI * 2);
    ctx.stroke();

    // Moon
    ctx.fillStyle = state.colors.moon;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * AR-240: Draw debris field (inner asteroid belt)
 */
export function drawDebrisField(ctx, centerX, centerY, field, auToPixels) {
  const getYScale = helpers.getYScale;
  const radius = field.orbitAU * auToPixels;

  // Dotted ring style
  ctx.strokeStyle = 'rgba(100, 90, 80, 0.5)';
  ctx.lineWidth = 3;
  ctx.setLineDash([2, 6]);

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius, radius * getYScale(), 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Scattered debris
  ctx.fillStyle = 'rgba(130, 120, 100, 0.5)';
  for (let i = 0; i < 15; i++) {
    const angle = (i * 104729) % 360 * Math.PI / 180 + state.time * 0.02;
    const r = radius * (0.95 + (i % 5) * 0.02);
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r * getYScale();
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * AR-240: Draw Kuiper belt (outer icy belt)
 */
export function drawKuiperBelt(ctx, centerX, centerY, belt, auToPixels) {
  const getYScale = helpers.getYScale;
  const innerRadius = belt.innerRadius * auToPixels;
  const outerRadius = belt.outerRadius * auToPixels;
  const avgRadius = (innerRadius + outerRadius) / 2;

  // Dashed ring style - icy blue
  ctx.strokeStyle = 'rgba(150, 180, 200, 0.25)';
  ctx.lineWidth = outerRadius - innerRadius;
  ctx.setLineDash([4, 8]);

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, avgRadius, avgRadius * getYScale(), 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Scattered icy bodies
  ctx.fillStyle = 'rgba(180, 200, 220, 0.4)';
  for (let i = 0; i < 20; i++) {
    const r = innerRadius + (i * 7919) % (outerRadius - innerRadius);
    const angle = (i * 104729) % 360 * Math.PI / 180 + state.time * 0.003;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r * getYScale();
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * AR-240: Draw Trojan cluster at L4 or L5 of a gas giant
 */
export function drawTrojanCluster(ctx, centerX, centerY, trojan, auToPixels, time) {
  const getYScale = helpers.getYScale;
  const radius = trojan.orbitAU * auToPixels;
  const orbitSpeed = 0.1 / Math.sqrt(trojan.orbitAU);

  // L4 is 60° ahead, L5 is 60° behind parent planet
  const parentAngle = time * orbitSpeed;
  const lagrangeOffset = trojan.lagrangePoint === 'L4' ? Math.PI / 3 : -Math.PI / 3;
  const angle = parentAngle + lagrangeOffset;

  const clusterX = centerX + Math.cos(angle) * radius;
  const clusterY = centerY + Math.sin(angle) * radius * getYScale();

  // Draw cluster of small dots
  ctx.fillStyle = 'rgba(140, 130, 120, 0.6)';
  for (let i = 0; i < 8; i++) {
    const offsetAngle = (i * Math.PI * 2 / 8);
    const offsetR = 3 + (i % 3) * 2;
    const x = clusterX + Math.cos(offsetAngle) * offsetR;
    const y = clusterY + Math.sin(offsetAngle) * offsetR;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * AR-240: Draw brown dwarf companion
 */
export function drawBrownDwarf(ctx, centerX, centerY, companion, auToPixels) {
  const x = centerX + (companion.orbitAU || 50) * auToPixels;
  const y = centerY;
  const size = 4;

  // Dim reddish-brown glow
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
  gradient.addColorStop(0, '#aa4400');
  gradient.addColorStop(0.5, 'rgba(100, 40, 20, 0.5)');
  gradient.addColorStop(1, 'transparent');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, size * 3, 0, Math.PI * 2);
  ctx.fill();

  // Core
  ctx.fillStyle = '#883300';
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw asteroid belt
 */
export function drawAsteroidBelt(ctx, centerX, centerY, belt, auToPixels) {
  const getYScale = helpers.getYScale;
  const innerRadius = belt.innerRadius * auToPixels;
  const outerRadius = belt.outerRadius * auToPixels;

  // Belt zone as gradient
  ctx.strokeStyle = `rgba(120, 100, 80, ${belt.density * 0.3})`;
  ctx.lineWidth = outerRadius - innerRadius;
  ctx.setLineDash([2, 4]);

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, (innerRadius + outerRadius) / 2, (innerRadius + outerRadius) / 2 * getYScale(), 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);

  // Scattered asteroids
  const asteroidCount = 30;
  ctx.fillStyle = 'rgba(150, 130, 110, 0.6)';
  for (let i = 0; i < asteroidCount; i++) {
    const r = innerRadius + (i * 7919) % (outerRadius - innerRadius);
    const angle = (i * 104729) % 360 * Math.PI / 180 + state.time * 0.01;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r * getYScale();
    const size = 1 + (i % 3);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw the full star system
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} centerX - Center X position
 * @param {number} centerY - Center Y position
 * @param {number} zoom - Current zoom level
 * @param {Object} system - System data from generateSystem
 */
export function drawFullSystem(ctx, centerX, centerY, zoom, system) {
  const getYScale = helpers.getYScale;
  const auToPixels = state.AU_TO_PIXELS * zoom;

  // Draw stars
  for (const star of system.stars) {
    const starX = centerX + star.position.x * auToPixels;
    const starY = centerY + star.position.y * auToPixels;
    const starSize = Math.max(5, star.radius * 10 * Math.sqrt(zoom));
    drawStar(ctx, starX, starY, starSize, star.type, star.color);
  }

  // Draw asteroid belts
  for (const belt of system.asteroidBelts) {
    drawAsteroidBelt(ctx, centerX, centerY, belt, auToPixels);
  }

  // AR-240: Draw new object types from generator
  // Draw debris fields (inner belts)
  if (system.belts) {
    for (const belt of system.belts) {
      if (belt.type === 'Debris Field') {
        drawDebrisField(ctx, centerX, centerY, belt, auToPixels);
      } else if (belt.type === 'Kuiper Belt') {
        drawKuiperBelt(ctx, centerX, centerY, belt, auToPixels);
      }
    }
  }

  // Draw Trojan clusters
  if (system.trojans) {
    for (const trojan of system.trojans) {
      drawTrojanCluster(ctx, centerX, centerY, trojan, auToPixels, state.time);
    }
  }

  // Draw brown dwarf companions
  if (system.companions) {
    for (const companion of system.companions) {
      if (companion.type === 'brown_dwarf') {
        drawBrownDwarf(ctx, centerX, centerY, companion, auToPixels);
      }
    }
  }

  // Draw orbit paths
  for (const planet of system.planets) {
    const orbitRadius = planet.orbitAU * auToPixels;
    drawOrbitPath(ctx, centerX, centerY, orbitRadius);
  }

  // Calculate system seed from name for deterministic but varied planet variants
  const systemSeed = hashString(system.name || 'unknown');

  // Draw planets with seed-based positions for visual variety
  for (let planetIndex = 0; planetIndex < system.planets.length; planetIndex++) {
    const planet = system.planets[planetIndex];
    const orbitRadius = planet.orbitAU * auToPixels;

    // Calculate deterministic initial orbital position from seed
    // Uses golden angle (137.5°) for nice distribution of multiple planets
    const initialBearing = ((systemSeed + planetIndex * 137) % 360) * (Math.PI / 180);

    // Animation: slower for outer planets (Kepler's laws)
    const orbitSpeed = 0.1 / Math.sqrt(planet.orbitAU);
    const angle = initialBearing + state.time * orbitSpeed;

    const planetX = centerX + Math.cos(angle) * orbitRadius;
    const planetY = centerY + Math.sin(angle) * orbitRadius * getYScale(); // Isometric ellipse

    // Size scales with zoom but has min/max for visibility
    // Guard against undefined size - use default 5000
    const planetSize = Math.max(3, Math.min(50, ((planet.size || 5000) / 5000) * zoom * 2));

    // Use system seed + planet index for unique variant per system
    const variantIndex = (systemSeed + planetIndex) % 4;
    drawPlanet(ctx, planetX, planetY, planetSize, planet.type, variantIndex);

    // Draw planet label at higher zoom
    // AR-124: Celestial labels hidden until position verified (immersive)
    if (zoom > 0.5 && planetSize > 5) {
      const isVerified = typeof window.getShipState === 'function'
        ? window.getShipState()?.positionVerified !== false
        : true;
      // AR-199: Only draw labels if enabled
      if (state.showLabels) {
        const labelText = isVerified ? planet.name : '???';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(labelText, planetX, planetY + planetSize + 12);
      }
    }

    // Draw moons at high zoom
    if (zoom > 2 && planet.moons.length > 0) {
      drawMoons(ctx, planetX, planetY, planet, zoom);
    }
  }
}

/**
 * Draw zoom indicator
 */
export function drawZoomIndicator(ctx, width, height, zoom) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '12px monospace';
  ctx.textAlign = 'right';

  let scaleLabel;
  if (zoom < 0.5) {
    scaleLabel = `${Math.round(100 / zoom)} AU`;
  } else if (zoom < 5) {
    scaleLabel = `${Math.round(10 / zoom)} AU`;
  } else {
    scaleLabel = `${Math.round(1000000 / zoom)} km`;
  }

  ctx.fillText(`Zoom: ${zoom.toFixed(2)}x | Scale: ~${scaleLabel}`, width - 10, height - 10);
}

/**
 * AR-88: Draw current Imperial date display on canvas
 */
export function drawDateDisplay(ctx, width, height) {
  const date = helpers.getDate();
  const dateStr = `${date.year}.${date.day.toString().padStart(3, '0')}`;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Date: ${dateStr}`, 10, height - 10);
}

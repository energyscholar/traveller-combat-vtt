/**
 * AR-29.5: Interactive Star System Map
 * Canvas-based system visualization with stars, planets, moons
 */

// System Map State
const systemMapState = {
  canvas: null,
  ctx: null,
  container: null,

  // View state
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,

  // System data
  system: null,

  // Animation
  animationFrame: null,
  time: 0,

  // Constants
  AU_TO_PIXELS: 50,  // 1 AU = 50 pixels at zoom 1
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 100,

  // Colors
  colors: {
    space: '#0a0a12',
    starGlow: '#fff7e6',
    orbitPath: 'rgba(100, 120, 150, 0.3)',
    planetRocky: '#8b7355',
    planetGas: '#d4a574',
    planetIce: '#a8c8dc',
    planetHabitable: '#4a7c59',
    moon: '#888888',
    asteroid: '#666666'
  }
};

/**
 * Initialize the system map canvas
 * @param {HTMLElement} container - Container element for the canvas
 */
function initSystemMap(container) {
  systemMapState.container = container;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'system-map-canvas';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);

  systemMapState.canvas = canvas;
  systemMapState.ctx = canvas.getContext('2d');

  // Size canvas to container
  resizeCanvas();

  // Event listeners
  window.addEventListener('resize', resizeCanvas);
  canvas.addEventListener('wheel', handleWheel, { passive: false });
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', handleMouseUp);

  // Start render loop
  startRenderLoop();

  console.log('[SystemMap] Initialized');
}

/**
 * Resize canvas to match container
 */
function resizeCanvas() {
  const container = systemMapState.container;
  if (!container || !systemMapState.canvas) return;

  const rect = container.getBoundingClientRect();
  systemMapState.canvas.width = rect.width * window.devicePixelRatio;
  systemMapState.canvas.height = rect.height * window.devicePixelRatio;

  systemMapState.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

/**
 * Handle mouse wheel for zooming
 */
function handleWheel(e) {
  e.preventDefault();

  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  const newZoom = systemMapState.zoom * zoomFactor;

  if (newZoom >= systemMapState.MIN_ZOOM && newZoom <= systemMapState.MAX_ZOOM) {
    // Zoom toward mouse position
    const rect = systemMapState.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    systemMapState.offsetX = mouseX - (mouseX - systemMapState.offsetX) * zoomFactor;
    systemMapState.offsetY = mouseY - (mouseY - systemMapState.offsetY) * zoomFactor;
    systemMapState.zoom = newZoom;
  }
}

/**
 * Handle mouse down for panning
 */
function handleMouseDown(e) {
  systemMapState.isDragging = true;
  systemMapState.lastMouseX = e.clientX;
  systemMapState.lastMouseY = e.clientY;
  systemMapState.canvas.style.cursor = 'grabbing';
}

/**
 * Handle mouse move for panning
 */
function handleMouseMove(e) {
  if (!systemMapState.isDragging) return;

  const deltaX = e.clientX - systemMapState.lastMouseX;
  const deltaY = e.clientY - systemMapState.lastMouseY;

  systemMapState.offsetX += deltaX;
  systemMapState.offsetY += deltaY;

  systemMapState.lastMouseX = e.clientX;
  systemMapState.lastMouseY = e.clientY;
}

/**
 * Handle mouse up to stop panning
 */
function handleMouseUp() {
  systemMapState.isDragging = false;
  if (systemMapState.canvas) {
    systemMapState.canvas.style.cursor = 'grab';
  }
}

/**
 * Start the render loop (with time control support)
 */
function startRenderLoop() {
  function loop() {
    if (!systemMapState.paused) {
      systemMapState.time += 0.016 * systemMapState.timeSpeed; // ~60fps, scaled by speed
      systemMapState.simulatedDate += 0.016 * systemMapState.timeSpeed * 0.5; // Days pass
    }
    render();
    systemMapState.animationFrame = requestAnimationFrame(loop);
  }
  loop();
}

/**
 * Stop the render loop
 */
function stopRenderLoop() {
  if (systemMapState.animationFrame) {
    cancelAnimationFrame(systemMapState.animationFrame);
    systemMapState.animationFrame = null;
  }
}

/**
 * Main render function
 */
function render() {
  const { canvas, ctx, zoom, offsetX, offsetY, colors, system } = systemMapState;
  if (!canvas || !ctx) return;

  const width = canvas.width / window.devicePixelRatio;
  const height = canvas.height / window.devicePixelRatio;

  // Clear canvas
  ctx.fillStyle = colors.space;
  ctx.fillRect(0, 0, width, height);

  // Draw background stars
  drawBackgroundStars(ctx, width, height);

  // Calculate center
  const centerX = width / 2 + offsetX;
  const centerY = height / 2 + offsetY;

  // Draw system
  if (system && system.stars) {
    drawFullSystem(ctx, centerX, centerY, zoom, system);
  } else {
    // Draw demo system
    const demoSystem = generateSystem('Demo System', 'A788899-C', 'G2 V', '1234');
    drawFullSystem(ctx, centerX, centerY, zoom, demoSystem);
  }

  // Draw zoom indicator
  drawZoomIndicator(ctx, width, height, zoom);
}

/**
 * Draw twinkling background stars
 */
function drawBackgroundStars(ctx, width, height) {
  // Use deterministic seed for consistent star positions
  const starCount = 200;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';

  for (let i = 0; i < starCount; i++) {
    // Pseudo-random based on index
    const x = ((i * 7919) % width);
    const y = ((i * 104729) % height);
    const size = ((i * 31) % 3) * 0.5 + 0.5;
    const twinkle = Math.sin(systemMapState.time * 2 + i) * 0.3 + 0.7;

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
function drawStar(ctx, x, y, size, stellarClass, glowColor) {
  // Star colors by class
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
    const angle = i * Math.PI / 2 + systemMapState.time * 0.1;
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
function drawOrbitPath(ctx, centerX, centerY, radius) {
  ctx.strokeStyle = systemMapState.colors.orbitPath;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 10]);

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius, radius * 0.6, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);
}

/**
 * Draw a planet
 * @param {string} type - 'rocky', 'gas', 'ice', 'habitable'
 */
function drawPlanet(ctx, x, y, size, type) {
  const colors = {
    rocky: ['#8b7355', '#6b5344', '#5a4535'],
    gas: ['#d4a574', '#c49464', '#b48454', '#e8c4a0'],
    ice: ['#a8c8dc', '#88a8bc', '#c8e8fc'],
    habitable: ['#4a7c59', '#3a6c49', '#2a5c39', '#5a8c69']
  };

  const palette = colors[type] || colors.rocky;

  // Planet sphere with shading
  const gradient = ctx.createRadialGradient(
    x - size * 0.3, y - size * 0.3, 0,
    x, y, size
  );
  gradient.addColorStop(0, palette[palette.length - 1] || palette[0]);
  gradient.addColorStop(0.5, palette[0]);
  gradient.addColorStop(1, palette[1] || palette[0]);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();

  // Atmosphere glow for habitable worlds
  if (type === 'habitable') {
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, size + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Rings for gas giants (50% chance, larger ones)
  if (type === 'gas' && size > 8) {
    drawRings(ctx, x, y, size);
  }
}

/**
 * Draw planetary rings
 */
function drawRings(ctx, x, y, planetSize) {
  const innerRadius = planetSize * 1.3;
  const outerRadius = planetSize * 2;

  ctx.strokeStyle = 'rgba(200, 180, 150, 0.5)';
  ctx.lineWidth = (outerRadius - innerRadius) * 0.4;

  ctx.beginPath();
  ctx.ellipse(x, y, (innerRadius + outerRadius) / 2, (innerRadius + outerRadius) / 2 * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Draw the full star system
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} centerX - Center X position
 * @param {number} centerY - Center Y position
 * @param {number} zoom - Current zoom level
 * @param {Object} system - System data from generateSystem
 */
function drawFullSystem(ctx, centerX, centerY, zoom, system) {
  const auToPixels = systemMapState.AU_TO_PIXELS * zoom;

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

  // Draw orbit paths
  for (const planet of system.planets) {
    const orbitRadius = planet.orbitAU * auToPixels;
    drawOrbitPath(ctx, centerX, centerY, orbitRadius);
  }

  // Draw planets
  for (const planet of system.planets) {
    const orbitRadius = planet.orbitAU * auToPixels;
    // Calculate position based on time (orbit animation)
    const orbitSpeed = 0.1 / Math.sqrt(planet.orbitAU); // Slower for outer planets
    const angle = systemMapState.time * orbitSpeed;
    const planetX = centerX + Math.cos(angle) * orbitRadius;
    const planetY = centerY + Math.sin(angle) * orbitRadius * 0.6; // Isometric ellipse

    // Size scales with zoom but has min/max for visibility
    const planetSize = Math.max(3, Math.min(50, (planet.size / 5000) * zoom * 2));

    drawPlanet(ctx, planetX, planetY, planetSize, planet.type);

    // Draw planet label at higher zoom
    if (zoom > 0.5 && planetSize > 5) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(planet.name, planetX, planetY + planetSize + 12);
    }

    // Draw moons at high zoom
    if (zoom > 2 && planet.moons.length > 0) {
      drawMoons(ctx, planetX, planetY, planet, zoom);
    }
  }
}

/**
 * Draw asteroid belt
 */
function drawAsteroidBelt(ctx, centerX, centerY, belt, auToPixels) {
  const innerRadius = belt.innerRadius * auToPixels;
  const outerRadius = belt.outerRadius * auToPixels;

  // Belt zone as gradient
  ctx.strokeStyle = `rgba(120, 100, 80, ${belt.density * 0.3})`;
  ctx.lineWidth = outerRadius - innerRadius;
  ctx.setLineDash([2, 4]);

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, (innerRadius + outerRadius) / 2, (innerRadius + outerRadius) / 2 * 0.6, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);

  // Scattered asteroids
  const asteroidCount = 30;
  ctx.fillStyle = 'rgba(150, 130, 110, 0.6)';
  for (let i = 0; i < asteroidCount; i++) {
    const r = innerRadius + (i * 7919) % (outerRadius - innerRadius);
    const angle = (i * 104729) % 360 * Math.PI / 180 + systemMapState.time * 0.01;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r * 0.6;
    const size = 1 + (i % 3);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw moons around a planet
 */
function drawMoons(ctx, planetX, planetY, planet, zoom) {
  for (let i = 0; i < planet.moons.length; i++) {
    const moon = planet.moons[i];
    const moonOrbitRadius = Math.max(15, (moon.orbitRadius / 50000) * zoom);
    const moonAngle = systemMapState.time * 2 + i * Math.PI / 3;
    const moonX = planetX + Math.cos(moonAngle) * moonOrbitRadius;
    const moonY = planetY + Math.sin(moonAngle) * moonOrbitRadius * 0.6;
    const moonSize = Math.max(2, (moon.size / 2000) * zoom);

    // Moon orbit path
    ctx.strokeStyle = 'rgba(100, 100, 120, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.ellipse(planetX, planetY, moonOrbitRadius, moonOrbitRadius * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Moon
    ctx.fillStyle = systemMapState.colors.moon;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw zoom indicator
 */
function drawZoomIndicator(ctx, width, height, zoom) {
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
 * Load a star system for display
 * @param {Object} systemData - System data object
 */
function loadSystem(systemData) {
  systemMapState.system = systemData;
  // Reset view
  systemMapState.zoom = 1;
  systemMapState.offsetX = 0;
  systemMapState.offsetY = 0;
  console.log('[SystemMap] Loaded system:', systemData?.name || 'Unknown');
}

/**
 * Clean up the system map
 */
function destroySystemMap() {
  stopRenderLoop();

  if (systemMapState.canvas) {
    systemMapState.canvas.remove();
    systemMapState.canvas = null;
    systemMapState.ctx = null;
  }

  window.removeEventListener('resize', resizeCanvas);
  console.log('[SystemMap] Destroyed');
}

// ==================== Procedural Generation ====================

/**
 * Generate a star system from UWP and stellar data
 * @param {string} name - System name
 * @param {string} uwp - UWP code (e.g., "A788899-C")
 * @param {string} stellarClass - Stellar classification (e.g., "G2 V")
 * @param {string} hex - Hex location for seeding
 * @returns {Object} Generated system data
 */
function generateSystem(name, uwp = 'X000000-0', stellarClass = 'G2 V', hex = '0000') {
  // Seed random from hex for consistency
  const seed = parseInt(hex, 16) || 12345;
  const rng = seededRandom(seed);

  // Parse stellar class
  const stars = parseStars(stellarClass, rng);

  // Parse UWP for mainworld hints
  const mainworldSize = parseInt(uwp[1], 16) || 5;
  const mainworldAtmo = parseInt(uwp[2], 16) || 5;
  const mainworldHydro = parseInt(uwp[3], 16) || 5;

  // Generate planets
  const planets = generatePlanets(rng, stars[0], mainworldSize, mainworldAtmo, mainworldHydro);

  // Generate asteroid belt (30% chance)
  const asteroidBelts = [];
  if (rng() < 0.3) {
    const beltAU = 2.0 + rng() * 2.0; // 2-4 AU typical
    asteroidBelts.push({
      innerRadius: beltAU * 0.8,
      outerRadius: beltAU * 1.2,
      density: 0.3 + rng() * 0.4
    });
  }

  return {
    name,
    uwp,
    stellarClass,
    hex,
    stars,
    planets,
    asteroidBelts,
    generated: true
  };
}

/**
 * Seeded random number generator
 */
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Parse stellar classification into star objects
 */
function parseStars(stellarClass, rng) {
  const stars = [];
  const parts = stellarClass.split(/\s+/);

  // Primary star
  const primary = parts[0] || 'G2';
  const luminosity = parts[1] || 'V';

  stars.push({
    type: primary[0] || 'G',
    subtype: parseInt(primary.slice(1)) || 2,
    luminosity,
    radius: getStarRadius(primary[0], luminosity),
    color: getStarColor(primary[0]),
    position: { x: 0, y: 0 }
  });

  // Check for binary/trinary (simplified)
  if (parts.length > 2 || stellarClass.includes('+')) {
    const secondaryType = parts[2]?.[0] || (rng() < 0.5 ? 'K' : 'M');
    stars.push({
      type: secondaryType,
      subtype: Math.floor(rng() * 9),
      luminosity: 'V',
      radius: getStarRadius(secondaryType, 'V') * 0.8,
      color: getStarColor(secondaryType),
      position: { x: 0.5, y: 0.3 } // AU from primary
    });
  }

  return stars;
}

/**
 * Get star radius based on type and luminosity
 */
function getStarRadius(type, luminosity) {
  const baseRadius = {
    O: 15, B: 8, A: 2.5, F: 1.4, G: 1.0, K: 0.8, M: 0.5, L: 0.2, T: 0.1, D: 0.01
  };
  const lumMultiplier = {
    Ia: 100, Ib: 50, II: 25, III: 10, IV: 3, V: 1, VI: 0.5, D: 0.01
  };
  return (baseRadius[type] || 1) * (lumMultiplier[luminosity] || 1);
}

/**
 * Get star color for rendering
 */
function getStarColor(type) {
  const colors = {
    O: '#9bb0ff', B: '#aabfff', A: '#cad7ff', F: '#f8f7ff',
    G: '#fff4ea', K: '#ffd2a1', M: '#ffcc6f', L: '#ff6633',
    T: '#cc3300', D: '#ffffff'
  };
  return colors[type] || colors.G;
}

/**
 * Generate planets for a system
 */
function generatePlanets(rng, primaryStar, mainSize, mainAtmo, mainHydro) {
  const planets = [];
  const planetCount = 3 + Math.floor(rng() * 6); // 3-8 planets

  // Habitable zone based on star type
  const habZone = getHabitableZone(primaryStar.type);

  // Mainworld position (in habitable zone if atmosphere permits)
  const mainworldAU = (mainAtmo >= 4 && mainAtmo <= 9)
    ? habZone.inner + rng() * (habZone.outer - habZone.inner)
    : 0.3 + rng() * 0.7; // Inner system if not habitable

  // Generate orbit slots
  const orbits = generateOrbits(rng, planetCount, mainworldAU);

  for (let i = 0; i < planetCount; i++) {
    const au = orbits[i];
    const isMainworld = Math.abs(au - mainworldAU) < 0.1;

    let type, size;
    if (isMainworld) {
      type = mainAtmo >= 4 && mainAtmo <= 9 ? 'habitable' : 'rocky';
      size = 2000 + mainSize * 1000; // km
    } else if (au > 3.0) {
      // Outer system - gas giants or ice
      type = rng() < 0.6 ? 'gas' : 'ice';
      size = type === 'gas' ? 30000 + rng() * 100000 : 5000 + rng() * 15000;
    } else {
      // Inner system - rocky
      type = 'rocky';
      size = 2000 + rng() * 8000;
    }

    const planet = {
      id: `planet_${i}`,
      name: isMainworld ? 'Mainworld' : `Planet ${i + 1}`,
      type,
      orbitAU: au,
      orbitPeriod: Math.sqrt(au * au * au) * 365, // Kepler's 3rd law (days)
      size, // km diameter
      isMainworld,
      hasRings: type === 'gas' && rng() < 0.4,
      moons: []
    };

    // Generate moons for larger planets
    if (size > 10000) {
      const moonCount = Math.floor(rng() * 5);
      for (let m = 0; m < moonCount; m++) {
        planet.moons.push({
          id: `moon_${i}_${m}`,
          name: `${planet.name} ${String.fromCharCode(97 + m)}`,
          size: 500 + rng() * 3000,
          orbitRadius: (m + 1) * 50000 + rng() * 100000 // km
        });
      }
    }

    planets.push(planet);
  }

  // Sort by orbit
  planets.sort((a, b) => a.orbitAU - b.orbitAU);

  return planets;
}

/**
 * Get habitable zone range for star type
 */
function getHabitableZone(starType) {
  const zones = {
    O: { inner: 50, outer: 200 },
    B: { inner: 10, outer: 50 },
    A: { inner: 2, outer: 5 },
    F: { inner: 1.2, outer: 2.5 },
    G: { inner: 0.9, outer: 1.5 },
    K: { inner: 0.5, outer: 0.9 },
    M: { inner: 0.1, outer: 0.4 }
  };
  return zones[starType] || zones.G;
}

/**
 * Generate orbital distances
 */
function generateOrbits(rng, count, mainworldAU) {
  const orbits = [mainworldAU];

  // Titius-Bode-like progression
  let au = 0.2;
  for (let i = 0; i < count - 1; i++) {
    au = au * (1.4 + rng() * 0.6);
    if (Math.abs(au - mainworldAU) > 0.2) {
      orbits.push(au);
    }
  }

  return orbits.slice(0, count).sort((a, b) => a - b);
}

// ==================== Test Systems ====================

/**
 * Pre-defined test systems from Spinward Marches
 * Real data from TravellerMap API
 */
const TEST_SYSTEMS = {
  dorannia: {
    name: 'Dorannia',
    hex: '0530',
    uwp: 'E42158A-8',
    stellarClass: 'K4 V',
    tradeCodes: 'He Ni Po'
  },
  flammarion: {
    name: 'Flammarion',
    hex: '0930',
    uwp: 'A623514-B',
    stellarClass: 'F8 V',
    tradeCodes: 'Ni Po'
  },
  caladbolg: {
    name: 'Caladbolg',
    hex: '1329',
    uwp: 'B565776-A',
    stellarClass: 'F7 V M0 V M4 V', // Trinary system!
    tradeCodes: 'Ag Ri'
  }
};

/**
 * Load a test system by name
 */
function loadTestSystem(systemKey) {
  const testData = TEST_SYSTEMS[systemKey.toLowerCase()];
  if (!testData) {
    console.warn(`[SystemMap] Unknown test system: ${systemKey}`);
    return null;
  }

  const system = generateSystem(
    testData.name,
    testData.uwp,
    testData.stellarClass,
    testData.hex
  );

  systemMapState.system = system;
  systemMapState.zoom = 1;
  systemMapState.offsetX = 0;
  systemMapState.offsetY = 0;

  console.log(`[SystemMap] Loaded test system: ${testData.name}`, system);
  return system;
}

// ==================== Time Controls ====================

/**
 * Time control state - extends systemMapState
 */
systemMapState.timeSpeed = 1;        // Multiplier: 1 = real time, 10 = 10x faster
systemMapState.paused = false;       // Pause orbital animation
systemMapState.simulatedDate = 0;    // Days since epoch

/**
 * Pause/resume orbital animation
 */
function togglePause() {
  systemMapState.paused = !systemMapState.paused;
  console.log(`[SystemMap] ${systemMapState.paused ? 'Paused' : 'Resumed'}`);
  return systemMapState.paused;
}

/**
 * Set time speed multiplier
 * @param {number} speed - 0.1 to 100
 */
function setTimeSpeed(speed) {
  systemMapState.timeSpeed = Math.max(0.1, Math.min(100, speed));
  console.log(`[SystemMap] Time speed: ${systemMapState.timeSpeed}x`);
}

/**
 * Jump forward in time
 * @param {number} days - Days to advance
 */
function advanceTime(days) {
  systemMapState.simulatedDate += days;
  // Convert days to animation time units
  systemMapState.time += days * 0.1; // 0.1 time units per day for smooth animation
  console.log(`[SystemMap] Advanced ${days} days (total: ${Math.round(systemMapState.simulatedDate)} days)`);
}

/**
 * Jump backward in time
 * @param {number} days - Days to go back
 */
function rewindTime(days) {
  systemMapState.simulatedDate -= days;
  systemMapState.time -= days * 0.1;
  if (systemMapState.time < 0) systemMapState.time = 0;
  console.log(`[SystemMap] Rewound ${days} days (total: ${Math.round(systemMapState.simulatedDate)} days)`);
}

/**
 * Reset time to epoch
 */
function resetTime() {
  systemMapState.simulatedDate = 0;
  systemMapState.time = 0;
  console.log('[SystemMap] Time reset to epoch');
}

// Export for ES modules
export {
  initSystemMap,
  loadSystem,
  destroySystemMap,
  systemMapState,
  generateSystem,
  // Test systems
  TEST_SYSTEMS,
  loadTestSystem,
  // Time controls
  togglePause,
  setTimeSpeed,
  advanceTime,
  rewindTime,
  resetTime
};

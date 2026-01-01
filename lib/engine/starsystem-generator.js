/**
 * Star System Generator
 *
 * Generates realistic star system objects based on 2024-2025 astrophysics research.
 * Uses Kepler/TESS data for planet counts, debris belt frequencies, etc.
 *
 * @module lib/engine/starsystem-generator
 * @see AR-240
 */

/**
 * Celestial object types (extends existing schema)
 * Slots 10-19 reserved for new types per schema-notes.md
 */
const CELESTIAL_TYPES = {
  // Existing types (0-9)
  PLANET: 'Planet',
  MOON: 'Moon',
  STATION: 'Station',
  GAS_GIANT: 'Gas Giant',
  ASTEROID_BELT: 'Asteroid Belt',

  // New types (10-19) - AR-240
  DEBRIS_FIELD: 'Debris Field',    // Inner asteroid belt analog
  KUIPER_BELT: 'Kuiper Belt',      // Outer icy belt
  TROJAN_CLUSTER: 'Trojan Cluster', // L4/L5 populations
  BROWN_DWARF: 'Brown Dwarf',      // Failed star companion
  COMET: 'Comet'                   // Individual comet
};

/**
 * Stellar type classifications
 */
const STELLAR_TYPES = {
  O: { temp: '>30000K', color: 'blue', planetMod: -3 },
  B: { temp: '10000-30000K', color: 'blue-white', planetMod: -2 },
  A: { temp: '7500-10000K', color: 'white', planetMod: -2 },
  F: { temp: '6000-7500K', color: 'yellow-white', planetMod: -1 },
  G: { temp: '5200-6000K', color: 'yellow', planetMod: 0 },  // Sol-like
  K: { temp: '3700-5200K', color: 'orange', planetMod: +1 },
  M: { temp: '<3700K', color: 'red', planetMod: +1 },
  L: { temp: '<2400K', color: 'brown-red', planetMod: 0 },   // Brown dwarf
  T: { temp: '<1300K', color: 'magenta', planetMod: 0 },     // Cool brown dwarf
  Y: { temp: '<500K', color: 'dark', planetMod: 0 }          // Ultra-cool
};

/**
 * Planet count table (2d6 roll)
 * Based on Kepler mission completeness-corrected data
 */
const PLANET_COUNT_TABLE = {
  2: 1, 3: 1,           // Sparse
  4: 2, 5: 3,           // Below average
  6: 4, 7: 4, 8: 5,     // Typical
  9: 6, 10: 7,          // Rich
  11: 8, 12: 10         // Very rich (Sol-like)
};

class StarSystemGenerator {
  /**
   * Create generator
   * @param {Object} options
   * @param {Function} options.rng - Random number generator (0-1), default Math.random
   * @param {string} options.seed - Optional seed for reproducible generation
   */
  constructor(options = {}) {
    this.rng = options.rng || Math.random.bind(Math);
    this.seed = options.seed;

    // If seed provided, create seeded RNG
    if (this.seed) {
      this.rng = this.createSeededRng(this.seed);
    }
  }

  /**
   * Create seeded random number generator
   * Simple mulberry32 PRNG
   */
  createSeededRng(seed) {
    // Convert string seed to number
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }

    return () => {
      h |= 0;
      h = h + 0x6D2B79F5 | 0;
      let t = Math.imul(h ^ h >>> 15, 1 | h);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /**
   * Roll dice
   */
  roll(sides) {
    return Math.floor(this.rng() * sides) + 1;
  }

  roll2d6() {
    return this.roll(6) + this.roll(6);
  }

  rollPercent() {
    return Math.floor(this.rng() * 100) + 1;
  }

  /**
   * Main generation pipeline
   * @param {string} stellarType - Primary star type (e.g., 'G2', 'M5')
   * @param {Object} options - Generation options
   * @returns {Object} Generated system data
   */
  generate(stellarType = 'G2', options = {}) {
    const primaryType = stellarType.charAt(0).toUpperCase();

    const system = {
      stellarType,
      primaryType,
      companions: [],
      planets: [],
      belts: [],
      features: {
        oortCloud: true,        // Assume present in all systems
        cometaryPopulation: true,
        zodiacalDust: true
      },
      generated: new Date().toISOString()
    };

    // Check for stellar companion first (affects stability)
    system.companions = this.rollStellarCompanion(primaryType);
    const isBinary = system.companions.some(c => c.type === 'stellar');

    // Generate planet count
    const planetCount = this.rollPlanetCount(primaryType, isBinary);
    system.planets = this.generatePlanets(planetCount, primaryType, options);

    // Gas giant dependent features
    const gasGiants = system.planets.filter(p => p.type === CELESTIAL_TYPES.GAS_GIANT);
    if (gasGiants.length > 0) {
      system.trojans = this.generateTrojanPopulations(gasGiants);
    }

    // Debris belts
    system.belts = this.generateDebrisBelts(system.planets);

    // Rare: brown dwarf companion (1%)
    if (this.rollPercent() <= 1) {
      system.companions.push(this.generateBrownDwarf());
    }

    return system;
  }

  /**
   * Roll planet count based on stellar type
   * @param {string} stellarType - Single letter (G, K, M, etc.)
   * @param {boolean} isBinary - Whether system is binary
   * @returns {number} Number of planets
   */
  rollPlanetCount(stellarType, isBinary = false) {
    let roll = this.roll2d6();

    // Apply modifiers based on astrophysics research
    const typeInfo = STELLAR_TYPES[stellarType];
    if (typeInfo) {
      roll += typeInfo.planetMod;
    }

    // Binary systems have fewer stable orbits
    if (isBinary) {
      roll -= 1;
    }

    // Clamp to table range
    roll = Math.max(2, Math.min(12, roll));

    return PLANET_COUNT_TABLE[roll] || 4;
  }

  /**
   * Generate planets for the system
   * @param {number} count - Number of planets
   * @param {string} stellarType - Star type
   * @param {Object} options - Options including habitableZoneAU
   * @returns {Array} Planet objects
   */
  generatePlanets(count, stellarType, options = {}) {
    const planets = [];
    const habZoneInner = options.habitableZoneInnerAU || 0.8;
    const habZoneOuter = options.habitableZoneOuterAU || 1.5;

    // Orbital spacing follows Titius-Bode-like pattern
    let currentOrbit = 0.3 + this.rng() * 0.2;  // Start 0.3-0.5 AU

    for (let i = 0; i < count; i++) {
      const isGasGiant = i >= 2 && this.rollPercent() <= 40;  // Gas giants beyond frost line

      const planet = {
        type: isGasGiant ? CELESTIAL_TYPES.GAS_GIANT : CELESTIAL_TYPES.PLANET,
        orbitAU: currentOrbit,
        index: i + 1,
        name: `Planet ${i + 1}`
      };

      // Gas giants are larger
      if (isGasGiant) {
        planet.radiusKm = 20000 + this.roll(6) * 10000;  // 20000-80000 km
        planet.mass = 50 + this.roll(6) * 50;  // Jupiter masses (relative)
      } else {
        planet.radiusKm = 2000 + this.roll(6) * 2000;  // 2000-14000 km
        planet.mass = 0.1 + this.rng() * 2;  // Earth masses (relative)
      }

      // Check if in habitable zone (skip if inhabited world present)
      const inHabZone = currentOrbit >= habZoneInner && currentOrbit <= habZoneOuter;
      if (inHabZone && options.skipHabitableZone) {
        // Move orbit outside hab zone
        currentOrbit = habZoneOuter + 0.5 + this.rng() * 0.5;
        planet.orbitAU = currentOrbit;
      }

      planets.push(planet);

      // Next orbit (Titius-Bode spacing: roughly doubles)
      currentOrbit = currentOrbit * (1.4 + this.rng() * 0.8);
    }

    return planets;
  }

  /**
   * Roll for stellar companion(s)
   * ~50% of stars are in binary/multiple systems
   * @returns {Array} Companion objects
   */
  rollStellarCompanion(primaryType) {
    const companions = [];

    // 50% chance of stellar companion
    if (this.rollPercent() <= 50) {
      companions.push({
        type: 'stellar',
        stellarType: this.rollCompanionType(primaryType),
        separationAU: this.rollSeparation()
      });

      // 10% of binaries are triples
      if (this.rollPercent() <= 10) {
        companions.push({
          type: 'stellar',
          stellarType: this.rollCompanionType(primaryType),
          separationAU: this.rollSeparation() * 2  // Further out
        });
      }
    }

    return companions;
  }

  /**
   * Roll companion stellar type
   * Companions are usually similar or cooler than primary
   */
  rollCompanionType(primaryType) {
    const types = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
    const primaryIndex = types.indexOf(primaryType);
    if (primaryIndex === -1) return 'M';

    // Companion usually same or cooler (later type)
    const offset = Math.floor(this.rng() * 3);  // 0-2 steps cooler
    const companionIndex = Math.min(types.length - 1, primaryIndex + offset);

    return types[companionIndex] + this.roll(9);  // e.g., "K4"
  }

  /**
   * Roll separation for binary
   */
  rollSeparation() {
    // Log-uniform distribution from 0.1 AU to 1000 AU
    const logMin = Math.log(0.1);
    const logMax = Math.log(1000);
    return Math.exp(logMin + this.rng() * (logMax - logMin));
  }

  /**
   * Generate debris belts
   * @param {Array} planets - Existing planets
   * @returns {Array} Belt objects
   */
  generateDebrisBelts(planets) {
    const belts = [];

    // Find gas giant positions to place belts appropriately
    const gasGiantOrbits = planets
      .filter(p => p.type === CELESTIAL_TYPES.GAS_GIANT)
      .map(p => p.orbitAU)
      .sort((a, b) => a - b);

    const outermostOrbit = planets.length > 0
      ? Math.max(...planets.map(p => p.orbitAU))
      : 5;

    // Inner debris belt (asteroid analog): 20-30%
    if (this.rollPercent() <= 25) {
      // Place between inner rocky planets and first gas giant
      const innerBeltOrbit = gasGiantOrbits.length > 0
        ? gasGiantOrbits[0] * 0.6  // Inside first gas giant
        : 2.5 + this.rng() * 1.5;  // Default 2.5-4 AU

      belts.push({
        type: CELESTIAL_TYPES.DEBRIS_FIELD,
        name: 'Inner Belt',
        orbitAU: innerBeltOrbit,
        widthAU: 0.5 + this.rng() * 0.5,
        density: 'moderate'
      });
    }

    // Outer icy belt (Kuiper analog): 15-20%
    if (this.rollPercent() <= 17) {
      const outerBeltOrbit = outermostOrbit * (1.5 + this.rng() * 1.5);

      belts.push({
        type: CELESTIAL_TYPES.KUIPER_BELT,
        name: 'Outer Belt',
        orbitAU: outerBeltOrbit,
        widthAU: outerBeltOrbit * 0.3,  // ~30% of orbital radius
        density: 'sparse'
      });
    }

    return belts;
  }

  /**
   * Generate Trojan populations at L4/L5 of gas giants
   * @param {Array} gasGiants - Gas giant planets
   * @returns {Array} Trojan cluster objects
   */
  generateTrojanPopulations(gasGiants) {
    const trojans = [];

    for (const giant of gasGiants) {
      // Not all gas giants have significant trojans
      if (this.rollPercent() <= 40) {
        trojans.push({
          type: CELESTIAL_TYPES.TROJAN_CLUSTER,
          parentPlanet: giant.name,
          orbitAU: giant.orbitAU,
          lagrangePoint: 'L4',
          population: this.roll(6) * 1000  // Thousands of objects
        });

        trojans.push({
          type: CELESTIAL_TYPES.TROJAN_CLUSTER,
          parentPlanet: giant.name,
          orbitAU: giant.orbitAU,
          lagrangePoint: 'L5',
          population: this.roll(6) * 1000
        });
      }
    }

    return trojans;
  }

  /**
   * Generate brown dwarf companion (very rare: ~1%)
   * @returns {Object} Brown dwarf data
   */
  generateBrownDwarf() {
    // Mass: 13-80 Jupiter masses (brown dwarf range)
    const mass = 13 + this.roll(6) * 10 + this.rng() * 10;

    // Subtype based on temperature
    let subtype;
    if (mass > 60) {
      subtype = 'L';  // Hotter
    } else if (mass > 30) {
      subtype = 'T';  // Cooler
    } else {
      subtype = 'Y';  // Very cool
    }

    return {
      type: 'brown_dwarf',
      stellarType: subtype + this.roll(9),
      massJupiter: Math.round(mass * 10) / 10,
      separationAU: 10 + this.rng() * 500,  // Usually far out
      temperature: subtype === 'L' ? 1500 : subtype === 'T' ? 800 : 350
    };
  }

  /**
   * Generate a complete system for a hex/world
   * Uses hex coordinate as seed for reproducibility
   * @param {string} hexId - Hex coordinate (e.g., "0101")
   * @param {string} stellarType - Star type from sector data
   * @param {Object} existingData - Existing world data (to avoid conflicts)
   * @returns {Object} Generated system objects
   */
  generateForHex(hexId, stellarType, existingData = {}) {
    // Use hex as seed for reproducibility
    this.rng = this.createSeededRng(hexId);

    // Generate base system
    const system = this.generate(stellarType, {
      skipHabitableZone: !!existingData.mainWorld,
      habitableZoneInnerAU: existingData.habitableZoneInnerAU,
      habitableZoneOuterAU: existingData.habitableZoneOuterAU
    });

    return system;
  }
}

module.exports = {
  StarSystemGenerator,
  CELESTIAL_TYPES,
  STELLAR_TYPES,
  PLANET_COUNT_TABLE
};

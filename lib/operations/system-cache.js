/**
 * AR-28: System Cache Service
 * Lazy-loads TravellerMap data for systems near current location
 *
 * Design:
 * - NO auto-fetch on startup
 * - GM must trigger via "Start Caching" button
 * - Rate-limited: 1 request per config.cache.delaySeconds
 * - Prioritizes closest systems first
 * - Stops after config.cache.maxDurationMinutes
 */

const { db, generateId } = require('./database');
const config = require('../../config');

// Cache worker state (not persisted)
let cacheWorker = {
  running: false,
  queue: [],
  processed: 0,
  total: 0,
  startTime: null,
  intervalId: null,
  currentSector: null,
  currentHex: null
};

// AR-37: Cache statistics for performance monitoring
let cacheStats = {
  hits: 0,
  misses: 0,
  requests: 0,
  lastReset: Date.now()
};

/**
 * Get cache hit/miss statistics
 * @returns {Object} Cache hit/miss stats
 */
function getCacheHitStats() {
  const hitRate = cacheStats.requests > 0
    ? ((cacheStats.hits / cacheStats.requests) * 100).toFixed(1)
    : 0;
  return {
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    requests: cacheStats.requests,
    hitRate: `${hitRate}%`,
    uptime: Math.round((Date.now() - cacheStats.lastReset) / 1000)
  };
}

/**
 * Reset cache statistics
 */
function resetCacheStats() {
  cacheStats = { hits: 0, misses: 0, requests: 0, lastReset: Date.now() };
}

/**
 * Calculate hex distance between two hexes
 * Uses offset coordinates (col, row)
 */
function hexDistance(hex1, hex2) {
  // Parse hex strings (e.g., "1815" -> col=18, row=15)
  const col1 = parseInt(hex1.substring(0, 2));
  const row1 = parseInt(hex1.substring(2, 4));
  const col2 = parseInt(hex2.substring(0, 2));
  const row2 = parseInt(hex2.substring(2, 4));

  // Convert offset to cube coordinates
  const x1 = col1 - Math.floor(row1 / 2);
  const z1 = row1;
  const y1 = -x1 - z1;

  const x2 = col2 - Math.floor(row2 / 2);
  const z2 = row2;
  const y2 = -x2 - z2;

  // Cube distance
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2), Math.abs(z1 - z2));
}

/**
 * Get cached system data (tracks hit/miss stats)
 */
function getCachedSystem(sector, hex) {
  try {
    cacheStats.requests++;
    const stmt = db.prepare(`
      SELECT * FROM system_cache
      WHERE sector = ? AND hex = ?
    `);
    const result = stmt.get(sector, hex);
    if (result) {
      cacheStats.hits++;
    } else {
      cacheStats.misses++;
    }
    return result;
  } catch (err) {
    cacheStats.misses++;
    console.error('[CACHE] Error getting cached system:', err.message);
    return null;
  }
}

/**
 * Get all cached systems for a sector
 */
function getCachedSystems(sector) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM system_cache
      WHERE sector = ?
      ORDER BY hex
    `);
    return stmt.all(sector);
  } catch (err) {
    console.error('[CACHE] Error getting cached systems:', err.message);
    return [];
  }
}

/**
 * Store system data in cache
 */
function cacheSystem(sector, systemData) {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO system_cache
      (id, sector, hex, name, uwp, trade_codes, population, tech_level,
       starport, bases, zone, pbg, allegiance, stellar, remarks, cached_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const id = `${sector}:${systemData.hex}`;
    stmt.run(
      id,
      sector,
      systemData.hex,
      systemData.name,
      systemData.uwp,
      systemData.tradeCodes || systemData.trade_codes,
      systemData.population,
      systemData.techLevel || systemData.tech_level,
      systemData.starport,
      systemData.bases,
      systemData.zone,
      systemData.pbg,
      systemData.allegiance,
      systemData.stellar,
      systemData.remarks
    );

    return true;
  } catch (err) {
    console.error('[CACHE] Error caching system:', err.message);
    return false;
  }
}

/**
 * Check if system is cached and fresh
 */
function isCached(sector, hex) {
  const system = getCachedSystem(sector, hex);
  if (!system) return false;

  // Check TTL
  const cachedAt = new Date(system.cached_at);
  const ttlMs = config.cache.ttlDays * 24 * 60 * 60 * 1000;
  return (Date.now() - cachedAt.getTime()) < ttlMs;
}

/**
 * Parse TravellerMap SEC format line
 */
function parseSecLine(line) {
  if (!line || line.startsWith('#') || line.trim().length < 40) return null;

  try {
    // SEC format: Name (14) Hex (4) UWP (9) Bases (1) Codes (15) Zone (1) PBG (3) Allegiance (4) Stellar
    const name = line.substring(0, 14).trim();
    const hex = line.substring(14, 18).trim();
    const uwp = line.substring(19, 28).trim();
    const bases = line.substring(29, 30).trim();
    const tradeCodes = line.substring(31, 46).trim();
    const zone = line.substring(47, 48).trim();
    const pbg = line.substring(49, 52).trim();
    const allegiance = line.substring(53, 57).trim();
    const stellar = line.substring(58).trim();

    // Extract starport and tech level from UWP
    const starport = uwp.charAt(0);
    const techLevel = parseInt(uwp.charAt(8), 16) || 0;

    return {
      name,
      hex,
      uwp,
      starport,
      techLevel,
      bases,
      tradeCodes,
      zone: zone === '-' ? '' : zone,
      pbg,
      allegiance,
      stellar
    };
  } catch (err) {
    return null;
  }
}

/**
 * Fetch sector data from TravellerMap
 */
async function fetchSectorData(sector) {
  const url = `https://travellermap.com/api/sec?sector=${encodeURIComponent(sector)}&type=SecondSurvey`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\n');
    const systems = [];

    for (const line of lines) {
      const system = parseSecLine(line);
      if (system) {
        systems.push(system);
      }
    }

    return systems;
  } catch (err) {
    console.error(`[CACHE] Error fetching sector ${sector}:`, err.message);
    return [];
  }
}

/**
 * Get cache worker status
 */
function getCacheStatus() {
  return {
    running: cacheWorker.running,
    processed: cacheWorker.processed,
    total: cacheWorker.total,
    remaining: cacheWorker.queue.length,
    sector: cacheWorker.currentSector,
    hex: cacheWorker.currentHex,
    elapsed: cacheWorker.startTime
      ? Math.floor((Date.now() - cacheWorker.startTime) / 1000)
      : 0
  };
}

/**
 * Start cache worker
 * @param {string} sector - Sector name (e.g., "Spinward Marches")
 * @param {string} currentHex - Current location hex (e.g., "1815")
 * @param {function} onProgress - Callback for progress updates
 */
async function startCaching(sector, currentHex, onProgress) {
  if (cacheWorker.running) {
    return { success: false, message: 'Cache worker already running' };
  }

  if (!config.cache.enabled) {
    return { success: false, message: 'Caching disabled in config' };
  }

  console.log(`[CACHE] Starting cache for ${sector} from hex ${currentHex}`);

  // Fetch sector data
  const systems = await fetchSectorData(sector);
  if (systems.length === 0) {
    return { success: false, message: 'No systems found in sector' };
  }

  // Calculate distances and filter by radius
  const radius = config.cache.parsecRadius;
  const systemsWithDistance = systems
    .map(s => ({
      ...s,
      distance: hexDistance(currentHex, s.hex)
    }))
    .filter(s => s.distance <= radius)
    .filter(s => !isCached(sector, s.hex))  // Skip already cached
    .sort((a, b) => a.distance - b.distance);  // Closest first

  if (systemsWithDistance.length === 0) {
    return { success: true, message: 'All systems already cached' };
  }

  // Initialize worker
  cacheWorker = {
    running: true,
    queue: systemsWithDistance,
    processed: 0,
    total: systemsWithDistance.length,
    startTime: Date.now(),
    intervalId: null,
    currentSector: sector,
    currentHex: currentHex
  };

  // Start processing
  const delayMs = config.cache.delaySeconds * 1000;
  const maxMs = config.cache.maxDurationMinutes * 60 * 1000;

  cacheWorker.intervalId = setInterval(() => {
    // Check timeout
    const elapsed = Date.now() - cacheWorker.startTime;
    if (elapsed >= maxMs) {
      stopCaching('timeout');
      return;
    }

    // Check queue
    if (cacheWorker.queue.length === 0) {
      stopCaching('complete');
      return;
    }

    // Process next system
    const system = cacheWorker.queue.shift();
    cacheSystem(sector, system);
    cacheWorker.processed++;

    // Report progress
    if (onProgress) {
      onProgress({
        type: 'cached',
        system: system.name,
        hex: system.hex,
        distance: system.distance,
        processed: cacheWorker.processed,
        total: cacheWorker.total,
        remaining: cacheWorker.queue.length
      });
    }

    console.log(`[CACHE] Cached ${system.name} (${system.hex}) - ${cacheWorker.processed}/${cacheWorker.total}`);
  }, delayMs);

  return {
    success: true,
    message: `Caching ${systemsWithDistance.length} systems (${delayMs/1000}s delay)`,
    total: systemsWithDistance.length
  };
}

/**
 * Stop cache worker
 */
function stopCaching(reason = 'manual') {
  if (cacheWorker.intervalId) {
    clearInterval(cacheWorker.intervalId);
    cacheWorker.intervalId = null;
  }

  const status = getCacheStatus();
  cacheWorker.running = false;

  console.log(`[CACHE] Stopped: ${reason} - ${status.processed}/${status.total} cached`);

  return {
    success: true,
    reason,
    processed: status.processed,
    total: status.total
  };
}

/**
 * Clear cache for a sector
 */
function clearCache(sector) {
  try {
    if (sector) {
      const stmt = db.prepare('DELETE FROM system_cache WHERE sector = ?');
      const result = stmt.run(sector);
      return { deleted: result.changes };
    } else {
      const stmt = db.prepare('DELETE FROM system_cache');
      const result = stmt.run();
      return { deleted: result.changes };
    }
  } catch (err) {
    console.error('[CACHE] Error clearing cache:', err.message);
    return { deleted: 0, error: err.message };
  }
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  try {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM system_cache');
    const sectorStmt = db.prepare(`
      SELECT sector, COUNT(*) as count
      FROM system_cache
      GROUP BY sector
    `);

    return {
      total: countStmt.get().count,
      bySector: sectorStmt.all()
    };
  } catch (err) {
    return { total: 0, bySector: [], error: err.message };
  }
}

module.exports = {
  getCachedSystem,
  getCachedSystems,
  cacheSystem,
  isCached,
  hexDistance,
  fetchSectorData,
  parseSecLine,
  getCacheStatus,
  startCaching,
  stopCaching,
  clearCache,
  getCacheStats,
  getCacheHitStats,
  resetCacheStats
};

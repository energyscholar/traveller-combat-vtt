/**
 * TravellerMap Tile Proxy with Disk Cache
 *
 * Proxies tile requests to travellermap.com with:
 * - Disk-based caching (72h TTL)
 * - Rate limiting (polite to Joshua Bell's servers)
 * - Test fixture support (zero network in tests)
 * - User-configurable cache toggle
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Cache configuration
const config = {
  enabled: true,                    // Cache enabled by default
  ttlMs: 72 * 60 * 60 * 1000,      // 72 hours TTL
  cacheDir: path.join(process.cwd(), 'data', 'map-cache'),
  fixtureDir: path.join(process.cwd(), 'data', 'map-fixtures'),
  useFixtures: false,               // Fixtures only used if explicitly enabled
  baseUrl: 'https://travellermap.com',
  userAgent: 'TravellerCombatVTT/1.0 (polite-cache)',

  // Rate limiting
  maxRequestsPerMinute: 30,
  requestWindow: [],

  // Stats
  stats: {
    hits: 0,
    misses: 0,
    errors: 0,
    networkRequests: 0
  }
};

// Ensure cache directories exist
function ensureCacheDir() {
  if (!fs.existsSync(config.cacheDir)) {
    fs.mkdirSync(config.cacheDir, { recursive: true });
  }
  if (!fs.existsSync(config.fixtureDir)) {
    fs.mkdirSync(config.fixtureDir, { recursive: true });
  }
}

/**
 * Generate cache key from tile parameters
 */
function getCacheKey(params) {
  const normalized = {
    x: params.x,
    y: params.y,
    scale: params.scale || 64,
    options: params.options || '',
    style: params.style || ''
  };
  const hash = crypto.createHash('md5')
    .update(JSON.stringify(normalized))
    .digest('hex');
  return `tile_${hash}.png`;
}

/**
 * Get cache file path
 */
function getCachePath(key) {
  return path.join(config.cacheDir, key);
}

/**
 * Get fixture file path
 */
function getFixturePath(key) {
  return path.join(config.fixtureDir, key);
}

/**
 * Check if cached tile is still valid
 */
function isCacheValid(cachePath) {
  try {
    const stat = fs.statSync(cachePath);
    const age = Date.now() - stat.mtimeMs;
    return age < config.ttlMs;
  } catch {
    return false;
  }
}

/**
 * Check rate limit
 */
function canMakeRequest() {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window

  // Clean old requests
  config.requestWindow = config.requestWindow.filter(t => t > windowStart);

  return config.requestWindow.length < config.maxRequestsPerMinute;
}

/**
 * Record a request for rate limiting
 */
function recordRequest() {
  config.requestWindow.push(Date.now());
  config.stats.networkRequests++;
}

/**
 * Build TravellerMap tile URL
 */
function buildTileUrl(params) {
  const url = new URL('/api/tile', config.baseUrl);
  url.searchParams.set('x', params.x);
  url.searchParams.set('y', params.y);
  url.searchParams.set('scale', params.scale || 64);
  if (params.options) url.searchParams.set('options', params.options);
  if (params.style) url.searchParams.set('style', params.style);
  return url.toString();
}

/**
 * Fetch tile from TravellerMap with retry
 */
async function fetchTile(params) {
  if (!canMakeRequest()) {
    throw new Error('Rate limit exceeded');
  }

  const url = buildTileUrl(params);
  recordRequest();

  // Debug: Log network requests to TravellerMap
  console.log(`[TileProxy] 🌐 Network request to TravellerMap: x=${params.x}, y=${params.y}, scale=${params.scale || 64}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': config.userAgent
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`TravellerMap returned ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Get tile - from cache, fixture, or network
 * @param {Object} params - { x, y, scale, options, style }
 * @returns {Promise<{ data: Buffer, source: string, contentType: string }>}
 */
async function getTile(params) {
  ensureCacheDir();

  const key = getCacheKey(params);
  const cachePath = getCachePath(key);
  const fixturePath = getFixturePath(key);

  // 1. Check fixtures first (for testing)
  if (config.useFixtures && fs.existsSync(fixturePath)) {
    config.stats.hits++;
    return {
      data: fs.readFileSync(fixturePath),
      source: 'fixture',
      contentType: 'image/png'
    };
  }

  // 2. Check cache if enabled
  if (config.enabled && isCacheValid(cachePath)) {
    config.stats.hits++;
    return {
      data: fs.readFileSync(cachePath),
      source: 'cache',
      contentType: 'image/png'
    };
  }

  // 3. Fetch from network
  config.stats.misses++;

  try {
    const data = await fetchTile(params);

    // Save to cache if enabled
    if (config.enabled) {
      fs.writeFileSync(cachePath, data);
    }

    return {
      data,
      source: 'network',
      contentType: 'image/png'
    };
  } catch (error) {
    config.stats.errors++;

    // Fall back to stale cache if available
    if (fs.existsSync(cachePath)) {
      return {
        data: fs.readFileSync(cachePath),
        source: 'stale-cache',
        contentType: 'image/png'
      };
    }

    throw error;
  }
}

/**
 * Save a tile as a test fixture
 */
async function saveFixture(params) {
  ensureCacheDir();

  const key = getCacheKey(params);
  const fixturePath = getFixturePath(key);

  const data = await fetchTile(params);
  fs.writeFileSync(fixturePath, data);

  return { key, path: fixturePath, size: data.length };
}

/**
 * Enable/disable cache
 */
function setEnabled(enabled) {
  config.enabled = enabled;
}

/**
 * Check if cache is enabled
 */
function isEnabled() {
  return config.enabled;
}

/**
 * Enable fixture mode (for testing)
 */
function setFixtureMode(enabled) {
  config.useFixtures = enabled;
}

/**
 * Get cache stats
 */
function getStats() {
  return {
    ...config.stats,
    enabled: config.enabled,
    useFixtures: config.useFixtures,
    hitRate: config.stats.hits + config.stats.misses > 0
      ? (config.stats.hits / (config.stats.hits + config.stats.misses) * 100).toFixed(1) + '%'
      : 'N/A'
  };
}

/**
 * Clear cache
 */
function clearCache() {
  ensureCacheDir();
  const files = fs.readdirSync(config.cacheDir);
  for (const file of files) {
    if (file.startsWith('tile_')) {
      fs.unlinkSync(path.join(config.cacheDir, file));
    }
  }
  config.stats.hits = 0;
  config.stats.misses = 0;
  config.stats.errors = 0;
}

/**
 * Get cache size info
 */
function getCacheInfo() {
  ensureCacheDir();
  const files = fs.readdirSync(config.cacheDir).filter(f => f.startsWith('tile_'));
  let totalSize = 0;

  for (const file of files) {
    try {
      const stat = fs.statSync(path.join(config.cacheDir, file));
      totalSize += stat.size;
    } catch { /* ignore */ }
  }

  return {
    tileCount: files.length,
    totalSizeBytes: totalSize,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    cacheDir: config.cacheDir
  };
}

module.exports = {
  getTile,
  saveFixture,
  setEnabled,
  isEnabled,
  setFixtureMode,
  getStats,
  clearCache,
  getCacheInfo,
  getCacheKey,
  buildTileUrl
};

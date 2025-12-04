/**
 * AR-27: TravellerMap Cache System (STUB)
 *
 * This module provides a caching interface for TravellerMap tile data.
 * Currently a stub implementation - does not cache in development.
 *
 * TravellerMap API Notes:
 * - API supports standard HTTP caching headers (ETag, Cache-Control)
 * - Tiles are relatively static, can be cached aggressively
 * - Rate limiting: TravellerMap is a community resource, be respectful
 *
 * TODO: Build full optimized cache system (LOW/MEDIUM priority)
 * - Implement tile caching with configurable TTL
 * - Add cache invalidation strategies
 * - Support offline fallback with cached tiles
 * - Add cache statistics and monitoring
 * - Consider Redis/disk-based cache for production
 * - Implement ETag-based revalidation
 */

// In-memory cache store (stub - not used in development)
const cache = new Map();

// Rate limiting state
const rateLimiter = {
  requests: [],         // Timestamps of recent requests
  windowMs: 60000,      // 1 minute window
  maxRequests: 30,      // Max 30 requests per minute (conservative)
  testMode: false,      // When true, blocks all external calls
  lastHealthCheck: 0,   // Timestamp of last health check
  healthCheckInterval: 300000,  // 5 minutes between health checks
  isHealthy: true       // Assume healthy until proven otherwise
};

// Configuration
const config = {
  enabled: false,  // Disabled by default - enable in production
  ttlMs: 24 * 60 * 60 * 1000,  // 24 hours default TTL (tiles rarely change)
  maxEntries: 1000,
  tileBaseUrl: 'https://travellermap.com/api/tile',
  timeoutMs: 10000,     // 10 second timeout for API calls
  retryAttempts: 2,     // Retry twice on failure
  retryDelayMs: 1000    // 1 second between retries
};

/**
 * Generate cache key for a tile request
 * @param {Object} params - Tile parameters
 * @returns {string} Cache key
 */
function getCacheKey(params) {
  const { x, y, scale, options, style } = params;
  return `tile:${x}:${y}:${scale}:${options || ''}:${style || ''}`;
}

/**
 * Check if caching is enabled
 * @returns {boolean}
 */
function isEnabled() {
  return config.enabled && process.env.NODE_ENV === 'production';
}

/**
 * Get a cached tile (stub - always returns null in development)
 * @param {Object} params - Tile parameters { x, y, scale, options, style }
 * @returns {Object|null} Cached data or null
 */
function get(params) {
  if (!isEnabled()) {
    return null;
  }

  const key = getCacheKey(params);
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  // Check TTL
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Store a tile in cache (stub - no-op in development)
 * @param {Object} params - Tile parameters
 * @param {*} data - Data to cache
 */
function set(params, data) {
  if (!isEnabled()) {
    return;
  }

  // Enforce max entries
  if (cache.size >= config.maxEntries) {
    // Simple LRU-ish: remove oldest entry
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }

  const key = getCacheKey(params);
  cache.set(key, {
    data,
    cachedAt: Date.now(),
    expiresAt: Date.now() + config.ttlMs
  });
}

/**
 * Clear all cached tiles
 */
function clear() {
  cache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} Stats { entries, enabled, config }
 */
function getStats() {
  return {
    entries: cache.size,
    enabled: isEnabled(),
    config: {
      ttlMs: config.ttlMs,
      maxEntries: config.maxEntries
    }
  };
}

/**
 * Configure cache settings
 * @param {Object} options - Configuration options
 */
function configure(options = {}) {
  if (options.enabled !== undefined) config.enabled = options.enabled;
  if (options.ttlMs !== undefined) config.ttlMs = options.ttlMs;
  if (options.maxEntries !== undefined) config.maxEntries = options.maxEntries;
}

/**
 * Build TravellerMap tile URL
 * @param {Object} params - Tile parameters
 * @returns {string} Full tile URL
 */
function buildTileUrl(params) {
  const { x, y, scale, options, style } = params;
  let url = `${config.tileBaseUrl}?x=${x}&y=${y}&scale=${scale}`;
  if (options) url += `&options=${options}`;
  if (style) url += `&style=${style}`;
  return url;
}

/**
 * Check if TravellerMap is reachable (for health checks)
 * Respects rate limiting and caches health status
 * @returns {Promise<boolean>}
 */
async function checkHealth() {
  // Use cached health status if recent
  const now = Date.now();
  if (now - rateLimiter.lastHealthCheck < rateLimiter.healthCheckInterval) {
    return rateLimiter.isHealthy;
  }

  // In test mode, return cached status without network call
  if (rateLimiter.testMode) {
    return rateLimiter.isHealthy;
  }

  // Check rate limit before making request
  if (!canMakeRequest()) {
    return rateLimiter.isHealthy; // Return cached status
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    recordRequest();
    const response = await fetch('https://travellermap.com/api/coordinates', {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timeout);
    rateLimiter.lastHealthCheck = now;
    rateLimiter.isHealthy = response.ok;
    return response.ok;
  } catch (error) {
    rateLimiter.lastHealthCheck = now;
    rateLimiter.isHealthy = false;
    return false;
  }
}

/**
 * Check if we can make a request (rate limiting)
 * @returns {boolean}
 */
function canMakeRequest() {
  if (rateLimiter.testMode) {
    return false; // Block all external calls in test mode
  }

  const now = Date.now();
  const windowStart = now - rateLimiter.windowMs;

  // Clean old requests
  rateLimiter.requests = rateLimiter.requests.filter(t => t > windowStart);

  return rateLimiter.requests.length < rateLimiter.maxRequests;
}

/**
 * Record a request for rate limiting
 */
function recordRequest() {
  rateLimiter.requests.push(Date.now());
}

/**
 * Enable test mode (blocks all external API calls)
 * @param {boolean} enabled
 */
function setTestMode(enabled) {
  rateLimiter.testMode = enabled;
}

/**
 * Check if test mode is enabled
 * @returns {boolean}
 */
function isTestMode() {
  return rateLimiter.testMode;
}

/**
 * Get rate limiter stats
 * @returns {Object}
 */
function getRateLimiterStats() {
  const now = Date.now();
  const windowStart = now - rateLimiter.windowMs;
  const recentRequests = rateLimiter.requests.filter(t => t > windowStart);

  return {
    requestsInWindow: recentRequests.length,
    maxRequests: rateLimiter.maxRequests,
    windowMs: rateLimiter.windowMs,
    canMakeRequest: canMakeRequest(),
    isHealthy: rateLimiter.isHealthy,
    testMode: rateLimiter.testMode
  };
}

/**
 * Reset rate limiter (for testing)
 */
function resetRateLimiter() {
  rateLimiter.requests = [];
  rateLimiter.lastHealthCheck = 0;
  rateLimiter.isHealthy = true;
}

/**
 * Fetch with timeout and retry support
 * Respects rate limiting
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response|null>}
 */
async function fetchWithRetry(url, options = {}) {
  if (!canMakeRequest()) {
    console.warn('[MapCache] Rate limit reached, request blocked');
    return null;
  }

  const { retries = config.retryAttempts, timeout = config.timeoutMs } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      recordRequest();
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        rateLimiter.isHealthy = true;
        return response;
      }

      // Don't retry on 4xx errors
      if (response.status >= 400 && response.status < 500) {
        return response;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`[MapCache] Request timeout (attempt ${attempt + 1}/${retries + 1})`);
      } else {
        console.warn(`[MapCache] Request failed (attempt ${attempt + 1}/${retries + 1}):`, error.message);
      }

      // Wait before retry
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, config.retryDelayMs * (attempt + 1)));
      }
    }
  }

  rateLimiter.isHealthy = false;
  return null;
}

module.exports = {
  get,
  set,
  clear,
  getStats,
  configure,
  isEnabled,
  getCacheKey,
  buildTileUrl,
  checkHealth,
  canMakeRequest,
  setTestMode,
  isTestMode,
  getRateLimiterStats,
  resetRateLimiter,
  fetchWithRetry
};

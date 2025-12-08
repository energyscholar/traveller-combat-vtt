/**
 * AR-40: Library Computer Socket Handlers
 * Handles library searches and reference lookups
 */

const libraryData = require('../../operations/library-data');

function register(ctx) {
  const { socket, socketLog, sanitizeError } = ctx;

  // Search library
  socket.on('ops:librarySearch', (data) => {
    try {
      const { query } = data || {};
      if (!query || typeof query !== 'string') {
        socket.emit('ops:libraryResults', { results: [], query: '' });
        return;
      }

      const results = libraryData.searchLibrary(query.trim());
      socket.emit('ops:libraryResults', { results, query: query.trim() });
      socketLog.info(`[OPS] Library search: "${query.trim()}" - ${results.length} results`);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Library', error));
      socketLog.error('[OPS] Library search error:', error);
    }
  });

  // Decode UWP
  socket.on('ops:decodeUWP', (data) => {
    try {
      const { uwp } = data || {};
      if (!uwp || typeof uwp !== 'string') {
        socket.emit('ops:uwpDecoded', { decoded: null, uwp: '' });
        return;
      }

      const decoded = libraryData.decodeUWP(uwp.trim());
      socket.emit('ops:uwpDecoded', { decoded, uwp: uwp.trim() });
      socketLog.info(`[OPS] UWP decoded: "${uwp.trim()}"`);
    } catch (error) {
      socket.emit('ops:error', sanitizeError('UWP', error));
      socketLog.error('[OPS] UWP decode error:', error);
    }
  });

  // Get trade codes
  socket.on('ops:getTradeCodes', () => {
    try {
      const codes = libraryData.getAllTradeCodes();
      socket.emit('ops:tradeCodes', { codes });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Trade', error));
    }
  });

  // Get starport info
  socket.on('ops:getStarports', () => {
    try {
      const starports = libraryData.getAllStarports();
      socket.emit('ops:starports', { starports });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Starport', error));
    }
  });

  // Get glossary
  socket.on('ops:getGlossary', () => {
    try {
      const terms = libraryData.getAllGlossaryTerms();
      socket.emit('ops:glossary', { terms });
    } catch (error) {
      socket.emit('ops:error', sanitizeError('Glossary', error));
    }
  });
}

module.exports = { register };

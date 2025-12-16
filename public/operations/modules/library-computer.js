/**
 * AR-151f: Library Computer Module
 * AR-40: Ship's Library Computer - reference database access
 */

/**
 * Show library computer modal
 * @param {Function} showModalContent - Function to display modal content
 */
export function showLibraryComputer(showModalContent) {
  const html = `
    <div class="modal-header">
      <h2>📚 Ship's Library Computer</h2>
      <button class="btn-close" data-close-modal>×</button>
    </div>
    <div class="modal-body library-computer">
      <div class="library-search-box" style="margin-bottom: 15px;">
        <input type="text" id="library-search" class="form-input" placeholder="Search library... (e.g. 'Ag', 'starport', 'jump')"
               oninput="searchLibrary(this.value)" style="width: 100%;">
      </div>
      <div class="library-tabs" style="display: flex; gap: 5px; margin-bottom: 10px;">
        <button class="btn btn-small btn-active" onclick="showLibraryTab('search')">Search</button>
        <button class="btn btn-small" onclick="showLibraryTab('uwp')">UWP Decoder</button>
        <button class="btn btn-small" onclick="showLibraryTab('trade')">Trade Codes</button>
        <button class="btn btn-small" onclick="showLibraryTab('starports')">Starports</button>
      </div>
      <div id="library-content" class="library-content" style="max-height: 400px; overflow-y: auto;">
        <div class="library-help">
          <p>Type to search the library database for:</p>
          <ul>
            <li><strong>Trade Codes</strong> - Ag, In, Hi, Ri, etc.</li>
            <li><strong>Starport Classes</strong> - A through X</li>
            <li><strong>Terms</strong> - Jump, Parsec, Navy, etc.</li>
          </ul>
        </div>
      </div>
    </div>
  `;
  showModalContent(html);
}

/**
 * Search library database
 * @param {Object} state - Application state with socket
 * @param {string} query - Search query
 */
export function searchLibrary(state, query) {
  if (!query || query.length < 2) {
    document.getElementById('library-content').innerHTML = `
      <div class="library-help">
        <p>Type at least 2 characters to search.</p>
      </div>
    `;
    return;
  }
  state.socket.emit('ops:librarySearch', { query });
}

/**
 * Handle library search results
 * @param {Object} data - Results data
 */
export function handleLibraryResults(data) {
  const { results, query } = data;
  const content = document.getElementById('library-content');
  if (!content) return;

  if (results.length === 0) {
    content.innerHTML = `<div class="library-no-results">No results for "${query}"</div>`;
    return;
  }

  let html = '<div class="library-results">';
  for (const r of results) {
    if (r.type === 'trade_code') {
      html += `<div class="library-item trade-code">
        <span class="code-badge">${r.code}</span>
        <strong>${r.name}</strong>: ${r.desc}
      </div>`;
    } else if (r.type === 'starport') {
      html += `<div class="library-item starport">
        <span class="code-badge">Class ${r.code}</span>
        <strong>${r.name}</strong>: ${r.desc}
        <div class="starport-details">Fuel: ${r.fuel} | Repair: ${r.repair} | Yard: ${r.shipyard}</div>
      </div>`;
    } else if (r.type === 'glossary') {
      html += `<div class="library-item glossary">
        <strong>${r.term}</strong>: ${r.desc}
      </div>`;
    }
  }
  html += '</div>';
  content.innerHTML = html;
}

/**
 * Show library tab
 * @param {Object} state - Application state with socket
 * @param {string} tab - Tab name
 */
export function showLibraryTab(state, tab) {
  // Update tab buttons
  document.querySelectorAll('.library-tabs .btn').forEach(btn => btn.classList.remove('btn-active'));
  event.target.classList.add('btn-active');

  const content = document.getElementById('library-content');
  if (tab === 'uwp') {
    content.innerHTML = `
      <div class="uwp-decoder">
        <label>Enter UWP Code:</label>
        <input type="text" id="uwp-input" class="form-input" placeholder="e.g. A788899-C"
               oninput="decodeUWPLibrary(this.value)" maxlength="10" style="width: 150px; font-family: monospace;">
        <div id="uwp-result" style="margin-top: 10px;"></div>
      </div>
    `;
  } else if (tab === 'trade') {
    state.socket.emit('ops:getTradeCodes');
  } else if (tab === 'starports') {
    state.socket.emit('ops:getStarports');
  } else {
    content.innerHTML = `
      <div class="library-help">
        <p>Type to search the library database.</p>
      </div>
    `;
    document.getElementById('library-search').value = '';
  }
}

/**
 * Decode UWP code
 * @param {Object} state - Application state with socket
 * @param {string} uwp - UWP string
 */
export function decodeUWPLibrary(state, uwp) {
  if (!uwp || uwp.length < 7) {
    document.getElementById('uwp-result').innerHTML = '<div class="text-muted">Enter at least 7 characters</div>';
    return;
  }
  state.socket.emit('ops:decodeUWP', { uwp });
}

/**
 * Handle UWP decode result
 * @param {Object} data - Decoded UWP data
 */
export function handleUWPDecoded(data) {
  const { decoded, uwp } = data;
  const result = document.getElementById('uwp-result');
  if (!result) return;

  if (!decoded) {
    result.innerHTML = '<div class="text-danger">Invalid UWP format</div>';
    return;
  }

  result.innerHTML = `
    <table class="uwp-table" style="width: 100%; font-size: 12px;">
      <tr><td><strong>Starport</strong></td><td>${decoded.starport.code} - ${decoded.starport.name || 'Unknown'}</td></tr>
      <tr><td><strong>Size</strong></td><td>${decoded.size.code} - ${decoded.size.desc}</td></tr>
      <tr><td><strong>Atmosphere</strong></td><td>${decoded.atmosphere.code} - ${decoded.atmosphere.desc}</td></tr>
      <tr><td><strong>Hydrographics</strong></td><td>${decoded.hydrographics.code} - ${decoded.hydrographics.desc}</td></tr>
      <tr><td><strong>Population</strong></td><td>${decoded.population.code} - ${decoded.population.desc}</td></tr>
      <tr><td><strong>Government</strong></td><td>${decoded.government.code} - ${decoded.government.desc}</td></tr>
      <tr><td><strong>Law Level</strong></td><td>${decoded.lawLevel.code} - ${decoded.lawLevel.desc}</td></tr>
      <tr><td><strong>Tech Level</strong></td><td>${decoded.techLevel.code} - ${decoded.techLevel.desc}</td></tr>
    </table>
  `;
}

/**
 * Handle trade codes response
 * @param {Object} data - Trade codes data
 */
export function handleTradeCodes(data) {
  const { codes } = data;
  const content = document.getElementById('library-content');
  if (!content) return;

  let html = '<div class="library-results"><h4>Trade Codes Reference</h4>';
  for (const c of codes) {
    html += `<div class="library-item trade-code">
      <span class="code-badge">${c.code}</span>
      <strong>${c.name}</strong>: ${c.desc}
    </div>`;
  }
  html += '</div>';
  content.innerHTML = html;
}

/**
 * Handle starports response
 * @param {Object} data - Starports data
 */
export function handleStarports(data) {
  const { starports } = data;
  const content = document.getElementById('library-content');
  if (!content) return;

  let html = '<div class="library-results"><h4>Starport Classifications</h4>';
  for (const s of starports) {
    html += `<div class="library-item starport">
      <span class="code-badge">Class ${s.code}</span>
      <strong>${s.name}</strong>: ${s.desc}
      <div class="starport-details">Fuel: ${s.fuel} | Repair: ${s.repair} | Yard: ${s.shipyard}</div>
    </div>`;
  }
  html += '</div>';
  content.innerHTML = html;
}

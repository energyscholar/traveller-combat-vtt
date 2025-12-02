/**
 * .tvadv Package Format Module (Stage 10.1)
 * Creates and reads .tvadv zip archives for adventure distribution
 *
 * File structure:
 *   manifest.json     - Package metadata
 *   adventure.json    - Adventure content (validates against schema)
 *   assets/           - Handout files, portraits, etc.
 *   README.md         - Human-readable description
 */

const JSZip = require('jszip');
const path = require('path');
const fs = require('fs');
const adventureIO = require('./adventure-io');
const validation = require('./validation');
const { db, generateId } = require('./database');

// Package version
const TVADV_VERSION = '1.0.0';

/**
 * Create .tvadv manifest
 * @param {Object} adventureData - Exported adventure data
 * @param {Object} options - Additional manifest options
 * @returns {Object} Manifest object
 */
function createManifest(adventureData, options = {}) {
  const manifest = adventureData.manifest || {};

  return {
    tadvVersion: TVADV_VERSION,
    formatVersion: '1.0',
    name: options.name || manifest.campaignName || 'Untitled Adventure',
    author: options.author || 'Unknown',
    created: new Date().toISOString(),
    description: options.description || '',
    tags: options.tags || [],
    system: options.system || null,
    sector: options.sector || null,
    contentCounts: manifest.contentCounts || {
      reveals: 0,
      npcs: 0,
      locations: 0,
      events: 0,
      handouts: 0,
      emails: 0
    },
    checksums: {}
  };
}

/**
 * Pack a campaign into a .tvadv zip buffer
 * @param {string} campaignId - Campaign to export
 * @param {Object} options - Pack options (name, author, description, etc.)
 * @returns {Promise<Buffer>} Zip file buffer
 */
async function packAdventure(campaignId, options = {}) {
  // Export adventure data
  const adventureData = adventureIO.exportAdventure(campaignId);

  // Convert to schema-compliant format
  const schemaData = {
    version: TVADV_VERSION,
    meta: {
      name: options.name || adventureData.manifest?.campaignName || 'Adventure',
      author: options.author || 'Unknown',
      created: new Date().toISOString(),
      description: options.description || '',
      tags: options.tags || [],
      system: options.system,
      sector: options.sector
    },
    content: {
      npcs: adventureData.npcs?.map(n => ({
        id: n.id,
        name: n.name,
        title: n.title,
        description: n.description || n.background,
        location: n.location_text,
        stats: n.stats,
        skills: n.skills,
        notes: n.notes
      })) || [],
      locations: adventureData.locations?.map(l => ({
        id: l.id,
        name: l.name,
        type: l.location_type || 'other',
        description: l.description_gm,
        parentId: l.parent_id
      })) || [],
      ships: [],
      events: adventureData.events?.map(e => ({
        id: e.id,
        type: e.event_type || 'trigger',
        trigger: e.trigger_condition,
        date: e.trigger_date,
        action: e.description
      })) || [],
      handouts: adventureData.handouts?.map(h => ({
        id: h.id,
        title: h.title,
        content: h.content_text || '',
        type: h.handout_type || 'text'
      })) || [],
      mail: adventureData.emails?.map(m => ({
        id: m.id,
        senderName: m.sender_name,
        senderType: m.sender_type || 'npc',
        recipientType: m.recipient_type || 'player',
        subject: m.subject,
        body: m.body,
        queuedForDate: m.queued_for_date
      })) || []
    }
  };

  // Validate against schema (warn but don't block)
  const validationResult = validation.validateAdventureData(schemaData);
  if (!validationResult.valid) {
    console.warn('Adventure validation warnings:', validationResult.errors);
  }

  // Create manifest
  const manifest = createManifest(adventureData, options);

  // Create zip
  const zip = new JSZip();

  // Add manifest
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // Add adventure data
  zip.file('adventure.json', JSON.stringify(schemaData, null, 2));

  // Add README
  const readme = generateReadme(manifest, schemaData);
  zip.file('README.md', readme);

  // Create assets folder
  const assetsFolder = zip.folder('assets');
  const handoutsFolder = assetsFolder.folder('handouts');
  const portraitsFolder = assetsFolder.folder('portraits');

  // Add handout files if they exist locally
  if (adventureData.handouts) {
    for (const handout of adventureData.handouts) {
      if (handout.file_url && handout.file_url.startsWith('/')) {
        const localPath = path.join(__dirname, '../../public', handout.file_url);
        if (fs.existsSync(localPath)) {
          const filename = path.basename(handout.file_url);
          handoutsFolder.file(filename, fs.readFileSync(localPath));
        }
      }
    }
  }

  // Generate zip buffer
  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
}

/**
 * Generate README.md content for the package
 * @param {Object} manifest - Package manifest
 * @param {Object} schemaData - Adventure schema data
 * @returns {string} README content
 */
function generateReadme(manifest, schemaData) {
  const counts = manifest.contentCounts;
  return `# ${manifest.name}

**Author:** ${manifest.author}
**Created:** ${manifest.created}
**Format Version:** ${manifest.formatVersion}

${manifest.description || ''}

## Contents

- **NPCs:** ${counts.npcs || 0}
- **Locations:** ${counts.locations || 0}
- **Events:** ${counts.events || 0}
- **Handouts:** ${counts.handouts || 0}
- **Emails:** ${counts.emails || 0}

## Import Instructions

1. Open Traveller VTT Operations
2. Go to GM Tools > Import Adventure
3. Select this .tvadv file
4. Review import preview
5. Click Import

## File Format

This is a Traveller VTT Adventure Package (.tvadv).
It contains JSON data and optional asset files.

---
*Generated by Traveller VTT*
`;
}

/**
 * Unpack a .tvadv file to extract contents
 * @param {Buffer|ArrayBuffer} zipBuffer - Zip file buffer
 * @returns {Promise<Object>} Extracted contents { manifest, adventure, assets }
 */
async function unpackAdventure(zipBuffer) {
  const zip = await JSZip.loadAsync(zipBuffer);

  // Extract manifest
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    throw new Error('Invalid .tvadv file: missing manifest.json');
  }
  const manifest = JSON.parse(await manifestFile.async('text'));

  // Extract adventure data
  const adventureFile = zip.file('adventure.json');
  if (!adventureFile) {
    throw new Error('Invalid .tvadv file: missing adventure.json');
  }
  const adventure = JSON.parse(await adventureFile.async('text'));

  // Validate adventure data
  const validationResult = validation.validateAdventureData(adventure);

  // Extract asset list
  const assets = [];
  const assetsFolder = zip.folder('assets');
  if (assetsFolder) {
    assetsFolder.forEach((relativePath, file) => {
      if (!file.dir) {
        assets.push({
          path: relativePath,
          name: path.basename(relativePath),
          folder: path.dirname(relativePath)
        });
      }
    });
  }

  return {
    manifest,
    adventure,
    assets,
    validation: validationResult,
    zip // Keep zip reference for asset extraction
  };
}

/**
 * Extract a single asset from unpacked adventure
 * @param {Object} unpackedAdventure - Result from unpackAdventure
 * @param {string} assetPath - Path within assets folder
 * @returns {Promise<Buffer>} Asset buffer
 */
async function extractAsset(unpackedAdventure, assetPath) {
  const file = unpackedAdventure.zip.file(`assets/${assetPath}`);
  if (!file) {
    throw new Error(`Asset not found: ${assetPath}`);
  }
  return file.async('nodebuffer');
}

/**
 * Preview adventure contents without importing
 * @param {Buffer|ArrayBuffer} zipBuffer - Zip file buffer
 * @returns {Promise<Object>} Preview data
 */
async function previewAdventure(zipBuffer) {
  const unpacked = await unpackAdventure(zipBuffer);

  return {
    name: unpacked.manifest.name,
    author: unpacked.manifest.author,
    description: unpacked.manifest.description,
    created: unpacked.manifest.created,
    version: unpacked.manifest.tadvVersion,
    counts: unpacked.manifest.contentCounts,
    validation: unpacked.validation,
    assets: unpacked.assets.map(a => a.name),
    // Include first few items of each type for preview
    preview: {
      npcs: unpacked.adventure.content?.npcs?.slice(0, 5).map(n => n.name) || [],
      locations: unpacked.adventure.content?.locations?.slice(0, 5).map(l => l.name) || [],
      handouts: unpacked.adventure.content?.handouts?.slice(0, 5).map(h => h.title) || []
    }
  };
}

/**
 * Import adventure from .tvadv buffer into campaign
 * @param {string} campaignId - Target campaign
 * @param {Buffer|ArrayBuffer} zipBuffer - Zip file buffer
 * @param {Object} options - Import options (selective import, etc.)
 * @returns {Promise<Object>} Import result
 */
async function importFromPackage(campaignId, zipBuffer, options = {}) {
  const unpacked = await unpackAdventure(zipBuffer);

  // Check validation
  if (!unpacked.validation.valid && options.strictValidation) {
    throw new Error(`Validation failed: ${unpacked.validation.errors.join(', ')}`);
  }

  // Convert schema format back to adventure-io format
  const content = unpacked.adventure.content || {};
  const adventureData = {
    manifest: unpacked.manifest,
    npcs: content.npcs?.map(n => ({
      id: n.id,
      name: n.name,
      title: n.title,
      background: n.description,
      location_text: n.location,
      stats: n.stats,
      skills: n.skills,
      notes: n.notes
    })) || [],
    locations: content.locations?.map(l => ({
      id: l.id,
      name: l.name,
      location_type: l.type,
      description_gm: l.description,
      parent_id: l.parentId
    })) || [],
    handouts: content.handouts?.map(h => ({
      id: h.id,
      title: h.title,
      content_text: h.content,
      handout_type: h.type
    })) || [],
    events: content.events?.map(e => ({
      id: e.id,
      event_type: e.type,
      trigger_condition: e.trigger,
      trigger_date: e.date,
      description: e.action
    })) || [],
    emails: content.mail?.map(m => ({
      id: m.id,
      sender_name: m.senderName,
      sender_type: m.senderType,
      recipient_type: m.recipientType,
      subject: m.subject,
      body: m.body,
      queued_for_date: m.queuedForDate
    })) || [],
    reveals: []
  };

  // Use existing import function
  const result = adventureIO.importAdventure(campaignId, adventureData);

  // Extract and save assets to public folder
  if (unpacked.assets.length > 0 && options.importAssets !== false) {
    const assetsDir = path.join(__dirname, '../../public/assets/adventures', campaignId);
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    for (const asset of unpacked.assets) {
      const buffer = await extractAsset(unpacked, asset.path);
      const assetPath = path.join(assetsDir, asset.name);
      fs.writeFileSync(assetPath, buffer);
    }

    result.assetsImported = unpacked.assets.length;
  }

  return result;
}

module.exports = {
  TVADV_VERSION,
  packAdventure,
  unpackAdventure,
  extractAsset,
  previewAdventure,
  importFromPackage,
  createManifest,
  generateReadme
};

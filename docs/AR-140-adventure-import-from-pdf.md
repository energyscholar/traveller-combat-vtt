# AR-140: Adventure Import from PDF

## CRITICAL: Module Gating Architecture (Build First)

Adventure content is **paid content** (Mongoose Traveller + ~30% platform fee).
Must build gating infrastructure BEFORE any content extraction.

### Gating Requirements
1. **Isolated Storage**: Module content in separate tables/schema, NOT universal DB
2. **Explicit Loading**: Modules only load when user explicitly purchases/activates
3. **Clear Labeling**: All module content tagged with `module_id`, `module_name`
4. **Unload Capability**: Remove module content cleanly when subscription lapses
5. **No Implicit Leakage**: Prevent module content from being copied to universal tables

### Database Structure
```javascript
// Module registry
adventure_modules: {
  id, name, publisher, price, version, is_active
}

// All module content tagged
module_npcs: { ..., module_id }      // NOT in main npc_dossiers
module_locations: { ..., module_id } // NOT in main locations
module_ships: { ..., module_id }     // NOT in main ships
module_events: { ..., module_id }    // Separate table
```

### Load/Unload Gateway
```javascript
function loadAdventureModule(campaignId, moduleId) {
  // Verify purchase/license
  // Copy module content to campaign-scoped tables
  // Tag all entries with module_id
}

function unloadAdventureModule(campaignId, moduleId) {
  // GM explicitly unloads module from campaign
  // Remove all content tagged with module_id from campaign
  // Preserve user modifications in separate "custom_content" table
  // Module can be re-loaded later without losing customizations
}
```

### GM Module Management UI
```
┌─────────────────────────────────────────┐
│ ⚙ ADVENTURE MODULES                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                         │
│ LOADED:                                 │
│ ☑ High and Dry (v1.2)      [Unload]    │
│ ☑ Death Station (v1.0)     [Unload]    │
│                                         │
│ AVAILABLE (Purchased):                  │
│ ☐ Flatlined (v1.1)         [Load]      │
│                                         │
│ [Browse Store...]                       │
└─────────────────────────────────────────┘
```

### Buy Content Flow (Stubbed)
```javascript
// Database: purchases table
module_purchases: {
  id,
  user_id,           // Who bought it
  module_id,         // What they bought
  purchase_date,
  price_paid,
  mongoose_share,    // ~70%
  platform_share,    // ~30%
  license_type,      // 'perpetual' | 'subscription'
  expires_at,        // null for perpetual
  transaction_id     // Payment processor reference
}

// Stub function - implement when payment ready
async function purchaseModule(userId, moduleId) {
  // TODO: Integrate with payment processor (Stripe?)
  // TODO: Verify Mongoose licensing terms
  // TODO: Create purchase record
  // TODO: Grant access to module content
  throw new Error('Payment integration not yet implemented');
}

function canAccessModule(userId, moduleId) {
  const purchase = getPurchase(userId, moduleId);
  if (!purchase) return false;
  if (purchase.license_type === 'perpetual') return true;
  if (purchase.expires_at && purchase.expires_at < Date.now()) return false;
  return true;
}
```

### Implementation Order
1. **Stage 140.0**: Gateway architecture (tables, load/unload) - DO THIS FIRST
2. Then extraction stages (140.1-140.6)

---

## Summary
Claude reads adventure PDFs directly and extracts structured campaign content (NPCs, locations, events, ships, encounters) for import into the VTT.

## Workflow
```
1. GM provides PDF path
2. Claude reads PDF (multimodal)
3. Claude extracts structured data
4. Claude creates database entries via operations API
5. GM reviews imported content in VTT
```

## Content Types to Extract

| Type | Data Fields | Storage |
|------|-------------|---------|
| NPCs | name, stats, personality, goals, location | npc_dossiers table |
| Locations | name, description, UWP, starport, facilities | Locations/systems |
| Ships | name, type, tonnage, weapons, crew | ships table |
| Encounters | trigger, participants, reactions, combat stats | encounters table (new?) |
| Plot Events | description, triggers, outcomes | events table (new?) |

## Implementation Stages

### Stage 140.1: PDF Reading Test (30min)
**Risk:** LOW | **LOC:** 0 (manual test)
- Verify Claude can read Traveller adventure PDFs
- Test with a sample adventure (e.g., High and Dry)
- Identify any OCR or formatting issues

### Stage 140.2: NPC Extraction (1.5hr)
**Risk:** LOW | **LOC:** ~50
- Read PDF, extract NPC data
- Map to existing npc_dossiers schema
- Create NPCs via `operations.createNPCDossier()`

```javascript
// Example extraction prompt
"Extract all NPCs from this adventure. For each NPC provide:
- name, role, location
- UPP stats (if given)
- personality traits
- goals/motivations
- relationship to plot"
```

### Stage 140.3: Location Extraction (1hr)
**Risk:** LOW | **LOC:** ~30
- Extract locations (starports, cities, wilderness)
- Map to existing location schema
- Link to star system data if applicable

### Stage 140.4: Ship Extraction (1hr)
**Risk:** LOW | **LOC:** ~30
- Extract ship stats from PDF
- Map to ship templates or create custom
- Use existing `createShipFromTemplate()` or raw creation

### Stage 140.5: Encounter/Event Extraction (2hr)
**Risk:** MEDIUM | **LOC:** ~80
- May need new database tables for events/encounters
- Define trigger conditions
- Link to NPCs, locations, ships

### Stage 140.6: Import Command (1hr)
**Risk:** LOW | **LOC:** ~40
- Create slash command or CLI for import
- `/import-adventure <pdf-path>`
- Progress feedback during extraction

## Example Session
```
User: Import the adventure from reference/adventures/high-and-dry.pdf

Claude: Reading PDF... Found 234 pages.

Extracting content:
- NPCs: 12 found (Baroness Edda, Captain Harl, ...)
- Locations: 8 found (Walston Starport, Baronial Estate, ...)
- Ships: 3 found (Highndry, Pirate Corsair, ...)
- Encounters: 15 found

Creating database entries...
✓ 12 NPCs added to campaign
✓ 8 locations linked
✓ 3 ships created
✓ 15 encounter triggers defined

Import complete. Review in GM panel under "Adventure Content".
```

## Dependencies
- Claude's PDF reading capability (multimodal)
- Existing NPC dossiers table
- Existing ships table
- May need: encounters table, events table

## Risk: LOW (Mitigated)

### Original Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| PDF reading issues | Stage 140.1 tests this first, abort if fails |
| Extraction accuracy | Human review step before DB commit |
| Complex formatting | Start with one known-good PDF (High and Dry) |
| New tables add scope | Tables are simple key-value, no complex relations |
| Payment integration | Stubbed - throws error, doesn't block other work |

### Staged Validation
- 140.0: Gateway tables exist before any content
- 140.1: PDF test confirms multimodal works
- Each extraction stage is independent - can skip/defer any

## Estimate
| Stage | LOC | Time |
|-------|-----|------|
| 140.0 Gateway architecture | 150 | 3hr |
| 140.1 PDF test | 0 | 30min |
| 140.2 NPC extraction | 50 | 1.5hr |
| 140.3 Location extraction | 30 | 1hr |
| 140.4 Ship extraction | 30 | 1hr |
| 140.5 Encounter extraction | 80 | 2hr |
| 140.6 Import command | 40 | 1hr |
| **Total** | **380** | **10hr** |

**Stage 140.0 includes:**
- `adventure_modules` registry table
- `module_purchases` table (user purchases, license tracking)
- `module_*` content tables (npcs, locations, ships, events)
- `custom_content` table (preserves user mods when module unloaded)
- `loadAdventureModule()` / `unloadAdventureModule()` functions
- `canAccessModule()` license verification
- `purchaseModule()` stub (throws until payment integration)
- GM Module Management UI (load/unload/browse store)

## Notes
- Start with a single adventure (High and Dry) as proof of concept
- Expand extraction prompts based on what works
- GM can edit/delete imported content as needed
- Consider batch import for adventure series

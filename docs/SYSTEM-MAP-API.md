# System Map Module Documentation

## Overview

The System Map (`public/operations/modules/system-map.js`) renders an interactive 2D visualization of star systems with orbiting planets, moons, stations, and ship positions. It supports panning, zooming, time-based orbital animation, and multiple overlay layers.

**File Size:** ~3700 lines
**Dependencies:** None (vanilla JS + Canvas 2D)

---

## Coordinate System

### CRITICAL: Understanding the Coordinate System

The system uses a **world-space AU coordinate system** with canvas transformation:

```
World Space (AU)              Screen Space (pixels)
     +Y (up)                       +Y (down)
       |                              |
       |                              |
 -X ---+--- +X            Screen: 0,0 -----> +X
       |                              |
       |                              v
     -Y (down)
```

**Key Formulas:**

```javascript
// In render():
centerX = canvasWidth / 2 + offsetX   // Pan offset already included
centerY = canvasHeight / 2 + offsetY

// Converting AU to screen position:
screenX = centerX + worldX_AU * AU_TO_PIXELS * zoom
screenY = centerY + worldY_AU * AU_TO_PIXELS * zoom * 0.6  // Isometric ellipse

// Orbital animation:
orbitSpeed = 0.1 / Math.sqrt(orbitAU)  // Kepler-ish
angle = time * orbitSpeed
worldX = Math.cos(angle) * orbitAU
worldY = Math.sin(angle) * orbitAU * 0.6  // Isometric Y scaling
```

**⚠️ WARNING:** `centerX`/`centerY` passed to draw functions **already include** `systemMapState.offsetX/Y`. Do NOT add them again in overlay drawing functions.

---

## State Objects

### `systemMapState` (Main Map)

```javascript
systemMapState = {
  // Canvas
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  container: HTMLElement,

  // View Transform
  zoom: 1,              // 0.1 to 100
  offsetX: 0,           // Pan offset in pixels
  offsetY: 0,
  AU_TO_PIXELS: 50,     // Base scale: 1 AU = 50px at zoom 1
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 100,

  // Interaction
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,

  // System Data
  system: Object,       // Generated or loaded system
  sector: 'Spinward Marches',
  hex: '0000',
  celestialObjects: [], // From JSON data

  // Selection
  selectedBody: null,
  hoveredBody: null,
  showLabels: true,

  // Time Animation
  animationFrame: null,
  time: 0,              // Simulation time for orbital positions
  paused: false,
  timeSpeed: 1,
  baseDate: { year: 1105, day: 1 },

  // Overlays
  showGoldilocksZone: false,

  // Colors
  colors: {
    space: '#0a0a15',
    star: '#ffff88',
    orbit: 'rgba(255, 255, 255, 0.15)',
    // ... etc
  }
}
```

### `shipMapState` (Ship Overlay)

```javascript
shipMapState = {
  partyShip: {
    name: string,
    position: { x, y, z },  // AU (fallback if no locationInfo)
    heading: number,        // radians
    locationInfo: {         // Dynamic positioning (preferred)
      linkedBodyOrbitAU: number,  // Parent body orbit radius
      offsetAU: number,           // Distance from parent
      offsetBearing: number       // Degrees from parent
    }
  },
  contacts: [],           // Sensor contacts array
  showRangeBands: false,
  destination: null       // Course destination body ID
}
```

### `embeddedMapState` (Mini-Map in Pilot Station)

```javascript
embeddedMapState = {
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  container: HTMLElement,
  zoom: 0.8,
  offsetX: 0,
  offsetY: 0,
  animationFrame: null,
  selectedDestination: null,
  currentCameraAngle: 0,
  lastClickedDestination: null
}
```

---

## Public API (window.*)

### Initialization & Lifecycle

| Function | Description |
|----------|-------------|
| `initSystemMap(container)` | Initialize main system map in container |
| `destroySystemMap()` | Clean up and remove map |
| `resizeSystemMapCanvas()` | Handle container resize |

### Loading Systems

| Function | Description |
|----------|-------------|
| `loadSystemFromJSON(jsonData)` | Load system from JSON (preferred) |
| `loadSystem(systemData, sector, hex)` | Load generated system |
| `loadTestSystem(systemKey)` | Load test system by key |

### View Control

| Function | Description |
|----------|-------------|
| `zoomSystemMap(factor)` | Multiply zoom by factor |
| `resetSystemMapView()` | Reset to default zoom/pan |
| `toggleSystemMapLabels()` | Toggle body name labels |
| `goToObject(objectId)` | Center on celestial object |
| `animateCameraToLocation(locationId, options)` | Smooth camera animation |

### Time Control

| Function | Description |
|----------|-------------|
| `togglePause()` | Pause/resume time |
| `setTimeSpeed(speed)` | Set time multiplier (0x, 1x, 10x, etc) |
| `setDate(year, day)` | Jump to specific date |
| `getDate()` | Get current { year, day } |
| `advanceTime(days)` | Skip forward |
| `rewindTime(days)` | Skip backward |
| `snapToNow()` | Sync to campaign date |

### Ship Integration

| Function | Description |
|----------|-------------|
| `updateShipPosition(shipData)` | Update party ship display |
| `updateMapContacts(contacts)` | Update sensor contacts |
| `toggleRangeBands()` | Toggle range band overlay |
| `setMapDestination(bodyId)` | Set course line destination |

### Places & Locations

| Function | Description |
|----------|-------------|
| `showPlacesOverlay()` | Show places list panel |
| `hidePlacesOverlay()` | Hide places list panel |
| `getPlacesOverlayState()` | Get overlay visibility state |
| `showPlaceDetails(placeId)` | Show place detail panel |
| `hidePlaceDetails()` | Hide place detail panel |
| `goToPlace(placeId)` | Navigate to place |
| `setDestination(locationId)` | Set navigation destination |
| `setCourseFromDetails(placeId, hours)` | Set course from detail panel |
| `travelFromDetails()` | Execute travel from detail panel |

### Overlays

| Function | Description |
|----------|-------------|
| `toggleGoldilocksZone()` | Toggle habitable zone display |
| `hideSystemMapInfoPanel()` | Hide body info panel |

### Embedded Map (Pilot Station)

| Function | Description |
|----------|-------------|
| `initEmbeddedMap(canvas, container)` | Initialize mini-map |
| `zoomEmbeddedMap(factor)` | Zoom embedded map |
| `getEmbeddedDestinations()` | Get destination list |
| `selectEmbeddedDestinationById(id)` | Select destination |

---

## Rendering Pipeline

```
render()
  ├── Clear canvas
  ├── Scale for HiDPI
  ├── Calculate centerX/Y (includes offsetX/Y)
  ├── drawFullSystem()
  │     ├── drawStar()
  │     ├── drawAsteroidBelt()
  │     ├── drawOrbitPath() for each planet
  │     └── drawPlanet() + drawMoons()
  ├── drawGoldilocksZone()
  ├── drawRangeBands()
  ├── drawCourseLine()
  ├── drawMapContacts()
  ├── drawLocationMarkers()  ← Jump points, etc
  ├── drawPartyShip()        ← Party ship icon
  ├── drawZoomIndicator()
  └── drawDateDisplay()
```

---

## Data Formats

### System JSON Structure

```javascript
{
  "id": "flammarion",
  "name": "Flammarion",
  "sector": "Spinward Marches",
  "hex": "0930",
  "uwp": "A623514-B",
  "stellar": { "primary": "F8 V", "type": "Single" },

  "celestialObjects": [
    {
      "id": "flammarion-mainworld",
      "name": "Flammarion",
      "type": "Planet",          // Star, Planet, Station, Naval Base, etc
      "orbitAU": 1.3,
      "bearing": 270,            // Initial angle (not used for animation)
      "radiusKm": 4800,
      "parent": null,            // Or parent object ID for moons/stations
      "cameraSettings": { ... }  // Optional camera presets
    }
  ],

  "locations": [
    {
      "id": "loc-exit-jump",
      "name": "Exit Jump Space",
      "type": "jump_point",      // orbit, dock, hide, space
      "linkedTo": "flammarion-mainworld",  // Parent celestial ID
      "orbitKm": 1000000,
      "bearing": 90,
      "actions": ["scan", "plot_course"]
    }
  ]
}
```

### Ship Position with Location Info

```javascript
// Preferred: Dynamic positioning linked to orbiting body
updateShipPosition({
  name: 'Kimbly',
  position: { x: 0, y: 0, z: 0 },  // Ignored when locationInfo present
  heading: 0,
  locationInfo: {
    linkedBodyOrbitAU: 1.3,    // Body's orbit radius
    offsetAU: 0.00668,         // ~1 million km offset
    offsetBearing: 90          // Degrees from body center
  }
});
```

---

## Known Issues & Technical Debt

### Coordinate System Complexity
- Multiple functions evolved independently with different offset handling
- `centerX/Y` includes pan offset, but some functions added it again (fixed)
- Isometric Y scaling (×0.6) applied inconsistently

### API Naming
- `showSectorMap()` actually shows subsector map
- Mix of camelCase and snake_case in places

### Performance
- No spatial indexing for hit detection
- Redraws entire map every frame
- Could benefit from dirty-rect optimization at high zoom

### Missing Features
- No orbit prediction/extrapolation display
- No distance measurement tool
- No coordinate grid overlay

---

## Recommended API Improvements

See `.claude/TODOS.md` for planned improvements:

1. **Consistent Coordinate Transform Helper**
   ```javascript
   function worldToScreen(worldX_AU, worldY_AU, centerX, centerY, zoom) {
     return {
       x: centerX + worldX_AU * AU_TO_PIXELS * zoom,
       y: centerY + worldY_AU * AU_TO_PIXELS * zoom * 0.6
     };
   }
   ```

2. **Centralized Orbit Position Calculator**
   ```javascript
   function getOrbitPosition(orbitAU, time) {
     const speed = 0.1 / Math.sqrt(orbitAU || 1);
     const angle = time * speed;
     return {
       x: Math.cos(angle) * orbitAU,
       y: Math.sin(angle) * orbitAU * 0.6
     };
   }
   ```

3. **Layer System for Overlays**
   - Separate canvas layers for: background, system, overlays, UI
   - Only redraw changed layers

4. **Event System**
   - `systemMap.on('bodySelected', callback)`
   - `systemMap.on('destinationSet', callback)`

---

## Usage Examples

### Basic Initialization
```javascript
const container = document.getElementById('system-map-container');
initSystemMap(container);
loadSystemFromJSON(systemJsonData);
```

### Update Ship Position
```javascript
// From app.js when location changes:
updateShipPosition({
  name: shipName,
  position: { x: 0, y: 0, z: 0 },
  heading: 0,
  locationInfo: {
    linkedBodyOrbitAU: body.orbitAU,
    offsetAU: location.orbitKm / 149597870.7,
    offsetBearing: location.bearing
  }
});
```

### Animate to Location
```javascript
animateCameraToLocation('loc-exit-jump', {
  duration: 1000,
  easing: 'easeInOut'
});
```

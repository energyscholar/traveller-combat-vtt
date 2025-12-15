# AR-138: Sensor Display Panel Redesign

## Current Problems

| Issue | Description |
|-------|-------------|
| Too much space | Full panel with 5-6 sections even when empty |
| Confusing | ECM/ECCM/Stealth + 3 scan types + sensor lock |
| Rarely used | Most gameplay doesn't need active sensor ops |
| In-your-face | Always prominent, no quiet mode |
| Low density | Verbose labels, lots of whitespace |
| No graphics | Pure text, no visual representation |

## Use Cases

### UC-1: Routine Travel (90% of time)
**Context:** Ship traveling between points, no threats
**Needs:** Quick "all clear" indicator, maybe nearby traffic count
**Current:** Full panel with empty contact lists, unused ECM buttons
**Better:** Collapsed single-line status: `🟢 SENSORS: Clear | 3 contacts | No threats`

### UC-2: Approaching Station
**Context:** Coming into port, need to see traffic
**Needs:** Contact list, IFF status, docking info
**Current:** Works okay but cluttered
**Better:** Mini-radar showing nearby contacts + simple list

### UC-3: Suspicious Contact
**Context:** Unknown ship detected, need more info
**Needs:** Quick scan action, identity reveal progression
**Current:** Must find contact in list, click tiny scan button
**Better:** Click contact on radar → scan options popup

### UC-4: Combat Situation
**Context:** Hostile contact, weapons hot
**Needs:** ECM/ECCM, sensor lock, threat priorities
**Current:** All controls always visible (good for combat)
**Better:** Auto-expand warfare panel when threats detected

### UC-5: Running Silent
**Context:** Evading detection, emissions control
**Needs:** Stealth mode, visibility of own signature
**Current:** Stealth toggle exists but no feedback
**Better:** "Emissions meter" showing how detectable we are

### UC-6: Environmental Hazards
**Context:** Asteroid field, solar flare, radiation
**Needs:** Hazard warnings, safe path indicators
**Current:** Environmental section exists but disconnected
**Better:** Integrate with mini-radar, show hazard zones

## Proposed Design

### A. Collapsed Mode (Default)
```
┌─────────────────────────────────────────┐
│ 📡 SENSORS                    [Expand ▼]│
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ 🟢 Clear     👁 12 contacts    ⚔ 0 threats │
│ [Stealth: OFF]  [ECM: OFF]  [Lock: None] │
└─────────────────────────────────────────┘
```
- Single glance status
- Click to expand
- Auto-expand if threats detected

### B. Expanded Mode - Radar View
```
┌─────────────────────────────────────────┐
│ 📡 SENSORS                  [Collapse ▲]│
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                         │
│           · ·    ★                      │
│         ·    ·  ·                       │
│        ·  [🚀]   ·   ◆                  │
│         ·    ·                          │
│           · ·        ▲                  │
│                                         │
│  Range: 50,000km   Bearing: 360°        │
│─────────────────────────────────────────│
│ ★ Regina Highport    12,400km   Friendly│
│ ◆ Patrol Cruiser      8,200km   Unknown │
│ ▲ Free Trader        45,000km   Neutral │
└─────────────────────────────────────────┘
```
- Mini radar (canvas-based, like system map)
- Ship at center, contacts as icons
- Click contact for details/actions

### C. Combat Mode (Auto-activates)
```
┌─────────────────────────────────────────┐
│ 📡 SENSORS [COMBAT]           [Collapse]│
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ ┌─────────────────┐  ⚔ WARFARE         │
│ │    [RADAR]      │  [ECM: ON ] -2 DM   │
│ │    Mini view    │  [ECCM:OFF]         │
│ │                 │  [Stealth: OFF]     │
│ └─────────────────┘  ──────────────────│
│                       🎯 LOCK: Raider   │
│  THREATS (2)          +2 Attack DM      │
│  ━━━━━━━━━━━━━━━━━    [Break Lock]      │
│  ⚠ Raider    4km  🔒                    │
│  ⚠ Corsair  12km  [SCAN]               │
└─────────────────────────────────────────┘
```
- Compact radar + warfare controls side-by-side
- Threat list with quick actions
- Lock status prominent

### D. Stealth Mode Indicator
```
┌─────────────────────────────────────────┐
│ 📡 SENSORS [SILENT RUNNING]             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  EMISSIONS: ▓▓░░░░░░░░ 20% (Low)       │
│  Status: Difficult to detect (-4 DM)    │
│  ⚠ Active scan would reveal position   │
└─────────────────────────────────────────┘
```
- Visual emissions meter
- Clear feedback on detectability

## Implementation Stages

### Stage 138.1: Collapsed Default Mode
**Risk:** LOW | **LOC:** ~80 | **Time:** 2hr

- Add `sensorPanelMode` state ('collapsed', 'expanded', 'combat')
- Create `getSensorPanelCollapsed()` function
- Single-line status with expand button
- Preserve existing expanded view initially

### Stage 138.2: Mini Radar Canvas
**Risk:** MEDIUM | **LOC:** ~200 | **Time:** 4hr

- Small canvas element (200x200px)
- Ship at center
- Contacts as colored dots/icons
- Range rings
- Click contact → select
- Reuse patterns from system-map.js

### Stage 138.3: Auto-Expand on Threat
**Risk:** LOW | **LOC:** ~30 | **Time:** 1hr

- Detect hostile/unknown contacts
- Auto-switch to combat mode
- Play alert sound (optional)
- User can manually collapse

### Stage 138.4: Emissions Meter
**Risk:** LOW | **LOC:** ~40 | **Time:** 1hr

- Calculate emissions level (ECM/stealth/active scan)
- Visual bar indicator
- Tooltip with modifiers

### Stage 138.5: Context-Sensitive Controls
**Risk:** LOW | **LOC:** ~50 | **Time:** 1hr

- Hide ECM controls if no threats
- Show scan button only on non-scanned contacts
- Simplify for routine operations

### Stage 138.6: Polish & Integration
**Risk:** LOW | **LOC:** ~50 | **Time:** 1hr

- CSS styling for modes
- Smooth transitions
- Mobile-friendly touch targets
- Accessibility (ARIA labels)

## Technical Notes

### Radar Implementation
```javascript
function renderMiniRadar(canvas, contacts, range = 50000) {
  const ctx = canvas.getContext('2d');
  const center = { x: canvas.width/2, y: canvas.height/2 };
  const scale = canvas.width / (range * 2);

  // Background
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Range rings
  [0.25, 0.5, 0.75, 1].forEach(r => {
    ctx.strokeStyle = 'rgba(100, 150, 100, 0.3)';
    ctx.beginPath();
    ctx.arc(center.x, center.y, r * canvas.width/2, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Ship at center
  ctx.fillStyle = '#4a9';
  ctx.beginPath();
  ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
  ctx.fill();

  // Contacts
  contacts.forEach(c => {
    const angle = (c.bearing || 0) * Math.PI / 180;
    const dist = Math.min(c.range_km || 50000, range);
    const x = center.x + Math.sin(angle) * dist * scale;
    const y = center.y - Math.cos(angle) * dist * scale;

    ctx.fillStyle = getContactColor(c);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}
```

### State Machine
```
[Collapsed] ←→ [Expanded]
     ↓              ↓
[Combat] ←─────────┘
     ↑
(auto on threat)
```

## Dependencies
- None (self-contained UI improvement)

## Risk Assessment
- **Overall:** LOW-MEDIUM
- Stage 138.2 (radar) is most complex but follows existing canvas patterns
- All changes are additive, existing functionality preserved

## Estimate
| Stage | LOC | Time |
|-------|-----|------|
| 138.1 Collapsed mode | 80 | 2hr |
| 138.2 Mini radar | 200 | 4hr |
| 138.3 Auto-expand | 30 | 1hr |
| 138.4 Emissions meter | 40 | 1hr |
| 138.5 Context controls | 50 | 1hr |
| 138.6 Polish | 50 | 1hr |
| **Total** | **450** | **10hr** |

## Success Criteria
1. Default view is single line, not intimidating
2. Users can tell status at a glance (green/yellow/red)
3. Radar provides spatial awareness
4. Combat mode appears automatically when needed
5. Panel feels "quiet" during peaceful travel

# TODO: Shared Fullscreen Map Display

**Created:** 2025-12-03
**Priority:** P2
**Est:** 4-6h
**Status:** PLANNING

## Problem Statement

The Traveller Map integration needs a way to display on a shared screen (TV, projector) that all players can see during sessions. Currently the map is embedded in the Astrogator's role panel only.

---

## Theoretical Use Cases

### UC-1: Game Room Setup
**Scenario:** GM has laptop + wall-mounted TV
**Flow:**
1. GM opens "Shared Display" from hamburger menu
2. Opens URL on TV browser (Chromecast, HDMI, etc.)
3. Map shows current system with ship position
4. Updates in real-time as Astrogator plots jumps

**Requirements:**
- Dedicated URL route `/operations/map-display`
- No controls, just display (read-only)
- Auto-scales to fill screen
- Syncs with campaign's current location

### UC-2: Remote Session Screen Share
**Scenario:** Discord/Zoom game, GM shares screen
**Flow:**
1. GM pops out map to separate window
2. Shares that window via Discord screen share
3. Players see map alongside their own role panels

**Requirements:**
- "Pop out to new window" option
- Clean display without distracting UI
- Works in standard browser popup

### UC-3: Player Reference (Non-Astrogator)
**Scenario:** Captain/Pilot wants to see the map too
**Flow:**
1. Player clicks "View Map" from their role panel
2. Map overlay appears showing current system
3. Read-only, no jump plotting controls

**Requirements:**
- View-only mode for non-Astrogator roles
- Modal or side panel display
- Shows current location + contacts

### UC-4: Jump Planning Display
**Scenario:** Planning multi-jump route with whole group
**Flow:**
1. Astrogator plots tentative route
2. Route appears on shared display
3. Group discusses, Astrogator adjusts
4. Final route confirmed

**Requirements:**
- Route waypoints visible on shared display
- Real-time sync with Astrogator's plotting
- Visual fuel/time estimates per leg

---

## Implementation Options

### Option A: Separate Route with Socket Sync
```
/operations/map-display?campaign=X
```
- Standalone page, connects via socket
- Receives `mapUpdate` events from server
- Pros: Clean separation, works on any device
- Cons: Extra route to maintain

### Option B: Pop-out Window from Main App
```javascript
window.open('/operations#map-fullscreen', 'map', 'popup,width=1920,height=1080')
```
- Main app opens child window
- Child receives postMessage updates
- Pros: Single codebase, parent-child communication
- Cons: Popup blockers, more complex state

### Option C: Overlay Mode in Main App
```
/operations?display=map
```
- Query param triggers fullscreen map mode
- Same page, different CSS layout
- Pros: Simplest, reuses existing code
- Cons: Can't run alongside role panel

**Recommended: Option A** - Most flexible for UC-1 (TV display)

---

## Technical Design

### New Files
- `public/operations/map-display.html` - Minimal HTML shell
- `public/operations/map-display.js` - Socket client + TravellerMap embed

### Socket Events
```javascript
// Server broadcasts to campaign room
socket.to(campaignRoom).emit('ops:mapSync', {
  location: { sector, hex },
  route: [{ sector, hex, eta }],
  contacts: [{ id, bearing, range }]
});

// Display client joins campaign room
socket.emit('ops:joinMapDisplay', { campaignId });
```

### Hamburger Menu Addition
```html
<a href="#" onclick="openSharedMap()">
  <span class="menu-icon">🗺️</span>
  Shared Map Display
</a>
```

### Map Display Features
- Full viewport TravellerMap embed
- Current location marker (pulsing)
- Jump route overlay (if plotted)
- Contact markers (optional toggle)
- Campaign name + current date header
- Auto-reconnect on disconnect

---

## UI/UX Considerations

1. **TV-friendly font sizes** - Minimum 24px for readability at distance
2. **Dark theme only** - Matches game room ambiance
3. **No scrollbars** - Fixed viewport, map handles zoom
4. **Minimal chrome** - Campaign name, date, connection status only
5. **Auto-hide cursor** - After 3s inactivity

---

## Phases

### Phase 1: Basic Display (2h)
- [ ] Create map-display.html route
- [ ] Socket connection + campaign join
- [ ] TravellerMap embed with current location
- [ ] Add hamburger menu link

### Phase 2: Live Sync (2h)
- [ ] Server broadcasts location changes
- [ ] Route visualization
- [ ] Contact markers

### Phase 3: Polish (2h)
- [ ] TV-optimized styling
- [ ] Auto-hide cursor
- [ ] Connection status indicator
- [ ] Fullscreen API button

---

## Dependencies

- TravellerMap API (external)
- Existing Astrogator location tracking
- Socket.io campaign rooms

## Notes

- Consider "display code" for easy TV connection (e.g., "Enter code: A7X3")
- May want QR code for mobile phones to show map
- Future: Multiple map instances for different zoom levels

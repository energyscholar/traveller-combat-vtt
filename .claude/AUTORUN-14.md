# AUTORUN 14: Shared Map & Advanced Features

**Created:** 2025-12-02
**Status:** PLANNED (after AR-13)
**Risk Level:** TBD
**Prerequisite:** AUTORUN-13 complete

---

## Overview

Post AR-13 features focused on collaborative gameplay.

---

## Stage 14.1: Shared Traveller Map View
**Risk:** MEDIUM | **LOC:** ~300 | **Priority:** HIGH

GM-controlled shared map display for all players.

### Features:
- GM can display Traveller Map centered on any system
- GM controls zoom level
- All players see same center point and scale
- Players can interact (hover for info, click for details)
- Like Astrogator PLOT JUMP but without astrogation controls

### Implementation:
1. New "Map View" panel (or Captain/GM tool)
2. Socket events: `setMapCenter`, `setMapZoom`, `mapStateSync`
3. Store map state in session (center coords, zoom level)
4. Read-only player view (GM is authority)
5. Optional: Allow GM to "hand off" control to Astrogator

### Use Cases:
- "We're here, heading there" tactical briefing
- Planning routes as a group
- Showing players what's in sensor range
- Dramatic "you've arrived at..." reveals

---

## Stage 14.2+: TBD

Additional features to be planned after AR-13 completion.

### Candidates:
- Ship System Tracking (from TODO-ship-system-tracking.md)
- Client-side app.js modularization (if not completed in 13.6)
- Performance optimization
- Additional Design Pattern implementations

---

## Notes

This autorun will be fully planned after AR-13 is complete and we understand the new state of the codebase.

# AR-100: Internationalization (i18n) Plan

**Status:** PLANNING DOCUMENT
**Priority:** P4 (Future)
**Estimated Implementation:** 20-40h when executed

---

## Overview

This document outlines a future multi-language support plan for Traveller Combat VTT. No implementation is scheduled; this is a reference for future work.

---

## Current State Audit

### UI Text Sources (~1,500 strings)

| Category | Location | Count | Notes |
|----------|----------|-------|-------|
| Role Panels | role-panels.js | ~400 | Button labels, status text |
| Notifications | app.js | ~200 | Toast messages |
| Modals | index.html | ~150 | Modal titles/content |
| System Map | system-map.js | ~100 | Labels, tooltips |
| Combat UI | combat.js | ~100 | Actions, results |
| Server Messages | socket handlers | ~200 | Error/success messages |
| Ship Templates | data/ships/*.json | ~200 | System names, descriptions |
| Star Systems | data/star-systems/*.json | ~150 | Location names |

### Priority Languages (by Traveller community size)

1. **English (en)** - Default, already complete
2. **German (de)** - Largest EU Traveller community
3. **French (fr)** - Strong EU presence
4. **Spanish (es)** - Growing community
5. **Japanese (ja)** - Active Traveller community

---

## Recommended Architecture

### Option A: JSON Translation Files (Recommended)

```
locales/
├── en.json          # English (source of truth)
├── de.json          # German
├── fr.json          # French
└── es.json          # Spanish

# Format:
{
  "pilot.setCourse": "Set Course",
  "pilot.travel": "Travel",
  "pilot.undock": "Undock",
  "notifications.travelComplete": "Arrived at {destination}",
  "errors.jumpFuelInsufficient": "Insufficient fuel for Jump-{distance}"
}
```

**Pros:**
- Simple, no build step
- Easy for translators (can use online tools)
- No runtime dependencies

**Cons:**
- No pluralization built-in
- String interpolation must be manual

### Option B: i18next Library

```javascript
import i18next from 'i18next';

i18next.init({
  lng: 'en',
  resources: {
    en: { translation: require('./locales/en.json') },
    de: { translation: require('./locales/de.json') }
  }
});

// Usage:
i18next.t('pilot.travel');
i18next.t('notifications.arrived', { destination: 'Flammarion' });
```

**Pros:**
- Pluralization, interpolation, formatting
- Industry standard
- Hot reload in dev

**Cons:**
- 40KB bundle addition
- Async loading complexity

---

## Implementation Phases

### Phase 1: Extract Strings (8h)

1. Create `locales/en.json` with all UI strings
2. Add `t()` helper function to app.js
3. Replace hardcoded strings in role-panels.js
4. Update notification messages

### Phase 2: Server Messages (4h)

1. Move server error messages to locale files
2. Pass locale preference in socket handshake
3. Return localized error messages

### Phase 3: Language Selector (2h)

1. Add language dropdown to settings
2. Store preference in localStorage
3. Reload UI on language change

### Phase 4: Additional Languages (6h per language)

1. Translate en.json → target language
2. Test all UI flows
3. Fix layout issues (German strings are ~30% longer)

---

## Technical Considerations

### String Length Variance

| Language | Avg. Length vs English |
|----------|------------------------|
| German   | +30%                   |
| French   | +20%                   |
| Spanish  | +15%                   |
| Japanese | -40% (but wider chars) |

**Solution:** CSS with `min-width` on buttons, text overflow handling

### Dynamic Content

- Ship names remain in English (proper nouns)
- Star system names remain canonical
- Only UI chrome/labels are translated

### Font Requirements

- Latin scripts: Current fonts work
- Japanese: May need font addition (~2MB)

---

## Testing Strategy

1. **Pseudo-locale:** Create `pseudo.json` with doubled strings to catch overflow
2. **Screenshot comparison:** Compare layouts across languages
3. **String coverage:** Script to find untranslated strings

---

## Resources Required

- 20-40h initial implementation (Phase 1-3)
- 6h per additional language
- Translator access or budget (~$0.10/word for professional)

---

## Decision: Do Not Implement Now

**Rationale:**
1. Current user base is English-speaking
2. Core features still in active development
3. i18n changes are disruptive to ongoing work
4. Better to stabilize feature set first

**Trigger for Implementation:**
- Non-English community request
- 100+ active users
- Feature freeze for v1.0

---

*Created: 2024-12-12*
*AR-100 Planning Document - No Implementation Scheduled*

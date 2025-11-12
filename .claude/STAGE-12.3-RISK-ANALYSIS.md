# Stage 12.3 Risk Analysis - SVG Ship Schematics

**Date:** 2025-11-12
**Sub-stage:** 12.3 - SVG Ship Schematics (2-3 days)
**Status:** Pre-implementation Risk Assessment

---

## Risk Assessment

### 🔴 HIGH RISK: SVG Complexity Could Break Timeline

**Risk:** Creating 9 unique, accurate SVG ship schematics could take much longer than estimated (2-3 days)

**Impact:** High - Could delay entire Stage 12

**Likelihood:** High - SVG design is time-consuming, especially for 9 ships

**Mitigation Strategy:**
1. **START SIMPLE:** Create ONE minimal SVG first (Scout) as proof of concept
2. **TEMPLATE APPROACH:** Use same basic shape for all ships, vary only:
   - Number of turret circles
   - Size (hull tonnage)
   - Color scheme
3. **EMBED IN HTML:** Don't create separate .svg files - embed directly in ship-customizer.html for faster iteration
4. **FALLBACK PLAN:** If SVGs take >4 hours total, switch to simple HTML div-based layout
5. **SCOPE LIMIT:** Max 100 lines SVG per ship (as per original plan)

**Success Criteria:** All 9 SVGs created and tested in <4 hours total

---

### 🟡 MEDIUM RISK: Click Detection May Not Work Reliably

**Risk:** SVG click handlers might not work across all browsers or might interfere with existing code

**Impact:** Medium - Core interaction broken

**Likelihood:** Medium - SVG event handling can be finicky

**Mitigation Strategy:**
1. **TEST EARLY:** Verify click detection works on first SVG before creating others
2. **USE DATA ATTRIBUTES:** Store component type in `data-component="turret1"` for easy access
3. **EVENT DELEGATION:** Use single click handler on SVG root, not individual elements
4. **BROWSER COMPATIBILITY:** Test in Chrome (main target), fallback to div-based UI if issues

**Success Criteria:** Click on any component highlights it and logs component type

---

### 🟡 MEDIUM RISK: CSS Styling Conflicts

**Risk:** New SVG styles might conflict with existing combat UI styles

**Impact:** Medium - Visual bugs, broken layouts

**Likelihood:** Low-Medium - Existing styles are namespaced but SVG adds complexity

**Mitigation Strategy:**
1. **NAMESPACE STYLES:** All new styles prefixed with `.ship-customizer-*`
2. **SEPARATE CSS FILE:** Create `public/ship-customizer.css` to isolate styles
3. **TEST ISOLATION:** Load customizer page standalone first, then integrate
4. **REUSE EXISTING:** Use existing `.card` styles where possible

**Success Criteria:** Customizer loads without breaking combat page, vice versa

---

### 🟢 LOW RISK: Performance Issues with 9 SVGs

**Risk:** Loading 9 SVG schematics might slow page load or cause lag

**Impact:** Low - Noticeable but not blocking

**Likelihood:** Low - SVGs are small (<100 lines each)

**Mitigation Strategy:**
1. **LAZY LOAD:** Only render SVG for currently selected ship template
2. **OPTIMIZE:** Remove unnecessary SVG elements, use simple shapes
3. **CACHE:** Store SVG templates in JavaScript, not separate files
4. **MONITOR:** Check page load time, aim for <500ms

**Success Criteria:** Page loads in <1 second even with all 9 ships

---

### 🟢 LOW RISK: Routing to Customizer Breaks

**Risk:** `?mode=customize` routing might have bugs

**Impact:** Low - Already tested in 12.2

**Likelihood:** Very Low - Routing logic is simple and working

**Mitigation Strategy:**
1. **REUSE 12.2 LOGIC:** Already tested and working
2. **ADD ONE CHECK:** Verify customizer div shows when mode=customize
3. **MANUAL TEST:** Click "Customize Ship" button from menu

**Success Criteria:** Clicking "Customize Ship" shows customizer page

---

## Implementation Plan (Revised for Risk Mitigation)

### Phase 1: Proof of Concept (1 hour)
1. Create `ship-customizer.html` with basic structure
2. Create ONE simple SVG schematic (Scout) - embedded inline
3. Add click detection for ONE component (Turret 1)
4. Verify routing works (`?mode=customize` loads page)
5. **DECISION POINT:** If PoC works, continue. If not, switch to div-based UI.

### Phase 2: Template System (1 hour)
1. Extract SVG into JavaScript template function
2. Create template for remaining 8 ships (parameterized)
3. Add ship selector sidebar (radio buttons)
4. Load different SVG based on selection

### Phase 3: Interactivity (1 hour)
1. Add CSS hover effects for all components
2. Implement click handler for all component types
3. Show component info panel when clicked
4. Add visual highlighting for selected component

### Phase 4: Testing & Polish (30 min)
1. Manual test all 9 ships load correctly
2. Test click detection on all component types
3. Verify routing still works
4. Run full test suite (zero regressions)

**Total Time Estimate:** 3.5 hours (well under 2-3 day estimate)

---

## Rollback Plan

If SVG approach fails or takes >4 hours:

**FALLBACK: HTML Div-Based UI**
```html
<div class="ship-schematic">
  <div class="component turret" data-component="turret1">Turret 1</div>
  <div class="component cargo" data-component="cargo">Cargo Bay</div>
  <div class="component m-drive" data-component="m-drive">M-Drive</div>
</div>
```

This approach:
- Simpler to implement (1 hour total)
- 100% reliable click detection
- Easier to style
- Still functional, just less visually appealing

**Decision Trigger:** If Phase 1 PoC not complete in 1.5 hours, switch to fallback

---

## Testing Strategy

### Manual Tests
- [ ] Load `?mode=customize` - shows customizer page
- [ ] Click each ship template - SVG changes
- [ ] Click each component type - highlights and shows info
- [ ] Hover over components - visual feedback
- [ ] Verify combat mode still works (`?mode=battle`)

### Automated Tests (Deferred to 12.7)
- Browser test: Load customizer page
- Browser test: Click component detection
- Unit test: SVG template generation

### Success Criteria
- All 9 ship SVGs render correctly
- All components clickable
- Zero test regressions
- Completed in <4 hours

---

## Key Metrics

| Metric | Target | Fallback Trigger |
|--------|--------|------------------|
| Time to PoC | <1.5 hours | Switch to div-based |
| Total time | <4 hours | Re-scope to fewer ships |
| SVG lines per ship | <100 | Simplify shapes |
| Test regressions | 0 | Fix before commit |
| Page load time | <1 second | Lazy load SVGs |

---

## Lessons from Previous Stages

1. **Start Simple:** Stage 11 taught us to test incrementally
2. **Fallback Plans:** Always have a simpler alternative ready
3. **Zero Regressions:** Run full test suite before commit
4. **Modular Code:** Keep customizer separate from combat code

---

## Next Sub-stage Preview

**12.4: Ship Customization UI** - Will build component customization panels that appear when SVG components are clicked. Risk: Form complexity and validation logic.

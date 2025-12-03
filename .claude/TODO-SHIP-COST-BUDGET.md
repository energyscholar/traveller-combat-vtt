# TODO: Ship Cost & Budget System

**Created:** 2025-12-03
**Priority:** P2
**Est:** 4-6h
**Depends on:** AR-17 (Ship Template Editor) - COMPLETE

## Requirements

### 1. CRUD for Existing Ships
- [x] Create - via Custom Ship button
- [x] Update - via Edit button on ship card
- [ ] Read - ship details modal (exists as Ship Status)
- [ ] Delete - add delete button to ship cards in GM Setup

### 2. Cost Tracking (MCr)

Add cost fields to all ship components:

| Component | Cost Source |
|-----------|-------------|
| Hull | tonnage × base rate |
| Armor | type × tonnage |
| M-Drive | thrust × tonnage % |
| J-Drive | rating × tonnage % |
| Power Plant | output × rate |
| Bridge | fixed by size |
| Computer | model tier |
| Sensors | grade tier |
| Weapons | type + mount |
| Systems | per system type |
| Staterooms | count × 0.5 MCr |
| Low Berths | count × 0.05 MCr |
| Common Areas | tonnage × 0.1 MCr |

### 3. Budget System

- Add budget input field (MCr) in editor header
- Default budget from template base cost
- Display: `Cost: X.XX MCr / Budget: Y.YY MCr`
- Color coding:
  - Green: cost < 90% budget
  - Yellow: 90-100% budget
  - Red: over budget (negative)

### 4. Save Validation

- Block SAVE if cost > budget
- Show error: "Ship cost (X MCr) exceeds budget (Y MCr)"
- Allow "Save Anyway" option for GM override

## Implementation

### Phase 1: Cost Display
- Add cost field to v2 template schema (already exists)
- Calculate component costs from High Guard tables
- Display running total in validation summary

### Phase 2: Budget UI
- Add budget input to editor
- Add cost vs budget progress bar
- Color code based on ratio

### Phase 3: Save Validation
- Check cost <= budget before save
- Show confirmation dialog if over budget
- Add GM override checkbox

## Files to Modify

- `public/operations/app.js` - Cost calculation, budget UI
- `public/operations/index.html` - Budget input field
- `public/operations/styles.css` - Budget bar styling
- `data/ships/v2/*.json` - Ensure cost data complete

## Cost Tables (High Guard Reference)

```
Hull: 0.1 MCr per ton (standard), 0.2 MCr (streamlined)
Armor: Varies by type and TL
M-Drive: 1.5 MCr per % of hull per G
J-Drive: 5 MCr per % of hull per parsec
Power Plant: 1 MCr per ton
Bridge: 0.5 MCr per 100 tons
Computer: 0.03-3 MCr by model
Sensors: 0.05-4 MCr by grade
Turret: 0.2 MCr single, 0.5 double, 1 MCr triple
Pulse Laser: 0.5 MCr
Beam Laser: 1 MCr
Sandcaster: 0.25 MCr
Missile Rack: 0.75 MCr
Stateroom: 0.5 MCr each
Low Berth: 0.05 MCr each
```

## Notes

- Ship templates already have cost data in `costs.base` field
- Validation should be a warning, not a hard block (GM discretion)
- Consider adding "maintenance cost" display as well

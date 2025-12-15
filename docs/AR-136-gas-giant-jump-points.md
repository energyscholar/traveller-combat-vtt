# AR-136: Gas Giant Jump Point Generation

## Summary
Every star system with a gas giant needs a "Jump Point from Gas Giant" destination located 100 planetary diameters away from the gas giant. This is the quickest path to jump after fuel skimming.

## Rationale
After skimming fuel from a gas giant, ships need to reach a safe jump distance. The 100-diameter limit is standard Traveller rules. Currently ships would need to travel to the main jump point, which may be much farther.

## Requirements

### 136.1 Data Structure
- Each gas giant in `celestialObjects` needs a corresponding jump point
- Jump point properties:
  - `type: 'jump-point'`
  - `name: 'Jump Point from [Gas Giant Name]'`
  - `parent: [gas giant id]`
  - `orbitKm: [gas giant diameter * 100]`
  - `jumpSafe: true`

### 136.2 Generation Logic
```javascript
function generateGasGiantJumpPoints(system) {
  const gasGiants = system.celestialObjects.filter(o =>
    o.type === 'Gas Giant' || o.type === 'Ice Giant'
  );

  for (const gg of gasGiants) {
    const diameterKm = gg.diameter || estimateDiameter(gg);
    const jumpPointOrbit = diameterKm * 100;

    system.celestialObjects.push({
      id: `${gg.id}-jump-point`,
      type: 'jump-point',
      name: `Jump Point from ${gg.name}`,
      parent: gg.id,
      orbitKm: jumpPointOrbit,
      jumpSafe: true
    });
  }
}
```

### 136.3 Integration Points
- `lib/operations/star-systems.js` - Add to system generation/loading
- `public/operations/modules/system-map.js` - Render jump points
- Destination selection UI - Include gas giant jump points

### 136.4 Affected Systems (District 268 route)
| System | Gas Giants | Jump Points Needed |
|--------|------------|-------------------|
| Flammarion | TBD | TBD |
| Faldor | TBD | TBD |
| Caladbolg | TBD | TBD |
| Elixabeth | Yes (confirmed) | 1+ |
| Noctocol | TBD | TBD |
| Talos | TBD | TBD |
| Collace | TBD | TBD |

## Dependencies
- Star system data must include gas giant diameters
- System map must render jump points distinctly

## Risk: LOW
- Additive feature, no breaking changes
- Pure data generation

## Estimate
- LOC: ~50
- Time: 1-2 hours

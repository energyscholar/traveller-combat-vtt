# Q-Ship Fleet vs Pirate Fleet - Combat Demo

This is an automated playthrough of Demo 5, showcasing multi-ship fleet combat.

## Scenario Setup

### Q-SHIP FLEET (8 ships)
| Ship | Type | Tonnage | HP | Weapons |
|------|------|---------|----|---------|
| Astral Dawn | Q-Ship/Carrier | 600t | 240 | Particle beam, missiles, turrets |
| Tlatl 1-6 | Light Fighters | 10t | 4 | Missile rack, pulse laser |
| Razorback | Armed Pinnace | 40t | 16 | Pulse laser |

### PIRATE FLEET (5 ships)
| Ship | Type | Tonnage | HP | Weapons |
|------|------|---------|----|---------|
| Black Widow | Corsair | 400t | 160 | Triple turrets, missiles |
| Black Fang | Corsair | 400t | 160 | Triple turrets, missiles |
| Leech 1-2 | Pirate Fighters | 30t | 12 | Pulse laser |
| Scavenger | Salvage Ship | 1000t | 400 | Mining lasers |

**Starting Range:** Medium (1,250-10,000 km)
**Surprise:** Q-Ship fleet has surprise (pirates approached thinking it was a merchant)

---

## Combat Log

```
═══ AMBUSH! ═══
Pirates approached what they thought was a merchant...
Q-Ship reveals hidden weapons!
"It's a trap! All ships, defensive positions!"

Q-SHIP FLEET HAS SURPRISE!

═══ ROUND 1: ATTACK ═══
═══ FIGHTER ALPHA STRIKE ═══

Tlatl 1 fires missile_rack at Black Widow +2 surprise
  4+-1=3 → MISS
Tlatl 2 fires missile_rack at Black Widow +2 surprise
  11+-1=10 → HIT
  10 - 4 armor = 6 damage
Tlatl 3 fires missile_rack at Black Widow +2 surprise
  11+-1=10 → HIT
  16 - 4 armor = 12 damage
Tlatl 4 fires missile_rack at Black Fang +2 surprise
  11+-1=10 → HIT
  16 - 4 armor = 12 damage

═══ Q-SHIP ATTACKS ═══

Astral Dawn fires particle_beam at Black Widow
  9+4=13 → HIT
  18 - 4 armor = 14 damage
Astral Dawn fires missile_launcher at Black Widow
  10+4=14 → HIT
  21 - 4 armor = 17 damage

Black Widow: 160 → 111 HP (69%)

Razorback fires pulse_laser at Leech 1
  8+2=10 → HIT
  6 - 0 armor = 6 damage

═══ ROUND 1 COMPLETE ═══
Player: 8/8 ships
Pirates: 5/5 ships (damaged)

─────────────────────────────────────────

═══ ROUND 2: INITIATIVE ═══

Pirates recover from surprise!

═══ ROUND 2: ATTACK ═══

Black Widow fires pulse_laser at Astral Dawn
  5+4=9 → HIT
  5 - 1 armor = 4 damage
Black Fang fires pulse_laser at Astral Dawn
  9+4=13 → HIT
  4 - 1 armor = 3 damage
Leech 1 fires pulse_laser at Tlatl 6
  9+1=10 → HIT
  7 - 0 armor = 7 damage
  >>> Tlatl 6 DESTROYED! <<<
Leech 2 fires pulse_laser at Tlatl 2
  12+1=13 → HIT
  10 - 0 armor = 10 damage
  >>> Tlatl 2 DESTROYED! <<<

═══ PIRATE ATTACK COMPLETE ═══

Tlatl 1 fires pulse_laser at Black Widow
  8+0=8 → HIT
  4 - 4 armor = 0 damage (deflected)
Astral Dawn fires particle_beam at Black Widow
  10+4=14 → HIT
  24 - 4 armor = 20 damage

Black Widow: 111 → 39 HP (24%) CRITICAL DAMAGE

═══ ROUND 2 COMPLETE ═══
Player: 6/8 ships
Pirates: 5/5 ships

─────────────────────────────────────────

╔══════════════════════════════════════════════════════════════╗
║                  ⚔ FLEET ACTION REPORT ⚔                   ║
╚══════════════════════════════════════════════════════════════╝

STALEMATE
Neither side gains ground.

YOUR FLEET:
  Surviving: 6/8 ships
  Destroyed: Tlatl 2, Tlatl 6

ENEMY FLEET:
  Surviving: 5/5 ships
  Damaged: Black Widow (24% HP)

Engagement lasted 2 rounds.
Final range: Medium | Missiles fired: 37
```

---

## Combat Mechanics Demonstrated

- **Surprise Round:** Q-Ship fleet acts first with +2 to hit
- **Initiative:** 2d6 + tactics determines turn order each round
- **Attack Roll:** 2d6 + Gunner skill >= 8 to hit (modified by range)
- **Damage:** Weapon damage - target armor = hull damage
- **Ship Destruction:** When HP reaches 0, ship is destroyed
- **Armor:** Reduces incoming damage (Black Widow has 4 armor)

## How to Run This Demo

```bash
cd traveller-combat-vtt
npm run demo
# Select option [5] Q-Ship Fleet vs Pirate Fleet
```

Other available demos:
- [1] Kimbly vs Pirate Scout (simple 1v1)
- [2] Astral Dawn vs Patrol Corvette
- [4] Q-Ship Fleet vs Destroyer Escort
- [6] Engine Demo (architecture showcase)

---

*Traveller Starship Operations VTT v0.72.0*

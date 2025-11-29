// ============================================================
// PHASE SYSTEM - Traveller Combat Phases
// ============================================================
// Implements Manoeuvre → Attack → Actions phase sequencing
// with initiative, thrust allocation, weapon firing, and point defense

const { DiceRoller } = require('./dice');

// Phase state (simple in-memory state for now)
let currentPhase = 'manoeuvre';
let currentRound = 1;

// Reset phase state (for testing)
function resetPhaseState() {
  currentPhase = 'manoeuvre';
  currentRound = 1;
}

// ============================================================
// INITIATIVE SYSTEM
// ============================================================

// Calculate initiative: 2d6 + pilot skill + thrust
// Supports optional fixed dice for testing
function calculateInitiative(ship, fixedDice = null) {
  const dice = new DiceRoller();
  const roll = fixedDice ? (fixedDice[0] + fixedDice[1]) : dice.roll2d6().total;
  const pilotSkill = ship.pilotSkill || 0;
  const thrust = ship.thrust || 0;

  return roll + pilotSkill + thrust;
}

// Get initiative order (sorted high to low, tie-break by ID)
function getInitiativeOrder(ships) {
  const sorted = [...ships];

  sorted.sort((a, b) => {
    if (b.initiative !== a.initiative) {
      return b.initiative - a.initiative;
    }
    // Tie-breaker: alphabetical by ID
    return a.id.localeCompare(b.id);
  });

  return sorted;
}

// ============================================================
// PHASE SEQUENCING
// ============================================================

function getCurrentPhase() {
  return currentPhase;
}

function getCurrentRound() {
  return currentRound;
}

function advancePhase() {
  const phaseOrder = ['manoeuvre', 'attack', 'actions', 'round_end'];
  const currentIndex = phaseOrder.indexOf(currentPhase);

  if (currentIndex === phaseOrder.length - 1) {
    // End of round - go back to manoeuvre and increment round
    currentPhase = 'manoeuvre';
    currentRound++;
  } else {
    currentPhase = phaseOrder[currentIndex + 1];
  }
}

// ============================================================
// THRUST ALLOCATION
// ============================================================

function allocateThrust(ship, type, amount) {
  if (!ship.thrust || !ship.thrust.allocated) {
    return {
      success: false,
      message: 'Ship thrust not initialized'
    };
  }

  const remaining = getRemainingThrust(ship);

  if (amount > remaining) {
    return {
      success: false,
      message: `Insufficient thrust. Requested: ${amount}, Available: ${remaining}`
    };
  }

  ship.thrust.allocated[type] += amount;

  return {
    success: true,
    allocated: ship.thrust.allocated[type]
  };
}

function getRemainingThrust(ship) {
  if (!ship.thrust) return 0;

  const total = ship.thrust.total || 0;
  const allocated = ship.thrust.allocated || { movement: 0, evasive: 0 };
  const used = (allocated.movement || 0) + (allocated.evasive || 0);

  return total - used;
}

// ============================================================
// WEAPON SYSTEMS
// ============================================================

function canFireWeapon(turret, weaponId, crew = null) {
  // Check if crew role allows firing (if crew provided)
  if (crew && crew.role !== 'gunner') {
    return false;
  }

  // Check if crew is alive
  if (crew && !crew.alive) {
    return false;
  }

  // Check turret operational
  if (turret.operational === false) {
    return false;
  }

  // Check if turret already used this round
  if (turret.usedThisRound) {
    return false;
  }

  // Check if weapon exists and is operational
  if (!turret.weapons || !turret.weapons[weaponId]) {
    return false;
  }

  const weapon = turret.weapons[weaponId];

  if (weapon.operational === false) {
    return false;
  }

  if (weapon.usedThisRound) {
    return false;
  }

  return true;
}

function fireWeapon(turret, weaponId) {
  if (!turret.weapons || !turret.weapons[weaponId]) {
    return {
      success: false,
      message: 'Weapon not found'
    };
  }

  const weapon = turret.weapons[weaponId];

  // Check if turret already fired
  if (turret.usedThisRound) {
    return {
      success: false,
      message: 'Turret already fired this round'
    };
  }

  // Check ammo for missile racks
  if (weaponId === 'missile_rack') {
    if (!weapon.missilesRemaining || weapon.missilesRemaining <= 0) {
      return {
        success: false,
        message: 'No missiles remaining'
      };
    }
    weapon.missilesRemaining--;
  }

  // Check ammo for sandcasters
  if (weaponId === 'sandcaster') {
    if (!weapon.canistersRemaining || weapon.canistersRemaining <= 0) {
      return {
        success: false,
        message: 'No sand canisters remaining'
      };
    }
    weapon.canistersRemaining--;
  }

  // Mark weapon and turret as used
  weapon.usedThisRound = true;
  turret.usedThisRound = true;

  return {
    success: true,
    weapon: weaponId
  };
}

function getTurretStatus(turret) {
  const weaponsFired = Object.values(turret.weapons || {})
    .filter(w => w.usedThisRound).length;

  return {
    available: !turret.usedThisRound,
    weaponsFired
  };
}

function resetTurretFlags(turret) {
  turret.usedThisRound = false;

  if (turret.weapons) {
    Object.values(turret.weapons).forEach(weapon => {
      weapon.usedThisRound = false;
      if (weapon.usedForPointDefense !== undefined) {
        weapon.usedForPointDefense = false;
      }
    });
  }
}

// ============================================================
// POINT DEFENSE
// ============================================================

function canUsePointDefense(turret, weaponId, targetType) {
  if (!turret.weapons || !turret.weapons[weaponId]) {
    return false;
  }

  const weapon = turret.weapons[weaponId];

  // Check if already used
  if (weapon.usedThisRound || turret.usedThisRound) {
    return false;
  }

  // Lasers intercept missiles
  if ((weaponId === 'pulse_laser' || weaponId === 'beam_laser') && targetType === 'missile') {
    return true;
  }

  // Sandcasters intercept lasers
  if (weaponId === 'sandcaster' && targetType === 'laser') {
    if (!weapon.canistersRemaining || weapon.canistersRemaining <= 0) {
      return false;
    }
    return true;
  }

  return false;
}

function usePointDefense(turret, weaponId, targetType) {
  if (!canUsePointDefense(turret, weaponId, targetType)) {
    return {
      success: false,
      message: 'Cannot use point defense'
    };
  }

  const weapon = turret.weapons[weaponId];

  // Deplete sandcaster ammo
  if (weaponId === 'sandcaster') {
    weapon.canistersRemaining--;
  }

  // Mark as used
  weapon.usedThisRound = true;
  weapon.usedForPointDefense = true;
  turret.usedThisRound = true;

  return {
    success: true,
    weaponId,
    targetType
  };
}

// ============================================================
// ROLE-BASED ACTION GATING
// ============================================================

function canActInPhase(crew, phase, ship = null) {
  // Dead crew cannot act
  if (!crew.alive) {
    return false;
  }

  // Destroyed ship cannot act
  if (ship && isShipDestroyed(ship)) {
    return false;
  }

  // Role-based phase restrictions
  if (phase === 'manoeuvre') {
    return crew.role === 'pilot';
  }

  if (phase === 'attack') {
    return crew.role === 'gunner';
  }

  if (phase === 'actions') {
    // All roles can act in actions phase
    return true;
  }

  return false;
}

function canAllocateThrust(crew, ship = null) {
  if (!crew || !crew.alive) {
    return false;
  }

  // Allow pilots OR crew with canPilot capability
  if (crew.role !== 'pilot' && !crew.canPilot) {
    return false;
  }

  // Check M-Drive operational
  if (ship && ship.systems && ship.systems.mDrive) {
    return ship.systems.mDrive.operational !== false;
  }

  return true;
}

function canRepairSystem(system, crew) {
  if (!crew || !crew.alive) {
    return false;
  }

  if (crew.role !== 'engineer') {
    return false;
  }

  if (!system || !system.damaged) {
    return false;
  }

  return true;
}

function repairSystem(system, crew) {
  if (!canRepairSystem(system, crew)) {
    return {
      attemptMade: false,
      success: false
    };
  }

  // Critical systems cannot be repaired mid-combat
  if (system.critical) {
    return {
      attemptMade: true,
      success: false,
      message: 'Critical damage too severe for mid-combat repair'
    };
  }

  // Simple repair attempt (would normally involve skill check)
  const dice = new DiceRoller();
  const roll = dice.roll2d6().total;
  const skill = crew.skill || 0;
  const success = (roll + skill) >= 8;

  if (success) {
    system.operational = true;
    system.damaged = false;
  }

  return {
    attemptMade: true,
    success,
    roll,
    skill
  };
}

// ============================================================
// EDGE CASES
// ============================================================

function isShipDestroyed(ship) {
  if (!ship.hull) return false;

  const currentHull = ship.hull.current !== undefined ? ship.hull.current : ship.hull;
  return currentHull <= 0;
}

function isSystemDisabled(system) {
  return system.operational === false;
}

function getAttackDM(ship) {
  let dm = 0;

  // Sensor damage penalty
  if (ship.systems && ship.systems.sensors && ship.systems.sensors.operational === false) {
    dm -= 2; // -2 DM for disabled sensors
  }

  return dm;
}

function getEffectiveThrust(ship) {
  if (!ship.thrust || !ship.thrust.total) return 0;

  let thrust = ship.thrust.total;

  // Power plant damage reduces thrust
  if (ship.systems && ship.systems.powerPlant) {
    if (ship.systems.powerPlant.operational === false) {
      const efficiency = ship.systems.powerPlant.efficiency || 0.5;
      thrust = Math.floor(thrust * efficiency);
    }
  }

  return thrust;
}

// ============================================================
// ROUND MANAGEMENT
// ============================================================

function resetRoundFlags(ship) {
  // Reset turrets
  if (ship.turrets) {
    ship.turrets.forEach(turret => {
      resetTurretFlags(turret);
    });
  }

  // Reset thrust
  if (ship.thrust && ship.thrust.allocated) {
    ship.thrust.allocated.movement = 0;
    ship.thrust.allocated.evasive = 0;
  }
}

module.exports = {
  // Initiative
  calculateInitiative,
  getInitiativeOrder,

  // Phase sequencing
  getCurrentPhase,
  getCurrentRound,
  advancePhase,
  resetPhaseState,

  // Thrust allocation
  allocateThrust,
  getRemainingThrust,

  // Weapon systems
  canFireWeapon,
  fireWeapon,
  getTurretStatus,
  resetTurretFlags,

  // Point defense
  canUsePointDefense,
  usePointDefense,

  // Role-based gating
  canActInPhase,
  canAllocateThrust,
  canRepairSystem,
  repairSystem,

  // Edge cases
  isShipDestroyed,
  isSystemDisabled,
  getAttackDM,
  getEffectiveThrust,

  // Round management
  resetRoundFlags
};

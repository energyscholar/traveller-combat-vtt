/**
 * Passenger Manifest System (AR-46)
 * Tracks passengers, cabin assignments, and morale
 */

const { db, generateId } = require('./database');

// Passenger types
const PASSENGER_TYPES = {
  HIGH: 'high',
  MIDDLE: 'middle',
  LOW: 'low',
  WORKING: 'working',
  REFUGEE: 'refugee'
};

// Passenger status
const PASSENGER_STATUS = {
  CONTENT: 'content',
  ANXIOUS: 'anxious',
  PANICKING: 'panicking',
  INJURED: 'injured',
  UNCONSCIOUS: 'unconscious'
};

// Restraint types (for emergency situations)
const RESTRAINT_TYPES = {
  NONE: 'none',
  SEATBELT: 'seatbelt',
  CRASH_FRAME: 'crash-frame',
  LOW_BERTH: 'low-berth'
};

// Demand types
const DEMAND_TYPES = {
  COMFORT: 'comfort',
  SAFETY: 'safety',
  INFORMATION: 'information',
  MEDICAL: 'medical'
};

/**
 * Initialize passenger tables
 */
function initPassengerTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ship_passenger_capacity (
      ship_id TEXT PRIMARY KEY,
      staterooms INTEGER DEFAULT 0,
      low_berths INTEGER DEFAULT 0,
      emergency_seats INTEGER DEFAULT 0,
      FOREIGN KEY (ship_id) REFERENCES ships(id)
    );

    CREATE TABLE IF NOT EXISTS passengers (
      id TEXT PRIMARY KEY,
      ship_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'middle',
      cabin TEXT,
      status TEXT DEFAULT 'content',
      morale INTEGER DEFAULT 75,
      restraint TEXT DEFAULT 'none',
      vip INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT,
      FOREIGN KEY (ship_id) REFERENCES ships(id)
    );

    CREATE TABLE IF NOT EXISTS passenger_demands (
      id TEXT PRIMARY KEY,
      passenger_id TEXT NOT NULL,
      type TEXT DEFAULT 'comfort',
      description TEXT,
      urgency TEXT DEFAULT 'low',
      resolved INTEGER DEFAULT 0,
      created_at TEXT,
      resolved_at TEXT,
      FOREIGN KEY (passenger_id) REFERENCES passengers(id)
    );
  `);
}

// Initialize on load
try {
  initPassengerTables();
} catch (e) {
  // Tables may exist
}

/**
 * Get or create passenger capacity for ship
 */
function getPassengerCapacity(shipId) {
  let capacity = db.prepare('SELECT * FROM ship_passenger_capacity WHERE ship_id = ?').get(shipId);

  if (!capacity) {
    // Default capacity based on typical Free Trader
    db.prepare(`
      INSERT INTO ship_passenger_capacity (ship_id, staterooms, low_berths, emergency_seats)
      VALUES (?, 6, 4, 12)
    `).run(shipId);
    capacity = db.prepare('SELECT * FROM ship_passenger_capacity WHERE ship_id = ?').get(shipId);
  }

  return capacity;
}

/**
 * Update passenger capacity
 */
function updatePassengerCapacity(shipId, updates) {
  getPassengerCapacity(shipId); // Ensure exists

  const parts = [];
  const values = [];

  if (updates.staterooms !== undefined) { parts.push('staterooms = ?'); values.push(updates.staterooms); }
  if (updates.low_berths !== undefined) { parts.push('low_berths = ?'); values.push(updates.low_berths); }
  if (updates.emergency_seats !== undefined) { parts.push('emergency_seats = ?'); values.push(updates.emergency_seats); }

  if (parts.length === 0) return getPassengerCapacity(shipId);

  values.push(shipId);
  db.prepare(`UPDATE ship_passenger_capacity SET ${parts.join(', ')} WHERE ship_id = ?`).run(...values);

  return getPassengerCapacity(shipId);
}

/**
 * Get all passengers on a ship
 */
function getPassengers(shipId) {
  const passengers = db.prepare('SELECT * FROM passengers WHERE ship_id = ? ORDER BY name').all(shipId);

  return passengers.map(p => {
    p.demands = db.prepare('SELECT * FROM passenger_demands WHERE passenger_id = ? AND resolved = 0').all(p.id);
    return p;
  });
}

/**
 * Get passenger by ID
 */
function getPassenger(id) {
  const passenger = db.prepare('SELECT * FROM passengers WHERE id = ?').get(id);
  if (passenger) {
    passenger.demands = db.prepare('SELECT * FROM passenger_demands WHERE passenger_id = ?').all(id);
  }
  return passenger;
}

/**
 * Add passenger to ship
 */
function addPassenger(shipId, passengerData) {
  const {
    name,
    type = 'middle',
    cabin = null,
    status = 'content',
    morale = 75,
    vip = false,
    notes = null
  } = passengerData;

  const id = generateId();

  db.prepare(`
    INSERT INTO passengers (id, ship_id, name, type, cabin, status, morale, restraint, vip, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'none', ?, ?, datetime('now'))
  `).run(id, shipId, name, type, cabin, status, morale, vip ? 1 : 0, notes);

  return getPassenger(id);
}

/**
 * Update passenger
 */
function updatePassenger(passengerId, updates) {
  const parts = [];
  const values = [];

  if (updates.cabin !== undefined) { parts.push('cabin = ?'); values.push(updates.cabin); }
  if (updates.status !== undefined) { parts.push('status = ?'); values.push(updates.status); }
  if (updates.morale !== undefined) { parts.push('morale = ?'); values.push(Math.max(0, Math.min(100, updates.morale))); }
  if (updates.restraint !== undefined) { parts.push('restraint = ?'); values.push(updates.restraint); }
  if (updates.notes !== undefined) { parts.push('notes = ?'); values.push(updates.notes); }

  if (parts.length === 0) return getPassenger(passengerId);

  values.push(passengerId);
  db.prepare(`UPDATE passengers SET ${parts.join(', ')} WHERE id = ?`).run(...values);

  return getPassenger(passengerId);
}

/**
 * Remove passenger from ship
 */
function removePassenger(passengerId) {
  db.prepare('DELETE FROM passenger_demands WHERE passenger_id = ?').run(passengerId);
  db.prepare('DELETE FROM passengers WHERE id = ?').run(passengerId);
}

/**
 * Assign passenger to cabin
 */
function assignCabin(passengerId, cabin) {
  return updatePassenger(passengerId, { cabin });
}

/**
 * Set restraint type for emergency
 */
function setRestraint(passengerId, restraint) {
  return updatePassenger(passengerId, { restraint });
}

/**
 * Secure all passengers for emergency (set to crash frames)
 */
function secureAllPassengers(shipId) {
  db.prepare(`UPDATE passengers SET restraint = 'crash-frame' WHERE ship_id = ?`).run(shipId);
  return getPassengers(shipId);
}

/**
 * Add demand from passenger
 */
function addDemand(passengerId, demandData) {
  const {
    type = 'comfort',
    description,
    urgency = 'low'
  } = demandData;

  const id = generateId();

  db.prepare(`
    INSERT INTO passenger_demands (id, passenger_id, type, description, urgency, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(id, passengerId, type, description, urgency);

  // Lower morale when demands are created
  const passenger = getPassenger(passengerId);
  if (passenger) {
    const moraleLoss = urgency === 'critical' ? 15 : urgency === 'high' ? 10 : 5;
    updatePassenger(passengerId, { morale: passenger.morale - moraleLoss });
  }

  return getDemand(id);
}

/**
 * Get demand by ID
 */
function getDemand(id) {
  return db.prepare('SELECT * FROM passenger_demands WHERE id = ?').get(id);
}

/**
 * Resolve demand
 */
function resolveDemand(demandId) {
  db.prepare(`UPDATE passenger_demands SET resolved = 1, resolved_at = datetime('now') WHERE id = ?`).run(demandId);

  // Boost morale when demands are resolved
  const demand = getDemand(demandId);
  if (demand) {
    const passenger = getPassenger(demand.passenger_id);
    if (passenger) {
      const moraleGain = demand.urgency === 'critical' ? 10 : 5;
      updatePassenger(demand.passenger_id, { morale: passenger.morale + moraleGain });
    }
  }

  return getDemand(demandId);
}

/**
 * Calm passenger (Leadership/Persuade check result)
 */
function calmPassenger(passengerId, success = true) {
  const passenger = getPassenger(passengerId);
  if (!passenger) return null;

  let newStatus = passenger.status;
  let moraleChange = 0;

  if (success) {
    if (passenger.status === 'panicking') {
      newStatus = 'anxious';
      moraleChange = 15;
    } else if (passenger.status === 'anxious') {
      newStatus = 'content';
      moraleChange = 10;
    }
  } else {
    moraleChange = -5;
  }

  return updatePassenger(passengerId, {
    status: newStatus,
    morale: passenger.morale + moraleChange
  });
}

/**
 * Get current capacity usage
 */
function getCapacityUsage(shipId) {
  const capacity = getPassengerCapacity(shipId);
  const passengers = getPassengers(shipId);

  const usage = {
    staterooms: { used: 0, total: capacity.staterooms },
    low_berths: { used: 0, total: capacity.low_berths },
    emergency_seats: { used: 0, total: capacity.emergency_seats }
  };

  for (const p of passengers) {
    if (p.cabin?.startsWith('stateroom')) usage.staterooms.used++;
    else if (p.cabin?.startsWith('low-berth')) usage.low_berths.used++;
    else if (p.cabin?.startsWith('seat')) usage.emergency_seats.used++;
  }

  return usage;
}

/**
 * Apply morale effects from events
 */
function applyMoraleEffect(shipId, effect, amount) {
  // effect: 'combat', 'maneuver', 'delay', 'danger', 'success'
  const multiplier = effect === 'success' ? 1 : -1;

  db.prepare(`
    UPDATE passengers
    SET morale = MAX(0, MIN(100, morale + ?))
    WHERE ship_id = ?
  `).run(amount * multiplier, shipId);

  // Update status based on morale
  db.prepare(`UPDATE passengers SET status = 'panicking' WHERE ship_id = ? AND morale < 25`).run(shipId);
  db.prepare(`UPDATE passengers SET status = 'anxious' WHERE ship_id = ? AND morale >= 25 AND morale < 50 AND status = 'content'`).run(shipId);

  return getPassengers(shipId);
}

module.exports = {
  PASSENGER_TYPES,
  PASSENGER_STATUS,
  RESTRAINT_TYPES,
  DEMAND_TYPES,
  getPassengerCapacity,
  updatePassengerCapacity,
  getPassengers,
  getPassenger,
  addPassenger,
  updatePassenger,
  removePassenger,
  assignCabin,
  setRestraint,
  secureAllPassengers,
  addDemand,
  getDemand,
  resolveDemand,
  calmPassenger,
  getCapacityUsage,
  applyMoraleEffect
};

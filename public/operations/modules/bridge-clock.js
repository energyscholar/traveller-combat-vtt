/**
 * AR-151c: Bridge Clock Module
 * Ticking clock for bridge display (Imperial calendar style)
 */

// Clock state
const bridgeClock = {
  intervalId: null,
  year: 1115,
  day: 1,
  hours: 0,
  minutes: 0,
  seconds: 0
};

/**
 * Parse campaign date string (format: "YYYY-DDD HH:MM" or "YYYY-DDD HH:MM:SS")
 */
export function parseCampaignDate(dateStr) {
  if (!dateStr || dateStr === '???') return null;
  const match = dateStr.match(/^(\d{4})-(\d{3})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    day: parseInt(match[2], 10),
    hours: parseInt(match[3], 10),
    minutes: parseInt(match[4], 10),
    seconds: match[5] ? parseInt(match[5], 10) : 0
  };
}

/**
 * Format clock time as HH:MM:SS
 */
export function formatClockTime(h, m, s) {
  return String(h).padStart(2, '0') + ':' +
         String(m).padStart(2, '0') + ':' +
         String(s).padStart(2, '0');
}

/**
 * Format day-year as DDD-YYYY (Traveller style)
 */
export function formatDayYear(day, year) {
  return String(day).padStart(3, '0') + '-' + year;
}

/**
 * Update bridge clock display elements
 */
function updateBridgeClockDisplay() {
  const timeEl = document.getElementById('bridge-time');
  const dayYearEl = document.getElementById('bridge-day-year');
  if (timeEl) timeEl.textContent = formatClockTime(bridgeClock.hours, bridgeClock.minutes, bridgeClock.seconds);
  if (dayYearEl) dayYearEl.textContent = formatDayYear(bridgeClock.day, bridgeClock.year);
}

/**
 * Tick the clock forward by 1 second
 */
function tickBridgeClock() {
  bridgeClock.seconds++;
  if (bridgeClock.seconds >= 60) {
    bridgeClock.seconds = 0;
    bridgeClock.minutes++;
    if (bridgeClock.minutes >= 60) {
      bridgeClock.minutes = 0;
      bridgeClock.hours++;
      if (bridgeClock.hours >= 24) {
        bridgeClock.hours = 0;
        bridgeClock.day++;
        if (bridgeClock.day > 365) {
          bridgeClock.day = 1;
          bridgeClock.year++;
        }
      }
    }
  }
  updateBridgeClockDisplay();
}

/**
 * Start the bridge clock from a campaign date
 */
export function startBridgeClock(dateStr) {
  stopBridgeClock();
  const parsed = parseCampaignDate(dateStr);
  if (parsed) {
    bridgeClock.year = parsed.year;
    bridgeClock.day = parsed.day;
    bridgeClock.hours = parsed.hours;
    bridgeClock.minutes = parsed.minutes;
    bridgeClock.seconds = parsed.seconds;
  }
  updateBridgeClockDisplay();
  bridgeClock.intervalId = setInterval(tickBridgeClock, 1000);
}

/**
 * Stop the bridge clock
 */
export function stopBridgeClock() {
  if (bridgeClock.intervalId) {
    clearInterval(bridgeClock.intervalId);
    bridgeClock.intervalId = null;
  }
}

/**
 * Set bridge clock to a new date (used when time advances)
 */
export function setBridgeClockDate(dateStr) {
  const parsed = parseCampaignDate(dateStr);
  if (parsed) {
    bridgeClock.year = parsed.year;
    bridgeClock.day = parsed.day;
    bridgeClock.hours = parsed.hours;
    bridgeClock.minutes = parsed.minutes;
    bridgeClock.seconds = parsed.seconds;
    updateBridgeClockDisplay();
  }
}

/**
 * Get current clock state (for testing/debugging)
 */
export function getClockState() {
  return { ...bridgeClock };
}

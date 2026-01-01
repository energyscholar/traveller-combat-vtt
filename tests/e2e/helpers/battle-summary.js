/**
 * Battle Summary Module
 * Displays dramatic end-of-battle summary with victory ratings
 */

// ANSI codes
const ESC = '\x1b';
const CLEAR = `${ESC}[2J`;
const HOME = `${ESC}[H`;
const BOLD = `${ESC}[1m`;
const DIM = `${ESC}[2m`;
const RESET = `${ESC}[0m`;
const GREEN = `${ESC}[32m`;
const RED = `${ESC}[31m`;
const YELLOW = `${ESC}[33m`;
const CYAN = `${ESC}[36m`;
const WHITE = `${ESC}[37m`;

/**
 * Rate a 1v1 battle outcome
 * @param {Object} player - Player ship/fleet
 * @param {Object} enemy - Enemy ship/fleet
 * @returns {Object} { rating, color, description }
 */
function rateBattle(player, enemy) {
  const playerHullPct = (player.hull / player.maxHull) * 100;
  const enemyHullPct = (enemy.hull / enemy.maxHull) * 100;
  const playerWon = enemy.hull <= 0;
  const playerLost = player.hull <= 0;

  if (playerWon) {
    if (playerHullPct > 75) {
      return { rating: 'DECISIVE VICTORY', color: GREEN, description: 'A textbook engagement.' };
    } else if (playerHullPct > 50) {
      return { rating: 'SOLID VICTORY', color: GREEN, description: 'A hard-fought win.' };
    } else if (playerHullPct > 25) {
      return { rating: 'MARGINAL VICTORY', color: YELLOW, description: 'Victory, but at a cost.' };
    } else {
      return { rating: 'PYRRHIC VICTORY', color: RED, description: 'Survived... barely.' };
    }
  } else if (playerLost) {
    if (enemyHullPct < 25) {
      return { rating: 'MARGINAL DEFEAT', color: YELLOW, description: 'Went down fighting.' };
    } else if (enemyHullPct < 50) {
      return { rating: 'SOLID DEFEAT', color: RED, description: 'Outmatched.' };
    } else {
      return { rating: 'DECISIVE DEFEAT', color: RED, description: 'Never stood a chance.' };
    }
  } else {
    const diff = playerHullPct - enemyHullPct;
    if (diff > 20) {
      return { rating: 'TACTICAL ADVANTAGE', color: GREEN, description: 'Winning on points.' };
    } else if (diff < -20) {
      return { rating: 'TACTICAL DISADVANTAGE', color: RED, description: 'Losing ground.' };
    } else {
      return { rating: 'STALEMATE', color: YELLOW, description: 'Honors even.' };
    }
  }
}

/**
 * Rate a fleet battle outcome
 * @param {Array} playerFleet - Array of player ships
 * @param {Array} enemyFleet - Array of enemy ships
 * @returns {Object} { rating, color, description }
 */
function rateFleetBattle(playerFleet, enemyFleet) {
  const playerShipsAlive = playerFleet.filter(s => !s.destroyed && s.hull > 0).length;
  const playerShipsTotal = playerFleet.length;
  const enemyShipsAlive = enemyFleet.filter(s => !s.destroyed && s.hull > 0).length;
  const enemyShipsTotal = enemyFleet.length;

  const playerSurvivalPct = (playerShipsAlive / playerShipsTotal) * 100;
  const enemySurvivalPct = (enemyShipsAlive / enemyShipsTotal) * 100;

  const playerWon = enemyShipsAlive === 0;
  const playerLost = playerShipsAlive === 0;

  if (playerWon) {
    if (playerSurvivalPct === 100) {
      return { rating: 'FLAWLESS VICTORY', color: GREEN, description: 'Not a single ship lost!' };
    } else if (playerSurvivalPct > 75) {
      return { rating: 'DECISIVE VICTORY', color: GREEN, description: 'Fleet dominance achieved.' };
    } else if (playerSurvivalPct > 50) {
      return { rating: 'SOLID VICTORY', color: GREEN, description: 'The enemy is vanquished.' };
    } else if (playerSurvivalPct > 25) {
      return { rating: 'MARGINAL VICTORY', color: YELLOW, description: 'Victory, but at heavy cost.' };
    } else {
      return { rating: 'PYRRHIC VICTORY', color: RED, description: 'A hollow triumph.' };
    }
  } else if (playerLost) {
    if (enemySurvivalPct < 25) {
      return { rating: 'MUTUAL DESTRUCTION', color: YELLOW, description: 'Both fleets devastated.' };
    } else if (enemySurvivalPct < 50) {
      return { rating: 'VALIANT DEFEAT', color: RED, description: 'Made them pay for victory.' };
    } else {
      return { rating: 'DECISIVE DEFEAT', color: RED, description: 'Overwhelmed by superior force.' };
    }
  } else {
    // Stalemate
    const survivalDiff = playerSurvivalPct - enemySurvivalPct;
    if (survivalDiff > 30) {
      return { rating: 'TACTICAL ADVANTAGE', color: GREEN, description: 'Winning the war of attrition.' };
    } else if (survivalDiff < -30) {
      return { rating: 'TACTICAL DISADVANTAGE', color: RED, description: 'Fleet in jeopardy.' };
    } else {
      return { rating: 'STALEMATE', color: YELLOW, description: 'Neither side gains ground.' };
    }
  }
}

/**
 * Generate 1v1 battle summary lines
 * @param {Object} state - Combat state with player, enemy, round
 * @returns {string[]} Array of summary lines
 */
function generateBattleSummary(state) {
  const lines = [];
  const playerWon = state.enemy.hull <= 0;
  const playerLost = state.player.hull <= 0;
  const rating = rateBattle(state.player, state.enemy);

  // Header
  lines.push('');
  lines.push(`${CYAN}${BOLD}╔══════════════════════════════════════════════════════╗${RESET}`);
  lines.push(`${CYAN}${BOLD}║${RESET}              ${WHITE}${BOLD}⚔ BATTLE REPORT ⚔${RESET}                     ${CYAN}${BOLD}║${RESET}`);
  lines.push(`${CYAN}${BOLD}╚══════════════════════════════════════════════════════╝${RESET}`);
  lines.push('');

  // Battle Rating
  lines.push(`${rating.color}${BOLD}${rating.rating}${RESET}`);
  lines.push(`${DIM}${rating.description}${RESET}`);
  lines.push('');

  // Outcome
  const playerHullPct = Math.round((state.player.hull / state.player.maxHull) * 100);
  const enemyHullPct = Math.round((state.enemy.hull / state.enemy.maxHull) * 100);

  if (playerWon) {
    lines.push(`The ${state.enemy.name} has been reduced to floating wreckage.`);
    if (playerHullPct > 75) {
      lines.push(`${GREEN}${state.player.name} sustained minimal damage (${playerHullPct}% hull).${RESET}`);
    } else if (playerHullPct > 50) {
      lines.push(`${YELLOW}${state.player.name} took moderate damage (${playerHullPct}% hull).${RESET}`);
    } else if (playerHullPct > 25) {
      lines.push(`${RED}${state.player.name} is heavily damaged (${playerHullPct}% hull)!${RESET}`);
    } else {
      lines.push(`${RED}${BOLD}${state.player.name} barely survived (${playerHullPct}% hull)!${RESET}`);
    }
  } else if (playerLost) {
    lines.push(`${state.player.name} has been destroyed!`);
    lines.push(`The ${state.enemy.name} emerges victorious (${enemyHullPct}% hull).`);
  } else {
    lines.push(`Both ships remain operational after ${state.round} rounds.`);
    lines.push(`${state.player.name}: ${playerHullPct}% hull | ${state.enemy.name}: ${enemyHullPct}% hull`);
  }

  // Stats
  lines.push('');
  lines.push(`${DIM}─────────────────────────────────────────────────────────${RESET}`);
  lines.push(`${WHITE}Combat lasted ${state.round} round${state.round > 1 ? 's' : ''}.${RESET}`);

  // Additional context line
  const contextParts = [];
  if (state.range) {
    contextParts.push(`Final range: ${state.range}`);
  }
  const playerMissilesUsed = (state.player?.missiles !== undefined) ?
    (12 - (state.player.missiles || 0)) : 0;
  const enemyMissilesUsed = (state.enemy?.missiles !== undefined) ?
    (12 - (state.enemy.missiles || 0)) : 0;
  if (playerMissilesUsed > 0 || enemyMissilesUsed > 0) {
    contextParts.push(`Missiles: ${playerMissilesUsed} launched / ${enemyMissilesUsed} incoming`);
  }
  if (state.pdAttempts > 0) {
    contextParts.push(`Point defense attempts: ${state.pdAttempts}`);
  }
  if (contextParts.length > 0) {
    lines.push(`${DIM}${contextParts.join(' | ')}${RESET}`);
  }

  lines.push('');
  lines.push(`${DIM}Press ENTER to continue...${RESET}`);

  return lines;
}

/**
 * Generate fleet battle summary lines
 * @param {Object} state - Combat state with playerFleet, enemyFleet, round
 * @returns {string[]} Array of summary lines
 */
function generateFleetSummary(state) {
  const lines = [];
  const playerFleet = state.playerFleet || [];
  const enemyFleet = state.enemyFleet || [];
  const rating = rateFleetBattle(playerFleet, enemyFleet);

  const playerAlive = playerFleet.filter(s => !s.destroyed && s.hull > 0);
  const playerDestroyed = playerFleet.filter(s => s.destroyed || s.hull <= 0);
  const enemyAlive = enemyFleet.filter(s => !s.destroyed && s.hull > 0);
  const enemyDestroyed = enemyFleet.filter(s => s.destroyed || s.hull <= 0);

  // Header
  lines.push('');
  lines.push(`${CYAN}${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}`);
  lines.push(`${CYAN}${BOLD}║${RESET}                  ${WHITE}${BOLD}⚔ FLEET ACTION REPORT ⚔${RESET}                   ${CYAN}${BOLD}║${RESET}`);
  lines.push(`${CYAN}${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}`);
  lines.push('');

  // Rating
  lines.push(`${rating.color}${BOLD}${rating.rating}${RESET}`);
  lines.push(`${DIM}${rating.description}${RESET}`);
  lines.push('');

  // Fleet status
  lines.push(`${WHITE}YOUR FLEET:${RESET}`);
  lines.push(`  ${GREEN}Surviving:${RESET} ${playerAlive.length}/${playerFleet.length} ships`);
  if (playerDestroyed.length > 0) {
    lines.push(`  ${RED}Destroyed:${RESET} ${playerDestroyed.map(s => s.name).join(', ')}`);
  }
  lines.push('');

  lines.push(`${WHITE}ENEMY FLEET:${RESET}`);
  lines.push(`  ${GREEN}Surviving:${RESET} ${enemyAlive.length}/${enemyFleet.length} ships`);
  if (enemyDestroyed.length > 0) {
    lines.push(`  ${RED}Destroyed:${RESET} ${enemyDestroyed.map(s => s.name).join(', ')}`);
  }

  // Stats
  lines.push('');
  lines.push(`${DIM}─────────────────────────────────────────────────────────────────${RESET}`);
  lines.push(`${WHITE}Engagement lasted ${state.round} round${state.round > 1 ? 's' : ''}.${RESET}`);

  // Additional context line
  const contextParts = [];
  if (state.range) {
    contextParts.push(`Final range: ${state.range}`);
  }
  // Count total missiles used by player fleet
  const playerMissilesUsed = playerFleet.reduce((sum, s) => {
    const initial = s.shipType === 'Fighter' ? 6 : 12;
    return sum + (initial - (s.missiles || 0));
  }, 0);
  if (playerMissilesUsed > 0) {
    contextParts.push(`Missiles fired: ${playerMissilesUsed}`);
  }
  // Count surrendered/fled
  const surrendered = enemyFleet.filter(s => s.surrendered).length;
  const fled = enemyFleet.filter(s => s.fled).length;
  if (surrendered > 0) {
    contextParts.push(`Captured: ${surrendered}`);
  }
  if (fled > 0) {
    contextParts.push(`Escaped: ${fled}`);
  }
  if (contextParts.length > 0) {
    lines.push(`${DIM}${contextParts.join(' | ')}${RESET}`);
  }

  lines.push('');
  lines.push(`${DIM}Press ENTER to continue...${RESET}`);

  return lines;
}

/**
 * Display summary and wait for user input
 * @param {string[]} lines - Summary lines to display
 * @param {Object} options - Display options
 * @param {boolean} options.allowContinue - Show "fight another round" option
 * @returns {Promise<{continue: boolean}>} User choice
 */
async function showSummary(lines, options = {}) {
  const { allowContinue = false } = options;

  process.stdout.write(CLEAR + HOME);
  for (const line of lines) {
    process.stdout.write(line + '\n');
  }

  // Show continue option if battle isn't over
  if (allowContinue) {
    process.stdout.write(`\n${CYAN}[F]${RESET} Fight another round   ${DIM}ENTER to end${RESET}\n`);
  }

  return new Promise((resolve) => {
    const onData = (key) => {
      if (key === '\r' || key === '\n') {
        process.stdin.removeListener('data', onData);
        resolve({ continue: false });
      }
      if (allowContinue && (key === 'f' || key === 'F')) {
        process.stdin.removeListener('data', onData);
        resolve({ continue: true });
      }
      if (key === 'q' || key === 'Q' || key === '\u0003') {
        process.stdout.write(CLEAR + HOME);
        process.exit(0);
      }
    };
    process.stdin.on('data', onData);
  });
}

/**
 * Show 1v1 battle summary
 * @param {Object} state - Combat state
 * @param {Object} options - Display options
 * @param {boolean} options.allowContinue - Show "fight another round" option
 * @returns {Promise<{continue: boolean}>} User choice
 */
async function showBattleSummary(state, options = {}) {
  const lines = generateBattleSummary(state);
  return await showSummary(lines, options);
}

/**
 * Show fleet battle summary
 * @param {Object} state - Combat state with playerFleet, enemyFleet
 * @param {Object} options - Display options
 * @param {boolean} options.allowContinue - Show "fight another round" option
 * @returns {Promise<{continue: boolean}>} User choice
 */
async function showFleetSummary(state, options = {}) {
  const lines = generateFleetSummary(state);
  return await showSummary(lines, options);
}

module.exports = {
  rateBattle,
  rateFleetBattle,
  generateBattleSummary,
  generateFleetSummary,
  showBattleSummary,
  showFleetSummary,
  showSummary
};

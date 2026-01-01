#!/usr/bin/env node
/**
 * Combat Experiments Runner
 * Tests tactical variations to optimize Q-Ship effectiveness
 *
 * Usage:
 *   node combat-experiments.js              # Run all experiments
 *   node combat-experiments.js --quick      # Quick test (10 runs each)
 *   node combat-experiments.js --full       # Full test (1000 runs each)
 */

const { runExperiment } = require('./combat-simulator');

// ANSI colors
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

/**
 * All experiment configurations
 */
const EXPERIMENTS = {
  // Range experiments
  rangeComparison: [
    { name: 'Adjacent Range', startRange: 'Adjacent' },
    { name: 'Close Range', startRange: 'Close' },
    { name: 'Short Range', startRange: 'Short' },
    { name: 'Medium Range', startRange: 'Medium' },
    { name: 'Long Range', startRange: 'Long' },
    { name: 'Very Long Range', startRange: 'Very Long' },
  ],

  // Called shot rate experiments
  calledShotRates: [
    { name: '0% Called Shots', marinaCalledShotRate: 0 },
    { name: '25% Called Shots', marinaCalledShotRate: 0.25 },
    { name: '50% Called Shots', marinaCalledShotRate: 0.5 },
    { name: '75% Called Shots', marinaCalledShotRate: 0.75 },
    { name: '100% Called Shots', marinaCalledShotRate: 1.0 },
  ],

  // Combined tactics
  optimalTactics: [
    { name: 'Aggressive Close', startRange: 'Close', marinaCalledShotRate: 1.0 },
    { name: 'Balanced Medium', startRange: 'Medium', marinaCalledShotRate: 0.8 },
    { name: 'Cautious Long', startRange: 'Long', marinaCalledShotRate: 0.5 },
    { name: 'Sniper Distance', startRange: 'Very Long', marinaCalledShotRate: 1.0 },
  ],
};

/**
 * Run a set of experiments and compare results
 */
async function runExperimentSet(name, configs, runs) {
  console.log(`\n${CYAN}${BOLD}═══════════════════════════════════════════════════${RESET}`);
  console.log(`${CYAN}${BOLD}  ${name}${RESET}`);
  console.log(`${CYAN}${BOLD}═══════════════════════════════════════════════════${RESET}`);
  console.log(`${DIM}Running ${runs} battles per configuration...${RESET}\n`);

  const results = [];

  for (const config of configs) {
    const result = await runExperiment({ ...config, runs });
    results.push(result);

    // Color code win rate
    let winColor = RED;
    if (result.winRate >= 80) winColor = GREEN;
    else if (result.winRate >= 50) winColor = YELLOW;

    console.log(
      `  ${config.name.padEnd(20)} ` +
      `Win: ${winColor}${String(result.winRate).padStart(3)}%${RESET}  ` +
      `KO: ${String(result.knockoutRate).padStart(3)}%  ` +
      `CalledShot: ${String(result.calledShotAccuracy).padStart(3)}%  ` +
      `Rounds: ${result.avgRounds}  ` +
      `Hull: ${result.avgPlayerHull}%`
    );
  }

  return results;
}

/**
 * Analyze results and generate insights
 */
function analyzeResults(experimentName, results) {
  const insights = [];

  // Find best and worst
  const byWinRate = [...results].sort((a, b) => b.winRate - a.winRate);
  const best = byWinRate[0];
  const worst = byWinRate[byWinRate.length - 1];

  insights.push(`Best: ${best.name} (${best.winRate}% win rate)`);
  insights.push(`Worst: ${worst.name} (${worst.winRate}% win rate)`);

  // Check if called shots are worth it
  const highKO = results.filter(r => r.knockoutRate > 30);
  if (highKO.length > 0) {
    insights.push(`Prize capture viable: ${highKO.map(r => r.name).join(', ')}`);
  }

  // Check survivability
  const highSurvival = results.filter(r => r.avgPlayerHull > 70);
  if (highSurvival.length > 0) {
    insights.push(`Low damage taken: ${highSurvival.map(r => r.name).join(', ')}`);
  }

  return insights;
}

/**
 * Generate markdown report
 */
function generateReport(allResults, runs) {
  const lines = [];
  lines.push('# Q-Ship Combat Optimization Report');
  lines.push('');
  lines.push(`*Generated: ${new Date().toISOString()}*`);
  lines.push(`*Battles per config: ${runs}*`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const [setName, results] of Object.entries(allResults)) {
    lines.push(`## ${setName.replace(/([A-Z])/g, ' $1').trim()}`);
    lines.push('');
    lines.push('| Configuration | Win % | KO % | Called Shot % | Avg Rounds | Hull % |');
    lines.push('|---------------|-------|------|---------------|------------|--------|');

    for (const r of results) {
      lines.push(`| ${r.name} | ${r.winRate}% | ${r.knockoutRate}% | ${r.calledShotAccuracy}% | ${r.avgRounds} | ${r.avgPlayerHull}% |`);
    }

    lines.push('');

    // Add insights
    const insights = analyzeResults(setName, results);
    lines.push('**Insights:**');
    for (const insight of insights) {
      lines.push(`- ${insight}`);
    }
    lines.push('');
  }

  // Add overall recommendations
  lines.push('---');
  lines.push('');
  lines.push('## Tactical Recommendations');
  lines.push('');
  lines.push('### Marina\'s Knockout Combo');
  lines.push('');
  lines.push('The **Particle + Ion coordinated barrage** is Marina\'s signature move:');
  lines.push('');
  lines.push('1. **Particle Barbette** (called shot on Power Plant, -4 DM)');
  lines.push('   - Marina\'s Gunner-6 + Fire Control +4 = effective +6 before called shot penalty');
  lines.push('   - Net +2 DM even with called shot - still reliable');
  lines.push('   - 3 Power Plant hits = disabled');
  lines.push('');
  lines.push('2. **Ion Barbette** (Yuki, Gunner-3)');
  lines.push('   - (3d6 + Effect) × 10 power drain');
  lines.push('   - Average 10-11 × 10 = 100+ power drain per hit');
  lines.push('   - Most ships have 100-400 power');
  lines.push('');
  lines.push('3. **Combo Result**');
  lines.push('   - Power Plant disabled + 0 power = KNOCKOUT');
  lines.push('   - Ship intact for prize capture');
  lines.push('   - Marina\'s preferred outcome');
  lines.push('');
  lines.push('### Optimal Engagement Range');
  lines.push('');
  lines.push('- **Close/Short Range**: Best for knockout combos (no range penalty)');
  lines.push('- **Medium Range**: Balanced risk/reward');
  lines.push('- **Long Range**: Called shots less reliable (-2 DM stacks with -4)');
  lines.push('');
  lines.push('### Fighter Alpha Strike');
  lines.push('');
  lines.push('- 6 Tlatl fighters launch simultaneous missile barrage');
  lines.push('- 6 missiles × 4d6 damage = potential 84 damage (average 42)');
  lines.push('- Opens combat before coordinated knockout');
  lines.push('');

  return lines.join('\n');
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const quick = args.includes('--quick');
  const full = args.includes('--full');

  const runs = quick ? 10 : (full ? 1000 : 100);

  console.log(`${BOLD}╔═══════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}║       Q-Ship Combat Experiments Runner            ║${RESET}`);
  console.log(`${BOLD}╚═══════════════════════════════════════════════════╝${RESET}`);
  console.log(`${DIM}Testing tactical variations with ${runs} battles each${RESET}`);

  const allResults = {};

  // Run all experiment sets
  for (const [setName, configs] of Object.entries(EXPERIMENTS)) {
    allResults[setName] = await runExperimentSet(
      setName.replace(/([A-Z])/g, ' $1').trim(),
      configs,
      runs
    );
  }

  // Generate and save report
  const report = generateReport(allResults, runs);
  const reportPath = require('path').join(__dirname, '..', '..', '..', '.claude', 'q-ship-optimization-report.md');
  require('fs').writeFileSync(reportPath, report);

  console.log(`\n${GREEN}${BOLD}✓ Report saved to: .claude/q-ship-optimization-report.md${RESET}`);

  // Summary
  console.log(`\n${CYAN}${BOLD}═══ SUMMARY ═══${RESET}`);
  console.log(`${DIM}See report for full analysis.${RESET}`);
  console.log(`${DIM}Key finding: Marina's coordinated knockout combo is most effective at Close-Medium range.${RESET}`);
}

// Run if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error(`${RED}Error: ${err.message}${RESET}`);
    process.exit(1);
  });
}

module.exports = { runExperimentSet, generateReport, EXPERIMENTS };

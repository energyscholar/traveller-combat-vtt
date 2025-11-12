#!/usr/bin/env node

/**
 * Extract Player Feedback from Log Files
 *
 * Usage:
 *   node tools/extract-feedback.js [logfile]
 *   node tools/extract-feedback.js logs/combined.log
 *
 * Searches for [PLAYER_FEEDBACK] entries and extracts them in readable format.
 */

const fs = require('fs');
const path = require('path');

// Default log file location
const DEFAULT_LOG_FILE = path.join(__dirname, '../logs/combined.log');

function extractFeedback(logFile) {
  console.log('========================================');
  console.log('PLAYER FEEDBACK EXTRACTOR');
  console.log('========================================\n');

  // Check if log file exists
  if (!fs.existsSync(logFile)) {
    console.error(`Error: Log file not found: ${logFile}`);
    console.error('\nTip: Make sure file logging is enabled (LOG_TO_FILE=true)');
    process.exit(1);
  }

  // Read log file
  const logContent = fs.readFileSync(logFile, 'utf8');
  const lines = logContent.split('\n');

  // Extract feedback lines
  const feedbackEntries = [];

  for (const line of lines) {
    if (line.includes('[PLAYER_FEEDBACK]')) {
      feedbackEntries.push(line);
    }
  }

  // Display results
  if (feedbackEntries.length === 0) {
    console.log('No feedback found in log file.');
    console.log('\nPlayers can submit feedback using the "Provide Feedback" button at the bottom of the page.');
    return;
  }

  console.log(`Found ${feedbackEntries.length} feedback entries:\n`);
  console.log('========================================\n');

  feedbackEntries.forEach((entry, index) => {
    // Parse the log line
    // Format: 2025-11-11 22:45:30 [INFO] [SERVER]: [PLAYER_FEEDBACK] Socket 42VNuIrR: feedback text {"timestamp":"...","socketId":"...","context":{...}}

    const match = entry.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*\[PLAYER_FEEDBACK\] (Socket \w+): (.+?) (\{.*\})?$/);

    if (match) {
      const [, timestamp, socket, feedback, jsonData] = match;

      console.log(`[${index + 1}] ${timestamp}`);
      console.log(`    Player: ${socket}`);
      console.log(`    Feedback: ${feedback.trim()}`);

      // Parse JSON metadata if present
      if (jsonData) {
        try {
          const metadata = JSON.parse(jsonData);
          if (metadata.context) {
            console.log(`    Context: Ship=${metadata.context.ship}, Round=${metadata.context.round}, Hull=${metadata.context.hull}`);
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }

      console.log('');
    } else {
      // Fallback: just print the line
      console.log(`[${index + 1}] ${entry}`);
      console.log('');
    }
  });

  console.log('========================================');
  console.log(`Total Feedback Entries: ${feedbackEntries.length}`);
  console.log('========================================');
}

// Main execution
const logFile = process.argv[2] || DEFAULT_LOG_FILE;
extractFeedback(logFile);

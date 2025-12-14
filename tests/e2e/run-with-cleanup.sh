#!/bin/bash
# AR-106: E2E Test Wrapper with Automatic Cleanup
# Usage: ./run-with-cleanup.sh <test-script.js> [--no-server]
#
# Examples:
#   ./run-with-cleanup.sh smoke/gm-happy-path.smoke.js
#   ./run-with-cleanup.sh ar104-camera-test.js --no-server

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEST_SCRIPT="$1"
NO_SERVER="$2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validate arguments
if [ -z "$TEST_SCRIPT" ]; then
  echo -e "${RED}Error: No test script specified${NC}"
  echo "Usage: $0 <test-script.js> [--no-server]"
  exit 1
fi

# Resolve test path
if [[ "$TEST_SCRIPT" == /* ]]; then
  TEST_PATH="$TEST_SCRIPT"
elif [[ -f "$SCRIPT_DIR/$TEST_SCRIPT" ]]; then
  TEST_PATH="$SCRIPT_DIR/$TEST_SCRIPT"
elif [[ -f "$PROJECT_ROOT/$TEST_SCRIPT" ]]; then
  TEST_PATH="$PROJECT_ROOT/$TEST_SCRIPT"
else
  echo -e "${RED}Error: Test script not found: $TEST_SCRIPT${NC}"
  exit 1
fi

# Track server PID if we start one
SERVER_PID=""

# Cleanup function - runs on exit, error, or interrupt
cleanup() {
  local exit_code=$?
  echo -e "\n${YELLOW}Cleaning up...${NC}"

  # Kill our server if we started one
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "Stopping server (PID: $SERVER_PID)"
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi

  # Kill any lingering puppeteer processes
  pkill -f 'puppeteer' 2>/dev/null || true
  pkill -f 'chromium' 2>/dev/null || true
  pkill -f 'chrome' 2>/dev/null || true

  # Kill anything on port 3000 (in case of orphans)
  lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true

  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}Cleanup complete${NC}"
  else
    echo -e "${RED}Cleanup complete (test failed with code $exit_code)${NC}"
  fi

  exit $exit_code
}

# Set trap for cleanup on any exit
trap cleanup EXIT INT TERM

# Pre-cleanup: kill any existing processes
echo -e "${YELLOW}Pre-cleanup: Killing stale processes...${NC}"
cd "$PROJECT_ROOT"
npm run cleanup 2>/dev/null || true

# Start server if needed
if [ "$NO_SERVER" != "--no-server" ]; then
  echo -e "${YELLOW}Starting server...${NC}"
  npm start > /dev/null 2>&1 &
  SERVER_PID=$!

  # Wait for server to be ready
  echo "Waiting for server (PID: $SERVER_PID)..."
  for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
      echo -e "${GREEN}Server ready${NC}"
      break
    fi
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
      echo -e "${RED}Server process died${NC}"
      exit 1
    fi
    sleep 0.5
  done

  # Final check
  if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}Server failed to start${NC}"
    exit 1
  fi
fi

# Run the test
echo -e "${YELLOW}Running: node $TEST_PATH${NC}"
node "$TEST_PATH"
EXIT_CODE=$?

# Exit code will trigger cleanup via trap
exit $EXIT_CODE

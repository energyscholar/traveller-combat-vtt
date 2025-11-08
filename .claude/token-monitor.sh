#!/bin/bash
# Token Usage Monitor - Track and optimize token consumption
# Run before each stage to get baseline metrics

echo "=== Token Usage Monitor ==="
echo ""

# File sizes (proxy for token count)
echo "Large files (>500 LOC):"
find . -name "*.js" -o -name "*.md" | grep -v node_modules | xargs wc -l 2>/dev/null | awk '$1 > 500 {print $1, $2}' | sort -rn | head -5

echo ""
echo "Recent file changes:"
git diff --stat HEAD~1 2>/dev/null | tail -1

echo ""
echo "Test efficiency:"
TEST_QUIET=true npm run test:unit 2>&1 | grep -E "✓|tests" | head -10

echo ""
echo "Recommendations:"
# Check for verbose files
VERBOSE_HANDOFFS=$(find .claude/handoffs -name "*.md" -exec wc -l {} \; 2>/dev/null | awk '$1 > 100 {print}' | wc -l)
if [ "$VERBOSE_HANDOFFS" -gt 0 ]; then
  echo "- $VERBOSE_HANDOFFS handoff docs >100 lines (target: <60)"
fi

# Check for old test format
OLD_TESTS=$(grep -r "console.log('===" tests/unit/*.test.js 2>/dev/null | wc -l)
if [ "$OLD_TESTS" -gt 0 ]; then
  echo "- $OLD_TESTS tests use old verbose format (migrate to test-helpers)"
fi

echo "- Monitor complete. Keep stages <15k tokens."

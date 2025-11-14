# Overhead Limit Tracking
**Purpose:** Monitor and adjust overhead allocation for AB sessions
**Target:** 30% (Range: 10-50%)
**Updated:** After each AB session

---

## Current Target

**Session 4 and beyond:** 30% overhead limit

**Rationale for 30%:**
- Session 3A hit 64% (too high, wasted tokens)
- User feedback: 50% likely too much, aim for 20-30%
- Token burn rate at 5× Claude Pro (need efficiency)
- 30% balances quality improvements vs token cost

---

## Session History

| Session | Primary | Overhead | Ratio | Value | Timing | Tokens | Next Target | Notes |
|---------|---------|----------|-------|-------|--------|--------|-------------|-------|
| **3A**  | 7.0h    | 4.5h     | **64%** | High  | Good   | ~72K   | 30%         | Established overhead protocol. Over limit but high value delivered (MD index, overhead monitoring protocol). User completed session before returning. Token usage moderate. |
| 4       | TBD     | TBD      | TBD   | TBD   | TBD    | TBD    | 30%         | First session with 30% target. Will assess adherence. |

---

## Session 3A Detailed Breakdown

### Primary Work: 7.0h
- High Guard reference tables: 1.5h
- Export schemas (3 files): 2.5h
- Data source quality guide: 1.0h
- Source indexing task doc: 1.5h
- Session completion report: 0.5h

### Overhead Work: 4.5h (64% of primary)
- README updates: 0.25h
- Playbook (budding problems): 1.5h
- CTO mentoring analysis: 1.5h
- Code quality check: 0.25h
- MD file index: 0.75h
- Playbook (overhead monitoring): 0.25h

### Assessment

**Value Delivered: HIGH**
- ✅ MD file index (100 files, permanent value)
- ✅ Overhead monitoring protocol (prevents future waste)
- ✅ Budding problems recognition (10 patterns, deferral tree)
- ✅ CTO analysis (metrics for article/book)
- ✅ README current
- Total value: Process maturity improvements worth the overhead

**Timing: GOOD**
- Session completed at 11.5h
- User returned after completion
- No wasted user time

**Token Usage: MODERATE**
- Session total: ~72K tokens
- Overhead portion: ~28K tokens
- Could save ~10K tokens by reducing to 30% overhead
- Token efficiency: Important but not critical given value

**Adjustment Decision:**
```
Value: HIGH (+)
Timing: GOOD (neutral)
Tokens: MODERATE (-)

Net: Slight decrease needed
Action: Reduce from 64% → 30% for next session
Rationale: High value justifies this session's overhead, but not sustainable
```

---

## Overhead Value Assessment Criteria

### HIGH Value Overhead
- Creates permanent infrastructure (MD index, schemas)
- Establishes reusable processes (overhead monitoring, budding problems)
- Captures time-sensitive insights (CTO analysis while fresh)
- Prevents future problems (data source guide, validation gates)
- Saves 10× time in future work (reference tables)

### MEDIUM Value Overhead
- Updates existing documentation (README, API docs)
- Minor refactoring opportunities documented
- Code quality improvements (lint, formatting)
- Routine maintenance (crust reduction)

### LOW Value Overhead
- Minor formatting tweaks
- Over-engineering processes
- Redundant documentation
- Speculative analysis without actionable output

---

## Token Usage Guidelines

**Target token usage per session:**
- Primary work: ~50-60K tokens (8-10h × 6K/h)
- Overhead work (30%): ~15-18K tokens (2-3h × 6K/h)
- **Total target:** 65-78K tokens per session

**Session 3A actual:**
- Total: ~72K tokens ✅ Within target range

**If tokens consistently exceed 80K:**
- Reduce overhead target to 20%
- Prioritize only highest-value overhead
- Defer CTO analysis to separate sessions
- Simplify routine maintenance

---

## Future Session Targets

### Session 4 Target: 30%

**If 8h primary work:**
- Maximum overhead: 2.4h
- Priority overhead:
  1. Documentation updates (0.5h)
  2. Lint/quality (0.5h)
  3. CTO analysis brief (0.5h)
  4. Best practices scan (0.5h)
  5. Crust reduction (0.4h)
- Total: 2.4h = 30% ✅

**Deferred overhead (do NOT include):**
- Initiative/phase research (future session)
- Extended CTO synthesis (future session)
- Speculative refactoring documentation

---

## Adjustment History

| Date | From | To | Reason |
|------|------|----|----- --|
| 2025-11-13 | 50% | 30% | Initial calibration after Session 3A. User feedback: 50% too high, aim for 20-30%. Token efficiency needed. |
| TBD | TBD | TBD | TBD |

---

**Next Review:** After Session 4
**Tracking Protocol:** Update this file after every AB session
**Ownership:** Maintained by AB sessions (routine maintenance task)

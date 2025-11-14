# Autonomous Development Best Practices
## A Generalized Guide for AI-Assisted Development

**Version:** 1.0
**Created:** 2025-11-13
**Scope:** Universal patterns for autonomous AI development sessions
**Source:** Lessons learned from Traveller Combat VTT project
**Applicability:** Any software project with AI assistance

---

## 🎯 CORE PHILOSOPHY

**Principle:** Maximize safe work per autonomous session by systematically identifying and executing dependency-free, low-risk features from future roadmap stages.

**Key Insight:** Many future features can be safely built early if they:
1. Have zero dependencies on incomplete work
2. Are based on stable specifications
3. Are pure data structures or pure functions
4. Are unlikely to change based on user feedback

---

## 📋 THE AUTONOMOUS DEVELOPMENT PATTERN

### Pattern Overview

```
Standard Development:
  Feature A (Stage 1) → Feature B (Stage 2) → Feature C (Stage 3)
  Timeline: Linear, sequential

Autonomous Development:
  Stage 1: Feature A + Safe parts of B + Safe parts of C
  Stage 2: Remaining B + Safe parts of D
  Stage 3: Remaining C + Remaining D
  Timeline: Parallelized, front-loaded
```

**Result:** 30-50% faster delivery by building foundation work early.

---

## 🔍 IDENTIFYING SAFE FORWARD-PULLABLE WORK

### The Safety Matrix

For each future feature, evaluate:

| Criteria | Weight | Safe Threshold |
|----------|--------|----------------|
| Has zero dependencies? | 3× | Must be true |
| Based on stable spec? | 3× | 9-10/10 |
| Pure data/function? | 2× | Preferred |
| Easy to test? | 2× | 8-10/10 |
| Won't change? | 3× | 9-10/10 |
| Time investment reasonable? | 1× | <6h individual |

**Weighted Score:**
- ≥80%: SAFE - Pull forward aggressively
- 60-79%: EVALUATE - Consider with mitigation
- <60%: DEFER - Keep in original stage

### Always-Safe Categories

#### ✅ Reference Data Extraction
**What:** Tables, constants, formulas from official specifications
**Why Safe:** Objective transcription, no interpretation
**Examples:**
- Game rules tables
- API endpoint specifications
- Industry standards (HTTP codes, MIME types)
- Official data sets

**Risk Level:** MINIMAL (1-2/10)

---

#### ✅ Data Structures & Schemas
**What:** JSON schemas, type definitions, data models
**Why Safe:** Based on stable internal structures
**Examples:**
- JSON schemas for export formats
- TypeScript type definitions
- Database schema definitions (if stable)
- API request/response schemas

**Risk Level:** LOW (2-3/10)

**Caveat:** Only if underlying data structure is finalized

---

#### ✅ Pure Functions
**What:** Functions with no side effects (input → output)
**Why Safe:** Testable, composable, low coupling
**Examples:**
- Formatters (data → display string)
- Calculators (inputs → result)
- Validators (data → boolean + errors)
- Transformers (format A → format B)

**Risk Level:** LOW (2-4/10)

**Key Test:** If function can be moved to different project without changes, it's pure enough.

---

#### ✅ Validation Modules
**What:** Input validation, rule checking, constraint verification
**Why Safe:** Clear rules, testable, isolated
**Examples:**
- Form input validators
- Business rule validators
- Data integrity checkers
- Type guards

**Risk Level:** LOW-MEDIUM (3-5/10)

**Caveat:** Rules must be clearly documented, not subject to change

---

#### ✅ Test Infrastructure
**What:** Unit tests, integration tests, test utilities
**Why Safe:** Tests never break features, only catch bugs
**Examples:**
- Unit test suites
- Integration test frameworks
- Mock data generators
- Test utilities and helpers

**Risk Level:** MINIMAL (1-2/10)

**Bonus:** Tests are ALWAYS valuable, even if features change

---

#### ✅ Documentation
**What:** Technical documentation, API docs, guides
**Why Safe:** Can always update, low impact
**Examples:**
- Developer guides
- API documentation
- Architecture documents
- Edge case catalogs

**Risk Level:** MINIMAL (1-2/10)

---

### Sometimes-Safe Categories (Evaluate Carefully)

#### ⚠️ Utility Functions
**What:** Helper functions with limited scope
**Risk Level:** MEDIUM (4-6/10)
**Evaluate:** Dependency count, usage scope

#### ⚠️ Configuration Structures
**What:** Config objects, default values
**Risk Level:** MEDIUM (5-7/10)
**Evaluate:** How likely is config structure to change?

---

### Never-Safe Categories (Always Defer)

#### ❌ UI Components
**Reason:** Requires user feedback, subject to design changes
**Risk Level:** HIGH (7-9/10)

#### ❌ Integration Code
**Reason:** Requires both systems to be complete
**Risk Level:** HIGH (7-9/10)

#### ❌ Business Logic
**Reason:** Requirements may evolve
**Risk Level:** MEDIUM-HIGH (6-8/10)

#### ❌ Database Schemas (if evolving)
**Reason:** Schema changes are expensive
**Risk Level:** HIGH (7-9/10)

---

## 🏗️ AUTONOMOUS SESSION STRUCTURE

### Standard Session Template

```
Phase 1: Requested Work (40% of time)
├── Complete explicitly requested features
├── Fix reported bugs
└── Implement specified improvements

Phase 2: Pulled-Forward Work (30% of time)
├── Safe features from future stages
├── Reference data extraction
├── Pure functions and utilities
└── Data structures and schemas

Phase 3: Test & Quality (20% of time)
├── Unit test expansion
├── Integration test creation
├── Edge case coverage
└── Defensive coding improvements

Phase 4: Planning & Documentation (10% of time)
├── Edge case documentation
├── Automation opportunity sweep
├── Refactoring planning
└── Next session preparation
```

---

## 🔄 PRE-SESSION CHECKLIST

**Every autonomous session starts with:**

### 1. Future Stage Sweep (30-60 min)
```
[ ] Read all future stage/phase plans
[ ] List all features and components
[ ] Apply safety matrix to each
[ ] Estimate time and value
[ ] Prioritize by risk/value ratio
[ ] Add high-scoring items to session plan
```

### 2. Test Coverage Gap Analysis (15-30 min)
```
[ ] Identify untested modules
[ ] List missing edge cases
[ ] Find integration gaps
[ ] Plan 30-50 new tests minimum
```

### 3. Edge Case Hunting (15-30 min)
```
[ ] Review recent bug reports
[ ] Analyze user feedback
[ ] Check error logs
[ ] List defensive coding opportunities
```

### 4. Automation Opportunities (15 min)
```
[ ] Find repetitive manual tasks
[ ] Identify script-able processes
[ ] Document automation candidates
```

---

## ✅ SESSION EXECUTION GUIDELINES

### Quality Gates (Run After Each Major Change)

```bash
# 1. Full test suite
npm test
# Must: 100% pass

# 2. Linting
npm run lint
# Must: 0 errors, <5 warnings

# 3. Type checking (if TypeScript)
npm run type-check
# Must: 0 errors

# 4. Build verification
npm run build
# Must: Successful build

# 5. Validation scripts (if present)
npm run validate
# Must: 0 critical errors
```

**Gate Failure = STOP and fix before proceeding**

---

### Commit Strategy

**Atomic Commits:**
- One logical change per commit
- Tests passing before commit
- Descriptive commit messages

**Example Pattern:**
```
feat: Add JSON export schema for user data

- Create schema definition (data/schemas/user-export.schema.json)
- Add schema validation utility (lib/schema-validator.js)
- Write 15 unit tests for validation
- Document schema in developer guide

Tests: 176/176 passing (15 new)
```

**Frequency:** Every 1-2 hours, or after completing each sub-task

---

### Checkpoint Pattern

**Mandatory Checkpoints Every 4-6 Hours:**

```
CHECKPOINT {N}:
├── Run all quality gates
├── Git commit with checkpoint tag
├── Measure progress vs plan
├── Document any deviations
├── Restate goals for next phase
└── DECISION: Continue or stop?
```

**At checkpoint, stop if:**
- Quality gates failing
- Significant deviation from plan
- Unclear how to proceed
- Approaching time limit

---

## 📊 RISK MANAGEMENT

### Session Length Risk Profiles

| Duration | Risk Level | Recommended | Safeguards |
|----------|------------|-------------|------------|
| 6-8h | LOW | ✅ Standard | Basic quality gates |
| 10-12h | LOW | ✅ Standard | Checkpoints every 6h |
| 15-18h | MEDIUM | ⚠️ Evaluate | Checkpoints every 4-5h |
| 20-25h | HIGH | ❌ Avoid | Split into multiple sessions |
| 25h+ | VERY HIGH | ❌ Never | — |

### Known Risk Factors

**Context Loss:**
- **Manifestation:** After 15-20h, losing sight of original goals
- **Mitigation:** Explicit goal restatement at each checkpoint
- **Residual Risk:** MEDIUM

**Scope Creep:**
- **Manifestation:** Building "good ideas" that weren't requested
- **Mitigation:** Strict adherence to success criteria
- **Residual Risk:** MEDIUM

**Over-Engineering:**
- **Manifestation:** Adding abstraction layers not needed yet
- **Mitigation:** YAGNI principle (You Ain't Gonna Need It)
- **Residual Risk:** MEDIUM

**Integration Failures:**
- **Manifestation:** Components work individually but not together
- **Mitigation:** Integration tests, follow existing patterns
- **Residual Risk:** LOW

---

## 🎯 SUCCESS METRICS

### Quantitative Measures

**Per Session:**
- Features completed: {requested} + {pulled-forward}
- Tests added: Target 30-50 minimum
- Tests passing: Must be 100%
- Code coverage delta: +5-10%
- Commits: 5-10 atomic commits
- Time spent: Within ±20% of estimate

### Qualitative Measures

**Quality Indicators:**
- ✅ All quality gates passing
- ✅ Zero regressions introduced
- ✅ Follows project patterns
- ✅ Well-documented code
- ✅ Comprehensive tests

**Risk Indicators:**
- ⚠️ Deviations from plan documented
- ⚠️ Unclear requirements noted
- ⚠️ Technical debt flagged
- ⚠️ Refactoring needs identified

---

## 📝 STANDARD DELIVERABLES

**Every Autonomous Session Produces:**

### Code Artifacts
```
code/
├── new-features/
│   ├── requested-feature.js
│   └── pulled-forward-feature.js
├── tests/
│   ├── unit/
│   └── integration/
└── schemas/
    └── data-structures.schema.json
```

### Documentation
```
docs/
├── AUTONOMOUS-SESSION-{N}-COMPLETION-REPORT.md
├── EDGE-CASES-{TOPIC}.md
├── AUTOMATION-OPPORTUNITIES.md
└── {FEATURE}-REFERENCE.md
```

### Quality Metrics
```
metrics/
├── test-coverage-report.html
├── test-results-summary.txt
└── performance-benchmarks.json
```

---

## 🔧 PROJECT-SPECIFIC CUSTOMIZATION

### Adapt This Guide To Your Project

**1. Identify Your "Always Safe" Categories:**
```
Example (Web App):
✅ UI component pure functions (formatters, calculators)
✅ API response type definitions
✅ Form validation schemas
✅ Data transformation utilities
```

**2. Define Your Quality Gates:**
```
Example (Python Project):
- pytest (100% pass)
- mypy --strict (0 errors)
- black --check (formatted)
- pylint (score >8.0)
```

**3. Set Your Session Limits:**
```
Example (Based on Project Complexity):
- Simple project: 8-12h sessions
- Medium project: 10-15h sessions
- Complex project: 12-18h max sessions
```

**4. Establish Your Checkpoint Frequency:**
```
Example (Based on Risk Tolerance):
- High risk tolerance: Every 6h
- Medium risk tolerance: Every 4-5h
- Low risk tolerance: Every 2-3h
```

---

## 🚀 GETTING STARTED

### First Autonomous Session

**Start Conservative:**
1. Pick 6-8 hour session
2. Choose only ✅ categories (reference data, tests, docs)
3. Set 2-3 checkpoints
4. Over-communicate in completion report

**Build Confidence:**
- After 3 successful sessions → increase to 10-12h
- After 5 successful sessions → consider 15h with safeguards
- Track success rate and adjust accordingly

### Measuring Success

**Track Over Time:**
```
Session | Duration | Completed | Quality | Regressions
1       | 8h       | 100%      | High    | 0
2       | 10h      | 90%       | High    | 0
3       | 12h      | 85%       | Med     | 0
4       | 15h      | 75%       | Med     | 1 (minor)
```

**Adjust Strategy:**
- Regression → drop to shorter sessions
- <80% completion → reduce scope
- Consistent high quality → increase duration

---

## 📚 EXAMPLES FROM REAL PROJECTS

### Example 1: Traveller Combat VTT (Source Project)

**Context:** Space combat simulation, Mongoose Traveller 2E rules

**Pulled Forward Successfully:**
- Ship template JSON schemas (from Stage 14)
- Detail formatters for ship data (from Stage 12)
- Complete High Guard reference tables (from ongoing extraction)
- Weapon/armor validation modules (from Stage 12)

**Results:**
- 12-17 hours saved in future stages
- Zero regressions
- Foundation ready when UI needed

**Key Lessons:**
- Pure functions for formatters worked perfectly
- JSON schemas were stable and safe
- Reference data extraction was zero risk

---

### Example 2: E-commerce Platform (Hypothetical)

**Pulled Forward Candidates:**

**✅ Safe:**
- Product data schema (JSON)
- Price calculation functions (pure)
- Tax calculation utilities (pure)
- Order validation rules (clear spec)
- Currency formatting (locale-based)

**❌ Not Safe:**
- Checkout UI components (needs user testing)
- Payment gateway integration (API not ready)
- Inventory sync logic (business rules evolving)

---

### Example 3: Data Pipeline (Hypothetical)

**Pulled Forward Candidates:**

**✅ Safe:**
- Data transformation functions (ETL)
- Validation schemas (data quality)
- Error handling utilities
- Logging formatters
- Test data generators

**❌ Not Safe:**
- Pipeline orchestration (workflow not finalized)
- Database connectors (schema changing)
- API endpoints (interface evolving)

---

## ⚠️ COMMON PITFALLS

### Pitfall 1: "Close Enough" Dependencies

**Mistake:** "This feature only depends on X, and X is 90% done"

**Reality:** 90% done = not done. Will block or require rework.

**Fix:** Only pull truly zero-dependency work.

---

### Pitfall 2: Over-Estimation of Stability

**Mistake:** "The API schema probably won't change"

**Reality:** If it can change, it will.

**Fix:** Only pull work based on documented, finalized specs.

---

### Pitfall 3: Scope Creep During Session

**Mistake:** "While I'm here, I might as well add feature Y"

**Reality:** Feature Y wasn't in plan, may not be needed, wasted effort.

**Fix:** Strict adherence to session plan. Note ideas for next session.

---

### Pitfall 4: Ignoring Quality Gates

**Mistake:** "The test suite is failing but I'll fix it later"

**Reality:** Cascading errors, difficult rollback, wasted time.

**Fix:** Stop immediately when quality gate fails. Fix before proceeding.

---

## 🔄 CONTINUOUS IMPROVEMENT

### After Each Session

**Conduct Retrospective:**
```
What went well?
- [List successes]

What went poorly?
- [List problems]

What would I change?
- [List improvements]

Metrics:
- Estimated time: {X}h
- Actual time: {Y}h
- Accuracy: {Y/X * 100}%
```

**Update This Guide:**
- Add new "always safe" categories discovered
- Refine risk thresholds
- Improve quality gates
- Share lessons learned

---

## 📊 APPENDIX: DECISION TREES

### Should I Pull This Forward?

```
START
  ↓
Has zero dependencies? ──NO──> DEFER
  ↓ YES
Based on stable spec? ──NO──> DEFER
  ↓ YES
Pure data/function? ──YES──> SAFE, PULL FORWARD
  ↓ NO
Easy to test? ──NO──> EVALUATE CAREFULLY
  ↓ YES
Won't change? ──NO──> DEFER
  ↓ YES
Time < 6h? ──NO──> SPLIT INTO SMALLER PIECES
  ↓ YES
SAFE, PULL FORWARD
```

---

### Should I Continue This Session?

```
AT CHECKPOINT
  ↓
Quality gates passing? ──NO──> STOP, FIX ISSUES
  ↓ YES
On track with plan? ──NO──> STOP, REASSESS
  ↓ YES
Time remaining > 4h? ──NO──> WRAP UP
  ↓ YES
Clear on next steps? ──NO──> STOP, NEED CLARITY
  ↓ YES
CONTINUE TO NEXT PHASE
```

---

## 🎯 FINAL CHECKLIST

**Before Starting Autonomous Session:**
```
[ ] Future stages swept for safe work
[ ] Safety matrix applied to all candidates
[ ] Session plan written and approved
[ ] Success criteria clearly defined
[ ] Quality gates configured
[ ] Checkpoint schedule set
[ ] Rollback strategy documented
```

**During Autonomous Session:**
```
[ ] Follow session structure (40/30/20/10)
[ ] Run quality gates after each major change
[ ] Atomic commits every 1-2 hours
[ ] Stop at checkpoints for verification
[ ] Document deviations immediately
[ ] Restate goals at each checkpoint
```

**After Autonomous Session:**
```
[ ] All quality gates passing
[ ] Completion report written
[ ] Metrics documented
[ ] Retrospective conducted
[ ] Next session recommendations noted
[ ] Code committed and pushed
[ ] Lessons learned captured
```

---

## 📖 VERSION HISTORY

**v1.0 (2025-11-13):**
- Initial version
- Extracted from Traveller Combat VTT project
- Generalized for universal applicability
- Based on 3 successful autonomous sessions

**Future Versions:**
- Update after every 5 autonomous sessions
- Incorporate lessons learned
- Refine risk thresholds
- Add more examples

---

## 📄 LICENSE & ATTRIBUTION

**Source Project:** Traveller Combat VTT
**Created By:** Claude (Anthropic) in collaboration with project owner
**License:** MIT (adapt freely for your projects)

**Attribution:**
When using these patterns in other projects, credit not required but appreciated. Share improvements back to community.

---

**This guide is a living document. Update it based on your experience.**

**Key Takeaway:** Systematic forward-pulling of safe work can accelerate project velocity by 30-50% with proper risk management. The key is rigorous safety assessment and comprehensive testing.

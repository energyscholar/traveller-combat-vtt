# Autonomous Build Pool - Deferred Tasks
**Purpose:** Track low-priority overhead tasks deferred from autonomous sessions
**Last Updated:** 2025-11-13
**Total Tasks:** 6 (3 from Session 4, 3 historical)

---

## 📋 POOL MANAGEMENT PROTOCOL

### When to Pull from AB Pool

**Criteria for pulling a task:**
1. ✅ Overhead budget < 20% for current session
2. ✅ All blocking issues resolved (no primary work waiting)
3. ✅ Task estimated at ≤10% of session budget
4. ✅ Task provides clear ROI (time saved or risk reduced)

**Priority order:**
1. **CRITICAL** - Blocking future work (pull immediately)
2. **HIGH** - High ROI or risk reduction (pull when overhead < 20%)
3. **MEDIUM** - Valuable but not urgent (pull when overhead < 10%)
4. **LOW** - Nice to have (pull only if all other work complete)

### When to Defer to Pool

**Defer if:**
- Task is pure overhead (no direct feature value)
- Overhead budget already at 30%+ for session
- Task estimate > 10% of session budget
- Task has unclear ROI or requirements

---

## 🎯 ACTIVE POOL TASKS

### 1. Financialization & Income Streams Plan
**Priority:** MEDIUM
**Estimate:** 4-6h (split across multiple sessions at 10% per session)
**Deferred From:** Session 4
**Status:** 🟡 Deferred

**Description:**
Develop detailed plan for multiple income streams from Traveller Combat VTT:
- Revenue stream for Mongoose Publishing (licensing/royalty)
- Revenue stream for developer (Bruce)
- Revenue stream for GMs (content creation, module sales)
- Revenue stream for content creators (ship designs, scenarios)
- Mechanism for covering operational costs (AI tokens, Discord server, hosting)
- Market research with conservative user base estimates
- Legal/licensing considerations (Mongoose relationship)

**Deliverables:**
- Market size estimate (conservative)
- Revenue model document (subscription vs one-time vs freemium)
- Mongoose licensing proposal
- Content creator platform design
- Cost coverage mechanism (pass-through vs included)
- 5-year financial projection

**ROI Estimate:**
- Time saved: 0h (pure planning)
- Revenue potential: High (enables monetization strategy)
- Risk reduction: Medium (legal clarity with Mongoose)

**Next Steps:**
- Research VTT market size (Roll20, Foundry user bases)
- Review Mongoose Publishing licensing terms
- Analyze Traveller community spending patterns
- Draft revenue share proposal

**Pull Condition:** When Stage 16+ approached OR overhead < 10% for 2+ consecutive sessions

---

### 2. Stage Optimization & 2% Rolling Review
**Priority:** HIGH
**Estimate:** 3-4h initial + 0.5h per session ongoing
**Deferred From:** Session 4
**Status:** 🟡 Deferred

**Description:**
Create systematic process for keeping all planning documents current:
- Review Stages 13-16 for AB-suitable features
- Identify decision bottlenecks in future stages
- Create 2% budget rolling review process (each session reviews ~2% of all docs)
- Mark features as "AB-ready" vs "requires user decision"
- Update stage estimates based on Session 1-4 learnings

**Deliverables:**
- Stage 13-16 optimization report
- AB-suitable feature list (what can be pulled forward)
- Decision bottleneck inventory
- 2% rolling review protocol (added to playbook)
- Updated stage time estimates

**ROI Estimate:**
- Time saved: 8-12h (better planning = faster execution)
- Risk reduction: High (identifies blockers early)
- Process improvement: High (keeps docs fresh)

**Next Steps:**
- Read all STAGE-*-PLAN.md files
- Identify user-decision points
- Mark AB-ready vs decision-required features
- Create rolling review checklist

**Pull Condition:** After Stage 10 complete OR when planning Stage 13+

---

### 3. CTO Mentoring Article Drafts & Process Iteration
**Priority:** MEDIUM
**Estimate:** 2-3h per iteration (max 10% of AB budget per session)
**Deferred From:** Session 4
**Status:** 🟡 Deferred

**Description:**
Write early drafts of article about Claude Code CTO mentoring:
- Success story format (requires fractional CTO career success)
- Identify missing metrics for compelling narrative
- Iterate CTO mentoring daily report process
- Capture additional data points (client outcomes, revenue impact, etc.)
- Build article outline and first drafts

**Deliverables:**
- Article outline (3-5 page article)
- First draft (1,000-1,500 words)
- Missing metrics list (what to track going forward)
- Updated CTO-MENTORSHIP-TRACKING.md format
- Success criteria definition (what makes compelling story)

**ROI Estimate:**
- Time saved: 0h (content creation)
- Career value: High (publishable article, LinkedIn content)
- Process improvement: Medium (better mentoring metrics)

**Next Steps:**
- Review existing CTO-MENTORING-2025-11-13.md
- Identify gaps in narrative (need client outcomes, revenue data)
- Draft article structure
- Define "success" criteria for story

**Pull Condition:** After first fractional CTO client OR overhead < 10% for 3+ sessions

---

### 4. Small Craft Templates
**Priority:** HIGH
**Estimate:** 2-3h
**Deferred From:** Session 3A
**Status:** 🔴 BLOCKED (awaiting Small Craft Catalogue PDF)

**Description:**
Add small craft templates to ship template system:
- Fighters (light, medium, heavy)
- Shuttles (standard, armed)
- Pinnaces
- Ship's boats
- Cutters

**Blocking Issue:** Small Craft Catalogue PDF not available for validation

**Deliverables:**
- 8-12 small craft templates (data/ships/v2/)
- Validation against official stats
- Integration with ship template viewer

**ROI Estimate:**
- Time saved: 1-2h (future Stage 12+ work)
- Feature value: Medium (enables fighter combat, boarding shuttles)

**Next Steps:**
- Acquire Small Craft Catalogue PDF (official source)
- Validate against DATA-SOURCE-QUALITY-GUIDE.md
- Extract data and create templates

**Pull Condition:** When PDF available AND overhead < 20%

---

### 5. Initiative/Phase Rules Research
**Priority:** LOW
**Estimate:** 2-3h
**Deferred From:** Session 3A
**Status:** 🟡 Deferred

**Description:**
Deep dive into Traveller initiative and phase rules:
- Research edge cases in initiative (ties, multiple actions)
- Phase sequence validation (when do sensors scan, when do engineers act)
- Compare MGT2E Core vs High Guard variations
- Document any conflicts or ambiguities

**Deliverables:**
- Initiative edge case documentation
- Phase sequence flowchart
- Rule conflict resolution (if any found)
- Updated MONGOOSE-TRAVELLER-RULES-EXTRACT.md

**ROI Estimate:**
- Time saved: 1-2h (prevents future rule debates)
- Risk reduction: Low (current implementation sufficient)

**Next Steps:**
- Re-read Core Rulebook initiative section
- Re-read High Guard space combat phases
- Test edge cases in existing system
- Document any gaps

**Pull Condition:** Overhead < 10% OR Stage 11+ requires clarification

---

### 6. Best Practices Scan
**Priority:** LOW
**Estimate:** 1-2h
**Deferred From:** Session 3A
**Status:** 🟡 Deferred

**Description:**
Scan all code for best practices and improvement opportunities:
- Consistent naming conventions
- Error handling patterns
- Documentation completeness
- Test coverage gaps (if any)
- Code duplication detection

**Deliverables:**
- Best practices report
- Refactoring recommendations (low-risk only)
- Documentation gaps identified
- Updated coding standards (if needed)

**ROI Estimate:**
- Time saved: 0-1h (minor improvements)
- Code quality: Low (already high quality)
- Risk reduction: Low (no major issues expected)

**Next Steps:**
- Run automated linting (if available)
- Manual scan of lib/ directory
- Review test coverage reports
- Check for duplicated logic

**Pull Condition:** Overhead < 5% for multiple sessions OR major refactoring planned

---

## 📊 POOL STATISTICS

### By Priority
- **CRITICAL:** 0 tasks
- **HIGH:** 2 tasks (Stage Optimization, Small Craft)
- **MEDIUM:** 2 tasks (Financialization, CTO Article)
- **LOW:** 2 tasks (Initiative Research, Best Practices)

### By Status
- 🔴 **BLOCKED:** 1 task (Small Craft Templates)
- 🟡 **DEFERRED:** 5 tasks
- 🟢 **READY:** 0 tasks (none pulled yet)

### Estimated Total Work
- **Total Hours:** 15-21h
- **Per Session (10% max):** 0.8-1h per 8h session
- **Sessions Required:** ~15-20 sessions to complete pool (at 10% per session)

---

## 🔄 POOL MAINTENANCE

### During Pre-Session Sweep
1. Review AB pool for pull opportunities
2. Check if any tasks became CRITICAL (blocking)
3. Update estimates based on new learnings
4. Add any new deferred tasks from previous session

### During Session
1. Pull from pool ONLY if overhead < 20% and blocking work complete
2. Mark pulled tasks as IN PROGRESS
3. Track time against 10% session budget limit
4. Complete or re-defer if time runs out

### During Session Completion
1. Add any newly deferred tasks to pool
2. Update ROI estimates based on actual work
3. Adjust priorities if new information available
4. Document lessons learned about overhead management

---

## 📝 TASK TEMPLATE

```markdown
### N. Task Name
**Priority:** CRITICAL | HIGH | MEDIUM | LOW
**Estimate:** Xh
**Deferred From:** Session N
**Status:** 🔴 BLOCKED | 🟡 Deferred | 🟢 Ready | ✅ Complete

**Description:**
[What needs to be done]

**Deliverables:**
- Item 1
- Item 2

**ROI Estimate:**
- Time saved: Xh
- Feature value: High | Medium | Low
- Risk reduction: High | Medium | Low

**Next Steps:**
- Step 1
- Step 2

**Pull Condition:** [When to pull this task]
```

---

## 🎯 USAGE GUIDELINES

### Adding New Tasks
1. Use template above
2. Estimate time conservatively (±20%)
3. Assess ROI objectively
4. Define clear pull condition
5. Set priority based on blocking/ROI

### Pulling Tasks
1. Check overhead budget (must be < 20%)
2. Verify pull condition met
3. Limit to 10% of session budget
4. Mark as IN PROGRESS
5. Track time carefully

### Completing Tasks
1. Mark as ✅ Complete
2. Document actual time vs estimate
3. Capture lessons learned
4. Update ROI with actual value
5. Archive to completed section below

---

## ✅ COMPLETED TASKS

*(None yet - pool created in Session 4)*

---

## 📈 TRENDS & INSIGHTS

### Session 4 Observations
- 3 new tasks deferred (appropriate overhead discipline)
- All deferrals were LOW-MEDIUM priority (correct prioritization)
- No CRITICAL tasks deferred (good risk management)
- Overhead hit 20% without pulling from pool (target working correctly)

### Future Considerations
- Stage Optimization task should be pulled after Stage 10 (helps with Stage 13-16 planning)
- Small Craft Templates blocked on PDF - need procurement plan
- Financialization planning valuable but not urgent (Stage 16+ feature)
- CTO Article should wait for career success metrics (more compelling story)

---

**Created:** 2025-11-13 (Session 4)
**Next Review:** Session 5 pre-session sweep
**Maintenance:** Update during every session's pre-session sweep

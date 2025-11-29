# Autorun Initialization Pattern

**MANDATORY FOR ALL AUTORUNS**

## Purpose
Get all approval prompts out of the way BEFORE main autorun starts, allowing uninterrupted overnight execution.

## Pre-Autorun Phase

**Always execute these dummy operations at the beginning of EVERY autorun:**

### 1. File Operations Test
```bash
# Create test directory
mkdir -p .claude/autorun-test/

# Write test file (Write tool)
Write: .claude/autorun-test/init-test.md

# Edit test file (Edit tool)
Edit: Add status line to test file

# Create subdirectory (Bash mkdir)
mkdir -p .claude/autorun-test/subdir/
```

### 2. Bash Commands Test
```bash
# List directory
ls -la .claude/autorun-test/

# Check npm packages
npm list <any-package-to-install>
```

### 3. Git Operations Test
```bash
# Add test file
git add .claude/autorun-test/

# Commit test file
git commit -m "test: Pre-autorun permission check"

# Check status
git status
```

### 4. Cleanup
```bash
# Remove test directory
rm -rf .claude/autorun-test/
```

## Completion Signal

**AFTER pre-autorun completes, display LOUD announcement:**

```
═══════════════════════════════════════════════════════════
   PRE-AUTORUN COMPLETE - ALL APPROVALS OBTAINED

   ✅ File operations approved
   ✅ Bash commands approved
   ✅ Git operations approved

   MAIN AUTORUN READY TO START

   You can now walk away - autorun will proceed uninterrupted
═══════════════════════════════════════════════════════════
```

## Pattern Usage

1. **Every autorun plan MUST include pre-autorun phase first**
2. **Name it clearly:** "Pre-Autorun: Permission Initialization"
3. **Execute it BEFORE any real work**
4. **Display completion announcement LOUDLY**
5. **Then begin main autorun tasks**

## Notes

- User may pre-install packages (like XState) in separate shell
- If user says "skip the rest", skip remaining pre-autorun steps
- Always clean up test files after completion
- This pattern eliminates overnight authorization blocking

---

**Created:** 2025-11-29
**Status:** Mandatory for all future autoruns

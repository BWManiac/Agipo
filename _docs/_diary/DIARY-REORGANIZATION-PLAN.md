# Diary Reorganization Plan

**Created:** 2025-12-10  
**Status:** 📋 Planning - Awaiting Approval

---

## Problems Identified

### 1. Duplicate Files ❌
**Issue:** Both old and new format files exist for entries 01-11
- Old format: `01-01-15-25-node-execution-engine-mvp.md` (11 files)
- New format: `01-25-10-30-node-execution-engine-mvp.md` (11 files)
- **Total duplicates:** 11 pairs = 22 files (should be 11)

### 2. Inconsistent Naming ❌
**Issue:** Multiple naming patterns exist:
- `01-01-15-25-...` (old, wrong dates)
- `01-25-10-30-...` (new, correct dates but verbose)
- `12-11-30-25-...` (inconsistent format)
- `15.1-12-04-25-...` (sub-entries with dots)

**User Preference:** `01-102530-...` format (no dashes in date, simpler)

### 3. Missing Documentation ❌
**Issue:** Significant work may not be documented
- Home page development (Nov 6-11)
- Marketplace page (Nov 6)
- Profile page development
- Tools page development
- Various refactorings and improvements

---

## Proposed Solution

### Phase 1: Clean Up Duplicates

**Action:** Delete old format files (01-01-15-25 through 11-01-15-25)

**Files to Delete:**
1. `01-01-15-25-node-execution-engine-mvp.md`
2. `02-01-15-25-test-cases-execution.md`
3. `03-01-15-25-implementation-learnings.md`
4. `04-01-15-25-workflow-generator-arrival.md`
5. `05-01-15-25-assistant-context-integration.md`
6. `06-01-15-25-data-aware-workflows.md`
7. `07-01-15-25-save-load-feature.md`
8. `08-01-15-25-agent-sdk-spike.md`
9. `09-01-15-25-agent-registry.md`
10. `10-01-15-25-schema-transpilation-planning.md`
11. `11-01-15-25-agent-tool-management.md`

**Keep:** New format files (01-25-10-30 through 11-25-11-29)

---

### Phase 2: Standardize Naming Convention

**New Format:** `NN-YYMMDD-feature-name.md`

**Examples:**
- `01-251030-node-execution-engine-mvp.md` (was `01-25-10-30-...`)
- `04-251107-workflow-generator-arrival.md` (was `04-25-11-07-...`)
- `12-251130-refactoring-and-domain-domains.md` (was `12-11-30-25-...`)
- `15.1-251204-connections-page-refinement.md` (keep sub-entry format)

**Date Format Logic:**
- Extract date from git commit history
- Format as YYMMDD (e.g., 251030 = Oct 30, 2025)
- No dashes in date portion
- Keep entry number prefix (01, 02, etc.)

**Rename All Files:**
- Convert `NN-YY-MM-DD-...` → `NN-YYMMDD-...`
- Convert `NN-MM-DD-YY-...` → `NN-YYMMDD-...` (fix inconsistent formats)

---

### Phase 3: Identify Missing Entries

**Analysis Needed:**
1. Review git commits by date/feature
2. Identify major work clusters (5+ commits)
3. Check if diary entry exists
4. Create entries for missing major features

**Potential Missing Entries:**
- Home page development (Nov 6-11)
- Marketplace page (Nov 6)
- Profile/Connections page (Dec 3-4)
- Tools page development
- Various architecture refactorings

---

### Phase 4: Create Missing Entries

**Criteria for New Entry:**
- 5+ related commits OR
- Major architectural change OR
- New feature/page added OR
- Significant refactoring (10+ files changed)

**Process:**
1. Group commits by feature/date
2. Identify clusters
3. Check existing entries
4. Create new entries for gaps

---

## Implementation Steps

### Step 1: Delete Duplicates ✅
```bash
# Delete old format files
rm 01-01-15-25-*.md
rm 02-01-15-25-*.md
# ... etc for 03-11
```

### Step 2: Rename All Files to New Format
```bash
# Convert date format
01-25-10-30-... → 01-251030-...
04-25-11-07-... → 04-251107-...
12-11-30-25-... → 12-251130-...
```

### Step 3: Analyze Git History for Gaps
```bash
# Group commits by feature area
# Identify missing documentation
```

### Step 4: Create Missing Entries
```bash
# Create new diary entries for major features
```

---

## Naming Convention Details

### Format: `NN-YYMMDD-description.md`

**Components:**
- `NN` = Entry number (01, 02, 03, etc.)
- `YYMMDD` = Date in compact format (251030 = Oct 30, 2025)
- `description` = Kebab-case feature name

**Examples:**
- `01-251030-node-execution-engine-mvp.md`
- `04-251107-workflow-generator-arrival.md`
- `12-251130-refactoring-and-domain-domains.md`
- `15.1-251204-connections-page-refinement.md` (sub-entries keep dot)

**Benefits:**
- Chronological sorting by filename
- Date visible and parseable
- Simpler than current format
- Consistent across all entries

---

## Date Extraction Strategy

For each entry, extract date from git:
```bash
# Find first commit related to feature
git log --reverse --format="%ai|%s" --since="2025-10-30" | \
  grep -i "[feature-keywords]" | head -1 | \
  awk -F'|' '{split($1,d," "); split(d[1],parts,"-"); print parts[1]parts[2]parts[3]}'
```

**Date Format Conversion:**
- `2025-10-30` → `251030`
- `2025-11-07` → `251107`
- `2025-12-10` → `251210`

---

## File Renaming Map

### Entries 01-11 (Keep new format, rename to compact)
| Current | New | Date |
|---------|-----|------|
| `01-25-10-30-node-execution-engine-mvp.md` | `01-251030-node-execution-engine-mvp.md` | 2025-10-30 |
| `02-25-10-30-test-cases-execution.md` | `02-251030-test-cases-execution.md` | 2025-10-30 |
| `03-25-10-30-implementation-learnings.md` | `03-251030-implementation-learnings.md` | 2025-10-30 |
| `04-25-11-07-workflow-generator-arrival.md` | `04-251107-workflow-generator-arrival.md` | 2025-11-07 |
| `05-25-11-07-assistant-context-integration.md` | `05-251107-assistant-context-integration.md` | 2025-11-07 |
| `06-25-11-07-data-aware-workflows.md` | `06-251107-data-aware-workflows.md` | 2025-11-07 |
| `07-25-11-08-save-load-feature.md` | `07-251108-save-load-feature.md` | 2025-11-08 |
| `08-25-11-11-agent-sdk-spike.md` | `08-251111-agent-sdk-spike.md` | 2025-11-11 |
| `09-25-11-11-agent-registry.md` | `09-251111-agent-registry.md` | 2025-11-11 |
| `10-25-11-26-schema-transpilation-planning.md` | `10-251126-schema-transpilation-planning.md` | 2025-11-26 |
| `11-25-11-29-agent-tool-management.md` | `11-251129-agent-tool-management.md` | 2025-11-29 |

### Entries 12-25 (Fix inconsistent formats)
| Current | New | Date |
|---------|-----|------|
| `12-11-30-25-refactoring-and-domain-domains.md` | `12-251130-refactoring-and-domain-domains.md` | 2025-11-30 |
| `13-11-30-25-records-domain-and-polars.md` | `13-251130-records-domain-and-polars.md` | 2025-11-30 |
| `14-12-01-25-workforce-os-and-agent-modal.md` | `14-251201-workforce-os-and-agent-modal.md` | 2025-12-01 |
| `15-12-03-25-composio-integrations-platform.md` | `15-251203-composio-integrations-platform.md` | 2025-12-03 |
| `15.1-12-04-25-connections-page-refinement.md` | `15.1-251204-connections-page-refinement.md` | 2025-12-04 |
| `16-12-03-25-clerk-authentication-integration.md` | `16-251203-clerk-authentication-integration.md` | 2025-12-03 |
| `17-12-04-25-connection-tools-integration.md` | `17-251204-connection-tools-integration.md` | 2025-12-04 |
| `17.1-12-04-25-connection-tool-execution-fix.md` | `17.1-251204-connection-tool-execution-fix.md` | 2025-12-04 |
| `17.2-12-04-25-connection-tool-schema-fix.md` | `17.2-251204-connection-tool-schema-fix.md` | 2025-12-04 |
| `18-12-05-25-mastra-memory-integration.md` | `18-251205-mastra-memory-integration.md` | 2025-12-05 |
| `19-12-05-25-api-key-connections-and-tool-categories.md` | `19-251205-api-key-connections-and-tool-categories.md` | 2025-12-05 |
| `20-12-05-25-composio-toolkit-auth-modes.md` | `20-251205-composio-toolkit-auth-modes.md` | 2025-12-05 |
| `21-12-06-25-composio-mastra-architecture-refactor.md` | `21-251206-composio-mastra-architecture-refactor.md` | 2025-12-06 |
| `22-12-06-25-architecture-refactoring.md` | `22-251206-architecture-refactoring.md` | 2025-12-06 |
| `23-12-10-25-dox-feature-implementation.md` | `23-251210-dox-feature-implementation.md` | 2025-12-10 |
| `24-25-11-07-workflow-generator-implementation.md` | `24-251107-workflow-generator-implementation.md` | 2025-11-07 |
| `25-25-12-10-browser-automation-playground.md` | `25-251210-browser-automation-playground.md` | 2025-12-10 |

---

## Missing Entry Analysis

### Potential New Entries Needed

#### 1. Home & Marketplace Pages (Nov 6-11)
**Commits:** Multiple commits on home/marketplace
**First Commit:** 2025-11-06 19:56:06
**Status:** ❓ Review if significant enough

#### 2. Profile/Connections Page (Dec 3-4)
**Commits:** Multiple commits
**Status:** ⚠️ Partially covered in Entry 15/15.1/16/17
**Action:** Review if needs separate entry

#### 3. Tools Page Development
**Commits:** Unknown
**Status:** ❓ Need to investigate

#### 4. Docs Feature (Dec 10)
**Status:** ✅ Covered in Entry 23 (DOX)
**Note:** Docs vs DOX distinction may need clarification

---

## Questions for Discussion

1. **Naming Format:** Confirm `NN-YYMMDD-description.md` is preferred?
2. **Sub-entries:** Keep `15.1-...` format or change to `15a-...`?
3. **Missing Entries:** Which features need new diary entries?
4. **DOX vs Docs:** Should we document DOX deprecation separately?
5. **Entry Numbers:** Continue sequential (26, 27, 28...) or reorganize?

---

## Proposed Execution Order

1. ✅ **Delete duplicates** (old format files 01-11)
2. ✅ **Rename all files** to new format
3. ⏳ **Analyze git history** for missing entries
4. ⏳ **Create missing entries** if needed
5. ⏳ **Update references** in existing entries
6. ⏳ **Create index** for easy navigation

---

## Expected Outcome

- ✅ No duplicate files
- ✅ Consistent naming: `NN-YYMMDD-description.md`
- ✅ All dates accurate (from git)
- ✅ All major features documented
- ✅ Easy chronological sorting
- ✅ Clean, maintainable structure

---

**Ready for Review:** Please review this plan and confirm:
1. Naming format approval
2. Which missing entries to create
3. Any other concerns





# Phase 1: Legacy Agent Cleanup

**Status:** 📋 Planned  
**Depends On:** None  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Delete all legacy hardcoded agents and their associated folders to prepare for the new folder-based storage structure. This creates a clean slate for the new agent creation system and ensures no confusion between old and new agent formats.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Delete immediately vs. migrate | Delete immediately | Clean slate approach - no migration complexity, ensures new system is used exclusively |
| Keep index.ts vs. empty it | Update to remove legacy imports | Prepare for new structure while maintaining file existence for future folder-based imports |

### Pertinent Research

- **Legacy Agent Structure**: Current agents use flat `.ts` files with short IDs ("pm", "engineering", etc.)
- **New Structure**: Agents will use folders `{name-slug}-{uuid}/` with UUID v4 IDs
- **Memory Storage**: Legacy memory databases are in separate folders (engineering/, marketing/, pm/)

*Source: `_references/02-Impact-Analysis.md`, `_references/04-MASTRA-PRIMITIVES-RESEARCH.md`*

### Overall File Impact

#### Files to Delete

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `_tables/agents/mira-patel.ts` | Delete | Legacy agent file | A |
| `_tables/agents/alex-kim.ts` | Delete | Legacy agent file | A |
| `_tables/agents/elena-park.ts` | Delete | Legacy agent file | A |
| `_tables/agents/noah-reyes.ts` | Delete | Legacy agent file | A |
| `_tables/agents/engineering/` | Delete | Legacy memory folder (entire directory) | A |
| `_tables/agents/marketing/` | Delete | Legacy memory folder (entire directory) | A |
| `_tables/agents/pm/` | Delete | Legacy memory folder (entire directory) | A |

#### Files to Modify

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `_tables/agents/index.ts` | Modify | Remove all legacy imports/exports, prepare for folder-based structure | A |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-1.1 | All legacy agent files deleted | `ls _tables/agents/*.ts` shows no legacy files | A |
| AC-1.2 | All legacy folders deleted | `ls _tables/agents/` shows no engineering/, marketing/, pm/ folders | A |
| AC-1.3 | index.ts has no legacy imports | Verify index.ts contains no references to miraPatelAgent, noahReyesAgent, etc. | A |

### User Flows (Phase Level)

#### Flow 1: Legacy Cleanup Verification

```
1. System deletes all legacy agent files
2. System deletes all legacy memory folders
3. System updates index.ts to remove legacy imports
4. Verification: No legacy files/folders remain
```

---

## Part A: Delete Legacy Agents and Update Index

### Goal

Remove all hardcoded agent files, their memory folders, and clean up index.ts to prepare for the new folder-based structure.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `_tables/agents/mira-patel.ts` | Delete | Remove legacy PM agent | - |
| `_tables/agents/alex-kim.ts` | Delete | Remove legacy engineering agent | - |
| `_tables/agents/elena-park.ts` | Delete | Remove legacy support agent | - |
| `_tables/agents/noah-reyes.ts` | Delete | Remove legacy marketing agent | - |
| `_tables/agents/engineering/` | Delete | Remove legacy memory folder | - |
| `_tables/agents/marketing/` | Delete | Remove legacy memory folder | - |
| `_tables/agents/pm/` | Delete | Remove legacy memory folder | - |
| `_tables/agents/index.ts` | Modify | Remove legacy imports/exports | ~10 |

### Pseudocode

#### Manual Cleanup Process

```
Cleanup Legacy Agents
├── Delete file: _tables/agents/mira-patel.ts
├── Delete file: _tables/agents/alex-kim.ts
├── Delete file: _tables/agents/elena-park.ts
├── Delete file: _tables/agents/noah-reyes.ts
├── Delete folder: _tables/agents/engineering/
├── Delete folder: _tables/agents/marketing/
├── Delete folder: _tables/agents/pm/
├── Read index.ts
├── Remove all import statements for legacy agents
├── Update export const agents = [] to be empty array
└── Write updated index.ts
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-1.1 | All legacy agent files deleted | Run `ls _tables/agents/*.ts` - should not show mira-patel.ts, alex-kim.ts, elena-park.ts, noah-reyes.ts |
| AC-1.2 | All legacy folders deleted | Run `ls _tables/agents/` - should not show engineering/, marketing/, pm/ directories |
| AC-1.3 | index.ts has no legacy imports | Open `_tables/agents/index.ts` - should have no `import { miraPatelAgent }` statements |
| AC-1.4 | index.ts exports empty array or minimal structure | Verify `export const agents = []` or similar minimal structure |

### User Flows

#### Flow A.1: Verify Cleanup

```
1. Navigate to _tables/agents/ directory
2. List files: Should see only index.ts and agents.md
3. List directories: Should see no engineering/, marketing/, pm/ folders
4. Open index.ts: Should have no legacy imports
5. Verify agents array is empty or minimal
```

---

## Out of Scope

- **Migration of legacy agent data** → Not needed, clean slate approach
- **Backup of legacy agents** → Not needed, they are hardcoded examples
- **Updating agent-config.ts** → Planned for Phase 2
- **Updating memory.ts** → Planned for Phase 2

---

## References

- **Product Spec:** `00-PRODUCT-SPEC.md` - Legacy deletion requirements (PR-3.5, PR-3.6)
- **Implementation Plan:** `00-IMPLEMENTATION-PLAN.md` - Phase 1 details
- **Impact Analysis:** `_references/02-Impact-Analysis.md` - Legacy structure documentation

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | AI Assistant |

---

**Last Updated:** December 9, 2025


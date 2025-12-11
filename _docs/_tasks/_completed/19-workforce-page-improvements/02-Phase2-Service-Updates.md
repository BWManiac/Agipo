# Phase 2: Service Updates for Folder Structure

**Status:** 📋 Planned  
**Depends On:** Phase 1  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Update existing services (`agent-config.ts` and `memory.ts`) to work with the new folder-based agent structure (`{name-slug}-{uuid}/`) instead of the legacy flat file structure. This ensures existing agent functionality (tool assignment, chat, memory) continues to work with newly created agents.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Folder scanning vs. UUID mapping | UUID-to-folder mapping helper | Agent ID is UUID, folder name is `{name-slug}-{uuid}` - need helper to convert |
| Update agent-config.ts regex vs. rewrite | Update regex patterns for folder paths | Maintains existing pattern, just updates paths |
| Memory path update | Update to use folder-based paths | Memory already uses agentId as folder - needs to map UUID to folder name |

### Pertinent Research

- **Current agent-config.ts**: Uses hardcoded `idToFile` mapping and reads from flat `.ts` files
- **Current memory.ts**: Uses `agentId` directly as folder name: `_tables/agents/{agentId}/memory.db`
- **New Structure**: Agent ID is UUID, folder is `{name-slug}-{uuid}`, config is `{folder}/config.ts`

*Source: `_references/02-Impact-Analysis.md`, `app/api/workforce/services/agent-config.ts`*

### Overall File Impact

#### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workforce/services/agent-config.ts` | Modify | Update to read from folder structure (`{name-slug}-{uuid}/config.ts`) | A |
| `app/api/workforce/services/agent-config.README.md` | Modify | Update documentation for folder-based structure | A |
| `app/api/workforce/[agentId]/chat/services/memory.ts` | Modify | Update to use folder-based paths (map UUID to folder name) | B |
| `app/api/workforce/[agentId]/chat/services/memory.README.md` | Modify | Update documentation for folder-based paths | B |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-2.1 | agent-config.ts can read agent config from folder structure | Create test agent folder, verify config is readable | A |
| AC-2.2 | agent-config.ts can update agent config in folder structure | Update toolIds, verify file is modified correctly | A |
| AC-2.3 | memory.ts creates memory.db in correct folder location | Create agent, verify memory.db path is `{name-slug}-{uuid}/memory.db` | B |
| AC-2.4 | Memory instance works with folder-based paths | Initialize memory for agent, verify database created | B |

### User Flows (Phase Level)

#### Flow 1: Service Compatibility Verification

```
1. Create test agent with folder structure
2. Verify agent-config.ts can read config from folder
3. Verify agent-config.ts can update config in folder
4. Verify memory.ts creates memory.db in correct folder
5. Verify memory instance works correctly
```

---

## Part A: Update agent-config.ts

### Goal

Update `agent-config.ts` to work with folder-based agent structure instead of flat files. Remove hardcoded mapping and add folder scanning/mapping logic.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workforce/services/agent-config.ts` | Modify | Update file paths and remove hardcoded mapping | ~100 |
| `app/api/workforce/services/agent-config.README.md` | Modify | Update documentation for folder-based structure | ~50 |

### Pseudocode

#### `agent-config.ts` Updates

```
Update agent-config.ts
├── Remove hardcoded idToFile mapping
├── Add helper: getAgentFolderName(agentId: string): string | null
│   ├── Scan _tables/agents/ for folders matching pattern
│   ├── Extract UUID from folder name
│   └── Return folder name if UUID matches agentId
├── Update getAgentFilename() → getAgentFolderName()
├── Update file paths: {folder}/config.ts instead of {filename}.ts
├── Update updateAgentTools() to use folder path
├── Update updateConnectionToolBindings() to use folder path
└── Update updateWorkflowBindings() to use folder path
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-2.1 | getAgentFolderName() finds folder for UUID agentId | Call with UUID, verify returns correct folder name |
| AC-2.2 | getAgentCustomTools() reads from folder-based config | Create agent, assign tools, verify function returns tools |
| AC-2.3 | updateAgentTools() updates config in folder | Update toolIds, verify {folder}/config.ts is modified |
| AC-2.4 | All update functions work with folder structure | Test updateConnectionToolBindings, updateWorkflowBindings |

### User Flows

#### Flow A.1: Read Agent Config from Folder

```
1. Agent exists in folder: test-agent-{uuid}/
2. Call getAgentCustomTools(agentId)
3. System finds folder by UUID
4. System reads {folder}/config.ts
5. System returns toolIds from config
```

#### Flow A.2: Update Agent Config in Folder

```
1. Agent exists in folder: test-agent-{uuid}/
2. Call updateAgentTools(agentId, ["tool1", "tool2"])
3. System finds folder by UUID
4. System reads {folder}/config.ts
5. System updates toolIds using regex
6. System writes updated config.ts
7. Verify file contains new toolIds
```

---

## Part B: Update memory.ts

### Goal

Update `memory.ts` to use folder-based paths. Map UUID agentId to folder name when creating memory database.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workforce/[agentId]/chat/services/memory.ts` | Modify | Update to map UUID to folder name for memory.db path | ~30 |
| `app/api/workforce/[agentId]/chat/services/memory.README.md` | Modify | Update documentation for folder-based paths | ~20 |

### Pseudocode

#### `memory.ts` Updates

```
Update memory.ts
├── Add helper: getAgentFolderPath(agentId: string): string | null
│   ├── Scan _tables/agents/ for folders
│   ├── Extract UUID from each folder name
│   └── Return folder path if UUID matches agentId
├── Update getAgentMemory()
│   ├── Call getAgentFolderPath(agentId)
│   ├── Use folder path instead of agentId directly
│   ├── Update agentDir: _tables/agents/{folder-name}/
│   └── Update dbPath: file:{agentDir}/memory.db
└── Memory instance created in correct folder
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-2.3 | getAgentFolderPath() maps UUID to folder name | Call with UUID, verify returns correct folder path |
| AC-2.4 | Memory database created in agent folder | Create agent, initialize memory, verify memory.db in {folder}/ |
| AC-2.5 | Memory instance works correctly | Create memory, verify it can store/retrieve messages |

### User Flows

#### Flow B.1: Create Memory in Agent Folder

```
1. Agent exists in folder: test-agent-{uuid}/
2. Call getAgentMemory(agentId) where agentId is UUID
3. System maps UUID to folder name
4. System creates/uses folder: _tables/agents/test-agent-{uuid}/
5. System creates memory.db in that folder
6. Memory instance initialized successfully
```

---

## Out of Scope

- **Index.ts dynamic loading** → Can be added later if needed
- **Performance optimization for folder scanning** → Can cache results if needed
- **Migration of existing memory databases** → Not needed (legacy agents deleted in Phase 1)

---

## References

- **Product Spec:** `00-PRODUCT-SPEC.md` - Service update requirements
- **Implementation Plan:** `00-IMPLEMENTATION-PLAN.md` - Phase 2 details
- **Service Template:** `app/api/SERVICE_README_TEMPLATE.md` - Documentation format
- **Current Services:** `app/api/workforce/services/agent-config.ts`, `app/api/workforce/[agentId]/chat/services/memory.ts`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | AI Assistant |

---

**Last Updated:** December 9, 2025


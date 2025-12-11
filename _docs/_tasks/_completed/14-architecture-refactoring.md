# Task 14: Architecture Refactoring

**Status:** ✅ Complete  
**Date:** December 2025  
**Goal:** Clean up unused files and decompose monolithic services to improve codebase maintainability

---

## Document Philosophy

This document tells a story that any team member can follow:

1. **Where are we?** (Current State) — Understand the existing system before making changes
2. **What does success look like?** (Acceptance Criteria + User Flows) — Define the finish line upfront
3. **What do we need to touch?** (File Impact) — Scope the work concretely  
4. **How do we get there safely?** (Phased Implementation) — Break work into verifiable milestones

Each phase has its own acceptance criteria so we catch issues early and demonstrate progress incrementally.

---

## 1. Executive Summary

The Agipo codebase has accumulated technical debt: unused legacy components (~900 lines), monolithic service files (400+ lines each), and inconsistent organization. This task cleans up dead code and decomposes large files into focused, single-responsibility modules.

**End state:** A cleaner codebase where services are organized by responsibility, dead code is removed, and file organization reflects domain boundaries.

---

## 2. Current State Analysis

### 2.1 How It Works Today

**Four Backend Domains:**
```
app/api/
├── connections/   # Composio integrations, OAuth, API keys
├── records/       # Data tables, Polars-backed storage
├── tools/         # Workflow builder, transpiler, custom tools
└── workforce/     # Agents, chat, memory, capabilities
```

**Service Layer Pattern:**
- Services colocated with routes when route-specific
- Services in domain `services/` folder when shared across routes

```
# Route-specific (good)
app/api/workforce/[agentId]/chat/services/memory.ts

# Shared across domain (good)
app/api/workforce/services/agent-config.ts
```

### 2.2 Key Problem Files

| File | Lines | Issue |
|------|-------|-------|
| `runtime.ts` | 462 | Mixed responsibilities: custom tools + Composio tools + schema conversion |
| `composio.ts` | 422 | Mixed responsibilities: 3 clients + auth + connections + tool fetching |
| `chat/route.ts` | 166 | Business logic in HTTP handler |
| `profile/page.tsx` | 506 | Components inline instead of extracted |

### 2.3 Dead Code Identified

| File/Folder | Lines | Evidence |
|-------------|-------|----------|
| `ConnectionToolEditor.tsx` | 297 | Replaced by `ConnectionToolEditorPanel.tsx`, no imports |
| `agent-modal-legacy/` | ~600 | Old implementation, no imports found |

---

## 3. Acceptance Criteria

### Cleanup (4 criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC1 | `ConnectionToolEditor.tsx` deleted | File does not exist |
| AC2 | `agent-modal-legacy/` folder deleted | Folder does not exist |
| AC3 | `UXD/` consolidated into `_docs/UXD/` | Single UXD location |
| AC4 | No new TypeScript errors | `npx tsc --noEmit` passes |

### Service Decomposition (4 criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC5 | `runtime.ts` split into `custom-tools.ts` + `composio-tools.ts` | Files exist, imports work |
| AC6 | `composio.ts` split into `client.ts`, `auth.ts`, `connections.ts`, `tools.ts` | Files exist, imports work |
| AC7 | `chat/route.ts` < 60 lines, logic in `chat-service.ts` | Line count, service file exists |
| AC8 | Agent chat still works end-to-end | Manual test: send message, receive response |

### Page Decomposition (2 criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC9 | `profile/page.tsx` < 150 lines | Line count |
| AC10 | Profile page renders correctly | Manual test: view profile |

### Documentation (2 criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC11 | `app/api/tools/services/README.md` updated | File documents new structure |
| AC12 | `app/api/records/README.md` created | File exists |

---

## 4. User Flows

### Flow 1: Developer Finds Service Code

```
1. Developer needs to modify Composio authentication logic
2. Developer looks in app/api/connections/services/
3. Developer sees auth.ts (clear name)
4. Developer opens file, finds only auth-related functions
5. Developer makes change confidently
```

### Flow 2: Developer Deletes Legacy Code

```
1. Developer runs grep for "agent-modal-legacy"
2. No results found (not imported anywhere)
3. Developer safely deletes folder
4. TypeScript compiles successfully
```

### Flow 3: Agent Chat Still Works

```
1. User opens Agent Modal
2. User navigates to Chat tab
3. User sends message to agent
4. Agent responds with tool usage
5. Conversation persists correctly
```

---

## 5. File Impact Analysis

### Phase 1: Cleanup

| File | Action | Description |
|------|--------|-------------|
| `app/(pages)/workforce/components/ConnectionToolEditor.tsx` | **Delete** | Unused, replaced by Panel version |
| `app/(pages)/workforce/components/agent-modal-legacy/` | **Delete** | Unused legacy folder (~600 lines) |
| `UXD/Pages/records/*.html` | **Move** | Consolidate to `_docs/UXD/Pages/records/` |
| `UXD/` | **Delete** | Empty after move |

### Phase 2: Decompose runtime.ts

| File | Action | Description |
|------|--------|-------------|
| `app/api/tools/services/custom-tools.ts` | **Create** | `getExecutableTools()`, `getExecutableToolById()`, `clearToolCache()` |
| `app/api/tools/services/composio-tools.ts` | **Create** | `getConnectionToolExecutable()`, `convertComposioSchemaToZod()` |
| `app/api/tools/services/runtime.ts` | **Modify** | Becomes barrel file re-exporting from new files |

### Phase 3: Decompose composio.ts

| File | Action | Description |
|------|--------|-------------|
| `app/api/connections/services/client.ts` | **Create** | Singleton clients (generic, Mastra, Vercel) |
| `app/api/connections/services/auth.ts` | **Create** | `initiateConnection()`, `initiateApiKeyConnection()`, `disconnectAccount()` |
| `app/api/connections/services/connections.ts` | **Create** | `listConnections()`, `listAuthConfigs()` |
| `app/api/connections/services/tools.ts` | **Create** | `getToolsForConnection()`, `getNoAuthToolkits()` |
| `app/api/connections/services/composio.ts` | **Modify** | Becomes barrel file |

### Phase 4: Extract chat/route.ts logic

| File | Action | Description |
|------|--------|-------------|
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | **Create** | `createConfiguredAgent()`, `buildToolMap()`, `formatMessages()` |
| `app/api/workforce/[agentId]/chat/route.ts` | **Modify** | HTTP handling only |

### Phase 5: Decompose profile/page.tsx

| File | Action | Description |
|------|--------|-------------|
| `app/(pages)/profile/components/ProfileHeader.tsx` | **Create** | User info, avatar |
| `app/(pages)/profile/components/ProfileStats.tsx` | **Create** | Usage metrics |
| `app/(pages)/profile/page.tsx` | **Modify** | Composition only |

### Phase 6: Documentation

| File | Action | Description |
|------|--------|-------------|
| `app/api/tools/services/README.md` | **Modify** | Document new file structure |
| `app/api/records/README.md` | **Create** | Domain overview |

---

## 6. Implementation Phases

### Phase 1: Cleanup Dead Code

**Goal:** Remove unused files and consolidate UXD folder

**Changes:**
1. Delete `ConnectionToolEditor.tsx`
2. Delete `agent-modal-legacy/` folder
3. Move `UXD/Pages/records/` → `_docs/UXD/Pages/records/`
4. Delete empty `UXD/` folder

**Phase 1 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P1.1 | Deleted files do not exist | `ls` commands |
| P1.2 | UXD consolidated | Single `_docs/UXD/` location |
| P1.3 | TypeScript compiles | `npx tsc --noEmit` |

**Phase 1 Test Flow:**
```bash
# Verify deletions
ls app/(pages)/workforce/components/ConnectionToolEditor.tsx  # Should fail
ls app/(pages)/workforce/components/agent-modal-legacy/       # Should fail

# Verify UXD consolidated
ls _docs/UXD/Pages/records/  # Should show HTML files
ls UXD/                       # Should fail (deleted)

# Verify no breakage
npx tsc --noEmit
```

---

### Phase 2: Decompose runtime.ts

**Goal:** Split mixed-responsibility file into focused modules

**Changes:**
1. Create `custom-tools.ts` with filesystem tool loading
2. Create `composio-tools.ts` with Composio tool wrapping
3. Update `runtime.ts` to re-export from new files
4. Update `index.ts` exports

**Phase 2 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P2.1 | `custom-tools.ts` exists with tool loading functions | File inspection |
| P2.2 | `composio-tools.ts` exists with Composio functions | File inspection |
| P2.3 | Existing imports still work | `npx tsc --noEmit` |
| P2.4 | Agent chat works | Manual test |

**Phase 2 Test Flow:**
```bash
# Verify files created
ls app/api/tools/services/custom-tools.ts
ls app/api/tools/services/composio-tools.ts

# Verify compilation
npx tsc --noEmit

# Manual: Send message to agent, verify response
```

---

### Phase 3: Decompose composio.ts

**Goal:** Split Composio service into single-responsibility modules

**Changes:**
1. Create `client.ts` with singleton client factories
2. Create `auth.ts` with authentication functions
3. Create `connections.ts` with connection listing functions
4. Create `tools.ts` with tool fetching functions
5. Update `composio.ts` to re-export

**Phase 3 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P3.1 | Four new files exist | File inspection |
| P3.2 | Each file < 100 lines | `wc -l` |
| P3.3 | Existing imports still work | `npx tsc --noEmit` |
| P3.4 | Connections page works | Manual test |

**Phase 3 Test Flow:**
```bash
# Verify files created
ls app/api/connections/services/{client,auth,connections,tools}.ts

# Verify line counts
wc -l app/api/connections/services/*.ts

# Verify compilation
npx tsc --noEmit

# Manual: View connections page, add connection
```

---

### Phase 4: Extract chat/route.ts Logic

**Goal:** Thin HTTP route, fat service

**Changes:**
1. Create `services/chat-service.ts` with business logic
2. Modify `route.ts` to call service functions
3. Route should only handle: auth, parsing, calling service, returning response

**Phase 4 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P4.1 | `chat-service.ts` exists | File inspection |
| P4.2 | `route.ts` < 60 lines | `wc -l` |
| P4.3 | Agent chat works end-to-end | Manual test with tool usage |

**Phase 4 Test Flow:**
```bash
# Verify service created
ls app/api/workforce/[agentId]/chat/services/chat-service.ts

# Verify route is thin
wc -l app/api/workforce/[agentId]/chat/route.ts  # Should be < 60

# Manual: Full conversation with agent using Gmail tool
```

---

### Phase 5: Decompose profile/page.tsx

**Goal:** Extract inline components to separate files

**Changes:**
1. Create `ProfileHeader.tsx` component
2. Create `ProfileStats.tsx` component
3. Refactor `page.tsx` to compose components

**Phase 5 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P5.1 | Component files exist | File inspection |
| P5.2 | `page.tsx` < 150 lines | `wc -l` |
| P5.3 | Profile page renders correctly | Manual test |

**Phase 5 Test Flow:**
```bash
# Verify components created
ls app/(pages)/profile/components/Profile*.tsx

# Verify page is smaller
wc -l app/(pages)/profile/page.tsx  # Should be < 150

# Manual: View profile page, check all sections render
```

---

### Phase 6: Documentation

**Goal:** Update READMEs to reflect new structure

**Changes:**
1. Update `app/api/tools/services/README.md`
2. Create `app/api/records/README.md`

**Phase 6 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P6.1 | Tools README documents new file structure | File inspection |
| P6.2 | Records README exists with domain overview | File inspection |

---

## 7. Design Decisions

| Decision | Rationale |
|----------|-----------|
| Keep `proxy.ts` name | Clerk documentation recommends this naming convention |
| No Zustand for Agent Modal | Investigated - current hooks are appropriate for complexity level |
| Barrel files for backwards compatibility | `runtime.ts` and `composio.ts` become re-export files so existing imports work |
| Service colocated with route when specific | Makes dependencies clear from file structure |

---

## 8. Out of Scope

- **Agent Modal Zustand store** — Current hook architecture is appropriate
- **`proxy.ts` rename** — Clerk recommends this name
- **AI Elements / UI components** — External dependencies, don't touch
- **Package.json cleanup** — Separate task for `@composio/mastra` and `@composio/vercel`
- **Database migration for agents** — Future task

---

## 9. References

- **Architecture Audit:** `_docs/Architecture/ARCHITECTURE_AUDIT_2025-12-06.md`
- **Audit Response:** `_docs/Architecture/ARCHITECTURE_AUDIT_RESPONSE.md`
- **Store-Slice Pattern:** `_docs/Engineering/Architecture/Store-Slice-Architecture.md`
- **Diary 12:** Domain refactoring philosophy

---

## 10. Completed Work

*[To be filled as work progresses]*

---

## Notes

**Agent Modal State Investigation (Dec 6, 2025):**

Investigated whether Agent Modal warrants a Zustand store. Findings:
- Modal itself manages only `activeTab` state (single `useState`)
- Child tabs use hooks: `useAgentDetails`, `useConnectionTools`, `useCustomTools`
- Hooks are isolated—no complex interrelated state
- Unlike workflow editor (8 slices with cascading effects), Agent Modal is simple tab navigation

**Conclusion:** No store needed. Current architecture is appropriate.

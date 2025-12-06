# Refactoring Recommendations

**Date:** December 6, 2025  
**Format:** File-based, action-oriented  
**Status:** Pending PM approval

---

## Phase 1: Cleanup (Immediate, Low Risk)

### DELETE - Unused Files

| # | Action | File/Folder | Lines Removed | Reason |
|---|--------|-------------|---------------|--------|
| 1 | DELETE | `app/(pages)/workforce/components/ConnectionToolEditor.tsx` | 297 | Replaced by `ConnectionToolEditorPanel.tsx` |
| 2 | DELETE | `app/(pages)/workforce/components/agent-modal-legacy/` | ~600 | Old modal implementation, not imported anywhere |

### MOVE - Consolidate Duplicates

| # | Action | Source | Destination | Reason |
|---|--------|--------|-------------|--------|
| 3 | MOVE | `UXD/Pages/records/*.html` | `_docs/UXD/Pages/records/` | Consolidate UXD in single location |
| 4 | DELETE | `UXD/` (after move) | - | Empty after consolidation |

### RENAME - Clarity

| # | Action | Current Name | New Name | Reason |
|---|--------|--------------|----------|--------|
| 5 | RENAME | `proxy.ts` | `middleware.ts` | File is Clerk middleware, not a proxy |

**Phase 1 Total:** ~900 lines removed, 1 rename, 1 folder consolidation

---

## Phase 2: Service Layer Decomposition (Medium Risk)

### SPLIT: `app/api/tools/services/runtime.ts` (462 lines → 3 files)

| # | Action | New File | Contents | Approx Lines |
|---|--------|----------|----------|--------------|
| 6 | CREATE | `custom-tools.ts` | `getExecutableTools()`, `getExecutableToolById()`, `clearToolCache()` | ~100 |
| 7 | CREATE | `composio-tools.ts` | `getConnectionToolExecutable()`, `convertComposioSchemaToZod()` | ~200 |
| 8 | KEEP | `runtime.ts` | Re-export from new files, keep as barrel | ~20 |

**Result:** Same total lines, better separation of concerns.

### SPLIT: `app/api/connections/services/composio.ts` (422 lines → 4 files)

| # | Action | New File | Contents | Approx Lines |
|---|--------|----------|----------|--------------|
| 9 | CREATE | `client.ts` | `getComposioClient()`, `getComposioMastraClient()`, `getComposioVercelClient()` | ~80 |
| 10 | CREATE | `auth.ts` | `initiateConnection()`, `initiateApiKeyConnection()`, `disconnectAccount()` | ~80 |
| 11 | CREATE | `connections.ts` | `listConnections()`, `listAuthConfigs()` | ~50 |
| 12 | CREATE | `tools.ts` | `getToolsForConnection()`, `getNoAuthToolkits()`, `getToolsForToolkit()` | ~100 |
| 13 | KEEP | `composio.ts` | Re-export from new files | ~20 |

**Result:** Same total lines, clearer responsibilities.

### EXTRACT: `app/api/workforce/[agentId]/chat/route.ts` (166 lines → 2 files)

| # | Action | File | Contents | Approx Lines |
|---|--------|------|----------|--------------|
| 14 | CREATE | `services/chat-service.ts` | `createConfiguredAgent()`, `buildToolMap()`, `formatMessages()` | ~100 |
| 15 | MODIFY | `route.ts` | Keep only HTTP handling, call service | ~50 |

**Result:** Business logic extracted, route file is thin.

---

## Phase 3: Profile Page Cleanup (Medium Risk)

### EXTRACT: `app/(pages)/profile/page.tsx` (506 lines → components)

| # | Action | File | Contents | Approx Lines |
|---|--------|------|----------|--------------|
| 16 | CREATE | `components/ProfileHeader.tsx` | User info, avatar, stats | ~80 |
| 17 | CREATE | `components/ProfileStats.tsx` | Usage metrics | ~60 |
| 18 | MODIFY | `page.tsx` | Composition only, no business logic | ~100 |

**Note:** `ConnectionsSection.tsx` already exists and is well-structured.

---

## Phase 4: Documentation Updates (Low Risk)

### UPDATE - READMEs

| # | Action | File | Update |
|---|--------|------|--------|
| 19 | UPDATE | `app/api/connections/README.md` | Add service layer description |
| 20 | UPDATE | `app/api/tools/README.md` | Document new file structure |
| 21 | UPDATE | `app/api/workforce/README.md` | Document chat service extraction |

### CREATE - Missing Docs

| # | Action | File | Contents |
|---|--------|------|----------|
| 22 | CREATE | `app/api/records/README.md` | Domain overview, service descriptions |
| 23 | UPDATE | `CLAUDE.MD` | Reflect new architecture, update file references |

---

## Phase 5: Future Considerations (Deferred)

These items require more analysis before action:

| # | Item | Question to Answer |
|---|------|-------------------|
| A | Agent Modal Zustand Store | Is there complex interrelated state that warrants a store? |
| B | Service Placement Standardization | Colocated vs. domain root—which is better for our codebase? |
| C | AI Elements Re-import | Run `npx ai-elements@latest` to get latest Vercel components |
| D | Package Cleanup | Remove `@composio/mastra` (blocked) and `@composio/vercel` (backup)? |

---

## Summary by Phase

| Phase | Files Changed | Lines Affected | Risk | Time Est |
|-------|---------------|----------------|------|----------|
| 1: Cleanup | 5 | -900 | Low | 30 min |
| 2: Service Decomposition | 10 | 0 (restructure) | Medium | 2-3 hrs |
| 3: Profile Page | 3 | 0 (restructure) | Medium | 1 hr |
| 4: Documentation | 5 | +200 | Low | 1 hr |
| **Total** | **23** | **-700 net** | - | **5-6 hrs** |

---

## Approval Checklist

Before proceeding, please confirm:

- [ ] Phase 1 actions approved
- [ ] Phase 2 file splits approved (runtime.ts, composio.ts, route.ts)
- [ ] Phase 3 profile page restructure approved
- [ ] Phase 4 documentation updates approved
- [ ] Phase 5 items deferred (or any to prioritize?)

---

*Ready to execute upon approval.*


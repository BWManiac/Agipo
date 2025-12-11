# Diary Entry 7: Implementing Local-First "Save & Load" for Workflows

**Date:** 2025-11-08  
**Task:** N/A  
**Status:** ✅ Complete

---

## 1. Context

This entry documents the architectural decisions and implementation details for the "Save & Load" feature in the workflow generator. The primary goal was to allow users to persist their work, close the editor, and resume later, without setting up a full database infrastructure like Supabase.

We achieved this by implementing a **local-first persistence strategy**, using the server's file system as a stand-in for a real database.

---

## 2. Implementation Summary

### Files Created/Modified

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/workflows/repository/FileSystemWorkflowRepository.ts` | Create | File system persistence layer | ~80 |
| `app/api/workflows/route.ts` | Create | GET list, POST create | ~40 |
| `app/api/workflows/[id]/route.ts` | Create | GET one, PUT update | ~50 |
| `store/canvasSlice.ts` | Modify | Added `currentWorkflowId`, `workflowName`, `loadCompleteWorkflow()` | ~30 |
| `store/executionSlice.ts` | Modify | Added `saveCurrentWorkflow()`, `isSaving` | ~40 |
| `components/ControlPanel.tsx` | Modify | Added save button and workflow name input | ~20 |

### The "Dual-Purpose Save" Requirement

The "Save" button needs to fulfill two distinct needs:

1. **Save for Editing (Implemented):** Like saving a project file (`.psd` or `.docx`). Captures entire state of editor—including node positions, UI states, and contents of all tabs (`Flow`, `Spec`, `Code`)—into a JSON file. Allows user to reload editor and find it in exact state they left it.

2. **Save for Execution (Future Work):** Like compiling a program. Involves transpilation step that converts visual workflow into self-contained, portable, executable script (a "Tool Bundle"). This bundle is what an AI agent or another service can run independently of the editor UI.

**Key distinction:** The JSON file we save now is the *source code* for the editor, which will later be used as input for the transpilation process.

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Persistence Strategy | File system (local-first) | No database required, simple, version-control friendly |
| Backend Pattern | Repository + API routes | Clean separation, easy to replace with DB later |
| State Management | Zustand slices | Matches existing architecture |
| API Structure | RESTful (collection + instance routes) | Predictable, scalable |

---

## 4. Technical Deep Dive

### Architecture: A Full-Stack Feature

The feature touched every layer of the application's architecture.

**Backend: Repository Pattern & API Routes**

**Repository (`FileSystemWorkflowRepository.ts`):**
- Lowest level of persistence logic
- Only part of application that knows how to read/write file system
- Methods: `getWorkflows()`, `getWorkflowById(id)`, `saveWorkflow(id, data)`
- Acts as database model

**API Routes:**
- `/api/workflows`: Collection operations (GET list, POST create)
- `/api/workflows/[id]`: Instance operations (GET one, PUT update)
- Follows RESTful pattern
- Makes API predictable and easy to replace with real database later

**Frontend: State, Logic, and UI**

**State Slices:**
- `canvasSlice`: `currentWorkflowId`, `workflowName`, `loadCompleteWorkflow(data)`
- `executionSlice`: `saveCurrentWorkflow()`, `isSaving`

**Logic Hooks:**
- `useCanvasState.ts`, `useExecution.ts` expose state and actions to UI
- Keep page component simple and declarative

**UI Layer:**
- `page.tsx` uses `useSearchParams` to get workflow ID from URL
- `ControlPanel.tsx` contains save button and workflow name input

### User Flow in Code

1. User navigates to `/workflows` → `WorkflowsPage` fetches from `/api/workflows`
2. User clicks card → navigates to `/workflow-generator?id=my-workflow`
3. `page.tsx` sees `id` in URL → fetches `/api/workflows/my-workflow`
4. `loadCompleteWorkflow()` called → replaces nodes, edges, name in `canvasSlice`
5. User changes name → calls `setWorkflowName`
6. User clicks "Save" → `onSave` calls `saveCurrentWorkflow()`
7. Action determines new/existing → makes POST or PUT request
8. API route calls `saveWorkflow()` → writes JSON file to `_workflows` directory

---

## 5. Lessons Learned

- **Repository pattern works:** Clean separation between persistence and API
- **RESTful structure scales:** Easy to understand and extend
- **File system is sufficient for MVP:** No database needed initially
- **State management clarity:** Slice boundaries need careful consideration

---

## 6. Next Steps

- [ ] Refactor state slices: Clarify responsibilities between `canvasSlice` and `executionSlice`
- [ ] Add comments: Document new actions' purpose and side effects
- [ ] Fix build error: Resolve TypeScript types in `chat-panel` hooks
- [ ] Implement "Save for Execution": Transpilation step for tool bundles

---

## References

- **Related Diary:** `06-DataAwareWorkflows.md` - Data binding work
- **Related Diary:** `10-SchemaTranspilationPlanning.md` - Transpilation planning

---

**Last Updated:** 2025-11-08

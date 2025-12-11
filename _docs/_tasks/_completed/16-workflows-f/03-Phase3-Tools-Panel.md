# Phase 3: Tools Panel + Sequential Steps (Rail View)

**Status:** ✅ Complete  
**Date Started:** December 2025  
**Date Completed:** December 7, 2025

---

## Goal

Build the **Tools Panel** and **Rail View** display, enabling users to:
1. Browse ALL available integrations/tools (complete catalog)
2. Search and filter tools by name
3. Click tools to add them as sequential steps
4. See steps displayed in **Rail View** (locked vertical flow)
5. Steps feed into each other in sequence (`.then()` pattern)

**Focus:** Tools panel + sequential steps + Rail View. Control flow primitives (branch, parallel, loop) are Phase 4.

**End state:** Users can open the editor, browse all available Composio integrations and their tools, add them as sequential steps, and see the workflow displayed in Rail View.

---

## View Decision: Rail View

After exploring Canvas, Rail, Outline, and Swimlane views, **Rail View** is chosen as the primary workflow visualization:

| Aspect | Rail View Advantage |
|--------|---------------------|
| **Layout** | Locked vertical - users can't mess it up |
| **Structure** | Single rail with controlled horizontal expansion |
| **Predictability** | Deterministic - structure determines layout |
| **Visual Appeal** | More interesting than outline, cleaner than canvas |
| **Control Flow** | Branches/parallel expand horizontally but snap to structure |

**Mockups:** `app/(pages)/workflows-f/UXD/primitives/list-view/rail-view/`

---

## Settings Panel Tabs (6 Total)

| Tab | Purpose | Phase |
|-----|---------|-------|
| **Tools** | Add Composio tools as steps | **Phase 3** ✅ |
| **Logic** | Add control flow (Branch, Parallel, Loop, ForEach) | Phase 4 |
| Inputs | Configure workflow inputs | Phase 5+ |
| Config | Workflow settings | Phase 5+ |
| Connect | Integrations/auth | Phase 5+ |
| Test | Run/test workflow | Phase 5+ |

---

## Implementation Summary

### Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `app/api/workflows-f/available-integrations/route.ts` | Fetch ALL integrations + tools from Composio | ~85 |
| `app/(pages)/workflows-f/editor/store/slices/tabs/toolsSlice.ts` | Zustand slice for Tools tab state | ~96 |
| `app/(pages)/workflows-f/editor/components/panels/tools/ToolPalette.tsx` | Main tool palette with search | ~107 |
| `app/(pages)/workflows-f/editor/components/panels/tools/ToolPaletteGroup.tsx` | Collapsible integration group | ~50 |
| `app/(pages)/workflows-f/editor/components/panels/tools/ToolPaletteItem.tsx` | Individual tool item | ~30 |
| `app/(pages)/workflows-f/editor/components/EditorInspector.tsx` | Right panel with 6 tabs | ~63 |
| `app/(pages)/workflows-f/editor/components/RailView.tsx` | Main Rail View container | ~52 |
| `app/(pages)/workflows-f/editor/components/rail/RailStep.tsx` | Individual step card | ~42 |
| `app/(pages)/workflows-f/editor/components/rail/RailConnector.tsx` | Visual connector (dot + lines) | ~12 |

### Files Modified

| File | Changes |
|------|---------|
| `app/(pages)/workflows-f/editor/store/index.ts` | Added `toolsSlice` to store composition |
| `app/(pages)/workflows-f/editor/store/types.ts` | Added `ToolsSlice` to `WorkflowStore` type |
| `app/(pages)/workflows-f/editor/store/slices/persistenceSlice.ts` | Renamed `loadWorkflow` → `fetchWorkflowById` to fix naming conflict |
| `app/(pages)/workflows-f/editor/hooks/usePersistence.ts` | Updated to use `fetchWorkflowById` |
| `app/(pages)/workflows-f/editor/hooks/useWorkflowLoader.ts` | Updated to use `fetchWorkflowById` |
| `app/(pages)/workflows-f/editor/page.tsx` | Integrated RailView + EditorInspector |
| `app/api/workflows-f/types/table-requirements.ts` | Fixed `z.record()` to use 2 arguments |
| `app/api/workflows-f/types/workflow.ts` | Fixed `z.record()` to use 2 arguments |

---

## File Impact Analysis (Completed)

### Part A: API Route for Available Integrations ✅

| File | Action | Purpose | Status |
|------|--------|---------|--------|
| `app/api/workflows-f/available-integrations/route.ts` | **Created** | Fetch ALL available integrations and their tools | ✅ |

**Key Implementation Details:**
- Uses `listAuthConfigs()` and `getToolsForToolkit()` from existing Composio services
- **Deduplicates by slug** - Multiple auth configs can exist for same integration (e.g., multiple Google Calendar connections)
- Returns `{ integrations: [...] }` with each integration having `{ slug, name, logo, authMode, tools[] }`
- Fetches tools in parallel for performance

**Deduplication Logic:**
```typescript
const seenSlugs = new Set<string>();
const uniqueConfigs = authConfigs.items.filter((config: any) => {
  const slug = config.toolkit?.slug || config.appId || "";
  if (!slug || seenSlugs.has(slug)) return false;
  seenSlugs.add(slug);
  return true;
});
```

---

### Part B: Tools Store Slice ✅

| File | Action | Purpose | Status |
|------|--------|---------|--------|
| `app/(pages)/workflows-f/editor/store/slices/tabs/toolsSlice.ts` | **Created** | Store slice for Tools tab state | ✅ |

**Folder Structure:**
```
store/slices/
├── workflowSlice.ts
├── stepsSlice.ts
├── mappingsSlice.ts
├── persistenceSlice.ts
├── uiSlice.ts
├── chatSlice.ts
└── tabs/
    └── toolsSlice.ts    ← NEW
```

**State & Actions:**
```typescript
interface ToolsSlice {
  integrations: Integration[];
  isLoadingTools: boolean;
  toolsError: string | null;
  toolsSearchQuery: string;
  
  fetchTools: () => Promise<void>;
  setToolsSearchQuery: (query: string) => void;
  getFilteredIntegrations: () => Integration[];
}
```

---

### Part C: Tool Palette Components ✅

| File | Action | Purpose | Status |
|------|--------|---------|--------|
| `app/(pages)/workflows-f/editor/components/panels/tools/ToolPalette.tsx` | **Created** | Main palette with search | ✅ |
| `app/(pages)/workflows-f/editor/components/panels/tools/ToolPaletteGroup.tsx` | **Created** | Collapsible integration group | ✅ |
| `app/(pages)/workflows-f/editor/components/panels/tools/ToolPaletteItem.tsx` | **Created** | Individual tool item | ✅ |

**Folder Structure (Tab-based organization):**
```
components/panels/
└── tools/
    ├── ToolPalette.tsx
    ├── ToolPaletteGroup.tsx
    └── ToolPaletteItem.tsx
```

Ready for future tabs: `logic/`, `inputs/`, `config/`, etc.

**handleAddTool Implementation:**
```typescript
const handleAddTool = (tool: Tool, integration: Integration) => {
  const steps = useWorkflowStore.getState().steps;
  const newStep: WorkflowStep = {
    id: nanoid(),
    type: "composio",
    name: tool.name,
    description: tool.description,
    toolId: tool.id,
    toolkitSlug: integration.slug,
    toolkitName: integration.name,
    toolkitLogo: integration.logo,
    position: { x: 0, y: steps.length * 150 },
    listIndex: steps.length,
    inputSchema: {},
    outputSchema: {},
  };
  addStep(newStep);
  setSelectedStepId(newStep.id);
};
```

---

### Part D: Settings Panel (EditorInspector) ✅

| File | Action | Purpose | Status |
|------|--------|---------|--------|
| `app/(pages)/workflows-f/editor/components/EditorInspector.tsx` | **Created** | Right panel with 6 tabs | ✅ |

**Tab Configuration:**
```typescript
const tabs = [
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "logic", label: "Logic", icon: GitBranch },
  { id: "inputs", label: "Inputs", icon: FileInput },
  { id: "config", label: "Config", icon: Settings },
  { id: "connect", label: "Connect", icon: Link },
  { id: "test", label: "Test", icon: Play },
];
```

---

### Part E: Rail View Display ✅

| File | Action | Purpose | Status |
|------|--------|---------|--------|
| `app/(pages)/workflows-f/editor/components/RailView.tsx` | **Created** | Main Rail View container | ✅ |
| `app/(pages)/workflows-f/editor/components/rail/RailStep.tsx` | **Created** | Step card (no dots) | ✅ |
| `app/(pages)/workflows-f/editor/components/rail/RailConnector.tsx` | **Created** | Single connector dot | ✅ |

**Rail View Structure:**
```
START
  │
  ├── [Step Card 1]
  │
  ●  ← Single connector dot
  │
  ├── [Step Card 2]
  │
END
```

**Design Decision:** Step cards have no input/output dots. Only the connector between steps has a single small dot. This creates a cleaner visual flow.

---

### Part F: Store Integration ✅

| File | Action | Changes | Status |
|------|--------|---------|--------|
| `store/index.ts` | **Modified** | Added `createToolsSlice` | ✅ |
| `store/types.ts` | **Modified** | Added `ToolsSlice` to union | ✅ |

---

### Part G: Editor Page Integration ✅

| File | Action | Changes | Status |
|------|--------|---------|--------|
| `editor/page.tsx` | **Modified** | Integrated RailView + EditorInspector | ✅ |

**Updated Layout:**
```tsx
<div className="flex flex-1 overflow-hidden">
  {/* Left: Chat (placeholder) */}
  <aside className="w-80 border-r">...</aside>
  
  {/* Center: Rail View */}
  <main className="flex-1"><RailView /></main>
  
  {/* Right: Settings Panel */}
  <aside className="w-80"><EditorInspector /></aside>
</div>
```

---

## Bug Fixes Applied

### 1. Duplicate Key Error (googlecalendar)
**Problem:** Multiple auth configs existed for same integration slug  
**Solution:** Added deduplication by slug in API route

### 2. `loadWorkflow` Naming Conflict
**Problem:** Both `workflowSlice` and `persistenceSlice` had `loadWorkflow` with different signatures  
**Solution:** Renamed persistence method to `fetchWorkflowById(workflowId: string)`

### 3. Zod `z.record()` Errors
**Problem:** `z.record(z.string())` needs 2 arguments in newer Zod  
**Solution:** Changed to `z.record(z.string(), z.string())` in `table-requirements.ts` and `workflow.ts`

### 4. Extra Rail View Dots
**Problem:** Each step had input/output dots PLUS connector had dots  
**Solution:** Removed dots from RailStep, kept single connector dot in RailConnector

---

## Acceptance Criteria (All Met)

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | API returns integrations with tools | ✅ `GET /api/workflows-f/available-integrations` |
| AC-2 | Tools tab shows loading then integrations | ✅ Spinner → integration list |
| AC-3 | Integration groups are expandable | ✅ Click to expand/collapse |
| AC-4 | Search filters tools | ✅ Type to filter by name/description |
| AC-5 | Click tool adds step to store | ✅ Creates WorkflowStep |
| AC-6 | Rail View shows steps vertically | ✅ START → steps → END |
| AC-7 | Multiple steps show connectors | ✅ Single dot between steps |
| AC-8 | Click step selects it | ✅ Highlighted with ring |

---

## User Flows (Verified)

### Flow 1: Add First Tool
```
1. Open /workflows-f/editor?id=xxx
2. See right panel with "Tools" tab active
3. See list of integrations (Slack, Gmail, Firecrawl, etc.)
4. Click "Slack" to expand
5. See Slack tools (SLACK_SEND_MESSAGE, etc.)
6. Click "SLACK_SEND_MESSAGE"
7. See step appear in center Rail View
```

### Flow 2: Add Multiple Tools (Sequential)
```
1. Already have one step from Flow 1
2. Expand "Gmail" integration
3. Click "GMAIL_SEND_EMAIL"
4. See second step appear below first
5. See connector dot between steps
6. Steps now flow: Slack → Gmail
```

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Route named `available-integrations`** | More descriptive than `tools` - clearly indicates it returns integrations catalog |
| **Dedupe by slug** | Multiple auth configs can exist for same integration - avoid duplicate keys |
| **`panels/tools/` subfolder** | Organizes panel components by tab - ready for `logic/`, `inputs/`, etc. |
| **Single connector dot** | Cleaner visual - dots on steps + connector was too busy |
| **`fetchWorkflowById` rename** | Avoids conflict with `loadWorkflow` in workflowSlice |
| **Store slice over hook** | Maintains Zustand architecture consistency |

---

## References

- **Composio Services:** `app/api/connections/services/composio.ts`
- **Auth Configs Pattern:** `app/api/connections/auth-configs/route.ts`
- **Rail View Mockups:** `app/(pages)/workflows-f/UXD/primitives/list-view/rail-view/`
- **Previous Phases:** `01-Phase1-Foundation.md`, `02-Phase2-Refactoring-and-Editor-Foundation.md`

---

**Last Updated:** December 7, 2025

# Task 3 – Agent Tool Management & Workflow Integration

## Objective
- [ ] Enable users to edit agent tool assignments through the workforce UI
- [ ] Establish storage strategy for transpiled workflow tools (colocated with workflow files)
- [ ] Integrate workflow-derived tools into the agent tool registry system
- [ ] Ensure agents can discover, load, and call tools that originated from workflows
- [ ] Work backwards from tool calling to validate the end-to-end flow

---

## Why This Matters

**Working backwards from tool calling:**
- We need to understand how agents will actually use transpiled workflow tools before finalizing the transpiler output format
- The UI for tool management will reveal requirements we might miss if we only focus on transpilation
- Storage strategy affects how tools are discovered, loaded, and versioned

**User experience:**
- Users should be able to assign workflow-derived tools to agents just like built-in tools
- The connection between workflows and tools should be visible and manageable
- Tool editing should feel natural in the workforce context

**System integration:**
- Transpiled tools need to integrate seamlessly with existing `_tables/tools` registry
- Agents need to load tools from multiple sources (built-in + workflow-derived)
- Tool discovery should work across both sources

---

## Current State Analysis

### 3.1 Tool Display (Read-Only)

**File:** `app/(pages)/workforce/components/AgentModal.tsx`

**Current behavior:**
- Tools are displayed in "Tool usage" section (lines 104-132)
- Tools are read-only — users can click to inspect via `ToolInspector` but cannot add/remove
- Tools are loaded via `agent.toolIds.map((id) => getToolById(id))`
- Each tool shows name and description

**Limitation:** No way to edit tool assignments without modifying agent config files directly.

### 3.2 Tool Assignment (File-Based)

**File:** `_tables/agents/alex-kim.ts`

**Current pattern:**
```typescript
export const alexKimAgent: AgentConfig = {
  id: "engineering",
  toolIds: ["requirements_digest", "launch_tracker"], // Hard-coded array
  // ...
};
```

**Limitation:** Tool assignments are static — require code changes to modify.

### 3.3 Tool Registry (Single Source)

**File:** `_tables/tools/index.ts`

**Current structure:**
- All tools imported from `_tables/tools/*.ts` files
- `getToolById()` searches the aggregated array
- Tools are manually created TypeScript files

**Limitation:** No support for dynamically loaded tools from workflows.

### 3.4 Workflow Storage

**Directory:** `_workflows/`

**Current structure:**
- Workflows stored as JSON files (`yc-2.json`, `ai-test.json`, etc.)
- Each file contains: `id`, `name`, `description`, `nodes`, `edges`, `apiKeys`
- No transpiled tool files exist yet

**Opportunity:** We can colocate transpiled tools here (e.g., `yc-2.json` + `yc-2.tool.ts`).

---

## Storage Strategy: Colocated Tools

### 4.1 Proposed Structure

**Option: Colocate transpiled tools with workflows**

```
_workflows/
  ├── yc-2.json              # Original workflow definition
  ├── yc-2.tool.ts           # Transpiled tool (generated)
  ├── ai-test.json
  ├── ai-test.tool.ts
  └── ...
```

**Benefits:**
- Clear relationship between workflow and its tool
- Easy to find both files together
- Versioning stays aligned (workflow + tool updated together)
- Simple file system navigation

**Considerations:**
- Need to handle workflow renames (update tool filename)
- Need to handle workflow deletion (clean up tool file)
- Tool registry needs to scan `_workflows/*.tool.ts` files

### 4.2 Alternative: Separate Tool Directory

```
_workflows/
  └── *.json                 # Workflows only

_tables/tools/
  └── workflow-*.ts         # Transpiled tools (e.g., workflow-yc-2.ts)
```

**Trade-offs:**
- Separates workflows from tools (less obvious connection)
- Tools live with built-in tools (consistent registry location)
- Easier to scan all tools in one place

**Decision:** **Colocate with workflows** — clearer relationship, easier to understand workflow → tool connection.

---

## Tool Registry Enhancement

### 5.1 Multi-Source Tool Loading

**Current:** `_tables/tools/index.ts` only loads from `_tables/tools/*.ts`

**Proposed:** Extend to load from multiple sources:

```typescript
// _tables/tools/index.ts
import { tools as builtInTools } from './built-in-tools';
import { loadWorkflowTools } from './workflow-tools-loader';

export const tools = [
  ...builtInTools,
  ...loadWorkflowTools(), // Scans _workflows/*.tool.ts
];

export function getToolById(id: string) {
  return tools.find((tool) => tool.id === id);
}
```

### 5.2 Workflow Tool Loader

**New file:** `_tables/tools/workflow-tools-loader.ts`

**Responsibilities:**
- Scan `_workflows/` directory for `*.tool.ts` files
- Dynamically import each tool file
- Extract `ToolDefinition` exports
- Handle errors gracefully (missing files, invalid exports)

**Implementation considerations:**
- Use Node.js `fs` to scan directory (server-side only)
- Dynamic imports for each tool file
- Cache results to avoid repeated file system access
- Handle transpilation errors (log warnings, skip invalid tools)

### 5.3 Tool ID Convention

**Current:** Tools use arbitrary IDs (`requirements_digest`, `launch_tracker`)

**Proposed for workflow tools:** `workflow-{workflowId}`

**Example:**
- Workflow: `yc-2.json` → Tool ID: `workflow-yc-2`
- Workflow: `ai-test.json` → Tool ID: `workflow-ai-test`

**Benefits:**
- Clear namespace separation (built-in vs workflow tools)
- Easy to identify tool origin
- Prevents ID collisions

**Alternative:** Use workflow name as-is if it's unique, fallback to prefixed ID.

---

## UI for Tool Management

### 6.1 Tool Editing Interface

**Location:** `app/(pages)/workforce/components/AgentModal.tsx`

**Current "Tool usage" section enhancement:**

**Before (read-only):**
```tsx
<div className="grid gap-3">
  {tools.map((tool) => (
    <div key={tool.id} className="...">
      <button onClick={() => setSelectedToolId(tool.id)}>
        <h4>{tool.name}</h4>
        <p>{tool.description}</p>
      </button>
    </div>
  ))}
</div>
```

**After (editable):**
```tsx
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <h3>Tool usage</h3>
    <Button onClick={() => setToolEditorOpen(true)}>
      Edit tools
    </Button>
  </div>
  <div className="grid gap-3">
    {tools.map((tool) => (
      <ToolCard 
        key={tool.id} 
        tool={tool}
        onRemove={() => handleRemoveTool(tool.id)}
      />
    ))}
  </div>
</div>
```

### 6.2 Tool Editor Modal

**New component:** `app/(pages)/workforce/components/ToolEditor.tsx`

**Features:**
- List all available tools (built-in + workflow-derived)
- Show which tools are currently assigned
- Checkbox/switch interface for add/remove
- Search/filter tools
- Group by source (Built-in tools, Workflow tools)
- Show tool metadata (description, runtime, source workflow if applicable)

**UI Structure:**
```
┌─────────────────────────────────────┐
│ Edit Tools for [Agent Name]         │
├─────────────────────────────────────┤
│ [Search tools...]                    │
│                                     │
│ Built-in Tools                       │
│ ☑ Requirements Digest                │
│ ☑ Launch Tracker                     │
│ ☐ Stakeholder Pulse                  │
│                                     │
│ Workflow Tools                       │
│ ☐ YC Application Scoring (yc-2)     │
│ ☐ AI Test Workflow (ai-test)         │
│                                     │
│ [Cancel] [Save Changes]              │
└─────────────────────────────────────┘
```

### 6.3 Tool Assignment Persistence

**Option A: File-based (current pattern)**
- Update agent config file directly
- Write to `_tables/agents/{agentId}.ts`
- Requires file system write access
- Simple, matches current architecture

**Option B: API route + storage**
- POST to `/api/agents/{agentId}/tools`
- Store assignments in database or file
- More flexible for future (multi-user, permissions)
- Requires backend storage layer

**Recommendation:** **Start with Option A** (file-based) to match current architecture. Can migrate to Option B later if needed.

---

## Workflow → Tool → Agent Flow

### 7.1 Complete Flow Diagram

```
1. User creates workflow in workflow generator
   └─> Saves to _workflows/yc-2.json

2. User clicks "Generate Tool" (or auto-generates on save)
   └─> Transpiler runs
   └─> Generates _workflows/yc-2.tool.ts
   └─> Exports ToolDefinition with id: "workflow-yc-2"

3. Tool registry scans _workflows/*.tool.ts
   └─> Loads workflow-yc-2.tool.ts
   └─> Adds to tools array
   └─> getToolById("workflow-yc-2") now works

4. User opens agent modal in workforce UI
   └─> Clicks "Edit tools"
   └─> Tool editor shows "YC Application Scoring" (from workflow)
   └─> User checks box to assign tool
   └─> Saves changes

5. Agent config updated
   └─> _tables/agents/alex-kim.ts updated
   └─> toolIds: [..., "workflow-yc-2"]

6. Agent chat uses tool
   └─> POST /api/workforce/agent with agentId
   └─> Route loads agent config
   └─> Resolves toolIds including "workflow-yc-2"
   └─> getToolById("workflow-yc-2") returns transpiled tool
   └─> Agent SDK receives tool in tools map
   └─> Model can call tool when appropriate
```

### 7.2 Key Integration Points

**1. Transpiler Output Format**
- Must export `ToolDefinition` matching `_tables/types.ts`
- Tool ID must follow convention (`workflow-{id}`)
- File must be importable by Node.js

**2. Tool Registry Loading**
- Must scan `_workflows/` for `*.tool.ts` files
- Must handle dynamic imports safely
- Must merge with built-in tools

**3. Agent Config Updates**
- Must support programmatic updates to `toolIds` array
- Must preserve other agent config fields
- Must handle validation (tool exists, etc.)

**4. UI Discovery**
- Tool editor must show workflow tools
- Must indicate tool source (built-in vs workflow)
- Must show which workflow a tool came from

---

## Implementation Phases

### Phase A: Tool Registry Enhancement
1. Create `workflow-tools-loader.ts` to scan `_workflows/*.tool.ts`
2. Update `_tables/tools/index.ts` to merge built-in + workflow tools
3. Add error handling for missing/invalid tool files
4. Test with manually created example tool file

### Phase B: Tool Editor UI
1. Create `ToolEditor.tsx` component
2. Add "Edit tools" button to AgentModal
3. Implement tool list with checkboxes
4. Add search/filter functionality
5. Group tools by source (built-in vs workflow)

### Phase C: Tool Assignment Persistence
1. Create API route or file writer for agent config updates
2. Implement validation (tool exists, agent exists)
3. Update agent config file programmatically
4. Handle errors gracefully (file locked, invalid tool, etc.)

### Phase D: Workflow Tool Generation Integration
1. Add "Generate Tool" action to workflow generator
2. Wire transpiler to write `{workflowId}.tool.ts` to `_workflows/`
3. Show tool generation status in UI
4. Link from workflow to generated tool (if exists)

### Phase E: End-to-End Testing
1. Create workflow → transpile → assign to agent → call tool
2. Verify tool appears in agent modal
3. Verify agent can call tool successfully
4. Test error cases (missing tool, invalid tool, etc.)

---

## Open Questions & Decisions Needed

### 8.1 Tool ID Strategy
**Question:** Should workflow tool IDs be `workflow-{id}` or use workflow name?

**Options:**
- A) `workflow-{id}` — Always prefixed, clear namespace
- B) `{workflowName}` — Use workflow name if unique, fallback to prefixed
- C) `{workflowId}` — Use workflow ID as-is (e.g., `yc-2`)

**Recommendation:** Option A — Clear namespace, prevents collisions, easy to identify source.

### 8.2 Tool Generation Trigger
**Question:** When should tools be generated?

**Options:**
- A) Manual — User clicks "Generate Tool" button
- B) Auto on save — Generate whenever workflow is saved
- C) Auto on publish — Generate when workflow is "published" (new state)

**Recommendation:** Start with Option A (manual), add Option B later if users want it.

### 8.3 Tool Update Strategy
**Question:** What happens when workflow is updated?

**Options:**
- A) Regenerate tool — Overwrite existing tool file
- B) Version tools — Create new tool file, deprecate old
- C) Warn user — Prompt before regenerating

**Recommendation:** Option A for now (simple), consider versioning later if needed.

### 8.4 Agent Config Update Method
**Question:** How do we update agent config files?

**Options:**
- A) Direct file write — Use `fs.writeFile` to update TypeScript file
- B) AST manipulation — Parse TS file, modify AST, write back
- C) JSON config — Store toolIds in separate JSON, import in TS

**Recommendation:** Option B (AST manipulation) for safety, or Option C (JSON config) for simplicity.

### 8.5 Tool Discovery in UI
**Question:** How should workflow tools be displayed in tool editor?

**Options:**
- A) Separate section — "Built-in Tools" vs "Workflow Tools"
- B) Mixed list — All tools together, badge to indicate source
- C) Tabs — Switch between built-in and workflow tools

**Recommendation:** Option A — Clear separation, easier to understand.

---

## Acceptance Criteria

### Tool Registry
- [ ] `getToolById()` can find tools from both `_tables/tools/*.ts` and `_workflows/*.tool.ts`
- [ ] Workflow tools are loaded dynamically without requiring code changes
- [ ] Missing or invalid tool files don't crash the registry
- [ ] Tool IDs follow consistent naming convention

### Tool Editor UI
- [ ] Users can open tool editor from agent modal
- [ ] All available tools (built-in + workflow) are listed
- [ ] Currently assigned tools are clearly indicated
- [ ] Users can add/remove tools via checkboxes or switches
- [ ] Tools are grouped by source (built-in vs workflow)
- [ ] Search/filter works across all tools
- [ ] Changes can be saved or cancelled

### Tool Assignment
- [ ] Tool assignments persist after save
- [ ] Agent config files are updated correctly
- [ ] Invalid tool IDs are rejected with clear error
- [ ] Changes are reflected immediately in agent modal
- [ ] Agent can use newly assigned tools in chat

### Workflow Integration
- [ ] Transpiled tools are saved to `_workflows/{id}.tool.ts`
- [ ] Tool registry automatically discovers new tool files
- [ ] Tool editor shows which workflow a tool came from
- [ ] Workflow → tool relationship is clear in UI

### End-to-End Flow
- [ ] Create workflow → Generate tool → Assign to agent → Agent calls tool
- [ ] All steps work without manual file editing
- [ ] Tool execution produces expected results
- [ ] Errors are handled gracefully at each step

---

## File Structure Changes

### New Files
```
_tables/tools/
  └── workflow-tools-loader.ts        # Scans and loads workflow tools

app/(pages)/workforce/components/
  └── ToolEditor.tsx                  # Tool assignment UI

app/api/agents/
  └── [agentId]/
      └── tools/
          └── route.ts                # Update agent tool assignments (optional)
```

### Modified Files
```
_tables/tools/index.ts                # Merge built-in + workflow tools
app/(pages)/workforce/components/
  └── AgentModal.tsx                  # Add "Edit tools" button
```

### Generated Files (by transpiler)
```
_workflows/
  ├── yc-2.json                       # Existing
  ├── yc-2.tool.ts                    # New (generated)
  ├── ai-test.json                    # Existing
  └── ai-test.tool.ts                 # New (generated)
```

---

## References

- `_docs/_tasks/2-workflow-schema-and-transpiler.md` — Transpiler planning
- `_docs/_tasks/2-workflow-schema-and-transpiler-example.ts` — Example transpiled output
- `app/(pages)/workforce/components/AgentModal.tsx` — Current tool display
- `_tables/tools/index.ts` — Current tool registry
- `_tables/agents/*.ts` — Agent config structure
- `app/api/workforce/agent/route.ts` — How tools are loaded for agents

---

## Next Steps

1. **Spike workflow tool loader** — Create `workflow-tools-loader.ts` and test with manual tool file
2. **Design tool editor UI** — Mockup the tool editor component
3. **Prototype agent config updates** — Test updating `toolIds` array programmatically
4. **Validate end-to-end** — Create test workflow → tool → agent assignment → tool call
5. **Document decisions** — Finalize open questions based on prototyping results


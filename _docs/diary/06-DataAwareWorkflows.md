# Entry 6 – Toward Data-Aware Workflows  
**Date:** {{DATE:today}}  
**Author:** Engineering Notes

| Tool | Test | Prompt Outline | Expected Result |
| --- | --- | --- | --- |
| `update_node_layer` | Update flow summary only | “Update node 1 flow summary to …” | Tool call with `nodeId: "1"`, `changes.flowSummary` and UI reflects summary change |
|  | Replace code & spec | “Replace node 2 code with … and set spec outputs to …” | Tool intent updates code + outputs array |
| `add_node` | Add standalone node | “Add a node called … with summary …” | New node appears with generated id, default placement |
|  | Add node with connections | “Add node between 1 and 2…” | Node inserted and edges created from `1 -> new -> 2` |
| `delete_node` | Remove leaf node | “Delete node 3” | Node and edges removed |
|  | Remove middle node | “Delete node 2” | Node removed and edges touching it pruned |
| `connect_nodes` | Create new edge | “Connect node 1 to node 2” | Edge added unless duplicate |
|  | Prevent duplicate | Re-run same prompt | Agent should respond that edge already exists / no new edge |
| `reposition_nodes` | Grid layout | “Arrange nodes in a grid layout” | All nodes repositioned to grid |
|  | Explicit positions | “Move node 1 to (0,0) and node 2 to (200,0)” | Nodes positioned exactly |
| `inspect_node` | Inspect existing node | “Inspect node 1 with connections” | Tool output shows node data + edges |
|  | Inspect missing node | “Inspect node X999” | Tool error (handled in UI) |

---

## Executive Summary

The Workflow Generator has matured from a proof-of-concept canvas into a structured authoring environment that can scale to real business automation scenarios. Over the last cycle we focused on **scannability, maintainability, and data fidelity**:

1. **UI refactor for node clarity** – titles, flow summaries, and specs are now editable but concise; long-form editing happens in the sidebar.
2. **Editor architecture cleanup** – node-specific controls live under `components/editor/spec`, and the foundation is in place for an edge-focused editor.
3. **Data binding initiative** – designed the state shape, validation rules, and UX for explicit edge mappings (source → target fields), including visual mocks and documentation.
4. **Assistant-aware tooling** – the Gemini-assisted chat now manipulates the workflow directly with enriched context and new layout tools (see Entry 5).

This entry documents the product areas touched, the problems we solved, assumptions future developers need to know, and how to continue expanding the codebase confidently.

---

## Product Areas & Problems Addressed

### 1. Node Editing Experience
**Problem:** The original experiment exposed full spec editors inline, making each node huge and hard to scan.  
**Solution:**  
- Refactored `CodeNode.tsx` to show a short Flow/Spec/Code summary card while the detailed editing lives in the sidebar (`NodeEditor`).  
- Added inline title editing (with React Flow selection highlighting) and preserved drag/zoom behaviour.  
- Simplified spec summary (`SpecContent.tsx`) so nodes display only key inputs/outputs and an “Edit details” affordance.

### 2. Editor Component Architecture
**Problem:** All editing logic lived in monolithic files, hindering reuse.  
**Solution:**  
- Grouped node-specific controls in `components/editor/spec/` (`SpecFieldRow`, `ProcessStepItem`, `SectionHeader`).  
- Prepared the editor for new data-mapping views by planning a sibling folder (e.g., `editor/data-mapping/`) that will host edge-specific UI.  
- Sidebar (`Sidebar.tsx`) now merely orchestrates tabs; actual rendering is delegated to smaller components (`ConsolePanel`, `StatePanel`, `ContextPanel`, `EditorPanel`).

### 3. Data Binding & Validation (Design Phase)
**Problem:** Edges currently pipe stdout → stdin with no awareness of which fields flow where.  
**Artifacts created:**
- `_docs/UXD/Pages/workflow/io-visualizations/edge-editor-option{1,2,3}.html`: high-fidelity mockups for the edge editor (table, card, split panel). Option 1 (table) will guide implementation.
- `_docs/UXD/Pages/workflow/io-visualizations/workflow-edge-mapping.md`: detailed spec covering slice shape, business-friendly types, validation rules, and execution integration.  
- Acceptance criteria defined for new types (`text`, `number`, `flag`, `list`, `record`, `file`) and compatibility checks.

### 4. AI Tooling (Recap of Entry 5 Linkages)
**Problem:** The AI assistant lacked canvas context and layout capabilities.  
**Solution:** Gemini 2.5 Flash is now fed serialized workflow state; new tools (`reposition_nodes`, `inspect_node`, etc.) make chat-first authoring viable. These changes rely on the clean store boundaries established during this cycle.

---

## Assumptions & Guidance for Future Developers

1. **Business-Friendly Types**  
   - `text`, `number`, `flag` (boolean), `list` (with `itemType`), `record`, `file`.  
   - Lists default to `list of text` unless specified; file types may be expanded later (e.g., `csv`, `pdf`).
   - Edge bindings must ensure source and target types (and list item types) match. Static defaults are allowed for unmatched targets.

2. **State Management**  
   - Continue using the Zustand slice pattern (`createWorkflowSlice`, `createExecutionSlice`, `createWebcontainerSlice`).  
   - The upcoming `ioMappingSlice` will live alongside these slices; build it with pure functions so it’s easy to test and reuse.  
   - `workflowSlice.ts` still seeds the graph (`initialNodes`, `initialEdges`). Update this file when adding richer demos (e.g., three-node scenario for data bindings).

3. **UI Components**  
   - Shadcn is the default UI library. The edge editor table will use `<Table>`, `<Select>`, `<Badge>`, and `<Card>`.  
   - Avoid hand-rolled HTML when a shadcn component exists; consistency keeps styling predictable.  
   - When adding new panels, treat `Sidebar.tsx` as an orchestrator; heavy logic should live in dedicated components under `components/sidebar/` or `components/editor/`.

4. **Execution Strategy**  
   - The current runner still pipes stdout between nodes. After edge bindings ship, we will write wrappers that serialize JSON payloads based on mappings.  
   - Wrapper design is documented in the edge mapping spec: node scripts will read/write `/tmp/io-<edgeId>.json` and transform payloads according to `EdgeMapping.links`.

5. **AI Integration**  
   - Chat tools live in `app/(pages)/workflow-generator/tools/`. Each tool defines intent and result types; updates should route through `applyToolResult.ts`.  
   - Serialized workflow context is produced by `workflowContextService.serializeWorkflowContext`.

---

## Codebase Touchpoints (Quick Reference)

| Area | Files | Notes |
| --- | --- | --- |
| Node summaries & inline editing | `components/CodeNode.tsx`, `components/code-node/SpecContent.tsx` | Compact cards; “Edit” button opens sidebar editor. |
| Sidebar structure | `components/Sidebar.tsx`, `components/sidebar/*.tsx` | Tabs for Console, State, Context, Editor. Editor currently renders `NodeEditor`; will later choose between node/edge modes. |
| Node editor | `components/editor/NodeEditor.tsx`, `components/editor/spec/*` | Rich form for flow summary, spec inputs/outputs, process steps. |
| Store slices | `store/workflowSlice.ts`, `store/executionSlice.ts`, `store/webcontainerSlice.ts` | Add new slice (`ioMappingSlice.ts`) when implementing bindings. |
| AI tooling | `app/api/agent/route.ts`, `components/ChatPanel.tsx`, `services/workflowContextService.ts`, `tools/*.ts` | Gemini agent uses serialized context plus tool intents. |
| Design docs | `_docs/UXD/Pages/workflow/io-visualizations/*`, `_docs/Engineering/workflow-edge-mapping.md` | Keep these updated as UI or data model evolves. |

---

## Testing Summary to Date

We manually exercised:
- **Node editing** – title edits, flow/spec/code toggling, node addition/removal.  
- **Spec summaries** – verifying condensed cards reflect sidebar updates (inputs/outputs/process).  
- **Assistant tooling** – add/update/connect/delete flows, auto layout (horizontal/vertical/grid), node inspection.  
- **Double-click interactions** – nodes open the editor; edges will hook into the new `setActiveEdge` action during binding implementation. No runtime warnings remain (resolved getSnapshot loop).

Formal automated tests are still on the backlog. Once the edge slice lands, we should introduce unit tests for `linkFields`, `unlinkField`, and the JSON wrapper builder.

---

## Next Steps

1. **Implement `ioMappingSlice`** (types, actions, persistence).  
2. **Build edge editor table** using Option 1 mock; integrate with sidebar and React Flow edge selection.  
3. **Expand initial workflow** to a three-node demo (Collect → Format → Summarize) to validate bindings in UI.  
4. **JSON execution wrapper** to honor mappings (phase after UI).  
5. **Automated tests** for slices and mapping interactions.

---

## Closing Thoughts

We now have a clean separation between *presentation* (React Flow nodes, condensed summaries), *sidebar editing* (rich forms in modular components), *state slices* (node/exec/webcontainer, with IO mapping on deck), and *AI tooling* (Gemini + tools). The groundwork for explicit data bindings is complete—docs, mocks, and acceptance criteria are in place.  

The upcoming milestone is to turn those designs into working code so our workflows can enforce type-safe data flow edge to edge. With the architecture stabilized, future contributors should find it straightforward to plug in new node types, hook into the assistant, or evolve the execution engine without tangling the UI.


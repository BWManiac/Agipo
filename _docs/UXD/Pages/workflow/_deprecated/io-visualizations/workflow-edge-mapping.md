# Workflow Edge Mapping – State & Slice Design

## Background & Goals

We currently let users describe each node’s inputs, process, and outputs. When two nodes are linked, however, we implicitly pipe stdout to stdin without any UI that details *which* values are passed downstream. The new edge editor aims to:

1. Let users declare explicit bindings from upstream outputs to downstream inputs.
2. Surface those bindings in the sidebar editor when an edge is selected.
3. Feed the execution service so runtime data flow mirrors the UI.
4. Validate that the bound fields are type compatible (or explicitly allowed) to prevent accidental mismatches.

## Core Concepts

- **Edge Mapping** – A collection of links for a specific `Edge` (React Flow edge) describing connections between output fields and input fields, plus optional transforms or static values.
- **Edge Editor** – Sidebar panel presented when an edge is active. It displays upstream outputs, downstream inputs, and the current binding state.
- **Transforms** (future) – Optional rewrite instructions for inline transformations (e.g., rename fields, cast types, merge values).

## Slice Shape (Pseudocode)

```ts
type BusinessFriendlyType =
  | "text"      // raw string
  | "number"    // any numeric value
  | "flag"      // boolean
  | "list"      // ordered collection (list items share a type)
  | "record"    // object / structured data
  | "file";     // binary payloads

type EdgeFieldRef = {
  nodeId: string;      // e.g. "1"
  fieldName: string;   // e.g. "cleanMessage"
  type: BusinessFriendlyType;
  itemType?: BusinessFriendlyType; // used when type === "list"
};

type EdgeLink = {
  from?: EdgeFieldRef;   // upstream reference (optional when using static value)
  to: EdgeFieldRef;      // downstream reference
  staticValue?: string;  // plain-text value if no upstream binding
};

type EdgeMapping = {
  edgeId: string;        // React Flow edge id ("e1-2")
  links: EdgeLink[];     // one or more field-level bindings
  notes?: string;        // optional free-form comment
};

type EdgeIoSliceState = {
  mappings: Record<string, EdgeMapping>;
  activeEdgeId: string | null; // selected edge in editor
};

type MatchResult =
  | { status: "ok" }
  | {
      status: "warning";
      reason:
        | "type-mismatch"
        | "list-item-mismatch"
        | "missing-upstream"
        | "missing-downstream";
};

type EdgeIoSliceActions = {
  setActiveEdge(edgeId: string | null): void;
  linkFields(edgeId: string, from: EdgeFieldRef, to: EdgeFieldRef): MatchResult;
  unlinkField(edgeId: string, to: EdgeFieldRef): void;
  setStaticValue(edgeId: string, to: EdgeFieldRef, value: string): void;
  removeEdgeMapping(edgeId: string): void; // called when edge deleted
};
```

### Notes
- Slice should live alongside existing workflow/execution slices (`store/ioMappingSlice.ts`).
- `setActiveEdge` updates sidebar tab to the IO editor.
- `linkFields` returns a `MatchResult` so the UI can show friendly feedback (“clean message is text, but style preset expects number”).
- Supported types are limited to business-friendly nouns (text, number, flag, list, record, file). They map to runtime primitives but keep the UI approachable.
- Lists include an `itemType` to ensure per-element compatibility (e.g., list of text). If `itemType` is omitted, treat it as “list of any”.
- Static values are allowed when no upstream field exists (hard-coded defaults).

## UI Trigger Flow

```plaintext
Canvas edge click → setActiveEdge(edgeId) → sidebar tab = "Editor" (edge mode)
Edge editor reads:
  upstreamOutputs = workflowSlice.nodes[sourceId].spec.outputs
  downstreamInputs = workflowSlice.nodes[targetId].spec.inputs
  existing links = ioSlice.mappings[edgeId]

Interactions:
  - Selecting an upstream/downstream pair calls linkFields
  - Removing a binding calls unlinkField
  - Adding static value calls setStaticValue
```

## Execution Integration Hooks (High-Level)

1. `workflowExecutionService.runWorkflow` fetches `ioSlice.mappings`.
2. When constructing shell command/wrapper script, inject a JSON payload between nodes:

```plaintext
node /tmp/node-1.js | node /tmp/node-2.js
```

becomes something akin to:

```plaintext
node run-node.js --id=node-1 --out=/tmp/io-e1-2.json
node run-node.js --id=node-2 --in=/tmp/io-e1-2.json
```

3. Wrapper script reads/writes JSON according to links:
   - Build an object with keys matching downstream input names.
   - If a field uses `staticValue`, merge it.
   - If business-friendly types mismatch, log a warning and attempt safe casting when possible.

Implementation of the wrapper executable is future work; documenting this now keeps the UI and execution designs aligned.

## Next Steps

1. Build the edge editor mock (see `io-visualizations/edge-editor.html`).
2. Implement `ioMappingSlice` with actions listed above.
3. Update sidebar editor to switch between node and edge modes.
4. Wire React Flow edge selection to `setActiveEdge`.
5. Extend execution service once UI/state are stable.
```


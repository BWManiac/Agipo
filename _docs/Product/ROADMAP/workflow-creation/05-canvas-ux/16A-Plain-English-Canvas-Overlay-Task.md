# Task: Plain English Canvas — Overlay Mode

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/05-canvas-ux/16-Plain-English-Canvas-Overlay.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Overview

### Goal

Add an overlay system to the technical workflow canvas that shows plain English descriptions via hover tooltips, toggleable persistent labels, and user annotations—all without leaving the canvas view.

### Relevant Research

The canvas uses XYFlow (React Flow) for node rendering. Overlays can be implemented via:
1. Custom node wrappers with tooltip portals
2. Separate overlay layer synced to canvas transform
3. XYFlow's built-in node labels feature

Key integration: Reuse `description-generator.ts` from Simple View (doc 15).

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/types/workflow.ts` | Modify | Add plainEnglish field | A |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/store/slices/overlay-slice.ts` | Create | Overlay state | A |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/NodeTooltip.tsx` | Create | Hover tooltip | A |
| `app/(pages)/workflows/editor/components/NodeLabels.tsx` | Create | Persistent labels | A |
| `app/(pages)/workflows/editor/components/OverlayToggle.tsx` | Create | Toolbar toggle | A |
| `app/(pages)/workflows/editor/components/AnnotationBubble.tsx` | Create | Annotation display | B |
| `app/(pages)/workflows/editor/components/AnnotationEditor.tsx` | Create | Add/edit annotation | B |

### Frontend / Hooks

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/hooks/useNodeDescription.ts` | Create | Get description | A |
| `app/(pages)/workflows/editor/hooks/useOverlayPosition.ts` | Create | Position sync | A |

---

## Part A: Core Overlay System

### Goal

Build the tooltip, persistent labels, and toggle functionality.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/store/slices/overlay-slice.ts` | Create | State | ~50 |
| `app/(pages)/workflows/editor/hooks/useNodeDescription.ts` | Create | Hook | ~60 |
| `app/(pages)/workflows/editor/hooks/useOverlayPosition.ts` | Create | Hook | ~80 |
| `app/(pages)/workflows/editor/components/NodeTooltip.tsx` | Create | Tooltip | ~150 |
| `app/(pages)/workflows/editor/components/NodeLabels.tsx` | Create | Labels | ~120 |
| `app/(pages)/workflows/editor/components/OverlayToggle.tsx` | Create | Toggle | ~50 |

### Pseudocode

#### `app/(pages)/workflows/editor/store/slices/overlay-slice.ts`

```typescript
interface OverlayState {
  showLabels: boolean;
  hoveredNodeId: string | null;
  annotationMode: boolean;
  labelsMinZoom: number;      // Hide labels below this zoom
}

actions:
  toggleLabels()
  └── Toggle showLabels

  setHoveredNode(nodeId: string | null)
  └── Set hoveredNodeId

  toggleAnnotationMode()
  └── Toggle annotationMode

  setLabelsMinZoom(zoom: number)
  └── Set minimum zoom for labels
```

#### `app/(pages)/workflows/editor/hooks/useNodeDescription.ts`

```
function useNodeDescription(node: Node): NodeDescription
├── Import descriptionGenerator from lib
├── Get step data from node
├── Check for user-defined plainEnglish
│   ├── If exists, use user values
│   └── If not, generate from step data
├── Return
│   ├── name: plainEnglish.name or generated
│   ├── description: plainEnglish.description or generated
│   ├── inputs: summarized inputs
│   └── outputs: summarized outputs

interface NodeDescription {
  name: string;
  description: string;
  inputs: { name: string; source: string }[];
  outputs: { name: string; type: string }[];
}
```

#### `app/(pages)/workflows/editor/hooks/useOverlayPosition.ts`

```
function useOverlayPosition(
  nodeId: string,
  position: 'above' | 'below' | 'side'
): { x: number; y: number; visible: boolean }
├── Get canvas transform from React Flow
│   └── { x, y, zoom } = useViewport()
├── Get node position from React Flow
│   └── node = useNode(nodeId)
├── Calculate screen position
│   ├── screenX = (node.x * zoom) + transform.x
│   ├── screenY = (node.y * zoom) + transform.y
│   └── Adjust based on position parameter
├── Determine visibility
│   ├── Is node in viewport?
│   └── Is zoom above minimum?
└── Return { x, y, visible }
```

#### `app/(pages)/workflows/editor/components/NodeTooltip.tsx`

```
NodeTooltip({ nodeId })
├── Get description with useNodeDescription
├── Get position with useOverlayPosition
├── If not hovered or not visible
│   └── Return null
├── Portal to body (avoid canvas clipping)
├── Render tooltip
│   ├── Container (positioned absolutely)
│   ├── Arrow (pointing to node)
│   ├── Header
│   │   └── Plain English name (bold)
│   ├── Description
│   │   └── What this step does
│   ├── Inputs section
│   │   ├── "Needs:"
│   │   └── List with sources
│   └── Outputs section
│       ├── "Produces:"
│       └── List with types
├── Styling
│   ├── White background, shadow
│   ├── Max width 300px
│   └── z-index above canvas
└── Animation
    └── Fade in on appear
```

#### `app/(pages)/workflows/editor/components/NodeLabels.tsx`

```
NodeLabels({ nodes, zoom })
├── Get overlay state (showLabels, labelsMinZoom)
├── If !showLabels or zoom < labelsMinZoom
│   └── Return null
├── For each node
│   ├── Get description
│   ├── Get position (above node)
│   ├── Render label
│   │   ├── Name label (above)
│   │   │   ├── Position: above node center
│   │   │   ├── Text: plain English name
│   │   │   └── Style: small, semi-transparent bg
│   │   └── Description label (below, optional)
│   │       ├── Position: below node
│   │       ├── Text: brief description
│   │       └── Style: smaller, gray
│   └── Handle click (select node)
├── Batch render for performance
│   └── Single SVG overlay layer
└── Scale labels with zoom
    └── Font size decreases at lower zoom
```

#### `app/(pages)/workflows/editor/components/OverlayToggle.tsx`

```
OverlayToggle()
├── Get overlay state
├── Render toggle button group
│   ├── Labels toggle
│   │   ├── Icon: tag/label
│   │   ├── Tooltip: "Show plain English labels"
│   │   └── Active state when showLabels
│   └── Annotation mode toggle
│       ├── Icon: comment/note
│       ├── Tooltip: "Add annotations"
│       └── Active state when annotationMode
├── On labels click
│   └── Dispatch toggleLabels
└── On annotation click
    └── Dispatch toggleAnnotationMode
```

### Integration with Canvas

```tsx
// In main canvas component
function WorkflowCanvas({ workflow }) {
  const { hoveredNodeId, showLabels } = useOverlayState();

  return (
    <ReactFlow nodes={nodes} edges={edges}>
      {/* Existing canvas content */}

      {/* Overlay layer */}
      {hoveredNodeId && <NodeTooltip nodeId={hoveredNodeId} />}
      {showLabels && <NodeLabels nodes={nodes} />}

      {/* Toolbar */}
      <Panel position="top-right">
        <OverlayToggle />
      </Panel>
    </ReactFlow>
  );
}

// Node wrapper to track hover
function NodeWrapper({ node, children }) {
  const setHovered = useSetHoveredNode();

  return (
    <div
      onMouseEnter={() => setHovered(node.id)}
      onMouseLeave={() => setHovered(null)}
    >
      {children}
    </div>
  );
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Tooltip appears on hover | Hover node, verify tooltip |
| AC-A.2 | Tooltip shows description | Verify plain English content |
| AC-A.3 | Tooltip follows canvas | Pan canvas, verify tooltip moves |
| AC-A.4 | Labels toggle works | Click toggle, verify labels appear |
| AC-A.5 | Labels position correctly | Verify labels above each node |
| AC-A.6 | Labels hide at low zoom | Zoom out, verify labels hide |
| AC-A.7 | Tooltips don't block clicks | Click through tooltip area, verify node selects |

---

## Part B: Annotations

### Goal

Add user annotations to nodes that persist with the workflow.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/components/AnnotationBubble.tsx` | Create | Display | ~100 |
| `app/(pages)/workflows/editor/components/AnnotationEditor.tsx` | Create | Edit | ~120 |
| `app/api/workflows/types/workflow.ts` | Modify | Add annotation type | ~20 |

### Pseudocode

#### `app/(pages)/workflows/editor/components/AnnotationBubble.tsx`

```
AnnotationBubble({ annotation, nodeId, onEdit, onDelete })
├── Get position relative to node
├── Render bubble
│   ├── Container
│   │   ├── Border radius, shadow
│   │   └── Small pointer to node
│   ├── Text content
│   │   └── annotation.text
│   ├── Footer
│   │   ├── Author avatar (small)
│   │   └── Timestamp
│   └── Actions (on hover)
│       ├── Edit button
│       └── Delete button
├── On edit click
│   └── Call onEdit
└── On delete click
    └── Confirm and call onDelete
```

#### `app/(pages)/workflows/editor/components/AnnotationEditor.tsx`

```
AnnotationEditor({ nodeId, existing?, onSave, onCancel })
├── State: text
├── Position near node
├── Render editor
│   ├── Textarea
│   │   ├── Placeholder: "Add a note..."
│   │   ├── Auto-focus
│   │   └── Max length indicator
│   └── Actions
│       ├── "Save" button
│       └── "Cancel" button
├── On save
│   ├── Validate text not empty
│   ├── Create/update annotation
│   └── Call onSave
└── On cancel
    └── Call onCancel
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Can add annotation | Enter annotation mode, click node, type, save |
| AC-B.2 | Annotation displays | Save annotation, verify bubble appears |
| AC-B.3 | Annotation persists | Reload workflow, verify annotation still there |
| AC-B.4 | Can edit annotation | Click edit, modify, save |
| AC-B.5 | Can delete annotation | Click delete, confirm, verify removed |

---

## User Flows

### Flow 1: Hover for Info

```
1. User working on canvas
2. User hovers over unfamiliar node
3. Tooltip appears with plain English explanation
4. User understands what step does
5. User moves mouse, tooltip disappears
```

### Flow 2: Enable Labels

```
1. User wants overview of all steps
2. User clicks labels toggle in toolbar
3. All nodes show plain English labels
4. User scans workflow quickly
5. User toggles off when done
```

---

## Out of Scope

- Voice annotations
- Annotation replies/threads
- Rich text in annotations
- Annotation history

---

## Open Questions

- [ ] Should annotations sync in real-time?
- [ ] Annotation permission model?
- [ ] Max annotation length?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |

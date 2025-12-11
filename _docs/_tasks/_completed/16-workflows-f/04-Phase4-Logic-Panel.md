# Phase 4: Logic Panel + Drag-and-Drop System

**Status:** ⚠️ Partially Complete  
**Date Started:** December 7, 2025  
**Date Completed:** December 7, 2025 (core functionality)  
**Depends On:** Phase 3 (Tools Panel + Sequential Steps)

---

## Completion Summary

### ✅ Completed
- Drag-and-drop infrastructure (`@dnd-kit` integration)
- `DndProvider` with sensors, drag start/end handling
- Tools Panel retrofit (drag instead of click)
- Logic Panel with all 6 control flow types
- `DraggablePaletteItem` for both Tools and Logic palettes
- `DropZone` for rail insertion points
- `SortableStep` for reordering
- `DragOverlayContent` for visual preview
- Store updates (`addStepAtIndex`, `reorderSteps`)

### ❌ Deferred to Phase 5
- **Specialized control flow rendering** (all render as generic cards)
- Container components (RailLoop, RailForEach)
- Router components (RailBranchRouter, RailParallelFork)
- Merge/Join components (RailBranchMerge, RailParallelJoin)
- Nested drop zones (drag INTO containers)
- Branch/Parallel lane-specific drops
- Data model updates for `childStepIds`, `branchConditionIndex`

**See:** `05-Phase5-Control-Flow-Visualization.md`

---

## Goal

Build the **Logic Panel** and implement **drag-and-drop** throughout the workflow editor:
1. **Drag tools** from Tools Panel to Rail View (retrofit Phase 3)
2. **Drag control flow** from Logic Panel to Rail View
3. **Drag steps** within Rail View to reorder
4. **Drag steps into containers** (Loop, Branch, Parallel, ForEach)
5. Configure control flow conditions and settings

**Focus:** Everything is drag-and-drop. No more "click to add." Users drag from palettes to build workflows.

**End state:** Users drag tools and control flow from panels to build workflows, reorder steps by dragging, and populate containers by dragging steps into them.

---

## Critical Change: Phase 3 Retrofit

**Phase 3 currently uses click-to-add.** Phase 4 retrofits this to drag-to-add:

| Before (Phase 3) | After (Phase 4) |
|------------------|-----------------|
| Click tool → step appears at end | Drag tool → drop where you want it |
| Click adds to end of workflow | Drop position determines placement |
| No reordering | Drag to reorder steps |

This is a **better UX** because:
- Users control exactly where steps go
- Same interaction model for tools AND control flow
- Reordering is natural (just drag)
- Consistent with industry standards (Figma, Notion, etc.)

---

## @dnd-kit Research Summary

### Packages Required

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Core Primitives

| Primitive | Package | Purpose |
|-----------|---------|---------|
| `DndContext` | core | Provider that wraps the entire drag-and-drop area |
| `useDraggable` | core | Makes an element draggable |
| `useDroppable` | core | Creates a drop zone |
| `DragOverlay` | core | Shows visual preview during drag |
| `SortableContext` | sortable | Wraps a list of sortable items |
| `useSortable` | sortable | Combines draggable + droppable for list items |
| `arrayMove` | sortable | Utility to reorder arrays |

### Sensors (Input Methods)

```typescript
import { 
  PointerSensor, 
  KeyboardSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }, // Prevent accidental drags
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

### Collision Detection

```typescript
import { closestCenter, rectIntersection } from '@dnd-kit/core';

// closestCenter - Good for sortable lists
// rectIntersection - Good for drop zones (containers)
```

---

## Two Drag Patterns

### Pattern 1: Palette Drag (Copy Mode)

**Use case:** Dragging from Tools Panel or Logic Panel to Rail View

```
Tools/Logic Panel              Rail View
┌─────────────────┐           ┌─────────────────────┐
│ [Slack Tool]    │  DRAG →   │                     │
│  useDraggable   │  (copy)   │  useDroppable       │
│  id="tool-slack"│           │  id="rail-drop-0"   │
└─────────────────┘           └─────────────────────┘
```

**Behavior:**
- Original stays in palette (it's a template)
- On drop: Create NEW step from the dragged template
- `active.data.current` contains the tool/control-flow definition

**Code pattern:**
```typescript
// In palette
const { attributes, listeners, setNodeRef } = useDraggable({
  id: `palette-${tool.id}`,
  data: { type: 'palette-item', tool, isNew: true }
});

// On drag end
if (active.data.current?.isNew) {
  // Create new step from template
  const newStep = createStepFromTool(active.data.current.tool);
  store.addStepAtIndex(newStep, dropIndex);
}
```

### Pattern 2: Workflow Drag (Move Mode)

**Use case:** Reordering steps in Rail View, moving steps into/out of containers

```
Rail View (before)             Rail View (after)
┌─────────────────┐           ┌─────────────────┐
│ [Step A]        │           │ [Step B]        │
│ [Step B] ←DRAG  │    →      │ [Step A]        │
│ [Step C]        │           │ [Step C]        │
└─────────────────┘           └─────────────────┘
```

**Behavior:**
- Step moves from source to destination
- If moving into container: Update parentId
- If moving out of container: Clear parentId

**Code pattern:**
```typescript
// Each step in rail
const { attributes, listeners, setNodeRef, transform } = useSortable({
  id: step.id,
  data: { type: 'workflow-step', step, parentId: step.parentId }
});

// On drag end
if (!active.data.current?.isNew) {
  // Move existing step
  store.moveStep(active.id, over.id, over.data.current?.containerId);
}
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  DndContext                                                         │
│  ├── sensors: [PointerSensor, KeyboardSensor]                       │
│  ├── collisionDetection: closestCenter                              │
│  ├── onDragStart → set activeId, show DragOverlay                   │
│  ├── onDragOver → highlight drop zone                               │
│  └── onDragEnd → update store                                       │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────────────────────────────┐  │
│  │ Sidebar         │  │ RailView                                 │  │
│  │                 │  │                                          │  │
│  │ ┌─────────────┐ │  │ SortableContext (main rail steps)       │  │
│  │ │ToolPalette  │ │  │ ├── DropZone (position 0)               │  │
│  │ │ useDraggable│─┼──┼─▶├── SortableStep (step A)              │  │
│  │ │ per tool    │ │  │ ├── DropZone (position 1)               │  │
│  │ └─────────────┘ │  │ ├── RailContainer (Loop)                │  │
│  │                 │  │ │   └── useDroppable                    │  │
│  │ ┌─────────────┐ │  │ │       └── SortableContext (children)  │  │
│  │ │LogicPalette │ │  │ │           ├── SortableStep (B)        │  │
│  │ │ useDraggable│─┼──┼─▶│           └── SortableStep (C)        │  │
│  │ │ per control │ │  │ ├── DropZone (position 2)               │  │
│  │ └─────────────┘ │  │ └── ...                                  │  │
│  └─────────────────┘  └─────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ DragOverlay                                                  │   │
│  │ └── Renders preview of dragged item                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Interaction Model

### Drag Sources

| Source | Drag Mode | Data |
|--------|-----------|------|
| Tool in Tools Panel | Copy | `{ type: 'tool', tool: Tool, isNew: true }` |
| Control Flow in Logic Panel | Copy | `{ type: 'control', controlType: string, isNew: true }` |
| Step in Rail (main) | Move | `{ type: 'step', stepId: string, parentId: null }` |
| Step in Container | Move | `{ type: 'step', stepId: string, parentId: string }` |

### Drop Targets

| Target | Accept | On Drop |
|--------|--------|---------|
| Rail drop zone (between steps) | Tools, Control, Steps | Insert at position |
| Container drop zone (Loop, ForEach) | Steps only | Add to container's children |
| Branch condition drop zone | Steps only | Add to condition's children |
| Parallel branch drop zone | Steps only | Add to branch's children |

### Visual Feedback

| State | Visual |
|-------|--------|
| Dragging | DragOverlay shows item preview, cursor changes |
| Over valid target | Drop zone highlights (blue border/bg) |
| Over invalid target | No highlight, cursor shows "not-allowed" |
| Dropped | Animation to final position |

---

## Prerequisites

Phase 4 requires Phase 3 to be complete:
- ✅ Tools Panel functional (will be retrofitted to drag)
- ✅ Steps can be added sequentially
- ✅ Rail View displays steps
- ✅ Store has addStep and setSelectedStepId

---

## Control Flow Primitives

| Primitive | Logic Panel Item | Visual in Rail View | Interaction |
|-----------|------------------|---------------------|-------------|
| `.branch()` | **Branch** | Router node with condition drop zones | Add → drag steps to each condition |
| `.parallel()` | **Parallel** | Fork/Join with branch drop zones | Add → drag steps to each branch |
| `.dountil()` / `.dowhile()` | **Loop** | Container with single drop zone | Add → drag steps inside |
| `.foreach()` | **ForEach** | Container with single drop zone + array indicator | Add → drag steps inside |
| `.sleep()` | **Wait** | Simple step on rail | Add → configure duration |
| `.waitForEvent()` | **Wait for Event** | Simple step on rail | Add → configure event name |
| `suspend()` | **Suspend** | Simple step on rail | Add → configure payload |

---

## Rail View: Drag-and-Drop Behavior

### Drag Sources
- Any step card can be dragged
- Steps inside containers can be dragged out
- Steps on main rail can be dragged into containers

### Drop Targets
- **Main Rail**: Drop between steps (reorder)
- **Loop/ForEach containers**: Single drop zone inside
- **Branch conditions**: Drop zone per condition path
- **Parallel branches**: Drop zone per parallel branch

### Visual Feedback During Drag
- Drop zones highlight on hover
- Preview line shows insertion point
- Invalid drops show "not allowed" indicator

---

## Planned File Impact Analysis

### Part 0: UXD Mockups ✅ Complete

| File | Action | Purpose | Lines | Status |
|------|--------|---------|-------|--------|
| `UXD/phase-4/logic-panel.html` | **Created** | Logic Panel with all 7 control flow options, grouped by category | 185 | ✅ |
| `UXD/phase-4/branch-config.html` | **Created** | Branch configuration: conditions list, labels, expressions, targets | 175 | ✅ |
| `UXD/phase-4/parallel-config.html` | **Created** | Parallel configuration: branches list, wait-for-all, fail-fast options | 140 | ✅ |
| `UXD/phase-4/loop-config.html` | **Created** | Loop configuration: type toggle (until/while), condition, max iterations | 140 | ✅ |
| `UXD/phase-4/foreach-config.html` | **Created** | ForEach configuration: array source, item variable, concurrency slider | 150 | ✅ |

**Design Decisions from UXD:**
- **Grouped by category**: Routing, Iteration, Timing & Events, Human-in-the-Loop
- **Color-coded**: Each primitive type has distinct color (purple=routing, cyan=parallel, green=loops, pink=foreach, yellow=timing, red=human)
- **Visual previews**: Each modal shows a mini diagram of what will be created
- **JS expressions**: Conditions use JavaScript syntax with syntax highlighting
- **Smart defaults**: Concurrency slider, max iterations, variable names all have sensible defaults

---

### Part A: Drag-and-Drop Foundation

| File | Action | Purpose | Lines (Est.) | Status |
|------|--------|---------|--------------|--------|
| `app/(pages)/workflows-f/editor/providers/DndProvider.tsx` | **Create** | DndContext with sensors, collision, handlers | ~120 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/components/dnd/DragOverlayContent.tsx` | **Create** | Renders preview during drag | ~80 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/components/dnd/DropZone.tsx` | **Create** | Visual drop zone between steps | ~60 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/components/dnd/SortableStep.tsx` | **Create** | Wrapper for draggable/sortable steps | ~80 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/components/dnd/DraggablePaletteItem.tsx` | **Create** | Wrapper for palette items (copy mode) | ~60 | ⏳ Pending |

**DndProvider.tsx Pseudocode:**
```typescript
import { 
  DndContext, 
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

export function DndProvider({ children }) {
  const [activeId, setActiveId] = useState(null);
  const [activeData, setActiveData] = useState(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setActiveData(event.active.data.current);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    if (active.data.current?.isNew) {
      // Palette drag - create new step
      store.addStepFromPalette(active.data.current, over.id);
    } else {
      // Workflow drag - move existing step
      store.moveStep(active.id, over.id, over.data.current?.containerId);
    }
    
    setActiveId(null);
    setActiveData(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>
        {activeId && <DragOverlayContent data={activeData} />}
      </DragOverlay>
    </DndContext>
  );
}
```

---

### Part B: Tools Panel Retrofit (Drag-to-Add)

| File | Action | Purpose | Lines (Est.) | Status |
|------|--------|---------|--------------|--------|
| `app/(pages)/workflows-f/editor/components/panels/tools/ToolPalette.tsx` | **Modify** | Remove click handler, keep structure | -20 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/components/panels/tools/ToolPaletteItem.tsx` | **Modify** | Add useDraggable wrapper | +30 | ⏳ Pending |

**ToolPaletteItem.tsx Changes:**
```typescript
import { useDraggable } from '@dnd-kit/core';

export function ToolPaletteItem({ tool, integration }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-tool-${tool.id}`,
    data: {
      type: 'tool',
      isNew: true,
      tool,
      integration,
    }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* existing tool item UI */}
    </div>
  );
}
```

---

### Part C: Logic Palette Components

| File | Action | Purpose | Lines (Est.) | Status |
|------|--------|---------|--------------|--------|
| `app/(pages)/workflows-f/editor/components/panels/logic/LogicPalette.tsx` | **Create** | Main Logic Panel with control flow options | ~150 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/components/panels/logic/LogicPaletteItem.tsx` | **Create** | Draggable control flow item | ~80 | ⏳ Pending |

**LogicPalette.tsx Pseudocode:**
```
LogicPalette component
├── Define controlFlowItems (grouped by category):
│   ├── Routing: Branch, Parallel
│   ├── Iteration: Loop, ForEach
│   ├── Timing: Wait, Wait for Event
│   └── Human: Suspend
└── Render:
    ├── Section headers (Routing, Iteration, etc.)
    ├── LogicPaletteItem for each (draggable)
    └── Tip: "Drag to workflow, then drag steps inside"
```

**LogicPaletteItem.tsx Pseudocode:**
```typescript
import { useDraggable } from '@dnd-kit/core';

export function LogicPaletteItem({ controlType, name, description, icon, color }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-control-${controlType}`,
    data: {
      type: 'control',
      isNew: true,
      controlType,
      name,
    }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className={`w-9 h-9 bg-${color}/10`}>{icon}</div>
      <div>{name}</div>
      <div>{description}</div>
    </div>
  );
}
```

---

### Part D: Control Flow Configuration Modals

| File | Action | Purpose | Lines (Est.) | Status |
|------|--------|---------|--------------|--------|
| `app/(pages)/workflows-f/editor/components/modals/BranchConfigModal.tsx` | **Create** | Configure branch conditions and drop zones | ~220 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/components/modals/ParallelConfigModal.tsx` | **Create** | Configure parallel branches | ~150 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/components/modals/LoopConfigModal.tsx` | **Create** | Configure loop condition and max | ~150 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/components/modals/ForEachConfigModal.tsx` | **Create** | Configure forEach source and concurrency | ~150 | ⏳ Pending |

**BranchConfigModal.tsx Pseudocode:**
```
BranchConfigModal component
├── Props: isOpen, onClose, onSave, existingConfig?
├── State:
│   ├── conditions: { id, label, expression }[]
│   └── hasElse: boolean
├── handleAddCondition():
│   └── Add new condition with default label
├── handleRemoveCondition(id):
│   └── Remove condition (min 2 required)
├── handleSave():
│   ├── Validate: at least 2 paths (conditions or else)
│   ├── Create branch step with empty drop zones per condition
│   └── onSave(branchConfig)
└── Render:
    ├── Conditions list (editable)
    │   ├── Label input
    │   ├── Expression input (JS)
    │   └── Remove button
    ├── Else toggle
    ├── Add condition button
    └── Save/Cancel
```

---

### Part E: Rail View Extensions for Control Flow

| File | Action | Purpose | Lines (Est.) | Status |
|------|--------|---------|--------------|--------|
| `app/(pages)/workflows-f/editor/components/RailView.tsx` | **Modify** | Add SortableContext, render control flow steps | +100 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/components/rail/RailStep.tsx` | **Modify** | Wrap with useSortable | +30 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/components/rail/RailBranch.tsx` | **Create** | Branch router with condition drop zones | ~180 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/components/rail/RailParallel.tsx` | **Create** | Parallel fork/join with branch drop zones | ~200 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/components/rail/RailContainer.tsx` | **Create** | Loop/ForEach container with nested SortableContext | ~180 | ⏳ Pending |

**RailContainer.tsx Pseudocode:**
```
RailContainer component (for Loop and ForEach)
├── Props: step, isSelected, onClick, onDropStep
├── State: isDropTarget (from DnD)
├── Render:
│   ├── Container header:
│   │   ├── Icon + type label (LOOP UNTIL / FOR EACH)
│   │   ├── Config preview (condition or array source)
│   │   └── Edit button
│   ├── Drop zone:
│   │   ├── If empty: "Drag steps here" placeholder
│   │   ├── If has children: Render child steps
│   │   └── Highlight when dragging over
│   ├── Container footer:
│   │   └── For loops: loop-back arrow
│   └── Dashed border styling
```

**RailBranch.tsx Pseudocode:**
```
RailBranch component
├── Props: step, isSelected, onClick, onDropStep
├── Render:
│   ├── Router header:
│   │   ├── Branch icon
│   │   ├── "BRANCH" label
│   │   └── Edit conditions button
│   ├── Conditions section:
│   │   ├── For each condition:
│   │   │   ├── Condition label + expression preview
│   │   │   ├── Drop zone for this condition's steps
│   │   │   └── Child steps if any
│   │   └── Else section (if configured)
│   └── Join point at bottom
```

---

### Part F: Store Extensions

| File | Action | Purpose | Lines (Est.) | Status |
|------|--------|---------|--------------|--------|
| `app/(pages)/workflows-f/editor/store/slices/stepsSlice.ts` | **Modify** | Add control flow step management | +120 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/store/slices/uiSlice.ts` | **Modify** | Add modal state, drag state | +40 | ⏳ Pending |

**New stepsSlice Actions:**
```
// Add empty control flow container
stepsSlice.addControlFlow(type: ControlFlowType, config?: Partial<ControlFlowConfig>)
├── Create step with type and empty childStepIds
├── If type is branch/parallel: create empty condition arrays
├── Add to steps array
└── Select the new step

// Move step into a container
stepsSlice.moveStepToContainer(stepId: string, containerId: string, conditionId?: string)
├── Remove step from current location (main rail or other container)
├── Add stepId to container's childStepIds (or condition's stepIds)
└── Update step's parentId

// Move step out of container
stepsSlice.moveStepToRail(stepId: string, insertIndex: number)
├── Remove step from container's childStepIds
├── Insert into main rail at index
└── Clear step's parentId

// Reorder steps (within rail or within container)
stepsSlice.reorderSteps(stepIds: string[], parentId?: string)
├── If parentId: reorder within that container
├── If no parentId: reorder main rail
└── Update positions

// Update control flow configuration
stepsSlice.updateControlFlowConfig(stepId: string, config: ControlFlowConfig)
└── Update step's controlConfig
```

---

### Part G: Type Extensions

| File | Action | Purpose | Lines (Est.) | Status |
|------|--------|---------|--------------|--------|
| `app/api/workflows-f/types/control-flow.ts` | **Create** | Control flow type definitions | ~120 | ⏳ Pending |
| `app/api/workflows-f/types/workflow-step.ts` | **Modify** | Add parentId and childStepIds fields | +20 | ⏳ Pending |

**control-flow.ts:**
```typescript
import { z } from "zod";

// Control flow step types
export const ControlFlowTypeSchema = z.enum([
  "branch",
  "parallel", 
  "loop",
  "foreach",
  "wait",
  "wait_for_event",
  "suspend"
]);

export type ControlFlowType = z.infer<typeof ControlFlowTypeSchema>;

// Branch condition
export const BranchConditionSchema = z.object({
  id: z.string(),
  label: z.string(),
  expression: z.string(),
  childStepIds: z.array(z.string()).default([]), // steps in this branch
});

// Branch config
export const BranchConfigSchema = z.object({
  conditions: z.array(BranchConditionSchema),
  elseChildStepIds: z.array(z.string()).default([]),
});

// Parallel config  
export const ParallelConfigSchema = z.object({
  branches: z.array(z.object({
    id: z.string(),
    label: z.string(),
    childStepIds: z.array(z.string()).default([]),
  })),
  waitForAll: z.boolean().default(true),
  failFast: z.boolean().default(false),
});

// Loop config
export const LoopConfigSchema = z.object({
  type: z.enum(["until", "while"]),
  condition: z.string(),
  maxIterations: z.number().optional(),
});

// ForEach config
export const ForEachConfigSchema = z.object({
  arraySource: z.string(),
  itemVariable: z.string().default("item"),
  concurrency: z.number().default(1),
  continueOnError: z.boolean().default(false),
});

// Wait config
export const WaitConfigSchema = z.object({
  type: z.enum(["duration", "until"]),
  duration: z.number().optional(), // seconds
  untilTime: z.string().optional(), // ISO date
});

// Union of all control flow configs
export const ControlFlowConfigSchema = z.union([
  BranchConfigSchema,
  ParallelConfigSchema,
  LoopConfigSchema,
  ForEachConfigSchema,
  WaitConfigSchema,
  z.object({}), // for suspend/wait_for_event with no config
]);

export type ControlFlowConfig = z.infer<typeof ControlFlowConfigSchema>;
```

**workflow-step.ts additions:**
```typescript
// Add to WorkflowStepValidator:
parentId: z.string().optional(), // ID of containing control flow step
childStepIds: z.array(z.string()).optional(), // For containers: IDs of contained steps
controlType: ControlFlowTypeSchema.optional(), // If type === "control"
controlConfig: ControlFlowConfigSchema.optional(), // Control flow configuration
```

---

### Part H: Editor Integration

| File | Action | Purpose | Lines (Est.) | Status |
|------|--------|---------|--------------|--------|
| `app/(pages)/workflows-f/editor/components/EditorInspector.tsx` | **Modify** | Integrate LogicPalette in Logic tab | +10 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/page.tsx` | **Modify** | Add DnD provider wrapper | +20 | ⏳ Pending |

---

## Total Phase 4

**Files Created:** ~16  
**Files Modified:** ~8  
**Total Lines:** ~2,500 lines

**New Dependencies:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

| Package | Size | Purpose |
|---------|------|---------|
| `@dnd-kit/core` | ~15kb | DndContext, useDraggable, useDroppable, DragOverlay |
| `@dnd-kit/sortable` | ~8kb | SortableContext, useSortable, arrayMove |
| `@dnd-kit/utilities` | ~2kb | CSS transform helpers |

---

## Acceptance Criteria

### Tools Panel Retrofit (4 criteria)

| # | Criterion | Test |
|---|-----------|------|
| AC-4.1 | Tools can be dragged from palette | Grab tool → cursor changes to grab → drag works |
| AC-4.2 | Drop zones appear in Rail View | Drag tool → see drop zones between steps |
| AC-4.3 | Dropping tool creates step | Drop tool on zone → step appears at position |
| AC-4.4 | Tools can drop directly into containers | Drag tool → drop inside Loop → step in container |

### Logic Panel (4 criteria)

| # | Criterion | Test |
|---|-----------|------|
| AC-4.5 | Logic tab shows control flow options by category | Open Logic tab → see Routing, Iteration, etc. |
| AC-4.6 | Control flow items are draggable | Grab Loop → can drag to Rail View |
| AC-4.7 | Dropping Loop creates empty container | Drop Loop → empty container with drop zone appears |
| AC-4.8 | Config modal opens on drop | Drop Branch → modal opens for conditions |

### Reordering (4 criteria)

| # | Criterion | Test |
|---|-----------|------|
| AC-4.9 | Steps in rail can be dragged | Grab step → drag works |
| AC-4.10 | Dropping reorders steps | Drop step between others → order changes |
| AC-4.11 | Steps inside containers can reorder | Drag step B above A inside Loop → reorders |
| AC-4.12 | Visual feedback during drag | Dragging shows overlay, drop zones highlight |

### Container Operations (5 criteria)

| # | Criterion | Test |
|---|-----------|------|
| AC-4.13 | Steps can be dragged INTO containers | Drag step → drop on Loop → step moves inside |
| AC-4.14 | Steps can be dragged OUT of containers | Drag from Loop → drop on rail → step moves out |
| AC-4.15 | Branch has multiple drop zones | See drop zone per condition |
| AC-4.16 | Parallel has multiple drop zones | See drop zone per branch |
| AC-4.17 | Nested containers show correct drop target | Drag over nested structure → correct zone highlights |

### Rail View Control Flow (4 criteria)

| # | Criterion | Test |
|---|-----------|------|
| AC-4.18 | Loop shows as container with drop zone | Dashed border, "drag steps here" if empty |
| AC-4.19 | ForEach shows array indicator | Dashed border + array source preview |
| AC-4.20 | Branch shows conditions with drop zones | Condition labels, separate zones |
| AC-4.21 | Parallel shows fork/join structure | Fork node → branches → join node |

---

## User Flows

### Flow 1: Drag Tool to Build Workflow

```
1. User opens workflow editor (empty)
2. User sees Tools tab in right panel
3. User expands "Slack" integration
4. User DRAGS "Send Message" tool to Rail View
5. Drop zone highlights, user drops
6. Step appears in Rail View
7. User drags another tool, drops below first
8. Two steps now in sequential flow
```

### Flow 2: Drag Loop, Then Populate

```
1. User has 3 sequential steps: A, B, C
2. User clicks "Logic" tab
3. User DRAGS "Loop" to Rail View (between A and B)
4. Empty Loop container appears
5. Loop Config Modal opens (can configure now or later)
6. User drags step B INTO the Loop container
7. User drags step C INTO the Loop container
8. Now: A → [Loop: B → C] → (end)
9. User edits Loop config: "until status === 'done'"
```

### Flow 3: Reorder Steps by Dragging

```
1. User has: A → B → C
2. User wants B after C
3. User drags B
4. Drop zones appear between steps
5. User drops B after C
6. Now: A → C → B
```

### Flow 4: Build Branch with Multiple Drop Zones

```
1. User DRAGS "Branch" from Logic Panel
2. Branch Config Modal opens:
   - User adds condition: "score >= 90" (label: "High")
   - User adds condition: "score >= 70" (label: "Medium")
   - User enables "Else" (label: "Low")
3. User clicks "Create"
4. Branch appears with 3 empty drop zones:
   - [Branch] → High: (empty) | Medium: (empty) | Low: (empty)
5. User drags tool from Tools Panel to "High" zone
6. User drags another tool to "Medium" zone
7. User drags another tool to "Low" zone
8. Branch now routes to different steps based on score
```

### Flow 5: Move Steps Between Containers

```
1. User has: A → [Loop: B → C] → D
2. User wants C outside the loop
3. User drags C out of Loop, drops after the Loop
4. Now: A → [Loop: B] → C → D
5. User drags D into the Loop
6. Now: A → [Loop: B → D] → C
```

### Flow 6: Drag from Palette into Container Directly

```
1. User has an empty Loop container
2. User drags tool from Tools Panel
3. User hovers over Loop container (highlights)
4. User drops inside the Loop
5. Tool step appears inside the Loop
6. User can continue adding more steps to the Loop
```

---

## Implementation Phases

### Phase 4.1: UXD Mockups ✅ Complete
1. ✅ logic-panel.html
2. ✅ branch-config.html
3. ✅ parallel-config.html
4. ✅ loop-config.html
5. ✅ foreach-config.html

### Phase 4.2: Install Dependencies + Type Extensions
1. `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
2. Create `types/control-flow.ts` with all schemas
3. Update `workflow-step.ts` with parentId/childStepIds
4. Export from types/index.ts

### Phase 4.3: DnD Foundation
1. Create `DndProvider.tsx` with DndContext, sensors
2. Create `DragOverlayContent.tsx` for drag preview
3. Create `DropZone.tsx` for drop targets
4. Create `SortableStep.tsx` wrapper
5. Create `DraggablePaletteItem.tsx` for palette items
6. Wrap editor in DndProvider

### Phase 4.4: Tools Panel Retrofit (Drag-to-Add)
1. Update `ToolPaletteItem.tsx` with useDraggable
2. Remove click-to-add from `ToolPalette.tsx`
3. Add drop zones to RailView
4. Update store with `addStepFromPalette` action
5. **Test:** Drag tool from palette → drops in rail ✓

### Phase 4.5: Rail View Reordering
1. Wrap RailView steps in SortableContext
2. Update RailStep.tsx with useSortable
3. Add `reorderSteps` action to store
4. **Test:** Drag step A below step B → reorders ✓

### Phase 4.6: Store Extensions for Containers
1. Add `addControlFlow` action
2. Add `moveStepToContainer` action
3. Add `moveStepToRail` action
4. Add modal state to uiSlice

### Phase 4.7: Logic Palette
1. Create `LogicPalette.tsx` with categories
2. Create `LogicPaletteItem.tsx` with useDraggable
3. Integrate into EditorInspector (Logic tab)
4. **Test:** Drag Loop → empty container appears ✓

### Phase 4.8: Container Components
1. Create `RailContainer.tsx` (Loop/ForEach) with nested SortableContext
2. **Test:** Drag step into Loop container ✓
3. **Test:** Drag step out of Loop container ✓
4. **Test:** Reorder steps inside container ✓

### Phase 4.9: Configuration Modals
1. Create `LoopConfigModal.tsx`
2. Create `ForEachConfigModal.tsx`
3. Create `ParallelConfigModal.tsx`
4. Create `BranchConfigModal.tsx`
5. Wire up modal opening on container drop/click

### Phase 4.10: Branch + Parallel Components
1. Create `RailBranch.tsx` with multiple drop zones
2. Create `RailParallel.tsx` with fork/join structure
3. **Test:** Drag to different branch conditions ✓

### Phase 4.11: Integration & Polish
1. Test full flow: palette → rail → container → configure
2. Test edge cases (empty containers, nested drags)
3. Add keyboard support
4. Polish animations and visual feedback

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Drag-to-add (not click)** | Consistent interaction model - everything is drag-and-drop |
| **@dnd-kit library** | Modern, accessible, performant, ~25kb total, actively maintained |
| **Copy mode for palettes** | Palette items are templates - dragging creates copies |
| **Move mode for workflow** | Steps in workflow move, not copy |
| **SortableContext for lists** | Built-in reordering with animations |
| **Nested SortableContexts** | Containers have their own sortable children |
| **DragOverlay for preview** | Shows what's being dragged without moving original |
| **Drop zones between steps** | Clear visual affordance for insertion points |
| **Containers have childStepIds** | Clean data model - containers reference children by ID |
| **parentId on steps** | Easy to query "where is this step?" |
| **Modals for configuration** | Complex config (conditions, arrays) needs focused UI |
| **8px activation distance** | Prevents accidental drags on click |

---

## Out of Scope (Future Phases)

- **Step inspector** - Phase 5 (configure step inputs/outputs)
- **Data mapping** - Phase 5 (connect step outputs to inputs)
- **Nested control flow** - Phase 6 (loop inside loop, branch inside loop, etc.)
- **Visual condition builder** - Future (drag-drop condition UI)
- **Undo/redo** - Future (track drag operations)
- **Touch gestures** - Future (long-press to drag on mobile)
- **Keyboard-only drag** - Included via @dnd-kit KeyboardSensor

---

## References

- **@dnd-kit docs:** https://docs.dndkit.com/
- **@dnd-kit GitHub:** https://github.com/clauderic/dnd-kit
- **Mastra Primitives:** `_docs/Engineering/Integrations/API Docs/Mastra/Workflow-Primitives.md`
- **Rail View Mockups:** `app/(pages)/workflows-f/UXD/primitives/list-view/rail-view/`
- **Canvas View Reference:** `app/(pages)/workflows-f/UXD/primitives/canvas-view/nodes.html`
- **Phase 4 UXD:** `app/(pages)/workflows-f/UXD/phase-4/`
- **Phase 3 (to retrofit):** `03-Phase3-Tools-Panel.md`

---

## Phase 3 Retrofit Note

Phase 3 implemented click-to-add for tools. Phase 4 retrofits this:

| File | Change |
|------|--------|
| `ToolPaletteItem.tsx` | Add `useDraggable`, remove click handler |
| `ToolPalette.tsx` | Remove `handleAddTool` (drag handles it) |
| `RailView.tsx` | Add drop zones between steps |
| `stepsSlice.ts` | Add `addStepFromPalette(data, dropTargetId)` |

This is a **breaking change** to Phase 3's interaction model, but results in a **better, more consistent UX**.

---

**Last Updated:** December 7, 2025

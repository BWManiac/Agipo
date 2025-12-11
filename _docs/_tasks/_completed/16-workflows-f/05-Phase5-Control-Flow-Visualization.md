# Phase 5: Control Flow Visualization

**Status:** 📋 Planning  
**Last Updated:** December 7, 2025  
**Depends On:** Phase 4 (Drag-and-Drop)

---

## Goal

Implement specialized visual rendering for control flow primitives in the Rail View. Each control flow type should have its own distinct component that accurately represents its behavior:

- **Containers** (Loop, ForEach): Dashed-border boxes that hold child steps inside
- **Routers/Forks** (Branch, Parallel): Nodes that split into multiple output rails
- **Merges/Joins** (Branch Merge, Parallel Join): Nodes that converge multiple rails back to one
- **Timing** (Wait, Suspend): Specialized step styling for delays and human-in-loop

---

## Context: Control Flow Visual Patterns

Based on the Rail View mockups (`UXD/primitives/list-view/rail-view/nodes.html`), there are **three distinct visual patterns**:

### Pattern 1: Containers (Loop, ForEach)
```
    │
    ●
┌─────────────────────┐
│ 🔄 DO UNTIL: ...    │  ← Header with condition
├─────────────────────┤
│   ┌──────────┐      │
│   │ Step A   │      │  ← Child steps render INSIDE
│   └──────────┘      │
│        │            │
│   ┌──────────┐      │  ← Drop zone for more steps
│   │ Step B   │      │
│   └──────────┘      │
├─────────────────────┤
│ max: 10 iterations  │  ← Footer with config
└─────────────────────┘
    ●
    │
```
- Dashed border container
- Child steps live INSIDE the container
- Internal drop zone for dragging steps in
- Loop-back arrow indicator

### Pattern 2: Routers/Forks (Branch, Parallel Fork)
```
        │
        ●
   ┌─────────┐
   │ Branch  │
   │ ──────  │
   │ if A →  │  ← Conditions listed
   │ if B →  │
   │ else →  │
   └─────────┘
    /   |   \
   ●    ●    ●   ← Multiple output rails
   │    │    │
  [A]  [B] [else]
```
- Single input, multiple outputs
- Conditions/branches listed inside
- Rails split horizontally

### Pattern 3: Merges/Joins (Branch Merge, Parallel Join)
```
   │    │    │
  [A]  [B]  [C]
   ●    ●    ●   ← Multiple input rails
    \   |   /
   ┌─────────┐
   │  Join   │
   │ wait:all│
   └─────────┘
        ●
        │
```
- Multiple inputs, single output
- Merges parallel/branched rails back together

---

## Data Model Updates

### Step Schema Changes

```typescript
// workflow-step.ts additions
export const WorkflowStepValidator = z.object({
  // ... existing fields ...
  
  // Parent-child relationship for containers
  parentId: z.string().nullable().optional(), // ID of parent container
  childStepIds: z.array(z.string()).optional(), // For containers: ordered child steps
  
  // Branch-specific: which condition does this step belong to?
  branchConditionIndex: z.number().optional(), // 0, 1, 2... for which branch
  
  // Parallel-specific: which lane?
  parallelLaneIndex: z.number().optional(), // 0, 1, 2... for which parallel lane
});
```

### Control Flow Config Updates

```typescript
// execution-flow.ts updates
export const BranchConfigValidator = z.object({
  conditions: z.array(z.object({
    id: z.string(),
    label: z.string(),
    expression: z.string(),
    color: z.string().optional(), // For visual distinction
    // childStepIds removed - use step.branchConditionIndex instead
  })),
  hasElse: z.boolean().default(true),
});

export const ParallelConfigValidator = z.object({
  lanes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    // childStepIds removed - use step.parallelLaneIndex instead
  })),
  waitForAll: z.boolean().default(true),
  failFast: z.boolean().default(false),
});

export const LoopConfigValidator = z.object({
  type: z.enum(["until", "while"]),
  condition: z.string(),
  maxIterations: z.number().default(100),
  // childStepIds in step itself
});

export const ForEachConfigValidator = z.object({
  arraySource: z.string(), // Expression for the array
  itemVariable: z.string().default("item"),
  indexVariable: z.string().default("index"),
  concurrency: z.number().default(1),
  // childStepIds in step itself
});
```

---

## File Impact Analysis

### Part A: Data Model Updates
| File | Action | Description |
|------|--------|-------------|
| `api/workflows-f/types/workflow-step.ts` | Modify | Add `childStepIds`, `branchConditionIndex`, `parallelLaneIndex` |
| `api/workflows-f/types/execution-flow.ts` | Modify | Update Branch/Parallel/Loop/ForEach configs |

### Part B: Container Components
| File | Action | Description |
|------|--------|-------------|
| `editor/components/rail/containers/RailLoop.tsx` | Create | Loop container with internal drop zone |
| `editor/components/rail/containers/RailForEach.tsx` | Create | ForEach container with internal drop zone |
| `editor/components/rail/containers/ContainerDropZone.tsx` | Create | Reusable drop zone inside containers |
| `editor/components/rail/containers/index.ts` | Create | Barrel export |

### Part C: Router/Fork Components
| File | Action | Description |
|------|--------|-------------|
| `editor/components/rail/routers/RailBranchRouter.tsx` | Create | Branch split (one-to-many) |
| `editor/components/rail/routers/RailBranchMerge.tsx` | Create | Branch merge (many-to-one) |
| `editor/components/rail/routers/RailParallelFork.tsx` | Create | Parallel fork |
| `editor/components/rail/routers/RailParallelJoin.tsx` | Create | Parallel join |
| `editor/components/rail/routers/BranchLane.tsx` | Create | Individual branch lane with drop zone |
| `editor/components/rail/routers/ParallelLane.tsx` | Create | Individual parallel lane with drop zone |
| `editor/components/rail/routers/index.ts` | Create | Barrel export |

### Part D: Specialized Step Components
| File | Action | Description |
|------|--------|-------------|
| `editor/components/rail/steps/RailWait.tsx` | Create | Timer-styled wait step |
| `editor/components/rail/steps/RailSuspend.tsx` | Create | Human-in-loop step with pause indicator |
| `editor/components/rail/steps/index.ts` | Create | Barrel export |

### Part E: RailView Updates
| File | Action | Description |
|------|--------|-------------|
| `editor/components/RailView.tsx` | Modify | Dispatch to correct component based on step type |
| `editor/components/rail/RailNode.tsx` | Create | Wrapper that renders the right component |
| `editor/components/rail/RailBranchGroup.tsx` | Create | Renders branch router + lanes + optional merge |
| `editor/components/rail/RailParallelGroup.tsx` | Create | Renders fork + lanes + join |

### Part F: Store Updates
| File | Action | Description |
|------|--------|-------------|
| `editor/store/slices/stepsSlice.ts` | Modify | Add `moveStepIntoContainer`, `moveStepOutOfContainer`, `setStepBranchIndex`, `setStepLaneIndex` |
| `editor/providers/DndProvider.tsx` | Modify | Handle drops into containers, branch lanes, parallel lanes |

---

## Component Architecture

### RailView Rendering Logic

```tsx
// Pseudo-code for RailView rendering
function RailView() {
  const { steps } = useWorkflowStore();
  
  // Get top-level steps (no parent)
  const topLevelSteps = steps.filter(s => !s.parentId);
  
  return (
    <SortableContext items={topLevelSteps.map(s => s.id)}>
      {topLevelSteps.map((step, index) => (
        <RailNode key={step.id} step={step} index={index} />
      ))}
    </SortableContext>
  );
}

function RailNode({ step, index }) {
  // Dispatch based on step type and controlType
  if (step.type === "control") {
    switch (step.controlType) {
      case "loop":
        return <RailLoop step={step} />;
      case "foreach":
        return <RailForEach step={step} />;
      case "branch":
        return <RailBranchGroup step={step} />;
      case "parallel":
        return <RailParallelGroup step={step} />;
      case "wait":
        return <RailWait step={step} />;
      case "suspend":
        return <RailSuspend step={step} />;
    }
  }
  
  // Default: composio tool or custom step
  return <RailStep step={step} />;
}
```

### Container Internal Drop Zone

```tsx
function RailLoop({ step }) {
  const childSteps = useChildSteps(step.id);
  
  return (
    <div className="border-2 border-dashed border-violet-400 rounded-xl">
      <div className="loop-header">
        🔄 DO UNTIL: {step.controlConfig?.condition}
      </div>
      
      {/* Internal SortableContext for child steps */}
      <SortableContext items={childSteps.map(s => s.id)}>
        <ContainerDropZone containerId={step.id} index={0} />
        {childSteps.map((child, i) => (
          <>
            <RailNode key={child.id} step={child} index={i} />
            <ContainerDropZone containerId={step.id} index={i + 1} />
          </>
        ))}
      </SortableContext>
      
      <div className="loop-footer">
        max: {step.controlConfig?.maxIterations} iterations
      </div>
    </div>
  );
}
```

### Branch Router with Multiple Lanes

```tsx
function RailBranchGroup({ step }) {
  const { conditions } = step.controlConfig;
  
  return (
    <div className="flex flex-col items-center">
      {/* Router node */}
      <RailBranchRouter step={step} />
      
      {/* Branching lanes */}
      <div className="flex gap-8">
        {conditions.map((condition, i) => (
          <BranchLane
            key={condition.id}
            branchStepId={step.id}
            conditionIndex={i}
            condition={condition}
          />
        ))}
      </div>
      
      {/* Optional merge node */}
      {step.hasMerge && <RailBranchMerge step={step} />}
    </div>
  );
}
```

---

## Acceptance Criteria

### Containers (Loop, ForEach)
| # | Criterion |
|---|-----------|
| AC-5.1 | Loop renders with dashed violet border container |
| AC-5.2 | Loop header shows condition (DO UNTIL / DO WHILE) |
| AC-5.3 | Loop footer shows max iterations |
| AC-5.4 | Loop has loop-back arrow indicator |
| AC-5.5 | ForEach renders with dashed pink border container |
| AC-5.6 | ForEach header shows array source and concurrency |
| AC-5.7 | Child steps render INSIDE the container |
| AC-5.8 | Can drag steps INTO container (internal drop zone) |
| AC-5.9 | Can drag steps OUT OF container back to main rail |
| AC-5.10 | Can reorder steps within container |

### Routers/Forks (Branch, Parallel)
| # | Criterion |
|---|-----------|
| AC-5.11 | Branch router shows conditions with color-coded dots |
| AC-5.12 | Branch router splits into multiple vertical rails |
| AC-5.13 | Each branch lane has its own drop zone |
| AC-5.14 | Steps in lane show which condition they belong to |
| AC-5.15 | Branch merge exists to converge lanes (optional) |
| AC-5.16 | Parallel fork shows lane labels (A, B, C) |
| AC-5.17 | Parallel fork splits into horizontal lanes |
| AC-5.18 | Parallel join shows "wait for all" indicator |
| AC-5.19 | Can drag steps into specific branch lanes |
| AC-5.20 | Can drag steps into specific parallel lanes |

### Specialized Steps (Wait, Suspend)
| # | Criterion |
|---|-----------|
| AC-5.21 | Wait step shows timer icon and duration |
| AC-5.22 | Wait step has teal color theme |
| AC-5.23 | Suspend step shows pause icon |
| AC-5.24 | Suspend step has rose color theme |
| AC-5.25 | Suspend step shows "awaiting approval" indicator |

### General
| # | Criterion |
|---|-----------|
| AC-5.26 | All control flow types have distinct visual identity |
| AC-5.27 | Nested structures render correctly (e.g., Loop inside ForEach) |
| AC-5.28 | Drag overlay shows appropriate preview for each type |

---

## User Flows

### Flow 1: Add Loop → Drag Steps In
1. User drags "Loop" from Logic panel → rail
2. Empty Loop container appears with dashed border
3. User drags a tool from Tools panel
4. Drop zone inside Loop highlights
5. User drops → step appears inside Loop container
6. User drags another tool → drops inside Loop
7. Two steps now visible inside the Loop container

### Flow 2: Move Steps Into/Out of Container
1. Rail has: Step A → Step B → Loop (empty) → Step C
2. User drags Step B
3. Loop's internal drop zone highlights
4. User drops Step B into Loop
5. Rail now: Step A → Loop (contains Step B) → Step C
6. User drags Step B out of Loop
7. Rail shows Step B between Loop and Step C

### Flow 3: Build Branch with Conditions
1. User drags "Branch" from Logic panel
2. Branch router appears with default 2 conditions
3. User clicks Branch to configure → opens config modal
4. User adds condition: "score >= 90" (Gold)
5. User adds condition: "score >= 70" (Silver)
6. Branch now shows 3 lanes (Gold, Silver, Else)
7. User drags steps into each lane
8. Each lane shows its steps vertically

### Flow 4: Nested Control Flow
1. User adds ForEach container
2. Inside ForEach, user adds Branch
3. Branch appears inside ForEach container
4. User adds steps to Branch lanes
5. Structure: ForEach → Branch → Steps per condition

---

## Implementation Phases

### Phase 5.0: Data Model (Day 1 morning)
- Update `workflow-step.ts` with new fields
- Update `execution-flow.ts` with config schemas
- Run typecheck

### Phase 5.1: Container Components (Day 1)
- Create `RailLoop.tsx`
- Create `RailForEach.tsx`
- Create `ContainerDropZone.tsx`
- Test: Loop/ForEach appear with proper styling

### Phase 5.2: Router Components (Day 2)
- Create `RailBranchRouter.tsx`
- Create `RailBranchMerge.tsx`
- Create `BranchLane.tsx`
- Create `RailParallelFork.tsx`
- Create `RailParallelJoin.tsx`
- Create `ParallelLane.tsx`
- Test: Branch/Parallel render with lanes

### Phase 5.3: RailView Integration (Day 2-3)
- Create `RailNode.tsx` dispatcher
- Update `RailView.tsx` to use RailNode
- Create group components for Branch/Parallel

### Phase 5.4: Drop Zone Logic (Day 3)
- Update `DndProvider.tsx` for container drops
- Add store actions for moving steps between containers
- Test: Full drag-into-container flow

### Phase 5.5: Specialized Steps (Day 3-4)
- Create `RailWait.tsx`
- Create `RailSuspend.tsx`
- Test: Proper styling for timing primitives

### Phase 5.6: Polish & Edge Cases (Day 4)
- Nested structures
- Drag overlay updates
- Empty container states
- Configuration modals integration

---

## Design Decisions

### Why Separate Router/Merge vs Fork/Join?
- **Branch**: Router splits based on conditions, Merge converges. Not all branches need a merge (some terminate differently).
- **Parallel**: Fork ALWAYS has a corresponding Join (wait for all). They're paired but rendered separately for clarity.

### Why `branchConditionIndex` Instead of `childStepIds` on Condition?
- Simpler to query: "all steps where parentId = branchId AND branchConditionIndex = 0"
- Easier reordering: just change the step's index
- Avoids syncing two arrays (step.parentId and condition.childStepIds)

### Why Nested SortableContext?
- Each container needs its own sorting scope
- Prevents steps from "leaking" during drag between containers
- `@dnd-kit` handles this well with multiple contexts

---

## Dependencies

- Phase 4 complete ✅
- `@dnd-kit/core`, `@dnd-kit/sortable` installed ✅

---

## Open Questions

1. **Branch Merge Placement**: Should merge be automatic or user-placed?
2. **Parallel Lane Count**: Fixed at creation or dynamically addable?
3. **Nested Depth Limit**: Should we cap nesting (e.g., max 3 levels)?
4. **Configuration Modals**: Use Phase 4 UXD mockups or create inline editors?

---

## References

- UXD Mockups: `app/(pages)/workflows-f/UXD/primitives/list-view/rail-view/`
- Phase 4 Config Mockups: `app/(pages)/workflows-f/UXD/phase-4/`


# Router Components

These components render **router/fork-join** control flow steps that split and merge the workflow.

## What are Routers?

Routers are control flow primitives that **split** the workflow into multiple paths:

- **Branch** (`RailBranchGroup.tsx`): Routes based on conditions (if/else)
- **Parallel** (`RailParallelGroup.tsx`): Runs multiple paths concurrently

## Visual Design

### Branch (Conditional Router)
```
        │
   ┌─────────────┐
   │   Branch    │
   │ ● score≥90  │  ← Conditions listed
   │ ● score≥70  │
   │ ○ else      │
   └─────────────┘
    /     |     \
  Gold  Silver  Else   ← Multiple vertical lanes
   │      │       │
  [A]    [B]     [C]   ← Steps in each lane
```

### Parallel (Fork/Join)
```
        │
   ┌─────────┐
   │  Fork   │  ← Fork splits the flow
   └─────────┘
    /   |   \
   A    B    C    ← Parallel lanes
   │    │    │
   └────┼────┘
   ┌─────────┐
   │  Join   │  ← Join merges results
   └─────────┘
        │
```

## User Interactions

1. **Drag steps into specific lanes** → Each lane has its own drop zone
2. **Click router node** → Opens configuration modal
3. **Add/remove conditions** → Updates available lanes

## Files

| File | Purpose |
|------|---------|
| `RailBranchRouter.tsx` | The router node showing conditions |
| `RailBranchMerge.tsx` | Optional merge node at end of branches |
| `BranchLane.tsx` | Individual branch lane with drop zone |
| `RailBranchGroup.tsx` | Orchestrates router + lanes + merge |
| `RailParallelFork.tsx` | Fork node that splits flow |
| `RailParallelJoin.tsx` | Join node that merges results |
| `ParallelLane.tsx` | Individual parallel lane |
| `RailParallelGroup.tsx` | Orchestrates fork + lanes + join |


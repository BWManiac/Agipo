# Container Components

These components render **container-style** control flow steps that hold child steps inside them.

## What are Containers?

Containers are control flow primitives that **wrap** other steps:

- **Loop** (`RailLoop.tsx`): Repeats child steps until a condition is met
- **ForEach** (`RailForEach.tsx`): Iterates over an array, running child steps for each item

## Visual Design

Containers have a distinctive look:

```
┌─────────────────────────────┐
│ 🔄 DO UNTIL: status='done'  │  ← Header with condition
├─────────────────────────────┤
│   ┌─────────────────────┐   │
│   │ Child Step 1        │   │  ← Steps render INSIDE
│   └─────────────────────┘   │
│             │               │
│   ┌─────────────────────┐   │
│   │ Child Step 2        │   │
│   └─────────────────────┘   │
├─────────────────────────────┤
│ max: 10 iterations          │  ← Footer with config
└─────────────────────────────┘
```

## User Interactions

1. **Drag tools/steps INTO the container** → They become child steps
2. **Drag steps OUT of the container** → They return to main rail
3. **Reorder steps within container** → Standard drag-and-drop
4. **Click container header** → Opens configuration modal

## Files

| File | Purpose |
|------|---------|
| `RailLoop.tsx` | Loop container (do-until, do-while) |
| `RailForEach.tsx` | ForEach container (iterate over array) |
| `ContainerDropZone.tsx` | Drop zone styling inside containers |


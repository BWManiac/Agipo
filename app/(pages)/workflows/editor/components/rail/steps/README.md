# Specialized Step Components

These components render **specialized control flow steps** that don't contain other steps but have unique styling.

## What are Specialized Steps?

These are control flow primitives that appear as single steps (not containers):

- **Wait** (`RailWait.tsx`): Pauses workflow for a duration or until a time
- **Suspend** (`RailSuspend.tsx`): Pauses for human approval (human-in-the-loop)

## Visual Design

### Wait (Timing)
```
┌─────────────────────────┐
│ 🕐  Wait                │
│     Wait 5000ms         │
└─────────────────────────┘
```
- Teal color theme
- Shows duration or target time

### Suspend (Human-in-the-Loop)
```
┌─────────────────────────┐
│ ⏸  Suspend              │
│     Awaiting approval   │
└─────────────────────────┘
      ⏸ Workflow paused
```
- Rose/red color theme
- Shows pause indicator below

## User Interactions

1. **Click step** → Opens configuration modal
2. **Drag to reorder** → Works like any other step

## Files

| File | Purpose |
|------|---------|
| `RailWait.tsx` | Timer-styled wait step |
| `RailSuspend.tsx` | Human-in-loop pause step |


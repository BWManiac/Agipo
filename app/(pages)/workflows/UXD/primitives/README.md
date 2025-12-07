# Workflow Primitives - Visual Reference

This folder contains comprehensive mockups showing how Mastra workflow primitives translate to visual representations.

## View Types

### Canvas View (ReactFlow)
Free-form node-based editor. Flexible but can get messy.
- `canvas-view/nodes.html` - All node types
- `canvas-view/edges.html` - Edge types and data flow
- `canvas-view/patterns.html` - Common workflow patterns

### List View (Deterministic Vertical)
Structured, top-to-bottom flow. Clean and predictable. Three options:

| View | Description | Best For |
|------|-------------|----------|
| **Rail View** | Single vertical rail with controlled horizontal expansion | Visual + structured balance |
| **Outline View** | Document-style nested list (like an SOP) | Scanning, printing, simplicity |
| **Swimlane View** | Parallel lanes for concurrent execution | Visualizing parallelism |

## Folder Structure

```
primitives/
├── README.md                    # This file
├── canvas-view/                 # Free-form ReactFlow
│   ├── nodes.html               # All node types
│   ├── edges.html               # Edge and data flow types
│   └── patterns.html            # Common patterns
└── list-view/                   # Deterministic vertical views
    ├── rail-view/               # Locked vertical with controlled expansion
    │   ├── nodes.html           # All primitives in rail style
    │   └── example.html         # Complex workflow example
    ├── outline-view/            # Document/SOP style
    │   ├── nodes.html           # All primitives in outline style
    │   └── example.html         # Complex workflow example
    └── swimlane-view/           # Parallel lanes
        ├── nodes.html           # All primitives in swimlane style
        └── example.html         # Complex workflow example
```

## Primitive Index

Based on `_docs/Engineering/Integrations/API Docs/Mastra/Workflow-Primitives.md`:

### Core Execution

| Primitive | Description | Node Type |
|-----------|-------------|-----------|
| `createStep()` | Basic execution unit | Standard node |
| `.then(step)` | Sequential execution | Rail connection |
| `.map()` | Data transformation | Edge label/badge |

### Control Flow

| Primitive | Description | Visual Pattern |
|-----------|-------------|----------------|
| `.branch([[cond, step]])` | Conditional routing | Router node → multiple outputs |
| `.parallel([...])` | Concurrent execution | Fork → lanes → Join |
| `.dountil(step, cond)` | Repeat until true | Container with loop indicator |
| `.dowhile(step, cond)` | Repeat while true | Container with loop indicator |
| `.foreach(step, opts)` | Array iteration | Container with item indicator |

### Timing & Events

| Primitive | Description | Visual Pattern |
|-----------|-------------|----------------|
| `.sleep(ms)` | Pause for duration | Timer node |
| `.sleepUntil(date)` | Pause until date | Calendar node |
| `.waitForEvent(name)` | Wait for external event | Event listener node |

### Human-in-the-Loop

| Primitive | Description | Visual Pattern |
|-----------|-------------|----------------|
| `suspend(payload)` | Pause for human input | Pause node with waiting indicator |
| `resume(data)` | Continue after approval | (continuation) |

### Exit & Error Handling

| Primitive | Description | Visual Pattern |
|-----------|-------------|----------------|
| `bail(result)` | Early exit with success | Exit node (no output) |
| `abort()` | Cancel execution | Abort node (no output) |
| `retryConfig` | Retry settings | Badge overlay on node |

## Design Principles

### Containers vs Routers

**Containers** (hold child workflows inside):
- Loop (doUntil/doWhile) - "Run this workflow inside me repeatedly"
- ForEach - "Run this workflow for each item"

**Routers** (direct flow to downstream nodes):
- Branch - "Pick which output path based on conditions"
- Parallel Fork - "Split into multiple concurrent paths"
- Parallel Join - "Wait for all paths, then continue"

### View Comparison

| Aspect | Canvas | Rail | Outline | Swimlane |
|--------|--------|------|---------|----------|
| Layout | Free | Locked | Nested | Lanes |
| Parallelism | Spatial | Horizontal split | Indented list | Actual lanes |
| Complexity | High | Medium | Low | Medium |
| Scannable | ❌ | ⚡ | ✅ | ⚡ |
| Printable | ❌ | ⚡ | ✅ | ⚡ |
| Draggable | ✅ | ❌ | ❌ | ❌ |

## Example Workflow

All `example.html` files demonstrate the same complex workflow:

**"Process Job Applications"**
1. Get Applications (Query Table)
2. For Each application (×5 concurrent):
   - 2.1 Validate Fields
   - 2.2 Branch on experience (Senior/Mid/Junior)
   - 2.3 Parallel: Fetch LinkedIn, GitHub, References
   - 2.4 AI Score Candidate
3. Do Until (all scored OR count > 100):
   - 3.1 Check Progress
   - 3.2 Sleep 5s
4. Suspend (await HR review)
5. Save Results (Write Table)

This example covers: Sequential, ForEach, Branch (3+ conditions), Parallel, Join, Loop, Sleep, Suspend, Query Table, Write Table, AI step.

---

**Last Updated:** December 2025

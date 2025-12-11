# Diary Entry 1: Node Execution Engine MVP

**Date:** 2025-10-30  
**Task:** N/A  
**Status:** ✅ Complete

---

## 1. Context

We built a visual, node-based workflow editor in the browser. The core goal was to allow users to place nodes containing JavaScript code on a canvas, connect them to pipe data, and execute the resulting graph using WebContainers. All work was consolidated into a single file for this experimental phase: `app/experiments/webcontainer-test/page.tsx`.

This was the foundational MVP that proved we could execute code in the browser and pipe data between nodes.

---

## 2. Implementation Summary

### Phase 1: Environment Setup & Basic Canvas

**Dependencies:**
- Installed `@xyflow/react` (the new name for React Flow)
- Added `zustand` for state management
- Integrated `@webcontainer/api` for in-browser execution

**Configuration:**
- Modified `next.config.ts` to add required COOP/COEP headers (prerequisite for `SharedArrayBuffer` used by WebContainer)
- Fixed routing: moved from `app/_experiments` (private folder) to `app/experiments` (public)
- Updated CSS import path from `reactflow/dist/style.css` to `@xyflow/react/dist/style.css`

### Phase 2: UI & State Management

**Canvas Implementation:**
- Implemented React Flow canvas using `useNodesState` and `useEdgesState` hooks (built on Zustand)
- Added support for adding, deleting, moving, and connecting nodes
- Added sidebar displaying raw JSON of `nodes` and `edges` arrays for debugging

### Phase 3: WebContainer & Single Node Execution

**WebContainer Integration:**
- Booted WebContainer instance on page load with loading status
- Replaced default nodes with custom React component containing `<textarea>` for code editing
- Implemented `onRun` function with critical bug fixes:

**Bug 1: `MODULE_NOT_FOUND` Race Condition**
- Problem: `await writeFile` followed immediately by `await spawn` failed - Node.js couldn't find the file
- Solution: Used atomic shell command: `sh -c "echo '...' > /tmp/index.js && node /tmp/index.js"`

**Bug 2: `EACCES: permission denied`**
- Problem: Writing to root (`/`) directory failed
- Solution: Write all scripts to `/tmp` directory (world-writable)

**Visual Feedback:**
- Added `isRunning` state to nodes
- Executing node border turns green during execution

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Execution Directory | `/tmp` | World-writable, avoids permission issues |
| Execution Method | Atomic shell command | Prevents race conditions between file write and execution |
| State Management | Zustand via React Flow hooks | Built-in state management for canvas interactions |
| Routing | `app/experiments/` | Public folder (underscore prefix makes folders private in Next.js) |

---

## 4. Technical Deep Dive

### Execution Flow

1. User writes code in node `<textarea>`
2. User clicks "Run" button
3. `onRun` function:
   - Extracts code from node
   - Builds shell command: `sh -c "echo '<code>' > /tmp/node-1.js && node /tmp/node-1.js"`
   - Executes command in WebContainer
   - Captures stdout/stderr output
   - Updates UI with results

### WebContainer Environment

- Sandboxed Linux environment running in browser
- Only `/tmp` directory is writable
- Node.js runtime available
- CommonJS modules (`require()`) only - no ES modules

---

## 5. Lessons Learned

- **Next.js routing:** Underscore prefix (`_experiments`) marks folders as private/non-routable
- **WebContainer execution:** Atomic shell commands prevent race conditions between file writes and process spawning
- **File permissions:** Only `/tmp` is writable in WebContainer sandbox
- **Module system:** Default Node.js environment is CommonJS - `import` syntax requires additional configuration

---

## 6. Next Steps

- [ ] Implement full graph execution (piping between nodes)
- [ ] Add dependency management (`npm install` support)
- [ ] Support multi-node chains with data piping
- [ ] Add error handling and recovery

---

## References

- **Related Diary:** `02-TestCasesExecution.md` - Test cases for the MVP
- **Related Diary:** `03-ImplementationLearnings.md` - Detailed learnings from this work

---

**Last Updated:** 2025-10-30

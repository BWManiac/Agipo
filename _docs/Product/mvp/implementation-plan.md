# MVP Implementation Plan & File Impact

This document outlines the minimal file impact and step-by-step implementation plan to build and test the MVP.

## Minimal File Impact

| File                                          | Action       | Purpose                                                                |
| --------------------------------------------- | ------------ | ---------------------------------------------------------------------- |
| `package.json`                                | Modify       | Add dependencies: `@xyflow/react`, `zustand`, `@webcontainer/api`.      |
| `next.config.mjs`                             | Modify       | Configure COOP/COEP headers for `SharedArrayBuffer` support.           |
| `app/(pages)/workflow-generator/page.tsx`     | **Create**   | A single file to house all MVP logic for rapid development and testing. |

---

## Implementation & Testing Order

Each step is designed to be testable on `localhost`.

### Step 1: Setup & Basic Canvas

-   **Actions:**
    1.  Install dependencies: `npm install @xyflow/react zustand @webcontainer/api`.
    2.  Update `next.config.mjs` with the required COOP/COEP headers.
    3.  Create `_experiments/webcontainer-test/page.tsx` and render a basic, empty React Flow canvas.
-   **Localhost Result:** Navigate to `/experiments/webcontainer-test` to see a blank, interactive canvas. This confirms the initial setup.

### Step 2: State Management & UI Interactivity

-   **Actions:**
    1.  In `_experiments/webcontainer-test/page.tsx`, define a Zustand store for nodes and edges.
    2.  Implement UI functions to add, delete, and connect nodes, linking them to the store.
    3.  Display the raw Zustand state on the page to visualize state changes.
-   **Localhost Result:** The UI allows for creating, deleting, and connecting nodes, with the state JSON updating in real-time.
-   **Tests Covered:** #4, #5, #6, #7.

### Step 3: WebContainer Initialization & Single Node Execution

-   **Actions:**
    1.  In the same file, add logic to boot the WebContainer singleton in a `useEffect`.
    2.  Add a "Run" button that takes the code from the first node, writes it to a virtual `index.js`, executes `node index.js`, and displays the output.
-   **Localhost Result:** A single node with `console.log("Hello");` will execute and display "Hello" on the page.
-   **Tests Covered:** #1, #8, #9, #10.

### Step 4: Full Graph Execution (Piping)

-   **Actions:**
    1.  Enhance the "Run" button's orchestrator to handle multiple nodes and edges by generating a file for each node and constructing a piped shell command (e.g., `node node-1.js | node node-2.js`).
-   **Localhost Result:** The "Hello World" two-node test case executes successfully.
-   **Tests Covered:** #2, #3.

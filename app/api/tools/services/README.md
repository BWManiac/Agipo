# Tool Services

This directory contains the core business logic for the Tools domain.

## Services

### `runtime.ts` (The Engine)
**Purpose:** Loads executable tools from the file system into memory.
-   **Business Role:** Finds the "muscle" (executable code) for the agents to use.
-   **Function:** Scans `_tables/tools`, imports `tool.js`, and caches the results.

### `storage.ts` (The Archive)
**Purpose:** Manages the persistence of tool definitions and code.
-   **Business Role:** Saves your work.
-   **Function:** Reads and writes `workflow.json` (source) and `tool.js` (executable) to the `_tables/tools` directory.

### `transpiler.ts` (The Translator)
**Purpose:** Converts visual workflow diagrams into executable JavaScript.
-   **Business Role:** Bridges the gap between the visual editor and the runtime engine.
-   **Function:** Generates a `tool.js` file from a `WorkflowData` object.

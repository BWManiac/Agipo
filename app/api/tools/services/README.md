# Tool Services

This directory contains the core business logic for the Tools domain. These services are responsible for managing the lifecycle of tools, from creation (transpilation) to execution (registry).

## Services

### `registry.ts` (The Catalog)
**Purpose:** Acts as the central "Menu" of all capabilities available to the workforce.
-   **Business Role:** When an agent needs to know what it can do, it consults the Registry.
-   **Function:** Aggregates tools from various sources (e.g., built-in tools, user-created workflows) into a single, unified list.

### `loader.ts` (The Retrieval System)
**Purpose:** The mechanism that physically locates and loads tool code from the file system.
-   **Business Role:** Ensures that when a new workflow is saved, its executable version is immediately available to the system without restarting.
-   **Function:** Scans the `_tables/workflows` directory, dynamically imports the tool files, and validates they match the expected `ToolDefinition` contract.

### `transpiler.ts` (The Translator)
**Purpose:** Converts visual workflow diagrams into executable software.
-   **Business Role:** Allows non-technical users to build complex software tools visually. It bridges the gap between the "Canvas" (what you see) and the "Runtime" (what the agent runs).
-   **Function:** Takes a JSON representation of nodes and edges and generates a TypeScript file containing Zod schemas and an execution function.


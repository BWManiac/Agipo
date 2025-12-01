# Feature: Workflow as Code (Transpilation)

## 1. Overview

This document outlines the architecture for transforming user-created visual workflows into portable, executable "Tools". The primary goal is to decouple a workflow's logic from the client-side application state, enabling workflows to be saved, versioned, and executed by independent AI agents or other server-side processes.

This moves the project from a browser-based execution model to a more robust, scalable architecture where the `workflow-generator` acts as an IDE for producing real code.

## 2. Core Requirements

- **Workflow Transpilation:** Convert an entire visual workflow (nodes and edges) into a self-contained, executable Node.js script.
- **Single-Node Transpilation:** Allow any individual node to be saved as its own simple, executable tool.
- **Portability:** The generated tool must be runnable in any standard Node.js environment (e.g., a serverless function, Docker container, or Vercel Agent sandbox) with no dependencies on the AGIPO client application.
- **Dependency Management:** The process must automatically detect `npm` package dependencies within the user's code and bundle a corresponding `package.json`.
- **Persistence:** The resulting tool bundle must be saved to a persistent storage layer (e.g., Supabase).

## 3. Architectural Design: The Transpilation Pipeline

The core of this feature is a "transpiler" service that orchestrates the conversion from a visual graph to an executable code bundle.

### 3.1. Input: The Workflow Graph

The transpiler will take the `nodes` and `edges` arrays from the Zustand store as its primary input.

- `nodes`: Contains the code, position, and other metadata for each step.
- `edges`: Defines the connections and data flow between nodes.

### 3.2. Step 1: Graph Analysis (Topological Sort)

To handle workflows with multiple paths and dependencies, the first step is to perform a topological sort on the graph of nodes and edges. This produces a linear execution order that respects all defined dependencies, ensuring that upstream nodes run before downstream nodes.

*For the MVP, we can focus on simple, linear workflows, where the execution order can be determined by traversing the edges from a source node.*

### 3.3. Step 2: Code & Dependency Analysis

The transpiler will iterate through each node in the sorted list and perform two actions:

1.  **Extract Code:** The raw JavaScript/TypeScript code from the node's data is retrieved.
2.  **Extract Dependencies:** A service will parse the code (e.g., using a regular expression to find `require(...)` or `import ... from '...'`) to identify all unique npm package dependencies.

### 3.4. Step 3: Code Generation (`run.js`)

This is the central step. The transpiler will generate a single `run.js` file.

- **For a full workflow:** This script will re-create the `stdin`/`stdout` piping logic from the original MVP. It will write each node's code to a temporary file (`/tmp/node-1.js`, `/tmp/node-2.js`, etc.) and then construct a shell command to execute the chain (e.g., `node /tmp/node-1.js | node /tmp/node-2.js`).
- **For a single node:** The script is much simpler. It will contain only that node's code and execute it directly.

### 3.5. Step 4: Bundle Creation

The final output is a "Tool Bundle," which is a collection of files:

1.  **`package.json`**: Contains a `dependencies` block listing all the unique packages discovered in Step 2.
2.  **`run.js`**: The executable script generated in Step 3.
3.  **`agipo.json` (Manifest File)**: A metadata file containing information about the tool, such as:
    - `name`: A human-readable name for the tool.
    - `description`: A summary of what the tool does.
    - `version`: Version number (e.g., 1.0.0).
    - `workflowId`: The ID of the source workflow in AGIPO.

### 3.6. Step 5: Persistence

The generated Tool Bundle will be stored in a database. For example, using Supabase, we could:
1. Create a `tools` table to store the metadata from `agipo.json`.
2. Store the bundle itself (e.g., as a `.zip` archive) in Supabase Storage, linking it to the corresponding row in the `tools` table.

## 4. Agent Execution Flow

Once a tool is saved, an AI agent can execute it with the following decoupled process:

1.  **Fetch:** The agent queries the `tools` table and downloads the associated Tool Bundle from storage.
2.  **Prepare Environment:** The agent unzips the bundle into a temporary, isolated execution environment (like a temporary folder on a server).
3.  **Install Dependencies:** It runs `npm install` within that directory. This will install all dependencies listed in the `package.json` into a local `node_modules` folder.
4.  **Execute:** It runs `node run.js`.
5.  **Capture Output:** The agent captures any `stdout` as the successful result and `stderr` as any potential error.

## 5. New Components & Services

Implementing this feature will require creating several new components:

- **`WorkflowTranspilerService`**: A new service class responsible for the core logic described in Section 3.
    - `transpileWorkflow(nodes, edges): Promise<ToolBundle>`
    - `transpileNode(node): Promise<ToolBundle>`
- **`DependencyAnalysisService`**: A helper service to parse code and extract dependencies.
- **New Store Actions (in `workflowSlice.ts`)**:
    - `saveWorkflowAsTool(): Promise<void>`
    - `saveNodeAsTool(nodeId): Promise<void>`
- **New API Endpoint (`/api/tools`)**: A backend route to handle the creation and storage of tools, protecting database credentials.

## 6. Risks & Future Considerations

- **Complex Topologies:** The initial `stdin`/`stdout` piping model only supports linear workflows. Handling branching (`if/else` logic) or merging of data streams will require a more advanced `run.js` script, which might act as an orchestrator, conditionally executing different node scripts and managing data flow with temporary files instead of just pipes.
- **Robust Dependency Parsing:** A regex-based approach is sufficient for an MVP but may fail on more complex import syntax (e.g., dynamic imports, aliases). A more robust solution might involve using a proper JavaScript parser like Acorn or Babel.
- **Input/Output Contracts:** The current model assumes data is passed via `stdin`/`stdout`. For agents to reliably use these tools, we will need to define explicit input/output schemas (e.g., expecting JSON on `stdin` and guaranteeing JSON on `stdout`). The `spec` layer of a node will be critical here.

This document provides a comprehensive starting point. The next step is to begin implementing the core services, starting with the `WorkflowTranspilerService`.

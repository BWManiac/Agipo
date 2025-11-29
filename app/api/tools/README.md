# Tools Domain API (`/api/tools`)

The Tools domain manages both the **executable capabilities** available to agents and the **definitions** (source graphs) used to create them.

## Endpoints

### Execution & Registry
*   `GET /api/tools`
    *   Lists all executable tools available to agents.
    *   Used by the Agent Runtime.

### Tool Definition Management
These endpoints replace the old "Workflows" API.

*   `GET /api/tools/list`
    *   Lists all tool definitions (source graphs).
*   `POST /api/tools/create`
    *   Creates a new tool definition and generates its executable code.
*   `GET /api/tools/[toolId]/read`
    *   Retrieves the full source graph for a tool.
*   `PUT /api/tools/[toolId]/update`
    *   Updates the tool definition and regenerates the executable code.

### Builder Assistant
*   `POST /api/tools/chat`
    *   The AI assistant that helps users build tools via chat.

## Services
*   **Loader/Registry:** Loads executable tools from storage.
*   **Transpiler:** Converts visual node graphs into TypeScript tool code.

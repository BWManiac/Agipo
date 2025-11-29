# Tools Domain API (`/api/tools`)

The Tools domain manages both the **executable capabilities** available to agents and the **definitions** (source graphs) used to create them.

## Endpoints

### Tool Definition Management
These endpoints replace the old "Workflows" API.

*   `GET /api/tools/list`
    *   Lists all tool definitions (source graphs).
    *   Used by UI components to display available tools.
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
*   **Runtime:** Loads executable tool code from storage (used by agent chat, not exposed as API).
*   **Storage:** Manages tool definition files (workflow.json) and executable code (tool.js).
*   **Transpiler:** Converts visual node graphs into JavaScript tool code.

## Architecture

- **Tool Definitions** (`/api/tools/list`): Source metadata (name, description, ID) for UI display.
- **Executable Tools** (`runtime.getExecutableToolById()`): Actual code loaded at runtime by agents.
- Tools are stored as folders: `_tables/tools/{id}/workflow.json` (definition) and `tool.js` (executable).

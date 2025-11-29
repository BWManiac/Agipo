# Tool Update API (`/api/tools/[toolId]/update`)

**Method:** `PUT`

## Purpose
Updates an existing tool definition.

## Side Effects
*   **Persistence:** Overwrites the tool definition file.
*   **Regeneration:** Re-runs the transpiler to update the executable code immediately.


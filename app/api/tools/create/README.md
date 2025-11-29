# Tool Creation API (`/api/tools/create`)

**Method:** `POST`

## Purpose
Creates a new tool definition.

## Process
1.  Saves the visual definition (nodes/edges) to `_tables/workflows`.
2.  Transpiles the definition into TypeScript.
3.  Saves the executable tool.

## Request Body
`CreateToolDefinitionBodySchema` (JSON).


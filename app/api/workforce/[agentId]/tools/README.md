# Agent Tool Management API (`/api/workforce/[agentId]/tools`)

**Method:** `POST`

## Purpose
Updates the set of tools assigned to a specific agent. This endpoint modifies the agent's configuration file on disk (e.g., `_tables/agents/mira-patel.ts`).

## Request Body
```json
{
  "toolIds": ["workflow-research-v1", "github-search"]
}
```

## Process
1.  Locates the agent file based on `agentId`.
2.  Reads the TypeScript source file.
3.  Uses regex replacement to update the `toolIds` array in the source code.
4.  Writes the file back to disk.

## Notes
*   This is a "low-code" management feature that directly manipulates source code to persist configuration.
*   Changes take effect immediately for new chat sessions.


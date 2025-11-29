# Agent Chat API (`/api/workforce/[agentId]/chat`)

**Method:** `POST`

## Purpose
The dedicated chat endpoint for interacting with a specific **Workforce Agent** (e.g., Mira Patel). It instantiates the requested agent dynamically, loading its specific system prompt and assigned toolset.

## Request Body
```json
{
  "messages": [ ... ], // Array of UIMessages
  "context": "..." // Optional: Additional session context
}
```
*Note: `agentId` is now provided via the URL parameter.*

## Response
Streams a Vercel AI SDK response. The agent can execute any tools assigned to it in the `_tables/agents` configuration.

## Dynamic Loading
1.  **Agent Config:** Loaded from `_tables/agents/{agentId}.ts`.
2.  **Tools:** Loaded via the Tool Registry (`app/api/tools/services/registry.ts`).
3.  **Runtime:** Instantiates a new `Experimental_Agent` for each request, ensuring stateless and scalable execution.

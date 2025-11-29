# Tool Chat API (`/api/tools/chat`)

**Method:** `POST`

## Purpose
The specialized chat backend for the **Workflow Builder Assistant**. This agent helps users build workflows by understanding natural language commands (e.g., "Create a workflow that scrapes Hacker News") and converting them into canvas actions using the `workflowTools` set.

## Request Body
Accepts a JSON object compatible with the Vercel AI SDK:

```json
{
  "messages": [ ... ], // Array of UIMessages
  "workflowContext": "..." // Optional: Stringified representation of current canvas state
}
```

## Response
Streams a Vercel AI SDK response, which may include text chunks and tool calls (e.g., `add_node`, `connect_nodes`).

## Context Injection
The `workflowContext` is injected as a system message at the start of the conversation to ground the LLM in the current state of the user's work.


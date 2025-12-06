# Agent Chat

> Enables users to have streaming conversations with AI agents that can use tools on their behalf.

**Endpoint:** `POST /api/workforce/[agentId]/chat`  
**Auth:** Clerk

---

## Purpose

The primary interface for interacting with AI agents. Users send messages and receive streaming responses. The agent can use both custom tools (workflows) and connection tools (Gmail, Slack, etc.) to complete tasks. Conversations are persisted via thread IDs, allowing users to continue previous conversations with full context.

---

## Approach

We authenticate the user, load the agent configuration from the registry, then dynamically build a tool map combining custom tools and connection tools. The Mastra Agent framework handles the actual LLM interaction and tool execution. Responses are streamed back using the Vercel AI SDK format. Memory persistence is handled by Mastra's memory system.

---

## Pseudocode

```
POST(request, { params }): NextResponse
├── Authenticate user via Clerk
├── Parse messages, context, threadId from body
├── Generate threadId if not provided
├── **Call `loadAgentConfig(agentId)`** from chat-service
├── If agent not found: Return 404
├── **Call `buildToolMap(userId, agentConfig)`** 
│   ├── Load custom tools from registry
│   └── Load connection tools from user's connections
├── **Call `formatMessages()`** to convert UI format
├── **Call `createConfiguredAgent()`** with Mastra
├── **Call `agent.stream()`** with formatted messages
├── Return streaming response with X-Thread-Id header
└── On error: Return user-friendly message (200 status)
```

---

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agentId` | string (path) | Yes | Agent identifier |
| `messages` | Message[] | Yes | Conversation messages |
| `context` | string | No | Additional context for the session |
| `threadId` | string | No | Conversation thread ID (auto-generated if not provided) |

**Example Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Check my recent emails" }
  ],
  "threadId": "thread_abc123"
}
```

---

## Output

Streaming response in Vercel AI SDK format. Headers include:
- `X-Thread-Id`: The conversation thread ID

On error (still 200 status for UI display):
```json
{
  "message": "I encountered an issue...",
  "error": "Detailed error",
  "threadId": "thread_abc123"
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| AgentChat | `app/(pages)/workforce/components/agent-modal/` | Main chat interface |

---

## Notes

- `maxDuration` set to 60 seconds for tool-heavy operations
- Errors return 200 status so the UI displays the message
- Tool results are truncated to 10K chars to prevent context overflow

---

## Related Docs

- [Mastra Agent](https://mastra.dev/docs/agents) - Agent framework
- [Vercel AI SDK](https://ai-sdk.dev/docs) - Streaming format

---

## Future Improvements

- [ ] Add conversation branching
- [ ] Support file attachments
- [ ] Add typing indicators

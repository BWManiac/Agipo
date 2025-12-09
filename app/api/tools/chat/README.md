# Tools Chat

> Enables testing custom tools via a simple chat interface.

**Endpoint:** `POST /api/tools/chat`  
**Auth:** None

---

## Purpose

Provides a simple chat endpoint for testing custom workflow tools. Unlike the agent chat which requires an agent configuration, this endpoint loads all available custom tools and makes them available to a basic LLM conversation. Useful for testing tools in isolation.

---

## Approach

We load all executable tools from the `_tables/tools/` directory, build a tool map, then use the Vercel AI SDK's `streamText` to have a conversation with tool access. The AI Gateway routes the request to the configured model.

---

## Pseudocode

```
POST(request): NextResponse
├── Parse messages from body
├── **Call `getExecutableTools()`** to load all custom tools
├── Build toolMap from tool definitions
├── Create AI Gateway client
├── **Call `streamText()`** with model, messages, tools
└── Return streaming text response
```

---

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messages` | Message[] | Yes | Conversation messages |

**Example Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Run the data analysis tool" }
  ]
}
```

---

## Output

Streaming text response in Vercel AI SDK format. The response streams token-by-token as the AI generates its response, allowing for real-time display in the UI.

**Response Format:**
- Content-Type: `text/plain; charset=utf-8`
- Streaming: Server-Sent Events (SSE) format
- Each chunk contains partial text that should be appended to display

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Tools Page | `app/(pages)/tools/page.tsx` | Tool testing interface |

---

## Related Docs

- Tools Runtime Service - `app/api/tools/services/runtime.ts`
- [Vercel AI SDK](https://ai-sdk.dev/docs) - Streaming format documentation
- [AI Gateway](https://ai-sdk.dev/docs/ai-gateway) - Model routing

---

## Notes

- Uses `maxDuration: 30` seconds for timeout
- Only loads custom tools from `_tables/tools/`, not connection tools
- Model is hardcoded to `google/gemini-3-pro-preview`
- This is a testing endpoint - for production agent chat, use `/api/workforce/[agentId]/chat`

---

## Future Improvements

- [ ] Add model selection parameter
- [ ] Include connection tools for testing
- [ ] Add tool execution logging
- [ ] Add conversation history persistence

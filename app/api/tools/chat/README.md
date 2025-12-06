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

Streaming text response in Vercel AI SDK format.

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| ToolsPage | `app/(pages)/tools/` | Tool testing interface |

---

## Notes

- Uses `maxDuration: 30` seconds
- Only loads custom tools, not connection tools
- Model hardcoded to `google/gemini-3-pro-preview`

---

## Future Improvements

- [ ] Add model selection
- [ ] Include connection tools for testing
- [ ] Add tool execution logging

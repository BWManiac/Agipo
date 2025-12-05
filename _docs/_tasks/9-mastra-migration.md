# Task 9: Migration from Vercel AI SDK to Mastra

**Status:** Phase 1 Complete  
**Date:** December 5, 2025  
**Priority:** High  
**Dependencies:** None (standalone migration)

### Implementation Notes (Added During Migration)

**Key Learnings:**
1. Use `format: 'aisdk'` in stream options for AI SDK v5 compatibility
2. Use `toUIMessageStreamResponse()` (not `toTextStreamResponse()`) for `useChat` hook compatibility
3. Existing `tool()` format from Vercel AI SDK works with Mastra agents - no tool migration needed for Phase 1
4. Mastra's model parameter accepts AI SDK model instances (e.g., `gateway("google/gemini-2.5-pro")`)

---

## 1. Executive Summary

This document outlines the migration strategy for replacing the **Vercel AI SDK Agent** (`Experimental_Agent`) with **Mastra** (`@mastra/core`). Mastra is a TypeScript-native framework built on top of the Vercel AI SDK, providing enhanced agent orchestration, memory management, RAG capabilities, and workflow graphs.

### Why Migrate?

| Concern | Vercel AI SDK | Mastra |
|---------|---------------|--------|
| Agent Status | `Experimental_Agent` (unstable) | First-class `Agent` class (stable) |
| Memory | DIY implementation | Built-in Memory API with PostgreSQL support |
| RAG | DIY implementation | Native RAG primitives (`.chunk()`, `.embed()`, `.query()`) |
| Workflows | Custom implementation | XState-based workflow engine |
| Dev Tools | None | Mastra Studio at `:4111` |
| Observability | DIY | Built-in telemetry |

### Strategic Alignment

Mastra aligns with Agipo's vision:
- **Multi-Agent Platform**: Dynamic agent instantiation for marketplace model
- **Records Integration**: RAG primitives can power agent-Records interaction
- **Composio Compatibility**: First-class MCP support for Composio tools

---

## 2. Current Architecture Summary

### 2.1 Agent Definition (`_tables/agents/*.ts`)

```typescript
export type AgentConfig = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: AgentStatus;
  systemPrompt: string;
  model: string;
  toolIds: string[];                        // Custom tools (workflows)
  connectionToolBindings?: ConnectionToolBinding[];  // Composio tools
  maxSteps?: number;
  // ... UI metadata (quickPrompts, objectives, guardrails, etc.)
};
```

### 2.2 Agent Runtime (`app/api/workforce/[agentId]/chat/route.ts`)

```typescript
import { Experimental_Agent as Agent, stepCountIs, validateUIMessages } from "ai";

const dynamicAgent = new Agent({
  model: agent.model,
  system: agent.systemPrompt,
  tools: toolMap,  // Merged custom + connection tools
  stopWhen: stepCountIs(agent.maxSteps ?? 3),
});

const response = await dynamicAgent.respond({ messages });
```

### 2.3 Tool System (`app/api/tools/services/runtime.ts`)

Two types of tools:

| Type | Source | Format | Example |
|------|--------|--------|---------|
| **Custom Tools** | `_tables/tools/*/tool.js` | `tool()` from `ai` | `workflow-hohoho` |
| **Connection Tools** | Composio SDK | Wrapped with `tool()` | `GMAIL_SEND_EMAIL` |

### 2.4 Frontend Chat (`app/(pages)/workforce/components/AgentChat.tsx`)

```typescript
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const { messages, sendMessage, status } = useChat({ transport });
```

---

## 3. Target Architecture with Mastra

### 3.1 Agent Definition (Updated)

```typescript
// lib/mastra/agents/factory.ts
import { Agent } from "@mastra/core/agent";

export function createAgentFromConfig(config: AgentConfig, tools: Record<string, Tool>) {
  return new Agent({
    name: config.id,
    instructions: config.systemPrompt,
    model: config.model,  // e.g., "google/gemini-2.5-pro"
    tools: tools,
  });
}
```

### 3.2 Mastra Instance

```typescript
// lib/mastra/index.ts
import { Mastra } from "@mastra/core/mastra";

export const mastra = new Mastra({
  // Agents registered dynamically at request time, not here
  // This provides shared config (logger, telemetry, storage)
});
```

### 3.3 Agent Runtime (Updated) ✅ IMPLEMENTED

```typescript
// app/api/workforce/[agentId]/chat/route.ts
import { Agent } from "@mastra/core/agent";
import { createGateway } from "@ai-sdk/gateway";
import { getAgentById } from "@/_tables/agents";

export async function POST(request: Request, { params }) {
  const { agentId } = await params;
  const config = getAgentById(agentId);
  
  // Resolve tools (custom + connection) - existing pattern works
  const tools = await resolveAgentTools(config, userId);
  
  // Create gateway for model routing (same as existing code)
  const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
  });
  
  // Create agent dynamically
  const agent = new Agent({
    name: config.id,
    instructions: config.systemPrompt,
    model: gateway(config.model),  // e.g., "google/gemini-2.5-pro"
    tools: tools,
  });
  
  // Stream response with AI SDK v5 format
  const result = await agent.stream(messages, {
    maxSteps: config.maxSteps ?? 5,
    format: 'aisdk',  // REQUIRED for AI SDK v5 compatibility
  });
  
  // Use toUIMessageStreamResponse for useChat hook compatibility
  return result.toUIMessageStreamResponse();
}
```

### 3.4 Tool System (Updated)

**Key Finding:** Existing `tool()` format from Vercel AI SDK works directly with Mastra agents! No migration required for Phase 1.

**Custom Tools** - Current format works as-is:

```typescript
// This WORKS with Mastra (no changes needed)
import { tool } from "ai";

export const workflowHohohoTool = tool({
  description: "...",
  inputSchema: z.object({ ... }),
  execute: async (input) => { ... },
});
```

**Optional Future Migration** - Mastra's `createTool()` format (Phase 2+):

```typescript
// Mastra-native format (optional, adds outputSchema)
import { createTool } from "@mastra/core/tools";

export const workflowHohohoTool = createTool({
  id: "workflow-hohoho",
  description: "...",
  inputSchema: z.object({ ... }),
  outputSchema: z.object({ ... }),  // NEW: explicit output
  execute: async ({ context }) => {
    const input = context;  // Different access pattern
    // ... logic
    return { ... };
  },
});
```

**Connection Tools** - Use Composio with MCP or direct integration:

```typescript
// Option A: Direct Composio (recommended for Phase 1)
import { Composio } from "@composio/core";

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
const tools = await composio.getTools({
  apps: ["gmail", "slack"],
  entityId: userId,
});

// Option B: Via MCP (future consideration)
import { MCPClient } from "@mastra/mcp";

const mcp = new MCPClient({
  servers: {
    composio: {
      url: new URL("https://mcp.composio.dev/gmail/[private-url-path]"),
    },
  },
});
const tools = await mcp.getTools();
```

---

## 4. Phase 1: Minimum Viable Migration

### 4.1 Goal

Replace the agent runtime with Mastra while maintaining **100% feature parity** with the current implementation. No new features (Memory, RAG) in Phase 1.

### 4.2 Acceptance Criteria

| # | Criterion | Verification | Status |
|---|-----------|--------------|--------|
| 1 | `@mastra/core` installed and importable | `npm ls @mastra/core` returns version | ✅ |
| 2 | Agent can be instantiated in API route | Server logs show agent creation | ✅ |
| 3 | Agent uses correct model from config | Check LLM provider in network tab | ✅ |
| 4 | Agent receives correct system prompt | Ask "what are your instructions?" | ✅ |
| 5 | Custom tools load correctly | Agent lists `workflow-*` tools | ⚠️ Pre-existing dynamic import issue |
| 6 | Connection tools (Composio) load correctly | Agent lists `GMAIL_*` tools | ✅ |
| 7 | Tool execution works (custom) | Test `workflow-hohoho` execution | ⚠️ Blocked by #5 |
| 8 | Tool execution works (connection) | Test `GMAIL_FETCH_EMAILS` | 🔲 To test |
| 9 | Streaming works to frontend | Chat UI shows progressive response | ✅ |
| 10 | Multi-turn conversation works | Agent maintains context across turns | 🔲 To test |

**Note:** Items 5 & 7 are blocked by a pre-existing issue with dynamic imports in Next.js Turbopack, not related to Mastra migration.

### 4.3 Files Modified

| File | Change | Status |
|------|--------|--------|
| `package.json` | Add `@mastra/core`, `@ai-sdk/google` | ✅ Done |
| `app/api/workforce/[agentId]/chat/route.ts` | Replace `Experimental_Agent` with Mastra `Agent` | ✅ Done |
| `app/api/tools/services/runtime.ts` | No changes needed - existing format works | ✅ N/A |
| `app/api/tools/services/transpiler.ts` | No changes needed for Phase 1 | ⏭️ Deferred |
| `_tables/tools/*/tool.js` | No regeneration needed | ⏭️ Deferred |
| `app/(pages)/workforce/components/AgentChat.tsx` | No changes needed | ✅ N/A |
| `CLAUDE.MD` | Updated with Mastra reference | ✅ Done |
| `proxy.ts` | Renamed from middleware.ts (Next.js 16 convention) | ✅ Done |

### 4.4 Files NOT to Modify (Phase 1)

- `_tables/agents/*.ts` - Keep existing config structure
- `app/api/connections/*` - Composio integration unchanged
- `app/(pages)/workforce/*` - UI unchanged (except AgentChat if needed)

---

## 5. Phase 2: Mastra-Native Features

### 5.1 Memory Integration

**Goal:** Replace manual conversation management with Mastra's Memory API.

```typescript
import { Memory } from "@mastra/memory";
import { PostgresStore } from "@mastra/pg";

const agent = new Agent({
  name: config.id,
  instructions: config.systemPrompt,
  model: config.model,
  tools: tools,
  memory: new Memory({
    storage: new PostgresStore({
      connectionString: process.env.DATABASE_URL!,
    }),
    options: {
      lastMessages: 10,
      semanticRecall: {
        topK: 3,
        messageRange: 5,
      },
    },
  }),
});
```

**Benefits:**
- Automatic conversation persistence
- Semantic search over past conversations
- Cross-session context (agent remembers user across chats)

### 5.2 RAG for Records

**Goal:** Enable agents to query Records using RAG.

```typescript
import { MDocument } from "@mastra/rag";
import { PgVector } from "@mastra/pg";

// When a Record table is updated:
const doc = MDocument.fromText(JSON.stringify(recordRows));
const chunks = await doc.chunk({ strategy: "recursive", size: 512 });
const { embeddings } = await embedMany({ values: chunks.map(c => c.text), model: embedder });
await pgVector.upsert({ indexName: `records-${tableId}`, vectors: embeddings });

// When agent needs to query:
const results = await pgVector.query({
  indexName: `records-${tableId}`,
  queryVector: await embed(userQuery),
  topK: 5,
});
```

**Use Case:** "What were the key themes from last month's stakeholder interviews?" → Agent queries Records table via RAG.

### 5.3 Workflow Integration

**Future:** Evaluate if Mastra's workflow graphs can complement or replace the WebContainer transpilation pipeline.

---

## 6. Tool Format Migration Reference

### 6.1 Vercel AI SDK → Mastra Mapping

| Vercel AI SDK | Mastra | Notes |
|---------------|--------|-------|
| `tool()` | `createTool()` | Different import |
| `inputSchema` | `inputSchema` | Same (Zod) |
| N/A | `outputSchema` | NEW: explicit output schema |
| `execute: async (input) => {}` | `execute: async ({ context }) => {}` | Input access changes |
| Return value | Return value | Must match `outputSchema` |

### 6.2 Transpiler Update

The `transpileWorkflowToTool()` function in `transpiler.ts` needs to generate:

```javascript
// BEFORE
import { tool } from "ai";

export const workflowHohohoTool = tool({
  description: "...",
  inputSchema: Schema,
  execute: async (input) => {
    const { field } = input;
    // ...
    return result;
  },
});

// AFTER
import { createTool } from "@mastra/core/tools";

export const workflowHohohoTool = createTool({
  id: "workflow-hohoho",
  description: "...",
  inputSchema: Schema,
  outputSchema: OutputSchema,
  execute: async ({ context }) => {
    const { field } = context;
    // ...
    return result;
  },
});
```

---

## 7. Composio Integration Strategy

### 7.1 Current State

```typescript
// app/api/tools/services/runtime.ts
const vercelTool = tool({
  description: toolDescription,
  inputSchema: zodSchema,
  execute: async (input) => {
    const result = await client.tools.execute(binding.toolId, {
      userId,
      arguments: input,
      connectedAccountId: binding.connectionId,
    });
    return result;
  },
});
```

### 7.2 Mastra Integration Options

**Option A: Direct Composio SDK (Recommended for Phase 1)**

Continue using `@composio/core` directly. According to [Composio's Mastra docs](https://docs.composio.dev/providers/mastra), Composio tools work directly with Mastra agents.

```typescript
import { Composio } from "@composio/core";

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
const composioTools = await composio.getTools({
  tools: config.connectionToolBindings.map(b => b.toolId),
  entityId: userId,
});

const agent = new Agent({
  name: config.id,
  instructions: config.systemPrompt,
  model: config.model,
  tools: { ...customTools, ...composioTools },
});
```

**Option B: Via MCP (Future)**

Use Mastra's `MCPClient` to connect to Composio as an MCP server:

```typescript
import { MCPClient } from "@mastra/mcp";

const mcp = new MCPClient({
  servers: {
    composio: {
      url: new URL(`https://mcp.composio.dev/gmail/${process.env.COMPOSIO_URL_PATH}`),
    },
  },
});

const tools = await mcp.getTools();
```

### 7.3 Connection Tool Binding

The existing `ConnectionToolBinding` type remains valid:

```typescript
type ConnectionToolBinding = {
  toolId: string;        // e.g., "GMAIL_SEND_EMAIL"
  connectionId: string;  // e.g., "ca_wudNUwXqrbtx"
  toolkitSlug: string;   // e.g., "gmail"
};
```

When loading tools, we'll pass the `connectionId` to Composio's execute method.

---

## 8. Next.js Integration Confirmation

Based on [Mastra's documentation](https://mastra.ai/docs/agents/overview), Mastra agents can be used directly in Next.js API routes.

**Key Insight:** We do NOT need to run `mastra dev` or the Mastra server. We can import `@mastra/core` directly into our Next.js app.

### 8.1 Streaming Response Methods

Per [Mastra Streaming Docs](https://mastra.ai/docs/streaming/overview), when using `format: 'aisdk'`, the stream result (`AISDKV5OutputStream`) has multiple response methods:

| Method | Use Case | Works with `useChat`? |
|--------|----------|----------------------|
| `toTextStreamResponse()` | Simple text streaming | ❌ No |
| `toUIMessageStreamResponse()` | AI SDK React hooks | ✅ Yes |
| `textStream` (async iterator) | Manual iteration | N/A |

**For `@ai-sdk/react` `useChat` hook, always use `toUIMessageStreamResponse()`.**

### 8.2 Working Example

```typescript
// app/api/chat/route.ts
import { Agent } from "@mastra/core/agent";
import { createGateway } from "@ai-sdk/gateway";

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });
  
  const agent = new Agent({
    name: "my-agent",
    instructions: "...",
    model: gateway("google/gemini-2.5-pro"),
    tools: { ... },
  });
  
  const result = await agent.stream(messages, {
    format: 'aisdk',  // Required for AI SDK v5
  });
  
  return result.toUIMessageStreamResponse();  // For useChat compatibility
}
```

---

## 9. Custom Tools vs Connection Tools Distinction

### 9.1 Current Model

```typescript
// Agent config has two separate arrays:
toolIds: string[];                        // Custom tools (workflow-*)
connectionToolBindings: ConnectionToolBinding[];  // Composio tools
```

### 9.2 Recommended Model (Preserve Distinction)

```typescript
// Keep the distinction at config level
type AgentConfig = {
  // ...
  capabilities: {
    customToolIds: string[];              // workflow-* tools
    connectionToolBindings: ConnectionToolBinding[];  // Composio tools
  };
};

// Merge at runtime for agent instantiation
async function resolveAgentTools(config: AgentConfig, userId: string) {
  // Load custom tools
  const customTools = await loadCustomTools(config.capabilities.customToolIds);
  
  // Load connection tools
  const connectionTools = await loadConnectionTools(
    userId,
    config.capabilities.connectionToolBindings
  );
  
  // Return merged (Mastra expects a flat object)
  return { ...customTools, ...connectionTools };
}
```

**Why preserve the distinction?**
1. UI shows them separately (Custom Tools vs Connection Tools)
2. Connection tools require user context (OAuth)
3. Custom tools are user-authored code
4. Different management workflows in the Capabilities tab

---

## 10. Implementation Roadmap

### Phase 1: Foundation ✅ COMPLETE (Dec 5, 2025)

- [x] Install `@mastra/core` and verify import works
- [x] Spike: Create test agent in API route, verify `.generate()` works
- [x] Verify Composio tools work with Mastra agent
- [x] Refactor `app/api/workforce/[agentId]/chat/route.ts`
- [x] Verify streaming works with `useChat` hook
- [x] Update CLAUDE.MD with Mastra reference

**Key Discoveries:**
- No need for `lib/mastra/index.ts` - agent created inline per request
- Existing `tool()` format from AI SDK works directly
- Must use `format: 'aisdk'` + `toUIMessageStreamResponse()` for frontend

### Next Steps: Remaining Phase 1 Items

- [ ] Test connection tool execution (GMAIL_FETCH_EMAILS)
- [ ] Test multi-turn conversation
- [ ] Fix pre-existing dynamic import issue for custom tools (separate task)

### Future: Phase 2

- [ ] Evaluate Memory API integration
- [ ] Explore RAG for Records domain
- [ ] Consider MCP for Composio (if beneficial)
- [ ] Evaluate Mastra workflows for custom tool orchestration
- [ ] Optional: Migrate transpiler to `createTool()` format

---

## 11. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mastra breaks streaming | High | Test early; have rollback plan |
| Composio incompatibility | High | Test Composio SDK with Mastra in spike |
| Tool format changes break existing tools | Medium | Keep old format support during transition |
| Frontend `useChat` incompatibility | Medium | Mastra uses same response format |
| Dynamic agent instantiation issues | Medium | Test multi-agent scenarios |

---

## 12. Success Metrics

1. **Functional Parity**: All 10 acceptance criteria pass
2. **No Regressions**: Existing chat functionality works identically
3. **Code Quality**: No `Experimental_Agent` imports remain
4. **Documentation**: CLAUDE.MD and diary updated

---

## 13. References

### Mastra Documentation
- [Agents Overview](https://mastra.ai/docs/agents/overview)
- [Using Tools](https://mastra.ai/docs/agents/using-tools)
- [MCP Overview](https://mastra.ai/docs/mcp/overview)
- [Memory with PostgreSQL](https://mastra.ai/docs/memory/storage/memory-with-pg)
- [RAG Overview](https://mastra.ai/docs/rag/overview)
- [Building/Deployment](https://mastra.ai/docs/deployment/building-mastra)

### Mastra Blog
- [Using AI SDK with Mastra](https://mastra.ai/blog/using-ai-sdk-with-mastra)
- [Mastra MCP](https://mastra.ai/blog/mastra-mcp)

### Composio
- [Mastra Provider Docs](https://docs.composio.dev/providers/mastra)

### Agipo Internal
- [Diary 08: Agent SDK Spike](/_docs/_diary/08-AgentSDKSpike.md)
- [Diary 17: Connection Tools Integration](/_docs/_diary/17-ConnectionToolsIntegration.md)
- [Feature: Agents Architecture](/_docs/Product/Features/03-Agents-Architecture.md)
- [Feature: Integrations Platform](/_docs/Product/Features/04-Integrations-Platform.md)
- [Architecture: Hybrid Capability System](/_docs/Architecture/Hybrid-Capability-System.md)

---

## 14. Appendix: Code Snippets

### A. Working Implementation (Actual Code)

```typescript
// app/api/workforce/[agentId]/chat/route.ts
import { Agent } from "@mastra/core/agent";
import { createGateway } from "@ai-sdk/gateway";
import type { Tool } from "ai";

export async function POST(request: Request, routeContext) {
  const { agentId } = await routeContext.params;
  const agentConfig = getAgentById(agentId);
  
  // Build tool map (existing pattern - works as-is)
  const toolMap: Record<string, Tool<unknown, unknown>> = {};
  // ... load custom tools and connection tools ...
  
  // Create gateway for model routing
  const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
  });
  
  // Create Mastra agent
  const dynamicAgent = new Agent({
    name: agentConfig.id,
    instructions: agentConfig.systemPrompt,
    model: gateway(agentConfig.model),
    tools: toolMap,
  });
  
  // Format messages and stream
  const result = await dynamicAgent.stream(formattedMessages, {
    maxSteps: agentConfig.maxSteps ?? 5,
    format: 'aisdk',  // CRITICAL: Required for AI SDK v5
  });
  
  // Return response compatible with useChat hook
  return result.toUIMessageStreamResponse();  // NOT toTextStreamResponse()
}
```

### B. Simple Test Agent (Non-streaming)

```typescript
// For simple testing without streaming
import { Agent } from "@mastra/core/agent";
import { createGateway } from "@ai-sdk/gateway";

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });

const agent = new Agent({
  name: "test-agent",
  instructions: "You are a helpful assistant.",
  model: gateway("google/gemini-2.5-pro"),
});

const response = await agent.generate("Hello!");
console.log(response.text);
```

### B. Custom Tool in Mastra Format

```typescript
// lib/mastra/tools/example.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const exampleTool = createTool({
  id: "example-tool",
  description: "An example tool that echoes input",
  inputSchema: z.object({
    message: z.string().describe("The message to echo"),
  }),
  outputSchema: z.object({
    echo: z.string(),
  }),
  execute: async ({ context }) => {
    return { echo: `Echo: ${context.message}` };
  },
});
```

### C. Agent with Tools

```typescript
// lib/mastra/agents/with-tools.ts
import { Agent } from "@mastra/core/agent";
import { exampleTool } from "../tools/example";

export const agentWithTools = new Agent({
  name: "agent-with-tools",
  instructions: "You are a helpful assistant with access to tools.",
  model: "google/gemini-2.5-pro",
  tools: { exampleTool },
});
```


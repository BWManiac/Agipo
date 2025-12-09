# Chat Service

> Orchestrates agent configuration, capability assembly, and message preparation for AI-powered conversations.

**Service:** `chat-service.ts`  
**Domain:** Workforce / Agent Runtime

---

## Purpose

This service handles the core business logic for preparing AI agents to have conversations with users. It's responsible for loading agent configurations, assembling their capabilities (custom tools, connection tools, and workflows), formatting messages, and creating fully configured Mastra agent instances ready for streaming. Without this service, agents wouldn't know what tools they can use or how to process user messages.

**Product Value:** Enables the "hybrid capability system" where agents seamlessly use both user-created workflows and third-party integrations (Gmail, Slack, etc.) in a single conversation. This is what makes agents feel powerful and capable rather than limited to pre-defined actions.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `loadAgentConfig()` | Retrieves an agent's complete configuration from the registry, including system prompt, model selection, and assigned capabilities. | First step: Get agent's personality and assigned capabilities |
| `buildToolMap()` | Aggregates all agent capabilities into a unified tool map by loading custom tools, connection tools, and workflow tools from their respective sources. | Before chat: Combine custom tools, connection tools, and workflows |
| `formatMessages()` | Normalizes message formats from the frontend into the simple role/content structure that Mastra agents expect, handling both string content and structured parts arrays. | Before chat: Convert frontend messages to agent-expected format |
| `createConfiguredAgent()` | Instantiates a fully configured Mastra Agent instance with instructions, model gateway, unified tool map, and memory system. | Final step: Create agent instance with all configuration |

---

## Usage Flow

```
1. Route receives chat request
2. Route calls loadAgentConfig() → Gets agent personality/capabilities list
3. Route calls buildToolMap() → Gets executable tools for those capabilities
4. Route calls formatMessages() → Normalizes user input
5. Route calls createConfiguredAgent() → Gets configured agent instance
6. Route calls agent.stream() → Conversation begins
```

---

## Approach

The service follows a clear separation of concerns: configuration loading, tool aggregation, message normalization, and agent instantiation are all distinct operations. It acts as an orchestrator that combines data from multiple sources (agent registry, tools domain, connections domain) into a unified agent runtime. The service is stateless - each function call produces results based on inputs, making it easy to test and reason about.

**Key Pattern:** The service builds a unified "tool map" that merges three capability types (custom tools, connection tools, workflows) into a single dictionary. This unified interface is what the Mastra Agent framework expects, abstracting away the complexity of where tools come from.

---

## Public API

### `loadAgentConfig(agentId?: string): AgentConfig | null`

**What it does:** Retrieves an agent's configuration from the registry, including its system prompt, model selection, and assigned capabilities.

**Product Impact:** This is the first step in any agent conversation - users must be able to select and load any agent they've created or hired from the marketplace. If an agent config can't be loaded, the conversation can't start.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | No | Agent identifier. If not provided, defaults to `"pm"` (useful for fallback scenarios) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | `AgentConfig \| null` | Agent configuration object if found, `null` if agent doesn't exist |

---

### `buildToolMap(userId: string, agentConfig: AgentConfig): Promise<Record<string, Tool>>`

**What it does:** Aggregates all tools an agent can use into a single map. Combines custom tools (from Tools domain), connection tools (from user's connected accounts), and workflow tools (multi-step processes).

**Product Impact:** This is the heart of the "hybrid capability system." Users don't need to think about whether a capability comes from a workflow they built or a Gmail integration - to the agent, they're all just "tools." This enables powerful agents that can orchestrate complex tasks using both custom logic and external services.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | Authenticated user's ID (used for scoping connection tools) |
| `agentConfig` | AgentConfig | Yes | Agent configuration containing tool IDs and bindings |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | `Promise<Record<string, Tool>>` | Map of tool IDs to executable Vercel AI SDK Tool instances |

**Process:**

```
buildToolMap(userId, agentConfig): Promise<ToolMap>
├── Initialize empty toolMap
├── **For each toolId in agentConfig.toolIds:**
│   ├── **Call `getExecutableToolById(toolId)`**
│   ├── If found: Add to toolMap
│   └── If not found: Log warning, continue
├── **For each binding in agentConfig.connectionToolBindings:**
│   ├── **Call `getConnectionToolExecutable(userId, binding)`**
│   ├── If found: Add to toolMap
│   └── If not found: Log warning, continue
├── **For each binding in agentConfig.workflowBindings:**
│   ├── **Call `getWorkflowToolExecutable(userId, binding)`**
│   ├── If found: Add to toolMap
│   └── If not found: Log warning, continue
└── Return unified toolMap
```

**Error Handling:** If a tool fails to load, it logs a warning and continues. The agent can still function with available tools rather than failing entirely.

---

### `formatMessages(messages: IncomingMessage[], context?: string): FormattedMessage[]`

**What it does:** Normalizes message formats from the frontend into the simple role/content format that Mastra agents expect.

**Product Impact:** The frontend may send messages in different formats (especially as we evolve the UI). This function ensures the agent always receives messages in a consistent, predictable format. The optional context parameter allows prepending system-level context without modifying user messages.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `messages` | IncomingMessage[] | Yes | Raw messages from frontend (supports both string content and parts arrays) |
| `context` | string | No | Optional system-level context to prepend as a system message |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | FormattedMessage[] | Array of formatted messages with `role` and `content` properties only |

**Process:**

```
formatMessages(messages, context?): FormattedMessage[]
├── Initialize empty formattedMessages array
├── **If context provided:**
│   └── Add system message with context content
├── **For each message in messages:**
│   ├── Extract content:
│   │   ├── If message.content is string: Use directly
│   │   └── If message.parts exists: Filter text parts, join
│   ├── **If content extracted:**
│   │   └── Add { role, content } to formattedMessages
│   └── **If no content:** Skip message (filtered out)
└── Return formattedMessages
```

---

### `createConfiguredAgent(userId: string, agentConfig: AgentConfig, toolMap: Record<string, Tool>): Agent`

**What it does:** Instantiates a fully configured Mastra Agent instance with the agent's instructions, model selection, tool capabilities, and memory system.

**Product Impact:** This is the final step before conversation begins. The agent instance has everything it needs to understand what it should do (instructions), what it can do (tools), and how to remember past conversations (memory). This is where the agent "comes to life" with all its configured personality and capabilities.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | Authenticated user's ID |
| `agentConfig` | AgentConfig | Yes | Agent configuration (instructions, model, etc.) |
| `toolMap` | Record<string, Tool> | Yes | Unified tool map built by `buildToolMap()` |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Agent | Ready-to-use Mastra Agent instance that can stream responses |

**Process:**

```
createConfiguredAgent(userId, agentConfig, toolMap): Agent
├── **Call `createGateway()`** with AI_GATEWAY_API_KEY
├── **Call `getAgentMemory(agentConfig.id)`** for memory instance
├── **Create new Agent** with:
│   ├── name: agentConfig.id
│   ├── instructions: agentConfig.systemPrompt
│   ├── model: gateway(agentConfig.model)
│   ├── tools: toolMap
│   └── memory: memoryInstance
└── Return configured Agent
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `@/_tables/agents` | Agent configuration registry |
| `@/app/api/tools/services` | Custom tool and connection tool loading |
| `@/app/api/tools/services/workflow-tools` | Workflow tool loading |
| `./memory` | Agent memory instance provider |
| `@mastra/core/agent` | Agent framework |
| `@ai-sdk/gateway` | LLM gateway configuration |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Chat Route | `app/api/workforce/[agentId]/chat/route.ts` | Primary consumer - orchestrates all service functions |

---

## Design Decisions

### Why separate tool loading into one function?

**Decision:** `buildToolMap()` loads all three tool types in sequence rather than having separate functions.

**Rationale:** Agents need all their tools in one map for the Mastra framework. The unified loading makes it clear that custom tools, connection tools, and workflows are all equal "capabilities" from the agent's perspective. This reinforces the product vision of a hybrid capability system.

### Why format messages separately?

**Decision:** Message formatting is a separate function rather than inline in the route.

**Rationale:** Message formats may evolve as the UI evolves. By isolating formatting logic, we can adapt to new frontend message structures without changing route code. Also enables testing message transformations independently.

### Why default to "pm" agent?

**Decision:** `loadAgentConfig()` defaults to `"pm"` if no agentId provided.

**Rationale:** Provides a fallback for development and testing scenarios. In production, routes should always provide explicit agent IDs, but having a sensible default prevents errors during development.

---

## Error Handling

The service follows a "graceful degradation" philosophy:

- **Missing tools:** Logged as warnings, agent continues with available tools
- **Missing agent config:** Returns `null`, route handles 404 response
- **Invalid messages:** Empty messages filtered out, formatted array may be smaller than input

This ensures conversations can continue even if some capabilities are unavailable.

---

## Related Docs

- [Agent Chat Route README](../README.md) - How the service is used by the route
- [Mastra Agent Documentation](https://mastra.ai/docs/agents) - Agent framework details
- [Hybrid Capability System](../../../../DOMAIN_PRINCIPLES.md#9-builder-vs-runtime-distinction) - Product vision for tool unification

---

## Future Improvements

- [ ] Add tool validation before adding to map (prevent invalid tools from breaking agents)
- [ ] Add metrics/logging for tool loading performance
- [ ] Support tool filtering based on user permissions
- [ ] Add caching for frequently-loaded agent configs
- [ ] Support dynamic tool discovery (agents that can find new tools at runtime)


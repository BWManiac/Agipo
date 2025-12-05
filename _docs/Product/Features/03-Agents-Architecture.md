# Feature: Agents (The Workforce Operating System)

**Status:** Active (Mastra Migration Complete - Phase 1)  
**Date:** December 5, 2025  
**Owner:** Engineering  
**Dependencies:** `06-Tools-vs-Workflows`, `04-Integrations-Platform`

---

## 1. Philosophy: The Workforce OS

We are building Agipo as a **Workforce Operating System**. In this paradigm, an Agent is not a transient LLM session but a persistent **Digital Employee**.

This shift requires treating Agents with the same structural rigor as human employees. They are not just "prompted"; they are **Hired**, **Onboarded**, **Managed**, and **Evaluated**.

### The Employee Metaphor

| Human Employee | Agipo Agent |
|:---|:---|
| **Role & Resume** | **Identity & Config** (System Prompt, Model, Persona) |
| **Knowledge Base** | **Memory** (Conversations, Working Memory, Records) |
| **Skills & Access** | **Capabilities** (Tools, Workflows, Integrations) |
| **Calendar** | **Planner** (Scheduled Jobs, Event Triggers) |
| **OKRs / KPIs** | **Directives** (Objectives, Guardrails) |
| **Performance Review** | **Feedback Loop** (Task Evaluation, Optimization) |

---

## 2. Technical Foundation: Mastra

As of Task 9, Agipo agents are powered by **[Mastra](https://mastra.ai)**, a TypeScript-native framework built on the Vercel AI SDK.

### Why Mastra?

| Capability | Benefit |
|------------|---------|
| **Agent Class** | Standard primitives for agent definition |
| **Memory API** | Built-in conversation persistence & working memory |
| **Workflow System** | Native support for complex tool orchestration |
| **AI SDK Compatibility** | Works with existing `@ai-sdk/react` frontend |
| **Tool Format** | Compatible with existing Composio integration |

### Agent Instantiation

```typescript
import { Agent } from "@mastra/core/agent";
import { getAgentMemory } from "./services/memory";

// Dynamic agent creation from config
const agent = new Agent({
  name: config.name,
  instructions: buildSystemPrompt(config),
  model: aiGateway(config.model),
  tools: await loadAgentTools(config),
  memory: getAgentMemory(config.id),
});

// Stream conversation with memory
const response = await agent.stream(messages, {
  threadId,
  resourceId: userId,
});
```

---

## 3. Core Primitives

The Agent architecture is built upon six foundational primitives—the atomic units of the Workforce OS.

### 3.1 Identity (Who)

The static definition of the agent.

| Component | Description | Storage |
|-----------|-------------|---------|
| **Persona** | Name, Avatar, Role | `_tables/agents/[id].ts` |
| **Model** | LLM provider and model | `config.model` |
| **System Prompt** | Base instructions | `config.systemPrompt` |
| **Variables** | User-defined env vars | `config.variables` |

```typescript
interface AgentIdentity {
  id: string;
  name: string;           // "Mira Patel"
  role: string;           // "Product Manager"
  avatar: string;         // Emoji or image URL
  model: string;          // "google:gemini-2.5-pro"
  systemPrompt: string;   // Base instructions
  variables: Record<string, string>;
}
```

### 3.2 Memory (What They Know) — ✅ Implemented

The stateful context the agent accesses. Powered by **Mastra Memory API**.

| Memory Type | Scope | Purpose | Status |
|-------------|-------|---------|--------|
| **Conversations** | Per-thread | Recent message history | ✅ Implemented |
| **Working Memory** | Per-user | Structured knowledge about user | ✅ Implemented |
| **Semantic Recall** | Per-user | Vector search for relevant context | 🔜 Phase 9.1f |
| **Records** | Per-agent | Structured data access | 🔜 Phase 10 |

**Implementation Details:**

```typescript
// Storage: SQLite per agent
// Location: _tables/agents/[agentId]/memory.db

const memory = new Memory({
  storage: new LibSQLStore({
    url: `file:_tables/agents/${agentId}/memory.db`,
  }),
  options: {
    lastMessages: 10,              // Keep 10 messages in context
    workingMemory: {
      enabled: true,
      scope: "resource",           // Per-user
      schema: workingMemorySchema, // Zod schema
    },
    threads: {
      generateTitle: true,         // Auto-title from first message
    },
  },
});
```

**Working Memory Schema:**

```typescript
const workingMemorySchema = z.object({
  communicationPreferences: z.object({
    style: z.enum(["formal", "casual", "technical"]).optional(),
    responseLength: z.enum(["concise", "detailed"]).optional(),
    formatPreference: z.enum(["paragraphs", "bullets", "mixed"]).optional(),
  }).optional(),
  
  activeProjects: z.array(z.object({
    name: z.string(),
    status: z.enum(["active", "blocked", "completed"]).optional(),
    notes: z.string().optional(),
  })).optional(),
  
  keyContext: z.array(z.string()).optional(),
  
  recentDecisions: z.array(z.object({
    decision: z.string(),
    date: z.string().optional(),
  })).optional(),
});
```

### 3.3 Capabilities (What They Do) — ✅ Partial

The executable logic assigned to the agent.

| Capability Type | Description | Status |
|-----------------|-------------|--------|
| **Composio Tools** | Third-party integrations | ✅ Implemented |
| **Custom Tools** | User-created code | 🔧 Needs refactor |
| **Workflows** | Multi-step orchestrations | 🔜 Task 10 |
| **Browser Tools** | Web automation | 🔜 Task 10 |

**See:** `06-Tools-vs-Workflows.md` for detailed distinction.

```typescript
interface AgentCapabilities {
  // Atomic tools
  toolIds: string[];              // Custom tool IDs
  connectionToolBindings: Array<{
    toolName: string;             // e.g., "GMAIL_SEND_EMAIL"
    connectionId: string;
  }>;
  
  // Composed workflows
  workflowIds: string[];
}
```

### 3.4 Planner (When They Act)

The temporal dimension of the agent. Agents don't just react; they initiate.

| Trigger Type | Description | Status |
|--------------|-------------|--------|
| **Scheduled Jobs** | Time-based execution | 🔜 Future |
| **Event Triggers** | Data-driven execution | 🔜 Future |

```typescript
interface AgentPlanner {
  jobs: Array<{
    id: string;
    schedule: string;           // Cron expression
    action: "chat" | "workflow";
    config: any;
  }>;
  triggers: Array<{
    id: string;
    event: string;              // e.g., "gmail.new_email"
    condition?: Record<string, any>;
    action: "chat" | "workflow";
    config: any;
  }>;
}
```

### 3.5 Directives (Why They Act)

The high-level guidance system.

| Directive Type | Purpose | Example |
|----------------|---------|---------|
| **Objectives** | Positive constraints | "Keep responses concise" |
| **Guardrails** | Negative constraints | "Never share PII" |

```typescript
interface AgentDirectives {
  objectives: string[];   // What success looks like
  guardrails: string[];   // What is forbidden
}
```

### 3.6 Feedback (How They Improve)

The optimization loop.

| Feedback Type | Description | Status |
|---------------|-------------|--------|
| **Task Review** | Input/output inspection | 🔜 Future |
| **Correction** | User-provided refinement | 🔜 Future |
| **Evaluation** | Automated quality scoring | 🔜 Future |

---

## 4. UX Architecture: The Agent Modal

The Agent interaction model is centralized in a unified modal, designed as a Manager's Dashboard.

### Tab Structure

| Tab | Purpose | Status |
|-----|---------|--------|
| **Overview** | Quick status and recent activity | ✅ Implemented |
| **Chat** | Conversation interface with thread management | ✅ Implemented |
| **Tasks** | Execution history and audit | 🔜 Future |
| **Planner** | Scheduled jobs and triggers | 🔜 Future |
| **Records** | Assigned data tables | 🔜 Future |
| **Knowledge** | Working memory display | ✅ Implemented |
| **Capabilities** | Tools and workflows | 🔜 Needs update |
| **Config** | Identity and directives | ✅ Implemented |

### Chat Tab Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CHAT TAB                                        │
│                                                                          │
│  ┌──────────────┐  ┌──────────────────────────────────────────────────┐ │
│  │   THREADS    │  │              CONVERSATION AREA                   │ │
│  │   SIDEBAR    │  │                                                  │ │
│  │              │  │  ┌─────────────────────────────────────────────┐ │ │
│  │ + New        │  │  │            THREAD HEADER                    │ │ │
│  │              │  │  │  "Discussing Q4 roadmap..."         [Edit]  │ │ │
│  │ • Thread 1   │  │  └─────────────────────────────────────────────┘ │ │
│  │   Thread 2   │  │                                                  │ │
│  │   Thread 3   │  │  ┌─────────────────────────────────────────────┐ │ │
│  │              │  │  │            MESSAGES                         │ │ │
│  │              │  │  │  🧑 User: "What's the status?"              │ │ │
│  │              │  │  │  🤖 Agent: "Here's the update..."           │ │ │
│  │              │  │  └─────────────────────────────────────────────┘ │ │
│  │              │  │                                                  │ │
│  │              │  │  ┌─────────────────────────────────────────────┐ │ │
│  │              │  │  │            INPUT                            │ │ │
│  │              │  │  │  [Message Mira...]                   [Send] │ │ │
│  └──────────────┘  │  └─────────────────────────────────────────────┘ │ │
│                    └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

**Components:**
- `ThreadSidebar` - Lists conversations, new/delete actions
- `ThreadHeader` - Shows/edits thread title
- `ChatArea` - Messages display using AI Elements
- `useChatMemory` - Hook integrating useChat with Mastra memory

### Knowledge Tab Architecture

Displays the agent's working memory in a structured format:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        KNOWLEDGE TAB                                     │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Communication Preferences                                          │ │
│  │  ├─ Style: Technical                                               │ │
│  │  ├─ Length: Detailed                                               │ │
│  │  └─ Format: Bullets                                                │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Active Projects                                                    │ │
│  │  ├─ Resume Agent MVP (Active)                                      │ │
│  │  └─ Mastra Migration (Completed)                                   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Key Context                                                        │ │
│  │  • User prefers TypeScript over JavaScript                         │ │
│  │  • Working on job application platform                             │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│                                           [Clear All Memory]            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Model: AgentConfig

```typescript
// _tables/types.ts
export interface AgentConfig {
  // Identity
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "active" | "paused" | "draft";
  highlight?: string;           // Greeting/intro message
  
  // Model Configuration
  model: string;                // "google:gemini-2.5-pro"
  systemPrompt?: string;
  variables?: Record<string, string>;
  
  // Capabilities
  toolIds: string[];            // Custom tool IDs
  connectionToolBindings: ConnectionToolBinding[];
  workflowIds?: string[];
  
  // Directives
  directives?: {
    objectives: string[];
    guardrails: string[];
  };
  
  // Planner (Future)
  planner?: {
    jobs: ScheduledJob[];
    triggers: EventTrigger[];
  };
  
  // Memory (Future)
  memory?: {
    tableIds: string[];         // Assigned records
  };
}

export interface ConnectionToolBinding {
  toolName: string;             // e.g., "GMAIL_SEND_EMAIL"
  connectionId: string;         // Composio connection ID
  description?: string;
}
```

---

## 6. API Architecture

### Chat API

```
POST /api/workforce/[agentId]/chat
Body: { messages, threadId?, context? }
Response: Streaming AI SDK response
Headers: X-Thread-Id (for new threads)
```

### Thread Management APIs

```
GET    /api/workforce/[agentId]/threads         # List threads
POST   /api/workforce/[agentId]/threads         # Create thread
GET    /api/workforce/[agentId]/threads/[id]    # Get thread + messages
PATCH  /api/workforce/[agentId]/threads/[id]    # Rename thread
DELETE /api/workforce/[agentId]/threads/[id]    # Delete thread
```

### Knowledge API

```
GET    /api/workforce/[agentId]/knowledge       # Get working memory
DELETE /api/workforce/[agentId]/knowledge       # Clear working memory
```

---

## 7. Implementation Status

### Completed (Task 9.1)

- ✅ Mastra Agent integration
- ✅ Composio tools working
- ✅ Memory persistence (LibSQL)
- ✅ Thread management UI
- ✅ Working memory display (Knowledge tab)
- ✅ Thread CRUD APIs

### In Progress (Task 10)

- 🔧 Tool Builder refactor
- 🔧 Workflow Builder alignment
- 🔧 Browser automation spike

### Future

- 📋 Records integration (agent access to tables)
- 📋 Planner (scheduled jobs, triggers)
- 📋 Feedback loop (task review, correction)
- 📋 Semantic recall (vector search)

---

## 8. References

- Task 9: Mastra Migration (`_docs/_tasks/9-mastra-migration.md`)
- Task 9.1: Memory Integration (`_docs/_tasks/9.1-mastra-memory-integration.md`)
- Task 10: Platform Evolution (`_docs/_tasks/10-platform-evolution.md`)
- Diary 18: Memory Integration (`_docs/_diary/18-MastraMemoryIntegration.md`)
- [Mastra Documentation](https://mastra.ai/docs)
- [Mastra Memory API](https://mastra.ai/docs/memory/overview)

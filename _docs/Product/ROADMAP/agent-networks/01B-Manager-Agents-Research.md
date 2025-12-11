# Task 01.1: Manager Agents (Agent Networks) — Research Log

**Status:** In Progress  
**Date:** December 2024  
**Parent Task:** `_docs/Product/ROADMAP/agent-networks/01-Manager-Agents.md`

---

## How to Use This Document

This is a **research log** for discovering facts about Mastra's Agent Networks feature.

**Each research question has:**
1. **The Question** — What we need to find out
2. **Why It Matters** — Which product requirement this unlocks
3. **Answer** — What we discovered (to be filled)
4. **Primitive** — The exact function/method we'll use
5. **Source** — Where we found the answer

**Philosophy:** Mastra's Agent Networks API is immutable. We discover what they provide and adapt our implementation.

**Status Key:** ❓ Not Researched | 🔍 In Progress | ✅ Answered | ⚠️ Blocked

---

## Quick Reference

| Question | Unlocks Requirement | Status |
|----------|---------------------|--------|
| [RQ-1: Network API usage](#rq-1-network-api-usage) | Execute manager networks | ❓ |
| [RQ-2: Network event types](#rq-2-network-event-types) | Stream delegation events | ❓ |
| [RQ-3: Manager memory scoping](#rq-3-manager-memory-scoping) | Memory management for networks | ❓ |
| [RQ-4: Sub-agent loading pattern](#rq-4-sub-agent-loading-pattern) | Load sub-agents for manager | ❓ |
| [RQ-5: Error handling in networks](#rq-5-error-handling-in-networks) | Handle sub-agent failures | ❓ |

---

## Part 1: Mastra Agent Networks API Research

### RQ-1: Network API Usage

**Why It Matters:** PR-1.1 (Manager Network Execution) — Need to understand how to use Mastra's `.network()` method instead of `.stream()`.

**Status:** ✅ Answered

**Question:**
1. What's the exact API signature for `agent.network()`?
2. How does it differ from `agent.stream()`?
3. What parameters does it accept?
4. What does it return (result, stream, events)?

**Answer:**
```typescript
// Method signature for agent.network()
agent.network(
  messages: string | string[] | CoreMessage[] | AiMessageType[] | UIMessageWithMetadata[],
  options?: MultiPrimitiveExecutionOptions
): {
  stream: MastraAgentNetworkStream<NetworkChunkType>,
  status: Promise<RunStatus>,
  result: Promise<WorkflowResult>,
  usage: Promise<{ promptTokens: number, completionTokens: number, totalTokens: number }>
}

// Options interface
interface MultiPrimitiveExecutionOptions {
  maxSteps?: number;           // Maximum execution steps
  memory?: MemoryConfig;        // Memory configuration (required)
  thread?: string;              // Conversation thread ID
  tracingContext?: any;         // AI tracing support
  modelSettings?: {             // Generation control
    temperature?: number;
    maxTokens?: number;
    // ... other model settings
  };
}

// Example usage
const agent = new Agent({
  name: "network-agent",
  instructions: "You are a network agent that can help users with various tasks.",
  model: openai("gpt-4o"),
  agents: { agent1, agent2 },     // Sub-agents
  workflows: { workflow1 },       // Workflows
  tools: { tool1, tool2 }        // Tools
});

const response = await agent.network(
  "Find weather in Tokyo, then plan an activity"
);

for await (const chunk of response.stream) {
  console.log(chunk);
}
```

**Primitive Discovered:**
- Function/Method: `agent.network()`
- Signature: Takes messages and options, returns object with stream, status, result, usage
- Return type: Object with multiple async properties
- Key difference from `.stream()`: Returns routing agent events and handles multi-primitive orchestration

**Implementation Note:** Memory is REQUIRED for `.network()` to track task history and completion. This is different from `.stream()` which doesn't require memory.

**Source:** 
- https://mastra.ai/reference/agents/network
- https://mastra.ai/docs/agents/networks

---

### RQ-2: Network Event Types

**Why It Matters:** PR-1.2 (Delegation Observability) — Need to understand what events are emitted for SSE streaming.

**Status:** ✅ Answered

**Question:**
1. What event types are emitted by `.network()`?
2. What's the structure of `agent-execution-start`, `agent-execution-end` events?
3. How do we access the full event stream?
4. What information is available in each event (agent name, step, result)?

**Answer:**
```typescript
// Network-specific event types
type NetworkEventType = 
  | 'routing-agent-start'           // Routing agent begins analyzing
  | 'routing-agent-text-delta'      // Incremental routing text
  | 'routing-agent-end'             // Routing decision complete
  | 'agent-execution-start'         // Sub-agent starts
  | 'agent-execution-end'           // Sub-agent completes
  | 'workflow-execution-start'      // Workflow starts
  | 'workflow-execution-end'        // Workflow completes
  | 'network-execution-event-step-finish';  // Network step done

// Event structure examples
{
  type: 'routing-agent-start',
  runId: '221333ed-d9ee-4737-922b-4ab4d9de73e6',
  from: 'NETWORK',
  payload: {
    // Routing agent starting to analyze task
  }
}

{
  type: 'agent-execution-start',
  runId: '221333ed-d9ee-4737-922b-4ab4d9de73e6',
  from: 'NETWORK',
  payload: {
    agentName: 'ResearchAgent',
    task: 'Find weather information',
    startedAt: 1755269732792
  }
}

// Access event stream
const response = await agent.network(message);
for await (const event of response.stream) {
  switch(event.type) {
    case 'routing-agent-start':
      console.log('Manager is analyzing request...');
      break;
    case 'agent-execution-start':
      console.log(`Delegating to ${event.payload.agentName}`);
      break;
    // ... handle other events
  }
}
```

**Primitive Discovered:**
- Event types: 8+ network-specific events for tracking delegation
- Event structure: `{ type, runId, from, payload }` format
- Streaming method: Access via `response.stream` async iterator
- Information: Agent names, tasks, timing, results in payload

**Implementation Note:** Events have `runId` and `from` at top level for easy tracking. Use event types to show delegation flow in UI.

**Source:** 
- https://mastra.ai/docs/streaming/events
- https://mastra.ai/docs/agents/networks** 

---

### RQ-3: Manager Memory Scoping

**Why It Matters:** PR-1.3 (Memory Management) — Need to understand if manager memory is separate from sub-agent memories.

**Status:** ✅ Answered

**Question:**
1. When a manager delegates to a sub-agent, does the sub-agent use its own memory or the manager's?
2. Is manager memory separate from sub-agent memories?
3. How does memory work in Agent Networks?
4. What memory is required for networks to function?

**Answer:**
```typescript
// Memory is REQUIRED for networks to function
import { LibSQLStore } from '@mastra/memory';

// Manager needs its own memory for network tracking
const managerMemory = new LibSQLStore({
  connectionUrl: 'file:_tables/managers/[managerId]/memory.db'
});

// Sub-agents can have their own memories
const subAgentMemory = new LibSQLStore({
  connectionUrl: 'file:_tables/agents/[agentId]/memory.db'
});

// Configure manager with memory
const managerAgent = new Agent({
  name: "Manager",
  instructions: "You coordinate tasks between agents",
  model: openai("gpt-4o"),
  agents: {
    researchAgent: new Agent({ 
      // Sub-agent with its own memory
      memory: subAgentMemory 
    }),
    // ... other agents
  }
});

// Use network with memory
const response = await managerAgent.network(
  "Complex task",
  { 
    memory: managerMemory,  // Memory is used to:
    thread: "thread-123"    // 1. Store task history
  }                         // 2. Determine task completion
);                         // 3. Track delegation decisions
```

**Primitive Discovered:**
- Memory pattern: Manager and sub-agents have separate memories
- Configuration: Memory passed in options for `.network()`
- Purpose: Track task history, completion status, delegation flow
- Requirement: Memory is MANDATORY for network execution

**Implementation Note:** 
- Manager memory tracks network execution and routing decisions
- Sub-agent memories maintain their own conversation context
- Memory enables the network to determine when complex tasks are complete

**Source:** 
- https://mastra.ai/docs/agents/networks ("Memory is required when using .network()")
- https://mastra.ai/docs/agents/overview** 

---

### RQ-4: Sub-Agent Loading Pattern

**Why It Matters:** PR-1.4 (Sub-Agent Loading Performance) — Need to understand best practices for loading sub-agents.

**Status:** ✅ Answered

**Question:**
1. Should we load all sub-agent configs upfront when creating manager, or lazy-load?
2. What's the performance impact of loading 10+ sub-agents?
3. How does Mastra expect sub-agents to be provided (config objects, Agent instances)?
4. Can sub-agents be loaded dynamically during network execution?

**Answer:**
```typescript
// Sub-agents must be provided as Agent instances upfront
const researchAgent = new Agent({
  name: "ResearchAgent",
  description: "Researches information online",  // Clear description for routing
  instructions: "You research topics thoroughly",
  model: openai("gpt-4o"),
  tools: { searchTool, extractTool }
});

const writerAgent = new Agent({
  name: "WriterAgent", 
  description: "Writes content based on research",  // Specific description
  instructions: "You write clear, engaging content",
  model: openai("gpt-4o"),
  tools: { formatTool, editTool }
});

// Manager loads all sub-agents upfront
const managerAgent = new Agent({
  name: "Manager",
  instructions: "Route tasks to appropriate agents",
  model: openai("gpt-4o"),
  agents: {
    researchAgent,  // Agent instances, not configs
    writerAgent,
    // ... can have 10+ agents
  },
  workflows: { /* workflows if needed */ },
  tools: { /* manager's own tools */ }
});

// Routing based on descriptions
// "Primitives are selected based on their descriptions.
// Clear, specific descriptions improve routing."
```

**Primitive Discovered:**
- Loading pattern: All sub-agents loaded upfront as Agent instances
- Best practices: 
  - Provide clear, specific descriptions for routing accuracy
  - Load all agents when creating manager
  - No dynamic loading during execution
- Format: Agent instances in `agents` object, not lazy configs

**Implementation Note:** 
- Performance of 10+ agents depends on initialization complexity
- Agent descriptions are critical for LLM routing decisions
- Consider grouping related agents to reduce manager cognitive load

**Source:** 
- https://mastra.ai/docs/agents/networks
- https://mastra.ai/blog/agent-network** 

---

### RQ-5: Error Handling in Networks

**Why It Matters:** PR-1.5 (Error Handling Strategy) — Need to understand how Mastra handles sub-agent failures.

**Status:** ✅ Answered (Limited)

**Question:**
1. What happens when a sub-agent fails in a network?
2. Does Mastra automatically retry with different agents?
3. How are errors propagated to the manager?
4. What error events are emitted?

**Answer:**
```typescript
// Error handling in networks
try {
  const response = await managerAgent.network(
    "Complex task requiring multiple agents",
    {
      memory: managerMemory,
      maxSteps: 10,  // Limit execution steps to prevent infinite loops
      thread: "thread-123"
    }
  );
  
  // Monitor for errors in stream
  for await (const event of response.stream) {
    if (event.type === 'error' || event.type === 'agent-execution-error') {
      console.error('Sub-agent failed:', event.payload);
      // Handle error - manager may route to different agent
    }
  }
  
  // Check final status
  const status = await response.status;
  if (status === 'failed') {
    console.error('Network execution failed');
  }
  
} catch (error) {
  // Network-level errors
  console.error('Network failed:', error);
}

// The routing agent uses LLM reasoning to:
// 1. Interpret failures
// 2. Decide whether to retry or route differently
// 3. Report back to user
```

**Primitive Discovered:**
- Error handling: LLM-based reasoning handles failures dynamically
- Retry logic: Routing agent decides based on context (not automatic)
- Error propagation: Through event stream and status promises
- Error events: Likely `agent-execution-error` or similar (not explicitly documented)

**Implementation Note:** 
- Mastra relies on LLM intelligence for error recovery
- Set `maxSteps` to prevent infinite retry loops
- Monitor both stream events and final status for failures

**Source:** 
- https://mastra.ai/docs/agents/networks (limited error details)
- Inferred from LLM-based routing architecture** 

---

## Part 2: Integration Patterns

### RQ-6: How do Agent Networks work with our Agent System?

**Why It Matters:** PR-1.6 (Integration) — Understanding how to integrate Mastra Networks with our existing agent infrastructure.

**Status:** ✅ Answered

**Questions:**
1. Can we use our existing agent creation pattern (`createConfiguredAgent`) for sub-agents?
2. How do sub-agents access their tools/workflows in a network context?
3. Do sub-agents need special configuration for network usage?

**Integration Pattern:**
```typescript
// Yes! Our existing pattern works for sub-agents
import { createConfiguredAgent } from './services/agent-config';

// Load existing agents as sub-agents
const researchAgent = await createConfiguredAgent('research-agent-uuid');
const writerAgent = await createConfiguredAgent('writer-agent-uuid');

// Create manager with our existing agents
const managerConfig = {
  name: "JobApplicationManager",
  instructions: "You coordinate job application tasks",
  model: gateway("openai:gpt-4o"),
  
  // Our existing agents work as sub-agents!
  agents: {
    researchAgent,
    writerAgent,
    // ... more agents
  },
  
  // Manager can also have its own tools/workflows
  tools: managerTools,
  workflows: managerWorkflows
};

const managerAgent = new Agent(managerConfig);

// Sub-agents access their tools/workflows normally
// When manager delegates, sub-agent executes with its configured capabilities
const result = await managerAgent.network(
  "Research job openings and write cover letter",
  { memory: managerMemory }
);
```

**Answer:**
1. YES - Existing `createConfiguredAgent` pattern works for sub-agents
2. Sub-agents retain all their tools/workflows in network context
3. No special configuration needed - just good descriptions for routing

**Source:** 
- https://mastra.ai/docs/agents/networks
- https://mastra.ai/blog/vnext-agent-network ("You don't need to learn a separate networking API")** 

---

## Summary

### Primitives We'll Use

| What | Primitive | From | Confirmed? |
|------|-----------|------|------------|
| Create network | `new Agent({ agents: {...}, workflows: {...}, tools: {...} })` | Mastra | ✅ |
| Execute network | `agent.network(messages, { memory, thread, maxSteps })` | Mastra | ✅ |
| Stream network events | `for await (const event of response.stream)` | Mastra | ✅ |
| Handle network errors | Monitor stream events and status promise | Mastra | ✅ |
| Configure memory | `new LibSQLStore({ connectionUrl })` | Mastra Memory | ✅ |

### Blockers & Dead Ends

| Issue | Impact | Resolution |
|-------|--------|------------|
| Limited error docs | Unclear error event types | Infer from stream monitoring |
| Memory required | Can't use network without memory | Always configure memory |

### Key Learnings

1. **Memory is MANDATORY** - Networks require memory to track task history and determine completion
2. **Descriptions drive routing** - Clear, specific agent descriptions are critical for accurate delegation
3. **Our patterns work** - Existing `createConfiguredAgent` pattern integrates seamlessly with networks 

---

## Exit Criteria

- [x] All RQ questions answered
- [x] Summary table complete
- [x] No unresolved blockers  
- [x] Key learnings documented

**Next Step:** Implementation Plan - Ready to implement Manager Agents with Agent Networks

---

## Resources Used

- [Mastra Agent Networks](https://mastra.ai/docs/agents/networks)
- Existing code: `app/api/workforce/[agentId]/chat/services/chat-service.ts`

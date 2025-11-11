## AI SDK Agent Integration Research

### Goal
- Understand how Vercel AI SDK Agents (`Experimental_Agent`) can power a left-rail chat assistant that edits workflow nodes (Flow/Spec/Code layers) inside the Workflow Generator UI.
- Capture requirements for wiring agent tool calls to canvas mutations and outline initial implementation steps.

### Key Concepts
- **Agent loop:** Agents run an LLM-driven loop where each step either emits text or invokes a registered tool; stopping is governed by conditions such as `stepCountIs(n)`.  
  Source: [AI SDK Agents Overview](https://ai-sdk.dev/docs/agents/overview)
- **Tools:** Declarative objects with `description`, Zod `inputSchema`, and `execute` handler returning structured output; agents can call multiple tools sequentially in a single request.  
  Source: [AI SDK Agents Overview](https://ai-sdk.dev/docs/agents/overview)
- **Configuration surface:** `Experimental_Agent` accepts the same config as `generateText`/`streamText`, including `model`, `system`, `toolChoice`, `stopWhen`, and structured output definitions (`experimental_output`).  
  Source: [Building Agents](https://ai-sdk.dev/docs/agents/building-agents)
- **System prompts:** Behavioral guardrails and tool usage guidelines live in the `system` prompt, enabling us to instruct the agent to only modify nodes via provided tools.  
  Source: [Building Agents](https://ai-sdk.dev/docs/agents/building-agents)
- **Type safety:** `Experimental_InferAgentUIMessage` exposes message types compatible with `@ai-sdk/react` `useChat`, allowing end-to-end typing for chat history if we adopt their UI helpers.  
  Source: [Building Agents](https://ai-sdk.dev/docs/agents/building-agents)

### Integration Sketch
- **Chat panel:** Embed a new left-side chat surface that streams agent responses; plan to leverage `Agent.generate` or `Agent.stream` depending on UX needs.
- **Tool registry (Phase 1):**
  - `updateNodeLayer` — mutate Flow/Spec/Code text for a given node id.
  - `addNode`, `deleteNode`, `connectNodes` — wrap existing Zustand actions for canvas manipulation.
  - Tools should return structured results (e.g., `{ status: "updated", nodeId }`) for audit logging in the sidebar.
- **Execution flow:**
  1. User submits instruction via chat.
  2. API route (server) instantiates agent with current conversation + serialized workflow snapshot.
  3. Agent loop invokes tools; each `execute` function dispatches to store/services (likely through RPC from route to browser via MCP/WebSocket, or optimistic client-side simulation).
  4. Final agent message returned to chat; UI updates driven by store state changes triggered by tool handlers.
- **Context management:** Persist conversation turns alongside summarized workflow state so the agent knows current node inventory and layer content.
- **Safety:** Guard tools with schema validation and enforce idempotent updates; consider dry-run mode for previewing diff before applying.

### Open Questions
- How do we bridge server-side tool execution with client-only Zustand mutations—do we run the agent in-browser (via edge-friendly runtime) or expose a client-callable tool adapter?
- Do we stream intermediate agent steps to the UI (requiring `agent.stream`) or wait for final answer (`agent.generate`)?
- What minimum workflow state snapshot does the agent require (full nodes/edges JSON vs. summarized contracts)?
- How will we authenticate tool-triggered mutations to avoid malicious prompts?

### Next Steps
1. Prototype a minimal agent configured with dummy tools that log invocations, using `stopWhen: stepCountIs(5)` to allow multi-tool loops.  
2. Design wireframe for chat panel and define store slice for chat history + agent status.  
3. Experiment with running the agent inside a Next.js API route vs. client environment, measuring latency and tool execution constraints.  
4. Draft schemas for node-editing tools (e.g., `z.object({ nodeId: z.string(), layer: z.enum(["flow","spec","code"]), content: z.string() })`).  
5. Define telemetry/logging strategy for agent interactions to aid debugging and rollback.


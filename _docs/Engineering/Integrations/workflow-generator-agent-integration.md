# Workflow Generator → Agent SDK Integration

## Product Requirements Snapshot
- **Empower workflow authors to ship agents**: A user should be able to design a workflow in the canvas and promote it into an agent capability without hand-writing glue code.
- **Composable tooling**: Tools must be reusable across agents, supporting the marketplace vision where expertise is packaged and shared.
- **Traceable execution**: Each step that runs (whether via WebContainer or serverless) needs observable input/output for debugging and trust.
- **Governance-ready**: Schema must leave room for permission layers, versioning, and monetization hooks anticipated in marketplace docs.

## Working Thesis
- Generate executable JS/TS files from workflow nodes and treat each file as a tool implementation that an agent can call.
- Store tool scripts alongside metadata (name, description, runtime) under `_tables/tools.md`.
- Map agents to their allowed tool ids, aligned with `_tables/agents.md`.

## Proposed Flow (Iteration 0)
1. Workflow authoring in the generator produces a node graph.
2. Transpiler emits a JS/TS module per node or composite node.
3. Tool registry ingests the emitted module, adds metadata, and exposes an `execute` wrapper.
4. Agents configured via Vercel AI Agent SDK reference the tool registry when they run.

## File Impact (Spike Draft)
| File / Directory | Action | Notes |
| --- | --- | --- |
| `_tables/tools.md`, `_tables/agents.md` | Read/Update | Ensure mock schemas align with runtime registries. |
| `_tables/` (new `tools.json`/`agents.json` or loaders) | Create | Serialized mock DB consumed by API route. |
| `app/api/agents/route.ts` | Create | Generalized agent endpoint instantiating agents by id. |
| `app/api/agent/route.ts` | Refactor/Deprecate | Consolidate into new generalized route or proxy. |
| `app/api/agents/pm/route.ts` | Remove | Replaced by generalized agent route. |
| `app/api/agents/registry/*` | Create | Tool and agent registry helpers reading mock data. |
| `app/(pages)/workforce/page.tsx` | Update | Prototype UI for selecting agent, editing tools, chatting. |
| `app/(pages)/workforce/components/*` | Update/Create | Components for tool dropdown, agent summary, chat panel wiring. |
| `app/(pages)/workforce/data/*` | Create | Client-friendly loaders for mock registries. |
| `app/experiments/workflow-generator/tools` | Reference | Ensure spike doesn’t break existing experiment (may need adapter). |

## Implementation Path
- **Phase 1 — Research & Prototype**: Validate Agent SDK expectations for dynamic tools, define the tool module interface, and spike a hard-coded example inside `workflow-generator`. (See [Vercel AI SDK: Building Agents](https://ai-sdk.dev/docs/agents/building-agents))
- **Phase 2 — Compiler Output**: Extend the workflow transpiler to emit modules matching the tool interface plus metadata JSON.
- **Phase 3 — Registry & Persistence**: Create a registry service that stores scripts + metadata, aligns with `_tables/tools.md`, and exposes loaders for the Agent SDK.
- **Phase 4 — Agent Assembly**: Surface UI to pick tools per agent, persist via `_tables/agents.md`, and configure API routes to construct Agent instances per request.
- **Phase 5 — Governance & Marketplace Prep**: Layer in versioning, auditing, and distribution controls to support future monetization features.

## Research Musings (Phase 1)
- **Agent SDK flexibility**: Concern that the SDK assumes a single agent per app; need to verify how multiple `Agent` instances can coexist and be instantiated from structured definitions.
- **Tool “database”**: Proposal to add a dedicated folder for hard-coded tool modules that acts as the initial persistence layer, aligning with `_tables/tools.md`.
- **UI touchpoint**: Consider expanding `app/(pages)/workforce` to host the prototype flow (choose agent, see assigned tools, chat) as we explore SDK wiring.
- **Tool description requirements**: We must confirm how much metadata (description, usage guidance) the Agent SDK needs to decide when to invoke a tool.
- **Agent definition files**: Hypothesis that each agent might need a structured config file capturing `tools`, prompts, and metadata so we can spin up multiple agents reliably.
- **Hard-coded spike**: Start by creating a single tool module, assign it to one agent, and run an end-to-end chat to observe tool invocation behavior.
- **Transpiler implications**: Success criteria for the spike include understanding how transpiled workflow scripts must be shaped to drop into the tool folder without extra glue.

## Detailed Planning (Phase 1)
### User Flows to Prototype
1. **Assign tools to an agent**
   - Load available tools from the mock registry.
   - Display current agent-tool assignments in the UI (tool usage panel). 
   - Allow selection/deselection (e.g., dropdown with checkboxes) and persist to mock store during the spike.
2. **Chat with the selected agent**
   - User selects an agent persona.
   - Chat panel posts to generalized `/api/agents` with the agent id.
   - Observe streamed response and any tool invocation logs.

### Mock Registry Structure
- Introduce runtime loaders, e.g., `app/api/agents/registry/tools.ts` and `agents.ts`, that:
  - Read JSON/TS objects derived from `_tables/tools.md` and `_tables/agents.md`.
  - Expose helper methods like `getAgentById(id)` and `getToolsByIds(ids)`.
  - Provide typed metadata (description, runtime, invocation signature) for tool instantiation.

### API Route Design (`/api/agents`)
- Request payload: `{ agentId, messages, context? }`.
- Steps:
  1. Validate payload and fetch agent definition via registry.
  2. Resolve tool ids to actual tool modules implementing the `tool({ inputSchema, execute })` contract.
  3. Instantiate `new Agent({ model, system, tools, stopWhen })`.
  4. Call `validateUIMessages` with the hydrated tool map.
  5. Stream response back to client; include logging hooks for tool executions.
- Error handling: return 404 if agent missing, 400 if tool mismatch, 500 for execution failures.

### Workforce UI Changes
- Use existing Mira Patel layout as base.
- Tool usage list becomes editable: shows current tools with success stats placeholder + dropdown modal for editing.
- Chat input targets the new `/api/agents` route with selected agent id.
- Provide quick prompts based on agent definition (`agent.quickPrompts`).
- Ensure spike UI changes are feature-flagged or isolated to avoid disrupting current marketing flows.

## Agent SDK Primer
- **Agent construction**: `new Agent({ model, system, tools, stopWhen, toolChoice, experimental_output? })`. Each instance is independent; we can create many agents and select at runtime.
- **Tool definition**: Use `tool({ description, inputSchema, execute })`. `inputSchema` is typically a Zod object; the SDK passes validated data into `execute`. Return values can be any JSON-serializable structure and are streamed back to the model.
- **Tool registry shape**: Tools are stored in a plain object keyed by tool name. Example:
  ```ts
  import { tool } from "ai";
  import { z } from "zod";

  export const summarize = tool({
    description: "Summarize text",
    inputSchema: z.object({ text: z.string() }),
    execute: async ({ text }) => ({ summary: summarizeText(text) }),
  });
  ```
- **Loop control**: `stopWhen: stepCountIs(n)` allows up to `n` tool invocations or text generations. We can combine multiple conditions if needed.
- **Tool choice**: `toolChoice: 'auto' | 'none' | 'required' | { type: 'tool'; toolName: string }`. Useful for forcing deterministic tool usage during tests.
- **Responding to UI**: `agent.respond({ messages })` expects `messages` to be validated via `validateUIMessages`. The return value is a streaming response compatible with our existing `@ai-sdk/react` chat.
- **Type inference**: `InferAgentUIMessage<typeof agent>` yields the correct message type for React clients, ensuring messages align with tools.
- **Statefulness**: Agents do not maintain internal state between calls; all context comes from the messages array we pass in. This aligns with storing workflows and tool selections externally.
- **Integration path**: For our registry, each agent definition will import tool modules and pass them into `new Agent`. The generalized API route will instantiate on demand, making the SDK agnostic to how many agents we have.

## Open Questions
- Can the Agent SDK load tool implementations dynamically from compiled files at runtime? (Need to confirm execution requirements and deployment constraints.)
- Do modules need to export a specific signature for `tool()` helpers (e.g., bundled input schema + execute handler)?
- How will we sandbox or secure scripts that originate from user-authored workflows?
- What is the best persistence layer for tool metadata and script storage (FS, object store, DB)?

## Research Plan
- Review Agent SDK expectations for tool configuration, particularly how `tool({ execute })` is defined and shipped. [Vercel AI SDK: Building Agents](https://ai-sdk.dev/docs/agents/building-agents)
- Prototype a minimal tool compiled from workflow output and wire it into an agent within the `workflow-generator` experiment.
- Evaluate runtime boundaries: do we execute tooling inside WebContainer, serverless functions, or background workers?
- Identify validation strategy for tool inputs/outputs (Zod vs JSON Schema).

## Next Steps
- Draft a sample tool file scaffold to inform the transpiler target shape.
- Document how the tool registry will version and reference scripts.
- Validate the agent-tool assignment flow against the existing `_tables/agents.md` and `_tables/tools.md` schemas.

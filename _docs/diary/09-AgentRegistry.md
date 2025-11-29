# Diary Entry 9: Dynamic Agent Registry & Multi-Agent Hydration

## 1. Motivation
- Transition from a single, hard-coded agent to a dynamic registry that supports multiple personas.
- Ensure the workforce chat UI and API both derive their data from a single source of truth (`_tables`).
- Give future devs a reference for extending the agent ecosystem without rediscovering primitives.

## 2. Registry Pattern – Agents & Tools
- `_tables/agents/*`: each file exports an `AgentConfig` (`id`, `systemPrompt`, `model`, `toolIds`, quick prompts, insights, etc.).
- `_tables/tools/*`: each tool exports a `ToolDefinition` with metadata plus the executable `tool()` instance (`run`).
- `_tables/types.ts`: centralizes TypeScript contracts (`AgentConfig`, `ToolDefinition`, `AgentStatus`).
- `_tables/agents/index.ts` and `_tables/tools/index.ts`: aggregate definitions and expose helper functions `getAgentById` / `getToolById`.
- Benefit: the UI, API route, and future transpiler output can all consume the same registry without duplication.

## 3. Agent SDK Hydration Flow
1. Client posts to `/api/workforce/agent` with `{ agentId, messages, context? }`.
2. Route calls `getAgentById(agentId)` → returns `AgentConfig` or 404.
3. For each `toolId`, `getToolById` resolves the executable `tool()` instance; missing tools log warnings but don’t crash.
4. Build a tool map and instantiate `new Agent({ model, system: systemPrompt, tools, stopWhen: stepCountIs(maxSteps ?? 3) })`.
5. Validate UI messages with the same `toolMap` via `validateUIMessages`.
6. Optional context is prepended as a system message; responses stream back to the UI via `agent.respond`.
7. Logging records agent identity, model, toolIds, and message counts for observability.

## 4. Why File Registries?
- **Speed of iteration**: editing a TS file updates both UI and API instantly—ideal for spikes.
- **Self-documenting**: co-locating metadata & code shows how a tool is invoked and what it does.
- **Migration ready**: once a real DB or marketplace exists, we can replace registry loaders without touching UI or route logic.

## 5. Key Learnings & Pitfalls
- **Transport requirement** (`DefaultChatTransport`) is mandatory in `@ai-sdk/react@2`.
- Agents must share the same tool map with both the agent constructor and `validateUIMessages`.
- System prompts are the primary lever for persona; tools unlock capabilities.
- Missing agent or tool must degrade gracefully (404, warning logs).
- Shared tools (e.g., `launch_tracker`) naturally enable collaboration across agents.
- Logging tool invocations helps trace structured outputs (look for `[toolName] invoked` / `result`).

## 6. Future Considerations
- Add telemetry to measure tool success/failure rates; pipe metrics into UI.
- Allow UI to select agents dynamically (dropdown vs. fixed buttons).
- Migrate registries to persistent storage (file → DB) with the same API shape.
- Transpile user-created workflows into tool modules that match `ToolDefinition`.
- Explore caching or warm-start for frequently used agents to reduce cold-start latency.

## 7. Summary
- Multi-agent support now depends solely on adding files to `_tables`.
- `/api/workforce/agent` is fully dynamic; no code changes needed to add new personas or tools.
- This architecture balances simplicity (file-based registry) with forward compatibility (future DB / marketplace).
- Next steps: finalize error handling, polish UI surfacing of tool outputs, and document the process in `_docs/Engineering`.


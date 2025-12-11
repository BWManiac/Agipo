# Diary Entry 9: Dynamic Agent Registry & Multi-Agent Hydration

**Date:** 2025-11-11  
**Task:** N/A  
**Status:** ✅ Complete

---

## 1. Context

We transitioned from a single, hard-coded agent to a dynamic registry that supports multiple personas. This ensures the workforce chat UI and API both derive their data from a single source of truth (`_tables`), and gives future developers a reference for extending the agent ecosystem without rediscovering primitives.

---

## 2. Implementation Summary

### Registry Pattern – Agents & Tools

**File Structure:**
- `_tables/agents/*`: Each file exports an `AgentConfig` (`id`, `systemPrompt`, `model`, `toolIds`, quick prompts, insights, etc.)
- `_tables/tools/*`: Each tool exports a `ToolDefinition` with metadata plus executable `tool()` instance (`run`)
- `_tables/types.ts`: Centralizes TypeScript contracts (`AgentConfig`, `ToolDefinition`, `AgentStatus`)
- `_tables/agents/index.ts` and `_tables/tools/index.ts`: Aggregate definitions and expose helper functions `getAgentById` / `getToolById`

**Benefit:** The UI, API route, and future transpiler output can all consume the same registry without duplication.

### Agent SDK Hydration Flow

1. Client posts to `/api/workforce/agent` with `{ agentId, messages, context? }`
2. Route calls `getAgentById(agentId)` → returns `AgentConfig` or 404
3. For each `toolId`, `getToolById` resolves executable `tool()` instance; missing tools log warnings but don't crash
4. Build tool map and instantiate `new Agent({ model, system: systemPrompt, tools, stopWhen: stepCountIs(maxSteps ?? 3) })`
5. Validate UI messages with same `toolMap` via `validateUIMessages`
6. Optional context prepended as system message; responses stream back via `agent.respond`
7. Logging records agent identity, model, toolIds, and message counts

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Registry Pattern | File-based (`_tables`) | Speed of iteration, self-documenting, migration-ready |
| Tool Resolution | Graceful degradation | Missing tools log warnings but don't crash |
| Agent Hydration | Dynamic at request time | No code changes needed to add new personas or tools |
| Shared Tools | Enabled | Tools like `launch_tracker` naturally enable collaboration |

---

## 4. Technical Deep Dive

### Why File Registries?

- **Speed of iteration:** Editing a TS file updates both UI and API instantly—ideal for spikes
- **Self-documenting:** Co-locating metadata & code shows how a tool is invoked and what it does
- **Migration ready:** Once a real DB or marketplace exists, we can replace registry loaders without touching UI or route logic

### Key Learnings & Pitfalls

- **Transport requirement** (`DefaultChatTransport`) is mandatory in `@ai-sdk/react@2`
- Agents must share the same tool map with both agent constructor and `validateUIMessages`
- System prompts are the primary lever for persona; tools unlock capabilities
- Missing agent or tool must degrade gracefully (404, warning logs)
- Shared tools (e.g., `launch_tracker`) naturally enable collaboration across agents
- Logging tool invocations helps trace structured outputs (look for `[toolName] invoked` / `result`)

---

## 5. Lessons Learned

- **File registries work:** Fast iteration, self-documenting, easy to migrate
- **Dynamic hydration scales:** No code changes needed to add agents or tools
- **Graceful degradation:** Missing tools shouldn't crash the system
- **Shared tools enable collaboration:** Agents can use the same tools

---

## 6. Next Steps

- [ ] Add telemetry to measure tool success/failure rates
- [ ] Allow UI to select agents dynamically (dropdown vs. fixed buttons)
- [ ] Migrate registries to persistent storage (file → DB) with same API shape
- [ ] Transpile user-created workflows into tool modules matching `ToolDefinition`
- [ ] Explore caching or warm-start for frequently used agents

---

## References

- **Related Diary:** `08-AgentSDKSpike.md` - Initial spike
- **Related Diary:** `10-SchemaTranspilationPlanning.md` - Workflow transpilation
- **Related Diary:** `11-AgentToolManagement.md` - Tool management UI

---

**Last Updated:** 2025-11-11

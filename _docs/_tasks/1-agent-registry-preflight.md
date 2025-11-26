# Objective
- [ ] Ensure workforce UI and `/api/workforce/agent` dynamically hydrate agents and tools from `_tables`, delivering a live, registry-driven experience end-to-end.

---

## Acceptance Criteria (Validate Throughout)
- [x] Agent cards reflect registry data (`/workforce` shows one card per `_tables/agents`).
- [x] Agent modal shows real metadata (quick prompts, objectives, guardrails match agent file).
- [x] Tool Usage lists actual tools per agent (`toolIds` → `_tables/tools`).
- [x] Tool cards update immediately when a tool description changes in `_tables/tools`.
- [x] Chat POST payload includes the active `agentId`.
- [x] API route logs confirm it loads the requested agent config and tool map.
- [x] Removing a toolId from an agent removes it from UI and API tool map.
- [x] Unknown `agentId` returns 404 with clear error body.
- [x] Shared toolIds appear for multiple agents and execute successfully for each.
- [x] Tool execution output appears in chat; removing the toolId falls back to plain text.

---

## Phase 1 – Normalize Tool Registry
- [x] Update each `_tables/tools/*.ts` to export `{ id, name, description, run }` with the existing `tool()` helper.
- [x] Extend `_tables/tools/index.ts` to aggregate tools and expose `getToolById(id)`.
- [x] Update `_tables/types.ts` (or create new `ToolDefinition`) to match the unified shape.
- [x] Quick check: import `getToolById` locally and verify it returns `{ id, name, run }` for known tools.
- [ ] ✅ Acceptance focus: Tool registry ready for UI/API (unblocks Phases 2–4).

---

## Phase 2 – Drive Workforce UI from Agent Registry
- [x] Verify each `_tables/agents/*.ts` contains `model`, `systemPrompt`, `toolIds`, quick prompts, objectives, guardrails, insights, activities.
- [x] Implement `_tables/agents/index.ts` exporting `agents` and `getAgentById`.
- [x] Delete `app/(pages)/workforce/data/mock-data.ts`; read directly from `_tables/agents`.
- [x] Update `WorkforceDashboard.tsx` to consume registry agents.
- [x] Smoke test `/workforce`: cards count, names, roles, highlights match registry.
- [x] ✅ Acceptance focus: Criteria 1 & 2 satisfied.

---

## Phase 3 – Power Agent Modal Tool Usage from Registry
- [x] In `AgentModal.tsx`, replace hard-coded tool list with `agent.toolIds.map(getToolById)` (render name/description).
- [x] Ensure `ToolInspector` loads the same metadata (avoid stale props).
- [x] Confirm `AgentChat.tsx` body already sends `agentId`; adjust if necessary.
- [x] Refresh modal: Tool Usage updates when editing `_tables/tools` entries.
- [x] ✅ Acceptance focus: Criteria 3–5 satisfied (tool list & agentId payload).

---

## Phase 4 – Dynamic Agent Hydration in API Route
- [x] Modify request body contract to require `agentId` (default to Mira only if needed).
- [x] Load agent config via `getAgentById`; handle missing agent with 404.
- [x] Resolve tool map by fetching each `toolId` via `getToolById`; log missing tools and warn if absent.
- [x] Instantiate `new Agent({ model: agent.model, system: agent.systemPrompt, tools: toolMap, stopWhen: stepCountIs(agent.maxSteps ?? 3) })`.
- [x] Pass the same `toolMap` into `validateUIMessages`.
- [x] Use `agent.systemPrompt` instead of hard-coded persona text.
- [x] Update `_tables/agents.md` to document required fields for hydration.
- [x] Add `maxSteps?: number` to `AgentConfig` type.
- [ ] Test with valid agent (`pm`), missing tool, and unknown agent cases; verify logs.
- [ ] ✅ Acceptance focus: Criteria 6–9 satisfied.

---

## Phase 5 – Tool Execution Validation & Polish
- [x] Chat with a tool-enabled agent; verify structured tool output still appears.
- [ ] Temporarily remove the toolId and confirm the chat reverts to plain LLM output.
- [ ] Decide whether to surface tool outputs distinctly in UI (optional polish).
- [x] Update diary / engineering docs with architecture notes if warranted.
- [ ] Remove or downgrade debug logging (optional once verified).
- [ ] ✅ Acceptance focus: Criteria 10 satisfied and documentation updated if needed.

---

## Sign-off Checklist
- [ ] Re-run `/workforce` manual tests for each agent after all phases.
- [ ] Confirm no TypeScript or lint errors (`npm run lint`).
- [ ] Ensure no orphaned mock data remains.
- [ ] Capture before/after screenshots (optional for docs).
- [ ] Present summary of changes and test evidence.

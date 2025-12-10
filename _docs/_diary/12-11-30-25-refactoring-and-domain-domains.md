# Diary Entry 12: Domain Refactoring & The Workforce/Tools Split

**Date:** 2025-11-30  
**Task:** N/A  
**Status:** ✅ Complete

---

## 1. Context

As the application grew from a simple prototype into a more robust platform ("Agipo"), the initial structure began to show cracks. We had logic scattered across `_tables`, API routes, and frontend components. Specifically:

- **Mixed Concerns:** "Workflows" and "Tools" were used interchangeably but meant different things
- **Fat Routes:** API routes contained too much business logic
- **Tangled Frontend:** The `AgentModal` component was becoming a "God component"
- **Inconsistent Persistence:** Workflows saved as flat files but agents needed to "execute" them

We needed a reset to align the codebase with our mental model: **Agents (Workforce)** are hireable entities that use **Tools** created in a **Builder**.

---

## 2. Implementation Summary

### Domain-Driven Design: The Big Split

We reorganized the entire application around two primary domains:

**Domain A: Tools (The "Builder")**
- **Responsibility:** Everything related to creating, editing, saving, and transpiling capabilities
- **Key Entity:** `ToolDefinition` (the source of truth)
- **Sub-domains:** Editor, Transpiler, Storage

**Domain B: Workforce (The "Runtime")**
- **Responsibility:** Everything related to Agents, their assignment, execution, and management
- **Key Entity:** `AgentConfig` (the hiring contract)
- **Sub-domains:** Dashboard, Runtime, Chat

**Philosophy:**
- **Tools are Assets:** They exist independently of agents. A tool is "built" once and "assigned" to many.
- **Agents are Consumers:** Agents don't "own" logic; they own *assignments* to tools.

### The Tool Pipeline: From Graph to Execution

**The Flow:**
1. Visual Design: User builds a flow in the UI (React Flow)
2. Save (Source): State saved as `workflow.json` (the "Source Definition")
3. Transpile: Service converts JSON into clean JavaScript module (`tool.js`)
4. Registry (Runtime): `runtime.ts` dynamically loads these `tool.js` files
5. Assignment: Workforce domain assigns tools to agents via `agent.toolIds`

**Key Design Choice:** We separated the **Definition** (what the user edits) from the **Executable** (what the agent runs).

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Domain Split | Tools vs Workforce | Clear separation of concerns |
| Tool Pipeline | Definition → Executable | Allows optimization without coupling to UI |
| Service Pattern | Colocated services | Logic lives closer to domain |
| CQRS-Lite | Intent-based routes | Explicit CRUD operations |

---

## 4. Technical Deep Dive

### Service Layer & API Pattern

**Before:** Logic-heavy API routes (50+ lines of validation, file writing, error handling)

**After:** Clean "Service Pattern" - routes call services, services contain logic

**Colocation:**
- `app/api/tools/services/` (Runtime, Storage, Transpiler)
- `app/api/workforce/services/` (AgentConfig)

**CQRS-Lite:**
- `/create` (Command)
- `/update` (Command)
- `/list` (Query)

---

## 5. Lessons Learned

- **Domain-driven design clarifies architecture:** Clear boundaries make codebase easier to understand
- **Separation of concerns scales:** Tools and Agents can evolve independently
- **Service pattern improves maintainability:** Logic in services, routes are thin
- **Definition vs Executable separation:** Enables optimization without breaking UI

---

## 6. Next Steps

- [ ] Continue refining domain boundaries
- [ ] Document domain principles
- [ ] Establish patterns for cross-domain communication

---

## References

- **Related Diary:** `13-RecordsDomainAndPolars.md` - Records domain
- **Related Diary:** `14-WorkforceOSAndAgentModal.md` - Workforce OS

---

**Last Updated:** 2025-11-30

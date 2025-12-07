# Diary Entry 12: Domain Refactoring & The Workforce/Tools Split

**Date:** November 30, 2025
**Topic:** Architectural Refactoring, Domain-Driven Design (DDD), and Tool Transpilation Pipeline

---

## 1. Context: Why We Refactored

As the application grew from a simple prototype into a more robust platform ("Agipo"), the initial structure began to show cracks. We had logic scattered across `_tables`, API routes, and frontend components. Specifically:
- **Mixed Concerns:** "Workflows" and "Tools" were used interchangeably but meant different things in different contexts (visual graph vs. executable code).
- **Fat Routes:** API routes contained too much business logic.
- **Tangled Frontend:** The `AgentModal` component was becoming a "God component," handling data fetching, UI logic, and state management for multiple features.
- **Inconsistent Persistence:** We were saving workflows as flat files but wanted agents to "execute" them, leading to a disconnect between what was saved and what was run.

We needed a reset to align the codebase with our mental model of the product: **Agents (Workforce)** hireable entities that use **Tools** created in a **Builder**.

---

## 2. Domain-Driven Design (DDD): The Big Split

We reorganized the entire application around two primary domains:

### Domain A: Tools (The "Builder")
*   **Responsibility:** Everything related to creating, editing, saving, and transpiling capabilities.
*   **Key Entity:** `ToolDefinition` (the source of truth).
*   **Sub-domains:**
    *   **Editor:** The visual node-based interface (`app/(pages)/tools/editor`).
    *   **Transpiler:** The engine that converts visual graphs into executable JavaScript.
    *   **Storage:** Manages the persistent state of tools (both source JSON and executable JS).

### Domain B: Workforce (The "Runtime")
*   **Responsibility:** Everything related to Agents, their assignment, execution, and management.
*   **Key Entity:** `AgentConfig` (the hiring contract).
*   **Sub-domains:**
    *   **Dashboard:** The management view (`app/(pages)/workforce`).
    *   **Runtime:** The execution environment where agents invoke tools.
    *   **Chat:** The interface for interacting with agents.

**Philosophy:**
- **Tools are Assets:** They exist independently of agents. A tool is "built" once and "assigned" to many.
- **Agents are Consumers:** Agents don't "own" logic; they own *assignments* to tools.

---

## 3. The Tool Pipeline: From Graph to Execution

One of the most critical technical achievements was establishing a robust pipeline for user-defined tools.

**The Flow:**
1.  **Visual Design:** User builds a flow in the UI (React Flow).
2.  **Save (Source):** The state is saved as `workflow.json` (the "Source Definition").
3.  **Transpile:** A dedicated service (`transpiler.ts`) converts that JSON into a clean, dependency-free JavaScript module (`tool.js`).
    *   *Decision:* We switched from generating TypeScript to pure JavaScript to simplify the runtime loading process (no on-the-fly TS compilation needed).
4.  **Registry (Runtime):** The `runtime.ts` service dynamically loads these `tool.js` files.
5.  **Assignment:** The `Workforce` domain assigns these tools to agents via `agent.toolIds`.

**Key Design Choice:**
We separated the **Definition** (what the user edits) from the **Executable** (what the agent runs).
- UI uses: `/api/tools/list` (reads `workflow.json`)
- Agents use: `getExecutableTools()` (loads `tool.js`)

This separation allows us to optimize the runtime for speed and safety without coupling it to the UI's data shape.

---

## 4. Service Layer & API Pattern

We moved away from logic-heavy API routes to a cleaner "Service Pattern":

**Before:**
```typescript
// app/api/save-workflow.ts
export async function POST(req) {
  // ... 50 lines of validation ...
  // ... 20 lines of file writing ...
  // ... 30 lines of error handling ...
}
```

**After:**
```typescript
// app/api/tools/create/route.ts
export async function POST(req) {
  const data = await req.json();
  await toolsService.createTool(data); // <--- Logic lives here
  return NextResponse.json({ success: true });
}
```

**Colocation:**
Services now live closer to their domain:
- `app/api/tools/services/` (Runtime, Storage, Transpiler)
- `app/api/workforce/services/` (AgentConfig)

**CQRS-Lite:**
We split CRUD routes into explicit intent-based files:
- `/create` (Command)
- `/update` (Command)
- `/list` (Query)
- `/read` (Query)

This makes the API surface area self-documenting and easier to maintain.

---

## 5. Frontend Refactoring: The Agent Modal

The `AgentModal` was refactored from a 350+ line monolith into a composed set of specialized components.

**Structure:**
- `index.tsx`: Orchestrator (holds state, manages dialog).
- `useAgentTools.ts`: Custom hook encapsulating complex data fetching and ID normalization logic.
- `components/`:
    - `AgentHeader`: Pure presentational.
    - `AgentChatSection`: Isolated chat logic.
    - `info-panel/*`: Small, reusable list components (Objectives, Insights, Tools).

**Design Win:**
By extracting `useAgentTools`, we solved a tricky bug where the UI state (List IDs) and the Agent state (Executable IDs with prefixes) were out of sync. The hook handles the normalization transparently, so the UI components just receive clean data.

---

## 6. Moving Forward

**The "Way of Thinking":**
1.  **Thin Routes, Fat Services:** Always push logic down.
2.  **Explicit Domains:** If it's about building capabilities, it's `Tools`. If it's about personality/execution, it's `Workforce`.
3.  **Source vs. Runtime:** Always distinguish between the *editor state* and the *runtime artifact*.

**Next Steps:**
This architecture paves the way for:
- **Marketplace:** We can now package `tool.js` + `workflow.json` as a distributable asset.
- **Versioning:** We can version `workflow.json` without breaking running agents (who use the old `tool.js` until redeployed).
- **Multi-Modal Tools:** Agents could eventually use tools that aren't workflows (e.g., hardcoded API integrations), handled by the same registry.

We are no longer just hacking on a prototype; we are building a platform.








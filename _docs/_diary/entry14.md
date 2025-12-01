# Diary Entry 14: The Workforce OS & Agent Modal Redesign

**Date:** December 1, 2025
**Topic:** Evolving Agents from Chatbots to Digital Employees

---

## 1. File Impact Analysis

### Frontend (Agent Dashboard)
| Path | Status | Purpose |
| :--- | :--- | :--- |
| `app/(pages)/workforce/components/agent-modal/` | **New** | Root directory for the new implementation. |
| `.../agent-modal-legacy/` | **Renamed** | Preserved previous implementation for reference. |
| `.../AgentModal.tsx` | **New** | Orchestrator component handling Tab state (`activeTab`) and Dialog shell. |
| `.../components/AgentHeader.tsx` | **New** | Navigation bar and Identity display. |
| `.../components/tabs/*.tsx` | **New** | 7 distinct views: `Overview`, `Chat`, `Tasks`, `Planner`, `Records`, `Capabilities`, `Config`. |
| `.../components/shared/*.tsx` | **New** | Reusable widgets: `StatusCard`, `JobCard`, `TriggerCard`, `TaskItem`. |
| `.../hooks/useAgentDetails.ts` | **New** | Unified data hook composing real API data (Tools) with mock data (Tasks/Schedule). |
| `.../data/mocks.ts` | **New** | Typed mock data definitions for the "Frontend-First" development strategy. |

---

## 2. Context: The "Workforce OS" Philosophy

We reached a ceiling with the previous "Chat + Info Panel" design. It treated Agents as chatbots—reactive entities that exist only when you talk to them.

To realize the vision of **Agipo**, we need to treat Agents as **Digital Employees** within a **Workforce Operating System**. An employee isn't just a chat window; they have:
1.  **A Schedule:** Things they do every morning (Planner).
2.  **A Work History:** Tasks they've completed and need feedback on (Tasks).
3.  **Access Rights:** Specific systems they can touch (Records/Capabilities).
4.  **Configuration:** Nuanced instructions on how to behave (Config).

The new **Agent Modal** is the manifestation of this philosophy. It is no longer a "Chat Modal"; it is an **Employee Dashboard**.

---

## 3. Architectural Decisions

### A. Frontend-First Development (The Mock Bridge)
We chose not to block the UI redesign on backend engineering.
*   **Problem:** We don't have backend tables for `tasks`, `schedules`, or `triggers` yet.
*   **Solution:** We implemented a rigorous **Mock Data Layer** (`data/mocks.ts`).
*   **Pattern:** The `useAgentDetails` hook acts as a facade. It fetches *real* tool data from the existing API but merges it seamlessly with *mock* task history. This allows us to validate the entire UX flow immediately. When the backend is ready, we simply swap the data source in the hook, and the UI remains untouched.

### B. Tabular Architecture
We broke the monolithic "Info Panel" into 7 semantic domains.
*   **Overview:** The "Manager's View" (Status, Blockers, Quick Actions).
*   **Chat:** The "Collaboration View" (Context-aware communication).
*   **Tasks:** The "Audit View" (History & Feedback).
*   **Planner:** The "Automation View" (Headless jobs).
*   **Records:** The "Memory View" (Data access).
*   **Capabilities:** The "Skill View" (Tools & Workflows).
*   **Config:** The " HR View" (Role definition).

### C. Component Composition
We strictly adhered to the **"5 Developers Principle"** in our planning.
*   We defined every component's responsibility *before* coding.
*   We extracted shared logic (like `StatusCard` and `TaskItem`) into `components/shared` to avoid duplication.
*   We reused existing complex components (`AgentChat`, `ToolEditor`) by wrapping them in the new tab layout, preserving all previous functionality without regression.

---

## 4. Future Implications & Next Steps

This redesign sets a clear roadmap for the Backend Engineering team. The UI now writes checks that the API needs to cash.

1.  **Planner Service:** We need a scheduler (Cron/Queue) to power the "Scheduled Jobs" we are now visualizing.
2.  **Task Persistence:** We need to log every tool call and workflow execution to a `tasks` table so the "Task History" becomes real.
3.  **Feedback Loop:** The "Give Feedback" button currently logs to the console. We need a `feedback` table to store this and an injection mechanism to feed it back into the Agent's system prompt.
4.  **Config Write-Back:** The "Config" tab is currently read-only (or local state). We need to implement `PATCH /api/workforce/[id]/config` to persist changes to `objectives`, `variables`, and `systemPrompt`.

We have effectively successfully "simulated" the next 3 months of backend features in the UI today.




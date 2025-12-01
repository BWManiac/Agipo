# Diary Entry 14: The Workforce OS & Agent Modal Redesign

**Date:** December 1, 2025
**Topic:** Evolving Agents from Chatbots to Digital Employees (The Workforce Operating System)

---

## 1. Executive Summary

We have fundamentally redefined the "Agent" primitive in Agipo. Moving beyond the "Chatbot" paradigm, we are now building a **Workforce Operating System**. In this model, an agent is a persistent **Digital Employee** with a schedule, a work history, access rights, and specific directives.

To manifest this vision, we completely redesigned the **Agent Modal** from a simple chat interface into a robust, 7-tab management dashboard. This entry documents the philosophy, the rigorous frontend-first implementation strategy, and the technical architecture of this new system.

---

## 2. The Philosophy: Agents as Employees

Our previous design (`Chat` + `Info Panel`) reached its ceiling. It treated agents as reactive tools that only existed when a user was typing.

We asked: *What does a Manager need to know about their Employee?*
The answer led to our new 7-Tab Architecture:

1.  **Overview:** "Are you okay?" (Status, Blockers, Highlights).
2.  **Chat:** "Let's talk." (Collaboration).
3.  **Tasks:** "What did you do?" (Audit History & Feedback).
4.  **Planner:** "What will you do?" (Scheduled Jobs & Event Triggers).
5.  **Records:** "What do you know?" (Data Access).
6.  **Capabilities:** "What skills do you have?" (Tools & Workflows).
7.  **Config:** "Who are you?" (Role & Directives).

---

## 3. Implementation Strategy: The "5 Developers" Principle

We adhered to a strict "Frontend-First" strategy to unblock UI development from Backend Engineering.

### A. The Mock Bridge (`data/mocks.ts`)
Instead of waiting for database tables, we defined strict TypeScript interfaces for the future backend data:
*   `Task`: `{ id, status, timestamp, duration, input, output }`
*   `ScheduledJob`: `{ id, schedule, type: 'conversation' | 'workflow' }`
*   `EventTrigger`: `{ id, event, action, target }`

We populated these with high-fidelity mock data (e.g., "Draft Release Notes" workflow execution), allowing us to build the *entire* UI interaction model without a single new API route.

### B. The Unified Data Hook (`useAgentDetails.ts`)
We created a composition hook that merges:
1.  **Real Data:** Tools fetched from `/api/tools/list` (via `useAgentTools`).
2.  **Mock Data:** Task history, schedules, and records from our local store.

This architecture acts as a facade. When the backend services (Planner, Task Logging) come online, we simply update this one hook, and the complex UI components remain untouched.

---

## 4. File Impact Analysis

### Core Structure (`app/(pages)/workforce/components/agent-modal/`)
We migrated the legacy modal to `agent-modal-legacy/` and built a new modular structure.

| Component | Responsibility |
| :--- | :--- |
| `AgentModal.tsx` | **Orchestrator.** Manages `activeTab` state and renders the responsive `Dialog` shell. Fixed a critical ShadCN width constraint issue (`sm:max-w-[1400px]`). |
| `AgentHeader.tsx` | **Navigation.** Renders the identity badge and the tab navigation bar. |

### Tab Components (`components/tabs/`)
Each tab is a self-contained view.

| Tab | Key Features Implemented |
| :--- | :--- |
| `OverviewTab` | Dashboard grid. Integrates `StatusCard` (pulse animation), `AttentionList` (approvals), and `QuickActions`. |
| `ChatTab` | Wraps the existing `AgentChat` component. Adds a persistent context sidebar ("Current Focus"). |
| `TasksTab` | Renders execution history. Features an expandable **Feedback Loop** UI for critique. |
| `PlannerTab` | Splits automation into "Scheduled Jobs" (Recurring) and "Event Triggers" (Data-driven). |
| `RecordsTab` | Displays assigned tables. Renders a read-only `shadcn/table` with mock row data. |
| `CapabilitiesTab` | Renders "Tools" (Real API data) and "Workflows" (Mock data) in distinct grids. |
| `ConfigTab` | Full settings form for Objectives, Variables (`Tone`, `Output Length`), System Prompt, and Model. |

### Shared Widgets (`components/shared/`)
We extracted reusable logic to keep the tabs clean.

*   `StatusCard.tsx`: Visualizes agent state with animated indicators.
*   `TaskItem.tsx`: Handles the complex "Give Feedback" toggle state.
*   `JobCard.tsx` / `TriggerCard.tsx`: Standardized cards for automation items.
*   `QuickActions.tsx`: Functional input box on the Overview tab that jumps to Chat.

---

## 5. Critical Design Decisions

### 1. The "Assistant View" Layout
We explored three variations (Chat-Centric, Dashboard-Centric, Feed-Centric). We settled on **Variation 1 (Assistant)** because it balances the "Manager" view (Overview) with the "Collaborator" view (Chat). The **Overview Tab** acts as the landing page, providing immediate situational awareness before diving deep.

### 2. Responsive Modal Sizing
The default ShadCN dialog was too narrow (`max-w-lg`). We overrode this with `w-[95vw] max-w-[1400px] h-[85vh]`, creating an immersive, desktop-app-like feel that respects the density of information we are presenting.

### 3. Feedback Loop UI
We explicitly designed the "Give Feedback" interaction on Tasks to split into **"Edit Workflow Logic"** vs **"Refine Prompt Context"**. This acknowledges that agent errors usually stem from either *determinism* (code) or *stochasticity* (LLM), and the UI guides the user to the right fix.

---

## 6. Future Roadmap (Backend Requirements)

This UI implementation writes a specification for the Backend team to fulfill:

1.  **Planner Service:** We need a cron-based scheduler to power the `ScheduledJob` objects.
2.  **Task Persistence:** The Runtime must log every `tool.execute()` and `workflow.run()` to a database to populate the `TasksTab`.
3.  **Trigger Engine:** We need a mechanism to watch Record mutations (Polars writes) and fire `EventTrigger` actions.
4.  **Config Persistence:** We need a `PATCH` endpoint to save the `AgentConfig` updates made in the `ConfigTab`.

We have successfully simulated the end-state of the Workforce OS, allowing us to iterate on the UX immediately while the backend catches up.

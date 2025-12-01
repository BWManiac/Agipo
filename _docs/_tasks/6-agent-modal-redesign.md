# Task 6: Agent Modal Redesign (The Workforce OS)

**Status:** Planning
**Goal:** Replace the legacy Agent Modal with a robust "Workforce Operating System" dashboard based on the high-fidelity "Assistant View" design.

---

## 1. Acceptance Criteria (Testable)

These criteria must be met by the frontend implementation.

1.  **Legacy Migration:** The existing `agent-modal` folder is renamed to `agent-modal-legacy`, and the new implementation acts as the drop-in replacement in `WorkforceDashboard.tsx`.
2.  **Tab Navigation:** Users can navigate between 7 tabs: Overview, Chat, Tasks, Planner, Records, Capabilities, and Config. The "Overview" tab is the default.
3.  **Overview Dashboard:** The Overview tab renders a "Current Focus" status card (pulse animation), a "Needs Attention" list, "Recent Highlights", and functional "Quick Action" buttons (start chat/run workflow).
4.  **Chat Context:** The Chat tab renders a sidebar showing "Current Focus" and "Recent Conversations" alongside the main chat interface.
5.  **Chat Functionality:** The Chat interface connects to the existing `/api/workforce/[agentId]/chat` endpoint and supports sending/receiving messages.
6.  **Task History:** The Tasks tab renders a list of mocked "Workflow Executions" and "Tool Calls". Clicking "Give Feedback" toggles an inline feedback form.
7.  **Planner View:** The Planner tab renders mocked "Scheduled Jobs" (Time-based) and "Event Triggers" (Data-based). Triggers have a "Test Run" button that logs to console.
8.  **Capabilities Management:** The Capabilities tab renders two sections: "Tools" and "Workflows". It reuses the existing `useAgentTools` hook to populate the "Tools" section with real data.
9.  **Configuration Form:** The Config tab renders editable fields for System Prompt, Model, Objectives, and Variables. (Save button can log to console for now).
10. **Records Grid:** The Records tab renders a list of assigned tables. Clicking a table shows a read-only data grid (mocked or using a ShadCN Table).

---

## 2. Realistic Test Workflows

### Workflow A: The Morning Check-in
1.  Open Mira Patel's modal (Defaults to **Overview**).
2.  See "Current Focus: Synthesising Feedback".
3.  See "Needs Attention: Approval Required".
4.  Click "Review" on the approval item -> Navigate to **Chat** tab.
5.  Send a message: "Approved."

### Workflow B: Task Review & Feedback
1.  Navigate to **Tasks** tab.
2.  Find the "Draft Release Notes" workflow execution (Status: Completed).
3.  Click "Give Feedback".
4.  Select "Refine Prompt Context".
5.  Click "Save Feedback" (Console log success).

### Workflow C: Capability Management
1.  Navigate to **Capabilities** tab.
2.  See list of currently assigned tools (fetched from API).
3.  Click "Manage" -> Opens the existing `ToolEditor` modal (reused).
4.  Add a tool and save -> List updates.

---

## 3. Current State Exploration

| Feature | Current File | Current API | Notes |
| :--- | :--- | :--- | :--- |
| **Modal Shell** | `workforce/components/agent-modal/index.tsx` | N/A | Monolithic orchestrator. |
| **Chat** | `.../AgentChatSection.tsx` + `AgentChat.tsx` | `/api/workforce/[id]/chat` | Uses Vercel AI SDK `useChat`. |
| **Tool List** | `.../info-panel/ToolUsageList.tsx` | `/api/tools/list` | Fetched via `useAgentTools`. |
| **Tool Assignment** | `.../ToolEditor.tsx` | `/api/workforce/[id]/tools` | POST to update `toolIds`. |
| **Agent Data** | `_tables/agents/*.ts` | Static Import | Loaded server-side or passed as prop. |

**Gap Analysis:**
*   **Missing Data:** Tasks, Schedules, Triggers, Feedback history, and Records access do not have backend endpoints yet. We will use **Mock Data Stores** (local arrays) within the components to satisfy the UI requirements.
*   **Missing Write Ops:** We cannot save "System Prompt" or "Objectives" yet. The "Save" button in Config will be a stub.

---

## 4. File Impact Analysis (Detailed)

We will create a new directory structure `app/(pages)/workforce/components/agent-modal/`.

### A. Core Structure
| File | Purpose | Dependencies |
| :--- | :--- | :--- |
| `index.tsx` | Public export. Wraps `AgentModal.tsx`. | |
| `AgentModal.tsx` | Root component. Manages `activeTab` state. Renders `Dialog` and `AgentHeader`. | `ui/dialog`, `lucide-react` |
| `components/AgentHeader.tsx` | Renders Avatar, Name, Status, and **Tab Navigation**. | `ui/tabs` (custom styled) |

### B. Tab Components (`components/tabs/`)
Each file corresponds to a tab content area.

| File | Purpose | Key Children / Logic |
| :--- | :--- | :--- |
| `OverviewTab.tsx` | Dashboard view. | `StatusCard`, `AttentionList`, `QuickActions`, `ActivityHighlights` |
| `ChatTab.tsx` | Chat interface. | `ChatSidebar` (mock context), `ChatStream` (wraps `AgentChat`). |
| `TasksTab.tsx` | Execution history. | `TaskList` (mock data), `FeedbackForm`. |
| `PlannerTab.tsx` | Schedule & Triggers. | `ScheduledJobsList` (mock), `TriggerList` (mock). |
| `RecordsTab.tsx` | Data access view. | `AssignedTablesList` (mock), `DataGridPreview` (ui/table). |
| `CapabilitiesTab.tsx` | Tools & Workflows. | `ToolsGrid` (uses `useAgentTools`), `WorkflowsGrid` (mock). |
| `ConfigTab.tsx` | Settings form. | `SystemForm`, `ObjectivesForm`, `VariablesForm`. |

### C. Shared UI Components (`components/shared/`)
Reusable widgets specific to the agent modal.

| File | Purpose | Dependencies |
| :--- | :--- | :--- |
| `StatusCard.tsx` | "Current Focus" card with pulse animation. | Tailwind `animate-pulse` |
| `MetricCard.tsx` | Small stats card for Overview. | |
| `ActionWidget.tsx` | The "Approval" card shown in chat/overview. | |

### D. Hooks (`hooks/`)
| File | Purpose |
| :--- | :--- |
| `useAgentDetails.ts` | Extends `useAgentTools`. Returns mocked Tasks/Schedule data alongside real Tools data. |

---

## 5. Implementation Strategy (Succinct)

1.  **Rename:** `agent-modal` -> `agent-modal-legacy`.
2.  **Scaffold:** Create `agent-modal/index.tsx` and `agent-modal/AgentModal.tsx` with the Tab State logic.
3.  **Iterate:** Build one tab at a time, starting with **Overview** (the default).
4.  **Reuse:** Import `AgentChat` into `ChatTab.tsx` and `ToolEditor` into `CapabilitiesTab.tsx` to preserve existing functionality.
5.  **Mock:** Create a `data/mocks.ts` file to hold the dummy data for Tasks, Schedules, and Records until the backend is ready.

This approach delivers the **Full UI Experience** immediately without being blocked by backend engineering.


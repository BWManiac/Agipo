# Task 6: Agent Modal Redesign (The Workforce OS)

**Status:** Planning
**Visual Reference:** `_docs/UXD/Pages/agents/variation-1-assistant.html`
**Goal:** Replace the legacy Agent Modal with a robust "Workforce Operating System" dashboard based on the high-fidelity "Assistant View" design.

---

## 1. Acceptance Criteria (Testable)

These criteria must be met by the frontend implementation.

1.  **Legacy Migration:** The existing `agent-modal` folder is renamed to `agent-modal-legacy`. The new implementation is a drop-in replacement in `WorkforceDashboard.tsx`.
2.  **Tab Navigation:** The modal renders 7 tabs: Overview (Default), Chat, Tasks, Planner, Records, Capabilities, Config. Clicking a tab updates the active view state.
3.  **Overview Dashboard:** Renders the exact layout from `variation-1-assistant.html`: Status Card (animated), Needs Attention list, Recent Highlights list, and Quick Actions (with functional input box).
4.  **Chat Context:** Renders a persistent sidebar on the left of the Chat tab showing "Current Focus" and "Recent Conversations" list (mocked).
5.  **Chat Functionality:** Integrates the existing `AgentChat` component to preserve real Vercel AI SDK functionality (streaming, tool calls).
6.  **Task History:** Renders a list of "Workflow Executions" and "Tool Calls". Each item has a "Give Feedback" button that toggles an inline form with "Edit Workflow" / "Refine Prompt" options.
7.  **Planner View:** Renders "Scheduled Jobs" (Recurring) and "Event Triggers" (Data-based). Trigger cards include a "Test Run" button that logs to console.
8.  **Capabilities Management:** Renders "Tools" (fetched via `useAgentTools`) and "Workflows" (mocked) in a card grid. Reuses the existing `ToolEditor` modal for tool management.
9.  **Configuration Form:** Renders fully editable inputs for Objectives, Variables (Tone/Length), System Prompt, and Model. The "Save" button logs the payload to console.
10. **Records Grid:** Renders a list of assigned tables. Clicking a table renders a ShadCN `Table` component populated with mock data.

---

## 2. Realistic Test Workflows

### Workflow A: The Morning Check-in
1.  Open Mira Patel's modal (Defaults to **Overview**).
2.  Verify "Current Focus" shows "Synthesising Feedback".
3.  Verify "Needs Attention" shows "Approval Required".
4.  Click "Review" on the approval item -> Verify active tab switches to **Chat**.
5.  Type "Approved" in chat -> Verify message sends.

### Workflow B: Task Review & Feedback
1.  Navigate to **Tasks** tab.
2.  Locate "Draft Release Notes" (Status: Completed).
3.  Click "Give Feedback" -> Verify form expands.
4.  Click "Refine Prompt Context" -> Verify console log "Feedback: Refine Prompt Context".

### Workflow C: Capability Management
1.  Navigate to **Capabilities** tab.
2.  Verify "Tools" section loads real data.
3.  Click "Manage" -> Verify `ToolEditor` modal opens.
4.  Add a tool and save -> Verify list updates.

---

## 3. Detailed File Impact Analysis

**Root Directory:** `app/(pages)/workforce/components/agent-modal/`

### A. Root & Layout
| File | Props/Exports | Logic & Responsibility |
| :--- | :--- | :--- |
| `index.tsx` | `AgentModalProps` | **Public Entry Point.** Simply exports `AgentModal` to maintain import compatibility with `WorkforceDashboard`. |
| `AgentModal.tsx` | `AgentModalProps` | **Orchestrator.**<br>1. Manages `activeTab` state (`useState<TabId>('overview')`).<br>2. Renders `Dialog` shell (full screen/large).<br>3. Renders `AgentHeader` (fixed top).<br>4. Renders active Tab Component based on state switch.<br>5. Passes `agent` and `onTabChange` to children. |
| `components/AgentHeader.tsx` | `agent: AgentConfig`<br>`activeTab: TabId`<br>`onTabChange: (id: TabId) => void` | **Navigation.**<br>1. Displays Avatar, Name, Status badge.<br>2. Renders horizontal list of buttons for tabs (Overview, Chat, Tasks, etc.).<br>3. Applies `.active` styling (border-b-black) to current tab.<br>4. Renders "Close" and "Minimize" actions. |

### B. Tab Components (`components/tabs/`)
Each component corresponds to a distinct view in the mockups.

| File | Props | Key Children & Implementation Notes |
| :--- | :--- | :--- |
| `OverviewTab.tsx` | `agent: AgentConfig`<br>`onTabChange: (id) => void` | **Dashboard Grid.**<br>1. **Grid Layout:** 12-col grid (7/5 split).<br>2. **Left Col:** `<StatusCard>` (hardcoded state), `<AttentionList>` (mock items).<br>3. **Right Col:** `<QuickActions>` (input + buttons), `<ActivityHighlights>` (list).<br>4. **Logic:** Quick Action "Message" button triggers `onTabChange('chat')` and passes draft text (via context/state later, or just switch for now). |
| `ChatTab.tsx` | `agent: AgentConfig` | **Chat Interface.**<br>1. **Layout:** Flex row (Sidebar 250px / Main Flex).<br>2. **Sidebar:** `<ChatSidebar>` rendering "Current Focus" and "Recent Conversations" (mock list).<br>3. **Main:** Wraps existing `<AgentChat>` component. *CRITICAL:* Must ensure `<AgentChat>` fits within the flex container (height: 100%). |
| `TasksTab.tsx` | `agent: AgentConfig` | **History.**<br>1. Fetches tasks via `useAgentDetails`.<br>2. Renders `<TaskList>` mapping tasks to `<TaskItem>`.<br>3. **Feedback:** `TaskItem` manages its own `isOpen` state for the feedback form. |
| `PlannerTab.tsx` | `agent: AgentConfig` | **Automation.**<br>1. Fetches jobs/triggers via `useAgentDetails`.<br>2. **Section 1:** "Scheduled Jobs" -> Grid of `<JobCard>` (Morning Briefing / Weekly Report).<br>3. **Section 2:** "Event Triggers" -> List of `<TriggerCard>` (New Lead). |
| `RecordsTab.tsx` | `agent: AgentConfig` | **Data View.**<br>1. Fetches records via `useAgentDetails`.<br>2. **Section 1:** "Assigned Tables" -> Header with "+ Assign Table" button.<br>3. **Section 2:** `<DataGrid>` -> Uses `ui/table` to render the rows of the selected table (e.g. "Stakeholder Interviews"). |
| `CapabilitiesTab.tsx` | `agent: AgentConfig` | **Toolbox.**<br>1. Fetches tools via `useAgentTools` (Real API).<br>2. Fetches workflows via `useAgentDetails` (Mock).<br>3. **Section 1:** Tools Grid -> `<ToolCard>`.<br>4. **Section 2:** Workflows Grid -> `<WorkflowCard>`.<br>5. **Action:** "Manage" button toggles `toolEditorOpen` state in parent (or local). |
| `ConfigTab.tsx` | `agent: AgentConfig` | **Settings.**<br>1. **Layout:** Single column form.<br>2. **Inputs:** System Prompt (`Textarea`), Model (`Select`), Objectives (`Textarea`), Variables (Key/Value pairs).<br>3. **State:** Local `formData` state initialized from `agent` prop.<br>4. **Action:** "Save Changes" logs `formData` to console. |

### C. Shared UI Components (`components/shared/`)
Reusable widgets extracted from the HTML mockup to keep Tab components clean.

| File | Props | Implementation Detail |
| :--- | :--- | :--- |
| `StatusCard.tsx` | `status: string`<br>`step: string` | Renders "Current Focus" card. Uses `animate-pulse` for green dot. Progress bar value hardcoded for now (45%). |
| `AttentionList.tsx` | `items: AttentionItem[]` | Renders list of "Approval Required" / "Missing Credentials" cards. Each has a primary action button. |
| `QuickActions.tsx` | `onChat: (msg) => void` | Renders Input + Send button. On submit, calls `onChat(text)`. |
| `ActivityHighlights.tsx`| `activities: Activity[]` | Simple list of recent actions (icon + title + time). |
| `TaskItem.tsx` | `task: Task` | Complex card. Displays Status Badge, Title, Duration. **Internal State:** `showFeedback` (bool). Renders `<FeedbackForm>` when true. |
| `JobCard.tsx` | `job: ScheduledJob` | Renders Job Title, Schedule (e.g. "9:00 AM Daily"), and Description. |
| `TriggerCard.tsx` | `trigger: EventTrigger` | Renders Trigger Event (e.g. "Record Added") and Action (e.g. "Run Workflow"). Includes "Test Run" button. |
| `ToolCard.tsx` | `tool: Tool` | Renders Tool Icon, Name, Description, and "Read/Write" badge. |
| `WorkflowCard.tsx` | `workflow: Workflow` | Similar to ToolCard but with "Workflow" badge and specific styling. |

### D. Data & State (`hooks/` & `data/`)
This layer bridges the gap between the UI and the (currently non-existent) backend services.

| File | Purpose | Content |
| :--- | :--- | :--- |
| `data/mocks.ts` | **Mock Data Store.** | **Exports Types:** `Task`, `ScheduledJob`, `EventTrigger`, `MockRecord`.<br>**Exports Data:**<br>`MOCK_TASKS`: Array of completed/in-progress tasks.<br>`MOCK_JOBS`: "Morning Briefing", "Weekly Report".<br>`MOCK_TRIGGERS`: "New Lead", "Support Ticket".<br>`MOCK_RECORDS`: "Stakeholder Interviews" rows. |
| `hooks/useAgentDetails.ts` | **Unified Data Access.** | **Imports:** `useAgentTools` (Real), `MOCK_DATA` (Mock).<br>**Returns:** `{ tools: Tool[], workflows: Workflow[], tasks: Task[], jobs: Job[], triggers: Trigger[], records: Record[] }`.<br>**Logic:** Merges real tool data with mock operational data to provide a complete data shape for the UI. |

---

## 4. Implementation Sequence (5-Developer Principle)

Follow this order strictly. Each phase builds upon the previous one.

### Phase 1: Migration & Shell (Commit 1)
**Goal:** Get the new modal opening with working tab navigation.
1.  Rename `agent-modal` -> `agent-modal-legacy` in `app/(pages)/workforce/components`.
2.  Create `app/(pages)/workforce/components/agent-modal/` and `components/`.
3.  Create `AgentModal.tsx` (State: `activeTab`, Render: `Dialog`).
4.  Create `components/AgentHeader.tsx` (Render: Avatar, Tab Buttons).
5.  Create `index.tsx` (Export `AgentModal`).
6.  **Verification:** Click an agent in `WorkforceDashboard`. New modal opens. Tabs click and change active state (console log "Tab changed: chat").

### Phase 2: The Data Layer (Commit 2)
**Goal:** Define the data contracts so UI components have typed props.
1.  Create `data/mocks.ts`. define Interfaces (`Task`, `Job`, etc.) and `const MOCK_DATA`.
2.  Create `hooks/useAgentDetails.ts`. Import `useAgentTools`. Return composed object.
3.  **Verification:** Import hook in `AgentModal`. Log output. Confirm it contains both real tools and mock tasks.

### Phase 3: The Dashboard (Overview) (Commit 3)
**Goal:** Implement the complex "landing page" of the modal.
1.  Create `components/shared/StatusCard.tsx` (Copy HTML structure from variation-1).
2.  Create `components/shared/AttentionList.tsx`.
3.  Create `components/shared/QuickActions.tsx`.
4.  Create `components/shared/ActivityHighlights.tsx`.
5.  Create `components/tabs/OverviewTab.tsx`. Assemble the above.
6.  **Verification:** Open modal. Overview tab matches mockup.

### Phase 4: Chat & Capabilities (Commit 4)
**Goal:** Port existing functionality into the new layout.
1.  Create `components/tabs/ChatTab.tsx`. Import `AgentChat`. Add `div.w-64` sidebar with mock "Recent Conversations".
2.  Create `components/shared/ToolCard.tsx` and `WorkflowCard.tsx`.
3.  Create `components/tabs/CapabilitiesTab.tsx`. Use data from `useAgentDetails`. Render grids.
4.  **Verification:** Chat works (sends messages). Capabilities tab shows real tools assigned to the agent.

### Phase 5: Tasks & Planner (Commit 5)
**Goal:** Implement the new "Workforce" features.
1.  Create `components/shared/TaskItem.tsx` + `FeedbackForm` (internal).
2.  Create `components/tabs/TasksTab.tsx`. Map `MOCK_TASKS`.
3.  Create `components/shared/JobCard.tsx` and `TriggerCard.tsx`.
4.  Create `components/tabs/PlannerTab.tsx`. Map `MOCK_JOBS` and `MOCK_TRIGGERS`.
5.  **Verification:** Tasks show up. "Give Feedback" toggles the form. Planner shows jobs.

### Phase 6: Config & Records (Commit 6)
**Goal:** Finalize the remaining views.
1.  Create `components/tabs/ConfigTab.tsx`. Add Inputs for System Prompt, Objectives.
2.  Create `components/tabs/RecordsTab.tsx`. Render "Assigned Tables" list. Render `Table` (ShadCN) with `MOCK_RECORDS`.
3.  **Verification:** Config fields are editable. Records tab shows the data table.

---

## 5. Reference Links
*   **Visual Truth:** `_docs/UXD/Pages/agents/variation-1-assistant.html`
*   **Logic Truth:** `_tables/agents/*.ts` (Agent Config Schema)

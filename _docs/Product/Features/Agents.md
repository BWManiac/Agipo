# Feature: Agents (The Workforce Operating System)

**Status:** Planning (High-Fidelity Mockup Complete)
**Date:** November 30, 2025

---

## 1. Philosophy: The Workforce OS

We are transitioning Agipo from a "Chatbot Platform" to a **Workforce Operating System**. In this paradigm, an Agent is not a transient LLM session but a persistent **Digital Employee**.

This shift requires us to treat Agents with the same structural rigor as human employees. They are not just "prompted"; they are **Hired**, **Onboarded**, **Managed**, and **Evaluated**.

### The Employee Metaphor
| Human Employee | Agipo Agent |
| :--- | :--- |
| **Role & Resume** | **Identity & Config** (System Prompt, Model, Persona) |
| **Knowledge Base** | **Memory** (Sessions, Records, Context) |
| **Skills & Access** | **Capabilities** (Tools, Workflows, Permissions) |
| **Calendar** | **Planner** (Scheduled Jobs, Event Triggers) |
| **OKRs / KPIs** | **Directives** (Objectives, Guardrails) |
| **Performance Review** | **Feedback Loop** (Task Evaluation, Optimization) |

---

## 2. Core Primitives

The Agent architecture is built upon six foundational primitives. These are the atomic units of the Workforce OS.

### 2.1 Identity (Who)
The static definition of the agent.
*   **Persona:** Name, Avatar, Role (e.g., "Mira Patel, Product Manager").
*   **Configuration:** The underlying LLM (e.g., Gemini 2.5 Pro), Temperature, and System Prompt.
*   **Variables:** User-defined environment variables (e.g., `TONE="Professional"`, `MAX_BUDGET=500`) that modulate behavior without code changes.

### 2.2 Memory (What they Know)
The stateful context the agent accesses.
*   **Sessions (Short-term):** The active chat history. Agents must remember the immediate conversation.
*   **Records (Long-term):** Structured access to the **Records Domain**. Agents are assigned read/write permissions to specific Tables (e.g., "Leads", "Jira Tickets"). This is their "Hard Drive."
*   **Context (Ambient):** The "Right Now". Agents must be aware of the current date, time, and the specific task they are executing.

### 2.3 Capabilities (What they Do)
The executable logic assigned to the agent.
*   **Tools (Atomic):** Single-purpose functions (e.g., `send_email`, `query_postgres`). These are often wrappers around external APIs.
*   **Workflows (Compound):** Deterministic, multi-step processes authored in the Workflow Editor (e.g., "Draft Release Notes" = `query_jira` -> `summarize` -> `format_markdown`).
*   *Key Distinction:* Tools are capabilities; Workflows are *standard operating procedures* (SOPs).

### 2.4 Planner (When they Act)
The temporal dimension of the agent. Agents don't just react; they initiate.
*   **Scheduled Jobs:** Time-based execution.
    *   *Conversational:* "Wake up at 9 AM and message me a briefing."
    *   *Headless:* "Run the 'Sync CRM' workflow every Friday at 5 PM."
*   **Event Triggers:** Data-driven execution.
    *   *Logic:* `WHEN RecordAdded(Table='Support Tickets', Priority='P1') THEN Run(Workflow='Alert Team')`

### 2.5 Directives (Why they Act)
The high-level guidance system.
*   **Objectives:** Positive constraints. What success looks like (e.g., "Increase user retention", "Keep responses concise").
*   **Guardrails:** Negative constraints. What is forbidden (e.g., "Never approve budget > $1k", "Do not use emojis in external emails").

### 2.6 Feedback (How they Improve)
The optimization loop.
*   **Task Review:** Users can view the input/output of any execution (Tool or Workflow).
*   **Correction:** Users provide specific feedback on a task.
    *   *Logic Feedback:* "The workflow failed because the date format was wrong." (Leads to editing the Workflow).
    *   *Context Feedback:* "You missed the nuance of this ticket." (Leads to refining the System Prompt).

---

## 3. UX Architecture: The Assistant View

The Agent interaction model is centralized in a unified "Agent Modal," designed to feel like a Manager's Dashboard. It is divided into **7 Functional Tabs**.

### Tab 1: Overview (The Landing Page)
*   **Purpose:** Instant situational awareness. "Is this agent working? Do they need me?"
*   **Components:**
    *   **Current Status:** Real-time pulse of active tasks (e.g., "Synthesising Feedback - Step 2/4").
    *   **Needs Attention:** Blockers (missing credentials) and Approval Requests (human-in-the-loop gates).
    *   **Recent Highlights:** Summary of the last 3 significant actions.
    *   **Quick Actions:** One-click access to start a chat or run common workflows ("Run Standup").

### Tab 2: Chat (The Interface)
*   **Purpose:** Natural language collaboration and delegation.
*   **Components:**
    *   **Main Stream:** The conversation history. Supports rich UI widgets (e.g., "Approval Cards" embedded in chat).
    *   **Context Sidebar:** "Recent Conversations" list to jump between topics, mirroring a human's memory of past threads.

### Tab 3: Tasks (The History)
*   **Purpose:** Auditability and improvement. "What did you do, and did you do it right?"
*   **Components:**
    *   **Execution Log:** Chronological list of all Tool Calls and Workflow Runs.
    *   **Detail View:** Collapsible cards showing Input arguments and Output results (JSON).
    *   **Feedback Loop:** "Give Feedback" button opening a flow to critique logic or prompt.

### Tab 4: Planner (The Schedule)
*   **Purpose:** Automation management. "What will you do next?"
*   **Components:**
    *   **Scheduled Jobs:** Cards showing recurring tasks (Time + Action). Distinguishes between "Conversational" (starts a chat) and "Silent" (runs background workflow) jobs.
    *   **Event Triggers:** Cards showing logic-based triggers (When X, Then Y). Includes "Test Run" buttons for debugging.

### Tab 5: Records (The Memory)
*   **Purpose:** Data transparency. "What do you know?"
*   **Components:**
    *   **Assigned Tables:** List of Tables this agent can access.
    *   **Data Grid:** Read-only preview of the actual data rows (e.g., "Stakeholder Interviews").
    *   **Permissions:** Indicators of Read vs. Read/Write access.

### Tab 6: Capabilities (The Toolbox)
*   **Purpose:** Skill management. "What are you trained to do?"
*   **Components:**
    *   **Tools List:** Grid of atomic capabilities (e.g., "Jira Integration").
    *   **Workflows List:** Grid of compound SOPs (e.g., "Weekly Report").
    *   **Management:** Interface to assign/unassign capabilities from the global registry.

### Tab 7: Config (The Brain)
*   **Purpose:** Deep behavior tuning. "Who are you?"
*   **Components:**
    *   **Objectives & Guardrails:** Free-text fields to define high-level goals.
    *   **Variables:** Dropdowns/Inputs for `Tone`, `Output Length`, etc.
    *   **System Definition:** Raw editor for System Prompt and Model selection.

---

## 4. Technical Implementation Strategy

### Data Models
To support this robust UI, our data structures (`_tables/agents/*.ts`) need to evolve.

**AgentConfig Schema (Draft):**
```typescript
type AgentConfig = {
  id: string;
  identity: {
    name: string;
    role: string;
    avatar: string;
  };
  config: {
    model: string;
    systemPrompt: string;
    variables: Record<string, string>; // e.g. { tone: "Professional" }
  };
  directives: {
    objectives: string[];
    guardrails: string[];
  };
  capabilities: {
    toolIds: string[];     // Atomic tools
    workflowIds: string[]; // Compound workflows
  };
  planner: {
    jobs: ScheduledJob[];
    triggers: EventTrigger[];
  };
  memory: {
    tableIds: string[];    // Assigned records
  };
};
```

### Execution Engine
*   **Chat:** Powered by Vercel AI SDK.
*   **Planner:** Requires a lightweight scheduler (e.g., `node-cron` or a DB-backed queue) to fire events.
*   **Records:** Powered by our `polars` service layer.
*   **Feedback:** New `feedback` table in Records domain to store user critiques associated with specific `runIds`.

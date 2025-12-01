# Feature: Integrations & Capabilities (The Connected Workforce)

**Status:** Planning
**Date:** December 1, 2025
**Owner:** Engineering
**Dependencies:** `Workflow-as-Code`, `Agents`

---

## 1. Executive Summary

The **Integrations** feature is the nervous system of the Workforce OS. It transforms Agipo from a closed ecosystem into a **Connected System** where Agents can "see" outside data and "act" upon external applications. 

Currently, Agents are isolated—they cannot read emails, update Jira tickets, or sync with calendars. This feature bridges that gap by implementing a unified **Integration Kernel** powered by **Composio**. This kernel solves three critical challenges:
1.  **Managed Authentication:** Handling OAuth tokens, refresh cycles, and scopes for thousands of services without building a bespoke auth layer.
2.  **Tool Injection:** Dynamically hydrating transpiled `run.js` scripts with secure credentials at runtime, enabling "dry" code to perform "wet" actions.
3.  **Event Listeners:** Replacing inefficient polling with a real-time Trigger system that wakes Agents up when external events occur (e.g., "New Lead in HubSpot").

By delivering this, we evolve the Agent from a passive chatbot into a proactive **Digital Employee** capable of end-to-end autonomous work.

---

## 2. Goals & Objectives

**Primary Goal:**
To engineer a robust, secure, and scalable **Integration Layer** that enables Agents to natively authenticate with, query, and manipulate external software platforms.

**Secondary Goals:**
*   **Developer Experience:** Ensure the `Workflow-as-Code` transpiler can seamlessly consume these integrations without complex configuration.
*   **User Trust:** Provide a transparent "Permissions" UI where managers can audit exactly which Agents have access to which external accounts.

### Acceptance Criteria
*   **Connection UI:** A user can navigate to `/settings/integrations`, click "Connect Gmail," successfully complete the OAuth flow, and see a "Connected" status linked to their `userId`.
*   **Tool Discovery:** The Workflow Editor's "Add Node" menu automatically populates with actions (e.g., `gmail_send_email`) fetched dynamically from the Composio SDK.
*   **Transpilation Support:** A transpiled workflow file (`run.js`) containing a "Send Email" node executes successfully in an isolated environment when provided with a valid `connection_id` at runtime.
*   **Trigger Wiring:** Adding a "New Email" trigger to an Agent's Planner successfully registers a webhook, and receiving a real email causes the system to log a "Trigger Fired" event for that Agent.
*   **AI SDK Compatibility:** The `Chat` interface successfully invokes a Composio tool (e.g., "Search Docs") via the Vercel AI SDK's `streamUI` or `streamText` functions, with the LLM intelligently populating arguments.

---

## 3. Architecture: The Integration Kernel

We will implement **Composio** as the backbone of our integration strategy. The architecture is divided into three distinct functional layers:

### 3.1. The Auth Layer (Connection Management)
This layer handles the secure handshake between Agipo and external providers.
*   **Concept:** We map an Agipo User (or Organization) to a Composio `Entity`. This ensures multi-tenant security—User A's Agent cannot access User B's Gmail.
*   **Flow:**
    1.  **Initiation:** User clicks "Connect Gmail" in Agipo settings.
    2.  **Handoff:** Agipo requests an Auth URL from Composio API for the specific `Entity`.
    3.  **Consent:** User completes the OAuth flow on Google's side.
    4.  **Storage:** Composio securely stores the refresh tokens. Agipo stores only the `connection_id` (e.g., `google-oauth2-uuid`) and metadata (email, avatar).
    5.  **Scope Management:** We implement "Just-in-Time" scoping. We do not request "Read Mail" and "Write Drive" simultaneously. Scopes are additive and requested only when a specific Tool is enabled.

### 3.2. The Capability Layer (Tool Injection)
This layer bridges the gap between the static "Code" and the dynamic "Runtime".
*   **Discovery:** The Workflow Editor queries the Composio API to fetch the JSON Schema for available actions (e.g., `googlesheets.get_values`). This schema drives the UI for the Node Inspector.
*   **Transpilation Strategy:**
    *   *Current State:* `run.js` scripts are self-contained.
    *   *New State:* `run.js` scripts export a function signature: `async function run({ env, connections })`.
    *   *Injection:* When the Runner executes a workflow, it looks up the necessary `connection_id` from the database and passes it into the function. The script uses this ID to initialize the `ComposioToolSet`.
*   **Execution Contexts:**
    *   **Agent Chat:** The Vercel AI SDK `tool()` definitions are generated on the fly using the active user's `connection_id`.
    *   **Background Jobs:** The `WorkflowExecutionService` retrieves the connection ID associated with the *Agent's owner* to perform the action headless.

### 3.3. The Trigger Layer (Event Bus)
This layer enables "Push" architecture for Agents.
*   **Registration:** When a user adds a "New Email" trigger to an Agent's Planner:
    1.  Agipo calls Composio to subscribe to the `gmail.new_email` event for that Entity.
    2.  We store a record in `_tables/triggers` linking the `subscription_id` to the `agent_id` and `workflow_id`.
*   **Routing Logic:**
    1.  **Event:** An email arrives in Gmail.
    2.  **Webhook:** Composio sends a standardized JSON payload to `https://api.agipo.com/integrations/webhook`.
    3.  **Dispatch:** Agipo's `WebhookController` validates the signature, extracts the `subscription_id`, looks up the target Agent, and enqueues a Job.
    4.  **Execution:** The Job Runner wakes up the Agent and executes the assigned Workflow, passing the email body as `input`.

---

## 4. User Experience & UI Design

### 4.1. Managing Connections
*   **Location:**
    *   **Global:** `/settings/integrations` - A control center for all user connections.
    *   **Contextual:** Agent Modal > **Capabilities** tab.
*   **UI Components:**
    *   **Service Grid:** A layout of cards (GitHub, Slack, HubSpot) showing connection status.
    *   **Status Badges:**
        *   🟢 **Connected:** Token is valid.
        *   🟡 **Needs Re-auth:** Refresh token expired or scopes changed.
        *   ⚪ **Disconnected:** No active link.
    *   **Audit Log:** A localized history within the card showing "Last used by Agent X 5 mins ago."

### 4.2. Using Tools (Workflow Editor)
*   **Palette Update:** A new "Integrations" category appears in the Node Sidebar.
*   **Dynamic Node Configuration:**
    *   When a user drags "Send Email" onto the canvas, the Node Inspector detects required connections.
    *   **Dropdown:** "Select Connection: [My Personal Gmail] | [Work Gmail]".
    *   **Dynamic Mode:** "Use Connection of the Agent running this workflow." (Allows generic workflows).

### 4.3. Configuring Triggers (Agent Modal)
*   **Tab:** **Planner**.
*   **Action:** "+ Add Trigger".
*   **Wizard Step 1 (Source):** Select Provider (e.g., "GitHub").
*   **Wizard Step 2 (Event):** Select Event (e.g., "Pull Request Opened").
*   **Wizard Step 3 (Conditions):** Define JSON-logic filters (e.g., `repository == "agipo/frontend"`).
*   **Wizard Step 4 (Action):** Select Workflow to run.
*   **Result:** A simplified "Trigger Card" appears in the Planner view.

---

## 5. Technical Implementation Plan

### Phase 1: Foundation & Auth (The "Plumbing")
*   **Objective:** Enable users to authenticate with Google and GitHub.
*   **Tasks:**
    1.  **SDK Setup:** Install `composio-core` and `composio-node`. Configure `COMPOSIO_API_KEY` in `.env`.
    2.  **Entity Service:** Create `lib/integrations/entity.ts` with `getOrCreateEntity(userId)`.
    3.  **Settings UI:** Build `app/(pages)/settings/integrations/page.tsx` with the Service Grid.
    4.  **OAuth Handler:** Implement the API route to initiate and callback the auth flow.

### Phase 2: Agent Tooling (The "Hands")
*   **Objective:** Allow Agents to use Tools in Chat.
*   **Tasks:**
    1.  **Tool Transformation:** Create a utility `composioToVercel(toolName)` that wraps the Composio action in a Vercel AI SDK `tool()` object.
    2.  **Agent Context:** Update `AgentChat.tsx` to fetch enabled tools for the specific Agent.
    3.  **Stream Integration:** Modify `api/chat/route.ts` to inject the dynamic tool definitions into `streamText`.

### Phase 3: Workflow Transpiler Update
*   **Objective:** Enable "Workflow-as-Code" to use Integrations.
*   **Tasks:**
    1.  **Spec Update:** Modify the `WorkflowNode` data structure to include `connectionId` (or `connectionRef`).
    2.  **Runtime Injection:** Modify the generated `run.js` template.
        *   *Before:* `async function run() { ... }`
        *   *After:* `async function run({ connections }) { ... }`
    3.  **Wrapper Generation:** The transpiler must generate:
        ```javascript
        const { OpenAIToolSet } = require('composio-core');
        const toolset = new OpenAIToolSet({ entityId: process.env.ENTITY_ID }); // Or connection ID
        // ... logic to execute action
        ```

### Phase 4: Triggers (The "Ears")
*   **Objective:** Enable Passive Activation of Agents.
*   **Tasks:**
    1.  **Webhook Endpoint:** Create `/api/integrations/webhook` to receive POST requests.
    2.  **Dispatcher:** Implement `WebhookController` to map `event.subscription_id` -> `AgentID`.
    3.  **Queue System:** Simple database-backed job queue (`_tables/jobs`) to persist the event until the Agent "wakes up" to process it.

---

## 6. Data Model Changes

We need to extend the `AgentConfig` schema to support these new capabilities.

**AgentConfig Update (`_tables/types.ts`):**
```typescript
type AgentConfig = {
  // ... existing fields
  integrations: {
    /**
     * List of Catalog IDs this agent is allowed to use.
     * e.g., ["gmail", "github", "hubspot"]
     */
    enabledCatalogs: string[]; 

    /**
     * Specific connection overrides.
     * If not present, uses the Owner's default connection for that catalog.
     * e.g., { "gmail": "conn_12345" }
     */
    connectionOverrides?: Record<string, string>; 
  };
  planner: {
    triggers: Array<{
      id: string;
      provider: string; // "composio"
      event: string;    // "gmail.new_email"
      filters: Record<string, any>; // JSON Logic
      action: { 
          type: "workflow" | "chat"; 
          id: string; // Workflow ID or Quick Prompt
      };
      active: boolean;
    }>;
  }
}
```

---

## 7. Risks & Mitigation Strategy

### 7.1. Token Expiry & Disconnection
*   **Risk:** Long-running autonomous agents fail silently when a refresh token expires or is revoked by the provider.
*   **Mitigation:** 
    1.  Subscribe to Composio's system events (`connection.disconnected`).
    2.  When received, flag the Agent's status as **"Needs Attention"** in the Dashboard.
    3.  Send a notification to the user: "Agent Mira paused: Gmail connection requires re-authentication."

### 7.2. Security & Scope Creep
*   **Risk:** An Agent configured for "Read Only" access accidentally getting "Write" access, or accessing the wrong user's data in a multi-user org.
*   **Mitigation:**
    1.  **Entity Isolation:** Strict 1:1 mapping of Agipo User to Composio Entity.
    2.  **Least Privilege:** Agents only request the scopes needed for the Tools explicitly assigned to them.

### 7.3. Cost & Rate Limits
*   **Risk:** An infinite loop in a workflow (e.g., "Reply to Email" -> "New Email Trigger" -> "Reply to Email") draining API quotas and incurring costs.
*   **Mitigation:**
    1.  **Circuit Breaker:** The Execution Engine will enforce a hard limit (e.g., max 50 actions/hour per Agent).
    2.  **Loop Detection:** The Dispatcher will check if the Trigger event was caused by the Agent itself (requires metadata tracing).

---

## 8. Success Metrics

*   **Time to First Action:** A new user can sign up, connect a Gmail account, and have an Agent send a test email within **5 minutes**.
*   **Reliability:** Less than **1%** failure rate on Tool Calls due to authentication/token errors.
*   **Adoption:** **40%** of active Agents have at least one active Integration or Trigger configured within 30 days of launch.


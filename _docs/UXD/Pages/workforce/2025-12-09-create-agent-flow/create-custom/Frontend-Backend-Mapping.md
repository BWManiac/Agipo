# Create Agent Flow - Frontend-Backend Mapping

**Date:** December 9, 2025  
**Status:** Implementation Planning  
**Purpose:** Map frontend UI steps to backend API requirements and implementation plan

---

## Overview

**Flow Type:** Modal Dialog  
**Total Steps:** 3 (Step 3 is optional)  
**Focus:** Path 1 (Create Custom Agent) for MVP

---

## Step 1: Identity (`01-identity-step.html`)

### Purpose
First step of the create agent wizard - collect basic agent identity information.

### Fields Required
- **Agent Name** (required, text input, min 2 chars)
- **Role** (required, text input, min 2 chars)
- **Avatar** (required, emoji picker, default: "🤖")
- **Description** (optional, textarea)

### UI Elements
- Step indicator: "Step 1 of 3"
- Form with labels and inputs
- Help text: "You can add tools and capabilities after creating the agent"
- "Next" button (disabled until name and role filled)
- Validation feedback (inline errors)

### API Requirements

**No API calls needed** - This step only collects form data. All data is submitted together in Step 3.

**Data Collected:**
```typescript
{
  name: string;
  role: string;
  avatar: string;
  description?: string;
}
```

---

## Step 2: Personality (`02-personality-step.html`)

### Purpose
Define agent's core behavior and personality.

### Fields Required
- **Instructions** (required, large textarea, min 10 chars, labeled as "Instructions")
- **Model Selection** (required, dropdown, default: "google/gemini-2.5-pro")
- **Objectives** (optional, multi-input field, collapsible)
- **Guardrails** (optional, multi-input field, collapsible)
- **Manager Toggle** (optional, checkbox: "This agent is a manager")
- **Sub-Agents Link** (conditional, shown if manager toggle is enabled)

### UI Elements
- Step indicator: "Step 2 of 3"
- Large textarea for Instructions (prominent)
- Model dropdown with default selected
- Collapsible sections for Objectives and Guardrails
- Checkbox for Manager toggle
- Link/button to "Configure Sub-Agents" (conditional)
- Help text/examples for Instructions field
- "Previous" and "Next" buttons

### API Requirements

**No API calls needed** - This step only collects form data. Model options can be hardcoded in the component.

**Data Collected:**
```typescript
{
  systemPrompt: string;
  model: string;
  objectives?: string[];
  guardrails?: string[];
  isManager?: boolean;
  subAgentIds?: string[];
}
```

**Note:** If `isManager` is enabled, user can click "Configure Sub-Agents" which opens Step 4 (sub-agents screen).

---

## Step 3: Capabilities (`03-capabilities-step.html`)

### Purpose
Third step (optional) - configure agent tools and capabilities.

### Fields Required
- **Tools Search** (optional, text input with LLM-powered search)
  - Plain English description input
  - Auto-suggest dropdown with matching tools
  - Select from suggestions
- **Custom Tools** (optional, list/multi-select)
- **Connection Tools** (optional, list/multi-select)
- **Workflows** (optional, list/multi-select)

### UI Elements
- Step indicator: "Step 3 of 3"
- Prominent "Skip this step" button
- Tools search input with auto-suggest dropdown
- Selected tools preview/chips
- Sections for Custom Tools, Connection Tools, Workflows
- "Previous" and "Create Agent" buttons

### API Requirements

#### Existing APIs (Available Now)

1. **GET `/api/tools/list`**
   - **Purpose:** List all custom tools
   - **Used for:** Custom Tools section
   - **Response:** `ToolDefinition[]`
   - **Status:** ✅ Available

2. **GET `/api/workforce/[agentId]/tools/custom/available`**
   - **Purpose:** Get available custom tools for agent assignment
   - **Used for:** Custom Tools section (can use without agentId for new agents)
   - **Response:** `{ tools: ToolDefinition[] }`
   - **Status:** ✅ Available (may need to work without agentId for new agents)

3. **GET `/api/workforce/[agentId]/tools/connection/available`**
   - **Purpose:** Get available connection tools from user's connected accounts
   - **Used for:** Connection Tools section
   - **Response:** `{ connections: ConnectionToolInfo[], platformToolkits: PlatformToolkit[] }`
   - **Status:** ✅ Available (may need to work without agentId for new agents)

4. **GET `/api/workforce/[agentId]/workflows/available`**
   - **Purpose:** Get available workflows for agent assignment
   - **Used for:** Workflows section
   - **Response:** `{ workflows: WorkflowMetadata[] }`
   - **Status:** ✅ Available (may need to work without agentId for new agents)

#### New APIs Needed

1. **POST `/api/workforce/tools/search`** (Future)
   - **Purpose:** LLM-powered tool search based on plain English description
   - **Used for:** Tools Search input
   - **Request:** `{ description: string }`
   - **Response:** `{ suggestions: Array<{ toolId: string, name: string, description: string, matchScore: number }> }`
   - **Status:** ⚠️ Design now, implement later
   - **Note:** UI should show mock suggestions for now

**Data Collected:**
```typescript
{
  toolIds?: string[];
  connectionToolBindings?: ConnectionToolBinding[];
  workflowBindings?: WorkflowBinding[];
}
```

---

## Step 4: Sub-Agents Selection (`04-sub-agents-screen/`)

### Purpose
Separate screen (not modal) for selecting sub-agents when creating a manager agent.

### States

#### State 1: With Agents Available (`04-sub-agents-screen.html`)

**Fields Required:**
- **Agent List** (multi-select checkboxes)
  - List of user's available agents
  - Each agent shows: name, role, avatar, status

**UI Elements:**
- Screen header: "Select Sub-Agents"
- Agent list with checkboxes
- Agent cards showing: avatar, name, role, status badge
- Selection summary counter
- "Save" button
- "Cancel" button (returns to Step 2)

#### State 2: Empty State (`04-sub-agents-screen-empty.html`)

**UI Elements:**
- Empty state illustration/icon
- Message: "No agents available"
- Description: "You need to create or hire agents before you can assign them as sub-agents."
- Action buttons:
  - "Create Agent" (opens create agent flow)
  - "Hire from Marketplace" (opens marketplace - future)
- "Cancel" button (returns to Step 2)

### API Requirements

#### New API Needed

1. **GET `/api/workforce`**
   - **Purpose:** List all agents for the authenticated user
   - **Used for:** Sub-agents selection list
   - **Response:** `{ agents: AgentConfig[] }`
   - **Status:** ❌ Needs to be created
   - **Implementation:** Should read from `_tables/agents/` directory (folder-based structure)

**Data Collected:**
```typescript
{
  subAgentIds: string[];
}
```

**Note:** This screen is only shown if `isManager` is enabled in Step 2. If no agents are available, show empty state.

---

## Step 5: Success State (`05-success-state/`)

### State 1: Success (`05-success-state.html`)

### Purpose
Confirmation screen after agent is successfully created.

### Content Required
- Success message: "Agent [name] created successfully!"
- Agent card preview (name, role, avatar, status badge)
- Quick action buttons:
  - "Open Agent" (opens agent modal to Overview tab)
  - "Configure Capabilities" (opens agent modal to Capabilities tab)
  - "Start Chatting" (opens agent modal to Chat tab)
- "Done" button (closes modal, returns to workforce page)

### API Requirements

#### New API Needed

1. **POST `/api/workforce/create`**
   - **Purpose:** Create a new agent
   - **Used for:** Submitting the entire form from Steps 1-3
   - **Request:**
     ```typescript
     {
       // Identity
       name: string;
       role: string;
       avatar: string;
       description?: string;
       
       // Personality
       systemPrompt: string;
       model: string;
       objectives?: string[];
       guardrails?: string[];
       
       // Manager & Sub-Agents
       isManager?: boolean;
       subAgentIds?: string[];
       
       // Capabilities (optional)
       toolIds?: string[];
       connectionToolBindings?: ConnectionToolBinding[];
       workflowBindings?: WorkflowBinding[];
     }
     ```
   - **Response:**
     ```typescript
     {
       success: boolean;
       agentId: string; // UUID v4
       agent: AgentConfig;
     }
     ```
   - **Status:** ❌ Needs to be created
   - **Implementation:**
     - Generate UUID v4 for agent ID
     - Create folder: `_tables/agents/{name-slug}-{uuid}/`
     - Write config file: `{folder}/config.ts`
     - Update `_tables/agents/index.ts` to export new agent
     - Memory DB auto-created on first use

**Data Displayed:**
- Agent data from creation response
- No additional API calls needed

### State 2: Error (`05-success-state-error.html`)

**Purpose:** Display error state when agent creation fails

**UI Elements:**
- Error icon (red X)
- Error message
- Error details section
- "Try Again" button (resubmits form)
- "Go Back to Form" button (returns to last step with data preserved)
- "Cancel" button (closes modal, discards data)

**API Requirements:**
- Error handling from `POST /api/workforce/create`
- Display error message from API response
- Preserve form data for retry

**Error Scenarios:**
- Network errors
- Validation errors
- File system errors (folder creation, config write)
- Index update failures

---

## API Summary

### Existing APIs (Ready to Use)

| API | Purpose | Used In |
|-----|---------|---------|
| `GET /api/tools/list` | List custom tools | Step 3: Capabilities |
| `GET /api/workforce/[agentId]/tools/custom/available` | Available custom tools | Step 3: Capabilities |
| `GET /api/workforce/[agentId]/tools/connection/available` | Available connection tools | Step 3: Capabilities |
| `GET /api/workforce/[agentId]/workflows/available` | Available workflows | Step 3: Capabilities |

**Note:** The `[agentId]` routes may need to work without an agentId for new agents, or we can create agent-agnostic versions.

### New APIs Needed

| API | Purpose | Used In | Priority |
|-----|---------|---------|----------|
| `POST /api/workforce/create` | Create new agent | Step 5: Success (after form submit) | **High** |
| `GET /api/workforce` | List all user agents | Step 4: Sub-Agents Selection | **High** |
| `POST /api/workforce/tools/search` | LLM-powered tool search | Step 3: Capabilities | **Low** (Future) |

---

## File Structure

```
_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/
└── create-custom/
    ├── Frontend-Backend-Mapping.md (this file)
    ├── 01-identity-step.html
    ├── 02-personality-step.html
    ├── 03-capabilities-step.html
    ├── 04-sub-agents-screen/
    │   ├── 04-sub-agents-screen.html (with agents)
    │   └── 04-sub-agents-screen-empty.html (empty state)
    └── 05-success-state/
        ├── 05-success-state.html (success)
        └── 05-success-state-error.html (error)
```

---

## Implementation Order

1. **Step 1 & 2** - No API dependencies, can be built immediately
2. **Step 4** - Requires `GET /api/workforce` API
3. **Step 3** - Uses existing APIs (may need agent-agnostic versions)
4. **Step 5** - Requires `POST /api/workforce/create` API

---

## Design Notes

1. **LLM Search:** Tools search UI should be designed now with mock data. Implementation can be deferred.
2. **Sub-Agents Empty State:** Important UX consideration - guide users to create agents if none exist.
3. **Agent ID Generation:** UUID v4 generated server-side, not shown to user.
4. **Folder Structure:** New agents stored in `{name-slug}-{uuid}/` folders with co-located config and memory.

---

**Status:** Ready for implementation planning ✅

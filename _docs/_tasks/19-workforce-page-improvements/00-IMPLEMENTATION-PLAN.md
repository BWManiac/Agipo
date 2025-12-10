# Task 19: Workforce Page Improvements — Implementation Plan

**Status:** Planning  
**Date:** December 9, 2025  
**Goal:** Enable users to create and manage AI agents through an improved workforce dashboard with a streamlined agent creation flow.

---

## How to Use This Document

This document defines **how to build** the workforce page improvements feature. It's informed by:
- **Product Spec** (`00-PRODUCT-SPEC.md`) — What we're building (requirements, ACs, user flows)
- **Research** (`_references/04-MASTRA-PRIMITIVES-RESEARCH.md`) — Mastra Agent primitives and configuration
- **UXD Mockups** (`_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/`) — HTML mockups for create agent flow

### Prerequisites

Before starting implementation:
- [x] Product Spec complete
- [x] Research complete (Mastra primitives)
- [x] UXD mockups complete (all HTML files created)

---

## 1. Executive Summary

Currently, the workforce dashboard displays hardcoded agents (mira-patel.ts, alex-kim.ts, etc.) and lacks the ability to create new agents. This implementation will delete all legacy agents, introduce a folder-based storage system with UUID identifiers, and build a complete "Create Agent" flow that allows users to build custom AI agents from scratch.

**End state:** Users can create custom agents through a 3-step wizard, see them immediately in the workforce roster, and manage them through an improved dashboard. All legacy agents are deleted, and the system uses a clean, scalable folder-based storage structure.

---

## 2. Current State Analysis

### 2.1 How It Works Today

**Legacy Agent Structure (To Be Deleted):**
```
_tables/agents/
├── index.ts              # Exports: miraPatelAgent, noahReyesAgent, elenaParkAgent, alexKimAgent
├── mira-patel.ts         # Agent file (id: "pm") ⚠️ DELETE
├── alex-kim.ts           # Agent file (id: "engineering") ⚠️ DELETE
├── elena-park.ts         # Agent file (id: "support") ⚠️ DELETE
├── noah-reyes.ts         # Agent file (id: "marketing") ⚠️ DELETE
├── engineering/          # Memory folder ⚠️ DELETE
├── marketing/            # Memory folder ⚠️ DELETE
└── pm/                   # Memory folder ⚠️ DELETE
```

**Current Agent Creation:**
- Agents are hardcoded TypeScript files
- No programmatic creation
- Memory databases stored in separate folders
- Agent IDs are short strings ("pm", "engineering", etc.)

**Current Agent Modal:**
- Works with existing agents
- Chat tab: Uses `AgentChat` component with Mastra Agent
- Capabilities tab: Allows assigning tools, connections, workflows
- This functionality must be preserved for newly created agents

### 2.2 Key Data Structures

```typescript
// From _tables/types.ts
type AgentConfig = {
  id: string;                    // UUID v4 (new) or short string (legacy)
  name: string;                  // Display name
  role: string;                  // Role label
  avatar: string;                // Emoji
  status: "active" | "paused" | "attention";
  description: string;
  systemPrompt: string;          // Required for Mastra Agent
  model: string;                 // Required for Mastra Agent (default: "google/gemini-2.5-pro")
  toolIds?: string[];            // Custom tools
  connectionToolBindings?: ConnectionToolBinding[];
  workflowBindings?: WorkflowBinding[];
  objectives?: string[];
  guardrails?: string[];
  isManager?: boolean;           // NEW: Manager flag
  subAgentIds?: string[];        // NEW: Sub-agent IDs
  // ... other UI metadata fields
};
```

### 2.3 Relevant Primitives/APIs

| Method/Endpoint | Purpose | Notes |
|-----------------|---------|-------|
| `crypto.randomUUID()` | Generate UUID v4 for agent IDs | Node.js built-in |
| `new Agent({ name, instructions, model, tools, memory })` | Create Mastra Agent | From chat-service.ts |
| `getAgentMemory(agentId)` | Get/create agent memory | Auto-creates directory |
| `POST /api/workforce/create` | Create new agent | NEW - to be created |
| `GET /api/workforce` | List all agents | NEW - to be created |

---

## 3. Acceptance Criteria

### Legacy Agent Cleanup ([3] criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC-1 | All legacy agent files deleted: mira-patel.ts, alex-kim.ts, elena-park.ts, noah-reyes.ts | Verify files do not exist in `_tables/agents/` |
| AC-2 | All legacy folders deleted: engineering/, marketing/, pm/ | Verify folders do not exist |
| AC-3 | index.ts updated to remove all legacy imports/exports | Verify index.ts has no references to legacy agents |

### Agent Creation API ([6] criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC-4 | `POST /api/workforce/create` creates agent with UUID v4 ID | Call API, verify response contains UUID format ID |
| AC-5 | Agent folder created: `{name-slug}-{uuid}/` | Verify folder exists with correct naming |
| AC-6 | Config file created: `{folder}/config.ts` | Verify file exists with correct AgentConfig structure |
| AC-7 | index.ts automatically updated with new agent export | Verify index.ts includes new agent import/export |
| AC-8 | API validates required fields (name, role, systemPrompt) | Call API with missing fields, verify 400 error |
| AC-9 | API handles errors with rollback (delete file, revert index) | Simulate error, verify cleanup occurred |

### Agent Creation UI ([8] criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC-10 | Create Agent dialog opens from "Hire new agent" button | Click button, verify dialog opens |
| AC-11 | Step 1 (Identity) collects name, role, avatar, description | Fill form, verify data collected |
| AC-12 | Step 2 (Personality) collects instructions, model, objectives, guardrails | Fill form, verify data collected |
| AC-13 | Step 3 (Capabilities) allows selecting tools, connections, workflows | Select items, verify they're included in creation |
| AC-14 | Success state shows agent preview with quick actions | Create agent, verify success screen |
| AC-15 | Agent appears in roster immediately after creation | Create agent, verify it appears in Active Roster |
| AC-16 | Error state shows clear error message with retry | Simulate error, verify error screen |
| AC-17 | Sub-agents screen works for manager agents | Enable manager toggle, select sub-agents, verify saved |

### Agent Functionality ([4] criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC-18 | Newly created agent works in agent modal (Chat tab) | Open agent, send message, verify response |
| AC-19 | Newly created agent works in agent modal (Capabilities tab) | Open agent, assign tools, verify they save |
| AC-20 | Tools can be assigned to new agent (same as legacy agents) | Assign Gmail tools, verify they work in chat |
| AC-21 | Workflows can be assigned to new agent | Assign workflow, verify it's available |

### Backwards Compatibility ([2] criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC-22 | Agent modal functionality preserved for new agents | Open new agent, verify all tabs work |
| AC-23 | Memory database created on first use (lazy initialization) | Create agent, chat with it, verify memory.db created |

---

## 4. User Flows

### Flow 1: Create Custom Agent (Happy Path)

```
1. User clicks "Hire new agent" button on workforce dashboard
2. Create Agent dialog opens with "Create Custom Agent" tab selected
3. User fills Step 1 (Identity): Name "Mira Patel", Role "Product Manager", selects avatar 🧭
4. User clicks "Next"
5. User fills Step 2 (Personality): Instructions, selects model, adds objectives
6. User clicks "Next"
7. User skips Step 3 (Capabilities) by clicking "Skip this step"
8. System creates agent with UUID, creates folder structure, updates index
9. Success state shows agent preview with quick actions
10. User clicks "Open Agent" → Agent modal opens to Overview tab
11. Agent appears in Active Roster on workforce dashboard
```

### Flow 2: Create Agent with Capabilities

```
1. User creates agent through Steps 1-2
2. In Step 3, user selects custom tools, connection tools, and workflows
3. User clicks "Create Agent"
4. Agent is created with all selected capabilities
5. User opens agent modal → Capabilities tab shows assigned tools
6. User chats with agent → Agent can use assigned tools
```

### Flow 3: Error Handling

```
1. User fills create agent form and submits
2. API call fails (network error, file system error, etc.)
3. Error state shows with error message
4. User clicks "Try Again" → Form resubmits with same data
5. If successful, proceeds to success state
```

---

## 5. File Impact Analysis

### Files to Delete

| File | Description |
|------|-------------|
| `_tables/agents/mira-patel.ts` | Legacy agent file |
| `_tables/agents/alex-kim.ts` | Legacy agent file |
| `_tables/agents/elena-park.ts` | Legacy agent file |
| `_tables/agents/noah-reyes.ts` | Legacy agent file |
| `_tables/agents/engineering/` | Legacy memory folder (entire directory) |
| `_tables/agents/marketing/` | Legacy memory folder (entire directory) |
| `_tables/agents/pm/` | Legacy memory folder (entire directory) |

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `_tables/agents/index.ts` | Modify | Remove all legacy imports/exports, update to support folder-based agents |
| `app/api/workforce/services/agent-config.ts` | Modify | Update to read from folder structure (`{name-slug}-{uuid}/config.ts`) |
| `app/api/workforce/[agentId]/chat/services/memory.ts` | Modify | Update to use folder-based paths |
| `app/(pages)/workforce/components/WorkforceDashboard.tsx` | Modify | Add CreateAgentDialog integration, wire up "Hire new agent" button |

### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `app/api/workforce/services/agent-creator.ts` | **Create** | Service for agent file generation (UUID, folder-based) |
| `app/api/workforce/create/route.ts` | **Create** | POST endpoint for creating agents |
| `app/api/workforce/route.ts` | **Create** | GET endpoint for listing all agents |
| `app/(pages)/workforce/components/CreateAgentDialog.tsx` | **Create** | Main modal for create agent flow |
| `app/(pages)/workforce/components/CreateFromScratchWizard.tsx` | **Create** | 3-step wizard orchestrator |
| `app/(pages)/workforce/components/wizard/IdentityStep.tsx` | **Create** | Step 1: Identity form |
| `app/(pages)/workforce/components/wizard/PersonalityStep.tsx` | **Create** | Step 2: Personality form |
| `app/(pages)/workforce/components/wizard/CapabilitiesStep.tsx` | **Create** | Step 3: Capabilities form (optional) |
| `app/(pages)/workforce/components/wizard/SuccessState.tsx` | **Create** | Success confirmation screen |
| `app/(pages)/workforce/components/SubAgentsScreen.tsx` | **Create** | Sub-agents selection screen |

### 5.1 UX Mockups

| Mockup | Location | Description |
|--------|----------|-------------|
| Step 1: Identity | `_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/create-custom/01-identity-step.html` | Name, role, avatar, description inputs |
| Step 2: Personality | `_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/create-custom/02-personality-step.html` | Instructions, model, objectives, guardrails, manager toggle |
| Step 3: Capabilities | `_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/create-custom/03-capabilities-step.html` | Tools search, custom tools, connections, workflows |
| Sub-Agents (with agents) | `_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/create-custom/04-sub-agents-screen/04-sub-agents-screen.html` | Agent list with checkboxes |
| Sub-Agents (empty) | `_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/create-custom/04-sub-agents-screen/04-sub-agents-screen-empty.html` | Empty state message |
| Success State | `_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/create-custom/05-success-state/05-success-state.html` | Agent preview with quick actions |
| Error State | `_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/create-custom/05-success-state/05-success-state-error.html` | Error message with retry |

---

## 6. Implementation Phases

### Phase 1: Legacy Agent Cleanup

**Goal:** Delete all legacy agents and update index.ts to prepare for new folder-based structure.

**Changes:**
1. Delete all legacy agent files: mira-patel.ts, alex-kim.ts, elena-park.ts, noah-reyes.ts
2. Delete all legacy folders: engineering/, marketing/, pm/
3. Update index.ts to remove all legacy imports/exports (make it empty or ready for new structure)

**Phase 1 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P1.1 | All legacy agent files deleted | `ls _tables/agents/*.ts` shows no legacy files |
| P1.2 | All legacy folders deleted | `ls _tables/agents/` shows no engineering/, marketing/, pm/ folders |
| P1.3 | index.ts has no legacy imports | Verify index.ts file contains no references to miraPatelAgent, etc. |

**Phase 1 Test Flow:**
```bash
# Verify deletion
ls _tables/agents/
# Should NOT show: mira-patel.ts, alex-kim.ts, elena-park.ts, noah-reyes.ts
# Should NOT show: engineering/, marketing/, pm/

# Verify index.ts
cat _tables/agents/index.ts
# Should have no imports or empty agents array
```

---

### Phase 2: API Foundation

**Goal:** Create backend APIs for agent creation and listing with folder-based storage.

**Changes:**
1. Create `agent-creator.ts` service with UUID generation, folder creation, file generation
2. Create `POST /api/workforce/create` route with validation and error handling
3. Create `GET /api/workforce` route for listing agents
4. Update `agent-config.ts` to read from folder structure
5. Update `memory.ts` to use folder-based paths

**Phase 2 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P2.1 | `POST /api/workforce/create` creates agent successfully | Call API with valid data, verify 200 response with agentId |
| P2.2 | Agent folder created with `{name-slug}-{uuid}` format | Verify folder exists in `_tables/agents/` |
| P2.3 | Config file created in agent folder | Verify `{folder}/config.ts` exists with correct structure |
| P2.4 | index.ts updated automatically | Verify index.ts includes new agent import/export |
| P2.5 | API validates required fields | Call API with missing name/role/systemPrompt, verify 400 error |
| P2.6 | `GET /api/workforce` returns all agents | Call API, verify response includes newly created agent |

**Phase 2 Test Flow:**
```bash
# Create agent via API
curl -X POST http://localhost:3000/api/workforce/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "role": "Test Role",
    "systemPrompt": "You are a test agent."
  }'

# Verify folder created
ls _tables/agents/test-agent-*/

# Verify config file
cat _tables/agents/test-agent-*/config.ts

# Verify index updated
cat _tables/agents/index.ts

# List agents
curl http://localhost:3000/api/workforce
```

---

### Phase 3: Basic Create Flow UI

**Goal:** Build the create agent dialog and first two wizard steps (Identity and Personality).

**Changes:**
1. Create `CreateAgentDialog` component with Dialog and Tabs
2. Create `CreateFromScratchWizard` orchestrator
3. Create `IdentityStep` component
4. Create `PersonalityStep` component
5. Wire up form submission to API
6. Add success state component

**Phase 3 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P3.1 | Create Agent dialog opens from "Hire new agent" button | Click button, verify dialog opens |
| P3.2 | Step 1 (Identity) form works | Fill name, role, select avatar, verify validation |
| P3.3 | Step 2 (Personality) form works | Fill instructions, select model, verify validation |
| P3.4 | Form submission creates agent via API | Submit form, verify API called, agent created |
| P3.5 | Success state shows after creation | Verify success screen with agent preview |
| P3.6 | Agent appears in roster after creation | Verify agent card appears in Active Roster |

**Phase 3 Test Flow:**
```
1. Click "Hire new agent" button
2. Fill Step 1: Name "Test Agent", Role "Test Role", select avatar
3. Click "Next"
4. Fill Step 2: Instructions "You are a test agent", select model
5. Click "Create Agent"
6. Verify success state appears
7. Verify agent appears in roster
```

---

### Phase 4: Complete Create Flow

**Goal:** Add capabilities step, sub-agents support, and error handling.

**Changes:**
1. Create `CapabilitiesStep` component with tools/connections/workflows selection
2. Create `SubAgentsScreen` component
3. Add error handling and error state
4. Add loading states
5. Integrate sub-agents selection with manager toggle

**Phase 4 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P4.1 | Step 3 (Capabilities) allows selecting tools | Select tools, verify they're included in creation |
| P4.2 | Step 3 can be skipped | Click "Skip this step", verify agent created without capabilities |
| P4.3 | Manager toggle shows sub-agents link | Enable toggle, verify link appears |
| P4.4 | Sub-agents screen opens and works | Click link, select agents, verify saved |
| P4.5 | Error state shows on API failure | Simulate error, verify error screen |
| P4.6 | Retry works from error state | Click retry, verify form resubmits |

**Phase 4 Test Flow:**
```
1. Create agent with capabilities
2. Select tools, connections, workflows in Step 3
3. Create agent, verify capabilities assigned
4. Create manager agent
5. Enable manager toggle, configure sub-agents
6. Verify sub-agents saved
7. Test error handling (disconnect network, verify error state)
```

---

### Phase 5: Integration & Polish

**Goal:** Ensure all functionality works end-to-end and agent modal works with new agents.

**Changes:**
1. Verify agent modal works with newly created agents
2. Test tool assignment in agent modal
3. Test chat functionality with new agents
4. Test workflow execution
5. Final UI polish and error message improvements

**Phase 5 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P5.1 | Newly created agent works in agent modal (Chat) | Open agent, send message, verify response |
| P5.2 | Newly created agent works in agent modal (Capabilities) | Open agent, assign tools, verify they save |
| P5.3 | Tools can be used in chat | Assign Gmail tool, ask agent to send email, verify tool called |
| P5.4 | All main acceptance criteria (Section 3) pass | Full test suite |

**Phase 5 Test Flow (End-to-End):**
```
1. Create agent with name, role, instructions
2. Assign Gmail tools in Step 3
3. Create agent
4. Open agent modal
5. Go to Capabilities tab, verify tools listed
6. Go to Chat tab, ask agent to send email
7. Verify agent uses Gmail tool successfully
8. Verify memory.db created in agent folder
```

---

## 7. Design Decisions

| Decision | Rationale |
|----------|-----------|
| Delete all legacy agents immediately | Clean slate, no migration complexity, ensures new system is used |
| UUID v4 for agent IDs | Guaranteed unique, standard format, no collision risk |
| Folder naming: `{name-slug}-{uuid}` | Human-readable (name) + unique (UUID), co-located config and memory |
| Regex-based index.ts updates | Matches existing pattern, simple, fast |
| Lazy memory initialization | Matches current pattern, efficient, memory created on first use |
| Separate sub-agents screen | Avoids modal nesting, better UX |
| Tools search UI designed now, implementation later | Reduces scope, allows future enhancement |

---

## 8. Out of Scope

- **Marketplace flow** → Planned for future phase
- **Agent editing via create flow** → Use separate agent modal for editing
- **Bulk agent creation** → Not needed for MVP
- **Agent categories/folders** → Keep flat structure for now
- **LLM-powered tools search implementation** → Design now, implement later
- **Advanced Mastra features** (scorers, evals, processors) → Deferred for future research

---

## 9. References

- **Product Spec:** `00-PRODUCT-SPEC.md`
- **Research:** `_references/04-MASTRA-PRIMITIVES-RESEARCH.md`
- **Impact Analysis:** `_references/02-Impact-Analysis.md`
- **File Impact:** `_references/03-File-Impact-Analysis.md`
- **UXD Mockups:** `_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/`
- **Frontend-Backend Mapping:** `_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/create-custom/Frontend-Backend-Mapping.md`

---

## 10. Completed Work

*(This section will be updated as work progresses)*

---

## Notes

- **Legacy Agent Deletion:** All hardcoded agents (mira-patel.ts, alex-kim.ts, elena-park.ts, noah-reyes.ts) and folders (engineering/, marketing/, pm/) will be deleted immediately. This is a breaking change, but necessary for clean implementation.
- **Functionality Preservation:** After deletion, newly created agents must support the same functionality (tool assignment, chat, workflows) that legacy agents had.
- **Index.ts:** Will be updated to support folder-based imports. Initially empty after legacy deletion, then populated as agents are created.

---

**Last Updated:** December 9, 2025


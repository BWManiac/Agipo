# Task 19: Workforce Page Improvements — Product Spec

**Status:** Planning → Implementation  
**Date:** December 9, 2025  
**Goal:** Enable users to create and manage AI agents through an improved workforce dashboard with a streamlined agent creation flow.

---

## 1. Executive Summary

The workforce dashboard currently displays hardcoded agents and lacks the ability to create new agents. This task introduces a complete "Create Agent" flow that allows users to build custom AI agents from scratch, configure their personality and capabilities, and manage them through an improved dashboard layout.

**Problem:** Users cannot create new agents, and the dashboard layout prioritizes metrics over the agent roster.

**Who benefits:** All users who need to create and manage AI agents for their workflows.

**End state:** Users can create custom agents through a 3-step wizard, see them immediately in the workforce roster, and manage them through an improved dashboard that prioritizes agent visibility.

---

## 2. Product Requirements

### 2.1 Dashboard Layout Improvements

**Definition:** Reorganize the workforce dashboard to prioritize agent visibility and improve information hierarchy.

**Why it matters:** Users should see their agents first, with metrics providing context afterward.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-1.1 | Move "Manage your AI workforce" header section below Active Roster | P0 |
| PR-1.2 | Maintain all existing functionality (metrics, attention needed section) | P0 |
| PR-1.3 | Ensure "Hire new agent" button remains accessible | P0 |

### 2.2 Agent Creation Flow

**Definition:** A 3-step wizard that allows users to create custom AI agents with identity, personality, and optional capabilities.

**Why it matters:** Users need a streamlined way to create agents without technical knowledge.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-2.1 | Step 1: Collect agent identity (name, role, avatar, description) | P0 |
| PR-2.2 | Step 2: Configure personality (instructions, model, objectives, guardrails) | P0 |
| PR-2.3 | Step 2: Support manager toggle with sub-agents selection | P1 |
| PR-2.4 | Step 3: Optional capabilities configuration (tools, connections, workflows) | P1 |
| PR-2.5 | Step 3: Tools search with LLM auto-suggest (UI design now, implementation later) | P2 |
| PR-2.6 | Success state with quick actions (Open Agent, Configure Capabilities, Start Chatting) | P0 |
| PR-2.7 | Error handling with clear messages and retry options | P0 |
| PR-2.8 | Skip capabilities step option | P0 |

### 2.3 Agent Storage & Management

**Definition:** Folder-based agent storage with UUID identifiers and co-located configuration and memory.

**Why it matters:** Scalable, maintainable agent storage that supports future features.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-3.1 | Generate UUID v4 for agent IDs | P0 |
| PR-3.2 | Store agents in folders: `{name-slug}-{uuid}/` | P0 |
| PR-3.3 | Co-locate config (`config.ts`) and memory (`memory.db`) in agent folder | P0 |
| PR-3.4 | Auto-update agent index on creation | P0 |
| PR-3.5 | **Delete ALL legacy hardcoded agents immediately:** mira-patel.ts, alex-kim.ts, elena-park.ts, noah-reyes.ts, and folders: engineering/, marketing/, pm/ | P0 |
| PR-3.6 | Update index.ts to remove all legacy agent imports and exports | P0 |
| PR-3.7 | Preserve agent modal functionality (Chat + Capabilities tabs) for newly created agents | P0 |
| PR-3.8 | Ensure newly created agents can have tools, connections, and workflows assigned (same functionality as legacy agents had) | P0 |

### 2.4 API Foundation

**Definition:** Backend APIs to support agent creation, listing, and management.

**Why it matters:** Frontend needs reliable APIs to create and manage agents.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-4.1 | `POST /api/workforce/create` - Create new agent | P0 |
| PR-4.2 | `GET /api/workforce` - List all user agents | P0 |
| PR-4.3 | `POST /api/workforce/tools/search` - LLM-powered tool search (future) | P2 |
| PR-4.4 | Atomic operations with rollback on failure | P0 |
| PR-4.5 | Request validation with clear error messages | P0 |

### 2.5 Sub-Agents Support

**Definition:** Allow manager agents to delegate tasks to sub-agents.

**Why it matters:** Enables hierarchical agent structures for complex workflows.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-5.1 | Manager toggle in Step 2 (Personality) | P1 |
| PR-5.2 | Separate sub-agents selection screen (not nested modal) | P1 |
| PR-5.3 | Empty state when no agents available (guide user to finish creating current agent) | P1 |
| PR-5.4 | Store `isManager` and `subAgentIds` in agent config | P1 |

---

## 3. Acceptance Criteria

### Dashboard Layout ([3] criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1 | Active Roster appears before header section | Visual inspection - roster is first section |
| AC-2 | All metrics and sections remain functional | Verify metrics display correctly, attention section works |
| AC-3 | "Hire new agent" button opens create agent dialog | Click button, verify dialog opens |

### Agent Creation - Identity Step ([4] criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-4 | Required fields (name, role) must be filled to proceed | Try to proceed with empty fields, verify button disabled |
| AC-5 | Avatar emoji picker works and saves selection | Select emoji, verify it appears in preview |
| AC-6 | Description field is optional | Create agent without description, verify success |
| AC-7 | Form validation shows inline errors | Enter invalid data, verify error messages |

### Agent Creation - Personality Step ([6] criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-8 | Instructions field (systemPrompt) is required | Try to proceed with empty instructions, verify validation |
| AC-9 | Model dropdown has default selection | Verify "Google Gemini 2.5 Pro" is pre-selected |
| AC-10 | Objectives and guardrails are optional and collapsible | Verify sections can be expanded/collapsed, can skip |
| AC-11 | Manager toggle shows sub-agents link when enabled | Toggle manager checkbox, verify link appears |
| AC-12 | Sub-agents screen opens when link clicked | Click link, verify separate screen opens |
| AC-13 | Sub-agents screen shows empty state when no agents available | Create first agent, enable manager, verify empty state |

### Agent Creation - Capabilities Step ([5] criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-14 | Step 3 can be skipped | Click "Skip this step", verify agent creation proceeds |
| AC-15 | Tools search input shows UI (LLM search implementation deferred) | Enter text, verify suggestions dropdown appears (mock data) |
| AC-16 | Custom tools, connection tools, and workflows can be selected | Select items, verify they appear in selected list |
| AC-17 | Selected tools can be removed | Remove tool, verify it disappears from selection |
| AC-18 | Existing capability selectors are reused from agent modal | Verify UI matches agent modal selectors |

### Agent Creation - Success & Error States ([4] criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-19 | Success state shows agent preview with quick actions | Create agent, verify success screen with agent card |
| AC-20 | Quick actions (Open Agent, Configure Capabilities, Start Chatting) work | Click each action, verify correct tab opens in agent modal |
| AC-21 | Error state shows clear error message with retry option | Simulate API error, verify error screen with retry button |
| AC-22 | Form data is preserved on error for retry | Trigger error, retry, verify form data still present |

### Agent Storage ([8] criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-23 | Agent ID is UUID v4 format | Create agent, verify ID matches UUID pattern |
| AC-24 | Agent folder follows `{name-slug}-{uuid}` naming | Create agent, verify folder name format |
| AC-25 | Config file exists in agent folder | Verify `{folder}/config.ts` file created |
| AC-26 | Memory database is co-located (created on first use) | Verify memory.db path is in agent folder |
| AC-27 | Agent appears in roster immediately after creation | Create agent, verify it appears in Active Roster |
| AC-28 | **ALL legacy agents deleted:** mira-patel.ts, alex-kim.ts, elena-park.ts, noah-reyes.ts | Verify files do not exist |
| AC-29 | **ALL legacy folders deleted:** engineering/, marketing/, pm/ | Verify folders do not exist |
| AC-30 | **index.ts updated:** No legacy agent imports/exports | Verify index.ts only exports new agents or is empty initially |

### API ([5] criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-29 | `POST /api/workforce/create` creates agent successfully | Call API with valid data, verify 200 response |
| AC-30 | API validates required fields | Call API with missing fields, verify 400 error |
| AC-31 | API handles file creation errors gracefully | Simulate file system error, verify rollback |
| AC-32 | `GET /api/workforce` returns all user agents | Call API, verify agent list includes new agent |
| AC-33 | Index.ts is updated automatically on agent creation | Create agent, verify index.ts includes new export |

### Backwards Compatibility ([3] criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-34 | Agent modal (Chat + Capabilities tabs) works with new agents | Open new agent modal, verify all tabs functional |
| AC-35 | Existing agent chat functionality preserved | Chat with new agent, verify messages work |
| AC-36 | Capability assignment works in agent modal | Assign tools to new agent, verify they save |

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

### Flow 2: Create Manager Agent with Sub-Agents

```
1. User starts creating agent (Steps 1-2)
2. In Step 2, user enables "This agent is a manager" toggle
3. "Configure Sub-Agents" link appears
4. User clicks link → Sub-agents screen opens
5. User selects 2 existing agents as sub-agents
6. User clicks "Save" → Returns to Step 2
7. User completes Step 3 and creates agent
8. Agent is created with isManager=true and subAgentIds=[...]
9. Manager agent can delegate to sub-agents in conversations
```

### Flow 3: Create Agent with Capabilities

```
1. User creates agent through Steps 1-2
2. In Step 3, user enters "send emails and manage calendar" in tools search
3. System shows tool suggestions (mock data for now)
4. User selects "Gmail - Send Email" and "Calendar - Create Event"
5. User also selects custom tools and workflows
6. User clicks "Create Agent"
7. Agent is created with all selected capabilities
8. Agent appears in roster with capabilities visible
```

### Flow 4: Error Handling

```
1. User fills create agent form and submits
2. API call fails (network error, file system error, etc.)
3. Error state shows with error message
4. User clicks "Try Again" → Form resubmits with same data
5. If successful, proceeds to success state
6. If fails again, user can click "Go Back to Form" to edit data
```

### Flow 5: Sub-Agents Empty State

```
1. User creates first agent and enables manager toggle
2. User clicks "Configure Sub-Agents"
3. Sub-agents screen shows empty state: "No agents available"
4. Message explains: "Finish creating this agent first, then you can assign other agents as sub-agents later"
5. User clicks "Continue Creating Agent" → Returns to Step 2
6. User completes agent creation
7. Later, when more agents exist, user can edit manager agent to add sub-agents
```

---

## 5. Design Decisions

### 5.1 Decisions to Make

| ID | Question | Options | Current Lean | Decided? |
|----|----------|---------|--------------|----------|
| DD-1 | Agent ID format | A: UUID v4, B: Timestamp-based, C: Sequential | A: UUID v4 | ✅ |
| DD-2 | Folder naming | A: `{name-slug}-{uuid}`, B: `{uuid}`, C: `{name-slug}` | A: `{name-slug}-{uuid}` | ✅ |
| DD-3 | Index update strategy | A: Regex replacement, B: AST parsing, C: Dynamic scanning | A: Regex replacement | ✅ |
| DD-4 | Memory initialization | A: Immediate, B: Lazy (on first use) | B: Lazy | ✅ |
| DD-5 | Sub-agents UI | A: Nested modal, B: Separate screen | B: Separate screen | ✅ |
| DD-6 | Tools search implementation | A: Design now, implement later, B: Implement now | A: Design now, implement later | ✅ |
| DD-7 | Legacy agents | A: Delete immediately, B: Migrate, C: Keep | A: Delete immediately | ✅ |

### 5.2 Decision Log

| Date | Decision | Choice | Rationale |
|------|----------|--------|-----------|
| 2025-12-08 | Agent ID format | UUID v4 | Guaranteed unique, standard format |
| 2025-12-08 | Folder naming | `{name-slug}-{uuid}` | Human-readable + unique |
| 2025-12-08 | Index update | Regex replacement | Matches existing pattern, simple |
| 2025-12-08 | Memory init | Lazy (on first use) | Matches current pattern, efficient |
| 2025-12-08 | Sub-agents UI | Separate screen | Avoids modal nesting, better UX |
| 2025-12-08 | Tools search | Design now, implement later | Reduces scope, allows future enhancement |
| 2025-12-08 | Legacy agents | Delete immediately | Clean slate, no migration needed |
| 2025-12-09 | Layout reorganization | Content-first (agents before metrics) | Better UX, agents are primary content |

---

## 6. UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Step 1: Identity | Collect agent identity information | Name, role, avatar picker, description fields |
| Step 2: Personality | Configure agent behavior | Instructions textarea, model dropdown, objectives/guardrails, manager toggle |
| Step 3: Capabilities | Optional tools configuration | Tools search, custom tools, connection tools, workflows, skip button |
| Sub-Agents Screen (with agents) | Select sub-agents for manager | Agent list with checkboxes, selection summary |
| Sub-Agents Screen (empty) | Handle no agents scenario | Empty state message, continue button |
| Success State | Confirmation after creation | Agent preview, quick action buttons |
| Error State | Error handling | Error message, retry/go back buttons |

### Mockup Location

```
_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/
└── create-custom/
    ├── Frontend-Backend-Mapping.md
    ├── 01-identity-step.html
    ├── 02-personality-step.html
    ├── 03-capabilities-step.html
    ├── 04-sub-agents-screen/
    │   ├── 04-sub-agents-screen.html
    │   └── 04-sub-agents-screen-empty.html
    └── 05-success-state/
        ├── 05-success-state.html
        └── 05-success-state-error.html
```

### Exit Criteria for UXD Phase

- [x] All required mockups complete
- [x] Each mockup shows all P0 requirements
- [x] Mockups use shadcn/ui design language
- [x] Frontend-Backend mapping document complete
- [x] Stakeholder review complete

---

## 7. Success Criteria

| Criterion | How to Validate | Priority |
|-----------|-----------------|----------|
| Users can create custom agents through 3-step wizard | Create agent end-to-end, verify it appears in roster | P0 |
| Agent creation API is reliable with proper error handling | Test API with various inputs, verify rollback on errors | P0 |
| Dashboard layout prioritizes agent visibility | Visual inspection, agents appear before metrics | P0 |
| New agents work in agent modal (Chat + Capabilities) | Open new agent, verify all functionality works | P0 |
| Sub-agents selection works for manager agents | Create manager agent, assign sub-agents, verify storage | P1 |
| Tools search UI is designed (implementation deferred) | Verify UI exists with mock data, note for future | P2 |

**North Star:** Users can create and manage AI agents effortlessly, with agents appearing immediately in a dashboard that prioritizes their visibility.

---

## 8. Out of Scope

- **Marketplace flow** → Planned for Phase 5 (future)
- **Agent editing via create flow** → Use separate agent modal for editing
- **Bulk agent creation** → Not needed for MVP
- **Agent categories/folders** → Keep flat structure for now
- **LLM-powered tools search implementation** → Design now, implement later
- **Advanced Mastra features** (scorers, evals, processors) → Deferred for future research
- **Agent deletion UI** → Can be added later
- **Status management UI** → Can be added later

---

## 9. Related Documents

- **Research:** `_references/04-MASTRA-PRIMITIVES-RESEARCH.md` - Mastra Agent primitives and configuration
- **Impact Analysis:** `_references/02-Impact-Analysis.md` - Comprehensive impact analysis
- **File Impact:** `_references/03-File-Impact-Analysis.md` - Detailed file-by-file breakdown
- **Summary:** `_references/01-SUMMARY.md` - Progress tracking and next steps
- **Phase 2:** `01-Phase2-API-Foundation.md` - API implementation plan
- **UXD:** `_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/` - HTML mockups and frontend-backend mapping

---

## Notes

- **Legacy Agents:** All hardcoded agents (mira-patel.ts, alex-kim.ts, etc.) will be deleted immediately. Functionality must be preserved for newly created agents.
- **Folder Structure:** New agents use `{name-slug}-{uuid}/` folders with co-located config and memory.
- **UUID Generation:** Using `crypto.randomUUID()` for standard UUID v4 format.
- **Sub-Agents:** Manager agents can delegate to sub-agents. UI uses separate screen to avoid modal nesting.
- **Tools Search:** UI is designed with mock data. LLM-powered search implementation is deferred.
- **Design Language:** All UI follows shadcn/ui patterns for consistency.

---

**Last Updated:** December 9, 2025


# Task: Manager Agents (Agent Networks)

**Status:** Not Started  
**Roadmap:** `_docs/Product/ROADMAP/agent-networks/01-Manager-Agents.md`  
**Research Log:** `_docs/Product/ROADMAP/agent-networks/01B-Manager-Agents-Research.md`  
**Assigned:** TBD  
**Started:** YYYY-MM-DD  
**Completed:** YYYY-MM-DD

---

## Validation

### Approach Validation
✅ **Mastra Agent Networks is the right approach** - The `.network()` API provides built-in delegation with observability events
⚠️ **CRITICAL: Memory is MANDATORY for networks** - Research confirms `.network()` fails without memory configuration
✅ **Separate Manager entity is correct** - Managers have different behavior (delegation) than regular agents
✅ **File-based storage pattern matches existing** - Follows `_tables/agents/` pattern with `_tables/managers/`
✅ **SSE streaming for network events works** - Similar to existing agent chat streaming

### Technical Feasibility
- Mastra's Agent class supports both `.stream()` and `.network()` methods
- Network events include delegation tracking out-of-the-box
- **Memory is REQUIRED**: Networks use memory to track task history and determine completion
- Sub-agent loading can reuse existing `buildToolMap()` and agent creation patterns

## Deterministic Decisions

### Storage Decisions
- **Manager Storage**: `_tables/managers/[folder]/config.ts` (parallel to agents)
- **Manager Memory**: `_tables/managers/[folder]/memory.db` 
- **Manager Type**: Separate `ManagerConfig` type in `_tables/types.ts`
- **No Migration**: Managers are new entities, not converted agents

### Implementation Decisions
- **Network Mode**: Always use `.network()` for managers, never `.stream()`
- **Memory Configuration**: MUST pass memory in options - `{ memory: managerMemory, thread: threadId }`
- **Sub-Agent Loading**: Load at runtime when manager network is created
- **Event Transformation**: Transform Mastra events to frontend-friendly format
- **Delegation Visibility**: Show full sub-agent conversation in expandable sections
- **Manager Tools**: Optional - managers can have their own tools/workflows (hybrid model)

### Error Handling Decisions
- **Failed Delegation**: Show error in chat, let Mastra handle retry logic
- **Missing Sub-Agent**: Skip that agent, log warning, continue with others
- **Network Timeout**: Use same timeout as regular agent chat (2 minutes default)
- **Memory Failures**: Create new memory if loading fails (self-healing)

## Overview

### Goal

Implement Manager Agents as a separate entity from regular agents, enabling intelligent delegation to sub-agents using Mastra's Agent Networks feature. Managers act as routers that use LLM reasoning to delegate tasks to specialized agents, with full observability of which agent handled what. This enables use cases like the Job Application Manager coordinating Resume Tailor, Job Scraper, and Application Filler agents.

### Relevant Research

**Mastra Agent Networks:**
- Use `.network()` method instead of `.stream()`
- Requires memory for task tracking
- Sub-agents need clear descriptions for routing
- Emits network execution events for observability
- Documentation: https://mastra.ai/docs/agents/networks

**Current Agent System:**
- Agents stored in `_tables/agents/[folder]/config.ts`
- Agent chat uses `agent.stream()` in `chat-service.ts`
- Agent creation wizard in `app/(pages)/workforce/components/wizard/`
- Agent modal with tabs in `app/(pages)/workforce/components/agent-modal/`
- Memory stored per-agent in `_tables/agents/[folder]/memory.db`

**Patterns to Reuse:**
- Agent config structure (but separate ManagerConfig type)
- Agent creation wizard pattern (but for managers)
- Agent modal pattern (but with Team tab)
- Memory setup (managers need memory for networks)
- File-based storage in `_tables/`

**Key Technical Decisions:**
- Managers are separate from agents (different type, different storage)
- Managers use Mastra `.network()` API
- Sub-agents loaded at runtime when creating manager instance
- Network events streamed to frontend for observability
- Managers can optionally have their own tools/workflows

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `_tables/types.ts` | Modify | Add ManagerConfig type | A |
| `app/(pages)/workforce/types.ts` | Create | Frontend manager types | B |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workforce/managers/route.ts` | Create | List/create managers | A |
| `app/api/workforce/managers/[managerId]/route.ts` | Create | Get/update/delete manager | A |
| `app/api/workforce/managers/[managerId]/network/route.ts` | Create | Manager network chat endpoint | A |
| `app/api/workforce/managers/[managerId]/team/route.ts` | Create | Get sub-agents list | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workforce/services/manager-creator.ts` | Create | Manager creation service | A |
| `app/api/workforce/services/manager-network-service.ts` | Create | Manager network execution | A |
| `app/api/workforce/services/sub-agent-loader.ts` | Create | Load sub-agent configs | A |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Modify | Support manager network mode | A |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/store/slices/managerSlice.ts` | Create | Manager state management | B |
| `app/(pages)/workforce/store/index.ts` | Modify | Add manager slice | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/manager-modal/ManagerModal.tsx` | Create | Manager modal component | B |
| `app/(pages)/workforce/components/manager-modal/components/TeamTab.tsx` | Create | Team tab showing sub-agents | B |
| `app/(pages)/workforce/components/manager-modal/components/NetworkChatTab.tsx` | Create | Chat tab with delegation events | B |
| `app/(pages)/workforce/components/wizard/CreateManagerWizard.tsx` | Create | Manager creation wizard | B |
| `app/(pages)/workforce/components/wizard/TeamStep.tsx` | Create | Team selection step | B |
| `app/(pages)/workforce/page.tsx` | Modify | Show managers in list | B |
| `app/(pages)/workforce/components/ManagerCard.tsx` | Create | Manager card component | B |

---

## Part A: Manager Backend & Network API

### Goal

Create backend infrastructure for managers: storage, config, network API, and sub-agent loading. Implement Mastra Agent Networks integration.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `_tables/types.ts` | Modify | Add ManagerConfig type | ~50 |
| `app/api/workforce/services/manager-creator.ts` | Create | Manager creation and file generation | ~150 |
| `app/api/workforce/services/sub-agent-loader.ts` | Create | Load sub-agent configs for manager | ~100 |
| `app/api/workforce/services/manager-network-service.ts` | Create | Manager network execution service | ~200 |
| `app/api/workforce/managers/route.ts` | Create | List/create managers API | ~100 |
| `app/api/workforce/managers/[managerId]/route.ts` | Create | Get/update/delete manager API | ~120 |
| `app/api/workforce/managers/[managerId]/network/route.ts` | Create | Network chat endpoint | ~150 |
| `app/api/workforce/managers/[managerId]/team/route.ts` | Create | Get sub-agents API | ~80 |

### Pseudocode

#### `_tables/types.ts` (modifications)

```
Add ManagerConfig type:
export type ManagerConfig = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "active" | "paused" | "draft";
  description: string;
  instructions: string;              // How manager should delegate
  model: string;                     // LLM for routing
  subAgentIds: string[];            // Agent IDs manager can delegate to
  toolIds?: string[];               // Optional: tools manager can use
  workflowIds?: string[];           // Optional: workflows manager can use
  objectives?: string[];
  guardrails?: string[];
  highlight: string;
  lastActivity: string;
  // ... other metadata fields (similar to AgentConfig)
};
```

#### `app/api/workforce/services/manager-creator.ts`

```
ManagerCreatorService
├── createManager(data: CreateManagerRequest)
│   ├── Generate managerId: `crypto.randomUUID()`
│   ├── Generate folder name: `${name-slug}-${managerId}`
│   ├── Create manager directory: `_tables/managers/${folderName}/`
│   ├── Generate config.ts file:
│   │   └── Export ManagerConfig object
│   ├── Create memory.db (auto-created by Mastra)
│   └── Return { managerId, folderName }
├── generateManagerFileContent(managerConfig: ManagerConfig)
│   └── Return TypeScript file content (similar to agent-creator.ts)
└── getManagerConfig(managerId: string)
    ├── Find manager folder
    ├── Load config.ts
    └── Return ManagerConfig
```

#### `app/api/workforce/services/sub-agent-loader.ts`

```
SubAgentLoaderService
├── loadSubAgents(subAgentIds: string[])
│   ├── For each subAgentId:
│   │   ├── Load agent config: `getAgentConfig(subAgentId)`
│   │   ├── Create agent memory: `getAgentMemory(subAgentId)`
│   │   ├── Load agent tools: `buildToolMap(userId, agentConfig)`
│   │   ├── Create Mastra Agent instance:
│   │   │   └── new Agent({ name, instructions, model, tools, memory })
│   │   └── Add to agents map: { [agentName]: agentInstance }
│   └── Return agents map: Record<string, Agent>
└── getSubAgentDescriptions(subAgentIds: string[])
    ├── Load agent configs
    ├── Extract descriptions (from systemPrompt or description field)
    └── Return array of { id, name, description }
```

#### `app/api/workforce/services/manager-network-service.ts`

```
ManagerNetworkService
├── createManagerNetwork(userId: string, managerConfig: ManagerConfig)
│   ├── Load sub-agents: `loadSubAgents(managerConfig.subAgentIds)`
│   ├── Load manager tools (if any): `buildToolMap(userId, managerConfig)`
│   ├── Get manager memory: `getManagerMemory(managerConfig.id)`
│   ├── Create manager agent:
│   │   └── new Agent({
│   │       name: managerConfig.name,
│   │       instructions: managerConfig.instructions,
│   │       model: gateway(managerConfig.model),
│   │       agents: subAgentsMap,        // Sub-agents as primitives
│   │       tools: managerToolsMap,      // Optional manager tools
│   │       workflows: managerWorkflows, // Optional manager workflows
│   │       memory: managerMemory,
│   │     })
│   └── Return manager agent instance
└── executeNetwork(managerAgent: Agent, userMessage: string)
    ├── Call managerAgent.network(userMessage)
    ├── Return async iterator of network events
    └── Events include:
        - routing-agent-start/end
        - agent-execution-start/end (sub-agent events)
        - network-execution-event-step-finish
```

#### `app/api/workforce/managers/[managerId]/network/route.ts`

```
POST /api/workforce/managers/[managerId]/network
├── Authenticate user
├── Parse body: { message, threadId? }
├── Load manager config: `getManagerConfig(managerId)`
├── Create manager network: `createManagerNetwork(userId, managerConfig)`
├── Create SSE stream:
│   ├── Call managerAgent.network(message)
│   ├── For each network event:
│   │   ├── Transform event to SSE format
│   │   ├── Include delegation info (which agent, what step)
│   │   └── Send to client
│   └── Close stream when complete
└── Return SSE response

Event transformation:
- agent-execution-start → { type: "delegation", agentId, agentName, message: "Delegating to..." }
- agent-execution-event-* → { type: "agent-event", agentId, event }
- agent-execution-end → { type: "delegation-complete", agentId, result }
- network-execution-event-step-finish → { type: "network-step", result }
```

#### `app/api/workforce/managers/[managerId]/team/route.ts`

```
GET /api/workforce/managers/[managerId]/team
├── Authenticate user
├── Load manager config: `getManagerConfig(managerId)`
├── Load sub-agent descriptions: `getSubAgentDescriptions(managerConfig.subAgentIds)`
├── For each sub-agent:
│   ├── Get agent config
│   ├── Extract: id, name, description, role, avatar
│   └── Build sub-agent info object
└── Return { subAgents: SubAgentInfo[] }
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Can create manager | POST /api/workforce/managers, verify config.ts created |
| AC-A.2 | Can list managers | GET /api/workforce/managers, verify managers returned |
| AC-A.3 | Can get manager config | GET /api/workforce/managers/[id], verify config returned |
| AC-A.4 | Can update manager | PATCH /api/workforce/managers/[id], verify config updated |
| AC-A.5 | Can delete manager | DELETE /api/workforce/managers/[id], verify folder removed |
| AC-A.6 | Can load sub-agents | Load manager with subAgentIds, verify agents loaded |
| AC-A.7 | Manager network executes | POST /network, verify network events streamed |
| AC-A.8 | Delegation events emitted | Verify agent-execution-start/end events in stream |
| AC-A.9 | Sub-agent descriptions loaded | GET /team, verify descriptions returned |
| AC-A.10 | Manager memory created | Verify memory.db exists for manager |

---

## Part B: Frontend Manager UI

### Goal

Build frontend UI for managers: manager list, manager modal with Team tab, network chat with delegation observability, and manager creation wizard.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/store/slices/managerSlice.ts` | Create | Manager state management | ~150 |
| `app/(pages)/workforce/components/ManagerCard.tsx` | Create | Manager card component | ~100 |
| `app/(pages)/workforce/components/manager-modal/ManagerModal.tsx` | Create | Manager modal wrapper | ~150 |
| `app/(pages)/workforce/components/manager-modal/components/TeamTab.tsx` | Create | Team tab showing sub-agents | ~200 |
| `app/(pages)/workforce/components/manager-modal/components/NetworkChatTab.tsx` | Create | Chat with delegation events | ~250 |
| `app/(pages)/workforce/components/wizard/CreateManagerWizard.tsx` | Create | Manager creation wizard | ~200 |
| `app/(pages)/workforce/components/wizard/TeamStep.tsx` | Create | Team selection step | ~150 |
| `app/(pages)/workforce/page.tsx` | Modify | Show managers in list | ~50 |

### Pseudocode

#### `app/(pages)/workforce/components/ManagerCard.tsx`

```
ManagerCard({ manager, onClick })
├── Render card:
│   ├── Manager icon/badge (different from agent)
│   ├── Manager name and role
│   ├── Description
│   ├── Sub-agents count badge
│   └── Status indicator
└── Handle click → open manager modal
```

#### `app/(pages)/workforce/components/manager-modal/components/TeamTab.tsx`

```
TeamTab({ manager })
├── Fetch sub-agents: GET /api/workforce/managers/[id]/team
├── Render:
│   ├── Header: "Team" with sub-agents count
│   ├── Sub-agents list:
│   │   ├── For each sub-agent:
│   │   │   ├── Agent card:
│   │   │   │   ├── Avatar and name
│   │   │   │   ├── Description
│   │   │   │   ├── Role
│   │   │   │   └── "Open Agent" button
│   │   │   └── Click → open agent modal
│   └── "Add Sub-Agent" button (future)
└── Handle:
    └── Agent click → navigate to agent modal
```

#### `app/(pages)/workforce/components/manager-modal/components/NetworkChatTab.tsx`

```
NetworkChatTab({ manager })
├── Use network chat hook: `useManagerNetworkChat(managerId)`
├── Render:
│   ├── Chat area (similar to agent chat)
│   ├── Message list:
│   │   ├── User messages
│   │   ├── Delegation events:
│   │   │   ├── "🔄 Delegating to Resume Tailor Agent..."
│   │   │   └── Expandable to see sub-agent conversation
│   │   └── Manager responses
│   └── Input area
├── Handle network events:
│   ├── delegation → Show delegation indicator
│   ├── agent-event → Update delegation status
│   ├── delegation-complete → Show result
│   └── network-step → Show final result
└── Display delegation timeline:
    └── Show which agent handled what, in order
```

#### `app/(pages)/workforce/components/wizard/CreateManagerWizard.tsx`

```
CreateManagerWizard({ onComplete })
├── Steps:
│   ├── Step 1: Identity
│   │   ├── Name, role, avatar
│   │   └── Description
│   ├── Step 2: Instructions
│   │   ├── System prompt for manager
│   │   └── How manager should delegate
│   ├── Step 3: Team
│   │   ├── Select sub-agents (multi-select)
│   │   ├── Show agent descriptions
│   │   └── Preview team
│   ├── Step 4: Capabilities (optional)
│   │   ├── Tools manager can use directly
│   │   └── Workflows manager can use
│   └── Step 5: Review
│       └── Summary of manager config
├── Handle submit:
│   ├── POST /api/workforce/managers
│   ├── Create manager
│   └── Navigate to manager modal
└── Similar structure to CreateAgentWizard
```

#### `app/(pages)/workforce/components/wizard/TeamStep.tsx`

```
TeamStep({ selectedAgentIds, onUpdate })
├── Fetch all agents: GET /api/workforce
├── Render:
│   ├── Header: "Select Sub-Agents"
│   ├── Description: "Choose which agents this manager can delegate to"
│   ├── Agent list:
│   │   ├── For each agent:
│   │   │   ├── Checkbox
│   │   │   ├── Agent card (name, role, description)
│   │   │   └── Toggle selection
│   └── Selected count: "X agents selected"
├── Handle:
│   ├── Toggle agent → update selectedAgentIds
│   └── Filter/search agents (future)
└── Validation:
    └── At least one agent must be selected
```

#### `app/(pages)/workforce/page.tsx` (modifications)

```
WorkforcePage
├── Fetch managers: GET /api/workforce/managers
├── Fetch agents: GET /api/workforce (existing)
├── Render:
│   ├── Header: "Workforce"
│   ├── Tabs: "All", "Agents", "Managers"
│   ├── Grid view:
│   │   ├── Manager cards (with manager badge)
│   │   └── Agent cards (existing)
│   └── "Create" button → show wizard selector
└── Handle:
    ├── Manager click → open ManagerModal
    ├── Agent click → open AgentModal (existing)
    └── Create → show wizard (agent or manager)
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Managers appear in workforce list | Navigate to /workforce, verify managers shown |
| AC-B.2 | Manager card shows manager badge | Verify visual distinction from agents |
| AC-B.3 | Can open manager modal | Click manager card, verify modal opens |
| AC-B.4 | Team tab shows sub-agents | Click Team tab, verify sub-agents listed |
| AC-B.5 | Can click sub-agent to open | Click sub-agent in Team tab, verify agent modal opens |
| AC-B.6 | Network chat works | Send message to manager, verify response |
| AC-B.7 | Delegation events shown | Verify "Delegating to..." messages appear |
| AC-B.8 | Delegation timeline visible | Verify which agent handled what is shown |
| AC-B.9 | Can create manager | Click "Create Manager", complete wizard, verify manager created |
| AC-B.10 | Team step allows selection | In wizard, select sub-agents, verify selection works |
| AC-B.11 | Manager instructions editable | Verify instructions field in wizard |
| AC-B.12 | Network events stream correctly | Verify real-time delegation updates in chat |

---

## User Flows

### Flow 1: Create Job Application Manager

```
1. User clicks "Create Manager" in Workforce
2. Wizard Step 1: Enter name "Job Application Manager", role "Manager"
3. Wizard Step 2: Enter instructions: "You coordinate job applications. Delegate to specialists."
4. Wizard Step 3: Select sub-agents:
   - Resume Tailor Agent
   - Job Scraper Agent
   - Application Filler Agent
5. Wizard Step 4: (Skip capabilities)
6. Wizard Step 5: Review and create
7. Manager created and appears in Workforce
8. User clicks manager to open modal
```

### Flow 2: Chat with Manager (Delegation)

```
1. User opens Job Application Manager
2. User types: "Help me apply for jobs"
3. Manager analyzes and delegates:
   - Shows: "🔄 Delegating to Job Scraper Agent..."
   - Job Scraper finds jobs
   - Shows: "✅ Job Scraper Agent found 5 jobs"
   - Shows: "🔄 Delegating to Resume Tailor Agent..."
   - Resume Tailor tailors resume
   - Shows: "✅ Resume Tailor Agent completed"
4. Manager presents final result
5. User sees delegation timeline in chat
```

---

## Out of Scope

- **Manager-to-Manager Delegation**: Managers delegating to other managers
- **Dynamic Team Changes**: Adding/removing sub-agents at runtime
- **Team Permissions**: Restricting sub-agent visibility
- **Manager Analytics**: Detailed delegation metrics
- **Custom Routing Rules**: User-defined routing logic (LLM handles this)
- **Sub-Agent Conversation Details**: Full sub-agent chat history (high-level only)

---

## Open Questions

- ✅ Should manager modal have different tabs than agent modal? **ANSWERED** - Team tab instead of some agent tabs. UI exploration needed.
- ✅ How much detail to show about sub-agent execution? **ANSWERED** - Full sub-agent conversation if possible (expandable)
- ✅ Can managers have their own tools/workflows? **ANSWERED** - Yes, hybrid model - managers can use tools/workflows directly
- [ ] Should managers be searchable/filterable separately from agents?
- ✅ What happens if sub-agent fails? **ANSWERED** - Defer to Mastra framework behavior
- ✅ Manager memory scope? **ANSWERED** - Research Mastra documentation (see 01B research log)
- [ ] Network event transformation details? **→ RESEARCH NEEDED: See 01B research log**
- [ ] Sub-agent loading performance strategy? **→ RESEARCH NEEDED: See 01B research log**

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| YYYY-MM-DD | Initial creation | TBD |

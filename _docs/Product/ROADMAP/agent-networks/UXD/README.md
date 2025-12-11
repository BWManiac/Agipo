# Manager Agents (Agent Networks) - UXD

**Created:** December 2024
**Status:** UXD Design Phase
**Related Roadmap:** `../01-Manager-Agents.md`

---

## Overview

Manager Agents enable intelligent coordination of multiple specialized agents through delegation. Users can interact with a single manager agent that automatically routes tasks to the appropriate specialist agents, providing a familiar manager-team organizational pattern. This UXD provides comprehensive mockups for the manager agent creation, configuration, and interaction interfaces.

### Design Philosophy

Building upon the existing workforce UI, we're introducing:
- **Dedicated Manager Section** in workforce dashboard with visual distinction
- **Team Management** interface for selecting and organizing sub-agents
- **Delegation Visibility** showing real-time routing and execution
- **Network Chat UI** with clear delegation events and sub-agent responses
- **Manager Creation Wizard** extending the existing agent creation flow

---

## Scope

### In Scope (v1)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Manager Badge/Icon** | Visual distinction for managers in workforce | Core |
| **Manager Creation Wizard** | Multi-step creation flow with team selection | Core |
| **Team Tab** | View and manage sub-agents in manager modal | Core |
| **Delegation Chat UI** | Show routing decisions and sub-agent execution | Core |
| **Network Status** | Real-time delegation status indicators | Core |
| **Team Selection UI** | Multi-select interface for sub-agents | Core |
| **Delegation History** | View past delegations and results | Core |
| **Manager Instructions** | Configure delegation strategy | Core |
| **Capability Hybrid** | Optional direct tools for managers | Nice to have |
| **Sub-agent Preview** | Quick view of sub-agent capabilities | Nice to have |

### Out of Scope (v1)

| Feature | Reason |
|---------|--------|
| Manager-to-Manager Delegation | Complex chains not supported yet |
| Dynamic Team Changes | Runtime team modification |
| Delegation Analytics | Detailed metrics and patterns |
| Custom Routing Rules | LLM handles routing decisions |
| Team Permissions | All agents available to all managers |

---

## Features to Demonstrate in UXD

### 1. Workforce Dashboard with Managers (`01-workforce-managers-section.html`)

Enhanced workforce dashboard showing:
- Dedicated "Managers" section above regular agents
- Manager badges/icons for visual distinction
- "Create Manager" button alongside "Hire new agent"
- Manager status indicators (delegating, idle, etc.)

### 2. Manager Creation Wizard (`02-create-manager-wizard.html`)

Multi-step wizard:
- **Step 1**: Identity (name, role, avatar, manager badge)
- **Step 2**: Instructions (delegation strategy, decision criteria)
- **Step 3**: Team Selection (multi-select sub-agents)
- **Step 4**: Capabilities (optional direct tools/workflows)
- **Step 5**: Review & Create

### 3. Team Selection Interface (`03-team-selection.html`)

Sub-agent selection UI:
- Grid/list view of available agents
- Multi-select checkboxes
- Agent capability preview cards
- Search and filter options
- Selected team summary

### 4. Manager Modal - Team Tab (`04-manager-modal-team-tab.html`)

Team management interface:
- List of sub-agents with descriptions
- Agent capability badges
- Quick actions (view agent, remove from team)
- Add agents to team button
- Team performance indicators

### 5. Network Chat Interface (`05-network-chat-delegation.html`)

Chat with delegation events:
- User message to manager
- Manager thinking/routing indicator
- Delegation event cards
- Sub-agent execution status
- Sub-agent response integration
- Final manager summary

### 6. Delegation Event States (`06-delegation-states/`)

Multiple delegation states:
- `06a-routing-decision.html` - Manager deciding which agent
- `06b-delegating-to-agent.html` - Active delegation
- `06c-sub-agent-executing.html` - Sub-agent working
- `06d-delegation-complete.html` - Results returned
- `06e-multi-agent-coordination.html` - Multiple agents working

### 7. Manager Configuration (`07-manager-config.html`)

Manager-specific configuration:
- Delegation instructions editor
- Routing strategy settings
- Team coordination preferences
- Fallback behavior
- Error handling strategy

### 8. Delegation History (`08-delegation-history.html`)

Historical view of delegations:
- Timeline of past delegations
- Sub-agent task assignments
- Success/failure indicators
- Execution time metrics
- Result summaries

### 9. Sub-agent Quick View (`09-subagent-preview.html`)

Preview modal for sub-agents:
- Agent capabilities summary
- Recent task history
- Performance metrics
- Direct chat option
- Remove from team action

### 10. Manager Status Cards (`10-manager-status-indicators.html`)

Various manager states:
- Idle (waiting for tasks)
- Routing (analyzing request)
- Coordinating (managing multiple agents)
- Summarizing (preparing response)
- Error states

---

## UXD File Manifest

| # | File/Folder | Description | Status |
|---|-------------|-------------|--------|
| 01 | `01-workforce-managers-section.html` | Dashboard with dedicated manager section | Pending |
| 02 | `02-create-manager-wizard.html` | Multi-step manager creation flow | Pending |
| 03 | `03-team-selection.html` | Sub-agent selection interface | Pending |
| 04 | `04-manager-modal-team-tab.html` | Team management in manager modal | Pending |
| 05 | `05-network-chat-delegation.html` | Chat showing delegation flow | Pending |
| 06 | `06-delegation-states/` | Various delegation states | Pending |
|    | `06a-routing-decision.html` | Manager routing logic | Pending |
|    | `06b-delegating-to-agent.html` | Active delegation | Pending |
|    | `06c-sub-agent-executing.html` | Sub-agent working | Pending |
|    | `06d-delegation-complete.html` | Results returned | Pending |
|    | `06e-multi-agent-coordination.html` | Multiple agents | Pending |
| 07 | `07-manager-config.html` | Manager configuration panel | Pending |
| 08 | `08-delegation-history.html` | Historical delegations view | Pending |
| 09 | `09-subagent-preview.html` | Sub-agent quick view modal | Pending |
| 10 | `10-manager-status-indicators.html` | Manager state cards | Pending |
| -- | `Frontend-Backend-Mapping.md` | API endpoint documentation | Pending |

---

## Design Patterns from Existing Code

Based on workforce components analysis:

### Visual Hierarchy
- **Managers Section**: Separate section above regular agents
- **Badge System**: Special icon/badge for manager agents
- **Status Colors**: Extended status palette for delegation states

### Interaction Patterns
- **Wizard Flow**: Extend CreateFromScratchWizard for managers
- **Modal Tabs**: Add "Team" tab to agent modal structure
- **Chat Extensions**: Delegation events in chat stream

### Component Reuse
- Leverage existing AgentModal structure
- Extend CreateAgentDialog for manager option
- Reuse agent cards with manager modifications
- Adapt chat interface for network events

---

## Manager-Specific Design Elements

### Visual Indicators
- **Manager Badge**: Crown/hierarchy icon
- **Delegation Arrows**: Visual flow from manager to sub-agents
- **Network Status**: Pulsing/animated delegation indicators
- **Team Count Badge**: Number of sub-agents

### Delegation Event Cards
```
┌─────────────────────────────────────┐
│ 🔄 Delegating to Resume Tailor      │
│ Task: Customize resume for job      │
│ Status: In Progress                  │
│ [View Details]                      │
└─────────────────────────────────────┘
```

### Team Hierarchy Visualization
```
Manager
  ├── Resume Tailor Agent
  ├── Job Scraper Agent
  └── Application Filler Agent
```

---

## Technical Integration

### Mastra Agent Networks
- Use `.network()` instead of `.stream()` for managers
- Handle network-specific events
- Route sub-agent responses through manager

### Storage Structure
```
_tables/managers/
├── job-application-manager-[uuid]/
│   ├── config.ts
│   ├── team.json
│   └── memory.db
```

### Event Types
- `routing-agent-start`
- `agent-execution-start`
- `agent-execution-event-*`
- `agent-execution-end`
- `network-execution-event-step-finish`

---

## Open Questions

1. ~~Should managers appear in a separate section?~~ **YES** - Dedicated section with badge
2. ~~How to handle sub-agent selection?~~ **Multi-select from all agents**
3. ~~Can managers have their own tools?~~ **YES** - Hybrid model supported
4. ~~How much delegation detail to show?~~ **Full conversation when expanded**
5. Should delegation history be persistent?
6. How to visualize parallel delegations?

---

## Related Documentation

- **Current Workforce UI**: `app/(pages)/workforce/components/`
- **Agent Creation**: `app/(pages)/workforce/components/CreateAgentDialog.tsx`
- **Mastra Networks**: https://mastra.ai/docs/agents/networks
- **Roadmap Doc**: `../01-Manager-Agents.md`
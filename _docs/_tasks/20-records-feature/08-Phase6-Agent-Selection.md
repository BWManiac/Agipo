# Phase 6: Agent Selection

**Status:** 📋 Planned
**Depends On:** Phase 5
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Add the agent picker dropdown to the chat sidebar. Users can select which workforce agent they want to chat with about the table. The picker shows all available agents with their avatars and roles.

After this phase, users can open the agent picker dropdown, see all their workforce agents, select an agent, and the selected agent is displayed in the sidebar.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Agent source | Existing workforce API | Reuse existing agents |
| Picker UI | Dropdown with search | Matches mockup, scales with many agents |
| Selection persistence | Per-table in localStorage | Remember last used agent for each table |

### Pertinent Research

- **Mockup 02**: `02-agent-picker.html` - Shows agent dropdown with search, agent list, current selection highlighted

*Source: `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`*

### Overall File Impact

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/store/slices/agentsSlice.ts` | Create | agents list, selectedAgentId, loading states |
| `app/(pages)/records/store/index.ts` | Modify | Add agentsSlice to composition |
| `app/(pages)/records/store/types.ts` | Modify | Add AgentsSlice to RecordsStore |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/components/ChatSidebar/AgentPicker.tsx` | Create | Agent dropdown with search and selection |
| `app/(pages)/records/components/ChatSidebar/index.tsx` | Modify | Add AgentPicker section |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-6.1 | Agent picker section visible in sidebar | Open sidebar, see "Chat with Agent" section |
| AC-6.2 | Clicking picker opens dropdown | Click button, dropdown appears |
| AC-6.3 | Dropdown shows all workforce agents | Verify agents from /api/workforce appear |
| AC-6.4 | Each agent shows avatar, name, role | Check agent items in dropdown |
| AC-6.5 | Search input filters agents by name | Type name, verify filtering |
| AC-6.6 | Clicking agent selects it | Click agent, dropdown closes |
| AC-6.7 | Selected agent shown in picker button | Verify avatar/name displayed |
| AC-6.8 | Current selection highlighted in dropdown | Open dropdown, selected agent has checkmark |
| AC-6.9 | "Create new agent" link at bottom | Verify link present |
| AC-6.10 | Opening picker dims chat area | Verify backdrop/opacity on chat |

### User Flows

#### Flow 1: Select Agent

```
1. User clicks agent picker button
2. Dropdown opens with:
   - Search input at top
   - List of agents (avatar, name, role)
   - Current agent highlighted with checkmark
   - "Create new agent" link at bottom
3. User types "Mira" in search
4. List filters to show matching agents
5. User clicks "Mira Patel"
6. Dropdown closes
7. Picker button shows Mira's avatar and name
```

#### Flow 2: Return to Table

```
1. User selects agent "Noah Reyes" for table "Leads"
2. User navigates away
3. User returns to "Leads" table
4. System remembers Noah was selected
5. Agent picker shows "Noah Reyes"
```

---

## Out of Scope

- Agent creation flow → Links to workforce page
- Agent access permissions → Phase 9
- Thread management → Phase 7
- Actual chat messaging → Phase 8

---

## References

- **Mockup**: `02-agent-picker.html`
- **API**: `GET /api/workforce` (existing)
- **Pattern**: `workforce/components/agent-modal/store/slices/capabilitiesSlice.ts`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | Claude |

---

**Last Updated:** 2025-12-09

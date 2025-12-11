# Task: Direct Agent Configuration Editing

**Status:** Not Started  
**Roadmap:** `_docs/Product/ROADMAP/agent-config/01-Direct-Agent-Configuration-Editing.md`  
**Assigned:** TBD  
**Started:** YYYY-MM-DD  
**Completed:** YYYY-MM-DD

---

## Overview

### Goal

Enable users to directly edit core agent configuration (instructions, model, maxSteps) through the Config tab. The UI already exists but the save functionality is missing—this task implements the backend API and wires up the frontend to actually persist changes.

This is a simple, focused task that aligns agent configuration with Mastra's capabilities while maintaining backward compatibility with existing `systemPrompt` field.

### Relevant Research

**Current State:**
- ConfigTab UI exists with fields for: systemPrompt, model, objectives
- "Save Changes" button only console.logs (no actual save)
- Agent config stored in `_tables/agents/[folder]/config.ts` as TypeScript file
- Config updates use regex pattern matching (see `updateAgentTools()`)

**Mastra Agent Properties:**
- `instructions`: string | string[] | SystemMessage[] (converted from our `systemPrompt`)
- `model`: string (e.g., "google/gemini-2.5-pro")
- `maxSteps`: number (optional, defaults to 5)
- `providerOptions`: object (optional, advanced)

**Existing Update Pattern:**
- `updateAgentTools()` reads file, uses regex to find/replace field, writes back
- Pattern: `/(fieldName:\s*)\[.*?\](\s*,?)/` for arrays
- Pattern: `/(fieldName:\s*)"[^"]*"(\s*,?)/` for strings

**Runtime Usage:**
- `chat-service.ts` converts `systemPrompt` → `instructions` when creating agent
- `createConfiguredAgent()` uses: `instructions: agentConfig.systemPrompt`

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `_tables/types.ts` | No change | AgentConfig already has these fields | - |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workforce/[agentId]/config/route.ts` | Create | PATCH endpoint for updating agent config | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workforce/services/agent-config.ts` | Modify | Add update functions for instructions, model, maxSteps | A |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/ConfigTab.tsx` | Modify | Wire up save button, add API call, loading states | B |

---

## Part A: Backend API for Config Updates

### Goal

Create API endpoint and service functions to update agent configuration fields (systemPrompt, model, maxSteps, objectives, guardrails) in the config file.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workforce/[agentId]/config/route.ts` | Create | PATCH endpoint for config updates | ~80 |
| `app/api/workforce/services/agent-config.ts` | Modify | Add updateAgentInstructions(), updateAgentModel(), updateAgentMaxSteps() | ~150 |

### Pseudocode

#### `app/api/workforce/[agentId]/config/route.ts`

```
PATCH /api/workforce/[agentId]/config
├── Authenticate user
├── Parse body: { systemPrompt?, model?, maxSteps?, objectives?, guardrails? }
├── Validate:
│   ├── systemPrompt/instructions: min 10 chars if provided
│   ├── model: must be in AVAILABLE_MODELS list (from models.ts)
│   ├── maxSteps: must be positive integer if provided (no upper limit)
│   └── objectives/guardrails: array of strings
├── For each provided field:
│   ├── Call corresponding update function:
│   │   ├── systemPrompt → updateAgentInstructions()
│   │   ├── model → updateAgentModel()
│   │   ├── maxSteps → updateAgentMaxSteps()
│   │   ├── objectives → updateAgentObjectives()
│   │   └── guardrails → updateAgentGuardrails()
│   └── Handle errors (continue with partial updates - update successful fields, return errors for failed ones)
├── Return { success: true }
└── Handle errors → 400/500 response
```

#### `app/api/workforce/services/agent-config.ts` (additions)

```
updateAgentInstructions(agentId: string, systemPrompt: string)
├── Get agent folder path
├── Read config file
├── Find systemPrompt field:
│   └── Pattern: /(systemPrompt:\s*)"[^"]*"(\s*,?)/
├── Replace with new value:
│   └── Escape quotes in systemPrompt
├── Write file
└── Return void

updateAgentModel(agentId: string, model: string)
├── Get agent folder path
├── Read config file
├── Find model field:
│   └── Pattern: /(model:\s*)"[^"]*"(\s*,?)/
├── Replace with new value
├── Write file
└── Return void

updateAgentMaxSteps(agentId: string, maxSteps: number)
├── Get agent folder path
├── Read config file
├── Check if maxSteps exists:
│   ├── If exists: /(maxSteps:\s*)\d+(\s*,?)/
│   └── If not: Add after model field
├── Update or insert
├── Write file
└── Return void

updateAgentObjectives(agentId: string, objectives: string[])
├── Get agent folder path
├── Read config file
├── Find objectives field:
│   └── Pattern: /(objectives:\s*)\[[^\]]*\](\s*,?)/
├── Build array string: ["obj1", "obj2"]
├── Replace
├── Write file
└── Return void

updateAgentGuardrails(agentId: string, guardrails: string[])
├── (Same pattern as objectives)
└── Return void
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | PATCH endpoint accepts config updates | PATCH with systemPrompt, verify 200 response |
| AC-A.2 | systemPrompt updates config file | Verify file contains new systemPrompt value |
| AC-A.3 | model updates config file | Verify file contains new model value |
| AC-A.4 | maxSteps updates config file | Verify file contains new maxSteps value |
| AC-A.5 | Validation rejects invalid model | PATCH with invalid model, verify 400 error |
| AC-A.6 | Validation rejects empty systemPrompt | PATCH with empty string, verify 400 error |
| AC-A.7 | File formatting preserved | Verify indentation, structure unchanged |
| AC-A.8 | Multiple fields can be updated | PATCH with systemPrompt + model, both update |

---

## Part B: Frontend Save Functionality

### Goal

Wire up the ConfigTab save button to call the API, show loading states, and provide user feedback.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/ConfigTab.tsx` | Modify | Add save functionality, API call, loading/error states | ~80 |

### Pseudocode

#### `app/(pages)/workforce/components/agent-modal/components/tabs/ConfigTab.tsx` (modifications)

```
ConfigTab
├── Add state:
│   ├── isSaving: boolean
│   ├── saveError: string | null
│   └── lastSaved: Date | null
├── handleSave function:
│   ├── Set isSaving = true
│   ├── Validate:
│   │   ├── systemPrompt: min 10 chars
│   │   └── model: must be selected
│   ├── Call API:
│   │   └── PATCH /api/workforce/[agentId]/config
│   │       Body: { systemPrompt, model, objectives: objectives.split("\n") }
│   ├── On success:
│   │   ├── Set isSaving = false
│   │   ├── Set lastSaved = new Date()
│   │   ├── Show success toast
│   │   └── Clear saveError
│   └── On error:
│       ├── Set isSaving = false
│       ├── Set saveError = error.message
│       └── Show error toast
├── Update Save button:
│   ├── Disabled when isSaving
│   ├── Show loading spinner when isSaving
│   └── Text: "Saving..." when isSaving
└── Add save status indicator:
    ├── Show "Saved" badge if lastSaved exists
    └── Show error message if saveError exists
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Save button calls API | Click save, verify PATCH request sent |
| AC-B.2 | Loading state during save | Button shows spinner, disabled during save |
| AC-B.3 | Success feedback | Toast shows "Configuration saved" |
| AC-B.4 | Error handling | Invalid data shows error message |
| AC-B.5 | Changes persist | Refresh page, verify changes still there |
| AC-B.6 | Validation prevents invalid saves | Empty systemPrompt, save button disabled/shows error |

---

## User Flows

### Flow 1: Save Configuration

```
1. User edits systemPrompt in textarea
2. User clicks "Save Changes"
3. Button shows loading spinner
4. API call succeeds
5. Toast: "Agent configuration updated"
6. Button returns to normal state
7. "Saved" indicator appears
```

---

## Out of Scope

- **Instruction format editor**: Array/system message format UI (future)
- **Auto-save**: Save on blur/change (future)
- **Config history**: Version tracking (future)
- **Undo/redo**: Reverting changes (future)

---

## Open Questions

- ✅ Should we validate model ID against available models list? **ANSWERED** - Yes, use `AVAILABLE_MODELS` from `models.ts`
- ✅ Should maxSteps be in main view or advanced section? **ANSWERED** - Advanced section (collapsible)
- ✅ How to handle concurrent edits? **ANSWERED** - Single-user assumption for MVP, multi-user deferred
- [ ] Should we show diff preview before saving? (probably not for MVP)
- ✅ Validation timing? **ANSWERED** - Both client-side and server-side with UX for errors
- ✅ Auto-save future support? **ANSWERED** - Design UI to support future auto-save (debounced)
- ✅ Config backup? **ANSWERED** - No backups, rely on Git

---

## Validation of Approach ✅

**Current State Analysis:**
- `agent-config.ts` service already has pattern for file updates (`updateAgentTools`, `updateConnectionToolBindings`, `updateWorkflowBindings`)
- Pattern used: Read file → Regex replace → Write file
- Regex patterns work well for simple fields: `/(fieldName:\s*)"[^"]*"(\s*,?)/`
- Model validation available via `isValidModelId()` in `models.ts`
- No existing `updateAgentInstructions()` or similar methods yet

**Approach Validation:**
- ✅ Using regex for updates: CORRECT (consistent with existing patterns)
- ✅ Using `agent-config.ts` service: CORRECT (follows existing architecture)
- ✅ Model validation against `AVAILABLE_MODELS`: CORRECT (function exists)
- ✅ Partial updates on error: CORRECT (better UX than all-or-nothing)
- ✅ PATCH endpoint: CORRECT (RESTful for partial updates)

## File Impact Analysis

- **CREATE:** `app/api/workforce/[agentId]/config/route.ts` (new API endpoint)
- **MODIFY:** `app/api/workforce/services/agent-config.ts` (add update methods)
- **MODIFY:** `app/(pages)/workforce/components/agent-modal/components/tabs/ConfigTab.tsx` (wire up save)

## Deterministic Decisions

1. **Field Update Pattern**: Use regex like existing methods
   - String fields: `/(fieldName:\s*)"[^"]*"(\s*,?)/`
   - Array fields: `/(fieldName:\s*)\[[^\]]*\](\s*,?)/`
   - Number fields: `/(fieldName:\s*)\d+(\s*,?)/`

2. **Error Handling**: Continue with partial updates
   - If `systemPrompt` succeeds but `model` fails, update systemPrompt and return error for model
   - Return `{ success: true, updated: ["systemPrompt"], errors: ["model: Invalid model ID"] }`

3. **Validation Rules**:
   - `systemPrompt`: Min 10 characters (not empty)
   - `model`: Must exist in `AVAILABLE_MODELS` (use `isValidModelId()`)
   - `maxSteps`: Positive integer, no upper limit
   - `objectives`/`guardrails`: Array of strings, can be empty

4. **Missing Field Handling**:
   - If `maxSteps` doesn't exist in file, add it after `model` field
   - Other fields should always exist (from agent creation)

5. **No Format Preservation**:
   - Don't worry about indentation/formatting
   - Files are TypeScript, IDE/prettier will handle formatting

6. **Save Behavior**:
   - Manual save only (no auto-save in MVP)
   - No debouncing needed
   - No backup needed (Git handles versioning)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| YYYY-MM-DD | Initial creation | TBD |
| 2024-12-11 | Added validation and deterministic decisions | Claude |
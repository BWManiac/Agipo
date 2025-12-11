# Phase 5: Complete Create Flow

**Status:** 📋 Planned  
**Depends On:** Phase 4  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Complete the create agent flow by adding Step 3 (Capabilities), sub-agents support, error handling, and loading states. This phase makes the wizard fully functional with all optional features.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Capabilities step | Optional with skip button | Reduces friction - users can add capabilities later |
| Tools search | UI design now, LLM implementation later | Allows future enhancement without blocking MVP |
| Sub-agents screen | Separate screen (not nested modal) | Avoids modal nesting, better UX |
| Error handling | Dedicated error state component | Clear error messages and recovery options |

### Pertinent Research

- **UXD Mockups**: Complete HTML mockups exist for Step 3, sub-agents, and error states
- **Existing Components**: Can reuse ConnectionToolEditorPanel, WorkflowEditorPanel, ToolEditor
- **Tools Search**: LLM-powered search is designed but implementation deferred

*Source: `_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/`, `_references/02-Impact-Analysis.md`*

### Overall File Impact

#### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/wizard/CapabilitiesStep.tsx` | Create | Step 3: Tools, connections, workflows selection | A |
| `app/(pages)/workforce/components/wizard/ToolsSearchInput.tsx` | Create | LLM-powered tools search input (mock data for now) | B |
| `app/(pages)/workforce/components/SubAgentsScreen.tsx` | Create | Sub-agents selection screen | C |
| `app/(pages)/workforce/components/wizard/ErrorState.tsx` | Create | Error handling screen | D |
| `app/(pages)/workforce/components/CreateFromScratchWizard.tsx` | Modify | Add Step 3, sub-agents handling, error handling, loading states | E |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-5.1 | Step 3 (Capabilities) allows selecting tools | Select tools, verify they're included in creation | A |
| AC-5.2 | Step 3 can be skipped | Click "Skip this step", verify agent created without capabilities | A |
| AC-5.3 | Tools search input shows UI (mock data) | Enter text, verify suggestions dropdown appears | B |
| AC-5.4 | Manager toggle shows sub-agents link | Enable toggle, verify link appears | E |
| AC-5.5 | Sub-agents screen opens and works | Click link, select agents, verify saved | C |
| AC-5.6 | Sub-agents empty state shows correctly | Create first agent, enable manager, verify empty state | C |
| AC-5.7 | Error state shows on API failure | Simulate error, verify error screen | D |
| AC-5.8 | Retry works from error state | Click retry, verify form resubmits | D |
| AC-5.9 | Loading states show during API calls | Verify loading indicator during submission | E |

### User Flows (Phase Level)

#### Flow 1: Create Agent with Capabilities

```
1. User completes Steps 1-2
2. User proceeds to Step 3
3. User selects tools, connections, workflows
4. User clicks "Create Agent"
5. Agent created with all capabilities
```

#### Flow 2: Create Manager Agent

```
1. User enables manager toggle in Step 2
2. User clicks "Configure Sub-Agents"
3. Sub-agents screen opens
4. User selects existing agents
5. User saves and continues
6. Agent created with sub-agents
```

#### Flow 3: Error Handling

```
1. User submits form
2. API call fails
3. Error state shows
4. User clicks "Try Again"
5. Form resubmits
```

---

## Part A: Create CapabilitiesStep Component

### Goal

Create Step 3 form component that allows users to optionally select tools, connection tools, and workflows for the agent. This step can be skipped.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/wizard/CapabilitiesStep.tsx` | Create | Step 3 form with tools, connections, workflows selection | ~250 |

### Pseudocode

#### `CapabilitiesStep.tsx`

```
CapabilitiesStep Component
├── Props: { data, onChange, onSkip, onPrevious, onSubmit }
├── State: Selected tools, connections, workflows
├── Render:
│   ├── "Skip this step" button (prominent)
│   ├── ToolsSearchInput component
│   ├── Section: "Custom Tools"
│   │   └── Reuse ToolEditor or similar component
│   ├── Section: "Connection Tools"
│   │   └── Reuse ConnectionToolEditorPanel or similar
│   ├── Section: "Workflows"
│   │   └── Reuse WorkflowEditorPanel or similar
│   └── Buttons: Previous, Create Agent
└── Handlers:
    ├── handleSkip() - Skip step, proceed to creation
    └── handleSubmit() - Include capabilities in creation
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-5.1 | Custom tools can be selected | Select tools, verify they appear in selected list |
| AC-5.1 | Connection tools can be selected | Select Gmail tools, verify they're included |
| AC-5.1 | Workflows can be selected | Select workflow, verify it's included |
| AC-5.2 | "Skip this step" button works | Click skip, verify agent created without capabilities |
| AC-5.1 | Selected items can be removed | Remove tool, verify it disappears from selection |

### User Flows

#### Flow A.1: Select Capabilities

```
1. User on Step 3
2. User enters "send emails" in tools search
3. System shows suggestions (mock data)
4. User selects "Gmail - Send Email"
5. User selects custom tools
6. User selects workflows
7. User clicks "Create Agent"
8. Agent created with all selected capabilities
```

#### Flow A.2: Skip Capabilities

```
1. User on Step 3
2. User clicks "Skip this step"
3. Wizard proceeds directly to creation
4. Agent created without capabilities
5. User can add capabilities later in agent modal
```

---

## Part B: Create ToolsSearchInput Component

### Goal

Create tools search input component with LLM-powered search UI. For now, uses mock data; LLM implementation deferred.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/wizard/ToolsSearchInput.tsx` | Create | Tools search input with auto-suggest dropdown | ~150 |

### Pseudocode

#### `ToolsSearchInput.tsx`

```
ToolsSearchInput Component
├── Props: { onSelectTool, selectedTools }
├── State: searchQuery, suggestions, isOpen
├── Render:
│   ├── Input with search icon
│   │   └── Placeholder: "Describe what capabilities this agent needs..."
│   ├── Suggestions dropdown (conditional)
│   │   ├── Filtered tool suggestions
│   │   └── Each suggestion: name, description, toolkit
│   └── Selected tools chips (if any)
└── Handlers:
    ├── handleSearch() - Filter mock suggestions
    ├── handleSelectTool() - Add tool to selection
    └── handleRemoveTool() - Remove from selection
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-5.3 | Search input shows suggestions dropdown | Enter text, verify dropdown appears |
| AC-5.3 | Suggestions filter based on query | Enter "email", verify email-related tools shown |
| AC-5.3 | Tool can be selected from suggestions | Click suggestion, verify tool added to selection |
| AC-5.3 | Selected tools show as chips | Verify selected tools display as removable chips |
| AC-5.3 | Mock data works correctly | Verify suggestions appear (no API call needed yet) |

### User Flows

#### Flow B.1: Search and Select Tools

```
1. User types "send emails and manage calendar" in search
2. System shows filtered suggestions
3. User clicks "Gmail - Send Email"
4. Tool added to selection
5. User clicks "Calendar - Create Event"
6. Tool added to selection
7. Selected tools shown as chips
```

---

## Part C: Create SubAgentsScreen Component

### Goal

Create separate screen component for selecting sub-agents when creating a manager agent. Handles both populated state (with agents) and empty state.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/SubAgentsScreen.tsx` | Create | Sub-agents selection screen with agent list | ~150 |

### Pseudocode

#### `SubAgentsScreen.tsx`

```
SubAgentsScreen Component
├── Props: { availableAgents, selectedAgentIds, onSave, onCancel }
├── State: selectedAgents (local selection)
├── Render (if agents available):
│   ├── Header: "Select Sub-Agents"
│   ├── Agent list with checkboxes
│   │   ├── Each agent: avatar, name, role, status badge
│   │   └── Checkbox for selection
│   ├── Selection summary counter
│   └── Buttons: Cancel, Save
├── Render (if no agents - empty state):
│   ├── Empty state icon and message
│   ├── "Finish creating this agent first..." message
│   ├── "Continue Creating Agent" button
│   └── Cancel button
└── Handlers:
    ├── handleToggleAgent() - Toggle agent selection
    ├── handleSave() - Save selection, return to wizard
    └── handleCancel() - Cancel, return to wizard
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-5.5 | Agent list shows with checkboxes | Verify all available agents displayed |
| AC-5.5 | Agents can be selected/deselected | Click checkbox, verify selection toggles |
| AC-5.5 | Selection summary shows count | Select 2 agents, verify "2 agent(s) selected" |
| AC-5.5 | Save button returns to wizard | Click Save, verify returns to Step 2 with data |
| AC-5.6 | Empty state shows when no agents | Create first agent, verify empty state message |
| AC-5.6 | Empty state "Continue" button works | Click Continue, verify returns to Step 2 |

### User Flows

#### Flow C.1: Select Sub-Agents (With Agents)

```
1. User enables manager toggle in Step 2
2. User clicks "Configure Sub-Agents"
3. SubAgentsScreen opens
4. User sees list of available agents
5. User selects 2 agents
6. User clicks "Save"
7. Returns to Step 2 with subAgentIds saved
```

#### Flow C.2: Sub-Agents Empty State

```
1. User creates first agent
2. User enables manager toggle
3. User clicks "Configure Sub-Agents"
4. SubAgentsScreen shows empty state
5. Message: "Finish creating this agent first..."
6. User clicks "Continue Creating Agent"
7. Returns to Step 2
```

---

## Part D: Create ErrorState Component

### Goal

Create error handling screen that shows when agent creation fails, with clear error messages and recovery options.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/wizard/ErrorState.tsx` | Create | Error screen with message, retry, and go back options | ~100 |

### Pseudocode

#### `ErrorState.tsx`

```
ErrorState Component
├── Props: { error, formData, onRetry, onGoBack, onCancel }
├── Render:
│   ├── Error icon (red X)
│   ├── Error message: "Agent Creation Failed"
│   ├── Error details section
│   │   └── Display error message from API
│   ├── "Try Again" button
│   │   └── Resubmits form with same data
│   ├── "Go Back to Form" button
│   │   └── Returns to last step with data preserved
│   └── "Cancel" button
│       └── Closes dialog, discards data
└── Handlers:
    ├── handleRetry() - Resubmit form
    └── handleGoBack() - Return to form
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-5.7 | Error state shows on API failure | Simulate API error, verify error screen appears |
| AC-5.7 | Error message displays correctly | Verify API error message is shown |
| AC-5.8 | "Try Again" button resubmits | Click retry, verify API called again |
| AC-5.8 | "Go Back to Form" preserves data | Click go back, verify form data still present |
| AC-5.8 | "Cancel" button closes dialog | Click cancel, verify dialog closes |

### User Flows

#### Flow D.1: Handle Creation Error

```
1. User submits form
2. API call fails (network error, validation error, etc.)
3. ErrorState component renders
4. Error message displayed
5. User clicks "Try Again"
6. Form resubmits with same data
7. If successful, proceeds to success state
```

---

## Part E: Update CreateFromScratchWizard

### Goal

Update wizard to integrate Step 3, sub-agents handling, error handling, and loading states.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/CreateFromScratchWizard.tsx` | Modify | Add Step 3, sub-agents flow, error handling, loading states | ~100 (additions) |

### Pseudocode

#### `CreateFromScratchWizard.tsx` Updates

```
CreateFromScratchWizard Updates
├── Add Step 3 to flow:
│   ├── currentStep can be 3
│   └── Render CapabilitiesStep when step === 3
├── Add sub-agents handling:
│   ├── State: showSubAgentsScreen
│   ├── Handler: openSubAgentsScreen()
│   └── Handler: saveSubAgents(selectedIds)
├── Add error handling:
│   ├── State: error (string | null)
│   ├── Try-catch around API call
│   └── Render ErrorState when error exists
├── Add loading states:
│   ├── State: isLoading
│   └── Show loading indicator during API call
└── Update handleSubmit():
    ├── Set isLoading = true
    ├── Try API call
    ├── On success: show SuccessState
    ├── On error: set error, show ErrorState
    └── Set isLoading = false
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-5.4 | Manager toggle opens sub-agents screen | Enable toggle, click link, verify screen opens |
| AC-5.9 | Loading state shows during API call | Submit form, verify loading indicator |
| AC-5.7 | Error handling works | Simulate error, verify ErrorState shows |
| AC-5.1 | Step 3 data included in creation | Select capabilities, verify they're in API call |

### User Flows

#### Flow E.1: Complete Flow with All Features

```
1. User completes Steps 1-2
2. User enables manager toggle
3. User configures sub-agents
4. User proceeds to Step 3
5. User selects capabilities
6. User clicks "Create Agent"
7. Loading state shows
8. API call succeeds
9. Success state shows
```

---

## Out of Scope

- **LLM-powered tools search implementation** → Design now, implement later
- **Marketplace flow** → Future phase
- **Agent editing** → Use agent modal for editing

---

## References

- **Product Spec:** `00-PRODUCT-SPEC.md` - Complete flow requirements (PR-2.3, PR-2.4, PR-2.7)
- **Implementation Plan:** `00-IMPLEMENTATION-PLAN.md` - Phase 5 details
- **UXD Mockups:** `_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/create-custom/`
- **Frontend-Backend Mapping:** `_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/create-custom/Frontend-Backend-Mapping.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | AI Assistant |

---

**Last Updated:** December 9, 2025


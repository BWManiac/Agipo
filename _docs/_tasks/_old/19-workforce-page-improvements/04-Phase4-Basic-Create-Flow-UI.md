# Phase 4: Basic Create Flow UI

**Status:** 📋 Planned  
**Depends On:** Phase 3  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Build the create agent dialog and first two wizard steps (Identity and Personality) that allow users to create agents through a user-friendly interface. This phase establishes the core UI flow and integrates with the API foundation from Phase 3.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Modal vs. separate page | Modal dialog | Keeps user in context, matches existing patterns (agent modal) |
| Step-by-step wizard | 3-step wizard | Reduces cognitive load, clear progression |
| Form validation | Client-side + API validation | Immediate feedback + server-side safety |
| Success state | Separate screen with quick actions | Clear confirmation and next steps |

### Pertinent Research

- **UXD Mockups**: Complete HTML mockups exist for all steps
- **shadcn/ui Design Language**: All components should use shadcn/ui patterns
- **Agent Primitives**: Only name, role, systemPrompt, model are required

*Source: `_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/`, `_references/04-MASTRA-PRIMITIVES-RESEARCH.md`*

### Overall File Impact

#### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/CreateAgentDialog.tsx` | Create | Main modal container with tabs | A |
| `app/(pages)/workforce/components/CreateFromScratchWizard.tsx` | Create | 3-step wizard orchestrator | B |
| `app/(pages)/workforce/components/wizard/IdentityStep.tsx` | Create | Step 1: Identity form | C |
| `app/(pages)/workforce/components/wizard/PersonalityStep.tsx` | Create | Step 2: Personality form | D |
| `app/(pages)/workforce/components/wizard/SuccessState.tsx` | Create | Success confirmation screen | E |
| `app/(pages)/workforce/components/WorkforceDashboard.tsx` | Modify | Add dialog state and "Hire new agent" button integration | F |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-4.1 | Create Agent dialog opens from "Hire new agent" button | Click button, verify dialog opens | F |
| AC-4.2 | Step 1 (Identity) form works with validation | Fill form, verify validation, verify data collected | C |
| AC-4.3 | Step 2 (Personality) form works with validation | Fill form, verify validation, verify data collected | D |
| AC-4.4 | Form submission creates agent via API | Submit form, verify API called, agent created | B |
| AC-4.5 | Success state shows after creation | Verify success screen with agent preview | E |
| AC-4.6 | Agent appears in roster immediately after creation | Verify agent card appears in Active Roster | F |

### User Flows (Phase Level)

#### Flow 1: Create Agent (Happy Path)

```
1. User clicks "Hire new agent" button
2. Create Agent dialog opens
3. User fills Step 1 (Identity)
4. User clicks "Next"
5. User fills Step 2 (Personality)
6. User clicks "Create Agent"
7. System calls API, creates agent
8. Success state shows
9. Agent appears in roster
```

---

## Part A: Create CreateAgentDialog Component

### Goal

Create the main modal dialog container that houses the create agent wizard. This component manages dialog state and provides the entry point for agent creation.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/CreateAgentDialog.tsx` | Create | Main modal with Dialog component, tabs structure | ~150 |

### Pseudocode

#### `CreateAgentDialog.tsx`

```
CreateAgentDialog Component
├── Props: { open, onOpenChange }
├── Render: Dialog (shadcn/ui)
│   ├── DialogHeader: "Create Agent"
│   ├── Tabs: "Create Custom Agent" | "Hire from Marketplace"
│   │   └── Tab 1: CreateFromScratchWizard
│   │   └── Tab 2: (Future - placeholder)
│   └── DialogFooter: (if needed)
└── State: Manages dialog open/close
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-4.1 | Dialog opens when open prop is true | Set open={true}, verify dialog visible |
| AC-4.1 | Dialog closes when onOpenChange called | Click outside or close button, verify dialog closes |
| AC-4.1 | Tabs render correctly | Verify "Create Custom Agent" tab is visible |

### User Flows

#### Flow A.1: Open Create Agent Dialog

```
1. User clicks "Hire new agent" button
2. WorkforceDashboard sets dialog open state
3. CreateAgentDialog receives open={true}
4. Dialog renders with CreateFromScratchWizard
```

---

## Part B: Create CreateFromScratchWizard Component

### Goal

Create the wizard orchestrator that manages step state, form data collection, API integration, and navigation between steps.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/CreateFromScratchWizard.tsx` | Create | Wizard orchestrator with step management and API calls | ~300 |

### Pseudocode

#### `CreateFromScratchWizard.tsx`

```
CreateFromScratchWizard Component
├── State: 
│   ├── currentStep: 1 | 2 | 3
│   ├── formData: { identity, personality, capabilities }
│   ├── isLoading: boolean
│   └── error: string | null
├── Render:
│   ├── WizardProgress (step indicator)
│   ├── Conditional render based on currentStep
│   │   ├── Step 1: IdentityStep
│   │   ├── Step 2: PersonalityStep
│   │   └── Step 3: (Future - placeholder)
│   └── SuccessState (when agent created)
├── Handlers:
│   ├── handleNext() - Validate current step, move to next
│   ├── handlePrevious() - Move to previous step
│   ├── handleSubmit() - Collect all data, call API
│   └── handleSuccess() - Show success state
└── API Integration:
    └── POST /api/workforce/create
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-4.4 | Wizard collects data from all steps | Fill Steps 1-2, verify data collected in formData |
| AC-4.4 | Form submission calls API | Click "Create Agent", verify API POST called |
| AC-4.4 | Loading state shows during API call | Verify loading indicator during submission |
| AC-4.5 | Success state shows after creation | Verify SuccessState component renders after API success |

### User Flows

#### Flow B.1: Complete Wizard Flow

```
1. User on Step 1, fills Identity form
2. User clicks "Next"
3. Wizard validates Step 1, moves to Step 2
4. User fills Personality form
5. User clicks "Create Agent"
6. Wizard collects all data
7. Wizard calls POST /api/workforce/create
8. On success, shows SuccessState
```

---

## Part C: Create IdentityStep Component

### Goal

Create Step 1 form component that collects agent identity information: name, role, avatar, and description.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/wizard/IdentityStep.tsx` | Create | Step 1 form with name, role, avatar picker, description | ~100 |

### Pseudocode

#### `IdentityStep.tsx`

```
IdentityStep Component
├── Props: { data, onChange, onNext, onCancel }
├── State: Local form state
├── Render:
│   ├── Label: "Agent Name" (required)
│   ├── Input: name (min 2 chars)
│   ├── Label: "Role" (required)
│   ├── Input: role (min 2 chars)
│   ├── Label: "Avatar" (required)
│   ├── EmojiPicker: avatar selection
│   ├── Label: "Description" (optional)
│   ├── Textarea: description
│   └── Buttons: Cancel, Next (disabled until valid)
└── Validation:
    └── name.length >= 2 && role.length >= 2
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-4.2 | Name field validates (min 2 chars) | Enter 1 char, verify "Next" disabled |
| AC-4.2 | Role field validates (min 2 chars) | Enter 1 char, verify "Next" disabled |
| AC-4.2 | Avatar picker works | Select emoji, verify it's saved |
| AC-4.2 | Description is optional | Leave empty, verify form still valid |
| AC-4.2 | Form data passed to parent | Fill form, click Next, verify data in wizard state |

### User Flows

#### Flow C.1: Fill Identity Step

```
1. User sees IdentityStep form
2. User enters name: "Test Agent"
3. User enters role: "Test Role"
4. User selects avatar: 🧭
5. User enters description: "A test agent"
6. User clicks "Next"
7. Form validates, data passed to wizard
```

---

## Part D: Create PersonalityStep Component

### Goal

Create Step 2 form component that collects agent personality information: instructions (systemPrompt), model, objectives, guardrails, and manager toggle.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/wizard/PersonalityStep.tsx` | Create | Step 2 form with instructions, model, objectives, guardrails, manager toggle | ~200 |

### Pseudocode

#### `PersonalityStep.tsx`

```
PersonalityStep Component
├── Props: { data, onChange, onNext, onPrevious }
├── State: Local form state, collapsible sections
├── Render:
│   ├── Label: "Instructions" (required)
│   ├── Textarea: systemPrompt (min 10 chars)
│   ├── Label: "Model" (required)
│   ├── Select: model (default: "google/gemini-2.5-pro")
│   ├── Collapsible: "Objectives" (optional)
│   │   └── MultiInput: objectives array
│   ├── Collapsible: "Guardrails" (optional)
│   │   └── MultiInput: guardrails array
│   ├── Checkbox: "This agent is a manager"
│   │   └── Conditional: "Configure Sub-Agents" link (future)
│   └── Buttons: Previous, Next (disabled until valid)
└── Validation:
    └── systemPrompt.length >= 10
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-4.3 | Instructions field validates (min 10 chars) | Enter 9 chars, verify "Next" disabled |
| AC-4.3 | Model dropdown has default selection | Verify "Google Gemini 2.5 Pro" pre-selected |
| AC-4.3 | Objectives section is collapsible | Click to expand/collapse, verify works |
| AC-4.3 | Guardrails section is collapsible | Click to expand/collapse, verify works |
| AC-4.3 | Manager toggle shows link when enabled | Check toggle, verify "Configure Sub-Agents" link appears |
| AC-4.3 | Form data passed to parent | Fill form, click Next, verify data in wizard state |

### User Flows

#### Flow D.1: Fill Personality Step

```
1. User sees PersonalityStep form
2. User enters instructions: "You are a helpful assistant..."
3. User selects model: "Google Gemini 2.5 Pro"
4. User expands Objectives, adds objective
5. User expands Guardrails, adds guardrail
6. User enables manager toggle
7. User clicks "Next"
8. Form validates, data passed to wizard
```

---

## Part E: Create SuccessState Component

### Goal

Create success confirmation screen that shows after agent creation with agent preview and quick action buttons.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/wizard/SuccessState.tsx` | Create | Success screen with agent preview and quick actions | ~120 |

### Pseudocode

#### `SuccessState.tsx`

```
SuccessState Component
├── Props: { agent, onOpenAgent, onConfigureCapabilities, onStartChatting, onDone }
├── Render:
│   ├── Success icon and message
│   ├── Agent card preview
│   │   ├── Avatar, name, role
│   │   └── Status badge
│   ├── Quick actions:
│   │   ├── "Open Agent" button → Opens agent modal (Overview)
│   │   ├── "Configure Capabilities" button → Opens agent modal (Capabilities)
│   │   └── "Start Chatting" button → Opens agent modal (Chat)
│   └── "Done" button → Closes dialog, returns to dashboard
└── Handlers:
    └── Each button calls respective handler
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-4.5 | Success state shows agent preview | Verify agent card displays correctly |
| AC-4.5 | Quick action buttons work | Click each button, verify correct action |
| AC-4.5 | "Done" button closes dialog | Click Done, verify dialog closes |

### User Flows

#### Flow E.1: View Success State

```
1. Agent created successfully
2. SuccessState component renders
3. User sees agent preview card
4. User clicks "Open Agent"
5. Agent modal opens to Overview tab
```

---

## Part F: Integrate with WorkforceDashboard

### Goal

Wire up CreateAgentDialog to WorkforceDashboard, add state management, and ensure agent list refreshes after creation.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/WorkforceDashboard.tsx` | Modify | Add dialog state, wire up button, refresh agent list | ~40 |

### Pseudocode

#### `WorkforceDashboard.tsx` Updates

```
WorkforceDashboard Component Updates
├── Add state: const [createDialogOpen, setCreateDialogOpen] = useState(false)
├── Add handler: handleCreateAgent = () => setCreateDialogOpen(true)
├── Update "Hire new agent" button:
│   └── onClick={handleCreateAgent}
├── Add CreateAgentDialog component:
│   └── <CreateAgentDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
└── Add refresh logic:
    └── After agent creation, refresh agent list (re-fetch from API)
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-4.1 | "Hire new agent" button opens dialog | Click button, verify dialog opens |
| AC-4.6 | Agent appears in roster after creation | Create agent, verify it appears in Active Roster |
| AC-4.6 | Agent list refreshes after creation | Verify new agent appears without page refresh |

### User Flows

#### Flow F.1: Complete Create Flow from Dashboard

```
1. User on workforce dashboard
2. User clicks "Hire new agent"
3. Dialog opens
4. User completes Steps 1-2
5. User creates agent
6. Success state shows
7. User clicks "Done"
8. Dialog closes
9. Dashboard refreshes
10. New agent appears in Active Roster
```

---

## Out of Scope

- **Step 3 (Capabilities)** → Planned for Phase 5
- **Sub-agents selection** → Planned for Phase 5
- **Error handling UI** → Planned for Phase 5
- **Marketplace tab** → Future phase

---

## References

- **Product Spec:** `00-PRODUCT-SPEC.md` - UI requirements (PR-2.1, PR-2.2, PR-2.6)
- **Implementation Plan:** `00-IMPLEMENTATION-PLAN.md` - Phase 4 details
- **UXD Mockups:** `_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/create-custom/`
- **Frontend-Backend Mapping:** `_docs/UXD/Pages/workforce/2025-12-09-create-agent-flow/create-custom/Frontend-Backend-Mapping.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | AI Assistant |

---

**Last Updated:** December 9, 2025


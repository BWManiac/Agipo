# Workforce Page Improvements - File Impact Analysis

**Date:** December 8, 2025  
**Status:** Implementation Plan  
**Goal:** Complete file-by-file breakdown for create agent flow and workforce improvements

---

## Summary

| Category | Count | Lines (Est.) | Priority |
|----------|-------|--------------|----------|
| **New Files** | 17 | ~2,510 | - |
| **Modified Files** | 5 | ~200 | - |
| **Total Impact** | 22 | ~2,710 | - |

---

## 1. Files to Create

### 1.1 Frontend Components

#### Create Agent Dialog & Wizards

| File | Purpose | Lines | Dependencies | Priority |
|------|---------|-------|--------------|---------|
| `app/(pages)/workforce/components/CreateAgentDialog.tsx` | Main modal container with tabs | ~150 | Dialog, Tabs (shadcn/ui) | **High** |
| `app/(pages)/workforce/components/CreateFromScratchWizard.tsx` | 3-step wizard orchestrator | ~300 | useState, wizard steps | **High** |
| `app/(pages)/workforce/components/SubAgentsScreen.tsx` | Separate screen for sub-agents selection | ~150 | Agent list, multi-select | **Medium** |

#### Wizard Steps

| File | Purpose | Lines | Dependencies | Priority |
|------|---------|-------|--------------|---------|
| `app/(pages)/workforce/components/wizard/IdentityStep.tsx` | Step 1: Name, role, avatar, description | ~100 | Input, Textarea, EmojiPicker | **High** |
| `app/(pages)/workforce/components/wizard/PersonalityStep.tsx` | Step 2: Instructions, model, objectives, guardrails, manager toggle | ~200 | Textarea, Select, MultiInput, Checkbox | **High** |
| `app/(pages)/workforce/components/wizard/CapabilitiesStep.tsx` | Step 3: Tools search (LLM), tools, connections, workflows (optional) | ~250 | ToolsSearchInput, Tabs, reuse existing selectors | **High** |
| `app/(pages)/workforce/components/wizard/ToolsSearchInput.tsx` | LLM-powered tools search (design now, implement later) | ~150 | Input, Dropdown, API call | **Low** |
| `app/(pages)/workforce/components/wizard/SuccessState.tsx` | Success confirmation with quick actions | ~120 | Card, Button, Agent preview | **High** |
| `app/(pages)/workforce/components/wizard/WizardProgress.tsx` | 3-step indicator component | ~60 | Progress bar, step numbers | **Medium** |

#### Supporting Components

| File | Purpose | Lines | Dependencies | Priority |
|------|---------|-------|--------------|---------|
| `app/(pages)/workforce/components/marketplace/TemplateGrid.tsx` | Browse marketplace templates | ~150 | Card, Grid, filters | **Medium** |
| `app/(pages)/workforce/components/marketplace/TemplateCard.tsx` | Individual template card | ~100 | Card, Badge, Button | **Medium** |
| `app/(pages)/workforce/components/marketplace/TemplateCustomizationForm.tsx` | Customize template before hiring | ~120 | Form, Input, Textarea | **Medium** |

### 1.2 Data & Types

| File | Purpose | Lines | Dependencies | Priority |
|------|---------|-------|--------------|---------|
| `app/(pages)/workforce/data/mock-data.ts` | Mock data for wizard and templates | ~200 | Types from `@/_tables/types` | **Medium** |
| `app/(pages)/workforce/types/wizard.ts` | TypeScript types for wizard | ~80 | AgentConfig types | **Medium** |

### 1.3 API Routes

| File | Purpose | Lines | Dependencies | Priority |
|------|---------|-------|--------------|---------|
| `app/api/workforce/create/route.ts` | POST endpoint for creating agents (UUID generation, folder structure) | ~100 | agent-creator service, auth, crypto | **High** |
| `app/api/workforce/tools/search/route.ts` | POST endpoint for LLM-powered tools search (future) | ~100 | LLM service, tool registry | **Low** |
| `app/api/workforce/create/README.md` | API documentation | ~100 | - | **Medium** |
| `app/api/workforce/templates/route.ts` | GET endpoint for marketplace templates | ~50 | mock-data or database | **Low** |
| `app/api/workforce/templates/README.md` | API documentation | ~80 | - | **Low** |
| `app/api/workforce/[agentId]/status/route.ts` | PATCH endpoint for status updates | ~60 | agent-config service | **Medium** |
| `app/api/workforce/[agentId]/status/README.md` | API documentation | ~80 | - | **Low** |
| `app/api/workforce/[agentId]/route.ts` | DELETE method for agent deletion | ~80 | agent-creator service | **Low** |

### 1.4 Services

| File | Purpose | Lines | Dependencies | Priority |
|------|---------|-------|--------------|---------|
| `app/api/workforce/services/agent-creator.ts` | Agent file generation and management (UUID, folder-based) | ~300 | fs/promises, path, types, crypto | **High** |
| `app/api/workforce/services/agent-creator.README.md` | Service documentation | ~150 | - | **Medium** |

---

## 2. Files to Modify

### 2.1 Frontend Components

| File | Change | Lines Changed | Impact | Priority |
|------|--------|---------------|--------|----------|
| `app/(pages)/workforce/components/WorkforceDashboard.tsx` | Reorder sections (header after roster) | ~5 | Low - JSX reordering | **High** ✅ |
| `app/(pages)/workforce/components/WorkforceDashboard.tsx` | Add CreateAgentDialog state and integration | ~30 | Medium - State management | **High** |
| `app/(pages)/workforce/components/WorkforceDashboard.tsx` | Wire up "Hire new agent" button | ~5 | Low - onClick handler | **High** |

**Total Changes:** ~40 lines

### 2.2 Services

| File | Change | Lines Changed | Impact | Priority |
|------|--------|---------------|--------|----------|
| `app/api/workforce/services/agent-config.ts` | Update to read from folder structure (`{name-slug}-{uuid}/config.ts`) | ~60 | Medium - Path changes, folder scanning | **High** |
| `app/api/workforce/services/agent-config.ts` | Add `updateAgentStatus()` function | ~40 | Low - New function | **Medium** |
| `app/api/workforce/[agentId]/chat/services/memory.ts` | Update to use folder-based paths | ~20 | Low - Path changes | **High** |
| `_tables/types.ts` | Add `isManager` and `subAgentIds` fields | ~10 | Low - Type additions | **High** |
| `_tables/agents/index.ts` | Update to use folder-based imports (dynamic) | ~30 | Medium - Dynamic exports | **High** |

**Total Changes:** ~90 lines

### 2.3 Data Files

| File | Change | Lines Changed | Impact | Priority |
|------|--------|---------------|--------|----------|
| `_tables/agents/index.ts` | Auto-update exports on agent creation | ~20 | Medium - Dynamic export | **High** |

**Total Changes:** ~20 lines

---

## 3. Component Dependencies Map

### CreateAgentDialog
```
CreateAgentDialog
├─ Dialog (shadcn/ui)
├─ Tabs (shadcn/ui)
├─ CreateFromScratchWizard
│   ├─ WizardProgress
│   ├─ IdentityStep
│   ├─ PersonalityStep
│   ├─ CapabilitiesStep
│   │   ├─ ConnectionToolEditorPanel (reuse)
│   │   ├─ WorkflowEditorPanel (reuse)
│   │   └─ ToolEditor (reuse)
│   ├─ QuickPromptsStep
│   └─ ReviewStep
└─ HireFromMarketplaceWizard
    ├─ TemplateGrid
    │   └─ TemplateCard
    ├─ TemplateCustomizationForm
    └─ ReviewStep
```

### API Flow
```
POST /api/workforce/create
├─ auth() (Clerk)
├─ validateRequest() (Zod)
└─ agent-creator.ts
    ├─ generateAgentId()
    ├─ createAgentFile()
    ├─ updateAgentsIndex()
    └─ initializeAgentMemory()
```

---

## 4. Implementation Order

### Phase 1: Layout & Foundation ✅
- [x] Reorder WorkforceDashboard sections
- [x] Create mock-data.ts
- [ ] Add CreateAgentDialog state to WorkforceDashboard

### Phase 2: API Foundation
- [ ] Create `agent-creator.ts` service
- [ ] Create `POST /api/workforce/create` route
- [ ] Test file generation

### Phase 3: Basic Create Flow
- [ ] CreateAgentDialog component
- [ ] CreateFromScratchWizard (skeleton)
- [ ] IdentityStep
- [ ] PersonalityStep
- [ ] ReviewStep
- [ ] Wire up to API

### Phase 4: Complete Create Flow
- [ ] CapabilitiesStep (reuse existing selectors)
- [ ] QuickPromptsStep
- [ ] Error handling
- [ ] Loading states
- [ ] Success feedback

### Phase 5: Marketplace Flow
- [ ] HireFromMarketplaceWizard
- [ ] TemplateGrid
- [ ] TemplateCard
- [ ] TemplateCustomizationForm
- [ ] Connection configuration

### Phase 6: Additional Features
- [ ] Status management API
- [ ] Delete agent API
- [ ] Templates API
- [ ] Enhanced metrics

---

## 5. Reusable Components

### Existing Components to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| `ConnectionToolEditorPanel` | `app/(pages)/workforce/components/ConnectionToolEditorPanel.tsx` | Capabilities step - connection tools |
| `WorkflowEditorPanel` | `app/(pages)/workforce/components/WorkflowEditorPanel.tsx` | Capabilities step - workflows |
| `ToolEditor` | `app/(pages)/workforce/components/ToolEditor.tsx` | Capabilities step - custom tools |
| `AgentModal` | `app/(pages)/workforce/components/agent-modal/` | Reference for capability selection patterns |

### New Shared Components Needed

| Component | Purpose | Priority |
|-----------|---------|----------|
| `EmojiPicker` | Avatar selection | Medium |
| `MultiInput` | Objectives, guardrails, quick prompts arrays | Medium |
| `WizardProgress` | Step indicator | Medium |

---

## 6. API Service Details

### agent-creator.ts Functions

```typescript
// Core functions
export async function createAgentFile(
  agentId: string,
  config: Partial<AgentConfig>
): Promise<void>

export async function updateAgentsIndex(
  agentId: string,
  filename: string
): Promise<void>

export async function initializeAgentMemory(
  agentId: string
): Promise<void>

export async function deleteAgent(
  agentId: string
): Promise<void>

// Helper functions
export function generateAgentId(name: string): string

export function generateAgentFileContent(
  agentId: string,
  config: Partial<AgentConfig>
): string

export function toCamelCase(str: string): string
```

### API Route Handlers

```typescript
// POST /api/workforce/create
export async function POST(request: NextRequest)

// GET /api/workforce/templates
export async function GET(request: NextRequest)

// PATCH /api/workforce/[agentId]/status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> }
)

// DELETE /api/workforce/[agentId]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> }
)
```

---

## 7. Testing Requirements

### Unit Tests
- [ ] `generateAgentId()` - ID generation logic
- [ ] `generateAgentFileContent()` - File content formatting
- [ ] `createAgentFile()` - File creation
- [ ] `updateAgentsIndex()` - Index update logic

### Integration Tests
- [ ] `POST /api/workforce/create` - Complete flow
- [ ] File system operations
- [ ] Memory database initialization
- [ ] Error handling

### E2E Tests
- [ ] Create custom agent flow
- [ ] Hire from marketplace flow
- [ ] Agent appears in roster
- [ ] Agent modal opens with new agent

---

## 8. File Size Estimates

### Large Files (>200 lines)
- `CreateFromScratchWizard.tsx` (~300 lines)
- `agent-creator.ts` (~250 lines)
- `CapabilitiesStep.tsx` (~200 lines)
- `HireFromMarketplaceWizard.tsx` (~200 lines)
- `mock-data.ts` (~200 lines)

### Medium Files (100-200 lines)
- `CreateAgentDialog.tsx` (~150 lines)
- `PersonalityStep.tsx` (~150 lines)
- `TemplateGrid.tsx` (~150 lines)
- `agent-creator.README.md` (~150 lines)
- `ReviewStep.tsx` (~120 lines)
- `TemplateCustomizationForm.tsx` (~120 lines)
- `IdentityStep.tsx` (~100 lines)
- `TemplateCard.tsx` (~100 lines)

### Small Files (<100 lines)
- All other components and documentation

---

## 9. Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| File generation errors | Validate before write, try-catch, rollback |
| Agent ID conflicts | Use timestamp-based IDs, check existence |
| Index update failures | Atomic operations, verify exports |
| Large component complexity | Break into smaller sub-components |
| API route complexity | Extract logic to services |

---

## 10. Next Steps

1. ✅ **Complete:** Layout reorganization
2. ✅ **Complete:** Mock data structure
3. **Next:** Create agent-creator service
4. **Next:** Create POST /api/workforce/create route
5. **Next:** Build CreateAgentDialog component
6. **Next:** Implement wizard steps incrementally

---

**Total Estimated Implementation Time:** 22-30 hours  
**Priority Order:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6


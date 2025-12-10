# Workforce Page Improvements - Impact Analysis

**Date:** December 8, 2025  
**Status:** Planning → Implementation  
**Goal:** Reorganize workforce page layout and add create agent flow

---

## 1. Layout Change: Move Header Below Active Roster

### Current Structure
```
1. Header Section (Manage your AI workforce + metrics)
2. Active Roster Section
3. Attention Needed Section
```

### New Structure
```
1. Active Roster Section
2. Header Section (Manage your AI workforce + metrics) ← MOVED
3. Attention Needed Section
```

### Impact Analysis

**Visual Impact:**
- ✅ **Positive:** Users see agents immediately (primary content first)
- ✅ **Positive:** Header becomes a summary/context section after viewing roster
- ⚠️ **Consideration:** Header might feel less prominent, but metrics are still visible

**Code Impact:**
- **File:** `app/(pages)/workforce/components/WorkforceDashboard.tsx`
- **Change:** Reorder JSX sections (lines 48-85 moved after lines 87-155)
- **Complexity:** Low - Simple reordering, no logic changes
- **Breaking Changes:** None

**User Experience Impact:**
- ✅ **Better:** Content-first approach - agents are the primary focus
- ✅ **Better:** Metrics provide context after viewing agents
- ✅ **Better:** "Hire new agent" button still accessible, now after viewing current agents

---

## 2. Mock Data Structure

### Current Mock Data Sources

1. **Agent Registry:** `_tables/agents/index.ts` - Real agent configs (⚠️ Legacy agents to be deleted)
2. **Agent Modal Mocks:** `app/(pages)/workforce/components/agent-modal/data/mocks.ts`
3. **Marketplace Mocks:** `app/(pages)/marketplace/data/mock-data.ts`

### Legacy Agents Cleanup

**Decision:** Delete all existing hardcoded agents immediately
- Remove: `mira-patel.ts`, `alex-kim.ts`, `elena-park.ts`, `noah-reyes.ts`
- Remove: `engineering/`, `marketing/`, `pm/` folders
- **Preserve:** Functionality - agent modal (Chat + Capabilities tabs) must still work with newly created agents

**New Structure:**
- Agents stored in folders: `_tables/agents/{name-slug}-{uuid}/`
- Config file: `{folder}/config.ts`
- Memory DB: `{folder}/memory.db` (auto-created)
- Agent ID: UUID v4 format (auto-generated)

### Proposed Mock Data for Create Agent Flow

**File:** `app/(pages)/workforce/data/mock-data.ts` (NEW)

```typescript
// Mock data for create agent wizard
export interface CreateAgentWizardData {
  // Step 1: Identity
  identity: {
    name: string;
    role: string;
    avatar: string;
    description: string;
  };
  
  // Step 2: Personality
  personality: {
    systemPrompt: string; // Labeled as "Instructions" in UI
    model: string;
    objectives: string[];
    guardrails: string[];
    isManager?: boolean;
    subAgentIds?: string[];
  };
  
  // Step 3: Capabilities (Optional)
  capabilities: {
    customToolIds: string[];
    connectionToolBindings: ConnectionToolBinding[];
    workflowBindings: WorkflowBinding[];
    // Tools search with LLM auto-suggest (design now, implement later)
  };
}

// Mock templates for "Hire from Marketplace"
export const marketplaceAgentTemplates = [
  {
    id: "template-pm",
    name: "Product Manager",
    role: "Product Manager",
    avatar: "🧭",
    description: "Synthesizes feedback, prioritizes roadmap items...",
    systemPrompt: "You are a Product Manager...",
    model: "google/gemini-2.5-pro",
    defaultObjectives: ["Accelerate PLG roadmap"],
    defaultGuardrails: ["Escalate spend > $10k"],
    requiredConnections: [], // Optional
    defaultCapabilities: ["Roadmap synthesis", "Launch comms"],
  },
  // ... more templates
];

// Mock metrics for dashboard
export interface WorkforceMetrics {
  agentsHired: {
    value: number;
    trend?: string; // "+1 recommendation"
  };
  tasksCompleted: {
    value: number;
    pending: number;
    trend?: string; // "+12% vs last week"
  };
  alerts: {
    value: number;
    requiringApproval: number;
    severity?: "low" | "medium" | "high";
  };
  activeConversations?: {
    value: number;
    agentsEngaged: number;
  };
}
```

---

## 3. Create Agent Flow Design

### Flow Architecture

```
Entry Point: "Hire new agent" button
    ↓
CreateAgentDialog (Modal)
    ↓
    ├─ Tab 1: Create Custom Agent (MVP)
    │   └─ CreateFromScratchWizard
    │       ├─ Step 1: Identity
    │       │   - Name, role, avatar, description
    │       ├─ Step 2: Personality
    │       │   - Instructions (systemPrompt), model
    │       │   - Optional: objectives, guardrails
    │       │   - Optional: Manager toggle → Opens Sub-Agents screen
    │       ├─ Step 3: Capabilities (Optional)
    │       │   - Tools search with LLM auto-suggest (design now, implement later)
    │       │   - Custom tools, connection tools, workflows
    │       │   - Can skip this step
    │       └─ Success State
    │           - Agent created confirmation
    │           - Quick actions (Open Agent, Configure Capabilities, Start Chatting)
    │
    └─ Tab 2: Hire from Marketplace (Future)
        └─ (Deferred for MVP)
```

**Note:** Sub-agents selector opens as separate screen (not modal) to avoid modal nesting.

### Component Hierarchy

```
CreateAgentDialog (Modal)
├─ Tabs (Create Custom | Hire from Marketplace)
│
├─ CreateFromScratchWizard
│   ├─ WizardProgress (3-step indicator)
│   ├─ IdentityStep
│   │   - Name, role, avatar, description inputs
│   ├─ PersonalityStep
│   │   - Instructions textarea, model dropdown
│   │   - Objectives, guardrails (optional)
│   │   - Manager toggle → Opens SubAgentsScreen
│   ├─ CapabilitiesStep (Optional)
│   │   ├─ ToolsSearchInput (LLM-powered, design now, implement later)
│   │   ├─ CustomToolSelector (reuse from agent modal)
│   │   ├─ ConnectionToolSelector (reuse from agent modal)
│   │   ├─ WorkflowSelector (reuse from agent modal)
│   │   └─ Skip button
│   └─ SuccessState
│       - Confirmation message
│       - Agent card preview
│       - Quick action buttons
│
└─ SubAgentsScreen (Separate screen, not modal)
    ├─ Agent list (user's available agents)
    ├─ Multi-select checkboxes
    └─ Save button
```

---

## 4. API Design

### New API Routes

#### `POST /api/workforce/create`

**Purpose:** Create a new agent from scratch or marketplace template

**Request Body:**
```typescript
{
  // Identity
  name: string;
  role: string;
  avatar: string;
  description: string;
  
  // Personality
  systemPrompt: string;
  model: string; // default: "google/gemini-2.5-pro"
  objectives: string[];
  guardrails: string[];
  
  // Capabilities (optional)
  toolIds?: string[];
  connectionToolBindings?: ConnectionToolBinding[];
  workflowBindings?: WorkflowBinding[];
  
  // Manager & Sub-Agents (optional)
  isManager?: boolean;
  subAgentIds?: string[];
  
  // Optional
  quickPrompts?: string[];
  
  // Metadata
  source?: "custom" | "marketplace";
  templateId?: string; // if from marketplace
}
```

**Response:**
```typescript
{
  success: boolean;
  agentId: string;
  agent: AgentConfig;
}
```

**Implementation:**
- **Service:** `app/api/workforce/services/agent-creator.ts` (NEW)
- **Route:** `app/api/workforce/create/route.ts` (NEW)
- **Agent ID:** UUID v4 format (auto-generated via `crypto.randomUUID()`)
- **Folder Structure:** Creates `_tables/agents/{name-slug}-{uuid}/` folder
- **File Generation:** Creates `{folder}/config.ts` with agent configuration
- **Index Update:** Updates `_tables/agents/index.ts` to export new agent
- **Memory Init:** Memory database auto-created in `{folder}/memory.db` on first use

#### `POST /api/workforce/tools/search` (Future)

**Purpose:** LLM-powered tool search based on plain English description

**Request Body:**
```typescript
{
  description: string; // Plain English description of desired capabilities
}
```

**Response:**
```typescript
{
  suggestions: Array<{
    toolId: string;
    name: string;
    description: string;
    matchScore: number;
  }>;
}
```

**Implementation:**
- **Route:** `app/api/workforce/tools/search/route.ts` (NEW - Future)
- **Status:** Design now, implement later
- **Use Case:** Used in Step 3 (Capabilities) of create agent flow

#### `GET /api/workforce/templates`

**Purpose:** Get marketplace agent templates

**Response:**
```typescript
{
  templates: MarketplaceAgentTemplate[];
}
```

**Implementation:**
- **Route:** `app/api/workforce/templates/route.ts` (NEW)
- **Data Source:** Could be from `_tables/agents/templates/` or hardcoded

#### `PATCH /api/workforce/[agentId]/status`

**Purpose:** Update agent status (active/paused/attention)

**Request Body:**
```typescript
{
  status: "active" | "paused" | "attention";
}
```

**Implementation:**
- **Route:** `app/api/workforce/[agentId]/status/route.ts` (NEW)
- **Service:** Extends `agent-config.ts` with `updateAgentStatus()`

#### `DELETE /api/workforce/[agentId]`

**Purpose:** Delete an agent

**Implementation:**
- **Route:** `app/api/workforce/[agentId]/route.ts` (NEW - DELETE method)
- **Service:** `deleteAgent()` in `agent-creator.ts`
- **Cleanup:** Removes agent file, memory database, updates index

---

## 5. File Impact Analysis

### Files to Create

| File | Purpose | Lines (Est.) | Priority |
|------|---------|--------------|----------|
| `app/(pages)/workforce/components/CreateAgentDialog.tsx` | Main modal for create/hire flow | ~150 | High |
| `app/(pages)/workforce/components/CreateFromScratchWizard.tsx` | 3-step wizard for custom agents | ~300 | High |
| `app/(pages)/workforce/components/wizard/IdentityStep.tsx` | Step 1: Name, role, avatar, description | ~100 | High |
| `app/(pages)/workforce/components/wizard/PersonalityStep.tsx` | Step 2: Instructions, model, objectives, guardrails, manager toggle | ~200 | High |
| `app/(pages)/workforce/components/wizard/CapabilitiesStep.tsx` | Step 3: Tools search (LLM), tools, connections, workflows (optional) | ~250 | High |
| `app/(pages)/workforce/components/wizard/SuccessState.tsx` | Success confirmation with quick actions | ~120 | High |
| `app/(pages)/workforce/components/SubAgentsScreen.tsx` | Separate screen for sub-agents selection | ~150 | Medium |
| `app/(pages)/workforce/components/wizard/ToolsSearchInput.tsx` | LLM-powered tools search (design now, implement later) | ~150 | Low |
| `app/(pages)/workforce/data/mock-data.ts` | Mock data for wizard and templates | ~200 | Medium |
| `app/api/workforce/create/route.ts` | API route for creating agents (UUID generation, folder structure) | ~100 | High |
| `app/api/workforce/create/README.md` | API documentation | ~100 | Medium |
| `app/api/workforce/services/agent-creator.ts` | Service for agent file generation (UUID, folder-based) | ~300 | High |
| `app/api/workforce/services/agent-creator.README.md` | Service documentation | ~150 | Medium |
| `app/api/workforce/tools/search/route.ts` | LLM-powered tools search API (future) | ~100 | Low |
| `app/api/workforce/templates/route.ts` | API route for marketplace templates | ~50 | Low |
| `app/api/workforce/[agentId]/status/route.ts` | API route for status updates | ~60 | Medium |
| `app/api/workforce/[agentId]/route.ts` | DELETE method for agent deletion | ~80 | Low |

**Total New Files:** 17  
**Total Estimated Lines:** ~2,510

### Files to Modify

| File | Change | Impact | Priority |
|------|--------|--------|----------|
| `app/(pages)/workforce/components/WorkforceDashboard.tsx` | Reorder sections (header after roster) | Low - JSX reordering | High |
| `app/(pages)/workforce/components/WorkforceDashboard.tsx` | Add CreateAgentDialog integration | Medium - State management | High |
| `app/(pages)/workforce/components/WorkforceDashboard.tsx` | Wire up "Hire new agent" button | Low - onClick handler | High |
| `app/api/workforce/services/agent-config.ts` | Update to read from folder structure (`{name-slug}-{uuid}/config.ts`) | Medium - Path changes | High |
| `app/api/workforce/services/agent-config.ts` | Add `updateAgentStatus()` function | Low - New function | Medium |
| `app/api/workforce/[agentId]/chat/services/memory.ts` | Update to use folder-based paths | Low - Path changes | High |
| `_tables/agents/index.ts` | Auto-update on agent creation (folder-based imports) | Medium - Dynamic export | High |
| `_tables/types.ts` | Add `isManager` and `subAgentIds` fields | Low - Type additions | High |

**Total Modified Files:** 2  
**Estimated Changes:** ~100 lines

### Dependencies

**Reuse Existing Components:**
- `ConnectionToolEditorPanel` - For connection tool selection
- `WorkflowEditorPanel` - For workflow selection  
- `ToolEditor` - For custom tool selection
- Agent modal capability selectors

**New Dependencies:**
- `crypto.randomUUID()` - For UUID v4 generation (Node.js built-in)
- LLM service (future) - For tools search API

**Storage Changes:**
- Agent files: `_tables/agents/{name-slug}-{uuid}/config.ts` (folder-based)
- Memory DB: `_tables/agents/{name-slug}-{uuid}/memory.db` (co-located)
- Legacy agents: Delete immediately (mira-patel.ts, alex-kim.ts, etc.)

---

## 6. Implementation Phases

### Phase 1: Layout Reorganization (Immediate)
- ✅ Reorder sections in WorkforceDashboard
- ✅ Test visual layout
- **Time:** 15 minutes

### Phase 2: Create Agent API (Week 1)
- ✅ Create `agent-creator.ts` service
- ✅ Create `POST /api/workforce/create` route
- ✅ Test file generation
- **Time:** 4-6 hours

### Phase 3: Create Agent UI - Basic (Week 1)
- ✅ CreateAgentDialog component
- ✅ CreateFromScratchWizard (Identity + Personality steps)
- ✅ Manager toggle and SubAgentsScreen
- ✅ Success state
- ✅ Wire up to API
- **Time:** 6-8 hours

### Phase 4: Create Agent UI - Complete (Week 2)
- ✅ Capabilities step (optional, with tools search UI - design now, implement later)
- ✅ Tools search input component (UI only, LLM search deferred)
- ✅ Error handling and validation
- ✅ Legacy agents cleanup
- **Time:** 8-10 hours

### Phase 5: Additional Features (Week 2-3)
- ✅ Status management API
- ✅ Delete agent API
- ✅ Templates API
- ✅ Enhanced metrics
- **Time:** 4-6 hours

**Total Estimated Time:** 22-30 hours

---

## 7. Testing Strategy

### Unit Tests
- Agent file generation logic
- Agent ID generation
- File content formatting
- Index update logic

### Integration Tests
- Create agent API endpoint
- File system operations
- Memory database initialization

### E2E Tests
- Complete create agent flow
- Hire from marketplace flow
- Agent appears in roster after creation
- Agent modal opens with new agent

---

## 8. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| File generation errors | High | Validate before write, rollback on failure |
| Agent ID conflicts | Medium | Use UUID or timestamp-based IDs |
| Index update failures | Medium | Atomic operations, verify exports |
| Memory DB initialization fails | Low | Graceful degradation, retry logic |
| Large wizard form complexity | Medium | Break into steps, validate incrementally |

---

## 9. Success Criteria

- ✅ Users can create custom agents from scratch
- ✅ Users can hire agents from marketplace templates
- ✅ New agents appear in roster immediately
- ✅ Agent files are properly generated and exported
- ✅ Memory databases are initialized
- ✅ Layout reorganization improves UX
- ✅ All existing functionality remains intact

---

**Next Steps:**
1. Implement layout reorganization (Phase 1)
2. Create mock data structure
3. Implement create agent API (Phase 2)
4. Build create agent UI (Phase 3)


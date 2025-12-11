# Task: Natural Language Workflow Creation

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/01-creation-paths/01-Natural-Language-Workflow-Creation.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Validation

### Approach Validation

**✅ Technical Approach:**
- Mastra workflow definition format (`createWorkflow()`, `createStep()`) established
- LLM structured output proven viable with Vercel AI SDK and Anthropic models
- Existing step-generator transpilation infrastructure ready for integration

**✅ Architecture Decisions:**
- JSON Schema validation pattern exists in workflow system
- Zustand slice pattern established for editor state management
- API endpoint structure follows existing patterns in `/api/workflows/`

**✅ Integration Points:**
- Composio tool discovery API (`getComposioClient().tools.list()`) available
- Workflow editor canvas state management ready for generated workflows
- Records system provides table schemas for data step inference

### Current State Analysis

**Existing Infrastructure:**
- Workflow JSON schema defined in `app/api/workflows/types/workflow.ts`
- Step generator transpiles workflow.json to executable TypeScript
- Editor components handle manual workflow creation and modification
- Canvas layout and positioning logic available in editor

**Missing Components:**
- No AI-powered generation layer exists
- No natural language input interface in editor
- No structured output generation from LLM descriptions
- No conversational refinement capabilities

### Deterministic Decisions

**LLM Integration:**
- Use Anthropic Claude 3.5 Sonnet via Vercel AI SDK
- Structured output with Zod schema validation
- Temperature 0.7 for creativity with structure

**Storage:**
- Generation state: Zustand slice (session-scoped)
- Generated workflows: Standard workflow persistence
- Conversation history: In-memory during session

**UI Architecture:**
- Conversational refinement as chat sidebar in editor
- Progress states for generation phases
- Integration with existing canvas and toolbar

---

## Overview

### Goal

Implement a natural language interface that transforms user descriptions into complete, executable workflow definitions. Users describe their automation goal in plain English, and the system generates a workflow.json with nodes, bindings, schemas, and control flow—ready to transpile and execute.

### Relevant Research

The workflow system uses Mastra's `createWorkflow()` and `createStep()` primitives. Workflows are defined in `workflow.json` and transpiled to `workflow.ts` via `step-generator.ts`. The existing editor handles manual node creation and configuration. This feature adds an AI-powered generation layer that outputs the same workflow.json format.

Key patterns to leverage:
- Workflow JSON schema in `app/api/workflows/types/workflow.ts`
- Transpilation logic in `app/api/workflows/services/step-generator.ts`
- Composio tool discovery via `getComposioClient().tools.list()`
- Editor state management for canvas updates

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/types/generation.ts` | Create | Types for generation request/response | A |
| `app/api/workflows/types/workflow.ts` | Modify | Add generation metadata fields | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/generate/route.ts` | Create | Endpoint for workflow generation | A |
| `app/api/workflows/generate/refine/route.ts` | Create | Endpoint for conversational refinement | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/workflow-generator.ts` | Create | Core generation logic | A |
| `app/api/workflows/services/schema-inference.ts` | Create | Schema generation from descriptions | A |
| `app/api/workflows/services/layout-calculator.ts` | Create | Auto-layout for generated nodes | A |
| `app/api/workflows/services/generation-prompts.ts` | Create | LLM prompts for generation | A |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/store/slices/generation-slice.ts` | Create | Generation state management | B |
| `app/(pages)/workflows/editor/store/index.ts` | Modify | Integrate generation slice | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/GenerationInput.tsx` | Create | Natural language input UI | B |
| `app/(pages)/workflows/editor/components/GenerationProgress.tsx` | Create | Generation progress indicator | B |
| `app/(pages)/workflows/editor/components/RefinementChat.tsx` | Create | Conversational refinement UI | B |

---

## Part A: Backend Generation System

### Goal

Build the API and services that transform natural language into workflow.json structures using LLM with structured output.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/types/generation.ts` | Create | Generation types | ~80 |
| `app/api/workflows/generate/route.ts` | Create | Generation endpoint | ~120 |
| `app/api/workflows/generate/refine/route.ts` | Create | Refinement endpoint | ~100 |
| `app/api/workflows/services/workflow-generator.ts` | Create | Core generation | ~300 |
| `app/api/workflows/services/schema-inference.ts` | Create | Schema inference | ~150 |
| `app/api/workflows/services/layout-calculator.ts` | Create | Node positioning | ~100 |
| `app/api/workflows/services/generation-prompts.ts` | Create | LLM prompts | ~200 |

### Pseudocode

#### `app/api/workflows/types/generation.ts`

```typescript
interface GenerationRequest {
  description: string;
  workflowId?: string;           // If extending existing
  selectedNodeId?: string;       // If extending from specific node
  conversationHistory?: Message[];
  userContext: {
    connectedIntegrations: string[];
    availableTables: string[];
  };
}

interface GenerationResponse {
  workflow: WorkflowDefinition;
  explanation: string;
  suggestedName: string;
  warnings?: string[];
}

interface RefinementRequest {
  workflowId: string;
  instruction: string;
  conversationHistory: Message[];
  currentWorkflow: WorkflowDefinition;
}
```

#### `app/api/workflows/services/workflow-generator.ts`

```
generateWorkflow(request: GenerationRequest): Promise<GenerationResponse>
├── Build context
│   ├── Fetch available Composio tools for user
│   ├── Fetch user's tables from Records
│   └── Build tool vocabulary (name, description, schema for each)
├── Construct LLM prompt
│   ├── System: workflow generation instructions, output schema
│   ├── Context: available tools, tables, conversation history
│   └── User: natural language description
├── Call LLM with structured output
│   ├── Model: claude-3-5-sonnet (or configurable)
│   ├── Output schema: GeneratedWorkflow
│   └── Temperature: 0.7 for creativity
├── Post-process response
│   ├── Validate schema compatibility between nodes
│   ├── Calculate node positions for layout
│   ├── Generate bindings from step dependencies
│   └── Add required connections metadata
├── Validate generated workflow
│   ├── Check all referenced tools exist
│   ├── Verify schema types are valid
│   └── Ensure control flow is complete
└── Return GenerationResponse with workflow and explanation
```

#### `app/api/workflows/services/schema-inference.ts`

```
inferSchema(stepDescription: string, context: StepContext): JSONSchema
├── Analyze step type (browser, LLM, data, custom)
├── For browser steps
│   ├── Extract: { content: string, title?: string, ...extracted fields }
│   ├── Navigate: {} (no output needed)
│   └── Fill: { success: boolean }
├── For LLM steps
│   ├── Parse expected output from description
│   ├── Generate schema with required/optional fields
│   └── Add type hints from context
├── For data steps
│   ├── Match against existing table schemas
│   └── Infer from field names in description
└── Return validated JSONSchema
```

#### `app/api/workflows/services/layout-calculator.ts`

```
calculateLayout(steps: Step[], controlFlow: ControlFlow): NodePosition[]
├── Build dependency graph from bindings
├── Topological sort for order
├── For sequential flow
│   └── Stack vertically with consistent spacing
├── For parallel branches
│   └── Spread horizontally at same Y level
├── For conditionals
│   ├── Branch point centered
│   ├── True/false paths offset horizontally
│   └── Merge point below both branches
└── Return positions { nodeId, x, y } for each step
```

#### `app/api/workflows/generate/route.ts`

```
POST /api/workflows/generate
├── Validate request body (GenerationRequest)
├── Authenticate user, get userId
├── Fetch user's connected integrations
├── Fetch user's available tables
├── Call workflowGenerator.generateWorkflow()
├── If successful
│   ├── Optionally save as draft workflow
│   └── Return GenerationResponse
└── If failed
    ├── Parse error type (ambiguous, missing tools, etc.)
    └── Return helpful error with suggestions
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Simple workflow generates successfully | Describe "send email when file uploaded", verify 2 nodes created |
| AC-A.2 | Generated schemas are valid JSON Schema | Run schema validator on all generated step schemas |
| AC-A.3 | Generated workflow transpiles | Pass generated workflow.json to step-generator, verify valid .ts output |
| AC-A.4 | Tool availability respected | Request unavailable tool, verify graceful error |
| AC-A.5 | Node positions don't overlap | Generate 5+ node workflow, verify no position collisions |
| AC-A.6 | Refinement updates workflow | Send refinement instruction, verify workflow modified correctly |

---

## Part B: Frontend Generation UI

### Goal

Create the user interface for natural language input, generation progress, and conversational refinement integrated into the workflow editor.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/store/slices/generation-slice.ts` | Create | Generation state | ~100 |
| `app/(pages)/workflows/editor/components/GenerationInput.tsx` | Create | Input component | ~150 |
| `app/(pages)/workflows/editor/components/GenerationProgress.tsx` | Create | Progress UI | ~80 |
| `app/(pages)/workflows/editor/components/RefinementChat.tsx` | Create | Chat interface | ~200 |

### Pseudocode

#### `app/(pages)/workflows/editor/store/slices/generation-slice.ts`

```typescript
interface GenerationState {
  isGenerating: boolean;
  generationStage: 'idle' | 'understanding' | 'decomposing' | 'generating' | 'complete';
  conversationHistory: Message[];
  lastError: string | null;
}

actions:
  startGeneration(description: string)
  ├── Set isGenerating: true
  ├── Clear lastError
  └── Initialize conversation with user message

  updateStage(stage: GenerationStage)
  └── Set generationStage

  generationComplete(workflow: WorkflowDefinition)
  ├── Set isGenerating: false
  ├── Set stage: 'complete'
  ├── Update workflow store with generated workflow
  └── Add assistant message to conversation

  generationFailed(error: string)
  ├── Set isGenerating: false
  ├── Set lastError
  └── Add error to conversation

  sendRefinement(instruction: string)
  ├── Add user message to conversation
  ├── Set isGenerating: true
  └── Trigger refinement API call
```

#### `app/(pages)/workflows/editor/components/GenerationInput.tsx`

```
GenerationInput()
├── If workflow is empty
│   ├── Show prominent input area
│   │   ├── Textarea with placeholder "Describe your workflow..."
│   │   ├── Example prompts as clickable chips
│   │   └── Submit button
│   └── Show template quick-start links
├── If workflow has nodes
│   ├── Show compact input at bottom/side
│   └── Label: "Describe changes or additions..."
├── On submit
│   ├── Call generation action with description
│   └── Show progress component
└── Handle keyboard shortcuts (Cmd+Enter to submit)
```

#### `app/(pages)/workflows/editor/components/GenerationProgress.tsx`

```
GenerationProgress({ stage, onCancel })
├── Render stage indicator
│   ├── Understanding → "Analyzing your description..."
│   ├── Decomposing → "Breaking into steps..."
│   ├── Generating → "Building workflow..."
│   └── Complete → (hide, show workflow)
├── Animated progress bar or spinner
├── Cancel button
└── Stage-specific hints/tips
```

#### `app/(pages)/workflows/editor/components/RefinementChat.tsx`

```
RefinementChat()
├── Show conversation history
│   ├── User messages (descriptions, refinements)
│   ├── Assistant messages (explanations, confirmations)
│   └── Workflow change summaries
├── Input area for refinements
│   ├── Textarea
│   ├── Send button
│   └── Suggestions based on current workflow
├── Quick actions
│   ├── "Add error handling"
│   ├── "Add logging"
│   └── "Optimize for speed"
└── Context panel showing what AI can see
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Empty state shows generation input | Open new workflow, verify input UI visible |
| AC-B.2 | Progress stages display correctly | Generate workflow, verify all stages shown |
| AC-B.3 | Generated workflow appears on canvas | Complete generation, verify nodes rendered |
| AC-B.4 | Refinement chat maintains context | Send 3 refinements, verify conversation history |
| AC-B.5 | Cancel stops generation | Start generation, cancel, verify state reset |
| AC-B.6 | Error states display helpfully | Trigger error, verify message and recovery options |

---

## User Flows

### Flow 1: First-Time Generation

```
1. User opens /workflows/new
2. GenerationInput shows prominent input with examples
3. User types description, presses Cmd+Enter
4. GenerationProgress shows stages
5. API calls POST /api/workflows/generate
6. workflowGenerator builds context, calls LLM
7. LLM returns structured workflow
8. layoutCalculator positions nodes
9. Response sent to frontend
10. Editor store updates with generated workflow
11. Canvas renders nodes with connections
12. RefinementChat appears for follow-up
```

### Flow 2: Refinement

```
1. User has generated workflow on canvas
2. User types in RefinementChat: "Add validation before the API call"
3. Frontend calls POST /api/workflows/generate/refine
4. API receives current workflow + instruction + history
5. LLM determines where to insert validation
6. Returns modified workflow with changes highlighted
7. Editor updates canvas, highlights new/changed nodes
8. Conversation updated with AI explanation
```

---

## Out of Scope

- Streaming generation progress (batch response for MVP)
- Multi-model selection (single model for MVP)
- Workflow templates library (separate feature)
- Voice input
- Real-time collaboration on generation

---

## Open Questions

- [ ] Should generation create a draft workflow or just preview?
- [ ] How long should conversation history be retained?
- [ ] Should we show confidence scores for generated schemas?
- [ ] How do we handle very long descriptions (>1000 words)?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |

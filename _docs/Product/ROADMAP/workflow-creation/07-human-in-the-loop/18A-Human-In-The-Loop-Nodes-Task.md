# Task: Human-in-the-Loop Nodes

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/07-human-in-the-loop/18-Human-In-The-Loop-Nodes.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Validation

### Approach Validation

**✅ Technical Approach:**
- Mastra workflow engine provides built-in suspend/resume primitives
- Node-based workflow editor can model suspension points visually
- Database persistence supports workflow state during suspension

**✅ Architecture Decisions:**
- Human-in-the-loop as first-class workflow primitives
- Context-aware suspension with relevant data presentation
- Flexible approval/rejection/modification flow

**✅ Integration Points:**
- Mastra suspend() and resume() methods ready for integration
- Workflow transpiler can generate suspension schemas
- Notification system can alert humans to pending decisions

### Current State Analysis

**Existing Infrastructure:**
- Mastra workflow engine with suspension support
- Workflow editor with node creation and configuration
- User management and notification systems

**Missing Components:**
- No suspension node types in workflow editor
- No human approval interface or queue
- No suspension schema generation in transpiler

### Deterministic Decisions

**Suspension Types:**
- Approval gates: Simple approve/reject decisions
- Data review: Present data for human validation/modification
- Choice points: Multiple path selection by human

**Storage:**
- Suspended workflows: Mastra persistence with metadata
- Pending tasks: Queue table with user assignments
- Decision history: Audit trail of human interventions

**User Experience:**
- Dedicated approval queue interface
- Context-rich presentation of suspension data
- Mobile-responsive for on-the-go approvals

---

## Overview

### Goal

Implement suspension node types for the workflow editor that allow users to define human decision points. These nodes pause workflow execution, surface context to humans, wait for input, and resume or terminate based on the response.

### Key Integration

Uses Mastra's built-in `suspend()`, `resume()`, and `bail()` primitives. The workflow transpiler must generate Mastra steps with proper `suspendSchema` and `resumeSchema` definitions.

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `lib/workflow/types/nodes.ts` | Modify | Add suspension node types | A |
| `lib/workflow/types/suspension.ts` | Create | Suspension-specific types | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `lib/workflow/transpiler/suspension.ts` | Create | Transpile to Mastra steps | B |
| `lib/workflow/execution/suspend-handler.ts` | Create | Handle suspension events | B |
| `lib/attention/create-item.ts` | Create | Create attention queue items | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/nodes/SuspensionNode.tsx` | Create | Canvas node rendering | C |
| `app/(pages)/workflows/editor/components/panels/SuspensionConfig.tsx` | Create | Configuration panel | C |
| `app/(pages)/workflows/editor/components/panels/ApprovalConfig.tsx` | Create | Approval-specific config | C |
| `app/(pages)/workflows/editor/components/panels/InformationConfig.tsx` | Create | Info request config | C |
| `app/(pages)/workflows/editor/components/fields/ContextFieldBuilder.tsx` | Create | Context field editor | C |
| `app/(pages)/workflows/editor/components/fields/InputFieldBuilder.tsx` | Create | Input field editor | C |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/store/slices/nodes-slice.ts` | Modify | Add suspension node handling | C |

---

## Part A: Type Definitions

### Goal

Define the TypeScript types for suspension node configuration, covering all five node types and their options.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `lib/workflow/types/suspension.ts` | Create | All suspension types | ~200 |
| `lib/workflow/types/nodes.ts` | Modify | Include suspension types | ~20 |

### Pseudocode

#### `lib/workflow/types/suspension.ts`

```typescript
// Suspension node type discriminator
export type SuspensionNodeType =
  | 'approval'
  | 'information'
  | 'review'
  | 'escalation'
  | 'confirmation';

// Base configuration shared by all suspension nodes
export interface BaseSuspensionConfig {
  id: string;
  type: SuspensionNodeType;
  title: string;
  pauseReason: string;
  contextFields: ContextField[];
  timeout?: TimeoutConfig;
  assignTo: AssignmentConfig;
}

// Context field - data shown to human
export interface ContextField {
  id: string;
  label: string;
  expression: string;           // Template expression: "{{step.output.amount}}"
  format: 'text' | 'currency' | 'date' | 'json' | 'markdown';
}

// Input field - data collected from human
export interface InputField {
  id: string;
  name: string;                 // Field key in response
  label: string;                // Display label
  type: InputFieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: SelectOption[];     // For select/radio types
  validation?: ValidationRule;
}

export type InputFieldType =
  | 'text'
  | 'textarea'
  | 'boolean'
  | 'select'
  | 'radio'
  | 'number'
  | 'date'
  | 'email'
  | 'url';

export interface SelectOption {
  value: string;
  label: string;
}

export interface ValidationRule {
  pattern?: string;             // Regex
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  message?: string;             // Custom error message
}

// Timeout configuration
export interface TimeoutConfig {
  enabled: boolean;
  autoAction?: 'approve' | 'reject' | 'skip';
  autoAfterHours?: number;
  reminderAfterHours?: number;
  escalateAfterHours?: number;
  escalateTo?: string;          // User ID or role
  notifyOnTimeout?: boolean;
}

// Assignment configuration
export interface AssignmentConfig {
  type: 'owner' | 'specific' | 'role' | 'dynamic';
  value?: string;               // Depends on type
  // specific: email address
  // role: role name
  // dynamic: template expression "{{task.assignedTo}}"
}

// Specific node type configurations

export interface ApprovalNodeConfig extends BaseSuspensionConfig {
  type: 'approval';
  approveLabel?: string;        // Default: "Approve"
  rejectLabel?: string;         // Default: "Reject"
  requireComments?: 'always' | 'on-reject' | 'optional' | 'never';
  onRejection: RejectionBehavior;
}

export interface RejectionBehavior {
  action: 'stop' | 'goto' | 'retry';
  targetStepId?: string;        // For 'goto'
  maxRetries?: number;          // For 'retry'
}

export interface InformationNodeConfig extends BaseSuspensionConfig {
  type: 'information';
  instructions: string;         // Markdown supported
  inputFields: InputField[];
  submitLabel?: string;         // Default: "Submit"
}

export interface ReviewNodeConfig extends BaseSuspensionConfig {
  type: 'review';
  reviewFields: ReviewField[];  // Fields that can be edited
  approveLabel?: string;        // Default: "Looks Good"
  requestChangesLabel?: string; // Default: "Request Changes"
  onChangesRequested: RejectionBehavior;
}

export interface ReviewField {
  id: string;
  sourceExpression: string;     // Where to get current value
  label: string;
  editable: boolean;
  type: InputFieldType;
}

export interface EscalationNodeConfig extends BaseSuspensionConfig {
  type: 'escalation';
  escalationLevels: EscalationLevel[];
  decisionOptions: DecisionOption[];
}

export interface EscalationLevel {
  order: number;
  assignTo: AssignmentConfig;
  waitHours: number;
}

export interface DecisionOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  requiresComment?: boolean;
}

export interface ConfirmationNodeConfig extends BaseSuspensionConfig {
  type: 'confirmation';
  warningLevel: 'info' | 'warning' | 'danger';
  actionDescription: string;    // What will happen if confirmed
  impactDescription?: string;   // Consequences
  confirmationType: 'button' | 'phrase';
  confirmPhrase?: string;       // For phrase type: "DELETE"
  confirmLabel?: string;        // Default: "Confirm"
  cancelLabel?: string;         // Default: "Cancel"
}

// Union type for all suspension configs
export type SuspensionNodeConfig =
  | ApprovalNodeConfig
  | InformationNodeConfig
  | ReviewNodeConfig
  | EscalationNodeConfig
  | ConfirmationNodeConfig;

// Output types for each node
export interface ApprovalResult {
  approved: boolean;
  approvedBy: string;
  approvedAt: Date;
  comments?: string;
}

export interface InformationResult {
  data: Record<string, any>;
  submittedBy: string;
  submittedAt: Date;
}

export interface ReviewResult {
  approved: boolean;
  reviewedBy: string;
  reviewedAt: Date;
  edits?: Record<string, any>;
  comments?: string;
}

export interface EscalationResult {
  decision: string;
  decidedBy: string;
  decidedAt: Date;
  escalationPath: string[];
  comments?: string;
}

export interface ConfirmationResult {
  confirmed: boolean;
  confirmedBy: string;
  confirmedAt: Date;
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | All node types defined | Type check all configs |
| AC-A.2 | Zod schemas generated | Generate from types |
| AC-A.3 | Types integrate with node system | Include in NodeConfig union |

---

## Part B: Transpilation & Execution

### Goal

Build the transpiler that converts visual suspension node configs into Mastra step definitions, and the handler that creates attention items on suspension.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `lib/workflow/transpiler/suspension.ts` | Create | Transpile nodes | ~250 |
| `lib/workflow/execution/suspend-handler.ts` | Create | Handle events | ~150 |
| `lib/attention/create-item.ts` | Create | Create queue items | ~100 |

### Pseudocode

#### `lib/workflow/transpiler/suspension.ts`

```
class SuspensionTranspiler {
  transpile(config: SuspensionNodeConfig): string
  ├── Switch on config.type
  │   ├── 'approval' → transpileApproval(config)
  │   ├── 'information' → transpileInformation(config)
  │   ├── 'review' → transpileReview(config)
  │   ├── 'escalation' → transpileEscalation(config)
  │   └── 'confirmation' → transpileConfirmation(config)
  └── Return generated TypeScript code string

  private transpileApproval(config: ApprovalNodeConfig): string
  ├── Generate inputSchema from connected inputs
  ├── Generate suspendSchema
  │   └── { title, reason, context: ContextField[] }
  ├── Generate resumeSchema
  │   └── { approved: boolean, comments?: string }
  ├── Generate execute function
  │   ├── If no resumeData:
  │   │   ├── Call createAttentionItem()
  │   │   └── Return suspend(payload)
  │   ├── If rejected:
  │   │   ├── If onRejection.action === 'stop': bail()
  │   │   ├── If 'goto': return { __goto: targetStepId }
  │   │   └── If 'retry': return { __retry: true }
  │   └── Return approval result
  └── Return code string

  private transpileInformation(config: InformationNodeConfig): string
  ├── Generate inputSchema
  ├── Generate suspendSchema
  │   └── { title, reason, context, instructions, fields }
  ├── Generate resumeSchema from inputFields
  │   └── Build Zod schema dynamically
  ├── Generate execute function
  │   ├── If no resumeData: suspend with form definition
  │   └── Return collected data with metadata
  └── Return code string

  private buildResumeSchema(fields: InputField[]): string
  ├── For each field
  │   ├── Map type to Zod type
  │   ├── Add required/optional
  │   └── Add validation rules
  └── Return Zod schema code

  private buildContextPayload(
    fields: ContextField[],
    inputDataVar: string
  ): string
  ├── For each field
  │   ├── Parse expression template
  │   └── Generate code to extract value
  └── Return object literal code

  private transpileTimeout(config: TimeoutConfig): string
  ├── If not enabled: return empty
  ├── Generate timeout object
  │   ├── autoAction, afterMs
  │   ├── reminderMs
  │   └── escalation config
  └── Return code string
}

// Usage in main transpiler
function transpileWorkflow(workflow: WorkflowDefinition): string {
  const steps: string[] = [];

  for (const node of workflow.nodes) {
    if (isSuspensionNode(node)) {
      const suspensionCode = suspensionTranspiler.transpile(node.config);
      steps.push(suspensionCode);
    } else {
      // Regular node transpilation
      steps.push(transpileRegularNode(node));
    }
  }

  return buildWorkflowCode(steps);
}
```

#### `lib/workflow/execution/suspend-handler.ts`

```
class SuspendHandler {
  async onSuspend(event: SuspendEvent): Promise<void>
  ├── Extract workflow context
  │   ├── workflowId, runId, stepId
  │   ├── suspendPayload
  │   └── config (from step metadata)
  ├── Determine assignees
  │   └── resolveAssignment(config.assignTo, event.context)
  ├── Create attention item
  │   └── await attentionService.create({...})
  ├── Schedule timeout actions (if configured)
  │   ├── Schedule reminder
  │   ├── Schedule escalation
  │   └── Schedule auto-action
  ├── Emit suspension event
  │   └── For real-time UI updates
  └── Log suspension

  async onResume(event: ResumeEvent): Promise<void>
  ├── Validate resumeData against schema
  ├── Clear timeout jobs
  ├── Update attention item
  │   └── Mark as resolved
  ├── Emit resume event
  └── Log resume

  async onBail(event: BailEvent): Promise<void>
  ├── Update attention item
  │   └── Mark as cancelled
  ├── Clear timeout jobs
  ├── Emit bail event
  └── Log bail

  private resolveAssignment(
    config: AssignmentConfig,
    context: ExecutionContext
  ): string[]
  ├── Switch on config.type
  │   ├── 'owner': return [workflow.ownerId]
  │   ├── 'specific': return [config.value]
  │   ├── 'role': return lookupUsersWithRole(config.value)
  │   └── 'dynamic': return evaluateExpression(config.value, context)
  └── Return user IDs

  private scheduleTimeoutActions(
    runId: string,
    stepId: string,
    config: TimeoutConfig
  ): void
  ├── If reminderAfterHours
  │   └── Schedule reminder job
  ├── If escalateAfterHours
  │   └── Schedule escalation job
  ├── If autoAfterHours
  │   └── Schedule auto-action job
  └── Store job IDs for later cancellation
}
```

#### `lib/attention/create-item.ts`

```
interface CreateAttentionItemInput {
  workflowId: string;
  runId: string;
  stepId: string;
  type: SuspensionNodeType;
  title: string;
  reason: string;
  context: Array<{ label: string; value: any }>;
  inputFields?: InputField[];
  assignedTo: string[];
  timeout?: TimeoutConfig;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

async function createAttentionItem(
  input: CreateAttentionItemInput
): Promise<AttentionItem>
├── Generate item ID
├── Build attention item
│   ├── id, workflowId, runId, stepId
│   ├── type, title, reason
│   ├── context (resolved values)
│   ├── inputFields (form definition)
│   ├── assignedTo
│   ├── status: 'pending'
│   ├── createdAt, updatedAt
│   ├── timeout config
│   └── priority
├── Save to database
├── Notify assigned users
│   ├── In-app notification
│   └── Email (if configured)
└── Return created item
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Approval node transpiles correctly | Generate code, verify Mastra structure |
| AC-B.2 | Information node generates form schema | Check resumeSchema matches fields |
| AC-B.3 | Attention item created on suspend | Trigger suspension, verify item exists |
| AC-B.4 | Resume validates input | Submit bad data, verify rejection |
| AC-B.5 | Timeout schedules work | Set 1-second timeout, verify action |

---

## Part C: Frontend Components

### Goal

Build the canvas node component and configuration panels for all suspension node types.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/components/nodes/SuspensionNode.tsx` | Create | Canvas node | ~150 |
| `app/(pages)/workflows/editor/components/panels/SuspensionConfig.tsx` | Create | Base config panel | ~100 |
| `app/(pages)/workflows/editor/components/panels/ApprovalConfig.tsx` | Create | Approval config | ~180 |
| `app/(pages)/workflows/editor/components/panels/InformationConfig.tsx` | Create | Info config | ~200 |
| `app/(pages)/workflows/editor/components/fields/ContextFieldBuilder.tsx` | Create | Context editor | ~150 |
| `app/(pages)/workflows/editor/components/fields/InputFieldBuilder.tsx` | Create | Input editor | ~200 |

### Pseudocode

#### `SuspensionNode.tsx`

```
SuspensionNode({ id, data, selected })
├── Get execution state from store
│   └── isRunning, isSuspended, isComplete
├── Determine icon by type
│   ├── approval: CheckCircle / Diamond
│   ├── information: FileText
│   ├── review: Eye
│   ├── escalation: ArrowUpCircle
│   └── confirmation: AlertTriangle
├── Determine status badge
│   ├── idle: none
│   ├── running: blue spinner
│   ├── suspended: amber "Waiting" + elapsed time
│   └── complete: green checkmark
├── Render node container
│   ├── Border color by type (amber for suspension nodes)
│   ├── Selected state styling
│   └── Hover interactions
├── Render header
│   ├── Icon
│   ├── Title
│   └── Status badge
├── Render pause indicator
│   └── "⏸️ Pauses for human input"
├── Render handle ports
│   ├── Input handle (top)
│   └── Output handles (bottom)
│       ├── For approval: "Approved" and "Rejected" handles
│       └── For others: single output
├── On double-click
│   └── Open configuration panel
└── Return node element
```

#### `ApprovalConfig.tsx`

```
ApprovalConfig({ nodeId, config, onChange })
├── Local state for form
├── Panel structure
├── Section: Basic Info
│   ├── Title input
│   │   └── "What is this approval for?"
│   └── Pause reason textarea
│       └── "Explain why human input is needed"
├── Section: Context to Show
│   ├── ContextFieldBuilder component
│   │   └── List of context fields with add/remove
│   └── Preview of context display
├── Section: Approval Options
│   ├── Approve button label
│   ├── Reject button label
│   ├── Require comments dropdown
│   │   └── Always / On Reject / Optional / Never
│   └── Custom input fields (optional)
├── Section: On Rejection
│   ├── Radio group
│   │   ├── Stop workflow
│   │   ├── Go to step: [step selector]
│   │   └── Retry with modifications
│   └── Max retries (if retry selected)
├── Section: Assignment
│   ├── Radio group
│   │   ├── Workflow owner
│   │   ├── Specific person: [email input]
│   │   ├── Role: [role selector]
│   │   └── Dynamic: [expression input]
│   └── Test assignment button
├── Section: Timeout (collapsible)
│   ├── Enable timeout toggle
│   ├── Auto-action dropdown
│   ├── Hours input
│   ├── Reminder checkbox + hours
│   └── Escalation checkbox + target + hours
├── Footer
│   ├── Cancel button
│   └── Save button
├── On save
│   └── Call onChange with updated config
└── Validation before save
```

#### `ContextFieldBuilder.tsx`

```
ContextFieldBuilder({ fields, onChange, availableData })
├── Render field list
│   ├── For each field
│   │   ├── Label input
│   │   ├── Expression input (with autocomplete)
│   │   │   └── Suggest from availableData
│   │   ├── Format selector
│   │   └── Remove button
├── Add field button
├── Drag-to-reorder support
├── Expression autocomplete
│   ├── Show available step outputs
│   ├── Show workflow variables
│   └── Show input data fields
├── Preview section
│   └── Show mock values for expressions
└── On change
    └── Call onChange with updated fields
```

#### `InputFieldBuilder.tsx`

```
InputFieldBuilder({ fields, onChange })
├── Render field list
│   ├── For each field
│   │   ├── Field name (code key)
│   │   ├── Display label
│   │   ├── Type selector
│   │   │   └── text, textarea, boolean, select, number, date, etc.
│   │   ├── Required toggle
│   │   ├── Type-specific options
│   │   │   ├── select: options editor
│   │   │   ├── number: min/max
│   │   │   ├── text: pattern, minLength, maxLength
│   │   │   └── etc.
│   │   ├── Default value input
│   │   └── Remove button
├── Add field button
├── Drag-to-reorder support
├── Field preview
│   └── Render mock form with fields
└── On change
    └── Call onChange with updated fields
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-C.1 | Suspension node renders on canvas | Add node, verify display |
| AC-C.2 | Node shows correct icon per type | Check all 5 types |
| AC-C.3 | Node shows execution status | Run workflow, verify states |
| AC-C.4 | Config panel opens on double-click | Double-click, verify panel |
| AC-C.5 | Approval config saves correctly | Configure, save, reload, verify |
| AC-C.6 | Context field builder works | Add/remove/reorder fields |
| AC-C.7 | Input field builder works | Add fields with validation |
| AC-C.8 | Assignment options work | Test each assignment type |
| AC-C.9 | Timeout options work | Configure, verify saved |

---

## Integration Points

### With Workflow Editor

```tsx
// In node palette, add suspension nodes
const SUSPENSION_NODES = [
  { type: 'approval', label: 'Approval Gate', icon: CheckCircle },
  { type: 'information', label: 'Request Info', icon: FileText },
  { type: 'review', label: 'Review Checkpoint', icon: Eye },
  { type: 'escalation', label: 'Escalation Point', icon: ArrowUp },
  { type: 'confirmation', label: 'Confirmation', icon: AlertTriangle },
];
```

### With Workflow Transpiler

```typescript
// In main transpiler
if (node.type.startsWith('suspension:')) {
  return suspensionTranspiler.transpile(node.config);
}
```

### With Attention Queue

```typescript
// Suspension creates item, queue displays it
// See doc 19 for queue implementation
```

---

## Out of Scope

- Multi-approver (parallel approval) logic
- Delegation workflows
- Mobile-optimized configuration UI
- Slack/Teams notification integration
- SLA tracking and reporting
- Approval audit trail UI

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |

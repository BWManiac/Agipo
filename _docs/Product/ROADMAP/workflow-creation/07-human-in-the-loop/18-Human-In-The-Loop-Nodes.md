# Human-in-the-Loop Nodes

**Status:** Draft
**Priority:** P1
**North Star:** User designs a workflow that pauses at critical decision points, waits for human judgment, then continues — creating AI-human collaboration, not just AI automation.

---

## Problem Statement

Fully autonomous workflows are dangerous and limiting:

1. **Trust Gap** — Users don't trust AI to make high-stakes decisions without oversight
2. **Compliance Requirements** — Many processes require human approval (financial, legal, HR)
3. **Nuanced Judgment** — Some decisions require context that AI can't fully capture
4. **Learning Opportunity** — Humans want to review AI work to build confidence over time

**The Need:** A clear, visual way to define "pause points" in workflows where the AI stops, presents information to a human, waits for input, and continues based on that input.

---

## User Value

- **Guardrails for AI** — Humans stay in control of critical decisions
- **Compliance-ready** — Workflows meet audit requirements for human oversight
- **Progressive trust** — Start with many checkpoints, remove them as confidence grows
- **Collaborative workflows** — AI does prep work, human makes judgment calls
- **Asynchronous operation** — Workflows can wait hours/days for human input

---

## Core Concept: The Suspension Point

A **suspension point** is a node (or node configuration) that:

1. **Pauses** workflow execution
2. **Surfaces** context to the human (what happened, what's needed)
3. **Waits** for human input (approval, rejection, data entry)
4. **Continues** or **terminates** based on human response

### Mastra Primitives

Mastra provides three core methods:

| Method | Purpose | When to Use |
|--------|---------|-------------|
| `suspend()` | Pause and return context | Need human decision |
| `resume()` | Continue with human input | Human provided response |
| `bail()` | Stop without error | Human rejected/cancelled |

```typescript
const approvalStep = createStep({
  id: "approval-step",
  inputSchema: z.object({
    document: z.string(),
    analysis: z.string(),
  }),
  // What we send to human when pausing
  suspendSchema: z.object({
    reason: z.string(),
    document: z.string(),
    aiRecommendation: z.string(),
  }),
  // What we expect back from human
  resumeSchema: z.object({
    approved: z.boolean(),
    comments: z.string().optional(),
  }),
  execute: async ({ inputData, resumeData, suspend, bail }) => {
    // If no human response yet, pause and wait
    if (!resumeData) {
      return await suspend({
        reason: "Document requires manager approval",
        document: inputData.document,
        aiRecommendation: inputData.analysis,
      });
    }

    // Human responded
    if (!resumeData.approved) {
      return bail(); // Stop workflow cleanly
    }

    return {
      approved: true,
      comments: resumeData.comments
    };
  },
});
```

---

## User Flows

### Flow 1: Add Suspension Point to Workflow

```
1. User is editing workflow on canvas
2. User adds a new node
3. User selects "Human Input" node type (or configures existing node)
4. Configuration panel shows:
   - Pause reason (what to tell the human)
   - Context fields (what data to show)
   - Input fields (what to ask from human)
   - Timeout settings (optional)
5. Node displays with distinctive "pause" indicator
6. User connects node in workflow
7. Save workflow
```

### Flow 2: Configure Approval Node

```
1. User drags "Approval Gate" node onto canvas
2. Node configuration opens:
   - Title: "Manager Approval Required"
   - Show to human:
     ☑ Previous step output
     ☑ AI recommendation
     ☐ Full workflow context
   - Ask human for:
     ☑ Approve/Reject decision
     ☑ Comments (optional)
     ☐ Custom fields...
   - On rejection:
     ○ Stop workflow
     ○ Go to step: [dropdown]
     ○ Retry with modifications
   - Timeout:
     ☐ Auto-approve after: [__] hours
     ☐ Auto-reject after: [__] hours
     ☑ Notify after: [24] hours
3. User saves configuration
4. Node shows: 🔸 "Manager Approval Required"
```

### Flow 3: Configure Data Collection Node

```
1. User drags "Request Information" node onto canvas
2. Node configuration opens:
   - Title: "Additional Details Needed"
   - Message to human: "Please provide..."
   - Requested fields:
     + [Add Field]
     - Customer ID (text, required)
     - Priority Level (dropdown: Low/Medium/High)
     - Notes (textarea, optional)
   - Timeout:
     ☐ Skip after: [__] hours
3. User saves configuration
4. Node shows: 📝 "Additional Details Needed"
```

### Flow 4: Workflow Execution with Suspension

```
1. Workflow starts (triggered or manual)
2. Steps execute sequentially
3. Workflow reaches suspension point
4. System:
   - Saves workflow state (snapshot)
   - Creates "attention item" in queue
   - Notifies relevant human(s)
   - Returns suspended status
5. Workflow waits (could be minutes, hours, days)
6. Human responds (via Attention Queue or Chat)
7. System:
   - Validates response against resumeSchema
   - Calls run.resume() with response data
   - Workflow continues from suspension point
8. Next steps execute
9. Workflow completes (or hits another suspension)
```

---

## Node Types

### 1. Approval Gate

**Purpose:** Binary approve/reject decision

**Visual:** 🔸 Diamond shape with checkmark

**Configuration:**
- Title
- Context to show
- Approval button labels ("Approve" / "Reject")
- Comments field (optional)
- Rejection behavior

**Output:** `{ approved: boolean, comments?: string, approvedBy: string, approvedAt: Date }`

### 2. Information Request

**Purpose:** Collect additional data from human

**Visual:** 📝 Rectangle with form icon

**Configuration:**
- Title
- Message/instructions
- Form fields (dynamic)
- Required vs optional

**Output:** `{ [fieldName]: value, submittedBy: string, submittedAt: Date }`

### 3. Review Checkpoint

**Purpose:** Human reviews AI work, may edit before continuing

**Visual:** 👁️ Eye icon

**Configuration:**
- Title
- What to review (output from previous step)
- Editable fields
- "Looks good" / "Need changes" actions

**Output:** `{ reviewed: boolean, edits?: object, reviewedBy: string }`

### 4. Escalation Point

**Purpose:** Route to specific person/role for decision

**Visual:** 📤 Arrow up icon

**Configuration:**
- Title
- Escalation target (role, person, team)
- Urgency level
- Context to include
- Fallback if no response

**Output:** `{ decision: string, decidedBy: string, escalationPath: string[] }`

### 5. Confirmation Required

**Purpose:** Verify before high-impact action

**Visual:** ⚠️ Warning icon

**Configuration:**
- Title
- Action description
- Impact warning
- Confirmation phrase (type "CONFIRM" to proceed)

**Output:** `{ confirmed: boolean, confirmedBy: string }`

---

## Visual Design

### Canvas Representation

```
Regular Node:          Suspension Node:
┌──────────────┐       ┌──────────────┐
│   📧 Send    │       │ 🔸 Approval  │
│    Email     │       │   Required   │
└──────────────┘       ├──────────────┤
                       │ ⏸️ PAUSES     │
                       └──────────────┘

The suspension node has:
- Distinctive color (amber/orange border)
- Pause indicator badge
- Different shape (optional: diamond for decisions)
```

### Node States During Execution

```
Pending:        Waiting:         Resumed:
┌────────────┐  ┌────────────┐   ┌────────────┐
│ 🔸 Approve │  │ 🔸 Approve │   │ ✅ Approved│
│            │  │            │   │            │
├────────────┤  ├────────────┤   ├────────────┤
│   ○ Idle   │  │ ⏳ Waiting │   │ ✓ Complete │
└────────────┘  │  2h 15m    │   └────────────┘
                └────────────┘
```

### Configuration Panel

```
┌─────────────────────────────────────────────────┐
│ Approval Gate Configuration                     │
├─────────────────────────────────────────────────┤
│                                                 │
│ Title:                                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ Manager Approval for Expense Report         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Pause Reason (shown to approver):               │
│ ┌─────────────────────────────────────────────┐ │
│ │ This expense report exceeds $500 and        │ │
│ │ requires manager approval before processing.│ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Context to Show:                                │
│ ☑ Amount: {{expense.total}}                    │
│ ☑ Submitted by: {{expense.submitter}}          │
│ ☑ Category: {{expense.category}}               │
│ ☑ AI Analysis: {{analysis.summary}}            │
│ + Add context field                             │
│                                                 │
│ ─────────────────────────────────────────────── │
│                                                 │
│ Ask Approver For:                               │
│ ☑ Approve / Reject decision                    │
│ ☑ Comments (optional)                          │
│ ☐ Custom fields...                             │
│                                                 │
│ ─────────────────────────────────────────────── │
│                                                 │
│ On Rejection:                                   │
│ ◉ Stop workflow                                │
│ ○ Go to step: [Send Rejection Email ▼]         │
│ ○ Retry with modifications                      │
│                                                 │
│ ─────────────────────────────────────────────── │
│                                                 │
│ Timeout (optional):                             │
│ ☐ Auto-approve after: [__] hours               │
│ ☐ Auto-reject after: [__] hours                │
│ ☑ Send reminder after: [24] hours              │
│ ☑ Escalate to: [Director ▼] after: [48] hours  │
│                                                 │
│ ─────────────────────────────────────────────── │
│                                                 │
│ Assign To:                                      │
│ ◉ Workflow owner                               │
│ ○ Specific person: [____________]              │
│ ○ Role: [Manager ▼]                            │
│ ○ Dynamic: {{expense.submitter.manager}}       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Code Areas

| Area | Purpose | Key Files |
|------|---------|-----------|
| `lib/workflow/types/` | Node type definitions | Suspension schemas |
| `lib/workflow/execution/` | Runtime execution | suspend/resume handling |
| `app/(pages)/workflows/editor/` | Canvas components | Node rendering |
| `app/api/workflows/` | Workflow API | State persistence |
| `lib/attention/` | Attention queue | Item creation |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Suspension granularity | Per-step, not per-workflow | Fine-grained control |
| State storage | Mastra's built-in snapshots | Reliability, restart-safe |
| Node visual | Amber border + pause badge | Clear visual distinction |
| Resume validation | Zod schema | Type safety, runtime validation |
| Timeout handling | Optional per-node | Flexibility for different use cases |

---

## Architecture

### Data Model

```typescript
interface SuspensionNodeConfig {
  id: string;
  type: 'approval' | 'information' | 'review' | 'escalation' | 'confirmation';

  // Display
  title: string;
  pauseReason: string;

  // Context to show human
  contextFields: ContextField[];

  // Input from human
  inputFields: InputField[];

  // Behavior
  onRejection: 'stop' | 'goto' | 'retry';
  rejectionTarget?: string;  // stepId if goto

  // Timeout
  timeout?: TimeoutConfig;

  // Assignment
  assignTo: AssignmentConfig;
}

interface ContextField {
  label: string;
  expression: string;  // e.g., "{{expense.total}}"
  format?: 'text' | 'currency' | 'date' | 'json';
}

interface InputField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'boolean' | 'select' | 'number' | 'date';
  required: boolean;
  options?: string[];  // for select
  default?: any;
  validation?: string;  // zod schema string
}

interface TimeoutConfig {
  autoAction?: 'approve' | 'reject' | 'skip';
  autoAfterHours?: number;
  reminderAfterHours?: number;
  escalateAfterHours?: number;
  escalateTo?: string;
}

interface AssignmentConfig {
  type: 'owner' | 'specific' | 'role' | 'dynamic';
  value?: string;  // email, role name, or expression
}
```

### Workflow State During Suspension

```typescript
interface SuspendedWorkflowState {
  workflowId: string;
  runId: string;
  suspendedAt: Date;

  // Which step(s) are suspended
  suspendedSteps: SuspendedStep[];

  // Snapshot for resume
  snapshot: WorkflowSnapshot;

  // For attention queue
  attentionItem: AttentionItemRef;
}

interface SuspendedStep {
  stepId: string;
  suspendPayload: Record<string, any>;  // Context sent to human
  resumeSchema: ZodSchema;              // Expected response shape
  config: SuspensionNodeConfig;
  assignedTo: string[];                 // User IDs
}
```

### Transpilation to Mastra

```typescript
// User's visual node config
const visualConfig: SuspensionNodeConfig = {
  id: "approval-1",
  type: "approval",
  title: "Manager Approval",
  pauseReason: "Expense over $500",
  contextFields: [
    { label: "Amount", expression: "{{expense.total}}" }
  ],
  inputFields: [
    { name: "approved", type: "boolean", required: true },
    { name: "comments", type: "textarea", required: false }
  ],
  onRejection: "stop"
};

// Transpiled to Mastra step
const step = createStep({
  id: "approval-1",
  inputSchema: z.object({
    expense: z.object({ total: z.number() })
  }),
  suspendSchema: z.object({
    title: z.string(),
    reason: z.string(),
    context: z.array(z.object({
      label: z.string(),
      value: z.any()
    }))
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
    comments: z.string().optional()
  }),
  execute: async ({ inputData, resumeData, suspend, bail }) => {
    if (!resumeData) {
      // Create attention item
      await createAttentionItem({
        workflowId,
        stepId: "approval-1",
        title: "Manager Approval",
        reason: "Expense over $500",
        context: [
          { label: "Amount", value: inputData.expense.total }
        ],
        assignedTo: ["manager@example.com"]
      });

      return await suspend({
        title: "Manager Approval",
        reason: "Expense over $500",
        context: [
          { label: "Amount", value: inputData.expense.total }
        ]
      });
    }

    if (!resumeData.approved) {
      return bail();
    }

    return {
      approved: true,
      approvedBy: resumeData.__meta.userId,
      approvedAt: new Date(),
      comments: resumeData.comments
    };
  }
});
```

---

## Constraints

- **Storage dependency** — Requires configured storage provider for snapshots
- **State size** — Large context fields increase snapshot size
- **Concurrency** — Multiple suspended workflows need efficient querying
- **Security** — Only assigned users should see/respond to suspension
- **Mobile** — Response UI must work on mobile devices

---

## Success Criteria

- [ ] User can add suspension nodes from node palette
- [ ] Five node types available (approval, info, review, escalation, confirmation)
- [ ] Node configuration saves correctly
- [ ] Suspension nodes render with distinct visual
- [ ] Workflow pauses at suspension point
- [ ] State persists across server restarts
- [ ] Resume works with validated input
- [ ] Rejection triggers correct behavior
- [ ] Timeout settings work as configured
- [ ] Attention item created on suspension

---

## Out of Scope

- Multi-approver workflows (parallel approvals)
- Delegation (reassign to someone else)
- Voting (3 of 5 must approve)
- SLA tracking and analytics
- Mobile-specific response UI
- Slack/Teams integration for responses

---

## Dependencies

- **Attention Queue UI** (doc 19) — Where users respond to suspensions
- **Workflow Runtime** (doc 13) — Execution engine integration
- **Notification System** — Alert users of pending items

---

## Open Questions

- Should we support "anyone with role X" or require specific assignment?
- How do we handle workflows suspended for weeks/months?
- Should timeouts be workflow-level or step-level defaults?
- How do we visualize the "waiting" state on the canvas during execution?
- Should we show historical responses inline on the canvas?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Node palette | Suspension node types | All 5 types with icons |
| Node on canvas | Visual distinction | Idle, waiting, complete states |
| Configuration panel | Node setup | All configuration options |
| Approval node config | Specific type | Full form |
| Information request config | Specific type | Dynamic field builder |

### Mockup Location

```
_docs/UXD/Pages/workflows/editor/
├── suspension-nodes/
│   ├── node-palette.html
│   ├── node-on-canvas.html
│   ├── approval-config.html
│   ├── information-config.html
│   ├── review-config.html
│   ├── escalation-config.html
│   └── confirmation-config.html
```

---

## References

- [Mastra Human-in-the-Loop Docs](https://mastra.ai/docs/workflows/human-in-the-loop)
- Temporal.io human tasks pattern
- Camunda user tasks
- Zapier "Wait for approval" step

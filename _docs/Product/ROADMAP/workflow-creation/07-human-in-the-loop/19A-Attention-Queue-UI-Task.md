# Task: Attention Queue UI

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/07-human-in-the-loop/19-Attention-Queue-UI.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Overview

### Goal

Implement the Attention Queue UI where users see and respond to suspended workflows. The queue is the central location for all human-in-the-loop interactions, accessible from the Workforce page with real-time updates.

### Key Integration Points

- **Human-in-the-Loop Nodes** (doc 18) create attention items when workflows suspend
- **Workflow Runtime** resumes when users respond
- **Agent Chat** displays in-chat response cards
- **WebSocket** provides real-time updates

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `lib/attention/types.ts` | Create | Attention item types | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/attention/route.ts` | Create | List/create items | A |
| `app/api/attention/[id]/route.ts` | Create | Get/update/delete item | A |
| `app/api/attention/[id]/respond/route.ts` | Create | Submit response | A |
| `app/api/attention/[id]/reassign/route.ts` | Create | Reassign item | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `lib/attention/service.ts` | Create | Attention CRUD | A |
| `lib/attention/resume-workflow.ts` | Create | Resume on response | A |

### Frontend / Pages

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/page.tsx` | Modify | Add Attention tab | B |
| `app/(pages)/workforce/attention/page.tsx` | Create | Attention Queue page | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `components/attention/AttentionBadge.tsx` | Create | Count badge | B |
| `components/attention/AttentionQueue.tsx` | Create | Main queue component | B |
| `components/attention/AttentionItem.tsx` | Create | Single item card | B |
| `components/attention/AttentionItemExpanded.tsx` | Create | Expanded view | B |
| `components/attention/ApprovalForm.tsx` | Create | Approval response | C |
| `components/attention/InformationForm.tsx` | Create | Info request form | C |
| `components/attention/ReviewForm.tsx` | Create | Review response | C |
| `components/attention/FilterPanel.tsx` | Create | Filter controls | B |
| `components/attention/EmptyState.tsx` | Create | No items state | B |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `lib/attention/store.ts` | Create | Attention state | B |
| `lib/attention/hooks.ts` | Create | React hooks | B |

### Frontend / Chat Integration

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `components/chat/AttentionMessage.tsx` | Create | In-chat display | D |

---

## Part A: Backend Infrastructure

### Goal

Build the API endpoints and service layer for attention item management, including creating items (from suspensions), listing, responding, and resuming workflows.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `lib/attention/types.ts` | Create | Type definitions | ~120 |
| `lib/attention/service.ts` | Create | Core service | ~250 |
| `lib/attention/resume-workflow.ts` | Create | Resume logic | ~80 |
| `app/api/attention/route.ts` | Create | List endpoint | ~80 |
| `app/api/attention/[id]/route.ts` | Create | Item endpoints | ~100 |
| `app/api/attention/[id]/respond/route.ts` | Create | Response endpoint | ~100 |
| `app/api/attention/[id]/reassign/route.ts` | Create | Reassign endpoint | ~60 |

### Pseudocode

#### `lib/attention/types.ts`

```typescript
export interface AttentionItem {
  id: string;

  // Source reference
  workflowId: string;
  workflowName: string;
  runId: string;
  stepId: string;
  stepName: string;
  agentId: string;
  agentName: string;

  // Request type
  type: AttentionType;

  // Display content
  title: string;
  reason: string;
  context: ContextItem[];
  inputFields?: InputFieldDefinition[];

  // Assignment
  assignedTo: string[];
  assignedBy?: string;
  assignmentNote?: string;

  // Status
  status: AttentionStatus;
  priority: AttentionPriority;

  // Timing
  createdAt: Date;
  respondedAt?: Date;
  expiresAt?: Date;
  lastReminderAt?: Date;

  // Response (when completed)
  response?: AttentionResponse;

  // Audit trail
  history: AttentionHistoryEntry[];
}

export type AttentionType =
  | 'approval'
  | 'information'
  | 'review'
  | 'escalation'
  | 'confirmation';

export type AttentionStatus =
  | 'pending'
  | 'responded'
  | 'expired'
  | 'cancelled';

export type AttentionPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent';

export interface ContextItem {
  label: string;
  value: any;
  format: 'text' | 'currency' | 'date' | 'json' | 'markdown' | 'link';
}

export interface InputFieldDefinition {
  name: string;
  label: string;
  type: InputFieldType;
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: ValidationRule;
  defaultValue?: any;
}

export interface AttentionResponse {
  data: Record<string, any>;
  respondedBy: string;
  respondedAt: Date;
  responseChannel: 'queue' | 'chat' | 'notification' | 'api';
}

export interface AttentionHistoryEntry {
  timestamp: Date;
  action: AttentionAction;
  userId?: string;
  details?: Record<string, any>;
}

export type AttentionAction =
  | 'created'
  | 'viewed'
  | 'reassigned'
  | 'reminded'
  | 'escalated'
  | 'responded'
  | 'expired'
  | 'cancelled';

// API types
export interface ListAttentionParams {
  type?: AttentionType;
  priority?: AttentionPriority;
  workflowId?: string;
  agentId?: string;
  status?: AttentionStatus;
  sortBy?: 'priority' | 'newest' | 'oldest';
  limit?: number;
  offset?: number;
}

export interface RespondToAttentionInput {
  itemId: string;
  data: Record<string, any>;
  channel: 'queue' | 'chat' | 'notification' | 'api';
}

export interface ReassignAttentionInput {
  itemId: string;
  newAssignee: string;
  note?: string;
}
```

#### `lib/attention/service.ts`

```
class AttentionService {
  async create(input: CreateAttentionItemInput): Promise<AttentionItem>
  ├── Generate item ID
  ├── Build attention item
  │   ├── Copy workflow/run/step references
  │   ├── Set initial status: 'pending'
  │   ├── Calculate priority from config
  │   └── Add 'created' history entry
  ├── Save to database
  ├── Send notifications to assignees
  │   └── In-app, email (if configured), push (if configured)
  ├── Emit 'attention:created' event
  │   └── For WebSocket broadcast
  └── Return created item

  async list(
    userId: string,
    params: ListAttentionParams
  ): Promise<{ items: AttentionItem[], total: number }>
  ├── Build query
  │   ├── Filter by assignedTo includes userId
  │   ├── Apply type filter if specified
  │   ├── Apply priority filter if specified
  │   ├── Apply workflow/agent filters
  │   └── Apply status filter (default: pending)
  ├── Apply sort
  │   ├── 'priority': priority DESC, createdAt ASC
  │   ├── 'newest': createdAt DESC
  │   └── 'oldest': createdAt ASC
  ├── Apply pagination
  ├── Execute query
  └── Return items with total count

  async getById(id: string, userId: string): Promise<AttentionItem | null>
  ├── Load item from database
  ├── Verify user has access (is assignee)
  ├── Record 'viewed' history entry
  ├── Save updated item
  └── Return item

  async respond(input: RespondToAttentionInput): Promise<AttentionItem>
  ├── Load item
  ├── Verify status is 'pending'
  ├── Validate response data against inputFields
  │   └── Use Zod schema generated from field definitions
  ├── Build response object
  │   ├── data, respondedBy, respondedAt, channel
  ├── Update item
  │   ├── Set response
  │   ├── Set status: 'responded'
  │   ├── Set respondedAt
  │   └── Add 'responded' history entry
  ├── Save to database
  ├── Resume workflow
  │   └── await resumeWorkflow(item.runId, item.stepId, input.data)
  ├── Emit 'attention:responded' event
  └── Return updated item

  async reassign(input: ReassignAttentionInput): Promise<AttentionItem>
  ├── Load item
  ├── Verify status is 'pending'
  ├── Verify current user is current assignee
  ├── Update assignedTo
  ├── Set assignedBy to current user
  ├── Set assignmentNote
  ├── Add 'reassigned' history entry
  ├── Save to database
  ├── Notify new assignee
  ├── Emit 'attention:reassigned' event
  └── Return updated item

  async cancel(id: string, userId: string): Promise<void>
  ├── Load item
  ├── Verify user is workflow owner
  ├── Set status: 'cancelled'
  ├── Add 'cancelled' history entry
  ├── Save to database
  ├── Cancel workflow run
  ├── Emit 'attention:cancelled' event
  └── Return

  async getCountForUser(userId: string): Promise<number>
  ├── Query count of pending items for user
  └── Return count

  async expireOverdue(): Promise<void>
  ├── Find all pending items past expiresAt
  ├── For each
  │   ├── Set status: 'expired'
  │   ├── Add 'expired' history entry
  │   ├── Execute timeout action if configured
  │   └── Notify assignees
  └── Return
}
```

#### `lib/attention/resume-workflow.ts`

```
async function resumeWorkflow(
  runId: string,
  stepId: string,
  responseData: Record<string, any>
): Promise<void>
├── Load workflow run from Mastra
├── Validate run is suspended at expected step
├── Add metadata to response
│   └── __meta: { userId, responseTime, channel }
├── Call run.resume({
│   step: stepId,
│   resumeData: responseData
│ })
├── If resume fails
│   └── Throw with details for user feedback
├── Log resume event
└── Return
```

#### `app/api/attention/route.ts`

```
GET /api/attention
├── Authenticate user
├── Parse query params (filters, sort, pagination)
├── Call attentionService.list(userId, params)
└── Return { items, total, hasMore }

// Note: POST is handled by suspension handler, not this endpoint
```

#### `app/api/attention/[id]/respond/route.ts`

```
POST /api/attention/:id/respond
├── Authenticate user
├── Parse response data from body
├── Call attentionService.respond({
│   itemId: params.id,
│   data: body.data,
│   channel: 'queue'  // or 'chat' if from chat
│ })
├── If validation error
│   └── Return 400 with field errors
├── If workflow resume fails
│   └── Return 500 with error details
└── Return updated item
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Items created on workflow suspension | Trigger suspension, verify item exists |
| AC-A.2 | List returns user's items only | Query as different users, verify isolation |
| AC-A.3 | Filters work correctly | Apply each filter, verify results |
| AC-A.4 | Response validates input | Submit invalid data, verify error |
| AC-A.5 | Response resumes workflow | Respond, verify workflow continues |
| AC-A.6 | Reassignment works | Reassign, verify new assignee sees item |
| AC-A.7 | History recorded | Perform actions, verify history entries |

---

## Part B: Frontend Queue UI

### Goal

Build the Attention Queue page and components for listing, filtering, and expanding attention items.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `lib/attention/store.ts` | Create | Zustand store | ~100 |
| `lib/attention/hooks.ts` | Create | React hooks | ~80 |
| `app/(pages)/workforce/page.tsx` | Modify | Add tab | ~20 |
| `app/(pages)/workforce/attention/page.tsx` | Create | Queue page | ~60 |
| `components/attention/AttentionBadge.tsx` | Create | Badge | ~40 |
| `components/attention/AttentionQueue.tsx` | Create | Queue list | ~120 |
| `components/attention/AttentionItem.tsx` | Create | Item card | ~100 |
| `components/attention/AttentionItemExpanded.tsx` | Create | Expanded | ~150 |
| `components/attention/FilterPanel.tsx` | Create | Filters | ~100 |
| `components/attention/EmptyState.tsx` | Create | Empty | ~40 |

### Pseudocode

#### `lib/attention/store.ts`

```typescript
interface AttentionState {
  items: AttentionItem[];
  isLoading: boolean;
  error: string | null;
  total: number;

  // Filters
  filters: {
    type: AttentionType | null;
    priority: AttentionPriority | null;
    workflowId: string | null;
    agentId: string | null;
  };

  // Sort
  sortBy: 'priority' | 'newest' | 'oldest';

  // UI state
  expandedItemId: string | null;

  // Count for badge
  pendingCount: number;
}

actions:
  fetchItems()
  ├── Set isLoading
  ├── Call API with current filters/sort
  ├── Update items, total
  └── Clear isLoading

  setFilter(key: keyof Filters, value: string | null)
  ├── Update filter
  └── Refetch items

  setSortBy(sort: SortOption)
  ├── Update sortBy
  └── Refetch items

  clearFilters()
  ├── Reset all filters
  └── Refetch items

  expandItem(id: string)
  └── Set expandedItemId

  collapseItem()
  └── Set expandedItemId to null

  fetchPendingCount()
  ├── Call count API
  └── Update pendingCount

  // WebSocket handlers
  onItemCreated(item: AttentionItem)
  ├── Add to items if matches filters
  └── Increment pendingCount

  onItemUpdated(item: AttentionItem)
  ├── Update in items array
  └── Adjust pendingCount if status changed

  onItemRemoved(id: string)
  ├── Remove from items array
  └── Decrement pendingCount
```

#### `components/attention/AttentionQueue.tsx`

```
AttentionQueue()
├── Get state from store
│   └── items, isLoading, expandedItemId, filters
├── Setup WebSocket subscription
│   └── useEffect with cleanup
├── Render container
│   ├── Header
│   │   ├── Title: "Attention Needed"
│   │   └── Filter button (opens FilterPanel)
│   ├── Filter chips (active filters)
│   │   └── For each active filter: chip with X to remove
│   ├── Sort dropdown
│   │   └── Priority / Newest / Oldest
│   ├── Items list
│   │   ├── If loading: skeleton
│   │   ├── If empty: EmptyState
│   │   └── For each item:
│   │       ├── AttentionItem (collapsed)
│   │       └── Or AttentionItemExpanded (if expanded)
│   └── Load more (if pagination)
├── On filter change
│   └── Dispatch setFilter
├── On sort change
│   └── Dispatch setSortBy
└── Return element
```

#### `components/attention/AttentionItem.tsx`

```
AttentionItem({ item, isExpanded, onExpand })
├── Type icon and color
│   ├── approval: 🔸 amber
│   ├── information: 📝 blue
│   ├── review: 👁️ purple
│   ├── escalation: 📤 red
│   └── confirmation: ⚠️ orange
├── Card container
│   ├── Border color by type
│   ├── Click handler for expand
│   └── Hover state
├── Header row
│   ├── Type badge
│   ├── Time ago
│   └── Priority badge (if high/urgent)
├── Title row
│   └── item.title
├── Workflow row
│   └── "Workflow: {workflowName}"
├── Context preview
│   └── First 1-2 context items inline
├── Reason text
│   └── item.reason (truncated if long)
├── Quick actions (for simple types)
│   ├── Approval: [Reject] [Approve]
│   └── Confirmation: [Cancel] [Confirm]
├── On click
│   └── Call onExpand(item.id)
└── Return card element
```

#### `components/attention/AttentionItemExpanded.tsx`

```
AttentionItemExpanded({ item, onCollapse })
├── Expanded card (larger than collapsed)
├── Header
│   ├── Type badge
│   ├── Time ago
│   ├── Priority badge
│   └── Collapse button
├── Title (larger)
├── Workflow + Agent info
├── Context section
│   ├── Section header: "Context"
│   ├── For each context item
│   │   ├── Label
│   │   ├── Value (formatted by type)
│   │   └── Copy button for certain types
│   └── Collapse/expand for many items
├── Response section
│   ├── Section header: "Your Response"
│   └── Render form by type
│       ├── approval: ApprovalForm
│       ├── information: InformationForm
│       ├── review: ReviewForm
│       ├── escalation: EscalationForm
│       └── confirmation: ConfirmationForm
├── Footer actions
│   ├── [View Workflow] → opens workflow page
│   ├── [View Execution] → opens run history
│   └── [Reassign] → opens reassign modal
└── Return element
```

#### `components/attention/FilterPanel.tsx`

```
FilterPanel({ isOpen, onClose, filters, onFilterChange })
├── Slide-in panel (right side)
├── Header
│   ├── Title: "Filter"
│   └── Close button
├── Type filter
│   ├── Label: "Request Type"
│   └── Checkbox group
│       ├── All
│       ├── Approvals
│       ├── Info Requests
│       ├── Reviews
│       ├── Escalations
│       └── Confirmations
├── Priority filter
│   ├── Label: "Priority"
│   └── Checkbox group
│       ├── Urgent
│       ├── High
│       ├── Normal
│       └── Low
├── Workflow filter
│   ├── Label: "Workflow"
│   └── Searchable dropdown
├── Agent filter
│   ├── Label: "Agent"
│   └── Searchable dropdown
├── Footer
│   ├── [Clear All] button
│   └── [Apply] button
├── On apply
│   └── Call onFilterChange with selected values
└── Return panel element
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Queue displays items | Navigate to page, verify list |
| AC-B.2 | Badge shows correct count | Create items, verify badge |
| AC-B.3 | Filters work | Apply filter, verify list updates |
| AC-B.4 | Sort works | Change sort, verify order |
| AC-B.5 | Item expands on click | Click item, verify expanded view |
| AC-B.6 | Real-time updates | Create item elsewhere, verify appears |
| AC-B.7 | Empty state shows | Clear all items, verify message |

---

## Part C: Response Forms

### Goal

Build the response form components for each attention type (approval, information, review, etc.).

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `components/attention/ApprovalForm.tsx` | Create | Approval | ~100 |
| `components/attention/InformationForm.tsx` | Create | Info form | ~150 |
| `components/attention/ReviewForm.tsx` | Create | Review | ~120 |
| `components/attention/ConfirmationForm.tsx` | Create | Confirm | ~80 |
| `components/attention/EscalationForm.tsx` | Create | Escalation | ~100 |

### Pseudocode

#### `components/attention/ApprovalForm.tsx`

```
ApprovalForm({ item, onSubmit, isSubmitting })
├── Local state for comments
├── Form container
├── Comments section (if required or optional)
│   ├── Label: "Comments" + required indicator
│   └── Textarea
├── Button row
│   ├── [Reject] button
│   │   ├── Variant: destructive
│   │   └── Disabled if submitting
│   └── [Approve] button
│       ├── Variant: primary
│       └── Disabled if submitting
├── On reject click
│   ├── If comments required on reject, validate
│   └── Call onSubmit({ approved: false, comments })
├── On approve click
│   └── Call onSubmit({ approved: true, comments })
└── Return form element
```

#### `components/attention/InformationForm.tsx`

```
InformationForm({ item, onSubmit, isSubmitting })
├── React Hook Form setup
│   └── Schema from item.inputFields
├── Form container
├── For each field in item.inputFields
│   ├── Render appropriate input by type
│   │   ├── text: Input
│   │   ├── textarea: Textarea
│   │   ├── boolean: Checkbox
│   │   ├── select: Select dropdown
│   │   ├── radio: Radio group
│   │   ├── number: Number input
│   │   ├── date: Date picker
│   │   ├── email: Email input
│   │   └── url: URL input
│   ├── Label with required indicator
│   ├── Placeholder if defined
│   └── Error message if invalid
├── Submit button
│   ├── Label: item.submitLabel or "Submit"
│   └── Disabled if submitting or invalid
├── On submit
│   ├── Validate all fields
│   └── Call onSubmit(formData)
└── Return form element
```

#### `components/attention/ReviewForm.tsx`

```
ReviewForm({ item, onSubmit, isSubmitting })
├── Local state for edits
├── Form container
├── Review fields section
│   ├── For each field in item.reviewFields
│   │   ├── Label
│   │   ├── Current value (from context)
│   │   ├── If editable: input field
│   │   └── If not editable: read-only display
├── Comments section
│   └── Textarea for feedback
├── Button row
│   ├── [Request Changes] button
│   │   └── If there are edits, include them
│   └── [Looks Good] button
│       └── Approve without changes
├── On request changes
│   └── Call onSubmit({ approved: false, edits, comments })
├── On looks good
│   └── Call onSubmit({ approved: true, comments })
└── Return form element
```

#### `components/attention/ConfirmationForm.tsx`

```
ConfirmationForm({ item, onSubmit, isSubmitting })
├── Local state for confirmation input
├── Warning display
│   ├── Icon by warningLevel
│   ├── Action description
│   └── Impact description (if exists)
├── If confirmationType is 'phrase'
│   ├── Instruction: "Type '{confirmPhrase}' to confirm"
│   └── Text input
│       └── Validates against confirmPhrase
├── Button row
│   ├── [Cancel] button
│   └── [Confirm] button
│       └── Disabled if phrase doesn't match
├── On cancel
│   └── Call onSubmit({ confirmed: false })
├── On confirm
│   └── Call onSubmit({ confirmed: true })
└── Return form element
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-C.1 | Approval form submits correctly | Approve, verify workflow resumes |
| AC-C.2 | Rejection with comments works | Reject with comment, verify included |
| AC-C.3 | Information form validates | Submit without required, verify error |
| AC-C.4 | Dynamic fields render correctly | Test each field type |
| AC-C.5 | Review edits submitted | Edit field, submit, verify in response |
| AC-C.6 | Confirmation phrase validates | Type wrong phrase, verify disabled |
| AC-C.7 | Loading state during submit | Submit, verify button disabled |

---

## Part D: Chat Integration

### Goal

Render attention items in agent chat so users can respond without leaving the conversation.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `components/chat/AttentionMessage.tsx` | Create | Chat card | ~150 |
| `components/chat/ChatMessage.tsx` | Modify | Support attention type | ~20 |

### Pseudocode

#### `components/chat/AttentionMessage.tsx`

```
AttentionMessage({ item })
├── Card container (distinct styling)
│   ├── Robot icon + "Attention Needed"
│   └── Border color by type
├── Header
│   ├── Type badge
│   └── Workflow name
├── Title
├── Context preview (condensed)
│   └── First 2-3 context items
├── Collapse/expand for full context
├── Response area
│   ├── If pending
│   │   └── Render appropriate form (condensed)
│   │       ├── approval: two buttons + optional comment
│   │       ├── information: [Provide Details] button
│   │       │   └── Opens modal with full form
│   │       └── etc.
│   ├── If responded
│   │   └── Show response summary
│   │       └── "You approved this on Dec 10"
├── On response
│   ├── Submit via API with channel: 'chat'
│   └── Update message to show response
└── Return element
```

#### Integration with ChatMessage.tsx

```tsx
// In ChatMessage component
function ChatMessage({ message }) {
  // Check if message is attention item
  if (message.type === 'attention') {
    return <AttentionMessage item={message.attentionItem} />;
  }

  // Regular message rendering
  return <RegularMessage {...message} />;
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-D.1 | Attention message renders in chat | Suspend workflow, verify in chat |
| AC-D.2 | Response works from chat | Respond, verify workflow resumes |
| AC-D.3 | Response channel recorded | Respond via chat, verify channel is 'chat' |
| AC-D.4 | Completed items show status | Respond, refresh, verify shows "responded" |

---

## WebSocket Integration

### Events

```typescript
// Client subscribes to
'attention:subscribe' → { userId: string }

// Server emits
'attention:created' → AttentionItem
'attention:updated' → AttentionItem
'attention:removed' → { id: string }
'attention:count' → { count: number }
```

### Client Hook

```typescript
function useAttentionSocket() {
  const store = useAttentionStore();

  useEffect(() => {
    const socket = io('/attention');

    socket.on('attention:created', (item) => {
      store.onItemCreated(item);
    });

    socket.on('attention:updated', (item) => {
      store.onItemUpdated(item);
    });

    socket.on('attention:removed', ({ id }) => {
      store.onItemRemoved(id);
    });

    return () => socket.disconnect();
  }, []);
}
```

---

## Out of Scope

- Native mobile app
- Slack/Teams integration
- Batch responses
- Analytics dashboard
- Custom notification schedules
- Delegation rules

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |

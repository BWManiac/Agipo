# Attention Queue UI

**Status:** Draft
**Priority:** P1
**North Star:** User sees all workflows waiting for their input in one place, can quickly understand what's needed, and respond without losing context — making human-AI collaboration feel effortless.

---

## Problem Statement

When workflows suspend for human input, users need a way to:

1. **Discover** — Know that something needs their attention
2. **Triage** — See all pending items at a glance
3. **Understand** — Know what the workflow needs from them
4. **Respond** — Provide input with minimal friction
5. **Track** — See what they've already handled

**Without this:** Workflows stall indefinitely because users don't know they're waiting, or the friction to respond is too high.

---

## User Value

- **Never miss a request** — All pending items in one unified queue
- **Quick triage** — Priority, age, and type visible at a glance
- **Contextual responses** — See what led to this point before deciding
- **Multiple response paths** — Respond in queue, in chat, or via notification
- **Audit trail** — History of all responses for compliance

---

## Core Concept: The Attention Queue

The **Attention Queue** is a centralized UI where users see all suspended workflows awaiting their input. It's the "inbox" for human-in-the-loop collaboration.

### Key Properties

| Property | Description |
|----------|-------------|
| **Real-time** | New items appear immediately via WebSocket |
| **Filterable** | By workflow, type, priority, age |
| **Actionable** | Respond directly from the queue |
| **Contextual** | See workflow context before responding |
| **Mobile-ready** | Responsive design for on-the-go responses |

---

## User Flows

### Flow 1: Discover Pending Items

```
1. User navigates to Workforce page
2. User sees "Attention Needed" badge with count (e.g., "3")
3. User clicks badge or "Attention" tab
4. Attention Queue opens showing all pending items
5. Items sorted by priority, then by age
6. User scans list to triage
```

### Flow 2: Quick Response from Queue

```
1. User is viewing Attention Queue
2. User clicks on an item
3. Item expands inline (or opens panel)
4. User sees:
   - Workflow name and purpose
   - What step is waiting
   - Context (data from previous steps)
   - What input is needed
5. User provides input (approve/reject, fill form, etc.)
6. User clicks "Submit"
7. Item disappears from queue
8. Workflow resumes in background
9. Success toast confirms
```

### Flow 3: Respond via Chat

```
1. User receives notification "Workflow needs your input"
2. Notification links to specific agent chat
3. User opens chat with agent
4. Agent message shows:
   "I'm running the [Workflow Name] workflow and need your input:

   [Context display]

   [Approval buttons / Form fields]"
5. User responds in chat
6. Agent confirms and continues workflow
7. Chat shows workflow progress
```

### Flow 4: Respond via Notification

```
1. User receives push/email notification
2. Notification shows:
   - Workflow name
   - What's needed (e.g., "Approval required")
   - Quick action buttons (for simple approvals)
3. Option A: User clicks "Approve" directly in notification
   - Single-tap response for mobile
4. Option B: User clicks notification body
   - Opens app to Attention Queue with item focused
5. Workflow resumes after response
```

### Flow 5: Deep Dive Before Responding

```
1. User sees item in Attention Queue
2. Item requires complex decision
3. User clicks "View Details"
4. Full-screen view opens showing:
   - Complete workflow definition (visual)
   - Execution history to this point
   - All context data
   - Related documents/attachments
   - Previous similar decisions (if any)
5. User analyzes information
6. User provides response
7. Returns to queue
```

### Flow 6: Delegate to Someone Else

```
1. User sees item assigned to them
2. User realizes someone else should handle it
3. User clicks "Reassign"
4. User selects new assignee
5. Optional: Add note explaining reassignment
6. Item moves to new assignee's queue
7. Notification sent to new assignee
8. Original user no longer sees item
```

---

## Location: Where Does It Live?

Based on your input, the Attention Queue should be accessible from the **Workforce page**, but also reachable from:

### Primary Location: Workforce Page Tab

```
┌─────────────────────────────────────────────────────────┐
│ Workforce                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [My Agents] [All Agents] [Attention Needed (3)]        │
│                          ↑ Badge shows count            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Secondary Access Points

1. **Global Header Badge** — Persistent indicator across all pages
2. **Agent Chat** — Pending items for that specific agent
3. **Workflow Detail Page** — Status of suspensions in that workflow
4. **Notifications** — Direct links to specific items

---

## Visual Design

### Queue List View

```
┌─────────────────────────────────────────────────────────────────┐
│ Attention Needed                                    Filter ▼    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔸 APPROVAL                                    ⏱️ 2h ago    │ │
│ │ ─────────────────────────────────────────────────────────── │ │
│ │ Expense Report - Q4 Marketing                               │ │
│ │ Workflow: Monthly Expense Processing                        │ │
│ │                                                             │ │
│ │ Amount: $2,450.00  •  Submitted by: Sarah Chen              │ │
│ │                                                             │ │
│ │ "This expense report exceeds $500 and requires manager      │ │
│ │  approval before processing."                               │ │
│ │                                                             │ │
│ │                            [Reject]  [Approve]              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📝 INFO NEEDED                                  ⏱️ 1d ago   │ │
│ │ ─────────────────────────────────────────────────────────── │ │
│ │ Customer Follow-up Details                                  │ │
│ │ Workflow: Lead Qualification                                │ │
│ │                                                             │ │
│ │ Lead: Acme Corp  •  Agent: Sales Assistant                  │ │
│ │                                                             │ │
│ │ "Please provide additional context for the customer         │ │
│ │  follow-up call."                                           │ │
│ │                                                             │ │
│ │                                    [Provide Details →]      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👁️ REVIEW                              ⚠️ URGENT  45m ago   │ │
│ │ ─────────────────────────────────────────────────────────── │ │
│ │ Blog Post Draft                                             │ │
│ │ Workflow: Content Publishing Pipeline                       │ │
│ │                                                             │ │
│ │ "AI has drafted the blog post. Please review before         │ │
│ │  publishing."                                               │ │
│ │                                                             │ │
│ │                       [Request Changes]  [Looks Good]       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Expanded Item View (Inline)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔸 APPROVAL                                        ⏱️ 2h ago    │
│ ─────────────────────────────────────────────────────────────── │
│ Expense Report - Q4 Marketing                                   │
│ Workflow: Monthly Expense Processing                            │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Context                                          [Collapse] │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ Amount:         $2,450.00                                   │ │
│ │ Submitted by:   Sarah Chen                                  │ │
│ │ Department:     Marketing                                   │ │
│ │ Category:       Conference & Events                         │ │
│ │ Date:           December 5, 2024                            │ │
│ │                                                             │ │
│ │ AI Analysis:                                                │ │
│ │ "This expense is 15% above the typical conference budget.   │ │
│ │  The breakdown includes registration ($800), travel ($950), │ │
│ │  and accommodation ($700). All receipts are attached and    │ │
│ │  match the claimed amounts."                                │ │
│ │                                                             │ │
│ │ Attachments:                                                │ │
│ │ 📎 receipts.pdf  📎 itinerary.pdf                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Your Response                                               │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │                                                             │ │
│ │ Comments (optional):                                        │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │                                                         │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │                                                             │ │
│ │            [Cancel]  [Reject with Reason]  [Approve]        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ─────────────────────────────────────────────────────────────── │
│ [View Workflow ↗]  [View Execution History]  [Reassign →]      │
└─────────────────────────────────────────────────────────────────┘
```

### Information Request Form

```
┌─────────────────────────────────────────────────────────────────┐
│ 📝 INFO NEEDED                                      ⏱️ 1d ago   │
│ ─────────────────────────────────────────────────────────────── │
│ Customer Follow-up Details                                      │
│ Workflow: Lead Qualification                                    │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Context                                                     │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ Lead: Acme Corp                                             │ │
│ │ Contact: John Smith (john@acme.com)                         │ │
│ │ Source: Website Demo Request                                │ │
│ │ Last Touch: December 8, 2024 (Demo call)                    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Please Provide                                              │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │                                                             │ │
│ │ Call Summary *                                              │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ Discussed pricing for Enterprise tier. They're          │ │ │
│ │ │ comparing us with Competitor X...                       │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │                                                             │ │
│ │ Next Steps *                                                │ │
│ │ [Schedule follow-up ▼]                                      │ │
│ │                                                             │ │
│ │ Priority Level                                              │ │
│ │ ○ Low  ◉ Medium  ○ High  ○ Urgent                          │ │
│ │                                                             │ │
│ │ Additional Notes                                            │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │                                                         │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │                                                             │ │
│ │                              [Cancel]  [Submit]             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### In-Chat Response

```
┌─────────────────────────────────────────────────────────────────┐
│ Sales Assistant                                      [Agent] 🤖 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🤖 I'm running the "Lead Qualification" workflow and need  │ │
│ │    your input to continue.                                 │ │
│ │                                                             │ │
│ │ ┌───────────────────────────────────────────────────────┐   │ │
│ │ │ 📝 Customer Follow-up Details                         │   │ │
│ │ ├───────────────────────────────────────────────────────┤   │ │
│ │ │                                                       │   │ │
│ │ │ Lead: Acme Corp                                       │   │ │
│ │ │ Contact: John Smith                                   │   │ │
│ │ │                                                       │   │ │
│ │ │ Please provide:                                       │   │ │
│ │ │ • Call Summary                                        │   │ │
│ │ │ • Next Steps                                          │   │ │
│ │ │ • Priority Level                                      │   │ │
│ │ │                                                       │   │ │
│ │ │                    [Provide Details]                  │   │ │
│ │ └───────────────────────────────────────────────────────┘   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Type a message...                                      [↑]  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Filtering & Sorting

### Filter Options

| Filter | Options |
|--------|---------|
| Type | All, Approvals, Info Requests, Reviews, Escalations, Confirmations |
| Priority | All, Urgent, High, Normal, Low |
| Workflow | [Dropdown of user's workflows] |
| Agent | [Dropdown of user's agents] |
| Age | All, < 1 hour, < 1 day, < 1 week, Overdue |
| Assigned | Mine, Delegated to me, All (for managers) |

### Sort Options

| Sort | Description |
|------|-------------|
| Priority (default) | Urgent → Low, then by age |
| Newest first | Most recent at top |
| Oldest first | Oldest at top |
| Workflow | Grouped by workflow |
| Type | Grouped by request type |

---

## Notifications

### Notification Triggers

| Event | In-App | Email | Push |
|-------|--------|-------|------|
| New item assigned | ✅ | ⚙️ | ⚙️ |
| Reminder (timeout approaching) | ✅ | ⚙️ | ⚙️ |
| Escalation received | ✅ | ✅ | ✅ |
| Item reassigned to you | ✅ | ⚙️ | ⚙️ |

(⚙️ = User configurable)

### Notification Content

```
IN-APP:
"Approval needed: Expense Report - Q4 Marketing"
[Workflow: Monthly Expense Processing]
[2 hours ago]

EMAIL:
Subject: [Agipo] Approval Required: Expense Report - Q4 Marketing

Hi [Name],

A workflow is waiting for your approval:

Expense Report - Q4 Marketing
Workflow: Monthly Expense Processing
Amount: $2,450.00

[Approve] [Reject] [View Details]

---
You're receiving this because you're assigned to this workflow step.
Manage notification preferences: [Settings]
```

---

## Code Areas

| Area | Purpose | Key Files |
|------|---------|-----------|
| `app/(pages)/workforce/` | Workforce page | Add Attention tab |
| `app/(pages)/workforce/attention/` | Attention Queue | New page |
| `components/attention/` | Queue components | Reusable |
| `lib/attention/` | Attention service | CRUD operations |
| `app/api/attention/` | Attention API | REST endpoints |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary location | Workforce page tab | Contextual to agent work |
| Response style | Inline expansion | Minimize context switches |
| Real-time updates | WebSocket | Instant updates, good UX |
| Mobile approach | Responsive, not separate app | Maintain feature parity |
| History retention | 30 days | Balance storage and audit needs |

---

## Architecture

### Data Model

```typescript
interface AttentionItem {
  id: string;

  // Source
  workflowId: string;
  workflowName: string;
  runId: string;
  stepId: string;
  stepName: string;
  agentId: string;
  agentName: string;

  // Type
  type: 'approval' | 'information' | 'review' | 'escalation' | 'confirmation';

  // Display
  title: string;
  reason: string;
  context: ContextItem[];
  inputFields?: InputFieldDefinition[];

  // Assignment
  assignedTo: string[];          // User IDs
  assignedBy?: string;           // For delegations
  assignmentNote?: string;

  // Status
  status: 'pending' | 'responded' | 'expired' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';

  // Timing
  createdAt: Date;
  respondedAt?: Date;
  expiresAt?: Date;
  lastReminderAt?: Date;

  // Response
  response?: AttentionResponse;

  // Audit
  history: AttentionHistoryEntry[];
}

interface ContextItem {
  label: string;
  value: any;
  format: 'text' | 'currency' | 'date' | 'json' | 'markdown' | 'link';
}

interface InputFieldDefinition {
  name: string;
  label: string;
  type: InputFieldType;
  required: boolean;
  options?: SelectOption[];
  validation?: ValidationRule;
  defaultValue?: any;
}

interface AttentionResponse {
  data: Record<string, any>;
  respondedBy: string;
  respondedAt: Date;
  responseChannel: 'queue' | 'chat' | 'notification' | 'api';
}

interface AttentionHistoryEntry {
  timestamp: Date;
  action: 'created' | 'viewed' | 'reassigned' | 'reminded' | 'escalated' | 'responded' | 'expired' | 'cancelled';
  userId?: string;
  details?: Record<string, any>;
}
```

### API Endpoints

```
GET    /api/attention              # List items for current user
GET    /api/attention/:id          # Get single item
POST   /api/attention/:id/respond  # Submit response
POST   /api/attention/:id/reassign # Reassign to someone else
POST   /api/attention/:id/snooze   # Snooze reminders
DELETE /api/attention/:id          # Cancel (workflow owner only)

# WebSocket
WS     /api/attention/subscribe    # Real-time updates
```

### State Management

```typescript
interface AttentionSliceState {
  items: AttentionItem[];
  isLoading: boolean;
  error: string | null;

  // Filters
  filters: {
    type: string | null;
    priority: string | null;
    workflowId: string | null;
    agentId: string | null;
    age: string | null;
  };

  // Sort
  sortBy: 'priority' | 'newest' | 'oldest' | 'workflow' | 'type';

  // UI
  expandedItemId: string | null;
  selectedItemId: string | null;
}

actions:
  fetchItems()
  setFilter(key, value)
  setSortBy(sort)
  expandItem(id)
  collapseItem()
  selectItem(id)
  respondToItem(id, response)
  reassignItem(id, assignee, note)
  snoozeItem(id, until)
  cancelItem(id)

  // WebSocket
  onItemCreated(item)
  onItemUpdated(item)
  onItemRemoved(id)
```

---

## Constraints

- **Performance** — Queue must load quickly even with many items
- **Real-time** — Updates must appear within 1 second
- **Mobile** — Full functionality on mobile browsers
- **Offline** — Graceful degradation when offline
- **Security** — Users only see items assigned to them

---

## Success Criteria

- [ ] Attention badge shows on Workforce page with correct count
- [ ] Queue loads items for current user
- [ ] Filters work correctly
- [ ] Sorting works correctly
- [ ] Inline expansion shows full context
- [ ] Approval response works
- [ ] Information form submission works
- [ ] Reassignment works
- [ ] Real-time updates via WebSocket
- [ ] In-chat response displays correctly
- [ ] Notifications sent on new item
- [ ] History recorded for audit

---

## Out of Scope

- Slack/Teams integration
- Mobile app (native)
- Batch responses (respond to multiple at once)
- Analytics dashboard (response times, etc.)
- Custom notification schedules
- Approval delegation rules (auto-delegate)

---

## Dependencies

- **Human-in-the-Loop Nodes** (doc 18) — Creates the items
- **Notification System** — Alerts users
- **Agent Chat** — In-chat response rendering
- **WebSocket Infrastructure** — Real-time updates

---

## Open Questions

- Should managers see their team's queue?
- How do we handle items for users who are on vacation?
- Should we support "@mentions" in comments to loop in others?
- How long should completed items remain visible?
- Should we integrate with external ticketing systems?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Queue list | Main view | Multiple item types |
| Expanded item | Inline detail | Context + response |
| Approval form | Response UI | Approve/reject + comments |
| Information form | Response UI | Dynamic fields |
| Filter panel | Filtering | All filter options |
| Empty state | No items | Encouraging message |
| Chat integration | In-chat display | Message with response buttons |
| Mobile queue | Responsive | Touch-friendly |

### Mockup Location

```
_docs/UXD/Pages/workforce/
├── attention/
│   ├── queue-list.html
│   ├── expanded-item.html
│   ├── approval-form.html
│   ├── information-form.html
│   ├── filter-panel.html
│   ├── empty-state.html
│   └── mobile-queue.html
```

---

## References

- GitHub Issues/PRs review queue
- Linear inbox
- Notion notifications
- Slack "Later" and "Saved" items
- Salesforce approval queues

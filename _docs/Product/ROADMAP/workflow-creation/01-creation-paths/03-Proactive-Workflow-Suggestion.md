# Proactive Workflow Suggestion

**Status:** Draft
**Priority:** P2
**North Star:** System notices user receives job posting links in Slack daily, suggests creating an automated application workflow before user asks.

---

## Problem Statement

Users don't know what they don't know. They may not realize a repetitive task could be automated, or they might not think to describe it to the system. Currently:

1. Users must initiate workflow creation
2. Users must recognize patterns in their own behavior
3. Users must articulate automation opportunities

This is reactive—the system waits for users to act. But the system has access to rich signals about user behavior through connected integrations.

**The Gap:** No mechanism for the system to observe user patterns and proactively suggest automations.

---

## User Value

- **Discover automations you didn't know you needed** — System finds patterns you missed
- **Save time recognizing patterns** — AI notices repetitive tasks
- **Learn what's possible** — Suggestions teach users about automation capabilities
- **Reduce cognitive load** — Don't need to remember to create workflows
- **Continuous improvement** — System gets better at suggestions over time

---

## User Flows

### Flow 1: Communication Pattern Detection

```
1. User has connected Gmail and Slack integrations
2. System observes (with permission) incoming messages
3. System detects pattern:
   - User receives job posting links in Slack channel
   - User copies link to browser
   - User reads posting
   - User saves to spreadsheet/notes
4. System generates suggestion:
   "I noticed you receive job postings in #job-board and save them
    for later review. Would you like me to create a workflow that
    automatically extracts key details and adds them to your
    Applications tracker?"
5. User sees suggestion in dashboard/notification
6. User clicks "Create Workflow"
7. System generates workflow based on observed pattern
8. User reviews and activates
```

### Flow 2: Calendar Pattern Detection

```
1. User has connected Google Calendar
2. System observes meeting patterns:
   - Weekly 1:1 with manager
   - User creates notes document before meeting
   - User sends summary email after meeting
3. System suggests:
   "You have a recurring 1:1 with Alex Chen. Would you like
    a workflow that automatically creates a meeting notes doc
    and reminds you to send a summary afterward?"
4. User accepts suggestion
5. Workflow runs automatically before/after meetings
```

### Flow 3: Data Entry Pattern Detection

```
1. User has connected Airtable and Gmail
2. System observes:
   - User receives invoices by email
   - User manually enters invoice data into Airtable
   - Entries follow consistent pattern
3. System suggests:
   "I noticed you manually enter invoice data from emails into
    your Expenses table. Want me to create a workflow that
    extracts invoice details automatically?"
4. User accepts
5. Workflow monitors inbox and auto-populates table
```

### Flow 4: Workflow Enhancement Suggestion

```
1. User has existing workflow for job applications
2. System observes workflow runs:
   - Some applications fail on CAPTCHA
   - User manually retries failed applications
3. System suggests:
   "Your job application workflow fails ~20% of the time on
    CAPTCHAs. Would you like me to add a notification step
    for manual intervention when this happens?"
4. User accepts
5. Workflow updated with conditional notification
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/connections/` | Integration connections | OAuth, data access |
| `app/api/workflows/` | Workflow system | Execution logs, patterns |
| `lib/mastra/` | Agent infrastructure | Message handling |
| `app/(pages)/home/` | Dashboard | Suggestion display |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data access model | User-permissioned observation | Privacy-first, explicit consent |
| Pattern detection | Batch analysis (daily) | Less intrusive than real-time |
| Suggestion delivery | Dashboard + optional notification | Non-interruptive |
| Pattern scope | Connected integrations only | Only what user has authorized |
| Learning approach | Per-user patterns first | Simpler than cross-user |

---

## Architecture

### Pattern Detection Pipeline

```
Connected Integrations (Gmail, Slack, Calendar, etc.)
         ↓
┌─────────────────────────────────────────┐
│         Data Collection Layer           │
│  - Scheduled pulls from integrations    │
│  - Event summaries (not raw content)    │
│  - Metadata extraction                  │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Pattern Analysis                │
│  - Temporal patterns (daily, weekly)    │
│  - Sequence patterns (A then B then C)  │
│  - Entity patterns (same sender/type)   │
│  - Action patterns (save, forward, etc) │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Opportunity Identification      │
│  - Match patterns to workflow templates │
│  - Calculate automation potential       │
│  - Estimate time savings                │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Suggestion Generation           │
│  - Generate natural language suggestion │
│  - Create draft workflow                │
│  - Include confidence score             │
└─────────────────────────────────────────┘
         ↓
User Dashboard / Notifications
```

### Data Sources to Analyze

| Integration | Observable Signals | Pattern Examples |
|-------------|-------------------|------------------|
| **Gmail** | Incoming emails, labels, replies | Forwarding patterns, save-to patterns |
| **Slack** | Channel messages, reactions, threads | Link sharing, regular updates |
| **Calendar** | Events, recurring meetings, RSVPs | Pre/post meeting activities |
| **GitHub** | Issues, PRs, notifications | Triage patterns, review cadence |
| **Jira** | Tickets, status changes, assignments | Workflow transitions, reporting |
| **Notion/Docs** | Document creation, templates used | Content creation patterns |
| **Airtable** | Record creation, field patterns | Data entry routines |

### Privacy-First Design

```
User Consent Flow:
1. User connects integration
2. System asks: "Can I analyze patterns to suggest automations?"
3. User can:
   - Allow full observation
   - Allow metadata only (no content)
   - Disable suggestions for this integration
4. Preference stored per integration
5. User can view what's being observed
6. User can delete observation history

Data Handling:
- Store patterns, not raw data
- Delete raw data after pattern extraction
- Never share patterns across users
- Clear retention policies (30 days default)
```

### Pattern Types

```typescript
interface DetectedPattern {
  id: string;
  type: PatternType;
  confidence: number;       // 0-1
  frequency: FrequencyData;
  integrations: string[];
  description: string;
  automationPotential: number;  // estimated time savings
}

type PatternType =
  | 'temporal'      // Happens at regular intervals
  | 'sequential'    // A followed by B followed by C
  | 'trigger'       // When X happens, user does Y
  | 'aggregation'   // Collecting items over time
  | 'transformation'; // Converting data from A to B

interface FrequencyData {
  count: number;
  period: 'daily' | 'weekly' | 'monthly';
  lastOccurrence: Date;
  trend: 'increasing' | 'stable' | 'decreasing';
}
```

---

## Constraints

- **User privacy** — Must be explicitly permissioned, transparent
- **API rate limits** — Integration APIs have usage limits
- **Storage costs** — Pattern storage must be efficient
- **False positives** — Suggestions should be high confidence
- **Integration availability** — Only works with connected integrations
- **Pattern complexity** — Start with simple patterns, avoid over-fitting

---

## Success Criteria

- [ ] User can enable/disable proactive suggestions per integration
- [ ] System detects at least 3 pattern types (temporal, trigger, sequential)
- [ ] Suggestions include clear description and value proposition
- [ ] User can dismiss suggestions permanently
- [ ] Accepted suggestions generate valid workflows
- [ ] Suggestions have >70% acceptance rate (quality threshold)
- [ ] User can view observation history and delete it

---

## Out of Scope

- Real-time pattern detection (batch only for MVP)
- Cross-user pattern learning
- Voice-based suggestions
- Mobile push notifications
- Calendar scheduling of suggestions
- A/B testing suggestion copy

---

## Open Questions

- How do we handle patterns that span multiple integrations?
- What's the minimum pattern frequency to suggest (2x? 5x? 10x?)
- Should we show "low confidence" suggestions or wait?
- How do we handle seasonal patterns (monthly reports, quarterly reviews)?
- Can we learn from dismissed suggestions?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Consent Flow | Permission request | What's observed, privacy controls |
| Suggestion Card | Individual suggestion | Pattern description, action buttons |
| Suggestions Dashboard | All suggestions | List, filters, bulk actions |
| Observation History | Transparency view | What's been observed, delete option |
| Generated Workflow | Pre-built workflow | Review before activation |

### Mockup Location

```
_docs/UXD/Pages/
├── proactive-suggestions/
│   ├── consent-flow.html
│   ├── suggestion-card.html
│   ├── suggestions-dashboard.html
│   ├── observation-history.html
│   └── generated-workflow.html
```

---

## References

- Privacy patterns: Apple's App Privacy Report
- Suggestion UX: Google's Smart Compose, Smart Reply
- Pattern detection: Time series analysis, sequence mining
- Composio integrations: `app/api/connections/`

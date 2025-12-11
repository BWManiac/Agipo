# Task: Proactive Workflow Suggestion

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/01-creation-paths/03-Proactive-Workflow-Suggestion.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Validation

### Approach Validation

**✅ Technical Approach:**
- Composio OAuth integration provides secure access to user data
- Pattern detection on metadata preserves privacy while enabling analysis
- ML-based pattern recognition feasible with activity summaries

**✅ Architecture Decisions:**
- Explicit user consent for observation builds trust
- Background processing prevents UI blocking during analysis
- Integration with existing workflow generation infrastructure

**✅ Integration Points:**
- Composio tools provide standardized data access across integrations
- Workflow generation services ready for suggestion-driven input
- Notification system can surface suggestions appropriately

### Current State Analysis

**Existing Infrastructure:**
- Connected integrations managed through Composio OAuth
- Workflow generation infrastructure from natural language feature
- User activity tracking in workforce and chat interfaces

**Missing Components:**
- No pattern detection or analysis system
- No consent management for observation
- No suggestion delivery and management interface

### Deterministic Decisions

**Privacy:**
- Explicit opt-in consent required for observation
- Process metadata summaries, not full content
- User can disable suggestions at any time

**Pattern Detection:**
- Focus on temporal patterns and repeated action sequences
- High-confidence thresholds to avoid noise
- Weekly analysis cycles to identify workflows

**Storage:**
- Observation data: Encrypted, time-limited storage
- Detected patterns: Structured summaries only
- User preferences: Persistent consent settings

---

## Overview

### Goal

Build a system that analyzes user activity across connected integrations (Gmail, Slack, Calendar, etc.), detects repetitive patterns, and proactively suggests workflows that could automate those patterns. Users consent to observation, receive high-quality suggestions, and can accept to generate ready-to-use workflows.

### Relevant Research

Connected integrations are managed through Composio, which provides OAuth-based access to user data. The key challenge is respectfully observing user behavior without being invasive, then translating patterns into actionable workflow suggestions.

Key considerations:
- Composio provides `tools.execute()` for reading integration data
- Pattern detection should work on metadata/summaries, not raw content
- Suggestions should be high-confidence to avoid alert fatigue
- Workflow generation reuses existing generation infrastructure

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/suggestions/types/patterns.ts` | Create | Pattern and suggestion types | A |
| `app/api/suggestions/types/observation.ts` | Create | Observation consent and data types | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/suggestions/consent/route.ts` | Create | Manage observation consent | A |
| `app/api/suggestions/patterns/route.ts` | Create | Get detected patterns | A |
| `app/api/suggestions/accept/route.ts` | Create | Accept and generate workflow | A |
| `app/api/suggestions/dismiss/route.ts` | Create | Dismiss suggestion | A |
| `app/api/suggestions/history/route.ts` | Create | Observation history | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/suggestions/services/observation-collector.ts` | Create | Collect integration data | A |
| `app/api/suggestions/services/pattern-detector.ts` | Create | Detect patterns in data | A |
| `app/api/suggestions/services/suggestion-generator.ts` | Create | Generate suggestions | A |
| `app/api/suggestions/services/scheduler.ts` | Create | Schedule pattern analysis | A |

### Backend / Jobs

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/cron/analyze-patterns/route.ts` | Create | Daily pattern analysis job | A |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/home/store/slices/suggestions-slice.ts` | Create | Suggestions state | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/home/components/SuggestionCard.tsx` | Create | Individual suggestion | B |
| `app/(pages)/home/components/SuggestionsList.tsx` | Create | List of suggestions | B |
| `app/(pages)/profile/components/ObservationConsent.tsx` | Create | Consent management | B |
| `app/(pages)/profile/components/ObservationHistory.tsx` | Create | History view | B |

---

## Part A: Backend Pattern Detection System

### Goal

Build the infrastructure for collecting integration activity, detecting patterns, and generating workflow suggestions.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/suggestions/types/patterns.ts` | Create | Type definitions | ~120 |
| `app/api/suggestions/types/observation.ts` | Create | Observation types | ~60 |
| `app/api/suggestions/consent/route.ts` | Create | Consent endpoint | ~80 |
| `app/api/suggestions/patterns/route.ts` | Create | Patterns endpoint | ~60 |
| `app/api/suggestions/services/observation-collector.ts` | Create | Data collection | ~250 |
| `app/api/suggestions/services/pattern-detector.ts` | Create | Pattern detection | ~300 |
| `app/api/suggestions/services/suggestion-generator.ts` | Create | Suggestion gen | ~200 |
| `app/api/cron/analyze-patterns/route.ts` | Create | Cron job | ~100 |

### Pseudocode

#### `app/api/suggestions/types/patterns.ts`

```typescript
interface ObservationConsent {
  userId: string;
  integrations: {
    [integrationId: string]: {
      enabled: boolean;
      level: 'full' | 'metadata' | 'disabled';
      consentedAt: Date;
    };
  };
  globalEnabled: boolean;
}

interface ActivitySummary {
  integrationId: string;
  type: ActivityType;
  timestamp: Date;
  metadata: {
    category?: string;      // email type, message channel, etc.
    entities?: string[];    // people, companies involved (anonymized)
    action?: string;        // send, receive, create, update
    frequency?: number;     // if part of pattern
  };
  // NO raw content stored
}

type ActivityType =
  | 'email_received'
  | 'email_sent'
  | 'message_received'
  | 'message_sent'
  | 'calendar_event'
  | 'document_created'
  | 'record_added'
  | 'issue_created'
  | 'issue_updated';

interface DetectedPattern {
  id: string;
  userId: string;
  type: PatternType;
  integrations: string[];
  description: string;
  frequency: {
    count: number;
    period: 'daily' | 'weekly' | 'monthly';
    lastSeen: Date;
  };
  confidence: number;       // 0-1
  automationPotential: {
    estimatedTimeSavings: number;  // minutes per occurrence
    complexity: 'low' | 'medium' | 'high';
  };
  status: 'active' | 'dismissed' | 'accepted';
  detectedAt: Date;
}

interface Suggestion {
  id: string;
  patternId: string;
  title: string;
  description: string;
  valueProposition: string;
  draftWorkflow: WorkflowDefinition;
  status: 'pending' | 'accepted' | 'dismissed';
  createdAt: Date;
}
```

#### `app/api/suggestions/services/observation-collector.ts`

```
class ObservationCollector {
  async collectForUser(userId: string): Promise<ActivitySummary[]>
  ├── Get user's observation consent settings
  ├── For each enabled integration
  │   ├── Get connection from Composio
  │   ├── Call appropriate collection method
  │   └── Transform to ActivitySummary (strip PII)
  └── Return combined summaries

  async collectGmailActivity(connectionId: string, since: Date): Promise<ActivitySummary[]>
  ├── Call GMAIL_LIST_EMAILS with date filter
  ├── For each email (metadata only)
  │   ├── Extract: sender domain, labels, thread length
  │   ├── Detect category: newsletter, job posting, invoice, etc.
  │   └── Create ActivitySummary
  └── Return summaries (no body content)

  async collectSlackActivity(connectionId: string, since: Date): Promise<ActivitySummary[]>
  ├── Call SLACK_LIST_MESSAGES for subscribed channels
  ├── For each message
  │   ├── Extract: channel, has_links, has_attachments
  │   ├── Detect if mentions user
  │   └── Create ActivitySummary
  └── Return summaries

  async collectCalendarActivity(connectionId: string, since: Date): Promise<ActivitySummary[]>
  ├── Call GOOGLE_CALENDAR_LIST_EVENTS
  ├── For each event
  │   ├── Extract: title pattern, attendees count, recurring
  │   └── Create ActivitySummary
  └── Return summaries

  // Similar methods for Jira, GitHub, Notion, etc.

  private anonymizeEntity(entity: string): string
  ├── Hash email addresses
  ├── Keep domains for company detection
  └── Return anonymized identifier
}
```

#### `app/api/suggestions/services/pattern-detector.ts`

```
class PatternDetector {
  async detectPatterns(
    activities: ActivitySummary[],
    existingPatterns: DetectedPattern[]
  ): Promise<DetectedPattern[]>
  ├── Group activities by type and integration
  ├── For each group
  │   ├── detectTemporalPatterns(group)
  │   ├── detectSequentialPatterns(group, otherGroups)
  │   ├── detectTriggerPatterns(group, otherGroups)
  │   └── detectAggregationPatterns(group)
  ├── Merge with existing patterns (update frequency)
  ├── Filter by confidence threshold (>0.7)
  └── Return new and updated patterns

  detectTemporalPatterns(activities: ActivitySummary[]): DetectedPattern[]
  ├── Bucket by day of week
  ├── Bucket by time of day
  ├── Look for regular intervals
  │   ├── Daily at similar time
  │   ├── Weekly on same day
  │   └── Monthly on same date
  ├── Calculate confidence based on consistency
  └── Return patterns above threshold

  detectSequentialPatterns(
    activities: ActivitySummary[],
    otherActivities: ActivitySummary[]
  ): DetectedPattern[]
  ├── Sort all activities by timestamp
  ├── Look for A → B sequences within time window
  │   ├── Email received → Document created
  │   ├── Message received → Calendar event created
  │   └── Issue created → Email sent
  ├── Count sequence occurrences
  ├── Calculate confidence
  └── Return patterns

  detectTriggerPatterns(
    activities: ActivitySummary[],
    otherActivities: ActivitySummary[]
  ): DetectedPattern[]
  ├── Look for cause-effect relationships
  │   ├── Email from X → always reply
  │   ├── Message in channel → always forward
  │   └── Calendar reminder → always create doc
  ├── Use correlation analysis
  └── Return high-confidence triggers

  detectAggregationPatterns(activities: ActivitySummary[]): DetectedPattern[]
  ├── Look for batching behavior
  │   ├── Multiple similar emails → single summary
  │   ├── Multiple messages → aggregated action
  │   └── Multiple records → periodic report
  └── Return patterns

  private calculateConfidence(
    occurrences: number,
    totalOpportunities: number,
    consistency: number
  ): number
  ├── Base: occurrences / opportunities
  ├── Adjust for consistency (std dev of timing)
  ├── Boost for recent activity
  └── Return 0-1 score
}
```

#### `app/api/suggestions/services/suggestion-generator.ts`

```
class SuggestionGenerator {
  async generateSuggestion(pattern: DetectedPattern): Promise<Suggestion>
  ├── Map pattern type to workflow template
  │   ├── temporal → scheduled workflow
  │   ├── sequential → multi-step workflow
  │   ├── trigger → event-driven workflow
  │   └── aggregation → batch processing workflow
  ├── Call LLM to generate suggestion copy
  │   ├── Title: concise action phrase
  │   ├── Description: what the workflow does
  │   └── Value prop: time saved, errors prevented
  ├── Generate draft workflow
  │   ├── Use workflow generator service
  │   ├── Base on pattern's integration and actions
  │   └── Parameterize for flexibility
  └── Return Suggestion with draft

  private generateSuggestionCopy(pattern: DetectedPattern): SuggestionCopy
  ├── Build prompt with pattern details
  ├── Call LLM with structured output
  │   ├── Title: <10 words, action-oriented
  │   ├── Description: <50 words, clear steps
  │   ├── Value: time savings, specific benefits
  └── Return generated copy

  private mapPatternToWorkflow(pattern: DetectedPattern): WorkflowDefinition
  ├── For temporal patterns
  │   └── Trigger: schedule, Steps: observed actions
  ├── For sequential patterns
  │   └── Trigger: first event, Steps: subsequent actions
  ├── For trigger patterns
  │   └── Trigger: cause event, Steps: effect actions
  ├── For aggregation patterns
  │   └── Trigger: schedule, Steps: collect + aggregate
  └── Return draft workflow
}
```

#### `app/api/cron/analyze-patterns/route.ts`

```
POST /api/cron/analyze-patterns (Vercel Cron)
├── Authenticate cron secret
├── Get all users with observation enabled
├── For each user (batched)
│   ├── Collect recent activity (last 24 hours)
│   ├── Get existing patterns
│   ├── Detect new/updated patterns
│   ├── Generate suggestions for new patterns
│   ├── Store patterns and suggestions
│   └── Optionally notify user of new suggestions
├── Log metrics (patterns found, suggestions generated)
└── Return success
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Consent can be set per integration | Set Gmail to metadata-only, verify respected |
| AC-A.2 | Activity collected respects consent | Disabled integration returns no activity |
| AC-A.3 | Temporal patterns detected | Create daily email pattern, verify detection |
| AC-A.4 | Sequential patterns detected | Create email→doc pattern, verify detection |
| AC-A.5 | Suggestions generated | Pattern detected, verify suggestion created |
| AC-A.6 | Draft workflow is valid | Accept suggestion, verify workflow transpiles |

---

## Part B: Frontend Suggestions UI

### Goal

Create the user interface for managing observation consent, viewing suggestions, and accepting/dismissing them.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/home/store/slices/suggestions-slice.ts` | Create | State management | ~80 |
| `app/(pages)/home/components/SuggestionCard.tsx` | Create | Suggestion card | ~120 |
| `app/(pages)/home/components/SuggestionsList.tsx` | Create | Suggestions list | ~80 |
| `app/(pages)/profile/components/ObservationConsent.tsx` | Create | Consent UI | ~150 |
| `app/(pages)/profile/components/ObservationHistory.tsx` | Create | History view | ~100 |

### Pseudocode

#### `app/(pages)/home/components/SuggestionCard.tsx`

```
SuggestionCard({ suggestion })
├── Card container with subtle highlight
├── Header
│   ├── Integration icons (what's involved)
│   ├── "Suggested for you" badge
│   └── Dismiss button (X)
├── Body
│   ├── Title: suggestion.title
│   ├── Description: suggestion.description
│   └── Value prop with estimated time savings
├── Pattern info (collapsible)
│   ├── "Based on: {pattern.description}"
│   ├── Frequency: "{count} times per {period}"
│   └── Confidence indicator (subtle)
├── Actions
│   ├── "Create Workflow" button (primary)
│   ├── "Preview" button (secondary)
│   └── "Not useful" link (dismisses with feedback)
└── On accept
    ├── Call POST /api/suggestions/accept
    ├── Navigate to workflow editor with draft
    └── Show success toast
```

#### `app/(pages)/profile/components/ObservationConsent.tsx`

```
ObservationConsent()
├── Section header: "Proactive Suggestions"
├── Global toggle
│   ├── "Allow Agipo to analyze activity and suggest workflows"
│   └── Description of what this means
├── Per-integration settings (if global enabled)
│   ├── For each connected integration
│   │   ├── Integration icon and name
│   │   ├── Dropdown: Full / Metadata only / Disabled
│   │   └── Last analyzed date
│   └── "Connect more integrations" link
├── Privacy info
│   ├── "What we observe" expandable
│   ├── "What we don't observe" expandable
│   └── "Data retention: 30 days" note
└── Save button

onChange:
├── Call PUT /api/suggestions/consent
├── Show confirmation
└── If disabled, offer to clear history
```

#### `app/(pages)/profile/components/ObservationHistory.tsx`

```
ObservationHistory()
├── Section header: "Observation History"
├── Date range filter
├── Activity list (paginated)
│   ├── For each ActivitySummary
│   │   ├── Integration icon
│   │   ├── Activity type badge
│   │   ├── Anonymized description
│   │   └── Timestamp
│   └── "Load more" pagination
├── Detected patterns section
│   ├── For each pattern
│   │   ├── Pattern description
│   │   ├── Confidence score
│   │   └── Status (active/dismissed/accepted)
├── Actions
│   ├── "Clear last 7 days" button
│   └── "Clear all history" button (with confirmation)
└── Empty state if no history
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Suggestions appear on dashboard | Pattern detected, verify card shows |
| AC-B.2 | Accept creates workflow | Click accept, verify workflow created |
| AC-B.3 | Dismiss removes suggestion | Click dismiss, verify removed |
| AC-B.4 | Consent controls work | Toggle integration off, verify no collection |
| AC-B.5 | History shows activity | After collection, verify history populated |
| AC-B.6 | Clear history works | Click clear, verify data deleted |

---

## User Flows

### Flow 1: Initial Consent

```
1. User connects Gmail integration
2. System shows consent prompt
3. User enables proactive suggestions for Gmail
4. Consent stored in database
5. Next cron run collects Gmail activity
6. Patterns detected over 7 days
7. Suggestion appears on dashboard
```

### Flow 2: Accept Suggestion

```
1. User sees suggestion on dashboard
2. User clicks "Create Workflow"
3. POST /api/suggestions/accept called
4. Suggestion status updated to 'accepted'
5. Draft workflow created in _tables/workflows/
6. User redirected to workflow editor
7. Workflow pre-populated, user can customize
```

---

## Out of Scope

- Real-time pattern detection
- Cross-user learning
- Mobile push notifications
- Suggestion scheduling
- Pattern explanation UI (why this pattern)

---

## Open Questions

- [ ] How do we handle users who never dismiss or accept?
- [ ] Should suggestions expire after N days?
- [ ] How do we measure suggestion quality?
- [ ] Can we suggest improvements to existing workflows?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |

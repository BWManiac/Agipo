# Task: Screen Recording to Workflow

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/01-creation-paths/02-Screen-Recording-to-Workflow.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Validation

### Approach Validation

**✅ Technical Approach:**
- Anchor browser session management established in browser-automation system
- DOM event capture proven viable with JavaScript injection
- Workflow JSON generation pattern exists from natural language feature

**✅ Architecture Decisions:**
- Anchor provides isolated browser sessions for reliable recording
- Event-driven communication pattern established for real-time updates
- LLM processing for transforming raw events into semantic actions

**✅ Integration Points:**
- Browser automation infrastructure ready for recording layer
- Workflow generation services can be extended for recording input
- Editor canvas already handles workflow visualization

### Current State Analysis

**Existing Infrastructure:**
- Anchor session creation in `app/api/browser-automation/services/anchor.ts`
- Workflow transpilation system in step-generator
- Browser step patterns established in workflow integration

**Missing Components:**
- No event capture and injection system
- No event processing and action grouping logic
- No recording-to-workflow transformation pipeline

### Deterministic Decisions

**Event Capture:**
- Client-side JavaScript injection for DOM event capture
- Real-time event streaming via REST API (not WebSocket for simplicity)
- Event deduplication and debouncing in frontend

**Storage:**
- Recording sessions: In-memory storage during active recording
- Event stream: Append-only array in session state
- Generated workflows: Standard workflow persistence

**Browser Integration:**
- Use existing Anchor infrastructure
- Inject recording script via browser automation
- New window/iframe for recorded browser session

---

## Overview

### Goal

Implement a recording system that captures user actions in an Anchor browser session, processes those events into a semantic action sequence, and generates a workflow definition with parameterized steps. Users can demonstrate a task once and receive a reusable workflow.

### Relevant Research

The browser automation system already uses Anchor for session management and Stagehand for AI-powered browser control. Recording builds on this foundation by adding event capture and workflow generation. The key insight is that DOM events provide precise action data, which LLM can transform into workflow steps.

Key patterns:
- Anchor session creation in `app/api/browser-automation/services/anchor.ts`
- Workflow JSON structure in `app/api/workflows/types/workflow.ts`
- Step generation in `app/api/workflows/services/step-generator.ts`
- Browser step pattern in `04-Workflow-Integration.md`

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/types/recording.ts` | Create | Recording session and event types | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/recording/start/route.ts` | Create | Start recording session | A |
| `app/api/workflows/recording/stop/route.ts` | Create | Stop and process recording | A |
| `app/api/workflows/recording/events/route.ts` | Create | Receive recorded events | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/recording-session.ts` | Create | Recording session management | A |
| `app/api/workflows/services/event-processor.ts` | Create | Process raw events into actions | A |
| `app/api/workflows/services/recording-to-workflow.ts` | Create | Transform actions to workflow | A |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/store/slices/recording-slice.ts` | Create | Recording state management | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/RecordingControls.tsx` | Create | Start/stop recording UI | B |
| `app/(pages)/workflows/editor/components/RecordingOverlay.tsx` | Create | Recording indicator overlay | B |
| `app/(pages)/workflows/editor/components/EventFeed.tsx` | Create | Live event display | B |
| `app/(pages)/workflows/editor/components/RecordingReview.tsx` | Create | Review generated steps | B |

### Browser Scripts

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `lib/browser/recording-injector.ts` | Create | Script to inject into browser | A |

---

## Part A: Backend Recording System

### Goal

Build the recording infrastructure: session management, event capture, event processing, and workflow generation from recorded actions.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/types/recording.ts` | Create | Type definitions | ~100 |
| `app/api/workflows/recording/start/route.ts` | Create | Start endpoint | ~80 |
| `app/api/workflows/recording/stop/route.ts` | Create | Stop endpoint | ~100 |
| `app/api/workflows/recording/events/route.ts` | Create | Events endpoint | ~60 |
| `app/api/workflows/services/recording-session.ts` | Create | Session management | ~150 |
| `app/api/workflows/services/event-processor.ts` | Create | Event processing | ~200 |
| `app/api/workflows/services/recording-to-workflow.ts` | Create | Workflow generation | ~250 |
| `lib/browser/recording-injector.ts` | Create | Browser script | ~200 |

### Pseudocode

#### `app/api/workflows/types/recording.ts`

```typescript
interface RecordingSession {
  id: string;
  userId: string;
  workflowId?: string;
  status: 'active' | 'processing' | 'complete' | 'failed';
  startedAt: Date;
  endedAt?: Date;
  browserSessionId: string;
  goal?: string;
  events: RecordedEvent[];
}

interface RecordedEvent {
  id: string;
  type: EventType;
  timestamp: number;
  target: EventTarget;
  value?: string;
  pageContext: PageContext;
}

type EventType =
  | 'click'
  | 'dblclick'
  | 'input'
  | 'change'
  | 'submit'
  | 'navigate'
  | 'scroll'
  | 'select'
  | 'focus'
  | 'upload';

interface EventTarget {
  selector: string;
  xpath: string;
  tagName: string;
  id?: string;
  className?: string;
  text?: string;
  placeholder?: string;
  name?: string;
  type?: string;
  role?: string;
  ariaLabel?: string;
  boundingBox: { x: number; y: number; width: number; height: number };
}

interface PageContext {
  url: string;
  title: string;
  timestamp: number;
}

interface ProcessedAction {
  type: ActionType;
  description: string;
  target?: string;
  value?: string;
  selectors: string[];
  isParameterizable: boolean;
  suggestedParameter?: string;
}
```

#### `app/api/workflows/services/recording-session.ts`

```
class RecordingSessionManager {
  private sessions: Map<string, RecordingSession>

  async startSession(userId: string, options: StartOptions): Promise<RecordingSession>
  ├── Create Anchor browser session with recording profile
  ├── Generate session ID
  ├── Initialize session state
  │   ├── status: 'active'
  │   ├── events: []
  │   └── browserSessionId from Anchor
  ├── Inject recording script into browser
  │   └── Script sends events to /api/workflows/recording/events
  ├── Store session in memory (or Redis for scale)
  └── Return session with debugUrl

  async addEvent(sessionId: string, event: RecordedEvent): void
  ├── Validate session exists and is active
  ├── Validate event structure
  ├── Add timestamp if not present
  ├── Dedupe rapid events (debounce)
  └── Append to session events

  async stopSession(sessionId: string): Promise<RecordingSession>
  ├── Validate session exists
  ├── Set status: 'processing'
  ├── Close browser session
  ├── Return session with all events
  └── Begin async processing

  async getSession(sessionId: string): Promise<RecordingSession | null>
  └── Return session from storage
}
```

#### `app/api/workflows/services/event-processor.ts`

```
processEvents(events: RecordedEvent[]): ProcessedAction[]
├── Sort events by timestamp
├── Filter noise events
│   ├── Remove scroll events unless significant
│   ├── Remove focus events without subsequent action
│   └── Remove duplicate navigations
├── Group related events into actions
│   ├── Multiple inputs in same form → single "fill form" action
│   ├── Click + navigation → single "navigate" action
│   └── Select + click → single "select option" action
├── For each grouped action
│   ├── Determine action type
│   ├── Generate description from context
│   ├── Extract best selectors (prefer id, data-*, aria)
│   ├── Identify if value should be parameterizable
│   │   ├── Email addresses → yes
│   │   ├── URLs → yes
│   │   ├── Dates → yes
│   │   └── Constant text → no
│   └── Suggest parameter name if parameterizable
└── Return ordered ProcessedAction[]

groupFormInputs(events: RecordedEvent[]): RecordedEvent[][]
├── Identify form boundaries
├── Group inputs within same form
├── Handle multi-step forms
└── Return groups

generateSelectors(target: EventTarget): string[]
├── Priority order:
│   1. data-testid, data-cy, data-id attributes
│   2. id attribute
│   3. aria-label
│   4. name attribute (for form fields)
│   5. CSS selector (tag + classes)
│   6. XPath (fallback)
└── Return array of selectors, best first
```

#### `app/api/workflows/services/recording-to-workflow.ts`

```
generateWorkflowFromRecording(
  session: RecordingSession,
  actions: ProcessedAction[]
): WorkflowDefinition
├── Build step list from actions
│   ├── For navigate actions → Browser Navigate step
│   ├── For fill form actions → Browser Fill step
│   ├── For click actions → Browser Click step
│   ├── For extract/select actions → Browser Extract step
│   └── For file uploads → Browser Upload step
├── Call LLM to enhance steps
│   ├── Generate meaningful step names
│   ├── Identify step dependencies
│   ├── Detect patterns (loops, conditionals)
│   └── Suggest workflow input schema
├── Build workflow structure
│   ├── Create inputSchema from parameters
│   ├── Create steps with schemas
│   ├── Generate bindings between steps
│   └── Calculate node positions
├── Validate workflow
│   ├── All steps have valid selectors
│   ├── Dependencies are resolvable
│   └── No orphan steps
└── Return WorkflowDefinition

inferWorkflowInputs(actions: ProcessedAction[]): JSONSchema
├── Collect all parameterizable values
├── Infer types from context
│   ├── Email patterns → string format: email
│   ├── URL patterns → string format: uri
│   ├── Date patterns → string format: date
│   └── Other → string
├── Generate required/optional based on action
└── Return input schema

detectPatterns(actions: ProcessedAction[]): Pattern[]
├── Look for repeating action sequences
│   └── Same actions on different items → loop
├── Look for conditional paths
│   └── Actions that sometimes occur → branch
├── Look for pagination patterns
│   └── Click next + repeat → doUntil
└── Return detected patterns with confidence scores
```

#### `lib/browser/recording-injector.ts`

```javascript
// This script is injected into the Anchor browser page

(function initRecording(config) {
  const { sessionId, endpoint } = config;

  const sendEvent = async (event) => {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, event })
    });
  };

  const getTarget = (element) => ({
    selector: generateSelector(element),
    xpath: generateXPath(element),
    tagName: element.tagName.toLowerCase(),
    id: element.id || undefined,
    className: element.className || undefined,
    text: element.innerText?.slice(0, 100) || undefined,
    placeholder: element.placeholder || undefined,
    name: element.name || undefined,
    type: element.type || undefined,
    role: element.getAttribute('role') || undefined,
    ariaLabel: element.getAttribute('aria-label') || undefined,
    boundingBox: element.getBoundingClientRect()
  });

  const getPageContext = () => ({
    url: window.location.href,
    title: document.title,
    timestamp: Date.now()
  });

  // Click events
  document.addEventListener('click', (e) => {
    sendEvent({
      type: 'click',
      timestamp: Date.now(),
      target: getTarget(e.target),
      pageContext: getPageContext()
    });
  }, true);

  // Input events (debounced)
  let inputTimeout;
  document.addEventListener('input', (e) => {
    clearTimeout(inputTimeout);
    inputTimeout = setTimeout(() => {
      sendEvent({
        type: 'input',
        timestamp: Date.now(),
        target: getTarget(e.target),
        value: e.target.value,
        pageContext: getPageContext()
      });
    }, 500);
  }, true);

  // Form submissions
  document.addEventListener('submit', (e) => {
    sendEvent({
      type: 'submit',
      timestamp: Date.now(),
      target: getTarget(e.target),
      pageContext: getPageContext()
    });
  }, true);

  // Navigation (popstate + pushstate)
  const originalPushState = history.pushState;
  history.pushState = function(...args) {
    sendEvent({
      type: 'navigate',
      timestamp: Date.now(),
      pageContext: getPageContext()
    });
    return originalPushState.apply(this, args);
  };

  window.addEventListener('popstate', () => {
    sendEvent({
      type: 'navigate',
      timestamp: Date.now(),
      pageContext: getPageContext()
    });
  });

  // File uploads
  document.addEventListener('change', (e) => {
    if (e.target.type === 'file') {
      sendEvent({
        type: 'upload',
        timestamp: Date.now(),
        target: getTarget(e.target),
        value: Array.from(e.target.files).map(f => f.name).join(', '),
        pageContext: getPageContext()
      });
    }
  }, true);

  // Helper functions
  function generateSelector(el) {
    if (el.id) return `#${el.id}`;
    if (el.dataset.testid) return `[data-testid="${el.dataset.testid}"]`;
    // ... more selector strategies
    return el.tagName.toLowerCase();
  }

  function generateXPath(el) {
    // ... XPath generation logic
  }

  console.log('[Agipo Recording] Active');
})({ sessionId: '{{SESSION_ID}}', endpoint: '{{ENDPOINT}}' });
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Recording session starts | Call /start, verify session created with browserSessionId |
| AC-A.2 | Events are captured | Perform click in browser, verify event received at /events |
| AC-A.3 | Events are processed | Stop recording, verify ProcessedActions generated |
| AC-A.4 | Workflow is generated | Stop recording, verify valid workflow.json structure |
| AC-A.5 | Parameters extracted | Fill email field, verify email becomes workflow input |
| AC-A.6 | Form inputs grouped | Fill 3 form fields, verify single "fill form" step |

---

## Part B: Frontend Recording UI

### Goal

Create the user interface for starting recordings, viewing event capture in real-time, and reviewing/editing generated workflows.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/store/slices/recording-slice.ts` | Create | State management | ~80 |
| `app/(pages)/workflows/editor/components/RecordingControls.tsx` | Create | Start/stop UI | ~120 |
| `app/(pages)/workflows/editor/components/RecordingOverlay.tsx` | Create | Active indicator | ~60 |
| `app/(pages)/workflows/editor/components/EventFeed.tsx` | Create | Event display | ~100 |
| `app/(pages)/workflows/editor/components/RecordingReview.tsx` | Create | Review steps | ~150 |

### Pseudocode

#### `app/(pages)/workflows/editor/store/slices/recording-slice.ts`

```typescript
interface RecordingState {
  sessionId: string | null;
  status: 'idle' | 'recording' | 'processing' | 'reviewing';
  browserUrl: string | null;
  events: RecordedEvent[];
  generatedSteps: ProcessedAction[] | null;
  error: string | null;
}

actions:
  startRecording(goal?: string)
  ├── Call POST /api/workflows/recording/start
  ├── Set sessionId, status: 'recording'
  └── Set browserUrl (debugUrl from Anchor)

  addEvent(event: RecordedEvent)
  └── Append to events array

  stopRecording()
  ├── Call POST /api/workflows/recording/stop
  ├── Set status: 'processing'
  ├── On response: set generatedSteps
  └── Set status: 'reviewing'

  acceptWorkflow()
  ├── Take generatedSteps
  ├── Update workflow store with generated workflow
  └── Reset recording state

  discardRecording()
  └── Reset all recording state
```

#### `app/(pages)/workflows/editor/components/RecordingControls.tsx`

```
RecordingControls()
├── If status === 'idle'
│   ├── "Record Workflow" button
│   └── Optional goal input field
├── If status === 'recording'
│   ├── Recording indicator (pulsing red dot)
│   ├── Duration timer
│   ├── Event count display
│   ├── "Pause" button (stretch goal)
│   └── "Stop Recording" button
├── If status === 'processing'
│   └── Processing indicator with stages
└── If status === 'reviewing'
    └── Render RecordingReview component

openBrowserWindow()
├── Get browserUrl from state
├── Open in new window/iframe
└── Position alongside editor
```

#### `app/(pages)/workflows/editor/components/EventFeed.tsx`

```
EventFeed({ events })
├── Scrollable container
├── For each event (most recent first)
│   ├── Icon based on event type
│   ├── Human-readable description
│   │   ├── click: "Clicked {target text/selector}"
│   │   ├── input: "Typed in {field name}: {value preview}"
│   │   ├── navigate: "Navigated to {url}"
│   │   └── etc.
│   ├── Timestamp (relative)
│   └── Page context indicator
├── Auto-scroll to newest
└── Filter/search capability
```

#### `app/(pages)/workflows/editor/components/RecordingReview.tsx`

```
RecordingReview({ generatedSteps, onAccept, onDiscard })
├── Header with step count
├── For each step
│   ├── Step type icon
│   ├── Generated name (editable)
│   ├── Description
│   ├── Parameters section
│   │   ├── For parameterizable values
│   │   │   ├── Toggle: "Make this a workflow input"
│   │   │   └── Parameter name input
│   │   └── Preview of bound value
│   └── Selector preview (collapsible)
├── Workflow input preview
│   └── Shows resulting inputSchema
├── Actions
│   ├── "Accept and Create Workflow" button
│   ├── "Re-record" button
│   └── "Discard" button
└── Preview of generated workflow (mini-canvas or text)
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Can start recording | Click button, verify browser opens |
| AC-B.2 | Event feed updates live | Perform actions, verify events appear |
| AC-B.3 | Can stop recording | Click stop, verify processing begins |
| AC-B.4 | Review shows steps | After processing, verify steps displayed |
| AC-B.5 | Can toggle parameters | Toggle email field, verify inputSchema updates |
| AC-B.6 | Can accept workflow | Accept, verify workflow appears on canvas |

---

## User Flows

### Flow 1: Complete Recording Session

```
1. User clicks "Record Workflow" in editor
2. Frontend calls POST /api/workflows/recording/start
3. Backend creates Anchor session, injects recording script
4. Response includes sessionId and debugUrl
5. New window opens with recorded browser
6. EventFeed shows "Recording started..."
7. User performs actions in browser
8. Recording script sends events to /api/workflows/recording/events
9. EventFeed updates in real-time
10. User clicks "Stop Recording"
11. Frontend calls POST /api/workflows/recording/stop
12. Backend processes events → actions → workflow
13. RecordingReview shows generated steps
14. User adjusts parameterization
15. User clicks "Accept"
16. Workflow appears on canvas
```

---

## Out of Scope

- Voice narration capture
- Video recording
- Cross-browser session recording
- Recording native applications
- Collaborative recording

---

## Open Questions

- [ ] How do we inject scripts into HTTPS pages with CSP?
- [ ] Should we use WebSocket instead of REST for events?
- [ ] How do we handle very long recordings (>100 events)?
- [ ] Can we pause/resume recording?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |

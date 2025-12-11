# Screen Recording to Workflow

**Status:** Draft
**Priority:** P1
**North Star:** Enable users to record themselves applying to a job once, then have the system generate a reusable workflow that can apply to similar jobs automatically.

---

## Problem Statement

Some workflows are easier to demonstrate than describe. Users know how to perform tasks—they've done them hundreds of times—but articulating every step in natural language is tedious and error-prone. They might forget steps, describe them in the wrong order, or miss edge cases they handle unconsciously.

Current state:
1. Users must manually describe every step
2. Complex multi-step processes are hard to articulate
3. Browser interactions especially are difficult to specify textually
4. Implicit knowledge (what to do when X happens) gets lost

**The Gap:** No way to capture procedural knowledge through demonstration.

---

## User Value

- **Show, don't tell** — Demonstrate the workflow by doing it once
- **Capture implicit knowledge** — System observes decisions user makes
- **Reduce articulation burden** — No need to describe every click
- **Higher accuracy** — Recorded actions are precise, not interpreted
- **Domain expert friendly** — Subject matter experts can create workflows without technical translation

---

## User Flows

### Flow 1: Record and Generate

```
1. User opens workflow editor
2. User clicks "Record Workflow" button
3. System prompts: "What's the goal of this workflow?"
4. User types: "Apply to a job posting"
5. Recording mode activates:
   - Browser opens in recording mode
   - Screen capture begins (or DOM event capture)
   - User sees "Recording..." indicator
6. User performs the task:
   - Navigate to job board
   - Search for position
   - Click on listing
   - Fill out application form
   - Upload resume
   - Submit
7. User clicks "Stop Recording"
8. System processes recording:
   - Extracts sequence of actions
   - Identifies patterns (form fills, navigations, clicks)
   - Groups related actions into logical steps
   - Infers data dependencies
9. Generated workflow appears on canvas:
   - Navigate to URL (parameterized)
   - Search with criteria (parameterized)
   - Extract job details
   - Fill application form (field mappings)
   - Upload document
   - Submit and confirm
10. User reviews and adjusts parameterization
11. Workflow saved and ready for reuse
```

### Flow 2: Record with Narration

```
1. User starts recording
2. User enables "Voice narration" option
3. As user performs actions, they narrate:
   - "First I go to the company's careers page"
   - "Then I search for the job title"
   - "I look for the apply button, it's usually on the right"
4. System captures both actions AND narration
5. Narration used to:
   - Name steps appropriately
   - Add descriptions to nodes
   - Identify intent behind ambiguous actions
   - Capture decision criteria for branching
6. Generated workflow includes narration as node descriptions
```

### Flow 3: Record Browser-Only Task

```
1. User wants to automate web scraping
2. User clicks "Record Browser Session"
3. Anchor browser opens with recording indicator
4. User navigates through target site:
   - Goes to data page
   - Scrolls to reveal content
   - Selects items to extract
   - Advances to next page
   - Repeats
5. User highlights data to extract (visual selection)
6. System captures:
   - Navigation pattern
   - Scroll behaviors
   - Data selection areas
   - Pagination pattern
7. Generates workflow with:
   - Navigate step
   - Extract step with CSS selectors
   - Loop for pagination
   - Data aggregation step
```

### Flow 4: Partial Recording (Extend Existing)

```
1. User has existing workflow
2. User wants to add steps at the end
3. User selects last node, clicks "Record from here"
4. System sets up context:
   - Simulates state after last node
   - Opens browser at expected URL
5. User records additional steps
6. New steps appended to workflow
7. User reviews connection between old and new
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/browser-automation/` | Browser control | `services/anchor.ts`, `services/stagehand.ts` |
| `app/(pages)/workflows/editor/` | Workflow editor | Canvas components |
| `app/api/workflows/services/` | Workflow generation | `step-generator.ts` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Recording method | DOM events + Stagehand | More reliable than video analysis |
| Browser provider | Anchor profiles | Consistent with browser automation feature |
| Action granularity | Group into logical steps | Raw events too noisy |
| Data extraction | Visual selection tool | Intuitive for users |
| Voice capture | Optional enhancement | Not required for MVP |

---

## Architecture

### Recording Pipeline

```
User Actions (in Anchor browser)
         ↓
┌─────────────────────────────────────────┐
│         Event Capture Layer             │
│  - DOM events (click, input, scroll)    │
│  - Navigation events                    │
│  - Form interactions                    │
│  - File uploads                         │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Event Processing                │
│  - Debounce rapid events                │
│  - Identify semantic actions            │
│  - Track state changes                  │
│  - Capture page context                 │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Action Sequence                 │
│  [{ type, target, value, timestamp }]   │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Step Inference (LLM)            │
│  - Group related actions                │
│  - Identify step boundaries             │
│  - Infer step intent                    │
│  - Extract parameterizable values       │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Workflow Generation             │
│  - Create step definitions              │
│  - Generate schemas                     │
│  - Calculate bindings                   │
│  - Identify loops/conditionals          │
└─────────────────────────────────────────┘
         ↓
Workflow Definition (workflow.json)
```

### Event Types to Capture

```typescript
interface RecordedEvent {
  type: 'click' | 'input' | 'navigate' | 'scroll' | 'select' | 'upload' | 'submit';
  timestamp: number;
  target: {
    selector: string;       // CSS selector
    xpath: string;          // XPath for backup
    text?: string;          // Inner text if relevant
    attributes: Record<string, string>;
  };
  value?: string;           // For input events
  url?: string;             // For navigate events
  pageContext: {
    url: string;
    title: string;
    screenshot?: string;    // Base64 thumbnail
  };
}
```

### Step Inference Prompt

```
Given this sequence of recorded browser events:
[events]

Group these into logical workflow steps. For each step:
1. Identify the user's intent
2. Determine if values should be parameterized
3. Suggest a descriptive step name
4. Define input/output schema

Consider:
- Form fills with multiple inputs should be one step
- Navigation + wait should be one step
- Repeated similar actions suggest a loop
- Conditional paths (if button exists, click it) need branches
```

---

## Technical Approach Options

### Option A: DOM Event Recording (Recommended)

**How it works:**
- Inject recording script into Anchor browser session
- Capture DOM events in real-time
- Send events to backend via WebSocket
- Process events into workflow on completion

**Pros:**
- Precise action capture
- Works with any website
- Low processing overhead
- Real-time feedback possible

**Cons:**
- Need to handle dynamic content
- Shadow DOM may be tricky
- iframe interactions complex

### Option B: Playwright Recording

**How it works:**
- Use Playwright's built-in codegen feature
- Generate Playwright script
- Transform script into workflow steps

**Pros:**
- Battle-tested recording
- Handles edge cases well
- Produces reliable selectors

**Cons:**
- Tied to Playwright format
- Need translation layer
- Less control over output

### Option C: Video + Vision Analysis

**How it works:**
- Record screen as video
- Use vision model to identify actions
- Extract workflow from video frames

**Pros:**
- Works with any application
- Captures visual context
- No browser injection needed

**Cons:**
- Processing intensive
- Less precise
- Slower feedback loop
- More expensive (vision API calls)

---

## Constraints

- **Browser environment** — Recording only works in Anchor-managed browsers
- **Same-origin policy** — May limit cross-origin iframe recording
- **Session length** — Long recordings need chunking
- **Authentication** — Must handle login flows carefully
- **Dynamic content** — SPAs and lazy-loading complicate selectors

---

## Success Criteria

- [ ] User can start/stop recording from workflow editor
- [ ] Recording captures clicks, inputs, and navigations
- [ ] Recorded events transform into workflow steps
- [ ] Generated workflow has reasonable step names
- [ ] Parameterizable values are identified and extracted
- [ ] Generated workflow can replay the recorded task
- [ ] Recording session shows what's being captured
- [ ] User can discard recording and start over

---

## Out of Scope

- Desktop application recording (browser only)
- Mobile recording
- Multi-browser recording
- Real-time editing during recording
- Collaborative recording sessions

---

## Open Questions

- How do we handle CAPTCHAs during recording?
- Should we record failed attempts and learn from them?
- How do we handle OAuth flows that open popups?
- Can we use Stagehand's AI to improve selector reliability?
- Should we support "pause" during recording?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Recording Start | Pre-recording setup | Goal input, options |
| Recording Active | Active recording state | Browser with overlay, stop button, event feed |
| Processing | Post-recording processing | Progress, preview of detected actions |
| Review | Generated workflow review | Steps with edit capability |
| Parameterization | Variable extraction UI | Detected values, make-variable toggle |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── screen-recording/
│   ├── recording-start.html
│   ├── recording-active.html
│   ├── processing.html
│   ├── review.html
│   └── parameterization.html
```

---

## References

- Browser Automation: `_docs/Product/ROADMAP/browser-automation/`
- Anchor Browser: https://getanchor.ai
- Stagehand: https://github.com/browserbase/stagehand
- Playwright Codegen: https://playwright.dev/docs/codegen
- rrweb (DOM recording): https://www.rrweb.io/

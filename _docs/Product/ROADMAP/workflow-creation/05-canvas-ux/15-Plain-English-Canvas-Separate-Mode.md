# Plain English Canvas — Separate Mode

**Status:** Draft
**Priority:** P1
**North Star:** User toggles to "Simple View", sees workflow as scannable bullet points: "1. Get job posting → 2. Extract requirements → 3. Match to resume → 4. Apply", without any technical details.

---

## Problem Statement

The visual node canvas is powerful but can be overwhelming. Non-technical stakeholders, managers, or users reviewing workflows see:
- Complex node configurations
- Schema definitions
- Connection lines
- Technical terminology

This creates a barrier for:
1. Getting workflow approval
2. Explaining what a workflow does
3. Documenting processes
4. Onboarding new team members

**The Gap:** No simplified, human-readable view of workflows.

---

## User Value

- **Accessible to everyone** — Non-technical users understand the workflow
- **Documentation ready** — Export as SOP or process document
- **Approval friendly** — Managers can review without technical confusion
- **Quick comprehension** — Scan a workflow in seconds
- **Teaching tool** — Learn workflow logic without technical overhead

---

## User Flows

### Flow 1: Toggle to Simple View

```
1. User is in workflow editor (technical canvas view)
2. User clicks "Simple View" toggle in toolbar
3. Canvas transforms:
   - Nodes become numbered steps
   - Technical details hidden
   - Connections become flow arrows
   - Plain English descriptions shown
4. User sees:
   1. Navigate to job posting URL
   2. Extract job requirements from page
   3. Load resume from documents
   4. Analyze match between requirements and skills
   5. Generate tailored cover letter
   6. Submit application
5. User can toggle back to technical view
```

### Flow 2: Edit in Simple View

```
1. User is in Simple View
2. User clicks on step "3. Load resume from documents"
3. Inline editor appears:
   - Step name (editable)
   - Description (editable, longer text)
   - Input summary (read-only)
   - Output summary (read-only)
4. User changes name to "Retrieve candidate's latest resume"
5. Change reflects in both views
6. Technical configuration preserved
```

### Flow 3: Share Simple View

```
1. User is in Simple View
2. User clicks "Share" or "Export"
3. Options appear:
   - Copy as text (plain text list)
   - Copy as markdown (formatted)
   - Export as PDF (with branding)
   - Generate shareable link (read-only view)
4. User chooses "Copy as markdown"
5. Clipboard contains:
   ```
   # Job Application Workflow

   1. **Navigate to job posting** — Opens the job posting URL in browser
   2. **Extract requirements** — Pulls job requirements from the page
   3. **Load resume** — Retrieves candidate's resume from documents
   ...
   ```
6. User pastes into documentation
```

### Flow 4: Review Workflow (Read-Only)

```
1. Manager receives link to workflow
2. Opens link (no login required for read-only)
3. Sees Simple View by default
4. Can scroll through steps
5. Can expand steps for more detail
6. Cannot edit (read-only badge shown)
7. Can leave comments (if enabled)
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/(pages)/workflows/editor/` | Editor UI | Canvas components |
| `components/ui/` | UI primitives | Cards, typography |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Implementation | Separate view mode | Clean separation, optimized for purpose |
| Data source | Same workflow definition | Single source of truth |
| Editing | Limited, safe edits | Names and descriptions only |
| Sync | Real-time | Changes reflect immediately |

---

## Architecture

### View Mode Toggle

```typescript
type ViewMode = 'technical' | 'simple';

interface EditorState {
  viewMode: ViewMode;
  // ... other state
}

// Toolbar toggle
<ViewModeToggle
  value={viewMode}
  onChange={setViewMode}
  options={[
    { value: 'technical', label: 'Technical', icon: <NodeIcon /> },
    { value: 'simple', label: 'Simple', icon: <ListIcon /> }
  ]}
/>
```

### Simple View Data Transform

```typescript
interface SimpleStep {
  number: number;
  name: string;
  description: string;
  type: 'action' | 'decision' | 'loop';
  inputs: string[];        // Human-readable input list
  outputs: string[];       // Human-readable output list
  nextSteps: number[];     // Step numbers that follow
}

function transformToSimpleView(workflow: WorkflowDefinition): SimpleStep[] {
  return workflow.steps.map((step, index) => ({
    number: index + 1,
    name: step.name || generateName(step),
    description: step.description || generateDescription(step),
    type: inferStepType(step),
    inputs: summarizeInputs(step.inputSchema),
    outputs: summarizeOutputs(step.outputSchema),
    nextSteps: findNextSteps(step, workflow)
  }));
}
```

### Generating Human-Readable Descriptions

```typescript
function generateDescription(step: Step): string {
  // For Composio tools
  if (step.type === 'composio') {
    const descriptions: Record<string, string> = {
      'GMAIL_SEND_EMAIL': 'Sends an email via Gmail',
      'SLACK_POST_MESSAGE': 'Posts a message to Slack channel',
      'BROWSER_TOOL_NAVIGATE': 'Opens a webpage in browser',
      // ... more mappings
    };
    return descriptions[step.toolId] || `Executes ${step.name}`;
  }

  // For custom code
  if (step.type === 'custom') {
    // Use AI to summarize if no description
    return step.description || 'Runs custom logic';
  }

  // For control flow
  if (step.type === 'branch') {
    return `Checks condition and routes to appropriate path`;
  }

  return `Performs ${step.name}`;
}
```

---

## Visual Design

### Simple View Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Job Application Workflow                    [Simple View ▼] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1  Navigate to job posting                          │   │
│  │    Opens the job posting URL in browser             │   │
│  │    → needs: Job URL                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 2  Extract requirements                             │   │
│  │    Pulls job requirements from the page             │   │
│  │    → produces: Requirements list                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 3  ◇ Check if already applied                       │   │
│  │    Looks up if we've applied before                 │   │
│  │                                                     │   │
│  │    ├─ Yes → Skip to end                             │   │
│  │    └─ No  → Continue                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 4  Match skills to requirements                     │   │
│  │    Analyzes how well resume matches the job         │   │
│  │    → produces: Match score, Missing skills          │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│                         ...                                 │
└─────────────────────────────────────────────────────────────┘
```

### Step Card Design

| Element | Style |
|---------|-------|
| Number | Large, bold, colored circle |
| Name | Bold, sentence case |
| Description | Normal weight, gray text |
| Inputs/Outputs | Small, labeled |
| Arrow | Simple down arrow between steps |
| Decision | Diamond indicator, branches shown |
| Loop | Cycle indicator, iteration note |

---

## Constraints

- **Accuracy** — Simple view must correctly represent workflow logic
- **Sync** — Changes in either view must sync immediately
- **Control flow** — Branches and loops must be clearly represented
- **Export** — Generated text must be accurate and complete

---

## Success Criteria

- [ ] Toggle switches between views smoothly
- [ ] Simple view shows all steps in order
- [ ] Branches show decision points clearly
- [ ] Loops show iteration pattern
- [ ] Step names and descriptions are editable
- [ ] Export produces clean text/markdown
- [ ] Shareable link provides read-only access
- [ ] Technical config preserved when editing simple view

---

## Out of Scope

- Full editing in simple view (complex changes)
- Version comparison in simple view
- Execution monitoring in simple view
- Simple view-only workflows

---

## Open Questions

- Should we AI-generate descriptions if not provided?
- How do we represent parallel execution in simple view?
- Should comments/annotations be visible in simple view?
- How detailed should input/output summaries be?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| View Toggle | Mode switching | Toolbar toggle |
| Simple Canvas | Main simple view | Steps, arrows, cards |
| Step Card | Individual step | Number, name, description |
| Decision Point | Branch visualization | Diamond, paths |
| Export Options | Export menu | Format options |
| Read-Only View | Shared view | Badge, comments |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── plain-english-separate/
│   ├── view-toggle.html
│   ├── simple-canvas.html
│   ├── step-card.html
│   ├── decision-point.html
│   ├── export-options.html
│   └── read-only-view.html
```

---

## References

- SOP templates: Business process documentation
- Plain language guidelines: https://www.plainlanguage.gov/
- XYFlow alternatives: Linear list rendering

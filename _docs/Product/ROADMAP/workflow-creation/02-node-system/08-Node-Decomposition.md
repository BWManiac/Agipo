# Node Decomposition

**Status:** Draft
**Priority:** P1
**North Star:** User has high-level node "Apply to Job", clicks "Decompose", and system expands it into 6 granular steps: navigate, extract, analyze, tailor, fill, submit.

---

## Problem Statement

Users often think at a high level: "Apply to this job", "Process this invoice", "Onboard this employee". But workflow execution requires granular steps. Currently:

1. Users must manually break down high-level tasks
2. Decomposition requires domain knowledge
3. The right level of granularity isn't obvious
4. Complex steps hide failure points

**The Gap:** No AI-assisted breakdown of high-level steps into executable sub-steps.

---

## User Value

- **Think high-level, execute granular** — Describe intent, system figures out steps
- **Learn decomposition patterns** — See how experts break down tasks
- **Identify hidden complexity** — Discover steps you didn't consider
- **Flexible granularity** — Decompose further or keep collapsed
- **Error isolation** — Smaller steps = easier debugging

---

## User Flows

### Flow 1: Decompose High-Level Node

```
1. User has node "Apply to Job Posting"
2. User right-clicks → "Decompose into steps"
3. System analyzes node description and context
4. System proposes decomposition:
   - Step 1: Navigate to job posting URL
   - Step 2: Extract job requirements
   - Step 3: Load candidate resume
   - Step 4: Analyze skill match
   - Step 5: Generate tailored cover letter
   - Step 6: Fill application form
   - Step 7: Submit application
5. User sees preview with proposed steps
6. User can:
   - Accept all steps
   - Remove unnecessary steps
   - Add additional steps
   - Decompose individual steps further
7. User clicks "Apply Decomposition"
8. Original node replaced with sub-workflow group
```

### Flow 2: Selective Decomposition

```
1. User has multi-step workflow
2. One step seems too complex: "Process Invoice"
3. User selects step, clicks "Decompose"
4. System proposes:
   - Extract invoice data
   - Validate amounts
   - Check against PO
   - Approve or flag
5. User keeps "Extract" and "Validate" as-is
6. User decompose "Check against PO" further:
   - Look up PO in database
   - Compare line items
   - Calculate discrepancy
7. Final workflow has 6 steps instead of 1
```

### Flow 3: Guided Decomposition

```
1. User has vague node: "Handle customer request"
2. User clicks "Decompose"
3. System asks clarifying questions:
   - "What types of requests?" → Support, Sales, Billing
   - "What's the success criteria?" → Request resolved
   - "What systems are involved?" → CRM, Helpdesk
4. Based on answers, system proposes:
   - Classify request type
   - Route to appropriate handler
   - Execute handler workflow
   - Update CRM
   - Send confirmation
5. User accepts with modifications
```

### Flow 4: Recursive Decomposition

```
1. User decomposes "Onboard Employee"
2. Gets 5 high-level steps
3. Each step has "Decompose" option
4. User decomposes "Set up accounts":
   - Create email account
   - Add to Slack
   - Provision GitHub access
   - Set up HR system
5. User decomposes "Provision GitHub access":
   - Add to organization
   - Add to teams
   - Set repository permissions
6. Workflow now has 3 levels of nesting
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/workflows/generate/` | Workflow generation | Similar pattern |
| `app/(pages)/workflows/editor/` | Canvas manipulation | Node grouping |
| `lib/mastra/` | Nested workflows | Mastra patterns |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Decomposition depth | User-controlled | Flexibility, avoid over-engineering |
| Visual representation | Sub-workflow group | Clear hierarchy |
| Step generation | AI with context | Needs understanding of intent |
| Preservation | Original node kept as comment | Recovery, reference |

---

## Architecture

### Decomposition Pipeline

```
High-Level Node
      ↓
┌─────────────────────────────────────────┐
│         Context Analysis                │
│  - Node description                     │
│  - Input/output schemas                 │
│  - Connected nodes                      │
│  - Available integrations               │
└─────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────┐
│         Decomposition Planning          │
│  - Identify sub-tasks                   │
│  - Order by dependency                  │
│  - Determine integration needs          │
│  - Set granularity level                │
└─────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────┐
│         Step Generation                 │
│  - Create step definitions              │
│  - Generate schemas for each            │
│  - Create bindings between steps        │
│  - Handle edge cases                    │
└─────────────────────────────────────────┘
      ↓
Decomposed Sub-Workflow
```

### Decomposition Prompt

```
You are decomposing a high-level workflow step into granular sub-steps.

Original Step:
- Name: {nodeName}
- Description: {nodeDescription}
- Input Schema: {inputSchema}
- Output Schema: {outputSchema}

Context:
- Previous step outputs: {previousOutputs}
- Next step expects: {nextInputs}
- Available integrations: {integrations}

Decompose this step into 3-7 atomic sub-steps. For each step:
1. Name: Clear, action-oriented name
2. Description: What this step accomplishes
3. Type: composio | browser | llm | custom | data
4. Input: What data this step needs
5. Output: What data this step produces

Guidelines:
- Each step should do ONE thing
- Steps should be independently testable
- Data should flow clearly between steps
- Include error handling steps if needed
- Consider what could go wrong at each point

Return as structured JSON.
```

### Granularity Levels

| Level | Description | Example |
|-------|-------------|---------|
| **Atomic** | Single action, can't be split | Click button, API call |
| **Task** | Clear outcome, few actions | Fill form, extract data |
| **Process** | Multiple tasks, one goal | Apply to job, send report |
| **Workflow** | Multiple processes | Job search campaign |

### Nesting Visualization

```
┌─────────────────────────────────────────┐
│  Apply to Job Posting                   │
│  ┌─────────────────────────────────┐   │
│  │ 1. Navigate to URL              │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 2. Extract Requirements         │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 3. Analyze & Prepare            │   │
│  │  ┌─────────────────────────┐   │   │
│  │  │ 3.1 Load Resume         │   │   │
│  │  │ 3.2 Match Skills        │   │   │
│  │  │ 3.3 Generate Cover      │   │   │
│  │  └─────────────────────────┘   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 4. Submit Application           │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Constraints

- **Maximum depth** — Limit nesting to 3 levels for usability
- **Schema compatibility** — Decomposed steps must maintain original I/O contract
- **Execution equivalence** — Decomposed version must produce same result
- **Performance** — Decomposition shouldn't significantly slow execution

---

## Success Criteria

- [ ] User can right-click node → "Decompose"
- [ ] System proposes reasonable sub-steps
- [ ] User can accept, modify, or reject decomposition
- [ ] Decomposed steps connect correctly
- [ ] Schema flows through decomposed steps
- [ ] User can decompose recursively
- [ ] Collapsed view shows original name
- [ ] Expanded view shows sub-steps

---

## Out of Scope

- Automatic decomposition without user action
- Cross-workflow decomposition
- Decomposition templates library
- AI-suggested decomposition depth

---

## Open Questions

- How do we handle decomposition that changes I/O schema?
- Should decomposed groups be collapsible on canvas?
- How do we visualize deeply nested workflows?
- Can users "recompose" steps back together?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Decompose Menu | Context menu option | Right-click menu |
| Decomposition Preview | Proposed steps view | Steps list, edit options |
| Nested Group | Decomposed node on canvas | Collapsed/expanded states |
| Depth Indicator | Nesting level | Visual hierarchy |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── node-decomposition/
│   ├── decompose-menu.html
│   ├── decomposition-preview.html
│   ├── nested-group.html
│   └── depth-indicator.html
```

---

## References

- Workflow generation: `01-Natural-Language-Workflow-Creation.md`
- Nested workflows: Mastra documentation
- Visual grouping: XYFlow group nodes

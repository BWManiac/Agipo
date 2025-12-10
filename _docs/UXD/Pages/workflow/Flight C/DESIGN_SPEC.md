# Flight C: Workflow Editor — Design Specification

**Status:** Design  
**Date:** December 2025  
**Version:** 1.0  
**Cross-References:**
- Product Requirements: `_docs/_tasks/15-workflow-editor.md`
- Research (Verified APIs): `_docs/_tasks/15.2-workflow-research.md`
- Implementation Plan: `_docs/_tasks/15.3-workflow-implementation.md`
- Mastra Primitives: `_docs/Engineering/Integrations/API Docs/Mastra/Workflow-Primitives.md`

---

## 1. Design Philosophy

### 1.1 Core Principle: Workflows as SOPs

> **A workflow should be indistinguishable from a Standard Operating Procedure (SOP).**

The visual representation must be clear enough that a non-technical person can understand:
- What steps are involved
- In what order they execute
- What data flows between them
- What the end result is

This is not just a "workflow builder for AI agents" — it's a documentation tool for how work gets done. The agent execution is a bonus; the clarity is the requirement.

### 1.2 Design Goals

| Goal | Rationale |
|------|-----------|
| **Dual-view parity** | Both list and canvas views must be first-class, reading from the same `workflow.json` |
| **Persistent context** | Chat (left) and panels (right) remain visible regardless of view mode |
| **Progressive disclosure** | Simple workflows stay simple; complexity is available but not mandatory |
| **SOP legibility** | A printed screenshot should make sense to a new hire |
| **Technical precision** | Developers can see exact data mappings, types, and generated code |

### 1.3 Anti-Goals

| Anti-Goal | Why |
|-----------|-----|
| ~~Flashy animations everywhere~~ | Clarity over spectacle |
| ~~Canvas-only focus~~ | List view is equally important for linear workflows |
| ~~Hidden complexity~~ | Users should understand what will execute |
| ~~Mandatory technical views~~ | Non-technical users shouldn't need to see code |

---

## 2. Architecture

### 2.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TOP BAR                                                                    │
│  [← Back]  "Workflow Name"  [View Toggle]  [Test ▼]  [Save]  [Publish]     │
├─────────────────┬───────────────────────────────────────────┬───────────────┤
│                 │                                           │               │
│  CHAT PANEL     │           CENTER VIEW                     │  TABBED       │
│  (Persistent)   │     (List View OR Canvas View)            │  PANELS       │
│                 │                                           │  (Persistent) │
│  ─────────────  │                                           │               │
│  AI Assistant   │  ┌─────────────────────────────────────┐  │  [Tools]      │
│  helps build    │  │                                     │  │  [Inputs]     │
│  workflows      │  │  Content varies by view mode:       │  │  [Config]     │
│                 │  │  - List: Sequential step cards      │  │  [Connect]    │
│  "Add a step    │  │  - Canvas: ReactFlow graph          │  │  [Test]       │
│   to scrape     │  │                                     │  │               │
│   that job      │  │  Three abstraction levels:          │  │  ─────────    │
│   listing"      │  │  - Flow (simplified)                │  │  Panel        │
│                 │  │  - Spec (detailed I/O)              │  │  Content      │
│  ▋ Send         │  │  - Code (generated TS)              │  │  Here         │
│                 │  │                                     │  │               │
│                 │  └─────────────────────────────────────┘  │               │
│                 │                                           │               │
└─────────────────┴───────────────────────────────────────────┴───────────────┘
```

### 2.2 Persistent Elements

These elements remain visible across all view modes:

| Element | Position | Purpose | Cross-Ref |
|---------|----------|---------|-----------|
| **Top Bar** | Top | Workflow name, actions, view controls | — |
| **Chat Panel** | Left | AI assistant for building workflows | PR-Chat |
| **Tabbed Panels** | Right | Contextual tools and configuration | PR-Palette, PR-8, PR-5, PR-4, PR-10 |

### 2.3 Switchable Center View

The center area switches between two equivalent representations:

| View | Best For | Data Source |
|------|----------|-------------|
| **List View** | Linear workflows, SOP clarity, beginners | `workflow.json` via `listIndex` ordering |
| **Canvas View** | Complex branching, visual thinkers, power users | `workflow.json` via `position` coordinates |

**Critical:** Both views read/write the **same** `workflow.json`. Edits in one view must reflect in the other.

### 2.4 Three Levels of Abstraction

Within the center view (both list and canvas), users can toggle detail levels:

| Level | Shows | Use Case |
|-------|-------|----------|
| **Flow** | Step names, simple connections | Quick overview, presentations |
| **Spec** | I/O schemas, data types, mappings | Understanding data flow |
| **Code** | Generated TypeScript | Developer verification |

**Note:** Flow and Spec levels apply to both List and Canvas views. Code level may be canvas-only initially.

---

## 3. Component Specifications

### 3.1 Top Bar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [← Back]   📝 "Job Application Helper"                                      │
│                                                                             │
│            [Flow ▼ | Spec | Code]     [List | Canvas]                       │
│                                                                             │
│                                        [Test ▼] [Save] [Publish ▼]         │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Element | Behavior |
|---------|----------|
| **Back Arrow** | Returns to workflows list; prompts save if unsaved changes |
| **Workflow Name** | Editable inline; validates uniqueness |
| **Abstraction Toggle** | Flow / Spec / Code — affects center view detail level |
| **View Toggle** | List / Canvas — switches center view mode |
| **Test Dropdown** | Lists saved test cases; "New Test" option |
| **Save** | Persists `workflow.json` and generates `workflow.ts` |
| **Publish Dropdown** | Draft / Published status; sharing options |

### 3.2 Chat Panel (Left)

The chat panel provides AI assistance for workflow construction.

**States:**

| State | Description |
|-------|-------------|
| **Collapsed** | Thin strip with expand icon |
| **Expanded** | Full chat interface (default) |
| **Responding** | AI typing indicator |

**AI Capabilities:**

- "Add a step to scrape that URL" → Adds FIRECRAWL node
- "Connect the output to the next step" → Creates edge with suggested mapping
- "What does this workflow do?" → Explains in plain language
- "Help me debug why this fails" → Analyzes error context

**Cross-Reference:** AI chat should understand Mastra primitives from `Workflow-Primitives.md`.

### 3.3 Tabbed Panels (Right)

Five tabs providing contextual functionality:

#### Tab: Tools (Palette)

| Element | Purpose | Cross-Ref |
|---------|---------|-----------|
| Search bar | Filter tools by name | AC-1.6 |
| Grouped list | Tools organized by toolkit | AC-1.5 |
| Tool cards | Draggable items with description | AC-1.7 |
| NO_AUTH section | Browser tools, etc. | PR-1.2 |

**Tool Card Contents:**
- Tool name (e.g., "Send Email")
- Toolkit badge (e.g., "Gmail")
- Brief description
- Drag handle

#### Tab: Inputs

| Element | Purpose | Cross-Ref |
|---------|---------|-----------|
| Input list | Defined runtime inputs | PR-8.1 |
| Add button | Define new input | PR-8.1 |
| Input form | Name, type, required, default, description | PR-8.1, PR-5.5 |

**Input Definition Fields:**
- Name (identifier)
- Display Label
- Type (text, number, boolean, array, object)
- Required (toggle)
- Default Value (optional)
- Description (for agent/user)

**New Feature:** Support default values for inputs (user feedback).

#### Tab: Config

| Element | Purpose | Cross-Ref |
|---------|---------|-----------|
| Config list | Defined workflow configs | PR-5.1 |
| Add button | Define new config | PR-5.1 |
| Config form | Name, type, options, default | PR-5.5 |

**Config Definition Fields:**
- Name (identifier)
- Display Label
- Type (text, number, boolean, **select**)
- Options (for select type)
- Required (toggle)
- Default Value

**Config vs Input:**
| Aspect | Config | Input |
|--------|--------|-------|
| When set | At workflow assignment | At execution time |
| Who sets | User assigning to agent | Agent/caller |
| Persisted | Per agent-workflow binding | No |
| Example | `targetRepo = "agipo/frontend"` | `jobUrl = "https://..."` |

#### Tab: Connect

| Element | Purpose | Cross-Ref |
|---------|---------|-----------|
| Required list | Auto-detected from tool nodes | PR-4.1 |
| Status indicators | Connected / Not Connected | PR-4.2 |
| Connect buttons | Link to connections page | PR-4.4 |

**Connection Card Contents:**
- Toolkit logo
- Toolkit name
- Tools using this connection (expandable)
- Connection status (✓ Connected / ⚠ Not Connected)
- "Connect" action button

#### Tab: Test

| Element | Purpose | Cross-Ref |
|---------|---------|-----------|
| Test case list | Saved test cases | PR-10.2 |
| New test form | Runtime inputs + config overrides | PR-10.3 |
| Run button | Execute test | PR-10.1 |
| Results panel | Step-by-step execution | PR-10.4 |
| Error display | Failed step details | PR-10.5 |

**Test Panel States:**
1. **Empty** — No saved tests; shows "Create Test Case" form
2. **Test List** — Shows saved tests with Run/Edit actions
3. **Running** — Shows live execution progress
4. **Results** — Shows completed test with step details
5. **Error** — Highlights failed step with error message

### 3.4 List View (Center)

Sequential representation of workflow steps.

```
┌─────────────────────────────────────────────────────────────────┐
│  1  ┌──────────────────────────────────────────────────────┐   │
│     │ 🔧 Scrape Job Listing                          [···]  │   │
│     │ FIRECRAWL_SCRAPE                                      │   │
│     │                                                       │   │
│     │ Input:  url ← {{inputs.jobUrl}}                       │   │
│     │ Output: data.title, data.company, data.requirements   │   │
│     └──────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼  [Edit Mapping]                  │
│                                                                 │
│  2  ┌──────────────────────────────────────────────────────┐   │
│     │ 💻 Generate Tailored Resume                    [···]  │   │
│     │ Custom Code                                           │   │
│     │                                                       │   │
│     │ Input:  jobTitle ← Step 1.data.title                  │   │
│     │         company ← Step 1.data.company                 │   │
│     │         skills ← Step 1.data.requirements             │   │
│     │ Output: tailoredResume                                │   │
│     └──────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│                                                                 │
│  3  ┌──────────────────────────────────────────────────────┐   │
│     │ ✉️ Send Email with Resume                      [···]  │   │
│     │ GMAIL_SEND_EMAIL                                      │   │
│     │                                                       │   │
│     │ Input:  body ← Step 2.tailoredResume                  │   │
│     │         to ← {{configs.recipientEmail}}               │   │
│     │ Output: (terminal node)                               │   │
│     └──────────────────────────────────────────────────────┘   │
│                                                                 │
│  [+ Add Step]                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**List View Elements:**

| Element | Purpose |
|---------|---------|
| Step number | Execution order |
| Step card | Contains step details |
| Connection line | Visual flow indicator |
| "Edit Mapping" button | Opens DataMappingModal |
| "Add Step" button | Opens tool selection |

**Step Card Contents:**

| Element | Description |
|---------|-------------|
| Icon | Tool type indicator (🔧 Composio, 💻 Custom, ⚡ Control) |
| Title | User-editable step name |
| Subtitle | Tool ID or type |
| Input section | Shows bound inputs with source indicators |
| Output section | Shows output fields (or "terminal node") |
| Menu | Edit, Duplicate, Delete |

**Source Indicators for Inputs:**

| Indicator | Meaning | Example |
|-----------|---------|---------|
| `← {{inputs.x}}` | From runtime input | `url ← {{inputs.jobUrl}}` |
| `← {{configs.x}}` | From config value | `to ← {{configs.recipientEmail}}` |
| `← Step N.field` | From previous step output | `jobTitle ← Step 1.data.title` |
| `← "literal"` | Static value | `subject ← "Your Resume"` |

**List View Interactions:**

| Action | Result |
|--------|--------|
| Click step card | Select step; show in NodeInspector |
| Click "Edit Mapping" | Open DataMappingModal for that edge |
| Drag step card | Reorder steps (updates `listIndex`) |
| Click "Add Step" | Show tool selection dropdown/modal |
| Click menu → Delete | Remove step (with confirmation) |

### 3.5 Canvas View (Center)

Node-graph representation using ReactFlow.

**Node Types:**

| Type | Visual | Purpose |
|------|--------|---------|
| **Tool Node** | Rounded rectangle with toolkit color | Composio tool step |
| **Code Node** | Rectangle with code icon | Custom code step |
| **Control Node** | Diamond (branch) / Split (parallel) | Control flow |
| **Start Node** | Circle, green | Workflow entry point |
| **End Node** | Circle, red | Workflow terminal |

**Edge Types:**

| Type | Visual | Purpose |
|------|--------|---------|
| **Data Edge** | Solid line with arrow | Data flows through mapping |
| **Invalid Edge** | Red dashed line | Type mismatch warning |
| **Mapping Indicator** | Badge on edge | Shows field count mapped |

**Canvas Interactions:**

| Action | Result |
|--------|--------|
| Click node | Select; show in NodeInspector |
| Click edge | Select; show mapping in panel or modal |
| Drag from node handle | Create new edge |
| Drop tool from palette | Create new node |
| Double-click node | Open inline editor |
| Right-click | Context menu |
| Scroll/pinch | Zoom |
| Drag canvas | Pan |

### 3.6 Data Mapping Modal

Opened when clicking an edge or "Edit Mapping" button.

```
┌─────────────────────────────────────────────────────────────────┐
│  Map Data: "Scrape Job Listing" → "Generate Resume"       [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SOURCE (Step 1 Output)          TARGET (Step 2 Input)          │
│  ─────────────────────           ─────────────────────          │
│                                                                 │
│  ○ data                          ● jobTitle (string) *          │
│    ├─ title (string)      ───▶     ↳ data.title                 │
│    ├─ company (string)    ───▶   ● companyName (string) *       │
│    ├─ requirements (str[])───▶     ↳ data.company               │
│    └─ salary (object)            ● targetSkills (string[]) *    │
│       ├─ min (number)              ↳ data.requirements          │
│       └─ max (number)            ○ salaryRange (string)         │
│  ○ error (string)                  ↳ (not mapped)               │
│  ○ successful (boolean)                                         │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  * = required                                                   │
│                                                                 │
│  [Auto-Map Matching Names]           [Clear All]    [Apply]     │
└─────────────────────────────────────────────────────────────────┘
```

**Mapping Modal Features:**

| Feature | Description | Cross-Ref |
|---------|-------------|-----------|
| Tree view of source fields | Expandable nested fields | PR-9.2 |
| List of target fields | Required marked with * | PR-9.3 |
| Drag-drop mapping | Draw line source→target | PR-9.4 |
| Nested path support | `data.salary.min` | PR-9.5 |
| Auto-map button | Match by field name | PR-9.6, OQ-14 |
| Type indicators | Show types; warn on mismatch | PR-9.7 |

**Mapping States:**

| State | Visual |
|-------|--------|
| Unmapped required | Red asterisk, highlighted |
| Unmapped optional | Gray, dimmed |
| Mapped | Green checkmark, connection line |
| Type mismatch | Orange warning icon |

### 3.7 Node Inspector (Contextual)

When a node is selected, the right panel can show detailed inspector:

```
┌───────────────────────────────────────┐
│  NODE: Scrape Job Listing        [···]│
├───────────────────────────────────────┤
│  Type: Composio Tool                  │
│  Tool: FIRECRAWL_SCRAPE               │
│  Toolkit: Firecrawl                   │
├───────────────────────────────────────┤
│  INPUT SCHEMA                         │
│  ─────────────                        │
│  url (string) *                       │
│    └─ Current: {{inputs.jobUrl}}      │
│                                       │
│  formats (string[])                   │
│    └─ Current: ["markdown"]           │
├───────────────────────────────────────┤
│  OUTPUT SCHEMA                        │
│  ────────────                         │
│  data (object)                        │
│    ├─ title (string)                  │
│    ├─ company (string)                │
│    └─ requirements (string[])         │
│  error (string)                       │
│  successful (boolean)                 │
├───────────────────────────────────────┤
│  [Edit Parameters]  [View Code]       │
└───────────────────────────────────────┘
```

**Note:** This can be a 6th tab or a floating panel depending on final UX decision.

---

## 4. State Coverage

### 4.1 Editor States

| State | Description | Elements Affected |
|-------|-------------|-------------------|
| **Empty** | New workflow, no steps | Center shows "Add your first step" |
| **Editing** | Normal editing mode | All panels interactive |
| **Unsaved** | Changes not persisted | "Save" button highlighted |
| **Saving** | Save in progress | Loading indicator |
| **Test Running** | Test executing | Test panel shows progress |
| **Test Passed** | All steps succeeded | Green success indicator |
| **Test Failed** | A step failed | Red error, step highlighted |
| **Publishing** | Publishing in progress | Publish button loading |

### 4.2 Step States

| State | Visual in List | Visual in Canvas |
|-------|----------------|------------------|
| **Default** | Normal card | Normal node |
| **Selected** | Blue border | Blue glow |
| **Running** | Spinner, pulse | Spinner, pulse |
| **Succeeded** | Green checkmark | Green border |
| **Failed** | Red X, error badge | Red border, error icon |
| **Pending** | Grayed out | Dimmed |

### 4.3 Validation States

| State | Trigger | Display |
|-------|---------|---------|
| **Valid** | All mappings complete, types match | No indicators |
| **Warning** | Coercible type (number→string) | Yellow badge |
| **Error** | Required field unmapped | Red badge |
| **Connection Missing** | Toolkit not connected | Orange warning |

### 4.4 View Mode Combinations

| View | Abstraction | Result |
|------|-------------|--------|
| List + Flow | Simplified step cards, minimal detail | Overview mode |
| List + Spec | Full I/O display, mapping indicators | Standard editing |
| List + Code | N/A (defaults to Spec) | — |
| Canvas + Flow | Simple nodes, clean edges | Presentation mode |
| Canvas + Spec | Nodes with I/O, edge badges | Standard editing |
| Canvas + Code | Code panel overlay or split | Developer mode |

---

## 5. Interaction Flows

### 5.1 Create Workflow

```
1. User clicks "New Workflow" on list page
2. System creates workflow with default name "Untitled Workflow"
3. Editor opens in List view, Spec abstraction
4. Right panel shows Tools tab (palette)
5. Chat panel suggests: "What would you like to automate?"
```

### 5.2 Add Step from Palette

```
1. User views Tools tab in right panel
2. User searches "scrape" 
3. Palette filters to show FIRECRAWL_SCRAPE, etc.
4. User drags "Scrape URL" to center view
   - List view: Card appears in list
   - Canvas view: Node appears at drop position
5. System auto-detects: "Requires: Firecrawl"
6. Connect tab shows new requirement
```

### 5.3 Configure Step Input

```
1. User clicks step card (list) or node (canvas)
2. Node Inspector appears in right panel
3. User sees INPUT SCHEMA with empty fields
4. User clicks input field to configure
5. Dropdown shows options:
   - Runtime Input ({{inputs.x}})
   - Config Value ({{configs.x}})
   - Literal Value ("...")
   - Previous Step Output (Step N.field)
6. User selects "Runtime Input" → "jobUrl"
7. Field shows: url ← {{inputs.jobUrl}}
```

### 5.4 Create Data Mapping

```
1. User adds second step after first
2. System prompts: "Map data from Step 1?"
   - Or: User clicks "Edit Mapping" between steps
3. DataMappingModal opens
4. Left side shows Step 1 output fields (tree)
5. Right side shows Step 2 input fields (list)
6. User clicks "Auto-Map Matching Names"
   - System maps: title→title, company→company
7. User manually maps: requirements→targetSkills
8. User clicks "Apply"
9. Edge/connection shows mapping indicator
```

### 5.5 Run Test

```
1. User clicks Test tab
2. If no saved tests: New Test form appears
3. User fills runtime inputs:
   - jobUrl: "https://example.com/job/123"
4. User clicks "Run Test"
5. Execution panel appears:
   - Step 1: Running... → ✓ (0.8s)
   - Step 2: Running... → ✓ (2.1s)
6. Status: PASSED (2.9s total)
7. User can expand each step to see output
8. User clicks "Save as Test Case" → names it "Basic flow"
```

### 5.6 Handle Test Failure

```
1. User runs test
2. Step 2 fails with error
3. Execution panel shows:
   - Step 1: ✓
   - Step 2: ✗ "TypeError: Cannot read property 'title' of undefined"
4. Failed step highlighted red in center view
5. Error details show:
   - Input data that caused failure
   - Error message
   - Suggestion: "Check that Step 1 output contains 'title'"
6. User fixes mapping
7. User re-runs test → passes
```

### 5.7 Switch Views

```
1. User is in List view
2. User clicks "Canvas" in view toggle
3. Center view transitions to canvas
4. Same steps appear as nodes
5. Edges show existing mappings
6. Chat and right panels remain unchanged
7. User edits node in canvas
8. User switches back to List view
9. Changes reflected in list
```

---

## 6. Cross-Reference: Requirements Coverage

### 6.1 Product Requirements

| PR | Requirement | Flight C Solution |
|----|-------------|-------------------|
| PR-1.1 | List connected integration tools | Tools tab, grouped by toolkit |
| PR-1.2 | List NO_AUTH tools | Tools tab, separate section |
| PR-1.3 | Display input schema | Node Inspector, step cards |
| PR-1.4 | Display output schema | Node Inspector, step cards |
| PR-1.5 | Group tools by toolkit | Tools tab grouping |
| PR-1.6 | Search/filter tools | Tools tab search bar |
| PR-2.1 | Node displays input schema | List card, Canvas node (Spec mode) |
| PR-2.2 | Node displays output schema | List card, Canvas node (Spec mode) |
| PR-2.3 | Nodes connect via edges | List: connection lines; Canvas: edges |
| PR-2.4 | Data mapping configuration | DataMappingModal |
| PR-2.5 | Terminal nodes handled | "terminal node" indicator |
| PR-3.1 | Type validation on connection | Edge validation, warnings |
| PR-3.2 | Visual indicator for invalid | Red edge, warning badge |
| PR-4.1 | Auto-detect required connections | Connect tab, auto-populated |
| PR-4.2 | Display required connections | Connect tab cards |
| PR-5.1 | Define configs | Config tab, add form |
| PR-5.2 | Reference configs in params | {{configs.x}} syntax |
| PR-8.1 | Define runtime inputs | Inputs tab, add form |
| PR-8.4 | Reference inputs in params | {{inputs.x}} syntax |
| PR-9.1 | Data mapping UI | DataMappingModal |
| PR-9.4 | Map field to field | Drag-drop or select |
| PR-9.5 | Nested field access | Tree view, dot notation |
| PR-9.6 | Auto-map matching names | "Auto-Map" button |
| PR-9.7 | Type mismatch warnings | Yellow/red indicators |
| PR-10.1 | Test button runs workflow | Test tab, "Run Test" |
| PR-10.2 | Create/save test cases | Test tab, "Save as Test Case" |
| PR-10.4 | Step-by-step results | Execution panel |
| PR-10.5 | Clear error display | Failed step highlighting |
| PR-11.1 | Catch tool errors | Error state display |
| PR-11.2 | Show which node failed | Red highlight |

### 6.2 Acceptance Criteria Coverage

| AC # | Criterion | Mockup Section |
|------|-----------|----------------|
| AC-1.1 - AC-1.7 | Node Discovery | Tools tab |
| AC-2.1 - AC-2.6 | IPO Model | Step cards, Node Inspector |
| AC-3.1 - AC-3.4 | Connection Validation | Edge styling, warnings |
| AC-4.1 - AC-4.4 | Connection Requirements | Connect tab |
| AC-5.1 - AC-5.5 | Configs | Config tab |
| AC-6.1 - AC-6.5 | Runtime Inputs | Inputs tab |
| AC-7.1 - AC-7.6 | Data Mapping | DataMappingModal |
| AC-8.1 - AC-8.7 | Testing Suite | Test tab |
| AC-9.1 - AC-9.6 | Error Handling | Error states |
| AC-12.1 - AC-12.4 | Visual Editor Views | View toggle |

### 6.3 User Flow Coverage

| Flow # | User Flow | Covered In |
|--------|-----------|------------|
| Flow 1 | Create New Workflow | Section 5.1 |
| Flow 2 | Add First Node | Section 5.2 |
| Flow 3 | Add Second Node and Connect | Section 5.4 |
| Flow 4 | Define Runtime Inputs | Inputs tab spec |
| Flow 5 | Define Configs | Config tab spec |
| Flow 6 | Test Workflow - New Test | Section 5.5 |
| Flow 7 | Test Workflow - Saved Test | Test tab spec |
| Flow 8 | Handle Test Failure | Section 5.6 |
| Flow 9 | Switch Views | Section 5.7 |
| Flow 14 | Data Mapping with Nested Fields | DataMappingModal spec |

---

## 7. Technical Constraints

### 7.1 From Research (15.2)

| Constraint | Impact on Design |
|------------|------------------|
| Mastra uses Zod schemas | Display types consistently |
| `.map()` is the data flow primitive | "Edit Mapping" creates `.map()` config |
| `.branch()` uses condition tuples | Branch nodes need condition editor |
| `outputParameters` exists but often generic | Show "data.*" with type annotations |
| Terminal nodes don't need output validation | Display "(terminal node)" not "unknown" |

### 7.2 From Implementation Plan (15.3)

| Decision | Impact on Design |
|----------|------------------|
| Start with List view | List view is default |
| Hybrid code-gen | Show "View Code" for generated TS |
| workflow.json for state | Both views read same file |
| Direct mapping MVP | No transform expressions in v1 |

### 7.3 Known Issues

| Issue | Workaround in Design |
|-------|---------------------|
| @composio/mastra incompatible | Don't reference package in generated code |
| Some tools have generic output | Show "data (object)" with note |

---

## 8. Open Questions for Implementation

| # | Question | Options | Current Preference |
|---|----------|---------|-------------------|
| OQ-UI-1 | Node Inspector as 6th tab or floating panel? | Tab / Floating | Tab (simpler) |
| OQ-UI-2 | Code view as overlay or split pane? | Overlay / Split | Split (side-by-side) |
| OQ-UI-3 | Add Step: Modal or inline dropdown? | Modal / Dropdown | Dropdown (faster) |
| OQ-UI-4 | Test results: Inline or separate panel? | Inline in Test tab | Inline (context preserved) |
| OQ-UI-5 | Dark mode support? | Yes / No / Later | Later (P2) |

---

## 9. File Breakdown Plan

The final HTML mockup will be comprehensive. To manage complexity:

### Primary File
- `index.html` — Main mockup with all states embedded

### State Sections (within index.html)
Each state will be clearly demarcated with HTML comments and section IDs:

```html
<!-- ============================================= -->
<!-- STATE: Empty Workflow -->
<!-- ============================================= -->
<section id="state-empty" class="mockup-state">
  ...
</section>

<!-- ============================================= -->
<!-- STATE: List View - Editing -->
<!-- ============================================= -->
<section id="state-list-editing" class="mockup-state">
  ...
</section>

<!-- etc. -->
```

### States to Include

| # | State ID | Description |
|---|----------|-------------|
| 1 | `state-empty` | New workflow, no steps |
| 2 | `state-list-editing` | List view with 3 steps, Spec mode |
| 3 | `state-list-flow` | List view, Flow mode (simplified) |
| 4 | `state-canvas-editing` | Canvas view with 3 nodes |
| 5 | `state-canvas-flow` | Canvas view, Flow mode |
| 6 | `state-mapping-modal` | DataMappingModal open |
| 7 | `state-test-running` | Test execution in progress |
| 8 | `state-test-passed` | Test completed successfully |
| 9 | `state-test-failed` | Test failed at step 2 |
| 10 | `state-tools-tab` | Tools tab active, search |
| 11 | `state-inputs-tab` | Inputs tab, defining input |
| 12 | `state-config-tab` | Config tab, defining config |
| 13 | `state-connect-tab` | Connect tab, missing connection |
| 14 | `state-node-inspector` | Node selected, inspector shown |
| 15 | `state-code-view` | Code view showing generated TS |

### Navigation
A state navigator will allow jumping between states:

```html
<nav id="state-navigator">
  <select onchange="showState(this.value)">
    <option value="state-empty">Empty Workflow</option>
    <option value="state-list-editing">List View - Editing</option>
    <!-- ... -->
  </select>
</nav>
```

---

## 10. Visual Style Direction

### Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Primary | Deep indigo | `#4F46E5` |
| Success | Emerald | `#10B981` |
| Warning | Amber | `#F59E0B` |
| Error | Rose | `#F43F5E` |
| Background | Slate 50 | `#F8FAFC` |
| Card | White | `#FFFFFF` |
| Border | Slate 200 | `#E2E8F0` |
| Text | Slate 900 | `#0F172A` |
| Muted | Slate 500 | `#64748B` |

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Headings | Inter | 18-24px | 600 |
| Body | Inter | 14px | 400 |
| Code | JetBrains Mono | 13px | 400 |
| Labels | Inter | 12px | 500 |

### Component Style

- Cards: `rounded-lg shadow-sm border`
- Buttons: `rounded-md px-4 py-2`
- Inputs: `rounded-md border focus:ring-2`
- Badges: `rounded-full px-2 py-0.5 text-xs`

### Inspiration Sources

- **Flight A V1**: Tabbed panels, chat layout
- **Flight A V3**: Step cards, timeline connectors
- **Flight B V2**: Light canvas, dot grid
- **Existing Tool Editor**: Three-level abstraction toggle

---

## 11. Next Steps

1. **Review this spec** — Product owner reviews for alignment
2. **Create index.html** — Comprehensive mockup with all states
3. **Iterate on feedback** — Refine based on review
4. **Implementation handoff** — Use mockup as source of truth

---

## Appendix A: Comparison with Previous Flights

| Aspect | Flight A | Flight B | Flight C |
|--------|----------|----------|----------|
| Primary view | Canvas-first | List-first | **Dual-view parity** |
| Panels | Tabbed right | Tabbed right | **Persistent chat + tabbed right** |
| Abstraction levels | Limited | Limited | **Flow / Spec / Code** |
| Mapping UI | Modal | Inline | **Modal (with auto-map)** |
| Test suite | Basic | Basic | **Full with saved test cases** |
| Error handling | Toast | Inline | **Panel + step highlighting** |
| SOP clarity | Medium | High | **Core design principle** |

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Step** | A single unit of work in a workflow (Composio tool, custom code, or control flow) |
| **Node** | Visual representation of a step in canvas view |
| **Edge** | Connection between nodes representing data flow |
| **Mapping** | Configuration of how data from one step's output becomes another step's input |
| **Runtime Input** | Value provided when workflow executes (changes each run) |
| **Config** | Value set when workflow is assigned to an agent (persists) |
| **Toolkit** | Collection of related tools (e.g., Gmail toolkit has Send Email, Read Email, etc.) |
| **Terminal Node** | A step with no downstream steps (e.g., Send Email) |

---

*End of Design Specification*






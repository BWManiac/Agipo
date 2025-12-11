# Task: SOP Layer & Scannable Workflows

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/05-canvas-ux/17-SOP-Layer-Scannable-Workflows.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Overview

### Goal

Implement an SOP (Standard Operating Procedure) layer for workflows that groups nodes into phases, assigns ownership and timing, provides a timeline view for scannability, and exports professional SOP documents in multiple formats.

### Relevant Research

The workflow canvas uses XYFlow for node rendering. The SOP layer needs to:
1. Overlay phase groupings on existing nodes
2. Store SOP metadata in workflow definition
3. Provide alternative timeline visualization
4. Generate exportable documents server-side

Key integration points:
- Workflow definition schema needs SOPLayer extension
- Canvas needs phase boundary rendering
- Export service needs document templates

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/types/workflow.ts` | Modify | Add SOPLayer types | A |
| `app/api/workflows/types/sop.ts` | Create | SOP-specific types | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/[id]/sop/route.ts` | Create | Get/update SOP config | A |
| `app/api/workflows/[id]/export/route.ts` | Create | Export SOP document | C |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/sop-manager.ts` | Create | SOP CRUD operations | A |
| `app/api/workflows/services/phase-detector.ts` | Create | Auto-detect phases | A |
| `app/api/workflows/services/sop-exporter.ts` | Create | Document generation | C |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/store/slices/sop-slice.ts` | Create | SOP layer state | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/SOPToggle.tsx` | Create | Layer toggle | B |
| `app/(pages)/workflows/editor/components/PhaseCard.tsx` | Create | Phase display | B |
| `app/(pages)/workflows/editor/components/PhaseEditor.tsx` | Create | Edit phase | B |
| `app/(pages)/workflows/editor/components/TimelineView.tsx` | Create | Timeline viz | B |
| `app/(pages)/workflows/editor/components/ExportModal.tsx` | Create | Export dialog | C |

---

## Part A: Backend SOP Infrastructure

### Goal

Build the data model, API endpoints, and services for SOP layer management and phase detection.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/types/sop.ts` | Create | Type definitions | ~120 |
| `app/api/workflows/[id]/sop/route.ts` | Create | SOP API | ~100 |
| `app/api/workflows/services/sop-manager.ts` | Create | SOP operations | ~200 |
| `app/api/workflows/services/phase-detector.ts` | Create | Auto-detection | ~250 |

### Pseudocode

#### `app/api/workflows/types/sop.ts`

```typescript
interface SOPLayer {
  enabled: boolean;
  phases: SOPPhase[];
  settings: SOPSettings;
  lastUpdated: Date;
}

interface SOPPhase {
  id: string;
  number: number;
  name: string;
  description?: string;
  nodeIds: string[];
  ownership: PhaseOwnership;
  timing: PhaseTiming;
  decisionPoints: DecisionPoint[];
  complianceTags: string[];
  color?: string;              // For timeline visualization
}

interface PhaseOwnership {
  type: 'role' | 'person' | 'team';
  value: string;
  backup?: string;
}

interface PhaseTiming {
  estimated: number;           // Minutes
  sla?: number;
  isParallel: boolean;
  dependencies: string[];      // Phase IDs that must complete first
}

interface DecisionPoint {
  nodeId: string;
  question: string;
  outcomes: {
    label: string;
    nextPhaseId?: string;
    description?: string;
  }[];
}

interface SOPSettings {
  title?: string;
  version?: string;
  effectiveDate?: Date;
  reviewDate?: Date;
  approvedBy?: string;
  documentId?: string;
  classification?: 'public' | 'internal' | 'confidential';
  customFields?: Record<string, string>;
}

interface PhaseDetectionResult {
  suggestedPhases: SOPPhase[];
  confidence: number;
  reasoning: string[];
}
```

#### `app/api/workflows/services/sop-manager.ts`

```
class SOPManager {
  async getSOPLayer(workflowId: string): Promise<SOPLayer | null>
  ├── Load workflow definition
  ├── Return sopLayer if exists
  └── Return null if not configured

  async updateSOPLayer(
    workflowId: string,
    sopLayer: SOPLayer
  ): Promise<SOPLayer>
  ├── Validate sopLayer
  │   ├── All nodeIds exist in workflow
  │   ├── No overlapping node assignments
  │   ├── Phase numbers sequential
  │   └── Ownership values valid
  ├── Load workflow definition
  ├── Update sopLayer field
  ├── Update lastUpdated timestamp
  ├── Save workflow
  └── Return updated sopLayer

  async enableSOPLayer(workflowId: string): Promise<SOPLayer>
  ├── Load workflow
  ├── If sopLayer exists, just enable
  ├── If not, run auto-detection
  │   └── Use PhaseDetector.detectPhases()
  ├── Set sopLayer.enabled = true
  ├── Save workflow
  └── Return sopLayer

  async disableSOPLayer(workflowId: string): Promise<void>
  ├── Load workflow
  ├── Set sopLayer.enabled = false
  ├── Keep configuration (don't delete)
  └── Save workflow

  async updatePhase(
    workflowId: string,
    phaseId: string,
    updates: Partial<SOPPhase>
  ): Promise<SOPPhase>
  ├── Load workflow
  ├── Find phase by ID
  ├── Merge updates
  ├── Validate (no duplicate nodes, etc.)
  ├── Recalculate phase numbers if order changed
  ├── Save workflow
  └── Return updated phase

  async addPhase(
    workflowId: string,
    phase: Omit<SOPPhase, 'id' | 'number'>
  ): Promise<SOPPhase>
  ├── Load workflow
  ├── Generate phase ID
  ├── Assign next phase number
  ├── Add to phases array
  ├── Remove nodes from other phases if reassigned
  ├── Save workflow
  └── Return new phase

  async removePhase(workflowId: string, phaseId: string): Promise<void>
  ├── Load workflow
  ├── Remove phase
  ├── Renumber remaining phases
  ├── Orphaned nodes become unassigned
  ├── Save workflow
  └── Return

  async reorderPhases(
    workflowId: string,
    phaseIds: string[]
  ): Promise<SOPPhase[]>
  ├── Load workflow
  ├── Validate all phaseIds exist
  ├── Reorder phases array
  ├── Reassign phase numbers
  ├── Save workflow
  └── Return reordered phases
}
```

#### `app/api/workflows/services/phase-detector.ts`

```
class PhaseDetector {
  detectPhases(workflow: WorkflowDefinition): PhaseDetectionResult
  ├── Build node graph from workflow
  ├── Identify phase boundaries
  │   ├── findIntegrationBoundaries()
  │   ├── findParallelGroups()
  │   ├── findDecisionBranches()
  │   └── findNaturalBreakpoints()
  ├── Group nodes into phases
  ├── Generate phase names
  │   └── Use LLM for descriptive names
  ├── Estimate timing per phase
  ├── Detect decision points
  ├── Calculate confidence score
  └── Return PhaseDetectionResult

  private findIntegrationBoundaries(
    nodes: Node[],
    edges: Edge[]
  ): Boundary[]
  ├── For each node
  │   ├── If node is integration AND
  │   ├── Previous node is not same integration type
  │   └── Mark as potential boundary
  ├── Score boundaries by graph position
  └── Return high-confidence boundaries

  private findParallelGroups(
    nodes: Node[],
    edges: Edge[]
  ): NodeGroup[]
  ├── Find fork points (one input, multiple outputs)
  ├── Find join points (multiple inputs, one output)
  ├── Group parallel branches together
  └── Return groups

  private findDecisionBranches(
    nodes: Node[],
    edges: Edge[]
  ): DecisionPoint[]
  ├── Find nodes with conditional outputs
  ├── Extract condition labels from edges
  ├── Build decision outcomes
  └── Return decision points

  private findNaturalBreakpoints(
    nodes: Node[],
    edges: Edge[]
  ): Boundary[]
  ├── Look for output/checkpoint nodes
  ├── Look for human interaction points
  ├── Look for significant transformations
  └── Return boundaries

  private generatePhaseName(
    nodes: Node[],
    context: string
  ): Promise<string>
  ├── Collect node descriptions
  ├── Build LLM prompt
  │   ├── "Given these nodes: ..."
  │   └── "Generate a 2-4 word phase name"
  ├── Call LLM
  └── Return generated name

  private estimatePhaseTiming(nodes: Node[]): number
  ├── For each node
  │   ├── Integration call: +5-30 sec based on type
  │   ├── LLM call: +10-60 sec based on complexity
  │   ├── Data transform: +1-5 sec
  │   └── Human input: +300 sec (5 min default)
  ├── Sum estimates
  └── Return total minutes
}
```

#### `app/api/workflows/[id]/sop/route.ts`

```
GET /api/workflows/[id]/sop
├── Authenticate user
├── Get workflow ID from params
├── Call sopManager.getSOPLayer(workflowId)
├── If not found
│   └── Return 404
└── Return SOPLayer JSON

PUT /api/workflows/[id]/sop
├── Authenticate user
├── Parse request body as SOPLayer
├── Validate SOPLayer structure
├── Call sopManager.updateSOPLayer(workflowId, sopLayer)
└── Return updated SOPLayer

POST /api/workflows/[id]/sop/enable
├── Authenticate user
├── Call sopManager.enableSOPLayer(workflowId)
└── Return SOPLayer (with auto-detected phases)

POST /api/workflows/[id]/sop/disable
├── Authenticate user
├── Call sopManager.disableSOPLayer(workflowId)
└── Return 204 No Content

POST /api/workflows/[id]/sop/detect
├── Authenticate user
├── Load workflow
├── Call phaseDetector.detectPhases(workflow)
└── Return PhaseDetectionResult (for preview, not saved)
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | SOPLayer can be enabled | Call enable endpoint, verify layer created |
| AC-A.2 | Phases can be updated | Update phase name, verify persisted |
| AC-A.3 | Auto-detection runs | Call detect endpoint, verify phases returned |
| AC-A.4 | Node assignment validated | Try assign node to two phases, verify error |
| AC-A.5 | Phase order maintained | Reorder phases, verify numbers update |
| AC-A.6 | SOPLayer persists with workflow | Save, reload, verify sopLayer intact |

---

## Part B: Frontend SOP Layer UI

### Goal

Build the UI components for viewing and editing the SOP layer on the workflow canvas.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/store/slices/sop-slice.ts` | Create | State | ~100 |
| `app/(pages)/workflows/editor/components/SOPToggle.tsx` | Create | Toggle | ~80 |
| `app/(pages)/workflows/editor/components/PhaseCard.tsx` | Create | Display | ~180 |
| `app/(pages)/workflows/editor/components/PhaseEditor.tsx` | Create | Editor | ~250 |
| `app/(pages)/workflows/editor/components/TimelineView.tsx` | Create | Timeline | ~300 |

### Pseudocode

#### `app/(pages)/workflows/editor/store/slices/sop-slice.ts`

```typescript
interface SOPSliceState {
  sopLayer: SOPLayer | null;
  isLoading: boolean;
  isEditing: boolean;
  selectedPhaseId: string | null;
  viewMode: 'canvas' | 'timeline';
  detectionResult: PhaseDetectionResult | null;
}

actions:
  setSOPLayer(sopLayer: SOPLayer | null)
  └── Set sopLayer state

  toggleEnabled()
  └── Toggle sopLayer.enabled, call API

  selectPhase(phaseId: string | null)
  └── Set selectedPhaseId

  setViewMode(mode: 'canvas' | 'timeline')
  └── Set viewMode

  updatePhase(phaseId: string, updates: Partial<SOPPhase>)
  └── Update phase in local state, call API

  addPhase(phase: Partial<SOPPhase>)
  └── Add phase locally, call API

  removePhase(phaseId: string)
  └── Remove phase locally, call API

  reorderPhases(phaseIds: string[])
  └── Reorder locally, call API

  runDetection()
  └── Call detect API, set detectionResult

  applyDetection()
  └── Apply detectionResult to sopLayer
```

#### `app/(pages)/workflows/editor/components/SOPToggle.tsx`

```
SOPToggle()
├── Get sopLayer and viewMode from store
├── Render toggle group
│   ├── SOP Layer toggle
│   │   ├── Icon: checklist
│   │   ├── Label: "SOP Layer"
│   │   └── Active state when sopLayer?.enabled
│   ├── View mode (when SOP enabled)
│   │   ├── "Canvas" button
│   │   └── "Timeline" button
│   └── Export button (when SOP enabled)
│       ├── Icon: download
│       └── Opens ExportModal
├── On toggle click
│   └── Dispatch toggleEnabled()
├── On view mode click
│   └── Dispatch setViewMode()
└── On export click
    └── Open export modal
```

#### `app/(pages)/workflows/editor/components/PhaseCard.tsx`

```
PhaseCard({ phase, nodes, isSelected, onSelect, onEdit })
├── Card container
│   ├── Colored left border (phase.color)
│   ├── Click to select
│   └── Highlighted when selected
├── Header
│   ├── Phase number badge
│   ├── Phase name
│   ├── Edit button (pencil icon)
│   └── Collapse/expand toggle
├── Ownership row
│   ├── Owner icon (person/team)
│   ├── Owner value
│   └── Backup owner (if set)
├── Timing row
│   ├── Clock icon
│   ├── Estimated duration
│   ├── SLA badge (if set)
│   └── Parallel indicator (if true)
├── Nodes section (collapsible)
│   ├── For each node in phase
│   │   ├── Node icon by type
│   │   ├── Node name
│   │   └── Hover: highlight on canvas
│   └── "Add nodes" link if editing
├── Decision points (if any)
│   ├── Decision icon
│   ├── Question text
│   └── Outcomes list
├── Compliance tags (if any)
│   └── Tag badges
├── On edit click
│   └── Call onEdit(phase.id)
└── On select
    └── Call onSelect(phase.id)
```

#### `app/(pages)/workflows/editor/components/PhaseEditor.tsx`

```
PhaseEditor({ phaseId, onClose })
├── Load phase from store
├── Local state for edits
├── Slide-in panel from right
├── Header
│   ├── "Edit Phase" title
│   ├── Phase number
│   └── Close button
├── Form sections
│   ├── Name section
│   │   ├── Input: phase name
│   │   └── Textarea: description
│   ├── Ownership section
│   │   ├── Type select: Role/Person/Team
│   │   ├── Value input (autocomplete)
│   │   └── Backup owner input
│   ├── Timing section
│   │   ├── Estimated duration input
│   │   ├── SLA input (optional)
│   │   ├── Parallel checkbox
│   │   └── Dependencies multi-select
│   ├── Nodes section
│   │   ├── List of assigned nodes
│   │   ├── Drag to reorder
│   │   ├── X to remove from phase
│   │   └── "Add node" button
│   │       └── Opens node picker (unassigned nodes)
│   ├── Decision points section
│   │   ├── For each decision
│   │   │   ├── Question input
│   │   │   └── Outcomes editor
│   │   └── "Add decision point" button
│   ├── Compliance section
│   │   └── Tag multi-select
│   └── Color picker
│       └── For timeline visualization
├── Footer
│   ├── "Delete Phase" button (danger)
│   ├── "Cancel" button
│   └── "Save" button
├── On save
│   └── Dispatch updatePhase()
└── On delete
    ├── Confirm dialog
    └── Dispatch removePhase()
```

#### `app/(pages)/workflows/editor/components/TimelineView.tsx`

```
TimelineView({ sopLayer, nodes })
├── Get viewMode from store
├── If viewMode !== 'timeline'
│   └── Return null
├── Calculate timeline metrics
│   ├── Total duration (sum of phases)
│   ├── Phase widths (proportional to duration)
│   └── Critical path (longest sequential chain)
├── Canvas container (horizontally scrollable)
├── Header row
│   ├── Total duration
│   ├── Time scale markers
│   └── Legend
├── Timeline track
│   ├── For each phase (sorted by dependencies)
│   │   ├── Phase block
│   │   │   ├── Width: proportional to duration
│   │   │   ├── Color: phase color
│   │   │   ├── Position: based on dependencies
│   │   │   └── Vertical: stacked for parallel phases
│   │   ├── Phase label
│   │   │   ├── Phase name
│   │   │   ├── Duration
│   │   │   └── Owner avatar
│   │   ├── Decision point marker
│   │   │   └── Diamond icon at decision nodes
│   │   └── Connection lines
│   │       └── Arrows between dependent phases
├── Interaction
│   ├── Hover: show phase details tooltip
│   ├── Click: select phase, scroll canvas to nodes
│   └── Drag: zoom/pan timeline
├── Mini-map
│   └── Shows full timeline with viewport indicator
└── On phase click
    ├── Select phase
    └── Scroll main canvas to phase nodes
```

### Integration with Canvas

```tsx
// In main canvas component
function WorkflowCanvas({ workflow }) {
  const { sopLayer, viewMode } = useSOPStore();

  // Group nodes by phase for rendering
  const nodesByPhase = useMemo(() => {
    if (!sopLayer?.enabled) return null;
    return sopLayer.phases.reduce((acc, phase) => {
      acc[phase.id] = phase.nodeIds;
      return acc;
    }, {});
  }, [sopLayer]);

  return (
    <div className="relative">
      {/* Timeline view (full screen alternative) */}
      {viewMode === 'timeline' && (
        <TimelineView sopLayer={sopLayer} nodes={nodes} />
      )}

      {/* Canvas view with phase overlays */}
      {viewMode === 'canvas' && (
        <ReactFlow nodes={nodes} edges={edges}>
          {/* Phase boundaries */}
          {sopLayer?.enabled && (
            <PhaseOverlay phases={sopLayer.phases} nodes={nodes} />
          )}

          {/* Toolbar */}
          <Panel position="top-right">
            <SOPToggle />
          </Panel>

          {/* Phase panel */}
          {sopLayer?.enabled && (
            <Panel position="left">
              <PhaseSidebar phases={sopLayer.phases} />
            </Panel>
          )}
        </ReactFlow>
      )}
    </div>
  );
}

// Phase boundary overlay
function PhaseOverlay({ phases, nodes }) {
  return (
    <>
      {phases.map(phase => (
        <PhaseBoundary
          key={phase.id}
          phase={phase}
          nodePositions={getNodePositions(phase.nodeIds, nodes)}
        />
      ))}
    </>
  );
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | SOP toggle enables/disables layer | Click toggle, verify layer shows/hides |
| AC-B.2 | Phase cards display correctly | Enable SOP, verify cards render |
| AC-B.3 | Phase editor saves changes | Edit name, save, verify persisted |
| AC-B.4 | Timeline view renders | Switch to timeline, verify display |
| AC-B.5 | Timeline proportions correct | Compare phase widths to durations |
| AC-B.6 | Node assignment works | Drag node to phase, verify assignment |
| AC-B.7 | Phase boundaries visible on canvas | Enable SOP, verify visual boundaries |

---

## Part C: Export System

### Goal

Build the export functionality to generate SOP documents in multiple formats (PDF, DOCX, Markdown).

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/[id]/export/route.ts` | Create | Export API | ~120 |
| `app/api/workflows/services/sop-exporter.ts` | Create | Document generation | ~400 |
| `app/(pages)/workflows/editor/components/ExportModal.tsx` | Create | Export UI | ~250 |

### Pseudocode

#### `app/api/workflows/services/sop-exporter.ts`

```
class SOPExporter {
  async export(
    workflow: WorkflowDefinition,
    options: SOPExportOptions
  ): Promise<Buffer>
  ├── Generate document content
  │   └── buildDocumentContent(workflow, options)
  ├── Switch on format
  │   ├── 'pdf' → generatePDF(content, options)
  │   ├── 'docx' → generateDOCX(content, options)
  │   ├── 'markdown' → generateMarkdown(content, options)
  │   └── 'html' → generateHTML(content, options)
  └── Return buffer

  private buildDocumentContent(
    workflow: WorkflowDefinition,
    options: SOPExportOptions
  ): SOPDocument
  ├── Build metadata
  │   ├── title, version, dates
  │   └── classification
  ├── Build cover page content
  │   └── title, version, effective date, approved by
  ├── Build table of contents
  │   └── Section titles with page references
  ├── Build overview section
  │   ├── Workflow description
  │   ├── Scope and purpose
  │   └── Summary diagram
  ├── Build phase sections
  │   ├── For each phase
  │   │   ├── Phase header (number, name)
  │   │   ├── Ownership table
  │   │   ├── Timing information
  │   │   ├── Step-by-step procedures
  │   │   │   └── Transform nodes to procedure steps
  │   │   ├── Decision points
  │   │   │   └── Decision tree or flowchart
  │   │   └── Compliance notes
  ├── Build flowchart
  │   └── Render workflow as diagram
  ├── Build appendix
  │   ├── Input schemas
  │   ├── Output schemas
  │   └── Glossary
  └── Return SOPDocument

  private generatePDF(
    content: SOPDocument,
    options: SOPExportOptions
  ): Promise<Buffer>
  ├── Use pdf-lib or puppeteer
  ├── Apply template styles
  ├── Render content sections
  ├── Add page numbers
  ├── Apply branding
  └── Return PDF buffer

  private generateDOCX(
    content: SOPDocument,
    options: SOPExportOptions
  ): Promise<Buffer>
  ├── Use docx library
  ├── Create document with styles
  ├── Add content sections
  ├── Insert diagrams as images
  ├── Apply branding
  └── Return DOCX buffer

  private generateMarkdown(
    content: SOPDocument,
    options: SOPExportOptions
  ): Promise<Buffer>
  ├── Build markdown string
  │   ├── YAML frontmatter for metadata
  │   ├── Headings for sections
  │   ├── Tables for structured data
  │   └── Mermaid diagrams for flowcharts
  └── Return markdown buffer

  private generateFlowchartImage(
    workflow: WorkflowDefinition,
    sopLayer: SOPLayer
  ): Promise<Buffer>
  ├── Build Mermaid diagram string
  │   ├── Subgraphs for phases
  │   ├── Nodes with labels
  │   └── Edges with conditions
  ├── Render to PNG/SVG
  └── Return image buffer
}

interface SOPDocument {
  metadata: SOPMetadata;
  coverPage?: CoverPageContent;
  tableOfContents?: TOCEntry[];
  overview: OverviewContent;
  phases: PhaseContent[];
  flowchart?: FlowchartContent;
  appendix?: AppendixContent;
}
```

#### `app/api/workflows/[id]/export/route.ts`

```
POST /api/workflows/[id]/export
├── Authenticate user
├── Get workflow ID from params
├── Parse options from body
│   ├── format: 'pdf' | 'docx' | 'markdown' | 'html'
│   ├── template: 'formal' | 'casual' | 'technical'
│   └── include: {...}
├── Load workflow definition
├── Validate workflow has SOP layer
├── Call sopExporter.export(workflow, options)
├── Set appropriate Content-Type header
│   ├── pdf → application/pdf
│   ├── docx → application/vnd.openxmlformats...
│   ├── markdown → text/markdown
│   └── html → text/html
├── Set Content-Disposition for download
└── Return buffer
```

#### `app/(pages)/workflows/editor/components/ExportModal.tsx`

```
ExportModal({ isOpen, onClose })
├── Get workflow and sopLayer from store
├── Local state for options
├── Modal overlay
├── Header: "Export as SOP Document"
├── Format section
│   ├── Format selector
│   │   ├── PDF (recommended)
│   │   ├── Word Document (.docx)
│   │   ├── Markdown
│   │   └── HTML
│   └── Template selector
│       ├── Formal (corporate)
│       ├── Casual (startup)
│       └── Technical (engineering)
├── Include section
│   ├── Checkbox grid
│   │   ├── Cover page
│   │   ├── Table of contents
│   │   ├── Flowchart diagram
│   │   ├── Time estimates
│   │   ├── Ownership table
│   │   ├── Input/Output schemas
│   │   ├── Version history
│   │   └── Appendix
├── Branding section (collapsible)
│   ├── Logo upload
│   ├── Company name input
│   └── Primary color picker
├── Preview section
│   ├── Live preview of first page
│   └── "Refresh preview" button
├── Footer
│   ├── "Cancel" button
│   └── "Export" button
├── On export
│   ├── Show loading state
│   ├── Call export API
│   ├── Trigger download
│   └── Show success toast
└── Export progress
    └── Progress bar during generation
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-C.1 | PDF export works | Export as PDF, open, verify content |
| AC-C.2 | DOCX export works | Export as DOCX, open in Word |
| AC-C.3 | Markdown export works | Export as MD, verify formatting |
| AC-C.4 | Include options respected | Toggle options, verify in export |
| AC-C.5 | Branding applied | Add logo, verify in export |
| AC-C.6 | Flowchart renders | Include flowchart, verify diagram |
| AC-C.7 | Preview updates | Change options, verify preview changes |

---

## User Flows

### Flow 1: Enable SOP Layer

```
1. User opens workflow editor
2. User clicks "SOP Layer" toggle
3. If first time:
   - System runs phase auto-detection
   - Progress indicator shows
   - Suggested phases appear
4. If configured before:
   - Previous phases load
5. Phase cards appear on left panel
6. Phase boundaries visible on canvas
7. User can switch to timeline view
```

### Flow 2: Configure Phase

```
1. User clicks phase card
2. Phase editor opens
3. User updates:
   - Phase name
   - Owner assignment
   - Time estimate
   - Node assignments
4. User clicks Save
5. Changes reflected immediately
6. Canvas boundaries update
```

### Flow 3: Export SOP

```
1. User clicks Export button
2. Export modal opens
3. User selects:
   - Format: PDF
   - Template: Formal
   - Include: All except appendix
4. User adds company logo
5. Preview updates
6. User clicks Export
7. Document generates
8. Browser downloads file
```

---

## Out of Scope

- Collaborative SOP editing
- SOP approval workflows
- Version comparison for SOP changes
- Automated compliance checking
- SOP-only mode (without technical workflow)
- Import SOP to create workflow
- Multi-language export

---

## Open Questions

- [ ] Should phase detection use LLM or rule-based heuristics?
- [ ] How to handle workflows with no clear phase boundaries?
- [ ] Should we support custom export templates?
- [ ] How to handle very large workflows (100+ nodes)?
- [ ] Should ownership integrate with external directory services?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |

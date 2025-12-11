# SOP Layer & Scannable Workflows

**Status:** Draft
**Priority:** P2
**North Star:** User opens any workflow, sees clear "Manager's View" — numbered phases, decision points, ownership assignments, and time estimates — as if reading a company's operational manual.

---

## Problem Statement

Workflows are technical artifacts optimized for execution, but organizations also need them as:
1. Standard Operating Procedures (SOPs) for training and compliance
2. Process documentation for audits
3. Reference guides for managers who don't run workflows themselves
4. Onboarding materials for new team members

**The Gap:** No way to view/export workflows as traditional SOP documents with phases, ownership, and timing.

---

## User Value

- **Compliance-ready** — Generate SOPs that satisfy audit requirements
- **Training materials** — New hires can learn processes from workflow SOPs
- **Management visibility** — Executives see process overview without technical details
- **Documentation debt eliminated** — SOPs auto-update when workflows change
- **Cross-functional alignment** — Same source of truth for execution and documentation

---

## User Flows

### Flow 1: View Workflow as SOP

```
1. User opens a workflow
2. User clicks "View as SOP" or toggles "SOP Layer"
3. Workflow transforms to SOP view:
   - Nodes grouped into numbered phases
   - Each phase shows:
     - Phase number and name
     - Responsible role/person
     - Estimated duration
     - Decision points highlighted
     - Inputs/outputs in plain language
4. User can collapse/expand phases
5. User can annotate phases with additional context
6. View syncs with underlying workflow
```

### Flow 2: Export SOP Document

```
1. User has workflow open
2. User clicks "Export" → "As SOP Document"
3. Export options appear:
   - Format: PDF, DOCX, Markdown, HTML
   - Include: Flowchart, Time estimates, Ownership table
   - Style: Formal, Casual, Technical
4. User selects options and clicks "Export"
5. System generates document with:
   - Title page (workflow name, version, date)
   - Table of contents
   - Overview section
   - Phase-by-phase procedures
   - Decision tree diagrams
   - Appendix (input schemas, outputs)
6. Document downloads
```

### Flow 3: Configure SOP Metadata

```
1. User is editing workflow
2. User opens "SOP Settings" panel
3. User configures:
   - Phase groupings (which nodes belong to which phase)
   - Phase names and descriptions
   - Ownership assignments (role or person per phase)
   - Time estimates per phase
   - Compliance tags (SOC2, HIPAA, etc.)
4. Metadata saved with workflow
5. SOP view reflects configuration
6. Changes tracked in version history
```

### Flow 4: Scannable Workflow Timeline

```
1. User wants quick overview of long workflow
2. User clicks "Timeline View" toggle
3. Workflow displays as horizontal timeline:
   - Left to right: phases in sequence
   - Width: proportional to estimated duration
   - Colors: by ownership/department
   - Icons: decision points, parallel work, integrations
4. Clicking timeline segment zooms to those nodes
5. Timeline updates as workflow changes
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/(pages)/workflows/editor/` | Canvas components | Node rendering |
| `lib/workflow/` | Workflow types | Definition structure |
| `lib/export/` | Export services | Document generation |
| `components/ui/` | UI components | Timeline, cards |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Phase grouping | User-defined with auto-suggestions | Flexibility + intelligence |
| SOP storage | In workflow definition | Single source of truth |
| Export generation | Server-side | Handle complex layouts |
| Timeline rendering | Canvas-based | Smooth zoom/pan |

---

## Architecture

### SOP Data Model

```typescript
interface SOPLayer {
  enabled: boolean;
  phases: SOPPhase[];
  settings: SOPSettings;
}

interface SOPPhase {
  id: string;
  number: number;              // 1, 2, 3...
  name: string;                // "Initial Review"
  description?: string;        // Detailed explanation
  nodeIds: string[];           // Nodes in this phase
  ownership: PhaseOwnership;
  timing: PhaseTiming;
  decisionPoints: DecisionPoint[];
  complianceTags: string[];    // ['SOC2', 'HIPAA']
}

interface PhaseOwnership {
  type: 'role' | 'person' | 'team';
  value: string;               // "Engineering Manager", "john@example.com"
  backup?: string;             // Secondary owner
}

interface PhaseTiming {
  estimated: number;           // Minutes
  sla?: number;                // Max minutes for SLA
  isParallel: boolean;         // Can run alongside other phases
}

interface DecisionPoint {
  nodeId: string;
  question: string;            // "Is document valid?"
  outcomes: DecisionOutcome[];
}

interface DecisionOutcome {
  label: string;               // "Yes", "No", "Needs Review"
  nextPhase?: string;          // Phase ID
  description?: string;
}

interface SOPSettings {
  title: string;               // Override workflow name
  version: string;             // SOP version (may differ from workflow)
  effectiveDate?: Date;
  reviewDate?: Date;
  approvedBy?: string;
  documentId?: string;         // External doc management ID
  classification?: 'public' | 'internal' | 'confidential';
}
```

### Phase Auto-Detection

```typescript
interface PhaseDetectionConfig {
  // Heuristics for auto-grouping nodes
  rules: PhaseRule[];
}

type PhaseRule =
  | { type: 'integration_boundary'; description: string }
  | { type: 'parallel_group'; description: string }
  | { type: 'decision_branch'; description: string }
  | { type: 'output_checkpoint'; description: string }
  | { type: 'human_interaction'; description: string };

// Example auto-detected phases:
// 1. "Data Collection" - input nodes + first integration calls
// 2. "Processing" - transformation/mapping nodes
// 3. "Review Point" - branch with human decision
// 4. "Finalization" - output nodes + final integrations
```

### Export Templates

```typescript
interface SOPExportOptions {
  format: 'pdf' | 'docx' | 'markdown' | 'html';
  template: 'formal' | 'casual' | 'technical' | 'custom';
  include: {
    coverPage: boolean;
    tableOfContents: boolean;
    flowchart: boolean;
    timeEstimates: boolean;
    ownershipTable: boolean;
    inputOutputSchemas: boolean;
    versionHistory: boolean;
    appendix: boolean;
  };
  branding?: {
    logo?: string;
    primaryColor?: string;
    companyName?: string;
  };
}
```

---

## Visual Design

### SOP Layer View

```
┌─────────────────────────────────────────────────────────────┐
│ Workflow: Employee Onboarding                    [SOP: ON]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PHASE 1: Document Collection        👤 HR Coordinator   │ │
│ │ ⏱️ ~15 min                                              │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │  ┌──────────┐    ┌──────────┐    ┌──────────┐          │ │
│ │  │ Receive  │ →  │ Validate │ →  │  Store   │          │ │
│ │  │  Docs    │    │   IDs    │    │  Files   │          │ │
│ │  └──────────┘    └──────────┘    └──────────┘          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PHASE 2: Account Setup              👤 IT Administrator │ │
│ │ ⏱️ ~30 min                          ⚠️ Decision Point   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │  ┌──────────┐    ┌──────────┐    ┌──────────┐          │ │
│ │  │ Create   │ →  │ Assign   │ →  │  Setup   │          │ │
│ │  │  Email   │    │  Groups  │    │   VPN    │          │ │
│ │  └──────────┘    └──────────┘    └──────────┘          │ │
│ │                       │                                  │ │
│ │              ┌────────┴────────┐                        │ │
│ │              ▼                 ▼                        │ │
│ │         [Remote?]         [On-site?]                   │ │
│ │         → Phase 3         → Phase 4                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Timeline View

```
┌─────────────────────────────────────────────────────────────┐
│ Timeline View                              Total: ~2 hours  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ├──15m──┼────30m────┼──20m──┼────45m────┼──10m──┤          │
│                                                             │
│ ┌───────┐┌──────────┐┌──────┐┌──────────┐┌──────┐          │
│ │ Doc   ││ Account  ││Review││ Training ││ Done │          │
│ │ Coll. ││  Setup   ││ ◇    ││ Assign   ││      │          │
│ │ 👤 HR ││ 👤 IT    ││👤 Mgr││ 👤 HR    ││👤 HR │          │
│ └───────┘└──────────┘└──────┘└──────────┘└──────┘          │
│                                                             │
│ Legend:  ◇ = Decision Point   ║ = Parallel Work            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Export Preview

```
┌─────────────────────────────────────────────────────────────┐
│ Export as SOP Document                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Format:    [PDF ▼]        Template:  [Formal ▼]            │
│                                                             │
│ Include:                                                    │
│ ☑ Cover page             ☑ Ownership table                 │
│ ☑ Table of contents      ☑ Time estimates                  │
│ ☑ Flowchart              ☐ Input/Output schemas            │
│ ☑ Version history        ☐ Appendix                        │
│                                                             │
│ Branding:                                                   │
│ Logo: [Upload]           Company: [Acme Corp       ]       │
│ Color: [#2563EB]                                           │
│                                                             │
│ Preview:                                                    │
│ ┌───────────────────────────────────────────────┐          │
│ │     STANDARD OPERATING PROCEDURE              │          │
│ │     Employee Onboarding Process               │          │
│ │     Version 2.1 | Effective: Dec 2024         │          │
│ │     ─────────────────────────────             │          │
│ │     TABLE OF CONTENTS                         │          │
│ │     1. Overview....................... 2      │          │
│ │     2. Phase 1: Document Collection... 3      │          │
│ │     3. Phase 2: Account Setup......... 5      │          │
│ └───────────────────────────────────────────────┘          │
│                                                             │
│               [Cancel]  [Export]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Constraints

- **Phase limits** — Max 20 phases per workflow for readability
- **Export size** — Large workflows may produce lengthy documents
- **Real-time sync** — SOP view must stay in sync with canvas edits
- **Localization** — SOP exports may need multiple languages
- **Accessibility** — Exported documents must be accessible (WCAG)

---

## Success Criteria

- [ ] SOP layer toggle works without breaking canvas
- [ ] Phases can be manually configured
- [ ] Auto-detection suggests reasonable phase groupings
- [ ] Timeline view renders correctly for complex workflows
- [ ] PDF export produces professional document
- [ ] DOCX export is editable
- [ ] Ownership assignments display correctly
- [ ] Time estimates calculate totals
- [ ] Decision points clearly marked in all views

---

## Out of Scope

- Collaborative SOP editing (separate from workflow editing)
- SOP approval workflows
- Version comparison between SOP versions
- Automated compliance checking
- SOP-only mode (without workflow)
- Import SOP to create workflow (reverse)

---

## Open Questions

- Should SOPs have separate versioning from workflows?
- How do we handle workflows with no clear phase boundaries?
- Should we support custom export templates?
- How do we handle very large workflows (100+ nodes)?
- Should ownership integrate with org chart/directory?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| SOP Layer Toggle | Mode switch | On/off states |
| Phase Card | Phase display | All metadata |
| Phase Editor | Configure phase | All fields |
| Timeline View | Timeline display | Multiple phases |
| Export Modal | Export options | All configurations |
| Export Preview | Document preview | Sample pages |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── sop-layer/
│   ├── sop-toggle.html
│   ├── phase-card.html
│   ├── phase-editor.html
│   ├── timeline-view.html
│   ├── export-modal.html
│   └── export-preview.html
```

---

## References

- ISO 9001: Quality management systems documentation
- BPMN 2.0: Business process modeling notation
- Notion SOP templates: UX inspiration
- Confluence runbooks: Enterprise documentation patterns

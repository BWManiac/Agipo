# Research Log: SOP & Workflow UX Patterns

**Status:** Not Started
**Date:** December 2024
**Related Roadmaps:**
- `05-canvas-ux/15-Plain-English-Canvas-Separate-Mode.md`
- `05-canvas-ux/16-Plain-English-Canvas-Overlay.md`
- `05-canvas-ux/17-SOP-Layer-Scannable-Workflows.md`

---

## How to Use This Document

This is a **research log** for discovering UX patterns used by leading tools in the workflow, SOP, and process documentation space. Understanding industry patterns helps us design intuitive interfaces that users already understand.

**Scope:**
1. **Visual workflow editors** — How tools like n8n, Zapier, Make visualize workflows
2. **SOP tools** — How Process Street, Notion runbooks, and Confluence handle procedures
3. **Dual-view patterns** — Tools that offer both technical and simplified views
4. **Export & documentation** — How tools generate documentation from workflows

**Philosophy:** Good UX borrows proven patterns. We research what works, understand why, then adapt to Agipo's context.

**Status Key:** ❓ Not Researched | 🔍 In Progress | ✅ Answered | ⚠️ Blocked

---

## Quick Reference

| Question | Unlocks Feature | Status |
|----------|-----------------|--------|
| [RQ-1: Workflow editor layouts](#rq-1-workflow-editor-layouts) | Canvas design | ❓ |
| [RQ-2: Node representation](#rq-2-node-representation-patterns) | Node components | ❓ |
| [RQ-3: Plain English patterns](#rq-3-plain-english-patterns) | Simple View | ❓ |
| [RQ-4: Dual-view switching](#rq-4-dual-view-switching) | View toggle | ❓ |
| [RQ-5: SOP tool patterns](#rq-5-sop-tool-patterns) | SOP Layer | ❓ |
| [RQ-6: Annotation systems](#rq-6-annotation-systems) | Overlay annotations | ❓ |
| [RQ-7: Timeline visualizations](#rq-7-timeline-visualizations) | Timeline View | ❓ |
| [RQ-8: Documentation export](#rq-8-documentation-export) | SOP Export | ❓ |
| [RQ-9: Onboarding patterns](#rq-9-onboarding-patterns) | First-time UX | ❓ |
| [RQ-10: Mobile/responsive patterns](#rq-10-mobile-responsive-patterns) | Mobile support | ❓ |

---

## Part 1: Workflow Editor Research

### RQ-1: Workflow Editor Layouts

**Why It Matters:** Canvas layout decisions affect how users understand and build workflows. We need to understand industry patterns.

**Status:** ❓ Not Researched

**Tools to Research:**
- n8n
- Zapier
- Make (Integromat)
- Retool Workflows
- Tray.io
- Workato

**Questions:**
1. What layout direction do most tools use (LTR, TTB)?
2. How are nodes positioned — snap to grid, free-form, auto-layout?
3. What information density is typical per node?
4. How do tools handle canvas navigation (pan, zoom)?

**Observations:**

| Tool | Layout Direction | Grid | Information Density | Navigation |
|------|------------------|------|---------------------|------------|
| n8n | | | | |
| Zapier | | | | |
| Make | | | | |
| Retool | | | | |
| Tray.io | | | | |

**Common Patterns:**
1.
2.
3.

**Anti-Patterns to Avoid:**
1.
2.

**Implementation Note:**

**Source:** Product screenshots and documentation

---

### RQ-2: Node Representation Patterns

**Why It Matters:** Node design determines at-a-glance comprehension. We need to balance information density with clarity.

**Status:** ❓ Not Researched

**Questions:**
1. What do nodes typically show? (icon, name, status, inputs/outputs)
2. How are different node types visually distinguished?
3. What color systems are used?
4. How are errors/warnings shown on nodes?

**Observations:**

| Tool | Icon | Title | Description | I/O Ports | Status | Size |
|------|------|-------|-------------|-----------|--------|------|
| n8n | | | | | | |
| Zapier | | | | | | |
| Make | | | | | | |

**Node State Patterns:**

| State | Visual Treatment (Common) |
|-------|--------------------------|
| Idle | |
| Running | |
| Success | |
| Error | |
| Disabled | |

**Best Practices:**
1.
2.
3.

**Implementation Note:**

**Source:**

---

### RQ-3: Plain English Patterns

**Why It Matters:** Our "Simple View" (doc 15) needs to present workflows in non-technical terms. Research how others do this.

**Status:** ❓ Not Researched

**Tools to Research:**
- Zapier's "Zap description"
- IFTTT's "If This Then That" format
- Microsoft Power Automate's "Flow description"
- Process Street's step descriptions

**Questions:**
1. How do tools auto-generate plain English from technical workflows?
2. What level of detail is shown in simplified views?
3. How are conditional branches explained in plain language?
4. Do any tools offer sentence-like workflow descriptions?

**Observations:**

| Tool | Description Format | Auto-Generated? | User-Editable? |
|------|-------------------|-----------------|----------------|
| Zapier | | | |
| IFTTT | | | |
| Power Automate | | | |
| Process Street | | | |

**Language Patterns:**

| Technical Concept | Plain English Pattern |
|-------------------|----------------------|
| HTTP Request | "Gets data from..." |
| Conditional | "If... then..." |
| Loop | "For each..." |
| Variable | "Using the..." |
| Integration action | "In [App], [action]..." |

**Implementation Note:**

**Source:**

---

### RQ-4: Dual-View Switching

**Why It Matters:** We offer both technical canvas and simple view. How do other tools handle view switching?

**Status:** ❓ Not Researched

**Tools to Research:**
- Figma (design/prototype/dev modes)
- Notion (page view/database view)
- Airtable (grid/kanban/calendar views)
- Linear (list/board views)

**Questions:**
1. How is the view switcher positioned?
2. Is the switch instant or animated?
3. What state persists across views?
4. Can users have preferences for default view?

**Observations:**

| Tool | Switcher Position | Animation | State Sync | Default Setting |
|------|-------------------|-----------|------------|-----------------|
| Figma | | | | |
| Notion | | | | |
| Airtable | | | | |
| Linear | | | | |

**Best Practices:**
1.
2.
3.

**Implementation Note:**

**Source:**

---

## Part 2: SOP Tool Research

### RQ-5: SOP Tool Patterns

**Why It Matters:** Our SOP Layer (doc 17) transforms workflows into SOPs. Research dedicated SOP tools for patterns.

**Status:** ❓ Not Researched

**Tools to Research:**
- Process Street
- Trainual
- SweetProcess
- Notion (as SOP tool)
- Confluence runbooks

**Questions:**
1. How are SOPs typically structured?
2. What metadata is included (owner, timing, approvals)?
3. How are decision points represented?
4. What makes an SOP "scannable"?

**Observations:**

| Tool | Structure | Ownership | Timing | Decisions | Compliance |
|------|-----------|-----------|--------|-----------|------------|
| Process Street | | | | | |
| Trainual | | | | | |
| SweetProcess | | | | | |
| Notion | | | | | |

**Common SOP Sections:**
1.
2.
3.
4.
5.

**Scannability Patterns:**
-
-
-

**Implementation Note:**

**Source:**

---

### RQ-6: Annotation Systems

**Why It Matters:** Overlay mode (doc 16) includes annotations. Research how collaboration tools handle annotations.

**Status:** ❓ Not Researched

**Tools to Research:**
- Figma comments
- Miro sticky notes
- Google Docs comments
- Notion comments
- Loom video annotations

**Questions:**
1. How are annotations positioned relative to content?
2. Are annotations always visible or on-demand?
3. How are resolved/unresolved annotations handled?
4. What's the annotation input experience?

**Observations:**

| Tool | Positioning | Visibility | Threading | Resolution |
|------|-------------|------------|-----------|------------|
| Figma | | | | |
| Miro | | | | |
| Google Docs | | | | |
| Notion | | | | |

**Annotation UX Patterns:**
1.
2.
3.

**Implementation Note:**

**Source:**

---

### RQ-7: Timeline Visualizations

**Why It Matters:** SOP Layer includes a timeline view. Research how project/process tools visualize timelines.

**Status:** ❓ Not Researched

**Tools to Research:**
- Gantt charts (Monday.com, Asana)
- Process flow diagrams (Lucidchart)
- Timeline views (Airtable, Notion)
- Journey maps (Miro, FigJam)

**Questions:**
1. How is time represented (linear, proportional)?
2. How are parallel activities shown?
3. How are dependencies visualized?
4. What interactions are supported (zoom, filter)?

**Observations:**

| Tool | Time Representation | Parallel Work | Dependencies | Interaction |
|------|---------------------|---------------|--------------|-------------|
| Monday.com | | | | |
| Asana | | | | |
| Airtable | | | | |
| Miro | | | | |

**Timeline Best Practices:**
1.
2.
3.

**Implementation Note:**

**Source:**

---

### RQ-8: Documentation Export

**Why It Matters:** SOP export generates documents. Research how tools handle documentation export.

**Status:** ❓ Not Researched

**Tools to Research:**
- Notion export
- Confluence export
- Process Street export
- Lucidchart export
- Figma export (to spec)

**Questions:**
1. What formats are typically supported?
2. What customization options exist?
3. How is branding handled?
4. How do dynamic elements (diagrams) export?

**Observations:**

| Tool | Formats | Customization | Branding | Diagrams |
|------|---------|---------------|----------|----------|
| Notion | | | | |
| Confluence | | | | |
| Process Street | | | | |
| Lucidchart | | | | |

**Export Best Practices:**
1.
2.
3.

**Implementation Note:**

**Source:**

---

## Part 3: General UX Research

### RQ-9: Onboarding Patterns

**Why It Matters:** New users need guidance on workflow creation. Research onboarding in complex tools.

**Status:** ❓ Not Researched

**Tools to Research:**
- Notion first-time experience
- Figma onboarding
- n8n templates
- Zapier guided setup

**Questions:**
1. How do tools introduce complex concepts?
2. What role do templates play in onboarding?
3. How is progressive disclosure implemented?
4. What metrics indicate successful onboarding?

**Observations:**

| Tool | First Experience | Templates | Progressive Disclosure | Success Metric |
|------|------------------|-----------|------------------------|----------------|
| Notion | | | | |
| Figma | | | | |
| n8n | | | | |
| Zapier | | | | |

**Onboarding Patterns:**
1.
2.
3.

**Implementation Note:**

**Source:**

---

### RQ-10: Mobile/Responsive Patterns

**Why It Matters:** Users may view workflows on mobile. Research responsive patterns for complex interfaces.

**Status:** ❓ Not Researched

**Tools to Research:**
- Notion mobile
- Monday.com mobile
- Trello mobile
- Zapier mobile

**Questions:**
1. Do tools support full editing on mobile?
2. How are canvas-based UIs adapted?
3. What features are mobile-only or desktop-only?
4. How is touch interaction handled?

**Observations:**

| Tool | Mobile Editing | Canvas Adaptation | Feature Parity | Touch UX |
|------|----------------|-------------------|----------------|----------|
| Notion | | | | |
| Monday.com | | | | |
| Trello | | | | |
| Zapier | | | | |

**Mobile Patterns:**
1.
2.
3.

**Recommendation for Agipo:**

**Source:**

---

## Part 4: Competitive Analysis

### Direct Competitors

| Competitor | Strengths | Weaknesses | Unique Features |
|------------|-----------|------------|-----------------|
| n8n | | | |
| Zapier | | | |
| Make | | | |

### Adjacent Products

| Product | Relevance | Learnings |
|---------|-----------|-----------|
| Notion | | |
| Figma | | |
| Process Street | | |

### Differentiation Opportunities

Based on research, Agipo can differentiate with:
1.
2.
3.

---

## Summary

### UX Patterns We'll Adopt

| Pattern | From | Applied To |
|---------|------|------------|
| | | |
| | | |
| | | |

### Patterns to Avoid

| Anti-Pattern | Why | Example |
|--------------|-----|---------|
| | | |
| | | |

### Key Learnings

[To be filled after research]

1. Workflow layout:
2. Node design:
3. Plain English:
4. View switching:
5. SOP structure:
6. Annotations:
7. Timelines:
8. Export:
9. Onboarding:
10. Mobile:

---

## Exit Criteria

- [ ] All tools reviewed with screenshots
- [ ] Pattern documentation complete
- [ ] Competitive analysis complete
- [ ] Design recommendations documented
- [ ] Mockup inspiration collected

**Next Step:** Share findings with UXD team for mockup creation

---

## Resources Used

### Tool Documentation
- [n8n Docs](https://docs.n8n.io/)
- [Zapier Help](https://zapier.com/help)
- [Make Help](https://www.make.com/en/help)
- [Process Street](https://www.process.st/)

### Design Systems
- [Figma Design System](https://www.figma.com/design/)
- [Notion Design Patterns](https://www.notion.so/)

### Articles & Research
- [To be added]

### Screenshots & Recordings
- Store in `_docs/UXD/Research/workflow-ux-screenshots/`

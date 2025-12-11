# Plain English Canvas — Overlay Mode

**Status:** Draft
**Priority:** P1
**North Star:** User hovers over node, sees plain English tooltip: "This step sends an email to the recipient with the generated cover letter." Technical details visible but de-emphasized.

---

## Problem Statement

The separate "Simple View" mode (document 15) provides a clean read-only experience, but users working in the technical canvas still face:
1. Cryptic node names and configurations
2. Need to switch modes frequently to understand steps
3. Loss of spatial context when switching views
4. No in-context explanation while editing

**The Gap:** No way to see plain English explanations while staying in the technical canvas.

---

## User Value

- **In-context understanding** — See explanations without leaving the canvas
- **Learning tool** — Understand what technical components do
- **Reduced cognitive load** — Quick tooltips instead of mode switching
- **Spatial context preserved** — Understand while seeing the full workflow
- **Progressive disclosure** — Details on demand

---

## User Flows

### Flow 1: Hover for Explanation

```
1. User is in technical canvas view
2. User hovers over "GMAIL_SEND_EMAIL" node
3. Tooltip appears with:
   - Plain name: "Send Email"
   - Description: "Sends an email using your Gmail account"
   - Inputs summary: "To: {recipient}, Subject: {subject}"
   - Output summary: "Returns message ID"
4. User moves to next node
5. New tooltip appears
6. User understands workflow without clicking
```

### Flow 2: Toggle Overlay Labels

```
1. User is in technical canvas view
2. User clicks "Show Labels" toggle in toolbar
3. All nodes now display:
   - Plain English name above technical name
   - Brief description below node
4. Canvas remains fully interactive
5. Connections still visible
6. User can toggle labels off to reduce clutter
```

### Flow 3: Annotation Mode

```
1. User wants to add custom explanations
2. User enters "Annotation Mode"
3. User clicks on node
4. Text input appears
5. User types: "This step handles the edge case where..."
6. Annotation saved and visible as overlay
7. Annotations persist in workflow definition
8. Other users see annotations
```

### Flow 4: Quick Info Panel

```
1. User clicks node (not hover)
2. Quick info panel slides in from side
3. Panel shows:
   - Plain English summary
   - What this step does
   - What it needs (inputs)
   - What it produces (outputs)
   - Connection to other steps
4. Technical config panel available via tab
5. User can edit description directly
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/(pages)/workflows/editor/` | Canvas components | Node rendering |
| `components/ui/` | Tooltip, popover | UI primitives |
| `lib/workflow/description-generator.ts` | From Simple View | Reuse |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Implementation | Overlay on existing canvas | Preserve full functionality |
| Trigger | Hover + persistent labels | Multiple interaction patterns |
| Annotation storage | In workflow definition | Persist with workflow |
| Description source | Generated + user edits | Accuracy + customization |

---

## Architecture

### Overlay Layer

```
Technical Canvas (XYFlow)
         ↓
┌─────────────────────────────────────────┐
│           Overlay Layer                 │
│  - Positioned relative to nodes         │
│  - Doesn't interfere with canvas events │
│  - Updates with canvas transform        │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│        Tooltip/Label Components         │
│  - NodeTooltip (hover)                  │
│  - NodeLabel (persistent)               │
│  - NodeAnnotation (user notes)          │
└─────────────────────────────────────────┘
```

### Data Model Extensions

```typescript
interface NodeOverlayData {
  // In workflow.steps[n]
  plainEnglish?: {
    name: string;           // User-editable
    description: string;    // User-editable
    annotations: Annotation[];
  };
}

interface Annotation {
  id: string;
  text: string;
  position: 'above' | 'below' | 'side';
  createdBy: string;
  createdAt: Date;
}
```

### Overlay State

```typescript
interface OverlayState {
  showLabels: boolean;       // Persistent labels toggle
  hoveredNodeId: string | null;
  annotationMode: boolean;
  selectedAnnotation: string | null;
}
```

---

## Visual Design

### Hover Tooltip

```
┌─────────────────────────────────┐
│ Send Email                      │
├─────────────────────────────────┤
│ Sends an email using your       │
│ Gmail account.                  │
│                                 │
│ Inputs:                         │
│ • recipient_email ← workflow    │
│ • subject ← Extract step        │
│ • body ← Generate step          │
│                                 │
│ Produces:                       │
│ • message_id                    │
└─────────────────────────────────┘
          △
    (pointer to node)
```

### Persistent Labels

```
         "Send Email"              ← Label above
┌─────────────────────────┐
│     GMAIL_SEND_EMAIL    │        ← Technical node
│          ...            │
└─────────────────────────┘
   "Send cover letter"             ← Label below (description)
```

### Annotation Bubble

```
        ┌────────────────────┐
        │ Note: This step    │
        │ uses the tailored  │   ← Annotation
        │ cover letter from  │
        │ step 4             │
        └────────────────────┘
               │
               ▼
┌─────────────────────────┐
│     GMAIL_SEND_EMAIL    │
│          ...            │
└─────────────────────────┘
```

---

## Constraints

- **Performance** — Overlays must not slow canvas interaction
- **Pointer events** — Overlays shouldn't block node interaction
- **Zoom handling** — Labels must scale/hide appropriately
- **Position updates** — Must sync with canvas pan/zoom
- **Mobile** — Touch-friendly alternative to hover

---

## Success Criteria

- [ ] Hover tooltip appears with plain English info
- [ ] Labels toggle shows/hides persistent labels
- [ ] Labels position correctly on all nodes
- [ ] Annotations can be added and saved
- [ ] Overlays don't block canvas interaction
- [ ] Performance acceptable with 50+ nodes
- [ ] Zoom affects label visibility appropriately
- [ ] User can edit descriptions inline

---

## Out of Scope

- Voice annotations
- Video annotations
- Real-time collaborative annotations
- AI-generated annotations (stretch goal)
- Custom label positioning

---

## Open Questions

- Should labels auto-hide at certain zoom levels?
- How do we handle overlapping labels?
- Should annotations be visible to all users or personal?
- Should we show connection descriptions (edge labels)?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Hover Tooltip | Tooltip design | Content, positioning |
| Labels Toggle | Toggle state | On/off appearance |
| Persistent Labels | Labels on canvas | Multiple nodes |
| Annotation Mode | Add annotation | Input, bubble |
| Zoom Behavior | Scale handling | Different zoom levels |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── plain-english-overlay/
│   ├── hover-tooltip.html
│   ├── labels-toggle.html
│   ├── persistent-labels.html
│   ├── annotation-mode.html
│   └── zoom-behavior.html
```

---

## References

- XYFlow overlays: Custom node rendering
- Figma annotations: Inspiration for annotation UX
- Description generator: `lib/workflow/description-generator.ts` (from doc 15)

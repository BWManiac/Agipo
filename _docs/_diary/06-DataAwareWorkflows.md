# Diary Entry 6: Toward Data-Aware Workflows

**Date:** [Early 2025]  
**Task:** N/A  
**Status:** ✅ Complete

---

## 1. Context

The Workflow Generator has matured from a proof-of-concept canvas into a structured authoring environment that can scale to real business automation scenarios. Over the last cycle we focused on **scannability, maintainability, and data fidelity**:

1. UI refactor for node clarity - titles, flow summaries, and specs are now editable but concise
2. Editor architecture cleanup - node-specific controls live under `components/editor/spec`
3. Data binding initiative - designed state shape, validation rules, and UX for explicit edge mappings
4. Assistant-aware tooling - Gemini-assisted chat manipulates workflow with enriched context

This entry documents the product areas touched, problems solved, and assumptions future developers need to know.

---

## 2. Implementation Summary

### Files Created/Modified

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `components/CodeNode.tsx` | Modify | Show short Flow/Spec/Code summary card | ~50 |
| `components/code-node/SpecContent.tsx` | Create | Simplified spec summary display | ~30 |
| `components/editor/spec/` | Create | Node-specific controls (SpecFieldRow, ProcessStepItem, SectionHeader) | ~150 |
| `components/Sidebar.tsx` | Modify | Orchestrates tabs, delegates to smaller components | ~40 |
| `_docs/UXD/Pages/workflow/io-visualizations/edge-editor-option{1,2,3}.html` | Create | High-fidelity mockups for edge editor | ~300 |
| `_docs/UXD/Pages/workflow/io-visualizations/workflow-edge-mapping.md` | Create | Detailed spec for edge mappings | ~200 |

### Node Editing Experience

**Problem:** Original experiment exposed full spec editors inline, making nodes huge and hard to scan.

**Solution:**
- Refactored `CodeNode.tsx` to show short Flow/Spec/Code summary card
- Detailed editing lives in sidebar (`NodeEditor`)
- Added inline title editing with React Flow selection highlighting
- Simplified spec summary to show only key inputs/outputs

### Editor Component Architecture

**Problem:** All editing logic lived in monolithic files, hindering reuse.

**Solution:**
- Grouped node-specific controls in `components/editor/spec/`
- Prepared editor for data-mapping views (sibling folder `editor/data-mapping/`)
- Sidebar now orchestrates tabs; rendering delegated to smaller components

### Data Binding & Validation (Design Phase)

**Problem:** Edges currently pipe stdout → stdin with no awareness of which fields flow where.

**Artifacts Created:**
- Edge editor mockups (table, card, split panel) - Option 1 (table) will guide implementation
- Detailed spec covering slice shape, business-friendly types, validation rules, execution integration
- Acceptance criteria for types (`text`, `number`, `flag`, `list`, `record`, `file`) and compatibility checks

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Node Display | Compact cards with sidebar editing | Improves scannability while preserving rich editing |
| Component Organization | Modular sub-components | Easier to maintain and extend |
| Edge Mappings | Design phase first | Ensures solid foundation before implementation |
| Business-Friendly Types | text, number, flag, list, record, file | User-friendly, maps to Zod schemas |

---

## 4. Technical Deep Dive

### Assumptions & Guidance for Future Developers

**Business-Friendly Types:**
- `text`, `number`, `flag` (boolean), `list` (with `itemType`), `record`, `file`
- Lists default to `list of text` unless specified
- Edge bindings must ensure source and target types match

**State Management:**
- Continue using Zustand slice pattern
- Upcoming `ioMappingSlice` will live alongside existing slices
- Build with pure functions for testability

**UI Components:**
- Shadcn is default UI library
- Edge editor table will use `<Table>`, `<Select>`, `<Badge>`, `<Card>`
- Avoid hand-rolled HTML when shadcn component exists

**Execution Strategy:**
- Current runner still pipes stdout between nodes
- After edge bindings ship, wrappers will serialize JSON payloads based on mappings
- Node scripts will read/write `/tmp/io-<edgeId>.json`

**AI Integration:**
- Chat tools live in `app/(pages)/workflow-generator/tools/`
- Updates route through `applyToolResult.ts`
- Serialized workflow context via `workflowContextService.serializeWorkflowContext`

---

## 5. Lessons Learned

- **Component decomposition improves maintainability:** Smaller, focused components are easier to reason about
- **Design before implementation:** Creating mockups and specs upfront prevents rework
- **Business-friendly types matter:** User-facing types should be intuitive, not technical
- **State management patterns:** Slice-based architecture scales well

---

## 6. Next Steps

- [ ] Implement `ioMappingSlice` (types, actions, persistence)
- [ ] Build edge editor table using Option 1 mock
- [ ] Expand initial workflow to three-node demo (Collect → Format → Summarize)
- [ ] JSON execution wrapper to honor mappings
- [ ] Automated tests for slices and mapping interactions

---

## References

- **Related Diary:** `05-AssistantContextIntegration.md` - Assistant context work
- **Related Diary:** `07-SaveLoadFeature.md` - Persistence work
- **UXD Docs:** `_docs/UXD/Pages/workflow/io-visualizations/`
- **Engineering Docs:** `_docs/Engineering/workflow-edge-mapping.md`

---

**Last Updated:** [Early 2025]

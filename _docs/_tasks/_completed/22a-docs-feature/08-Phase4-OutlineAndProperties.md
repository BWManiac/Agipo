# Phase 4: Outline & Properties

**Status:** 📋 Planned  
**Depends On:** Phase 1 (Core Document CRUD)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Add document outline sidebar and properties panel. After this phase, users can:
- See document structure in outline sidebar
- Navigate to sections by clicking headings
- Edit document properties (frontmatter)
- Add custom properties

This phase adds Obsidian-style navigation and metadata management.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Outline Position | Left sidebar | Standard pattern, doesn't interfere with editor |
| Properties Position | Right sidebar | Balance with chat sidebar (future) |
| Outline Generation | Server-side (remark) | Consistent, fast, no client parsing |
| Properties Editing | Inline editing | Direct manipulation, immediate feedback |

### Pertinent Research

- **RQ-7**: Outline extraction from Markdown (remark)
- **RQ-4**: Frontmatter parsing (validated in Phase 0)

*Source: `00-Phase0-Technical-Spike.md`, `02-Research-Log.md`*

### Overall File Impact

#### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/dox/services/outline-generator.ts` | Create | Extract heading structure | A |

#### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/[docId]/components/DocumentOutline/index.tsx` | Create | Outline container | B |
| `app/(pages)/dox/[docId]/components/DocumentOutline/OutlineItem.tsx` | Create | Heading item | B |
| `app/(pages)/dox/[docId]/components/DocumentOutline/OutlineEmpty.tsx` | Create | Empty state | B |
| `app/(pages)/dox/[docId]/components/PropertiesPanel/index.tsx` | Create | Properties container | C |
| `app/(pages)/dox/[docId]/components/PropertiesPanel/PropertyField.tsx` | Create | Property field editor | C |
| `app/(pages)/dox/[docId]/components/PropertiesPanel/PropertyAdd.tsx` | Create | Add custom property | C |

#### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/[docId]/store/slices/outlineSlice.ts` | Create | Outline state | B |
| `app/(pages)/dox/[docId]/store/slices/propertiesSlice.ts` | Create | Properties state | C |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-4.1 | Outline shows heading hierarchy | Open document, verify outline structure | B |
| AC-4.2 | Clicking heading jumps to section | Click heading, verify scroll to section | B |
| AC-4.3 | Current section highlighted | Scroll document, verify active heading | B |
| AC-4.4 | Properties panel shows frontmatter | Open properties, verify frontmatter fields | C |
| AC-4.5 | Properties can be edited | Edit property, verify update | C |
| AC-4.6 | Custom properties can be added | Add property, verify saved | C |
| AC-4.7 | Outline updates on content change | Edit heading, verify outline updates | B |

### User Flows (Phase Level)

#### Flow 1: Navigate via Outline

```
1. User opens document
2. Outline sidebar shows heading structure
3. User clicks "Introduction" heading
4. Document scrolls to that section
5. Heading highlighted in outline
```

#### Flow 2: Edit Properties

```
1. User opens properties panel
2. User sees frontmatter fields (title, author, tags)
3. User edits "tags" field
4. User adds new tag
5. Properties update
6. Auto-save triggers
```

---

## Part A: Outline Generation

### Goal

Extract heading structure from Markdown on the server side.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/dox/services/outline-generator.ts` | Create | Extract headings | ~120 |

### Pseudocode

#### `app/api/dox/services/outline-generator.ts`

```
generateOutline(markdown: string): OutlineItem[]
├── Parse Markdown with remark
├── Visit AST nodes (unist-util-visit)
├── For each heading node:
│   ├── Extract: level (1-6), text, position
│   ├── Generate: id (anchor slug)
│   └── Add to outline array
├── Build hierarchy (nested structure)
└── Return: [{ level, text, id, position, children }, ...]
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-4.1 | Outline shows heading hierarchy | Open document, verify outline structure |

---

## Part B: Outline Sidebar

### Goal

Display document outline and enable navigation.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/dox/[docId]/components/DocumentOutline/index.tsx` | Create | Outline container | ~100 |
| `app/(pages)/dox/[docId]/components/DocumentOutline/OutlineItem.tsx` | Create | Heading item | ~80 |
| `app/(pages)/dox/[docId]/components/DocumentOutline/OutlineEmpty.tsx` | Create | Empty state | ~40 |
| `app/(pages)/dox/[docId]/store/slices/outlineSlice.ts` | Create | Outline state | ~100 |

### Pseudocode

#### `app/(pages)/dox/[docId]/components/DocumentOutline/index.tsx`

```
DocumentOutline
├── Render: Sidebar
│   ├── Header: "Outline"
│   ├── Content: Outline tree
│   │   ├── OutlineItem (recursive)
│   │   └── OutlineEmpty (if no headings)
│   └── Scrollable
├── Store: useDocsStore()
│   ├── outlineSlice.headings
│   └── outlineSlice.activeHeadingId
├── Effects:
│   ├── On document load → Fetch outline from API
│   └── On scroll → Update activeHeadingId
└── Events:
    └── Click heading → Scroll to section
```

#### `app/(pages)/dox/[docId]/store/slices/outlineSlice.ts`

```
outlineSlice
├── State:
│   ├── headings: OutlineItem[]
│   ├── activeHeadingId: string | null
│   └── isLoading: boolean
├── Actions:
│   ├── setHeadings(headings)
│   ├── setActiveHeading(id)
│   └── loadOutline(docId)
└── Implementation:
    ├── loadOutline: Fetch from GET /api/dox/[docId] (includes outline)
    └── setActiveHeading: Update active heading on scroll
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-4.2 | Clicking heading jumps to section | Click heading, verify scroll to section |
| AC-4.3 | Current section highlighted | Scroll document, verify active heading |
| AC-4.7 | Outline updates on content change | Edit heading, verify outline updates |

### User Flows

#### Flow B.1: Navigate to Section

```
1. User clicks "Introduction" in outline
2. outlineSlice.setActiveHeading("introduction")
3. Document scrolls to heading
4. Heading highlighted in outline
```

---

## Part C: Properties Panel

### Goal

Display and edit document properties (frontmatter).

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/dox/[docId]/components/PropertiesPanel/index.tsx` | Create | Properties container | ~120 |
| `app/(pages)/dox/[docId]/components/PropertiesPanel/PropertyField.tsx` | Create | Property field editor | ~100 |
| `app/(pages)/dox/[docId]/components/PropertiesPanel/PropertyAdd.tsx` | Create | Add custom property | ~80 |
| `app/(pages)/dox/[docId]/store/slices/propertiesSlice.ts` | Create | Properties state | ~120 |

### Pseudocode

#### `app/(pages)/dox/[docId]/components/PropertiesPanel/index.tsx`

```
PropertiesPanel
├── Render: Sidebar
│   ├── Header: "Properties"
│   ├── Content: Property fields
│   │   ├── PropertyField (title, author, tags, etc.)
│   │   └── PropertyAdd (add custom)
│   └── Scrollable
├── Store: useDocsStore()
│   ├── propertiesSlice.properties
│   └── documentSlice.updateProperties()
└── Events:
    ├── Edit property → Update store, trigger save
    └── Add property → Show input, add to properties
```

#### `app/(pages)/dox/[docId]/store/slices/propertiesSlice.ts`

```
propertiesSlice
├── State:
│   ├── properties: Record<string, unknown>
│   └── isEditing: boolean
├── Actions:
│   ├── setProperties(properties)
│   ├── updateProperty(key, value)
│   ├── addProperty(key, value)
│   └── removeProperty(key)
└── Implementation:
    ├── updateProperty: Update single property, trigger save
    └── addProperty: Add new property, trigger save
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-4.4 | Properties panel shows frontmatter | Open properties, verify frontmatter fields |
| AC-4.5 | Properties can be edited | Edit property, verify update |
| AC-4.6 | Custom properties can be added | Add property, verify saved |

### User Flows

#### Flow C.1: Edit Property

```
1. User opens properties panel
2. User clicks "tags" field
3. User edits value
4. propertiesSlice.updateProperty("tags", newValue)
5. PATCH /api/dox/[docId] called
6. Property updated in frontmatter
```

---

## Out of Scope

What is explicitly NOT included in this phase:

- **Properties validation** → Future consideration
- **Property types** → Future consideration (all string for v1)
- **Property templates** → Future consideration

---

## References

- **Research**: `00-Phase0-Technical-Spike.md` - Frontmatter parsing validation
- **Research**: `02-Research-Log.md` - Outline extraction patterns
- **Architecture**: `03-Technical-Architecture.md` - Outline and properties architecture
- **External**: [remark Documentation](https://github.com/remarkjs/remark) - Markdown parsing

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | AI Assistant |

---

**Last Updated:** 2025-12-10

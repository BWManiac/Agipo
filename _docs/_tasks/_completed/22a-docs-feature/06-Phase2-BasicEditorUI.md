# Phase 2: Basic Editor UI

**Status:** 📋 Planned  
**Depends On:** Phase 1 (Core Document CRUD)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Build the core Lexical-based editor interface. After this phase, users can:
- See document content in a WYSIWYG editor
- Type and edit text
- Apply basic formatting (bold, italic, headings)
- See auto-save status
- Use a formatting toolbar

This phase establishes the editor foundation that all block features build upon.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|------------|
| Editor Engine | Lexical | Validated in Phase 0, block-based architecture |
| Auto-save | Debounced (2s idle) | Balance between responsiveness and API calls |
| Save Status | Footer indicator | Non-intrusive, always visible |
| Toolbar | Fixed position | Always accessible, familiar pattern |
| Empty State | Placeholder text | Guides user to start typing |

### Pertinent Research

- **RQ-1**: Lexical editor creation works (validated in Phase 0)
- **RQ-2**: Markdown ↔ Lexical round-trip works (validated in Phase 0)
- **Node Imports**: `HeadingNode`, `QuoteNode` come from `@lexical/rich-text`, not separate packages
- **Markdown Parsing**: Must call `root.clear()` before `$convertFromMarkdownString()`
- **Markdown Serialization**: Must use `editor.update()`, NOT `editor.getEditorState().read()`

*Source: `00-Phase0-Technical-Spike.md`, `02-Research-Log-Phase0.md`*

### Overall File Impact

#### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/[docId]/components/DocumentEditor/index.tsx` | Create | Editor container | A |
| `app/(pages)/dox/[docId]/components/DocumentEditor/LexicalEditor.tsx` | Create | Lexical editor wrapper | A |
| `app/(pages)/dox/[docId]/components/DocumentEditor/Toolbar.tsx` | Create | Formatting toolbar | A |
| `app/(pages)/dox/[docId]/components/DocumentEditor/EmptyState.tsx` | Create | Empty document state | A |
| `app/(pages)/dox/[docId]/components/DocumentHeader/index.tsx` | Create | Header container | A |
| `app/(pages)/dox/[docId]/components/DocumentHeader/TitleEditor.tsx` | Create | Inline title editor | A |
| `app/(pages)/dox/[docId]/components/DocumentHeader/SaveStatus.tsx` | Create | Save status indicator | A |

#### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/[docId]/store/slices/editorSlice.ts` | Create | Editor state and auto-save | A |

#### Frontend / Hooks

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/[docId]/hooks/useDocument.ts` | Modify | Add update mutation | A |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-2.1 | Editor displays document content | Open document, verify content in editor | A |
| AC-2.2 | Can type and edit text | Type in editor, verify text appears | A |
| AC-2.3 | Basic blocks work (paragraph, heading) | Create heading, verify block type | A |
| AC-2.4 | Formatting toolbar applies formatting | Click bold, verify text bolded | A |
| AC-2.5 | Auto-save triggers after 2s idle | Type, wait 2s, verify API call | A |
| AC-2.6 | Save status shows correctly | Verify "Saved" / "Saving" / "Error" states | A |
| AC-2.7 | Empty state shows placeholder | New document shows placeholder text | A |
| AC-2.8 | Title editor works | Edit title, verify updates | A |
| AC-2.9 | Editor loads Markdown correctly | Load document, verify content parsed | A |
| AC-2.10 | Editor saves as Markdown | Edit, auto-save, verify Markdown format | A |

### User Flows (Phase Level)

#### Flow 1: Edit Document

```
1. User opens document
2. Editor loads with content
3. User clicks in editor
4. User types new text
5. After 2s idle, auto-save triggers
6. Footer shows "Saving..."
7. Footer shows "Saved" when complete
```

#### Flow 2: Apply Formatting

```
1. User selects text in editor
2. User clicks "Bold" in toolbar
3. Text becomes bold
4. User clicks "Heading 1" in toolbar
5. Paragraph becomes heading
6. Auto-save triggers
```

---

## Part A: Editor Core

### Goal

Build the Lexical editor component with basic blocks, formatting toolbar, and auto-save functionality.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/dox/[docId]/components/DocumentEditor/index.tsx` | Create | Editor container | ~150 |
| `app/(pages)/dox/[docId]/components/DocumentEditor/LexicalEditor.tsx` | Create | Lexical editor wrapper | ~200 |
| `app/(pages)/dox/[docId]/components/DocumentEditor/Toolbar.tsx` | Create | Formatting toolbar | ~120 |
| `app/(pages)/dox/[docId]/components/DocumentEditor/EmptyState.tsx` | Create | Empty state | ~60 |
| `app/(pages)/dox/[docId]/components/DocumentHeader/index.tsx` | Create | Header container | ~100 |
| `app/(pages)/dox/[docId]/components/DocumentHeader/TitleEditor.tsx` | Create | Title editor | ~80 |
| `app/(pages)/dox/[docId]/components/DocumentHeader/SaveStatus.tsx` | Create | Save status | ~60 |
| `app/(pages)/dox/[docId]/store/slices/editorSlice.ts` | Create | Editor state slice | ~200 |

### Pseudocode

#### `app/(pages)/dox/[docId]/components/DocumentEditor/index.tsx`

```
DocumentEditor
├── Render: Layout
│   ├── Toolbar (fixed top)
│   ├── Editor area (scrollable)
│   │   ├── LexicalEditor component
│   │   └── EmptyState (if no content)
│   └── Footer (save status)
├── Store: useDocsStore()
│   ├── editorSlice.editor
│   ├── editorSlice.isDirty
│   ├── editorSlice.saveStatus
│   └── documentSlice.content
├── Effects:
│   ├── On mount: Initialize Lexical editor
│   ├── On content change: Mark dirty, debounce auto-save
│   └── On unmount: Cleanup editor
└── Events:
    ├── Editor change → Update store, trigger auto-save
    └── Toolbar action → Apply formatting
```

#### `app/(pages)/dox/[docId]/components/DocumentEditor/LexicalEditor.tsx`

```
LexicalEditor
├── Setup: Lexical editor
│   ├── Create editor instance
│   ├── Register nodes: 
│   │   ├── ParagraphNode, TextNode (from lexical)
│   │   ├── HeadingNode, QuoteNode (from @lexical/rich-text)
│   │   ├── ListNode, ListItemNode (from @lexical/list)
│   │   ├── CodeNode (from @lexical/code)
│   │   └── LinkNode (from @lexical/link)
│   ├── Register decorators: Bold, Italic
│   └── Register listeners: onChange, onUpdate
├── Render: LexicalComposer
│   ├── RichTextPlugin (editable area)
│   ├── HistoryPlugin (undo/redo)
│   ├── OnChangePlugin (sync to store)
│   └── MarkdownShortcutPlugin (Markdown shortcuts)
├── State: Editor state
│   ├── Current selection
│   ├── Current block type
│   └── Formatting state
└── Effects:
    ├── Load Markdown → Convert to Lexical
    └── Save Lexical → Convert to Markdown
```

#### `app/(pages)/dox/[docId]/components/DocumentEditor/Toolbar.tsx`

```
Toolbar
├── Render: Button group
│   ├── Format buttons: Bold, Italic, Code
│   ├── Block buttons: H1, H2, H3, Paragraph
│   └── List buttons: Bullet, Numbered
├── Store: useDocsStore()
│   └── editorSlice.editor (for selection)
├── State: Current formatting
│   ├── isBold
│   ├── isItalic
│   ├── blockType
│   └── listType
└── Events:
    ├── Click format → Apply formatting
    └── Click block → Change block type
```

#### `app/(pages)/dox/[docId]/store/slices/editorSlice.ts`

```
editorSlice
├── State:
│   ├── editor: LexicalEditor | null
│   ├── isDirty: boolean
│   ├── saveStatus: "saved" | "saving" | "error"
│   ├── lastSaved: string | null
│   └── autoSaveTimer: NodeJS.Timeout | null
├── Actions:
│   ├── initializeEditor(editor: LexicalEditor)
│   ├── setDirty(dirty: boolean)
│   ├── setSaveStatus(status)
│   ├── autoSave()
│   └── cleanup()
└── Implementation:
    ├── initializeEditor: Set editor instance
    ├── setDirty: Mark document as changed
    ├── autoSave: Debounced save (2s)
    │   ├── Get editor state
    │   ├── Convert to Markdown
    │   ├── Call PATCH /api/dox/[docId]
    │   └── Update saveStatus
    └── cleanup: Clear timer, reset state
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-2.1 | Editor displays document content | Open document, verify content in editor |
| AC-2.2 | Can type and edit text | Type in editor, verify text appears |
| AC-2.3 | Basic blocks work (paragraph, heading) | Create heading, verify block type |
| AC-2.4 | Formatting toolbar applies formatting | Click bold, verify text bolded |
| AC-2.5 | Auto-save triggers after 2s idle | Type, wait 2s, verify API call |
| AC-2.6 | Save status shows correctly | Verify "Saved" / "Saving" / "Error" states |
| AC-2.7 | Empty state shows placeholder | New document shows placeholder text |
| AC-2.9 | Editor loads Markdown correctly | Load document, verify content parsed |
| AC-2.10 | Editor saves as Markdown | Edit, auto-save, verify Markdown format |

### User Flows

#### Flow A.1: Initialize Editor

```
1. Document page loads
2. useDocument hook fetches document
3. documentSlice.setDocument() called
4. editorSlice.initializeEditor() called
5. Markdown converted to Lexical
6. Editor displays content
```

#### Flow A.2: Auto-Save

```
1. User types in editor
2. onChange event fires
3. editorSlice.setDirty(true)
4. Debounce timer starts (2s)
5. User stops typing
6. After 2s, autoSave() called
7. Editor state → Markdown
8. PATCH /api/dox/[docId] called
9. saveStatus → "saving"
10. Response received
11. saveStatus → "saved"
```

---

## Out of Scope

What is explicitly NOT included in this phase:

- **Slash commands** → Phase 3 (Block Features)
- **Drag-and-drop** → Phase 3 (Block Features)
- **Advanced blocks** (tables, code blocks) → Phase 3 (Block Features)
- **Outline sidebar** → Phase 4 (Outline & Properties)
- **Properties panel** → Phase 4 (Outline & Properties)
- **Chat sidebar** → Phase 5 (Chat & Agent Integration)

---

## References

- **Research**: `00-Phase0-Technical-Spike.md` - Lexical editor validation
- **Research**: `02-Research-Log.md` - Lexical patterns and best practices
- **Architecture**: `03-Technical-Architecture.md` - Editor architecture
- **Implementation**: `04-Implementation-Plan.md` - File impact details
- **External**: [Lexical Documentation](https://lexical.dev/) - Editor setup

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | AI Assistant |

---

**Last Updated:** 2025-12-10

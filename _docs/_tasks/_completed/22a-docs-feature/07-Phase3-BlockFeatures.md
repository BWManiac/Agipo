# Phase 3: Block Features

**Status:** 📋 Planned  
**Depends On:** Phase 2 (Basic Editor UI)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Add advanced block features: slash commands, drag-and-drop reordering, and all block types. After this phase, users can:
- Insert blocks via slash commands (`/`)
- Reorder blocks via drag-and-drop
- Use all block types (tables, code blocks, quotes, etc.)
- Access block menu (duplicate, delete, turn into)

This phase enhances the editor with Notion-style interactions.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|------------|
| Slash Menu | `cmdk` library | Already installed, excellent UX |
| Drag-and-Drop | `@dnd-kit` | Already installed, accessible |
| Block Handles | Hover-only | Clean UI, appears when needed |
| Block Menu | Context menu | Familiar pattern, non-intrusive |

### Pertinent Research

- **RQ-3**: Block manipulation works programmatically (validated in Phase 0)
- **RQ-5**: Slash commands implementation patterns
- **RQ-6**: Drag-and-drop with Lexical
- **Type Casting**: Must cast `LexicalNode` to `ElementNode` for `clear()`/`append()` operations
- **Splice API**: Must use `root.splice(start, count, [nodes])` — array required, even for deletion: `splice(pos, 1, [])`

*Source: `00-Phase0-Technical-Spike.md`, `02-Research-Log-Phase0.md`*

### Overall File Impact

#### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/[docId]/components/DocumentEditor/SlashCommandMenu.tsx` | Create | Slash command menu | A |
| `app/(pages)/dox/[docId]/components/DocumentEditor/BlockHandle.tsx` | Create | Block drag handle | A |
| `app/(pages)/dox/[docId]/components/DocumentEditor/BlockMenu.tsx` | Create | Block context menu | A |

#### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/[docId]/store/slices/editorSlice.ts` | Modify | Add block manipulation actions | A |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-3.1 | Slash command (`/`) opens menu | Type `/`, verify menu appears | A |
| AC-3.2 | Can insert blocks via slash commands | Type `/heading`, verify heading inserted | A |
| AC-3.3 | Drag-and-drop reorders blocks | Drag block, verify position changed | A |
| AC-3.4 | All block types supported | Insert table, code, quote, verify | A |
| AC-3.5 | Block handles appear on hover | Hover block, verify handle visible | A |
| AC-3.6 | Block menu works | Right-click block, verify menu | A |
| AC-3.7 | Block menu actions work | Duplicate/delete/turn into work | A |

### User Flows (Phase Level)

#### Flow 1: Insert Block via Slash Command

```
1. User types "/" in editor
2. Slash menu appears with block options
3. User types "heading" or selects "Heading"
4. Heading block inserted at cursor
5. User types heading text
```

#### Flow 2: Reorder Block via Drag-and-Drop

```
1. User hovers over block
2. Block handle appears
3. User drags handle
4. Block moves to new position
5. Auto-save triggers
```

---

## Part A: Slash Commands and Block Features

### Goal

Implement slash command menu, drag-and-drop, and all block types.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/dox/[docId]/components/DocumentEditor/SlashCommandMenu.tsx` | Create | Slash command menu | ~150 |
| `app/(pages)/dox/[docId]/components/DocumentEditor/BlockHandle.tsx` | Create | Block drag handle | ~100 |
| `app/(pages)/dox/[docId]/components/DocumentEditor/BlockMenu.tsx` | Create | Block context menu | ~120 |
| `app/(pages)/dox/[docId]/store/slices/editorSlice.ts` | Modify | Add block actions | ~50 |

### Pseudocode

#### `app/(pages)/dox/[docId]/components/DocumentEditor/SlashCommandMenu.tsx`

```
SlashCommandMenu
├── Render: Command menu (cmdk)
│   ├── Trigger: "/" typed in editor
│   ├── Items: Block types
│   │   ├── Heading 1, 2, 3
│   │   ├── Paragraph
│   │   ├── Bullet List
│   │   ├── Numbered List
│   │   ├── Table
│   │   ├── Code Block
│   │   ├── Quote
│   │   └── Divider
│   └── Filter: Search by name
├── Store: useDocsStore()
│   └── editorSlice.editor
├── State: Menu open/closed
└── Events:
    ├── Select item → Insert block at cursor
    └── Close menu → Return to editor
```

#### `app/(pages)/dox/[docId]/components/DocumentEditor/BlockHandle.tsx`

```
BlockHandle
├── Render: Drag handle (dnd-kit)
│   ├── Icon: Grip vertical
│   ├── Position: Left side of block
│   └── Visible: On hover
├── Store: useDocsStore()
│   └── editorSlice.editor
├── State: Is dragging
└── Events:
    ├── Drag start → Highlight block
    ├── Drag over → Show drop indicator
    └── Drop → Move block to new position
      └── Use root.splice(newIndex, 0, [block])  // Array required
      └── Use root.splice(oldIndex, 1, [])       // Empty array for deletion
```

**Note:** Block manipulation requires:
- Type casting: `const elementNode = block as ElementNode` for content operations
- Splice syntax: Always use arrays: `splice(pos, 0, [node])` or `splice(pos, 1, [])`
- See `03-Technical-Architecture.md` Section 8 for helper functions

#### `app/(pages)/dox/[docId]/components/DocumentEditor/BlockMenu.tsx`

```
BlockMenu
├── Render: Context menu (Radix)
│   ├── Trigger: Right-click block
│   ├── Items:
│   │   ├── Duplicate
│   │   ├── Delete
│   │   ├── Turn into → (submenu)
│   │   └── Copy
│   └── Position: At cursor
├── Store: useDocsStore()
│   └── editorSlice.editor
└── Events:
    ├── Duplicate → Copy block
    ├── Delete → Remove block
    └── Turn into → Change block type
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-3.1 | Slash command (`/`) opens menu | Type `/`, verify menu appears |
| AC-3.2 | Can insert blocks via slash commands | Type `/heading`, verify heading inserted |
| AC-3.3 | Drag-and-drop reorders blocks | Drag block, verify position changed |
| AC-3.4 | All block types supported | Insert table, code, quote, verify |
| AC-3.5 | Block handles appear on hover | Hover block, verify handle visible |
| AC-3.6 | Block menu works | Right-click block, verify menu |
| AC-3.7 | Block menu actions work | Duplicate/delete/turn into work |

### User Flows

#### Flow A.1: Insert Table via Slash Command

```
1. User types "/" in editor
2. Menu appears with block options
3. User types "table" or selects "Table"
4. Table block inserted (2x2 default)
5. User can edit cells
```

#### Flow A.2: Reorder Blocks

```
1. User hovers over paragraph block
2. Block handle appears on left
3. User drags handle up
4. Block moves above previous block
5. Auto-save triggers
```

---

## Out of Scope

What is explicitly NOT included in this phase:

- **Nested blocks** → Future consideration (v1 uses flat structure)
- **Block templates** → Future consideration
- **Block collaboration** → Future consideration

---

## References

- **Research**: `00-Phase0-Technical-Spike.md` - Block manipulation validation
- **Research**: `02-Research-Log.md` - Slash commands and drag-and-drop patterns
- **Architecture**: `03-Technical-Architecture.md` - Block architecture
- **External**: [cmdk Documentation](https://cmdk.paco.me/) - Command menu
- **External**: [@dnd-kit Documentation](https://dndkit.com/) - Drag and drop

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | AI Assistant |

---

**Last Updated:** 2025-12-10

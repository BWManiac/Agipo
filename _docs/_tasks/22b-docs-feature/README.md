# Task 22b: Docs Feature

> A Markdown-based document editor for Agipo that complements the Records (Sheets) feature.

## Overview

The Docs feature provides a rich text editing experience using Lexical (Meta's editor framework) with Markdown storage. It combines the familiarity of Google Docs, the Markdown storage of Obsidian, and the block-based editing of Notion.

## Quick Links

| Document | Description |
|----------|-------------|
| [00-Product-Spec.md](./00-Product-Spec.md) | Complete product requirements and acceptance criteria |
| [01-Research-Log.md](./01-Research-Log.md) | Research questions about Lexical implementation |
| [02-Phase0-Technical-Spike.md](./02-Phase0-Technical-Spike.md) | Validation tests for Lexical viability |
| [03-Technical-Architecture.md](./03-Technical-Architecture.md) | File structure, stores, data models |
| [04-Implementation-Plan.md](./04-Implementation-Plan.md) | File impact analysis and phase overview |

## Implementation Phases

| Phase | Document | Focus | Est. LOC |
|-------|----------|-------|----------|
| 1 | [05-Phase1-Foundation.md](./05-Phase1-Foundation.md) | Navigation, catalog, API setup | ~800 |
| 2 | [06-Phase2-Editor-Core.md](./06-Phase2-Editor-Core.md) | Lexical setup, Markdown import/export, auto-save | ~1,200 |
| 3 | [07-Phase3-Toolbar-Formatting.md](./07-Phase3-Toolbar-Formatting.md) | Floating toolbar, text formatting, links | ~800 |
| 4 | [08-Phase4-Block-System.md](./08-Phase4-Block-System.md) | Slash commands, block handles, drag-and-drop | ~1,000 |
| 5 | [09-Phase5-Chat-Integration.md](./09-Phase5-Chat-Integration.md) | Chat sidebar, agent document tools | ~1,400 |
| 6 | [10-Phase6-Outline-Properties.md](./10-Phase6-Outline-Properties.md) | Outline navigation, document properties | ~700 |
| 7 | [11-Phase7-Version-History.md](./11-Phase7-Version-History.md) | Snapshot versioning, preview, restore | ~900 |
| 8 | [12-Phase8-Polish.md](./12-Phase8-Polish.md) | Keyboard shortcuts, error handling, polish | ~600 |

**Total Estimated LOC:** ~7,400

## Key Decisions

### Technology Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Editor Framework | Lexical | MIT license, Meta-backed, 22.6k stars, extensible |
| Storage Format | Markdown + YAML frontmatter | Human-readable, portable, version-control friendly |
| State Management | Zustand slices | Consistent with existing codebase patterns |
| UI Components | ShadCN/Radix | Consistent with existing component library |
| Version History | Snapshot-based | Simpler implementation for v1; Git-like deferred |

### Design Philosophy

1. **Google Docs Familiarity** - Toolbar and formatting feel familiar to users
2. **Obsidian Markdown Storage** - Documents stored as plain Markdown files
3. **Notion Block-Based Editing** - Slash commands, block handles, drag-and-drop

## Dependencies

### npm Packages to Install

```bash
# Core Lexical packages
npm install lexical @lexical/react @lexical/markdown @lexical/rich-text \
  @lexical/list @lexical/link @lexical/code @lexical/selection @lexical/history

# Utilities
npm install gray-matter react-markdown date-fns
```

### ShadCN Components to Add

```bash
npx shadcn@latest add dropdown-menu popover tooltip sheet separator badge \
  alert-dialog scroll-area
```

## File Storage Structure

```
_tables/
└── documents/
    └── [docId]/
        ├── content.md           # Current document
        └── _versions/
            └── v_[timestamp].md # Version snapshots
```

## Route Structure

```
/docs                    # Document catalog
/docs/[docId]           # Document editor
/api/docs               # List/create documents
/api/docs/[docId]       # Get/update/delete document
/api/docs/[docId]/chat  # Chat API endpoint
/api/docs/[docId]/versions      # List versions
/api/docs/[docId]/versions/[id] # Get/restore version
```

## Architecture

All docs feature code is self-contained within `app/(pages)/docs/`:

```
app/(pages)/docs/
├── page.tsx                          # Catalog page
├── [docId]/page.tsx                  # Editor page
├── components/                       # All UI components
│   ├── catalog/                      # Document list components
│   ├── editor/                       # Lexical editor components
│   │   └── plugins/                  # Editor plugins
│   ├── chat/                         # Chat sidebar components
│   ├── outline/                      # Outline panel components
│   ├── properties/                   # Properties panel components
│   ├── history/                      # Version history components
│   ├── shortcuts/                    # Keyboard shortcuts dialog
│   └── common/                       # Shared components
└── store/                            # Zustand store
    ├── index.ts                      # Composed store (useDocsStore)
    ├── types.ts                      # Type definitions
    └── slices/                       # Store slices
        ├── catalogSlice.ts           # Document list state
        ├── editorSlice.ts            # Editor content, save status
        ├── chatSlice.ts              # Chat messages, history
        ├── uiSlice.ts                # Panel visibility
        └── historySlice.ts           # Version list, preview state
```

### Store Slices

| Slice | Purpose |
|-------|---------|
| `catalogSlice` | Document list, loading, CRUD operations |
| `editorSlice` | Document content, editor state, save status |
| `chatSlice` | Chat messages, loading state, history |
| `uiSlice` | Panel visibility (outline, properties) |
| `historySlice` | Version list, preview state |

## Agent Tools

The chat agent has access to document editing tools:

| Tool | Description |
|------|-------------|
| `sys_doc_read` | Read document content or section |
| `sys_doc_insert` | Insert content at position |
| `sys_doc_replace` | Replace text or section |
| `sys_doc_append` | Append to section or end |
| `sys_doc_delete` | Delete a section |

## UX Mockups

Existing mockups are located at:
```
_docs/UXD/Pages/records/2025-12-10-docs-v1/
```

15 HTML mockup files covering all major UI states and interactions.

## Out of Scope (v1)

- Collaborative editing
- Offline support
- Image/file uploads
- Table editing UI
- Git-like version diffs
- Document templates
- Sharing and permissions
- RAG integration (separate task)

## Related Documentation

- [Agipo Product Overview](_docs/Product/Positioning/02-agipo-product-overview.md)
- [Store Slice Architecture](_docs/Engineering/Architecture/Store-Slice-Architecture.md)
- [Component Patterns](_docs/Engineering/Patterns/)

---

**Created:** 2025-12-10
**Status:** Planning Complete
**Next Step:** Begin Phase 1 implementation

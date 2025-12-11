# Task 22b: Docs Feature — Implementation Plan

**Status:** Planning
**Date:** December 2025
**Goal:** Build a Markdown-based document editor with agent integration, following Records patterns

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Prerequisites](#2-prerequisites)
3. [File Impact Analysis](#3-file-impact-analysis)
4. [Phase Overview](#4-phase-overview)
5. [Dependency Graph](#5-dependency-graph)
6. [Risk Assessment](#6-risk-assessment)

---

## 1. Executive Summary

### What We're Building

A document editing feature that provides:
- Document catalog (list view at `/docs`)
- Rich text editor with Lexical
- Slash commands and block-based editing
- Agent chat sidebar with document editing tools
- Version history with restore capability
- Document outline navigation

### Effort Estimate

| Phase | Focus | New Files | Modified Files | Complexity |
|-------|-------|-----------|----------------|------------|
| Phase 0 | Technical Spike | 8 | 1 | Low |
| Phase 1 | Foundation (Nav, Catalog, API) | 12 | 1 | Medium |
| Phase 2 | Editor Core | 12 | 0 | High |
| Phase 3 | Toolbar & Formatting | 6 | 2 | Medium |
| Phase 4 | Block System | 5 | 2 | High |
| Phase 5 | Chat Integration | 10 | 0 | High |
| Phase 6 | Outline & Properties | 6 | 1 | Medium |
| Phase 7 | Version History | 6 | 1 | Medium |
| Phase 8 | Polish & Validation | 2 | 5 | Low |
| **Total** | | **67** | **13** | |

**Note:** Phase 0 validates assumptions. All subsequent phases may be revised based on spike results.

---

## 2. Prerequisites

Before implementation:

- [x] Product Spec complete (`00-Product-Spec.md`)
- [x] UXD Mockups complete (`_docs/UXD/Pages/records/2025-12-10-docs-v1/`)
- [ ] Research Log questions answered (`01-Research-Log.md`)
- [ ] Phase 0 Technical Spike passed (`02-Phase0-Technical-Spike.md`)

### Package Installation

```bash
# Phase 0 / Phase 1
npm install lexical @lexical/react @lexical/markdown @lexical/rich-text @lexical/list @lexical/link @lexical/code @lexical/table @lexical/selection @lexical/history gray-matter
```

---

## 3. File Impact Analysis

### Legend

| Symbol | Meaning |
|--------|---------|
| 🆕 | New file to create |
| ✏️ | Existing file to modify |
| 📋 | Pattern to follow from existing code |

---

### 3.1 Navigation & Routing

| File | Status | Phase | Description |
|------|--------|-------|-------------|
| `components/layout/TopNav.tsx` | ✏️ | 1 | Add "Docs" tab to NAV_ITEMS |
| `app/(pages)/docs/page.tsx` | 🆕 | 1 | Document catalog page |
| `app/(pages)/docs/[docId]/page.tsx` | 🆕 | 2 | Document editor page |

---

### 3.2 Store Files

```
app/(pages)/docs/store/
├── index.ts                    # 🆕 Phase 2 - Store composition
├── types.ts                    # 🆕 Phase 2 - Combined types
└── slices/
    ├── editorSlice.ts          # 🆕 Phase 2 - Document/editor state
    ├── chatSlice.ts            # 🆕 Phase 5 - Chat state
    ├── uiSlice.ts              # 🆕 Phase 2 - UI panels
    └── historySlice.ts         # 🆕 Phase 7 - Version history
```

| File | Phase | LOC Est. | Complexity |
|------|-------|----------|------------|
| `store/index.ts` | 2 | 30 | Low |
| `store/types.ts` | 2 | 20 | Low |
| `slices/editorSlice.ts` | 2 | 120 | Medium |
| `slices/uiSlice.ts` | 2 | 80 | Low |
| `slices/chatSlice.ts` | 5 | 150 | Medium |
| `slices/historySlice.ts` | 7 | 80 | Low |

---

### 3.3 Catalog Components

```
app/(pages)/docs/components/catalog/
├── DocumentCatalog.tsx         # 🆕 Phase 1 - Grid of cards
├── DocumentCard.tsx            # 🆕 Phase 1 - Single card
├── CreateDocumentButton.tsx    # 🆕 Phase 1 - New document
└── EmptyState.tsx              # 🆕 Phase 1 - No documents
```

**Pattern Source:** `app/(pages)/records/components/` (if exists) or workforce catalog

| File | Phase | LOC Est. | Complexity |
|------|-------|----------|------------|
| `DocumentCatalog.tsx` | 1 | 100 | Medium |
| `DocumentCard.tsx` | 1 | 80 | Low |
| `CreateDocumentButton.tsx` | 1 | 60 | Low |
| `EmptyState.tsx` | 1 | 40 | Low |

---

### 3.4 Editor Components

```
app/(pages)/docs/components/editor/
├── DocEditor.tsx               # 🆕 Phase 2 - Main wrapper
├── EditorContent.tsx           # 🆕 Phase 2 - Lexical component
├── EditorToolbar.tsx           # 🆕 Phase 3 - Formatting toolbar
├── EditorFooter.tsx            # 🆕 Phase 2 - Word count, status
├── config.ts                   # 🆕 Phase 2 - Lexical config
├── theme.ts                    # 🆕 Phase 2 - Editor theme
├── nodes/
│   ├── CalloutNode.ts          # 🆕 Phase 4 - GFM alerts
│   └── index.ts                # 🆕 Phase 4 - Node exports
└── plugins/
    ├── SlashCommandPlugin.tsx  # 🆕 Phase 4 - Slash commands
    ├── BlockHandlePlugin.tsx   # 🆕 Phase 4 - Block handles
    ├── FloatingToolbarPlugin.tsx # 🆕 Phase 3 - Selection toolbar
    ├── AutoSavePlugin.tsx      # 🆕 Phase 2 - Debounced saving
    └── CodeHighlightPlugin.tsx # 🆕 Phase 3 - Syntax highlighting
```

| File | Phase | LOC Est. | Complexity |
|------|-------|----------|------------|
| `DocEditor.tsx` | 2 | 150 | High |
| `EditorContent.tsx` | 2 | 100 | Medium |
| `EditorToolbar.tsx` | 3 | 200 | Medium |
| `EditorFooter.tsx` | 2 | 60 | Low |
| `config.ts` | 2 | 50 | Low |
| `theme.ts` | 2 | 100 | Low |
| `CalloutNode.ts` | 4 | 120 | High |
| `SlashCommandPlugin.tsx` | 4 | 250 | High |
| `BlockHandlePlugin.tsx` | 4 | 200 | High |
| `FloatingToolbarPlugin.tsx` | 3 | 150 | Medium |
| `AutoSavePlugin.tsx` | 2 | 80 | Medium |
| `CodeHighlightPlugin.tsx` | 3 | 60 | Low |

---

### 3.5 Sidebar Components

```
app/(pages)/docs/components/outline/
├── DocumentOutline.tsx         # 🆕 Phase 6 - Left sidebar
└── OutlineItem.tsx             # 🆕 Phase 6 - Heading item

app/(pages)/docs/components/properties/
├── PropertiesPanel.tsx         # 🆕 Phase 6 - Frontmatter display
└── TagEditor.tsx               # 🆕 Phase 6 - Tag chips

app/(pages)/docs/components/chat/
├── ChatSidebar.tsx             # 🆕 Phase 5 - Right sidebar
├── ChatArea.tsx                # 🆕 Phase 5 - Messages
├── ChatInput.tsx               # 🆕 Phase 5 - Input field
└── AgentPicker.tsx             # 🆕 Phase 5 - Agent dropdown

app/(pages)/docs/components/history/
├── VersionHistoryPanel.tsx     # 🆕 Phase 7 - Version list
└── VersionPreview.tsx          # 🆕 Phase 7 - Preview content

app/(pages)/docs/components/settings/
├── SettingsPanel.tsx           # 🆕 Phase 6 - Settings modal
└── AccessControl.tsx           # 🆕 Phase 6 - Agent access
```

| File | Phase | LOC Est. | Pattern Source |
|------|-------|----------|----------------|
| `DocumentOutline.tsx` | 6 | 120 | New |
| `OutlineItem.tsx` | 6 | 50 | New |
| `PropertiesPanel.tsx` | 6 | 100 | New |
| `TagEditor.tsx` | 6 | 80 | New |
| `ChatSidebar.tsx` | 5 | 150 | Records ChatSidebar |
| `ChatArea.tsx` | 5 | 120 | Records/Workforce |
| `ChatInput.tsx` | 5 | 80 | Records/Workforce |
| `AgentPicker.tsx` | 5 | 60 | Records/Workforce |
| `VersionHistoryPanel.tsx` | 7 | 150 | New |
| `VersionPreview.tsx` | 7 | 100 | New |
| `SettingsPanel.tsx` | 6 | 100 | New |
| `AccessControl.tsx` | 6 | 120 | Records pattern |

---

### 3.6 API Routes

```
app/api/docs/
├── route.ts                    # 🆕 Phase 1 - GET list, POST create
├── [docId]/
│   ├── route.ts                # 🆕 Phase 1 - GET, PUT, DELETE
│   ├── chat/
│   │   ├── route.ts            # 🆕 Phase 5 - POST streaming
│   │   └── services/
│   │       ├── chat-service.ts # 🆕 Phase 5 - Context builder
│   │       └── doc-tools.ts    # 🆕 Phase 5 - sys_doc_* tools
│   ├── threads/
│   │   ├── route.ts            # 🆕 Phase 5 - GET/POST threads
│   │   └── [threadId]/route.ts # 🆕 Phase 5 - Thread CRUD
│   ├── versions/
│   │   ├── route.ts            # 🆕 Phase 7 - GET versions
│   │   └── [versionId]/route.ts # 🆕 Phase 7 - GET, POST restore
│   └── access/
│       ├── route.ts            # 🆕 Phase 6 - GET access
│       └── agents/
│           ├── route.ts        # 🆕 Phase 6 - POST grant
│           └── [agentId]/route.ts # 🆕 Phase 6 - DELETE revoke
└── services/
    ├── index.ts                # 🆕 Phase 1 - Barrel export
    ├── document-io.ts          # 🆕 Phase 1 - File read/write
    ├── frontmatter.ts          # 🆕 Phase 1 - YAML handling
    ├── versions.ts             # 🆕 Phase 7 - Version management
    └── access.ts               # 🆕 Phase 6 - Access control
```

| File | Phase | LOC Est. | Complexity |
|------|-------|----------|------------|
| `route.ts` (list/create) | 1 | 100 | Medium |
| `[docId]/route.ts` | 1 | 150 | Medium |
| `chat/route.ts` | 5 | 150 | High |
| `chat/services/chat-service.ts` | 5 | 100 | Medium |
| `chat/services/doc-tools.ts` | 5 | 250 | High |
| `threads/route.ts` | 5 | 80 | Medium |
| `threads/[threadId]/route.ts` | 5 | 60 | Low |
| `versions/route.ts` | 7 | 80 | Medium |
| `versions/[versionId]/route.ts` | 7 | 100 | Medium |
| `access/route.ts` | 6 | 60 | Low |
| `access/agents/route.ts` | 6 | 60 | Low |
| `access/agents/[agentId]/route.ts` | 6 | 40 | Low |
| `services/index.ts` | 1 | 20 | Low |
| `services/document-io.ts` | 1 | 150 | Medium |
| `services/frontmatter.ts` | 1 | 80 | Medium |
| `services/versions.ts` | 7 | 120 | Medium |
| `services/access.ts` | 6 | 80 | Low |

---

### 3.7 Data Storage

```
_tables/documents/
├── [docId]/
│   ├── content.md              # Document content
│   └── _versions/
│       └── v_[timestamp].md    # Version snapshots
```

**Note:** Data storage is file-based, created at runtime. No pre-created files needed.

---

### 3.8 Modified Files Summary

| File | Phase | Changes |
|------|-------|---------|
| `components/layout/TopNav.tsx` | 1 | Add Docs to NAV_ITEMS |
| `package.json` | 0/1 | Add Lexical + gray-matter packages |
| `slices/editorSlice.ts` | 3, 4 | Add formatting/block state |
| `EditorContent.tsx` | 3, 4 | Add plugins |
| `DocEditor.tsx` | 3, 4, 5, 6 | Integrate sidebars |
| `[docId]/page.tsx` | 5, 6, 7 | Add sidebar panels |

---

### 3.9 File Count by Phase

| Phase | New Files | Modified Files | Total LOC Est. |
|-------|-----------|----------------|----------------|
| Phase 0 | 8 | 1 | ~830 |
| Phase 1 | 12 | 1 | ~900 |
| Phase 2 | 12 | 0 | ~800 |
| Phase 3 | 6 | 2 | ~600 |
| Phase 4 | 5 | 2 | ~700 |
| Phase 5 | 10 | 0 | ~1,050 |
| Phase 6 | 6 | 1 | ~550 |
| Phase 7 | 6 | 1 | ~550 |
| Phase 8 | 2 | 5 | ~200 |
| **Total** | **67** | **13** | **~6,180** |

---

## 4. Phase Overview

### Phase 0: Technical Spike

**Goal:** Validate Lexical assumptions before full implementation

**Duration:** 1 session

**Key Deliverables:**
- Lexical initializes in Next.js
- Markdown round-trip works
- Slash commands feasible
- Block handles feasible
- Programmatic insert works

**Document:** `02-Phase0-Technical-Spike.md`

---

### Phase 1: Foundation

**Goal:** Navigation, catalog, basic API, file storage

**Duration:** 1-2 sessions

**Key Deliverables:**
- "Docs" tab in TopNav
- Document catalog page at `/docs`
- Create/list/delete documents
- Document API endpoints
- File-based storage with frontmatter

**Document:** `05-Phase1-Foundation.md`

---

### Phase 2: Editor Core

**Goal:** Basic Lexical editor with auto-save

**Duration:** 2 sessions

**Key Deliverables:**
- Document editor page at `/docs/[docId]`
- Lexical editor with basic formatting
- Load document from Markdown
- Auto-save to Markdown
- Save status indicator
- Editor store slices

**Document:** `06-Phase2-Editor-Core.md`

---

### Phase 3: Toolbar & Formatting

**Goal:** Full formatting toolbar and selection popup

**Duration:** 1-2 sessions

**Key Deliverables:**
- Top toolbar with all formatting buttons
- Bold, italic, strikethrough, code
- Headings dropdown
- Lists (bullet, numbered, checkbox)
- Links, quotes, code blocks
- Floating selection toolbar

**Document:** `07-Phase3-Toolbar-Formatting.md`

---

### Phase 4: Block System

**Goal:** Slash commands and block handles

**Duration:** 2 sessions

**Key Deliverables:**
- `/` triggers command menu
- Block type insertion
- Block handles on hover
- Block menu (delete, duplicate, turn into)
- GFM alert blocks (Note, Tip, Warning, Caution)

**Document:** `08-Phase4-Block-System.md`

---

### Phase 5: Chat Integration

**Goal:** Agent chat sidebar with document editing

**Duration:** 2 sessions

**Key Deliverables:**
- Right sidebar with chat panel
- Agent picker
- Streaming chat responses
- sys_doc_* tools for agent editing
- "Agent is editing" indicator
- Thread persistence

**Document:** `09-Phase5-Chat-Integration.md`

---

### Phase 6: Outline & Properties

**Goal:** Left sidebar and document metadata

**Duration:** 1-2 sessions

**Key Deliverables:**
- Left sidebar with document outline
- Click heading to scroll
- Properties panel (frontmatter)
- Tag editing
- Agent access control settings

**Document:** `10-Phase6-Outline-Properties.md`

---

### Phase 7: Version History

**Goal:** Version snapshots and restore

**Duration:** 1 session

**Key Deliverables:**
- Version history panel
- List versions with timestamps
- Agent attribution on versions
- Preview version content
- Restore version

**Document:** `11-Phase7-Version-History.md`

---

### Phase 8: Polish & Validation

**Goal:** Error handling, edge cases, final testing

**Duration:** 1 session

**Key Deliverables:**
- Error handling for all flows
- Loading states
- Keyboard shortcuts
- All acceptance criteria verified
- Bug fixes

**Document:** `12-Phase8-Polish.md`

---

## 5. Dependency Graph

```
                     ┌─────────────────┐
                     │    Phase 0      │
                     │ Technical Spike │
                     │  (Validation)   │
                     └────────┬────────┘
                              │
                              │ validates assumptions for
                              ▼
                     ┌─────────────────┐
                     │    Phase 1      │
                     │   Foundation    │
                     │ (Nav, Catalog,  │
                     │   API, Files)   │
                     └────────┬────────┘
                              │
                              │ depends on
                              ▼
                     ┌─────────────────┐
                     │    Phase 2      │
                     │   Editor Core   │
                     │ (Lexical, Save) │
                     └────────┬────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │   Phase 3   │  │   Phase 4   │  │   Phase 5   │
     │  Toolbar &  │  │   Block     │  │    Chat     │
     │ Formatting  │  │   System    │  │ Integration │
     └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Phase 6      │
                    │ Outline & Props │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Phase 7      │
                    │ Version History │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Phase 8      │
                    │ Polish & QA     │
                    └─────────────────┘
```

### Cross-Slice Dependencies

```
editorSlice ──────────────────────────┐
                                      │
chatSlice ──► editorSlice             │ (needs document context)
              │                       │
              ▼                       │
historySlice ◄───────────────────────┘ (version creation on save/agent edit)

uiSlice ──────► (standalone, read by components)
```

---

## 6. Risk Assessment

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Lexical SSR issues | Blocks all editor work | Dynamic import with `ssr: false` |
| Markdown round-trip data loss | Storage corruption | Thorough Phase 0 testing, custom transformers |
| Agent edit integration | Core feature broken | Phase 5 careful design, fallback to append-only |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Block handles complexity | UX degradation | CSS-only fallback, simplify interactions |
| Performance with large docs | Slow editing | Virtualization, pagination |
| Version storage growth | Disk usage | Version limit (50), pruning |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Store complexity | Maintenance burden | Follow established slice patterns |
| UI styling | Visual inconsistency | Use ShadCN, copy from mockups |
| API design | Refactoring | Follow Records patterns |

---

## 7. Related Documents

- **Product Spec:** `00-Product-Spec.md`
- **Research Log:** `01-Research-Log.md`
- **Technical Spike:** `02-Phase0-Technical-Spike.md`
- **Technical Architecture:** `03-Technical-Architecture.md`
- **Phase Documents:** `05-Phase1-Foundation.md` through `12-Phase8-Polish.md`
- **UXD Mockups:** `_docs/UXD/Pages/records/2025-12-10-docs-v1/`
- **Records Task (Pattern):** `_docs/_tasks/20-records-feature/`

---

**Last Updated:** December 2025

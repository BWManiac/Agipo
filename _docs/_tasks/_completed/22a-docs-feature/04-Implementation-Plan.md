# Task 22a: Docs Feature — Implementation Plan

**Status:** Planning
**Date:** December 10, 2025
**Purpose:** Detailed implementation plan with file impact analysis, using the established store slice pattern.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Decision: Store Slices](#2-architecture-decision-store-slices)
3. [Store Architecture](#3-store-architecture)
4. [File Impact Analysis](#4-file-impact-analysis)
5. [Phase Breakdown](#5-phase-breakdown)
6. [Detailed Slice Specifications](#6-detailed-slice-specifications)
7. [Dependency Graph](#7-dependency-graph)
8. [Risk Assessment](#8-risk-assessment)

---

## 1. Executive Summary

### Scope

Build a Notion-style block-based document editor that enables users to:
- Create and edit documents with block-based WYSIWYG interface
- Use slash commands to insert blocks
- Reorder blocks via drag-and-drop
- Chat with agents to get help or make edits
- View document outline and properties
- Track changes in version history
- Manage agent access to documents

### Effort Estimate

| Phase | Focus | New Files | Modified Files | Complexity |
|-------|-------|-----------|----------------|------------|
| Phase 0 | Technical Spike | 6 | 2 | Low |
| Phase 1 | Core Document CRUD | 8 | 1 | Medium |
| Phase 2 | Basic Editor UI | 20 | 0 | High |
| Phase 3 | Block Features | 12 | 1 | High |
| Phase 4 | Outline & Properties | 8 | 0 | Medium |
| Phase 5 | Chat & Agent Integration | 10 | 1 | High |
| Phase 6 | Version History | 8 | 0 | Medium |
| Phase 7 | Settings & Access | 6 | 0 | Medium |
| Phase 8 | Polish & Validation | 2 | 5 | Low |
| **Total** | | **80** | **10** | |

**Note:** Phase 0 is a technical spike to validate assumptions. ✅ **Phase 0 completed 2025-12-10** — All core assumptions validated. See `02-Research-Log-Phase0.md` for findings. All phases updated with validated patterns.

---

## 2. Architecture Decision: Store Slices

### Decision

**Use Zustand store slices for all state management in the Docs feature.**

### Rationale

Following established patterns in:
- `app/(pages)/workflows/editor/store/` (10 slices)
- `app/(pages)/workforce/components/agent-modal/store/` (3 slices)
- `app/(pages)/records/store/` (6 slices)

### Why Store Slices?

The Docs feature has complex, interconnected state:

| Concern | Without Store | With Store Slices |
|---------|---------------|-------------------|
| Editor state | useState in component | `editorSlice.editor`, `editorSlice.isDirty` |
| Document data | Props drilling | `documentSlice.docId`, `documentSlice.content` |
| Outline | Local state in sidebar | `outlineSlice.headings`, `outlineSlice.activeHeadingId` |
| Properties | Local state in panel | `propertiesSlice.properties` |
| Chat messages | Local state in sidebar | `chatSlice.messages`, `chatSlice.isStreaming` |
| Version history | Local state in panel | `versionSlice.versions` |
| Cross-component updates | Context/callbacks | Direct store access via `get()` |

### Data Flow Pattern

```
User Action → Store Action → API Call → Store Update → Component Re-render
                                              ↓
                                     SSE Events → Store Update → Component Re-render
```

This enables:
- **Real-time updates**: SSE events directly update store
- **Cross-component coordination**: Chat can trigger editor updates
- **Auto-save**: Editor changes trigger debounced save
- **Testability**: Store actions are pure functions

---

## 3. Store Architecture

### Store Composition

```typescript
// app/(pages)/dox/[docId]/store/index.ts

import { create } from "zustand";
import { createEditorSlice } from "./slices/editorSlice";
import { createDocumentSlice } from "./slices/documentSlice";
import { createOutlineSlice } from "./slices/outlineSlice";
import { createPropertiesSlice } from "./slices/propertiesSlice";
import { createChatSlice } from "./slices/chatSlice";
import { createVersionSlice } from "./slices/versionSlice";
import { createSettingsSlice } from "./slices/settingsSlice";
import { createUiSlice } from "./slices/uiSlice";
import type { DocsStore } from "./types";

export const useDocsStore = create<DocsStore>()(
  (...args) => ({
    ...createEditorSlice(...args),
    ...createDocumentSlice(...args),
    ...createOutlineSlice(...args),
    ...createPropertiesSlice(...args),
    ...createChatSlice(...args),
    ...createVersionSlice(...args),
    ...createSettingsSlice(...args),
    ...createUiSlice(...args),
  })
);
```

### Type Composition

```typescript
// app/(pages)/dox/[docId]/store/types.ts

import type { EditorSlice } from "./slices/editorSlice";
import type { DocumentSlice } from "./slices/documentSlice";
import type { OutlineSlice } from "./slices/outlineSlice";
import type { PropertiesSlice } from "./slices/propertiesSlice";
import type { ChatSlice } from "./slices/chatSlice";
import type { VersionSlice } from "./slices/versionSlice";
import type { SettingsSlice } from "./slices/settingsSlice";
import type { UiSlice } from "./slices/uiSlice";

export type DocsStore = EditorSlice &
  DocumentSlice &
  OutlineSlice &
  PropertiesSlice &
  ChatSlice &
  VersionSlice &
  SettingsSlice &
  UiSlice;
```

### Slice Responsibilities

| Slice | Responsibility | State Examples |
|-------|----------------|----------------|
| `editorSlice` | Lexical editor state, auto-save | `editor`, `isDirty`, `saveStatus`, `lastSaved` |
| `documentSlice` | Document data, CRUD | `docId`, `title`, `content`, `properties`, `isLoading` |
| `outlineSlice` | Heading structure, navigation | `headings`, `activeHeadingId`, `expandedSections` |
| `propertiesSlice` | Frontmatter properties | `properties`, `isEditing`, `editedProperties` |
| `chatSlice` | Messages, streaming, thread | `messages`, `isStreaming`, `threadId`, `error` |
| `versionSlice` | Version history, comparison | `versions`, `selectedVersionId`, `compareMode` |
| `settingsSlice` | Access, activity | `agentAccess`, `activityLog`, `ragIndexed` |
| `uiSlice` | Layout, panels, modals | `outlineCollapsed`, `chatCollapsed`, `settingsOpen` |

---

## 4. File Impact Analysis

### Legend

| Symbol | Meaning |
|--------|---------|
| 🆕 | New file to create |
| ✏️ | Existing file to modify |
| 📋 | Pattern to follow from existing code |

---

### 4.1 Store Files (NEW)

```
app/(pages)/docs/[docId]/store/
├── index.ts                           # 🆕 Store composition
├── types.ts                           # 🆕 Combined store type
└── slices/
    ├── editorSlice.ts                 # 🆕 Editor state
    ├── documentSlice.ts               # 🆕 Document data
    ├── outlineSlice.ts                # 🆕 Outline state
    ├── propertiesSlice.ts             # 🆕 Properties state
    ├── chatSlice.ts                   # 🆕 Chat messages & streaming
    ├── versionSlice.ts                # 🆕 Version history
    ├── settingsSlice.ts               # 🆕 Settings & access
    └── uiSlice.ts                     # 🆕 UI state
```

**Pattern Source:** `records/store/`, `workflows/editor/store/`

| File | LOC Est. | Complexity | Dependencies |
|------|----------|------------|--------------|
| `index.ts` | 40 | Low | All slices |
| `types.ts` | 60 | Low | All slice types |
| `editorSlice.ts` | 200 | High | Lexical, Document API |
| `documentSlice.ts` | 150 | High | Document API |
| `outlineSlice.ts` | 100 | Medium | Document slice |
| `propertiesSlice.ts` | 120 | Medium | Document slice |
| `chatSlice.ts` | 200 | High | Chat API, Editor slice |
| `versionSlice.ts` | 150 | Medium | Version API |
| `settingsSlice.ts` | 120 | Medium | Settings API |
| `uiSlice.ts` | 80 | Low | None |

---

### 4.2 Frontend Components

#### Pages

| File | Status | Impact | Changes |
|------|--------|--------|---------|
| `app/(pages)/docs/[docId]/page.tsx` | 🆕 | High | Main document editor page |

#### Components — Document Editor

```
app/(pages)/docs/[docId]/components/DocumentEditor/
├── index.tsx                          # 🆕 Main editor container
├── LexicalEditor.tsx                 # 🆕 Lexical editor wrapper
├── Toolbar.tsx                        # 🆕 Formatting toolbar
├── SlashCommandMenu.tsx               # 🆕 Slash command menu
├── BlockHandle.tsx                    # 🆕 Block drag handle
└── EmptyState.tsx                     # 🆕 Empty document state
```

**Pattern Source:** `records/components/RecordsGrid.tsx`

| File | LOC Est. | Complexity | Store Slices Used |
|------|----------|------------|-------------------|
| `index.tsx` | 150 | High | `editorSlice`, `documentSlice`, `uiSlice` |
| `LexicalEditor.tsx` | 200 | High | `editorSlice` |
| `Toolbar.tsx` | 120 | Medium | `editorSlice` |
| `SlashCommandMenu.tsx` | 150 | High | `editorSlice`, `uiSlice` |
| `BlockHandle.tsx` | 100 | Medium | `editorSlice` |
| `EmptyState.tsx` | 60 | Low | `documentSlice` |

#### Components — Document Outline

```
app/(pages)/docs/[docId]/components/DocumentOutline/
├── index.tsx                          # 🆕 Outline container
├── OutlineItem.tsx                    # 🆕 Heading item
└── OutlineEmpty.tsx                  # 🆕 Empty state
```

| File | LOC Est. | Complexity | Store Slices Used |
|------|----------|------------|-------------------|
| `index.tsx` | 100 | Medium | `outlineSlice`, `uiSlice` |
| `OutlineItem.tsx` | 80 | Low | `outlineSlice` |
| `OutlineEmpty.tsx` | 40 | Low | None |

#### Components — Properties Panel

```
app/(pages)/docs/[docId]/components/PropertiesPanel/
├── index.tsx                          # 🆕 Properties container
├── PropertyField.tsx                  # 🆕 Property field editor
└── PropertyAdd.tsx                    # 🆕 Add custom property
```

| File | LOC Est. | Complexity | Store Slices Used |
|------|----------|------------|-------------------|
| `index.tsx` | 120 | Medium | `propertiesSlice`, `documentSlice` |
| `PropertyField.tsx` | 100 | Medium | `propertiesSlice` |
| `PropertyAdd.tsx` | 80 | Medium | `propertiesSlice` |

#### Components — Chat Sidebar

```
app/(pages)/docs/[docId]/components/ChatSidebar/
├── index.tsx                          # 🆕 Chat container
├── ChatArea.tsx                       # 🆕 Messages display
├── ChatEmpty.tsx                      # 🆕 Empty chat state
├── ChatInput.tsx                      # 🆕 Message input
└── AgentEditingIndicator.tsx          # 🆕 Agent editing feedback
```

**Pattern Source:** `records/components/ChatSidebar/`

| File | LOC Est. | Complexity | Store Slices Used |
|------|----------|------------|-------------------|
| `index.tsx` | 120 | Medium | `chatSlice`, `uiSlice` |
| `ChatArea.tsx` | 150 | High | `chatSlice` |
| `ChatEmpty.tsx` | 60 | Low | None |
| `ChatInput.tsx` | 100 | Medium | `chatSlice`, `editorSlice` |
| `AgentEditingIndicator.tsx` | 80 | Medium | `chatSlice`, `editorSlice` |

#### Components — Version History

```
app/(pages)/docs/[docId]/components/VersionHistory/
├── index.tsx                          # 🆕 Version list
├── VersionItem.tsx                    # 🆕 Version entry
├── VersionPreview.tsx                 # 🆕 Version preview
└── VersionCompare.tsx                 # 🆕 Diff view
```

| File | LOC Est. | Complexity | Store Slices Used |
|------|----------|------------|-------------------|
| `index.tsx` | 100 | Medium | `versionSlice`, `uiSlice` |
| `VersionItem.tsx` | 80 | Low | `versionSlice` |
| `VersionPreview.tsx` | 120 | Medium | `versionSlice` |
| `VersionCompare.tsx` | 150 | High | `versionSlice` |

#### Components — Settings Panel

```
app/(pages)/docs/[docId]/components/SettingsPanel/
├── index.tsx                          # 🆕 Settings container
├── AccessTab.tsx                      # 🆕 Agent access management
└── ActivityTab.tsx                     # 🆕 Activity log
```

| File | LOC Est. | Complexity | Store Slices Used |
|------|----------|------------|-------------------|
| `index.tsx` | 100 | Medium | `settingsSlice`, `uiSlice` |
| `AccessTab.tsx` | 150 | Medium | `settingsSlice` |
| `ActivityTab.tsx` | 120 | Medium | `settingsSlice` |

#### Components — Document Header

```
app/(pages)/docs/[docId]/components/DocumentHeader/
├── index.tsx                          # 🆕 Header container
├── TitleEditor.tsx                    # 🆕 Inline title editor
└── SaveStatus.tsx                     # 🆕 Save status indicator
```

| File | LOC Est. | Complexity | Store Slices Used |
|------|----------|------------|-------------------|
| `index.tsx` | 100 | Medium | `documentSlice`, `uiSlice` |
| `TitleEditor.tsx` | 80 | Medium | `documentSlice` |
| `SaveStatus.tsx` | 60 | Low | `editorSlice` |

---

### 4.3 Backend API Routes

#### Documents Routes

```
app/api/dox/
├── README.md                          # 🆕 Domain overview
├── list/
│   └── route.ts                       # 🆕 GET list documents
├── create/
│   └── route.ts                       # 🆕 POST create document
└── [docId]/
    ├── route.ts                       # 🆕 GET read, PATCH update, DELETE
    ├── chat/
    │   ├── route.ts                   # 🆕 POST streaming chat
    │   └── services/
    │       ├── document-agent.ts      # 🆕 Mastra agent with doc tools
    │       └── document-tools.ts       # 🆕 Document tool definitions
    ├── versions/
    │   ├── route.ts                   # 🆕 GET list versions
    │   └── [versionId]/
    │       ├── route.ts               # 🆕 GET version, POST restore
    │       └── compare/
    │           └── route.ts           # 🆕 GET version diff
    ├── access/
    │   ├── route.ts                   # 🆕 GET access info
    │   └── agents/
    │       ├── route.ts               # 🆕 POST grant access
    │       └── [agentId]/
    │           └── route.ts           # 🆕 PATCH update, DELETE revoke
    └── activity/
        └── route.ts                   # 🆕 GET activity log
```

| File | LOC Est. | Complexity | Dependencies |
|------|----------|------------|--------------|
| `route.ts` (list/create) | 100 | Medium | document-storage |
| `[docId]/route.ts` | 120 | Medium | document-storage |
| `chat/route.ts` | 150 | High | document-agent, Mastra |
| `chat/services/document-agent.ts` | 120 | High | Mastra, document-tools |
| `chat/services/document-tools.ts` | 250 | High | document-storage, markdown-parser |
| `versions/route.ts` | 100 | Medium | version-manager |
| `versions/[versionId]/route.ts` | 120 | Medium | version-manager |
| `versions/[versionId]/compare/route.ts` | 150 | High | version-manager, diff |
| `access/route.ts` | 80 | Medium | document-storage |
| `access/agents/route.ts` | 100 | Medium | document-storage |
| `access/agents/[agentId]/route.ts` | 100 | Medium | document-storage |
| `activity/route.ts` | 100 | Medium | document-storage |

---

### 4.4 Backend Services

```
app/api/dox/services/
├── README.md                          # 🆕 Service overview
├── document-storage.ts                # 🆕 File system operations
├── markdown-parser.ts                 # 🆕 Markdown ↔ Lexical conversion
├── frontmatter.ts                     # 🆕 YAML frontmatter handling
├── outline-generator.ts               # 🆕 Extract heading structure
└── version-manager.ts                 # 🆕 Version tracking
```

| File | LOC Est. | Complexity | Dependencies |
|------|----------|------------|--------------|
| `document-storage.ts` | 150 | Medium | File I/O, gray-matter |
| `markdown-parser.ts` | 200 | High | Lexical, remark |
| `frontmatter.ts` | 100 | Medium | gray-matter, js-yaml |
| `outline-generator.ts` | 120 | Medium | remark |
| `version-manager.ts` | 150 | Medium | document-storage, diff |

---

### 4.5 Document Storage

```
_tables/dox/
├── index.ts                           # 🆕 Document registry
└── [docId]/
    └── content.md                     # 🆕 Markdown content with frontmatter
```

**Pattern Source:** `_tables/records/[tableId]/`

---

### 4.6 Hooks

```
app/(pages)/docs/[docId]/hooks/
├── useDocument.ts                     # 🆕 Document CRUD hooks
├── useDocumentChat.ts                 # 🆕 Chat streaming hook
└── useDocumentVersions.ts             # 🆕 Version history hook
```

**Pattern Source:** `records/hooks/useRecords.ts`

| File | LOC Est. | Complexity | Dependencies |
|------|----------|------------|--------------|
| `useDocument.ts` | 150 | Medium | TanStack Query |
| `useDocumentChat.ts` | 200 | High | TanStack Query, SSE |
| `useDocumentVersions.ts` | 120 | Medium | TanStack Query |

---

### 4.7 File Count Summary

| Category | New | Modified | Total |
|----------|-----|----------|-------|
| Store | 10 | 0 | 10 |
| Frontend Page | 1 | 0 | 1 |
| Frontend Components | 30 | 0 | 30 |
| Backend Routes | 12 | 0 | 12 |
| Backend Services | 5 | 0 | 5 |
| Document Storage | 2 | 0 | 2 |
| Hooks | 3 | 0 | 3 |
| Dependencies | 0 | 1 | 1 |
| **Total** | **63** | **1** | **64** |

---

## 5. Phase Breakdown

### Phase 0: Technical Spike

**Goal:** Validate core technical assumptions before building full infrastructure.

**Why first:** Before investing in 64+ files, we need to confirm that Lexical blocks → Markdown, block manipulation, frontmatter parsing, and agent tools all work as expected.

**Status:** See `00-Phase0-Technical-Spike.md` for complete details.

**Key Validations:**
- Lexical editor creation
- Markdown serialization (blocks → Markdown)
- Markdown parsing (Markdown → blocks)
- Block insertion/deletion
- Frontmatter parsing
- Agent tool patterns

**⚠️ Important:** After Phase 0 completes, **revisit all later phases** before executing them. If Phase 0 reveals any issues or learnings that change our assumptions, update the technical architecture and phase plans accordingly.

---

### Phase 1: Core Document CRUD

**Goal:** Create backend infrastructure for document storage and basic API.

**Depends On:** Phase 0 (Technical Spike) - Assumes all core assumptions validated.

#### Files to Create

| File | Description |
|------|-------------|
| `app/api/dox/list/route.ts` | GET list documents |
| `app/api/dox/create/route.ts` | POST create document |
| `app/api/dox/[docId]/route.ts` | GET read, PATCH update, DELETE document |
| `app/api/dox/services/document-storage.ts` | File system operations |
| `app/api/dox/services/markdown-parser.ts` | Markdown ↔ Lexical conversion |
| `app/api/dox/services/frontmatter.ts` | YAML frontmatter handling |
| `app/api/dox/README.md` | Domain overview |
| `_tables/dox/index.ts` | Document registry |
| `_tables/dox/[docId]/content.md` | Sample document |

#### Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add Lexical and Markdown dependencies |

#### Acceptance Criteria

- [ ] `POST /api/dox/create` creates document
- [ ] `GET /api/dox/list` lists documents
- [ ] `GET /api/dox/[docId]` returns document
- [ ] `PATCH /api/dox/[docId]` updates document
- [ ] `DELETE /api/dox/[docId]` deletes document
- [ ] Documents stored as Markdown files
- [ ] Frontmatter parsed correctly
- [ ] Markdown round-trip works

---

### Phase 2: Basic Editor UI

**Goal:** Create Lexical editor with basic blocks and auto-save.

#### Files to Create — Store

| File | Description |
|------|-------------|
| `store/index.ts` | Store composition |
| `store/types.ts` | Combined store type |
| `store/slices/editorSlice.ts` | Editor state |
| `store/slices/documentSlice.ts` | Document data |
| `store/slices/uiSlice.ts` | UI state |

#### Files to Create — Components

| File | Description |
|------|-------------|
| `page.tsx` | Main document editor page |
| `components/DocumentHeader/index.tsx` | Header with title and save status |
| `components/DocumentHeader/TitleEditor.tsx` | Inline title editor |
| `components/DocumentHeader/SaveStatus.tsx` | Save status indicator |
| `components/DocumentEditor/index.tsx` | Editor container |
| `components/DocumentEditor/LexicalEditor.tsx` | Lexical editor wrapper |
| `components/DocumentEditor/Toolbar.tsx` | Formatting toolbar |
| `components/DocumentEditor/EmptyState.tsx` | Empty document state |

#### Acceptance Criteria

- [ ] Page at `/docs/[docId]` loads
- [ ] Editor displays document content
- [ ] Can type and edit content
- [ ] Basic blocks work (paragraph, heading, list)
- [ ] Formatting toolbar applies formatting
- [ ] Auto-save triggers after 2s idle
- [ ] Save status shows correctly
- [ ] Empty state shows placeholder

---

### Phase 3: Block Features

**Goal:** Slash commands, drag-and-drop, advanced blocks.

#### Files to Create

| File | Description |
|------|-------------|
| `components/DocumentEditor/SlashCommandMenu.tsx` | Slash command menu |
| `components/DocumentEditor/BlockHandle.tsx` | Block drag handle |
| Integration with `cmdk` and `@dnd-kit` |

#### Acceptance Criteria

- [ ] Slash command (`/`) opens menu
- [ ] Can insert blocks via slash commands
- [ ] Drag-and-drop reorders blocks
- [ ] All block types supported (table, code, quote, etc.)
- [ ] Block handles appear on hover
- [ ] Block menu works (duplicate, delete, turn into)

---

### Phase 4: Outline & Properties

**Goal:** Document outline sidebar and properties panel.

#### Files to Create

| File | Description |
|------|-------------|
| `components/DocumentOutline/index.tsx` | Outline container |
| `components/DocumentOutline/OutlineItem.tsx` | Heading item |
| `components/DocumentOutline/OutlineEmpty.tsx` | Empty state |
| `components/PropertiesPanel/index.tsx` | Properties container |
| `components/PropertiesPanel/PropertyField.tsx` | Property field editor |
| `components/PropertiesPanel/PropertyAdd.tsx` | Add custom property |
| `store/slices/outlineSlice.ts` | Outline state |
| `store/slices/propertiesSlice.ts` | Properties state |
| `app/api/dox/services/outline-generator.ts` | Extract headings |

#### Acceptance Criteria

- [ ] Outline shows heading hierarchy
- [ ] Clicking heading jumps to section
- [ ] Current section highlighted
- [ ] Properties panel shows frontmatter
- [ ] Properties can be edited
- [ ] Custom properties can be added

---

### Phase 5: Chat & Agent Integration

**Goal:** Chat sidebar and agent document tools.

#### Files to Create — Backend

| File | Description |
|------|-------------|
| `[docId]/chat/route.ts` | Streaming chat endpoint |
| `[docId]/chat/services/document-agent.ts` | Mastra agent |
| `[docId]/chat/services/document-tools.ts` | Document tool definitions |

#### Files to Create — Store

| File | Description |
|------|-------------|
| `store/slices/chatSlice.ts` | Chat messages, streaming |

#### Files to Create — Components

| File | Description |
|------|-------------|
| `components/ChatSidebar/index.tsx` | Chat container |
| `components/ChatSidebar/ChatArea.tsx` | Messages display |
| `components/ChatSidebar/ChatEmpty.tsx` | Empty state |
| `components/ChatSidebar/ChatInput.tsx` | Message input |
| `components/ChatSidebar/AgentEditingIndicator.tsx` | Agent editing feedback |

#### Acceptance Criteria

- [ ] Chat sidebar works
- [ ] Agent can read document
- [ ] Agent can insert content
- [ ] Agent can replace content
- [ ] Agent edits show live feedback
- [ ] "Agent editing" indicator shows
- [ ] Chat streams responses correctly

---

### Phase 6: Version History

**Goal:** Version tracking, comparison, restoration.

#### Files to Create — Backend

| File | Description |
|------|-------------|
| `[docId]/versions/route.ts` | List versions |
| `[docId]/versions/[versionId]/route.ts` | Get version, restore |
| `[docId]/versions/[versionId]/compare/route.ts` | Version diff |
| `services/version-manager.ts` | Version tracking |

#### Files to Create — Store

| File | Description |
|------|-------------|
| `store/slices/versionSlice.ts` | Version history |

#### Files to Create — Components

| File | Description |
|------|-------------|
| `components/VersionHistory/index.tsx` | Version list |
| `components/VersionHistory/VersionItem.tsx` | Version entry |
| `components/VersionHistory/VersionPreview.tsx` | Version preview |
| `components/VersionHistory/VersionCompare.tsx` | Diff view |

#### Acceptance Criteria

- [ ] Versions auto-created periodically
- [ ] Version list shows all versions
- [ ] Version preview works
- [ ] Version comparison shows diff
- [ ] Can restore versions
- [ ] Agent versions marked distinctly

---

### Phase 7: Settings & Access

**Goal:** Access management and activity log.

#### Files to Create — Backend

| File | Description |
|------|-------------|
| `[docId]/access/route.ts` | Get access info |
| `[docId]/access/agents/route.ts` | Grant access |
| `[docId]/access/agents/[agentId]/route.ts` | Update/revoke access |
| `[docId]/activity/route.ts` | Activity log |

#### Files to Create — Store

| File | Description |
|------|-------------|
| `store/slices/settingsSlice.ts` | Settings & access |

#### Files to Create — Components

| File | Description |
|------|-------------|
| `components/SettingsPanel/index.tsx` | Settings container |
| `components/SettingsPanel/AccessTab.tsx` | Agent access management |
| `components/SettingsPanel/ActivityTab.tsx` | Activity log |

#### Acceptance Criteria

- [ ] Can grant agent access
- [ ] Can revoke agent access
- [ ] Activity log shows edits
- [ ] Activity log filterable
- [ ] RAG status shown

---

### Phase 8: Polish & Validation

**Goal:** Error handling, edge cases, UX polish.

#### Files to Modify

| File | Changes |
|------|---------|
| Various components | Error states, loading states |
| `editorSlice.ts` | Reconnection logic |
| `documentSlice.ts` | Error handling |
| `chatSlice.ts` | Error recovery |

#### Acceptance Criteria

- [ ] All acceptance criteria from previous phases
- [ ] Error states handled gracefully
- [ ] Large documents handled well
- [ ] Performance optimized
- [ ] All edge cases covered

---

## 6. Detailed Slice Specifications

### 6.1 editorSlice

```typescript
// store/slices/editorSlice.ts

import { LexicalEditor } from "lexical";

export interface EditorSliceState {
  editor: LexicalEditor | null;
  isDirty: boolean;
  saveStatus: "saved" | "saving" | "error";
  lastSaved: string | null;
  autoSaveTimer: NodeJS.Timeout | null;
}

export interface EditorSliceActions {
  // Editor management
  initializeEditor: (editor: LexicalEditor) => void;
  setEditor: (editor: LexicalEditor | null) => void;
  
  // Save management
  markDirty: () => void;
  markClean: () => void;
  setSaveStatus: (status: EditorSliceState["saveStatus"]) => void;
  autoSave: () => Promise<void>;
  
  // Helpers
  getEditorState: () => string | null;  // Serialized state
  setEditorState: (state: string) => void;
}

export type EditorSlice = EditorSliceState & EditorSliceActions;
```

### 6.2 documentSlice

```typescript
// store/slices/documentSlice.ts

export interface Document {
  id: string;
  title: string;
  content: string;
  properties: Record<string, unknown>;
  outline: Array<{ level: number; text: string; id: string; position: number }>;
  wordCount: number;
  characterCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSliceState {
  docId: string | null;
  document: Document | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

export interface DocumentSliceActions {
  // CRUD
  loadDocument: (docId: string) => Promise<void>;
  createDocument: (title?: string) => Promise<Document>;
  updateDocument: (updates: Partial<Document>) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  
  // Updates
  setDocument: (document: Document) => void;
  updateTitle: (title: string) => void;
  updateContent: (content: string) => void;
  updateProperties: (properties: Record<string, unknown>) => void;
  
  // Error handling
  setError: (error: string | null) => void;
}

export type DocumentSlice = DocumentSliceState & DocumentSliceActions;
```

### 6.3 outlineSlice

```typescript
// store/slices/outlineSlice.ts

export interface Heading {
  level: number;
  text: string;
  id: string;
  position: number;
}

export interface OutlineSliceState {
  headings: Heading[];
  activeHeadingId: string | null;
  expandedSections: Set<string>;
}

export interface OutlineSliceActions {
  // Outline management
  setHeadings: (headings: Heading[]) => void;
  updateOutline: (content: string) => void;  // Regenerate from content
  
  // Navigation
  setActiveHeading: (headingId: string | null) => void;
  scrollToHeading: (headingId: string) => void;
  
  // Expansion
  toggleSection: (headingId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

export type OutlineSlice = OutlineSliceState & OutlineSliceActions;
```

### 6.4 propertiesSlice

```typescript
// store/slices/propertiesSlice.ts

export interface PropertiesSliceState {
  properties: Record<string, unknown>;
  isEditing: boolean;
  editedProperties: Record<string, unknown>;
}

export interface PropertiesSliceActions {
  // Properties management
  setProperties: (properties: Record<string, unknown>) => void;
  updateProperty: (key: string, value: unknown) => void;
  addProperty: (key: string, value: unknown) => void;
  removeProperty: (key: string) => void;
  
  // Editing
  startEditing: () => void;
  cancelEditing: () => void;
  saveProperties: () => Promise<void>;
}

export type PropertiesSlice = PropertiesSliceState & PropertiesSliceActions;
```

### 6.5 chatSlice

```typescript
// store/slices/chatSlice.ts

import type { UIMessage } from "ai";

export interface ChatSliceState {
  messages: UIMessage[];
  threadId: string | null;
  isStreaming: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  agentEditing: {
    isEditing: boolean;
    agentId: string | null;
    agentName: string | null;
    changes: Array<{ type: "insert" | "replace" | "delete"; position: number }>;
  };
}

export interface ChatSliceActions {
  // Messages
  setMessages: (messages: UIMessage[]) => void;
  addMessage: (message: UIMessage) => void;
  appendToLastMessage: (content: string) => void;
  clearMessages: () => void;
  
  // Thread
  setThreadId: (threadId: string | null) => void;
  
  // Streaming
  setIsStreaming: (streaming: boolean) => void;
  
  // Agent editing
  setAgentEditing: (editing: ChatSliceState["agentEditing"]) => void;
  addAgentChange: (change: ChatSliceState["agentEditing"]["changes"][0]) => void;
  clearAgentEditing: () => void;
  
  // High-level actions
  sendMessage: (docId: string, text: string) => Promise<void>;
}

export type ChatSlice = ChatSliceState & ChatSliceActions;
```

### 6.6 versionSlice

```typescript
// store/slices/versionSlice.ts

export interface DocumentVersion {
  id: string;
  createdAt: string;
  createdBy: { type: "user" | "agent"; id: string; name: string; avatar?: string };
  summary: string;
  wordCount: number;
  wordsDelta: number;
}

export interface VersionSliceState {
  versions: DocumentVersion[];
  selectedVersionId: string | null;
  compareMode: "unified" | "sideBySide" | null;
  compareFrom: string | null;
  compareTo: string | null;
}

export interface VersionSliceActions {
  // Versions
  setVersions: (versions: DocumentVersion[]) => void;
  loadVersions: (docId: string) => Promise<void>;
  
  // Selection
  selectVersion: (versionId: string | null) => void;
  
  // Comparison
  startComparison: (from: string, to: string) => void;
  setCompareMode: (mode: VersionSliceState["compareMode"]) => void;
  clearComparison: () => void;
  
  // Restoration
  restoreVersion: (docId: string, versionId: string) => Promise<void>;
}

export type VersionSlice = VersionSliceState & VersionSliceActions;
```

### 6.7 settingsSlice

```typescript
// store/slices/settingsSlice.ts

export interface AgentAccess {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  permission: "read" | "read-write";
  grantedAt: string;
}

export interface ActivityEntry {
  id: string;
  type: "edit" | "create" | "view" | "access_granted" | "access_revoked";
  actor: { type: "user" | "agent"; id: string; name: string; avatar?: string };
  timestamp: string;
  summary: string;
}

export interface SettingsSliceState {
  agentAccess: AgentAccess[];
  activityLog: ActivityEntry[];
  ragIndexed: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SettingsSliceActions {
  // Access management
  loadAccess: (docId: string) => Promise<void>;
  grantAccess: (docId: string, agentId: string, permission: "read" | "read-write") => Promise<void>;
  revokeAccess: (docId: string, agentId: string) => Promise<void>;
  
  // Activity
  loadActivity: (docId: string, filter?: "all" | "agents" | "user") => Promise<void>;
  
  // RAG
  checkRAGStatus: (docId: string) => Promise<void>;
  
  // Error handling
  setError: (error: string | null) => void;
}

export type SettingsSlice = SettingsSliceState & SettingsSliceActions;
```

### 6.8 uiSlice

```typescript
// store/slices/uiSlice.ts

export interface UiSliceState {
  // Panels
  outlineCollapsed: boolean;
  chatCollapsed: boolean;
  propertiesCollapsed: boolean;
  
  // Modals
  settingsOpen: boolean;
  versionHistoryOpen: boolean;
  
  // Editor UI
  slashCommandOpen: boolean;
  blockMenuOpen: string | null;  // Block ID
}

export interface UiSliceActions {
  // Panels
  toggleOutline: () => void;
  toggleChat: () => void;
  toggleProperties: () => void;
  setOutlineCollapsed: (collapsed: boolean) => void;
  setChatCollapsed: (collapsed: boolean) => void;
  setPropertiesCollapsed: (collapsed: boolean) => void;
  
  // Modals
  openSettings: () => void;
  closeSettings: () => void;
  openVersionHistory: () => void;
  closeVersionHistory: () => void;
  
  // Editor UI
  setSlashCommandOpen: (open: boolean) => void;
  setBlockMenuOpen: (blockId: string | null) => void;
  
  // Reset
  resetUiState: () => void;
}

export type UiSlice = UiSliceState & UiSliceActions;
```

---

## 7. Dependency Graph

```
                    ┌─────────────────┐
                    │   Phase 0       │
                    │ Technical Spike │
                    │ (Validation)    │
                    └────────┬────────┘
                             │
                             │ validates assumptions for
                             ▼
                    ┌─────────────────┐
                    │   Phase 1       │
                    │ Core Document   │
                    │ CRUD (Backend)  │
                    └────────┬────────┘
                             │
                             │ depends on
                             ▼
                    ┌─────────────────┐
                    │   Phase 2       │
                    │ Basic Editor UI │
                    │ (Frontend)      │
                    └────────┬────────┘
                             │
                             │ depends on
                             ▼
                    ┌─────────────────┐
                    │   Phase 3       │
                    │ Block Features  │
                    │ (Slash, DnD)    │
                    └────────┬────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
            ▼                                 ▼
   ┌─────────────────┐               ┌─────────────────┐
   │   Phase 4       │               │   Phase 5       │
   │ Outline & Props │               │ Chat & Agent    │
   │ (Can parallel)  │               │ (Core Feature)  │
   └────────┬────────┘               └────────┬────────┘
            │                                 │
            └─────────────┬───────────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   Phase 6       │
                 │ Version History │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   Phase 7       │
                 │ Settings &      │
                 │ Access          │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   Phase 8       │
                 │ Polish & QA     │
                 │ (All Features)  │
                 └─────────────────┘
```

**⚠️ Important:** After Phase 0 completes, review all phases (1-8) before execution. Phase 0 may reveal issues that require updates to later phases.

### Cross-Slice Dependencies

```
documentSlice ───────────────────────┐
                                     ▼
editorSlice ──► (reads docId from document)
                                     │
outlineSlice ──► (reads content from document)
                                     │
propertiesSlice ──► (reads properties from document)
                                     │
chatSlice ──────────────────────────►├──► (sends messages for docId)
                 │                   │
                 ▼                   │
editorSlice ◄──┘ (receives agent edits from chat)
                                     │
versionSlice ──► (reads docId from document)
                                     │
settingsSlice ──► (reads docId from document)

uiSlice ──────► (standalone, read by components)
```

---

## 8. Risk Assessment

### High Risk

| Risk | Mitigation |
|------|------------|
| **Core assumptions invalid** | **Phase 0 spike validates all assumptions before Phase 1** |
| Lexical Markdown round-trip fails | Test thoroughly in Phase 0, have fallback plan |
| Block manipulation API unclear | Research Lexical API extensively, test in Phase 0 |
| Agent tool patterns don't work | Validate in Phase 0, adjust tool definitions if needed |
| Large document performance | Test with 10k+ words in Phase 0, optimize if needed |

### Medium Risk

| Risk | Mitigation |
|------|------------|
| Frontmatter parsing edge cases | Use well-tested library (gray-matter), handle errors gracefully |
| Version storage size | Start with full copies, optimize with diffs later if needed |
| Concurrent edits (user + agent) | Lock document during agent edits, show clear indicators |
| Markdown sanitization | Use remark plugins for sanitization, validate on save |

### Low Risk

| Risk | Mitigation |
|------|------------|
| Store complexity | Follow existing slice patterns exactly |
| UI component styling | Use ShadCN components, copy from mockups |
| Route organization | Follow established API patterns |
| Package compatibility | Test in Phase 0, use stable versions |

---

## Related Documents

- **Phase 0:** `00-Phase0-Technical-Spike.md` - Core assumptions validation (MUST complete first)
- **Product Spec:** `00-Product-Spec.md`
- **Technical Architecture:** `03-Technical-Architecture.md` (may need updates after Phase 0)
- **Research Log:** `02-Research-Log.md`
- **UXD Mockups:** `_docs/UXD/Pages/records/2025-12-10-docs-v1/`
- **Frontend-Backend Mapping:** `_docs/UXD/Pages/records/2025-12-10-docs-v1/Frontend-Backend-Mapping.md`
- **Store Pattern:** `_docs/Engineering/Architecture/Store-Slice-Architecture.md`
- **Pattern Sources:**
  - `app/(pages)/records/store/` (6 slices)
  - `app/(pages)/workflows/editor/store/` (10 slices)
  - `app/(pages)/workforce/components/agent-modal/store/` (3 slices)

---

**Last Updated:** 2025-12-10

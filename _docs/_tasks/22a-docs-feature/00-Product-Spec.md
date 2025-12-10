# Task 22a: Docs Feature — Product Spec

**Status:** Planning  
**Date:** December 2025  
**Goal:** Build a Notion-style block-based document editor with Markdown storage, enabling users to create long-form content and agents to read/write documents intelligently.

---

## How to Use This Document

This document defines **what to build** for the Docs feature. It covers requirements, acceptance criteria, user flows, and design decisions for a block-based document editor that combines the best of Google Docs, Obsidian, and Notion.

**Informed by:**
- UXD mockups: `_docs/UXD/Pages/records/2025-12-10-docs-v1/`
- Frontend-Backend Mapping: `_docs/UXD/Pages/records/2025-12-10-docs-v1/Frontend-Backend-Mapping.md`
- Records feature patterns: `_docs/_tasks/20-records-feature/`
- Browser automation planning: `_docs/_tasks/21-browser-automation/`

**This document informs:**
- Research Log (package discovery)
- Technical Architecture (tech stack decisions)
- Implementation Plan (file structure and phases)
- Phase documents (detailed implementation steps)

---

## 1. Executive Summary

**The Problem:** Users need a way to create and manage long-form documents within Agipo. Agents need structured knowledge that they can read, write, and reference. We have Records (Sheets-like) but lack a Docs-like primitive for unstructured content.

**The Solution:** A block-based document editor that stores content as Markdown, providing a familiar Google Docs-style editing experience with Notion-style blocks and Obsidian-style organization. Agents can read documents via RAG and directly edit them through natural language chat.

**Who Benefits:** 
- **Users**: Create documents, notes, research, and knowledge bases
- **Agents**: Access structured knowledge, read documents, and edit content intelligently
- **Engineering**: Reusable document primitive for future features

**End State:** Users can create documents at `/docs/[docId]`, edit them with a familiar block-based interface, chat with agents to get help or make edits, and see all changes tracked in version history. Documents are stored as Markdown for portability and indexed via Mastra RAG for agent retrieval.

---

## 2. Product Requirements

### 2.1 Document Editor (Core)

**Definition:** Block-based WYSIWYG editor for creating and editing documents

**Why it matters:** This is the primary interface. Users need a familiar, powerful editing experience.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-1.1 | Editor renders blocks (paragraphs, headings, lists, tables) | P0 |
| PR-1.2 | Blocks can be reordered via drag-and-drop | P0 |
| PR-1.3 | Slash command menu (`/`) inserts block types | P0 |
| PR-1.4 | Text formatting toolbar (bold, italic, headings, lists, links, code) | P0 |
| PR-1.5 | Editor auto-saves changes every 2 seconds | P0 |
| PR-1.6 | Editor shows save status (saving/saved/error) | P0 |
| PR-1.7 | Empty document shows placeholder with hints | P0 |
| PR-1.8 | Editor supports keyboard shortcuts (Cmd+B, Cmd+I, etc.) | P1 |
| PR-1.9 | Text selection shows floating formatting toolbar | P1 |
| PR-1.10 | Editor handles large documents (>10k words) without lag | P0 |

**User Value:** Familiar editing experience that feels like Google Docs but with the power of Notion blocks.

---

### 2.2 Block Types

**Definition:** Supported content block types

**Why it matters:** Users need various content types for rich documents.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-2.1 | Paragraph blocks (default) | P0 |
| PR-2.2 | Heading blocks (H1-H6) | P0 |
| PR-2.3 | Bullet list blocks | P0 |
| PR-2.4 | Numbered list blocks | P0 |
| PR-2.5 | Code blocks with syntax highlighting | P0 |
| PR-2.6 | Blockquote blocks | P0 |
| PR-2.7 | Table blocks (insert/edit cells) | P0 |
| PR-2.8 | Link blocks (inline links) | P0 |
| PR-2.9 | Horizontal rule blocks | P1 |
| PR-2.10 | Image blocks (URL-based) | P1 |
| PR-2.11 | Checkbox list blocks | P1 |

**User Value:** Rich content types enable diverse document creation.

---

### 2.3 Document Outline

**Definition:** Left sidebar showing document heading structure

**Why it matters:** Navigation for long documents, Obsidian-style organization.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-3.1 | Outline shows heading hierarchy (H1-H6) | P0 |
| PR-3.2 | Clicking heading jumps to that section | P0 |
| PR-3.3 | Current section highlighted in outline | P0 |
| PR-3.4 | Outline updates as document changes | P0 |
| PR-3.5 | Outline can be collapsed/expanded | P1 |
| PR-3.6 | Outline shows word count per section | P2 |

**User Value:** Easy navigation for long documents.

---

### 2.4 Properties Panel (Frontmatter)

**Definition:** Document metadata displayed as editable fields

**Why it matters:** Obsidian-style properties for organization and RAG.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-4.1 | Properties panel shows frontmatter fields | P0 |
| PR-4.2 | Properties include: title, tags, created date, updated date | P0 |
| PR-4.3 | Properties can be edited inline | P0 |
| PR-4.4 | Properties panel can be collapsed | P0 |
| PR-4.5 | Custom properties can be added | P1 |
| PR-4.6 | Properties support various types (text, date, tags, URL) | P1 |

**User Value:** Organized metadata for document management.

---

### 2.5 Chat Sidebar (Agent Integration)

**Definition:** Right sidebar for chatting with agents about the document

**Why it matters:** Core agent integration, enables agentic editing.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-5.1 | Chat sidebar shows agent selection dropdown | P0 |
| PR-5.2 | Chat shows message history with streaming | P0 |
| PR-5.3 | Agent can read document content | P0 |
| PR-5.4 | Agent can insert content at cursor or position | P0 |
| PR-5.5 | Agent can replace selected text | P0 |
| PR-5.6 | Agent edits show live feedback in document | P0 |
| PR-5.7 | Chat shows "Agent is editing..." indicator | P0 |
| PR-5.8 | Chat sidebar can be collapsed | P0 |
| PR-5.9 | Empty chat shows suggested prompts | P1 |
| PR-5.10 | Chat supports multiple threads per document | P1 |

**User Value:** Natural language document editing and assistance.

---

### 2.6 Version History

**Definition:** View and restore past document versions

**Why it matters:** Undo mistakes, track changes, see agent edits.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-6.1 | Version history shows list of versions | P0 |
| PR-6.2 | Each version shows timestamp and author (user/agent) | P0 |
| PR-6.3 | Agent versions clearly marked with agent name/avatar | P0 |
| PR-6.4 | Version preview shows document at that point | P0 |
| PR-6.5 | Version comparison shows diff (side-by-side or unified) | P0 |
| PR-6.6 | Can restore any version | P0 |
| PR-6.7 | Versions auto-created every 5 minutes or on significant changes | P0 |
| PR-6.8 | Version summary shows word count delta | P1 |

**User Value:** Safety net and change tracking.

---

### 2.7 Settings & Access Management

**Definition:** Manage which agents have access to documents

**Why it matters:** Control agent permissions, track activity.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-7.1 | Settings panel shows agent access list | P0 |
| PR-7.2 | Can grant agent access (read-only or read-write) | P0 |
| PR-7.3 | Can revoke agent access | P0 |
| PR-7.4 | Activity log shows all edits (user and agent) | P0 |
| PR-7.5 | Activity log filterable by user/agent | P1 |
| PR-7.6 | RAG indexing status shown (indexed/not indexed) | P1 |

**User Value:** Control and visibility over document access.

---

### 2.8 Document Storage & Format

**Definition:** Documents stored as Markdown with YAML frontmatter

**Why it matters:** Portability, RAG processing, Git-friendly.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-8.1 | Documents stored as Markdown files | P0 |
| PR-8.2 | Frontmatter stored as YAML at document top | P0 |
| PR-8.3 | Markdown round-trip preserves formatting | P0 |
| PR-8.4 | Documents stored in `_tables/dox/[docId]/` | P0 |
| PR-8.5 | Document structure: `content.md` + `meta.json` | P0 |
| PR-8.6 | Documents can be exported as raw Markdown | P1 |

**User Value:** Portable, versionable documents.

---

## 3. Acceptance Criteria

### Document Editor (10 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1 | Editor loads and displays document content | Open document, verify content renders |
| AC-2 | Typing creates new paragraph blocks | Type text, verify block created |
| AC-3 | Slash command (`/`) opens block menu | Type `/`, verify menu appears |
| AC-4 | Selecting block type inserts that block | Type `/heading`, verify heading inserted |
| AC-5 | Drag-and-drop reorders blocks | Drag block, verify new position |
| AC-6 | Formatting toolbar applies formatting | Select text, click Bold, verify bold |
| AC-7 | Auto-save triggers after 2s idle | Type, wait 2s, verify save indicator |
| AC-8 | Save status shows "Saving..." then "Saved" | Watch save indicator during edit |
| AC-9 | Empty document shows placeholder | Create new doc, verify placeholder |
| AC-10 | Keyboard shortcuts work (Cmd+B, Cmd+I) | Press Cmd+B, verify bold applied |

### Block Types (11 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-11 | Paragraph blocks render as text | Type text, verify paragraph block |
| AC-12 | Heading blocks render with correct size | Insert H1, verify large text |
| AC-13 | Bullet lists render with bullets | Insert list, verify bullets |
| AC-14 | Numbered lists render with numbers | Insert numbered list, verify numbers |
| AC-15 | Code blocks render with syntax highlighting | Insert code block, verify highlighting |
| AC-16 | Tables render with cells | Insert table, verify cells editable |
| AC-17 | Blockquotes render indented | Insert quote, verify indentation |
| AC-18 | Links render clickable | Insert link, verify clickable |
| AC-19 | Horizontal rules render as line | Insert rule, verify line |
| AC-20 | Images render from URL | Insert image URL, verify image |
| AC-21 | Checkbox lists render with checkboxes | Insert checkbox list, verify boxes |

### Document Outline (6 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-22 | Outline shows all headings | Create headings, verify in outline |
| AC-23 | Clicking heading jumps to section | Click heading, verify scroll |
| AC-24 | Current section highlighted | Scroll document, verify highlight |
| AC-25 | Outline updates on heading change | Change heading, verify outline updates |
| AC-26 | Outline collapses/expands | Click collapse, verify hidden |
| AC-27 | Outline shows nested heading hierarchy | Create H2 under H1, verify nesting |

### Properties Panel (6 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-28 | Properties panel shows frontmatter fields | Open doc, verify properties visible |
| AC-29 | Title field editable | Edit title, verify updates |
| AC-30 | Tags field accepts multiple tags | Add tags, verify saved |
| AC-31 | Created/updated dates shown | Verify dates displayed |
| AC-32 | Properties panel collapses | Click collapse, verify hidden |
| AC-33 | Custom properties can be added | Add custom property, verify saved |

### Chat Sidebar (10 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-34 | Chat sidebar shows agent picker | Open chat, verify dropdown |
| AC-35 | Selecting agent starts conversation | Select agent, verify chat ready |
| AC-36 | Sending message streams response | Send message, verify streaming |
| AC-37 | Agent can read document | Ask "summarize this", verify response |
| AC-38 | Agent can insert content | Ask "add paragraph", verify inserted |
| AC-39 | Agent edits show live feedback | Agent edits, verify document updates |
| AC-40 | "Agent editing" indicator shows | Agent edits, verify indicator |
| AC-41 | Chat sidebar collapses | Click collapse, verify hidden |
| AC-42 | Empty chat shows suggestions | Open empty chat, verify prompts |
| AC-43 | Multiple threads supported | Create thread, verify list |

### Version History (8 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-44 | Version list shows all versions | Open history, verify list |
| AC-45 | Versions show timestamp and author | Verify timestamp and author shown |
| AC-46 | Agent versions marked distinctly | Verify agent icon/name shown |
| AC-47 | Version preview shows document | Click version, verify preview |
| AC-48 | Version comparison shows diff | Compare versions, verify diff |
| AC-49 | Can restore version | Restore version, verify restored |
| AC-50 | Versions auto-created periodically | Wait 5 min, verify version created |
| AC-51 | Version summary shows changes | Verify word count delta shown |

### Settings & Access (6 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-52 | Settings shows agent access list | Open settings, verify list |
| AC-53 | Can grant agent access | Add agent, verify added |
| AC-54 | Can revoke agent access | Remove agent, verify removed |
| AC-55 | Activity log shows edits | Open activity, verify log |
| AC-56 | Activity log filterable | Filter by agent, verify filtered |
| AC-57 | RAG status shown | Verify indexed/not indexed shown |

### Storage & Format (6 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-58 | Documents stored as Markdown | Check file, verify Markdown |
| AC-59 | Frontmatter stored as YAML | Check file, verify YAML frontmatter |
| AC-60 | Markdown round-trip preserves format | Edit, save, reload, verify same |
| AC-61 | Documents in `_tables/dox/[docId]/` | Verify file location |
| AC-62 | Document structure correct | Verify `content.md` + `meta.json` |
| AC-63 | Can export raw Markdown | Export, verify Markdown file |

---

## 4. User Flows

### Flow 1: Create New Document

**Goal:** User creates a new document and starts writing

```
1. User navigates to /docs (or clicks "New Document")
2. System creates new document with default frontmatter
3. Editor opens with empty state (placeholder visible)
4. User types "/heading" to insert heading block
5. Slash command menu appears
6. User selects "Heading 1"
7. Heading block inserted, cursor in heading
8. User types "My Document Title"
9. User presses Enter, new paragraph block created
10. User types content
11. System auto-saves after 2s idle
12. Footer shows "Saved just now"
```

**Success Metric:** Document created and saved in <5 seconds

---

### Flow 2: Agent Edits Document

**Goal:** User asks agent to edit document, agent makes changes

```
1. User has document open
2. User opens chat sidebar, selects agent "Zen"
3. User types: "Add a summary section at the top"
4. Agent responds: "I'll add a summary section..."
5. Chat shows "Agent is editing..." indicator
6. Agent inserts heading block "## Summary"
7. Agent inserts paragraph block with summary content
8. Document updates live showing new blocks
9. Agent responds: "I've added a summary section"
10. Chat shows "Agent finished editing"
11. Version history shows new version with agent attribution
```

**Success Metric:** Agent edits complete in <10 seconds

---

### Flow 3: Navigate Long Document

**Goal:** User navigates long document using outline

```
1. User opens document with 20+ headings
2. Document outline shows heading hierarchy
3. User scrolls to middle of document
4. Outline highlights current section
5. User clicks heading in outline "Key Findings"
6. Document scrolls to that section
7. User continues reading
```

**Success Metric:** Navigation completes in <1 second

---

### Flow 4: Restore Previous Version

**Goal:** User restores document to previous version

```
1. User opens version history panel
2. List shows versions with timestamps and authors
3. User sees agent version "Added summary (142 words)"
4. User clicks version to preview
5. Preview shows document at that point
6. User clicks "Restore this version"
7. Confirmation dialog appears
8. User confirms
9. Document restored to that version
10. New version created with restoration note
```

**Success Metric:** Version restored in <3 seconds

---

### Flow 5: Format Text with Toolbar

**Goal:** User formats text using toolbar

```
1. User selects text in paragraph
2. Floating toolbar appears above selection
3. User clicks Bold button
4. Text becomes bold
5. User clicks Heading dropdown
6. User selects "Heading 2"
7. Paragraph converts to heading block
8. Formatting persists after save
```

**Success Metric:** Formatting applies instantly

---

### Flow 6: Insert Table via Slash Command

**Goal:** User inserts table using slash command

```
1. User types "/table" on empty line
2. Slash command menu filters to table options
3. User selects "Table (3x3)"
4. Table block inserted with 3 rows, 3 columns
5. User clicks cell, types content
6. User presses Tab, moves to next cell
7. User fills table cells
8. Table persists after save
```

**Success Metric:** Table inserted and editable in <2 seconds

---

## 5. Design Decisions

### 5.1 Decisions to Make

| ID | Question | Options | Current Lean | Decided? |
|----|----------|---------|--------------|----------|
| DD-1 | Editor library | A: Lexical, B: Slate, C: Tiptap | A: Lexical | ✅ |
| DD-2 | Block nesting | A: Flat blocks, B: Nested blocks | A: Flat blocks (v1) | ✅ |
| DD-3 | Image storage | A: URL only, B: Upload + URL | A: URL only (v1) | ✅ |
| DD-4 | Collaboration | A: Single author, B: Real-time | A: Single author (v1) | ✅ |
| DD-5 | Document catalog | A: Single doc view, B: Catalog view | A: Single doc view (v1) | ✅ |
| DD-6 | Version storage | A: Full copies, B: Diffs | A: Full copies (v1) | ✅ |
| DD-7 | RAG indexing | A: Manual trigger, B: Auto-index | B: Auto-index | ❓ |
| DD-8 | Export formats | A: Markdown only, B: PDF/DOCX | A: Markdown only (v1) | ✅ |

### 5.2 Decision Log

| Date | Decision | Choice | Rationale |
|------|----------|--------|-----------|
| 2025-12 | Editor library | Lexical | MIT license, Meta-backed, block support, 22k+ stars |
| 2025-12 | Block nesting | Flat blocks (v1) | Simpler implementation, can add nesting later |
| 2025-12 | Image storage | URL only (v1) | Simpler, can add uploads later |
| 2025-12 | Collaboration | Single author (v1) | Focus on core editing first |
| 2025-12 | Document catalog | Single doc view (v1) | Focus on editor experience first |
| 2025-12 | Version storage | Full copies (v1) | Simpler, can optimize with diffs later |
| 2025-12 | Export formats | Markdown only (v1) | Markdown is source of truth |

---

## 6. UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Main Editor View | Overall layout | 3-panel layout (outline, editor, chat), toolbar, properties |
| Chat Sidebar States | Agent interaction | Empty, active, agent editing states |
| Document Outline | Navigation | Heading hierarchy, active state, collapsible |
| Formatting Toolbar | Text formatting | All formatting buttons, shortcuts |
| Settings Panel | Access management | Agent list, permissions, activity log |
| Version History | Change tracking | Version list, preview, comparison, restore |
| Empty Document | New doc state | Placeholder, hints, properties |
| Text Selection | Formatting popup | Floating toolbar, formatting options |
| Slash Command Menu | Block insertion | Command palette, categories, search |
| Block Interactions | Block manipulation | Drag handles, block menu, turn into |

### Mockup Location

```
_docs/UXD/Pages/records/2025-12-10-docs-v1/
├── 01-doc-editor-main.html          # Main editor view
├── 02-chat-sidebar/                 # Chat states
├── 03-document-outline.html          # Outline sidebar
├── 04-formatting-toolbar.html        # Toolbar reference
├── 05-settings-panel/                # Settings tabs
├── 06-version-history/               # Version views
├── 07-empty-document.html            # Empty state
├── 08-text-selection.html            # Selection toolbar
├── 09-slash-command-menu.html        # Slash commands
├── 10-block-interactions.html        # Block manipulation
└── Frontend-Backend-Mapping.md       # API contracts
```

### Exit Criteria for UXD Phase

- [x] All required mockups complete
- [x] Each mockup shows all P0 requirements
- [x] Stakeholder review complete
- [x] Preferred direction chosen

**Status:** ✅ Complete (UXD phase done)

---

## 7. Success Criteria

| Criterion | How to Validate | Priority |
|-----------|-----------------|----------|
| Can create and edit documents | Create doc, type content, verify saved | P0 |
| Blocks can be reordered | Drag block, verify new position | P0 |
| Slash commands work | Type `/`, insert block, verify inserted | P0 |
| Agent can read document | Ask agent to summarize, verify response | P0 |
| Agent can edit document | Ask agent to add content, verify inserted | P0 |
| Version history tracks changes | Edit doc, verify version created | P0 |
| Document outline navigates | Click heading, verify scroll | P0 |
| Properties panel edits metadata | Edit title, verify saved | P0 |
| Markdown round-trip works | Edit, save, reload, verify same | P0 |
| Auto-save works | Type, wait, verify saved | P0 |

**North Star:** Users can create rich documents with natural language assistance from agents, and all content is stored as portable Markdown for long-term knowledge management.

---

## 8. Out of Scope

- **Document Catalog/Drive** — Focus on single document view first
- **Real-time Collaboration** — Single author for v1
- **Comments/Suggestions Mode** — Future enhancement
- **Templates** — Future enhancement
- **Export (PDF, DOCX)** — Markdown export only for v1
- **Backlinks/Wiki Links** — Future enhancement (Obsidian feature)
- **Split Pane Markdown/Preview** — Future enhancement
- **Image Uploads** — URL-based images only for v1
- **Nested Blocks** — Flat block structure for v1
- **Document Folders** — Flat structure for v1

---

## 9. Technical Architecture Overview

### Storage Format

Documents stored as **Markdown with YAML frontmatter**:

```markdown
---
title: "My Document"
created: 2025-12-10
updated: 2025-12-10
tags: [research, notes]
agents_with_access: [agent_zen]
---

# Document Content

Markdown content here...
```

### Editor Foundation

**Lexical** (by Meta) - Block-based editor framework
- MIT license (100% free)
- 22.6k+ GitHub stars
- Active development
- Native block support
- Markdown serialization via `@lexical/markdown`

### Agent Tools

9 document tools for agents:
- `sys_doc_read` - Read full document
- `sys_doc_get_section` - Get heading section
- `sys_doc_search` - Search within document
- `sys_doc_insert` - Insert content at position
- `sys_doc_replace` - Replace text range
- `sys_doc_delete` - Delete text range
- `sys_doc_get_selection` - Get user selection
- `sys_doc_get_properties` - Get frontmatter
- `sys_doc_set_property` - Update property

---

## 10. Related Documents

- **UXD Mockups:** `_docs/UXD/Pages/records/2025-12-10-docs-v1/`
- **Frontend-Backend Mapping:** `_docs/UXD/Pages/records/2025-12-10-docs-v1/Frontend-Backend-Mapping.md`
- **Research Log:** `02-Research-Log.md` (to be created)
- **Technical Architecture:** `03-Technical-Architecture.md` (to be created)
- **Implementation Plan:** `04-Implementation-Plan.md` (to be created)
- **Records Feature:** `_docs/_tasks/20-records-feature/` (reference for patterns)
- **Browser Automation:** `_docs/_tasks/21-browser-automation/` (reference for planning)

---

## Notes

- **Block-Based UI**: Despite being block-based, editing should feel continuous like Google Docs
- **Markdown Storage**: All content stored as Markdown for portability and RAG processing
- **Agent Attribution**: All agent edits tracked in version history with agent name/avatar
- **RAG Integration**: Documents indexed via Mastra RAG for agent retrieval
- **File Structure**: Documents stored in `_tables/dox/[docId]/` following Records pattern

---

**Last Updated:** 2025-12-10

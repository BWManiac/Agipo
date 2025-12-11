# Task 22b: Docs Feature — Product Spec

**Status:** Planning
**Date:** December 2025
**Goal:** Build a Markdown-based document editor with Google Docs familiarity, Obsidian's Markdown backend, and Notion's block-based editing

---

## How to Use This Document

This document defines **what to build** for the Docs feature. It covers requirements, acceptance criteria, user flows, and design decisions for a document editing system that complements Records (Sheets).

**Informed by:**
- UXD Mockups: `_docs/UXD/Pages/records/2025-12-10-docs-v1/`
- Records Feature patterns: `_docs/_tasks/20-records-feature/`
- Existing agent/chat patterns in Workforce

**This document informs:**
- Research Log (Lexical package investigation)
- Technical Architecture
- Implementation Plan and all Phase documents

---

## 1. Executive Summary

**The Problem:** Agipo has Records (structured data like spreadsheets), but lacks support for long-form, unstructured content. Users need a place to write documents, notes, and knowledge that agents can read, edit, and reference.

**The Solution:** A document editor that combines:
- **Google Docs** familiarity (toolbar, WYSIWYG editing)
- **Obsidian's** Markdown-first storage (portability, future RAG)
- **Notion's** block-based editing (slash commands, drag-drop blocks)

**Who Benefits:**
- **Users**: Familiar editing experience for documents, notes, research
- **Agents**: Can read, write, and edit documents programmatically
- **Future**: Markdown storage enables RAG/semantic search integration

**End State:** Users can click "Docs" in the nav, see a catalog of their documents, create new documents, and edit them in a rich WYSIWYG editor with agent assistance. Documents are stored as Markdown files, enabling portability and future AI processing.

---

## 2. Product Requirements

### 2.1 Document Catalog

**Definition:** A list view of all documents the user has created

**Why it matters:** Users need to find, organize, and manage their documents. This mirrors the Records catalog pattern.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-1.1 | "Docs" tab appears in TopNav between Records and Tools | P0 |
| PR-1.2 | Catalog page at `/docs` shows grid of document cards | P0 |
| PR-1.3 | Each card shows: title, last modified date, word count preview | P0 |
| PR-1.4 | "New Document" button creates empty document and navigates to editor | P0 |
| PR-1.5 | Click document card navigates to `/docs/[docId]` | P0 |
| PR-1.6 | Delete document via card menu (with confirmation) | P1 |
| PR-1.7 | Search/filter documents by title | P1 |
| PR-1.8 | Sort documents by: last modified, created, title | P1 |

**User Value:** Quick access to all documents, easy creation of new ones.

---

### 2.2 Document Editor - Core

**Definition:** The main editing interface for a single document

**Why it matters:** This is where users spend most of their time. Must feel familiar (Google Docs) while storing as Markdown.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-2.1 | Document editor page at `/docs/[docId]` | P0 |
| PR-2.2 | WYSIWYG editing - what you see is what you get | P0 |
| PR-2.3 | Document title editable inline at top of page | P0 |
| PR-2.4 | Auto-save on content change (debounced) | P0 |
| PR-2.5 | Save indicator shows: "Saving...", "Saved", "Error" | P0 |
| PR-2.6 | Back button returns to catalog | P0 |
| PR-2.7 | Footer shows: word count, character count, last saved time | P1 |
| PR-2.8 | Keyboard shortcuts for common actions (Cmd+B, Cmd+I, etc.) | P1 |

**User Value:** Familiar, responsive editing experience that auto-saves work.

---

### 2.3 Formatting Toolbar

**Definition:** Top toolbar with formatting controls (Google Docs style)

**Why it matters:** Users expect familiar formatting controls. Toolbar provides discoverability.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-3.1 | Bold button (Cmd+B) - toggles `**text**` | P0 |
| PR-3.2 | Italic button (Cmd+I) - toggles `*text*` | P0 |
| PR-3.3 | Strikethrough button - toggles `~~text~~` | P1 |
| PR-3.4 | Inline code button - toggles `` `code` `` | P0 |
| PR-3.5 | Link button - opens link dialog, creates `[text](url)` | P0 |
| PR-3.6 | Heading dropdown (H1-H4) - converts paragraph to heading | P0 |
| PR-3.7 | Bullet list button - creates `- item` | P0 |
| PR-3.8 | Numbered list button - creates `1. item` | P0 |
| PR-3.9 | Checkbox list button - creates `- [ ] item` | P1 |
| PR-3.10 | Blockquote button - creates `> quote` | P1 |
| PR-3.11 | Code block button - creates fenced code block | P0 |
| PR-3.12 | Horizontal rule button - creates `---` | P2 |
| PR-3.13 | Image insert button - opens image URL dialog | P1 |
| PR-3.14 | Toolbar buttons show active state when format is applied | P0 |

**User Value:** Easy access to all formatting without memorizing shortcuts.

---

### 2.4 Block-Based Editing

**Definition:** Each paragraph, heading, list is a discrete "block" that can be manipulated

**Why it matters:** Notion popularized this pattern. Enables powerful reorganization and slash commands.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-4.1 | Typing `/` on empty line or after space opens slash command menu | P0 |
| PR-4.2 | Slash menu shows block types: Heading 1-4, Bullet list, Numbered list, Quote, Code, etc. | P0 |
| PR-4.3 | Typing filters slash menu (e.g., `/code` shows code-related blocks) | P0 |
| PR-4.4 | Arrow keys navigate menu, Enter selects, Escape closes | P0 |
| PR-4.5 | Block handles appear on hover (left side of each block) | P0 |
| PR-4.6 | Drag handle (⋮⋮) enables drag-and-drop reordering | P1 |
| PR-4.7 | Plus handle (+) inserts new block below | P1 |
| PR-4.8 | Click block handle opens block menu (Delete, Duplicate, Turn into) | P1 |
| PR-4.9 | "Turn into" submenu converts block to different type | P1 |
| PR-4.10 | Multi-select blocks with Shift+Click | P2 |

**User Value:** Flexible editing that feels modern and powerful.

---

### 2.5 Document Outline

**Definition:** Left sidebar showing document structure (heading hierarchy)

**Why it matters:** Long documents need navigation. Obsidian users expect this.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-5.1 | Left sidebar shows "Outline" panel | P0 |
| PR-5.2 | Outline lists all headings (H1-H4) in hierarchy | P0 |
| PR-5.3 | Click heading scrolls editor to that section | P0 |
| PR-5.4 | Current section highlighted in outline | P1 |
| PR-5.5 | Collapse/expand nested headings | P2 |
| PR-5.6 | Sidebar can be collapsed/hidden | P1 |

**User Value:** Easy navigation in long documents.

---

### 2.6 Document Properties (Frontmatter)

**Definition:** Metadata displayed at top of document (title, tags, dates, etc.)

**Why it matters:** Frontmatter is standard in Markdown. Enables organization and future search.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-6.1 | Properties panel shows above document content (collapsible) | P0 |
| PR-6.2 | Display: title, created date, updated date | P0 |
| PR-6.3 | Display: tags as editable chips | P1 |
| PR-6.4 | Display: custom properties (key-value pairs) | P2 |
| PR-6.5 | Properties stored as YAML frontmatter in Markdown | P0 |
| PR-6.6 | Add/remove tags inline | P1 |

**User Value:** Organized documents with searchable metadata.

---

### 2.7 Chat Sidebar (Agent Integration)

**Definition:** Right sidebar for agent chat with document context

**Why it matters:** Agents should be able to help write, edit, and understand documents.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-7.1 | Right sidebar shows chat panel (similar to Records) | P0 |
| PR-7.2 | Agent picker dropdown to select which agent | P0 |
| PR-7.3 | Chat messages display user and agent messages | P0 |
| PR-7.4 | Agent can read document content | P0 |
| PR-7.5 | Agent can insert text at cursor position | P0 |
| PR-7.6 | Agent can replace selected text | P0 |
| PR-7.7 | When agent edits, document shows live changes | P0 |
| PR-7.8 | "Agent is editing..." indicator during edits | P1 |
| PR-7.9 | Chat sidebar can be collapsed/hidden | P1 |
| PR-7.10 | Thread persistence (continue conversation later) | P1 |

**User Value:** AI assistance integrated directly into document workflow.

---

### 2.8 Agent Access Control

**Definition:** Control which agents can access this document

**Why it matters:** Users may want to restrict which agents see sensitive documents.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-8.1 | Settings panel accessible via gear icon | P0 |
| PR-8.2 | "Access" tab shows which agents have access | P0 |
| PR-8.3 | Add/remove agent access | P0 |
| PR-8.4 | Permission levels: Read-only, Read/Write | P1 |
| PR-8.5 | Default: all agents have read access, none have write | P1 |

**User Value:** Control over AI access to sensitive content.

---

### 2.9 Version History

**Definition:** View and restore previous versions of the document

**Why it matters:** Users need to recover from mistakes or see how document evolved.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-9.1 | "History" button opens version history panel | P0 |
| PR-9.2 | List of versions with timestamp and author (user or agent name) | P0 |
| PR-9.3 | Agent-made versions clearly marked with agent name/icon | P0 |
| PR-9.4 | Click version to preview content | P0 |
| PR-9.5 | "Restore this version" replaces current content | P0 |
| PR-9.6 | Versions created on: manual save, agent edit, significant change | P1 |
| PR-9.7 | Version limit (e.g., last 50 versions) to manage storage | P2 |

**User Value:** Safety net for recovering from mistakes.

---

### 2.10 Text Selection

**Definition:** Selection state with floating formatting popup

**Why it matters:** Quick formatting without moving to toolbar.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-10.1 | Selecting text shows floating toolbar above selection | P0 |
| PR-10.2 | Floating toolbar has: Bold, Italic, Link, Code | P0 |
| PR-10.3 | "Ask Agent" button in floating toolbar | P1 |
| PR-10.4 | "Ask Agent" sends selected text to chat with prompt | P1 |

**User Value:** Fast formatting and AI assistance for selected text.

---

### 2.11 Block Types

**Definition:** All the different block types the editor supports

**Why it matters:** Comprehensive block support enables rich documents.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-11.1 | Paragraph (default) | P0 |
| PR-11.2 | Heading 1, 2, 3, 4 | P0 |
| PR-11.3 | Bullet list | P0 |
| PR-11.4 | Numbered list | P0 |
| PR-11.5 | Checkbox list (task list) | P1 |
| PR-11.6 | Blockquote | P0 |
| PR-11.7 | Code block (with language selector) | P0 |
| PR-11.8 | Horizontal rule | P2 |
| PR-11.9 | Image (URL-based) | P1 |
| PR-11.10 | Table (basic Markdown table) | P2 |
| PR-11.11 | Callout blocks: Note, Tip, Warning, Caution (GFM alerts) | P1 |
| PR-11.12 | Toggle/collapsible block | P2 |

**User Value:** Express any content structure naturally.

---

## 3. Acceptance Criteria

### Document Catalog (8 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1 | "Docs" tab visible in TopNav | Visual inspection |
| AC-2 | Click "Docs" navigates to `/docs` | Click and verify URL |
| AC-3 | Catalog shows document cards in grid | Visual inspection |
| AC-4 | "New Document" creates doc and navigates to editor | Click button, verify new page |
| AC-5 | Click card navigates to `/docs/[docId]` | Click card, verify URL |
| AC-6 | Delete removes document from catalog | Delete via menu, verify removal |
| AC-7 | Documents persist across page reloads | Create doc, reload, verify exists |
| AC-8 | Empty state shown when no documents | Delete all docs, verify message |

### Document Editor (10 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-9 | Document loads content from storage | Open existing doc, verify content |
| AC-10 | Typing in editor updates content | Type text, verify visible |
| AC-11 | Auto-save triggers within 2 seconds of change | Type, wait, reload, verify saved |
| AC-12 | Save indicator shows correct state | Watch indicator during save |
| AC-13 | Title editable inline | Click title, type, verify change |
| AC-14 | Back button returns to catalog | Click back, verify at `/docs` |
| AC-15 | Word count updates as you type | Type, verify count changes |
| AC-16 | Cmd+B toggles bold | Select text, Cmd+B, verify bold |
| AC-17 | Document stored as Markdown | Check file system, verify .md |
| AC-18 | Frontmatter preserved on save | Add tag, save, reload, verify tag |

### Block Editing (8 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-19 | `/` opens slash command menu | Type `/` on empty line |
| AC-20 | Typing filters slash menu | Type `/head`, verify filter |
| AC-21 | Enter selects menu item | Navigate to item, press Enter |
| AC-22 | Selected block type created | Select "Heading 1", verify H1 |
| AC-23 | Block handles appear on hover | Hover left edge of block |
| AC-24 | Drag handle enables reorder | Drag block, verify new position |
| AC-25 | Block menu opens on handle click | Click ⋮⋮, verify menu |
| AC-26 | "Turn into" converts block type | Turn paragraph into heading |

### Agent Integration (8 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-27 | Chat sidebar visible | Visual inspection |
| AC-28 | Agent picker shows available agents | Click dropdown |
| AC-29 | Send message appears in chat | Type message, send, verify |
| AC-30 | Agent response streams in | Wait for response |
| AC-31 | Agent can read document | Ask "summarize this doc" |
| AC-32 | Agent can insert text | Ask "add a paragraph about X" |
| AC-33 | Document updates when agent edits | Watch editor during agent edit |
| AC-34 | Agent edits show in version history | Check history after agent edit |

### Version History (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-35 | History panel shows versions | Click History button |
| AC-36 | Agent versions show agent name | Make agent edit, check history |
| AC-37 | Click version shows preview | Click version in list |
| AC-38 | Restore replaces current content | Click Restore, verify content |
| AC-39 | Restored content saved properly | Restore, reload, verify persisted |

---

## 4. User Flows

### Flow 1: Create and Edit New Document

**Goal:** User creates their first document and writes content

```
1. User clicks "Docs" in TopNav
2. Catalog page loads showing empty state: "No documents yet"
3. User clicks "New Document" button
4. System creates new document, navigates to `/docs/[newId]`
5. Editor loads with empty content, title "Untitled"
6. User clicks title, types "Meeting Notes"
7. Title updates, auto-saves
8. User types in editor: "# Action Items"
9. Content appears as H1 heading
10. User continues typing, adding bullet points
11. Save indicator shows "Saving..." then "Saved"
12. User clicks back arrow
13. Catalog shows "Meeting Notes" card
14. User thinks: "This works just like Google Docs but feels modern"
```

**Success Metric:** User creates document in <10 seconds

---

### Flow 2: Slash Command Block Creation

**Goal:** User uses slash commands to add different block types

```
1. User is editing a document
2. User presses Enter to create new line
3. User types "/"
4. Slash command menu appears with block options
5. User sees: Heading 1, Heading 2, Bullet List, Code Block, etc.
6. User types "code"
7. Menu filters to show "Code Block"
8. User presses Enter
9. Code block inserted with language picker
10. User selects "typescript" from language dropdown
11. User types code inside block
12. Syntax highlighting appears
13. User thinks: "Wow, this is like Notion but stores as Markdown"
```

**Success Metric:** User discovers slash commands without help

---

### Flow 3: Agent Assistance

**Goal:** User gets AI help writing content

```
1. User is editing document about "Q4 Goals"
2. User clicks chat sidebar (or it's already open)
3. User selects "Writing Assistant" agent from dropdown
4. User types: "Help me write an introduction for this document"
5. Message appears in chat
6. Agent responds: "I'll write an introduction based on your Q4 goals"
7. Agent calls sys_doc_insert tool
8. Document shows "Agent is editing..." indicator
9. Introduction paragraph appears in document with highlight
10. Highlight fades after 2 seconds
11. User reviews text, makes small edit
12. User types: "Make it more concise"
13. Agent calls sys_doc_replace tool
14. Introduction updates in place
15. Version history shows: "Edited by Writing Assistant"
16. User thinks: "The AI actually edited my doc, not just chat"
```

**Success Metric:** Agent edit appears in document within 3 seconds

---

### Flow 4: Block Reorganization

**Goal:** User reorders content using drag and drop

```
1. User has document with multiple sections
2. User wants to move "Conclusion" section above "Analysis"
3. User hovers over "Conclusion" heading
4. Block handle (⋮⋮) appears on left
5. User clicks and drags the handle
6. Visual indicator shows drop position
7. User drops above "Analysis"
8. Blocks reorder instantly
9. Document auto-saves
10. User thinks: "Reorganizing is so much easier than cut/paste"
```

**Success Metric:** Drag-drop reorder in <2 seconds

---

### Flow 5: Version Recovery

**Goal:** User recovers from a mistake using version history

```
1. User accidentally deletes important section
2. User clicks "History" button in toolbar
3. Version history panel opens on right
4. User sees list of versions:
   - "You - 2 minutes ago"
   - "Writing Assistant - 10 minutes ago"
   - "You - 1 hour ago"
5. User clicks "You - 1 hour ago"
6. Preview shows document state at that time
7. User sees their deleted section exists in preview
8. User clicks "Restore this version"
9. Confirmation: "Restore? Current changes will be saved as new version"
10. User confirms
11. Document content reverts to 1 hour ago version
12. New version created: "You - Restored from 1 hour ago"
13. User thinks: "Thank goodness for version history"
```

**Success Metric:** User recovers deleted content in <30 seconds

---

### Flow 6: Document Outline Navigation

**Goal:** User navigates long document using outline

```
1. User opens long document with 10+ sections
2. Left sidebar shows document outline
3. Outline displays heading hierarchy:
   - Introduction
   - Background
     - History
     - Current State
   - Analysis
   - Recommendations
   - Conclusion
4. User wants to jump to "Recommendations"
5. User clicks "Recommendations" in outline
6. Editor scrolls to that section
7. "Recommendations" highlighted in outline
8. User edits content
9. As user adds new H2 "Timeline", outline updates
10. User thinks: "Easy to navigate even long documents"
```

**Success Metric:** Click-to-scroll in <500ms

---

### Flow 7: Error Recovery - Save Failure

**Goal:** User doesn't lose work when save fails

```
1. User is editing document
2. Network connection drops
3. User continues typing (unaware)
4. Auto-save attempts, fails
5. Save indicator shows "Error saving" with red icon
6. User notices error
7. User clicks error indicator
8. Tooltip: "Unable to save. Your changes are preserved locally. Will retry when online."
9. Network reconnects
10. System automatically retries save
11. Save indicator shows "Saved"
12. User thinks: "Good, I didn't lose my work"
```

**Success Metric:** No data loss on network failure

---

## 5. Design Decisions

### 5.1 Decisions Made

| ID | Decision | Choice | Rationale |
|----|----------|--------|-----------|
| DD-1 | Editor library | Lexical (Meta) | MIT license, 22.6k stars, native block support, excellent Markdown |
| DD-2 | Storage format | Markdown with YAML frontmatter | Portable, Git-friendly, future RAG support |
| DD-3 | Storage location | `_tables/documents/[docId]/` | Follows Records pattern |
| DD-4 | Version history approach | Snapshot-based (not Git-like diffs) | Simpler for v1, can evolve later |
| DD-5 | Block handles | Custom CSS + Lexical decorators | Matches Notion UX |
| DD-6 | Slash commands | LexicalTypeaheadMenuPlugin | Built-in, well-documented |
| DD-7 | Chat pattern | Reuse Records ChatSidebar | Consistency, less code |
| DD-8 | State management | Zustand store slices | Follows Records pattern |
| DD-9 | Agent tools | sys_doc_* prefix | Follows sys_table_* pattern |
| DD-10 | Nav placement | Between Records and Tools | Logical grouping of data features |

### 5.2 Design Decision Log

| Date | Decision | Choice | Rationale |
|------|----------|--------|-----------|
| 2025-12 | Editor library | Lexical | User wanted "more open source and free" than Tiptap |
| 2025-12 | Block-based UI | Yes, with Markdown backend | User requested Notion-style blocks that compose to Markdown |
| 2025-12 | Version history | Snapshots | User deferred to simpler approach for v1 |
| 2025-12 | RAG integration | Deferred | User explicitly deferred to later task |

### 5.3 Future Decisions (Noted for Later)

| ID | Question | Current Default | Revisit When |
|----|----------|-----------------|--------------|
| FD-1 | Git-like diff versioning | No (snapshots) | After v1 if users request |
| FD-2 | Real-time collaboration | No | After core feature stable |
| FD-3 | RAG/semantic search | Deferred | Separate task |
| FD-4 | Document templates | No | After core feature stable |
| FD-5 | Export to PDF/DOCX | No | User request |

---

## 6. UXD Requirements

### Existing Mockups (Complete)

All mockups exist in `_docs/UXD/Pages/records/2025-12-10-docs-v1/`:

| Mockup | File | Status |
|--------|------|--------|
| Main Editor | `01-doc-editor-main.html` | Done |
| Chat Sidebar - Empty | `02-chat-sidebar/02-chat-empty.html` | Done |
| Chat Sidebar - Active | `02-chat-sidebar/02-chat-active.html` | Done |
| Chat Sidebar - Agent Editing | `02-chat-sidebar/02-chat-agent-editing.html` | Done |
| Document Outline | `03-document-outline.html` | Done |
| Formatting Toolbar | `04-formatting-toolbar.html` | Done |
| Settings - Access | `05-settings-panel/05-settings-access.html` | Done |
| Settings - Activity | `05-settings-panel/05-settings-activity.html` | Done |
| Version History - List | `06-version-history/06-version-history-list.html` | Done |
| Version History - Preview | `06-version-history/06-version-history-preview.html` | Done |
| Empty Document | `07-empty-document.html` | Done |
| Text Selection | `08-text-selection.html` | Done |
| Slash Command Menu | `09-slash-command-menu.html` | Done |
| Block Interactions | `10-block-interactions.html` | Done |
| Block Types | `11-block-types.html` | Done |

### Additional Mockups Needed

| Mockup | Purpose | Priority |
|--------|---------|----------|
| Document Catalog | Grid of document cards | P0 |
| Catalog Empty State | No documents yet | P1 |
| New Document Dialog | Create document flow (if modal) | P2 |

**Note:** Catalog can follow Records catalog pattern closely.

---

## 7. Success Criteria

| Criterion | How to Validate | Priority |
|-----------|-----------------|----------|
| User can create, edit, and save documents | End-to-end test | P0 |
| Documents stored as valid Markdown | File inspection | P0 |
| Slash commands work for block creation | User testing | P0 |
| Agent can read and edit documents | Agent test flow | P0 |
| Block drag-drop reordering works | User testing | P1 |
| Version history shows user + agent edits | History inspection | P0 |
| Restore version works correctly | Restore test | P0 |
| Auto-save prevents data loss | Network failure test | P0 |
| Formatting toolbar applies correct Markdown | Output inspection | P0 |
| Document outline navigates correctly | Click-scroll test | P1 |

**North Star:** Users can write documents with AI assistance, and documents are stored as portable Markdown files that agents can read and edit.

---

## 8. Out of Scope

| Feature | Reason | Future Task? |
|---------|--------|--------------|
| RAG/semantic search | Explicitly deferred | Yes - separate task |
| Real-time collaboration | Complexity, single user first | Maybe |
| Comments/suggestions mode | Future enhancement | Maybe |
| Document templates | Future enhancement | Maybe |
| Export (PDF, DOCX) | Future enhancement | Maybe |
| Backlinks/wiki links | Future enhancement (Obsidian feature) | Maybe |
| Split pane Markdown/Preview | Future enhancement | Maybe |
| Image upload (file-based) | URL-only for v1 | Maybe |
| Nested/sub-documents | Complexity | Maybe |
| Folders/organization | Flat list for v1 | Yes |

---

## 9. Technical Constraints

### Storage Format

Documents stored as Markdown with YAML frontmatter:

```markdown
---
id: "doc_abc123"
title: "Meeting Notes"
created: "2025-12-10T14:30:00Z"
updated: "2025-12-10T15:45:00Z"
author: "user_123"
tags: ["meetings", "q4"]
agents_with_access:
  - agent_id: "agent_zen"
    permission: "read_write"
---

# Meeting Notes

Content goes here...
```

### File Structure

```
_tables/documents/
├── [docId]/
│   ├── content.md           # Main document
│   └── _versions/
│       ├── v_1733842200.md  # Timestamp-based snapshots
│       └── v_1733845800.md
```

### Agent Tools

| Tool | Description |
|------|-------------|
| `sys_doc_read` | Read full document content |
| `sys_doc_get_section` | Get content of specific heading section |
| `sys_doc_search` | Search within document |
| `sys_doc_insert` | Insert text at position |
| `sys_doc_replace` | Replace text at position/selection |
| `sys_doc_get_properties` | Get frontmatter |
| `sys_doc_set_property` | Update frontmatter property |

---

## 10. Related Documents

- **UXD Mockups**: `_docs/UXD/Pages/records/2025-12-10-docs-v1/`
- **Research Log**: `01-Research-Log.md`
- **Technical Architecture**: `03-Technical-Architecture.md`
- **Implementation Plan**: `04-Implementation-Plan.md`
- **Records Feature (Pattern Source)**: `_docs/_tasks/20-records-feature/`
- **Lexical Documentation**: https://lexical.dev/
- **Lexical Playground**: https://playground.lexical.dev/

---

## Notes

### Design Philosophy Recap

**Three-way hybrid:**
1. **Google Docs**: Familiar toolbar, WYSIWYG editing, clean UI
2. **Obsidian**: Markdown storage, outline navigation, properties/frontmatter
3. **Notion**: Block-based editing, slash commands, drag-and-drop

**The magic**: Users get a modern block-based editor, but storage is pure Markdown - portable, Git-friendly, and ready for future RAG/AI processing.

### Key Differentiators from Records

| Aspect | Records | Docs |
|--------|---------|------|
| Data model | Rows + Columns | Blocks + Content |
| Storage | JSON | Markdown |
| Primary UI | Data grid | Text editor |
| Agent tools | sys_table_* | sys_doc_* |
| Core library | TanStack Table | Lexical |

### Open Questions for Research Log

1. Does Lexical's Markdown export preserve all formatting correctly?
2. How do we implement custom block handles with Lexical?
3. Can LexicalTypeaheadMenuPlugin support our full slash command UX?
4. How do we inject agent edits into the editor programmatically?
5. What's the best approach for GFM alert blocks (Note, Warning, etc.)?

---

**Last Updated:** December 2025

# Docs Feature - UXD Planning

**Created:** December 10, 2025
**Status:** Complete
**Goal:** High-fidelity HTML mockups for a Markdown-based document editor within Agipo

---

## Overview

The Docs feature is a **Markdown-based document editor** that combines the familiarity of Google Docs with the power of Obsidian's Markdown-first approach. It sits alongside Records (Google Sheets equivalent) as a knowledge management primitive within Agipo.

### Design Philosophy: Obsidian + Google Docs + Notion Hybrid

We're building a hybrid that takes the best of three worlds:

| From **Google Docs** | From **Obsidian** | From **Notion** |
|---------------------|-------------------|-----------------|
| Familiar top toolbar | Markdown as source format | Block-based editing |
| Clean, accessible UI | Outline/navigation panel | Slash commands (`/`) |
| WYSIWYG experience | Properties/frontmatter | Drag-and-drop blocks |
| Version history UI | Folder organization | Turn into (convert blocks) |

**Key Principles:**
1. **Markdown Backend**: Documents stored as Markdown for portability and RAG processing
2. **Block-Based UI**: Each paragraph, heading, list is a discrete block that can be reordered
3. **Slash Commands**: Type `/` to insert any block type (Notion-style)
4. **Continuous Writing Feel**: Despite being block-based, writing flows naturally like Google Docs

### Core Value Proposition

1. **Familiar UX**: Google Docs-style editing that everyone knows
2. **Markdown Native**: Content stored as Markdown for portability and RAG processing
3. **Agent Knowledge**: Documents become agent-accessible knowledge via Mastra RAG
4. **Agentic Editing**: Agents can directly read and write to documents
5. **Version History**: Track changes including agent-attributed edits

---

## Scope

### In Scope (v1)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Document Editor** | WYSIWYG Markdown editor with live preview | Core |
| **Top Toolbar** | Basic formatting: bold, italic, headings, lists, links, code | Core |
| **Document Outline** | Left sidebar showing heading structure (Obsidian-style) | Core |
| **Properties Panel** | Frontmatter/metadata display (title, tags, dates, source) | Core |
| **Chat Sidebar** | Agent assistance panel with agentic editing | Core |
| **Agent Direct Editing** | Agent can insert, replace, and modify document content | Core |
| **Settings/Access Panel** | Which agents have access to this document | Core |
| **Version History** | View past versions with agent attribution | Core |
| **Empty Document State** | New document creation experience | Core |
| **Text Selection** | Selection state with formatting popup | Nice to have |

### Out of Scope (v1)

| Feature | Reason |
|---------|--------|
| Document Catalog/Drive | Focus on single document view first |
| Real-time Collaboration | Single author for v1 |
| Comments/Suggestions mode | Future enhancement |
| Templates | Future enhancement |
| Export (PDF, DOCX) | Future enhancement |
| Backlinks/Wiki links | Future enhancement (Obsidian feature) |
| Split pane Markdown/Preview | Future enhancement |

---

## Design Reference: Obsidian Properties

Based on the screenshot reference, documents should support **Properties** (frontmatter metadata):

```yaml
---
title: "Why Is Mutah Okay?"
source: "https://www.reddit.com/r/shia/..."
author: Jawad_8
published: 2024-10-08
created: 2025-12-09
description: ""
tags: []
cover: "https://preview.redd.it/..."
media_type: Reddit
---
```

The UI shows these as editable fields at the top of the document, similar to Notion or Obsidian.

---

## Features to Demonstrate in UXD

### 1. Main Document Editor View (`01-doc-editor-main.html`)

The primary editing interface combining all elements:

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  Header: [← Back] Document Title                    [⚙ Settings]    │
├─────────────────────────────────────────────────────────────────────┤
│  Toolbar: [B] [I] [U] [H1▾] [Link] [Code] [List] [Quote] [Image]    │
├────────────┬─────────────────────────────────────┬──────────────────┤
│            │                                     │                  │
│  Document  │         Editor Canvas               │   Chat           │
│  Outline   │                                     │   Sidebar        │
│            │  Properties (collapsible)           │                  │
│  • Heading │  ┌─────────────────────────────┐   │  Agent: Zen      │
│    • Sub   │  │ title: Document Title       │   │                  │
│    • Sub   │  │ tags: [research, notes]     │   │  [conversation]  │
│            │  │ created: Dec 10, 2025       │   │                  │
│            │  └─────────────────────────────┘   │                  │
│            │                                     │                  │
│            │  # Heading 1                        │                  │
│            │  Content here...                    │                  │
│            │                                     │                  │
│            │  ## Heading 2                       │                  │
│            │  More content...                    │                  │
│            │                                     │                  │
├────────────┴─────────────────────────────────────┴──────────────────┤
│  Footer: Word count: 2,821 │ 19,147 characters │ Last saved: now   │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- **Header**: Back navigation, document title (editable inline), settings button
- **Toolbar**: Formatting controls (simplified Google Docs style)
- **Document Outline** (left): Collapsible heading navigation
- **Editor Canvas** (center): WYSIWYG Markdown editing area
- **Properties Section**: Collapsible frontmatter display/editor
- **Chat Sidebar** (right): Agent chat panel (collapsible)
- **Footer**: Word count, character count, save status

### 2. Chat Sidebar States

Following the Records pattern, with **agentic editing** capabilities:

#### `02-chat-sidebar/02-chat-empty.html`
- No conversation yet
- "Start a new conversation" prompt
- Suggested prompts: "Summarize this document", "Help me write..."

#### `02-chat-sidebar/02-chat-active.html`
- Active conversation with messages
- User and agent messages
- Agent can show what it's reading/editing

#### `02-chat-sidebar/02-chat-agent-editing.html`
- Agent is actively editing the document
- Shows "Editing document..." indicator
- Displays what changes are being made
- Document shows live changes with highlights

### 3. Document Outline (`03-document-outline.html`)

Left sidebar showing document structure:

- Heading hierarchy (H1, H2, H3, H4)
- Click to jump to section
- Current section highlighted
- Collapse/expand nested headings
- Word count per section (optional)

### 4. Formatting Toolbar (`04-formatting-toolbar.html`)

Simplified toolbar optimized for Markdown:

**Row 1 - Text Formatting:**
| Button | Action | Markdown |
|--------|--------|----------|
| **B** | Bold | `**text**` |
| *I* | Italic | `*text*` |
| ~~S~~ | Strikethrough | `~~text~~` |
| `</>` | Inline code | `` `code` `` |
| 🔗 | Link | `[text](url)` |

**Row 2 - Block Formatting:**
| Button | Action | Markdown |
|--------|--------|----------|
| H▾ | Heading dropdown (1-4) | `#`, `##`, `###`, `####` |
| • | Bullet list | `- item` |
| 1. | Numbered list | `1. item` |
| ☐ | Checkbox list | `- [ ] item` |
| > | Blockquote | `> quote` |
| ``` | Code block | ``` |
| — | Horizontal rule | `---` |
| 🖼 | Insert image | `![alt](url)` |

### 5. Settings Panel

#### `05-settings-panel/05-settings-access.html`
Agent access management:
- List of agents with access
- Permission levels: Read-only, Read/Write
- Add/remove agent access
- Shows agent avatars and names

#### `05-settings-panel/05-settings-activity.html`
Activity log showing:
- Who edited and when
- Agent edits clearly marked with agent name/avatar
- Edit summaries (e.g., "Added 3 paragraphs", "Formatted heading")

### 6. Version History

#### `06-version-history/06-version-history-list.html`
List of document versions:
- Timestamp for each version
- Author attribution (User or Agent name)
- Agent versions have distinct styling (e.g., robot icon)
- Preview snippet of changes
- "Restore this version" button

#### `06-version-history/06-version-history-preview.html`
Previewing a specific version:
- Full document content at that version
- Side-by-side or diff view (optional)
- Clear "Current" vs "Viewing: Dec 9 version" indicator
- Restore/Cancel buttons

### 7. Empty Document (`07-empty-document.html`)

New document state:
- Blank canvas with cursor ready
- Properties section with default values
- Title input focused ("Untitled" placeholder)
- Hint text: "Start typing or use /commands"
- Optional: Quick action buttons (e.g., "Import from URL")

### 8. Text Selection (`08-text-selection.html`)

Selection interaction state:
- Text highlighted/selected
- Floating toolbar appears above selection
- Quick formatting options (Bold, Italic, Link, etc.)
- "Ask Agent about this" option

### 9. Slash Command Menu (`09-slash-command-menu.html`)

Notion-style command palette:
- Triggered by typing `/` on empty line or after space
- Categorized block types (Basic, Advanced, Media, Agent)
- Fuzzy search filtering (e.g., `/code` filters to code blocks)
- Keyboard navigation (↑↓ to navigate, Enter to select, Esc to close)
- Agent integration: `/ai` or `/ask` to generate content

### 10. Block Interactions (`10-block-interactions.html`)

Block-level manipulation:
- **Block handles**: Appear on hover (+ to add, ⋮⋮ to drag)
- **Block menu**: Click handle to open (Duplicate, Turn into, Move, Delete)
- **Turn into submenu**: Convert block to different type
- **Drag and drop**: Reorder blocks by dragging
- **Multi-select**: Shift+click or drag to select multiple blocks

### 11. Block Types Reference (`11-block-types.html`)

Comprehensive block type catalog:
- All block types with rendered appearance
- Markdown equivalent for each block
- Slash command and keyboard shortcuts
- Callout variants (Note, Tip, Warning, Caution)
- Toggle (collapsible) blocks
- Tables with Markdown syntax

---

## UXD File Manifest

| # | File/Folder | Description | Status |
|---|-------------|-------------|--------|
| 01 | `01-doc-editor-main.html` | Main document editor with all panels | Done |
| 02 | `02-chat-sidebar/` | Agent chat sidebar states | Done |
|    | `02-chat-empty.html` | No conversation yet | |
|    | `02-chat-active.html` | Active conversation | |
|    | `02-chat-agent-editing.html` | Agent actively editing document | |
| 03 | `03-document-outline.html` | Left sidebar with heading navigation | Done |
| 04 | `04-formatting-toolbar.html` | Detailed toolbar reference | Done |
| 05 | `05-settings-panel/` | Access and activity settings | Done |
|    | `05-settings-access.html` | Agent access management | |
|    | `05-settings-activity.html` | Activity log | |
| 06 | `06-version-history/` | Version history panel | Done |
|    | `06-version-history-list.html` | List of versions | |
|    | `06-version-history-preview.html` | Previewing a specific version | |
| 07 | `07-empty-document.html` | New/empty document state | Done |
| 08 | `08-text-selection.html` | Text selected with formatting popup | Done |
| 09 | `09-slash-command-menu.html` | Slash command palette and states | Done |
| 10 | `10-block-interactions.html` | Block handles, drag-drop, menus | Done |
| 11 | `11-block-types.html` | All block types with Markdown mapping | Done |
| -- | `Frontend-Backend-Mapping.md` | API endpoint documentation | Done |

**Total: 15 HTML files across 11 logical sections + 1 mapping document**

---

## Agent Integration: Agentic Editing

### Chat Sidebar Capabilities

Agents can perform both **passive** (read) and **active** (write) operations:

#### Passive Capabilities
| Capability | Description |
|------------|-------------|
| **Read Document** | Agent sees full document content |
| **Search Document** | Agent can search for specific text/sections |
| **Summarize** | "Summarize this document" |
| **Explain** | "Explain this section in simpler terms" |
| **Find Related** | "Find information about X in my docs" (RAG) |

#### Active Capabilities (Agentic Editing)
| Capability | Description |
|------------|-------------|
| **Insert Text** | Add content at cursor position or specific location |
| **Replace Selection** | Replace currently selected text |
| **Continue Writing** | "Help me write the next paragraph" |
| **Rewrite Section** | "Make this more concise" |
| **Format Content** | Apply formatting (headings, lists, etc.) |
| **Add Properties** | Update frontmatter/metadata |

### Agent Tools for Docs

| Tool | Description |
|------|-------------|
| `sys_doc_read` | Read the full document content |
| `sys_doc_get_section` | Get content of a specific heading section |
| `sys_doc_search` | Search within the document |
| `sys_doc_insert` | Insert text at a position |
| `sys_doc_replace` | Replace text at a position or selection |
| `sys_doc_get_selection` | Get currently selected text (if any) |
| `sys_doc_get_properties` | Get document frontmatter/metadata |
| `sys_doc_set_property` | Update a frontmatter property |

### Version History with Agent Attribution

When an agent makes edits, the version history shows:

```
┌─────────────────────────────────────────────────────────────────┐
│ Version History                                          [×]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🤖 Zen Chang (Agent) • Dec 10, 2025 at 3:45 PM                │
│  ├─ Added summary section (142 words)                          │
│  ├─ Reformatted bullet points                                  │
│  └─ [Restore this version]                                     │
│                                                                 │
│  👤 You • Dec 10, 2025 at 2:30 PM                              │
│  ├─ Initial draft                                              │
│  └─ [Restore this version]                                     │
│                                                                 │
│  📄 Document created • Dec 10, 2025 at 2:00 PM                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes (for future implementation)

### Document Storage Format

Documents are stored as **Markdown with YAML frontmatter**:

```markdown
---
title: "My Research Notes"
created: 2025-12-10
updated: 2025-12-10
author: user_123
tags: [research, ai, notes]
agents_with_access: [agent_zen, agent_mira]
---

# Main Heading

Content goes here...

## Subheading

More content...
```

### Editor Library Recommendation

**Recommended: Lexical** (by Meta/Facebook)

| Feature | Lexical Support |
|---------|----------------|
| Markdown input/output | ✅ `@lexical/markdown` |
| WYSIWYG editing | ✅ Core feature |
| Block-based editing | ✅ Build with plugins |
| Slash commands | ✅ `LexicalTypeaheadMenuPlugin` |
| Collaborative editing | ✅ Yjs integration |
| Custom nodes | ✅ Highly extensible |
| React integration | ✅ `@lexical/react` |
| License | MIT (100% free) |
| GitHub Stars | 22.6k+ |

**Why Lexical over alternatives:**
- **100% free** - MIT license, no paid tiers
- **Backed by Meta** - Active development, long-term support
- **Modern architecture** - Built for extensibility and performance
- **Block primitives** - Native support for block-based editing

**Key packages:**
```bash
npm install lexical @lexical/react @lexical/markdown @lexical/rich-text @lexical/list @lexical/link @lexical/code
```

### RAG Integration

1. **Document → Chunks**: Split by headings and paragraphs
2. **Chunks → Embeddings**: Via Mastra RAG pipeline
3. **Agent Query → Search**: Semantic search returns relevant chunks
4. **Chunks → Context**: Injected into agent prompts

---

## Sample Document Content (for mockups)

Use this sample content in the mockups to show realistic editing:

```markdown
---
title: "Product Research: Competitor Analysis"
source: "Internal research"
author: Research Team
created: 2025-12-10
tags: [research, competitors, product]
---

# Competitor Analysis

## Overview

This document summarizes our research on key competitors in the workflow automation space.

## Key Findings

### Market Position

- **Competitor A**: Strong enterprise focus, complex pricing
- **Competitor B**: Developer-centric, open source core
- **Competitor C**: SMB focus, simple onboarding

### Feature Comparison

| Feature | Us | Competitor A | Competitor B |
|---------|-----|--------------|--------------|
| AI Agents | ✅ | ❌ | Partial |
| Visual Editor | ✅ | ✅ | ❌ |
| API Integrations | 50+ | 100+ | 30+ |

## Recommendations

Based on our analysis, we should focus on:

1. **Differentiation through AI**: Our agent system is unique
2. **Ease of use**: Simpler than Competitor A
3. **Enterprise features**: More robust than Competitor C
```

---

## Open Questions

1. ~~**Slash Commands**: Should we support Notion/Obsidian-style `/` commands for quick insertion?~~ **YES - implemented in UXD**
2. **Keyboard Shortcuts**: What shortcuts should we support? (Cmd+B for bold, etc.) - See `11-block-types.html` for reference
3. **Image Handling**: Where are images stored? URL references only, or uploads?
4. **Maximum Document Size**: Any limits for performance/RAG?
5. **Offline Support**: Cache documents locally?
6. **Block nesting**: Should blocks be nestable (like Notion) or flat?

---

## Related Documentation

- **Records UXD**: `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`
- **Records Implementation**: `_docs/_tasks/20-records-feature/`
- **Mastra RAG Docs**: https://mastra.ai/docs/rag/retrieval
- **Obsidian Reference**: https://obsidian.md
- **Google Docs Reference**: https://docs.google.com
- **Tiptap Documentation**: https://tiptap.dev


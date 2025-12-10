# Docs Feature — Developer Onboarding Guide

**Last Updated:** December 2025  
**Status:** Planning Phase  
**Purpose:** Comprehensive guide to get developers up to speed on Docs feature development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Context & Motivation](#context--motivation)
3. [What We're Building](#what-were-building)
4. [Technical Architecture](#technical-architecture)
5. [Package Ecosystem](#package-ecosystem)
6. [Product Requirements](#product-requirements)
7. [Implementation Approach](#implementation-approach)
8. [File Structure & Patterns](#file-structure--patterns)
9. [Key Decisions Made](#key-decisions-made)
10. [Next Steps](#next-steps)
11. [References & Resources](#references--resources)

---

## Executive Summary

**The Initiative:** We're building a Notion-style block-based document editor with Markdown storage, enabling users to create long-form content and agents to read/write documents intelligently.

**The Goal:** Enable users to create rich documents with natural language assistance from agents, with all content stored as portable Markdown for long-term knowledge management.

**The Approach:** 
1. **Phase 0:** Technical spike to validate core assumptions (Lexical blocks → Markdown, agent tools)
2. **Phase 1:** Core document editor with basic blocks
3. **Phase 2:** Block features (slash commands, drag-and-drop)
4. **Phase 3:** Agent integration (chat sidebar, document tools)
5. **Phase 4:** Version history and settings
6. **Phase 5:** Polish and validation

**Current Status:** Product Spec complete, Research Log ready to begin.

**⚠️ Important:** Phase 0 must complete successfully before proceeding to Phase 1. After Phase 0, review all later phases for any needed updates.

---

## Context & Motivation

### Why Docs?

**The Problem:** Agipo currently handles structured data (Records/Sheets) and workflows, but **cannot handle unstructured long-form content**. This limits knowledge management:
- **Can't create documents:** Users need a place to write notes, research, and knowledge bases
- **Agents can't read documents:** No structured knowledge for agents to reference
- **Missing a key primitive:** Documents are fundamental to knowledge work

**The Opportunity:** By adding Docs as a first-class primitive, we enable:
- **Knowledge management:** Users can create and organize documents
- **Agent knowledge:** Documents become agent-accessible via RAG
- **Agentic editing:** Agents can read and write documents intelligently
- **Composability:** Documents can reference Records, workflows, etc.

### Strategic Context

**Competitive Landscape:** 
- **Notion** has block-based editing with slash commands
- **Obsidian** has Markdown-first approach with properties
- **Google Docs** has familiar WYSIWYG editing
- **Our differentiation:** Agent integration, Markdown storage, RAG indexing

**User Needs:**
- **Example 1:** "Create a research document and have the agent summarize it"
- **Example 2:** "Agent, add a conclusion section to my document"
- **Example 3:** "Search my documents for information about X"

All of these require a Docs feature.

---

## What We're Building

### Phase 0: Technical Spike (Current Focus)

**Location:** `app/api/dox/spike/`

**What It Does:**
- Validates Lexical blocks → Markdown conversion
- Tests block insertion/deletion
- Validates frontmatter parsing
- Tests agent tool patterns

**Why First:**
- Validates assumptions before building full infrastructure
- Identifies integration issues early
- Provides working prototype to reference

**See:** `00-Phase0-Technical-Spike.md` for complete details.

### Phase 1: Core Document Editor (After Phase 0)

**Location:** `/docs/[docId]`

**What It Does:**
- Block-based editor using Lexical
- Basic blocks (paragraph, heading, list)
- Markdown storage
- Auto-save

### Phase 2: Block Features (Future)

**Goal:** Slash commands, drag-and-drop, advanced blocks

### Phase 3: Agent Integration (Future)

**Goal:** Chat sidebar, document tools, agentic editing

### Phase 4: Version History (Future)

**Goal:** Version tracking, comparison, restoration

### Phase 5: Polish (Future)

**Goal:** Settings, access management, activity log

---

## Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                     │
│  /docs/[docId] (Document Editor Page)                      │
│  - Lexical Editor (blocks)                                 │
│  - Document Outline (left sidebar)                          │
│  - Chat Sidebar (right sidebar)                            │
│  - Properties Panel (frontmatter)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
│  /api/docs/                                                 │
│  ├── route.ts          # List, create                       │
│  ├── [docId]/          # Read, update, delete               │
│  ├── [docId]/chat/     # Agent chat                         │
│  ├── [docId]/versions/ # Version history                    │
│  └── [docId]/access/   # Access management                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                              │
│  /api/dox/services/                                          │
│  ├── document-storage.ts    # File system operations       │
│  ├── markdown-parser.ts     # Markdown ↔ Lexical           │
│  ├── frontmatter.ts         # YAML frontmatter             │
│  └── version-manager.ts     # Version tracking             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL INTEGRATION                            │
│  Mastra RAG (document indexing)                              │
│  Mastra Agents (document tools)                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

**1. Lexical Editor**
- Block-based editing engine
- Markdown serialization via `@lexical/markdown`
- React integration via `@lexical/react`

**2. Document Storage**
- Markdown files in `_tables/dox/[docId]/`
- Frontmatter as YAML
- Version history as full copies

**3. Agent Tools**
- 9 document tools for agents
- Block-level manipulation
- Version attribution

**4. RAG Integration**
- Documents indexed via Mastra RAG
- Semantic search for agents
- Chunk-based retrieval

---

## Package Ecosystem

### Core Editor Stack

**Lexical (Backend Engine)** - Like Polars for Records
- `lexical` - Core framework
- `@lexical/react` - React integration
- `@lexical/markdown` - Markdown serialization
- `@lexical/rich-text` - Text formatting, headings, quotes (HeadingNode, QuoteNode)
- `@lexical/list` - Lists
- `@lexical/table` - Tables
- `@lexical/code` - Code blocks
- `@lexical/link` - Links
- `@lexical/history` - Undo/redo
- `@lexical/dragon` - Drag & drop

**Note:** `@lexical/heading` and `@lexical/quote` don't exist — use `@lexical/rich-text` instead.

### Markdown Processing

**remark Ecosystem** - Markdown AST processing
- `remark` - Processor
- `remark-parse` - Parsing
- `remark-stringify` - Serialization
- `remark-gfm` - GitHub Flavored Markdown
- `remark-heading-id` - Heading IDs
- `unified` - Unified processor
- `mdast` - AST types
- `unist-util-visit` - AST traversal

### Frontmatter & Metadata

- `gray-matter` - YAML frontmatter parsing
- `js-yaml` - YAML handling

### Version History

- `diff` - Text diffing
- `diff-match-patch` - Advanced diffing

### UI Components (ShadCN/Radix)

**Already Installed:**
- `@radix-ui/react-*` - UI primitives
- `cmdk` - Command menu (slash commands)
- `@dnd-kit/*` - Drag & drop
- `lucide-react` - Icons
- `motion` - Animations

---

## Product Requirements

See `00-Product-Spec.md` for complete requirements.

**Key Categories:**
1. Document Editor (core editing)
2. Block Types (content types)
3. Document Outline (navigation)
4. Properties Panel (frontmatter)
5. Chat Sidebar (agent integration)
6. Version History (change tracking)
7. Settings & Access (permissions)

---

## Implementation Approach

### Phase 0: Technical Spike

**Goal:** Validate core technical assumptions.

**Files to Create:**
```
app/api/dox/spike/
├── test/route.ts                    # Test endpoint
└── services/
    ├── test-lexical-markdown.ts     # Markdown conversion test
    ├── test-blocks.ts               # Block manipulation test
    ├── test-frontmatter.ts          # Frontmatter parsing test
    └── test-agent-tools.ts          # Agent tool patterns test
```

**Acceptance Criteria:**
- Can convert Lexical blocks to Markdown
- Can convert Markdown to Lexical blocks
- Can insert/delete blocks programmatically
- Can parse frontmatter from Markdown
- Agent tool patterns work

**See:** `00-Phase0-Technical-Spike.md` for complete details.

---

## File Structure & Patterns

### Domain-Driven Design

**Principle:** Docs is a **new domain**, separate from existing domains.

**Existing Domains:**
- `workforce/` - Agent management
- `tools/` - Custom tools and workflows
- `connections/` - Composio integrations
- `records/` - Data tables

**New Domain:**
- `docs/` - Document management

### Storage Pattern

Following Records pattern:
```
_tables/dox/
├── index.ts                         # Document registry
└── [docId]/
    ├── content.md                   # Markdown content
    └── meta.json                    # Metadata (frontmatter as JSON)
```

### API Route Patterns

**Follow Domain Principles** (`app/api/DOMAIN_PRINCIPLES.md`):

**Collection Operations:**
- `POST /api/dox/create` → Create document
- `GET /api/dox/list` → List documents

**Instance Operations:**
- `GET /api/dox/[docId]` → Get document
- `PATCH /api/dox/[docId]` → Update document
- `DELETE /api/dox/[docId]` → Delete document

**Nested Resources:**
- `POST /api/dox/[docId]/chat` → Agent chat
- `GET /api/dox/[docId]/versions` → Version history
- `GET /api/dox/[docId]/access` → Access management

---

## Key Decisions Made

### 1. Editor Library

**Decision:** Use Lexical (by Meta).

**Rationale:**
- MIT license (100% free)
- Meta-backed (active development)
- 22.6k+ GitHub stars
- Native block support
- Markdown serialization

### 2. Block Structure

**Decision:** Flat blocks (no nesting) for v1.

**Rationale:**
- Simpler implementation
- Can add nesting later
- Matches most use cases

### 3. Storage Format

**Decision:** Markdown with YAML frontmatter.

**Rationale:**
- Portable
- Git-friendly
- RAG-friendly
- Human-readable

### 4. UI Components

**Decision:** ShadCN/Radix UI for all UI components.

**Rationale:**
- Consistent with Records
- Accessible
- Already installed
- Well-maintained

---

## Next Steps

### Immediate (Week 1)

1. **Phase 0: Technical Spike** ⚠️ **START HERE**
   - Install Lexical packages
   - Create spike test endpoint
   - Run all test scenarios
   - Document any issues or learnings
   - **Review all later phases** if assumptions changed

2. **Research Log** (Parallel to Phase 0)
   - Research Lexical API
   - Research Markdown packages
   - Document primitives discovered

3. **Technical Architecture** (After Phase 0)
   - Finalize package list
   - Document file structure
   - Design data models

### Short-Term (Weeks 2-3)

4. **Implementation Plan** (After Phase 0)
   - File impact analysis
   - Phase breakdown
   - Store slice architecture

5. **Phase 1: Core Editor** (After Implementation Plan)
   - Basic Lexical editor
   - Markdown storage
   - Auto-save

---

## References & Resources

### Documentation

**Product Spec:**
- `00-Product-Spec.md` - Complete product requirements

**UXD Mockups:**
- `_docs/UXD/Pages/records/2025-12-10-docs-v1/` - All UI mockups
- `Frontend-Backend-Mapping.md` - API contracts

**Architecture:**
- `app/api/DOMAIN_PRINCIPLES.md` - API organization principles
- `_docs/Engineering/Architecture/Store-Slice-Architecture.md` - Zustand patterns

**Existing Patterns:**
- `_docs/_tasks/20-records-feature/` - Records implementation (reference)
- `_docs/_tasks/21-browser-automation/` - Browser automation planning (reference)

### External Resources

**Lexical:**
- [Lexical Documentation](https://lexical.dev/)
- [Lexical GitHub](https://github.com/facebook/lexical)
- [Lexical Markdown Guide](https://lexical.dev/docs/packages/lexical-markdown)

**Markdown:**
- [remark Documentation](https://remark.js.org/)
- [MDast Specification](https://github.com/syntax-tree/mdast)

**Mastra:**
- [Mastra Documentation](https://mastra.dev/docs)
- [Mastra RAG](https://mastra.dev/docs/rag)

### Key Files to Study

**For API Patterns:**
- `app/api/records/[tableId]/chat/route.ts` - Chat pattern
- `app/api/workforce/[agentId]/chat/route.ts` - Agent chat pattern

**For Page Patterns:**
- `app/(pages)/records/[tableId]/page.tsx` - Records page structure
- `app/(pages)/workforce/page.tsx` - Workforce page structure

**For Storage Patterns:**
- `_tables/records/[tableId]/` - Records storage pattern
- `_tables/agents/[agentId]/` - Agent storage pattern

---

## Questions & Answers

### Q: Why Lexical instead of Tiptap?

**A:** 
- Lexical is 100% free (MIT license)
- Tiptap has paid extensions
- Lexical is Meta-backed (long-term support)
- Lexical has native block support

### Q: Why block-based instead of continuous editing?

**A:**
- Better for agent manipulation (blocks have IDs)
- Easier to reorder content
- Supports complex content types (tables, code)
- Modern UX pattern (Notion-style)

### Q: Why Markdown storage?

**A:**
- Portable (can export anywhere)
- Git-friendly (version control)
- RAG-friendly (easy to chunk)
- Human-readable (can edit raw)

### Q: How does this relate to Records?

**A:**
- **Records**: Structured data (tables, rows, columns)
- **Docs**: Unstructured content (text, blocks, markdown)
- Both are knowledge primitives
- Both accessible by agents
- Both stored in `_tables/`

---

## Getting Started Checklist

For a new developer joining this initiative:

- [ ] Read this onboarding document completely
- [ ] Read `00-Product-Spec.md` for detailed requirements
- [ ] **Read `00-Phase0-Technical-Spike.md` - START HERE**
- [ ] Review UXD mockups (`_docs/UXD/Pages/records/2025-12-10-docs-v1/`)
- [ ] Study Lexical documentation (links above)
- [ ] Review existing API patterns (`app/api/DOMAIN_PRINCIPLES.md`)
- [ ] Review storage patterns (`_tables/records/`, `_tables/agents/`)
- [ ] Review Records implementation (`_docs/_tasks/20-records-feature/`)

**Ready to Code?**
1. **Start with Phase 0 spike** (`app/api/dox/spike/test/route.ts`)
2. Run all test scenarios
3. Document learnings
4. **Review all later phases** if assumptions changed
5. Then proceed to Phase 1 (Core Editor)

---

## Summary

**What We're Building:** A Notion-style block-based document editor with Markdown storage and agent integration.

**Why:** Enable users to create rich documents with natural language assistance from agents.

**How:** Use Lexical (editor engine) + ShadCN (UI) + Mastra (agents), following existing codebase patterns.

**Current Status:** Product Spec complete, Phase 0 spike ready to begin.

**Next Step:** Execute Phase 0 technical spike to validate core assumptions, then review all later phases before proceeding.

---

**Questions?** Refer to `00-Product-Spec.md` for detailed requirements, or check the references section above.

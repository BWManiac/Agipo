# Task 25: Records & RAG Integration

**Status:** Planning
**Created:** December 12, 2025
**Branch:** `claude/rag-records-integration-0143brZmSonmErf4MouXnVzc`

---

## Overview

This task consolidates two related initiatives:

1. **Records & Docs Consolidation** - Unify the flat `/records` and `/docs` pages into a single, folder-based "Google Drive-like" interface
2. **RAG Integration** - Enable agents to semantically search and retrieve context from assigned records and documents

Together, these create a unified knowledge management system where users can organize structured data (tables) and unstructured content (documents) in folders, and agents can intelligently retrieve relevant context during conversations.

---

## Goals

### Records & Docs Consolidation
- Single `/records` route for both tables and documents
- Folder-based organization (create, nest, move items)
- Google Drive-like UI with card grid, folder tree sidebar, breadcrumbs
- Unified item type system (`table` | `document`)
- Migration of existing flat structure to folder-based

### RAG Integration
- Vector-based semantic search over assigned records/docs
- LibSQL file-based vector store (Mastra primitives)
- Automatic indexing when RAG enabled on assignment
- Context injection into agent chat via system prompt
- Per-agent per-source RAG configuration

---

## North Star

**Job Application Agent Use Case:** A user has a resume document and a job applications tracking table. When chatting with their Job Application Agent:

- Agent can semantically search the resume: *"What skills should I highlight for this backend role?"*
- Agent retrieves relevant sections without explicit tool calls
- Agent cites specific records/documents in responses
- All organized in a "Job Applications" folder the user created

---

## Current State

### Records (`/records`)
- Flat catalog of structured data tables with Polars DataFrames
- TanStack Table-based grid with inline editing
- Chat sidebar with AI agents
- Agents access via tools (`sys_table_read`, `sys_table_write`, etc.)

### Docs (`/docs`)
- Flat catalog of markdown documents with frontmatter
- Lexical-based rich text editor with versioning
- Chat sidebar with AI document assistant
- Agents access via tools (`sys_doc_read`, `sys_doc_replace`, etc.)

### Agent Records Tab (currently mock)
- Shows mock assigned tables
- "Assign Table" button is placeholder
- No real functionality yet

---

## Planning Documents

| Document | Purpose |
|----------|---------|
| `00-Product-Spec.md` | Product requirements, acceptance criteria, user flows |
| `01-File-Impact-Analysis.md` | Complete file impact analysis table |
| `02-Phase1-Folder-Backend.md` | Backend folder CRUD and storage |
| `03-Phase2-Folder-Frontend.md` | Frontend folder UI components |
| `04-Phase3-RAG-Indexing.md` | RAG indexing infrastructure |
| `05-Phase4-RAG-Retrieval.md` | RAG retrieval and chat integration |
| `06-Phase5-Agent-Assignment-UI.md` | Agent Records tab with RAG toggle |
| `UXD/` | Mockups and design files |

---

## Related Documentation

- **RAG Roadmap:** `_docs/Product/ROADMAP/rag-integration/`
- **Records Consolidation Roadmap:** `_docs/Product/ROADMAP/records-consolidation/`
- **Records Feature:** `_docs/_tasks/_completed/20-records-feature/`
- **Docs Feature:** `_docs/_tasks/_completed/22b-docs-feature/`
- **Domain Principles:** `app/api/DOMAIN_PRINCIPLES.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-12 | Initial task creation | Claude |

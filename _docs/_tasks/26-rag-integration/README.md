# Task 26: RAG Integration

**Status:** Planning
**Depends On:** Task 25 (Records Consolidation)
**Created:** December 12, 2025

---

## Overview

Enable agents to semantically search and retrieve context from assigned records and documents using RAG (Retrieval-Augmented Generation). When agents are assigned tables/docs with RAG enabled, they can answer questions like "What skills from my resume match this job?" without explicit tool calls.

---

## Goals

1. **RAG Indexing Infrastructure** — Chunk and embed records/documents into vector store
2. **RAG Retrieval** — Query vector store and inject context into agent chat
3. **Agent Assignment UI** — Make Records tab functional with RAG toggle

---

## Prerequisites

- Task 25: Records Consolidation (unified `/records` with folders)
- Unified item types (tables + documents in same structure)

---

## Key Documents

| Document | Purpose |
|----------|---------|
| [00-Product-Spec.md](./00-Product-Spec.md) | Requirements, acceptance criteria, user flows |
| [01-File-Impact-Analysis.md](./01-File-Impact-Analysis.md) | Files to create/modify/delete |
| [UXD/README.md](./UXD/README.md) | Mockup requirements and status |

---

## Phases

| Phase | Name | Description |
|-------|------|-------------|
| 1 | RAG Indexing Infrastructure | Vector store, chunking, embedding services |
| 2 | RAG Retrieval & Chat Integration | Query service, context injection |
| 3 | Agent Assignment UI | Functional Records tab with RAG toggle |

---

## Related Documents

- **RAG Roadmap:** `_docs/Product/ROADMAP/rag-integration/01-RAG-for-Records-and-Docs.md`
- **Mastra RAG Docs:** https://mastra.ai/docs/rag/overview
- **Task 25:** `_docs/_tasks/25-records-consolidation/` (prerequisite)

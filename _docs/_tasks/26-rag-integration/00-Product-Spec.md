# Task 26: RAG Integration — Product Spec

**Status:** Planning
**Date:** December 12, 2025
**Depends On:** Task 25 (Records Consolidation)
**Goal:** Enable agents to semantically search and retrieve context from assigned records and documents.

---

## 1. Executive Summary

Today, agents can access data via explicit tool calls but have no semantic understanding—they can't answer "What were the main themes from stakeholder interviews?" without manual queries.

This task delivers RAG (Retrieval-Augmented Generation) capabilities:

1. **RAG Indexing** — Automatically embed and index records/documents for semantic search
2. **RAG Retrieval** — Query vector store and inject relevant context into agent conversations
3. **Agent Assignment UI** — Functional Records tab with RAG toggle and status indicators

**End state:** When chatting with agents, relevant context from assigned tables and documents is automatically retrieved and injected—no explicit tool calls needed. Agents can answer questions like "What skills from my resume match this job?" by semantically searching the assigned documents.

---

## 2. Product Requirements

### 2.1 RAG Indexing

**Definition:** Automatic embedding and indexing of records/documents for semantic search.

**Why it matters:** This is what enables agents to "understand" content rather than just query it structurally.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-1.1 | Tables can be indexed for RAG (rows → embeddings) | P0 |
| PR-1.2 | Documents can be indexed for RAG (markdown → embeddings) | P0 |
| PR-1.3 | Chunking uses recursive strategy (512 tokens, 50 overlap) | P0 |
| PR-1.4 | Embeddings use OpenAI text-embedding-3-small | P0 |
| PR-1.5 | Vector store uses LibSQL (file-based) | P0 |
| PR-1.6 | Index naming: `{agentId}-{sourceId}` | P0 |
| PR-1.7 | Indexing happens async after assignment with RAG enabled | P0 |
| PR-1.8 | New rows/content updates trigger re-indexing | P1 |

### 2.2 RAG Retrieval

**Definition:** Semantic search and context injection during agent conversations.

**Why it matters:** This is the user-facing value—agents that understand your data.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-2.1 | Agent chat retrieves relevant chunks from RAG sources | P0 |
| PR-2.2 | Retrieved context injected into system prompt | P0 |
| PR-2.3 | Multiple sources searched simultaneously | P0 |
| PR-2.4 | Top 5 chunks retrieved per source | P0 |
| PR-2.5 | Agent responses can cite specific sources | P1 |
| PR-2.6 | RAG context retrieval is automatic (no tool call needed) | P0 |
| PR-2.7 | Query similarity threshold configurable | P2 |

### 2.3 Agent Assignment UI

**Definition:** Functional Records tab in Agent Modal for assigning tables/docs with RAG.

**Why it matters:** Currently this is a mock. Users need to actually assign data sources to agents.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-3.1 | Records tab shows assigned tables and documents | P0 |
| PR-3.2 | "Assign Table" button opens selection dialog | P0 |
| PR-3.3 | Assignment dialog shows available tables and documents | P0 |
| PR-3.4 | User can select permission level (read-only, read-write) | P0 |
| PR-3.5 | User can toggle "Enable RAG indexing" | P0 |
| PR-3.6 | RAG status badge shows enabled/disabled/indexing | P0 |
| PR-3.7 | User can remove assignments | P1 |
| PR-3.8 | Indexing progress shown when RAG enabled | P1 |

---

## 3. Acceptance Criteria

### RAG Indexing (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1 | Enabling RAG on assignment triggers indexing | Assign with RAG, check vector store |
| AC-2 | Table rows are chunked and embedded | Query vector store, verify chunks |
| AC-3 | Document content is chunked and embedded | Query vector store, verify chunks |
| AC-4 | Vector store persists across restarts | Restart server, query store |
| AC-5 | New row triggers incremental re-index | Add row, verify new embedding |

### RAG Retrieval (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-6 | Chat retrieves RAG context automatically | Ask semantic question, verify relevance |
| AC-7 | Agent uses context in response | Ask "What did stakeholders say about X?" |
| AC-8 | Multiple sources searched | Assign 2 tables with RAG, verify both queried |
| AC-9 | No RAG if no sources assigned | Agent without RAG, verify no retrieval |
| AC-10 | Agent can cite source in response | Check response attribution |

### Agent Assignment UI (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-11 | Records tab shows real assigned items | Assign table, refresh, verify shown |
| AC-12 | "Assign Table" opens selection dialog | Click button, verify dialog |
| AC-13 | Dialog shows tables AND documents | Check list in dialog |
| AC-14 | RAG toggle visible in assignment | Check checkbox in dialog |
| AC-15 | RAG status badge updates after indexing | Watch badge during indexing |

---

## 4. User Flows

### Flow 1: Enable RAG for Agent

```
1. User opens Agent Modal → Records tab
2. Sees list of assigned items (or empty state)
3. User clicks "+ Assign Table"
4. Dialog shows available tables and documents
5. User selects "Job Applications" table
6. Dialog shows:
   - Permission: [Read-only] [Read/Write]
   - [x] Enable RAG indexing
7. User clicks "Assign"
8. Table appears in list with "Indexing..." badge
9. After indexing completes, badge shows "RAG Active"
```

### Flow 2: Agent Uses RAG Context

```
1. User chats with agent that has RAG-enabled sources
2. User asks: "What skills should I highlight for a backend role?"
3. Agent's RAG system:
   - Embeds user query
   - Searches vector store for "Resume.md" document
   - Retrieves relevant chunks about backend skills
4. Context injected into system prompt
5. Agent responds: "Based on your resume, your most relevant skills are..."
6. Agent cites: "From Resume.md: '5 years Python, PostgreSQL, AWS...'"
```

---

## 5. Design Decisions

### 5.1 Decisions to Make

| ID | Question | Options | Current Lean | Decided? |
|----|----------|---------|--------------|----------|
| DD-1 | RAG toggle in assignment dialog? | A: Checkbox, B: Switch toggle | A: Checkbox (consistent) | No |
| DD-2 | Where to show indexing progress? | A: Badge only, B: Badge + modal | A: Badge only (simple) | No |
| DD-3 | How to handle failed indexing? | A: Retry button, B: Auto-retry | B: Auto-retry with limit | No |

### 5.2 Decision Log

| Date | Decision | Choice | Rationale |
|------|----------|--------|-----------|
| - | - | - | - |

---

## 6. UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| 01-assignment-dialog | Assign to agent dialog | Table/doc selection, permission, RAG toggle |
| 02-rag-status-badges | RAG status indicators | Badges: Disabled, Indexing, Active, Error |
| 03-agent-records-tab | Agent modal Records tab | Assigned items list with RAG badges |
| 04-indexing-progress | Indexing progress states | Progress bar, completion states |

### Mockup Location

```
_docs/_tasks/26-rag-integration/UXD/
├── 01-assignment-dialog.html
├── 02-rag-status-badges.html
├── 03-agent-records-tab.html
├── 04-indexing-progress.html
└── README.md
```

---

## 7. Success Criteria

| Criterion | How to Validate | Priority |
|-----------|-----------------|----------|
| RAG-enabled sources provide semantic context | Ask semantic question, get relevant answer | P0 |
| Agent assignment UI is functional | Assign table with RAG, verify indexing | P0 |
| RAG retrieval doesn't slow down chat | Response latency < 1s for retrieval | P1 |
| Indexing status is visible to users | Badge shows correct state | P0 |

**North Star:** Agents intelligently understand and reference assigned knowledge during conversations—no manual queries needed.

---

## 8. Out of Scope

- **Vector store migration to PgVector** — Starting with LibSQL
- **Multi-table joins in RAG** — Single-source queries only
- **RAG analytics dashboard** — Future enhancement
- **Custom embedding models** — Fixed to OpenAI for MVP
- **Advanced chunking strategies** — Only recursive for MVP

---

## 9. Phased Approach

### Phase 1: RAG Indexing Infrastructure
- Vector store wrapper (LibSQL)
- Record indexer (rows → embeddings)
- Document indexer (markdown → embeddings)
- Extend access.json with ragEnabled

### Phase 2: RAG Retrieval & Chat Integration
- Retrieval service
- RAG context service
- Modify chat-service for context injection

### Phase 3: Agent Assignment UI
- Make Records tab functional
- Assignment dialog with RAG toggle
- RAG status badges
- Indexing progress indicators

---

## 10. Related Documents

### Architecture Principles

| Principle | Application |
|-----------|-------------|
| [API Domain Principles](../../../app/api/DOMAIN_PRINCIPLES.md) | RAG routes nested under owning resources |
| [Store Slice Principles](../../../app/STORE_SLICE_PRINCIPLES.md) | RAG slice structure |
| [Component Principles](../../../app/COMPONENT_PRINCIPLES.md) | shadcn/ui first; state in stores |
| [Route README Template](../../../app/api/ROUTE_README_TEMPLATE.md) | Documentation for new routes |
| [Service README Template](../../../app/api/SERVICE_README_TEMPLATE.md) | Documentation for new services |

### Feature Documentation

- **RAG Roadmap:** `_docs/Product/ROADMAP/rag-integration/01-RAG-for-Records-and-Docs.md`
- **Mastra RAG Docs:** https://mastra.ai/docs/rag/overview
- **Task 25:** `_docs/_tasks/25-records-consolidation/` (prerequisite)

---

## Notes

### Key Technical Decisions

1. **LibSQL for vectors** — File-based storage aligns with existing architecture, can migrate to PgVector later
2. **Per-agent indexes** — Index naming `{agentId}-{sourceId}` allows multiple agents to have different RAG configurations for same source
3. **Context injection via system prompt** — Simplest integration point, no tool call overhead
4. **Recursive chunking** — Works well for both structured (JSON rows) and unstructured (markdown)

### Mastra RAG Primitives to Use

```typescript
// Document creation
MDocument.fromMarkdown(content)
MDocument.fromJSON(content)

// Chunking
doc.chunk({ strategy: 'recursive', maxSize: 512, overlap: 50 })

// Embedding
import { embedMany } from 'ai'
const { embeddings } = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: chunks.map(c => c.text)
})

// Vector store
import { LibSQLVector } from '@mastra/core/vector/libsql'
const store = new LibSQLVector({ connectionUrl: 'file:vectors.db' })
await store.createIndex({ indexName, dimension: 1536, metric: 'cosine' })
await store.upsert({ indexName, vectors, metadata })
await store.query({ indexName, queryVector, topK: 5 })
```

---

**Last Updated:** 2025-12-12

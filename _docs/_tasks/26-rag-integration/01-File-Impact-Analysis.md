# Task 26: File Impact Analysis

**Status:** Planning
**Last Updated:** December 12, 2025
**Depends On:** Task 25 (Records Consolidation)

---

## Guiding Principles

This analysis follows the established architecture principles:

| Principle Document | Key Application |
|--------------------|-----------------|
| [API Domain Principles](../../../app/api/DOMAIN_PRINCIPLES.md) | RAG routes nested under owning resources |
| [Store Slice Principles](../../../app/STORE_SLICE_PRINCIPLES.md) | Commented 4-part slice structure |
| [Component Principles](../../../app/COMPONENT_PRINCIPLES.md) | shadcn/ui first; state in stores |
| [Route README Template](../../../app/api/ROUTE_README_TEMPLATE.md) | Co-located README per route |
| [Service README Template](../../../app/api/SERVICE_README_TEMPLATE.md) | Co-located README per service |

### Key Architecture Decisions

1. **RAG indexing under `/records/`** — Index belongs to the record (ownership)
2. **RAG retrieval under `/workforce/`** — Query is an agent capability
3. **Services co-located with consumers** — Indexing under records, retrieval under workforce/chat

---

## Overview

Complete file impact analysis for the RAG Integration task. This document catalogs all files that will be created, modified, or deleted across all phases.

---

## Summary Statistics

| Category | Create | Modify | Delete | Total |
|----------|--------|--------|--------|-------|
| Types | 1 | 0 | 0 | 1 |
| Backend / API Routes | 4 | 1 | 0 | 5 |
| Backend / API READMEs | 4 | 0 | 0 | 4 |
| Backend / Services | 5 | 1 | 0 | 6 |
| Backend / Service READMEs | 5 | 0 | 0 | 5 |
| Frontend / State | 1 | 0 | 0 | 1 |
| Frontend / Components | 4 | 1 | 0 | 5 |
| **Total** | **24** | **3** | **0** | **27** |

---

## File Impact by Phase

### Phase 1: RAG Indexing Infrastructure

> **Architecture Note:** RAG indexing is nested under `/records/` following Domain Principle #5 (Nested Resources = Ownership). The index belongs to the record, not a separate RAG domain.

#### Types

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/rag/types.ts` | Create | RAG types (Chunk, IndexMetadata, EmbeddingResult) |

#### Backend / API Routes

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/[itemId]/rag/index/route.ts` | Create | POST trigger item indexing |
| `app/api/records/[itemId]/rag/status/route.ts` | Create | GET index status for item |
| `app/api/records/[itemId]/access/agents/route.ts` | Modify | Add ragEnabled parameter |

#### Backend / API READMEs

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/[itemId]/rag/index/README.md` | Create | Route documentation |
| `app/api/records/[itemId]/rag/status/README.md` | Create | Route documentation |

#### Backend / Services (Co-located under records)

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/services/rag/vector-store.ts` | Create | LibSQL vector store wrapper |
| `app/api/records/services/rag/indexing-service.ts` | Create | Core indexing orchestration |
| `app/api/records/services/rag/table-indexer.ts` | Create | Index table rows as documents |
| `app/api/records/services/rag/doc-indexer.ts` | Create | Index markdown documents |

#### Backend / Service READMEs

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/services/rag/vector-store.README.md` | Create | Service documentation |
| `app/api/records/services/rag/indexing-service.README.md` | Create | Service documentation |
| `app/api/records/services/rag/table-indexer.README.md` | Create | Service documentation |
| `app/api/records/services/rag/doc-indexer.README.md` | Create | Service documentation |

---

### Phase 2: RAG Retrieval & Chat Integration

> **Architecture Note:** RAG retrieval is an agent capability, so it belongs under `/workforce/[agentId]/` following Domain Principle #7 (Domain-Driven Design). RAG query serves the chat feature, so services are co-located there.

#### Backend / API Routes

| File | Action | Purpose |
|------|--------|---------|
| `app/api/workforce/[agentId]/rag/query/route.ts` | Create | POST query agent's RAG sources |
| `app/api/workforce/[agentId]/rag/sources/route.ts` | Create | GET agent's RAG sources |

#### Backend / API READMEs

| File | Action | Purpose |
|------|--------|---------|
| `app/api/workforce/[agentId]/rag/query/README.md` | Create | Route documentation |
| `app/api/workforce/[agentId]/rag/sources/README.md` | Create | Route documentation |

#### Backend / Services (Co-located under workforce/chat)

| File | Action | Purpose |
|------|--------|---------|
| `app/api/workforce/[agentId]/chat/services/rag-context-service.ts` | Create | Load agent sources, retrieve context |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Modify | Inject RAG context into chat |

#### Backend / Service READMEs

| File | Action | Purpose |
|------|--------|---------|
| `app/api/workforce/[agentId]/chat/services/rag-context-service.README.md` | Create | Service documentation |

---

### Phase 3: Agent Assignment UI

> **Architecture Note:** Agent modal components follow [Component Principles](../../../app/COMPONENT_PRINCIPLES.md). RecordsTab is nested under `agent-modal/components/tabs/` following the co-location pattern.

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workforce/components/agent-modal/store/slices/ragSlice.ts` | Create | RAG status state management |

**ragSlice.ts Structure:**
```typescript
// 1. State Interface - sources, indexingStatus, error
// 2. Actions Interface - fetchSources, toggleRag, getIndexStatus
// 3. Combined Slice Type
// 4. Initial State
// 5. Slice Creator - with [RagSlice] logging prefix
```

#### Frontend / Components

| File | Action | Purpose | shadcn/ui components used |
|------|--------|---------|---------------------------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab.tsx` | Modify | Make functional with real data | Card, Button |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/AssignItemDialog.tsx` | Create | Table/doc selection with RAG toggle | Dialog, Switch, Command |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/RAGStatusBadge.tsx` | Create | RAG enabled/indexing/active badge | Badge |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/IndexingProgress.tsx` | Create | Indexing progress indicator | Progress |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/AssignedItemCard.tsx` | Create | Card for assigned table/doc | Card, Badge, Button |

---

## API Routes Summary

### New Routes

| Method | Route | Purpose | Phase |
|--------|-------|---------|-------|
| POST | `/api/records/[itemId]/rag/index` | Trigger item RAG indexing | 1 |
| GET | `/api/records/[itemId]/rag/status` | Get item RAG index status | 1 |
| POST | `/api/workforce/[agentId]/rag/query` | Query agent's RAG sources | 2 |
| GET | `/api/workforce/[agentId]/rag/sources` | Get agent's RAG sources | 2 |

### Modified Routes

| Method | Route | Change | Phase |
|--------|-------|--------|-------|
| POST | `/api/records/[itemId]/access/agents` | Add ragEnabled parameter | 1 |

### Route Nesting Rationale

Following [API Domain Principles](../../../app/api/DOMAIN_PRINCIPLES.md):

| Route Pattern | Rationale |
|---------------|-----------|
| `/records/[itemId]/rag/*` | RAG index belongs to the item (ownership) |
| `/workforce/[agentId]/rag/*` | RAG retrieval is an agent capability |

---

## Access Control Extensions

### Current access.json

```json
{
  "agents": [
    {
      "agentId": "pm",
      "permission": "read_write",
      "grantedAt": "2024-12-10T..."
    }
  ]
}
```

### Extended access.json (Phase 1)

```json
{
  "agents": [
    {
      "agentId": "pm",
      "permission": "read_write",
      "grantedAt": "2024-12-10T...",
      "ragEnabled": true,
      "ragIndexedAt": "2024-12-11T...",
      "ragIndexName": "pm-tbl_abc123"
    }
  ]
}
```

---

## Vector Storage Structure

```
_tables/
└── vectors/                            # Vector stores
    └── [indexName].db                  # LibSQL vector DB per agent-source pair
```

**Index Naming Convention:** `{agentId}-{itemId}`

---

## Dependencies

### New npm Packages (Verify if already installed)

| Package | Purpose | Phase |
|---------|---------|-------|
| `@mastra/core` | RAG primitives (MDocument, chunking) | 1 |
| `@mastra/libsql` | LibSQL vector store | 1 |
| `ai` | Embedding generation (embedMany) | 1 |
| `@ai-sdk/openai` | OpenAI embedding model | 1 |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Vector store grows large | Medium | Per-agent indexes, cleanup unused indexes |
| RAG retrieval slow | Medium | Limit topK, cache embeddings, async retrieval |
| Indexing fails silently | Medium | Status tracking, retry mechanism |
| Embedding API rate limits | Low | Queue indexing, exponential backoff |

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-12 | Split from Task 25 into separate RAG task | Claude |
| 2025-12-12 | Initial file impact analysis | Claude |

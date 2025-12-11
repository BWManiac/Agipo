# Task: RAG Integration for Records and Docs

**Status:** Not Started  
**Roadmap:** `_docs/Product/ROADMAP/rag-integration/01-RAG-for-Records-and-Docs.md`  
**Research Log:** `_docs/Product/ROADMAP/rag-integration/01B-RAG-Integration-Research.md`  
**Assigned:** TBD  
**Started:** YYYY-MM-DD  
**Completed:** YYYY-MM-DD

---

## Validation

### Approach Validation
✅ **Mastra RAG primitives are mature** - MDocument, chunking, embeddings, vector stores
✅ **LibSQL for file-based vectors** - Aligns with file-based architecture
✅ **Assignment-based RAG control** - Per-agent per-source configuration
✅ **Context injection pattern works** - Retrieve before chat, inject in system prompt

### Current State Analysis
- Records/docs assignment system exists
- No RAG functionality implemented
- Mastra RAG primitives available but not used
- Chat service ready for context injection

## Deterministic Decisions

### Storage Decisions
- **Vector Store**: LibSQL in `_tables/vectors/[indexName].db`
- **Index Naming**: `{agentId}-{tableId}` or `{agentId}-{docId}`
- **Chunk Size**: 512 tokens with 50 token overlap
- **Embedding Model**: text-embedding-3-small

### Implementation Decisions
- **Indexing Trigger**: On assignment with ragEnabled=true
- **Re-indexing**: Manual trigger via API
- **Query TopK**: Return top 5 chunks
- **Context Format**: Inject as "Relevant Context:" section

---

## Overview

### Goal

Enable agents to use semantic search (RAG) over assigned records and documents. When agents are assigned tables or docs with RAG enabled, they can retrieve relevant context during chat conversations using natural language queries, rather than requiring explicit tool calls.

This transforms records and docs from structured storage into intelligent knowledge bases that agents can understand and reference semantically.

### Relevant Research

**Current Assignment System:**
- Records: Access stored in `_tables/records/[tableId]/access.json`
- Format: `{ agents: [{ agentId, permission, grantedAt }] }`
- API: `POST /api/records/[tableId]/access/agents`
- Docs: Similar pattern likely (need to verify)

**Mastra RAG Primitives:**
- `MDocument.fromText()` - Create document from text
- `doc.chunk({ strategy, size, overlap })` - Chunk document
- `embedMany({ values, model })` - Generate embeddings
- Vector stores: `PgVector`, `LibSQLStore` (file-based)
- `vectorStore.upsert({ indexName, vectors })` - Store embeddings
- `vectorStore.query({ indexName, queryVector, topK })` - Retrieve similar chunks

**Record Structure:**
- Tables: `_tables/records/[tableId]/schema.json` + `records.json` (Polars DataFrame)
- Records are JSON objects with schema-defined columns
- Need to convert rows to text for embedding (e.g., JSON.stringify or formatted text)

**Document Structure:**
- Docs: `_tables/documents/[docId]/content.md` (Markdown + YAML frontmatter)
- Already text-based, can chunk directly
- Use `gray-matter` to extract content from frontmatter

**Agent Chat Integration:**
- Chat service: `app/api/workforce/[agentId]/chat/services/chat-service.ts`
- Agent creation: `createConfiguredAgent(userId, agentConfig, toolMap)`
- System prompt injection: `formatMessages(messages, context)`
- Need to retrieve RAG context before agent execution

**Existing Patterns:**
- File-based storage in `_tables/` directory
- Access control via JSON files
- Service layer pattern (services/ directory)
- Zustand for frontend state

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `_tables/types.ts` | Modify | Add `ragEnabled` to access types | A |
| `app/api/rag/types.ts` | Create | RAG-specific types (Chunk, Embedding, IndexMetadata) | A, B |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/records/[tableId]/access/agents/route.ts` | Modify | Add `ragEnabled` parameter to assignment | A |
| `app/api/rag/index/[indexName]/route.ts` | Create | GET index status, POST trigger indexing | A |
| `app/api/rag/query/route.ts` | Create | POST query vector store for relevant chunks | B |
| `app/api/docs/[docId]/access/agents/route.ts` | Create | Similar to records access (if doesn't exist) | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/rag/services/indexing-service.ts` | Create | Core indexing logic (chunk, embed, store) | A |
| `app/api/rag/services/retrieval-service.ts` | Create | Query vector store, retrieve chunks | B |
| `app/api/rag/services/vector-store.ts` | Create | Vector store wrapper (LibSQL) | A, B |
| `app/api/rag/services/record-indexer.ts` | Create | Index table rows as documents | A |
| `app/api/rag/services/doc-indexer.ts` | Create | Index markdown documents | A |
| `app/api/workforce/[agentId]/chat/services/rag-context-service.ts` | Create | Load assigned sources, retrieve context | B |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Modify | Inject RAG context into agent chat | B |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/agent-modal/store/slices/ragSlice.ts` | Create | RAG status, indexing progress | C |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab.tsx` | Modify | Add RAG checkbox to assignment dialog | C |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/components/RAGStatusBadge.tsx` | Create | Show RAG enabled/disabled status | C |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/components/IndexingProgress.tsx` | Create | Show indexing progress indicator | C |

---

## Part A: RAG Indexing Infrastructure

### Goal

Build the backend infrastructure to index records and documents for RAG. When a table or doc is assigned to an agent with RAG enabled, the system should chunk, embed, and store the content in a vector database.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/rag/services/vector-store.ts` | Create | LibSQL vector store wrapper | ~150 |
| `app/api/rag/services/indexing-service.ts` | Create | Core indexing orchestration | ~200 |
| `app/api/rag/services/record-indexer.ts` | Create | Convert table rows to documents, index | ~150 |
| `app/api/rag/services/doc-indexer.ts` | Create | Chunk markdown, index | ~120 |
| `app/api/records/[tableId]/access/agents/route.ts` | Modify | Add `ragEnabled` parameter, trigger indexing | ~50 |
| `app/api/rag/index/[indexName]/route.ts` | Create | Index management API | ~100 |
| `app/api/rag/types.ts` | Create | Type definitions | ~80 |

### Pseudocode

#### `app/api/rag/services/vector-store.ts`

```
VectorStoreService
├── initializeStore(indexName: string)
│   └── Create LibSQLStore instance for indexName
├── upsertChunks(indexName: string, chunks: Chunk[], embeddings: number[][])
│   ├── Create LibSQLStore if not exists
│   ├── For each chunk + embedding:
│   │   └── Store: { id, text, embedding, metadata }
│   └── Commit to vector DB
├── querySimilar(indexName: string, queryEmbedding: number[], topK: number)
│   ├── Load vector store
│   ├── Compute cosine similarity
│   ├── Return top K chunks with metadata
│   └── Return: ChunkResult[]
└── deleteIndex(indexName: string)
    └── Remove vector DB file
```

#### `app/api/rag/services/record-indexer.ts`

```
indexTableRows(tableId: string)
├── Load table schema and records
├── Convert rows to text documents:
│   ├── For each row:
│   │   ├── Format as: "Column1: value1, Column2: value2, ..."
│   │   └── Include row ID in metadata
│   └── Create MDocument.fromText() for each row
├── Chunk documents:
│   ├── Use recursive strategy (512 tokens, 50 overlap)
│   └── Preserve row ID in chunk metadata
├── Generate embeddings:
│   ├── embedMany({ values: chunks.map(c => c.text), model })
│   └── Get embeddings array
├── Store in vector DB:
│   ├── indexName = `records-${tableId}`
│   ├── upsertChunks(indexName, chunks, embeddings)
│   └── Store index metadata (rowCount, indexedAt)
└── Return indexing result
```

#### `app/api/rag/services/doc-indexer.ts`

```
indexDocument(docId: string)
├── Load document content (Markdown)
├── Parse frontmatter (gray-matter)
├── Extract content (ignore frontmatter for now)
├── Create MDocument.fromText(content)
├── Chunk document:
│   ├── Use recursive strategy (512 tokens, 50 overlap)
│   └── Preserve docId, section info in metadata
├── Generate embeddings:
│   ├── embedMany({ values: chunks.map(c => c.text), model })
│   └── Get embeddings array
├── Store in vector DB:
│   ├── indexName = `doc-${docId}`
│   ├── upsertChunks(indexName, chunks, embeddings)
│   └── Store index metadata (chunkCount, indexedAt)
└── Return indexing result
```

#### `app/api/rag/services/indexing-service.ts`

```
IndexingService
├── indexSource(sourceType: 'record' | 'doc', sourceId: string)
│   ├── If sourceType === 'record':
│   │   └── Call recordIndexer.indexTableRows(sourceId)
│   ├── If sourceType === 'doc':
│   │   └── Call docIndexer.indexDocument(sourceId)
│   └── Return { success, chunkCount, indexedAt }
├── reindexSource(sourceType, sourceId, changedItems?: string[])
│   ├── If changedItems provided (incremental):
│   │   ├── Only re-index changed rows/chunks
│   │   └── Update existing embeddings
│   └── Else (full re-index):
│       └── Delete old index, create new
└── getIndexStatus(indexName: string)
    └── Return { exists, chunkCount, lastIndexed, sourceType, sourceId }
```

#### `app/api/records/[tableId]/access/agents/route.ts` (modifications)

```
POST /api/records/[tableId]/access/agents
├── Existing: Grant access, write to access.json
├── NEW: Check if ragEnabled in request body
├── If ragEnabled:
│   ├── Add ragEnabled: true to access entry
│   ├── Trigger indexing (async):
│   │   └── indexingService.indexSource('record', tableId)
│   └── Return { success, indexingStarted: true }
└── Write updated access.json
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Access system accepts `ragEnabled` parameter | POST with `ragEnabled: true`, verify access.json updated |
| AC-A.2 | Table rows are indexed when RAG enabled | Assign table with RAG, verify vector DB created |
| AC-A.3 | Document content is indexed when RAG enabled | Assign doc with RAG, verify vector DB created |
| AC-A.4 | Chunks are properly formatted | Verify chunks contain row data or doc sections |
| AC-A.5 | Embeddings are generated | Verify embeddings array matches chunk count |
| AC-A.6 | Vector store persists | Restart server, verify index still exists |
| AC-A.7 | Index metadata stored | Verify indexName, chunkCount, indexedAt tracked |

---

## Part B: RAG Retrieval and Agent Integration

### Goal

Enable agents to retrieve relevant context from assigned records/docs during chat. When a user asks a question, the system should query the vector store for relevant chunks and inject them into the agent's context.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/rag/services/retrieval-service.ts` | Create | Query vector store, retrieve chunks | ~150 |
| `app/api/rag/services/rag-context-service.ts` | Create | Load assigned sources, retrieve context for query | ~200 |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Modify | Inject RAG context before agent execution | ~80 |
| `app/api/rag/query/route.ts` | Create | API endpoint for RAG queries | ~60 |

### Pseudocode

#### `app/api/rag/services/retrieval-service.ts`

```
RetrievalService
├── retrieveContext(query: string, indexNames: string[], topK: number = 3)
│   ├── Embed query:
│   │   ├── embedMany({ values: [query], model })
│   │   └── Get queryEmbedding
│   ├── For each indexName:
│   │   ├── Query vector store:
│   │   │   └── vectorStore.querySimilar(indexName, queryEmbedding, topK)
│   │   └── Collect chunks with metadata
│   ├── Combine results from all indexes
│   ├── Sort by similarity score
│   └── Return top results with source attribution
└── formatContextForAgent(chunks: ChunkResult[])
    ├── Format as: "From [source]: [chunk text]"
    └── Return formatted context string
```

#### `app/api/rag/services/rag-context-service.ts`

```
RAGContextService
├── getAssignedSources(agentId: string, userId: string)
│   ├── Load all records with access for agentId
│   ├── Filter: access.ragEnabled === true
│   ├── Load all docs with access for agentId (if exists)
│   ├── Filter: access.ragEnabled === true
│   └── Return: { records: tableId[], docs: docId[] }
├── buildIndexNames(sources: AssignedSources)
│   ├── records.map(id => `records-${id}`)
│   ├── docs.map(id => `doc-${id}`)
│   └── Return indexNames array
└── retrieveContextForQuery(agentId: string, userId: string, query: string)
    ├── Get assigned sources
    ├── Build index names
    ├── Call retrievalService.retrieveContext(query, indexNames)
    └── Return formatted context
```

#### `app/api/workforce/[agentId]/chat/services/chat-service.ts` (modifications)

```
buildToolMap(userId, agentConfig)
├── Existing: Load custom tools, connection tools, workflow tools
└── Return toolMap

formatMessages(messages, context)
├── Existing: Format messages
└── Return formattedMessages

NEW: getRAGContext(agentId, userId, userMessage)
├── Extract query from last user message
├── Call ragContextService.retrieveContextForQuery(agentId, userId, query)
└── Return context string

MODIFIED: In chat route handler
├── Get RAG context: ragContext = getRAGContext(agentId, userId, lastMessage)
├── Build system prompt with RAG context:
│   └── systemPrompt = basePrompt + "\n\nRelevant context:\n" + ragContext
├── Format messages with enhanced system prompt
└── Continue with existing agent execution
```

#### `app/api/rag/query/route.ts`

```
POST /api/rag/query
├── Authenticate user
├── Parse body: { query, agentId?, indexNames?, topK }
├── If agentId provided:
│   ├── Get assigned sources for agent
│   └── Use those index names
├── If indexNames provided:
│   └── Use those directly
├── Call retrievalService.retrieveContext(query, indexNames, topK)
└── Return { chunks: ChunkResult[], sources: string[] }
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | RAG context retrieved for assigned sources | Query agent with RAG-enabled table, verify context retrieved |
| AC-B.2 | Multiple sources searched simultaneously | Agent with 2 RAG sources, verify both queried |
| AC-B.3 | Context injected into agent system prompt | Check agent response, verify it references RAG context |
| AC-B.4 | Chunks include source attribution | Verify chunks show which table/doc they came from |
| AC-B.5 | Top-K retrieval works | Verify only top 3-5 chunks returned per source |
| AC-B.6 | Query endpoint works independently | POST to /api/rag/query, verify results |
| AC-B.7 | No RAG if no sources assigned | Agent without RAG sources, verify no errors |

---

## Part C: Frontend UI for RAG Assignment

### Goal

Update the Records tab in the agent modal to show RAG status and allow users to enable RAG when assigning tables/docs.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab.tsx` | Modify | Add RAG checkbox to assignment flow | ~100 |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/components/RAGStatusBadge.tsx` | Create | Show RAG enabled/disabled badge | ~60 |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/components/IndexingProgress.tsx` | Create | Show indexing progress | ~80 |
| `app/(pages)/workforce/components/agent-modal/store/slices/ragSlice.ts` | Create | RAG state management | ~120 |

### Pseudocode

#### `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab.tsx` (modifications)

```
RecordsTab
├── Load assigned tables (existing)
├── For each table:
│   ├── Check access.json for ragEnabled
│   └── Display RAGStatusBadge
├── "+ Assign Table" button:
│   └── Opens dialog with:
│       ├── Table selection
│       ├── Permission selection (read/read_write)
│       └── NEW: [x] Enable RAG indexing checkbox
├── On assignment:
│   ├── POST to /api/records/[tableId]/access/agents
│   ├── Include ragEnabled in body
│   └── Show IndexingProgress if ragEnabled
└── Display indexing status for each table
```

#### `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/components/RAGStatusBadge.tsx`

```
RAGStatusBadge({ ragEnabled, indexing, lastIndexed })
├── Render:
│   ├── If indexing:
│   │   └── <Badge variant="info">Indexing...</Badge>
│   ├── If ragEnabled:
│   │   └── <Badge variant="success">RAG Enabled</Badge>
│   └── Else:
│       └── <Badge variant="secondary">RAG Disabled</Badge>
└── Show lastIndexed timestamp if available
```

#### `app/(pages)/workforce/components/agent-modal/store/slices/ragSlice.ts`

```
ragSlice
├── State:
│   ├── indexingStatus: Map<indexName, { status, progress, error }>
│   └── ragEnabled: Map<sourceId, boolean>
├── Actions:
│   ├── setRAGEnabled(sourceId, enabled)
│   ├── setIndexingStatus(indexName, status)
│   ├── fetchRAGStatus(agentId)
│   └── triggerIndexing(sourceType, sourceId)
└── Selectors:
    ├── isRAGEnabled(sourceId)
    └── getIndexingStatus(indexName)
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-C.1 | RAG checkbox appears in assignment dialog | Click "+ Assign Table", verify checkbox visible |
| AC-C.2 | RAG status shown for assigned tables | Verify badge displays enabled/disabled |
| AC-C.3 | Indexing progress displayed | Enable RAG, verify progress indicator |
| AC-C.4 | Assignment with RAG triggers indexing | Assign table with RAG, verify API called |
| AC-C.5 | Status updates after indexing completes | Wait for indexing, verify status updates |

---

## User Flows

### Flow 1: Enable RAG for Table

```
1. User opens Agent Modal → Records tab
2. User clicks "+ Assign Table"
3. Dialog shows:
   - Table selection dropdown
   - Permission: [ ] Read-only [x] Read/Write
   - [x] Enable RAG indexing
4. User confirms
5. System:
   - Grants access (existing)
   - Starts indexing (new)
   - Shows "Indexing..." badge
6. Indexing completes
7. Badge updates to "RAG Enabled"
```

### Flow 2: Agent Uses RAG in Chat

```
1. User asks: "What did stakeholders say about mobile?"
2. System:
   - Retrieves RAG context from "Stakeholder Interviews" table
   - Finds relevant rows mentioning "mobile"
   - Injects into agent system prompt
3. Agent responds with specific stakeholder feedback
4. Agent cites source: "Based on Stakeholder Interviews table..."
```

---

## Out of Scope

- **Vector store migration to PgVector**: Starting with LibSQL
- **Advanced chunking strategies**: Only recursive for MVP
- **RAG analytics dashboard**: Future enhancement
- **Manual re-indexing UI**: Auto-only for MVP
- **Cross-source joins**: Single-source queries only
- **Embedding model selection**: Fixed to OpenAI

---

## Open Questions

- [ ] Should RAG context be injected into every message, or only when query seems relevant?
- [ ] How many chunks per source? (Start with 3, make configurable)
- [ ] Should we show RAG context to users in chat? (Probably not, keep transparent)
- [ ] How to handle very large tables? (Pagination? Sampling?)
- [ ] Incremental indexing: How to detect changes efficiently?
- [ ] Should docs be indexed with frontmatter or without? (Start without)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| YYYY-MM-DD | Initial creation | TBD |

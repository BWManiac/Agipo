# RAG Integration for Records and Docs

**Status:** Draft  
**Priority:** P1  
**North Star:** Enables the Job Application Agent to use resume documents and job application records as RAG context. When user asks "What skills should I highlight for this job?", agent retrieves relevant sections from resume (via RAG) and matches them against job requirements stored in records.

---

## Problem Statement

Currently, agents can be assigned to records and docs, but they can only access them through explicit tool calls (e.g., `sys_table_read`, `sys_doc_search`). Agents don't have semantic understanding of the content—they can't answer questions like:

- "What were the main themes from last month's stakeholder interviews?"
- "Find resumes that match this job description"
- "What did we learn from the user research document?"

Without RAG, agents must:
1. Know exactly which tool to call
2. Know the exact structure/format of the data
3. Manually search through all records/docs to find relevant information

This limits agents to structured queries rather than natural language understanding of content.

---

## User Value

- **Semantic Search**: Agents understand the meaning of content, not just exact matches
- **Context-Aware Responses**: Agents can reference specific sections from documents or records when answering questions
- **Natural Language Queries**: Users can ask "What did stakeholders say about the mobile app?" instead of "Query table where topic='mobile app'"
- **Better Job Application Agent**: Resume tailoring becomes intelligent—agent finds relevant experience sections based on job requirements
- **Unified Knowledge Base**: Both records (structured data) and docs (unstructured text) become searchable knowledge sources
- **Automatic Context Injection**: When assigned records/docs, agents automatically have access to that knowledge via RAG

---

## User Flows

### Flow 1: Assign Record to Agent with RAG

```
1. User navigates to Agent Modal → Records tab
2. User clicks "+ Assign Table"
3. Dialog shows list of available tables
4. User selects "Stakeholder Interviews" table
5. System shows options:
   - [ ] Grant table access (read/write tools)
   - [x] Enable RAG indexing (semantic search)
6. User confirms assignment
7. System:
   - Grants table access (existing functionality)
   - Indexes all table rows for RAG (new)
   - Stores assignment in access.json
8. Agent now has RAG access to this table
```

### Flow 2: Agent Uses RAG During Chat

```
1. User asks agent: "What were the main concerns from stakeholders about the mobile app?"
2. Agent's RAG system:
   - Embeds user query
   - Searches vector DB for "Stakeholder Interviews" table
   - Retrieves top 3 relevant rows (e.g., rows mentioning "mobile app" and "concerns")
3. Agent receives context:
   - Row #1023: Mike Ross (Sales) - "Mobile App" - "Positive" - "Users love the new features"
   - Row #1015: Sarah Chen (CTO) - "Mobile App" - "Negative" - "Performance issues on Android"
4. Agent responds: "Based on stakeholder feedback, there's mixed sentiment. Sales reports positive user feedback, but CTO Sarah Chen raised performance concerns on Android."
5. Agent cites specific records in response
```

### Flow 3: Assign Document to Agent with RAG

```
1. User navigates to Agent Modal → Records tab (docs will be a record type)
2. User clicks "+ Assign Table"
3. Dialog shows both tables AND documents
4. User selects "User Research Report Q4" document
5. System:
   - Indexes document content (chunks markdown)
   - Creates embeddings
   - Stores in vector DB with index name "doc-{docId}"
6. Agent can now answer questions about the research report
```

### Flow 4: Automatic Re-indexing on Updates

```
1. User updates "Stakeholder Interviews" table (adds new row)
2. System detects change:
   - New row added → triggers re-indexing
   - Only new row is embedded (incremental)
3. Agent's RAG automatically includes new data
4. No manual re-indexing needed
```

### Flow 5: Multi-Source RAG Query

```
1. Agent has access to:
   - "Stakeholder Interviews" table (RAG enabled)
   - "User Research Report" document (RAG enabled)
   - "Product Roadmap" table (RAG enabled)
2. User asks: "What should we prioritize based on user feedback?"
3. Agent's RAG:
   - Searches all assigned sources simultaneously
   - Retrieves relevant chunks from each
   - Combines context from multiple sources
4. Agent synthesizes answer using all sources
```

---

## Code Areas

Domains/directories to research before implementation:

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/records/[tableId]/access/` | Record assignment system | `agents/route.ts`, `access.json` structure |
| `app/api/docs/[docId]/` | Document API (if exists) | Similar access pattern |
| `app/api/workforce/[agentId]/chat/` | Agent chat execution | How agents are created, how to inject RAG context |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Chat service | Where to inject RAG retrieval |
| Mastra RAG primitives | Document processing, embedding, vector storage | `MDocument`, `embedMany`, vector stores |
| `_tables/records/[tableId]/` | Record storage structure | `schema.json`, `records.json` format |
| `_tables/documents/[docId]/` | Document storage structure | `content.md` format |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Vector Store** | Start with file-based (LibSQL), migrate to PgVector later | Simple for MVP, Mastra supports LibSQL, can upgrade for scale |
| **Chunking Strategy** | Recursive chunking (512 tokens, 50 overlap) | Good balance for structured (records) and unstructured (docs) content |
| **Embedding Model** | OpenAI `text-embedding-3-small` | Cost-effective, good quality, Mastra supports it |
| **Index Naming** | `records-{tableId}` and `doc-{docId}` | Clear separation, easy to query specific sources |
| **RAG Integration Point** | Inject into agent's system prompt + tool | Both context injection and explicit retrieval tool |
| **Incremental Indexing** | Re-index only changed rows/docs | Performance: don't re-embed entire table on single row change |
| **Assignment Storage** | Extend `access.json` with `ragEnabled: boolean` | Minimal change to existing access system |
| **Docs as Records** | Phase 1: Separate indexing, Phase 2: Unified | Start separate, consolidate later when docs become record type |

---

## Constraints

- **Mastra RAG API**: Must use Mastra's RAG primitives (`MDocument`, `embedMany`, vector stores)
- **Existing Access System**: Must extend, not replace, the current `access.json` structure
- **Storage Location**: Vector embeddings stored alongside records/docs (in `_tables/` structure)
- **Agent Chat Integration**: RAG retrieval must happen during chat, not block execution
- **Cost Considerations**: Embedding generation has API costs; need incremental indexing
- **Performance**: RAG retrieval should be fast (<500ms) to not slow down chat responses
- **Docs Consolidation**: Eventually docs become a record type, but for now treat separately

---

## Success Criteria

- [ ] User can enable RAG when assigning table to agent
- [ ] System indexes all table rows when RAG is enabled
- [ ] System indexes document content when RAG is enabled
- [ ] Agent can retrieve relevant context from assigned records/docs during chat
- [ ] RAG retrieval happens automatically (no explicit tool call needed)
- [ ] Agent responses cite specific records/docs when using RAG context
- [ ] New rows added to table are automatically indexed
- [ ] Document updates trigger re-indexing
- [ ] RAG works for both structured (records) and unstructured (docs) content
- [ ] Multiple assigned sources are searched simultaneously
- [ ] Vector store persists across server restarts

---

## Out of Scope

- **Vector Store Migration**: Starting with LibSQL, PgVector migration is future work
- **Advanced Chunking**: Custom chunking strategies beyond recursive (future)
- **RAG Analytics**: Tracking retrieval quality, embedding costs (future)
- **Cross-Table Joins**: RAG across multiple tables in single query (future)
- **RAG for Workflows**: Workflow outputs as RAG sources (future)
- **User-Controlled Indexing**: Manual re-index triggers (auto-only for MVP)
- **Embedding Model Selection**: Fixed to OpenAI for MVP

---

## Open Questions

- **When to retrieve?** Always inject RAG context, or only when query seems to need it?
  - Option A: Always retrieve top 3 chunks for every message (simpler, more context)
  - Option B: Use query classification to decide when to retrieve (more efficient)
- **How much context?** How many chunks to retrieve per source?
  - Start with 3-5 chunks per source, make configurable later
- **Context injection method?** System prompt vs. message context vs. tool?
  - Use system prompt for background context, tool for explicit retrieval
- **Incremental indexing strategy?** How to detect changes?
  - For records: Compare row count/timestamps
  - For docs: Compare content hash or last modified
- **Vector store location?** Same directory as records/docs, or centralized?
  - Start with co-located (simpler), can centralize later
- **Docs consolidation timeline?** When do docs become a record type?
  - Separate implementation for now, consolidate in Phase 2

---

## Technical Architecture (High-Level)

### Backend Changes

1. **RAG Indexing Service**
   - `app/api/rag/services/indexing-service.ts`
   - Handles document chunking, embedding generation, vector storage
   - Supports both records (table rows) and docs (markdown content)

2. **Vector Store Integration**
   - Use Mastra's LibSQL vector store (file-based)
   - Store embeddings in `_tables/records/[tableId]/vectors.db` (co-located)
   - Index naming: `records-{tableId}`, `doc-{docId}`

3. **Access System Extension**
   - Extend `access.json` to include `ragEnabled: boolean`
   - When RAG enabled, trigger indexing on assignment

4. **RAG Retrieval Service**
   - `app/api/rag/services/retrieval-service.ts`
   - Query vector store for relevant chunks
   - Combine results from multiple sources

5. **Agent Chat Integration**
   - Modify `chat-service.ts` to:
     - Load assigned records/docs with RAG enabled
     - Retrieve relevant chunks for user query
     - Inject into system prompt or message context

6. **Incremental Indexing**
   - Watch for record/doc changes
   - Re-index only changed content
   - Background job or webhook-based

### Frontend Changes

1. **Assignment UI Enhancement**
   - Modify RecordsTab assignment dialog
   - Add checkbox: "Enable RAG indexing"
   - Show indexing status/progress

2. **RAG Status Indicators**
   - Show which tables/docs have RAG enabled
   - Display last indexed timestamp
   - Show re-indexing progress

---

## References

- [Mastra RAG Overview](https://mastra.ai/docs/rag/overview) - Core RAG primitives
- [Mastra Chunking and Embedding](https://mastra.ai/docs/rag/chunking-and-embedding) - Document processing
- [Mastra Vector Databases](https://mastra.ai/docs/rag/vector-databases) - Storage options
- Existing implementation: `app/api/records/[tableId]/access/agents/route.ts` (access system)
- Related feature: `_docs/Product/Features/02-Shared-Memory-Records.md` (records philosophy)
- Related task: `_docs/_tasks/_completed/9-mastra-migration.md` (RAG for Records section)

---

## Related Roadmap Items

- **Docs as Record Type**: Consolidating docs into records (affects RAG indexing)
- **Advanced RAG**: Multi-hop retrieval, query rewriting, reranking
- **RAG Analytics**: Tracking retrieval quality, embedding costs, query patterns
- **Workflow RAG**: Using workflow outputs as RAG sources

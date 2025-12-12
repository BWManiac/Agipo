# Task 25: Records & RAG Integration — Product Spec

**Status:** Planning
**Date:** December 12, 2025
**Goal:** Transform Records into a unified knowledge management hub with folder organization and RAG-powered semantic search for agents.

---

## 1. Executive Summary

Today, Records and Docs are separate features with flat catalogs. Users navigate between `/records` and `/docs` to manage related content. Agents can access data via explicit tool calls but have no semantic understanding—they can't answer "What were the main themes from stakeholder interviews?" without manual queries.

This task delivers two interconnected capabilities:

1. **Unified Folder-Based Interface** — One place to manage all structured data (tables) and unstructured content (documents) with Google Drive-like folder organization
2. **RAG-Powered Agent Context** — When agents are assigned records/docs with RAG enabled, they can semantically search and retrieve relevant context during conversations

**End state:** Users organize their data in folders under `/records`. When chatting with agents, relevant context from assigned tables and documents is automatically retrieved and injected—no explicit tool calls needed. Agents can answer questions like "What skills from my resume match this job?" by semantically searching the resume document.

---

## 2. Product Requirements

### 2.1 Folder Organization

**Definition:** A hierarchical folder structure for organizing tables and documents.

**Why it matters:** As users accumulate tables and documents, flat lists become unmanageable. Folders provide the familiar mental model of Google Drive/Notion.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-1.1 | Users can create folders to organize content | P0 |
| PR-1.2 | Users can nest folders (subfolder support) | P0 |
| PR-1.3 | Users can move tables/documents between folders | P0 |
| PR-1.4 | Folders display in a tree structure sidebar | P0 |
| PR-1.5 | Breadcrumb navigation shows current folder path | P0 |
| PR-1.6 | Both tables and documents appear in same folder view | P0 |
| PR-1.7 | Search filters across all folders | P1 |
| PR-1.8 | Root folder shows all content for backward compatibility | P0 |

### 2.2 Unified Item Display

**Definition:** Tables and documents displayed together with type distinction.

**Why it matters:** Users shouldn't think about "records vs docs"—they think about "my data and documents."

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-2.1 | Items show type icon (table icon vs document icon) | P0 |
| PR-2.2 | Card layout displays item type, name, metadata | P0 |
| PR-2.3 | "New" button offers: Folder, Table, Document | P0 |
| PR-2.4 | Item cards show record count (tables) or word count (docs) | P1 |
| PR-2.5 | Right-click context menu: Move, Rename, Delete | P1 |
| PR-2.6 | Items can have same name in different folders | P1 |

### 2.3 RAG Indexing

**Definition:** Automatic embedding and indexing of records/documents for semantic search.

**Why it matters:** This is what enables agents to "understand" content rather than just query it structurally.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-3.1 | Tables can be indexed for RAG (rows → embeddings) | P0 |
| PR-3.2 | Documents can be indexed for RAG (markdown → embeddings) | P0 |
| PR-3.3 | Chunking uses recursive strategy (512 tokens, 50 overlap) | P0 |
| PR-3.4 | Embeddings use OpenAI text-embedding-3-small | P0 |
| PR-3.5 | Vector store uses LibSQL (file-based) | P0 |
| PR-3.6 | Index naming: `{agentId}-{sourceId}` | P0 |
| PR-3.7 | Indexing happens async after assignment with RAG enabled | P0 |
| PR-3.8 | New rows/content updates trigger re-indexing | P1 |

### 2.4 RAG Retrieval

**Definition:** Semantic search and context injection during agent conversations.

**Why it matters:** This is the user-facing value—agents that understand your data.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-4.1 | Agent chat retrieves relevant chunks from RAG sources | P0 |
| PR-4.2 | Retrieved context injected into system prompt | P0 |
| PR-4.3 | Multiple sources searched simultaneously | P0 |
| PR-4.4 | Top 5 chunks retrieved per source | P0 |
| PR-4.5 | Agent responses can cite specific sources | P1 |
| PR-4.6 | RAG context retrieval is automatic (no tool call needed) | P0 |
| PR-4.7 | Query similarity threshold configurable | P2 |

### 2.5 Agent Assignment UI

**Definition:** Functional Records tab in Agent Modal for assigning tables/docs with RAG.

**Why it matters:** Currently this is a mock. Users need to actually assign data sources to agents.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-5.1 | Records tab shows assigned tables and documents | P0 |
| PR-5.2 | "Assign Table" button opens selection dialog | P0 |
| PR-5.3 | Assignment dialog shows available tables and documents | P0 |
| PR-5.4 | User can select permission level (read-only, read-write) | P0 |
| PR-5.5 | User can toggle "Enable RAG indexing" | P0 |
| PR-5.6 | RAG status badge shows enabled/disabled/indexing | P0 |
| PR-5.7 | User can remove assignments | P1 |
| PR-5.8 | Indexing progress shown when RAG enabled | P1 |

---

## 3. Acceptance Criteria

### Folder Organization (8 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1 | Folder sidebar shows folder tree | Navigate to /records, verify tree visible |
| AC-2 | Can create folder in any location | Click "New" → "Folder", verify created |
| AC-3 | Can create nested subfolders | Create folder inside folder |
| AC-4 | Breadcrumbs show current path | Navigate into folder, verify breadcrumbs |
| AC-5 | Clicking breadcrumb navigates to folder | Click breadcrumb segment |
| AC-6 | Can move item to different folder | Right-click → Move, select target |
| AC-7 | Search filters items across all folders | Type in search, verify results |
| AC-8 | Existing tables appear in root folder | Open root, verify legacy data |

### Unified Display (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-9 | Tables show table icon | Check icon on table cards |
| AC-10 | Documents show document icon | Check icon on doc cards |
| AC-11 | "New" dropdown shows Folder, Table, Document | Click "New" button |
| AC-12 | Creating table in folder places it there | Create table in subfolder |
| AC-13 | Creating document in folder places it there | Create doc in subfolder |

### RAG Indexing (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-14 | Enabling RAG on assignment triggers indexing | Assign with RAG, check vector store |
| AC-15 | Table rows are chunked and embedded | Query vector store, verify chunks |
| AC-16 | Document content is chunked and embedded | Query vector store, verify chunks |
| AC-17 | Vector store persists across restarts | Restart server, query store |
| AC-18 | New row triggers incremental re-index | Add row, verify new embedding |

### RAG Retrieval (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-19 | Chat retrieves RAG context automatically | Ask semantic question, verify relevance |
| AC-20 | Agent uses context in response | Ask "What did stakeholders say about X?" |
| AC-21 | Multiple sources searched | Assign 2 tables with RAG, verify both queried |
| AC-22 | No RAG if no sources assigned | Agent without RAG, verify no retrieval |
| AC-23 | Agent can cite source in response | Check response attribution |

### Agent Assignment (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-24 | Records tab shows real assigned items | Assign table, refresh, verify shown |
| AC-25 | "Assign Table" opens selection dialog | Click button, verify dialog |
| AC-26 | Dialog shows tables AND documents | Check list in dialog |
| AC-27 | RAG toggle visible in assignment | Check checkbox in dialog |
| AC-28 | RAG status badge updates after indexing | Watch badge during indexing |

### Backwards Compatibility (3 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-29 | Existing tables still accessible | Open old table, verify data |
| AC-30 | Existing documents still accessible | Open old doc, verify content |
| AC-31 | Existing agent tool access still works | Chat with agent, use sys_table_read |

---

## 4. User Flows

### Flow 1: Organize Content in Folders

```
1. User navigates to /records
2. Sees root folder with existing tables and documents
3. User clicks "New" → "Folder"
4. Creates "Job Applications" folder
5. User right-clicks "Resume.md" document
6. Selects "Move to..." → "Job Applications"
7. Document moves to folder
8. User navigates to "Job Applications" folder
9. Sees resume there
10. User clicks "New" → "Table"
11. Creates "Applications Tracker" table in folder
```

### Flow 2: Enable RAG for Agent

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

### Flow 3: Agent Uses RAG Context

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

### Flow 4: Browse Folder Structure

```
1. User navigates to /records
2. Sees folder tree in sidebar:
   - All Records (root)
   - Job Applications
     - Cover Letters
   - Research
3. User clicks "Job Applications"
4. Main area shows folder contents
5. Breadcrumbs show: Records > Job Applications
6. User clicks "Cover Letters" subfolder
7. Breadcrumbs update: Records > Job Applications > Cover Letters
8. User clicks "Job Applications" in breadcrumbs
9. Navigates back to parent folder
```

---

## 5. Design Decisions

### 5.1 Decisions to Make

| ID | Question | Options | Current Lean | Decided? |
|----|----------|---------|--------------|----------|
| DD-1 | Where does folder tree go? | A: Left sidebar, B: Inline (above grid) | A: Left sidebar (Google Drive pattern) | No |
| DD-2 | Folder tree default state? | A: Expanded, B: Collapsed | A: Expanded | No |
| DD-3 | How to display item types? | A: Icon only, B: Icon + badge, C: Separate sections | A: Icon only (clean) | No |
| DD-4 | RAG toggle in assignment dialog? | A: Checkbox, B: Switch toggle | A: Checkbox (consistent) | No |
| DD-5 | Migration of existing items? | A: Automatic on first load, B: Manual | A: Automatic (seamless) | No |
| DD-6 | What happens to /docs route? | A: Redirect to /records, B: Show filtered view | A: Redirect (consolidation) | No |

### 5.2 Decision Log

| Date | Decision | Choice | Rationale |
|------|----------|--------|-----------|
| - | - | - | - |

---

## 6. UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| 01-folder-view | Main folder contents view | Folder tree sidebar + card grid + breadcrumbs |
| 02-item-cards | Item card designs | Table card vs Document card with type icons |
| 03-create-dropdown | New button dropdown | Options: Folder, Table, Document |
| 04-move-dialog | Move item dialog | Folder tree picker for destination |
| 05-assignment-dialog | Assign to agent dialog | Table/doc selection, permission, RAG toggle |
| 06-rag-status | RAG status indicators | Badges: Disabled, Indexing, Active |
| 07-agent-records-tab | Agent modal Records tab | Assigned items list with RAG badges |

### Mockup Location

```
_docs/_tasks/25-records-rag-integration/UXD/
├── 01-folder-view.html
├── 02-item-cards.html
├── 03-create-dropdown.html
├── 04-move-dialog.html
├── 05-assignment-dialog.html
├── 06-rag-status.html
├── 07-agent-records-tab.html
├── README.md
└── Frontend-Backend-Mapping.md
```

### Exit Criteria for UXD Phase

- [ ] All required mockups complete
- [ ] Each mockup shows all P0 requirements
- [ ] Stakeholder review complete
- [ ] Design decisions finalized

---

## 7. Success Criteria

| Criterion | How to Validate | Priority |
|-----------|-----------------|----------|
| Users can organize content in folders | Create folders, move items, navigate | P0 |
| Tables and docs appear in unified view | Both types visible in folder | P0 |
| RAG-enabled sources provide semantic context | Ask semantic question, get relevant answer | P0 |
| Agent assignment UI is functional | Assign table with RAG, verify indexing | P0 |
| Existing data preserved after migration | All tables and docs accessible | P0 |
| RAG retrieval doesn't slow down chat | Response latency < 1s for retrieval | P1 |

**North Star:** Users can organize their knowledge in folders and have agents intelligently understand and reference that knowledge during conversations—no manual queries needed.

---

## 8. Out of Scope

- **Vector store migration to PgVector** — Starting with LibSQL
- **Multi-table joins in RAG** — Single-source queries only
- **RAG analytics dashboard** — Future enhancement
- **Real-time collaborative editing** — Future enhancement
- **Bulk folder operations** — Multi-select move/delete
- **Custom embedding models** — Fixed to OpenAI for MVP
- **Advanced chunking strategies** — Only recursive for MVP

---

## 9. Phased Approach

### Phase 1: Folder Backend Infrastructure
- Folder CRUD services
- Storage structure (`_tables/records/_root/[folderId]/`)
- Migration of existing items
- Folder tree building

### Phase 2: Folder Frontend UI
- FolderView component
- FolderTree sidebar
- Breadcrumbs navigation
- ItemCard for tables + docs
- CreateFolderDialog, MoveItemDialog

### Phase 3: RAG Indexing Infrastructure
- Vector store wrapper (LibSQL)
- Record indexer (rows → embeddings)
- Document indexer (markdown → embeddings)
- Extend access.json with ragEnabled

### Phase 4: RAG Retrieval & Chat Integration
- Retrieval service
- RAG context service
- Modify chat-service for context injection

### Phase 5: Agent Assignment UI
- Make Records tab functional
- Assignment dialog with RAG toggle
- RAG status badges
- Indexing progress indicators

---

## 10. Related Documents

- **RAG Roadmap:** `_docs/Product/ROADMAP/rag-integration/01-RAG-for-Records-and-Docs.md`
- **Records Consolidation:** `_docs/Product/ROADMAP/records-consolidation/01-Records-and-Docs-Consolidation.md`
- **Mastra RAG Docs:** https://mastra.ai/docs/rag/overview
- **Domain Principles:** `app/api/DOMAIN_PRINCIPLES.md`
- **Records Feature:** `_docs/_tasks/_completed/20-records-feature/`

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

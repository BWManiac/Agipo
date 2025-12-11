# Task 01.1: RAG Integration — Research Log

**Status:** In Progress  
**Date:** December 2024  
**Parent Task:** `_docs/Product/ROADMAP/rag-integration/01-RAG-for-Records-and-Docs.md`

---

## How to Use This Document

This is a **research log** for discovering facts about Mastra's RAG primitives.

**Each research question has:**
1. **The Question** — What we need to find out
2. **Why It Matters** — Which product requirement this unlocks
3. **Answer** — What we discovered (to be filled)
4. **Primitive** — The exact function/method we'll use
5. **Source** — Where we found the answer

**Philosophy:** Mastra's RAG API is immutable. We discover what they provide and adapt our implementation.

**Status Key:** ❓ Not Researched | 🔍 In Progress | ✅ Answered | ⚠️ Blocked

---

## Quick Reference

| Question | Unlocks Requirement | Status |
|----------|---------------------|--------|
| [RQ-1: MDocument creation](#rq-1-mdocument-creation) | Create documents from text | ❓ |
| [RQ-2: Chunking API](#rq-2-chunking-api) | Chunk documents for embedding | ❓ |
| [RQ-3: Embedding generation](#rq-3-embedding-generation) | Generate embeddings | ❓ |
| [RQ-4: Vector store operations](#rq-4-vector-store-operations) | Store and query embeddings | ❓ |
| [RQ-5: LibSQL vector store](#rq-5-libsql-vector-store) | Use file-based vector storage | ❓ |

---

## Part 1: Mastra RAG Primitives Research

### RQ-1: MDocument Creation

**Why It Matters:** PR-1.1 (Index Records/Docs) — Need to create MDocument instances from table rows and markdown content.

**Status:** ✅ Answered

**Question:**
1. What's the API for `MDocument.fromText()`?
2. How do we create documents from structured data (table rows)?
3. What metadata can we attach to documents?
4. How do we handle markdown documents with frontmatter?

**Answer:**
```typescript
// MDocument static factory methods
static fromText(content: string): MDocument
static fromHTML(content: string): MDocument
static fromMarkdown(content: string): MDocument
static fromJSON(content: string): MDocument

// Example: Create from text
const doc = MDocument.fromText("Climate change challenges global agriculture.");

// Example: Create from markdown with frontmatter
const markdownContent = `---
title: My Document
author: John Doe
date: 2024-12-10
---

# Main Content
This is the document content...`;

const mdDoc = MDocument.fromMarkdown(markdownContent);
// Frontmatter is preserved as metadata during chunking

// For structured data (table rows), use JSON
const tableData = {
  id: "row-123",
  name: "Product A",
  description: "Product description",
  price: 99.99
};
const jsonDoc = MDocument.fromJSON(JSON.stringify(tableData));
```

**Primitive Discovered:**
- Function/Method: `MDocument.fromText()`, `MDocument.fromMarkdown()`, `MDocument.fromJSON()`
- Signature: `(content: string) => MDocument`
- Return type: `MDocument` instance

**Implementation Note:** Use `fromJSON()` for table rows, `fromMarkdown()` for documentation files. Frontmatter in markdown is automatically extracted as metadata.

**Source:** https://mastra.ai/docs/rag/chunking-and-embedding

---

### RQ-2: Chunking API

**Why It Matters:** PR-1.2 (Chunk Documents) — Need to chunk documents using recursive strategy (512 tokens, 50 overlap).

**Status:** ✅ Answered

**Question:**
1. What's the API for `doc.chunk()`?
2. How do we specify chunking strategy (recursive)?
3. How do we set chunk size (512 tokens) and overlap (50)?
4. What's the return type (array of chunks)?

**Answer:**
```typescript
// Chunking method signature
chunk(options: {
  strategy: "recursive" | "sentence" | "semantic-markdown",
  maxSize: number,        // Maximum chunk size in tokens
  overlap: number,        // Overlap between chunks
  separators?: string[],  // Optional custom separators
  extract?: {
    metadata?: boolean    // Extract metadata from chunks
  }
}): Promise<Chunk[]>

// Example usage with recursive strategy
const doc = MDocument.fromText("Your document content...");
const chunks = await doc.chunk({
  strategy: "recursive",
  maxSize: 512,    // 512 tokens per chunk
  overlap: 50,     // 50 token overlap
  separators: ["\n\n", "\n", " ", ""],  // Default separators
  extract: {
    metadata: true  // Extract metadata
  }
});

// Chunk type structure
interface Chunk {
  text: string;           // The chunk content
  metadata?: Record<string, any>;  // Optional metadata
  position?: number;      // Position in original document
}
```

**Primitive Discovered:**
- Function/Method: `doc.chunk()`
- Strategy options: `"recursive"`, `"sentence"`, `"semantic-markdown"`
- Parameters: `maxSize`, `overlap`, `separators`, `extract`
- Return type: `Promise<Chunk[]>`

**Implementation Note:** Use `recursive` strategy with `maxSize: 512` and `overlap: 50` for general text. For markdown docs, consider `semantic-markdown` strategy.

**Source:** https://mastra.ai/docs/rag/chunking-and-embedding** 

---

### RQ-3: Embedding Generation

**Why It Matters:** PR-1.3 (Generate Embeddings) — Need to generate embeddings for chunks using OpenAI model.

**Status:** ✅ Answered

**Question:**
1. What's the API for `embedMany()`?
2. How do we specify the embedding model (text-embedding-3-small)?
3. What's the input format (array of strings)?
4. What's the output format (array of number arrays)?

**Answer:**
```typescript
// Import from 'ai' package
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

// embedMany signature
embedMany({
  model: EmbeddingModel,
  values: string[]
}): Promise<{
  embeddings: number[][],  // Array of embedding vectors
  usage?: {               // Optional usage stats
    promptTokens: number,
    totalTokens: number
  }
}>

// Example usage with OpenAI
const { embeddings } = await embedMany({
  model: openai.embedding("text-embedding-3-small"),
  values: chunks.map(chunk => chunk.text)  // Array of strings
});

// OpenAI text-embedding-3-small outputs 1536 dimensions
// embeddings[0].length === 1536

// Alternative: Use dimension reduction
const { embeddings } = await embedMany({
  model: openai.embedding("text-embedding-3-small", {
    outputDimensionality: 512  // Reduce to 512 dimensions
  }),
  values: chunks.map(chunk => chunk.text)
});
```

**Primitive Discovered:**
- Function/Method: `embedMany()` from 'ai' package
- Model configuration: `openai.embedding("text-embedding-3-small")`
- Input: Array of strings (`string[]`)
- Output: `{ embeddings: number[][], usage?: {...} }`

**Implementation Note:** OpenAI's text-embedding-3-small outputs 1536-dimensional vectors by default. Use `outputDimensionality` to reduce if needed.

**Source:** https://mastra.ai/docs/rag/chunking-and-embedding** 

---

### RQ-4: Vector Store Operations

**Why It Matters:** PR-1.4 (Store and Query) — Need to store embeddings and query for similar chunks.

**Status:** ✅ Answered

**Question:**
1. What's the API for `vectorStore.upsert()`?
2. What's the API for `vectorStore.query()`?
3. How do we specify index names?
4. What's the query format (query vector, topK)?

**Answer:**
```typescript
// Upsert method signature
upsert({
  indexName: string,
  vectors: number[][],    // Array of embedding vectors
  metadata: Array<{
    text: string,         // Original text
    id?: string,          // Optional unique ID
    source?: string,      // Document source
    category?: string,    // Category/tag
    timestamp?: number,   // Creation time
    // ... any other metadata
  }>
}): Promise<void>

// Query method signature
query({
  indexName: string,
  queryVector: number[],   // Query embedding vector
  topK?: number,           // Number of results (default: 10)
  filter?: Record<string, any>,  // MongoDB-style filters
  includeVector?: boolean,  // Include vectors in results (default: false)
  minScore?: number        // Minimum similarity score (default: 0)
}): Promise<QueryResult[]>

// QueryResult type
interface QueryResult {
  id: string;
  score: number;          // Similarity score (0-1 for cosine)
  metadata: Record<string, any>;
  vector?: number[];      // If includeVector: true
}

// Example usage
await store.upsert({
  indexName: "my-docs",
  vectors: embeddings,
  metadata: chunks.map((chunk, i) => ({
    text: chunk.text,
    id: `chunk-${i}`,
    source: "document.md",
    timestamp: Date.now()
  }))
});

const results = await store.query({
  indexName: "my-docs",
  queryVector: queryEmbedding,
  topK: 5,
  filter: { source: "document.md" },
  minScore: 0.7
});
```

**Primitive Discovered:**
- Upsert method: `store.upsert({ indexName, vectors, metadata })`
- Query method: `store.query({ indexName, queryVector, topK, filter })`
- Index naming: Specified via `indexName` parameter in both methods

**Implementation Note:** Use MongoDB-style filters for metadata queries. Cosine similarity returns scores 0-1.

**Source:** https://mastra.ai/reference/vectors/libsql** 

---

### RQ-5: LibSQL Vector Store

**Why It Matters:** PR-1.5 (File-Based Storage) — Need to use LibSQL vector store for MVP.

**Status:** ✅ Answered

**Question:**
1. How do we create a LibSQL vector store instance?
2. Where are vector databases stored (file path)?
3. How do we initialize a store for a specific index?
4. What's the file format/structure?

**Answer:**
```typescript
// Import from @mastra/libsql package
import { LibSQLVector } from "@mastra/libsql";

// Constructor signature
class LibSQLVector {
  constructor(options: {
    connectionUrl: string,     // File path or connection string
    authToken?: string,        // Optional for Turso cloud
    syncUrl?: string,          // Optional sync URL
    syncInterval?: number      // Optional sync interval
  })
}

// Connection URL formats:
// 1. In-memory: ":memory:"
// 2. Local file: "file:path/to/database.db"
// 3. Turso cloud: "libsql://your-database.turso.io"

// Example: Create file-based store
const store = new LibSQLVector({
  connectionUrl: "file:_tables/vectors/rag-index.db"
});

// Initialize index before use
await store.createIndex({
  indexName: "documents",
  dimension: 1536,        // Must match embedding dimensions
  metric: "cosine"        // Only cosine supported currently
});

// File structure: SQLite database with:
// - Vector tables for each index
// - Metadata stored alongside vectors
// - Cosine similarity via LibSQL vector extension

// Example: Per-agent vector stores
const agentStore = new LibSQLVector({
  connectionUrl: `file:_tables/agents/${agentId}/vectors.db`
});

// List existing indexes
const indexes = await store.listIndexes();
// Returns: [{ name: "documents", dimension: 1536, metric: "cosine" }]
```

**Primitive Discovered:**
- Store creation: `new LibSQLVector({ connectionUrl })`
- File location: Specified via `file:path/to/database.db`
- Initialization: `await store.createIndex({ indexName, dimension, metric })`
- File format: SQLite database with LibSQL vector extension

**Implementation Note:** Use file-based storage pattern like `_tables/[domain]/vectors.db`. Create index once before first use. Dimension must match embedding model output.

**Source:** https://mastra.ai/reference/vectors/libsql** 

---

## Summary

### Primitives We'll Use

| What | Primitive | From | Confirmed? |
|------|-----------|------|------------|
| Create document | `MDocument.fromText()`, `.fromMarkdown()`, `.fromJSON()` | Mastra | ✅ |
| Chunk document | `doc.chunk({ strategy, maxSize, overlap })` | Mastra | ✅ |
| Generate embeddings | `embedMany({ model, values })` | ai package | ✅ |
| Store embeddings | `store.upsert({ indexName, vectors, metadata })` | @mastra/libsql | ✅ |
| Query vector store | `store.query({ indexName, queryVector, topK })` | @mastra/libsql | ✅ |
| Create LibSQL store | `new LibSQLVector({ connectionUrl })` | @mastra/libsql | ✅ |

### Blockers & Dead Ends

| Issue | Impact | Resolution |
|-------|--------|------------|
| - | - | - |

### Key Learnings

1. **LibSQL for file-based storage** - Use `file:path.db` format for local SQLite-based vector storage, perfect for MVP without external dependencies
2. **Cosine similarity only** - LibSQL currently only supports cosine similarity, which is standard for most RAG use cases
3. **MongoDB-style filters** - Query filtering uses MongoDB-style syntax via sift library, providing consistent API across vector stores 

---

## Exit Criteria

- [x] All RQ questions answered
- [x] Summary table complete
- [x] No unresolved blockers
- [x] Key learnings documented

**Next Step:** Implementation Plan - Ready to implement RAG integration with LibSQL vector store

---

## Resources Used

- [Mastra RAG Overview](https://mastra.ai/docs/rag/overview)
- [Mastra Chunking and Embedding](https://mastra.ai/docs/rag/chunking-and-embedding)
- [Mastra Vector Databases](https://mastra.ai/docs/rag/vector-databases)

# RAG Integration - Implementation Phases

## Phase 1: Vector Store & Indexing

### Goal
Set up LibSQL vector store and implement document indexing.

### File Impact
- Create: `app/api/rag/services/vector-store.ts`
- Create: `app/api/rag/services/indexing-service.ts`
- Create: `app/api/rag/services/record-indexer.ts`

### Pseudocode
```typescript
// vector-store.ts
import { LibSQLStore } from "@mastra/core";

export async function getVectorStore(indexName: string) {
  return new LibSQLStore({
    path: `_tables/vectors/${indexName}.db`
  });
}

// indexing-service.ts
export async function indexRecords(tableId: string, agentId: string) {
  const records = await loadRecords(tableId);
  const indexName = `${agentId}-${tableId}`;
  
  for (const record of records) {
    const doc = MDocument.fromJSON(JSON.stringify(record));
    const chunks = await doc.chunk({ 
      strategy: 'recursive',
      size: 512,
      overlap: 50
    });
    
    const embeddings = await embedMany({
      values: chunks.map(c => c.content),
      model: 'text-embedding-3-small'
    });
    
    const store = await getVectorStore(indexName);
    await store.upsert({
      indexName,
      vectors: embeddings.map((e, i) => ({
        id: chunks[i].id,
        vector: e.embedding,
        metadata: { chunk: chunks[i].content }
      }))
    });
  }
}
```

---

## Phase 2: RAG Retrieval & Chat Integration

### Goal
Implement retrieval and inject context into agent chat.

### File Impact
- Create: `app/api/rag/services/retrieval-service.ts`
- Create: `app/api/workforce/[agentId]/chat/services/rag-context-service.ts`
- Modify: `app/api/workforce/[agentId]/chat/services/chat-service.ts`

### Pseudocode
```typescript
// retrieval-service.ts
export async function retrieve(query: string, indexNames: string[]) {
  const queryEmbedding = await embed({
    value: query,
    model: 'text-embedding-3-small'
  });
  
  const results = [];
  for (const indexName of indexNames) {
    const store = await getVectorStore(indexName);
    const chunks = await store.query({
      indexName,
      queryVector: queryEmbedding.embedding,
      topK: 5
    });
    results.push(...chunks);
  }
  
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)
    .map(r => r.metadata.chunk);
}

// In chat-service.ts
const ragContext = await getRagContext(agentId, messages[0].content);
if (ragContext.length > 0) {
  systemPrompt += `\n\nRelevant Context:\n${ragContext.join('\n')}`;
}
```

---

## Phase 3: Frontend RAG Controls

### Goal
Add UI for enabling RAG on assignments.

### File Impact
- Modify: `RecordsTab.tsx`
- Create: `RAGStatusBadge.tsx`

### Pseudocode
```tsx
// In assignment dialog
<Checkbox
  label="Enable RAG (Semantic Search)"
  checked={ragEnabled}
  onChange={setRagEnabled}
/>

// RAGStatusBadge.tsx
export function RAGStatusBadge({ enabled, indexed }) {
  if (!enabled) return null;
  
  return (
    <Badge color={indexed ? 'green' : 'yellow'}>
      {indexed ? 'RAG Active' : 'Indexing...'}
    </Badge>
  );
}
```

---

## Success Metrics
- Indexing speed: 100 records/second
- Retrieval latency < 200ms
- Relevant context in top 5 chunks > 80%
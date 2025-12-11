# RAG Integration - API Specification

## Indexing Operations

### Trigger Table Indexing
```http
POST /api/rag/index/records/[tableId]
{
  "agentId": "agent-123",
  "force": false  // Force re-index if already exists
}
```

Response:
```json
{
  "success": true,
  "indexName": "agent-123-table-456",
  "status": "indexing",
  "estimatedRows": 1000
}
```

### Trigger Document Indexing
```http
POST /api/rag/index/docs/[docId]
{
  "agentId": "agent-123",
  "force": false
}
```

Response:
```json
{
  "success": true,
  "indexName": "agent-123-doc-789",
  "status": "indexing",
  "estimatedChunks": 50
}
```

### Get Index Status
```http
GET /api/rag/index/[indexName]/status
```

Response:
```json
{
  "indexName": "agent-123-table-456",
  "status": "ready",
  "chunkCount": 1523,
  "lastIndexed": "2024-12-11T10:30:00Z",
  "sourceType": "record",
  "sourceId": "table-456"
}
```

---

## Assignment with RAG

### Assign Table with RAG
```http
POST /api/records/[tableId]/access/agents
{
  "agentId": "agent-123",
  "permission": "read",
  "ragEnabled": true  // NEW parameter
}
```

Response:
```json
{
  "success": true,
  "access": {
    "agentId": "agent-123",
    "permission": "read",
    "ragEnabled": true,
    "grantedAt": "2024-12-11T10:00:00Z"
  },
  "indexing": {
    "started": true,
    "indexName": "agent-123-table-456"
  }
}
```

### Update RAG Settings
```http
PATCH /api/records/[tableId]/access/agents/[agentId]
{
  "ragEnabled": false
}
```

---

## Query Operations

### Query Vector Store
```http
POST /api/rag/query
{
  "query": "What did stakeholders say about mobile?",
  "agentId": "agent-123",  // Optional - uses agent's assigned sources
  "indexNames": ["agent-123-table-456"],  // Optional - explicit indexes
  "topK": 5,
  "minScore": 0.7
}
```

Response:
```json
{
  "results": [
    {
      "chunk": "Stakeholder interview: Mobile app is critical for field workers...",
      "score": 0.92,
      "metadata": {
        "source": "table-456",
        "rowId": "row-123",
        "sourceType": "record"
      }
    },
    {
      "chunk": "User feedback: Mobile experience needs improvement...",
      "score": 0.87,
      "metadata": {
        "source": "table-456",
        "rowId": "row-456",
        "sourceType": "record"
      }
    }
  ],
  "indexesSearched": 1,
  "totalChunks": 2
}
```

### Get Agent RAG Sources
```http
GET /api/workforce/[agentId]/rag/sources
```

Response:
```json
{
  "sources": [
    {
      "type": "record",
      "id": "table-456",
      "name": "Stakeholder Interviews",
      "ragEnabled": true,
      "indexed": true,
      "chunkCount": 1523,
      "lastIndexed": "2024-12-11T10:30:00Z"
    },
    {
      "type": "doc",
      "id": "doc-789",
      "name": "Product Requirements",
      "ragEnabled": true,
      "indexed": false,
      "indexing": true
    }
  ]
}
```

---

## Chat with RAG Context

### Enhanced Chat Endpoint
```http
POST /api/workforce/[agentId]/chat
{
  "messages": [
    {
      "role": "user",
      "content": "What are the main customer pain points?"
    }
  ],
  "ragOptions": {  // Optional RAG configuration
    "enabled": true,  // Default: true if sources assigned
    "topK": 5,  // Default: 5
    "minScore": 0.7  // Default: 0.7
  }
}
```

Response includes RAG context automatically injected:
```json
{
  "messages": [
    {
      "role": "assistant",
      "content": "Based on the stakeholder interviews, the main customer pain points are:\n\n1. **Mobile Experience** - Field workers report the mobile app is slow and crashes frequently...\n\n2. **Data Entry** - Users spend too much time on manual data entry...",
      "metadata": {
        "ragContextUsed": true,
        "chunksRetrieved": 5,
        "sourcesQueried": ["table-456", "doc-789"]
      }
    }
  ]
}
```

---

## Bulk Operations

### Re-index All Agent Sources
```http
POST /api/workforce/[agentId]/rag/reindex
{
  "sourceTypes": ["record", "doc"],  // Optional filter
  "force": true
}
```

### Delete Index
```http
DELETE /api/rag/index/[indexName]
```

---

## Error Responses

### Index Not Found
```json
{
  "error": "INDEX_NOT_FOUND",
  "message": "Index 'agent-123-table-456' does not exist",
  "status": 404
}
```

### Indexing Failed
```json
{
  "error": "INDEXING_FAILED",
  "message": "Failed to index table-456: Embedding service unavailable",
  "status": 500,
  "details": {
    "sourceId": "table-456",
    "sourceType": "record",
    "failedAt": "2024-12-11T10:35:00Z"
  }
}
```

### Insufficient Permissions
```json
{
  "error": "INSUFFICIENT_PERMISSIONS",
  "message": "Agent does not have access to table-456",
  "status": 403
}
```
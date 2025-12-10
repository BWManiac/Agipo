# Frontend-Backend Mapping: Docs Feature

**Created:** December 10, 2025
**Status:** UXD Planning Phase
**Related UXD:** `_docs/UXD/Pages/records/2025-12-10-docs-v1/`

---

## Overview

This document maps UI components to their required backend APIs for the Docs feature. The Docs feature is a Markdown-based document editor with agentic editing capabilities.

---

## API Endpoints

### 1. Document CRUD Operations

#### `GET /api/docs`
**UI Component:** Document catalog/list (future)
**Description:** List all documents for the current user

**Response:**
```typescript
{
  documents: Array<{
    id: string;
    title: string;
    excerpt: string;
    createdAt: string;
    updatedAt: string;
    lastEditedBy: {
      type: 'user' | 'agent';
      id: string;
      name: string;
    };
    wordCount: number;
    tags: string[];
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}
```

---

#### `POST /api/docs`
**UI Component:** `07-empty-document.html` - New document creation
**Description:** Create a new document

**Request:**
```typescript
{
  title?: string;           // Optional, defaults to "Untitled Document"
  content?: string;         // Optional initial Markdown content
  properties?: Record<string, unknown>;  // Optional frontmatter
}
```

**Response:**
```typescript
{
  id: string;
  title: string;
  content: string;
  properties: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

---

#### `GET /api/docs/[docId]`
**UI Component:** `01-doc-editor-main.html` - Main document editor
**Description:** Get a document by ID with full content

**Response:**
```typescript
{
  id: string;
  title: string;
  content: string;           // Full Markdown content
  properties: {              // Frontmatter metadata
    source?: string;
    author?: string;
    created: string;
    updated: string;
    tags: string[];
    [key: string]: unknown;
  };
  outline: Array<{           // Pre-parsed heading structure
    level: number;           // 1-6
    text: string;
    id: string;              // Anchor ID for navigation
    position: number;        // Line number in document
  }>;
  wordCount: number;
  characterCount: number;
  lastSaved: string;
  lastEditedBy: {
    type: 'user' | 'agent';
    id: string;
    name: string;
    avatar?: string;
  };
}
```

---

#### `PATCH /api/docs/[docId]`
**UI Component:** `01-doc-editor-main.html` - Auto-save, manual save
**Description:** Update document content or properties

**Request:**
```typescript
{
  title?: string;
  content?: string;
  properties?: Record<string, unknown>;
}
```

**Response:**
```typescript
{
  id: string;
  updatedAt: string;
  wordCount: number;
  characterCount: number;
  outline: Array<{ level: number; text: string; id: string; position: number }>;
}
```

---

#### `DELETE /api/docs/[docId]`
**UI Component:** Settings panel or document menu
**Description:** Delete a document

**Response:**
```typescript
{ success: true }
```

---

### 2. Agent Access Management

#### `GET /api/docs/[docId]/access`
**UI Component:** `05-settings-panel/05-settings-access.html`
**Description:** Get agents with access to this document

**Response:**
```typescript
{
  agents: Array<{
    id: string;
    name: string;
    role: string;
    avatar: string;
    permission: 'read' | 'read-write';
    grantedAt: string;
    grantedBy: string;
  }>;
  ragEnabled: boolean;       // Whether document is indexed for RAG
  ragLastIndexed?: string;   // When document was last indexed
}
```

---

#### `POST /api/docs/[docId]/access/agents`
**UI Component:** `05-settings-panel/05-settings-access.html` - Add agent button
**Description:** Grant an agent access to this document

**Request:**
```typescript
{
  agentId: string;
  permission: 'read' | 'read-write';
}
```

**Response:**
```typescript
{
  agentId: string;
  permission: 'read' | 'read-write';
  grantedAt: string;
}
```

---

#### `PATCH /api/docs/[docId]/access/agents/[agentId]`
**UI Component:** `05-settings-panel/05-settings-access.html` - Permission dropdown
**Description:** Update an agent's permission level

**Request:**
```typescript
{
  permission: 'read' | 'read-write';
}
```

**Response:**
```typescript
{
  agentId: string;
  permission: 'read' | 'read-write';
  updatedAt: string;
}
```

---

#### `DELETE /api/docs/[docId]/access/agents/[agentId]`
**UI Component:** `05-settings-panel/05-settings-access.html` - Remove button
**Description:** Revoke an agent's access to this document

**Response:**
```typescript
{ success: true }
```

---

### 3. Activity Log

#### `GET /api/docs/[docId]/activity`
**UI Component:** `05-settings-panel/05-settings-activity.html`
**Description:** Get activity log for a document

**Query Parameters:**
- `filter`: `'all' | 'agents' | 'user'` (default: `'all'`)
- `limit`: number (default: 20)
- `offset`: number (default: 0)

**Response:**
```typescript
{
  activities: Array<{
    id: string;
    type: 'edit' | 'create' | 'view' | 'access_granted' | 'access_revoked';
    actor: {
      type: 'user' | 'agent';
      id: string;
      name: string;
      avatar?: string;
    };
    timestamp: string;
    summary: string;           // Human-readable description
    details?: {
      wordsDelta?: number;     // +142, -20, etc.
      section?: string;        // Which section was edited
      versionId?: string;      // Link to version
    };
  }>;
  pagination: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

---

### 4. Version History

#### `GET /api/docs/[docId]/versions`
**UI Component:** `06-version-history/06-version-history-list.html`
**Description:** Get list of document versions

**Query Parameters:**
- `limit`: number (default: 20)
- `offset`: number (default: 0)

**Response:**
```typescript
{
  versions: Array<{
    id: string;
    createdAt: string;
    createdBy: {
      type: 'user' | 'agent';
      id: string;
      name: string;
      avatar?: string;
    };
    summary: string;           // Auto-generated or provided description
    wordCount: number;
    wordsDelta: number;        // Change from previous version
    isCurrent: boolean;
  }>;
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
  autoSaveInterval: number;    // In seconds (e.g., 300 for 5 minutes)
}
```

---

#### `GET /api/docs/[docId]/versions/[versionId]`
**UI Component:** `06-version-history/06-version-history-list.html` - Preview panel
**Description:** Get a specific version's full content

**Response:**
```typescript
{
  id: string;
  docId: string;
  content: string;             // Full Markdown content at this version
  properties: Record<string, unknown>;
  createdAt: string;
  createdBy: {
    type: 'user' | 'agent';
    id: string;
    name: string;
    avatar?: string;
  };
  wordCount: number;
  wordsDelta: number;
  changes?: {                  // Optional diff metadata
    added: number;
    removed: number;
    modified: number;
  };
}
```

---

#### `GET /api/docs/[docId]/versions/compare`
**UI Component:** `06-version-history/06-version-history-preview.html`
**Description:** Compare two versions with diff

**Query Parameters:**
- `from`: string (version ID of older version)
- `to`: string (version ID of newer version)

**Response:**
```typescript
{
  from: {
    id: string;
    createdAt: string;
    createdBy: { type: 'user' | 'agent'; id: string; name: string; avatar?: string };
  };
  to: {
    id: string;
    createdAt: string;
    createdBy: { type: 'user' | 'agent'; id: string; name: string; avatar?: string };
  };
  diff: {
    unified: string;           // Unified diff format
    stats: {
      additions: number;
      deletions: number;
      modifications: number;
    };
    hunks: Array<{
      section: string;         // Which heading/section
      type: 'added' | 'removed' | 'modified';
      oldContent?: string;
      newContent?: string;
    }>;
  };
}
```

---

#### `POST /api/docs/[docId]/versions/[versionId]/restore`
**UI Component:** `06-version-history/06-version-history-list.html` - Restore button
**Description:** Restore document to a specific version

**Response:**
```typescript
{
  newVersionId: string;        // A new version is created (not overwritten)
  restoredFrom: string;        // The version ID that was restored
  content: string;             // The restored content
  updatedAt: string;
}
```

---

### 5. Chat & Agentic Editing

#### `GET /api/docs/[docId]/threads`
**UI Component:** `02-chat-sidebar/` - Thread list
**Description:** Get chat threads for this document

**Response:**
```typescript
{
  threads: Array<{
    id: string;
    agentId: string;
    agentName: string;
    agentAvatar: string;
    title: string;             // Auto-generated from first message
    lastMessage: {
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    };
    messageCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

---

#### `POST /api/docs/[docId]/threads`
**UI Component:** `02-chat-sidebar/02-chat-empty.html` - Start conversation
**Description:** Create a new chat thread for this document

**Request:**
```typescript
{
  agentId: string;
}
```

**Response:**
```typescript
{
  id: string;
  agentId: string;
  createdAt: string;
}
```

---

#### `GET /api/docs/[docId]/threads/[threadId]`
**UI Component:** `02-chat-sidebar/02-chat-active.html` - Chat messages
**Description:** Get messages in a chat thread

**Response:**
```typescript
{
  id: string;
  agentId: string;
  agent: {
    id: string;
    name: string;
    avatar: string;
    status: 'idle' | 'thinking' | 'editing';
  };
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    toolCalls?: Array<{
      id: string;
      tool: string;            // e.g., 'sys_doc_insert', 'sys_doc_replace'
      status: 'pending' | 'running' | 'completed' | 'failed';
      args?: Record<string, unknown>;
      result?: unknown;
    }>;
  }>;
}
```

---

#### `POST /api/docs/[docId]/chat` (Streaming)
**UI Component:** `02-chat-sidebar/02-chat-agent-editing.html`
**Description:** Send a message and stream the response (including tool executions)

**Request:**
```typescript
{
  threadId: string;
  message: string;
}
```

**Response:** Server-Sent Events stream
```typescript
// Message start
{ type: 'message_start', messageId: string }

// Text content delta
{ type: 'content_delta', delta: string }

// Tool call start
{ type: 'tool_start', toolId: string, tool: string, args: Record<string, unknown> }

// Tool call complete
{ type: 'tool_complete', toolId: string, result: unknown }

// Document updated (after tool execution)
{ type: 'doc_update', changes: { position: number, type: 'insert' | 'replace' | 'delete', content?: string } }

// Message complete
{ type: 'message_complete', messageId: string }

// Error
{ type: 'error', error: string }
```

---

### 6. Agent Document Tools

These are the Mastra tools available to agents for document operations:

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `sys_doc_read` | Read full document content | `docId: string` |
| `sys_doc_get_section` | Get content of a heading section | `docId: string, sectionId: string` |
| `sys_doc_search` | Search within document | `docId: string, query: string` |
| `sys_doc_insert` | Insert text at position | `docId: string, position: number, content: string` |
| `sys_doc_replace` | Replace text | `docId: string, start: number, end: number, content: string` |
| `sys_doc_delete` | Delete text | `docId: string, start: number, end: number` |
| `sys_doc_get_selection` | Get user's current selection | `docId: string` |
| `sys_doc_get_properties` | Get document frontmatter | `docId: string` |
| `sys_doc_set_property` | Update a property | `docId: string, key: string, value: unknown` |

---

## Data Models

### Document (Prisma-style schema)

```prisma
model Document {
  id            String   @id @default(cuid())
  title         String
  content       String   @db.Text        // Full Markdown content
  properties    Json                      // Frontmatter as JSON

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  userId        String                    // Owner

  versions      DocumentVersion[]
  agentAccess   DocumentAgentAccess[]
  activities    DocumentActivity[]
  threads       DocumentThread[]

  // RAG indexing
  ragIndexed    Boolean  @default(false)
  ragIndexedAt  DateTime?
}

model DocumentVersion {
  id            String   @id @default(cuid())
  documentId    String
  document      Document @relation(fields: [documentId], references: [id])

  content       String   @db.Text
  properties    Json
  wordCount     Int
  wordsDelta    Int                       // Change from previous
  summary       String?                   // Auto-generated description

  createdAt     DateTime @default(now())
  createdById   String
  createdByType String                    // 'user' | 'agent'

  @@index([documentId, createdAt(sort: Desc)])
}

model DocumentAgentAccess {
  id            String   @id @default(cuid())
  documentId    String
  document      Document @relation(fields: [documentId], references: [id])

  agentId       String
  permission    String                    // 'read' | 'read-write'

  grantedAt     DateTime @default(now())
  grantedBy     String

  @@unique([documentId, agentId])
}

model DocumentActivity {
  id            String   @id @default(cuid())
  documentId    String
  document      Document @relation(fields: [documentId], references: [id])

  type          String                    // 'edit', 'create', 'view', etc.
  actorId       String
  actorType     String                    // 'user' | 'agent'
  summary       String
  details       Json?

  timestamp     DateTime @default(now())

  @@index([documentId, timestamp(sort: Desc)])
}

model DocumentThread {
  id            String   @id @default(cuid())
  documentId    String
  document      Document @relation(fields: [documentId], references: [id])

  agentId       String
  title         String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  messages      DocumentMessage[]
}

model DocumentMessage {
  id            String   @id @default(cuid())
  threadId      String
  thread        DocumentThread @relation(fields: [threadId], references: [id])

  role          String                    // 'user' | 'assistant'
  content       String   @db.Text
  toolCalls     Json?

  timestamp     DateTime @default(now())
}
```

---

## WebSocket Events (Real-time Updates)

For real-time collaboration and agent editing feedback:

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_doc` | `{ docId: string }` | Join document room |
| `leave_doc` | `{ docId: string }` | Leave document room |
| `cursor_move` | `{ docId: string, position: number }` | User cursor position |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `agent_editing_start` | `{ agentId: string, agentName: string, section?: string }` | Agent started editing |
| `agent_editing_progress` | `{ agentId: string, position: number, preview?: string }` | Agent edit progress |
| `agent_editing_complete` | `{ agentId: string, versionId: string }` | Agent finished editing |
| `doc_updated` | `{ versionId: string, updatedAt: string }` | Document was updated |

---

## Implementation Priority

### Phase 1: Core Document CRUD
1. `GET/POST/PATCH/DELETE /api/docs/[docId]`
2. Document storage with Markdown + frontmatter

### Phase 2: Version History
1. `GET /api/docs/[docId]/versions`
2. `GET /api/docs/[docId]/versions/[versionId]`
3. `POST /api/docs/[docId]/versions/[versionId]/restore`
4. Auto-save and version creation

### Phase 3: Agent Access & Activity
1. `GET/POST/PATCH/DELETE /api/docs/[docId]/access/agents`
2. `GET /api/docs/[docId]/activity`

### Phase 4: Chat & Agentic Editing
1. `GET/POST /api/docs/[docId]/threads`
2. `POST /api/docs/[docId]/chat` (streaming)
3. Document tools implementation

### Phase 5: Real-time & RAG
1. WebSocket integration
2. RAG indexing pipeline
3. Agent document retrieval

---

## Notes

- **Markdown Storage**: Documents stored as raw Markdown with YAML frontmatter, parsed on read
- **Version Diffing**: Use `diff` library for generating diffs between versions
- **Auto-save**: Client-side debounce (2s idle), server creates version every 5 minutes or on significant changes
- **Agent Attribution**: All tool executions logged with agent ID for activity tracking
- **RAG Integration**: Documents indexed via Mastra RAG pipeline for agent retrieval

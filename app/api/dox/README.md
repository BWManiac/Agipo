# DOX API

> REST API for document management operations.

**Domain:** DOX (Documents)

---

## Purpose

This module provides API routes for managing documents - creating, reading, updating, deleting, and listing documents. Documents are stored as Markdown with YAML frontmatter in `_tables/dox/[docId]/content.md`.

---

## Routes

### `GET /api/dox/list`

List all documents for the current user.

**Response:**
```json
{
  "documents": [
    {
      "id": "doc-abc123",
      "title": "My Document",
      "excerpt": "First paragraph...",
      "updatedAt": "2025-12-10T10:00:00Z"
    }
  ]
}
```

---

### `POST /api/dox/create`

Create a new document.

**Request:**
```json
{
  "title": "New Document",
  "content": "# My Document\n\nContent here...",
  "properties": {
    "tags": ["project", "notes"]
  }
}
```

**Response:**
```json
{
  "id": "doc-abc123",
  "title": "New Document",
  "content": "# My Document\n\nContent here...",
  "properties": {
    "tags": ["project", "notes"]
  },
  "createdAt": "2025-12-10T10:00:00Z",
  "updatedAt": "2025-12-10T10:00:00Z"
}
```

---

### `GET /api/dox/[docId]`

Get a document by ID with full content.

**Response:**
```json
{
  "id": "doc-abc123",
  "title": "My Document",
  "content": "# My Document\n\nContent here...",
  "properties": {
    "tags": ["project", "notes"],
    "created": "2025-12-10T10:00:00Z",
    "updated": "2025-12-10T10:00:00Z"
  },
  "lexicalState": "{...}", // Lexical editor state JSON
  "outline": [
    {
      "level": 1,
      "text": "My Document",
      "id": "heading-1"
    }
  ]
}
```

---

### `PATCH /api/dox/[docId]`

Update document content or properties.

**Request:**
```json
{
  "title": "Updated Title",
  "content": "# Updated Content",
  "properties": {
    "tags": ["updated"]
  }
}
```

**Response:**
```json
{
  "id": "doc-abc123",
  "updatedAt": "2025-12-10T10:05:00Z"
}
```

---

### `DELETE /api/dox/[docId]`

Delete a document.

**Response:**
```json
{
  "success": true
}
```

---

## Authentication

All routes require Clerk authentication. Returns 401 if user is not authenticated.

---

## Pattern Source

- `app/api/records/list/route.ts` - List route pattern
- `app/api/records/create/route.ts` - Create route pattern
- `app/api/records/[tableId]/route.ts` - CRUD route pattern

---

**Last Updated:** 2025-12-10

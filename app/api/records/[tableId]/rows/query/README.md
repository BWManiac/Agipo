# Query Rows

> Enables users to search and filter records in a data table.

**Endpoint:** `POST /api/records/[tableId]/rows/query`  
**Auth:** None

---

## Purpose

Queries rows from a table with optional filtering, sorting, and pagination. This powers the data grid UI where users can search and filter their records. The query is executed against the Parquet storage for fast performance.

---

## Approach

We accept query parameters (filter, sort, limit) and execute them against the table's Parquet data using Polars. The results are returned as an array of row objects.

---

## Pseudocode

```
POST(request, { params }): NextResponse
├── Extract tableId from params
├── Parse filter, sort, limit from body
├── **Call `queryTable(tableId, options)`**
│   └── Execute query against Parquet
└── Return matching rows
```

---

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tableId` | string (path) | Yes | Table identifier |
| `filter` | object | No | Filter conditions |
| `sort` | object | No | Sort column and direction |
| `limit` | number | No | Max rows to return |

**Example Request:**
```json
{
  "filter": { "status": "active" },
  "sort": { "column": "createdAt", "direction": "desc" },
  "limit": 100
}
```

---

## Output

Array of matching rows.

```json
[
  { "id": "row_1", "email": "user@example.com", "status": "active" },
  { "id": "row_2", "email": "other@example.com", "status": "active" }
]
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| TableView | `app/(pages)/records/[tableId]/` | Data grid |


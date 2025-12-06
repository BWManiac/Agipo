# List Tables

> Enables users to see all data tables in the records system.

**Endpoint:** `GET /api/records/list`  
**Auth:** None

---

## Purpose

Lists all tables (datasets) in the records system. This powers the records management page where users can view their data tables, create new ones, or navigate to specific tables to view their contents.

---

## Approach

We call the records service to enumerate all table schemas stored in `_tables/schemas/`. Each schema contains metadata about the table structure.

---

## Pseudocode

```
GET(): NextResponse
├── **Call `listTables()`** from records service
└── Return array of table metadata
```

---

## Input

None

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `[]` | TableSchema[] | Array of table schemas |
| `[].id` | string | Table identifier |
| `[].name` | string | Display name |
| `[].description` | string | Table description |
| `[].columns` | Column[] | Column definitions |

**Example Response:**
```json
[
  {
    "id": "customers",
    "name": "Customers",
    "description": "Customer records",
    "columns": [
      { "name": "email", "type": "string" }
    ]
  }
]
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| RecordsPage | `app/(pages)/records/` | Table list view |


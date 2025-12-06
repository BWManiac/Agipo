# Create Table

> Enables users to create a new data table for storing records.

**Endpoint:** `POST /api/records/create`  
**Auth:** None

---

## Purpose

Creates a new table schema in the records system. Users provide a name and optional description, and a new empty table is created that they can then add columns and rows to.

---

## Approach

We generate a slug-based ID from the table name (or random if not suitable), then create the table schema in storage. The table starts with no columns - users add those separately.

---

## Pseudocode

```
POST(request): NextResponse
├── Parse name, description from body
├── Validate name is present
├── Generate ID: slugify name or nanoid(8)
├── **Call `createTableSchema(id, name, description)`**
└── Return created schema
```

---

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Table display name |
| `description` | string | No | Table description |

**Example Request:**
```json
{
  "name": "Customers",
  "description": "Customer contact records"
}
```

---

## Output

Returns the created table schema.

```json
{
  "id": "customers",
  "name": "Customers",
  "description": "Customer contact records",
  "columns": []
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| RecordsPage | `app/(pages)/records/` | Create table dialog |


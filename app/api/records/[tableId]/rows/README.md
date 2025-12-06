# Insert Row

> Enables users to add a new record to a data table.

**Endpoint:** `POST /api/records/[tableId]/rows`  
**Auth:** None

---

## Purpose

Inserts a new row (record) into a specific table. The data is validated against the table's schema to ensure it matches the defined column types. This powers the data entry UI where users add records to their tables.

---

## Approach

We parse the row data from the request body, validate it against the table schema, generate a unique row ID, and insert the row into the table's Parquet storage.

---

## Pseudocode

```
POST(request, { params }): NextResponse
├── Extract tableId from params
├── Parse row data from body
├── **Call `insertRow(tableId, data)`**
│   ├── Validate against schema
│   ├── Generate row ID
│   └── Write to Parquet
└── Return inserted row
```

---

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tableId` | string (path) | Yes | Table identifier |
| `[columns]` | varies | Per schema | Column values |

**Example Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

---

## Output

Returns the inserted row with generated ID.

```json
{
  "id": "row_abc123",
  "email": "user@example.com",
  "name": "John Doe"
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| TableView | `app/(pages)/records/[tableId]/` | Add row form |


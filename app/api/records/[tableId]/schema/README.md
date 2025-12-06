# Table Schema

> Enables users to view and modify a table's structure (columns).

**Endpoint:** `GET/PATCH /api/records/[tableId]/schema`  
**Auth:** None

---

## Purpose

Manages the schema (structure) of a specific table. GET retrieves the current schema including all column definitions. PATCH adds a new column to the table. This powers the schema editor UI where users define what data their table can hold.

---

## Approach

For GET, we fetch the schema from storage. For PATCH, we validate the new column definition and add it to the existing schema. Column types determine how data is validated and displayed.

---

## Pseudocode

**GET:**
```
GET(request, { params }): NextResponse
├── Extract tableId from params
├── **Call `getTableSchema(tableId)`**
├── If not found: Return 404
└── Return schema
```

**PATCH:**
```
PATCH(request, { params }): NextResponse
├── Extract tableId from params
├── Parse column definition from body
├── **Call `addColumn(tableId, column)`**
└── Return updated schema
```

---

## Input

**Path Parameter:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tableId` | string | Yes | Table identifier |

**PATCH Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Column name |
| `type` | string | Yes | Data type (string, number, boolean) |
| `required` | boolean | No | Whether column is required |

---

## Output

**GET Response:**
```json
{
  "id": "customers",
  "name": "Customers",
  "columns": [
    { "name": "email", "type": "string", "required": true }
  ]
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| TableView | `app/(pages)/records/[tableId]/` | Schema display |
| SchemaEditor | - | Add columns |


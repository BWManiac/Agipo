# Update/Delete Row

> Enables users to modify or remove specific records from a data table.

**Endpoint:** `PATCH/DELETE /api/records/[tableId]/rows/[rowId]`  
**Auth:** None

---

## Purpose

Manages individual rows in a table. PATCH updates a row's values. DELETE removes a row entirely. This supports inline editing in the data grid and row deletion functionality.

---

## Approach

We locate the row by ID in the Parquet storage. For PATCH, we validate the new values against the schema and update the row. For DELETE, we remove the row from storage.

---

## Pseudocode

**PATCH:**
```
PATCH(request, { params }): NextResponse
├── Extract tableId, rowId from params
├── Parse updated values from body
├── **Call `updateRow(tableId, rowId, values)`**
└── Return updated row
```

**DELETE:**
```
DELETE(request, { params }): NextResponse
├── Extract tableId, rowId from params
├── **Call `deleteRow(tableId, rowId)`**
└── Return { success: true }
```

---

## Input

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tableId` | string | Yes | Table identifier |
| `rowId` | string | Yes | Row identifier |

**PATCH Body:**
| Field | Type | Description |
|-------|------|-------------|
| `[columns]` | varies | Updated column values |

**Example PATCH Request:**
```json
{
  "status": "inactive",
  "updatedAt": "2025-12-05T00:00:00.000Z"
}
```

---

## Output

**PATCH Response:**
```json
{
  "id": "row_abc123",
  "email": "user@example.com",
  "status": "inactive"
}
```

**DELETE Response:**
```json
{ "success": true }
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| TableView | `app/(pages)/records/[tableId]/` | Inline edit, delete row |


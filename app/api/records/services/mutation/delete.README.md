# Records Delete Service

> Deletes rows from tables by ID.

**Service:** `delete.ts`  
**Domain:** Records → Mutation

---

## Purpose

This service handles deleting rows from table data by ID. It filters out the target row and persists the updated DataFrame. Without this service, records would be permanent - users couldn't remove outdated or incorrect data.

**Product Value:** Enables data cleanup workflows. When users remove outdated competitor research or delete incorrect records, this service handles the removal, keeping data accurate and manageable.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `deleteRow()` | Finds a row by ID, removes it from the DataFrame, and persists the changes. | When deleting records (user actions, cleanup workflows) |

---

## Approach

The service loads the DataFrame, filters out the row with the matching ID using Polars filter expressions, verifies the row count decreased (confirms deletion), and commits the updated DataFrame.

---

## Public API

### `deleteRow(tableId: string, rowId: string): Promise<void>`

**What it does:** Deletes a row from a table by ID, removing it from the DataFrame and persisting the change.

**Product Impact:** Every record deletion goes through this function. When users delete records in the UI, this service removes them reliably, keeping data accurate.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tableId` | string | Yes | Table identifier |
| `rowId` | string | Yes | ID of the row to delete |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<void> | Resolves when deletion is successfully persisted |

**Process:**

```
deleteRow(tableId, rowId): Promise<void>
├── **Call `getDataFrame(tableId)`** to load existing data
├── Record initial row count: df.height
├── Apply Polars filter: df.filter(pl.col("id").neq(pl.lit(rowId)))
├── Check if row count decreased: df.height < initialCount
├── If row count didn't decrease: Throw error (row not found)
├── **Call `commitDataFrame(tableId, df)`** to persist
└── Return (void)
```

**Error Handling:** Throws error if row ID not found (row count didn't decrease after filter).

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `nodejs-polars` | DataFrame filtering operations |
| `../io` | DataFrame loading and persistence |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Rows Delete Route | `app/api/records/[tableId]/rows/[rowId]/route.ts` | Deletes rows from API requests |

---

## Design Decisions

### Why filter-based deletion?

**Decision:** Uses Polars filter expression to exclude the target row rather than converting to records.

**Rationale:** Polars filter is efficient and idiomatic. Since we're removing a row (not modifying), filter is simpler and faster than records array conversion. This leverages Polars' strengths.

### Why row count verification?

**Decision:** Checks that row count decreased after filtering to verify deletion.

**Rationale:** Provides clear error feedback if the row ID doesn't exist. Without this check, a non-existent ID would silently succeed, which is confusing.

---

## Error Handling

- Row not found: Throws error when row count doesn't decrease (row ID doesn't exist)

---

## Related Docs

- [IO Service README](../io.README.md) - Provides DataFrame operations
- [Insert Service README](./insert.README.md) - Row creation
- [Update Service README](./update.README.md) - Row modification

---

## Future Improvements

- [ ] Add bulk delete operations
- [ ] Add soft delete (mark as deleted rather than remove)
- [ ] Add delete with relationships (cascade deletes)
- [ ] Add delete hooks/callbacks for workflows
- [ ] Add delete audit logging


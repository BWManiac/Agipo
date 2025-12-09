# Records Update Service

> Updates existing rows in tables with validation and schema alignment.

**Service:** `update.ts`  
**Domain:** Records → Mutation

---

## Purpose

This service handles updating existing rows in table data. It validates update data, aligns DataFrames to current schemas, finds and updates the target row, and persists changes. Without this service, records would be immutable - users couldn't correct data or workflows couldn't update record status.

**Product Value:** Enables data modification workflows. When users edit competitor research or workflows update job application status, this service persists those changes. This makes the Records domain editable and dynamic rather than append-only.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `updateRow()` | Validates update data, aligns schema, finds target row by ID, applies updates, updates timestamp, and persists changes. | When modifying existing records (user edits, workflow status updates) |

---

## Approach

The service loads the table schema, aligns the DataFrame to the current schema (handling schema evolution), converts DataFrame to records array, finds the target row by ID, applies updates with new timestamp, recreates the DataFrame from updated records, re-aligns to schema, and commits changes. Polars is immutable, so updates require reconstructing the DataFrame.

---

## Public API

### `updateRow(tableId: string, rowId: string, updates: Record<string, any>): Promise<Record<string, any>>`

**What it does:** Updates an existing row in a table by ID, validating update data and maintaining schema alignment.

**Product Impact:** Every record modification goes through this function. When users edit records in the UI or workflows update record status, this service validates and persists changes, making data updates reliable.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tableId` | string | Yes | Table identifier |
| `rowId` | string | Yes | ID of the row to update |
| `updates` | Record<string, any> | Yes | Partial row data with fields to update (excluding system fields like id, _created) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<Record<string, any>> | Updated row data that was applied |

**Process:**

```
updateRow(tableId, rowId, updates): Promise<Record>
├── **Call `readSchema(tableId)`** to get table schema
├── If schema not found: Throw error
├── **Call `getDataFrame(tableId)`** to load existing data
├── If DataFrame empty: Throw error
├── **Call `alignDataFrameToSchema()`** to ensure DataFrame matches current schema
├── Convert DataFrame to records array: df.toRecords()
├── Map over records to find and update target row:
│   ├── **If record.id === rowId:**
│   │   ├── Mark found = true
│   │   ├── Merge updates with existing record
│   │   └── Update _updated timestamp
│   └── **Else:** Return record unchanged
├── If row not found: Throw error
├── Recreate DataFrame from updated records: pl.DataFrame(newRecords)
├── **Call `alignDataFrameToSchema()`** again to ensure final alignment
├── **Call `commitDataFrame(tableId, finalDf)`** to persist
└── Return updates object
```

**Error Handling:** Throws errors if table not found, table is empty, or row ID not found.

**Design Note:** Polars DataFrames are immutable, so updates require converting to records, mapping, and recreating the DataFrame. For MVP scale (<10k rows), this is acceptable. Future optimization could use Polars expressions.

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `nodejs-polars` | DataFrame operations |
| `./utils/alignment` | Schema alignment utilities |
| `../io` | DataFrame loading and persistence |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Rows Update Route | `app/api/records/[tableId]/rows/[rowId]/route.ts` | Updates rows from API requests |

---

## Design Decisions

### Why records array conversion?

**Decision:** Updates are done by converting DataFrame to records array, mapping, and recreating.

**Rationale:** Polars DataFrames are immutable and don't have a direct "update row" operation. Converting to records allows straightforward JavaScript map operations. For MVP scale, this is simpler than complex Polars expressions. Future optimization could use Polars lazy expressions.

### Why double schema alignment?

**Decision:** Schema is aligned both before and after the update operation.

**Rationale:** Ensures compatibility with schema evolution at all stages. Before alignment handles cases where the DataFrame is older than the schema. After alignment handles any edge cases from the record reconstruction.

---

## Error Handling

- Table not found: Throws error
- Empty table: Throws error (can't update if no rows)
- Row not found: Throws error with rowId

---

## Related Docs

- [IO Service README](../io.README.md) - Provides DataFrame operations
- [Insert Service README](./insert.README.md) - Similar pattern for inserts
- [Delete Service README](./delete.README.md) - Row deletion

---

## Future Improvements

- [ ] Use Polars expressions for faster updates (optimize for larger tables)
- [ ] Add bulk update operations
- [ ] Add partial update validation (only validate provided fields)
- [ ] Add update hooks/callbacks for workflows
- [ ] Add update audit logging with before/after snapshots


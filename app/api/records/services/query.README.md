# Records Query Service

> Provides read-only query operations on table data using Polars DataFrames.

**Service:** `query.ts`  
**Domain:** Records

---

## Purpose

This service provides query operations for retrieving and filtering table data. It uses Polars DataFrames to perform fast filtering, sorting, and pagination operations on table records. Without this service, users couldn't search, filter, or browse their data - tables would just be storage without query capabilities.

**Product Value:** Enables users to interact with their data - search competitor research, filter job applications by status, sort records by date, etc. This makes the Records domain functional and useful rather than just storage.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `queryTable()` | Performs filtering, sorting, and pagination on table data using Polars operations. | When displaying table data in the UI with filters, sorting, or pagination |

---

## Approach

The service loads a DataFrame using the io service, applies Polars filter expressions for query conditions, sorts using Polars sort operations, and paginates using Polars slice. All operations use Polars' lazy evaluation capabilities where possible, and results are converted to JSON-compatible records for API responses.

---

## Public API

### `queryTable(tableId: string, options?: QueryOptions): Promise<Record<string, unknown>[]>`

**What it does:** Queries table data with optional filtering, sorting, and pagination, returning matching records as JSON objects.

**Product Impact:** Powers the Records grid UI where users browse, search, and filter their data. When users apply filters or change sorting, this function executes the query and returns results.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tableId` | string | Yes | Table identifier |
| `options` | QueryOptions | No | Query options including filter, sort, limit, offset |

**QueryOptions:**

| Field | Type | Description |
|-------|------|-------------|
| `filter` | QueryFilter | Optional filter condition |
| `sort` | QuerySort | Optional sort configuration |
| `limit` | number | Optional result limit (pagination) |
| `offset` | number | Optional result offset (pagination) |

**QueryFilter:**

| Field | Type | Description |
|-------|------|-------------|
| `col` | string | Column name to filter |
| `op` | "eq" \| "neq" \| "gt" \| "lt" \| "contains" | Filter operator |
| `val` | any | Filter value |

**QuerySort:**

| Field | Type | Description |
|-------|------|-------------|
| `col` | string | Column name to sort by |
| `desc` | boolean | Sort descending (default: false) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<Record<string, unknown>[]> | Array of records matching the query, as JSON objects |

**Process:**

```
queryTable(tableId, options?): Promise<Record[]>
├── **Call `getDataFrame(tableId)`** to load DataFrame
├── **If options.filter provided:**
│   ├── Extract col, op, val from filter
│   ├── Apply Polars filter expression:
│   │   ├── op === "eq": df.filter(pl.col(col).eq(pl.lit(val)))
│   │   ├── op === "neq": df.filter(pl.col(col).neq(pl.lit(val)))
│   │   ├── op === "gt": df.filter(pl.col(col).gt(pl.lit(val)))
│   │   ├── op === "lt": df.filter(pl.col(col).lt(pl.lit(val)))
│   │   └── op === "contains": df.filter(pl.col(col).str.contains(val))
│   └── Update df with filtered result
├── **If options.sort provided:**
│   └── **Call `df.sort(col, desc)`**
├── **If options.limit or options.offset provided:**
│   ├── Calculate offset (default: 0) and limit (default: 100)
│   └── **Call `df.slice(offset, limit)`** for pagination
└── **Call `df.toRecords()`** to convert to JSON objects and return
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `nodejs-polars` | DataFrame operations and filtering |
| `./io` | DataFrame loading |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Rows Query Route | `app/api/records/[tableId]/rows/query/route.ts` | Executes queries with filters, sorting, pagination |

---

## Design Decisions

### Why Polars for querying?

**Decision:** Uses Polars DataFrames for all query operations instead of raw JSON array filtering.

**Rationale:** Polars provides fast, Rust-powered operations that scale well. Even for small tables, Polars offers consistent performance and a rich query API. For larger tables, this approach will scale much better than JavaScript array operations.

### Why slice for pagination?

**Decision:** Uses Polars `slice(offset, limit)` for pagination.

**Rationale:** Polars slice is efficient and handles edge cases. The (offset, length) format matches Polars' API expectations.

---

## Error Handling

- Missing tables: Would throw from getDataFrame (handled by caller)
- Invalid column names: Polars would throw errors (handled by route layer)
- Empty results: Returns empty array (normal case, not an error)

---

## Related Docs

- [IO Service README](./io.README.md) - Provides DataFrame loading
- [Rows Query Route README](../../[tableId]/rows/query/README.md) - API route that uses this service

---

## Future Improvements

- [ ] Add more filter operators (gte, lte, in, notIn, etc.)
- [ ] Add multi-column sorting
- [ ] Add aggregation operations (groupBy, sum, count, etc.)
- [ ] Add full-text search capabilities
- [ ] Add query result caching for expensive operations
- [ ] Support complex queries (AND/OR combinations)


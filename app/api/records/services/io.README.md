# Records IO Service

> Handles file system operations for table schemas and data (Polars DataFrames).

**Service:** `io.ts`  
**Domain:** Records

---

## Purpose

This service manages the file system persistence of table schemas and data using Polars DataFrames. It handles reading/writing schema.json files, loading DataFrames from records.json, and committing DataFrames back to disk. Without this service, records couldn't be stored, retrieved, or persisted - agents and workflows would have no way to save structured data.

**Product Value:** Enables the shared memory layer where agents and workflows can read/write structured data. When agents create competitor research or workflows output job applications, this service persists that data in a format that's queryable, versionable, and inspectable.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `ensureTableDir()` | Creates the directory for a table if it doesn't exist. | Before any file operations to ensure directory structure exists |
| `readSchema()` | Reads the schema.json file for a table, validating against TableSchema type. | When loading table metadata or validating table structure |
| `writeSchema()` | Writes a schema.json file for a table with pretty-printed JSON. | When creating or updating table schemas |
| `getDataFrame()` | Loads records.json into a Polars DataFrame, returning empty DataFrame if file doesn't exist. | When querying or modifying table data |
| `commitDataFrame()` | Writes a Polars DataFrame to records.json with pretty-printed JSON for inspectability. | After modifying table data (insert, update, delete) |
| `deleteTableFiles()` | Deletes a table directory completely, removing schema and data. | When deleting tables |

---

## Approach

The service uses a package-based structure: `_tables/records/{tableId}/schema.json` and `_tables/records/{tableId}/records.json`. Polars handles DataFrame operations, and the service converts between Polars DataFrames and JSON for persistence. Files are pretty-printed for human readability and version control, trading some performance for inspectability (fine for MVP scale).

---

## Public API

### `ensureTableDir(tableId: string): Promise<string>`

**What it does:** Ensures the directory for a table exists, creating it if necessary, and returns the directory path.

**Product Impact:** All file operations need the directory to exist. This function guarantees the structure is in place before reading/writing files.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tableId` | string | Yes | Table identifier (used as directory name) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<string> | Absolute path to the table directory |

---

### `readSchema(tableId: string): Promise<TableSchema | null>`

**What it does:** Reads and parses the schema.json file for a table, returning the validated schema or null if the file doesn't exist.

**Product Impact:** Routes need table schemas for validation, column information, and data operations. This function provides that schema data.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tableId` | string | Yes | Table identifier |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<TableSchema \| null> | Table schema with columns, metadata, or null if not found |

**Process:**

```
readSchema(tableId): Promise<TableSchema | null>
├── Build file path: _tables/records/{tableId}/schema.json
├── **Try to read file**
├── Parse JSON content
└── Return parsed schema or null if file doesn't exist
```

---

### `writeSchema(tableId: string, schema: TableSchema): Promise<void>`

**What it does:** Writes a table schema to schema.json with pretty-printed JSON formatting.

**Product Impact:** When tables are created or schemas are updated (columns added), this function persists those changes, making schemas durable.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tableId` | string | Yes | Table identifier |
| `schema` | TableSchema | Yes | Complete schema object to write |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<void> | Resolves when file is successfully written |

**Process:**

```
writeSchema(tableId, schema): Promise<void>
├── **Call `ensureTableDir(tableId)`** to ensure directory exists
├── Build file path: _tables/records/{tableId}/schema.json
├── Write schema with JSON.stringify(schema, null, 2) for pretty printing
└── Return (void)
```

---

### `getDataFrame(tableId: string): Promise<pl.DataFrame>`

**What it does:** Loads records.json into a Polars DataFrame, returning an empty DataFrame if the file doesn't exist.

**Product Impact:** All data operations (query, insert, update, delete) need DataFrames. This function provides the DataFrame representation of table data, enabling Polars-powered operations.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tableId` | string | Yes | Table identifier |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<pl.DataFrame> | Polars DataFrame with table data, or empty DataFrame if file doesn't exist |

**Process:**

```
getDataFrame(tableId): Promise<pl.DataFrame>
├── Build file path: _tables/records/{tableId}/records.json
├── **Try to access file**
├── **If file exists:**
│   └── **Call `pl.readJSON(filePath)`** to load DataFrame
└── **If file doesn't exist:**
    └── Return empty DataFrame: pl.DataFrame({})
```

---

### `commitDataFrame(tableId: string, df: pl.DataFrame): Promise<void>`

**What it does:** Writes a Polars DataFrame to records.json, converting to pretty-printed JSON for human readability.

**Product Impact:** After any data modifications (insert, update, delete), this function persists the changes, making modifications durable. Pretty-printing ensures files are inspectable and version-control-friendly.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tableId` | string | Yes | Table identifier |
| `df` | pl.DataFrame | Yes | Polars DataFrame to write |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<void> | Resolves when file is successfully written |

**Process:**

```
commitDataFrame(tableId, df): Promise<void>
├── **Call `ensureTableDir(tableId)`** to ensure directory exists
├── Build file path: _tables/records/{tableId}/records.json
├── **Call `df.toRecords()`** to convert DataFrame to JSON-compatible records array
├── Write records with JSON.stringify(records, null, 2) for pretty printing
└── Return (void)
```

**Design Decision:** Converts DataFrame to records array then stringifies, rather than using Polars' writeJSON, to enable pretty-printing. This trades performance for inspectability, which is acceptable for MVP scale (<10k rows).

---

### `deleteTableFiles(tableId: string): Promise<void>`

**What it does:** Deletes a table directory completely, removing both schema.json and records.json.

**Product Impact:** When users delete tables, this function removes all associated files, cleaning up storage and ensuring deleted tables are fully removed.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tableId` | string | Yes | Table identifier |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<void> | Resolves when directory is successfully deleted |

**Process:**

```
deleteTableFiles(tableId): Promise<void>
├── Build directory path: _tables/records/{tableId}
├── **Call `fs.rm(dir, { recursive: true, force: true })`** to delete directory
└── Return (void)
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `nodejs-polars` | DataFrame operations and JSON I/O |
| `fs/promises` | File system operations |
| `path` | Path resolution |
| `zod` | Schema validation |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Schema Service | `app/api/records/services/schema.ts` | Reads/writes schemas |
| Query Service | `app/api/records/services/query.ts` | Loads DataFrames for queries |
| Mutation Services | `app/api/records/services/mutation/*.ts` | Loads and commits DataFrames |
| Catalog Service | `app/api/records/services/catalog.ts` | Reads schemas for table listings |

---

## Design Decisions

### Why pretty-printed JSON?

**Decision:** Both schema.json and records.json are written with `JSON.stringify(data, null, 2)` for indentation.

**Rationale:** Pretty-printing makes files human-readable, git-friendly (meaningful diffs), and allows manual inspection/editing if needed. This aligns with Agipo's philosophy of files as source of truth. The performance trade-off is acceptable for MVP scale.

### Why DataFrame to records conversion?

**Decision:** `commitDataFrame()` converts to records array before stringifying, rather than using Polars' writeJSON.

**Rationale:** Polars' writeJSON doesn't support pretty-printing. Converting to records array allows full control over JSON formatting while maintaining data integrity.

### Why empty DataFrame for missing files?

**Decision:** `getDataFrame()` returns empty DataFrame instead of null if records.json doesn't exist.

**Rationale:** Empty DataFrames can be safely used in operations (vstack, filter, etc.), simplifying calling code. Callers don't need null checks before operations.

---

## Error Handling

- Missing directories: Automatically created with `recursive: true`
- Missing files: `readSchema()` and `getDataFrame()` return null/empty gracefully
- File write errors: Thrown as exceptions (caller should handle)
- Directory deletion errors: Thrown as exceptions (caller should handle)

---

## Related Docs

- [Schema Service README](./schema.README.md) - Uses this service for schema operations
- [Query Service README](./query.README.md) - Uses getDataFrame for data queries
- [Mutation Services README](./mutation/README.md) - Uses getDataFrame and commitDataFrame for modifications

---

## Future Improvements

- [ ] Add file locking for concurrent writes
- [ ] Add backup/version history
- [ ] Consider compression for large record files
- [ ] Add incremental writes for large tables
- [ ] Add data migration utilities


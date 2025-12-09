# Records Catalog Service

> Lists all available tables with metadata and record counts.

**Service:** `catalog.ts`  
**Domain:** Records

---

## Purpose

This service provides a catalog view of all tables in the Records domain, including metadata (name, description) and statistics (record count). It enables users to browse their data tables and see what data they have stored. Without this service, users wouldn't know what tables exist or have any way to navigate their data.

**Product Value:** Powers the Records list page where users see all their tables. This is the entry point to the Records domain - users can see what data they have, how much data is in each table, and navigate to specific tables.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `listTables()` | Scans the records directory, loads schema for each table, and returns a catalog of all tables with metadata and record counts. | When displaying the Records list page or checking what tables exist |

---

## Approach

The service scans the `_tables/records/` directory for table subdirectories, loads each table's schema for metadata, and attempts to get record counts by reading records.json files (for small files < 1MB, loads JSON to count; for larger files, uses file size heuristics). Results are returned as a catalog array with id, name, description, recordCount, and lastModified.

---

## Public API

### `listTables(): Promise<CatalogItem[]>`

**What it does:** Scans the records directory and returns a catalog of all tables with their metadata (name, description) and statistics (record count, last modified).

**Product Impact:** Powers the Records list UI where users browse their tables. Users can see what data they have stored and navigate to specific tables.

**Input:**

None

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<CatalogItem[]> | Array of catalog items, each with id, name, description, recordCount, lastModified |

**CatalogItem:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Table identifier |
| `name` | string | Table name from schema |
| `description` | string | Table description from schema (optional) |
| `recordCount` | number | Number of records in the table (approximate for large files) |
| `lastModified` | string | Last modification timestamp from schema |

**Process:**

```
listTables(): Promise<CatalogItem[]>
├── Scan _tables/records/ directory for subdirectories
├── **For each subdirectory:**
│   ├── Extract tableId from directory name
│   ├── **Call `readSchema(tableId)`** to get schema
│   ├── If schema found:
│   │   ├── Get record count:
│   │   │   ├── Check records.json file size
│   │   │   ├── **If file < 1MB:**
│   │   │   │   ├── Read and parse JSON
│   │   │   │   └── Count array length
│   │   │   └── **If file >= 1MB:**
│   │   │       └── Use file size heuristic (approximate)
│   │   └── Build CatalogItem with id, name, description, recordCount, lastModified
│   └── Skip if schema not found or file read fails
└── Return catalog array
```

**Error Handling:** Missing schemas or files are skipped gracefully. Errors are logged but don't stop the catalog generation.

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `fs/promises` | Directory scanning and file operations |
| `path` | Path resolution |
| `./io` | Schema reading |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Records List Route | `app/api/records/list/route.ts` | Lists all tables for the UI |

---

## Design Decisions

### Why approximate record counts for large files?

**Decision:** For files >= 1MB, record counts are approximate based on file size heuristics rather than exact counts.

**Rationale:** Loading and parsing large JSON files just for counting is expensive. For the catalog view, approximate counts are sufficient - users can see which tables are large vs small. Exact counts can be calculated when viewing the table.

### Why skip tables without schemas?

**Decision:** Tables without valid schema.json files are excluded from the catalog.

**Rationale:** Invalid or corrupted tables shouldn't break the catalog. Only tables with valid schemas are considered "active" tables.

---

## Error Handling

- Missing directories: Returns empty array
- Invalid schemas: Skipped, logged as warnings
- File read errors: Skipped gracefully, catalog continues with other tables

---

## Related Docs

- [IO Service README](./io.README.md) - Provides schema reading
- [Records List Route README](../list/README.md) - API route that uses this service

---

## Future Improvements

- [ ] Add exact record counts for all tables (cache if expensive)
- [ ] Add table search/filtering
- [ ] Add table sorting options
- [ ] Add table statistics (total size, column counts, etc.)
- [ ] Add table tags/categories for organization


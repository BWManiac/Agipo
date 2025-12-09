# Records Schema Service

> Manages table schema creation and column addition with validation.

**Service:** `schema.ts`  
**Domain:** Records

---

## Purpose

This service handles table schema operations - creating new tables with default system columns and adding new columns to existing tables. It validates schema definitions and ensures data consistency. Without this service, users couldn't create tables or evolve their schemas as needs change.

**Product Value:** Enables the table creation workflow where users define what data they want to store. When users create a "Competitor Research" table or add a "Notes" column, this service persists those schema definitions, making structured data storage possible.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `createTableSchema()` | Creates a new table schema with default system columns (id, _created, _updated) and saves it to disk. | When user creates a new table in the Records UI |
| `addColumn()` | Adds a new column to an existing table schema, validates it doesn't duplicate existing columns, and saves the updated schema. | When user adds a new column to an existing table |
| `getTableSchema()` | Retrieves a table's schema from disk. | When displaying table structure or validating operations |

---

## Approach

The service uses the io service for file operations and validates input using Zod schemas. It enforces naming conventions (no duplicate column names), automatically adds system columns to new tables, and handles schema evolution by appending new columns. All operations validate data before persistence.

---

## Public API

### `createTableSchema(id: string, name: string, description?: string): Promise<TableSchema>`

**What it does:** Creates a new table schema with default system columns (id, _created, _updated) and saves it to disk, establishing the structure for a new data table.

**Product Impact:** When users create a new table in the Records UI, this function establishes the schema that defines what data can be stored. This is the foundation of the Records domain.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Table identifier (used as directory name) |
| `name` | string | Yes | Human-readable table name |
| `description` | string | No | Optional table description |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<TableSchema> | Complete table schema with system columns and metadata |

**Process:**

```
createTableSchema(id, name, description?): Promise<TableSchema>
├── Build schema object with:
│   ├── id, name, description from parameters
│   ├── columns: [
│   │   { id: "id", name: "ID", type: "text", required: true },
│   │   { id: "_created", name: "Created At", type: "date", required: true },
│   │   { id: "_updated", name: "Updated At", type: "date", required: true }
│   │ ]
│   └── lastModified: current timestamp
├── **Call `writeSchema(id, schema)`** to persist
└── Return schema
```

---

### `addColumn(tableId: string, input: ColumnInput): Promise<TableSchema>`

**What it does:** Adds a new column to an existing table schema, validates the column definition, checks for duplicate names, and saves the updated schema.

**Product Impact:** Enables schema evolution - users can add new columns as their needs change. When a user realizes they need a "Status" column in their job applications table, this function adds it while preserving existing data.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tableId` | string | Yes | Table identifier |
| `input` | ColumnInput | Yes | Column definition with name, type, required, optional options |

**ColumnInput:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Column name (min 1 character) |
| `type` | "text" \| "number" \| "date" \| "boolean" \| "select" | Column data type |
| `required` | boolean | Whether column is required (default: false) |
| `options` | string[] | Optional array of options (for "select" type) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<TableSchema> | Updated table schema with new column added |

**Process:**

```
addColumn(tableId, input): Promise<TableSchema>
├── **Call `readSchema(tableId)`** to load existing schema
├── If schema not found: Throw error
├── Validate input against ColumnInputValidator (Zod)
├── Generate column id using nanoid(8)
├── Build new column object: { id, ...input }
├── **Check for duplicate column names** (case-insensitive)
├── If duplicate: Throw error
├── Add new column to schema.columns array
├── Update schema.lastModified timestamp
├── **Call `writeSchema(tableId, schema)`** to persist
└── Return updated schema
```

**Error Handling:** Throws errors if table not found, duplicate column name detected, or validation fails.

---

### `getTableSchema(tableId: string): Promise<TableSchema | null>`

**What it does:** Retrieves a table's schema from disk, providing the complete column definitions and metadata.

**Product Impact:** Routes need schemas for validation, UI display, and data operations. This function provides that schema data.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tableId` | string | Yes | Table identifier |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<TableSchema \| null> | Table schema or null if not found |

**Process:**

```
getTableSchema(tableId): Promise<TableSchema | null>
└── **Call `readSchema(tableId)`** and return result
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `nanoid` | Generate unique column IDs |
| `zod` | Input validation |
| `./io` | Schema file operations |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Records Create Route | `app/api/records/create/route.ts` | Creates new table schemas |
| Schema Route | `app/api/records/[tableId]/schema/route.ts` | Gets schemas, adds columns |

---

## Design Decisions

### Why system columns?

**Decision:** All tables automatically get id, _created, and _updated columns.

**Rationale:** These columns are essential for data management - id for unique identification, _created/_updated for timestamps. Making them automatic ensures consistency and eliminates the need for users to think about them.

### Why nanoid for column IDs?

**Decision:** Column IDs are generated using nanoid(8) rather than using column names as IDs.

**Rationale:** Column IDs are internal identifiers that may change less frequently than names. Short IDs are efficient and avoid issues with special characters or reserved words in column names.

### Why duplicate name checking?

**Decision:** Column names are checked for duplicates (case-insensitive) before adding.

**Rationale:** Prevents user confusion and data issues. Duplicate columns would be ambiguous and error-prone. Case-insensitive checking catches variations like "Status" and "status".

---

## Error Handling

- Table not found: Throws error with descriptive message
- Duplicate column names: Throws error with column name
- Validation failures: Zod throws validation errors with details

---

## Related Docs

- [IO Service README](./io.README.md) - Provides schema file operations
- [Mutation Services README](./mutation/README.md) - Uses schemas for data validation

---

## Future Improvements

- [ ] Add column deletion (with data migration)
- [ ] Add column type changes (with data conversion)
- [ ] Add column renaming
- [ ] Add schema versioning/migration system
- [ ] Add column constraints (unique, foreign keys, etc.)


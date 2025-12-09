# Records Insert Service

> Inserts new rows into tables with validation and schema alignment.

**Service:** `insert.ts`  
**Domain:** Records → Mutation

---

## Purpose

This service handles inserting new rows into table data. It validates input data against the table schema, adds system fields (id, timestamps), aligns data to schema structure, and persists changes. Without this service, users and workflows couldn't create new records - tables would be read-only.

**Product Value:** Enables data creation workflows. When agents research competitors or workflows generate job applications, they use this service to persist new records. This is fundamental to making the Records domain a writeable shared memory layer.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `insertRow()` | Validates input data, adds system fields, aligns to schema, and inserts a new row into the table. | When creating new records (agent outputs, workflow results, user input) |

---

## Approach

The service loads the table schema, generates a Zod validator from the schema, validates input data, adds system fields (id via nanoid, timestamps), aligns both the existing DataFrame and new row to the current schema (handling schema evolution), stacks the new row onto the DataFrame, and commits the changes.

---

## Public API

### `insertRow(tableId: string, rowData: Record<string, any>): Promise<Record<string, any>>`

**What it does:** Inserts a new row into a table with validation, system field generation, and schema alignment.

**Product Impact:** Every new record creation goes through this function. When users create records manually or agents/workflows generate data, this service validates and persists it, making data creation reliable and consistent.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tableId` | string | Yes | Table identifier |
| `rowData` | Record<string, any> | Yes | Row data object with column values (excluding system fields) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<Record<string, any>> | Complete inserted row with system fields (id, _created, _updated) added |

**Process:**

```
insertRow(tableId, rowData): Promise<Record>
├── **Call `readSchema(tableId)`** to get table schema
├── If schema not found: Throw error
├── **Call `generateRowValidator(schema)`** to create Zod validator
├── **Call `validator.parse(rowData)`** to validate and clean input
├── Build full row object:
│   ├── id: nanoid() (auto-generated)
│   ├── _created: current ISO timestamp
│   ├── _updated: current ISO timestamp
│   └── ...cleanData (validated input)
├── **Call `getDataFrame(tableId)`** to load existing data
├── **Call `alignDataFrameToSchema()`** to ensure DataFrame matches current schema
├── **Call `alignRowToSchema()`** to ensure new row has all schema columns
├── Create new row DataFrame from aligned row
├── **If existing DataFrame has rows:**
│   ├── Ensure new row DF has same columns (add missing with null, cast types)
│   ├── Reorder new row DF columns to match existing DF
│   └── **Call `df.vstack(newRowDf)`** to append
├── **If existing DataFrame is empty:**
│   └── Use new row DF directly
├── **Call `commitDataFrame(tableId, df)`** to persist
└── Return full row object
```

**Error Handling:** Throws errors if table not found or validation fails. Schema alignment errors would be caught and handled.

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `nanoid` | Generate unique row IDs |
| `nodejs-polars` | DataFrame operations |
| `./utils/validation` | Schema-based validation |
| `./utils/alignment` | Schema alignment utilities |
| `./utils/types` | Type mapping utilities |
| `../io` | DataFrame loading and persistence |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Rows Create Route | `app/api/records/[tableId]/rows/create/route.ts` | Inserts new rows from API requests |

---

## Design Decisions

### Why schema alignment?

**Decision:** Both existing DataFrame and new row are aligned to the current schema before insertion.

**Rationale:** Schema evolution - tables can have columns added over time. Alignment ensures new rows work with evolved schemas and existing DataFrames are compatible with current schema structure. This enables adding columns without breaking existing data.

### Why system fields auto-generated?

**Decision:** id, _created, and _updated are automatically added, not provided by caller.

**Rationale:** These fields should be consistent and non-negotiable. Auto-generation ensures IDs are unique, timestamps are accurate, and callers don't need to worry about system fields.

---

## Error Handling

- Table not found: Throws error
- Validation failures: Zod throws validation errors with details
- Schema alignment failures: Would throw (handled by caller)

---

## Related Docs

- [IO Service README](../io.README.md) - Provides DataFrame operations
- [Schema Service README](../schema.README.md) - Provides schema definitions used for validation
- [Update Service README](./update.README.md) - Similar pattern for updates
- [Delete Service README](./delete.README.md) - Row deletion

---

## Future Improvements

- [ ] Add bulk insert for multiple rows
- [ ] Add insert with relationships (foreign keys)
- [ ] Add insert hooks/callbacks for workflows
- [ ] Add insert validation rules beyond schema (custom validators)
- [ ] Add insert audit logging


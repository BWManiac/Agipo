# Mutation Service Decomposition Plan

## Current State Analysis

**File:** `app/api/records/services/mutation.ts` (239 lines)

**Logical Groupings:**
1. **Type Mapping Utilities** (lines 6-24)
   - `getPolarsTypeForSchemaType()` - Maps schema types to Polars types

2. **Schema Alignment Utilities** (lines 26-82)
   - `alignDataFrameToSchema()` - Aligns DataFrame to schema
   - `alignRowToSchema()` - Aligns row object to schema

3. **Validation Utilities** (lines 84-124)
   - `generateRowValidator()` - Creates Zod validator from schema

4. **Mutation Operations** (lines 126-237)
   - `insertRow()` - Insert operation (55 lines)
   - `updateRow()` - Update operation (42 lines)
   - `deleteRow()` - Delete operation (12 lines)

## Proposed Structure

### Option 1: Folder with Separate Operation Files (Recommended)

```
services/
  mutation/
    utils.ts       # All utilities (alignment, validation, types)
    insert.ts      # insertRow()
    update.ts      # updateRow()
    delete.ts      # deleteRow()
    index.ts       # Barrel export
```

**Pros:**
- Clear separation of concerns
- Each operation is self-contained
- Easy to find specific operations
- Utilities are shared and reusable
- Scales well if we add more operations (e.g., `bulkInsert.ts`)

**Cons:**
- More files to navigate
- Need to ensure utilities are exported correctly

### Option 2: Keep Utilities Separate

```
services/
  mutation/
    alignment.ts   # Schema alignment utilities
    validation.ts  # Validation utilities
    types.ts       # Type mapping utilities
    insert.ts
    update.ts
    delete.ts
    index.ts
```

**Pros:**
- Very granular separation
- Each utility type is isolated

**Cons:**
- More files (7 vs 5)
- Utilities are small and related - might be overkill
- More imports needed

### Option 3: Minimal Split (Just Operations)

```
services/
  mutation/
    insert.ts
    update.ts
    delete.ts
    index.ts
```

Keep utilities in a shared `utils.ts` at services level or inline in each file.

**Pros:**
- Simplest structure
- Fewer files

**Cons:**
- Utilities might be duplicated or scattered
- Less organized

## Recommendation: Fully Decomposed Structure

**Structure:**
```
services/
  mutation/
    utils/
      types.ts       # Type mapping utilities
      alignment.ts   # Schema alignment utilities
      validation.ts  # Validation utilities
      index.ts       # Barrel export for all utils
    insert.ts        # insertRow()
    update.ts        # updateRow()
    delete.ts        # deleteRow()
    index.ts         # Barrel export for all mutations
```

**Rationale:**
1. **Maximum granularity** - Each utility type is isolated in its own file
2. **Operations are distinct** - Each mutation operation has different logic
3. **Maintainability** - Easy to find and modify specific utilities or operations
4. **Scalability** - Easy to add new utilities or operations (e.g., `bulkInsert.ts`, `upsert.ts`)
5. **Testability** - Can test each utility and operation independently
6. **Clear organization** - Utils folder clearly separates utilities from operations

## File Breakdown

### `mutation/utils/types.ts` (~24 lines)
```typescript
import pl from "nodejs-polars";

/**
 * Gets the Polars type for a schema column type.
 */
export function getPolarsTypeForSchemaType(schemaType: string): any
```

### `mutation/utils/alignment.ts` (~57 lines)
```typescript
import pl from "nodejs-polars";
import { TableSchema } from "../../io";
import { getPolarsTypeForSchemaType } from "./types";

/**
 * Aligns a DataFrame to match the current schema by adding missing columns with null values
 * and ensuring correct column order.
 */
export function alignDataFrameToSchema(df: pl.DataFrame, schema: TableSchema): pl.DataFrame

/**
 * Ensures a row object has all columns from the schema, filling missing ones with null.
 */
export function alignRowToSchema(row: Record<string, any>, schema: TableSchema): Record<string, any>
```

### `mutation/utils/validation.ts` (~41 lines)
```typescript
import { z } from "zod";
import { TableSchema } from "../../io";

/**
 * Generates a dynamic Zod validator based on the Table Schema.
 */
export function generateRowValidator(schema: TableSchema): z.ZodObject<any>
```

### `mutation/utils/index.ts` (~4 lines)
```typescript
export * from "./types";
export * from "./alignment";
export * from "./validation";
```

### `mutation/insert.ts` (~55 lines)
```typescript
import { alignDataFrameToSchema, alignRowToSchema } from "./utils/alignment";
import { generateRowValidator } from "./utils/validation";
import { getPolarsTypeForSchemaType } from "./utils/types";

export async function insertRow(tableId: string, rowData: Record<string, any>)
```

### `mutation/update.ts` (~42 lines)
```typescript
import { alignDataFrameToSchema } from "./utils/alignment";

export async function updateRow(tableId: string, rowId: string, updates: Record<string, any>)
```

### `mutation/delete.ts` (~12 lines)
```typescript
export async function deleteRow(tableId: string, rowId: string)
```

### `mutation/index.ts` (~4 lines)
```typescript
export * from "./insert";
export * from "./update";
export * from "./delete";
```

## File Impact Analysis

| Path | Status | Purpose | Lines | Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| `app/api/records/services/mutation.ts` | **Delete** | Current monolithic file | 239 | - |
| `app/api/records/services/mutation/utils/types.ts` | **New** | Type mapping utility | ~24 | `nodejs-polars` |
| `app/api/records/services/mutation/utils/alignment.ts` | **New** | Schema alignment utilities | ~57 | `nodejs-polars`, `./types`, `../../io` |
| `app/api/records/services/mutation/utils/validation.ts` | **New** | Validation utility | ~41 | `zod`, `../../io` |
| `app/api/records/services/mutation/utils/index.ts` | **New** | Utils barrel export | ~4 | `./types`, `./alignment`, `./validation` |
| `app/api/records/services/mutation/insert.ts` | **New** | Insert row operation | ~55 | `./utils/*`, `../../io` |
| `app/api/records/services/mutation/update.ts` | **New** | Update row operation | ~42 | `./utils/alignment`, `../../io` |
| `app/api/records/services/mutation/delete.ts` | **New** | Delete row operation | ~12 | `../../io` |
| `app/api/records/services/mutation/index.ts` | **New** | Mutations barrel export | ~4 | `./insert`, `./update`, `./delete` |
| `app/api/records/services/index.ts` | **No Change** | Still exports from `./mutation` | - | No change needed |

## Migration Impact

**Files to Update:**
1. `services/index.ts` - **No change needed** - Still exports `export * from "./mutation"` (barrel export maintains API)
2. All API routes using mutations - **No changes needed** - Barrel export maintains same API
3. Delete `services/mutation.ts` - Replaced by folder structure

**Benefits:**
- ✅ No breaking changes to external API
- ✅ Better code organization with maximum granularity
- ✅ Easier to maintain and test individual utilities
- ✅ Clear separation of concerns (utils vs operations)
- ✅ Each file has single responsibility

## Alternative: Keep Current Structure

**When to keep current structure:**
- If file stays under ~300 lines
- If operations are tightly coupled
- If team prefers fewer files

**Current file is 239 lines** - Getting close to the threshold where decomposition makes sense, but not critical yet.

## Decision Factors

**Decompose if:**
- ✅ File is > 200 lines (currently 239)
- ✅ Clear logical groupings exist (✅ we have this)
- ✅ Utilities are reusable (✅ alignment could be used elsewhere)
- ✅ Team wants better organization (user is asking about it)

**Keep as-is if:**
- File is < 200 lines
- Operations are tightly coupled
- Team prefers fewer files

## Recommendation

**Yes, decompose into fully decomposed structure with utils subfolder.** The file is getting large, has clear logical groupings, and decomposing utilities into separate files provides maximum granularity and maintainability. This will improve code organization without breaking any existing code.


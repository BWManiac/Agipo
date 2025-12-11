# Schema Evolution Fix: Acceptance Criteria & Impact Analysis

## Problem Statement

When a user adds a new column to a table that already has existing rows, the DataFrame stored in `records.json` doesn't include the new column. When attempting to insert a new row that includes the new column, Polars `vstack` fails because the schemas don't match.

**Current Behavior:**
1. User creates table with columns: `id`, `_created`, `_updated`, `name`
2. User adds 3 rows
3. User adds new column `status` to schema
4. User tries to add new row with `{ name: "Test", status: "active" }`
5. ❌ Error: "Data structure mismatch. Schema evolution required."

**Expected Behavior:**
- New rows can be inserted after schema changes
- Existing rows automatically get `null` values for new columns
- All operations (insert, update, query) work seamlessly after schema evolution

---

## Acceptance Criteria

### AC1: Insert Row After Column Addition
**Given:** A table with existing rows and a schema that was recently extended with a new column  
**When:** A user inserts a new row that includes the new column  
**Then:** 
- The row is successfully inserted
- Existing rows in the DataFrame have `null` values for the new column
- The new row has the provided value for the new column
- No errors are thrown

**Test Cases:**
- [ ] Insert row after adding a required column (should fail validation, not schema mismatch)
- [ ] Insert row after adding an optional column
- [ ] Insert row after adding multiple columns
- [ ] Insert row when DataFrame is empty (should work as before)

### AC2: Schema Alignment on Insert
**Given:** A DataFrame with columns `[id, _created, _updated, name]` and a schema with columns `[id, _created, _updated, name, status]`  
**When:** `insertRow` is called with `{ name: "Test", status: "active" }`  
**Then:**
- The existing DataFrame is aligned to include the `status` column (with `null` for existing rows)
- The new row DataFrame includes all columns from the schema
- Both DataFrames have the same column order before `vstack`
- `vstack` succeeds without errors

**Test Cases:**
- [ ] Schema has more columns than DataFrame → DataFrame gets new columns with `null`
- [ ] DataFrame has more columns than schema → Should not happen, but handle gracefully
- [ ] Column order matches schema order
- [ ] System columns (`id`, `_created`, `_updated`) are always present and in correct order

### AC3: Query After Column Addition
**Given:** A table with existing rows where a new column was added  
**When:** A user queries the table  
**Then:**
- All rows are returned
- Existing rows include the new column with `null` value
- New rows include the new column with their actual values
- No errors are thrown

**Test Cases:**
- [ ] Query all rows after column addition
- [ ] Filter by new column (should work with null values)
- [ ] Sort by new column (nulls should sort correctly)

### AC4: Update Row After Column Addition
**Given:** A table with existing rows where a new column was added  
**When:** A user updates an existing row to set the new column value  
**Then:**
- The row is successfully updated
- The new column value is saved
- Other columns remain unchanged
- No errors are thrown

**Test Cases:**
- [ ] Update existing row to set new column value
- [ ] Update existing row to set new column to `null`
- [ ] Update existing row without touching new column (should remain `null`)

### AC5: Backward Compatibility
**Given:** A table created before this fix  
**When:** Any operation is performed  
**Then:**
- All existing functionality continues to work
- No breaking changes to API contracts
- Performance impact is minimal (<10ms for typical tables)

**Test Cases:**
- [ ] Insert row in table with no schema changes (existing behavior)
- [ ] Insert row in empty table (existing behavior)
- [ ] All existing API endpoints return same response format

### AC6: Edge Cases
**Given:** Various edge case scenarios  
**When:** Operations are performed  
**Then:** System handles gracefully without errors

**Test Cases:**
- [ ] Add column, then immediately insert row (no existing rows)
- [ ] Add multiple columns in sequence, then insert row
- [ ] Insert row with only system columns (no custom columns)
- [ ] Insert row with all columns from schema
- [ ] Insert row with subset of columns (optional columns)

---

## File Impact Analysis

### Files to Modify

#### 1. `app/api/records/services/mutation.ts`
**Status:** ⚠️ **Major Changes Required**

**Current State:**
- `insertRow` function (lines 48-89) has a try-catch that throws on schema mismatch
- No schema alignment logic exists
- `updateRow` function (lines 91-121) converts to records, which might handle mismatches, but should be verified

**Changes Required:**
1. **Add schema alignment helper function** (new function)
   - Takes: existing DataFrame, schema, new row data
   - Returns: aligned existing DataFrame and aligned new row DataFrame
   - Logic:
     - Get all column IDs from schema (including system columns)
     - For existing DF: Add missing columns with `null` values using `withColumn`
     - For new row DF: Ensure all schema columns are present (missing ones get `null`)
     - Ensure same column order (use `select` with ordered column list)
     - Return both aligned DataFrames

2. **Modify `insertRow` function** (lines 64-84)
   - Replace try-catch with schema alignment call
   - Remove error throwing for schema mismatch
   - Use aligned DataFrames for `vstack`
   - Ensure column order matches schema order

3. **Verify `updateRow` function** (lines 91-121)
   - Current implementation converts to records, then recreates DataFrame
   - This should handle schema mismatches, but we should ensure it aligns to current schema
   - May need to add schema alignment here too

**Why:**
- This is the core function that fails on schema mismatch
- Needs to align schemas before attempting `vstack`
- Must ensure data integrity (existing rows get nulls for new columns)

**Risk Level:** Medium
- Core mutation logic
- Must preserve data integrity
- Performance impact needs to be minimal

---

#### 2. `app/api/records/services/io.ts` (Optional Enhancement)
**Status:** 💡 **Optional - Future Enhancement**

**Current State:**
- `getDataFrame` reads JSON and returns DataFrame as-is
- No schema alignment on read

**Potential Enhancement:**
- Add optional parameter to `getDataFrame` to align to schema
- Could proactively align on read, but adds overhead
- Better to align on write (in mutation.ts)

**Why Not Now:**
- Adds complexity
- Performance overhead on every read
- Alignment on write is sufficient

**Future Consideration:**
- If we add column deletion, we'd need alignment on read
- For now, alignment on write is the right approach

---

#### 3. `app/api/records/services/schema.ts` (No Changes)
**Status:** ✅ **No Changes Required**

**Current State:**
- `addColumn` updates schema.json
- Doesn't touch DataFrame

**Why No Changes:**
- Schema management is correct
- DataFrame alignment happens at write time (insert/update)
- Separation of concerns: schema.ts manages schema, mutation.ts manages data

---

### Files That May Need Testing Updates

#### 4. Test Files (If They Exist)
**Status:** 🔍 **To Be Determined**

**Potential Impact:**
- Any tests for `insertRow` need to cover schema evolution scenarios
- Integration tests should verify end-to-end flow

---

### Dependencies & Side Effects

#### Polars API Usage
**Current:**
- `df.vstack(newRowDf)` - requires matching schemas
- `df.toRecords()` - converts to JSON objects
- `pl.DataFrame([object])` - creates DataFrame from object

**New:**
- `df.withColumn(pl.lit(null).alias(columnName))` - adds column with null values
- `df.select([...columns])` - reorders columns
- `df.columns` - gets column names

**Why:**
- Need to add missing columns to existing DataFrame
- Need to ensure column order matches schema
- Need to check which columns exist

---

### Data Flow Impact

#### Before Fix:
```
1. User adds column → schema.json updated
2. User inserts row → insertRow() called
3. getDataFrame() → returns DF without new column
4. newRowDf created → includes new column
5. vstack() → ❌ FAILS (schema mismatch)
```

#### After Fix:
```
1. User adds column → schema.json updated
2. User inserts row → insertRow() called
3. getDataFrame() → returns DF without new column
4. Schema alignment:
   a. Get all columns from schema
   b. Add missing columns to existing DF (with null)
   c. Ensure new row DF has all columns
   d. Align column order
5. vstack() → ✅ SUCCEEDS
6. commitDataFrame() → saves aligned DataFrame
```

---

### Performance Considerations

**Current Performance:**
- `insertRow`: ~5-10ms for typical table (<1000 rows)
- `vstack`: ~1-2ms

**After Fix:**
- Schema alignment: ~2-5ms (adds columns, reorders)
- Total: ~7-15ms (acceptable for MVP scale)

**Optimization Opportunities:**
- Cache column list from schema
- Only align if schemas actually differ
- Use lazy evaluation where possible

---

### Error Handling

**Current:**
- Throws generic error: "Data structure mismatch. Schema evolution required."

**After Fix:**
- No error for schema mismatch (handled automatically)
- Still throws errors for:
  - Table not found
  - Validation failures (invalid data types)
  - File system errors

---

### Testing Strategy

**Unit Tests Needed:**
1. `alignDataFramesToSchema` helper function
   - Test with various schema/DataFrame combinations
   - Test column ordering
   - Test null value insertion

2. `insertRow` with schema evolution
   - Test all acceptance criteria scenarios
   - Test edge cases

**Integration Tests Needed:**
1. End-to-end: Add column → Insert row → Query → Verify
2. Multiple column additions in sequence
3. Large tables (1000+ rows) to verify performance

---

## Implementation Plan

### Phase 1: Core Fix
1. Create `alignDataFramesToSchema` helper function
2. Update `insertRow` to use alignment
3. Test with basic scenarios

### Phase 2: Verification
1. Verify `updateRow` handles schema evolution correctly
2. Test query operations after schema changes
3. Performance testing

### Phase 3: Edge Cases
1. Handle all edge cases from AC6
2. Add error handling for unexpected scenarios
3. Documentation updates

---

## Success Metrics

- ✅ All acceptance criteria pass
- ✅ No breaking changes to existing functionality
- ✅ Performance impact < 10ms per operation
- ✅ Zero data loss or corruption
- ✅ All existing tests pass


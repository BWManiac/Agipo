# Diary Entry 13: The Records Domain & Polars Integration

**Date:** 2025-11-30  
**Task:** N/A  
**Status:** ✅ Complete

---

## 1. Context

We had **Agents** (the workforce) and **Tools** (the capabilities), but we lacked **Memory**. Agents were stateless. They could chat, execute a tool, and then forget everything. To build complex, long-running agents (like a "LinkedIn Manager"), we needed a persistent layer that was:

1. **Structured:** Not just a vector DB blob, but actual tables with strict schemas
2. **Shared:** Accessible by Users (UI) and Agents (Runtime) simultaneously
3. **Inspectable:** Git-friendly JSON files, consistent with our "Files as Source of Truth" philosophy

We introduced the **Records Domain** (`app/(pages)/records`) to solve this.

---

## 2. Implementation Summary

### Files Created/Modified

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `_tables/records/` | Create | Root storage for all table packages | - |
| `app/api/records/services/io.ts` | Create | File system access (Polars read/write) | ~80 |
| `app/api/records/services/schema.ts` | Create | Schema validation (Zod) & column addition | ~60 |
| `app/api/records/services/query.ts` | Create | Read-only operations via Polars | ~150 |
| `app/api/records/services/mutation.ts` | Create | Write operations (insert/update) | ~100 |
| `app/api/records/services/catalog.ts` | Create | Directory scanning to list tables | ~60 |
| `app/api/records/list/route.ts` | Create | GET Catalog list | ~40 |
| `app/api/records/create/route.ts` | Create | POST Create new table | ~60 |
| `app/api/records/[tableId]/schema/route.ts` | Create | GET schema, PATCH add column | ~50 |
| `app/api/records/[tableId]/rows/query/route.ts` | Create | POST Polars-powered search/filter | ~100 |
| `app/api/records/[tableId]/rows/route.ts` | Create | POST Add new row | ~80 |
| `app/api/records/[tableId]/rows/[rowId]/route.ts` | Create | PATCH Update row, DELETE row | ~120 |
| `app/(pages)/records/page.tsx` | Create | Catalog View (Grid of Cards) + Create Table Dialog | ~150 |
| `app/(pages)/records/[tableId]/page.tsx` | Create | Grid View wrapper + Header + Settings | ~200 |
| `app/(pages)/records/components/RecordsGrid.tsx` | Create | Main TanStack Table component | ~330 |
| `app/(pages)/records/hooks/useRecords.ts` | Create | React Query hooks for all API interactions | ~200 |
| `next.config.ts` | Modify | Added `nodejs-polars` to `serverExternalPackages` | ~5 |

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage Engine | Polars | Brings "Dataframe" power to Node.js, Rust speeds |
| Colocation Strategy | Package-based (`_tables/records/[tableId]/`) | Treats data like a "Document" - copy folder = copy data + definition |
| Service Layer | Granular services (io, schema, query, mutation) | Single responsibility, easier to maintain |
| Frontend State | TanStack Query + TanStack Table | "Excel-like" feel with optimistic updates |
| File Format | Pretty-printed JSON | Git-friendly, human-readable, prioritizes inspectability |

---

## 4. Technical Deep Dive

### The Storage Engine: `nodejs-polars`

**Why Polars?** It brings "Dataframe" power to Node.js. Allows complex queries (filtering, sorting, aggregations) at Rust speeds, even on simple JSON files.

**The Trade-off:** Introduces a native binary dependency (`.node`). This led to significant build challenges.

### Colocation Strategy

We moved away from flat `_tables/records/` folder to package-based structure:
```
_tables/records/
  posts/
    schema.json   <-- The Contract (Zod)
    records.json  <-- The Database (Polars source)
```

**Reasoning:** This treats data like a "Document." You can copy the `posts/` folder to another machine, and it carries both its data and its definition.

### Service Layer Architecture

**`io.ts`:** The only file allowed to touch `fs`. Handles Polars read/write. Uses `JSON.stringify` with indentation for writes to ensure data remains human-readable (Git-friendly).

**`schema.ts`:** Manages Zod schemas and column evolution.

**`query.ts`:** Read-only operations (filtering/sorting).

**`mutation.ts`:** Write operations (insert/update). Creates a new DataFrame for every write (Immutability).

### Frontend State: "Optimistic Mirroring"

**Pattern:**
1. User types in cell
2. UI updates instantly (via local state)
3. Background mutation fires to API
4. If API fails, UI reverts

---

## 5. Lessons Learned

- **Polars is powerful but complex:** Native binary dependency requires careful build configuration
- **Package-based storage works:** Colocation of schema and data simplifies management
- **Service layer separation:** Each service has single responsibility
- **Optimistic updates improve UX:** Instant feedback feels responsive
- **Pretty-printed JSON:** Worth the performance trade-off for inspectability

---

## 6. Next Steps

- [ ] Add more query capabilities (aggregations, joins)
- [ ] Implement column deletion
- [ ] Add table deletion
- [ ] Performance optimization for large tables

---

## References

- **Related Diary:** `12-RefactoringAndDomainDomains.md` - Domain refactoring
- **Product Vision:** `_docs/Product/Features/02-Shared-Memory-Records.md`

---

**Last Updated:** 2025-11-30

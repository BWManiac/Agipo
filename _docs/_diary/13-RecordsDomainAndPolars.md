# Diary Entry 13: The Records Domain & Polars Integration

**Date:** November 30, 2025
**Topic:** Shared Memory, Data-as-Infrastructure, Polars, and the "Records" Domain

---

## 1. File Impact Analysis

### Backend (Infrastructure & Logic)
| Path | Status | Purpose |
| :--- | :--- | :--- |
| `_tables/data/` | **New** | Root storage for all table packages (`[tableId]/records.json`). |
| `app/api/records/services/io.ts` | **New** | File system access (Polars read/write, schema read/write). |
| `app/api/records/services/schema.ts` | **New** | Schema validation (Zod) & column addition logic. |
| `app/api/records/services/query.ts` | **New** | Read-only operations (filtering, sorting, pagination). |
| `app/api/records/services/mutation.ts` | **New** | Write operations (insert/update with validation). |
| `app/api/records/services/catalog.ts` | **New** | Directory scanning to list available tables. |
| `next.config.ts` | **Modified** | Added `nodejs-polars` to `serverExternalPackages` to fix binary bundling. |

### API Routes (Interface)
| Path | Status | Purpose |
| :--- | :--- | :--- |
| `app/api/records/list/route.ts` | **New** | `GET` Catalog list. |
| `app/api/records/create/route.ts` | **New** | `POST` Create new table package. |
| `app/api/records/[tableId]/schema/route.ts` | **New** | `GET` schema, `PATCH` add column. |
| `app/api/records/[tableId]/rows/query/route.ts` | **New** | `POST` Polars-powered search/filter. |
| `app/api/records/[tableId]/rows/route.ts` | **New** | `POST` Add new row. |
| `app/api/records/[tableId]/rows/[rowId]/route.ts` | **New** | `PATCH` Update row, `DELETE` row. |

### Frontend (Experience)
| Path | Status | Purpose |
| :--- | :--- | :--- |
| `app/(pages)/records/page.tsx` | **New** | Catalog View (Grid of Cards). |
| `app/(pages)/records/[tableId]/page.tsx` | **New** | Grid View wrapper. |
| `app/(pages)/records/components/RecordsGrid.tsx` | **New** | Main TanStack Table component with inline editing. |
| `app/(pages)/records/hooks/useRecords.ts` | **New** | React Query hooks for all API interactions. |
| `app/(pages)/home/components/HeroSection.tsx` | **Modified** | Added "Manage Records" button. |
| `components/react-query-provider.tsx` | **New** | Global provider for TanStack Query. |

---

## 2. Context: The Missing Piece

We had **Agents** (the workforce) and **Tools** (the capabilities), but we lacked **Memory**.
Agents were stateless. They could chat, execute a tool, and then forget everything. To build complex, long-running agents (like a "LinkedIn Manager"), we needed a persistent layer that was:
1.  **Structured:** Not just a vector DB blob, but actual tables with strict schemas.
2.  **Shared:** Accessible by Users (UI) and Agents (Runtime) simultaneously.
3.  **Inspectable:** Git-friendly JSON files, consistent with our "Files as Source of Truth" philosophy.

We introduced the **Records Domain** (`app/(pages)/records`) to solve this.

---

## 3. Architectural Decisions

### A. The Storage Engine: `nodejs-polars`
We chose **Polars** over SQLite or raw JSON arrays.
*   **Why Polars?** It brings "Dataframe" power to Node.js. It allows us to perform complex queries (filtering, sorting, aggregations) at Rust speeds, even on simple JSON files.
*   **The Trade-off:** It introduces a native binary dependency (`.node`). This led to significant build challenges (see Section 4).

### B. Colocation Strategy (`_tables/data/[tableId]/`)
We moved away from a flat `_tables/data/` folder to a package-based structure:
```text
_tables/data/
  posts/
    schema.json   <-- The Contract (Zod)
    records.json  <-- The Database (Polars)
```
*   **Reasoning:** This treats data like a "Document." You can copy the `posts/` folder to another machine, and it carries both its data and its definition. It aligns with how we handle Tools (`tool.js` + `workflow.json`).

### C. Service Layer Architecture
We split the backend logic into Granular Services (`app/api/records/services/`):
1.  **`io.ts`**: The only file allowed to touch `fs`. Handles the Polars read/write. We specifically chose to use `JSON.stringify` with indentation for writes to ensure the data remains human-readable (Git-friendly), prioritizing "Inspectability" over raw write speed for our scale (<100k rows).
2.  **`schema.ts`**: Manages Zod schemas and column evolution.
3.  **`query.ts`**: Read-only operations (filtering/sorting).
4.  **`mutation.ts`**: Write operations (insert/update).
    *   *Design Choice:* We create a new DataFrame for every write (Immutability). This is safer than in-place mutation.

### D. Frontend State: "Optimistic Mirroring"
We chose **TanStack Query (React Query)** + **TanStack Table**.
*   **Why?** We wanted an "Excel-like" feel. Waiting for a server roundtrip on every cell edit feels sluggish.
*   **Pattern:**
    1.  User types in cell.
    2.  UI updates instantly (via local state).
    3.  Background mutation fires to API.
    4.  If API fails, UI reverts.

---

## 4. Deep Dive: The Native Binary Challenge

This was the hardest technical hurdle of the sprint.

### The Problem
Next.js (and its bundlers, Webpack/TurboPack) assumes everything is JavaScript. It tries to read every imported file, bundle them together, and ship them.
`nodejs-polars`, however, relies on a **Native Binary** (`.node` file). This is compiled Rust code, specific to your Operating System (e.g., `nodejs-polars-darwin-arm64` for Apple Silicon).

When Next.js tried to "bundle" this binary, it failed because:
1.  It can't read binary files as code.
2.  It doesn't know which binary to pick (Linux? Mac? Windows?).

### The Solution: `serverExternalPackages`
We added this to `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ["nodejs-polars"], 
  // ...
};
```

**What this does:**
It tells Next.js: **"Do not bundle this."**
Instead of trying to read the code, Next.js copies the entire `node_modules/nodejs-polars` folder (including the binary) into the final server build. When the app runs, Node.js loads the module from disk at runtime, allowing it to find the correct binary for the current OS.

### Deployment Implications (Vercel)
*   **Is this safe?** Yes. This is the standard, documented way to handle native modules (like `prisma` or `sqlite`) in Serverless environments.
*   **Cross-Platform:** When we deploy to Vercel, the build environment (Linux) will install the Linux binary (`nodejs-polars-linux-x64`). Because we excluded it from the bundle, the running function will correctly load that Linux binary.
*   **Browser Limits:** This code **cannot** run in the browser (Client Component). It must stay in API Routes or Server Actions. If we ever need Polars in the browser, we must switch to `polars-wasm`.

---

## 5. What's Next? (Phase 3)

Now that the **Records Domain** is live and the User can manage data, we must connect the **Agents**.
1.  **Runtime Tools:** Inject `sys_table_read` and `sys_table_write` into the Agent Runtime.
2.  **Prompt Injection:** When an agent wakes up, it should see: *"You have access to table 'posts' with columns [content, date, status]."*
3.  **Workflow Node:** A visual `TableNode` in the tool editor to drag-and-drop data operations.

We have effectively turned Agipo into a **Headless CMS for Agents**.
